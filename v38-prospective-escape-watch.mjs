export const V38_PROSPECTIVE_ESCAPE_WATCH=Object.freeze({
  protocol:'V38_PROSPECTIVE_ESCAPE_WATCH_V1',
  preregistered_at:'2026-09-03',
  first_eligible_slate:'2026-09-04',
  selected_control:'4of6_iso+pitchfit_top_quartile',
  purpose:'MEASURE_CAPTURE_COST_OF_PITCHFIT_GATING_WITHOUT_CHANGING_THE_EXISTING_CORE',
  categories:Object.freeze(['CORE_CONTROL','QUALITY_PITCHFIT_BASE_TRUE','QUALITY_PITCHFIT_UNAVAILABLE']),
  required_future_final_slates:3,
  backfill_allowed:false,
  historical_promotion_evidence_allowed:false,
  sep2_allowed:false,
  sep3_allowed:false,
  threshold_changes_allowed:false,
  scoring_changes_allowed:false,
  production_promotion_allowed:false,
  pool_target_forced:false,
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false,
  deliberate_review_required:true
});
const top=b=>['TOP_QUARTILE','TOP_DECILE'].includes(String(b||''));
export function prospectiveEscapeWatchCategory(row={}){
  const quality=row.candidate_rules?.['4of6_iso']===true;
  if(!quality)return null;
  const band=String(row.pitchfit_band||'INELIGIBLE');
  if(top(band))return'CORE_CONTROL';
  if(band==='BASE_TRUE')return'QUALITY_PITCHFIT_BASE_TRUE';
  return'QUALITY_PITCHFIT_UNAVAILABLE';
}
export function prospectiveEscapeWatchEligibleDate(date){return /^2026-\d\d-\d\d$/.test(String(date||''))&&String(date)>=V38_PROSPECTIVE_ESCAPE_WATCH.first_eligible_slate;}
