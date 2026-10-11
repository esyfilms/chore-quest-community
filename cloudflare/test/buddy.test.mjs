import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../../buddy.js',import.meta.url),'utf8');
function setup(startReduced=false,startMotion,faceOnly=false){
 let now=0,id=0,button,observer;const timers=new Map(),events=new Map(),preference={matches:startReduced,addEventListener(_,fn){this.changed=fn;}};
 const img={src:'https://example.test/assets/buddy-bot/front-idle/01.png',dataset:{buddyStart:startMotion,buddyFace:faceOnly?'true':undefined},isConnected:true,closest(){return null;},matches(){return true;},before(b){button=b;}};
 const document={hidden:false,currentScript:{src:'https://example.test/buddy.js'},body:{},querySelectorAll(){return img.isConnected?[img]:[];},createElement(){return {setAttribute(){},append(){},addEventListener(_,fn){this.click=fn;}};},addEventListener(name,fn){events.set(name,fn);}};
 const ctx={URL,document,window:{addEventListener(){}},matchMedia:()=>preference,performance:{now:()=>now},setTimeout(fn,ms){timers.set(++id,{fn,at:now+ms});return id;},clearTimeout(n){timers.delete(n);},IntersectionObserver:class{constructor(cb){observer=cb;}observe(target){observer([{target,isIntersecting:true}]);}unobserve(){}},MutationObserver:class{constructor(cb){this.cb=cb;}observe(){}}};
 vm.runInNewContext(source,ctx);
 function next(){const pair=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at)[0];assert.ok(pair,'scheduled frame');timers.delete(pair[0]);now=pair[1].at;pair[1].fn();}
 return {img,document,preference,timers,events,next,click:()=>button.click(),visible:v=>observer([{target:img,isIntersecting:v}])};
}
test('generic robot advances, pet interrupts, and one-shot returns to idle',()=>{
 const s=setup();s.next();assert.equal(s.img.dataset.buddyFrame,'1');s.click();assert.equal(s.img.dataset.buddyMotion,'front-pet');for(let i=0;i<8;i++)s.next();assert.equal(s.img.dataset.buddyMotion,'front-idle');
 s.events.get('buddy:celebrate')({detail:{kind:'approved'}});assert.equal(s.img.dataset.buddyMotion,'jump');for(let i=0;i<8;i++)s.next();assert.equal(s.img.dataset.buddyMotion,'front-idle');
 s.events.get('buddy:celebrate')({detail:{kind:'submitted'}});assert.equal(s.img.dataset.buddyMotion,'front-happy');
});
test('hidden/offscreen/reduced motion suspend the shared animation timer',()=>{
 const s=setup();s.visible(false);assert.equal(s.timers.size,0);s.visible(true);assert.equal(s.timers.size,1);s.document.hidden=true;s.events.get('visibilitychange')();assert.equal(s.timers.size,0);s.document.hidden=false;s.events.get('visibilitychange')();assert.equal(s.timers.size,1);
 s.preference.matches=true;s.preference.changed();assert.equal(s.timers.size,0);s.click();assert.equal(s.img.dataset.buddyMotion,'front-idle');
 const staticEvent=setup(true,'approved');assert.equal(staticEvent.img.dataset.buddyMotion,'front-idle');assert.equal(staticEvent.timers.size,0);
});

test('visible ambient cycle includes wag, walking, barking, happy, jump and paw',()=>{const s=setup();const observed=[];for(let i=0;i<55;i++){s.next();observed.push(s.img.dataset.buddyMotion);}for(const name of ['wag','walk','bark','front-happy','jump','paw'])assert.ok(observed.includes(name),name);});

test('card face uses only front motions, including approval celebration',()=>{const s=setup(false,undefined,true);for(let i=0;i<70;i++){s.next();assert.ok(s.img.dataset.buddyMotion.startsWith('front-'));}s.events.get('buddy:celebrate')({detail:{kind:'approved'}});assert.equal(s.img.dataset.buddyMotion,'front-happy');s.click();assert.equal(s.img.dataset.buddyMotion,'front-pet');});
