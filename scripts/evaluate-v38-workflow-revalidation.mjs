import fs from'node:fs';
import{buildPitchfitBands}from'../v38-pitchfit-bands.mjs';
import{buildBbeBands}from'../v38-bbe-bands.mjs';
import{V38_WORKFLOW_REVALIDATION,evaluateWorkflowRevalidation}from'../v38-workflow-revalidation-core.mjs';

const[profilePath,pitchfitPath,bbePath,starterPath]=process.argv.slice(2);
if(!profilePath||!pitchfitPath||!bbePath||!starterPath)throw Error('Usage: node scripts/evaluate-v38-workflow-revalidation.mjs <profile.json> <pitchfit.json> <bbe.json> <starter.json>');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const profile=read(profilePath),pitchfit=read(pitchfitPath),bbe=read(bbePath),starter=read(starterPath);
if(profile.protocol!=='V38_POINT_IN_TIME_REPLAY_V1'||profile.point_in_time!==true||Number(profile.forward_leakage_days)!==0)throw Error('Invalid point-in-time profile artifact');
if(pitchfit.protocol!=='V38_PITCHFIT_DISTRIBUTION_V1'||pitchfit.as_of_verified!==true)throw Error('Invalid pitchfit artifact');
if(bbe.protocol!=='V38_RECENT_BBE_DISTRIBUTION_V1'||bbe.as_of_verified!==true)throw Error('Invalid recent BBE artifact');
if(starter.protocol!=='V38_STARTER_DAMAGE_VALIDATION_V2'||starter.as_of_verified!==true)throw Error('Invalid starter artifact');
if(new Set([profile.date,pitchfit.date,bbe.date,starter.date]).size!==1)throw Error('Artifact dates do not match');
if(profile.research_only!==true||profile.scoring_enabled!==false)throw Error('Profile must remain research-only');

const pModel=buildPitchfitBands(pitchfit.rows||[]),bModel=buildBbeBands(bbe.rows||[]);
const pById=new Map((pitchfit.rows||[]).map(r=>[Number(r.player_id),r]));
const bById=new Map((bbe.rows||[]).map(r=>[Number(r.player_id),r]));
const sById=new Map((starter.rows||[]).map(r=>[Number(r.player_id),r]));
const rows=(profile.rows||[]).filter(r=>r.profile_complete===true).map(r=>{
  const id=Number(r.player_id),p=pById.get(id),b=bById.get(id),s=sById.get(id);
  const pBand=p?pModel.classify(p):'INELIGIBLE';
  const bBand=b?bModel.classify(b):{eligible:false,hrshape_band:'INELIGIBLE'};
  return{player_id:id,player:r.player||null,gamePk:r.gamePk??null,lineup_slot:r.lineup_slot??null,gate_count:Number(r.gate_count),homer:r.homer===true?true:r.homer===false?false:null,pitchfit_band:pBand,bbe_hrshape_band:bBand?.hrshape_band||'INELIGIBLE',starter_hr9_band:s?.starter_hr9_band||'UNAVAILABLE'};
});
const evald=evaluateWorkflowRevalidation(rows);
const outputRows=evald.rows.map(r=>({...r,revalidation:r.revalidation}));
const out={...V38_WORKFLOW_REVALIDATION,date:profile.date,point_in_time:true,as_of_verified:true,forward_leakage_days:0,profile_protocol:profile.protocol,pitchfit_protocol:pitchfit.protocol,bbe_protocol:bbe.protocol,starter_protocol:starter.protocol,price_provenance_status:'UNAVAILABLE_IN_REPLAY_INPUTS',protected_4of6_status:'FAIL_CLOSED_NOT_EVALUATED',roi_status:'UNAVAILABLE_NOT_FABRICATED',population:evald.population,qualified_hr:evald.qualified_hr,cohorts:evald.cohorts,rows:outputRows};
fs.mkdirSync('snapshots',{recursive:true});
const path=`snapshots/v38-workflow-revalidation-${profile.date}.json`;
fs.writeFileSync(path,JSON.stringify(out,null,2)+'\n');
console.log(`V38_WORKFLOW_REVALIDATION_PATH=${path}`);
console.log(`V38_WORKFLOW_REVALIDATION_SUMMARY=${JSON.stringify({date:out.date,population:out.population,qualified_hr:out.qualified_hr,cohorts:out.cohorts,protected_4of6_status:out.protected_4of6_status,roi_status:out.roi_status})}`);
