import fs from'node:fs/promises';
const js=await fs.readFile('bandalytics-mobile-flat-ui.js','utf8');
const css=await fs.readFile('bandalytics-mobile-flat-ui.css','utf8');
const fail=m=>{throw new Error('MOBILE-FLAT UI: '+m)};
for(const marker of ['bandalyticsMobileFlatRoot','flatSiblingRoot:true','researchOnly:true','modelScoringChanged:false','profileGateChanged:false','longshotRuleChanged:false'])if(!js.includes(marker))fail('missing JS marker '+marker);
for(const marker of ['body.bandalytics-mobile-flat-live>.app{display:none!important}','#bandalyticsMobileFlatRoot','contain:none!important','Separate flat iPhone DOM path'])if(!css.includes(marker))fail('missing CSS marker '+marker);
for(const forbidden of ['scoring_eligible:true','profileGateChanged:true','longshotRuleChanged:true','autoPromote:true','Game Score'])if(js.includes(forbidden)||css.includes(forbidden))fail('forbidden behavior '+forbidden);
console.log('MOBILE-FLAT UI PASS');
