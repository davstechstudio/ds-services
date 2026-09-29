/* ============================================================
   SKILLCONNECT GH — Shared Header Data & Builders (header.js)
   Single source of truth for the site chrome:
     - NAV_ITEMS (home / search / track / how / pricing / contact / register)
     - active-state detection (currentId, URL-based)
     - brand contact data: phone, WhatsApp link
     - headerAction(a) -> top-bar button markup for one action
     - drawerAction(a) -> matching mobile-drawer row for one action
     - logo() / actions() -> per-page overrides from window.SC_PARTIALS

   site-partials.js (header/footer/drawer rendering) and nav.js
   (nav rendering + page transitions) both consume this file, so
   the logo, contact actions and nav list can never drift apart.

   Per-page tweaks stay in window.SC_PARTIALS (set BEFORE this
   script loads):
     window.SC_PARTIALS = {
       logoIcon: 'fa-tower-broadcast',
       logoTag:  'Admin Console',
       actions:  [{ kind: 'tel' }, { kind: 'whatsapp', label: 'Escalate' },
                  { kind: 'link', href: 'x.html', label: 'X', icon: 'fa-yin-yang' }]
     };
   ============================================================ */

(function () {
    'use strict';

    var PHONE_DISPLAY = '024 421 1595';
    var PHONE_TEL = '+233244211595';
    var WA = 'https://wa.me/233244211595';

    var NAV_ITEMS = [
        { id: 'home', label: 'Home', href: 'index.html' },
        { id: 'search', label: 'Search', href: 'directory.html' },
        { id: 'track', label: 'Track', href: 'bookings.html' },
        { id: 'how', label: 'How It Works', href: 'how-it-works.html' },
        { id: 'pricing', label: 'Pricing', href: 'pricing.html' },
        { id: 'contact', label: 'Contact', href: 'contact.html' },
        { id: 'register', label: 'Register', href: 'register.html' }
    ];

    var DEFAULT_LOGO = { icon: 'fa-handshake', tag: 'Book Verified Event & Skilled Service Professionals' };
    var DEFAULT_ACTIONS = [{ kind: 'tel' }, { kind: 'whatsapp' }];

    // Capture the URL at script-load time: page scripts may rewrite the URL
    // (e.g. the directory strips ?focus= after render) before DOMContentLoaded.
    var LOAD_URL = location.href;

    function currentId() {
        var u = new URL(LOAD_URL);
        var page = u.pathname.split('/').pop() || 'index.html';
        if (page.startsWith('register')) return 'register';
        if (page.startsWith('bookings') || page.startsWith('track')) return 'track';
        if (page.startsWith('how-it-works')) return 'how';
        if (page.startsWith('pricing')) return 'pricing';
        if (page.startsWith('contact')) return 'contact';
        if (page.startsWith('directory')) return 'search';
        if (page.startsWith('index')) {
            return u.searchParams.has('focus') ? 'search' : 'home';
        }
        return '';
    }

    /* One top-bar action -> anchor markup (shared by every page's header).
       tel/whatsapp render EMPTY in the top bar: every page has the same
       contact links in the floating WhatsApp/call widgets, so the header
       duplicates were removed to declutter the bar (drawer rows in the
       mobile menu and the floating bar keep them). 'link' actions are
       navigation, not contact, and still render. */
    function headerAction(a) {
        if (a.kind === 'tel' || a.kind === 'whatsapp') return '';
        if (a.kind === 'link') {
            return '<a href="' + a.href + '" class="btn-call"><i class="fa-solid ' + (a.icon || 'arrow-up-right-from-square') + '"></i> ' + a.label + '</a>';
        }
        return '';
    }

    /* The same action as a drawer row (mobile menu) */
    function drawerAction(a) {
        if (a.kind === 'tel') {
            return '<a class="dr-act tel" href="tel:' + PHONE_TEL + '"><i class="fa-solid fa-phone"></i> ' + PHONE_DISPLAY + '</a>';
        }
        if (a.kind === 'whatsapp') {
            return '<a class="dr-act wa" href="' + WA + '" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> ' + (a.label || 'WhatsApp') + '</a>';
        }
        if (a.kind === 'link') {
            return '<a class="dr-act" href="' + a.href + '"><i class="fa-solid ' + (a.icon || 'arrow-up-right-from-square') + '"></i> ' + a.label + '</a>';
        }
        return '';
    }

    /* Resolved config (page overrides via SC_PARTIALS, defaults otherwise) */
    function logo() {
        var cfg = window.SC_PARTIALS || {};
        return { icon: cfg.logoIcon || DEFAULT_LOGO.icon, tag: cfg.logoTag || DEFAULT_LOGO.tag };
    }

    function actions() {
        var cfg = window.SC_PARTIALS || {};
        return cfg.actions || DEFAULT_ACTIONS;
    }

    window.SCHeader = {
        PHONE_DISPLAY: PHONE_DISPLAY,
        PHONE_TEL: PHONE_TEL,
        WA: WA,
        NAV_ITEMS: NAV_ITEMS,
        DEFAULT_LOGO: DEFAULT_LOGO,
        DEFAULT_ACTIONS: DEFAULT_ACTIONS,
        currentId: currentId,
        headerAction: headerAction,
        drawerAction: drawerAction,
        logo: logo,
        actions: actions
    };
})();
