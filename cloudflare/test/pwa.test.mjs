import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../sw.js',import.meta.url),'utf8');
test('install manifest uses in-scope standalone launch and valid PNG icon dimensions',async()=>{
 const m=JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(m.display,'standalone');assert.equal(m.start_url,'/');assert.equal(m.scope,'/');assert.equal(m.id,'/');
 for(const size of [192,512]){const icon=m.icons.find(i=>i.sizes===`${size}x${size}`&&i.purpose==='any');assert.ok(icon);const png=await readFile(new URL('../../'+icon.src.slice(1),import.meta.url));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
});
test('offline support never intercepts API requests, photos, POSTs or other origins',async()=>{
 const handlers={};let calls=0;const ctx=vm.createContext({URL,Response,self:{location:{origin:'https://example.test'},addEventListener(n,f){handlers[n]=f;}},fetch:async()=>{calls++;throw Error('offline');}});vm.runInContext(code,ctx);
 for(const [path,method,mode] of [['/api/state','GET','navigate'],['/api/photos/a','GET','navigate'],['/api/setup','POST','navigate'],['/assets/a.png','GET','no-cors'],['https://other.test/','GET','navigate']])handlers.fetch({request:{url:new URL(path,'https://example.test').href,method,mode},respondWith(){assert.fail('Private/non-navigation request intercepted');}});
 assert.equal(calls,0);let response;handlers.fetch({request:{url:'https://example.test/',method:'GET',mode:'navigate'},respondWith(p){response=p;}});const r=await response;assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'no-store');assert.match(await r.text(),/You're offline/);assert.equal(calls,1);
});
