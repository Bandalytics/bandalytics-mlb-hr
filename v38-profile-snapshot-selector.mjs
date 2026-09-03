import crypto from 'node:crypto';

export const V38_PROFILE_SNAPSHOT_PROTOCOL='V38_PREGAME_SNAPSHOT_V1';

function validSha(s){return typeof s==='string'&&/^[a-f0-9]{64}$/.test(s)}

export function validProfileSnapshot(z,{date=null}={}){
  if(!z||z.snapshot_protocol!==V38_PROFILE_SNAPSHOT_PROTOCOL)return false;
  if(date&&z.date!==date)return false;
  if(z.point_in_time!==true||z.research_only!==true||z.scoring_enabled!==false||z.scoring_eligible!==false||z.model_scoring_changed!==false)return false;
  if(!Array.isArray(z.pregame_games)||!Array.isArray(z.excluded_started_games)||!Array.isArray(z.items))return false;
  const captured=Date.parse(z.captured_at);if(!Number.isFinite(captured))return false;
  for(const g of z.pregame_games){const start=Date.parse(g?.start_time);if(!Number.isFinite(start)||start<=captured)return false;}
  if(!validSha(z.sha256))return false;
  const {sha256,...body}=z;
  const calc=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return calc===sha256;
}

export function selectLatestValidProfileSnapshot(snapshots,{date=null}={}){
  return (snapshots||[]).filter(z=>validProfileSnapshot(z,{date})).sort((a,b)=>Date.parse(b.captured_at)-Date.parse(a.captured_at))[0]||null;
}
