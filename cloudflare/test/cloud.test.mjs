import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../src/worker.js';
function database(){const sql=new DatabaseSync(':memory:');for(const file of ['0001_initial.sql','0002_family_rules.sql','0003_gift_topups.sql','0004_gift_qr.sql','0005_photo_limits.sql'])sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));const prep=query=>({bind(...values){const args=values.map(v=>v instanceof ArrayBuffer?new Uint8Array(v):v);return{async first(){return sql.prepare(query).get(...args)||null;},async all(){return{results:sql.prepare(query).all(...args)};},async run(){const r=sql.prepare(query).run(...args);return{meta:{changes:Number(r.changes)}};}};}});return{sql,prepare:prep,async batch(stmts){sql.exec('BEGIN');try{const r=[];for(const s of stmts)r.push(await s.run());sql.exec('COMMIT');return r;}catch(e){sql.exec('ROLLBACK');throw e;}}};}
test('cloud authorization, photos, exact ledger, reservations and persistence',async t=>{
 const DB=database(),env={DB,SETUP_KEY:'test-only-key-not-a-real-credential'};t.after(()=>DB.sql.close());
 async function call(path,body,cookie='',raw=false,origin='https://quest.test'){const req=new Request('https://quest.test/api/'+path,{method:body===undefined?'GET':'POST',headers:{origin,cookie,'content-type':raw?'image/png':'application/json'},body:body===undefined?undefined:raw?body:JSON.stringify(body)});const r=await worker.fetch(req,env);const type=r.headers.get('content-type');const data=type?.includes('application/json')?await r.json():new Uint8Array(await r.arrayBuffer());return{r,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 assert.equal((await call('me')).r.status,401);
 assert.equal((await call('setup',{username:'uncle',password:'synthetic-password-123',setupKey:'wrong'})).r.status,403);
 const a=await call('setup',{username:'uncle',password:'synthetic-password-123',setupKey:env.SETUP_KEY});assert.equal(a.r.status,200);assert.match(a.r.headers.get('set-cookie'),/HttpOnly/);assert.match(a.r.headers.get('set-cookie'),/Secure/);
 assert.equal((await call('setup',{username:'other',password:'synthetic-password-123',setupKey:env.SETUP_KEY})).r.status,409);
 const invite=(await call('invites',{role:'child'},a.cookie)).data.invite;
 const c=await call('signup',{username:'child_one',password:'synthetic-password-123',invite,role:'admin'});assert.equal(c.r.status,200);assert.equal(c.data.user.role,'child');
 assert.equal((await call('signup',{username:'reuse_invite',password:'synthetic-password-123',invite})).r.status,403);
 const inv2=(await call('invites',{role:'child'},a.cookie)).data.invite;
 const c2=await call('signup',{username:'child_two',password:'synthetic-password-123',invite:inv2});
 const adminInvite=(await call('invites',{role:'admin'},a.cookie)).data.invite;
 const wife=await call('signup',{username:'second_admin',password:'synthetic-password-123',invite:adminInvite});
 for(const adminSession of [a.cookie,wife.cookie])for(const childId of [c.data.user.id,c2.data.user.id])assert.equal((await call('state?child='+childId,undefined,adminSession)).data.child.id,childId);
 assert.equal((await call('state?child='+c2.data.user.id,undefined,c.cookie)).data.child.id,c.data.user.id);
 assert.equal((await call('invites',{role:'admin'},c.cookie)).r.status,403);
 assert.equal((await call('requests',{kind:'cash',amount:1},c.cookie)).r.status,409);
 assert.equal((await call('photos',new TextEncoder().encode('<svg></svg>'),c.cookie,true)).r.status,415);
 const photo=new Uint8Array([137,80,78,71,13,10,26,10,0,0]);const up=await call('photos',photo,c.cookie,true);assert.equal(up.r.status,201);
 assert.equal((await call('photos/'+up.data.id,undefined,c2.cookie)).r.status,404);assert.equal((await call('photos/'+up.data.id,undefined,a.cookie)).r.status,200);
 assert.equal((await call('chores',{name:'Wash dishes',photoId:up.data.id},c2.cookie)).r.status,400);
 assert.equal((await call('chores',{name:'Wash dishes',photoId:up.data.id},c.cookie)).r.status,201);
 let state=(await call('state',undefined,c.cookie)).data;const chore=state.chores[0].id;assert.equal(state.ledger.length,0);
 assert.equal((await call('chores/'+chore+'/review',{action:'approve',tip:25,quality:'well'},c.cookie)).r.status,403);
 assert.equal((await call('chores/'+chore+'/review',{action:'approve',tip:25,quality:'well'},a.cookie)).r.status,200);
 assert.equal((await call('chores/'+chore+'/review',{action:'approve',tip:25,quality:'well'},a.cookie)).r.status,409);
 state=(await call('state',undefined,c.cookie)).data;assert.equal(state.ledger.length,1);assert.equal(state.ledger[0].amount,75);
 const race=await Promise.all([call('requests',{kind:'cash',amount:50},c.cookie),call('requests',{kind:'cash',amount:50},c.cookie)]);assert.deepEqual(race.map(r=>r.r.status).sort(),[201,409]);
 state=(await call('state',undefined,c.cookie)).data;const rid=state.requests[0].id;
 assert.equal((await call('requests/'+rid,{status:'completed'},c.cookie)).r.status,403);
 assert.equal((await call('requests/'+rid,{status:'cancelled'},c2.cookie)).r.status,409);
 assert.equal((await call('requests/'+rid,{status:'completed'},a.cookie)).r.status,200);
 assert.equal((await call('requests/'+rid,{status:'completed'},a.cookie)).r.status,409);
 state=(await call('state',undefined,c.cookie)).data;assert.equal(state.ledger.reduce((s,l)=>s+l.amount,0),25);
 assert.equal((await call('requests',{kind:'buy',amount:20,item:'Stickers'},c.cookie)).r.status,201);
 state=(await call('state',undefined,c.cookie)).data;const buy=state.requests.find(r=>r.status==='pending');assert.equal((await call('requests/'+buy.id,{status:'cancelled'},c.cookie)).r.status,200);
 assert.equal((await call('demerits',{childId:c.data.user.id,reason:'misbehavior'},c.cookie)).r.status,403);
 assert.equal((await call('demerits',{childId:c.data.user.id,reason:'misbehavior'},a.cookie)).r.status,201);
 assert.equal((await call('state?child='+c.data.user.id,undefined,c2.cookie)).data.child.id,c2.data.user.id);
 assert.equal((await call('requests',{kind:'cash',amount:1},c.cookie,false,'https://evil.test')).r.status,403);
 const login=await call('login',{username:'child_one',password:'synthetic-password-123'});assert.equal(login.r.status,200);state=(await call('state',undefined,login.cookie)).data;assert.equal(state.ledger.reduce((s,l)=>s+l.amount,0),-25);assert.equal(state.chores[0].status,'approved');
 assert.equal((await call('logout',{},login.cookie)).r.status,200);assert.equal((await call('me',undefined,login.cookie)).r.status,401);
 assert.equal((await call('login',{username:'child_one',password:'incorrect-long-password'})).r.status,401);
});
test('redo/resubmit, decline release, demerit hold guard and expiry branches',async t=>{
 const DB=database(),env={DB,SETUP_KEY:'synthetic-branch-key'};t.after(()=>DB.sql.close());
 async function call(path,body,cookie=''){
  const r=await worker.fetch(new Request('https://quest.test/api/'+path,{method:body===undefined?'GET':'POST',headers:{origin:'https://quest.test',cookie,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),env);
  return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
 }
 const a=await call('setup',{username:'branch_admin',password:'synthetic-password-123',setupKey:env.SETUP_KEY});assert.equal(a.status,200);
 const invitation=(await call('invites',{role:'child'},a.cookie)).data.invite;
 const c=await call('signup',{username:'branch_child',password:'synthetic-password-123',invite:invitation});assert.equal(c.status,200);
 const uid=c.data.user.id;
 const photo='11111111-1111-4111-8111-111111111111';
 DB.sql.prepare('INSERT INTO photos VALUES(?,?,?,?,?)').run(photo,uid,'image/png',new Uint8Array([137,80,78,71,13,10,26,10]),1);
 assert.equal((await call('chores',{name:'Custom chore',photoId:photo},c.cookie)).status,201);
 let s=(await call('state',undefined,c.cookie)).data;const cid=s.chores[0].id;
 assert.equal((await call('chores/'+cid+'/review',{action:'redo'},c.cookie)).status,403);
 assert.equal((await call('chores/'+cid+'/review',{action:'redo'},a.cookie)).status,200);
 s=(await call('state',undefined,c.cookie)).data;assert.equal(s.chores[0].status,'redo');assert.equal(s.ledger.length,0);
 assert.equal((await call('chores/'+cid+'/review',{action:'approve',quality:'basic',tip:0},a.cookie)).status,409);
 assert.equal((await call('chores',{name:'Custom chore',photoId:photo,resubmitId:cid},c.cookie)).status,201);
 assert.equal((await call('chores',{name:'Custom chore',photoId:photo,resubmitId:cid},c.cookie)).status,409);
 assert.equal((await call('chores/'+cid+'/review',{action:'approve',quality:'basic',tip:0},a.cookie)).status,200);
 s=(await call('state',undefined,c.cookie)).data;assert.equal(s.chores.length,1);assert.equal(s.ledger[0].amount,50);assert.equal(s.chores[0].quality,'basic');
 assert.equal((await call('requests',{kind:'buy',item:'Book',amount:40},c.cookie)).status,201);
 s=(await call('state',undefined,c.cookie)).data;let rid=s.requests.find(r=>r.status==='pending').id;
 assert.equal((await call('requests/'+rid,{status:'declined'},c.cookie)).status,403);
 assert.equal((await call('requests/'+rid,{status:'declined'},a.cookie)).status,200);
 assert.equal((await call('requests',{kind:'cash',amount:50},c.cookie)).status,201);
 s=(await call('state',undefined,c.cookie)).data;rid=s.requests.find(r=>r.status==='pending').id;
 assert.equal((await call('demerits',{childId:uid,reason:'stomping'},a.cookie)).status,201);
 assert.equal((await call('requests/'+rid,{status:'completed'},a.cookie)).status,409);
 s=(await call('state',undefined,c.cookie)).data;assert.equal(s.requests.find(r=>r.id===rid).status,'pending');assert.equal(s.ledger.reduce((sum,l)=>sum+l.amount,0),-50);assert.equal(s.ledger.filter(l=>l.kind==='spend').length,0);
 assert.equal((await call('requests/'+rid,{status:'cancelled'},c.cookie)).status,200);
 const expired=(await call('invites',{role:'child'},a.cookie)).data.invite;
 DB.sql.exec('UPDATE invites SET expires_at=0 WHERE used_by IS NULL');
 assert.equal((await call('signup',{username:'expired_child',password:'synthetic-password-123',invite:expired})).status,403);
 DB.sql.prepare('UPDATE sessions SET expires_at=0 WHERE user_id=?').run(uid);
 assert.equal((await call('me',undefined,c.cookie)).status,401);
});

test('only admins add shared rules; custom demerits use stored cents and preserve history',async t=>{
 const DB=database(),env={DB,SETUP_KEY:'synthetic-rule-key'};t.after(()=>DB.sql.close());
 async function call(path,body,cookie=''){const r=await worker.fetch(new Request('https://quest.test/api/'+path,{method:body===undefined?'GET':'POST',headers:{origin:'https://quest.test',cookie,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),env);return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 assert.equal((await call('rules')).status,401);
 const a=await call('setup',{username:'rules_admin',password:'synthetic-password-123',setupKey:env.SETUP_KEY});
 assert.equal((await call('rules',{name:'Be kind',deduction:0},a.cookie)).status,201);
 const inv=(await call('invites',{role:'child'},a.cookie)).data.invite;
 const c=await call('signup',{username:'rules_child',password:'synthetic-password-123',invite:inv});
 assert.equal((await call('rules',{name:'Forged',deduction:0},c.cookie)).status,403);
 assert.equal((await call('rules',{name:'',deduction:0},a.cookie)).status,400);
 assert.equal((await call('rules',{name:'Invalid',deduction:0.5},a.cookie)).status,400);
 assert.equal((await call('rules',{name:'Invalid',deduction:-1},a.cookie)).status,400);
 assert.equal((await call('rules',{name:'Tidy toys',deduction:75},a.cookie)).status,201);
 const rules=(await call('rules',undefined,c.cookie)).data.rules;assert.equal(rules.length,2);assert.equal(rules[0].deduction,75);
 let state=(await call('state',undefined,c.cookie)).data;assert.equal(state.ledger.length,0);
 assert.equal((await call('demerits',{childId:c.data.user.id,ruleId:rules[0].id,amount:1},c.cookie)).status,403);
 assert.equal((await call('demerits',{childId:c.data.user.id,ruleId:rules[1].id},a.cookie)).status,400);
 assert.equal((await call('demerits',{childId:c.data.user.id,ruleId:rules[0].id,amount:1},a.cookie)).status,201);
 state=(await call('state',undefined,c.cookie)).data;assert.equal(state.ledger[0].amount,-75);assert.equal(state.ledger[0].name,'Tidy toys');
 const login=await call('login',{username:'rules_child',password:'synthetic-password-123'});assert.equal((await call('rules',undefined,login.cookie)).data.rules.length,2);
});

test('admin gifts are idempotent, child-owned, separate from chores and cashable once',async t=>{
 const DB=database(),env={DB,SETUP_KEY:'synthetic-gift-key'};t.after(()=>DB.sql.close());
 async function call(path,body,cookie=''){const r=await worker.fetch(new Request('https://quest.test/api/'+path,{method:body===undefined?'GET':'POST',headers:{origin:'https://quest.test',cookie,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),env);return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 const a=await call('setup',{username:'gift_admin',password:'synthetic-password-123',setupKey:env.SETUP_KEY});
 async function signup(name){const invite=(await call('invites',{role:'child'},a.cookie)).data.invite;return call('signup',{username:name,password:'synthetic-password-123',invite});}
 const c=await signup('gift_child'),other=await signup('other_child');const payload={id:crypto.randomUUID(),childId:c.data.user.id,name:'Birthday gift',amount:1000};
 assert.equal((await call('topups',payload)).status,401);assert.equal((await call('topups',payload,c.cookie)).status,403);
 for(const amount of [0,-1,0.5,100001])assert.equal((await call('topups',{...payload,amount},a.cookie)).status,400);
 assert.equal((await call('topups',{...payload,childId:a.data.user.id},a.cookie)).status,404);
 const race=await Promise.all([call('topups',payload,a.cookie),call('topups',payload,a.cookie)]);assert.deepEqual(race.map(r=>r.status),[200,200]);
 assert.equal((await call('topups',{...payload,amount:2000},a.cookie)).status,409);
 let state=(await call('state',undefined,c.cookie)).data;assert.equal(state.ledger.length,1);assert.equal(state.ledger[0].kind,'gift');assert.equal(state.ledger[0].amount,1000);assert.equal(state.chores.length,0);
 assert.equal((await call('state?child='+c.data.user.id,undefined,other.cookie)).data.ledger.length,0);
 assert.equal((await call('requests',{kind:'cash',amount:1000},c.cookie)).status,201);assert.equal((await call('requests',{kind:'cash',amount:1},c.cookie)).status,409);
 state=(await call('state',undefined,c.cookie)).data;const request=state.requests[0].id;
 assert.equal((await call('requests/'+request,{status:'completed'},a.cookie)).status,200);assert.equal((await call('requests/'+request,{status:'completed'},a.cookie)).status,409);
 state=(await call('state',undefined,c.cookie)).data;assert.equal(state.ledger.reduce((s,l)=>s+l.amount,0),0);assert.equal(state.ledger.filter(l=>l.kind==='gift').length,1);assert.equal(state.ledger.filter(l=>l.kind==='spend').length,1);
});

test('QR gifts require recipient confirmation and credit once under concurrent claims',async t=>{
 const DB=database(),env={DB,SETUP_KEY:'synthetic-qr-setup'};t.after(()=>DB.sql.close());
 async function call(path,body,cookie='',origin='https://quest.test'){const r=await worker.fetch(new Request('https://quest.test/api/'+path,{method:body===undefined?'GET':'POST',headers:{origin,cookie,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),env);return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 const a=await call('setup',{username:'qr_admin',password:'synthetic-password-123',setupKey:env.SETUP_KEY});
 async function kid(name){const i=await call('invites',{role:'child'},a.cookie);return call('signup',{username:name,password:'synthetic-password-123',invite:i.data.invite});}
 const c=await kid('qr_child'),other=await kid('qr_other');
 const payload={id:crypto.randomUUID(),childId:c.data.user.id,amount:1000,name:'Birthday gift',code:'CQG1:'+'ab'.repeat(32)};
 assert.equal((await call('gifts',payload)).status,401);assert.equal((await call('gifts',payload,c.cookie)).status,403);
 assert.equal((await call('gifts',{...payload,amount:0},a.cookie)).status,400);
 assert.equal((await call('gifts',{...payload,code:'http://untrusted.test'},a.cookie)).status,400);
 assert.equal((await call('gifts',payload,a.cookie,'https://untrusted.test')).status,403);
 const creates=await Promise.all([call('gifts',payload,a.cookie),call('gifts',payload,a.cookie)]);assert.deepEqual(creates.map(x=>x.status),[200,200]);
 assert.equal((await call('gifts',{...payload,amount:999},a.cookie)).status,409);
 assert.equal(DB.sql.prepare('SELECT COUNT(*) AS n FROM gift_offers').get().n,1);
 const stored=DB.sql.prepare('SELECT * FROM gift_offers').get();assert.notEqual(stored.token_hash,payload.code);assert.equal(stored.status,'pending');
 assert.equal((await call('state',undefined,c.cookie)).data.ledger.length,0);
 assert.equal((await call('gifts/inspect',{code:payload.code},a.cookie)).status,403);
 assert.equal((await call('gifts/inspect',{code:payload.code},other.cookie)).status,404);
 assert.equal((await call('gifts/claim',{code:payload.code},other.cookie)).status,404);
 const preview=await call('gifts/inspect',{code:payload.code},c.cookie);assert.equal(preview.data.amount,1000);assert.equal(preview.data.claimed,false);
 assert.equal((await call('state',undefined,c.cookie)).data.ledger.length,0);
 const claims=await Promise.all([call('gifts/claim',{code:payload.code,amount:999999},c.cookie),call('gifts/claim',{code:payload.code},c.cookie)]);assert.deepEqual(claims.map(x=>x.status),[200,200]);
 assert.equal((await call('gifts/claim',{code:payload.code},c.cookie)).status,200);
 const state=(await call('state',undefined,c.cookie)).data;assert.equal(state.ledger.length,1);assert.equal(state.ledger[0].amount,1000);assert.equal(state.ledger[0].kind,'gift');assert.equal(state.chores.length,0);
 assert.equal((await call('gifts/inspect',{code:payload.code},c.cookie)).data.claimed,true);
 assert.equal((await call('requests',{kind:'cash',amount:1000},c.cookie)).status,201);assert.equal((await call('requests',{kind:'cash',amount:1},c.cookie)).status,409);
 const expired={...payload,id:crypto.randomUUID(),code:'CQG1:'+'cd'.repeat(32)};await call('gifts',expired,a.cookie);DB.sql.prepare('UPDATE gift_offers SET expires_at=0 WHERE id=?').run(expired.id);
 assert.equal((await call('gifts/inspect',{code:expired.code},c.cookie)).status,409);assert.equal((await call('gifts/claim',{code:expired.code},c.cookie)).status,409);
 assert.equal(DB.sql.prepare('SELECT COUNT(*) AS n FROM gift_topups').get().n,1);
 assert.equal((await call('gifts/inspect',{code:'CQG1:'+'00'.repeat(32)},c.cookie)).status,404);
});
