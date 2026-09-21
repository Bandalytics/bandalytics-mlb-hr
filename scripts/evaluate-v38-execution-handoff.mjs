import fs from 'node:fs/promises';
import path from 'node:path';
import {evaluateExecutionHandoff} from '../v38-execution-handoff-core.mjs';

const [evalFile,planFile]=process.argv.slice(2);
if(!evalFile||!planFile)throw Error('usage: node scripts/evaluate-v38-execution-handoff.mjs <evaluated.json> <execution-plan.json>');
const evalJson=JSON.parse(await fs.readFile(evalFile,'utf8'));
const planJson=JSON.parse(await fs.readFile(planFile,'utf8'));
if(!Array.isArray(evalJson?.rows))throw Error('evaluated rows missing');
const rawPlan=Array.isArray(planJson)?planJson:(planJson?.rows||planJson?.players||[]);
if(!Array.isArray(rawPlan))throw Error('execution plan rows missing');

function norm(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim()}
const rowByName=new Map();
for(const r of evalJson.rows){
  const k=norm(r.player); if(!k)continue;
  if(!rowByName.has(k))rowByName.set(k,[]);
  rowByName.get(k).push(r);
}
const resolvedPlan=[];const unresolved=[];
for(const p of rawPlan){
  if(Number.isInteger(Number(p?.player_id))&&Number.isInteger(Number(p?.gamePk??p?.game_pk))){resolvedPlan.push(p);continue}
  const hits=rowByName.get(norm(p?.player))||[];
  if(hits.length===1){resolvedPlan.push({...p,player_id:hits[0].player_id,gamePk:hits[0].gamePk});continue}
  unresolved.push({...p,resolution_hits:hits.map(x=>({player_id:x.player_id,gamePk:x.gamePk,player:x.player}))});
}
const report=evaluateExecutionHandoff(evalJson.rows,resolvedPlan);
const out={
  ...report,
  date:evalJson.date||planJson.date||null,
  source_evaluation_protocol:evalJson.evaluation_protocol||null,
  source_snapshot_sha256:evalJson.snapshot_sha256||null,
  execution_plan_protocol:planJson.protocol||'BANDALYTICS_EXECUTION_PLAN_ADHOC_V1',
  execution_plan_rows:rawPlan.length,
  resolved_execution_plan_rows:resolvedPlan.length,
  unresolved_execution_plan_rows:unresolved.length,
  unresolved_execution_plan:unresolved
};
const stem=path.basename(evalFile).replace(/\.json$/,'');
const outfile=path.join(path.dirname(evalFile),`${stem}-execution-handoff.json`);
await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n','utf8');
console.log('V38_EXECUTION_HANDOFF='+JSON.stringify({outfile,date:out.date,summary:out.summary,unresolved:out.unresolved_execution_plan_rows}));
