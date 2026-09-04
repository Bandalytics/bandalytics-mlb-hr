import fs from 'node:fs/promises';
const src=await fs.readFile('bandalytics-prospective-report.js','utf8');
const fail=m=>{throw new Error('PROSPECTIVE REPORT: '+m)};
for(const marker of [
  "bandalytics:prospective-profile-ledger:v1",
  "BANDALYTICS_PROSPECTIVE_ARCHETYPE_REPORT_V1",
  "descriptive_only:true",
  "ranking_withheld:true",
  "HR + NO_HR only; VOID_NOT_APPEARED excluded",
  "FOUNDATION",
  "LONGSHOT",
  "PULL POWER",
  "BARREL MONSTER",
  "ELITE CONTACT WATCH",
  "FORMAL_ARCHETYPE_OVERLAP_2PLUS",
  "FORMAL_ARCHETYPE_OVERLAP_3PLUS",
  "LONGSHOT_700_4OF6",
  "LONGSHOT_PLUS_ISO_200",
  "LONGSHOT_PLUS_BARREL_12",
  "LONGSHOT_EXTREME_CONTACT",
  "noScoringHooks:true",
  "noModelPromotion:true",
  "voidExcludedFromDenominator:true"
]) if(!src.includes(marker))fail('missing marker '+marker);
for(const forbidden of [
  'ranking_withheld:false',
  'descriptive_only:false',
  'noScoringHooks:false',
  'noModelPromotion:false',
  'scoring_eligible:true',
  'projection_is_evidence:true',
  'Game Score',
  'best archetype'
]) if(src.includes(forbidden))fail('forbidden behavior/copy '+forbidden);
if(!src.includes("const VALID=new Set(['HR','NO_HR'])"))fail('completed denominator guard missing');
if(!src.includes("o.status==='VOID_NOT_APPEARED'"))fail('void handling missing');
console.log('PROSPECTIVE ARCHETYPE REPORT PASS');
