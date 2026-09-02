// BANDALYTICS profile cutover gate.
// This module is intentionally not imported by production scoring. It formalizes
// the conditions that must be satisfied before a future native profile can write
// to a scoring model.

export const LEGACY_PROFILE_MODEL='v37';
export const LEGACY_PROFILE_REQUIRED=Object.freeze(['ev','hh','barrel','iso','pullair','sweet','blast']);

const yes=v=>v===true;

export function evaluateProfileCutover(input={}){
  const requested=String(input.requested_model||LEGACY_PROFILE_MODEL);
  const exact=Object.freeze({
    ev:yes(input.exact_ev),
    hh:yes(input.exact_hh),
    barrel:yes(input.exact_barrel),
    iso:yes(input.exact_iso),
    pullair:yes(input.exact_pullair),
    sweet:yes(input.exact_sweet),
    blast:yes(input.exact_blast)
  });

  if(requested===LEGACY_PROFILE_MODEL){
    const missing=LEGACY_PROFILE_REQUIRED.filter(k=>!exact[k]);
    const regression=yes(input.legacy_regression_pass);
    const eligible=missing.length===0&&regression;
    return Object.freeze({
      requested_model:requested,
      mode:'EXACT_LEGACY_PARITY',
      scoring_eligible:eligible,
      missing_exact_fields:missing,
      regression_required:true,
      regression_pass:regression,
      reason:eligible
        ?'Exact v37 profile field parity and legacy regression are proven.'
        :'v37 native scoring remains blocked until every legacy profile field is exact and legacy regression passes.'
    });
  }

  // A replacement metric definition is never allowed to masquerade as v37.
  // It requires an explicit new model version, documented definitions, historical
  // validation, and a deliberate approval flag before it can even become a
  // cutover candidate.
  const versioned=/^v\d+$/.test(requested)&&requested!==LEGACY_PROFILE_MODEL;
  const definitions=yes(input.versioned_metric_definitions);
  const backtest=yes(input.historical_backtest_pass);
  const regression=yes(input.candidate_regression_pass);
  const approved=yes(input.deliberate_cutover_approved);
  const eligible=versioned&&definitions&&backtest&&regression&&approved;
  return Object.freeze({
    requested_model:requested,
    mode:'VERSIONED_MIGRATION',
    scoring_eligible:eligible,
    versioned_model_required:true,
    versioned_metric_definitions:definitions,
    historical_backtest_pass:backtest,
    candidate_regression_pass:regression,
    deliberate_cutover_approved:approved,
    reason:eligible
      ?'Versioned migration satisfies the explicit cutover contract.'
      :'Replacement PullAir/Blast semantics cannot score until a new model version, definitions, historical validation, regression, and deliberate approval all exist.'
  });
}

export function currentV37ProfileGate(){
  return evaluateProfileCutover({
    requested_model:'v37',
    exact_ev:true,
    exact_hh:true,
    exact_barrel:true,
    exact_iso:true,
    exact_sweet:true,
    exact_pullair:false,
    exact_blast:false,
    legacy_regression_pass:false
  });
}
