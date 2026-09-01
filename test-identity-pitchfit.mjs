import fs from'node:fs/promises';import vm from'node:vm';import{patchIdentityLoader}from'./patch-identity-loader.mjs';
const base=await fs.readFile('fixtures/identity-loader.789e4c78d03a.js','utf8');
const out=patchIdentityLoader(base);new vm.Script(out,{filename:'identity-loader-patched.js'});
const must=[
  "player_id:+p.player_id",
  "hitter_id:+p.player_id",
  "team:p.team",
  "+rid===+p.player_id",
  "pitchfit_identity_verified=true",
  "Pitch Fit response did not return hitter MLBAM ID",
  "Pitch Fit hitter MLBAM mismatch",
  "if(p.pitchfit_identity_verified===true)continue"
];
for(const x of must)if(!out.includes(x))throw Error('missing '+x);
const accept=(expected,response)=>{const e=Object.values(response?.players||{})[0],rid=e?.player_id??e?.hitter_id??e?.batter_id??response?.player_id??response?.hitter_id??response?.batter_id;return rid!=null&&+rid===+expected};
const cases=[
  [571970,{players:{'Max Muncy':{player_id:571970,score:45,status:'TRUE'}}},true,'exact player_id'],
  [571970,{players:{'Max Muncy':{hitter_id:'571970',score:45,status:'TRUE'}}},true,'exact hitter_id string'],
  [571970,{players:{'Max Muncy':{batter_id:571970,score:45,status:'TRUE'}}},true,'exact batter_id'],
  [571970,{players:{'Max Muncy':{player_id:691777,score:45,status:'TRUE'}}},false,'mismatch'],
  [571970,{players:{'Max Muncy':{score:45,status:'TRUE'}}},false,'missing id'],
  [691777,{player_id:691777,players:{'Max Muncy':{score:45,status:'TRUE'}}},true,'top-level exact id'],
  [691777,{player_id:571970,players:{'Max Muncy':{score:45,status:'TRUE'}}},false,'top-level mismatch']
];
for(const [id,r,want,label] of cases){let got=accept(id,r);if(got!==want)throw Error(label+' expected '+want+' got '+got)}
console.log('IDENTITY PITCHFIT GUARD PASS',cases.length+'/'+cases.length);
