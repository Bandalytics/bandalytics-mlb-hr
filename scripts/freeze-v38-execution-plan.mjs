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
const key=s=>norm(s).toLowerCase();
const names=new Set();
let finalPool=0;
for(const r of rows){
  const player=norm(r?.player);if(!player)throw Error('every row requires player');
  const k=key(player);if(names.has(k))throw Error(`duplicate player ${player}`);names.add(k);
  const state=String(r?.exposure_state||'UNCLASSIFIED').trim().toUpperCase().replace(/[ -]+/g,'_');
  if(!allowedStates.has(state))throw Error(`bad exposure_state for ${player}`);
  if(r?.final_cut===true)finalPool++;
}
const appearances=new Map([...names].map(k=>[k,0]));
for(const [i,t] of tickets.entries()){
  if(!Array.isArray(t)||t.length<2)throw Error(`ticket ${i+1} must contain at least 2 players`);
  const seen=new Set();
  for(const p0 of t){
    const p=norm(p0),k=key(p);if(!names.has(k))throw Error(`ticket ${i+1} references unknown player ${p}`);
    if(seen.has(k))throw Error(`ticket ${i+1} duplicates player ${p}`);seen.add(k);
    appearances.set(k,(appearances.get(k)||0)+1);
  }
}
let totalPaths=0,ticketed=0,zeroPath=0;
const frozenRows=[];
for(const r of rows){
  const player=norm(r.player),k=key(player);
  const state=String(r?.exposure_state||'UNCLASSIFIED').trim().toUpperCase().replace(/[ -]+/g,'_');
  const declaredRaw=r?.ticket_paths;
  const declared=declaredRaw==null?null:Math.max(0,Math.trunc(Number(declaredRaw)||0));
  const exact=appearances.get(k)||0;
  if(declared!=null&&declared!==exact)throw Error(`ticket_paths mismatch for ${player}: declared ${declared}, exact ${exact}`);
  const paths=exact;
  const isFinal=r?.final_cut===true;
  if(paths>0){ticketed++;totalPaths+=paths}
  if(isFinal&&paths===0&&state!=='INTENTIONAL_ZERO')zeroPath++;
  if(state==='INTENTIONAL_ZERO'&&paths>0)throw Error(`INTENTIONAL_ZERO cannot have ticket paths: ${player}`);
  if(paths>0&&r?.opportunity_verified===true&&r?.observed_starting_lineup===false)throw Error(`planned exposure assigned to verified nonstarter: ${player}`);
  if(paths>0&&r?.lineup_type&&/BENCH|NOT_STARTING|OUT/i.test(String(r.lineup_type)))throw Error(`planned exposure assigned to nonstarting lineup status: ${player}`);
  frozenRows.push({...r,exposure_state:state,ticket_paths:paths,ticket_ids:tickets.map((t,i)=>t.some(x=>key(x)===k)?`T${i+1}`:null).filter(Boolean)});
}
const usage=frozenRows.filter(r=>r.final_cut===true).map(r=>r.ticket_paths).sort((a,b)=>b-a);
const top3=usage.slice(0,3).reduce((a,b)=>a+b,0);
const maxPaths=usage[0]||0;
const capturedAt=new Date().toISOString();
const body={
  protocol:'BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V1',
  date,captured_at:capturedAt,point_in_time:true,prospective:true,research_only:true,scoring_enabled:false,production_rule_changed:false,
  source:draft?.source||'CHATGPT_BANDALYTICS_WORKFLOW',notes:draft?.notes||null,rows:frozenRows,tickets,
  summary:{
    final_pool_n:finalPool,ticketed_n:ticketed,zero_path_n:zeroPath,pool_coverage_pct:finalPool?+(100*ticketed/finalPool).toFixed(2):null,
    total_ticket_paths:totalPaths,ticket_count:tickets.length,
    top3_leg_concentration_pct:totalPaths?+(100*top3/totalPaths).toFixed(2):null,
    max_single_hitter_leg_share_pct:totalPaths?+(100*maxPaths/totalPaths).toFixed(2):null,
    max_single_hitter_portfolio_dependency_pct:tickets.length?+(100*maxPaths/tickets.length).toFixed(2):null
  }
};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const out={...body,sha256};
await fs.mkdir('prospective-execution-plans',{recursive:true});
const outfile=path.join('prospective-execution-plans',`${date}-${capturedAt.replace(/[:.]/g,'-')}.json`);
await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n','utf8');
console.log('V38_EXECUTION_PLAN_FROZEN='+JSON.stringify({outfile,date,captured_at:capturedAt,summary:body.summary,sha256}));
