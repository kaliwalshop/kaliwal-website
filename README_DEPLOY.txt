KALIWAL — Daraz-inspired storefront design (Version 3)
====================================================

WHAT IT IS
A redesigned shopping storefront with an orange shopping header, responsive search, category menu, large hero banner, product grids, product filters, cart, order tracking, and a customer-hidden Admin link.

WHAT IT DOES NOT DO
This is not a full multi-vendor Daraz marketplace. Seller accounts, commissions, payment gateway, courier tracking, reviews, notifications, refunds, and automated seller payments are not included. Existing backend/database functionality is unchanged.

YOUR LIVE GITHUB REPOSITORY USES ROOT FILES.
The main server.js of kaliwalshop/kaliwal-website serves index.html from the repository root and static assets from the repository root.

HOW TO INSTALL TO THE CURRENT REPOSITORY
1. Back up your current repository first (GitHub download ZIP, or keep prior commit history).
2. Extract KALIWAL_Daraz_Style_Frontend_GitHub_Root.zip.
3. In GitHub repo kaliwalshop/kaliwal-website, upload/replace these four files at the repository ROOT (not inside public):
   index.html
   style.css
   app.js
   sw.js
4. Commit to the main branch.
5. In Render, check the Deploys page for service kaliwal-website-1 and deploy latest commit if automatic deploy is off.
6. Refresh https://kaliwal-website-1.onrender.com after it says Live.

CUSTOMER URL
https://kaliwal-website-1.onrender.com/

ADMIN URL (bookmark privately; login still required)
https://kaliwal-website-1.onrender.com/?admin=1

Do not upload any .env file, Render environment secrets, passwords, or database backups to your public GitHub repository.

PRODUCT IMAGES
The website continues to show existing category emojis for products with no image URL. For actual photographs, use your admin product editor and add a valid HTTPS image URL. Avoid taking copyrighted images from other stores.

DATA SAFETY
The supplied files are frontend/static only. Do not replace server.js, .env, or your production database. Existing data remains available as long as the Render service is connected to the same persistent database.
