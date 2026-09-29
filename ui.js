/* ============================================================
   SKILLCONNECT GH — UI Kit
   In-house dialogs (alert / confirm / prompt) + toasts.
   Design-system styled, mobile-first bottom sheets.
   Usage:
     UI.alert('Saved!', { title: 'Profile' })
     UI.confirm('Proceed?').then(ok => { if (ok) ... })
     UI.prompt('Your rate:', '250').then(v => { if (v !== null) ... })
     UI.toast('Copied!', 'success')
   ============================================================ */

(function () {
    const CSS = `
    .ui-dlg-overlay {
        position: fixed; inset: 0; z-index: 5000;
        background: rgba(0,0,0,.8); backdrop-filter: blur(3px);
        display: flex; align-items: flex-end; justify-content: center;
        padding: 0; opacity: 0; transition: opacity .2s ease;
    }
    .ui-dlg-overlay.center { align-items: center; padding: 20px; }
    .ui-dlg-overlay.show { opacity: 1; }
    .ui-dlg {
        width: min(440px, 100%); background: var(--card-black, #1a1a1a);
        border: 2px solid var(--primary-yellow, #FFCC00); border-bottom: none;
        border-radius: 16px 16px 0 0; padding: 22px 20px 20px;
        transform: translateY(100%); transition: transform .25s ease;
        max-height: 86vh; overflow-y: auto;
        font-family: inherit;
    }
    .ui-dlg-overlay.center .ui-dlg {
        border-bottom: 2px solid var(--primary-yellow, #FFCC00);
        border-radius: 12px; transform: translateY(20px) scale(.97);
    }
    .ui-dlg-overlay.show .ui-dlg { transform: translateY(0) scale(1); }
    .ui-dlg-icon {
        width: 46px; height: 46px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center; font-size: 1.15rem;
        margin: 0 auto 12px; background: rgba(255,204,0,.12); color: var(--primary-yellow, #FFCC00);
    }
    .ui-dlg-icon.danger { background: var(--danger-tint, rgba(231,76,60,.12)); color: var(--danger-red, #e74c3c); }
    .ui-dlg-icon.success { background: var(--success-tint, rgba(37,211,102,.12)); color: var(--success-green, #25D366); }
    .ui-dlg-title {
        text-align: center; color: var(--text-light, #fff);
        font-weight: 900; font-size: 1rem; text-transform: uppercase;
        letter-spacing: .3px; margin: 0 0 8px;
    }
    .ui-dlg-msg {
        text-align: center; color: var(--text-muted, #aaa);
        font-size: .85rem; line-height: 1.55; margin: 0 0 18px;
        white-space: pre-line;
    }
    .ui-dlg-input {
        width: 100%; margin-bottom: 16px; padding: 11px 12px;
        background: var(--bg-strong, #000); border: 1px solid var(--border, #444); border-radius: 8px;
        color: var(--text-light, #fff); font-size: .95rem;
    }
    .ui-dlg-input:focus { outline: none; border-color: var(--primary-yellow, #FFCC00); }
    .ui-dlg-btns { display: flex; gap: 10px; }
    .ui-dlg-btns.single .ui-btn { flex: 1; }
    .ui-btn {
        flex: 1; padding: 12px; border-radius: 8px; border: none;
        font-weight: 800; font-size: .82rem; text-transform: uppercase;
        cursor: pointer; transition: .2s; font-family: inherit;
    }
    .ui-btn-primary { background: var(--primary-yellow, #FFCC00); color: var(--dark-black, #111); }
    .ui-btn-primary:hover { filter: brightness(1.08); }
    .ui-btn-ghost { background: transparent; border: 1px solid var(--border, #444); color: var(--text-muted, #aaa); }
    .ui-btn-ghost:hover { border-color: var(--primary-yellow, #FFCC00); color: var(--primary-yellow, #FFCC00); }
    .ui-btn-danger { background: var(--danger-red, #e74c3c); color: #fff; }
    .ui-btn-danger:hover { filter: brightness(1.1); }
    .ui-btn-success { background: var(--success-green, #25D366); color: #fff; }

    /* Action sheet rows */
    .ui-dlg-sheet-list { display: flex; flex-direction: column; gap: 10px; margin: 0 0 16px; }
    .ui-sheet-row {
        display: flex; align-items: center; gap: 12px; width: 100%;
        background: var(--bg-strong, #000); border: 1px solid var(--card-black, #333); border-radius: 10px;
        padding: 13px 14px; cursor: pointer; transition: .18s;
        color: var(--text-light, #fff); font-family: inherit; text-align: left;
    }
    .ui-sheet-row:hover { border-color: var(--primary-yellow, #FFCC00); transform: translateY(-1px); }
    .ui-sheet-row .ic {
        width: 38px; height: 38px; flex: 0 0 38px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; font-size: .95rem;
        background: var(--yellow-tint-012, rgba(255,204,0,.10)); color: var(--primary-yellow, #FFCC00);
    }
    .ui-sheet-row.danger .ic { background: var(--danger-tint, rgba(231,76,60,.12)); color: var(--danger-red, #e74c3c); }
    .ui-sheet-row .t { flex: 1; }
    .ui-sheet-row .t b { display: block; font-size: .86rem; font-weight: 800; color: var(--text-light, #fff); }
    .ui-sheet-row .t small { display: block; font-size: .7rem; color: var(--text-muted, #999); margin-top: 2px; line-height: 1.4; }
    .ui-sheet-row .go { color: #777; font-size: .8rem; }

    /* Toasts */
    .ui-toast-wrap {
        position: fixed; left: 50%; transform: translateX(-50%);
        bottom: 92px; z-index: 6000; display: flex; flex-direction: column;
        gap: 8px; align-items: center; pointer-events: none; width: min(420px, calc(100% - 32px));
    }
    .ui-toast {
        display: flex; align-items: center; gap: 10px;
        background: var(--bg-strong, #000); border: 1px solid var(--primary-yellow, #FFCC00);
        border-radius: 10px; padding: 11px 16px; font-size: .82rem; font-weight: 700;
        color: var(--text-light, #fff); box-shadow: 0 6px 24px rgba(0,0,0,.5);
        opacity: 0; transform: translateY(10px);
        transition: opacity .25s ease, transform .25s ease; max-width: 100%;
    }
    .ui-toast.show { opacity: 1; transform: translateY(0); }
    .ui-toast i { color: var(--primary-yellow, #FFCC00); }
    .ui-toast.success { border-color: var(--success-green, #25D366); } .ui-toast.success i { color: var(--success-green, #25D366); }
    .ui-toast.error { border-color: var(--danger-red, #e74c3c); } .ui-toast.error i { color: var(--danger-red, #e74c3c); }
    `;

    function inject() {
        if (document.getElementById('uiKitStyle')) return;
        const st = document.createElement('style');
        st.id = 'uiKitStyle';
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    function build({ icon, iconCls, title, msg, input, inputVal, placeholder, inputType, buttons, sheet }) {
        return new Promise(resolve => {
            inject();
            const overlay = document.createElement('div');
            overlay.className = 'ui-dlg-overlay';
            if (window.matchMedia('(min-width: 640px)').matches) overlay.classList.add('center');
            const small = window.matchMedia('(max-width: 480px)').matches;

            let inputHtml = '';
            if (input) {
                inputHtml = '<input class="ui-dlg-input" id="uiDlgInput" type="' + (inputType || 'text') + '" value="' + (inputVal || '') + '" placeholder="' + (placeholder || '') + '">';
            }

            const fa = n => n.indexOf('fa-') === 0 ? n : 'fa-' + n;   // tolerate names passed with or without the fa- prefix

            let sheetHtml = '';
            if (sheet && sheet.length) {
                sheetHtml = '<div class="ui-dlg-sheet-list">' + sheet.map(a =>
                    '<button type="button" class="ui-sheet-row' + (a.danger ? ' danger' : '') + '" data-v="' + a.value + '">' +
                    (a.icon ? '<span class="ic"><i class="fa-solid ' + fa(a.icon) + '"></i></span>' : '') +
                    '<span class="t"><b>' + a.label + '</b>' + (a.desc ? '<small>' + a.desc + '</small>' : '') + '</span>' +
                    '<span class="go"><i class="fa-solid fa-chevron-right"></i></span>' +
                    '</button>'
                ).join('') + '</div>';
            }

            const btnsHtml = buttons.map(b =>
                '<button class="ui-btn ' + b.cls + '" data-v="' + b.value + '">' + (b.icon ? '<i class="fa-solid ' + b.icon + '" style="margin-right:6px;"></i>' : '') + b.label + '</button>'
            ).join('');

            overlay.innerHTML =
                '<div class="ui-dlg" role="dialog" aria-modal="true">' +
                (icon ? '<div class="ui-dlg-icon ' + (iconCls || '') + '"><i class="fa-solid ' + fa(icon) + '"></i></div>' : '') +
                (title ? '<h3 class="ui-dlg-title">' + title + '</h3>' : '') +
                '<p class="ui-dlg-msg">' + msg + '</p>' +
                sheetHtml +
                inputHtml +
                '<div class="ui-dlg-btns' + (buttons.length === 1 ? ' single' : '') + '">' + btnsHtml + '</div>' +
                '</div>';

            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('show')));

            const inp = overlay.querySelector('#uiDlgInput');
            if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 250);

            function close(result) {
                overlay.classList.remove('show');
                setTimeout(() => { overlay.remove(); if (!document.querySelector('.ui-dlg-overlay')) document.body.style.overflow = ''; }, 220);
                document.removeEventListener('keydown', onKey);
                resolve(result);
            }

            overlay.addEventListener('click', e => {
                const row = e.target.closest('.ui-sheet-row');
                if (row) { close(row.dataset.v); return; }
                const btn = e.target.closest('.ui-btn');
                if (btn) {
                    const v = btn.dataset.v;
                    close(input ? (v === 'ok' ? inp.value : null) : (v === 'ok' ? true : v === 'danger-ok' ? true : false));
                    return;
                }
                if (e.target === overlay && buttons.some(b => b.value === 'cancel')) close(false);
            });

            if (inp) {
                inp.addEventListener('keydown', e => {
                    if (e.key === 'Enter') { e.preventDefault(); close(inp.value); }
                });
            }

            function onKey(e) {
                if (e.key === 'Escape' && buttons.some(b => b.value === 'cancel')) close(false);
            }
            document.addEventListener('keydown', onKey);
        });
    }

    const UI = {
        alert(msg, opts = {}) {
            return build({
                icon: opts.icon || 'circle-info',
                iconCls: opts.type === 'error' ? 'danger' : opts.type === 'success' ? 'success' : '',
                title: opts.title || '',
                msg: msg,
                buttons: [{ label: opts.okLabel || 'OK', value: 'ok', cls: opts.type === 'success' ? 'ui-btn-success' : 'ui-btn-primary' }]
            });
        },

        confirm(msg, opts = {}) {
            return build({
                icon: opts.icon || 'circle-question',
                iconCls: opts.danger ? 'danger' : '',
                title: opts.title || '',
                msg: msg,
                buttons: [
                    { label: opts.cancelLabel || 'Cancel', value: 'cancel', cls: 'ui-btn-ghost' },
                    { label: opts.okLabel || 'Confirm', value: 'ok', cls: opts.danger ? 'ui-btn-danger' : (opts.okGreen ? 'ui-btn-success' : 'ui-btn-primary') }
                ]
            }).then(v => v === true);
        },

        prompt(msg, defaultVal = '', opts = {}) {
            return build({
                icon: opts.icon || 'pen',
                title: opts.title || '',
                msg: msg,
                input: true,
                inputVal: defaultVal,
                placeholder: opts.placeholder || '',
                inputType: opts.inputType || 'text',
                buttons: [
                    { label: 'Cancel', value: 'cancel', cls: 'ui-btn-ghost' },
                    { label: opts.okLabel || 'Save', value: 'ok', cls: 'ui-btn-primary' }
                ]
            }).then(v => v === null ? null : v);
        },

        // Bottom sheet with tappable option rows (mobile action-sheet style).
        // actions: [{ value, label, desc, icon, danger }] — resolves with the chosen
        // action's value, or null when cancelled.
        actionSheet(msg, actions, opts = {}) {
            return build({
                icon: opts.icon || 'list-check',
                iconCls: opts.iconCls || '',
                title: opts.title || '',
                msg: msg,
                sheet: actions,
                buttons: [{ label: opts.cancelLabel || 'Cancel', value: 'cancel', cls: 'ui-btn-ghost' }]
            }).then(v => typeof v === 'string' ? v : null);
        },

        toast(msg, type = 'default', ms = 2600) {
            inject();
            let wrap = document.querySelector('.ui-toast-wrap');
            if (!wrap) {
                wrap = document.createElement('div');
                wrap.className = 'ui-toast-wrap';
                document.body.appendChild(wrap);
            }
            const t = document.createElement('div');
            t.className = 'ui-toast ' + type;
            const ic = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info';
            t.innerHTML = '<i class="fa-solid ' + ic + '"></i><span>' + msg + '</span>';
            wrap.appendChild(t);
            requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
            setTimeout(() => {
                t.classList.remove('show');
                setTimeout(() => t.remove(), 300);
            }, ms);
        }
    };

    window.UI = UI;
})();
