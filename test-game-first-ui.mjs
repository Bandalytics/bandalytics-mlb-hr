import fs from'node:fs/promises';
const js=await fs.readFile('bandalytics-game-first-ui.js','utf8');
const css=await fs.readFile('bandalytics-game-first-ui.css','utf8');
const fail=m=>{throw new Error('GAME-FIRST UI: '+m)};
for(const marker of ["TODAY'S MLB SLATE",'Matchup Research','profileHighlighting:\'presentation-only\'','modelScoringChanged:false','profileGateChanged:false','longshotRuleChanged:false','fullLineupVisible:true','LS 4/6'])if(!js.includes(marker))fail('missing JS marker '+marker);
for(const marker of ['bd-profile-qualified','bd-profile-longshot','rgba(232,190,95','rgba(102,162,255','Public presentation only'])if(!css.includes(marker))fail('missing CSS marker '+marker);
for(const forbidden of ['scoring_eligible:true','profileGateChanged:true','longshotRuleChanged:true','Game Score'])if(js.includes(forbidden)||css.includes(forbidden))fail('forbidden behavior '+forbidden);
console.log('GAME-FIRST UI PASS');
