'use strict';
require('dotenv').config();
const express=require('express'),helmet=require('helmet'),session=require('express-session'),PgSession=require('connect-pg-simple')(session),bcrypt=require('bcryptjs'),rateLimit=require('express-rate-limit');
const {Pool}=require('pg');
const crypto=require('crypto');
for(const key of ['DATABASE_URL','SESSION_SECRET','ADMIN_EMAIL','ADMIN_PASSWORD'])if(!process.env[key]){console.error('Missing '+key);process.exit(1)}
if(process.env.SESSION_SECRET.length<32){console.error('SESSION_SECRET must be at least 32 characters');process.exit(1)}
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:true}:undefined});
const app=express();app.disable('x-powered-by');if(process.env.NODE_ENV==='production')app.set('trust proxy',1);app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html'); });
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'"],imgSrc:["'self'","https:","data:"],connectSrc:["'self'"],objectSrc:["'none'"],upgradeInsecureRequests:process.env.NODE_ENV==='production'?[]:null}}}));
app.use(express.json({limit:'30kb'}));app.use(session({store:new PgSession({pool,createTableIfMissing:true}),name:'kw.sid',secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:1000*60*60*12}}));
app.use('/api', (req,res,next)=>{if(['POST','PUT','PATCH','DELETE'].includes(req.method)){const origin=req.get('origin');if(origin){try{if(new URL(origin).host!==req.get('host'))return res.status(403).json({error:'Origin not allowed'})}catch{return res.status(403).json({error:'Invalid origin'})}}}next()});
app.use(express.static(__dirname,{extensions:['html']}));
const run=(q,args=[])=>pool.query(q,args);const fail=(res,e)=>{console.error(e);res.status(500).json({error:'Server error'})};const admin=(req,res,next)=>req.session.admin?next():res.status(401).json({error:'Admin login required'});
const str=(v,max=120)=>String(v??'').trim().slice(0,max);
const money=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000;
const count=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000;
const positiveInt=n=>Number.isSafeInteger(n)&&n>0&&n<=100000000;
const couponName=s=>str(s,24).toUpperCase();
const validCouponName=s=>/^[A-Z0-9_-]{3,24}$/.test(s);
const isoDate=(v)=>{if(!v)return null;const d=new Date(v);return Number.isFinite(d.getTime())?d.toISOString():undefined};
function parseSale(x){
 const percent=Number(x.discount_percent??0), start=isoDate(x.sale_start),end=isoDate(x.sale_end);
 if(!Number.isInteger(percent)||percent<0||percent>90||start===undefined||end===undefined||(start&&end&&start>=end))return null;
 return {percent,start,end};
}
function saleInfo(p,now=Date.now()){
 const pct=Number(p.discount_percent)||0;
 const active=pct>0 && Number(p.price)>0 && (!p.sale_start||new Date(p.sale_start).getTime()<=now) && (!p.sale_end||new Date(p.sale_end).getTime()>now);
 return {sale_price:active?Math.max(1,Math.round(Number(p.price)*(100-pct)/100)):Number(p.price),
  discount_active:active,discount_display:active?pct:0};
}
function listQty(items){
 if(!Array.isArray(items)||!items.length||items.length>40)throw Error('Invalid cart');
 const qty=new Map();
 for(const i of items){let id=Number(i.id),n=Number(i.qty);
  if(!Number.isSafeInteger(id)||id<1||!Number.isInteger(n)||n<1||n>100)throw Error('Invalid quantity');
  qty.set(id,(qty.get(id)||0)+n);
  if(qty.get(id)>100)throw Error('Maximum 100 per product');
 }
 return qty;
}
function priceItems(rows,qty){
 if(rows.length!==qty.size)throw Error('Product unavailable');
 let subtotal=0,original=0;
 for(const p of rows){const n=qty.get(Number(p.id));if(n>p.stock)throw Error('Insufficient stock: '+p.name);
  const info=saleInfo(p);p.current_price=info.sale_price;
  subtotal+=p.current_price*n;original+=Number(p.price)*n;
 }
 if(subtotal>100000000||original>100000000)throw Error('Order total too large');
 return {subtotal,original};
}
function calculateCoupon(c,subtotal){
 if(!c||!c.active)throw Error('Coupon is invalid or inactive');
 const now=Date.now();
 if(c.starts_at&&new Date(c.starts_at).getTime()>now)throw Error('Coupon is not active yet');
 if(c.expires_at&&new Date(c.expires_at).getTime()<=now)throw Error('Coupon has expired');
 if(c.usage_limit!==null&&Number(c.used_count)>=Number(c.usage_limit))throw Error('Coupon usage limit reached');
 if(subtotal<Number(c.min_order))throw Error('This coupon requires a minimum order of Rs. '+Number(c.min_order).toLocaleString('en-PK'));
 let value=c.kind==='percent'?Math.round(subtotal*Number(c.value)/100):Number(c.value);
 if(c.max_discount!==null)value=Math.min(value,Number(c.max_discount));
 return Math.max(0,Math.min(value,Math.max(0,subtotal-1))); // Keep a positive payable amount.
}
function customerErr(res,e){
 const allowed=['Invalid cart','Invalid quantity','Maximum 100 per product','Product unavailable','Payment method not configured','Order total too large','Coupon is invalid or inactive','Coupon is not active yet','Coupon has expired','Coupon usage limit reached'];
 if(allowed.includes(e.message)||e.message.startsWith('Insufficient stock:')||e.message.startsWith('This coupon requires a minimum order'))return res.status(400).json({error:e.message});
 fail(res,e);
}
async function init(){await run(`CREATE TABLE IF NOT EXISTS products(id BIGSERIAL PRIMARY KEY,name TEXT NOT NULL,urdu TEXT NOT NULL DEFAULT '',category TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>=0),stock INTEGER NOT NULL CHECK(stock>=0),size TEXT NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '',image_url TEXT NOT NULL DEFAULT '',active BOOLEAN NOT NULL DEFAULT TRUE);CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL DEFAULT '');CREATE TABLE IF NOT EXISTS orders(id BIGSERIAL PRIMARY KEY,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),customer_name TEXT NOT NULL,phone TEXT NOT NULL,city TEXT NOT NULL,province TEXT NOT NULL,address TEXT NOT NULL,payment_method TEXT NOT NULL,payment_reference TEXT NOT NULL DEFAULT '',total INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'Pending',tracking_token TEXT NOT NULL UNIQUE);CREATE TABLE IF NOT EXISTS order_items(id BIGSERIAL PRIMARY KEY,order_id BIGINT NOT NULL REFERENCES orders(id),product_id BIGINT NOT NULL,product_name TEXT NOT NULL,qty INTEGER NOT NULL,unit_price INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS admin_users(email TEXT PRIMARY KEY,password_hash TEXT NOT NULL);CREATE TABLE IF NOT EXISTS product_images(product_id BIGINT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,mime_type TEXT NOT NULL CHECK(mime_type IN ('image/jpeg')),image_data BYTEA NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
// Additive migrations: no existing product, stock, customer, image, or order is deleted.
await run(`ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_start TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_end TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS original_price INTEGER;
CREATE TABLE IF NOT EXISTS coupons (
 id BIGSERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL,
 kind TEXT NOT NULL CHECK (kind IN ('percent','fixed')),
 value INTEGER NOT NULL CHECK(value>0),
 min_order INTEGER NOT NULL DEFAULT 0 CHECK(min_order>=0),
 max_discount INTEGER CHECK(max_discount>0),
 usage_limit INTEGER CHECK(usage_limit>0),
 used_count INTEGER NOT NULL DEFAULT 0 CHECK(used_count>=0),
 starts_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`);
let email=process.env.ADMIN_EMAIL.toLowerCase().trim();let found=await run('SELECT email FROM admin_users WHERE email=$1',[email]);if(!found.rowCount)await run('INSERT INTO admin_users(email,password_hash) VALUES($1,$2)',[email,await bcrypt.hash(process.env.ADMIN_PASSWORD,12)]);
if(!(await run('SELECT id FROM products LIMIT 1')).rowCount){for(const p of [['Pure Honey','خالص شہد','Honey',1800,25,'500 g'],['Premium Dry Fruits','اعلیٰ خشک میوہ جات','Dry Fruits',2500,20,'1 kg'],['Pure Mustard Oil','خالص سرسوں کا تیل','Mustard Oil',950,40,'1 L'],['Pure Cow Ghee','خالص دیسی گھی','Cow Ghee',3200,18,'1 kg'],['Olive Oil','زیتون کا تیل','Olive Oil',2200,15,'500 ml']])await run('INSERT INTO products(name,urdu,category,price,stock,size) VALUES($1,$2,$3,$4,$5,$6)',p)} }
app.get('/api/products',async(req,res)=>{try{res.json((await run('SELECT * FROM products WHERE active=true ORDER BY id DESC')).rows.map(p=>({...p,...saleInfo(p)})))}catch(e){fail(res,e)}});
app.get('/api/settings',async(req,res)=>{try{let r=await run('SELECT key,value FROM settings');res.json(Object.fromEntries(r.rows.map(x=>[x.key,x.value])))}catch(e){fail(res,e)}});
app.get('/api/me',(req,res)=>res.json({admin:!!req.session.admin}));
app.post('/api/login',rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false}),async(req,res)=>{try{const email=str(req.body.email,150).toLowerCase(),password=String(req.body.password||'');let r=await run('SELECT password_hash FROM admin_users WHERE email=$1',[email]);if(!r.rowCount||!(await bcrypt.compare(password,r.rows[0].password_hash)))return res.status(401).json({error:'Incorrect credentials'});req.session.regenerate(err=>{if(err)return fail(res,err);req.session.admin=email;res.json({ok:true})})}catch(e){fail(res,e)}});
app.post('/api/logout',admin,(req,res)=>req.session.destroy(()=>{res.clearCookie('kw.sid');res.json({ok:true})}));

// Product photographs: private upload, permanent PostgreSQL storage, public read-only image.
app.get('/api/product-images/:id',async(req,res)=>{
  try{
    if(!/^[1-9]\d*$/.test(req.params.id))return res.sendStatus(404);
    const r=await run('SELECT mime_type,image_data FROM product_images WHERE product_id=$1',[req.params.id]);
    if(!r.rowCount)return res.sendStatus(404);
    res.set({'Content-Type':r.rows[0].mime_type,'Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'});
    res.send(r.rows[0].image_data);
  }catch(e){fail(res,e)}
});
app.post('/api/admin/products/:id/photo',admin,express.raw({type:'image/jpeg',limit:'512kb'}),async(req,res)=>{
  try{
    if(!/^[1-9]\d*$/.test(req.params.id))return res.status(400).json({error:'Invalid product'});
    const bytes=req.body;
    if(req.get('content-type')?.split(';')[0].toLowerCase()!=='image/jpeg'||!Buffer.isBuffer(bytes)||bytes.length<100||bytes.length>512*1024||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff)return res.status(400).json({error:'Please select a JPEG picture smaller than 512KB'});
    const r=await run('SELECT id FROM products WHERE id=$1',[req.params.id]);
    if(!r.rowCount)return res.status(404).json({error:'Product not found'});
    await run(`INSERT INTO product_images(product_id,mime_type,image_data) VALUES($1,'image/jpeg',$2)
     ON CONFLICT(product_id) DO UPDATE SET image_data=EXCLUDED.image_data,mime_type=EXCLUDED.mime_type,updated_at=now()`,[req.params.id,bytes]);
    const url='/api/product-images/'+req.params.id;
    await run('UPDATE products SET image_url=$1 WHERE id=$2',[url,req.params.id]);
    res.json({ok:true,image_url:url});
  }catch(e){fail(res,e)}
});
app.get('/api/admin/products',admin,async(req,res)=>{try{res.json((await run('SELECT * FROM products ORDER BY id DESC')).rows)}catch(e){fail(res,e)}});
app.post('/api/admin/products',admin,async(req,res)=>{try{let x=req.body;if(!str(x.name)||!money(x.price)||!count(x.stock))return res.status(400).json({error:'Invalid product data'});let sale=parseSale(x);if(!sale)return res.status(400).json({error:'Invalid sale percent or sale dates'});let args=[str(x.name),str(x.urdu),str(x.category,40)||'Other',x.price,x.stock,str(x.size,40),str(x.description,500),str(x.image_url,500),sale.percent,sale.start,sale.end];if(args[7]&&!(/^https:\/\//.test(args[7])||/^\/api\/product-images\/[1-9]\d*$/.test(args[7])))return res.status(400).json({error:'Image must be an HTTPS URL or a saved KALIWAL photo'});let r=await run('INSERT INTO products(name,urdu,category,price,stock,size,description,image_url,discount_percent,sale_start,sale_end) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',args);res.json(r.rows[0])}catch(e){fail(res,e)}});
app.put('/api/admin/products/:id',admin,async(req,res)=>{try{let x=req.body;if(!str(x.name)||!money(x.price)||!count(x.stock))return res.status(400).json({error:'Invalid product data'});let sale=parseSale(x);if(!sale)return res.status(400).json({error:'Invalid sale percent or sale dates'});let args=[str(x.name),str(x.urdu),str(x.category,40)||'Other',x.price,x.stock,str(x.size,40),str(x.description,500),str(x.image_url,500),req.params.id,sale.percent,sale.start,sale.end];if(args[7]&&!(/^https:\/\//.test(args[7])||/^\/api\/product-images\/[1-9]\d*$/.test(args[7])))return res.status(400).json({error:'Image must be an HTTPS URL or a saved KALIWAL photo'});let r=await run('UPDATE products SET name=$1,urdu=$2,category=$3,price=$4,stock=$5,size=$6,description=$7,image_url=$8,discount_percent=$10,sale_start=$11,sale_end=$12 WHERE id=$9 RETURNING *',args);if(!r.rowCount)return res.status(404).json({error:'Not found'});res.json(r.rows[0])}catch(e){fail(res,e)}});
app.delete('/api/admin/products/:id',admin,async(req,res)=>{try{await run('UPDATE products SET active=false WHERE id=$1',[req.params.id]);res.json({ok:true})}catch(e){fail(res,e)}});
app.put('/api/admin/settings',admin,async(req,res)=>{try{for(const k of ['jazz','jazzName','easy','easyName','bank','bankName','iban','support'])await run('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=$2',[k,str(req.body[k],120)]);res.json({ok:true})}catch(e){fail(res,e)}});
// Discount codes: only a signed-in store owner can create or deactivate a coupon.
app.get('/api/admin/coupons',admin,async(req,res)=>{try{res.json((await run('SELECT * FROM coupons ORDER BY id DESC LIMIT 200')).rows)}catch(e){fail(res,e)}});
app.post('/api/admin/coupons',admin,async(req,res)=>{try{
 const x=req.body||{},code=couponName(x.code),kind=x.kind,value=Number(x.value),min=Number(x.min_order??0),max=x.max_discount?Number(x.max_discount):null,limit=x.usage_limit?Number(x.usage_limit):null,starts=isoDate(x.starts_at),ends=isoDate(x.expires_at);
 if(!validCouponName(code)||!['percent','fixed'].includes(kind)||!positiveInt(value)||(kind==='percent'&&value>90)||!money(min)||(max!==null&&!positiveInt(max))||(limit!==null&&(!Number.isSafeInteger(limit)||limit>1000000||limit<1))||starts===undefined||ends===undefined||(starts&&ends&&starts>=ends))return res.status(400).json({error:'Check coupon code, value, dates, or limits'});
 let r=await run('INSERT INTO coupons(code,kind,value,min_order,max_discount,usage_limit,starts_at,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[code,kind,value,min,max,limit,starts,ends]);res.status(201).json(r.rows[0]);
 }catch(e){if(e.code==='23505')return res.status(409).json({error:'This coupon code already exists'});fail(res,e)}});
app.patch('/api/admin/coupons/:id',admin,async(req,res)=>{try{
 if(!/^[1-9]\d*$/.test(req.params.id)||typeof req.body.active!=='boolean')return res.status(400).json({error:'Invalid coupon update'});
 const r=await run('UPDATE coupons SET active=$1 WHERE id=$2 RETURNING *',[req.body.active,req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Coupon not found'});res.json(r.rows[0]);
 }catch(e){fail(res,e)}});
// Price preview only. Checkout repeats all checks and computes prices on the server.
app.post('/api/coupons/validate',rateLimit({windowMs:15*60*1000,limit:50,standardHeaders:'draft-7',legacyHeaders:false}),async(req,res)=>{try{
 let qty=listQty(req.body.items),rows=(await run('SELECT * FROM products WHERE id=ANY($1::bigint[]) AND active=true',[Array.from(qty.keys())])).rows;
 const {subtotal,original}=priceItems(rows,qty),code=couponName(req.body.code);
 if(!validCouponName(code))return res.status(400).json({error:'Enter a valid coupon code'});
 const cr=await run('SELECT * FROM coupons WHERE code=$1',[code]);const coupon_discount=calculateCoupon(cr.rows[0],subtotal);
 res.json({code,subtotal,original,sale_savings:original-subtotal,coupon_discount,total:subtotal-coupon_discount});
 }catch(e){customerErr(res,e)}});
app.post('/api/orders',rateLimit({windowMs:15*60*1000,limit:15}),async(req,res)=>{
 let client;
 try{
  const b=req.body||{};
  if(!str(b.name)||!/^0?3\d{9}$/.test(str(b.phone).replace(/[\s-]/g,''))||!str(b.city)||!str(b.address)||!str(b.province)||!['JazzCash','Easypaisa','Bank Transfer'].includes(b.payment))return res.status(400).json({error:'Check order and Pakistani mobile number'});
  let qty=listQty(b.items);
  client=await pool.connect();await client.query('BEGIN');
  let items=(await client.query('SELECT * FROM products WHERE id=ANY($1::bigint[]) AND active=true FOR UPDATE',[Array.from(qty.keys())])).rows;
  const {subtotal,original}=priceItems(items,qty);
  let couponCode=couponName(b.coupon_code),couponDiscount=0;
  if(couponCode){
   if(!validCouponName(couponCode))throw Error('Coupon is invalid or inactive');
   const cr=await client.query('SELECT * FROM coupons WHERE code=$1 FOR UPDATE',[couponCode]);
   couponDiscount=calculateCoupon(cr.rows[0],subtotal);
  }
  const total=subtotal-couponDiscount;
  let settings=(await client.query('SELECT key,value FROM settings')).rows;
  let s=Object.fromEntries(settings.map(x=>[x.key,x.value]));
  if(!(b.payment==='JazzCash'?s.jazz:b.payment==='Easypaisa'?s.easy:s.iban))throw Error('Payment method not configured');
  let token=crypto.randomBytes(18).toString('hex');
  let order=(await client.query(`INSERT INTO orders(customer_name,phone,city,province,address,payment_method,payment_reference,total,tracking_token,subtotal,discount_total,coupon_code)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id,tracking_token,status`,
   [str(b.name,90),str(b.phone,20),str(b.city,70),str(b.province,60),str(b.address,400),b.payment,str(b.reference,100),total,token,original,original-total,couponCode])).rows[0];
  for(const p of items){
   const n=qty.get(Number(p.id));
   await client.query('INSERT INTO order_items(order_id,product_id,product_name,qty,unit_price,original_price) VALUES($1,$2,$3,$4,$5,$6)',[order.id,p.id,p.name,n,p.current_price,p.price]);
   await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2',[n,p.id]);
  }
  if(couponCode)await client.query('UPDATE coupons SET used_count=used_count+1 WHERE code=$1',[couponCode]);
  await client.query('COMMIT');
  res.status(201).json({...order,total,subtotal:original,discount_total:original-total,coupon_discount:couponDiscount,sale_savings:original-subtotal,coupon_code:couponCode,payment_status:'Unverified',message:'Order placed. Payment is NOT automatically verified.'});
 }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});customerErr(res,e)}finally{if(client)client.release()}
});
app.get('/api/orders/track/:token',async(req,res)=>{try{if(!/^[a-f0-9]{36}$/.test(req.params.token))return res.status(404).json({error:'Not found'});let r=await run('SELECT id,created_at,total,status,payment_method,subtotal,discount_total,coupon_code FROM orders WHERE tracking_token=$1',[req.params.token]);if(!r.rowCount)return res.status(404).json({error:'Not found'});res.json(r.rows[0])}catch(e){fail(res,e)}});
app.get('/api/admin/orders',admin,async(req,res)=>{try{res.json((await run('SELECT id,created_at,customer_name,phone,city,province,address,payment_method,payment_reference,total,status,subtotal,discount_total,coupon_code FROM orders ORDER BY id DESC LIMIT 200')).rows)}catch(e){fail(res,e)}});
app.patch('/api/admin/orders/:id',admin,async(req,res)=>{try{let status=str(req.body.status,30);if(!['Pending','Confirmed','Preparing','Shipped','Delivered','Cancelled'].includes(status))return res.status(400).json({error:'Invalid status'});let r=await run('UPDATE orders SET status=$1 WHERE id=$2 RETURNING id,status',[status,req.params.id]);res.json(r.rows[0]||{error:'Not found'})}catch(e){fail(res,e)}});
app.use('/api',(req,res)=>res.status(404).json({error:'Not found'}));
init().then(()=>app.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('KALIWAL server ready'))).catch(e=>{console.error('Database initialization failed',e);process.exit(1)});
