export const V38_EXACT_GAME_POSTGAME_REQUIRED_FROM='2026-09-03';
function validSha(s){return typeof s==='string'&&/^[a-f0-9]{64}$/.test(s)}
function validTime(s){return typeof s==='string'&&Number.isFinite(Date.parse(s))}
export function validateExactGamePostgameArtifact(z,{requiredFrom=V38_EXACT_GAME_POSTGAME_REQUIRED_FROM}={}){
  if(!z||typeof z!=='object')return{valid:false,reason:'NOT_OBJECT'};
  if(String(z.date||'')<requiredFrom)return{valid:true,legacy:true,reason:null};
  if(z.evaluation_protocol!=='V38_PREGAME_OUTCOME_EVAL_V5'||z.status!=='FINAL'||z.point_in_time!==true||z.prospective_validation!==true||z.qualifying_backtest!==true)return{valid:false,reason:'INVALID_FINAL_V5'};
  if(z.profile_selection_protocol!=='V38_POSTGAME_PROFILE_SELECTION_V1'||z.source_full_slate_pregame!==true)return{valid:false,reason:'INVALID_PROFILE_SELECTION_PROVENANCE'};
  if(!Number.isInteger(z.source_games_total)||z.source_games_total<1||!Number.isInteger(z.source_pregame_games)||z.source_pregame_games!==z.source_games_total||!Number.isInteger(z.source_excluded_started_games)||z.source_excluded_started_games!==0)return{valid:false,reason:'INVALID_FULL_SLATE_SOURCE'};
  if(+z.eligible_games!==z.source_games_total||+z.final_games!==z.source_games_total)return{valid:false,reason:'INVALID_ELIGIBLE_GAME_COUNT'};
  if(!validTime(z.source_profile_snapshot_captured_at)||!validTime(z.captured_at)||z.source_profile_snapshot_captured_at!==z.captured_at)return{valid:false,reason:'INVALID_PROFILE_CAPTURE_TIME'};
  if(!validSha(z.snapshot_sha256))return{valid:false,reason:'INVALID_PROFILE_SNAPSHOT_SHA'};
  if(z.row_identity!=='GAMEPK_PLAYER_ID'||z.doubleheader_safe!==true)return{valid:false,reason:'INVALID_ROW_IDENTITY'};
  if(!Array.isArray(z.rows))return{valid:false,reason:'INVALID_ROWS'};
  if(+z.played_profiled_player_games!==z.rows.length||+z.played_profiled_hitters!==z.rows.length)return{valid:false,reason:'INVALID_PLAYED_COUNTS'};
  if(+z.complete_profiled_player_games!==+z.complete_profiled_hitters)return{valid:false,reason:'INVALID_COMPLETE_COUNTS'};
  const seen=new Set();
  for(const r of z.rows){
    if(r?.row_identity!=='GAMEPK_PLAYER_ID'||!Number.isInteger(r?.gamePk)||!Number.isInteger(r?.player_id))return{valid:false,reason:'INVALID_ROW_KEY'};
    const key=`${r.gamePk}:${r.player_id}`;if(seen.has(key))return{valid:false,reason:'DUPLICATE_GAME_PLAYER'};seen.add(key);
    if(!validTime(r.start_time)||Date.parse(z.source_profile_snapshot_captured_at)>=Date.parse(r.start_time))return{valid:false,reason:'INVALID_START_TIME'};
    if(r.context){if(!validTime(r.context.captured_at)||Date.parse(r.context.captured_at)>=Date.parse(r.start_time)||!validSha(r.context.snapshot_sha256))return{valid:false,reason:'INVALID_CONTEXT_PROVENANCE'}}
    const ev=r.modifier_evidence||{},pf=r.pitchfit,bb=r.bbe;
    if(pf!=null){if(ev.pitchfit_cryptographically_verified!==true||!validSha(ev.pitchfit_snapshot_sha256)||!validTime(ev.pitchfit_captured_at)||Date.parse(ev.pitchfit_captured_at)>=Date.parse(r.start_time)||+pf.gamePk!==+r.gamePk||ev.per_game_strictly_pregame!==true)return{valid:false,reason:'INVALID_PITCHFIT_PROVENANCE'}}
    if(bb!=null){if(ev.bbe_cryptographically_verified!==true||!validSha(ev.bbe_snapshot_sha256)||!validTime(ev.bbe_captured_at)||Date.parse(ev.bbe_captured_at)>=Date.parse(r.start_time)||+bb.gamePk!==+r.gamePk||ev.per_game_strictly_pregame!==true)return{valid:false,reason:'INVALID_BBE_PROVENANCE'}}
    if(pf==null&&bb==null&&ev.cryptographically_verified===true)return{valid:false,reason:'FALSE_VERIFIED_MODIFIER_FLAG'};
  }
  return{valid:true,legacy:false,reason:null};
}
export const V38_POSTGAME_ARTIFACT_VALIDITY=Object.freeze({protocol:'V38_POSTGAME_ARTIFACT_VALIDITY_V1',exact_game_required_from:V38_EXACT_GAME_POSTGAME_REQUIRED_FROM,profile_selection_protocol:'V38_POSTGAME_PROFILE_SELECTION_V1',requires_full_slate_pregame:true,row_identity:'GAMEPK_PLAYER_ID',doubleheader_safe:true,research_only:true,scoring_enabled:false,scoring_eligible:false});
