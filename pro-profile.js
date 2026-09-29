/* ============================================================
   pro-profile.js — shared Pro Profile Modal + Portfolio Lightbox
   Extracted from index.html so any page can open the exact
   same profile modal (directory cards, track-page quote cards…).

   Requires: data-store.js (SC), styles.css (all .profile-*,
   .gallery-item, .review-item, .modal-overlay, #profileLightbox
   styles live there).
   Pages need: <script src="pro-profile.js"></script> after
   data-store.js + ui.js. Markup is auto-injected once per page.
   Public API: SCPro.openProfileModal(proId), SCPro.closeProfileModal()
   ============================================================ */
(function () {
    'use strict';

    var MODAL_HTML =
        '<div class="modal-overlay" id="profileModal">' +
            '<div class="modal-box profile-box" id="profileModalBox">' +
                '<div class="modal-head">' +
                    '<h3><i class="fa-solid fa-id-badge"></i> Professional Profile</h3>' +
                    '<button type="button" class="modal-close" onclick="SCPro.closeProfileModal()" aria-label="Close">&times;</button>' +
                '</div>' +
                '<div id="profileModalBody"></div>' +
            '</div>' +
        '</div>' +
        '<div id="profileLightbox">' +
            '<button type="button" class="lb-close" onclick="SCPro.closeLightbox()" aria-label="Close">&times;</button>' +
            '<button type="button" class="lb-btn lb-prev" onclick="SCPro.lightboxNav(-1)" aria-label="Previous">&#8249;</button>' +
            '<img id="lightboxImg" src="" alt="Portfolio sample">' +
            '<div id="lightboxCaption"></div>' +
            '<button type="button" class="lb-btn lb-next" onclick="SCPro.lightboxNav(1)" aria-label="Next">&#8250;</button>' +
        '</div>';

    function ensureMarkup() {
        if (document.getElementById('profileModal')) return;
        var holder = document.createElement('div');
        holder.id = 'scProfileHost';
        holder.innerHTML = MODAL_HTML;
        document.body.appendChild(holder);
    }

    // Run after DOM is available whether the script loads sync or deferred
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureMarkup);
    } else {
        ensureMarkup();
    }

    var profileLightbox = { list: [], idx: 0 };

    function openProfileModal(proId) {
        ensureMarkup();
        var p = SC.getPro(proId);
        if (!p) return;

        var av = SC.proAvailability(p);
        var avMeta = SC.AVAIL_META[av];
        var icon = SC.PRO_ICONS[p.cat] || 'fa-user-tie';
        var reviews = SC.getReviewsFor(proId);
        var portfolio = SC.getPortfolio(proId);
        var jobsDone = (p.bookings || 0);
        var yrs = p.years || '3-5';
        var langs = (p.languages && p.languages.length ? p.languages : ['English']).join(', ');
        var respMap = { '1hr': 'Replies within 1 hour', '3hr': 'Replies within 3 hours', 'sameday': 'Replies same day', '24hr': 'Replies within 24 hours' };
        var resp = respMap[p.response] || 'Replies within 24 hours';
        /* Contact preference transparency: HOW the pro accepts customer
           contact (their dashboard setting, honoured by the notification
           pipeline — see notifyProByChannel / contact_channels). */
        var chanMap = {
            sms: { icon: 'fa-solid fa-comment-sms', label: 'Reaches you by SMS' },
            whatsapp: { icon: 'fa-brands fa-whatsapp', label: 'Reaches you on WhatsApp' }
        };
        var chan = chanMap[p.contactChannels] || { icon: 'fa-solid fa-mobile-screen', label: 'Reaches you by SMS & WhatsApp' };

        var stars = function (n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); };
        var waLink = 'https://wa.me/233244211595?text=' + encodeURIComponent(
            'Hello SkillConnect! I just viewed the profile of ' + p.name + ' (' + p.id + ') on your website. I would like to ask about their availability and rates.'
        );
        /* Direct request flows: index scrolls to its main form; the directory
           opens its own request modal (same 'Request [Name]' flow as its cards).
           Other pages keep the WhatsApp ask-availability fallback. */
        var bookCta;
        if (typeof window.requestPro === 'function') {
            bookCta = '<a class="btn-wa-send profile-book" href="#" onclick="SCPro.closeProfileModal(); requestPro(\'' + p.id + '\'); document.getElementById(\'bookingForm\').scrollIntoView({behavior:\'smooth\', block:\'center\'}); return false;">' +
                '<i class="fa-solid fa-calendar-check"></i> Book ' + SC.esc(p.short) + '</a>';
        } else if (typeof window.openProModal === 'function') {
            bookCta = '<a class="btn-wa-send profile-book" href="#" onclick="SCPro.closeProfileModal(); openProModal(\'' + p.id + '\'); return false;">' +
                '<i class="fa-solid fa-calendar-check"></i> Book ' + SC.esc(p.short) + '</a>';
        } else {
            bookCta = '<a class="btn-wa-send profile-book" href="' + waLink + '" target="_blank" rel="noopener">' +
                '<i class="fa-brands fa-whatsapp"></i> Book ' + SC.esc(p.short) + ' — Ask Availability</a>';
        }

        document.getElementById('profileModalBody').innerHTML =
            '<div class="profile-hero">' +
                '<div class="profile-avatar"><i class="fa-solid ' + icon + '"></i></div>' +
                '<div class="profile-id">' +
                    '<h4>' + SC.esc(p.name) + ' <i class="fa-solid fa-circle-check verified-tick" title="ID & skill verified"></i></h4>' +
                    '<span class="role">' + SC.esc(p.role) + ' — ' + SC.esc(p.city) + '</span>' +
                    '<div class="profile-stats">' +
                        '<span><strong>⭐ ' + p.rating.toFixed(1) + '</strong> (' + p.ratingCount + ' reviews)</span>' +
                        '<span><strong>' + jobsDone + '</strong> jobs done</span>' +
                        '<span><strong>' + yrs + '</strong> yrs experience</span>' +
                    '</div>' +
                '</div>' +
                '<span class="avail-badge ' + avMeta.cls + '" style="position:static; width:auto;"><i class="fa-solid ' + (av === 'booked' ? 'fa-calendar-xmark' : (av === 'available' ? 'fa-circle-check' : 'fa-clock')) + '"></i> ' + avMeta.label + '</span>' +
            '</div>' +
            (function () {
                // Transparency notice: ID re-verification in progress (staged ID gate).
                var g = SC.idGateSync ? SC.idGateSync(p) : { stage: 'ok' };
                if (g.stage === 'expired') {
                    return '<div class="profile-id-notice"><i class="fa-solid fa-id-card-clip"></i> ID re-verification in progress — the identity check on file is being renewed. Bookings and escrow protection are unaffected.</div>';
                }
                if (g.stage === 'delisted') {
                    return '<div class="profile-id-notice"><i class="fa-solid fa-id-card-clip"></i> ID re-verification in progress — this pro is temporarily not receiving new bookings until their renewed ID is verified.</div>';
                }
                return '';
            })() +
            '<p class="profile-bio">' + SC.esc(p.desc || p.note) + '</p>' +
            '<div class="profile-meta-grid">' +
                '<div><i class="fa-solid fa-comment-dots"></i> ' + resp + '</div>' +
                '<div><i class="' + chan.icon + '"></i> ' + chan.label + '</div>' +
                '<div><i class="fa-solid fa-bolt"></i> ' + (p.emergency ? 'Accepts emergency jobs' : 'Planned jobs only') + '</div>' +
                '<div><i class="fa-solid fa-language"></i> ' + langs + '</div>' +
                '<div><i class="fa-solid fa-tag"></i> From <strong>' + SC.cedi(p.price) + ' / ' + SC.esc(p.unit) + '</strong></div>' +
            '</div>' +
            '<h5 class="profile-section-title"><i class="fa-solid fa-images"></i> Portfolio</h5>' +
            '<div class="profile-gallery">' +
                portfolio.map(function (g, i) {
                    return '<figure class="gallery-item" onclick="SCPro.openLightbox(' + i + ')" title="' + SC.esc(g.caption) + '">' +
                        '<img src="' + g.url + '" alt="' + SC.esc(g.caption) + '" loading="lazy" ' +
                        'onerror="this.parentNode.classList.add(\'broken\'); this.remove();">' +
                        '<figcaption>' + SC.esc(g.caption) + '</figcaption>' +
                    '</figure>';
                }).join('') +
            '</div>' +
            '<h5 class="profile-section-title"><i class="fa-solid fa-star"></i> Reviews (' + reviews.length + ')</h5>' +
            '<div class="profile-reviews">' +
                (reviews.slice(0, 6).map(function (rv) {
                    return '<div class="review-item">' +
                        '<div class="review-head"><strong>' + SC.esc(rv.by || 'Verified Customer') + '</strong>' +
                        ((rv.bookingId || '').indexOf('SC-BK-') === 0 ? '<i class="fa-solid fa-circle-check verified-tick" title="From a completed, escrow-protected booking"></i>' : '') +
                        '<span class="review-stars">' + stars(rv.rating) + '</span></div>' +
                        '<p>“' + SC.esc(rv.text) + '”</p>' +
                        '<span class="review-date">' + new Date(rv.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</span>' +
                    '</div>';
                }).join('') || '<p class="profile-empty">No reviews yet — be the first to book.</p>') +
                (reviews.length > 6 ? '<p class="profile-more">+ ' + (reviews.length - 6) + ' more reviews after booking.</p>' : '') +
            '</div>' +
            '<div class="modal-actions profile-actions">' +
                bookCta +
                '<a class="btn-edit" href="' + waLink + '" target="_blank" rel="noopener">' +
                    '<i class="fa-brands fa-whatsapp"></i> Ask a Question</a>' +
            '</div>';

        // stash state for the lightbox
        profileLightbox.list = portfolio;
        profileLightbox.idx = 0;
        document.getElementById('profileModal').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeProfileModal() {
        var m = document.getElementById('profileModal');
        if (m) m.classList.remove('open');
        document.body.style.overflow = '';
    }

    function openLightbox(i) {
        ensureMarkup();
        var box = document.getElementById('profileLightbox');
        var g = profileLightbox.list[i];
        if (!g) return;
        profileLightbox.idx = i;
        var img = document.getElementById('lightboxImg');
        img.src = g.url;
        document.getElementById('lightboxCaption').textContent = g.caption;
        box.classList.add('open');
        gzReset(false);
        gzMeasure(); // cached/previous image box
        img.onload = function () { gzReset(false); gzMeasure(); }; // re-measure once the new image settles
        gzBind();
    }

    function lightboxNav(step) {
        var list = profileLightbox.list;
        if (!list.length) return;
        profileLightbox.idx = (profileLightbox.idx + step + list.length) % list.length;
        openLightbox(profileLightbox.idx);
    }

    function closeLightbox() {
        var b = document.getElementById('profileLightbox');
        if (b) b.classList.remove('open');
    }

    // ---------- touch gestures: swipe nav, pinch-zoom, pan, double-tap ----------
    var gz = { scale: 1, x: 0, y: 0, icx: 0, icy: 0, iw: 0, ih: 0 };
    var gestureBound = false;

    function gzClampPan() {
        var mx = Math.max(0, gz.iw * (gz.scale - 1) / 2);
        var my = Math.max(0, gz.ih * (gz.scale - 1) / 2);
        gz.x = Math.max(-mx, Math.min(mx, gz.x));
        gz.y = Math.max(-my, Math.min(my, gz.y));
    }

    function gzApply(animate) {
        var img = document.getElementById('lightboxImg');
        if (!img) return;
        img.style.transition = animate ? 'transform .25s ease' : 'none';
        img.style.transform = 'translate(' + gz.x + 'px, ' + gz.y + 'px) scale(' + gz.scale + ')';
        var lb = document.getElementById('profileLightbox');
        if (lb) lb.classList.toggle('lb-zoomed', gz.scale > 1);
    }

    function gzReset(animate) {
        gz.scale = 1; gz.x = 0; gz.y = 0;
        gzApply(animate !== false);
    }

    // Measure the image box — only valid while the transform is identity.
    function gzMeasure() {
        var img = document.getElementById('lightboxImg');
        if (!img) return;
        var r = img.getBoundingClientRect();
        gz.icx = r.left + r.width / 2;
        gz.icy = r.top + r.height / 2;
        gz.iw = r.width; gz.ih = r.height;
    }

    function gzToggleZoom(px, py) {
        if (gz.scale > 1) { gzReset(true); return; }
        gz.scale = 2.5;
        gz.x = (1 - gz.scale) * (px - gz.icx);
        gz.y = (1 - gz.scale) * (py - gz.icy);
        gzClampPan();
        gzApply(true);
    }

    function gzBind() {
        if (gestureBound) return;
        gestureBound = true;
        var lb = document.getElementById('profileLightbox');
        var img = document.getElementById('lightboxImg');
        var touch = null;   // active gesture state
        var lastTap = 0;

        function pt(t) { return { x: t.clientX, y: t.clientY }; }

        lb.addEventListener('touchstart', function (e) {
            if (e.touches.length === 1) {
                var t0 = pt(e.touches[0]);
                touch = {
                    mode: gz.scale > 1 ? 'pan' : 'swipe',
                    x0: t0.x, y0: t0.y, bx: gz.x, by: gz.y,
                    t0: Date.now(), moved: false,
                    onImg: e.target === img
                };
            } else if (e.touches.length === 2) {
                var a = pt(e.touches[0]), b = pt(e.touches[1]);
                touch = {
                    mode: 'pinch',
                    d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
                    mx0: (a.x + b.x) / 2, my0: (a.y + b.y) / 2,
                    s0: gz.scale, bx: gz.x, by: gz.y, moved: false
                };
                lb.classList.add('lb-dragging');
            }
        }, { passive: true });

        lb.addEventListener('touchmove', function (e) {
            if (!touch) return;
            if (touch.mode === 'pinch' && e.touches.length === 2) {
                e.preventDefault();
                var a = pt(e.touches[0]), b = pt(e.touches[1]);
                var d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
                var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                gz.scale = Math.max(1, Math.min(4, touch.s0 * d / touch.d0));
                // keep the content point under the original pinch midpoint anchored to it
                gz.x = (mx - gz.icx) - (gz.scale / touch.s0) * (touch.mx0 - gz.icx - touch.bx);
                gz.y = (my - gz.icy) - (gz.scale / touch.s0) * (touch.my0 - gz.icy - touch.by);
                gzClampPan();
                gzApply(false);
                touch.moved = true;
            } else if (touch.mode === 'pan' && e.touches.length === 1) {
                e.preventDefault();
                var t = pt(e.touches[0]);
                gz.x = touch.bx + (t.x - touch.x0);
                gz.y = touch.by + (t.y - touch.y0);
                gzClampPan();
                gzApply(false);
                touch.moved = true;
            } else if (touch.mode === 'swipe' && e.touches.length === 1) {
                var t2 = pt(e.touches[0]);
                var dx = t2.x - touch.x0, dy = t2.y - touch.y0;
                if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
                    e.preventDefault();
                    lb.classList.add('lb-dragging');
                    img.style.transition = 'none';
                    img.style.transform = 'translateX(' + (dx * 0.6) + 'px) scale(1)';
                    touch.moved = true;
                }
            }
        }, { passive: false });

        lb.addEventListener('touchend', function (e) {
            if (!touch) return;
            lb.classList.remove('lb-dragging');
            var t = e.changedTouches[0];
            var quickTap = !touch.moved && touch.onImg && (Date.now() - touch.t0) < 300 && e.touches.length === 0;

            if (touch.mode === 'pinch') {
                if (gz.scale < 1.15) gzReset(true);
                else { gzClampPan(); gzApply(true); }
            } else if (touch.mode === 'swipe' && touch.moved) {
                var dx = t.clientX - touch.x0;
                if (Math.abs(dx) > 60) {
                    gzReset(false);
                    lightboxNav(dx < 0 ? 1 : -1); // wraps around — no dead edges
                    return;
                }
                gzApply(true); // spring back to center
            } else if (quickTap) {
                var now = Date.now();
                if (now - lastTap < 350) {
                    gzToggleZoom(t.clientX, t.clientY);
                    lastTap = 0;
                } else {
                    lastTap = now;
                }
            }
            touch = null;
        });

        // Desktop: double-click zooms in/out at the pointer
        img.addEventListener('dblclick', function (e) { gzToggleZoom(e.clientX, e.clientY); });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeProfileModal();
        var lb = document.getElementById('profileLightbox');
        if (lb && lb.classList.contains('open')) {
            if (e.key === 'ArrowLeft') lightboxNav(-1);
            if (e.key === 'ArrowRight') lightboxNav(1);
            if (e.key === 'Escape') closeLightbox();
        }
    });

    window.SCPro = {
        openProfileModal: openProfileModal,
        closeProfileModal: closeProfileModal,
        openLightbox: openLightbox,
        lightboxNav: lightboxNav,
        closeLightbox: closeLightbox,
        _gz: gz // live gesture state (debug/testing handle)
    };

    // Convenience global so onclick="openProfileModal('P1001')" works everywhere,
    // including pages (like index.html) whose own inline JS references it.
    window.openProfileModal = openProfileModal;
    window.closeProfileModal = closeProfileModal;
    window.openLightbox = openLightbox;
    window.lightboxNav = lightboxNav;
    window.closeLightbox = closeLightbox;
})();
