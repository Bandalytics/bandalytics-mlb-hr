import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
fs.mkdirSync('tmp/canary-ready',{recursive:true});
function settlement(date,i){
  const winSlate=i%2===1;
  const hrs=winSlate?[[1,1],[0,0],[0,0],[0,0]]:[[1,0],[1,0],[0,0],[0,0]];
  const tickets_detail=hrs.map((pair,j)=>({ticket_index:j+1,player_ids:[i*100+j*2+1,i*100+j*2+2],players:[`P${j*2+1}`,`P${j*2+2}`],hrs:pair,win:pair.every(x=>x===1),stake_units:1,combined_decimal:12,gross_return_units:pair.every(x=>x===1)?12:0,net_units:pair.every(x=>x===1)?11:-1}));
  const body={protocol:'V38_CANARY_SETTLEMENT_V1',date,settled_at:`${date}T23:30:00Z`,canary_only:true,production_normal_volume:false,source_freeze_sha256:`f${i}`,tickets:4,winning_tickets:winSlate?1:0,ticket_win_rate_pct:winSlate?25:0,total_stake_units:4,gross_return_units:winSlate?12:0,net_units:winSlate?8:-4,realized_roi_pct:winSlate?200:-100,unique_ticketed_hitters:8,ticketed_hr:2,ticketed_hr_rate_pct:25,tickets_detail,roi_status:'REALIZED_FROM_VERIFIED_FROZEN_PRICE_AND_STAKE',notes:[]};
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
// Raw totals: winning slates are i=1,3,5 => +8 each; losing slates i=2,4 => -4 each.
// Net = 24 - 8 = 16 units on 20 staked units => 80% realized ROI.
if(z.total_stake_units!==20||z.net_units!==16||z.realized_roi_pct!==80) throw Error('bad raw ROI aggregation');
if(z.evidence_gate.internal_settlement_totals_verified!==true||z.evidence_gate.automatic_production_enable!==false||z.production_normal_volume!==false) throw Error('unsafe production/integrity flag');
console.log('V38_CANARY_REACTIVATION_READINESS_TEST_OK');
