import crypto from 'node:crypto';
export function validStarterDamageSnapshot(s){
  if(!s||s.protocol!=='V38_STARTER_DAMAGE_SNAPSHOT_V1'||s.point_in_time!==true||s.as_of_verified!==true||s.research_only!==true||s.scoring_enabled!==false||!Array.isArray(s.rows)||!Number.isFinite(Date.parse(s.captured_at))||typeof s.sha256!=='string') return false;
  const {sha256,...body}=s;
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')===sha256;
}
export function selectLatestStarterDamage(snapshots,playerId,gamePk,startTime){
  const start=Date.parse(startTime); if(!Number.isFinite(start)) return null;
  for(const s of [...(snapshots||[])].filter(validStarterDamageSnapshot).filter(x=>Date.parse(x.captured_at)<start).sort((a,b)=>Date.parse(b.captured_at)-Date.parse(a.captured_at))){
    const r=(s.rows||[]).find(x=>+x.player_id===+playerId && (x.gamePk==null||gamePk==null||+x.gamePk===+gamePk));
    if(r) return {row:r,captured_at:s.captured_at,sha256:s.sha256};
  }
  return null;
}
