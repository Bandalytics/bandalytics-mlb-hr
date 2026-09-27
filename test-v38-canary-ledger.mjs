import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
fs.mkdirSync('tmp/canary-ledger',{recursive:true});
function settlement(date,i,stake,net){
  const body={protocol:'V38_CANARY_SETTLEMENT_V1',date,settled_at:`${date}T23:30:00Z`,canary_only:true,production_normal_volume:false,source_freeze_sha256:`f${i}`,source_preflight_sha256:`p${i}`,source_preflight_status:'READY_FOR_CONTROLLED_FORWARD_CANARY',source_outcomes_sha256:`o${i}`,source_outcomes_source:'MLB_FINAL_RESULTS',source_architecture_contract:'HOLDOUT_ALIGNED_40PCT_SERIOUS_BOARD_V1',source_candidate_pool_rows:20,source_slate_band:'SMALL_LE_50',tickets:2,winning_tickets:net>0?1:0,ticket_win_rate_pct:net>0?50:0,total_stake_units:stake,gross_return_units:stake+net,net_units:net,realized_roi_pct:+(100*net/stake).toFixed(2),unique_ticketed_hitters:4,ticketed_hr:2,ticketed_hr_rate_pct:50,tickets_detail:[{ticket_index:1,player_ids:[i*10+1,i*10+2],players:['A','B'],hrs:[1,1],win:true,stake_units:stake/2,combined_decimal:4,gross_return_units:net>0?stake+net:0,net_units:net>0?stake/2+net:-stake/2},{ticket_index:2,player_ids:[i*10+3,i*10+4],players:['C','D'],hrs:[1,0],win:false,stake_units:stake/2,combined_decimal:4,gross_return_units:0,net_units:-stake/2}],roi_status:'REALIZED_FROM_VERIFIED_FROZEN_PRICE_STAKE_AND_OUTCOMES',notes:[]};
  return {...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
}
const s1=settlement('2026-10-01',1,2,-2), s2=settlement('2026-10-02',2,3,6);
fs.writeFileSync('tmp/canary-ledger/s1.json',JSON.stringify(s1)); fs.writeFileSync('tmp/canary-ledger/s2.json',JSON.stringify(s2));
execFileSync('node',['scripts/update-v38-canary-ledger.mjs','NONE','tmp/canary-ledger/s1.json','tmp/canary-ledger/l1.json'],{stdio:'inherit'});
execFileSync('node',['scripts/update-v38-canary-ledger.mjs','tmp/canary-ledger/l1.json','tmp/canary-ledger/s2.json','tmp/canary-ledger/l2.json'],{stdio:'inherit'});
const z=JSON.parse(fs.readFileSync('tmp/canary-ledger/l2.json','utf8'));
if(z.protocol!=='V38_CANARY_LEDGER_V1'||z.total_slates!==2||z.total_tickets!==4) throw Error('bad ledger counts');
if(z.total_stake_units!==5||z.net_units!==4||z.realized_roi_pct!==80) throw Error('raw total aggregation failed');
if(z.production_normal_volume!==false||z.automatic_production_enable!==false) throw Error('unsafe production flags');
if(z.rows[0].date!=='2026-10-01'||z.rows[1].date!=='2026-10-02'||!z.rows.every(r=>r.freeze_sha256&&r.preflight_sha256&&r.outcomes_sha256&&r.settlement_sha256)) throw Error('provenance/order failure');
const duplicate=spawnSync('node',['scripts/update-v38-canary-ledger.mjs','tmp/canary-ledger/l2.json','tmp/canary-ledger/s2.json','tmp/canary-ledger/dup.json'],{encoding:'utf8'});
if(duplicate.status===0||!String(duplicate.stderr).includes('duplicate settlement date')) throw Error('duplicate replay accepted');
const altered={...s2,net_units:7}; delete altered.sha256; altered.sha256=crypto.createHash('sha256').update(JSON.stringify(altered)).digest('hex'); fs.writeFileSync('tmp/canary-ledger/s2-alt.json',JSON.stringify(altered));
const conflict=spawnSync('node',['scripts/update-v38-canary-ledger.mjs','tmp/canary-ledger/l2.json','tmp/canary-ledger/s2-alt.json','tmp/canary-ledger/conflict.json'],{encoding:'utf8'});
if(conflict.status===0||!String(conflict.stderr).includes('conflicting settlement')) throw Error('conflicting replacement accepted');
const tamperedLedger={...z,total_stake_units:99}; fs.writeFileSync('tmp/canary-ledger/l2-tampered.json',JSON.stringify(tamperedLedger));
const tamper=spawnSync('node',['scripts/update-v38-canary-ledger.mjs','tmp/canary-ledger/l2-tampered.json','tmp/canary-ledger/s1.json','tmp/canary-ledger/tamper.json'],{encoding:'utf8'});
if(tamper.status===0||!String(tamper.stderr).includes('existing ledger sha256 mismatch')) throw Error('tampered ledger accepted');
console.log('V38_CANARY_LEDGER_TEST_OK');
