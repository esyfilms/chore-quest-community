import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../admin-family.js',import.meta.url),'utf8');
test('all-child projection retains owners and separate exact balances and reservations',()=>{
 const ctx=vm.createContext({});vm.runInContext(source,ctx);
 const states=[{child:{id:'a',username:'Sam'},chores:[{id:'chore-a',status:'pending'}],requests:[{id:'req-a',status:'pending',amount:125}],ledger:[{amount:750,kind:'gift'},{amount:-50,kind:'demerit'}]},{child:{id:'b',username:'Leo'},chores:[{id:'chore-b',status:'approved',quality:'well'}],requests:[{id:'req-b',status:'completed',amount:200}],ledger:[{amount:500,kind:'gift'},{amount:-200,kind:'spend'}]}];
 const result=ctx.familyProjection(states);
 assert.equal(result.chores.length,2);assert.equal(result.chores.find(c=>c.id==='chore-b').childId,'b');assert.equal(result.requests.find(r=>r.id==='req-a').childName,'Sam');assert.equal(result.ledger[2].childName,'Leo');
 assert.equal(result.wallets[0].available,575);assert.equal(result.wallets[0].reserved,125);assert.equal(result.wallets[1].available,300);assert.equal(result.wallets[1].reserved,0);assert.equal(result.wallets[0].completed,0);assert.equal(result.wallets[1].completed,1);assert.equal(result.wallets[1].well,1);
 assert.equal(states[0].chores[0].childName,undefined);assert.equal(ctx.familyProjection([states[1]]).wallets.length,1);assert.equal(ctx.familyProjection([]).wallets.length,0);
});
test('cloud loading defaults every admin to all, preserves child filter and rejects partial state',async()=>{
 const client=(await readFile(new URL('../cloud-client.js',import.meta.url),'utf8')).split('async function compressPhoto')[0];
 const ctx=vm.createContext({render(){},document:{},beginCloudActivity:()=>()=>{},window:{},encodeURIComponent});
 vm.runInContext('let adult=false,page="chores",reviewer,chores,requests,ledger,gifted,earned,tips,demerits,paid,count,quality,displayedCents,familyRules;'+source+client,ctx);
 const states={a:{child:{id:'a',username:'Sam'},chores:[],requests:[],ledger:[{amount:100,kind:'gift',by_name:'Admin'}]},b:{child:{id:'b',username:'Leo'},chores:[],requests:[],ledger:[{amount:200,kind:'gift',by_name:'Admin'}]}};
 ctx.mockApi=async path=>path==='me'?{user:{id:'admin',username:'Admin Two',role:'admin'},children:Object.values(states).map(s=>s.child)}:path==='rules'?{rules:[]}:states[path.split('=')[1]];
 vm.runInContext('api=mockApi;render=()=>{};',ctx);await ctx.loadCloud();
 assert.equal(vm.runInContext('selectedChild',ctx),null);assert.equal(vm.runInContext('familyWallets.length',ctx),2);
 vm.runInContext('selectedChild=cloudChildren[1]',ctx);await ctx.loadCloud();assert.equal(vm.runInContext('familyWallets[0].id',ctx),'b');assert.equal(vm.runInContext('gifted',ctx),200);
 vm.runInContext('selectedChild=null',ctx);ctx.mockApi=async path=>{if(path==='state?child=b')throw Error('offline');return path==='me'?{user:{username:'Admin One',role:'admin'},children:Object.values(states).map(s=>s.child)}:path==='rules'?{rules:[]}:states.a;};vm.runInContext('api=mockApi',ctx);
 await assert.rejects(ctx.loadCloud(),/offline/);assert.equal(vm.runInContext('familyWallets.length',ctx),1);
});
