/* ============================================================
   SKILLCONNECT GH — Shared Site Partials
   Renders the header (logo + nav + actions) and footer on every
   page so future menu/branding changes are a one-file edit.
   Usage in a page's <head> or before </body>:
     <script src="site-partials.js"></script>
   Page-specific tweaks via window.SC_PARTIALS (must be set BEFORE
   this script loads):
     window.SC_PARTIALS = {
       logoIcon: 'fa-user-plus',        // FA icon next to the logo
       logoTag: 'Professional Registration Portal',
       actions: [ { kind: 'whatsapp' } ],            // header action buttons
       footerLinks: [ ['track.html','Track'], ... ]  // custom footer nav
     };
   This file also renders the nav (from header.js's item list) and is a
   superset: it can replace nav.js when both would otherwise be loaded.
   ============================================================ */

(function () {
    const PHONE_DISPLAY = SCHeader.PHONE_DISPLAY;
    const PHONE_TEL = SCHeader.PHONE_TEL;
    const WA = SCHeader.WA;

    const NAV_ITEMS = SCHeader.NAV_ITEMS;

    const FOOTER_LINKS = [
        ['index.html', 'Home'],
        ['directory.html', 'Browse Pros'],
        ['how-it-works.html', 'How It Works'],
        ['pricing.html', 'Pricing'],
        ['contact.html', 'Contact'],
        ['register.html', 'Register as a Pro'],
        ['application.html', 'Application Status'],
        ['bookings.html', 'Track'],
        ['dashboard.html', 'Pro Dashboard'],
        ['admin.html', 'Admin'],
        ['ussd.html', 'SMS/USSD'],
        ['terms.html', 'Terms'],
        ['privacy.html', 'Privacy']
    ];

    const cfg = window.SC_PARTIALS || {};

    // ---- active-state detection (URL-based; logic shared via header.js) ----
    const currentId = SCHeader.currentId;

    // ---- header ----
    function headerHtml() {
        const active = cfg.activeId || currentId();
        const logoIcon = SCHeader.logo().icon;
        const logoTag = SCHeader.logo().tag;
        let actions = '';
        SCHeader.actions().forEach(a => {
            actions += SCHeader.headerAction(a) + '\n            ';
        });
        return '' +
            '<a href="index.html" class="logo-link">\n' +
            '        <div class="logo-container">\n' +
            '            <i class="fa-solid ' + logoIcon + ' logo-icon"></i>\n' +
            '            <div class="logo-text">\n' +
            '                <h1>SKILLCONNECT GH</h1>\n' +
            '                <p>' + logoTag + '</p>\n' +
            '            </div>\n' +
            '        </div>\n' +
            '    </a>\n' +
            '    <nav class="site-nav">' +
            NAV_ITEMS.map(i => '<a href="' + i.href + '"' + (i.id === active ? ' class="active"' : '') + '>' + i.label + '</a>').join('') +
            '</nav>\n' +
            '    <div class="header-actions">\n' +
            '        ' + actions.trim() + '\n' +
            '    </div>\n' +
            '    <button type="button" class="nav-burger" aria-label="Open menu" aria-controls="scMenuDrawer" aria-expanded="false" onclick="SCSite.toggleMenu()"><i class="fa-solid fa-bars"></i></button>';
    }

    // ---- footer ----
    function footerHtml() {
        const links = (cfg.footerLinks || FOOTER_LINKS)
            .map(l => '<a href="' + l[0] + '">' + l[1] + '</a>').join(' · ');
        return '<p>&copy; 2026 <span>SKILLCONNECT GH</span>. All Rights Reserved.</p>\n' +
            '        <p class="footer-nav">' + links + '</p>\n' +
            '        <p>Sixth Circular Road, Cantonment-Labone, Accra, Ghana</p>';
    }

    function render() {
        document.querySelectorAll('header').forEach(h => {
            // fill headers marked as partials (data-partial present) or still holding inline markup
            if (!('partial' in h.dataset) && !h.querySelector('.logo-container')) return;
            h.innerHTML = headerHtml();
        });
        document.querySelectorAll('footer').forEach(f => {
            f.innerHTML = footerHtml();
        });
        ensureDrawer();
    }

    // ---- Theme toggle (LIGHT = production default, dark opt-out) ----
    // Uses the CSS custom properties in styles.css: <html data-theme="light">
    // re-points the surface/text/border tokens. Persisted in localStorage.
    var THEME_KEY = 'sc_theme';
    function appliedTheme() {
        var t = null;
        try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
        if (t !== 'light' && t !== 'dark') t = 'light';
        return t;
    }
    function themeLabel() { return appliedTheme() === 'light' ? 'Light' : 'Dark'; }
    function themeBtnHtml() { return '<i class="fa-solid ' + (appliedTheme() === 'light' ? 'fa-moon' : 'fa-sun') + '"></i>'; }
    function applyTheme(t) {
        if (t !== 'light' && t !== 'dark') t = 'light';
        document.documentElement.setAttribute('data-theme', t);
        var btn = document.getElementById('scThemeToggle');
        if (btn) { btn.innerHTML = themeBtnHtml() + '<span>Theme: ' + themeLabel() + '</span>'; }
    }
    function toggleTheme() {
        var next = appliedTheme() === 'light' ? 'dark' : 'light';
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
        applyTheme(next);
    }
    applyTheme(appliedTheme());

    // ---- Mobile hamburger drawer ----
    // Body-level so the header's own re-renders (and nav.js re-rendering
    // nav.site-nav) never wipe it. Hidden entirely above 900px by CSS.
    function ensureDrawer() {
        let back = document.getElementById('scMenuBackdrop');
        if (!back) {
            back = document.createElement('div');
            back.id = 'scMenuBackdrop';
            back.addEventListener('click', closeMenu);
            document.body.appendChild(back);
        }
        let d = document.getElementById('scMenuDrawer');
        if (!d) {
            d = document.createElement('nav');
            d.id = 'scMenuDrawer';
            d.setAttribute('aria-label', 'Site menu');
            document.body.appendChild(d);
        }
        const active = cfg.activeId || currentId();
        let actHtml = '';
        SCHeader.actions().forEach(a => { actHtml += SCHeader.drawerAction(a); });
        d.innerHTML =
            '<div class="dr-head"><span><i class="fa-solid ' + SCHeader.logo().icon + '"></i> SKILLCONNECT GH</span>' +
            '<button type="button" class="dr-close" aria-label="Close menu" onclick="SCSite.closeMenu()"><i class="fa-solid fa-xmark"></i></button></div>' +
            '<div class="dr-row"><button type="button" id="scThemeToggle" class="dr-theme" onclick="SCSite.toggleTheme()">' + themeBtnHtml() + '<span>Theme: ' + themeLabel() + '</span></button></div>' +
            NAV_ITEMS.map(i => '<a href="' + i.href + '"' + (i.id === active ? ' class="active"' : '') + '>' + i.label + '</a>').join('') +
            '<div class="dr-sep"></div>' +
            actHtml +
            '<div class="dr-foot">' + PHONE_DISPLAY + ' · fastest reply on WhatsApp</div>';
    }

    function openMenu() {
        ensureDrawer();
        document.body.classList.add('menu-open');
        const b = document.querySelector('.nav-burger');
        if (b) { b.setAttribute('aria-expanded', 'true'); b.innerHTML = '<i class="fa-solid fa-xmark"></i>'; }
    }

    function closeMenu() {
        document.body.classList.remove('menu-open');
        const b = document.querySelector('.nav-burger');
        if (b) { b.setAttribute('aria-expanded', 'false'); b.innerHTML = '<i class="fa-solid fa-bars"></i>'; }
    }

    function toggleMenu() {
        if (document.body.classList.contains('menu-open')) closeMenu(); else openMenu();
    }

    // Close after tapping any drawer link (covers SPA-style page transitions too)
    document.addEventListener('click', e => {
        if (e.target.closest && e.target.closest('#scMenuDrawer a')) closeMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) closeMenu(); });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }

    // ---- WhatsApp-dispatch confirmations ----
    // One delegated listener covers every wa.me tap on any page: float buttons,
    // header buttons, profile-modals and inline CTAs. Users get instant
    // confirmation the tap registered, and know this page stays open behind
    // WhatsApp so they never lose their place.
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
        if (!a) return;
        if (window.UI && UI.toast) UI.toast('Opening WhatsApp to our dispatch team — this page stays put, and they usually reply within minutes.', 'success', 3800);
    });

    // expose for nav.js compatibility (nav.js may also be loaded on some pages)
    window.SCNav = window.SCNav || { render, ITEMS: NAV_ITEMS };
    window.SCSite = { render, headerHtml, footerHtml, NAV_ITEMS, FOOTER_LINKS, openMenu, closeMenu, toggleMenu, appliedTheme, applyTheme, toggleTheme };

    /* ================= PWA: service worker + install banner ================= */

    // Register the service worker on every page (https or localhost only —
    // the API server already refuses SW registration on insecure origins).
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => { /* offline-only feature: never block the page */ });
        });
    }

    // Custom install banner: browsers only fire beforeinstallprompt when the
    // PWA is not already installed, and never inside an installed app.
    let deferredInstall = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstall = e;
        // Give the header a beat to render, then add the banner to it.
        setTimeout(showInstallBanner, 400);
    });

    function showInstallBanner() {
        try { if (localStorage.getItem('sc_pwa_dismissed') === '1') return; } catch (err) { /* storage blocked — still show */ }
        if (document.getElementById('scInstallBanner')) return;
        var header = document.querySelector('.site-header');
        if (!header) return;
        var bar = document.createElement('div');
        bar.id = 'scInstallBanner';
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Install SkillConnect app');
        bar.innerHTML =
            '<i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i>' +
            '<span class="ib-txt"><strong>Install SkillConnect</strong> — book faster, works offline.</span>' +
            '<button type="button" class="ib-install">Install</button>' +
            '<button type="button" class="ib-close" aria-label="Dismiss install banner">&times;</button>';
        var close = bar.querySelector('.ib-close');
        close.addEventListener('click', () => {
            try { localStorage.setItem('sc_pwa_dismissed', '1'); } catch (err) { /* ignore */ }
            bar.remove();
        });
        bar.querySelector('.ib-install').addEventListener('click', () => {
            if (!deferredInstall) return;
            bar.remove();
            deferredInstall.prompt();
            deferredInstall.userChoice.finally(() => { deferredInstall = null; });
        });
        header.appendChild(bar);
    }
})();
