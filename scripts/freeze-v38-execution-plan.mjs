import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const [inputFile]=process.argv.slice(2);
if(!inputFile)throw Error('usage: node scripts/freeze-v38-execution-plan.mjs <execution-plan-draft.json>');
const draft=JSON.parse(await fs.readFile(inputFile,'utf8'));
const rows=Array.isArray(draft?.rows)?draft.rows:[];
const tickets=Array.isArray(draft?.tickets)?draft.tickets:[];
const date=String(draft?.date||'');
if(!/^2026-\d\d-\d\d$/.test(date))throw Error('valid 2026 date required');
if(!rows.length)throw Error('rows required');
const allowedStates=new Set(['PRIORITY_PLUS','PRIORITY','ONE_PATH','INTENTIONAL_ZERO','UNCLASSIFIED']);
const norm=s=>String(s||'').trim();
const names=new Set();
let totalPaths=0,finalPool=0,ticketed=0,zeroPath=0;
for(const r of rows){
  const player=norm(r?.player);if(!player)throw Error('every row requires player');
  const k=player.toLowerCase();if(names.has(k))throw Error(`duplicate player ${player}`);names.add(k);
  const state=String(r?.exposure_state||'UNCLASSIFIED').trim().toUpperCase().replace(/[ -]+/g,'_');
  if(!allowedStates.has(state))throw Error(`bad exposure_state for ${player}`);
  const paths=Math.max(0,Math.trunc(Number(r?.ticket_paths??0)||0));
  const isFinal=r?.final_cut===true;
  if(isFinal)finalPool++;
  if(paths>0){ticketed++;totalPaths+=paths}
  if(isFinal&&paths===0&&state!=='INTENTIONAL_ZERO')zeroPath++;
  if(state==='INTENTIONAL_ZERO'&&paths>0)throw Error(`INTENTIONAL_ZERO cannot have ticket paths: ${player}`);
  if(paths>0&&r?.opportunity_verified===true&&r?.observed_starting_lineup===false)throw Error(`planned exposure assigned to verified nonstarter: ${player}`);
  if(paths>0&&r?.lineup_type&&/BENCH|NOT_STARTING|OUT/i.test(String(r.lineup_type)))throw Error(`planned exposure assigned to nonstarting lineup status: ${player}`);
}
for(const [i,t] of tickets.entries()){
  if(!Array.isArray(t)||t.length<2)throw Error(`ticket ${i+1} must contain at least 2 players`);
  for(const p of t)if(!names.has(norm(p).toLowerCase()))throw Error(`ticket ${i+1} references unknown player ${p}`);
}
const capturedAt=new Date().toISOString();
const body={
  protocol:'BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V1',
  date,captured_at:capturedAt,point_in_time:true,prospective:true,research_only:true,scoring_enabled:false,production_rule_changed:false,
  source:draft?.source||'CHATGPT_BANDALYTICS_WORKFLOW',
  notes:draft?.notes||null,
  rows:rows.map(r=>({...r,exposure_state:String(r?.exposure_state||'UNCLASSIFIED').trim().toUpperCase().replace(/[ -]+/g,'_'),ticket_paths:Math.max(0,Math.trunc(Number(r?.ticket_paths??0)||0))})),
  tickets,
  summary:{final_pool_n:finalPool,ticketed_n:ticketed,zero_path_n:zeroPath,pool_coverage_pct:finalPool?+(100*ticketed/finalPool).toFixed(2):null,total_ticket_paths:totalPaths,ticket_count:tickets.length}
};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const out={...body,sha256};
await fs.mkdir('prospective-execution-plans',{recursive:true});
const outfile=path.join('prospective-execution-plans',`${date}-${capturedAt.replace(/[:.]/g,'-')}.json`);
await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n','utf8');
console.log('V38_EXECUTION_PLAN_FROZEN='+JSON.stringify({outfile,date,captured_at:capturedAt,summary:body.summary,sha256}));
