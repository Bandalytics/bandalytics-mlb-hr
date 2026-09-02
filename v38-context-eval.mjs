export const V38_CONTEXT_CONVERGENCE_RULES={
  '4of6+steam':r=>r.candidate_rules?.['4of6']===true&&r.context?.market?.signal==='STEAM',
  '5of6+steam':r=>r.candidate_rules?.['5of6']===true&&r.context?.market?.signal==='STEAM',
  '4of6+preferred_odds':r=>r.candidate_rules?.['4of6']===true&&preferredOdds(r.context?.market?.best_odds),
  '5of6+preferred_odds':r=>r.candidate_rules?.['5of6']===true&&preferredOdds(r.context?.market?.best_odds),
  '4of6+confirmed_lineup':r=>r.candidate_rules?.['4of6']===true&&r.context?.confirmed_lineup===true,
  '5of6+confirmed_lineup':r=>r.candidate_rules?.['5of6']===true&&r.context?.confirmed_lineup===true,
  '4of6_barrel_and_iso+preferred_odds':r=>r.candidate_rules?.['4of6_barrel_and_iso']===true&&preferredOdds(r.context?.market?.best_odds)
};
export function preferredOdds(v){const n=Number(v);return Number.isFinite(n)&&n>=500&&n<=1500;}
export function evaluateContextConvergence(rows=[]){const baseHr=rows.filter(r=>r.homer).length,baseRate=rows.length?baseHr/rows.length:0,totalNonHr=rows.length-baseHr;return Object.entries(V38_CONTEXT_CONVERGENCE_RULES).map(([rule,fn])=>{const q=rows.filter(fn),hr=q.filter(r=>r.homer).length,nonHr=q.length-hr;return{rule,qualified:q.length,qualified_share:rows.length?+(100*q.length/rows.length).toFixed(2):null,hr,hr_rate:q.length?+(100*hr/q.length).toFixed(2):null,hr_capture:baseHr?+(100*hr/baseHr).toFixed(2):null,non_hr_qualified:nonHr,non_hr_qualification_rate:totalNonHr?+(100*nonHr/totalNonHr).toFixed(2):null,lift_vs_base:q.length&&baseRate?+((hr/q.length)/baseRate).toFixed(3):null};});}
