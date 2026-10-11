// Generic pixel robot animation. Presentation only; never changes app records.
(()=>{
 const script=document.currentScript,base=new URL('assets/buddy-bot/',script.src).href;
 const motions={'front-idle':{frames:8,frameMs:260},'front-pet':{frames:8,frameMs:180},'front-happy':{frames:8,frameMs:120},jump:{frames:8,frameMs:120},walk:{frames:8,frameMs:120},bark:{frames:8,frameMs:120},wag:{frames:8,frameMs:120},paw:{frames:7,frameMs:140}};
 const faceCropY={'front-idle':[16,17,18,19,19,17,18,17],'front-happy':[15,15,16,17,17,16,15,15],'front-pet':[16,15,14,15,17,17,18,17]};
 const ambient=['front-idle','wag','walk','bark','front-happy','jump','paw'],faceAmbient=['front-idle','front-happy','front-idle','front-pet'];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),companions=new Map();let timer=0;
 const frame=(name,index)=>base+name+'/'+String(index+1).padStart(2,'0')+'.png';
 function paint(d){const src=frame(d.motion,d.index);if(d.img.src!==src)d.img.src=src;d.img.dataset.buddyMotion=d.motion;d.img.dataset.buddyFrame=String(d.index);if(d.faceOnly)d.img.style?.setProperty('--buddy-face-top',(-faceCropY[d.motion][d.index]/22*100)+'%');const walking=d.motion==='walk';d.img.style?.setProperty('--buddy-walk',walking?([0,4,8,12,12,8,4,0][d.index])+'px':'0px');d.img.style?.setProperty('--buddy-facing',walking&&d.index>3?'-1':'1');}
 function idle(d){d.ambientIndex=0;d.ambientPlaying=true;d.motion='front-idle';d.index=0;d.next=performance.now()+motions['front-idle'].frameMs;paint(d);}
 function schedule(){clearTimeout(timer);timer=0;if(document.hidden||reduced.matches)return;const active=[...companions.values()].filter(d=>d.visible&&d.img.isConnected);if(!active.length)return;timer=setTimeout(tick,Math.max(16,Math.min(...active.map(d=>d.next-performance.now()))));}
 function tick(){const now=performance.now();for(const d of companions.values())if(d.visible&&d.img.isConnected&&now>=d.next){const spec=motions[d.motion];d.index++;if(d.index>=spec.frames){if(d.ambientPlaying){const cycle=d.faceOnly?faceAmbient:ambient;d.ambientIndex=(d.ambientIndex+1)%cycle.length;d.motion=cycle[d.ambientIndex];d.index=0;d.next=now+motions[d.motion].frameMs;paint(d);continue;}else{idle(d);continue;}}d.next=now+spec.frameMs;paint(d);}schedule();}
 function play(d,name){if(d.faceOnly&&!name.startsWith('front-'))name='front-happy';if(!motions[name])return;if(reduced.matches){idle(d);return;}d.ambientPlaying=false;d.motion=name;d.index=0;d.next=performance.now()+motions[name].frameMs;paint(d);schedule();}
 const view=new IntersectionObserver(entries=>{for(const e of entries){const d=companions.get(e.target);if(d){d.visible=e.isIntersecting;d.next=performance.now()+motions[d.motion].frameMs;}}schedule();});
 function scan(){
  for(const [img] of companions)if(!img.isConnected){view.unobserve(img);companions.delete(img);}
  for(const img of document.querySelectorAll('img')){
   if(!img.src.includes('/buddy-bot/')||companions.has(img))continue;
   // Account/settings and Wallet entry remain their original buttons.
   if(img.closest('button,a')||!img.matches('.dog,.auth-dog,.card-art img,.buddy-event'))continue;
   const button=document.createElement('button');button.type='button';button.className='buddy-pet';button.setAttribute('aria-label','High five Buddy');button.title='High five Buddy';img.before(button);button.append(img);img.alt='';
   const d={img,faceOnly:img.dataset.buddyFace==='true',ambientIndex:0,ambientPlaying:!img.dataset.buddyStart,motion:reduced.matches||img.dataset.buddyFace==='true'?'front-idle':img.dataset.buddyStart==='approved'?'jump':img.dataset.buddyStart==='submitted'?'front-happy':'front-idle',index:0,next:performance.now()+260,visible:false};companions.set(img,d);paint(d);view.observe(img);
   button.addEventListener('click',()=>play(d,'front-pet'));
  }
  schedule();
 }
 new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{for(const d of companions.values())d.next=performance.now()+motions[d.motion].frameMs;schedule();});
 reduced.addEventListener('change',()=>{for(const d of companions.values())idle(d);schedule();});
 document.addEventListener('buddy:celebrate',e=>{const motion=e.detail?.kind==='approved'?'jump':'front-happy';for(const d of companions.values())if(d.visible)play(d,motion);});
 window.addEventListener('pagehide',()=>clearTimeout(timer));
 window.addEventListener('pageshow',()=>schedule());
 scan();
})();
