export const V38_WORKFLOW_REVALIDATION=Object.freeze({
  protocol:'V38_WORKFLOW_REVALIDATION_V1',
  research_only:true,
  scoring_enabled:false,
  scoring_eligible:false,
  rule_changes_from_revalidation:false,
  protected_4of6_evaluated:false,
  protected_4of6_reason:'HISTORICAL_FROZEN_HR_PRICE_PROVENANCE_REQUIRED',
  roi_evaluated:false,
  roi_reason:'HISTORICAL_FROZEN_HR_PRICE_PROVENANCE_REQUIRED',
  purpose:'TEST_WHERE_QUALIFIED_HR_SIGNAL_IS_LOST_WITHOUT_PROMOTING_A_RULE'
});

const TOP=new Set(['TOP_QUARTILE','TOP_DECILE']);
const FAV_STARTER=new Set(['MID_1_2_TO_1_5','HIGH_GE_1_5']);

export function classifyWorkflowRevalidationRow(row={}){
  const gateCount=Number(row.gate_count);
  const standardQualified=Number.isFinite(gateCount)&&gateCount>=5;
  const pitchfitPositive=TOP.has(String(row.pitchfit_band||''));
  const bbePositive=TOP.has(String(row.bbe_hrshape_band||''));
  const starterBand=String(row.starter_hr9_band||'UNAVAILABLE');
  const starterFavorable=FAV_STARTER.has(starterBand);
  const starterSuppressive=starterBand==='LOW_LT_1_2';

  // Stress-test proxy for the manual serial compression failure seen on Sept. 23.
  // This is NOT the locked shortlist policy and cannot promote a production rule.
  const serialCompressionProxy=standardQualified&&pitchfitPositive&&bbePositive&&starterFavorable;

  // Anti-overcompression hypothesis: retain every standard 5/6+ qualifier unless
  // a concrete suppressive starter signal is present AND neither independent
  // nightly support lane is positive. Missing nightly evidence never counts as a cut.
  const concreteNegative=standardQualified&&starterSuppressive&&!pitchfitPositive&&!bbePositive;
  const antiOvercompression=standardQualified&&!concreteNegative;

  return{
    standard_qualified:standardQualified,
    pitchfit_positive:standardQualified&&pitchfitPositive,
    bbe_positive:standardQualified&&bbePositive,
    both_nightly_positive:standardQualified&&pitchfitPositive&&bbePositive,
    favorable_starter:standardQualified&&starterFavorable,
    serial_compression_proxy:serialCompressionProxy,
    anti_overcompression:antiOvercompression,
    concrete_negative:concreteNegative,
    starter_suppressive:standardQualified&&starterSuppressive
  };
}

function cohort(rows,predicate){
  const selected=rows.filter(predicate),outcomeRows=selected.filter(r=>typeof r.homer==='boolean'),hr=outcomeRows.filter(r=>r.homer===true).length;
  return{rows:selected.length,outcome_rows:outcomeRows.length,hr,hr_rate:outcomeRows.length?+(100*hr/outcomeRows.length).toFixed(2):null};
}

export function evaluateWorkflowRevalidation(rows=[]){
  const enriched=rows.map(r=>({...r,revalidation:classifyWorkflowRevalidationRow(r)}));
  const complete=cohort(enriched,()=>true);
  const qualified=cohort(enriched,r=>r.revalidation.standard_qualified);
  const qualifiedHr=qualified.hr||0;
  const defs={
    qualified_5plus:r=>r.revalidation.standard_qualified,
    pitchfit_positive:r=>r.revalidation.pitchfit_positive,
    recent_bbe_positive:r=>r.revalidation.bbe_positive,
    both_nightly_positive:r=>r.revalidation.both_nightly_positive,
    favorable_starter:r=>r.revalidation.favorable_starter,
    serial_compression_proxy:r=>r.revalidation.serial_compression_proxy,
    anti_overcompression:r=>r.revalidation.anti_overcompression,
    concrete_negative:r=>r.revalidation.concrete_negative,
    qualified_cut_by_serial:r=>r.revalidation.standard_qualified&&!r.revalidation.serial_compression_proxy,
    qualified_removed_by_anti:r=>r.revalidation.standard_qualified&&!r.revalidation.anti_overcompression
  };
  const cohorts={};
  for(const [name,pred] of Object.entries(defs)){
    const x=cohort(enriched,pred);
    cohorts[name]={...x,qualified_hr_capture_pct:qualifiedHr?+(100*x.hr/qualifiedHr).toFixed(2):null};
  }
  return{population:complete,qualified_hr:qualifiedHr,cohorts,rows:enriched};
}
