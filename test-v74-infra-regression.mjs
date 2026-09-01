import fs from 'node:fs/promises';
import { patchIdentityLoader } from './patch-identity-loader.mjs';

const srcPath='fixtures/identity-loader.789e4c78d03a.js';
const src=await fs.readFile(srcPath,'utf8');
const patched=patchIdentityLoader(src);

const checks=[
  ['retries=3', s=>s.includes('fetchJSON(url,opt={},label=\'request\',retries=3)')||s.includes('fetchJSON(url,opt={},label="request",retries=3)')||s.includes('retries=3')],
  ['12s abort', s=>s.includes('12000')&&s.includes('ctl.abort()')],
  ['CORE batch 24', s=>/for\(let i=0;i<names\.length;i\+=24\)/.test(s)],
  ['CORE concurrency 2', s=>/pool\(batches,2/.test(s)],
  ['Pitch Fit batch 5', s=>/for\(let i=0;i<active\.length;i\+=5\)/.test(s)],
  ['split fallback', s=>s.includes('splitFallback')],
  ['recovery telemetry', s=>s.includes('__BANDALYTICS_RECOVERY')],
];

for(const [name,fn] of checks){
  if(!fn(src)) throw new Error('v74 source regression: '+name);
  if(!fn(patched)) throw new Error('v74 patched regression: '+name);
}

// Ensure the identity patch adds exact-ID safety without changing core loader constants.
for(const marker of ['player_id:+p.player_id','pitchfit_identity_verified=true','Pitch Fit response did not return hitter MLBAM ID','Pitch Fit hitter MLBAM mismatch']){
  if(!patched.includes(marker)) throw new Error('missing identity marker: '+marker);
}

console.log('V74 INFRA REGRESSION PASS');
