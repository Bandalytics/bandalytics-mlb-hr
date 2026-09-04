import fs from 'node:fs/promises';
const js=await fs.readFile('bandalytics-game-first-ui.js','utf8');
const css=await fs.readFile('bandalytics-game-first-ui.css','utf8');
const fail=m=>{throw new Error('GAME FIRST UI: '+m)};
for(const marker of ['bandalytics-game-ui-booting','TODAY\'S MLB SLATE','Matchup Research','hidesDiagnosticReadiness:true','modelScoringChanged:false','profileGateChanged:false','longshotRuleChanged:false'])if(!js.includes(marker))fail('missing '+marker);
for(const marker of ['body.bandalytics-game-ui-booting .app> :not(#v38ProjectedResearch)','grid-template-columns:repeat(2,minmax(0,1fr))','bd-secondary-detail'])if(!css.includes(marker))fail('missing CSS '+marker);
for(const forbidden of ['scoring_enabled:true','scoring_eligible:true','projection_is_evidence:true','profileGateChanged:true','longshotRuleChanged:true'])if(js.includes(forbidden)||css.includes(forbidden))fail('forbidden '+forbidden);
console.log('GAME FIRST UI PASS');
