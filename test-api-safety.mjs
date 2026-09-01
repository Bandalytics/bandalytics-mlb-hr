import fs from'node:fs/promises';
for(const file of ['api/direct-profile.js','api/market-identity.js','api/results-identity.js']){
  const s=await fs.readFile(file,'utf8');
  if(file!=='api/results-identity.js'){
    for(const marker of ['research_only:true','scoring_enabled:false'])if(!s.includes(marker))throw Error(file+' missing '+marker);
    for(const forbidden of ['buildFinalPool(','qualificationLane(','tonightScore(','lockPool(','buildStructuredTickets('])if(s.includes(forbidden))throw Error(file+' contains scoring hook '+forbidden);
  }
}
console.log('API SAFETY PASS');
