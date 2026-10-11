// Synthetic QC harness using the actual built cloud client. No real API/account.
import {readFile,writeFile,cp} from 'node:fs/promises';
const out=new URL('../test-app/admin-qc/',import.meta.url);
await cp(new URL('../cloudflare/public/',import.meta.url),out,{recursive:true});
let html=await readFile(new URL('index.html',out),'utf8');
html=html.replace('<main>','<main><p class="small">LOCAL QC · Synthetic family · Mutations disabled</p>');
html=html.replace('<script src="app.js"','<script src="fixture.js" defer></script><script src="app.js"').replace('<script src="/pwa.js" defer></script>','');
await writeFile(new URL('index.html',out),html);
const children=[{id:'sample-sam',username:'DemoKid'},{id:'sample-leo',username:'DemoPal'}];
const stamp=(month,day=10)=>Date.UTC(2026,month,day,4)/1000;
const states=Object.fromEntries(children.map((child,i)=>{const approved=[7,8,9].map((month,j)=>({id:'approved-'+i+'-'+j,name:i?'Wash dishes':'Make the bed',quality:j===1?'basic':'well',status:'approved',tip:j*25,photo_id:'sample',created_at:stamp(month,1)}));return [child.id,{child,chores:[...approved,{id:'chore-'+i,name:'Vacuum',status:'pending',photo_id:'sample',created_at:stamp(9)}],requests:[{id:'request-'+i,kind:i?'buy':'cash',item:i?'Drawing pencils':'',amount:100+i*50,status:'pending',created_at:stamp(9)},{id:'spend-'+i,kind:'cash',amount:100,status:'completed',by_name:'SampleAdmin',created_at:stamp(8,2)}],ledger:[{id:'gift-'+i,kind:'gift',name:'Birthday gift',amount:650+i*400,tip:0,by_name:'SampleAdmin',created_at:stamp(7)},...approved.map((c,j)=>({id:c.id,source_id:c.id,kind:'reward',name:c.name,amount:50+j*25,tip:j*25,by_name:'SampleAdmin',created_at:stamp(7+j,5)})),{id:'spend-'+i,source_id:'spend-'+i,kind:'spend',name:'Cash withdrawn',amount:-100,tip:0,by_name:'SampleAdmin',created_at:stamp(8,8)},{id:'deduction-'+i,kind:'demerit',name:'Misbehavior',amount:-50,tip:0,by_name:'SampleAdmin',created_at:stamp(9,9)}]}];}));
await writeFile(new URL('fixture.js',out),`const syntheticStates=${JSON.stringify(states)};const syntheticChildren=${JSON.stringify(children)};\nwindow.fetch=async(input,options={})=>{const path=String(input).replace('/api/','');let data;if(path==='status')data={setupRequired:false};else if(path==='me')data={user:new URLSearchParams(location.search).get('role')==='child'?{...syntheticChildren[0],role:'child'}:{id:'sample-admin',username:'SampleAdmin',role:'admin'},children:new URLSearchParams(location.search).get('role')==='child'?[]:syntheticChildren};else if(path==='rules')data={rules:[]};else if(path.startsWith('state?'))data=syntheticStates[new URLSearchParams(path.split('?')[1]).get('child')];else return new Response(JSON.stringify({error:'QC fixture: mutations are disabled.'}),{status:403});return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});};\n`);
console.log('Synthetic admin QC: /admin-qc/ on the local test preview only. All mutations disabled.');

// Only this synthetic output swaps protected photo URLs for generic demo art.
const fixtureClient=await readFile(new URL('cloud-client.js',out),'utf8');
await writeFile(new URL('cloud-client.js',out),fixtureClient.replace("photo:'/api/photos/'+c.photo_id","photo:'assets/bed-alpha.webp'").replace('Cloudflare · Saved online','Local demo · Fictional activity'));
