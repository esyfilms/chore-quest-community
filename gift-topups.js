// A family allowance promise, not a bank transfer. Cloud validates every credit.
function giftChildren(){return typeof cloudChildren!=='undefined'?cloudChildren:typeof selectedChild!=='undefined'?[selectedChild]:[{id:'sample-child',username:'Player 1'}];}
function renderGiftTopup(w){
 const math=document.querySelector('.math');
 if(math&&!document.querySelector('#giftTotal')){const row=document.createElement('div');row.innerHTML='<span>Gifts & top-ups</span><strong id="giftTotal" class="positive"></strong>';math.append(row);}
 if(document.querySelector('#giftTotal'))$('#giftTotal').textContent='+'+money(gifted);
 if(!adult){const scan=document.createElement('button');scan.className='action primary';scan.id='scanGift';scan.textContent='Scan a gift';w.prepend(scan);scan.onclick=openGiftScanner;return;}
 const entry=document.createElement('div');entry.className='gift-entry';entry.innerHTML='<button class="action primary" id="giftTopup">Give a gift / top up</button><p class="small">Create a gift QR. Your child scans and confirms before coins are added.</p>';w.prepend(entry);$('#giftTopup').onclick=openGiftTopup;
}
function giftError(message){let error=modal.querySelector('#giftError');if(!error){error=document.createElement('p');error.id='giftError';error.className='negative';error.setAttribute('role','alert');modal.insertBefore(error,modal.querySelector('.dialog-actions'));}error.textContent=message;}
function openGiftTopup(){
 if(!adult)return;
 const children=giftChildren();if(!children.length){toast('Invite a child before adding a gift.');return;}
 const key=crypto.randomUUID(),code=newGiftCode();
 show('<h2>Give a gift</h2><p>Create a gift QR for your child to scan and accept. This does not transfer money from your bank.</p><label>For<select id="giftChild">'+children.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.username)+'</option>').join('')+'</select></label><label>Amount ($)<input id="giftAmount" type="text" inputmode="decimal" placeholder="0.00"></label><label>Gift note<input id="giftName" type="text" maxlength="120" value="Birthday gift"></label><div class="dialog-actions"><button class="action" id="cancel">Cancel</button><button class="action primary" id="reviewGift">Review gift</button></div>');
 if(typeof selectedChild!=='undefined'&&children.some(c=>c.id===selectedChild?.id))$('#giftChild').value=selectedChild.id;
 $('#reviewGift').onclick=()=>{const amount=cents($('#giftAmount').value),name=$('#giftName').value.trim(),child=children.find(c=>c.id===$('#giftChild').value);if(!child){giftError('Choose a child.');return;}if(amount===null||amount<1||amount>100000){giftError('Enter an amount from $0.01 to $1,000.00.');return;}if(!name||name.length>120){giftError('Enter a gift note with 1–120 characters.');return;}
 const payload={id:key,childId:child.id,childName:child.username,amount,name,code};
 show('<h2>Confirm this gift</h2><div class="rule"><span>For</span><strong>'+esc(child.username)+'</strong></div><div class="rule"><span>'+esc(name)+'</span><strong>+'+money(amount)+'</strong></div><p>Create the QR now. Coins are added only after your child scans and confirms. You pay out cash or purchases later.</p><div class="dialog-actions"><button class="action" id="cancel">Cancel</button><button class="action primary" id="confirmGift">Create QR for '+money(amount)+' gift</button></div>');$('#confirmGift').onclick=()=>createGiftOffer(payload);};
}
function saveGiftTopup(payload){if(!adult)return;gifted+=payload.amount;ledger.unshift({name:payload.name,amount:payload.amount,note:'Gift from '+reviewer,kind:'gift'});close();render();toast('Gift added.');}
