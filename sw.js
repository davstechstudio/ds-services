/* ============================================================
   sw.js — SkillConnect service worker (PWA installability +
   offline app shell).

   Strategy:
   - /api/*            NETWORK ONLY (money/bookings are never served
                       from cache; if offline, requests fail cleanly).
   - /api/snapshot     NETWORK ONLY for the SAME reason — the client
                       store must never hydrate from a stale mirror.
   - static assets     stale-while-revalidate (fast loads, fresh next time).
   - page navigations  network-first with offline shell fallback.

   Version bump → old caches are deleted on activate.
   ============================================================ */

'use strict';

const VERSION = 'sc-sw-v2';   /* v2: push + notificationclick handlers added */
const SHELL_CACHE = VERSION + '-shell';
const ASSET_CACHE = VERSION + '-assets';

/* The minimal offline shell: cached index + manifest + icon. */
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then(c => c.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'skip-waiting') self.skipWaiting();
});

/* ================= Web Push — off-website notifications =================
   The server encrypts each notice; here we surface it as a system
   notification. Visible on mobile + desktop even with every tab closed. */
self.addEventListener('push', (event) => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch (e) {
        try { data = { title: 'SkillConnect GH', body: event.data ? event.data.text() : '' }; } catch (e2) {}
    }
    const title = data.title || 'SkillConnect GH';
    const body = data.body || 'You have a new update on your booking.';
    const tag = data.tag || ('sc-' + Date.now());
    const target = data.type === 'welcome' || data.type === 'test' ? '/index.html' : '/track.html';
    event.waitUntil(
        self.registration.showNotification(title, {
            body: body,
            tag: tag,
            renotify: !!data.tag,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: { url: target }
        })
    );
});

/* Clicking a notice opens (or focuses) the most relevant page. */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || '/index.html';
    event.waitUntil((async () => {
        const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clientList) {
            if (client.url.includes('127.0.0.1') || client.url.includes(self.location.origin)) {
                await client.focus();
                client.navigate && client.navigate(url);
                return;
            }
        }
        return clients.openWindow(url);
    })());
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;                    // POSTs pass straight through
    const url = new URL(req.url);
    if (url.origin !== location.origin) return;          // CDN fonts/icons: browser cache is fine

    /* Money and data endpoints NEVER come from cache. */
    if (url.pathname.startsWith('/api/')) return;

    /* Page navigations: network first, fall back to the offline shell. */
    if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(
            fetch(req)
                .then(res => {
                    const copy = res.clone();
                    caches.open(SHELL_CACHE).then(c => c.put(req, copy)).catch(() => {});
                    return res;
                })
                .catch(() => caches.match(req).then(hit => hit || caches.match('/index.html')))
        );
        return;
    }

    /* Static assets: stale-while-revalidate. */
    event.respondWith(
        caches.match(req).then(hit => {
            const refresh = fetch(req).then(res => {
                if (res && res.status === 200) {
                    const copy = res.clone();
                    caches.open(ASSET_CACHE).then(c => c.put(req, copy)).catch(() => {});
                }
                return res;
            }).catch(() => hit);
            return hit || refresh;
        })
    );
});
