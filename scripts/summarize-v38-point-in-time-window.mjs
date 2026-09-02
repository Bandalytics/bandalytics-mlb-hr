import fs from'node:fs';
const files=process.argv.slice(2);if(!files.length)throw Error('Provide replay JSON files');
const RULES=['4of6','4of6_barrel','4of6_iso','4of6_barrel_or_iso','4of6_barrel_and_iso','4of6_3selective','5of6','6of6'];
const docs=files.map(f=>JSON.parse(fs.readFileSync(f,'utf8')));
for(const d of docs){if(d.protocol!=='V38_POINT_IN_TIME_REPLAY_V1'||d.point_in_time!==true||d.research_only!==true||d.scoring_enabled!==false||d.scoring_eligible!==false)throw Error(`Invalid replay contract for ${d.date||'unknown'}`);if(d.incomplete_profiles!==0)throw Error(`Incomplete profiles for ${d.date}`)}
const rows=docs.flatMap(d=>d.rows.map(r=>({...r,date:d.date}))),totalHr=rows.filter(r=>r.homer).length,base=rows.length?totalHr/rows.length:0;
function metrics(set){const hr=set.filter(r=>r.homer).length,rate=set.length?hr/set.length:0;return{pool:set.length,hr,hr_rate:+(rate*100).toFixed(2),hr_capture:totalHr?+(hr/totalHr*100).toFixed(1):null,lift_vs_base:base?+(rate/base).toFixed(2):null}}
const rules={};for(const k of RULES)rules[k]=metrics(rows.filter(r=>r.candidate_rules?.[k]));
const days=docs.map(d=>{const dayRows=d.rows,total=d.rows.filter(r=>r.homer).length,b=dayRows.length?total/dayRows.length:0,out={date:d.date,games:d.games,lineup_hitters:d.lineup_hitters,profile_coverage:d.profile_coverage,hr_hitters:total,rules:{}};for(const k of RULES){const s=dayRows.filter(r=>r.candidate_rules?.[k]),h=s.filter(r=>r.homer).length,rate=s.length?h/s.length:0;out.rules[k]={pool:s.length,hr:h,hr_rate:+(rate*100).toFixed(2),hr_capture:total?+(h/total*100).toFixed(1):null,lift_vs_base:b?+(rate/b).toFixed(2):null}}return out});
const out={protocol:'V38_PIT_WINDOW_SUMMARY_V1',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,dates:docs.map(d=>d.date),slates:docs.length,lineup_profiles:rows.length,hr_hitters:totalHr,base_hr_rate:+(base*100).toFixed(2),rules,days};console.log('V38_PIT_WINDOW='+JSON.stringify(out));
