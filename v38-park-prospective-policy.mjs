export const V38_PARK_PROSPECTIVE_POLICY=Object.freeze({
  protocol:'V38_PARK_PROSPECTIVE_VALIDATION_V1',
  preregistered_at:'2026-09-03',
  first_eligible_slate:'2026-09-03',
  purpose:'Measure whether exact handedness-specific pregame Statcast HR park factors add stable prospective support without changing production scoring.',
  bands:Object.freeze({HITTER_FRIENDLY_MIN:105,NEUTRAL_MIN:95}),
  selected_profile:'QUALITY_4OF6_PLUS_ISO',
  requires_exact_effective_bat_side:true,
  requires_latest_park_snapshot_strictly_before_first_pitch:true,
  historical_backfill_allowed:false,
  sep2_backfill_allowed:false,
  role:'PROSPECTIVE_SUPPORT_DIAGNOSTIC_ONLY',
  hard_gate:false,
  standalone_hr_boost:false,
  scoring_enabled:false,
  scoring_eligible:false,
  auto_promote:false,
  threshold_review:false,
  deliberate_approval:false
});
export function parkBand(hrFactor){if(hrFactor==null||String(hrFactor).trim()==='')return'UNAVAILABLE';const x=Number(hrFactor);if(!Number.isFinite(x))return'UNAVAILABLE';if(x>=V38_PARK_PROSPECTIVE_POLICY.bands.HITTER_FRIENDLY_MIN)return'HITTER_FRIENDLY';if(x>=V38_PARK_PROSPECTIVE_POLICY.bands.NEUTRAL_MIN)return'NEUTRAL';return'SUPPRESSIVE'}
export function eligibleParkProspectiveDate(date){return /^2026-\d\d-\d\d$/.test(String(date||''))&&String(date)>=V38_PARK_PROSPECTIVE_POLICY.first_eligible_slate}
