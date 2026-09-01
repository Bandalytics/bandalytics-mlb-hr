export const LENS_REGISTRY = Object.freeze({
  'Sharp Money': Object.freeze({
    state:'PROMOTED',
    direct_safe:true,
    dependencies:['open_odds','current_odds'],
    formula:'delta implied HR probability >= +2.00 percentage points',
    evidence:'71/71 exact across 2026-08-26, 2026-08-27, 2026-08-28; 0 FP; 0 FN'
  }),
  'Steam': Object.freeze({
    state:'RESEARCH',direct_safe:false,
    dependencies:['timestamped_quote_history'],
    concept:'Where the money is moving — odds shortening as bettors pile in.',
    reason:'Historical membership can persist after later reversal/lengthening; final open→current snapshot is insufficient.'
  }),
  'Sweet Spot': Object.freeze({
    state:'RESEARCH',direct_safe:false,
    dependencies:['board_generation_price','legacy_eligibility_state'],
    concept:'Sweet odds window (+200 to +600) — value, not chalk or lotto.',
    reason:'Historical membership is not equivalent to every row in +200..+600; additional eligibility/state is required.'
  }),
  'Double Edge': Object.freeze({
    state:'RESEARCH',direct_safe:false,
    dependencies:['recent_hitter_form','starter_context'],
    concept:'A hot bat running straight into a fading starter.',
    reason:'Cross-layer lens; exact historical membership rule not yet proven.'
  }),
  'Tired Pen': Object.freeze({
    state:'RESEARCH',direct_safe:false,
    dependencies:['bullpen_recent_workload','bullpen_freshness'],
    concept:'A gassed bullpen likely to hand these bats a meatball late.',
    reason:'Environment/state lens; exact legacy thresholds not yet proven.',
    structural_evidence:'Across 8/26–8/28, 275 saved Tired Pen rows form 35 team+starter cohorts; 33/35 cohorts contain the entire priced team universe. The two exceptions are single-row 8/28 anomalies, so the lens is strongly team/environment-scoped rather than hitter-scoped.'
  }),
  'Gassed Pen': Object.freeze({
    state:'RESEARCH',direct_safe:false,
    dependencies:['bullpen_recent_workload','bullpen_freshness','bullpen_hr_damage'],
    reason:'Environment/state lens; do not alias to Tired Pen without exact membership parity.'
  }),
  'Dialed-In Power': Object.freeze({
    state:'RESEARCH',direct_safe:false,
    dependencies:['recent_bbe','perfect_contact_semantics'],
    concept:'Power bats squaring up flush right now — the swing is on time, primed to drive one out.',
    reason:'Recent-contact lens; exact perfect-contact definition/membership not yet reproduced cross-slate.'
  }),
  'Barrel Match': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['hitter_barrel_profile','starter_damage_profile'],reason:'Exact interaction rule not yet proven.'}),
  'Mispriced': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['model_probability','market_price','legacy_eligibility_state'],reason:'Exact model-vs-market edge threshold/state not yet proven.'}),
  'Hidden Edge': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['profile','matchup','market'],reason:'Composite lens; exact legacy rule not yet proven.'}),
  'Sleeper Edge': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['longshot_price','profile','matchup','legacy_tier_state'],concept:'Buried longshots the tier missed — live HR shot the market is sleeping on.',reason:'Composite escape/value lens; exact legacy rule not yet proven.'}),
  'HR or Bust': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['power_shape','contact_floor'],reason:'Exact volatility/shape thresholds not yet proven.'}),
  'High Floor': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['contact_floor','profile'],reason:'Exact thresholds not yet proven.'}),
  'High Volatility': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['power_shape','variance_features'],reason:'Exact thresholds not yet proven.'}),
  'Shape Edge': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['recent_hr_shape','profile_shape'],reason:'Exact thresholds not yet proven.'}),
  'Elite Matchup': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['starter_context','true_pitch_fit','environment'],reason:'Exact convergence rule not yet proven.'}),
  'Soft Spot': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['starter_context','zone_or_pitch_damage'],reason:'Exact ranking/spot definition not yet proven.'}),
  'Gas Can': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['starter_hr9','starter_damage_profile'],reason:'Exact legacy threshold/tag definition not yet proven.'}),
  'Books Sleeping': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['market_price','model_probability','legacy_eligibility_state'],reason:'Exact pricing edge definition not yet proven.'}),
  'Pure Value': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['market_price','model_probability'],reason:'Exact value threshold not yet proven.'}),
  'Odds-Only': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['market_price','qualification_state'],reason:'Exact legacy fallback/eligibility rule not yet proven.'}),
  'Live Fading': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['timestamped_quote_history'],reason:'Live/path-dependent market state.'}),
  'Live Line Holding': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['timestamped_quote_history'],reason:'Live/path-dependent market state.'}),
  'HRY': Object.freeze({state:'RESEARCH',direct_safe:false,dependencies:['previous_game_results'],concept:'HR Yesterday',reason:'Semantics known; exact legacy eligibility/timing treatment still must be verified before tag regeneration.'})
});

export function promotedDirectLenses(){
  return Object.entries(LENS_REGISTRY).filter(([,v])=>v.direct_safe===true&&v.state==='PROMOTED').map(([k])=>k);
}
export function lensState(name){return LENS_REGISTRY[name]||null}
export function assertDirectSafeLens(name){const x=lensState(name);if(!x||!x.direct_safe||x.state!=='PROMOTED')throw new Error('RESEARCH LENS BLOCKED: '+name);return x}
