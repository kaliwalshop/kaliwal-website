KALIWAL — Larger Logo, Fonts & Add-to-Cart Buttons

This package is for the latest CLEAN HOMEPAGE version of your KALIWAL website.

WHAT IT CHANGES
* Bigger header KALIWAL logo and brand text
* Larger, easier-to-read product names, prices, discount labels, stock and navigation
* Bigger and easier-to-tap Add to Cart buttons
* Two larger Flash Deals cards visible at a time on mobile/tablets
* Search bar gets its own row on small screens so it stays readable

WHAT IT DOES NOT CHANGE
* No edits to server.js, app.js, payment details, database, products, cart, checkout or coupon calculations
* No changes to product images themselves

INSTALL ON GITHUB MAIN ROOT
1) Back up or download the current GitHub index.html and sw.js first.
2) Upload: index.html, kaliwal-readable.css and sw.js (all three) to the main/root directory.
3) Do NOT upload into public/. Do NOT delete any existing files.
4) Commit changes, deploy latest commit on Render 'kaliwal-website-1'.
5) Open your site, refresh. In phone Chrome, make sure 'Desktop site' is OFF.
6) Test Add to Cart, Flash Deals and checkout before taking customer orders.

Note: The updated index.html matches the previous Clean Homepage package. If you have edited
index.html independently since that update, instead add this line into its <head> immediately AFTER
the existing style.css link and upload only the CSS and sw.js files:
<link rel="stylesheet" href="kaliwal-readable.css?v=20261108-large-ui1">

To undo, remove the kaliwal-readable.css link from index.html.
