import fs from 'node:fs';
import crypto from 'node:crypto';

const [boardPath,outPathArg]=process.argv.slice(2);
if(!boardPath) throw Error('Usage: node scripts/summarize-v38-postseason-research.mjs <daily-board.json> [output.json]');
const board=JSON.parse(fs.readFileSync(boardPath,'utf8'));
if(board.protocol!=='V38_DAILY_RESEARCH_BOARD_V2'||board.point_in_time!==true) throw Error('invalid daily research board');
if(!/^2026-/.test(String(board.date||''))) throw Error('postseason research harness accepts 2026 sample only');
const rows=Array.isArray(board.rows)?board.rows:[];
const standard=rows.filter(r=>Number(r.profile_gate_count)>=5);
const protected4=rows.filter(r=>Number(r.profile_gate_count)===4&&r.longshot_700_rule?.eligible===true);
const starterCounts={};
const pitchfitCounts={};
const bbeCounts={};
for(const r of rows){
  const s=String(r.starter_hr9_band||'UNAVAILABLE'); starterCounts[s]=(starterCounts[s]||0)+1;
  const p=String(r.pitchfit_band||'INELIGIBLE'); pitchfitCounts[p]=(pitchfitCounts[p]||0)+1;
  const b=String(typeof r.bbe_band==='string'?r.bbe_band:(r.bbe_band?.hrshape_band||r.bbe?.hrshape_band||'INELIGIBLE')); bbeCounts[b]=(bbeCounts[b]||0)+1;
}
const body={protocol:'V38_POSTSEASON_RESEARCH_SUMMARY_V1',sample_label:'POSTSEASON_2026_SEPARATE_RESEARCH_SAMPLE',date:board.date,research_only:true,regular_season_forward_gate_credit:0,can_update_regular_season_canary_ledger:false,can_enable_normal_volume:false,can_prove_profitability:false,can_mutate_frozen_2026_contract:false,outcome_input:false,rows:rows.length,standard_5of6_plus_rows:standard.length,protected_4of6_shadow_rows:protected4.length,starter_hr9_band_counts:starterCounts,pitchfit_band_counts:pitchfitCounts,bbe_band_counts:bbeCounts,notes:['Descriptive postseason stress-test only.','No ticket ROI, outcome-mining, architecture promotion, or regular-season forward-gate credit is permitted.']};
const output={...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
const outPath=outPathArg||`snapshots/v38-postseason-research-${board.date}.json`;
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log('V38_POSTSEASON_RESEARCH_SUMMARY='+JSON.stringify({date:output.date,rows:output.rows,standard_5of6_plus_rows:output.standard_5of6_plus_rows,protected_4of6_shadow_rows:output.protected_4of6_shadow_rows}));
