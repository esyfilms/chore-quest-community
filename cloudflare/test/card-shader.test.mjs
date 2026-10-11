import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../../card-shader.js',import.meta.url),'utf8');
function environment(gpu,reduced=false){
 const card={dataset:{},querySelector:()=>canvas};const canvas={remove(){this.removed=true;}};
 const ctx=vm.createContext({navigator:{gpu},matchMedia:()=>({matches:reduced,addEventListener(){},removeEventListener(){}}),AbortController,IntersectionObserver:class{observe(){}disconnect(){this.stopped=true;}},ResizeObserver:class{observe(){}disconnect(){}},document:{addEventListener(){}},cancelAnimationFrame(){}});
 vm.runInContext(code,ctx);return {card,canvas,mount:ctx.mountCardShader};
}
test('unsupported and reduced-motion cards preserve usable CSS without requesting GPU',()=>{
 let requests=0;const gpu={requestAdapter(){requests++;}};
 for(const env of [environment(null),environment(gpu,true)]){const stop=env.mount(env.card);assert.equal(env.card.dataset.cardRenderer,'css-foil');assert.doesNotThrow(stop);}
 assert.equal(requests,0);
});
test('closing a card during GPU allocation destroys the late device',async()=>{
 let resolveDevice,entered,destroyed=0;const requested=new Promise(resolve=>{entered=resolve;});const allocated=new Promise(resolve=>{resolveDevice=resolve;});
 const env=environment({requestAdapter:async()=>({requestDevice:()=>{entered();return allocated;}})});
 const stop=env.mount(env.card);await requested;stop();resolveDevice({destroy(){destroyed++;}});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(destroyed,1);assert.equal(env.canvas.removed,true);assert.equal(env.card.dataset.cardRenderer,'css-foil');
});
