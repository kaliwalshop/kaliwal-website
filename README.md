# KALIWAL.COM — live online store starter

A deployable **Node.js + PostgreSQL** starter for an English/Urdu, Pakistan-only online store. Includes the supplied logo, mobile-first shopping, cart, server-side price and stock validation, manual JazzCash/Easypaisa/bank-transfer instructions, private order tracking, admin login, product editing, payment settings, order statuses, and credit to **Shoaib Ahmad / شعیب احمد**.

## Start locally
1. Install Node.js 20+ and PostgreSQL. Create an empty PostgreSQL database.
2. Copy `.env.example` to `.env`, fill `DATABASE_URL`, `SESSION_SECRET` (32+ random characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Run `npm install` then `npm start`.
4. Open `http://localhost:3000`. Admin tab → sign in using your credentials.
5. Configure payment accounts **before** accepting orders. Replace the sample prices and stock quantities.

## Publish
Deploy as a Node.js web service on a host supporting persistent PostgreSQL, set the four environment variables in the host's secret settings, and attach a PostgreSQL database. Set `NODE_ENV=production`; enable HTTPS on the host. Configure your purchased `kaliwal.com` domain via the host's verified DNS instructions. The domain is **not** included, registered, or deployed by this ZIP.

## Critical notes
- **Manual transfers only:** JazzCash/Easypaisa/bank details are displayed to customers; no gateway API, automatic payment collection, automatic reconciliation, or payment verification is provided. Verify every transfer yourself before shipping.
- Admin login is stored server-side, with hashed password, sessions and login rate limits. Use a unique strong password. Existing admin password is NOT updated merely by changing `ADMIN_PASSWORD` after first startup.
- Checkout reduces stock on order creation. Cancelling an order does **not** automatically restore stock; admin must adjust stock.
- Customer tracking codes are private bearer tokens. Do not share publicly. Orders can be looked up only by this code; no customer account system is included.
- The image field currently takes a publicly hosted **HTTPS image URL**, not direct photo upload. No courier integrations, automated tax/shipping rates, email/SMS, refunds, or full marketplace features are implemented.
- PWA install support depends on browser and HTTPS. This is **not** a compiled Android APK or Play Store release.
- Prior device-only demo orders/products are not automatically migrated. Store data is shared online only after deployment to the same server/database.
- Before taking real orders, review Pakistan business/tax requirements, delivery charges, returns/privacy policy, and data retention/security. Add backups, operational monitoring and admin password reset flow.

## Online + offline (v2)
- After first successful visit over HTTPS, the PWA shell is cached by the service worker; recent catalog and payment instructions are saved in the browser's localStorage. The shopping cart persists locally across reloads.
- Offline mode allows browsing previously loaded products and building a cart; **offline checkout is blocked**. Reconnect and verify stock and prices before placing orders. Never promise offline orders will sync automatically.
- Admin functions and tracking need an active server connection. Offline catalog is device-specific, can become stale, and may be deleted by the browser.
- For real shared online operation, deploy the Node server with PostgreSQL and configure secure environment variables. Netlify Drop alone cannot host the server/backend in this ZIP.
- This version is English-only in visible headings. A full localization review is recommended before launch.
