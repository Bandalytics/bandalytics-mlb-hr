import fs from 'node:fs/promises';
const html=await fs.readFile('bandalytics-mobile-standalone.html','utf8');
const js=await fs.readFile('bandalytics-mobile-standalone.js','utf8');
const fail=m=>{throw new Error('MOBILE STANDALONE: '+m)};
for(const marker of ['BANDALYTICS','MLB RESEARCH TERMINAL','Today’s Matchup Research','Game-first research with projected lineups','bandalytics-mobile-standalone.js?v=2'])if(!html.includes(marker))fail('missing HTML marker '+marker);
for(const marker of ["version:'v2'",'researchOnly:true','projectionIsEvidence:false','scoringChanged:false','profileGateChanged:false','longshotRuleChanged:false','noForcedPool:true','ELITE 6/6','MATCH 5/6','/api/projected-lineups','/api/profile-v38-candidate','/api/starter-damage-native','/api/environment-native'])if(!js.includes(marker))fail('missing JS marker '+marker);
for(const forbidden of ['Game Score','autoPromote:true','scoring_eligible:true','profileGateChanged:true','longshotRuleChanged:true','Final Pool','Daily Card'])if(html.includes(forbidden)||js.includes(forbidden))fail('forbidden mobile behavior '+forbidden);
console.log('MOBILE STANDALONE PASS');
