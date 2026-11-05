KALIWAL.COM — FREE WHATSAPP ORDER BUTTON

No Facebook Developer account, WhatsApp API, token, or subscription required.

Upload exactly these THREE replacement files into the ROOT (same place as server.js) of your existing GitHub repository:
    index.html
    app.js
    style.css
Do NOT upload the ZIP itself, and DO NOT change server.js, sw.js, package.json, or your public folder.
Commit changes. Check Render -> kaliwal-website-1 -> Deploys -> latest commit is Live.
Open: https://kaliwal-website-1.onrender.com/?admin=1
Login -> Payment Accounts -> Order WhatsApp number (+92).
Enter a Pakistani WhatsApp number as either 03XXXXXXXXX or +923XXXXXXXXX. Click Save Payment Accounts.
The number is shared with customers in the WhatsApp chat link. Use a dedicated business number if preferred.

CUSTOMER FLOW
1. Customer adds products and completes checkout using configured payment method.
2. Website securely saves the order in PostgreSQL and assigns tracking code.
3. Customer sees green 'Send Order on WhatsApp' button on the Track Order screen.
4. Customer taps it, reads the prepared message in WhatsApp, then manually presses Send.
5. You get the order message in normal WhatsApp (+92).

IMPORTANT
- This is click-to-chat, NOT automatic messaging; no messages are delivered unless the customer presses Send.
- The order is saved even if they do not send a WhatsApp message. Check Admin -> Customer Orders.
- If Order WhatsApp number is not configured or invalid, the button will stay hidden.
- This does not change the database, product photos, order data, payment settings, or server code.
- Make a backup before editing a production website.
- Normal mobile data charges may apply; no paid WhatsApp API required.

GitHub: https://github.com/kaliwalshop/kaliwal-website
Website: https://kaliwal-website-1.onrender.com
