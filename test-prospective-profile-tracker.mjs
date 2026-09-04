import fs from 'node:fs/promises';
const src=await fs.readFile('bandalytics-prospective-profile-tracker.js','utf8');
const fail=m=>{throw new Error('PROSPECTIVE PROFILE TRACKER: '+m)};
for(const marker of [
  "bandalytics:prospective-profile-ledger:v1",
  "BANDALYTICS_PROSPECTIVE_PROFILE_LEDGER_V1",
  "immutable_profile_snapshot:true",
  "prospective:true",
  "research_only:true",
  "scoring_eligible:false",
  "projection_is_evidence:false",
  "FOUNDATION",
  "LONGSHOT",
  "PULL POWER",
  "BARREL MONSTER",
  "ELITE CONTACT WATCH",
  "LONGSHOT_700_4OF6",
  "LONGSHOT_PLUS_ISO_200",
  "LONGSHOT_PLUS_BARREL_12",
  "FORMAL_ARCHETYPE_OVERLAP_2PLUS",
  "FORMAL_ARCHETYPE_OVERLAP_3PLUS",
  "profileGateChanged:false",
  "longshotRuleChanged:false",
  "scoringChanged:false"
]) if(!src.includes(marker))fail('missing marker '+marker);
for(const forbidden of [
  'scoring_eligible:true',
  'projection_is_evidence:true',
  'profileGateChanged:true',
  'longshotRuleChanged:true',
  'scoringChanged:true',
  'profile_passes>=4',
  'fill to target'
]) if(src.includes(forbidden))fail('forbidden behavior '+forbidden);
if(!src.includes('if(ledger.snapshots[k])continue'))fail('snapshot immutability guard missing');
if(!src.includes('Number(p.barrel)>8')&&!src.includes('gt(m.barrel,8)'))fail('barrel threshold missing');
if(!src.includes('gt(m.hh,35)'))fail('hard-hit threshold missing');
if(!src.includes('gt(m.blast,8)'))fail('blast threshold missing');
if(!src.includes('gt(m.pullair,18)'))fail('pull-air threshold missing');
if(!src.includes('gt(m.ev,89)'))fail('EV threshold missing');
if(!src.includes('gt(m.iso,.180)'))fail('ISO threshold missing');
console.log('PROSPECTIVE PROFILE TRACKER PASS');
