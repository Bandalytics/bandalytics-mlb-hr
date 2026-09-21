import assert from 'node:assert/strict';
import {evaluateExecutionHandoff,EXECUTION_HANDOFF_PROTOCOL} from './v38-execution-handoff-core.mjs';

const base=(id,gate,homer=false,slot=3)=>({gamePk:1,player_id:id,player:`P${id}`,gate_count:gate,homer,profile_complete:true,context:{lineup:{lineup_type:'CONFIRMED',lineup:slot}}});
const rows=[
  base(1,6,true,2),
  base(2,5,false,4),
  base(3,5,true,5),
  {...base(4,5,false,null),context:{lineup:{lineup_type:'BENCH'}}},
  base(5,4,true,6),
  base(6,3,true,7),
  base(7,4,false,8)
];
const plan=[
  {gamePk:1,player_id:1,final_cut:true,exposure_state:'PRIORITY',ticket_paths:3,ticket_ids:['T1','T2','T3']},
  {gamePk:1,player_id:2,final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,ticket_ids:['T4']},
  {gamePk:1,player_id:3,final_cut:true,exposure_state:'UNCLASSIFIED',ticket_paths:0},
  {gamePk:1,player_id:4,final_cut:true,exposure_state:'PRIORITY',ticket_paths:2,ticket_ids:['T5','T6']},
  {gamePk:1,player_id:5,final_cut:false,cut_reason:'BASEBALL CUT'},
  {gamePk:1,player_id:7,final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,ticket_ids:['T4'],hr_odds:800}
];
const z=evaluateExecutionHandoff(rows,plan);
assert.equal(z.protocol,EXECUTION_HANDOFF_PROTOCOL);
assert.equal(z.research_only,true);
assert.equal(z.scoring_enabled,false);
assert.equal(z.production_rule_changed,false);
assert.equal(z.summary.qualified.n,5);
assert.equal(z.summary.final_pool.n,5);
assert.equal(z.summary.lineup_eligible_final_pool.n,4);
assert.equal(z.summary.ticketed_eligible.n,3);
assert.equal(z.summary.zero_path_count,1);
assert.equal(z.summary.opportunity_mismatch_count,1);
assert.equal(z.summary.total_ticket_paths,5);
assert.equal(z.summary.top3_exposure_concentration_pct,100);
assert.equal(z.summary.unique_ticket_count,6);
assert.equal(z.summary.max_single_hitter_leg_share_pct,60);
assert.equal(z.summary.max_single_hitter_portfolio_dependency_pct,50);
const p4=z.rows.find(r=>r.player_id===4);
assert.equal(p4.execution.opportunity_mismatch,true);
const p3=z.rows.find(r=>r.player_id===3);
assert.equal(p3.execution.zero_path_qualified,true);
const p5=z.rows.find(r=>r.player_id===5);
assert.equal(p5.execution.policy.qualified,false); // 4/6 with no price is unresolved, not locked-qualified
const p7=z.rows.find(r=>r.player_id===7);
assert.equal(p7.execution.policy.qualified,true);
assert.equal(p7.execution.policy.label,'PROTECTED_4OF6_700PLUS');
assert.equal(p7.execution.policy.hr_american_odds,800);
console.log('V38 EXECUTION HANDOFF CONTRACT PASS');
