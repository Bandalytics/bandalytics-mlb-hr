import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'incoming';
const outPath=process.argv[3]||'snapshots/v38-ticket-no-lineup-revalidation-summary.json';
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else if(/^v38-ticket-no-lineup-revalidation-\d{4}-\d{2}-\d{2}\.json$/.test(e.name))out.push(p)}return out}
const files=walk(root); if(files.length!==80) throw Error(`expected 80 slate artifacts, found ${files.length}`);
const rows=files.map(f=>JSON.parse(fs.readFileSync(f,'utf8'))).sort((a,b)=>a.date.localeCompare(b.date));
for(const z of rows){if(z.protocol!=='V38_TICKET_NO_LINEUP_REVALIDATION_V1'||z.ranking_contract!=='LINEUP_SLOT_EXCLUDED_FROM_ALL_RANKING_KEYS') throw Error(`bad artifact ${z.date||'unknown'}`)}
if(new Set(rows.map(z=>z.date)).size!==80) throw Error('duplicate dates');
const budgets=[25,33,40,50],policies=['BROAD_ONE_PATH','PRIORITY_25_PCT_TWO_PATH_REST_ONE','PRIORITY_33_PCT_TWO_PATH_REST_ONE','PRIORITY_50_PCT_TWO_PATH_REST_ONE','UNIFORM_TWO_PATH'];
const samples=['FRESH_HOLDOUT_2026_06_01_TO_07_10','DEVELOPMENT_2026_07_24_TO_09_01'];
function aggregate(sub){
  const bands=Object.fromEntries(['SMALL_LE_50','MEDIUM_51_75','LARGE_GE_76'].map(b=>[b,sub.filter(z=>z.slate_band===b).length]));
  const serious_board_rows=sub.reduce((s,z)=>s+z.serious_board_rows,0), serious_board_hr=sub.reduce((s,z)=>s+z.serious_board_hr,0);
  const result={slates:sub.length,slate_band_counts:bands,serious_board_rows,serious_board_hr,serious_board_hr_rate_pct:serious_board_rows?+(100*serious_board_hr/serious_board_rows).toFixed(2):null,budgets:{}};
  for(const pct of budgets){const key=`BUDGET_${pct}_PCT_BOARD`;result.budgets[key]={};for(const pol of policies){const vals=sub.map(z=>z.results[key].policies[pol]);const requested=vals.reduce((s,v)=>s+v.requested_tickets,0),tickets=vals.reduce((s,v)=>s+v.tickets,0),wins=vals.reduce((s,v)=>s+v.winning_tickets,0),outcome=vals.reduce((s,v)=>s+v.outcome_tickets,0),winningSlates=vals.filter(v=>v.any_winning_ticket).length,ticketedHr=vals.reduce((s,v)=>s+v.ticketed_hr,0),boardHr=vals.reduce((s,v)=>s+v.serious_board_hr,0),unique=vals.reduce((s,v)=>s+v.unique_ticketed_hitters,0);result.budgets[key][pol]={requested_tickets:requested,tickets,budget_utilization_pct:requested?+(100*tickets/requested).toFixed(2):null,winning_tickets:wins,ticket_win_rate_pct:outcome?+(100*wins/outcome).toFixed(2):null,winning_slates:winningSlates,winning_slate_rate_pct:sub.length?+(100*winningSlates/sub.length).toFixed(2):null,unique_ticketed_hitter_opportunities:unique,ticketed_hr:ticketedHr,ticketed_hr_capture_pct:boardHr?+(100*ticketedHr/boardHr).toFixed(2):null}}
  }
  return result;
}
const summary={protocol:'V38_TICKET_NO_LINEUP_REVALIDATION_SUMMARY_V1',ranking_contract:'LINEUP_SLOT_EXCLUDED_FROM_ALL_RANKING_KEYS',artifact_count:rows.length,samples:{}};
for(const s of samples){const sub=rows.filter(z=>z.sample===s);if(sub.length!==40)throw Error(`${s} expected 40 slates, found ${sub.length}`);summary.samples[s]=aggregate(sub);summary.samples[s].large_only=aggregate(sub.filter(z=>z.slate_band==='LARGE_GE_76'));}
fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,JSON.stringify(summary,null,2)+'\n');
console.log(`V38_TICKET_NO_LINEUP_SUMMARY_PATH=${outPath}`);console.log(`V38_TICKET_NO_LINEUP_SUMMARY=${JSON.stringify(summary)}`);
