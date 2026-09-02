export const V38_STACK_GASCAN_POLICY=Object.freeze({
  protocol:'V38_STACK_GASCAN_POLICY_V1',
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false,
  model_scoring_changed:false,
  stack_role:'RESEARCH_SHORTLIST_AND_ESCAPE_CONTEXT_ONLY',
  gascan_role:'SEPARATE_RESEARCH_SHORTLIST_ONLY',
  minimum_independent_families_for_stack_candidate:3,
  required_family:'STARTER_DAMAGE',
  families:Object.freeze(['STARTER_DAMAGE','HITTER_CONVERGENCE','SPECIFIC_BULLPEN_CONTEXT','PARK_WEATHER_CONTEXT','MARKET_CONTEXT']),
  prohibited:Object.freeze(['GENERIC_BULLPEN_WORKLOAD_AS_POSITIVE_SIGNAL','FORCE_STACK_TO_FILL_POOL','STACK_BECAUSE_TWO_HITTERS_HAVE_SHORT_ODDS','COUNT_MULTIPLE_STARTER_METRICS_AS_MULTIPLE_INDEPENDENT_FAMILIES']),
  starter_reference:Object.freeze({low_hr9_caution_lt:1.2,high_hr9_research_ge:1.5,small_ip_caution_lt:17.1}),
  gascan_reference_examples:Object.freeze({hr9_ge:1.5,iso_allowed_ge:0.200,barrel_allowed_ge:10}),
  gascan_thresholds_status:'RESEARCH_CANDIDATE_NOT_PRODUCTION_LOCKED',
  deliberate_approval_required:true
});
const yes=x=>x===true;
export function evaluateStackContext({starter_damage=false,hitter_convergence=false,specific_bullpen_context=false,park_weather_context=false,market_context=false,generic_bullpen_workload=false}={}){
  const families={STARTER_DAMAGE:yes(starter_damage),HITTER_CONVERGENCE:yes(hitter_convergence),SPECIFIC_BULLPEN_CONTEXT:yes(specific_bullpen_context),PARK_WEATHER_CONTEXT:yes(park_weather_context),MARKET_CONTEXT:yes(market_context)};
  const independent_family_count=Object.values(families).filter(Boolean).length;
  const candidate=families.STARTER_DAMAGE&&independent_family_count>=V38_STACK_GASCAN_POLICY.minimum_independent_families_for_stack_candidate;
  return{protocol:V38_STACK_GASCAN_POLICY.protocol,families,independent_family_count,generic_bullpen_workload_observed:yes(generic_bullpen_workload),generic_bullpen_workload_can_count:false,stack_candidate:candidate,research_only:true,scoring_enabled:false,scoring_eligible:false};
}
export function evaluateGasCanStarter({hr9,iso_allowed,barrel_allowed,ip}={}){
  const n=x=>Number.isFinite(Number(x))?Number(x):null,h=n(hr9),iso=n(iso_allowed),barrel=n(barrel_allowed),innings=n(ip),small_ip=innings!=null&&innings<V38_STACK_GASCAN_POLICY.starter_reference.small_ip_caution_lt;
  const flags={hr9:h!=null&&h>=V38_STACK_GASCAN_POLICY.gascan_reference_examples.hr9_ge,iso_allowed:iso!=null&&iso>=V38_STACK_GASCAN_POLICY.gascan_reference_examples.iso_allowed_ge,barrel_allowed:barrel!=null&&barrel>=V38_STACK_GASCAN_POLICY.gascan_reference_examples.barrel_allowed_ge};
  const flag_count=Object.values(flags).filter(Boolean).length;
  return{protocol:V38_STACK_GASCAN_POLICY.protocol,flags,flag_count,small_ip,gascan_research_shortlist:!small_ip&&flag_count>=2,thresholds_status:V38_STACK_GASCAN_POLICY.gascan_thresholds_status,research_only:true,scoring_enabled:false,scoring_eligible:false};
}
