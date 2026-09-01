import fs from'node:fs/promises';import vm from'node:vm';
const s=await fs.readFile('direct-parity-compare.js','utf8');new vm.Script(s,{filename:'direct-parity-compare.js'});
for(const x of ['research_only:true','scoring_enabled:false','read_only:true','profile_fields_compared'])if(!s.includes(x))throw Error('missing '+x);
for(const x of ['buildFinalPool(','qualificationLane(','tonightScore(','confidenceScore(','lockPool(','buildStructuredTickets('])if(s.includes(x))throw Error('scoring hook '+x);
for(const x of ['P=','P =','P['])if(s.includes(x))throw Error('production state mutation pattern '+x);
console.log('DIRECT PARITY COMPARATOR PASS');
