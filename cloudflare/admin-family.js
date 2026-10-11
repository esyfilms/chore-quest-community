// Read-only family projection. Every record retains its owner; balances never pool.
function familyProjection(states){
 const newest=rows=>rows.sort((a,b)=>(b.created_at||0)-(a.created_at||0)||String(b.id||'').localeCompare(String(a.id||'')));
 const tagged=(s,key)=>s[key].map(row=>({...row,childId:s.child.id,childName:s.child.username}));
 return {
  chores:newest(states.flatMap(s=>tagged(s,'chores'))),
  requests:newest(states.flatMap(s=>tagged(s,'requests'))),
  ledger:newest(states.flatMap(s=>tagged(s,'ledger'))),
  wallets:states.map(s=>{const total=s.ledger.reduce((sum,l)=>sum+l.amount,0),reserved=s.requests.filter(r=>r.status==='pending').reduce((sum,r)=>sum+r.amount,0);return {...s.child,total,reserved,available:total-reserved,completed:s.chores.filter(c=>c.status==='approved').length,well:s.chores.filter(c=>c.status==='approved'&&c.quality==='well').length};})
 };
}
function adminFamilyControls(){
 const area=document.querySelector('.topline');document.querySelector('#familyFilter')?.remove();
 if(!adult)return;
 const label=document.createElement('label');label.id='familyFilter';label.className='family-filter';label.innerHTML='Show children<select id="familyChild"><option value="">All children</option>'+cloudChildren.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.username)+'</option>').join('')+'</select>';
 area.append(label);const select=label.querySelector('select');select.value=selectedChild?.id||'';
 select.onchange=()=>changeFamilyChild(select.value);
 document.querySelector('.right').classList.toggle('hidden',!selectedChild);
 if(!selectedChild&&page!=='rules'&&familyWallets.length){const summary=document.createElement('section');summary.className='family-wallets';summary.setAttribute('aria-label','Individual child balances');summary.innerHTML='<h2>Everyone’s allowance</h2><p class="small">Separate balances · Choose a child to see their wallet.</p>'+familyWallets.map(c=>'<button class="action family-wallet" data-child-wallet="'+esc(c.id)+'"><span>'+esc(c.username)+'<small>'+money(c.reserved)+' reserved · '+c.completed+' chores completed</small></span><strong>'+money(c.available)+'<small>Available</small></strong></button>').join('');$('#workspace').prepend(summary);summary.querySelectorAll('[data-child-wallet]').forEach(b=>b.onclick=()=>changeFamilyChild(b.dataset.childWallet,'funds'));}
}
async function changeFamilyChild(id,nextPage){
 const previous=selectedChild,previousPage=page;selectedChild=cloudChildren.find(c=>c.id===id)||null;if(nextPage)page=nextPage;
 const control=$('#familyChild');if(control)control.disabled=true;
 try{await loadCloud();}catch(e){selectedChild=previous;page=previousPage;render();cloudMessage('Could not load this view. '+e.message);}
}
