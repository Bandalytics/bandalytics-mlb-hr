import fs from 'node:fs/promises';
const files=['direct-normalizer.mjs','direct-state-research.mjs','direct-research-ui.js','direct-parity-compare.js','profile-adapter.mjs','profile-api.mjs','identity-resolver.mjs','market-adapter.mjs'];
const forbidden=['buildFinalPool(','qualificationLane(','tonightScore(','lockPool(','buildStructuredTickets(','finalLane(','confidenceScore('];
for(const file of files){const s=await fs.readFile(file,'utf8');for(const x of forbidden)if(s.includes(x))throw Error(file+' contains forbidden production scoring hook '+x)}
const state=await fs.readFile('direct-state-research.mjs','utf8');
for(const x of ['direct_scoring_eligible=false','v37_scoring_enabled=false','research_only:true'])if(!state.includes(x))throw Error('direct fail-closed marker missing '+x);
console.log('DIRECT NO-SCORING-HOOKS PASS');
