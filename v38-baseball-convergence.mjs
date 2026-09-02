export const V38_BASEBALL_CONVERGENCE_RULES={
  '5of6+pitchfit_top_quartile':r=>r.candidate_rules?.['5of6']===true&&['TOP_QUARTILE','TOP_DECILE'].includes(r.pitchfit_band),
  '4of6_barrel_and_iso+pitchfit_top_quartile':r=>r.candidate_rules?.['4of6_barrel_and_iso']===true&&['TOP_QUARTILE','TOP_DECILE'].includes(r.pitchfit_band),
  '5of6+bbe_hrshape_top_quartile':r=>r.candidate_rules?.['5of6']===true&&['TOP_QUARTILE','TOP_DECILE'].includes(r.bbe_band?.hrshape_band),
  '5of6+pitchfit_top_quartile+bbe_hrshape_top_quartile':r=>r.candidate_rules?.['5of6']===true&&['TOP_QUARTILE','TOP_DECILE'].includes(r.pitchfit_band)&&['TOP_QUARTILE','TOP_DECILE'].includes(r.bbe_band?.hrshape_band)
};
export function evaluateBaseballConvergence(rows=[]){const baseHr=rows.filter(r=>r.homer).length,baseRate=rows.length?baseHr/rows.length:0,totalNonHr=rows.length-baseHr;return Object.entries(V38_BASEBALL_CONVERGENCE_RULES).map(([rule,fn])=>{const q=rows.filter(fn),hr=q.filter(r=>r.homer).length,nonHr=q.length-hr;return{rule,qualified:q.length,qualified_share:rows.length?+(100*q.length/rows.length).toFixed(2):null,hr,hr_rate:q.length?+(100*hr/q.length).toFixed(2):null,hr_capture:baseHr?+(100*hr/baseHr).toFixed(2):null,non_hr_qualified:nonHr,non_hr_qualification_rate:totalNonHr?+(100*nonHr/totalNonHr).toFixed(2):null,lift_vs_base:q.length&&baseRate?+((hr/q.length)/baseRate).toFixed(3):null};});}
