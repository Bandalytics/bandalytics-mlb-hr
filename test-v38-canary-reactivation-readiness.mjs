import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
fs.mkdirSync('tmp/canary-ready',{recursive:true});
function settlement(date,i){
  const body={protocol:'V38_CANARY_SETTLEMENT_V1',date,settled_at:`${date}T23:30:00Z`,canary_only:true,production_normal_volume:false,source_freeze_sha256:`f${i}`,tickets:4,winning_tickets:i%2,ticket_win_rate_pct:i%2?25:0,total_stake_units:4,gross_return_units:i%2?12:0,net_units:i%2?8:-4,realized_roi_pct:i%2?200:-100,unique_ticketed_hitters:8,ticketed_hr:2,ticketed_hr_rate_pct:25,tickets_detail:[],roi_status:'REALIZED_FROM_VERIFIED_FROZEN_PRICE_AND_STAKE',notes:[]};
  return {...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
}
const files=[];
for(let i=1;i<=5;i++){const f=`tmp/canary-ready/s${i}.json`;fs.writeFileSync(f,JSON.stringify(settlement(`2026-10-0${i}`,i)));files.push(f);}
const out='tmp/canary-ready/out.json';
execFileSync('node',['scripts/summarize-v38-canary-reactivation.mjs',...files,'--out',out],{stdio:'inherit'});
const z=JSON.parse(fs.readFileSync(out,'utf8'));
if(z.protocol!=='V38_CANARY_REACTIVATION_READINESS_V1'||z.forward_slates!==5) throw Error('bad protocol/slates');
if(z.readiness_status!=='INITIAL_REACTIVATION_REVIEW') throw Error('bad readiness status');
if(z.total_tickets!==20||z.winning_tickets!==3) throw Error('bad ticket aggregation');
if(z.total_stake_units!==20||z.net_units!==20||z.realized_roi_pct!==100) throw Error('bad raw ROI aggregation');
if(z.evidence_gate.automatic_production_enable!==false||z.production_normal_volume!==false) throw Error('unsafe production flag');
console.log('V38_CANARY_REACTIVATION_READINESS_TEST_OK');
