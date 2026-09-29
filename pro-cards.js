/* ============================================================
   SKILLCONNECT GH — Shared professional card renderer (pro-cards.js)
   One implementation of the directory "talent card" used by:
     - index.html    (homepage preview: capped, then hands off)
     - directory.html (full browse/search page with pagination)

   Depends on: data-store.js (SC.proAvailability / AVAIL_META / PRO_ICONS)
   and the page-provided global openProfileModal(). openProModal() (the
   direct-request modal) exists on index.html only — elsewhere the Request
   button falls back to opening that pro's profile.
   ============================================================ */

(function () {
    'use strict';

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* 'New' badge: pro verified within the last 30 days */
    function isNewPro(p) {
        return !!p.joinedAt && (Date.now() - p.joinedAt) < 30 * 86400000;
    }

    function formatPrice(n) {
        return 'GH\u20B5 ' + Number(n).toLocaleString();
    }

    /* One talent card. onclick handlers call the page's own globals so the
       request modal stays page-specific while the card markup is shared. */
    function cardHtml(p) {
        var av = SC.proAvailability(p);
        var avMeta = SC.AVAIL_META[av];
        var icon = (SC.PRO_ICONS[p.cat] || 'fa-user-tie');
        var avIcon = av === 'booked' ? 'fa-calendar-xmark' : (av === 'available' ? 'fa-circle-check' : 'fa-clock');
        var canRequest = typeof window.openProModal === 'function';
        return '<div class="talent-card clickable" onclick="openProfileModal(\'' + p.id + '\')" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'){openProfileModal(\'' + p.id + '\')}">' +
            '<div class="talent-photo">' +
            '<i class="fa-solid ' + icon + '"></i>' +
            (isNewPro(p) ? '<span class="new-badge" title="New on SkillConnect — verified within the last 30 days"><i class="fa-solid fa-bolt"></i> NEW</span>' : '') +
            '<span class="avail-badge ' + avMeta.cls + '" title="' + esc(avMeta.title) + '"><i class="fa-solid ' + avIcon + '"></i> ' + avMeta.label + '</span>' +
            '</div>' +
            '<div class="talent-body">' +
            '<h4>' + esc(p.name) + '<i class="fa-solid fa-circle-check verified-tick" title="ID &amp; skill verified"></i></h4>' +
            '<span class="role">' + esc(p.role) + ' — ' + esc(p.city) + '</span>' +
            '<div class="meta">⭐ ' + Number(p.rating).toFixed(1) + ' (' + p.bookings + ' bookings) · ' + esc(p.note) + '</div>' +
            '<div class="price-tag">From ' + formatPrice(p.price) + ' / ' + esc(p.unit) + '</div>' +
            (canRequest
                ? '<button class="book-mini" onclick="event.stopPropagation(); openProModal(\'' + p.id + '\')">Request ' + esc(p.short) + '</button>'
                : '<button class="book-mini" onclick="event.stopPropagation(); openProfileModal(\'' + p.id + '\')">View ' + esc(p.short) + '</button>') +
            '</div>' +
            '</div>';
    }

    window.SCProCards = { esc: esc, isNewPro: isNewPro, formatPrice: formatPrice, cardHtml: cardHtml };
})();
