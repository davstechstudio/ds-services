/* ============================================================
   sc-pay.js — client seam for the real payment flow.

   Pages keep their existing UI; only the payment button handlers
   changed. Behavior follows the server's payment_gateway setting
   (read from the public /api/settings — no admin session needed):

     simulated ('' default) → run the legacy sandbox SC.* call
     paystack               → POST /api/payments/initiate, then
                              redirect to the hosted checkout; when
                              the customer comes back the page calls
                              SCPay.resume() to confirm + show result
     mtn_momo               → initiate a direct MoMo push, show the
                              "approve on your phone" flow and poll
                              /api/payments/verify until it settles

   Money amounts always come from the server (booking row / reg fee);
   this helper never sends one.
   ============================================================ */

'use strict';

window.SCPay = (function () {

    let modeCache = null, modeAt = 0;
    const PENDING_KEY = 'sc_pay_pending';

    async function gatewayMode() {
        /* Sandbox (localStorage) pages have no gateway — instant confirm. */
        if (!(typeof SC !== 'undefined' && SC.apiMode)) return 'simulated';
        if (modeCache && Date.now() - modeAt < 60000) return modeCache;
        try {
            const r = await fetch('/api/settings');
            const j = await r.json();
            const g = (j && j.settings && j.settings.payment_gateway) || '';
            modeCache = g ? String(g).toLowerCase() : 'simulated';
        } catch (e) {
            modeCache = 'simulated';   /* server unreachable — sandbox fallback */
        }
        modeAt = Date.now();
        return modeCache;
    }

    async function post(path, body) {
        const r = await fetch('/api/' + path, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body || {})
        });
        return r.json();
    }

    /* Poll verify until the intent settles or we give up (intent stays
       'pending' server-side — a later verify/revisit still confirms it). */
    async function pollVerify(ref, onTick, attempts) {
        const max = attempts || 25;                     /* ~90s at 3.5s */
        for (let i = 0; i < max; i++) {
            if (onTick) onTick(i, max);
            await new Promise(r => setTimeout(r, 3500));
            let j;
            try { j = await post('payments/verify', { ref: ref }); }
            catch (e) { continue; }
            if (j && j.ok) return { ok: true, result: j, alreadyDone: !!j.alreadyDone };
            if (j && j.pending) continue;               /* customer hasn't approved yet */
            return { ok: false, error: (j && j.error) || 'Payment did not go through.' };
        }
        return { ok: false, timeout: true, error: 'Still waiting for approval — you can come back to this page and it will confirm automatically.' };
    }

    /* Main entry: opts = { purpose:'escrow'|'reg_fee', refId, method,
       simulate: async () => legacy SC.* result, onTick }.
       Resolves to the legacy-shaped result when possible:
         { ok, txnRef?, booking?, redirected?, error?, timeout? } */
    async function pay(opts) {
        const mode = await gatewayMode();
        if (mode === 'simulated') {
            const r = await opts.simulate();
            return r || { ok: true };
        }
        const ini = await post('payments/initiate', { purpose: opts.purpose, refId: opts.refId, method: opts.method || 'momo' });
        if (!ini || !ini.ok) return { ok: false, error: (ini && ini.error) || 'Could not start the payment.' };

        if (mode === 'paystack' && ini.checkoutUrl) {
            try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ref: ini.intentRef, purpose: ini.purpose, at: Date.now() })); } catch (e) {}
            location.href = ini.checkoutUrl;            /* hosted checkout takes over */
            return { ok: true, redirected: true };
        }
        if (mode === 'mtn_momo') {
            const done = await pollVerify(ini.intentRef, opts.onTick);
            if (done.ok) {
                const r = done.result;
                return { ok: true, txnRef: ini.intentRef, booking: r.booking || null, txnId: r.txnId || null, intentRef: ini.intentRef };
            }
            return { ok: false, error: done.error, timeout: !!done.timeout, intentRef: ini.intentRef };
        }
        return { ok: false, error: 'Unknown gateway: ' + mode };
    }

    /* After returning from a hosted checkout: confirm whatever is pending.
       onDone receives { ok, result } — cleared either way. */
    async function resume(onDone) {
        let p = null;
        try { p = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); } catch (e) {}
        if (!p) return false;
        try { sessionStorage.removeItem(PENDING_KEY); } catch (e) {}
        try {
            const j = await post('payments/verify', { ref: p.ref });
            if (onDone) onDone({ ok: !!(j && j.ok), result: j });
        } catch (e) {
            if (onDone) onDone({ ok: false, result: { error: 'Could not reach the payment server — refresh to retry confirmation.' } });
        }
        return true;
    }

    return { gatewayMode, pay, resume, pollVerify };
})();
