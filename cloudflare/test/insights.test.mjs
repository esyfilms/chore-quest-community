import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const ctx=vm.createContext({Intl,Date,Number,Map});vm.runInContext(await readFile(new URL('../insights.js',import.meta.url),'utf8'),ctx);
const timestamp=s=>Date.parse(s)/1000;
test('Singapore month boundaries and zero-filled month navigation cross year correctly',()=>{
 assert.equal(ctx.insightMonthKey(timestamp('2026-09-30T15:59:59Z')),'2026-09');assert.equal(ctx.insightMonthKey(timestamp('2026-09-30T16:00:00Z')),'2026-10');
 assert.equal(ctx.insightMonthKey(undefined),null);assert.equal(ctx.insightMonthKey(0),null);assert.equal(ctx.insightShiftMonth('2026-01',-1),'2025-12');assert.equal(ctx.insightShiftMonth('2025-12',1),'2026-01');
});
test('monthly ledger truth counts approval month, exact tips, gifts and fulfilled spends without holds',()=>{
 const sept=timestamp('2026-09-01T00:00:00Z'),oct=timestamp('2026-10-01T00:00:00Z');
 const chores=[{id:'a',created_at:sept,status:'approved',quality:'well'},{id:'pending',status:'pending',quality:'well'}];
 const rows=[{id:'a',source_id:'a',childId:'sam',childName:'Sam',name:'Dishes',kind:'reward',amount:75,tip:25,created_at:oct},{id:'gift',childId:'leo',childName:'Leo',name:'Birthday',kind:'gift',amount:1000,created_at:oct},{id:'deduction',childId:'sam',kind:'demerit',amount:-50,created_at:oct},{id:'cash',source_id:'cash',childId:'sam',kind:'spend',amount:-100,created_at:oct},{id:'buy',source_id:'buy',childId:'leo',kind:'spend',amount:-200,created_at:sept},{id:'old',kind:'reward',amount:50}];
 const {months,undated}=ctx.monthlyInsights(rows,chores,[{id:'cash',kind:'cash',status:'completed'},{id:'buy',kind:'buy',status:'completed'},{id:'hold',kind:'cash',amount:300,status:'pending'}]);
 const m=months.get('2026-10');assert.equal(m.completed,1);assert.equal(m.well,1);assert.equal(m.earned,75);assert.equal(m.tips,25);assert.equal(m.gifts,1000);assert.equal(m.deductions,50);assert.equal(m.spent,100);assert.equal(m.cash,100);assert.equal(m.net,925);assert.equal(m.children.get('sam').earned,75);assert.equal(m.children.get('leo').completed,0);assert.equal(months.get('2026-09').completed,0);assert.equal(months.get('2026-09').purchases,200);assert.equal(undated,1);
 const own=ctx.monthlyInsights(rows.filter(r=>r.childId==='sam'),chores);assert.equal(own.months.get('2026-10').gifts,0);assert.equal(own.months.get('2026-10').net,-75);
});
