KALIWAL.COM — ADD PRODUCT PICTURES FROM YOUR PHONE

This package updates your existing Daraz-style store without deleting products, orders, or payment settings.
You MUST upload ALL FIVE files to your existing GitHub repository's ROOT folder (NOT the public/ subfolder):
- index.html
- app.js
- style.css
- sw.js
- server.js

IMPORTANT: server.js is necessary. Adding only a browser file input will NOT make photo uploads work.
The updated backend stores resized JPEG photos as binary bytes in your EXISTING PostgreSQL database; no Cloudinary or extra account needed.
No Render filesystem storage used because files on the free Render instance are temporary.

GitHub: https://github.com/kaliwalshop/kaliwal-website
Commit your changes. Render -> kaliwal-website-1 -> Deploys -> deploy latest commit if necessary.
Admin: https://kaliwal-website-1.onrender.com/?admin=1
Log in -> Manage Products -> choose image -> set Product Name / Price / Stock -> Save Product.
To edit a product, click Edit first. Upload a new picture, then Save Product.

Photos are compressed in the browser to <=500 KB and stored in PostgreSQL.
Ensure your paid or managed PostgreSQL database is persistent and backed up before taking customer orders.
Uploading many photos to your database can incur storage costs. For a large marketplace use object storage/CDN instead.
Never share database passwords or admin passwords.
