import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const body={
  protocol:'BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V3',date:'2026-09-21',captured_at:'2026-09-21T18:00:00.000Z',point_in_time:true,prospective:true,research_only:true,scoring_enabled:false,production_rule_changed:false,
  rows:[
    {player:'Short Repeat',gamePk:1,final_cut:true,exposure_state:'PRIORITY',ticket_paths:2,evidence_lanes:['PROFILE'],hr_odds:350,zero_path_reason:null},
    {player:'Value Repeat',gamePk:2,final_cut:true,exposure_state:'PRIORITY',ticket_paths:2,evidence_lanes:['PROFILE','MATCHUP'],hr_odds:800,zero_path_reason:null},
    {player:'Zero Strong',gamePk:3,final_cut:true,exposure_state:'INTENTIONAL_ZERO',ticket_paths:0,evidence_lanes:['PROFILE','HEAT','VALUE'],hr_odds:900,zero_path_reason:'Portfolio choice'},
    {player:'Comfort Cut',gamePk:4,eligible_for_final_cut:true,final_cut:false,cut_type:'COMFORT_CUT',cut_reason:'Safety choice',ticket_paths:0,evidence_lanes:['PROFILE','HEAT'],hr_odds:1000},
    {player:'Baseball Cut',gamePk:5,eligible_for_final_cut:true,final_cut:false,cut_type:'BASEBALL_CUT',cut_reason:'Suppressive matchup',ticket_paths:0,evidence_lanes:['PROFILE'],hr_odds:700},
    {player:'Pending Lineup',gamePk:6,eligible_for_final_cut:false,readiness_state:'PENDING_LINEUP',lineup_verified:false,locked_policy:{label:'QUALIFIED_5OF6',gate_count:5},final_cut:false,cut_type:null,cut_reason:null,ticket_paths:0,evidence_lanes:['PROFILE']}
  ],
  compression_watch:[{player:'Watch Cut',review_disposition:'REVIEWED_CUT',review_cut_type:'COMFORT_CUT',review_reason:'Safety',confirmed_lane_count:2,confirmed_lanes:['PROFILE','HEAT'],american_odds:900}],
  tickets:[['Short Repeat','Value Repeat'],['Short Repeat','Value Repeat']],semantics:{},summary:{}
};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
await fs.writeFile('/tmp/diag-plan.json',JSON.stringify({...body,sha256}));
let r=spawnSync(process.execPath,['scripts/diagnose-v38-execution-plan.mjs','/tmp/diag-plan.json'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const line=r.stdout.trim().split('\n').find(x=>x.startsWith('V38_EXECUTION_DIAGNOSTICS='));assert.ok(line);const z=JSON.parse(line.slice('V38_EXECUTION_DIAGNOSTICS='.length));
assert.equal(z.protocol,'BANDALYTICS_EXECUTION_DIAGNOSTICS_V2');assert.equal(z.summary.final_pool_n,3);assert.equal(z.summary.cut_n,2);assert.equal(z.summary.ineligible_n,1);assert.equal(z.summary.comfort_cut_n,1);assert.equal(z.summary.baseball_cut_n,1);assert.equal(z.summary.compression_watch_n,1);assert.equal(z.summary.compression_comfort_cut_n,1);assert.equal(z.summary.total_ticket_legs,4);assert.equal(z.summary.short_price_leg_share_pct,50);assert.equal(z.summary.preferred_500_1500_leg_share_pct,50);assert.equal(z.summary.evidence_inversion_count,2);assert.equal(z.by_price_bucket.SUB_400.ticket_legs,2);assert.equal(z.by_price_bucket['700_1500'].ticket_legs,2);assert.equal(z.by_price_bucket['700_1500'].zero_path_players,1);assert.equal(z.cut_audit.length,2);assert.equal(z.eligibility_blocks.length,1);assert.equal(z.eligibility_blocks[0].player,'Pending Lineup');assert.equal(z.compression_watch_audit.length,1);
assert.equal(z.summary.ticket_count,2);assert.equal(z.summary.same_game_pair_count,0);assert.equal(z.summary.cross_game_pair_count,2);assert.equal(z.summary.unknown_game_pair_count,0);assert.equal(z.summary.tickets_with_same_game_pair_n,0);assert.equal(z.summary.repeated_pair_n,1);assert.equal(z.summary.max_pair_reuse,2);assert.equal(z.pairing_audit.length,2);assert.equal(z.pairing_audit[0].all_pairs_cross_game,true);assert.equal(z.repeated_pairs.length,1);assert.deepEqual(z.repeated_pairs[0].players,['Short Repeat','Value Repeat']);assert.equal(z.repeated_pairs[0].ticket_count,2);assert.equal(z.repeated_pairs[0].cross_game_uses,2);
const tampered={...body,rows:[...body.rows,{player:'Tampered',final_cut:true,ticket_paths:0,evidence_lanes:[]}],sha256};await fs.writeFile('/tmp/diag-tampered.json',JSON.stringify(tampered));r=spawnSync(process.execPath,['scripts/diagnose-v38-execution-plan.mjs','/tmp/diag-tampered.json'],{encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/sha256 mismatch/);
const v2Body={...body,protocol:'BANDALYTICS_EXECUTION_PLAN_PROSPECTIVE_V2'};const v2sha=crypto.createHash('sha256').update(JSON.stringify(v2Body)).digest('hex');await fs.writeFile('/tmp/diag-v2.json',JSON.stringify({...v2Body,sha256:v2sha}));r=spawnSync(process.execPath,['scripts/diagnose-v38-execution-plan.mjs','/tmp/diag-v2.json'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
console.log('V38 EXECUTION DIAGNOSTICS CONTRACT PASS');
