export const V38_NIGHTLY_LONGSHOT_CONTEXT_V1=Object.freeze({
  protocol:'V38_NIGHTLY_LONGSHOT_CONTEXT_V1',
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false,
  model_scoring_changed:false,
  profile_quality_rule:'4of6_iso',
  primary_nightly_enhancer:'pitchfit_top_quartile',
  secondary_modifier:'recent_bbe_hrshape_top_quartile',
  hard_double_requirement:false,
  evidence_window:Object.freeze({start:'2026-08-26',end:'2026-09-01',slates:7}),
  historical_market_scope:'NOT_ODDS_VERIFIED',
  note:'Historical convergence validates profile plus baseball context, not actual +700 market pricing. +700 market validation remains prospective.',
  aggregate:Object.freeze({
    base_profiles:1680,base_hr:171,base_hr_rate:10.18,
    iso_pitchfit:Object.freeze({qualified:226,hr:49,hr_rate:21.68,hr_capture:28.65,lift_vs_base:2.13,positive_slates:7}),
    iso_bbe:Object.freeze({qualified:148,hr:23,hr_rate:15.54,hr_capture:13.45,lift_vs_base:1.53}),
    iso_pitchfit_bbe:Object.freeze({qualified:79,hr:15,hr_rate:18.99,hr_capture:8.77,lift_vs_base:1.87})
  }),
  production_rule_unchanged:true,
  deliberate_approval_required:true
});

export function nightlyLongshotContextTier({quality_tier,pitchfit_band,bbe_band}={}){
  if(!['QUALITY_4OF6_PLUS_ISO','PROTECTED_5OF6_PLUS'].includes(quality_tier)) return 'BASE_PROFILE_ONLY';
  const pf=['TOP_QUARTILE','TOP_DECILE'].includes(pitchfit_band);
  const bbe=['TOP_QUARTILE','TOP_DECILE'].includes(bbe_band?.hrshape_band);
  if(pf&&bbe) return 'PRIMARY_PLUS_BBE_SUPPORT';
  if(pf) return 'PRIMARY_PITCHFIT_UPGRADE';
  if(bbe) return 'BBE_SUPPORT_ONLY';
  return 'QUALITY_PROFILE_NO_NIGHTLY_UPGRADE';
}
