import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import vm from'node:vm';
test('bundled QR encoder round-trips opaque gift reference through bundled decoder',()=>{
 const ctx=vm.createContext({});for(const name of ['qrcode','jsQR'])vm.runInContext(readFileSync(new URL('../../assets/vendor/qr/'+name+'.js',import.meta.url),'utf8'),ctx);
 const code='CQG1:'+'ab'.repeat(32),qr=ctx.qrcode(0,'M');qr.addData(code);qr.make();const n=qr.getModuleCount(),scale=6,width=(n+8)*scale,data=new Uint8ClampedArray(width*width*4);data.fill(255);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))for(let a=0;a<scale;a++)for(let b=0;b<scale;b++){const p=(((y+4)*scale+a)*width+(x+4)*scale+b)*4;data[p]=data[p+1]=data[p+2]=0;}
 assert.equal(ctx.jsQR(data,width,width,{inversionAttempts:'dontInvert'}).data,code);
 assert.equal(ctx.jsQR(new Uint8ClampedArray(width*width*4).fill(255),width,width),null);
});
function cameraHarness(getUserMedia){const events={},button={disabled:false},video={play:async()=>{},readyState:0},dialog={open:true,addEventListener(){}};const elements={'#startGiftCamera':button,'#giftCamera':video,'#scanStatus':{textContent:''}};let error='';const doc={hidden:false,addEventListener:(k,v)=>events[k]=v,querySelector:s=>elements[s]};const ctx=vm.createContext({Map,Uint8Array,Array,document:doc,window:{addEventListener:(k,v)=>events[k]=v},navigator:{mediaDevices:{getUserMedia}},$:s=>elements[s],modal:dialog,giftError:s=>error=s,setTimeout:()=>1,clearTimeout(){}});vm.runInContext(readFileSync(new URL('../../gift-qr.js',import.meta.url),'utf8'),ctx);return{ctx,events,button,dialog,error:()=>error};}
test('scanner stops a late camera grant after modal closes and reports permission denial',async()=>{
 let grant,stops=0;const h=cameraHarness(()=>new Promise(r=>grant=r));const pending=vm.runInContext('startGiftCamera()',h.ctx);h.dialog.open=false;vm.runInContext('stopGiftScanner()',h.ctx);grant({getTracks:()=>[{stop:()=>stops++}]});await pending;assert.equal(stops,1);
 const denied=cameraHarness(async()=>{throw Object.assign(new Error('denied'),{name:'NotAllowedError'});});await vm.runInContext('startGiftCamera()',denied.ctx);assert.equal(denied.button.disabled,false);assert.match(denied.error(),/permission was not granted/);
});
test('scanner releases active camera when page becomes hidden',async()=>{
 let stops=0;const h=cameraHarness(async()=>({getTracks:()=>[{stop:()=>stops++}]}));await vm.runInContext('startGiftCamera()',h.ctx);h.ctx.document.hidden=true;h.events.visibilitychange();assert.equal(stops,1);assert.equal(h.button.disabled,false);
});
