(()=>{'use strict';const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),rs=n=>'Rs. '+Number(n||0).toLocaleString('en-PK');let products=[],settings={},cart={},admin=false,lang='en',adminProducts=[],coupons=[],activeCategory='All',appliedCoupon='',couponPreview=null;try{cart=JSON.parse(localStorage.getItem('kaliwal_cart_v2')||'{}')}catch{cart={}};const invalidateCoupon=()=>{couponPreview=null;const s=$('couponStatus');if(s&&appliedCoupon)s.textContent='Cart changed — please reapply your coupon code.';appliedCoupon=''};const persistCart=()=>{try{localStorage.setItem('kaliwal_cart_v2',JSON.stringify(cart))}catch{}};const offline=()=>!navigator.onLine;function connection(){const n=document.getElementById('connection');if(n)n.textContent=offline()?'OFFLINE: Browse saved products and prepare your cart. Orders require internet.':'ONLINE: Orders are submitted securely to the server.';const b=document.querySelector('#checkout button[type=submit]');if(b)b.disabled=offline()||!document.getElementById('pay').value};window.addEventListener('online',()=>{connection();load()});window.addEventListener('offline',connection);const msg=t=>{$('message').textContent=t;window.scrollTo({top:0,behavior:'smooth'})};async function api(path,opts={}){let r=await fetch('/api'+path,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}}),d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d}function tab(t){document.body.dataset.view=t;for(const id of ['shop','cart','track','admin'])$(id).hidden=id!==t;document.querySelectorAll('.store-nav [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));render()}document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));$('lang').addEventListener('click',()=>{lang=lang==='en'?'ur':'en';document.documentElement.lang=lang;document.body.classList.toggle('urdu',lang==='ur');document.querySelectorAll('[data-en]').forEach(e=>e.textContent=e.dataset[lang]);render()});function render(){let q=$('search').value.toLowerCase();$('badge').textContent=Object.values(cart).reduce((a,b)=>a+b,0)||'0';let filtered=products.filter(p=>(activeCategory==='All'||(activeCategory==='Deals'?p.discount_active:p.category===activeCategory))&&(p.name+' '+p.urdu+' '+p.category).toLowerCase().includes(q));
$('productCount').textContent=filtered.length+' products';const dealCount=products.filter(p=>p.discount_active).length;$('dealsBanner').hidden=!dealCount;$('dealsBannerText').textContent=dealCount+' products currently on sale — limited-time savings';
document.querySelectorAll('#categoryChips [data-category]').forEach(b=>b.classList.toggle('selected',b.dataset.category===activeCategory));
$('products').innerHTML=filtered.map(p=>`<article class="card"><div class="art">${p.image_url?`<img loading="lazy" src="${esc(p.image_url)}" alt="${esc(p.name)}">`:({'Honey':'🍯','Dry Fruits':'🥜','Mustard Oil':'🌻','Cow Ghee':'🧈','Olive Oil':'🫒'}[p.category]||'🛍️')}</div>${p.discount_active?`<span class="discount-badge">-${p.discount_display}% OFF</span>`:''}<div class="card-body"><span class="product-type">${esc(p.category)}</span><h3>${esc(lang==='ur'?p.urdu||p.name:p.name)}</h3><div class="small">${esc(p.size)}</div><div class="price">${rs(p.sale_price??p.price)}</div>${p.discount_active?`<div class="price-old"><del>${rs(p.price)}</del> <span>Save ${rs(p.price-p.sale_price)}</span></div>`:''}<div class="stock-note ${p.stock<1?'out':''}">${p.stock>0?esc(p.stock)+' in stock':'Out of stock'}</div><button class="primary" data-add="${p.id}" ${p.stock<1?'disabled':''}>${lang==='ur'?'ٹوکری میں شامل کریں':'🛒 Add to Cart'}</button></div></article>`).join('')||'<p class="panel">No products match your selection.</p>' ;let lines=products.filter(p=>cart[p.id]);$('cartLines').innerHTML=lines.map(p=>`<div class="panel row"><div><b>${esc(p.name)}</b><p>${rs(p.sale_price??p.price)} × ${cart[p.id]} ${p.discount_active?`<span class="cart-discount">(${p.discount_display}% OFF)</span>`:''}</p></div><div><button data-minus="${p.id}">−</button> ${cart[p.id]} <button data-add="${p.id}" ${cart[p.id]>=p.stock?'disabled':''}>+</button></div></div>`).join('')||'<p>Your cart is empty / ٹوکری خالی ہے</p>';let baseTotal=lines.reduce((s,p)=>s+Number(p.price)*cart[p.id],0),saleTotal=lines.reduce((s,p)=>s+Number(p.sale_price??p.price)*cart[p.id],0),salesSaved=baseTotal-saleTotal;
const validPreview=couponPreview&&couponPreview.code===appliedCoupon&&couponPreview.subtotal===saleTotal;
const couponSaved=validPreview?Number(couponPreview.coupon_discount):0;
$('savingsSummary').innerHTML=(salesSaved?`<p>🔥 Product deals saved: <b>−${rs(salesSaved)}</b></p>`:'')+(couponSaved?`<p>🎟️ Coupon ${esc(appliedCoupon)}: <b>−${rs(couponSaved)}</b></p>`:'')+(salesSaved||couponSaved?`<p class="saving-grand">Your total savings: <strong>${rs(salesSaved+couponSaved)}</strong></p>`:'');
$('total').textContent='Estimated Total: '+rs(saleTotal-couponSaved);$('checkout').hidden=!lines.length;let options=[['JazzCash','jazz'],['Easypaisa','easy'],['Bank Transfer','iban']].filter(x=>settings[x[1]]);let selected=$('pay').value;$('pay').innerHTML=options.map(([name])=>`<option ${selected===name?'selected':''}>${name}</option>`).join('');let method=$('pay').value;$('payDetails').textContent=method==='JazzCash'?`JazzCash: ${settings.jazz||''} · ${settings.jazzName||''}`:method==='Easypaisa'?`Easypaisa: ${settings.easy||''} · ${settings.easyName||''}`:method==='Bank Transfer'?`Bank: ${settings.bank||''} · ${settings.bankName||''} · ${settings.iban||''}`:'No payment account configured yet. Checkout unavailable.';$('checkout').querySelector('button[type=submit]').disabled=!method||offline();$('loginBox').hidden=admin;$('dashboard').hidden=!admin;if(admin)renderAdmin();persistCart();connection()}function renderAdmin(){$('adminProducts').innerHTML=adminProducts.map(p=>`<div class="line row"><div>${esc(p.name)} · ${rs(p.price)} · Sale ${p.discount_percent||0}% · Stock ${p.stock}${p.active?'':' · Hidden'}</div><div><button data-edit="${p.id}">Edit</button><button data-hide="${p.id}">Hide</button></div></div>`).join('')}
document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;let id=Number(b.dataset.add||b.dataset.minus);if(b.dataset.add){let p=products.find(x=>Number(x.id)===id);if(p)(cart[id]=Math.min(p.stock,(cart[id]||0)+1),invalidateCoupon(),render())}if(b.dataset.minus){cart[id]=Math.max(0,(cart[id]||0)-1);if(!cart[id])delete cart[id];invalidateCoupon();render()}if(b.dataset.edit){let p=adminProducts.find(x=>Number(x.id)===Number(b.dataset.edit));if(p){let f=$('productForm');clearProductPhoto();for(let k of ['id','name','urdu','category','price','stock','size','image_url','description','discount_percent'])f.elements[k].value=p[k]??'';for(const k of ['sale_start','sale_end'])f.elements[k].value=p[k]?localDateInput(p[k]):'';if(p.image_url){$('productPhotoPreview').src=p.image_url+'?v='+Date.now();$('productPhotoPreview').hidden=false}f.scrollIntoView({behavior:'smooth'})}}if(b.id==='showDeals'){activeCategory='Deals';tab('shop');$('shop').scrollIntoView({behavior:'smooth'})}if(b.dataset.couponToggle){api('/admin/coupons/'+b.dataset.couponToggle,{method:'PATCH',body:JSON.stringify({active:b.dataset.couponActive==='true'})}).then(refreshAdmin).catch(err=>msg(err.message))}if(b.dataset.hide&&confirm('Hide product from customers?'))api('/admin/products/'+b.dataset.hide,{method:'DELETE'}).then(refreshAdmin).catch(e=>msg(e.message))});$('search').addEventListener('input',()=>{tab('shop')});document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{activeCategory=b.dataset.category;$('search').value='';tab('shop');$('shop').scrollIntoView({behavior:'smooth',block:'start'})}));$('pay').addEventListener('change',render);
function localDateInput(v){const d=new Date(v);if(!Number.isFinite(d.getTime()))return '';return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function toISO(v){return v?new Date(v).toISOString():null}
$('applyCoupon').addEventListener('click',async()=>{const code=$('couponCode').value.trim().toUpperCase();if(!code){appliedCoupon='';couponPreview=null;$('couponStatus').textContent='Enter a discount code.';render();return}const items=Object.entries(cart).filter(([,qty])=>qty>0).map(([id,qty])=>({id:Number(id),qty}));if(!items.length){$('couponStatus').textContent='Your cart is empty.';return}try{const result=await api('/coupons/validate',{method:'POST',body:JSON.stringify({code,items})});appliedCoupon=code;couponPreview=result;$('couponStatus').textContent='✅ '+code+' applied! Coupon saved '+rs(result.coupon_discount)+'.';render()}catch(err){appliedCoupon='';couponPreview=null;$('couponStatus').textContent='⚠️ '+err.message;render()}});
$('removeCoupon').addEventListener('click',()=>{appliedCoupon='';couponPreview=null;$('couponCode').value='';$('couponStatus').textContent='Coupon removed.';render()});
function pakistaniWhatsAppNumber(value){
  const phone=String(value||'').replace(/[\s().-]/g,'');
  const digits=phone.replace(/^\+/,'');
  if(/^03\d{9}$/.test(digits))return '92'+digits.slice(1);
  if(/^923\d{9}$/.test(digits))return digits;
  return null;
}
function prepareWhatsAppOrder(order,formData,purchased){
  const box=$('whatsappOrder'),button=$('whatsappOrderLink');
  const recipient=pakistaniWhatsAppNumber(settings.support);
  if(!recipient){box.hidden=true;button.removeAttribute('href');return}
  const itemLines=purchased.map(p=>`• ${p.name} × ${p.qty} — ${rs(p.unit_price*p.qty)}`);
  const message=[
    '🛍️ KALIWAL.COM — NEW ORDER',
    `Order #${order.id}`,
    '',
    'Products:',...itemLines,
    `Total: ${rs(order.total)}`, ...(order.discount_total?[`Total savings: ${rs(order.discount_total)}`]:[]),...(order.coupon_code?[`Coupon: ${order.coupon_code}`]:[]),
    '',
    `Customer: ${formData.name}`,
    `Mobile: ${formData.phone}`,
    `Delivery: ${formData.address}, ${formData.city}, ${formData.province}`,
    `Payment method: ${formData.payment}`,
    'Payment status: Not verified',
    '',
    'Please confirm delivery charges and my order.'
  ].join('\n');
  button.href='https://wa.me/'+recipient+'?text='+encodeURIComponent(message);
  box.hidden=false;
}
$('checkout').addEventListener('submit',async e=>{
  e.preventDefault();
  if(offline()){msg('You are offline. Your cart is saved on this device; reconnect before placing an order.');return}
  const f=e.target,d=Object.fromEntries(new FormData(f));
  d.items=Object.entries(cart).map(([id,qty])=>({id:Number(id),qty}));
  const purchased=d.items.map(({id,qty})=>{
    const p=products.find(x=>Number(x.id)===id);
    return p?{name:p.name,qty,unit_price:(p.sale_price??p.price)}:{name:'Product #'+id,qty,unit_price:0};
  });
  if(appliedCoupon){d.coupon_code=appliedCoupon;}const submit=f.querySelector('button[type=submit]');submit.disabled=true;
  try{
    const o=await api('/orders',{method:'POST',body:JSON.stringify(d)});
    // Save the order BEFORE opening WhatsApp; never create duplicate orders by tapping the button.
    prepareWhatsAppOrder(o,d,purchased);
    cart={};appliedCoupon='';couponPreview=null;$('couponCode').value='';persistCart();$('token').value=o.tracking_token;
    await load();tab('track');
    $('trackResult').textContent=`Order #${o.id} · ${rs(o.total)} · Saved ${rs(o.discount_total)} · ${o.status}. Save this private tracking code: ${o.tracking_token}. Payment NOT verified.`;
    msg($('whatsappOrder').hidden?'Order saved! Save your tracking code. Ask the store to configure an order WhatsApp number.':'Order saved! Tap the WhatsApp button below and press Send to notify the shop.');
    if(!$('whatsappOrder').hidden)$('whatsappOrder').scrollIntoView({behavior:'smooth',block:'center'});
  }catch(err){msg(err.message)}finally{submit.disabled=false}
});
$('trackBtn').addEventListener('click',async()=>{try{let o=await api('/orders/track/'+encodeURIComponent($('token').value.trim()));$('trackResult').textContent=`Order #${o.id} · ${o.status} · ${rs(o.total)} · ${new Date(o.created_at).toLocaleString()}`}catch(e){$('trackResult').textContent=e.message}});
$('login').addEventListener('submit',async e=>{e.preventDefault();try{await api('/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});admin=true;await refreshAdmin();render();msg('Signed in successfully')}catch(e){msg(e.message)}});$('logout').addEventListener('click',async()=>{await api('/logout',{method:'POST'});admin=false;render();msg('Signed out')});let localPhotoPreviewUrl=null;
function clearProductPhoto(){const input=$('productPhoto'),preview=$('productPhotoPreview');input.value='';if(localPhotoPreviewUrl){URL.revokeObjectURL(localPhotoPreviewUrl);localPhotoPreviewUrl=null}preview.hidden=true;preview.removeAttribute('src')}
$('productPhoto').addEventListener('change',e=>{
  if(localPhotoPreviewUrl){URL.revokeObjectURL(localPhotoPreviewUrl);localPhotoPreviewUrl=null}
  const file=e.target.files[0],img=$('productPhotoPreview');
  if(file){localPhotoPreviewUrl=URL.createObjectURL(file);img.src=localPhotoPreviewUrl;img.hidden=false}
  else{img.hidden=true;img.removeAttribute('src')}
});
async function compressedPhoto(file){
  if(!file.type.startsWith('image/')||file.size>20*1024*1024)throw Error('Select a photo up to 20 MB from your phone.');
  const objectUrl=URL.createObjectURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{const el=new Image();el.onload=()=>resolve(el);el.onerror=()=>reject(Error('Could not read this image. Try a JPG or PNG picture.'));el.src=objectUrl});
    const canvas=document.createElement('canvas');let max=1000;
    for(let round=0;round<4;round++){
      let scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('Photo editor not supported in this browser.');
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',Math.max(.55,.82-round*.08)));
      if(blob&&blob.size<=500*1024)return blob;
      max=Math.round(max*.75);
    }
    throw Error('Image is too large. Try a smaller picture.');
  }finally{URL.revokeObjectURL(objectUrl)}
}
async function uploadProductPhoto(productId,file){
  const jpeg=await compressedPhoto(file);
  const response=await fetch('/api/admin/products/'+encodeURIComponent(productId)+'/photo',{
    method:'POST',headers:{'Content-Type':'image/jpeg'},body:jpeg
  });
  let data;try{data=await response.json()}catch{throw Error('Photo upload failed on server')}
  if(!response.ok)throw Error(data.error||'Photo upload failed');
  return data;
}
$('resetProduct').addEventListener('click',()=>{$('productForm').reset();clearProductPhoto()});
$('productForm').addEventListener('submit',async e=>{e.preventDefault();let f=e.target,d=Object.fromEntries(new FormData(f)),id=d.id;d.price=Number(d.price);d.stock=Number(d.stock);d.discount_percent=Number(d.discount_percent||0);d.sale_start=toISO(d.sale_start);d.sale_end=toISO(d.sale_end);delete d.id;const photo=$('productPhoto').files[0],submit=f.querySelector('button[type=submit]');if(photo&&photo.size>20*1024*1024){msg('Choose a photo smaller than 20 MB.');return}submit.disabled=true;let saved=false;try{let product=await api('/admin/products'+(id?'/'+id:''),{method:id?'PUT':'POST',body:JSON.stringify(d)});saved=true;if(photo)await uploadProductPhoto(product.id,photo);f.reset();f.elements.id.value='';clearProductPhoto();await load();await refreshAdmin();msg(photo?'Product and photo saved successfully!':'Product saved successfully!')}catch(e){if(saved)await refreshAdmin().catch(()=>{});msg(e.message+(saved?' (Product details were saved; please try the photo again.)':''))}finally{submit.disabled=false}});
$('couponForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f));d.value=Number(d.value);d.min_order=Number(d.min_order||0);d.max_discount=d.max_discount?Number(d.max_discount):null;d.usage_limit=d.usage_limit?Number(d.usage_limit):null;d.starts_at=toISO(d.starts_at);d.expires_at=toISO(d.expires_at);d.code=d.code.toUpperCase();try{await api('/admin/coupons',{method:'POST',body:JSON.stringify(d)});f.reset();await refreshAdmin();msg('Coupon created! Share its code with customers.')}catch(err){msg(err.message)}});
$('settingsForm').addEventListener('submit',async e=>{e.preventDefault();try{await api('/admin/settings',{method:'PUT',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});await load();msg('Payment accounts saved')}catch(e){msg(e.message)}});
async function refreshAdmin(){if(!admin)return;try{adminProducts=await api('/admin/products');let orders=await api('/admin/orders');coupons=await api('/admin/coupons');$('adminCoupons').innerHTML=coupons.map(c=>`<div class="line coupon-admin-row"><div><b>${esc(c.code)} — ${c.kind==='percent'?c.value+'%':rs(c.value)}</b><small>${c.active?'ACTIVE':'PAUSED'} · Used ${c.used_count}/${c.usage_limit??'∞'} · Min ${rs(c.min_order)}${c.expires_at?' · Ends '+new Date(c.expires_at).toLocaleDateString():''}</small></div><button data-coupon-toggle="${c.id}" data-coupon-active="${!c.active}">${c.active?'Pause':'Activate'}</button></div>`).join('')||'<p>No coupon codes yet.</p>';$('adminOrders').innerHTML=orders.map(o=>`<div class="line"><b>Order #${o.id} · ${rs(o.total)}</b>${o.discount_total?`<small> · Discounts saved ${rs(o.discount_total)}${o.coupon_code?' · Coupon: '+esc(o.coupon_code):''}</small>`:''}<p>${esc(o.customer_name)} · ${esc(o.phone)} · ${esc(o.city)}, ${esc(o.province)} · ${esc(o.address)}</p><p>Payment: ${esc(o.payment_method)} · Reference: ${esc(o.payment_reference||'Not supplied')} — verify manually</p><select data-status="${o.id}">${['Pending','Confirmed','Preparing','Shipped','Delivered','Cancelled'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')||'<p>No orders yet</p>';renderAdmin()}catch(e){msg(e.message)}}document.addEventListener('change',async e=>{if(!e.target.dataset.status)return;try{await api('/admin/orders/'+e.target.dataset.status,{method:'PATCH',body:JSON.stringify({status:e.target.value})});msg('Order status updated')}catch(err){msg(err.message)}});
async function load(){try{[products,settings]=await Promise.all([api('/products'),api('/settings')]);couponPreview=null;for(let k of Object.keys(cart)){let p=products.find(x=>Number(x.id)===Number(k));if(!p)delete cart[k];else cart[k]=Math.min(cart[k],p.stock)}try{localStorage.setItem('kaliwal_catalog_v2',JSON.stringify({products,settings,savedAt:Date.now()}))}catch{}for(let [k,v] of Object.entries(settings))if($('settingsForm').elements[k])$('settingsForm').elements[k].value=v;render()}catch(e){try{const cached=JSON.parse(localStorage.getItem('kaliwal_catalog_v2')||'null');if(cached){products=cached.products||[];settings=cached.settings||{};render();msg('Offline catalog loaded. Prices and stock may have changed; reconnect before checkout.')}else msg('No saved catalog yet. Open the published store once while online.')}catch{msg('Cannot connect to server: '+e.message)}}}(async()=>{await load();try{admin=(await api('/me')).admin;if(admin)await refreshAdmin();render()}catch{}if(new URLSearchParams(location.search).get('admin')==='1')tab('admin')})();if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});connection();
})();
