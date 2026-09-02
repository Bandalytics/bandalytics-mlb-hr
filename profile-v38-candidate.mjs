// BANDALYTICS v38 PROFILE CANDIDATE — RESEARCH ONLY.
// This is an explicit migration candidate, NOT v37 parity and NOT scoring eligible.
// PullAir and Blast semantics are intentionally named/proven separately so they
// cannot silently overwrite frozen v37 fields.

export const V38_PROFILE_CANDIDATE=Object.freeze({
  model:'v38',
  status:'RESEARCH_CANDIDATE',
  scoring_eligible:false,
  fields:Object.freeze({
    ev:Object.freeze({source:'Baseball Savant',semantic:'exit_velocity_avg'}),
    hh:Object.freeze({source:'Baseball Savant',semantic:'hard_hit_percent'}),
    barrel:Object.freeze({source:'Baseball Savant',semantic:'barrel_batted_rate'}),
    iso:Object.freeze({source:'Baseball Savant',semantic:'isolated_power'}),
    sweet:Object.freeze({source:'Baseball Savant',semantic:'sweet_spot_percent'}),
    pull:Object.freeze({source:'Baseball Savant',semantic:'pull_percent'}),
    pullair:Object.freeze({source:'BANDALYTICS retained native-profile service / Baseball Savant',semantic:'pulled batted balls among all batted balls; AIR = fly balls + line drives + popups'}),
    blast:Object.freeze({source:'Baseball Savant bat tracking',semantic:'blasts_swing',definition:'Blast rate per competitive swing; blast = squared-up contact combined with sufficiently high bat speed'})
  }),
  mandatory_before_cutover:Object.freeze([
    'point_in_time_historical_backtest',
    'candidate_regression_pass',
    'documented_threshold_review',
    'deliberate_cutover_approval'
  ])
});

const num=v=>v==null||v===''?null:(Number.isFinite(+v)?+v:null);
export function normalizeV38Candidate({bulk={},pullair={}}={}){
  return Object.freeze({
    player_id:num(bulk.player_id??pullair.player_id),
    ev:num(bulk.ev),
    hh:num(bulk.hard_hit??bulk.hh),
    barrel:num(bulk.barrel),
    iso:num(bulk.iso),
    sweet:num(bulk.sweet_spot??bulk.sweet),
    pull:num(bulk.pull),
    pullair:num(pullair.pull_air??pullair.pullair),
    blast:num(bulk.blast_swing??bulk.blasts_swing),
    blast_contact_reference:num(bulk.blast_contact??bulk.blasts_contact),
    candidate_model:'v38',
    candidate_status:'RESEARCH_CANDIDATE',
    v37_parity_verified:false,
    scoring_eligible:false
  });
}

export function v38CandidateReadiness({point_in_time_backtest=false,candidate_regression_pass=false,threshold_review=false,deliberate_cutover_approved=false}={}){
  const checks=Object.freeze({point_in_time_backtest:point_in_time_backtest===true,candidate_regression_pass:candidate_regression_pass===true,threshold_review:threshold_review===true,deliberate_cutover_approved:deliberate_cutover_approved===true});
  return Object.freeze({model:'v38',mode:'VERSIONED_MIGRATION',...checks,scoring_eligible:Object.values(checks).every(Boolean)});
}
