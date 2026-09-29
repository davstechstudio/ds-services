/* ============================================================
   SKILLCONNECT GH — Shared Data Layer
   localStorage-backed store powering all pages & modules.
   Pages: skillconnect, track, dashboard, admin, ussd
   ============================================================ */

const SC = (function () {
    const DB_KEY = 'sc_db_v1';
    const SITE_URL = 'https://skillconnectgh.com';   // canonical site URL (placeholder — swap on deploy)
    const COMMISSION_RATE = 0.10;   // platform fee on every completed job (overridden live by the commission_rate setting)
    const REG_FEE = 50;             // one-time worker registration/verification fee (GH₵)

    const CAT_LABELS = {
        mc: 'Event MC / Host', artist: 'Music Artist / Live Band', photographer: 'Photographer',
        videographer: 'Videographer / Editor', dj: 'DJ / Sound & Lighting', caterer: 'Caterer / Baker',
        decorator: 'Decorator / Event Planner', handy: 'Handy Skill Worker'
    };

    const CATEGORY_INFO = {
        mc: { name: 'Event MC / Host', advice: 'Share your program schedule and names of key people (chief, groom, bride, dignitaries) with the MC in advance. Confirm if you need bilingual hosting (Twi, Ewe, Ga, English).', range: [800, 2500] },
        artist: { name: 'Music Artist / Live Band', advice: 'Confirm stage size, power supply and performance duration. Provide a playlist or song list, and check if the artist needs backing tracks or live instruments.', range: [2500, 15000] },
        photographer: { name: 'Photographer', advice: 'Agree on the shot list and how many edited photos you will receive and when. Confirm whether you want hard copies or digital albums.', range: [600, 3000] },
        videographer: { name: 'Videographer / Editor', advice: 'Decide between full-length coverage or a highlight reel. Ask about drone coverage if the venue allows it, and confirm delivery timeline for the final edit.', range: [1000, 5000] },
        dj: { name: 'DJ / Sound & Lighting', advice: 'State the audience size so the pro brings a big enough sound system and speakers. Confirm power backup (generator) for outdoor events.', range: [800, 4000] },
        caterer: { name: 'Caterer / Baker', advice: 'Give the exact guest count and menu preference. Ask for a tasting where possible and confirm serving staff are included in the quote.', range: [1500, 10000] },
        decorator: { name: 'Decorator / Event Planner', advice: 'Share your theme colors and a reference photo. Confirm setup and teardown times so the venue access is arranged.', range: [1500, 8000] },
        handy: { name: 'Handy Skill Worker', advice: 'Describe the fault clearly and send a photo if you can. Prepare access to the area (keys, gate pass) so the job starts immediately on arrival.', range: [150, 1200] }
    };

    const URGENCY_INFO = {
        planned: { label: 'Planned', slaHours: 24, note: "You'll receive up to 3 quotes within 24 hours." },
        soon: { label: 'Within 48 hours', slaHours: 6, note: 'Pros will respond within 6 hours — watch your WhatsApp.' },
        urgent: { label: 'Emergency / Today', slaHours: 0.5, note: 'This goes to standby pros on emergency dispatch — expect a call within 30 minutes.' }
    };

    const PRO_ICONS = {
        mc: 'fa-microphone-lines', artist: 'fa-guitar', photographer: 'fa-camera-retro',
        videographer: 'fa-video', dj: 'fa-compact-disc', caterer: 'fa-utensils',
        decorator: 'fa-wand-magic-sparkles', handy: 'fa-screwdriver-wrench'
    };

    // ---------- Seed ----------
    function seedData() {
        const now = Date.now();
        const proDefs = [
            ['Kwesi "The Voice" Amankwah', 'Kwesi', 'mc', 'Event MC', 'Accra', 4.9, 212, 800, 'event', 'Twi & English · Weddings, corporate'],
            ['Adjoa Breeze & Band', 'Adjoa', 'artist', 'Live Band / Artist', 'Tema', 4.8, 97, 2500, 'show', 'Afrobeats, highlife, gospel sets'],
            ['ShotsByNana Studios', 'Nana', 'photographer', 'Photographer', 'Kumasi', 5.0, 156, 600, 'day', 'Events, studio, drone'],
            ['FixIt Kwabena', 'Kwabena', 'handy', 'Electrician / Handyman', 'Accra', 4.7, 340, 150, 'visit', 'Wiring, repairs, installations'],
            ['DJ Vybez GH', 'DJ Vybez', 'dj', 'DJ / Sound & Lighting', 'Accra', 4.8, 275, 900, 'event', 'Full sound system & lighting packages'],
            ['Lens & Frames Media', 'Lens & Frames', 'videographer', 'Videographer / Editor', 'Takoradi', 4.9, 88, 1200, 'day', 'Live coverage, highlight reels, drone'],
            ['Auntie Akos Catering', 'Auntie Akos', 'caterer', 'Caterer / Baker', 'Kumasi', 4.9, 190, 1800, 'event', 'Local dishes, small chops, wedding cakes'],
            ['GrandDecor Events', 'GrandDecor', 'decorator', 'Decorator / Planner', 'Accra', 4.6, 120, 2000, 'event', 'Stage, canopy, floral & theme design'],
            ['MC Papa Sly', 'Papa Sly', 'mc', 'Event MC', 'Takoradi', 4.5, 64, 500, 'event', 'English & Fante · Parties, funerals'],
            ['Kumasi Wedding Cinema', 'KWC Team', 'videographer', 'Videographer / Editor', 'Kumasi', 4.7, 73, 2500, 'event', 'Cinematic wedding films & trailers'],
            ['HandyPro Maintenance', 'HandyPro', 'handy', 'Plumber / AC Technician', 'Tema', 4.8, 410, 200, 'visit', 'Leaks, AC servicing, fittings'],
            ['Overflow Music Ministry', 'Overflow', 'artist', 'Gospel Artist', 'Accra', 5.0, 45, 3000, 'show', 'Worship concerts, church events']
        ];

        const pros = proDefs.map((p, i) => {
            const id = 'P' + String(1001 + i);
            return {
                id,
                name: p[0], short: p[1], cat: p[2], role: p[3], city: p[4],
                rating: p[5], ratingCount: Math.round(p[6] * 0.6), bookings: p[6],
                price: p[7], unit: p[8], note: p[9],
                phone: '02400000' + String(10 + i),
                verified: true,
                emergency: i % 3 !== 2,               // most accept emergencies
                response: ['1hr', '3hr', 'sameday'][i % 3],
                years: ['3-5', '6-10', '10+'][i % 3],
                languages: ['English', 'Twi'].slice(0, (i % 2) + 1),
                desc: p[9] + ' — verified professional on SkillConnect.',
                earnings: p[6] * p[7] * 0.85,          // lifetime (post-commission)
                commissionPaid: p[6] * p[7] * 0.15,
                balance: Math.round(p[7] * 0.4),
                // availability: blocked dates (ISO yyyy-mm-dd) — seeded so the directory
                // shows a realistic mix of "available today", "booked" and "on request" pros
                blocked: (function () {
                    const day = 86400000;
                    const iso = ms => {
                        const dt = new Date(ms);
                        return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
                    };
                    if (i % 4 === 1) return [iso(now + day * (1 + (i % 5)))];        // booked on a future date
                    if (i % 7 === 3) return [0, 1, 2, 3].map(n => iso(now + day * n)); // busy for the next few days
                    return [];
                })(),
                joinedAt: now - 86400000 * (200 - i * 7),
                source: 'seed'
            };
        });

        return {
            pros,
            bookings: [],
            quotes: [],
            applications: [],
            disputes: [],
            reviews: [],
            transactions: [],  // full money ledger: service payments, commission, payouts, reg fees, refunds
            payoutRequests: [],// pro withdrawal requests awaiting admin processing
            chat: {},          // bookingId -> [{from:'customer'|'pro'|'system', text, at}]
            notifications: [], // {id, audience:'customer'|'pro'|'admin', refTo, type, text, at, read}
            supportMessages: [], // {id, ref, name, phone, topic, bookingRef, message, at, status:'open'|'resolved', handledAt, handledBy}
            cms: {             // frontpage content managed from the admin console
                heroTitle: "GHANA'S #1 BOOKING PLATFORM FOR SKILLED SERVICE PROS!",
                heroSub: 'Discover, compare and instantly book verified Event MCs, Performing Artists, Photographers, Videographers, DJs, Caterers and Handy Skill Workers — near you, within budget, in minutes.',
                announceOn: true,
                announceText: 'Pay only AFTER the job is done — no upfront deposits.\nNew professionals: one-time GH₵ 50 registration fee.\nVerified pros, nationwide coverage — book in minutes.',
                regFee: REG_FEE,
                updatedAt: now
            },
            counters: { booking: 284000, quote: 51000, msg: 90000, app: 300, dispute: 40, review: 7000, txn: 500000, payout: 100, pbatch: 0 },
            seededAt: now
        };
    }

    // ---------- Persistence ----------
    let db = null;

    function load() {
        if (db) return db;
        try {
            const raw = localStorage.getItem(DB_KEY);
            if (raw) {
                db = JSON.parse(raw);
                // basic shape guard
                if (!db.pros || !db.counters) throw new Error('bad db');
            } else {
                db = seedData();
                save();
            }
        } catch (e) {
            console.warn('SC store reset:', e.message);
            db = seedData();
            save();
        }
        migrate(db);
        return db;
    }

    function save() {
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(db));
        } catch (e) {
            console.warn('SC store save failed', e);
        }
    }

    // ---------- Migrations ----------
    // Brings DBs created by older versions up to the current shape (idempotent).
    function migrate(d) {
        let dirty = false;
        // v1 -> availability seed: give long-persisted pros a realistic blocked-date mix
        if (!d.availSeeded) {
            const day = 86400000;
            const iso = ms => {
                const dt = new Date(ms);
                return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
            };
            d.pros.forEach((p, i) => {
                p.blocked = (p.blocked || []);
                if (p.blocked.length) return;
                if (i % 4 === 1) p.blocked = [iso(Date.now() + day * (1 + (i % 5)))];
                else if (i % 7 === 3) p.blocked = [0, 1, 2, 3].map(n => iso(Date.now() + day * n));
            });
            d.availSeeded = true;
            dirty = true;
        }
        // ID re-verification seed: give every pro an ID-verified date so expiry
        // tracking has history (staggered ages; a couple are past or near expiry).
        if (!d.idSeeded) {
            const DAY = 86400000;
            const ages = [400, 1830, 1900, 300, 900, 1805, 550, 250, 1820, 800, 350, 1100];  // days since ID check — P1002 grace-stage, P1003 delisted
            d.pros.forEach((p, i) => {
                p.idDocsReceived = true;
                p.idVerifiedAt = Date.now() - ages[i % ages.length] * DAY;
                /* Contact-channel preference: realistic mix across the seed
                   (both / whatsapp / sms) so dispatch routing is exercised. */
                p.contactChannels = ['both', 'whatsapp', 'sms', 'both', 'both', 'whatsapp', 'both', 'both', 'sms', 'both', 'whatsapp', 'both'][i] || 'both';
            });
            d.idSeeded = true;
            dirty = true;
        }
        // Ghana Card photos: quarantine any base64 payload that could blow the
        // localStorage quota (register.html compresses to ~45KB per image, so
        // anything beyond this predates that compression).
        (d.applications || []).forEach(a => {
            ['idFrontData', 'idBackData'].forEach(k => {
                if (a[k] && a[k].length > 150000) a[k] = '';
            });
        });
        if (dirty) save();

        // v1 -> sample reviews: give the directory profiles realistic review history
        if (!d.reviewsSeeded) {
            const texts = [
                ['Ama Serwaa', 5, 'Very professional and punctual. Made our event stress-free — highly recommended!'],
                ['Kwame O.', 5, 'Delivered exactly what was promised. Communication was excellent from start to finish.'],
                ['Efua M.', 4, 'Great work overall. Slightly late arriving but more than made up for it on the day.'],
                ['Yaw Darko', 5, 'Fair price, quality service. Already booked him again for my sister\'s wedding.'],
                ['Akosua B.', 5, 'Would choose them again without thinking. Worth every cedi.'],
                ['Kofi A.', 4, 'Solid job and respectful team. Will use SkillConnect for our next event.']
            ];
            d.pros.forEach((p, pi) => {
                const n = 2 + (pi % 2); // 2-3 reviews each
                for (let i = 0; i < n; i++) {
                    const t = texts[(pi + i * 2) % texts.length];
                    d.reviews.push({
                        id: 'SC-RV-SEED-' + p.id + '-' + i,
                        bookingId: 'SEED-' + p.id + '-' + i,
                        proId: p.id,
                        rating: t[1],
                        text: t[2],
                        by: t[0],
                        at: Date.now() - 86400000 * (30 + (pi * 13 + i * 41) % 300)
                    });
                }
            });
            d.reviewsSeeded = true;
            save();
        }

        // v1 -> payments/CMS fields: ledger, payout queue, CMS content, reg-fee tracking
        if (!d.txnMigrated) {
            if (!Array.isArray(d.transactions)) d.transactions = [];
            if (!Array.isArray(d.payoutRequests)) d.payoutRequests = [];
            if (!Array.isArray(d.payoutBatches)) d.payoutBatches = [];
            if (!d.cms) {
                d.cms = {
                    heroTitle: "GHANA'S #1 BOOKING PLATFORM FOR SKILLED SERVICE PROS!",
                    heroSub: 'Discover, compare and instantly book verified Event MCs, Performing Artists, Photographers, Videographers, DJs, Caterers and Handy Skill Workers — near you, within budget, in minutes.',
                    announceOn: true,
                    announceText: 'Pay only AFTER the job is done — no upfront deposits. New professionals: one-time GH₵ 50 registration fee.',
                    updatedAt: Date.now()
                };
            }
            // seed pros as having paid their registration fee (they are already live)
            d.pros.forEach(p => { if (p.regFeePaid === undefined) p.regFeePaid = true; });
            d.txnMigrated = true;
            save();
        }

        // v1 -> configurable registration fee: backfill cms.regFee for pre-existing stores
        if (d.cms && d.cms.regFee === undefined) {
            d.cms.regFee = REG_FEE;
            d.cms.announceText = 'Pay only AFTER the job is done — no upfront deposits.\nNew professionals: one-time GH₵ 50 registration fee.\nVerified pros, nationwide coverage — book in minutes.';
            save();
        }
    }

    // ---------- Support messages (contact form → admin Support tab) ----------
    const SUPPORT_TOPICS = { booking: 'Booking / Existing Request', payment: 'Payment / Escrow Question', pro: 'I Am A Professional', complaint: 'Complaint / Dispute', suggestion: 'Suggestion / New Category', other: 'Something Else' };

    function submitSupportMessage(name, phone, topic, bookingRef, message) {
        const n = String(name || '').trim();
        const ph = String(phone || '').trim();
        const msg = String(message || '').trim();
        if (!n || !ph || !msg) return { ok: false, error: 'Name, phone and message are required.' };
        if (msg.length > 2000) return { ok: false, error: 'Message is too long (max 2000 characters).' };
        const d = load();
        if (!Array.isArray(d.supportMessages)) d.supportMessages = [];
        const m = {
            id: nextId('msg'),
            ref: 'MSG-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
            name: n.slice(0, 80),
            phone: ph.slice(0, 20),
            topic: SUPPORT_TOPICS[topic] ? topic : 'other',
            bookingRef: String(bookingRef || '').trim().slice(0, 20),
            message: msg,
            at: Date.now(),
            status: 'open'
        };
        d.supportMessages.unshift(m);
        d.supportMessages = d.supportMessages.slice(0, 200);
        notify('admin', m.id, 'support', 'Support message ' + m.ref + ' from ' + n + ' (' + SUPPORT_TOPICS[m.topic] + ')');
        save();
        return { ok: true, message: m };
    }

    function supportMessages() {
        const d = load();
        if (!Array.isArray(d.supportMessages)) d.supportMessages = [];
        return d.supportMessages;
    }

    function resolveSupportMessage(id, adminTag) {
        const d = load();
        if (!Array.isArray(d.supportMessages)) d.supportMessages = [];
        const m = d.supportMessages.find(x => x.id === id);
        if (!m) return { ok: false, error: 'Support message not found.' };
        m.status = 'resolved';
        m.handledAt = Date.now();
        m.handledBy = adminTag || 'admin';
        save();
        return { ok: true };
    }

    function reset() {
        db = seedData();
        save();
    }

    // ---------- ID helpers ----------
    function nextId(kind) {
        const d = load();
        d.counters[kind] = (d.counters[kind] || 0) + 1;
        const prefix = { booking: 'SC-BK-', quote: 'SC-Q-', msg: 'SC-MSG-', app: 'SC-APP-', dispute: 'SC-DS-', review: 'SC-RV-' }[kind] || 'SC-';
        return prefix + d.counters[kind];
    }

    function todayISO() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function fmtDate(iso) {
        return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function cedi(n) {
        return 'GH₵ ' + Number(n || 0).toLocaleString();
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ---------- Notifications ----------
    /* Preference-center classes — MUST stay in sync with sc-api.js's
       NOTIFY_CRITICAL_TYPES / NOTIFY_MUTABLE_TYPES: money, assigned jobs and
       enforcement can never be muted; booking/application/review can. */
    const NOTIFY_CRITICAL_TYPES = ['job', 'escrow', 'payment', 'payout', 'dispute'];
    const NOTIFY_MUTABLE_TYPES = ['booking', 'application', 'review'];

    function notify(audience, refTo, type, text) {
        const d = load();
        /* Pro preference center: muted types never land (one check silences
           bell + push + SMS/WhatsApp on the server; mirrors that here). */
        if (audience === 'pro' && refTo && NOTIFY_MUTABLE_TYPES.includes(type)) {
            const p = d.pros.find(x => x.id === refTo);
            const muted = Array.isArray(p && p.notifyMutedTypes) ? p.notifyMutedTypes : [];
            if (muted.includes(type)) return;
        }
        d.notifications.unshift({
            id: 'N' + Date.now() + Math.floor(Math.random() * 999),
            audience, refTo, type, text,
            at: Date.now(), read: false
        });
        d.notifications = d.notifications.slice(0, 400);
        save();
    }

    /* Deliver a pro notification honouring their contact-channel preference
       (sms | whatsapp | both) — parity with the server's notifyProByChannel.
       The in-app bell always fires; the channel note tells dispatch how to
       reach them off-platform. */
    function notifyProByChannel(proId, type, text) {
        const d = load();
        const p = d.pros.find(x => x.id === proId);
        const ch = (p && p.contactChannels) || 'both';
        notify('pro', proId, type, text);
        return { channel: ch, delivered: ch === 'both' ? ['sms', 'whatsapp'] : [ch] };
    }

    function notificationsFor(audience, refTo) {
        const d = load();
        return d.notifications.filter(n => n.audience === audience && (!refTo || n.refTo === refTo || n.refTo === '*'));
    }

    function markNotificationsRead(audience, refTo) {
        const d = load();
        d.notifications.forEach(n => {
            if (n.audience === audience && (!refTo || n.refTo === refTo || n.refTo === '*')) n.read = true;
        });
        save();
    }

    // ---------- Pros ----------
    function getPros() { return load().pros; }

    function getPro(id) { return load().pros.find(p => p.id === id) || null; }

    function addApplication(app) {
        const d = load();
        const record = Object.assign({
            id: nextId('app'),
            status: 'pending',            // pending | verified | rejected
            submittedAt: Date.now(),
            source: 'register-page'
        }, app);
        d.applications.unshift(record);
        save();
        notify('admin', record.id, 'application', 'New application: ' + record.name + ' (' + (CAT_LABELS[record.cat] || record.cat) + ', ' + record.city + ') — ' + record.id);
        notify('customer', record.id, 'application', 'Application received (' + record.id + '). Verification happens within 24 hours.');
        return record;
    }

    function getApplications() { return load().applications; }

    function proDirectoryUrl(proId) {
        return SITE_URL + '/index.html?pro=' + proId;
    }

    // Outreach drafts for a verified applicant: WhatsApp / SMS / email messages
    // carrying their personal directory link. The admin clicks a channel to send;
    // drafts are computed live so they always reflect the final profile values.
    function verifiedNotices(appRef) {
        const d = load();
        const app = d.applications.find(a => a.id === appRef);
        const pro = d.pros.find(p => p.appId === appRef);
        if (!pro) return { ok: false, error: 'Application is not verified yet.' };

        const link = SITE_URL + '/index.html?pro=' + pro.id;
        const digits = String(app.whatsapp || app.phone || '').replace(/\D/g, '');
        let intl = digits;
        if (intl.startsWith('0')) intl = '233' + intl.slice(1);
        else if (!intl.startsWith('233')) intl = '233' + intl;
        const local = intl.startsWith('233') && intl.length >= 12 ? '0' + intl.slice(3) : digits;

        const name = (app && app.name) || pro.name;
        const waMsg = '🎉 Congratulations ' + name + '! Your SkillConnect application is VERIFIED.\n\n' +
            'Your professional profile is now live:\n' + link + '\n\n' +
            'Customers can find and book you from today. Share your link to get booked faster.\n\n— SkillConnect GH (024 421 1595)';
        const smsMsg = 'SkillConnect GH: You are VERIFIED ' + name + '! Your profile is live: ' + link;
        const mailBody = 'Hello ' + name + ',\n\nGreat news — your SkillConnect application has been verified.\n\n' +
            'Your professional profile is now live at:\n' + link + '\n\n' +
            'What happens next:\n' +
            '1. Customers discover you in the directory and request quotes.\n' +
            '2. You get job alerts on WhatsApp for your category and city.\n' +
            '3. Payments are held in escrow and released to you when the job is done.\n\n' +
            'Tip: share your profile link with past clients to build reviews quickly.\n\n' +
            '— The SkillConnect GH Team\n024 421 1595';

        return {
            ok: true,
            ref: appRef,
            proId: pro.id,
            name,
            link,
            channels: {
                wa: 'https://wa.me/' + intl + '?text=' + encodeURIComponent(waMsg),
                sms: 'sms:' + local + '?&body=' + encodeURIComponent(smsMsg),
                email: (app && app.email) ? 'mailto:' + app.email + '?subject=' + encodeURIComponent('You are verified on SkillConnect GH 🎉') + '&body=' + encodeURIComponent(mailBody) : null
            }
        };
    }

    function reviewApplication(appId, decision, note, edits) {
        const d = load();
        const app = d.applications.find(a => a.id === appId);
        if (!app) return null;
        app.status = decision;
        app.reviewedAt = Date.now();
        app.reviewNote = note || '';
        // Admin corrections (rate/city/category) applied before the pro record is
        // created; original values are kept on the application for the audit trail.
        if (decision === 'verified' && edits && typeof edits === 'object') {
            const e = {};
            if (edits.rate !== undefined && Number(edits.rate) > 0 && Number(edits.rate) !== Number(app.rate)) { e.rate = app.rate; app.rate = Number(edits.rate); }
            if (typeof edits.city === 'string' && edits.city.trim() && edits.city.trim() !== app.city) { e.city = app.city; app.city = edits.city.trim(); }
            if (edits.cat && CAT_LABELS[edits.cat] && edits.cat !== app.cat) { e.cat = app.cat; app.cat = edits.cat; }
            if (Object.keys(e).length) { app.editedFields = e; app.editedAt = Date.now(); }
        }
        if (decision === 'verified') {
            const id = 'P' + String(1001 + d.pros.length);
            d.pros.push({
                id,
                name: app.name, short: app.name.split(' ')[0], cat: app.cat,
                role: CAT_LABELS[app.cat] || app.cat, city: app.city,
                rating: 0, ratingCount: 0, bookings: 0,
                price: Number(app.rate) || 100, unit: app.unit || 'visit',
                note: (app.spec || 'New professional') + ' · New on SkillConnect',
                phone: app.phone, verified: true, emergency: app.emergency === 'yes',
                response: app.response || 'sameday', years: app.years || '0-2',
                languages: app.languages || ['English'], desc: app.desc || '',
                // verification documents (Ghana Card front/back + TIN), kept for audit
                idType: app.idType || 'ghana_card',
                idNumber: app.idNumber || '',
                tin: app.tin || '',
                idDocsReceived: !!(app.idFrontName && app.idBackName),
                idFrontName: app.idFrontName || '',
                idBackName: app.idBackName || '',
                earnings: 0, commissionPaid: 0, balance: 0,
                blocked: [], joinedAt: Date.now(), source: 'registration', appId: app.id
            });
            notify('customer', app.id, 'application', 'You are VERIFIED! Your profile is live: ' + SITE_URL + '/index.html?pro=' + id + ' — share your link to get booked faster.');
        } else {
            notify('customer', app.id, 'application', 'Application ' + app.id + ' was not approved. ' + (note || ''));
        }
        save();
        return app;
    }

    // ---------- Bookings & Matching ----------
    function createBooking(request) {
        const d = load();
        const booking = {
            id: nextId('booking'),
            name: request.name,
            phone: request.phone,
            cat: request.job || request.cat,
            date: request.date || '',
            location: request.location,
            budget: request.budget || '',
            urgency: request.urgency || 'planned',
            details: request.details || '',
            status: 'matching',           // matching | quoted | booked | in_progress | completed | disputed | cancelled
            matchedProIds: [],
            chosenProId: null,
            amount: 0,                     // agreed job amount once booked
            createdAt: Date.now(),
            events: [{ at: Date.now(), text: 'Request received. Searching verified pros…' }]
        };

        // ---- Matching engine: category + near-first distance + availability + budget/urgency ranking ----
        const uInfo = URGENCY_INFO[booking.urgency] || URGENCY_INFO.planned;
        const range = (CATEGORY_INFO[booking.cat] || { range: [0, 99999999] }).range;
        const budgetN = Number(booking.budget) || 0;

        // Budget rule: a stated budget is a hard ceiling — only pros whose
        // service charge sits within budget are invited to quote.
        const inRange = (p) => !budgetN || (p.price >= range[0] * 0.5 && p.price <= budgetN);

        const pool = d.pros.filter(p => p.verified && p.cat === booking.cat && gateKeep(p) && inRange(p));
        const dayOk = (p) => {
            if (!booking.date) return true;
            return !(p.blocked || []).includes(booking.date);
        };

        let matched;
        if (request.proId) {
            // Pro-card request: invite only the requested pro (within-budget
            // requests land directly on them; anything else falls through to
            // the calm no-match path below).
            const pref = pool.find(p => p.id === request.proId);
            matched = pref ? [pref] : [];
        } else {
            // Near-first: fill from the closest distance tier outward so a
            // 250 km pro is only invited when nobody nearer is available.
            matched = matchNearFirst(pool.filter(dayOk), booking.location, 100);
            if (booking.urgency === 'urgent') {
                const em = matched.filter(p => p.emergency);
                if (em.length >= 1) matched = em.concat(matched.filter(p => !p.emergency));
            }
            matched = matched.slice(0, 3);
        }
        booking.matchedProIds = matched.map(p => p.id);
        booking.slaHours = uInfo.slaHours;

        booking.events.push({
            at: Date.now(),
            text: matched.length
                ? 'Matched with ' + matched.length + ' verified pro' + (matched.length > 1 ? 's' : '') + ' — quotes requested (SLA ' + (uInfo.slaHours < 1 ? '30 minutes' : uInfo.slaHours + ' hours') + ').'
                : 'No verified pro available within a GH₵ ' + Number(budgetN).toLocaleString() + ' budget right now. Your request is saved (Ref ' + booking.id + ') — our team will search manually and reach out, or you can raise your budget on the Track page to widen the match.'
        });
        if (!matched.length && budgetN > 0) {
            notify('customer', booking.id, 'booking', 'Booking ' + booking.id + ': no verified pro matched your GH₵ ' + Number(budgetN).toLocaleString() + ' budget yet. Our team has your request for manual search — we will reach out shortly. You can also raise your budget on the Track page to see more pros.');
            notify('admin', booking.id, 'booking', 'Manual search needed: ' + booking.id + ' (' + (CAT_LABELS[booking.cat] || booking.cat) + ', GH₵ ' + Number(budgetN).toLocaleString() + ' budget) matched no verified pro — assign one or contact the customer.');
        }

        d.bookings.unshift(booking);

        // Auto-generate quotes from matched pros (simulated pro responses)
        matched.forEach((p, i) => {
            const jitter = [1, 1.12, 0.92][i % 3];
            let price = Math.round(p.price * jitter);
            if (!request.proId && budgetN > 0 && price > budgetN) price = budgetN;   // quotes never exceed the customer's budget (direct pro requests keep the pro's real rate)
            addQuoteInternal(d, booking.id, p.id, price, (booking.urgency === 'urgent' ? 10 : 25 + i * 35) * 60000);
        });

        const statusAfter = booking.quotesCount > 0 ? 'quoted' : booking.status;
        notify('customer', booking.id, 'booking', 'Booking ' + booking.id + ': ' + booking.matchedProIds.length + ' pros invited to quote. Track it on the Track Booking page.');
        notify('admin', booking.id, 'booking', 'New ' + (booking.urgency === 'urgent' ? 'EMERGENCY ' : '') + 'booking ' + booking.id + ' — ' + (CAT_LABELS[booking.cat] || booking.cat) + ' in ' + booking.location);
        save();
        rememberDeviceRef(booking.id);   /* bookings.html "on this device" list */
        return booking;
    }

    function addQuoteInternal(d, bookingId, proId, price, etaMs) {
        const booking = d.bookings.find(b => b.id === bookingId);
        if (!booking) return null;
        const quote = {
            id: nextId('quote'),
            bookingId, proId,
            price,
            etaHours: booking.urgency === 'urgent' ? 1 : 24,
            message: 'Available for this job. Price covers scope discussed; parts/transport confirmed on chat.',
            status: 'sent',               // sent | accepted | declined | expired
            createdAt: Date.now(),
            etaAt: Date.now() + (etaMs || 0)
        };
        d.quotes.push(quote);
        if (booking.status === 'matching') booking.status = 'quoted';
        booking.events.push({ at: Date.now(), text: 'Quote ' + cedi(price) + ' received from ' + (d.pros.find(p => p.id === proId) || {}).name });
        notify('customer', bookingId, 'quote', 'New quote ' + cedi(price) + ' on booking ' + bookingId);
        return quote;
    }

    function getBooking(id) { return load().bookings.find(b => b.id === id) || null; }

    function getBookingsFor(phone) {
        const p = (phone || '').replace(/\s|-/g, '');
        if (!p) return [];
        return load().bookings.filter(b => b.phone.replace(/\s|-/g, '').endsWith(p.slice(-9)));
    }

    function getQuotesFor(bookingId) {
        return load().quotes.filter(q => q.bookingId === bookingId && q.status !== 'expired');
    }

    function acceptQuote(quoteId) {
        const d = load();
        const q = d.quotes.find(x => x.id === quoteId);
        if (!q || q.status !== 'sent') return null;
        const booking = d.bookings.find(b => b.id === q.bookingId);
        const pro = d.pros.find(p => p.id === q.proId);
        if (!booking || !pro) return null;

        q.status = 'accepted';
        d.quotes.forEach(o => { if (o.bookingId === q.bookingId && o.id !== q.id && o.status === 'sent') o.status = 'declined'; });
        booking.chosenProId = pro.id;
        booking.amount = q.price;
        booking.status = 'booked';
        booking.events.push({ at: Date.now(), text: 'Quote accepted — ' + pro.name + ' booked for ' + cedi(q.price) + '. Awaiting escrow payment.' });

        notify('pro', pro.id, 'job', 'BOOKED! ' + booking.id + ' — ' + (CAT_LABELS[booking.cat] || '') + ' on ' + (booking.date ? fmtDate(booking.date) : 'flexible date') + ' in ' + booking.location + '. ' + cedi(q.price) + ' (escrow)');
        notify('admin', booking.id, 'booking', 'Quote ' + q.id + ' accepted on ' + booking.id + ' by ' + pro.name);
        save();
        return q;
    }

    function setBookingStatus(bookingId, status, eventText) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        if (!b) return null;
        b.status = status;
        if (eventText) b.events.push({ at: Date.now(), text: eventText });
        save();
        return b;
    }

    // ---------- Cancellation analytics (admin Overview) ----------
    // Latest cancellation per cancelled booking: {id, ref, cat, location, reason, cancelledAt, rebookedAs}
    function cancellationSummary() {
        const d = load();
        return d.bookings
            .filter(b => b.status === 'cancelled')
            .map(b => {
                const cancels = b.events.filter(e => (e.text || '').indexOf('Cancelled by customer') === 0);
                const last = cancels[cancels.length - 1] || null;
                if (!last) return null;
                const m = (last.text || '').match(/^Cancelled by customer(?: — "([^"]*)")?/);
                const dm = (last.text || '').match(/(\d+) pending quote\(s\) declined/);
                const rebook = b.events.map(e => (e.text || '').match(/rebooked this request as (SC-BK-\d+)/i)).filter(Boolean);
                return {
                    ref: b.id,
                    cat: b.cat,
                    location: b.location,
                    budget: b.budget || 0,
                    reason: (m && m[1]) ? m[1].trim() : '',
                    hadQuotes: d.quotes.some(q => q.bookingId === b.id),
                    quotesDeclined: dm ? Number(dm[1]) : 0,
                    cancelledAt: last.at,
                    rebookedAs: rebook.length ? rebook[rebook.length - 1][1] : null
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.cancelledAt - a.cancelledAt)
            .slice(0, 8);
    }

    // ---------- Cancellation (customer-initiated, pre-booking only) ----------
    // Customers may cancel while the request is still 'matching' or 'quoted'
    // — i.e. before a pro is booked and money moves into escrow. Any pending
    // quotes are declined so the pros stop waiting on a dead request.
    function cancelBooking(bookingId, reason) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        if (!b) return { ok: false, error: 'Booking not found.' };
        if (!['matching', 'quoted'].includes(b.status))
            return { ok: false, error: 'This request is already booked' + (b.escrow && !b.escrow.released ? ' and paid into escrow' : '') + ' — open it on the tracking page to manage it there.' };

        let notifiedPros = 0;
        d.quotes.forEach(q => {
            if (q.bookingId === bookingId && q.status === 'sent') {
                q.status = 'declined';
                notify('pro', q.proId, 'booking', 'Request ' + bookingId + ' was cancelled by the customer before booking — no action needed.');
                notifiedPros++;
            }
        });

        setBookingStatus(bookingId, 'cancelled', 'Cancelled by customer' + (reason ? ' — "' + reason + '"' : '') + (notifiedPros ? '. ' + notifiedPros + ' pending quote(s) declined.' : ''));
        notify('customer', bookingId, 'booking', 'Booking ' + bookingId + ' cancelled. You can post a new request any time.');
        notify('admin', bookingId, 'booking', 'Customer cancelled ' + bookingId + ' (' + (CAT_LABELS[b.cat] || b.cat) + ', ' + b.location + ')' + (reason ? ': ' + reason : '') + '.');
        return { ok: true, declinedQuotes: notifiedPros };
    }

    // ---------- Budget raise: re-run matching with a higher ceiling ----------
    // Customer action from the track page on a request that has not been
    // booked yet. Only raising is allowed (lowering narrows, not widens).
    // Pros already invited stay invited; only newcomers get fresh quotes.
    function updateBookingBudget(bookingId, newBudget) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        if (!b) return { ok: false, error: 'Booking not found.' };
        if (!['matching', 'quoted'].includes(b.status))
            return { ok: false, error: 'Only requests that are not yet booked can be re-matched — open it on the tracking page to manage it there.' };
        const nb = Number(newBudget);
        if (!nb || nb <= 0) return { ok: false, error: 'Enter a valid budget amount.' };
        const oldBudget = Number(b.budget) || 0;
        if (oldBudget && nb <= oldBudget)
            return { ok: false, error: 'Raise your budget above GH\u20B5 ' + Number(oldBudget).toLocaleString() + ' to widen the match \u2014 lowering it would narrow, not widen, the search.' };
        b.budget = nb;

        // Re-run the same near-first match rules as createBooking with the new ceiling.
        const uInfo = URGENCY_INFO[b.urgency] || URGENCY_INFO.planned;
        const range = (CATEGORY_INFO[b.cat] || { range: [0, 99999999] }).range;
        const inRange = (p) => p.price >= range[0] * 0.5 && p.price <= nb;
        const pool = d.pros.filter(p => p.verified && p.cat === b.cat && gateKeep(p) && inRange(p));
        const dayOk = (p) => !b.date || !(p.blocked || []).includes(b.date);

        let matched = matchNearFirst(pool.filter(dayOk), b.location, 3);
        if (b.urgency === 'urgent') {
            const em = matched.filter(p => p.emergency);
            if (em.length >= 1) matched = em.concat(matched.filter(p => !p.emergency));
        }
        matched = matched.slice(0, 3);
        const prevIds = (b.matchedProIds || []).slice();
        b.matchedProIds = matched.map(p => p.id);
        b.slaHours = uInfo.slaHours;
        const added = b.matchedProIds.filter(id => !prevIds.includes(id));

        b.events.push({
            at: Date.now(),
            text: matched.length
                ? 'Budget raised to GH\u20B5 ' + Number(nb).toLocaleString() + ' \u2014 re-matched with ' + matched.length + ' verified pro' + (matched.length > 1 ? 's' : '') + (added.length ? ' (' + added.length + ' new invite' + (added.length > 1 ? 's' : '') + ')' : '') + '. Quotes requested.'
                : 'Budget raised to GH\u20B5 ' + Number(nb).toLocaleString() + ' \u2014 still no verified pro within budget. Our team will search manually and reach out.'
        });
        if (matched.length) {
            notify('customer', bookingId, 'booking', 'Booking ' + bookingId + ': budget raised to GH\u20B5 ' + Number(nb).toLocaleString() + ' \u2014 ' + matched.length + ' pro' + (matched.length > 1 ? 's' : '') + ' invited to quote.');
        } else {
            notify('customer', bookingId, 'booking', 'Booking ' + bookingId + ': budget raised to GH\u20B5 ' + Number(nb).toLocaleString() + ' but no pro matches yet. Our manual search continues.');
        }
        notify('admin', bookingId, 'booking', 'Customer raised budget on ' + bookingId + ' to GH\u20B5 ' + Number(nb).toLocaleString() + (added.length ? ' \u2014 ' + added.length + ' new pro(s) invited.' : ' \u2014 no new matches.'));

        // Simulated quotes for newly invited pros only.
        if (added.length) {
            let i = 0;
            matched.forEach(p => {
                if (!added.includes(p.id)) return;
                const jitter = [1, 1.12, 0.92][i % 3];
                let price = Math.round(p.price * jitter);
                if (price > nb) price = nb;
                addQuoteInternal(d, bookingId, p.id, price, (b.urgency === 'urgent' ? 10 : 25 + i * 35) * 60000);
                i++;
            });
        }
        save();
        return { ok: true, booking: b, addedCount: added.length };
    }

    // ---------- One-tap rebook: clone a cancelled request into a fresh one ----------
    // Copies the request details (who/what/where/when/budget/urgency), re-runs
    // matching and quote invites exactly like a new request, and cross-links
    // both bookings in their event trails.
    function rebookFrom(bookingId) {
        const d = load();
        const old = d.bookings.find(x => x.id === bookingId);
        if (!old) return { ok: false, error: 'Booking not found.' };
        if (old.status !== 'cancelled') return { ok: false, error: 'Only cancelled requests can be rebooked.' };
        // createBooking returns the booking object itself (not a wrapped result)
        const nb = createBooking({
            name: old.name, phone: old.phone, cat: old.cat, date: old.date,
            location: old.location, budget: old.budget, urgency: old.urgency, details: old.details
        });
        if (!nb || !nb.id) return { ok: false, error: 'Could not create the new request — try again in a moment.' };
        nb.events.push({ at: Date.now(), text: 'Rebooked from ' + old.id + ' — same request details, fresh matching run.' });
        old.events.push({ at: Date.now(), text: 'Customer rebooked this request as ' + nb.id + '.' });
        save();
        return { ok: true, booking: nb, fromId: old.id };
    }

    // ---------- Escrow ----------
    function payIntoEscrow(bookingId, method, momoNumber) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        if (!b || b.status !== 'booked' || !b.amount) return { ok: false, error: 'Booking is not awaiting payment.' };
        if (b.escrow && !b.escrow.released) return { ok: false, error: 'This booking is already funded — escrow is holding your payment.' };
        const pro = d.pros.find(p => p.id === b.chosenProId);
        if (!pro) return { ok: false, error: 'Chosen professional not found.' };

        b.status = 'in_progress';
        b.escrow = {
            method: method || 'momo',
            paidAt: Date.now(),
            amount: b.amount,
            released: false,
            txnRef: 'ESC-' + Math.random().toString(36).slice(2, 8).toUpperCase()
        };
        b.events.push({ at: Date.now(), text: 'Payment ' + cedi(b.amount) + ' held in escrow (' + b.escrow.txnRef + '). ' + pro.name + ' notified to start.' });
        notify('pro', pro.id, 'escrow', 'Escrow funded for ' + b.id + ' (' + cedi(b.amount) + '). You can start the job — funds release after customer approval.');
        notify('admin', b.id, 'escrow', 'Escrow ' + b.escrow.txnRef + ' funded ' + cedi(b.amount) + ' on ' + b.id);
        save();
        return { ok: true, txnRef: b.escrow.txnRef, booking: b };
    }

    function releaseEscrow(bookingId) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        if (!b || !b.escrow || b.escrow.released) return { ok: false, error: 'Nothing to release.' };
        const pro = d.pros.find(p => p.id === b.chosenProId);
        if (!pro) return { ok: false, error: 'Professional not found.' };

        b.escrow.released = true;
        b.escrow.releasedAt = Date.now();
        b.status = 'completed';
        b.paidAt = Date.now();          // customer payment completed (escrow released = service paid)
        const rate = commissionRateLocal();
        const commission = Math.round(b.amount * rate);
        pro.balance = (pro.balance || 0) + (b.amount - commission);
        pro.earnings = (pro.earnings || 0) + (b.amount - commission);
        pro.commissionPaid = (pro.commissionPaid || 0) + commission;
        pro.bookings = (pro.bookings || 0) + 1;
        b.commission = commission;
        // ledger entries (additive bookkeeping — flow unchanged)
        addTxn(d, 'service_payment', b.id, pro.id, b.amount, (b.escrow.method || 'momo'), 'Customer payment for ' + b.id + ' — ' + pro.name);
        addTxn(d, 'commission', b.id, pro.id, commission, 'platform', 'Platform commission (' + Math.round(rate * 100) + '%) on ' + b.id);
        b.events.push({ at: Date.now(), text: 'Job approved. ' + cedi(b.amount - commission) + ' released to ' + pro.name + ' (commission ' + cedi(commission) + ').' });
        notify('pro', pro.id, 'escrow', cedi(b.amount - commission) + ' released to your wallet from ' + b.id + '. Rate the customer experience!');
        notify('admin', b.id, 'escrow', 'Escrow released on ' + b.id + ' — commission ' + cedi(commission));
        save();
        return { ok: true, booking: b, commission };
    }

    // ---------- Disputes ----------
    function openDispute(bookingId, reason, details) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        if (!b) return { ok: false, error: 'Booking not found.' };
        if (!b.escrow || b.escrow.released) return { ok: false, error: 'Escrow already released or never funded — contact support.' };

        const dispute = {
            id: nextId('dispute'),
            bookingId,
            reason: reason || 'other',
            details: details || '',
            status: 'open',               // open | resolved_refund | resolved_rematch | resolved_release
            openedAt: Date.now()
        };
        d.disputes.unshift(dispute);
        b.status = 'disputed';
        b.events.push({ at: Date.now(), text: 'Dispute opened (' + dispute.id + '): ' + reason + '. Escrow frozen pending resolution.' });
        notify('admin', dispute.id, 'dispute', 'DISPUTE ' + dispute.id + ' on ' + bookingId + ': ' + reason);
        notify('pro', b.chosenProId, 'dispute', 'Dispute opened on ' + bookingId + '. Our resolution team will contact you.');
        save();
        return { ok: true, dispute };
    }

    function getDisputes() { return load().disputes; }

    function resolveDispute(disputeId, resolution, note) {
        const d = load();
        const ds = d.disputes.find(x => x.id === disputeId);
        if (!ds || ds.status !== 'open') return null;
        const b = d.bookings.find(x => x.id === ds.bookingId);
        ds.status = resolution;
        ds.resolvedAt = Date.now();
        ds.note = note || '';

        if (b) {
            if (resolution === 'resolved_refund') {
                if (b.escrow) b.escrow.released = true; // refund: money leaves escrow back to customer
                b.status = 'cancelled';
                b.events.push({ at: Date.now(), text: 'Dispute resolved: REFUND to customer. ' + (note || '') });
                notify('customer', b.id, 'dispute', 'Your dispute was resolved with a full refund.');
            } else if (resolution === 'resolved_rematch') {
                // Escrow stays HELD — it transfers to the replacement pro once
                // the customer picks one (customerRematchPick). No money leaves
                // the platform, and the customer never re-pays.
                const disputedProId = b.chosenProId;
                b.status = 'matching';
                b.chosenProId = null;
                b.rematchPick = true;
                b.rematchExclude = disputedProId || null;
                b.matchedProIds = [];
                // re-run matching excluding the disputed pro
                const pool = d.pros.filter(p => p.verified && p.cat === b.cat && p.id !== disputedProId);
                const fresh = pool.filter(p => !(p.blocked || []).includes(b.date)).slice(0, 3);
                b.matchedProIds = fresh.map(p => p.id);
                fresh.forEach((p, i) => addQuoteInternal(d, b.id, p.id, Math.round(p.price * [1, 1.1, 0.94][i % 3]), (20 + i * 30) * 60000));
                b.events.push({ at: Date.now(), text: 'Dispute resolved: REMATCH. ' + fresh.length + ' replacement pros invited — customer picks from the tracking page.' });
                notify('customer', b.id, 'dispute', 'Rematch started — open your booking to pick a replacement pro. Your money stays held in escrow.');
                notify('admin', b.id, 'dispute', 'Rematch for ' + b.id + ' — waiting for the customer to pick a replacement pro.');
            } else {
                // resolved_release — pay the pro anyway
                if (b.escrow && !b.escrow.released) {
                    const pro = d.pros.find(p => p.id === b.chosenProId);
                    if (pro) {
                        b.escrow.released = true;
                        const commission = Math.round(b.amount * commissionRateLocal());
                        pro.balance = (pro.balance || 0) + (b.amount - commission);
                        pro.commissionPaid = (pro.commissionPaid || 0) + commission;
                        pro.bookings = (pro.bookings || 0) + 1;
                    }
                    b.status = 'completed';
                }
                b.events.push({ at: Date.now(), text: 'Dispute resolved: RELEASED to professional. ' + (note || '') });
            }
        }
        save();
        return ds;
    }

    // ---------- Rematch: customer picks the replacement pro ----------
    // Options = verified same-category pros (excluding the disputed one),
    // free on the booking date, with the quoted price when an invite exists.
    // Powers the customer-facing action sheet on track.html.
    function customerRematchOptions(bookingId) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        // waiting states: matching, or quoted (an auto-invite flips status inside addQuoteInternal)
        if (!b || !b.rematchPick || !['matching', 'quoted'].includes(b.status)) return [];
        const quoted = {};
        d.quotes.forEach(q => { if (q.bookingId === bookingId && q.status === 'sent') quoted[q.proId] = q.price; });
        return d.pros
            .filter(p => p.verified && p.cat === b.cat && p.id !== b.rematchExclude)
            .filter(p => !(p.blocked || []).includes(b.date))
            .map(p => ({ id: p.id, name: p.name, city: p.city, rating: p.rating, ratingCount: p.ratingCount || 0, price: quoted[p.id] || p.price, quoted: !!quoted[p.id] }))
            .sort((x, y) => (y.rating - x.rating) || (y.ratingCount - x.ratingCount))
            .slice(0, 6);
    }

    function customerRematchPick(bookingId, proId) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        const p = d.pros.find(x => x.id === proId);
        if (!b || !p) return { ok: false, error: 'Booking or professional not found.' };
        if (!b.rematchPick || !['matching', 'quoted'].includes(b.status)) return { ok: false, error: 'This booking is not waiting for a rematch pick.' };
        if (proId === b.rematchExclude) return { ok: false, error: 'That is the disputed professional — please pick someone else.' };
        if ((p.blocked || []).includes(b.date)) return { ok: false, error: p.name + ' is not free on ' + (b.date || 'the chosen date') + '.' };
        const r = reassignBooking(bookingId, proId);   // transfers escrow, re-prices, notifies everyone
        if (!r.ok) return r;
        b.rematchPick = false;
        // Escrow was already funded before the dispute — the job is effectively
        // underway with the replacement. in_progress unlocks the release/dispute UI.
        b.status = 'in_progress';
        b.events.push({ at: Date.now(), text: 'Customer picked ' + p.name + ' as the replacement — escrow transferred, no re-payment needed.' });
        save();
        return { ok: true, booking: b, pro: { id: p.id, name: p.name } };
    }

    // ---------- Reviews ----------
    function addReview(bookingId, rating, text) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        if (!b || !b.chosenProId || b.status !== 'completed') return { ok: false, error: 'You can review after the job is completed.' };
        if (d.reviews.some(r => r.bookingId === bookingId)) return { ok: false, error: 'Already reviewed this booking.' };
        const pro = d.pros.find(p => p.id === b.chosenProId);
        if (!pro) return { ok: false, error: 'Pro not found.' };

        const review = { id: nextId('review'), bookingId, proId: pro.id, by: b.name || 'Verified Customer', rating: Math.max(1, Math.min(5, Number(rating) || 5)), text: text || '', at: Date.now() };
        d.reviews.push(review);
        const total = pro.rating * pro.ratingCount + review.rating;
        pro.ratingCount = (pro.ratingCount || 0) + 1;
        pro.rating = Math.round((total / pro.ratingCount) * 10) / 10;
        b.reviewed = true;
        notify('pro', pro.id, 'review', 'New ' + review.rating + '★ review on ' + bookingId + (text ? ': “' + text.slice(0, 60) + '”' : ''));
        save();
        return { ok: true, review };
    }

    function getReviewsFor(proId) {
        return load().reviews.filter(r => r.proId === proId).slice().reverse();
    }

    // ---------- Chat ----------
    function chatMessages(bookingId) {
        const d = load();
        return d.chat[bookingId] || [];
    }

    function sendChat(bookingId, from, text) {
        const d = load();
        if (!d.chat[bookingId]) d.chat[bookingId] = [];
        d.chat[bookingId].push({ from, text, at: Date.now() });
        save();
        return d.chat[bookingId];
    }

    function systemChat(bookingId, text) {
        return sendChat(bookingId, 'system', text);
    }

    // ---------- Pro dashboard ----------
    function proBookings(proId) {
        const d = load();
        return d.bookings.filter(b => b.matchedProIds.includes(proId) || b.chosenProId === proId)
            .map(b => {
                const quote = d.quotes.find(q => q.bookingId === b.id && q.proId === proId);
                return { booking: b, quote: quote || null };
            });
    }

    function proRespondQuote(quoteId, action, price, message) {
        const d = load();
        const q = d.quotes.find(x => x.id === quoteId);
        if (!q) return null;
        if (action === 'decline') {
            q.status = 'declined';
        } else {
            if (price) q.price = Number(price);
            if (message) q.message = message;
            q.status = 'sent';
        }
        save();
        return q;
    }

    function toggleProDate(proId, isoDate) {
        const d = load();
        const pro = d.pros.find(p => p.id === proId);
        if (!pro || !isoDate) return pro;
        pro.blocked = pro.blocked || [];
        const i = pro.blocked.indexOf(isoDate);
        if (i === -1) pro.blocked.push(isoDate); else pro.blocked.splice(i, 1);
        save();
        return pro;
    }

    function updateProProfile(proId, patch) {
        const d = load();
        const pro = d.pros.find(p => p.id === proId);
        if (!pro) return null;
        Object.assign(pro, patch);
        save();
        return pro;
    }

    /* Notification preference center (pro) — sandbox parity with the
       server's notificationPrefsGet/Set. Muting is scoped to MUTABLE
       types; the critical set is enforced inside notify() and can never
       be stored. */
    function notificationPrefsGet(proId) {
        const d = load();
        const p = d.pros.find(x => x.id === proId);
        if (!p) return { ok: false, error: 'Professional not found.' };
        return {
            ok: true,
            muted: (p.notifyMutedTypes || []).filter(t => NOTIFY_MUTABLE_TYPES.includes(t)),
            critical: NOTIFY_CRITICAL_TYPES.slice(),
            mutable: NOTIFY_MUTABLE_TYPES.slice()
        };
    }

    function notificationPrefsSet(proId, mutedTypes) {
        const d = load();
        const p = d.pros.find(x => x.id === proId);
        if (!p) return { ok: false, error: 'Professional not found.' };
        const muted = (Array.isArray(mutedTypes) ? mutedTypes : []).map(String)
            .filter(t => NOTIFY_MUTABLE_TYPES.includes(t));
        const rejected = (Array.isArray(mutedTypes) ? mutedTypes.map(String) : [])
            .filter(t => !NOTIFY_MUTABLE_TYPES.includes(t));
        p.notifyMutedTypes = [...new Set(muted)];
        save();
        return { ok: true, muted: p.notifyMutedTypes, rejected: [...new Set(rejected)] };
    }    // ---------- travel-distance helpers (near-first matching; parity with sc-api.js) ----------
    // Approximate road-km between service hubs; the customer's free-text
    // location is scanned for the nearest known place (aliases folded in).
    const HUBS = {
        'accra': 0, 'osu': 5, 'labone': 6, 'east legon': 12, 'airport residential': 8, 'cantonments': 7,
        'madina': 16, 'tema': 27, 'kasoa': 33, 'amosa': 33, 'kumasi': 253, 'takoradi': 226, 'cape coast': 138
    };
    const HUB_ALIASES = [
        ['tema comm', 'tema'], ['tema community', 'tema'], ['ashaiman', 'tema'],
        ['airport city', 'airport residential'], ['airport hills', 'airport residential']
    ];

    function locationKm(location) {
        const s = String(location || '').toLowerCase();
        for (const [alias, canonical] of HUB_ALIASES) {
            if (s.includes(alias)) return HUBS[canonical];
        }
        let best = null;
        for (const place of Object.keys(HUBS)) {
            if (s.includes(place)) {
                const d = HUBS[place];
                if (best === null || d < best) best = d;
            }
        }
        return best;   // null = unknown location: distance plays no part
    }

    function proKm(p, baseKm) {
        if (baseKm === null || baseKm === undefined) return null;
        const hub = HUBS[String(p.city || '').toLowerCase()];
        return hub === undefined ? null : Math.abs(hub - baseKm);
    }

    function kmTier(km) {
        if (km === null) return 'near';
        if (km <= 35) return 'near';
        if (km <= 120) return 'mid';
        return 'far';
    }

    // Near-first fill: near (≤35km) → mid (≤120km) → far → unknown-distance
    // remainder, ranked by distance then response speed, rating, bookings.
    // Never a hard wall: a far pro still beats an empty invite list.
    function matchNearFirst(pool, location, maxMatches) {
        const base = locationKm(location);
        const withKm = pool.map(p => ({ p, km: proKm(p, base) }));
        const tierOf = e => kmTier(e.km);
        const rank = { near: 0, mid: 1, far: 2 };
        const respRank = { '1hr': 0, '3hr': 1, 'sameday': 2, '24hr': 3 };
        withKm.sort((x, y) => {
            const tx = tierOf(x), ty = tierOf(y);
            const rx = rank[tx], ry = rank[ty];
            if (rx !== ry) return rx - ry;
            if (tx === 'near' || tx === 'mid') return (x.km - y.km) || ((respRank[x.p.response] ?? 2) - (respRank[y.p.response] ?? 2)) || (y.p.rating - x.p.rating) || (y.p.bookings - x.p.bookings);
            if (tx === 'far') return (x.km - y.km) || ((respRank[x.p.response] ?? 2) - (respRank[y.p.response] ?? 2)) || (y.p.rating - x.p.rating);
            return ((respRank[x.p.response] ?? 2) - (respRank[y.p.response] ?? 2)) || (y.p.rating - x.p.rating) || (y.p.bookings - x.p.bookings);
        });
        return withKm.slice(0, maxMatches).map(e => e.p);
    }

    // ---------- ID re-verification ----------
    /* Live commission rate: the Platform Settings card writes the
       commission_rate setting; applied at each release (future-only —
       completed bookings keep their captured commission). */
    function commissionRateLocal() {
        const r = pub.SETTINGS && Number(pub.SETTINGS.commission_rate);
        return (r > 0 && r <= 0.5) ? r : COMMISSION_RATE;
    }

    // Ghana Cards are valid 5 years; pros must renew their documents when the
    // card expires. Status is computed from idVerifiedAt (set at onboarding)
    // plus an explicit idReverify workflow flag:
    //   'flagged' — admin requested fresh documents
    //   'pending' — pro uploaded new docs, awaiting admin approval
    const ID_VALID_MS_SEED = 5 * 365.25 * 86400000;
    const ID_WARN_MS_SEED = 60 * 86400000;   // amber warning 60 days before expiry
    /* Windows are admin-editable settings (Platform Settings card); fall back
       to the classic constants until the /api/settings boot fetch lands. */
    function idWindowsLocal() {
        const s = pub.SETTINGS || {};
        return {
            validMs: (Number(s.id_valid_years) > 0 ? Number(s.id_valid_years) : 5) * 365.25 * 86400000,
            warnMs: (Number(s.id_warn_days) >= 0 ? Number(s.id_warn_days) : 60) * 86400000
        };
    }

    function idStatus(p) {
        if (!p) return { state: 'missing', label: 'No documents' };
        if (p.idReverify === 'pending') return { state: 'pending', label: 'New docs under review' };
        if (p.idReverify === 'flagged') return { state: 'flagged', label: 'Docs requested' };
        if (!p.idDocsReceived) return { state: 'missing', label: 'No documents on file' };
        const ref = p.idVerifiedAt || 0;
        if (!ref) return { state: 'verified', label: 'Verified' };
        const age = Date.now() - ref;
        const W = idWindowsLocal();
        if (age >= W.validMs) return { state: 'expired', label: 'ID expired', expiredDays: Math.max(1, Math.floor((age - W.validMs) / 86400000)) };
        if (age >= W.validMs - W.warnMs) return { state: 'expiring', label: 'Expiring soon', daysLeft: Math.max(1, Math.floor((W.validMs - age) / 86400000)) };
        return { state: 'verified', label: 'Verified' };
    }

    // ---------- staged ID-renewal enforcement (parity with sc-api.js) ----------
    // Stages: expired (matched, profile notice) -> delisted at +14d
    // (hidden from NEW matches only). Money and live jobs are never touched. idGateUntil is an admin
    // time-override (0 = none) for edge cases like delayed NIA renewals.
    // Read lazily so the /api/settings boot fetch (arrives at IIFE end) is honoured.
    function idGateWindowsLocal() {
        return {
            soft: (pub.SETTINGS && Number(pub.SETTINGS.id_grace_days)) || 14
        };
    }

    function idGateSync(p) {
        const W = idGateWindowsLocal();
        const st = idStatus(p);
        if (st.state !== 'expired') return { stage: st.state };
        const expDays = st.expiredDays || 0;
        const overrideLeft = p.idGateUntil ? Math.ceil((p.idGateUntil - Date.now()) / 86400000) : 0;
        if (overrideLeft > 0) return { stage: 'expired', expiredDays: expDays, overrideDaysLeft: overrideLeft };
        if (expDays < W.soft) return { stage: 'expired', expiredDays: expDays, graceDaysLeft: W.soft - expDays };
        return { stage: 'delisted', expiredDays: expDays, delistDays: expDays - W.soft };
    }

    // Pool predicate: TRUE keeps the pro in NEW matching pools. Delisted
    // pros are excluded from NEW matching only.
    function gateKeep(p) { return idGateSync(p).stage !== 'delisted'; }

    function setIdGateOverride(proId, days) {
        const d = load();
        const p = d.pros.find(x => x.id === proId);
        if (!p) return { ok: false, error: 'Pro not found.' };
        const n = Math.max(0, Math.min(365, Math.floor(Number(days) || 0)));
        p.idGateUntil = n > 0 ? Date.now() + n * 86400000 : 0;
        if (n > 0) {
            notify('pro', proId, 'application', 'Good news: SkillConnect has extended your ID re-verification window by ' + n + ' day' + (n === 1 ? '' : 's') + ' — you remain fully listed while you complete your renewal.');
            notify('admin', proId, 'application', 'ID gate override: ' + p.name + ' (' + proId + ') exempt from delisting for ' + n + ' more day(s).');
        }
        save();
        return { ok: true, proId: proId, overrideDays: n, gate: idGateSync(p) };
    }

    function requestIdDocs(proId) {
        const d = load();
        const p = d.pros.find(x => x.id === proId);
        if (!p) return { ok: false, error: 'Pro not found.' };
        if (p.idReverify === 'flagged') return { ok: false, error: 'Documents already requested from this pro.' };
        p.idReverify = 'flagged';
        notify('pro', proId, 'dispute', 'ACTION NEEDED: your Ghana Card on file has expired (or is expiring). Upload fresh FRONT & BACK photos in your Pro Dashboard under Identity Check. After a ' + idGateWindowsLocal().soft + '-day grace period an expired card hides you from new customer requests — uploading sooner keeps you fully listed.');
        notify('admin', proId, 'application', 'Documents requested from ' + p.name + ' (' + proId + '). Waiting for their re-upload.');
        save();
        return { ok: true, pro: p };
    }

    function submitReverify(proId, frontData, backData) {
        const d = load();
        const p = d.pros.find(x => x.id === proId);
        if (!p) return { ok: false, error: 'Pro not found.' };
        if (!frontData || !backData || !frontData.startsWith('data:image') || !backData.startsWith('data:image'))
            return { ok: false, error: 'Please attach both the FRONT and BACK photos of your card.' };
        if (frontData.length > 150000 || backData.length > 150000)
            return { ok: false, error: 'One of the photos is too large after compression — try a smaller file.' };
        p.idFrontData = frontData;
        p.idBackData = backData;
        p.idFrontName = 'reupload-front.jpg';
        p.idBackName = 'reupload-back.jpg';
        p.idDocsReceived = true;
        p.idReverify = 'pending';
        p.idSubmittedAt = Date.now();
        notify('pro', proId, 'application', 'New Ghana Card photos received — our team will verify them shortly.');
        notify('admin', proId, 'application', 'RE-VERIFICATION: ' + p.name + ' (' + proId + ') uploaded new ID documents. Approve in the Workers tab.');
        save();
        return { ok: true };
    }

    function approveReverify(proId) {
        const d = load();
        const p = d.pros.find(x => x.id === proId);
        if (!p) return { ok: false, error: 'Pro not found.' };
        p.idVerifiedAt = Date.now();
        p.idReverify = '';
        delete p.idSubmittedAt;
        notify('pro', proId, 'application', 'Your renewed Ghana Card is verified — you are fully listed again. Next renewal in 5 years.');
        notify('admin', proId, 'application', 'Re-verification approved for ' + p.name + ' (' + proId + ').');
        save();
        return { ok: true };
    }

    /* ---------- payouts: controlled withdrawal workflow (sandbox parity) ----------
       Same rules as the server: money never moves at request time; pending
       requests reserve their amount; a batch process is the single debit.
       payoutPro keeps the historical name (dashboard + ussd call it). */
    const PAYOUT_MIN = 20;

    function payoutStatuses(d) {
        return (d.payoutRequests || []).filter(r => r.status === 'pending' || r.status === 'approved');
    }

    function requestPayout(proId, amount) {
        const d = load();
        const pro = d.pros.find(p => p.id === proId);
        if (!pro) return { ok: false, error: 'Pro not found.' };
        amount = Number(amount);
        if (!amount || amount <= 0) return { ok: false, error: 'Enter a valid amount.' };
        if (amount < PAYOUT_MIN) return { ok: false, error: 'Minimum withdrawal is ' + cedi(PAYOUT_MIN) + '.' };
        const pending = payoutStatuses(d).filter(r => r.proId === proId).reduce((s, r) => s + Number(r.amount), 0);
        if (pending + amount > (pro.balance || 0)) {
            return { ok: false, error: 'Amount exceeds your available balance. ' + (pending > 0 ? cedi(pending) + ' is already reserved by pending request(s) — ' : '') + 'available: ' + cedi((pro.balance || 0) - pending) + '.' };
        }
        const id = nextId('payout');
        (d.payoutRequests = d.payoutRequests || []).push({
            id, proId, amount, method: 'momo', status: 'pending', requestedAt: Date.now()
        });
        notify('admin', proId, 'payout', 'Withdrawal request ' + id + ': ' + cedi(amount) + ' to ' + pro.name + ' (MoMo ' + (pro.phone || 'n/a') + ') — awaiting approval.');
        save();
        return { ok: true, requestId: id, amount, pendingAmount: amount, availableBalance: Math.round(((pro.balance || 0) - pending - amount) * 100) / 100 };
    }

    const payoutPro = requestPayout;

    function cancelPayout(proId, requestId) {
        const d = load();
        const r = (d.payoutRequests || []).find(x => x.id === requestId);
        if (!r || r.proId !== proId) return { ok: false, error: 'Withdrawal request not found.' };
        if (r.status !== 'pending' || r.batchId) return { ok: false, error: 'Only requests that are still pending and not yet batched can be cancelled — contact support.' };
        r.status = 'cancelled'; r.processedAt = Date.now(); r.note = 'pro-cancelled';
        save();
        return { ok: true, requestId };
    }

    function myPayouts(proId) {
        const d = load();
        return (d.payoutRequests || []).filter(r => r.proId === proId)
            .slice().sort((a, b) => b.requestedAt - a.requestedAt);
    }

    function rejectPayout(requestId, note) {
        const d = load();
        const r = (d.payoutRequests || []).find(x => x.id === requestId);
        if (!r) return { ok: false, error: 'Withdrawal request not found.' };
        if (r.batchId) return { ok: false, error: 'This request is already in a payout batch — process or rebuild the batch instead.' };
        if (r.status !== 'pending' && r.status !== 'approved') return { ok: false, error: 'Only pending or approved requests can be rejected.' };
        r.status = 'rejected'; r.processedAt = Date.now(); r.note = String(note || 'admin-rejected').slice(0, 40);
        notify('pro', r.proId, 'payout', 'Withdrawal request ' + r.id + ' (' + cedi(r.amount) + ') was declined. ' + (note ? 'Reason: ' + note : 'Contact support for details.'));
        save();
        return { ok: true, requestId };
    }

    function approvePayouts(requestIds) {
        const d = load();
        const ids = Array.isArray(requestIds) ? requestIds : [requestIds];
        if (!ids.length) return { ok: false, error: 'No requests selected.' };
        let approved = 0;
        ids.forEach(id => {
            const r = (d.payoutRequests || []).find(x => x.id === id);
            if (!r || r.status !== 'pending' || r.batchId) return;
            r.status = 'approved';
            notify('pro', r.proId, 'payout', 'Withdrawal request ' + r.id + ' (' + cedi(r.amount) + ') approved — payment is being processed.');
            approved++;
        });
        save();
        return { ok: approved > 0, approved, requested: ids.length };
    }

    function createPayoutBatch(requestIds, note) {
        const d = load();
        const ids = Array.isArray(requestIds) ? requestIds : [requestIds];
        if (!ids.length) return { ok: false, error: 'No requests selected.' };
        const items = [];
        let total = 0;
        for (const id of ids) {
            const r = (d.payoutRequests || []).find(x => x.id === id);
            if (!r) return { ok: false, error: 'Unknown request ' + id + '.' };
            if ((r.status !== 'pending' && r.status !== 'approved') || r.batchId) {
                return { ok: false, error: 'Request ' + id + ' is not claimable (status: ' + r.status + (r.batchId ? ', already batched' : '') + ').' };
            }
            const pro = d.pros.find(p => p.id === r.proId);
            if (!pro) return { ok: false, error: 'Professional missing for ' + id + '.' };
            items.push({ r, pro });
            total += Number(r.amount);
        }
        d.counters.pbatch = (d.counters.pbatch || 0) + 1;
        const batchId = 'SC-PB-' + d.counters.pbatch;
        (d.payoutBatches = d.payoutBatches || []).unshift({ id: batchId, count: items.length, total: Math.round(total * 100) / 100, status: 'processing', note: String(note || '').slice(0, 255) || undefined, processedAt: Date.now() });
        items.forEach(it => { it.r.status = 'approved'; it.r.batchId = batchId; notify('pro', it.r.proId, 'payout', 'Withdrawal ' + it.r.id + ' (' + cedi(it.r.amount) + ') approved — payment is being processed.'); });
        save();
        return { ok: true, batchId, count: items.length, total: Math.round(total * 100) / 100, items: items.map(i => i.r.id) };
    }

    function processPayoutBatch(batchId, note) {
        const d = load();
        const batch = (d.payoutBatches || []).find(b => b.id === batchId);
        if (!batch) return { ok: false, error: 'Payout batch not found.' };
        if (batch.status === 'completed') return { ok: false, error: 'Batch ' + batchId + ' was already completed.' };
        const reqs = (d.payoutRequests || []).filter(r => r.batchId === batchId);
        if (!reqs.length) return { ok: false, error: 'Batch has no requests.' };
        /* pre-flight every balance — all-or-nothing, like the server */
        for (const r of reqs) {
            const p = d.pros.find(x => x.id === r.proId);
            if (!p) return { ok: false, error: 'Professional ' + r.proId + ' missing — batch aborted, nothing was paid.' };
            if ((p.balance || 0) < Number(r.amount)) return { ok: false, error: cedi(r.amount) + ' exceeds ' + p.name + "'s available balance (" + cedi(p.balance) + ') — batch aborted, nothing was paid. Reject the stale request and rebuild the batch.' };
        }
        let total = 0;
        reqs.forEach(r => {
            const p = d.pros.find(x => x.id === r.proId);
            p.balance = Math.round(((p.balance || 0) - Number(r.amount)) * 100) / 100;
            addTxn(d, 'payout', null, p.id, Number(r.amount), r.method || 'momo', 'Batch payout ' + batchId + ' (' + r.id + ') — ' + p.name);
            r.status = 'paid'; r.processedAt = Date.now(); r.note = batchId;
            notify('pro', p.id, 'payment', cedi(r.amount) + ' paid out (' + batchId + ') via ' + String(r.method || 'momo').toUpperCase() + '. New balance: ' + cedi(p.balance) + '.');
            total += Number(r.amount);
        });
        batch.status = 'completed'; batch.processedAt = Date.now(); if (note) batch.note = String(note).slice(0, 255);
        save();
        return { ok: true, batchId, paid: reqs.length, total: Math.round(total * 100) / 100 };
    }

    function payoutQueue() {
        const d = load();
        const claimable = (d.payoutRequests || []).filter(r => r.status === 'pending' || r.status === 'approved');
        const withPro = r => {
            const p = d.pros.find(x => x.id === r.proId);
            return Object.assign({}, r, { proName: p ? p.name : r.proId, proPhone: p ? (p.phone || '') : '', proBalance: p ? (p.balance || 0) : 0 });
        };
        return {
            pending: claimable.filter(r => r.status === 'pending').map(withPro),
            approved: claimable.filter(r => r.status === 'approved').map(withPro),
            batches: (d.payoutBatches || []).slice()
        };
    }

    // ---------- Profile: portfolio & reviews ----------
    const PORTFOLIO_CAPTIONS = {
        mc: ['Anchoring a traditional wedding in Accra', 'Corporate awards night stage', 'Outdoor concert crowd control', 'Engagement ceremony programme'],
        artist: ['Live band setup for a wedding', 'Festival main stage performance', 'Church worship concert', 'Acoustic session setup'],
        photographer: ['Traditional wedding portraits', 'Studio headshot session', 'Outdoor engagement shoot', 'Event coverage gallery'],
        videographer: ['Wedding highlight reel frame', 'Corporate promo shoot', 'Drone aerial coverage', 'Multi-cam concert setup'],
        dj: ['Wedding reception setup', 'Club night sound & lights', 'Outdoor stage rig with generator backup', 'Corporate party mixing'],
        caterer: ['Wedding buffet service', 'Chops & cocktails table', 'Full-course plated dinner', 'Birthday cake and dessert bar'],
        decorator: ['Traditional wedding entrance arch', 'Gold & white reception hall', 'Balloon & drapery stage design', 'Outdoor canopy setup'],
        handy: ['Home wiring project', 'AC installation job', 'Custom carpentry fitting', 'Plumbing repair callout']
    };

    // Returns the pro's portfolio entries [{url, caption}]. Synthesizes a
    // deterministic demo gallery for pros who have not uploaded one yet.
    function getPortfolio(proId) {
        const d = load();
        const pro = d.pros.find(p => p.id === proId);
        if (!pro) return [];
        if (Array.isArray(pro.portfolio) && pro.portfolio.length) return pro.portfolio;
        const caps = PORTFOLIO_CAPTIONS[pro.cat] || ['Project sample'];
        return caps.map((c, i) => ({
            url: 'https://picsum.photos/seed/' + pro.id + '-' + i + '/640/420',
            caption: c
        }));
    }

    // Replace a pro's portfolio with uploaded images [{url, caption}].
    // url may be a dataURL (compressed client-side by the dashboard) or an https URL.
    const PORTFOLIO_MAX = 8;
    const PORTFOLIO_MAX_URL_LEN = 300000;   // ~225KB per image after compression

    function setPortfolio(proId, items) {
        const d = load();
        const pro = d.pros.find(p => p.id === proId);
        if (!pro) return { ok: false, error: 'Pro not found.' };
        if (!Array.isArray(items)) return { ok: false, error: 'Invalid portfolio data.' };
        if (items.length > PORTFOLIO_MAX) return { ok: false, error: 'Maximum ' + PORTFOLIO_MAX + ' portfolio images.' };
        for (const it of items) {
            if (!it || typeof it.url !== 'string' || !it.url) return { ok: false, error: 'Each portfolio item needs an image.' };
            if (it.url.length > PORTFOLIO_MAX_URL_LEN) return { ok: false, error: 'One of the images is too large after compression — try a smaller photo.' };
            if (!/^(data:image\/(png|jpe?g|webp);base64,|https:\/\/)/.test(it.url)) return { ok: false, error: 'Images must be PNG, JPG or WebP.' };
            it.caption = String(it.caption || '').slice(0, 80);
        }
        pro.portfolio = items;
        pro.hasRealPortfolio = items.length > 0;
        save();
        return { ok: true, count: items.length, portfolio: pro.portfolio };
    }

    // ---------- Availability status ----------
    // Derived, never stored: 'available' (free today) | 'booked' (blocked today) | 'onrequest' (no calendar published)
    function proAvailability(pro) {
        const blocked = pro.blocked || [];
        if (blocked.includes(todayISO())) return 'booked';
        if (!blocked.length) return 'onrequest';
        return 'available';
    }

    // Date-aware availability: who is blocked on a given ISO date, who is free,
    // next date the (optionally specific) pro can take the job. "On request" pros
    // (no published calendar, blocked=[]) are never flagged as blocked.
    function dateAvailability(opts) {
        const d = load();
        const o = opts || {};
        const cat = o.cat || null;
        const date = o.date || null;
        const chosenId = o.proId || null;
        if (!date) return { ok: false, error: 'date required' };

        const pool = cat ? d.pros.filter(p => p.cat === cat) : d.pros.slice();
        const blockedOnDate = [], freeOnDate = [], suggested = [];
        let nextFreeDate = null;

        for (const p of pool) {
            const blocked = (p.blocked || []);
            if (!blocked.length) continue;                    // on-request: no published calendar
            const isBlocked = blocked.includes(date);
            if (p.id === chosenId) {
                if (isBlocked) blockedOnDate.unshift(p);      // chosen pro first in the warning
                else freeOnDate.unshift(p);
            } else if (isBlocked) {
                blockedOnDate.push(p);
            } else {
                freeOnDate.push(p);                          // rank free pros by rating
                suggested.push(p);
            }
        }
        suggested.sort((a, b) => (b.rating - a.rating) || (b.bookings - a.bookings));

        // Next free date search (chosen date..+30d): for a specific pro, the first
        // date they are not blocked; otherwise the first date any same-category pro
        // (with a published calendar) is free.
        const targets = chosenId ? d.pros.filter(p => p.id === chosenId) : pool.filter(p => (p.blocked || []).length);
        const today = todayISO();
        if (date >= today && targets.length) {
            outer:
            for (let off = 0; off <= 30; off++) {
                const dt = new Date(date + 'T00:00:00');
                dt.setDate(dt.getDate() + off);
                const iso = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
                for (const p of targets) {
                    if (!(p.blocked || []).includes(iso)) { nextFreeDate = iso; break outer; }
                }
            }
        }
        return { ok: true, date, dateKnown: blockedOnDate.length + freeOnDate.length > 0, blocked: blockedOnDate, free: freeOnDate, suggest: suggested.slice(0, 3), nextFreeDate };
    }

    function setAvailabilityStatus(proId, status) {
        const d = load();
        const pro = d.pros.find(p => p.id === proId);
        if (!pro) return { ok: false, error: 'Pro not found.' };
        const today = todayISO();
        pro.blocked = (pro.blocked || []).filter(x => x !== today);
        if (status === 'booked' && !pro.blocked.includes(today)) pro.blocked.push(today);
        if (status === 'onrequest') pro.blocked = [];
        save();
        return { ok: true, avail: proAvailability(pro) };
    }

    const AVAIL_META = {
        available: { label: 'Available Today', cls: 'avail-available', title: 'Free today — can accept new jobs immediately' },
        booked: { label: 'Booked', cls: 'avail-booked', title: 'Already booked today — check another date' },
        onrequest: { label: 'On Request', cls: 'avail-onrequest', title: 'Calendar not published — send a request to confirm' }
    };

    // ---------- Pro credentials (phone + OTP or password) ----------
    // Mirrors the admin credential pattern: secrets are stored ONLY as salted
    // SHA-256 hashes on the pro record (pro.auth). New/seeded pros start with
    // the default password 'skillconnect' until they set their own; OTPs are
    // short-lived and never stored hashed-and-at-rest beyond their TTL.
    const DEFAULT_PRO_PASSWORD = 'skillconnect';
    const PRO_OTP_TTL_MS = 10 * 60 * 1000;   // 10 minutes

    function normPhone(p) {
        const d = String(p || '').replace(/\D/g, '');
        if (d.startsWith('233')) return '0' + d.slice(3);
        if (d.length === 9) return '0' + d;
        return d;
    }

    function ensureProAuth(pro) {
        if (pro.auth && pro.auth.hash) return pro.auth;
        const salt = randomSalt();
        pro.auth = { salt: salt, hash: sha256Hex(salt + DEFAULT_PRO_PASSWORD), algo: 'sha256', updatedAt: Date.now() };
        save();
        return pro.auth;
    }

    function findProByPhone(phone) {
        const want = normPhone(phone);
        if (!want || want.length < 9) return null;
        return load().pros.find(p => normPhone(p.phone) === want) || null;
    }

    function requestProOtp(phone) {
        const pro = findProByPhone(phone);
        if (!pro) return { ok: false, error: 'No verified professional is registered with that phone number.' };
        ensureProAuth(pro);
        const code = String(Math.floor(100000 + Math.random() * 900000));
        pro.auth.otp = { hash: sha256Hex(pro.auth.salt + code), expiresAt: Date.now() + PRO_OTP_TTL_MS };
        save();
        // Real deployment: hand `code` to an SMS gateway. Sandbox: show it in
        // the response so the flow is testable end-to-end.
        return { ok: true, proId: pro.id, name: pro.name, sandboxCode: code, ttlMins: PRO_OTP_TTL_MS / 60000 };
    }

    async function proLogin(phone, secret) {
        const pro = findProByPhone(phone);
        if (!pro) return { ok: false, error: 'No verified professional is registered with that phone number.' };
        const auth = ensureProAuth(pro);
        const s = String(secret == null ? '' : secret);
        if (!s) return { ok: false, error: 'Enter your password or the 6-digit code we sent you.' };
        const isOtp = /^\d{6}$/.test(s) && auth.otp && auth.otp.expiresAt > Date.now();
        const okHash = isOtp
            ? hashEq(sha256Hex(auth.salt + s), auth.otp.hash)
            : hashEq(sha256Hex(auth.salt + s), auth.hash);
        if (!okHash) return { ok: false, error: isOtp ? 'That code is not valid (or has expired) — request a new one.' : 'Wrong password. Use your password or switch to a WhatsApp login code.' };
        if (isOtp) { delete auth.otp; save(); }   // single-use
        return { ok: true, pro: { id: pro.id, name: pro.name }, usedOtp: !!isOtp };
    }

    async function setProPassword(proId, currentSecret, newPassword) {
        const pro = load().pros.find(p => p.id === proId);
        if (!pro) return { ok: false, error: 'Professional not found.' };
        const pw = String(newPassword == null ? '' : newPassword);
        if (pw.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' };
        const chk = await proLogin(pro.phone, currentSecret);
        if (!chk.ok) return { ok: false, error: 'Current password or code is incorrect.' };
        const salt = randomSalt();
        pro.auth = { salt: salt, hash: sha256Hex(salt + pw), algo: 'sha256', updatedAt: Date.now() };
        save();
        return { ok: true };
    }

    function proUsesDefaultPassword(proId) {
        const pro = load().pros.find(p => p.id === proId);
        if (!pro) return true;
        const auth = ensureProAuth(pro);
        return hashEq(sha256Hex(auth.salt + DEFAULT_PRO_PASSWORD), auth.hash);
    }

    // ---------- Admin credentials ----------
    // The admin password is stored ONLY as a salted SHA-256 hash inside the
    // CMS config (cms.adminAuth). No plaintext secret ships in the source.
    // First run bootstraps from the default password ('4321'); admins must
    // change it from the Admin console (Security card) before deploying.
    const DEFAULT_ADMIN_PASSWORD = '4321';

    /* Synchronous SHA-256 (pure JS) so logins also work from file:// or plain
       HTTP static hosting where async crypto.subtle is unavailable. Hex out. */
    function sha256Hex(ascii) {
        ascii = unescape(encodeURIComponent(ascii));   // UTF-8 safe
        var K = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ];
        var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
        var i, l = ascii.length;
        var words = [];
        for (i = 0; i < l; i++) words[i >> 2] = (words[i >> 2] || 0) | (ascii.charCodeAt(i) << ((3 - (i & 3)) * 8));
        words[l >> 2] = (words[l >> 2] || 0) | (0x80 << ((3 - (l & 3)) * 8));
        var nBlocks = Math.ceil((l + 9) / 64);
        words[nBlocks * 16 - 1] = l * 8;
        for (i = 0; i < nBlocks * 16; i++) words[i] = words[i] | 0;

        var w = new Array(64);
        function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

        for (var blk = 0; blk < nBlocks; blk++) {
            for (i = 0; i < 16; i++) w[i] = words[blk * 16 + i];
            for (i = 16; i < 64; i++) {
                var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
                var s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
                w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
            }
            var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
            for (i = 0; i < 64; i++) {
                var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
                var ch = (e & f) ^ (~e & g);
                var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
                var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
                var maj = (a & b) ^ (a & c) ^ (b & c);
                var t2 = (S0 + maj) | 0;
                h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
            }
            H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
            H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
        }
        return H.map(function (x) { return ('00000000' + ((x >>> 0).toString(16))).slice(-8); }).join('');
    }

    function randomSalt() {
        try {
            var arr = new Uint8Array(16);
            (self.crypto || window.crypto).getRandomValues(arr);
            return Array.prototype.map.call(arr, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
        } catch (e) {
            var s = '';
            for (var i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
            return s;
        }
    }

    /* Lazily create cms.adminAuth on first use so every existing store keeps
       working: the default password ('4321') validates against the seeded
       hash until the admin sets a real one. */
    function ensureAdminAuth() {
        const d = load();
        if (d.cms && d.cms.adminAuth && d.cms.adminAuth.hash) return d.cms.adminAuth;
        const salt = randomSalt();
        const auth = { salt: salt, hash: sha256Hex(salt + DEFAULT_ADMIN_PASSWORD), algo: 'sha256', updatedAt: Date.now() };
        if (!d.cms) d.cms = {};
        d.cms.adminAuth = auth;
        save();
        return auth;
    }

    function hashEq(a, b) {
        if (!a || !b || a.length !== b.length) return false;
        let diff = 0;
        for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
        return diff === 0;
    }

    async function adminLogin(password) {
        const pw = String(password == null ? '' : password);
        if (!pw) return false;
        const auth = ensureAdminAuth();
        return hashEq(sha256Hex(auth.salt + pw), auth.hash);
    }

    async function adminUsesDefaultPassword() {
        return adminLogin(DEFAULT_ADMIN_PASSWORD);
    }

    async function setAdminPassword(currentPassword, newPassword) {
        const pw = String(newPassword == null ? '' : newPassword);
        if (pw.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' };
        if (!(await adminLogin(currentPassword))) return { ok: false, error: 'Current password is incorrect.' };
        const d = load();
        const salt = randomSalt();
        d.cms.adminAuth = { salt: salt, hash: sha256Hex(salt + pw), algo: 'sha256', updatedAt: Date.now() };
        save();
        return { ok: true };
    }

    // ---------- Admin ----------
    function adminStats() {
        const d = load();
        const escrowHeld = d.bookings.reduce((s, b) => s + (b.escrow && !b.escrow.released ? b.amount : 0), 0);
        const completed = d.bookings.filter(b => b.status === 'completed');
        // Per-category cancellation rate — flags categories where matching
        // repeatedly fails (customers drop requests before booking).
        const byCat = {};
        d.bookings.forEach(b => {
            if (!byCat[b.cat]) byCat[b.cat] = { cat: b.cat, total: 0, cancelled: 0 };
            byCat[b.cat].total++;
            if (b.status === 'cancelled') byCat[b.cat].cancelled++;
        });
        const cancellationsByCat = Object.values(byCat)
            .map(c => ({ cat: c.cat, total: c.total, cancelled: c.cancelled, rate: Math.round(c.cancelled / c.total * 100) }))
            .sort((a, b) => (b.rate - a.rate) || (b.total - a.total));
        return {
            pros: d.pros.length,
            applicationsPending: d.applications.filter(a => a.status === 'pending').length,
            bookings: d.bookings.length,
            openJobs: d.bookings.filter(b => ['matching', 'quoted', 'booked', 'in_progress'].includes(b.status)).length,
            disputesOpen: d.disputes.filter(x => x.status === 'open').length,
            cancellationsByCat,
            escrowHeld,
            gmv: completed.reduce((s, b) => s + (b.amount || 0), 0),
            commission: completed.reduce((s, b) => s + (b.commission || 0), 0),
            // payment management (new)
            revenue: d.transactions.filter(t => ['commission', 'registration_fee'].includes(t.type)).reduce((s, t) => s + t.amount, 0),
            regFees: d.transactions.filter(t => t.type === 'registration_fee').reduce((s, t) => s + t.amount, 0),
            awaitingPayout: completed.filter(b => !b.proPaid).reduce((s, b) => s + ((b.amount || 0) - (b.commission || 0)), 0),
            customers: adminCustomers().length,
            payoutRequests: d.payoutRequests.filter(r => r.status === 'pending').length
        };
    }

    function adminAssign(bookingId, proId) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        const p = d.pros.find(x => x.id === proId);
        if (!b || !p) return { ok: false, error: 'Booking or pro not found.' };
        if (!b.matchedProIds.includes(proId)) b.matchedProIds.push(proId);
        addQuoteInternal(d, bookingId, proId, p.price, 60000);
        b.events.push({ at: Date.now(), text: 'Admin manually assigned ' + p.name + '. Quote sent.' });
        notify('pro', p.id, 'job', 'Admin assigned you to ' + bookingId + ' — quote sent to customer.');
        save();
        return { ok: true };
    }

    function allBookings() { return load().bookings; }
    function allQuotes() { return load().quotes; }

    // Manual-match queue: every unbooked request with zero matched pros,
    // newest first, with the verified pro pool for its category (cheapest
    // first, price + city included) so assignment needs no second lookup.
    function adminNoMatchQueue() {
        const d = load();
        return d.bookings
            .filter(b => ['matching', 'quoted'].includes(b.status) && !(b.matchedProIds || []).length)
            .map(b => ({
                booking: b,
                pool: d.pros.filter(p => p.verified && p.cat === b.cat)
                    .sort((a, b2) => a.price - b2.price)
                    .map(p => ({ id: p.id, name: p.name, price: p.price, city: p.city, rating: p.rating, bookings: p.bookings }))
            }));
    }

    // Admin reassignment: move a not-yet-paid booking from its chosen pro to a new pro.
    // Allowed pre-escrow (matching/quoted/booked), or in_progress (escrow transfers, nothing released).
    // Once escrow is released (completed/refunded) it is a financial record — not reassignable.
    function reassignBooking(bookingId, newProId) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        const np = d.pros.find(x => x.id === newProId);
        if (!b || !np) return { ok: false, error: 'Booking or professional not found.' };
        if (!['matching', 'quoted', 'booked', 'in_progress'].includes(b.status)) {
            return { ok: false, error: 'Job is ' + b.status.replace('_', ' ') + ' — payment already released, cannot reassign.' };
        }
        if (b.chosenProId === newProId) return { ok: false, error: 'That professional is already assigned to this job.' };
        if ((np.blocked || []).includes(b.date)) {
            return { ok: false, error: np.name + ' is blocked on ' + (b.date || 'the chosen date') + '.' }; // date conflict guard
        }

        const oldPro = b.chosenProId ? d.pros.find(x => x.id === b.chosenProId) : null;
        // Prefer an already-sent quote for this pro (e.g. a rematch auto-invite)
        // over the listed price, so the customer sees the same number they were shown.
        const pendingQ = d.quotes.find(q => q.bookingId === b.id && q.proId === newProId && q.status === 'sent');
        const newQuotePrice = pendingQ ? pendingQ.price : np.price;             // fresh quote at the new pro's listed price
        const wasInProgress = b.status === 'in_progress';

        // 1. Decline all outstanding quotes on this booking
        d.quotes.forEach(q => { if (q.bookingId === b.id && q.status === 'sent') q.status = 'declined'; });

        // 2. Transfer or reset escrow
        if (b.escrow && !b.escrow.released) {
            b.escrow.proId = newProId;
            const revMatch = String(b.escrow.txnRef).match(/\/R(\d+)$/i);
            b.escrow.txnRef = String(b.escrow.txnRef).replace(/\/R\d+$/i, '') + '/R' + (revMatch ? Number(revMatch[1]) + 1 : 1);
        }

        // 3. Re-point the booking and log the event
        b.chosenProId = newProId;
        b.amount = newQuotePrice;
        b.status = wasInProgress ? 'in_progress' : 'booked';
        b.matchedProIds = [newProId];
        b.events.push({ at: Date.now(), text: 'Reassigned to ' + np.name + ' by dispatch' + (oldPro ? ' (was ' + oldPro.name + ')' : '') + '. New price ' + cedi(newQuotePrice) + '.' });

        // 4. Fresh quote record so ledger history stays complete
        const q = addQuoteInternal(d, b.id, newProId, newQuotePrice, 60000);
        if (q) q.status = 'accepted';
        if (b.status === 'matching') b.status = 'quoted';

        // 5. Notify everyone and leave a system chat note
        notify('pro', newProId, 'job', 'ASSIGNED: ' + b.id + ' — ' + (CAT_LABELS[b.cat] || b.cat) + ' on ' + (b.date ? fmtDate(b.date) : 'flexible date') + ' in ' + b.location + '. ' + cedi(newQuotePrice) + ' (escrow).');
        if (oldPro) notify('pro', oldPro.id, 'job', 'Job ' + b.id + ' was reassigned by dispatch.');
        notify('customer', b.id, 'booking', 'Your pro for ' + b.id + ' changed to ' + np.name + '. New agreed price: ' + cedi(newQuotePrice) + '.');
        systemChat(b.id, 'Dispatch reassigned this job to ' + np.name + (oldPro ? ' (previously ' + oldPro.name + ')' : '') + '. New agreed price ' + cedi(newQuotePrice) + '.');

        save();
        return { ok: true, booking: b, newPro: { id: np.id, name: np.name }, oldPro: oldPro ? { id: oldPro.id, name: oldPro.name } : null, newQuotePrice };
    }

    // ---------- Transactions ledger (records every money movement; escrow flow unchanged) ----------
    function addTxn(d, type, bookingId, proId, amount, method, note, status) {
        const t = {
            id: nextId('txn'),
            type,                         // service_payment | commission | payout | registration_fee | refund
            bookingId: bookingId || null,
            proId: proId || null,
            amount,
            method: method || 'momo',
            note: note || '',
            status: status || 'success',
            at: Date.now()
        };
        d.transactions.unshift(t);
        return t;
    }

    function getTransactions() { return load().transactions; }

    // ---------- Registration fee (one-time GH₵ 50 per professional) ----------
    function getRegFee() {
        const cms = load().cms;
        const n = Number(cms && cms.regFee);
        return (n > 0 && isFinite(n)) ? n : REG_FEE;   // fall back to the constant if the CMS value is broken
    }

    /* ---------- device booking list (client-side convenience) ----------
       The bookings page shows "bookings made on this device" without a
       global bookings read (which would leak every customer's data).
       Refs live in localStorage only — capped, newest first. */
    function rememberDeviceRef(id) {
        try {
            if (!id) return;
            let list = JSON.parse(localStorage.getItem('sc_device_bookings') || '[]');
            list = list.filter(function (x) { return x !== id; });
            list.unshift(id);
            localStorage.setItem('sc_device_bookings', JSON.stringify(list.slice(0, 20)));
        } catch (e) { /* storage blocked — convenience only */ }
    }
    function deviceRefs() {
        try { return JSON.parse(localStorage.getItem('sc_device_bookings') || '[]'); }
        catch (e) { return []; }
    }

    /* Scoped application status for application.html (public tracker page).
       Sandbox: computed from the local store; API mode: proxied 1:1 to the
       server endpoint so only the requested application ever leaves it. */
    function applicationTrack(appRef) {
        const digits = function (s) { return String(s == null ? '' : s).replace(/\D/g, ''); };
        const want = digits(appRef);
        if (!want) return null;
        const d = load();
        const app = (d.applications || []).find(function (a) { return digits(a.id) === want; });
        if (!app) return null;
        const queueAhead = (d.applications || []).filter(function (a) { return a.status === 'pending' && a.submittedAt <= app.submittedAt; }).length;
        const livePro = app.status === 'verified'
            ? ((d.pros || []).find(function (p) { return p.appId === app.id; }) || null)
            : null;
        const feed = (d.notifications || []).filter(function (n) { return n.audience === 'customer' && (!n.refTo || n.refTo === app.id); })
            .sort(function (a, b) { return b.at - a.at; }).slice(0, 8);
        return { app: app, queueAhead: queueAhead, livePro: livePro, feed: feed };
    }

    function payRegFee(appRef, method, payRef) {
        const d = load();
        const app = d.applications.find(a => a.id === appRef) || d.pros.find(p => p.id === appRef);
        if (!app) return { ok: false, error: 'Application not found.' };
        const target = d.pros.find(p => p.appId === appRef || p.id === appRef);
        const pro = target || app;
        if (pro.regFeePaid) return { ok: false, error: 'Registration fee already paid.' };

        pro.regFeePaid = true;
        pro.regFeeAt = Date.now();
        const fee = getRegFee();
        addTxn(d, 'registration_fee', null, pro.id, fee, method || 'momo',
            'Registration/verification fee — ' + pro.name + (payRef ? ' (ref ' + payRef + ')' : ''));
        notify('admin', pro.id, 'payment', 'Registration fee ' + cedi(fee) + ' received from ' + pro.name + '.');
        notify('customer', pro.id, 'payment', 'Registration fee received. Your verification is now prioritised.');
        save();
        return { ok: true, txnId: d.transactions[0].id };
    }

    // ---------- CMS (frontpage content managed from admin console) ----------
    function getCms() { return load().cms; }

    function updateCms(patch) {
        const d = load();
        Object.assign(d.cms, patch, { updatedAt: Date.now() });
        save();
        return d.cms;
    }

    // ---------- Customers (derived from bookings) ----------
    function adminCustomers() {
        const d = load();
        const map = {};
        d.bookings.forEach(b => {
            const key = b.phone.replace(/\s|-/g, '').slice(-9);
            if (!map[key]) {
                map[key] = { key, name: b.name, phone: b.phone, bookings: 0, spent: 0, lastAt: 0, refs: [] };
            }
            const c = map[key];
            c.bookings++;
            if (b.paidAt) c.spent += (b.amount || 0);
            c.lastAt = Math.max(c.lastAt, b.createdAt);
            if (c.refs.length < 5) c.refs.push(b.id);
        });
        return Object.values(map).sort((a, b) => b.lastAt - a.lastAt);
    }

    // Full booking history + spend breakdown for one customer (matched by the
    // last 9 digits of their phone number, same identity rule as adminCustomers).
    function customerHistory(phone) {
        const d = load();
        const key = String(phone || '').replace(/\s|-/g, '').slice(-9);
        const list = d.bookings
            .filter(b => String(b.phone || '').replace(/\s|-/g, '').endsWith(key))
            .slice().sort((a, b) => b.createdAt - a.createdAt);

        const stats = { total: list.length, paidCount: 0, spend: 0, escrowHeld: 0, active: 0, cancelled: 0, reviews: 0, avg: 0, cats: {}, firstAt: 0 };
        const ids = new Set(list.map(b => b.id));
        list.forEach(b => {
            if (b.paidAt) { stats.paidCount++; stats.spend += (b.amount || 0); }
            if (b.escrow && !b.escrow.released) stats.escrowHeld += b.escrow.amount;
            if (['matching', 'quoted', 'booked', 'in_progress'].includes(b.status)) stats.active++;
            if (b.status === 'cancelled' || b.status === 'disputed') stats.cancelled++;
            if (b.cat) stats.cats[b.cat] = (stats.cats[b.cat] || 0) + 1;
            stats.firstAt = stats.firstAt ? Math.min(stats.firstAt, b.createdAt) : b.createdAt;
        });
        stats.avg = stats.paidCount ? Math.round(stats.spend / stats.paidCount) : 0;
        stats.reviews = d.reviews.filter(r => ids.has(r.bookingId)).length;
        stats.topCat = Object.keys(stats.cats).sort((a, b) => stats.cats[b] - stats.cats[a])[0] || null;
        return { key, name: list.length ? list[0].name : '', phone, bookings: list, stats };
    }

    // ---------- Admin payment management ----------
    // Admin marks a completed job as paid out to the worker (cash/bank/MoMo transfer).
    function markProPaid(bookingId, method) {
        const d = load();
        const b = d.bookings.find(x => x.id === bookingId);
        if (!b || b.status !== 'completed' || !b.amount) return { ok: false, error: 'Booking is not completed or has no amount.' };
        if (b.proPaid) return { ok: false, error: 'Worker already marked as paid for this booking.' };
        const pro = d.pros.find(p => p.id === b.chosenProId);
        if (!pro) return { ok: false, error: 'Professional not found.' };

        b.proPaid = true;
        b.proPaidAt = Date.now();
        b.proPaidMethod = method || 'momo';
        const payout = b.amount - (b.commission || 0);
        pro.balance = Math.max(0, (pro.balance || 0) - payout);
        addTxn(d, 'payout', b.id, pro.id, payout, b.proPaidMethod, 'Admin payout to worker for ' + b.id + ' — ' + pro.name);
        notify('pro', pro.id, 'payment', cedi(payout) + ' paid out for ' + b.id + ' via ' + b.proPaidMethod.toUpperCase() + '. Thank you!');
        save();
        return { ok: true, payout };
    }

    // ---------- Public API ----------
    const pub = {
        CAT_LABELS, CATEGORY_INFO, URGENCY_INFO, PRO_ICONS, COMMISSION_RATE,
        load, save, reset,
        getPros, getPro, addApplication, getApplications, reviewApplication,
        createBooking, getBooking, getBookingsFor, getQuotesFor, acceptQuote, setBookingStatus,
        payIntoEscrow, releaseEscrow, cancelBooking, rebookFrom, updateBookingBudget,
        openDispute, getDisputes, resolveDispute, customerRematchOptions, customerRematchPick, cancellationSummary,
        submitSupportMessage, supportMessages, resolveSupportMessage, SUPPORT_TOPICS,
        addReview, getReviewsFor, verifiedNotices, proDirectoryUrl,
        chatMessages, sendChat, systemChat,
        proBookings, proRespondQuote, toggleProDate, updateProProfile, payoutPro,
        requestPayout, cancelPayout, myPayouts, rejectPayout, approvePayouts, createPayoutBatch, processPayoutBatch, payoutQueue,
        idStatus, requestIdDocs, submitReverify, approveReverify,
        idWindowsLocal, commissionRateLocal,
        idGateSync, gateKeep, setIdGateOverride,
        proAvailability, setAvailabilityStatus, dateAvailability, AVAIL_META, getPortfolio, setPortfolio,
        adminLogin, setAdminPassword, adminUsesDefaultPassword, proLogin, requestProOtp, setProPassword, proUsesDefaultPassword, normPhone, adminStats, adminAssign, reassignBooking, allBookings, allQuotes, customerHistory, adminNoMatchQueue,
        getRegFee, applicationTrack, rememberDeviceRef, deviceRefs, payRegFee, getCms, updateCms, adminCustomers, getTransactions, markProPaid, addTxn,
        notify, notifyProByChannel, notificationsFor, markNotificationsRead,
        notificationPrefsGet, notificationPrefsSet,
        todayISO, fmtDate, cedi, esc
    };

    // ---------- Phase 3: MySQL API bridge (opt-in, zero page edits) ----------
    // Activated by ?api=1 (persists until ?api=0). Pages keep their synchronous
    // SC.* calls: `load` hydrates the full store from the server snapshot once,
    // mutating functions POST to /api/mutate and re-hydrate from the
    // authoritative response. Reads run locally on hydrated state, so no page
    // logic changes. The server owns all business rules in this mode.
    let API_MODE = false;
    try {
        const qApi = new URLSearchParams(location.search).get('api');
        if (qApi === '1') { localStorage.setItem('sc_api_mode', '1'); API_MODE = true; }
        else if (qApi === '0') { localStorage.removeItem('sc_api_mode'); }
        else if (localStorage.getItem('sc_api_mode') === '1') API_MODE = true;
    } catch (e) { /* storage blocked — stay in sandbox mode */ }

    /* Exposed for pages that need to know the store is server-backed
       (e.g. the admin gateway toggle) — sandbox mode leaves it falsy. */
    pub.apiMode = API_MODE;

    if (API_MODE) {
        function xhrSync(method, url, payload) {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open(method, url, false);   // sync bridge: pages call SC.* synchronously
                if (payload !== undefined) xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(payload === undefined ? null : payload);
                return JSON.parse(xhr.responseText);
            } catch (e) {
                return { ok: false, error: 'API unreachable — is the SkillConnect API server running?' };
            }
        }
        function apiHydrate() {
            /* Cache-buster: some Chromium profiles served a cached snapshot
               to sync XHR despite no-store — a stale store is poison. */
            const resp = xhrSync('GET', '/api/snapshot?_=' + Date.now());
            if (resp && resp.ok && resp.db) { db = resp.db; return true; }
            return false;
        }
        /* The sandbox read helpers close over the original load(), which reads
           localStorage — always stale in API mode (the server is the store).
           Rebind it so the FIRST read on a page hydrates from the server
           snapshot; without this, a freshly loaded page rendered whatever
           snapshot the device last cached until some mutation re-hydrated. */
        load = function () {
            if (!db || db.__unhydrated) {
                if (apiHydrate() && db) delete db.__unhydrated;
                else if (!db) {
                    console.warn('SC API: snapshot unavailable — rendering on in-memory seed data; will retry hydration on the next load().');
                    db = seedData();
                    db.__unhydrated = true;
                }
            }
            return db;   // migrate() skipped: the server store is already current
        };
        pub.load = load;   /* same hydrating reader as the sandbox helpers use */
        pub.save = function () { /* no-op: the MySQL API persists every mutation */ };
        /* Forced fresh hydration — pages call this before a lookup that
           misses, so a stale/failed first hydration can never strand a
           customer on seed data (heals any cache layer). */
        pub.rehydrate = function () { return apiHydrate(); };
        pub.reset = function () {
            const r = xhrSync('POST', '/api/reset', '{}');
            apiHydrate();
            return r && r.ok ? r : (r || { ok: false, error: 'Reset failed.' });
        };
        // Functions whose authority lives on the server (they change data, or
        // verify against server-side state such as OTPs and settings defaults).
        ['addApplication', 'reviewApplication', 'createBooking', 'acceptQuote', 'setBookingStatus',
         'cancelBooking', 'rebookFrom', 'updateBookingBudget', 'payIntoEscrow', 'releaseEscrow', 'openDispute', 'resolveDispute',
         'customerRematchPick', 'submitSupportMessage', 'resolveSupportMessage', 'addReview', 'sendChat',
         'systemChat', 'proRespondQuote', 'toggleProDate', 'updateProProfile', 'payoutPro',
         'requestIdDocs', 'submitReverify', 'approveReverify', 'setAvailabilityStatus', 'setPortfolio',
         'setProPassword', 'setAdminPassword', 'markProPaid', 'payRegFee', 'updateCms', 'addTxn',
         'requestPayout', 'cancelPayout', 'myPayouts', 'rejectPayout', 'approvePayouts', 'createPayoutBatch', 'processPayoutBatch',
         'notify', 'markNotificationsRead', 'adminAssign', 'reassignBooking',
         'requestProOtp', 'proUsesDefaultPassword',
         'notificationPrefsSet', 'notificationPrefsGet'].forEach(function (name) {
            pub[name] = function () {
                const args = Array.prototype.slice.call(arguments);
                const resp = xhrSync('POST', '/api/mutate', JSON.stringify({ mutations: [{ fn: name, args: args }] }));
                if (!resp || !resp.ok) {
                    if (resp && resp.results && resp.results.length && resp.results[0] && typeof resp.results[0] === 'object' && 'ok' in resp.results[0]) return resp.results[0];
                    return { ok: false, error: (resp && resp.error) || 'API error.' };
                }
                /* Record the ref on this device right after a successful
                   create (bookings.html "my device" list + convenience). */
                if (name === 'createBooking') {
                    const r0 = resp.results && resp.results[0];
                    if (r0 && r0.id) rememberDeviceRef(r0.id);
                }
                const r = resp.results && resp.results.length ? resp.results[0] : { ok: true };
                apiHydrate();   // re-hydrate from the authoritative store
                return r;
            };
        });
        /* Scoped read proxied to the server (public application tracker):
           only the requested application's status ever leaves the store. */
        pub.applicationTrack = function (appRef) {
            const resp = xhrSync('GET', '/api/applicationTrack?ref=' + encodeURIComponent(appRef || ''));
            return (resp && resp.ok) ? resp.result : null;
        };
        /* Pro's own withdrawal history: admin-scoped payoutQueue would be
           rejected by the auth guard, so read via the pro-owned endpoint. */
        pub.myPayouts = function (proId) {
            const resp = xhrSync('POST', '/api/myPayouts', JSON.stringify({ args: [proId] }));
            return (resp && resp.ok) ? resp.result : [];
        };
        // Logins establish the server-side cookie session (httpOnly) — same
        // return shapes as the sandbox: adminLogin → boolean, proLogin → {ok, pro, usedOtp}.
        pub.adminLogin = function (password) {
            const resp = xhrSync('POST', '/api/login', JSON.stringify({ role: 'admin', password: password }));
            return !!resp.ok;
        };
        pub.proLogin = function (phone, secret) {
            return xhrSync('POST', '/api/login', JSON.stringify({ role: 'pro', phone: phone, secret: secret }));
        };
        // Catalog + tunables come from the settings tables (admin-changeable,
        // never hardcoded): one sync boot fetch replaces the in-file constants.
        const boot = xhrSync('GET', '/api/settings?_=' + Date.now());
        if (boot && boot.ok && boot.catalog) {
            pub.CAT_LABELS = boot.catalog.CAT_LABELS;
            pub.CATEGORY_INFO = boot.catalog.CATEGORY_INFO;
            pub.URGENCY_INFO = boot.catalog.URGENCY_INFO;
            pub.PRO_ICONS = boot.catalog.PRO_ICONS;
            pub.COMMISSION_RATE = boot.catalog.COMMISSION_RATE;
        }
        if (boot && boot.ok && boot.settings) {
            pub.SETTINGS = boot.settings;   /* admin-editable windows (id_grace_days etc.) */
        }
        if (boot && boot.ok && boot.priceStats) {
            pub.PRICE_STATS = boot.priceStats;   /* live market stats for AI price guidance */
        }
    }

    return pub;
})();
