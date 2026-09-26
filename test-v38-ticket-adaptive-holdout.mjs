import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

fs.mkdirSync('snapshots',{recursive:true});
const mk=(n,date)=>({
  protocol:'V38_WORKFLOW_REVALIDATION_V1',date,point_in_time:true,as_of_verified:true,forward_leakage_days:0,
  rows:Array.from({length:n},(_,i)=>({player_id:i+1,player:`P${i+1}`,gamePk:1000+i,lineup_slot:(i%9)+1,gate_count:i%3===0?6:5,homer:i%7===0,pitchfit_band:i%4===0?'TOP_DECILE':'BASE_TRUE',bbe_hrshape_band:'BASE',starter_hr9_band:i%5===0?'HIGH_GE_1_5':'MID_1_2_TO_1_5',revalidation:{anti_overcompression:true}}))
});
for(const [n,date,band] of [[40,'2026-06-01','SMALL_LE_50'],[60,'2026-06-02','MEDIUM_51_75'],[80,'2026-06-03','LARGE_GE_76']]){
  const inPath=`snapshots/test-adaptive-${date}.json`;
  fs.writeFileSync(inPath,JSON.stringify(mk(n,date)));
  execFileSync(process.execPath,['scripts/evaluate-v38-ticket-adaptive-holdout.mjs',inPath],{stdio:'pipe'});
  const out=JSON.parse(fs.readFileSync(`snapshots/v38-ticket-adaptive-holdout-${date}.json`,'utf8'));
  if(out.protocol!=='V38_TICKET_ADAPTIVE_HOLDOUT_V1') throw Error('protocol mismatch');
  if(out.slate_band!==band) throw Error(`band mismatch ${date}`);
  if(out.holdout_window!=='2026-06-01_TO_2026-07-10') throw Error('holdout window mismatch');
  const p=out.results.BUDGET_40_PCT_BOARD.policies;
  for(const k of ['BROAD_ONE_PATH','ADAPTIVE_PRIORITY_25_LARGE','ADAPTIVE_PRIORITY_33_LARGE','ADAPTIVE_UNIFORM_TWO_PATH_LARGE']) if(!p[k]) throw Error(`missing policy ${k}`);
  if(band!=='LARGE_GE_76'){
    const base=JSON.stringify(p.BROAD_ONE_PATH);
    for(const k of ['ADAPTIVE_PRIORITY_25_LARGE','ADAPTIVE_PRIORITY_33_LARGE','ADAPTIVE_UNIFORM_TWO_PATH_LARGE']) if(JSON.stringify(p[k])!==base) throw Error(`non-large policy must collapse to broad ${k}`);
  } else {
    if(p.BROAD_ONE_PATH.max_hitter_uses>1) throw Error('broad reuse violation');
    if(p.ADAPTIVE_PRIORITY_25_LARGE.max_hitter_uses>2||p.ADAPTIVE_PRIORITY_33_LARGE.max_hitter_uses>2||p.ADAPTIVE_UNIFORM_TWO_PATH_LARGE.max_hitter_uses>2) throw Error('repeat cap violation');
  }
}
console.log('v38 adaptive ticket holdout tests passed');
