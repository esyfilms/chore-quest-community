// Pinned vgpu shader with native WebGPU host and CSS foil fallback.
// No device sensors, payment tokens or third-party JavaScript runtime.
let cardCleanup=null;
function memberCardMarkup(who,amount,adminCard=false){
 return '<div class="member-card" tabindex="0" role="group" aria-label="'+esc(who.username)+' family '+(adminCard?'admin':'allowance')+' card'+(adminCard?'':', available '+money(amount))+'"><div class="card-foil" aria-hidden="true"></div><canvas class="card-shader" aria-hidden="true"></canvas><div class="card-top"><span>CHORE QUEST</span><span class="card-mark" aria-hidden="true">✦</span></div><div class="card-art"><div class="card-face-window"><img data-buddy-face="true" src="assets/buddy-bot/front-idle/01.png" alt=""></div></div><div class="card-bottom"><div><span class="card-label">'+(adminCard?'FAMILY ADMIN':'FAMILY MEMBER')+'</span><strong class="card-name">'+esc(who.username)+'</strong></div><div class="card-funds"><span class="card-label">'+(adminCard?'ROLE':'AVAILABLE')+'</span><strong>'+(adminCard?'Admin':money(amount))+'</strong></div></div></div>';
}
function bindMemberCard(receipt=null){
 const card=modal.querySelector('.member-card');if(!card)return;
 cardCleanup?.();const shaderCleanup=typeof mountCardShader==='function'?mountCardShader(card):()=>{};const controller=new AbortController();let frame=0,point=null;
 const reset=()=>{cancelAnimationFrame(frame);card.style.removeProperty('--rx');card.style.removeProperty('--ry');card.style.removeProperty('--shine-x');card.style.removeProperty('--shine-y');};
 const update=()=>{frame=0;if(!card.isConnected||reduceMotion()||!point)return;const r=card.getBoundingClientRect(),x=Math.max(0,Math.min(1,(point.x-r.left)/r.width)),y=Math.max(0,Math.min(1,(point.y-r.top)/r.height));card.style.setProperty('--rx',(0.5-y)*10+'deg');card.style.setProperty('--ry',(x-.5)*12+'deg');card.style.setProperty('--shine-x',Math.round(x*100)+'%');card.style.setProperty('--shine-y',Math.round(y*100)+'%');};
 card.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&!e.buttons)return;point={x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(update);},{signal:controller.signal});
 for(const name of ['pointerleave','pointerup','pointercancel','blur'])card.addEventListener(name,reset,{signal:controller.signal});
 card.addEventListener('pointerdown',e=>{point={x:e.clientX,y:e.clientY};update();},{signal:controller.signal});
 if(!receipt&&!reduceMotion())card.animate([{opacity:0,transform:'perspective(700px) rotateY(-18deg) translateY(14px) scale(.94)'},{opacity:1,transform:'perspective(700px) rotateY(0) translateY(0) scale(1)'}],{duration:520,easing:'cubic-bezier(.22,1,.36,1)'});
 const finishReveal=receipt?animateGiftCard(card,receipt):()=>{};
 card.addEventListener('pointerdown',finishReveal,{signal:controller.signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finishReveal();},{signal:controller.signal});
 const puppyFrame=receipt&&!reduceMotion()?requestAnimationFrame(()=>document.dispatchEvent(new CustomEvent('buddy:celebrate',{detail:{kind:'approved'}}))):0;
 cardCleanup=()=>{cancelAnimationFrame(puppyFrame);finishReveal();reset();shaderCleanup();controller.abort();card.getAnimations({subtree:true}).forEach(a=>a.cancel());cardCleanup=null;};
 modal.addEventListener('close',()=>cardCleanup?.(),{once:true,signal:controller.signal});
}
function showMemberCard(welcome=false){
 const who=welcome?cloudUser:adult?(selectedChild||cloudUser):cloudUser;
 if(!who)return;const adminCard=who.role==='admin',canRequest=!adult&&!adminCard;
 show('<h2>'+(welcome?'Your card is ready':canRequest?'Your allowance card':'Family card')+'</h2><p>'+(welcome?'Welcome, '+esc(who.username)+'.':canRequest?'Your chores, your progress.':'Viewing '+esc(who.username)+'.')+'</p>'+memberCardMarkup(who,available(),adminCard)+'<p class="card-help">'+(adminCard?'Review chores and manage the family.':'Your available allowance. Requests wait for an admin to give cash or buy the item.')+'</p>'+(canRequest?'<div class="card-actions"><button class="action primary" id="cardCash">Get cash</button><button class="action" id="cardBuy">Buy something</button></div>':'')+'<div class="dialog-actions"><button class="action" id="cancel">'+(welcome?(adminCard?'Continue':'Start helping'):'Close')+'</button></div>');
 if(canRequest){document.getElementById('cardCash').onclick=()=>requestMoney('cash');document.getElementById('cardBuy').onclick=()=>requestMoney('buy');}bindMemberCard();
}
// Celebration presents loaded allowance only. It never writes a credit.
function animateGiftCard(card,{before,after}){
 const value=card.querySelector('.card-funds strong'),sweep=card.querySelector('.gift-foil-sweep');let raf=0,ended=false;const animations=[];
 const finish=()=>{if(ended)return;ended=true;cancelAnimationFrame(raf);value.textContent=money(after);card.classList.remove('gift-revealing');animations.forEach(a=>a.cancel());};
 if(reduceMotion()||document.hidden){value.textContent=money(after);return finish;}
 card.classList.add('gift-revealing');value.textContent=money(before);
 animations.push(card.animate([
  {opacity:0,transform:'perspective(900px) translateY(20px) rotateX(10deg) rotateY(-360deg) scale(.88)',offset:0},
  {opacity:1,transform:'perspective(900px) translateY(-6px) rotateX(-4deg) rotateY(-155deg) scale(.96)',offset:.42},
  {opacity:1,transform:'perspective(900px) translateY(0) rotateX(0deg) rotateY(5deg) scale(1.015)',offset:.84},
  {opacity:1,transform:'perspective(900px) translateY(0) rotateX(0deg) rotateY(0deg) scale(1)',offset:1}
 ],{duration:1500,easing:'cubic-bezier(.22,.7,.22,1)'}));
 if(sweep)animations.push(sweep.animate([{opacity:0,transform:'translateX(-130%) skewX(-18deg)'},{opacity:.8,offset:.35},{opacity:.55,offset:.7},{opacity:0,transform:'translateX(160%) skewX(-18deg)'}],{duration:1500,easing:'ease-out'}));
 let start=null;const tick=time=>{if(ended)return;if(!card.isConnected||document.hidden||reduceMotion()){finish();return;}start??=time;const p=Math.max(0,Math.min(1,(time-start-700)/900)),eased=1-Math.pow(1-p,3);value.textContent=money(Math.round(before+(after-before)*eased));if(p<1)raf=requestAnimationFrame(tick);else finish();};raf=requestAnimationFrame(tick);return finish;
}
function showGiftReceivedCard(gift,before){
 if(adult||!cloudUser)return;const after=available();
 show('<h2>Gift received!</h2><p class="gift-received-note">'+esc(gift.name)+' · From '+esc(gift.by)+'</p><div class="gift-credit-badge">+'+money(gift.amount)+'</div>'+memberCardMarkup(cloudUser,after).replace('<div class="card-top">','<div class="gift-foil-sweep" aria-hidden="true"></div><div class="card-top">')+'<p class="gift-card-status" role="status">'+money(gift.amount)+' gift added. Available balance: '+money(after)+'.</p><p class="card-help">Your gift is ready. Request cash when you want your admin to hand it over.</p><div class="card-actions"><button class="action primary" id="cardCash">Get cash</button><button class="action" id="cardBuy">Buy something</button></div><div class="dialog-actions"><button class="action" id="cancel">Back to my wallet</button></div>');
 $('#cardCash').onclick=()=>requestMoney('cash');$('#cardBuy').onclick=()=>requestMoney('buy');bindMemberCard({before,after});
}
function addMemberCardEntry(w){updateWalletScoreboard();}

const originalShow=show;
show=function(html){cardCleanup?.();const wasOpen=modal.open;originalShow(html);if(wasOpen)modal.querySelector('input:not([type="file"]),select,button')?.focus();};
function revealNewMemberCard(){
 try{if(sessionStorage.getItem('cq-welcome-card')===cloudUser?.id){sessionStorage.removeItem('cq-welcome-card');showMemberCard(true);}}catch{/* Storage unavailable: the Wallet entry always works. */}
}
motionPreference?.addEventListener('change',()=>{if(reduceMotion())cardCleanup?.();});

// Pixel orb: square points on a small globe. Native CSS, not an AI task claim.
const activityJobs=new Map();let activitySequence=0,activityDelay=0;
function activityLabel(path){return path==='photos'?'Sending photo…':path==='signup'?'Creating your account…':path==='setup'?'Creating admin account…':path==='login'?'Signing in…':path.startsWith('state')||path==='me'||path==='status'?'Loading your journal…':path==='logout'?'Signing out…':'Saving…';}
function paintActivity(){
 let el=document.getElementById('cloudActivity');if(!activityJobs.size){el?.remove();return;}
 if(!el){el=document.createElement('div');el.id='cloudActivity';el.className='cloud-activity';el.setAttribute('role','status');el.innerHTML=pixelOrbMarkup()+'<span></span>';document.body.append(el);}
 const parent=modal.open?modal:document.body;if(el.parentElement!==parent)parent.append(el);el.querySelector('span').textContent=[...activityJobs.values()].at(-1);document.body.setAttribute('aria-busy','true');
}
function beginCloudActivity(path){
 const id=++activitySequence;activityJobs.set(id,activityLabel(path));document.body.classList.add('network-active');
 if(document.getElementById('cloudActivity'))paintActivity();else if(!activityDelay)activityDelay=setTimeout(()=>{activityDelay=0;paintActivity();},80);
 return ()=>{activityJobs.delete(id);if(!activityJobs.size){clearTimeout(activityDelay);activityDelay=0;document.getElementById('cloudActivity')?.remove();document.body.removeAttribute('aria-busy');document.body.classList.remove('network-active');}else if(document.getElementById('cloudActivity'))paintActivity();};
}
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('effects-paused',document.hidden);});
// Compact identity + progress summary. Counts are approved chores, never pending work.
function updateWalletScoreboard(){
 const who=adult?selectedChild:cloudUser, wallet=document.querySelector('.wallet');
 if(!wallet||!who||page!=='funds'){wallet?.classList.remove('wallet-scoreboard');return;}
 wallet.classList.add('wallet-scoreboard');
 if(!wallet.querySelector('.score-identity')){
  const identity=document.createElement('button');identity.type='button';identity.className='score-identity';
  identity.innerHTML='<span class="score-avatar"><img src="assets/buddy-bot/front-idle/01.png" alt=""></span><span class="score-name"><small>CHORE QUEST · MEMBER CARD</small><strong id="scoreNickname"></strong></span><span class="score-open">View ID '+icon('chevron')+'</span>';
  wallet.querySelector('.wallet-top').after(identity);identity.onclick=()=>showMemberCard();
  const main=document.createElement('div');main.className='score-main';const funds=document.createElement('div');funds.className='score-funds';
  const value=wallet.querySelector('#balance'),caption=wallet.querySelector('.wallet-caption');value.before(main);funds.append(value,caption);main.append(funds);
  const progress=document.createElement('div');progress.className='score-progress';progress.innerHTML='<strong id="scoreCompleted"></strong><span>Chores completed</span><small id="scoreQuality"></small>';main.append(progress);
 }
 wallet.querySelector('#scoreNickname').textContent=who.username;
 wallet.querySelector('.score-identity').setAttribute('aria-label','View '+who.username+'’s member ID card');
 wallet.querySelector('#scoreCompleted').textContent=count;
 if(typeof journalCount==='function')journalCount('scoreCompleted',count,who.id);
 wallet.querySelector('#scoreQuality').textContent=quality+' done really well';
}
