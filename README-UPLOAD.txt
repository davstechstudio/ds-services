SKILLCONNECT GH — static frontend bundle
=========================================
Upload EVERYTHING in this folder into public_html/ (the root, not
the folder itself) via InfinityFree's online file manager or FTP.

What works out of the box: every page, 12 seeded demo pros, demo
bookings — powered by each visitor's own browser storage.

NO setup.html here: that page configures the Node.js API server
and cannot run on static hosting (and is not needed — the site
self-seeds in sandbox mode). It ships in the full-stack bundle.

What needs the API (see the full-stack bundle): a SHARED database,
real sign-ups visible to everyone, MoMo payments, SMS/WhatsApp
alerts. Until then, admin edits stay local to the admin's browser.
