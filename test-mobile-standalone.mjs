import fs from 'node:fs/promises';
const html=await fs.readFile('bandalytics-mobile-standalone.html','utf8');
const js=await fs.readFile('bandalytics-mobile-standalone.js','utf8');
const fail=m=>{throw new Error('MOBILE STANDALONE: '+m)};
for(const marker of ['BANDALYTICS','MLB RESEARCH','DATA','PROCESS','PICKS','BOARD','GAMES','FILTERS','MY PICKS','MORE','bandalytics-mobile-standalone.js?v=5'])if(!html.includes(marker))fail('missing HTML marker '+marker);
for(const marker of ["version:'v6'",'researchOnly:true','projectionIsEvidence:false','scoringChanged:false','profileGateChanged:false','longshotRuleChanged:false','noForcedPool:true','boardFirst:true','blackRedIdentity:true','progressiveProfileHydration:true','userControlledFilters:true','manualMyPicksOnly:true','multipleArchetypes:true',"archetypeSchema:'BANDALYTICS_ARCHETYPE_SCHEMA_V2'",'Foundation','Pull Power','Barrel Monster','Elite Contact Watch','Longshot Check','6/6 only','5/6+','Confirmed lineups','My Picks contains only players you manually save','/api/projected-lineups','/api/profile-v38-candidate','/api/starter-damage-native','/api/environment-native'])if(!js.includes(marker))fail('missing JS marker '+marker);
for(const forbidden of ['Game Score','autoPromote:true','scoring_eligible:true','profileGateChanged:true','longshotRuleChanged:true','Final Pool','Daily Card','autoSavePick:true'])if(html.includes(forbidden)||js.includes(forbidden))fail('forbidden mobile behavior '+forbidden);
console.log('MOBILE STANDALONE PASS');
