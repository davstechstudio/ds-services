/* ============================================================
   SKILLCONNECT GH — Shared Navigation + Page Transitions
   1. Renders the same header nav on every page with automatic
      active-state detection (URL-based, survives reloads/breadcrumbs).
   2. App-like page transitions: fade-in on load, fade-out on
      internal navigation. Active link + scroll memory persisted
      via sessionStorage keyed by URL.
   ============================================================ */

(function () {
    // Single source of truth for nav items + active-state logic: header.js
    const ITEMS = SCHeader.NAV_ITEMS;

    const FADE_MS = 260;

    // Capture the URL at script-load time: page scripts may rewrite the URL
    // (e.g. the directory strips ?focus= after render) before DOMContentLoaded fires.
    const LOAD_URL = location.href;

    const currentId = SCHeader.currentId;

    function render() {
        document.querySelectorAll('nav.site-nav').forEach(nav => {
            const active = nav.dataset.active || currentId();
            nav.innerHTML = ITEMS.map(i =>
                '<a href="' + i.href + '"' + (i.id === active ? ' class="active"' : '') + '>' + i.label + '</a>'
            ).join('');
        });
    }

    /* ---------------- Page transitions ---------------- */
    const TRANSITION_KEY = 'sc_nav_state';

    function readNavState() {
        try { return JSON.parse(sessionStorage.getItem(TRANSITION_KEY) || '{}'); } catch (e) { return {}; }
    }

    function writeNavState(st) {
        try { sessionStorage.setItem(TRANSITION_KEY, JSON.stringify(st)); } catch (e) {}
    }

    function injectTransitionCss() {
        if (document.getElementById('scTransStyle')) return;
        const st = document.createElement('style');
        st.id = 'scTransStyle';
        st.textContent = [
            /* fade the whole page in on load */
            'body.sc-page { opacity: 0; transition: opacity ' + FADE_MS + 'ms ease; }',
            'body.sc-page.sc-ready { opacity: 1; }',
            'body.sc-page.sc-leaving { opacity: 0; }',
            /* respect reduced-motion users */
            '@media (prefers-reduced-motion: reduce) {',
            '  body.sc-page { opacity: 1 !important; transition: none !important; }',
            '}'
        ].join('\n');
        document.head.appendChild(st);
    }

    function initTransitions() {
        // Never transition admin/review consoles (tool pages feel better instant)
        const page = location.pathname.split('/').pop() || '';
        if (/^(admin|review)\.html$/.test(page)) return;

        injectTransitionCss();

        // 1. Fade in
        document.body.classList.add('sc-page');
        // double rAF so the initial style commits before the transition starts
        requestAnimationFrame(() => requestAnimationFrame(() => {
            document.body.classList.add('sc-ready');
        }));

        // 2. Restore scroll position for back/forward navigations to the same URL
        const st = readNavState();
        if (st.scroll && st.url === LOAD_URL) {
            setTimeout(() => window.scrollTo(0, st.scroll), 60);
        }
        // clear any stale "leaving" flag once we're visibly back
        writeNavState({ url: LOAD_URL, scroll: st.url === LOAD_URL ? (st.scroll || 0) : 0 });

        // 3. Fade out on internal navigation, remembering scroll per URL
        document.addEventListener('click', e => {
            const a = e.target.closest('a[href]');
            if (!a) return;
            const href = a.getAttribute('href') || '';
            if (!/\.html(\?|#|$)/.test(href)) return;            // only internal page links
            if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
            const url = new URL(a.href, location.href);
            if (url.origin !== location.origin) return;

            e.preventDefault();
            writeNavState({ url: url.href, scroll: 0 });         // fresh page starts at top
            document.body.classList.add('sc-leaving');
            setTimeout(() => { location.href = url.href; }, FADE_MS);
        }, true);

        // 4. Remember scroll while browsing (for back/forward)
        let scrollTimer = null;
        window.addEventListener('scroll', () => {
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => writeNavState({ url: LOAD_URL, scroll: window.scrollY }), 200);
        }, { passive: true });

        // 5. pageshow from the back/forward cache — re-fade in instantly
        window.addEventListener('pageshow', ev => {
            if (ev.persisted) {
                document.body.classList.remove('sc-leaving');
                document.body.classList.add('sc-page');
                requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('sc-ready')));
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { render(); initTransitions(); });
    } else {
        render();
        initTransitions();
    }
    window.SCNav = { render, ITEMS };
})();
