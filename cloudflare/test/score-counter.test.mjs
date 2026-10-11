import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('score counter settles approved count on reduced motion and isolates child identity',async()=>{
 const el={textContent:''};let preferenceChange,frame;
 const ctx=vm.createContext({document:{getElementById:()=>el},reduceMotion:()=>false,performance:{now:()=>0},requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame(){},motionPreference:{addEventListener(type,fn){preferenceChange=fn;}}});
 vm.runInContext(await readFile(new URL('../feedback.js',import.meta.url),'utf8'),ctx);
 ctx.journalCount('scoreCompleted',10,'child-a');ctx.journalCount('scoreCompleted',11,'child-a');frame(120);assert.ok(Number(el.textContent)>=10);
 ctx.reduceMotion=()=>true;preferenceChange();assert.equal(el.textContent,11);
 ctx.journalCount('scoreCompleted',2,'child-b');assert.equal(el.textContent,2);
 ctx.document.getElementById=()=>null;assert.doesNotThrow(()=>preferenceChange());
});
