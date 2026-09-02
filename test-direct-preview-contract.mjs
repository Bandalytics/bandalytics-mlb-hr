import fs from 'node:fs/promises';
const s=await fs.readFile('api-handlers/direct-preview.js','utf8');
const required=[
  'MLB_STATSAPI_DIRECT_IDENTITY_FIRST',
  "mode:'CLIENT_PROGRESSIVE'",
  "endpoint:'/api/profile-native-qa'",
  'profileBatchPlan(entities,PROFILE_BATCH_SIZE)',
  "sample_grade:'PENDING'",
  "profile_source:'PENDING_DIRECT_PROFILE'",
  'scoring_eligible:false',
  'research_only:true',
  'scoring_enabled:false',
  'model_scoring_changed:false',
  'scoring_cutover:false'
];
for(const x of required)if(!s.includes(x))throw new Error('missing Direct Preview contract marker '+x);
const forbidden=['buildSavantProfileUrl(','summarizeSavantCsv(','fetchText(','Promise.allSettled(','scoring_eligible:true'];
for(const x of forbidden)if(s.includes(x))throw new Error('Direct Preview became blocking/scoring-capable: '+x);
console.log('DIRECT PREVIEW CONTRACT PASS');
