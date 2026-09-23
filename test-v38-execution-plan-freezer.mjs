import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const good={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,cut_type:null,cut_reason:null,exposure_state:'PRIORITY',ticket_paths:2,opportunity_verified:true,observed_starting_lineup:true,evidence_lanes:['PROFILE','HEAT','MATCHUP']},
  {player:'B',final_cut:true,cut_type:null,cut_reason:null,exposure_state:'ONE_PATH',ticket_paths:2,lineup_type:'CONFIRMED',evidence_lanes:['PROFILE','VALUE']},
  {player:'C',final_cut:true,cut_type:null,cut_reason:null,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,zero_path_reason:'Baseball-based no-ticket decision.',evidence_lanes:['PROFILE']},
  {player:'D',final_cut:false,cut_type:'BASEBALL_CUT',cut_reason:'Suppressive matchup.',exposure_state:'UNCLASSIFIED',ticket_paths:0,evidence_lanes:['PROFILE']},
  {player:'E',final_cut:false,cut_type:'COMFORT_CUT',cut_reason:'Comparable evidence but removed for safety/comfort.',exposure_state:'UNCLASSIFIED',ticket_paths:0,evidence_lanes:['PROFILE','HEAT']}
],compression_watch:[
  {player:'W1',review_disposition:'REVIEWED_KEEP',review_cut_type:null,review_reason:'Independent support survives compression review.'},
  {player:'W2',review_disposition:'REVIEWED_CUT',review_cut_type:'COMFORT_CUT',review_reason:'Qualified but excluded mainly for comfort.'},
  {player:'W3',review_disposition:'REVIEWED_CUT',review_cut_type:'BASEBALL_CUT',review_reason:'Baseball evidence materially weaker.'}
],tickets:[['A','B'],['A','B']]};
const badNonstarter={date:'2026-09-21',rows:[
  {player:'Bench',final_cut:true,exposure_state:'PRIORITY',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:false},
  {player:'Other',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true}
],tickets:[['Bench','Other']]};
const badMismatch={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'PRIORITY',ticket_paths:2,opportunity_verified:true,observed_starting_lineup:true},
  {player:'B',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true}
],tickets:[['A','B']]};
const badUnclassifiedZero={date:'2026-09-21',rows:[{player:'A',final_cut:true,exposure_state:'UNCLASSIFIED',ticket_paths:0}],tickets:[]};
const badZeroReason={date:'2026-09-21',rows:[{player:'A',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0}],tickets:[]};
const badUnknownOpportunity={date:'2026-09-21',rows:[
  {player:'A',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1},
  {player:'B',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true}
],tickets:[['A','B']]};
const badOutsideFinalCut={date:'2026-09-21',rows:[
  {player:'A',final_cut:false,cut_type:'BASEBALL_CUT',cut_reason:'Not enough baseball support.',exposure_state:'UNCLASSIFIED',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true},
  {player:'B',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,opportunity_verified:true,observed_starting_lineup:true}
],tickets:[['A','B']]};
const badLane={date:'2026-09-21',rows:[{player:'A',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,zero_path_reason:'No path',evidence_lanes:['PROFILE','DBD']}],tickets:[]};
const badUnresolved={date:'2026-09-21',rows:[{player:'A',final_cut:null,exposure_state:'UNCLASSIFIED',ticket_paths:0}],tickets:[]};
const badMissingCutType={date:'2026-09-21',rows:[{player:'A',final_cut:false,cut_reason:'Cut but unlabeled.',exposure_state:'UNCLASSIFIED',ticket_paths:0}],tickets:[]};
const badMissingCutReason={date:'2026-09-21',rows:[{player:'A',final_cut:false,cut_type:'COMFORT_CUT',exposure_state:'UNCLASSIFIED',ticket_paths:0}],tickets:[]};
const badFinalRetainsCut={date:'2026-09-21',rows:[{player:'A',final_cut:true,cut_type:'BASEBALL_CUT',cut_reason:'stale',exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,zero_path_reason:'No path'}],tickets:[]};
const badCompressionUnreviewed={date:'2026-09-21',rows:[{player:'A',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,zero_path_reason:'No path'}],compression_watch:[{player:'W',review_disposition:null,review_reason:null}],tickets:[]};
const badCompressionCutType={date:'2026-09-21',rows:[{player:'A',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,zero_path_reason:'No path'}],compression_watch:[{player:'W',review_disposition:'REVIEWED_CUT',review_cut_type:null,review_reason:'Cut'}],tickets:[]};
const badCompressionKeepCutType={date:'2026-09-21',rows:[{player:'A',final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,zero_path_reason:'No path'}],compression_watch:[{player:'W',review_disposition:'REVIEWED_KEEP',review_cut_type:'COMFORT_CUT',review_reason:'Keep'}],tickets:[]};

const cases={good,badNonstarter,badMismatch,badUnclassifiedZero,badZeroReason,badUnknownOpportunity,badOutsideFinalCut,badLane,badUnresolved,badMissingCutType,badMissingCutReason,badFinalRetainsCut,badCompressionUnreviewed,badCompressionCutType,badCompressionKeepCutType};
for(const [name,obj] of Object.entries(cases))await fs.writeFile(`/tmp/${name}.json`,JSON.stringify(obj));
const run=name=>spawnSync(process.execPath,['scripts/freeze-v38-execution-plan.mjs',`/tmp/${name}.json`],{encoding:'utf8'});
let r=run('good');assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/V38_EXECUTION_PLAN_FROZEN=/);const payload=JSON.parse(r.stdout.trim().split('V38_EXECUTION_PLAN_FROZEN=')[1]);assert.equal(payload.summary.baseball_cut_n,1);assert.equal(payload.summary.comfort_cut_n,1);assert.equal(payload.summary.compression_watch_n,3);assert.equal(payload.summary.compression_reviewed_keep_n,1);assert.equal(payload.summary.compression_reviewed_cut_n,2);assert.equal(payload.summary.compression_comfort_cut_n,1);
for(const [name,pattern] of [
  ['badNonstarter',/verified nonstarter/],['badMismatch',/ticket_paths mismatch/],['badUnclassifiedZero',/requires INTENTIONAL_ZERO classification/],['badZeroReason',/requires zero_path_reason/],['badUnknownOpportunity',/requires verified lineup\/opportunity/],['badOutsideFinalCut',/outside FINAL CUT/],['badLane',/bad evidence lane DBD/],['badUnresolved',/resolved final_cut boolean required/],['badMissingCutType',/requires BASEBALL_CUT or COMFORT_CUT/],['badMissingCutReason',/requires cut_reason/],['badFinalRetainsCut',/cannot retain cut label\/reason/],['badCompressionUnreviewed',/compression watch requires REVIEWED_KEEP or REVIEWED_CUT/],['badCompressionCutType',/REVIEWED_CUT requires BASEBALL_CUT or COMFORT_CUT/],['badCompressionKeepCutType',/REVIEWED_KEEP cannot retain review_cut_type/]
]){r=run(name);assert.notEqual(r.status,0,`${name} should fail`);assert.match(r.stderr,pattern);}
console.log('V38 EXECUTION PLAN FREEZER CONTRACT PASS');
