// Local test adapter: no fetch, cookies, account creation, persistent data or API.
const testFunds=renderFunds;
renderFunds=function(w){testFunds(w);addMemberCardEntry(w);renderMonthlyInsights(w);};
const scoreRender=render;render=function(){for(const row of ledger||[])if(row.kind==='gift'&&!row.created_at)Object.assign(row,{created_at:Date.now()/1000,childId:cloudUser.id,childName:cloudUser.username});scoreRender();updateWalletScoreboard();};
$('#testChild').onclick=()=>{adult=false;render();};
$('#testAdmin').onclick=()=>{adult=true;render();};
$('#testCard').onclick=()=>showMemberCard();
$('#eyebrow').textContent='LOCAL TEST';
document.querySelector('footer span').textContent='Local test · Refresh resets sample activity';

function seedInsightSample(){
 const stamp=(month,day=10)=>Date.UTC(2026,month,day,4)/1000;
 const bed=chores.find(c=>c.id===1);bed.quality='well';bed.created_at=stamp(9);
 const history=Array.from({length:13},(_,i)=>({id:100+i,name:['Vacuum','Clean the table','Take out the trash'][i%3],icon:'toys',status:'approved',quality:i<11?'well':'basic',reward:50+(i===0?75:0),rating:i<11?'Done really well':'Meets the basics',by:'Admin Two',created_at:stamp(4+i%6,5+i%5)}));
 chores.push(...history);
 ledger=[bed,...history].map(c=>({id:c.id,source_id:c.id,name:c.name,amount:c.reward,tip:c.reward-50,kind:'reward',created_at:c.created_at,childId:cloudUser.id,childName:cloudUser.username,note:'Admin Two confirmed · sample activity'}));
 ledger.push(...[{name:'iPad before 11am',amount:-100},{name:'Misbehavior',amount:-50}].map((l,i)=>({...l,id:200+i,kind:'demerit',created_at:stamp(9,8+i),childId:cloudUser.id,childName:cloudUser.username,note:'Admin One recorded · sample activity'})));
}
seedInsightSample();
const sampleInit=init;init=function(){sampleInit();seedInsightSample();render();};
for(const [name,kind] of [['confirmReward','reward'],['completeRequest','spend'],['demerit','demerit']]){
 const original=name==='confirmReward'?confirmReward:name==='completeRequest'?completeRequest:demerit;
 const wrapped=function(id){original(id);const button=$('#confirm');if(!button)return;const action=button.onclick;button.onclick=()=>{const previous=ledger[0];action();if(ledger[0]!==previous){const row=ledger[0];Object.assign(row,{kind,source_id:id,created_at:Date.now()/1000,childId:cloudUser.id,childName:cloudUser.username});if(kind==='reward'){row.tip=row.amount-50;const chore=chores.find(c=>c.id===id);if(chore)chore.quality=chore.rating==='Done really well'?'well':'basic';}render();}};};
 if(name==='confirmReward')confirmReward=wrapped;else if(name==='completeRequest')completeRequest=wrapped;else demerit=wrapped;
}

page='funds';render();showMemberCard(true);
