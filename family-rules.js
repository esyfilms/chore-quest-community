// Shared presentation. Cloud server independently enforces admin-only writes.
let familyRules=[];
function renderFamilyRules(w){
 const section=document.createElement('section');section.className='family-rules';
 section.innerHTML='<div class="section-head"><h2>Family rules</h2>'+(adult?'<button class="action" id="addFamilyRule">Add rule</button>':'')+'</div><p class="small">'+(adult?'Rules are shared with every child. Adding a rule does not deduct money.':'Your family’s rules. Only admins can add rules.')+'</p>'+(familyRules.length?familyRules.map(r=>'<div class="rule"><span>'+esc(r.name)+'</span><strong>'+(r.deduction?'−'+money(r.deduction):'No deduction')+'</strong></div>').join(''):'<p class="small">No extra family rules yet.</p>');
 w.prepend(section);if(adult)$('#addFamilyRule').onclick=addFamilyRule;
}
function addFamilyRule(){
 if(!adult)return;
 show('<h2>Add a family rule</h2><p>Every child can see this rule. Deductions are recorded separately by an admin.</p><label>Rule<input id="familyRuleName" type="text" maxlength="120" placeholder="e.g. Put toys away before bed"></label><label>Deduction ($, optional)<input id="familyRuleDeduction" type="text" inputmode="decimal" placeholder="Leave blank for no deduction"></label><div class="dialog-actions"><button class="action" id="cancel">Cancel</button><button class="action primary" id="saveFamilyRule">Save rule</button></div>');
 $('#saveFamilyRule').onclick=()=>{const name=$('#familyRuleName').value.trim(),raw=$('#familyRuleDeduction').value.trim(),deduction=raw?cents(raw):0;if(!name||name.length>120){ruleMessage('Enter a rule with 1–120 characters.');return;}if(deduction===null||deduction<0||deduction>100000){ruleMessage('Enter a deduction from $0.00 to $1,000.00.');return;}saveFamilyRule({name,deduction});};
}
function ruleMessage(message){let error=modal.querySelector('#ruleError');if(!error){error=document.createElement('p');error.id='ruleError';error.className='negative';error.setAttribute('role','alert');modal.insertBefore(error,modal.querySelector('.dialog-actions'));}error.textContent=message;}
function saveFamilyRule(rule){if(!adult)return;familyRules.unshift({...rule,id:'sample-'+Date.now()});close();render();toast('Family rule added.');}
