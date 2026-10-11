import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../member-card.js',import.meta.url),'utf8');
function context(stored,blocked=false){
 const seen=[],removed=[];
 const ctx=vm.createContext({pixelOrbMarkup:()=>'<svg></svg>',show(){},motionPreference:null,cloudUser:{id:'signed-in-child'},document:{addEventListener(){}},sessionStorage:{getItem(){if(blocked)throw Error('blocked');return stored;},removeItem(key){removed.push(key);}},esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),money:n=>'$'+(n/100).toFixed(2)});
 vm.runInContext(source,ctx);ctx.showMemberCard=v=>seen.push(v);return {ctx,seen,removed};
}
test('welcome reveal matches authenticated identity and survives unavailable storage',()=>{
 const match=context('signed-in-child');vm.runInContext('revealNewMemberCard()',match.ctx);assert.deepEqual(match.seen,[true]);assert.deepEqual(match.removed,['cq-welcome-card']);
 const other=context('another-child');vm.runInContext('revealNewMemberCard()',other.ctx);assert.equal(other.seen.length,0);assert.equal(other.removed.length,0);
 const blocked=context(null,true);assert.doesNotThrow(()=>vm.runInContext('revealNewMemberCard()',blocked.ctx));assert.equal(blocked.seen.length,0);
});
test('card escapes nicknames and displays exact server-derived cents',()=>{
 const {ctx}=context(null);const html=vm.runInContext('memberCardMarkup({username:\'<img src=x onerror="alert(1)">\'},385)',ctx);
 assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img src=x'));assert.ok(html.includes('$3.85'));assert.ok(!html.includes('NaN'));
 const admin=vm.runInContext('memberCardMarkup({username:"family_admin"},0,true)',ctx);assert.ok(admin.includes('FAMILY ADMIN'));assert.ok(!admin.includes('$0.00'));
});

test('real activity waits briefly, tracks overlap, and clears status after completion',()=>{
 const {ctx}=context(null);let timer,element=null,busy=false;const body={classList:{add(){},remove(){}},append(el){element=el;el.parentElement=body;},setAttribute(){busy=true;},removeAttribute(){busy=false;}};
 ctx.setTimeout=fn=>{timer=fn;return 1;};ctx.clearTimeout=()=>{timer=null;};ctx.modal={open:false};
 ctx.document.body=body;ctx.document.getElementById=()=>element;ctx.document.createElement=()=>({setAttribute(){},querySelector(){return this.label||(this.label={});},remove(){element=null;}});
 const quick=vm.runInContext('beginCloudActivity("state")',ctx);assert.equal(element,null);quick();assert.equal(timer,null);assert.equal(busy,false);
 const first=vm.runInContext('beginCloudActivity("photos")',ctx);timer();assert.equal(element.label.textContent,'Sending photo…');assert.equal(busy,true);
 const second=vm.runInContext('beginCloudActivity("requests")',ctx);assert.equal(element.label.textContent,'Saving…');second();assert.equal(element.label.textContent,'Sending photo…');first();assert.equal(element,null);assert.equal(busy,false);
});

test('gift card counts to loaded cents once and interruption settles the exact balance',()=>{
 const {ctx}=context(null);let next=0;const jobs=new Map(),effects=[],value={textContent:''};ctx.document.hidden=false;ctx.reduceMotion=()=>false;ctx.cancelAnimationFrame=id=>jobs.delete(id);ctx.requestAnimationFrame=fn=>{jobs.set(++next,fn);return next;};
 const card={isConnected:true,classList:{add(){},remove(){}},querySelector:s=>s==='.card-funds strong'?value:{animate(){const a={cancel(){}};effects.push(a);return a;}},animate(frames){assert.ok(frames[0].transform.includes('rotateY(-360deg)'));const a={cancel(){}};effects.push(a);return a;}};ctx.card=card;
 const finish=vm.runInContext('animateGiftCard(card,{before:650,after:1650})',ctx);assert.equal(value.textContent,'$6.50');
 function advance(t){const batch=[...jobs.values()];jobs.clear();for(const job of batch)job(t);}
 advance(0);advance(1100);assert.notEqual(value.textContent,'$6.50');assert.notEqual(value.textContent,'$16.50');advance(1700);assert.equal(value.textContent,'$16.50');assert.equal(jobs.size,0);finish();assert.equal(value.textContent,'$16.50');
 vm.runInContext('animateGiftCard(card,{before:1650,after:1701})',ctx)();assert.equal(value.textContent,'$17.01');assert.equal(jobs.size,0);
});
test('reduced-motion gift reveal shows exact balance without spin or counter frames',()=>{
 const {ctx}=context(null);ctx.reduceMotion=()=>true;ctx.cancelAnimationFrame=()=>{};ctx.requestAnimationFrame=()=>{throw Error('No animation frames expected');};const value={textContent:''};ctx.card={querySelector:s=>s==='.card-funds strong'?value:null,classList:{remove(){}},animate(){throw Error('No spin expected');}};
 const finish=vm.runInContext('animateGiftCard(card,{before:650,after:1650})',ctx);assert.equal(value.textContent,'$16.50');finish();
});
