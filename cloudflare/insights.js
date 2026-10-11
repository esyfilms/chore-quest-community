// Read-only monthly insights from authoritative ledger events. Never changes funds.
const insightZone='Asia/Singapore';
let insightMonth=null,insightMetric='completed';
function insightMonthKey(seconds){
 if(!Number.isFinite(seconds)||seconds<=0)return null;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:insightZone,year:'numeric',month:'2-digit'}).formatToParts(new Date(seconds*1000));
 return parts.find(p=>p.type==='year').value+'-'+parts.find(p=>p.type==='month').value;
}
function insightMonthLabel(key,short=false){return new Intl.DateTimeFormat('en-SG',{timeZone:insightZone,month:short?'short':'long',...(short?{}:{year:'numeric'})}).format(new Date(key+'-15T12:00:00+08:00'));}
function insightShiftMonth(key,offset){const [year,month]=key.split('-').map(Number),d=new Date(Date.UTC(year,month-1+offset,15));return d.toISOString().slice(0,7);}
function monthlyInsights(entries,choreRows,requestRows=[]){
 const choresById=new Map(choreRows.map(c=>[c.id,c])),requestsById=new Map(requestRows.map(r=>[r.id,r]));const months=new Map();let undated=0;
 for(const row of entries){const key=insightMonthKey(row.created_at);if(!key){undated++;continue;}
  if(!months.has(key))months.set(key,{key,completed:0,well:0,earned:0,tips:0,gifts:0,deductions:0,spent:0,cash:0,purchases:0,net:0,rows:[],children:new Map(),choreNames:new Map()});
  const m=months.get(key),childId=row.childId||row.user_id||'self',childName=row.childName||'My activity';
  if(!m.children.has(childId))m.children.set(childId,{id:childId,name:childName,completed:0,earned:0,spent:0});const child=m.children.get(childId);
  const chore=choresById.get(row.source_id||row.id),request=requestsById.get(row.source_id||row.id);let category='Activity';
  if(row.kind==='reward'){category='Chore approved';m.completed++;child.completed++;m.earned+=row.amount;child.earned+=row.amount;m.tips+=row.tip||0;if(chore?.quality==='well')m.well++;m.choreNames.set(row.name,(m.choreNames.get(row.name)||0)+1);}
  else if(row.kind==='gift'){category='Gift';m.gifts+=row.amount;}
  else if(row.kind==='demerit'){category='Deduction';m.deductions-=row.amount;}
  else if(row.kind==='spend'){category=request?.kind==='cash'?'Cash handed over':request?.kind==='buy'?'Purchase completed':'Cash / purchase completed';m.spent-=row.amount;child.spent-=row.amount;if(request?.kind==='cash')m.cash-=row.amount;else if(request?.kind==='buy')m.purchases-=row.amount;}
  m.net+=row.amount;m.rows.push({...row,category});
 }
 for(const m of months.values())m.rows.sort((a,b)=>b.created_at-a.created_at||String(b.id).localeCompare(String(a.id)));
 return {months,undated};
}
function renderMonthlyInsights(w){
 const data=monthlyInsights(ledger,chores,requests),today=insightMonthKey(Date.now()/1000);insightMonth??=today;
 const blank=key=>({key,completed:0,well:0,earned:0,tips:0,gifts:0,deductions:0,spent:0,cash:0,purchases:0,net:0,rows:[],children:new Map(),choreNames:new Map()});
 const selected=data.months.get(insightMonth)||blank(insightMonth),previous=data.months.get(insightShiftMonth(insightMonth,-1))||blank(''),change=selected.completed-previous.completed;
 const bounds=[today,insightMonth,...data.months.keys()].sort();const keys=[];for(let key=bounds.at(-1);key>=bounds[0];key=insightShiftMonth(key,-1))keys.push(key);
 const metricLabel={completed:'Approved chores',earned:'Chore earnings',spent:'Paid out'}[insightMetric],format=n=>insightMetric==='completed'?String(n):money(n);
 const windowKeys=Array.from({length:6},(_,i)=>insightShiftMonth(insightMonth,i-5));
 const people=adult?(selectedChild?[selectedChild]:cloudChildren):[cloudUser];
 const series=people.map((p,i)=>({id:p.id,name:p.username,index:i}));
 const value=(key,id)=>{const m=data.months.get(key);return m?.children.get(id)?.[insightMetric]||0;};
 const max=Math.max(insightMetric==='completed'?1:100,...windowKeys.flatMap(key=>series.map(p=>value(key,p.id))));
 const top=[...selected.choreNames].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
 const section=document.createElement('section');section.className='monthly-insights';section.id='monthlyInsights';
 section.innerHTML='<div class="section-head"><h2>Monthly insights</h2></div><div class="insight-controls"><label>Month<select id="insightMonth">'+keys.map(key=>'<option value="'+key+'" '+(key===insightMonth?'selected':'')+'>'+insightMonthLabel(key)+'</option>').join('')+'</select></label><label>Graph<select id="insightMetric">'+Object.entries({completed:'Approved chores',earned:'Chore earnings',spent:'Paid out'}).map(([key,label])=>'<option value="'+key+'" '+(key===insightMetric?'selected':'')+'>'+label+'</option>').join('')+'</select></label></div>'+
 '<p class="insight-context">'+esc(insightMonthLabel(insightMonth))+' · '+(change>0?'+':'')+change+' approved chores vs previous month'+(insightMonth===today?' · Month in progress':'')+'</p>'+
 '<div class="insight-stats">'+[['Chores approved',selected.completed,selected.completed?selected.well+' of '+selected.completed+' done really well':'No approvals yet'],['Chore earnings',money(selected.earned),money(selected.earned-selected.tips)+' base + '+money(selected.tips)+' tips'],['Gifts received',money(selected.gifts),'Accepted gifts only'],['Deductions',money(selected.deductions),'Recorded this month'],['Paid out',money(selected.spent),money(selected.cash)+' cash · '+money(selected.purchases)+' purchases'],['Net activity',(selected.net<0?'−':'+')+money(Math.abs(selected.net)),'Credits minus deductions and payouts']].map(([label,n,note])=>'<div class="insight-stat"><span>'+label+'</span><strong>'+n+'</strong><small>'+note+'</small></div>').join('')+'</div>'+
 '<figure class="insight-figure"><figcaption>'+metricLabel+' · 6 months to '+insightMonthLabel(insightMonth)+'</figcaption><p class="small">Scale'+(series.length>1?' per child':'')+': 0–'+format(max)+(insightMetric==='completed'?' chores':'')+(series.length>1?' · Totals shown below each month':'')+' · Tap a month to explore</p><div class="insight-legend">'+series.map(p=>'<span><i class="insight-color color-'+(p.index%4)+'"></i>'+esc(p.name)+'</span>').join('')+'</div><div class="insight-chart">'+windowKeys.map(key=>'<button type="button" class="insight-month '+(key===insightMonth?'selected':'')+'" data-insight-month="'+key+'" aria-label="'+esc(insightMonthLabel(key)+' · '+metricLabel+': '+series.map(p=>p.name+' '+format(value(key,p.id))).join(', '))+'" '+(key===insightMonth?'aria-current="date"':'')+'><span class="insight-bars">'+series.map(p=>'<span class="insight-bar color-'+(p.index%4)+'" style="height:'+Math.round(value(key,p.id)/max*100)+'%" title="'+esc(p.name+': '+format(value(key,p.id)))+'"></span>').join('')+'</span><span>'+insightMonthLabel(key,true)+'</span><small>'+format(series.reduce((sum,p)=>sum+value(key,p.id),0))+'</small></button>').join('')+'</div></figure>'+
 (adult&&!selectedChild&&series.length>1?'<table class="insight-comparison"><caption>'+insightMonthLabel(insightMonth)+' by child</caption><thead><tr><th scope="col">Child</th><th scope="col">'+metricLabel+'</th></tr></thead><tbody>'+series.map(p=>'<tr><th scope="row">'+esc(p.name)+'</th><td>'+format(value(insightMonth,p.id))+'</td></tr>').join('')+'</tbody></table>':'')+
 (top?'<p class="insight-observation">Most frequent approved chore: <strong>'+esc(top[0])+'</strong> · '+top[1]+' completed</p>':'<p class="small">No approved chores this month yet.</p>')+
 '<p class="small">Singapore calendar months. Chores count on approval; payouts count when fulfilled. Net activity is not your available balance. Pending requests remain reserved above. Requests below cover all months.</p>'+(data.undated?'<p class="small">'+data.undated+' undated entries are excluded from graphs and shown below.</p>':'');
 w.prepend(section);section.querySelector('#insightMonth').onchange=e=>{insightMonth=e.target.value;render();};section.querySelector('#insightMetric').onchange=e=>{insightMetric=e.target.value;render();};section.querySelectorAll('[data-insight-month]').forEach(b=>b.onclick=()=>{insightMonth=b.dataset.insightMonth;render();});
 const heading=[...w.querySelectorAll('h2')].find(h=>h.textContent==='Coin activity');if(!heading)return;
 heading.textContent='Transactions by month';w.querySelectorAll('.ledger-row').forEach(el=>el.remove());
 const history=document.createElement('section');history.className='monthly-history';
 const rowHTML=row=>'<div class="ledger-row"><div>'+esc(row.name)+'<small>'+esc((adult?(row.childName||selectedChild?.username||'Child')+' · ':'')+row.category)+' · '+new Intl.DateTimeFormat('en-SG',{timeZone:insightZone,day:'numeric',month:'short',year:'numeric'}).format(new Date(row.created_at*1000))+'</small><small>'+esc(row.note||'')+(row.kind==='reward'?' · Includes '+money(row.tip||0)+' tip':'')+'</small></div><strong class="'+(row.amount>0?'positive':'negative')+'">'+(row.amount>0?'+':'−')+money(Math.abs(row.amount))+'</strong></div>';
 history.innerHTML=[...data.months.keys()].sort().reverse().map(key=>{const m=data.months.get(key);return '<details '+(key===insightMonth?'open':'')+'><summary>'+insightMonthLabel(key)+' · '+m.completed+' chores · '+m.rows.length+' transactions</summary>'+m.rows.map(rowHTML).join('')+'</details>';}).join('')||'<p class="empty">No completed transactions yet.</p>';
 if(data.undated)history.innerHTML+='<details><summary>Undated activity · '+data.undated+' entries</summary>'+ledger.filter(l=>!insightMonthKey(l.created_at)).map(l=>'<div class="ledger-row"><span>'+esc(l.name)+'</span><strong>'+money(l.amount)+'</strong></div>').join('')+'</details>';
 heading.after(history);
}
