const enc=new TextEncoder(),now=()=>Math.floor(Date.now()/1000),id=()=>crypto.randomUUID();
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const bytes=h=>Uint8Array.from(h.match(/.{2}/g),n=>parseInt(n,16));
const token=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const hash=async s=>hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const reply=(v,status=200,headers={})=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const stmt=(env,s,...v)=>env.DB.prepare(s).bind(...v);
const first=(env,s,...v)=>stmt(env,s,...v).first();
const all=async(env,s,...v)=>(await stmt(env,s,...v).all()).results;
const run=(env,s,...v)=>stmt(env,s,...v).run();
export async function passwordHash(password,salt=token()){
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const derived=await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytes(salt),iterations:100000,hash:'SHA-256'},key,256);
 return `pbkdf2:100000:${salt}:${hex(derived)}`;
}
const same=(a,b)=>{if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0;};
async function json(req){if(!req.headers.get('content-type')?.includes('application/json'))fail(415,'Use JSON.');const s=await readBody(req,16384);try{return JSON.parse(encToString(s));}catch{fail(400,'Invalid JSON.');}}
const encToString=b=>new TextDecoder().decode(b);
async function readBody(req,max){if(Number(req.headers.get('content-length'))>max)fail(413,'File is too large.');const reader=req.body?.getReader();if(!reader)return new Uint8Array();const chunks=[];let n=0;while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>max){await reader.cancel();fail(413,'File is too large.');}chunks.push(value);}const b=new Uint8Array(n);let offset=0;for(const c of chunks){b.set(c,offset);offset+=c.length;}return b;}
const text=(v,max=120)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail(400,'Enter a valid value.');return v.trim();};
const amount=v=>{if(!Number.isSafeInteger(v)||v<1||v>100000)fail(400,'Invalid amount.');return v;};
const admin=u=>{if(u.role!=='admin')fail(403,'Admin access required.');};
async function rate(env,key,limit){const k=await hash(key+':'+Math.floor(now()/300));const r=await first(env,'INSERT INTO auth_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits',k,now()+600);if(r.hits>limit)fail(429,'Too many attempts. Try again in five minutes.');await run(env,'DELETE FROM auth_limits WHERE expires_at < ?',now());}
const cookie=(req,t,seconds)=>`cq_session=${t}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${seconds}${new URL(req.url).protocol==='https:'?'; Secure':''}`;
async function session(req,env,user){const t=token();await run(env,'INSERT INTO sessions VALUES(?,?,?)',await hash(t),user.id,now()+2592000);return reply({user:{id:user.id,username:user.username,role:user.role}},200,{'Set-Cookie':cookie(req,t,2592000)});}
async function actor(req,env){const t=req.headers.get('cookie')?.match(/(?:^|; )cq_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!t)fail(401,'Sign in to continue.');const u=await first(env,'SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',await hash(t),now());if(!u)fail(401,'Sign in to continue.');return u;}
async function child(env,u,target){const who=u.role==='admin'?target:u.id;const c=await first(env,"SELECT id,username FROM users WHERE id=? AND role='child'",who||'');if(!c)fail(404,'Choose a child account.');return c;}
async function changed(p){const r=await p;if(r.meta.changes<1)fail(409,'This record has already changed. Refresh and try again.');}
function photoType(b){if(b[0]===255&&b[1]===216&&b[2]===255)return'image/jpeg';if(b.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return'image/png';if(encToString(b.slice(0,4))==='RIFF'&&encToString(b.slice(8,12))==='WEBP')return'image/webp';fail(415,'Use a JPEG, PNG or WebP photo.');}
async function api(req,env){
 const url=new URL(req.url),path=url.pathname,method=req.method;
 if(method!=='GET'&&method!=='HEAD'&&req.headers.get('origin')!==url.origin)fail(403,'Open the app on its own address before submitting.');
 if(path==='/api/status'&&method==='GET')return reply({storage:'cloudflare-d1',setupRequired:!(await first(env,'SELECT id FROM setup_lock WHERE id=1'))});
 if(['/api/setup','/api/signup','/api/login'].includes(path)&&method==='POST'){
  const b=await json(req),username=text(b.username,24).toLowerCase();if(!/^[a-z0-9_-]{3,24}$/.test(username))fail(400,'Use a nickname with 3–24 letters, numbers, _ or -.');
  await rate(env,'ip:'+(req.headers.get('cf-connecting-ip')||'local'),30);await rate(env,'user:'+username,10);
  if(typeof b.password!=='string'||b.password.length<12||b.password.length>128)fail(400,'Use a password with 12–128 characters.');
  if(path==='/api/login'){
   const u=await first(env,'SELECT * FROM users WHERE username=?',username);
   const stored=u?.password_hash||'pbkdf2:100000:'+('00'.repeat(32))+':'+('00'.repeat(32));
   if(!same(await passwordHash(b.password,stored.split(':')[2]),stored)||!u)fail(401,'Nickname or password is incorrect.');return session(req,env,u);
  }
  const uid=id(),pw=await passwordHash(b.password);let role;
  if(path==='/api/setup'){
   if(!env.SETUP_KEY||typeof b.setupKey!=='string'||!same(await hash(b.setupKey),await hash(env.SETUP_KEY)))fail(403,'The setup key is incorrect.');
   if(await first(env,'SELECT id FROM setup_lock WHERE id=1'))fail(409,'Setup is already complete.');role='admin';
   await env.DB.batch([stmt(env,'INSERT INTO users VALUES(?,?,?,?,?)',uid,username,pw,role,now()),stmt(env,'INSERT INTO setup_lock VALUES(1,?)',uid)]);
  }else{
   const code=await hash(text(b.invite,128)),invite=await first(env,'SELECT * FROM invites WHERE token_hash=? AND used_by IS NULL AND expires_at>?',code,now());if(!invite)fail(403,'This invitation is invalid or expired.');role=invite.role;
   // Insert plus guarded claim in one D1 transaction; race loses via SQL guard.
   await env.DB.batch([stmt(env,"INSERT INTO users SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM invites WHERE token_hash=? AND used_by IS NULL AND expires_at>?)",uid,username,pw,role,now(),code,now()),stmt(env,'UPDATE invites SET used_by=? WHERE token_hash=? AND used_by IS NULL',uid,code),stmt(env,'INSERT INTO signup_guard SELECT ? WHERE NOT EXISTS(SELECT 1 FROM users WHERE id=?)',uid,uid)]);
  }
  return session(req,env,{id:uid,username,role});
 }
 const u=await actor(req,env);
 if(path==='/api/logout'&&method==='POST'){const t=req.headers.get('cookie').match(/cq_session=([a-f0-9]{64})/)[1];await run(env,'DELETE FROM sessions WHERE token_hash=?',await hash(t));return reply({ok:true},200,{'Set-Cookie':cookie(req,'',0)});}
 if(path==='/api/me'&&method==='GET')return reply({user:u,children:u.role==='admin'?await all(env,"SELECT id,username FROM users WHERE role='child' ORDER BY username"):[]});
 if(path==='/api/invites'&&method==='POST'){admin(u);const b=await json(req);if(!['child','admin'].includes(b.role))fail(400,'Invalid role.');const t=token();await run(env,'INSERT INTO invites VALUES(?,?,?,?,NULL)',await hash(t),b.role,u.id,now()+604800);return reply({invite:t,role:b.role,expiresInDays:7},201);}
 if(path==='/api/gifts'&&method==='POST'){
  admin(u);const b=await json(req),c=await child(env,u,b.childId),n=amount(b.amount),name=text(b.name,120),key=text(b.id,36),code=text(b.code,69);
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(key)||!/^CQG1:[a-f0-9]{64}$/.test(code))fail(400,'Invalid gift reference.');
  const digest=await hash(code);if(await first(env,'SELECT id FROM gift_topups WHERE id=?',key))fail(409,'This gift reference was already used.');
  await run(env,'INSERT INTO gift_offers(id,token_hash,user_id,amount,name,actor_id,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',key,digest,c.id,n,name,u.id,now(),now()+604800);
  const saved=await first(env,'SELECT * FROM gift_offers WHERE id=?',key);
  if(saved.token_hash!==digest||saved.user_id!==c.id||saved.amount!==n||saved.name!==name||saved.actor_id!==u.id)fail(409,'This gift reference was already used.');
  return reply({ok:true,id:key,expiresAt:saved.expires_at},200);
 }
 if(['/api/gifts/inspect','/api/gifts/claim'].includes(path)&&method==='POST'){
  if(u.role!=='child')fail(403,'Sign in as the child receiving this gift.');await rate(env,'gift-scan:'+u.id,60);
  const b=await json(req),code=text(b.code,69);if(!/^CQG1:[a-f0-9]{64}$/.test(code))fail(400,'This is not a Chore Quest gift code.');
  const gift=await first(env,'SELECT g.*,a.username AS by_name FROM gift_offers g JOIN users a ON a.id=g.actor_id WHERE g.token_hash=? AND g.user_id=?',await hash(code),u.id);
  if(!gift)fail(404,'Gift not found for your account.');
  if(gift.status!=='claimed'&&gift.expires_at<=now())fail(409,'This gift has expired. Ask your admin for a new one.');
  if(path==='/api/gifts/claim'&&gift.status==='pending'){
   await run(env,"UPDATE gift_offers SET status='claimed' WHERE id=? AND user_id=? AND status='pending' AND expires_at>?",gift.id,u.id,now());
   const current=await first(env,'SELECT status FROM gift_offers WHERE id=?',gift.id);if(current.status!=='claimed')fail(409,'This gift has expired.');
  }
  return reply({id:gift.id,amount:gift.amount,name:gift.name,by:gift.by_name,claimed:path==='/api/gifts/claim'||gift.status==='claimed',expiresAt:gift.expires_at});
 }
 if(path==='/api/topups'&&method==='POST'){
  admin(u);const b=await json(req),c=await child(env,u,b.childId),n=amount(b.amount),name=text(b.name,120),key=text(b.id,36);
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(key))fail(400,'Invalid gift reference.');
  await run(env,'INSERT INTO gift_topups VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',key,c.id,n,name,u.id,now());
  const saved=await first(env,'SELECT * FROM gift_topups WHERE id=?',key);
  if(saved.user_id!==c.id||saved.amount!==n||saved.name!==name||saved.actor_id!==u.id)fail(409,'This gift reference was already used.');
  return reply({ok:true,id:key},200);
 }
 if(path==='/api/rules'&&method==='GET')return reply({rules:await all(env,'SELECT id,name,deduction,created_at FROM family_rules ORDER BY created_at DESC,rowid DESC')});
 if(path==='/api/rules'&&method==='POST'){admin(u);const b=await json(req),name=text(b.name,120);if(!Number.isSafeInteger(b.deduction)||b.deduction<0||b.deduction>100000)fail(400,'Invalid deduction.');await run(env,'INSERT INTO family_rules VALUES(?,?,?,?,?)',id(),name,b.deduction,u.id,now());return reply({ok:true},201);}
 if(path==='/api/state'&&method==='GET'){
  const c=await child(env,u,url.searchParams.get('child'));
  const chores=await all(env,'SELECT c.*,r.username AS by_name FROM chores c LEFT JOIN users r ON r.id=c.reviewed_by WHERE c.user_id=? ORDER BY c.created_at DESC,c.rowid DESC',c.id);
  const requests=await all(env,'SELECT r.*,a.username AS by_name FROM requests r LEFT JOIN users a ON a.id=r.reviewed_by WHERE r.user_id=? ORDER BY r.created_at DESC,r.rowid DESC',c.id);
  const ledger=await all(env,'SELECT l.*,a.username AS by_name FROM wallet_entries l JOIN users a ON a.id=l.actor_id WHERE l.user_id=? ORDER BY l.created_at DESC,l.id DESC',c.id);
  return reply({child:c,chores,requests,ledger});
 }
 if(path==='/api/photos'&&method==='POST'){
  if(u.role!=='child')fail(403,'Only children submit chores.');await rate(env,'upload:'+u.id,30);
  const b=await readBody(req,900000),mime=photoType(b),pid=id();await run(env,'DELETE FROM photos WHERE created_at < ? AND NOT EXISTS(SELECT 1 FROM chores WHERE chores.photo_id=photos.id)',now()-86400);await run(env,'INSERT INTO photos VALUES(?,?,?,?,?)',pid,u.id,mime,b.buffer,now());return reply({id:pid},201);
 }
 const photoMatch=path.match(/^\/api\/photos\/([a-f0-9-]{36})$/);
 if(photoMatch&&method==='GET'){
  const p=await first(env,'SELECT * FROM photos WHERE id=?',photoMatch[1]);if(!p||u.role!=='admin'&&p.user_id!==u.id)fail(404,'Photo not found.');return new Response(new Uint8Array(p.data),{headers:{'Content-Type':p.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }
 if(path==='/api/chores'&&method==='POST'){
  if(u.role!=='child')fail(403,'Only children submit chores.');const b=await json(req),name=text(b.name,80),note=b.note?text(b.note,200):'',pid=text(b.photoId,36);
  if(!await first(env,'SELECT id FROM photos WHERE id=? AND user_id=?',pid,u.id))fail(400,'Upload your photo first.');const cid=id();
  if(b.resubmitId)await changed(run(env,"UPDATE chores SET photo_id=?,note=?,status='pending' WHERE id=? AND user_id=? AND status='redo'",pid,note,b.resubmitId,u.id));
  else await run(env,"INSERT INTO chores(id,user_id,name,note,photo_id,status,created_at) VALUES(?,?,?,?,?,'pending',?)",cid,u.id,name,note,pid,now());return reply({ok:true},201);
 }
 const review=path.match(/^\/api\/chores\/([a-f0-9-]{36})\/review$/);
 if(review&&method==='POST'){admin(u);const b=await json(req);if(b.action==='redo')await changed(run(env,"UPDATE chores SET status='redo',reviewed_by=? WHERE id=? AND status='pending'",u.id,review[1]));else{if(b.action!=='approve'||!['well','basic'].includes(b.quality)||!Number.isSafeInteger(b.tip)||b.tip<0||b.tip>100000)fail(400,'Invalid reward.');await changed(run(env,"UPDATE chores SET status='approved',tip=?,quality=?,reviewed_by=? WHERE id=? AND status='pending'",b.tip,b.quality,u.id,review[1]));}return reply({ok:true});}
 if(path==='/api/requests'&&method==='POST'){if(u.role!=='child')fail(403,'Only children request funds.');const b=await json(req);if(!['cash','buy'].includes(b.kind))fail(400,'Invalid request.');const item=b.kind==='buy'?text(b.item):'';await run(env,'INSERT INTO requests(id,user_id,kind,item,amount,created_at) VALUES(?,?,?,?,?,?)',id(),u.id,b.kind,item,amount(b.amount),now());return reply({ok:true},201);}
 const requestMatch=path.match(/^\/api\/requests\/([a-f0-9-]{36})$/);
 if(requestMatch&&method==='POST'){const b=await json(req);if(!['completed','cancelled','declined'].includes(b.status))fail(400,'Invalid action.');if(b.status==='cancelled'){await changed(run(env,"UPDATE requests SET status='cancelled' WHERE id=? AND user_id=? AND status='pending'",requestMatch[1],u.id));}else{admin(u);await changed(run(env,"UPDATE requests SET status=?,reviewed_by=? WHERE id=? AND status='pending'",b.status,u.id,requestMatch[1]));}return reply({ok:true});}
 if(path==='/api/demerits'&&method==='POST'){admin(u);const b=await json(req),c=await child(env,u,b.childId),reasons={misbehavior:['Misbehavior',50],stomping:['Stomping',100],ipad:['iPad before 11am',100]},reason=b.ruleId?await first(env,'SELECT name,deduction FROM family_rules WHERE id=? AND deduction>0',text(b.ruleId,36)):reasons[b.reason];if(!reason)fail(400,'Choose a demerit.');await run(env,"INSERT INTO ledger(id,user_id,kind,amount,name,actor_id,created_at) VALUES(?,?,'demerit',?,?,?,?)",id(),c.id,-(b.ruleId?reason.deduction:reason[1]),b.ruleId?reason.name:reason[0],u.id,now());return reply({ok:true},201);}
 fail(404,'Not found.');
}
export default {async fetch(req,env){try{if(new URL(req.url).pathname.startsWith('/api/'))return await api(req,env);const r=await env.ASSETS.fetch(req);const headers=new Headers(r.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");return new Response(r.body,{status:r.status,headers});}catch(e){if(e.status)return reply({error:e.message},e.status);if(/photo_(user|family|pending)_quota/.test(String(e.message)))return reply({error:'Photo storage limit reached. Finish submitting uploaded chores or ask your admin to review storage.'},409);if(String(e.message).includes('insufficient_funds'))return reply({error:'Not enough available funds. Refresh your wallet.'},409);if(String(e.message).includes('UNIQUE constraint'))return reply({error:'This nickname or action is already in use.'},409);return reply({error:'Unable to save. Please try again.'},500);}}};
