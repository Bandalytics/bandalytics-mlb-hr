export const V38_PARK_FACTOR_POLICY=Object.freeze({
  protocol:'V38_PARK_FACTOR_POLICY_V1',
  provider:'MLB_BASEBALL_SAVANT_STATCAST',
  source:'STATCAST_PARK_FACTORS',
  metric:'HR',
  preferred_window:'ROLLING_3_YEAR',
  handedness_specific:true,
  role:'SUPPORT_CONTEXT_AND_CLOSE_CALL_TIEBREAK_ONLY',
  hard_gate:false,
  standalone_hr_boost:false,
  prospective_capture_required:true,
  historical_reconstruction_without_pregame_snapshot:false,
  point_in_time_required:true,
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false,
  model_scoring_changed:false
});

const time=x=>Date.parse(x);
const norm=s=>String(s??'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
const exactHand=s=>{const x=String(s??'').trim().toUpperCase();return x==='L'||x==='R'?x:null};
export function effectiveParkBatSide(batSide,oppPitcherHand){const b=String(batSide??'').trim().toUpperCase(),p=String(oppPitcherHand??'').trim().toUpperCase();if(b==='L'||b==='R')return b;if(b==='S'&&p==='R')return'L';if(b==='S'&&p==='L')return'R';return null;}
export function validParkFactorSnapshot(s){
  return !!s&&s.protocol===V38_PARK_FACTOR_POLICY.protocol&&s.point_in_time===true&&s.research_only===true&&s.scoring_enabled===false&&s.scoring_eligible===false&&Number.isFinite(time(s.captured_at))&&Array.isArray(s.factors);
}
export function selectLatestPregameParkSnapshot(snapshots,startTime){
  const start=time(startTime);if(!Number.isFinite(start))return null;
  return (snapshots||[]).filter(validParkFactorSnapshot).filter(s=>time(s.captured_at)<start).sort((a,b)=>time(b.captured_at)-time(a.captured_at))[0]||null;
}
export function parkFactorForVenue(snapshot,venue,batSide){
  if(!validParkFactorSnapshot(snapshot)||!venue)return null;
  const h=exactHand(batSide);if(!h)return null;
  const v=norm(venue),rows=snapshot.factors.filter(x=>norm(x.venue)===v);
  if(!rows.length)return null;
  const row=rows.find(x=>exactHand(x.bat_side)===h)||null;
  if(!row)return null;
  const hr=Number(row.hr_factor);if(!Number.isFinite(hr))return null;
  return {venue:row.venue,bat_side:h,hr_factor:hr,captured_at:snapshot.captured_at,snapshot_sha256:snapshot.sha256||null,source:snapshot.source||V38_PARK_FACTOR_POLICY.source,role:V38_PARK_FACTOR_POLICY.role,hard_gate:false,standalone_hr_boost:false,research_only:true,scoring_enabled:false,scoring_eligible:false};
}
