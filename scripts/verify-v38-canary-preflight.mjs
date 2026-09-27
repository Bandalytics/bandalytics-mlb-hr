import fs from 'node:fs';
import crypto from 'node:crypto';

const [freezePath,outPathArg]=process.argv.slice(2);
if(!freezePath) throw Error('Usage: node scripts/verify-v38-canary-preflight.mjs <execution-freeze.json> [output.json]');
const z=JSON.parse(fs.readFileSync(freezePath,'utf8'));
if(z.protocol!=='V38_CANARY_EXECUTION_FREEZE_V2') throw Error('invalid canary freeze protocol');
if(z.canary_only!==true||z.production_normal_volume!==false) throw Error('unsafe production flags');
if(z.architecture_contract!=='HOLDOUT_ALIGNED_40PCT_SERIOUS_BOARD_V1') throw Error('non-holdout-aligned freeze');
if(!z.sha256) throw Error('freeze sha256 missing');
const {sha256:claimed,...body}=z;
const calc=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
if(calc!==claimed) throw Error('freeze sha256 mismatch');
const candidateN=Number(z.candidate_pool_rows),seriousN=Number(z.serious_board_rows),tickets=Number(z.tickets),maxBudget=Number(z.max_ticket_budget);
if(!Number.isInteger(candidateN)||candidateN<1||!Number.isInteger(seriousN)||seriousN<1||!Number.isInteger(tickets)||tickets<1||!Number.isInteger(maxBudget)||maxBudget<1) throw Error('invalid freeze counts');
const expectedSerious=Math.max(1,Math.ceil(candidateN*0.40));
const expectedBudget=Math.max(1,Math.ceil(expectedSerious*0.40));
if(seriousN!==expectedSerious) throw Error(`serious-board size mismatch ${seriousN} != ${expectedSerious}`);
if(maxBudget!==expectedBudget) throw Error(`ticket-budget contract mismatch ${maxBudget} != ${expectedBudget}`);
if(tickets!==expectedBudget) throw Error(`preflight requires full ticket budget ${tickets} != ${expectedBudget}`);
if(z.roi_status!=='READY_FOR_POST_SLATE_SETTLEMENT') throw Error('freeze not settlement ready');
const r=z.readiness||{};
for(const k of ['candidate_pool_frozen','serious_board_share_compliant','slate_band_holdout_aligned','all_ticket_legs_priced','all_ticket_stakes_frozen','all_zero_paths_explained','cross_game_only','ticket_budget_compliant','path_caps_compliant']) if(r[k]!==true) throw Error(`readiness gate failed: ${k}`);
if(!Array.isArray(z.tickets_detail)||z.tickets_detail.length!==tickets) throw Error('ticket detail mismatch');
let stake=0;
for(const t of z.tickets_detail){
  if(!Array.isArray(t.player_ids)||t.player_ids.length!==2||!Array.isArray(t.legs)||t.legs.length!==2) throw Error(`bad ticket detail ${t.ticket_index}`);
  if(!Number.isFinite(Number(t.stake_units))||Number(t.stake_units)<=0) throw Error(`unfrozen stake ${t.ticket_index}`);
  if(!Number.isFinite(Number(t.combined_decimal))||Number(t.combined_decimal)<=1||t.fully_priced!==true) throw Error(`unfrozen price ${t.ticket_index}`);
  for(const leg of t.legs){if(!leg?.price||!Number.isFinite(Number(leg.price.american_odds))||!leg.price.captured_at||Date.parse(leg.price.captured_at)>Date.parse(z.frozen_at)) throw Error(`invalid frozen leg price ${t.ticket_index}`)}
  stake+=Number(t.stake_units);
}
if(+stake.toFixed(4)!==+Number(z.total_stake_units).toFixed(4)) throw Error('frozen stake total mismatch');
const output={protocol:'V38_CANARY_PREFLIGHT_V1',date:z.date,verified_at:new Date().toISOString(),canary_only:true,production_normal_volume:false,source_freeze_sha256:z.sha256,architecture_contract:z.architecture_contract,candidate_pool_rows:candidateN,serious_board_rows:seriousN,expected_ticket_budget:expectedBudget,tickets,total_stake_units:+stake.toFixed(4),status:'READY_FOR_CONTROLLED_FORWARD_CANARY',normal_volume_enable:false,notes:['This preflight is fail-closed and validates only operational integrity/comparability.','It does not change Core/profile rules, protected 4/6 requirements, ranking, ticket architecture, or production volume.','Full holdout-comparable ticket budget, frozen prices, frozen stakes, provenance hash, and readiness flags are all required.']};
const {sha256:_,...outBody}=output; output.sha256=crypto.createHash('sha256').update(JSON.stringify(outBody)).digest('hex');
const outPath=outPathArg||`snapshots/v38-canary-preflight-${z.date}.json`;
fs.mkdirSync(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});fs.writeFileSync(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_CANARY_PREFLIGHT_PATH=${outPath}`);
console.log(`V38_CANARY_PREFLIGHT=${JSON.stringify({date:output.date,tickets:output.tickets,total_stake_units:output.total_stake_units,status:output.status})}`);
