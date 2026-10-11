// Presentation only. All amounts and successes arrive from the cloud client.
let journalNotice=null,journalTimer=0;
const journalCounters=new Map();
function journalFeedback(kind,amount=0){
 document.dispatchEvent(new CustomEvent('buddy:celebrate',{detail:{kind}}));
 clearTimeout(journalTimer);journalNotice?.remove();
 const el=document.createElement('div');el.className='journal-feedback';el.setAttribute('role','status');
 const img=document.createElement('img');img.alt='';img.src='assets/buddy-bot/front-idle/01.png';img.className='buddy-event';img.dataset.buddyStart=kind;el.append(img);
 const text=document.createElement('div'),title=document.createElement('strong'),note=document.createElement('small');
 title.textContent=kind==='submitted'?'Chore sent for review':'Reward confirmed';
 note.textContent=kind==='submitted'?'Your admin will check the photo.':money(amount)+' added to the wallet.';
 text.append(title,note);el.append(text);
 if(kind==='approved'){const coin=document.createElement('img');coin.src='assets/coin-alpha.webp';coin.alt='';coin.className='feedback-coin';el.append(coin);}
 document.body.append(el);journalNotice=el;
 if(!reduceMotion()){
  el.animate([{opacity:0,translate:'0 12px',scale:'.98'},{opacity:1,translate:'0 0',scale:'1'}],{duration:340,easing:'cubic-bezier(.22,1,.36,1)'});

  const row=document.querySelector('.chore');if(kind==='submitted'&&row)row.animate([{opacity:.4,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:340,easing:'ease-out'});
 }
 journalTimer=setTimeout(()=>{el.remove();if(journalNotice===el)journalNotice=null;},2800);
}
function journalCount(id,value,identity){
 const el=document.getElementById(id);if(!el)return;
 let state=journalCounters.get(id);if(!state||state.identity!==identity){if(state)cancelAnimationFrame(state.frame);state={value,target:value,identity,frame:0};journalCounters.set(id,state);el.textContent=value;return;}
 state.target=value;cancelAnimationFrame(state.frame);const from=state.value,start=performance.now();
 if(reduceMotion()||from===value){state.value=value;el.textContent=value;return;}
 function tick(now){const t=Math.min(1,(now-start)/360);state.value=Math.round(from+(value-from)*(1-Math.pow(1-t,3)));el.textContent=state.value;if(t<1)state.frame=requestAnimationFrame(tick);}
 state.frame=requestAnimationFrame(tick);
}
motionPreference?.addEventListener('change',()=>{if(!reduceMotion())return;journalNotice?.getAnimations({subtree:true}).forEach(a=>a.cancel());for(const [id,state] of journalCounters){cancelAnimationFrame(state.frame);state.value=state.target;const el=document.getElementById(id);if(el)el.textContent=state.value;}});
