import fs from 'node:fs';
import { classifyPitchfitBands } from '../v38-pitchfit-bands.mjs';
import { classifyBbeBands } from '../v38-bbe-bands.mjs';
import { evaluateBaseballConvergence } from '../v38-baseball-convergence.mjs';

const [profilePath,pitchfitPath,bbePath]=process.argv.slice(2);
if(!profilePath||!pitchfitPath||!bbePath) throw new Error('Usage: node scripts/evaluate-v38-historical-convergence.mjs <profile.json> <pitchfit.json> <bbe.json>');
const profile=JSON.parse(fs.readFileSync(profilePath,'utf8'));
const pitchfit=JSON.parse(fs.readFileSync(pitchfitPath,'utf8'));
const bbe=JSON.parse(fs.readFileSync(bbePath,'utf8'));
if(profile.protocol!=='V38_POINT_IN_TIME_REPLAY_V1'||profile.point_in_time!==true||profile.research_only!==true||profile.scoring_enabled!==false) throw new Error('Invalid point-in-time profile artifact');
if(pitchfit.protocol!=='V38_PITCHFIT_DISTRIBUTION_V1'||pitchfit.as_of_verified!==true||pitchfit.research_only!==true) throw new Error('Invalid pitchfit artifact');
if(bbe.protocol!=='V38_RECENT_BBE_DISTRIBUTION_V1'||bbe.as_of_verified!==true||bbe.research_only!==true) throw new Error('Invalid BBE artifact');
if(profile.date!==pitchfit.date||profile.date!==bbe.date) throw new Error('Artifact dates do not match');

const pitchBands=classifyPitchfitBands(pitchfit.rows||[]);
const bbeBands=classifyBbeBands(bbe.rows||[]);
const pById=new Map(pitchBands.map(x=>[Number(x.player_id),x]));
const bById=new Map(bbeBands.map(x=>[Number(x.player_id),x]));
const rows=(profile.rows||[]).filter(r=>r.profile_complete===true).map(r=>{
  const p=pById.get(Number(r.player_id));
  const b=bById.get(Number(r.player_id));
  return {...r,pitchfit_band:p?.pitchfit_band||null,bbe_band:b?.bbe_band||null,pitchfit_stable:!!p,bbe_full_sample:!!b};
});
const results=evaluateBaseballConvergence(rows);
const out={protocol:'V38_HISTORICAL_CONVERGENCE_V1',date:profile.date,point_in_time:true,as_of_verified:true,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,profile_rows:rows.length,pitchfit_joined:rows.filter(r=>r.pitchfit_stable).length,bbe_joined:rows.filter(r=>r.bbe_full_sample).length,both_joined:rows.filter(r=>r.pitchfit_stable&&r.bbe_full_sample).length,results};
const path=`snapshots/v38-historical-convergence-${profile.date}.json`;
fs.mkdirSync('snapshots',{recursive:true});fs.writeFileSync(path,JSON.stringify(out,null,2)+'\n');
console.log(`V38_HIST_CONVERGENCE_PATH=${path}`);console.log(`V38_HIST_CONVERGENCE_SUMMARY=${JSON.stringify(out)}`);
