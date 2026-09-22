import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {buildExecutionDraftTemplate,EXECUTION_DRAFT_TEMPLATE_PROTOCOL} from './scripts/build-v38-execution-draft-template.mjs';
const body={protocol:'BANDALYTICS_LOCK_READINESS_V2',date:'2026-09-21',generated_at:'2026-09-21T22:00:00Z',point_in_time:true,research_only:true,rows:[
 {player:'A',player_id:1,gamePk:10,matchup:'AAA @ BBB',start_time:'2026-09-21T23:00:00Z',readiness_state:'ACTIONABLE_REVIEW',locked_policy:{qualified:true,gate_count:6},american_odds:null,hr_price_source:null,lineup:3,lineup_verified:true,evidence_lane_inputs:{PROFILE:{available:true,support:true}}},
 {player:'B',player_id:2,gamePk:11,matchup:'CCC @ DDD',start_time:'2026-09-21T23:30:00Z',readiness_state:'PENDING_LINEUP',locked_policy:{qualified:true,gate_count:5},american_odds:null,hr_price_source:null,lineup:null,lineup_verified:false,evidence_lane_inputs:{PROFILE:{available:true,support:true}}}
]};
const readiness={...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
const watchBody={protocol:'BANDALYTICS_COMPRESSION_ESCAPE_WATCH_V1',date:'2026-09-21',generated_at:'2026-09-21T22:00:01Z',point_in_time:true,research_only:true,rows:[
 {player:'C',player_id:3,gamePk:12,matchup:'EEE @ FFF',start_time:'2026-09-21T23:45:00Z',gate_count:5,lineup:2,lineup_verified:true,american_odds:null,hr_price_source:null,watch_state:'MULTI_LANE_OUTSIDE_REVIEW',evidence:{confirmed_lanes:['PROFILE','MATCHUP'],confirmed_lane_count:2}},
 {player:'D',player_id:4,gamePk:13,matchup:'GGG @ HHH',start_time:'2026-09-21T23:55:00Z',gate_count:6,lineup:null,lineup_verified:false,watch_state:'OUTSIDE_REVIEW_PENDING_OPPORTUNITY',evidence:{confirmed_lanes:['PROFILE'],confirmed_lane_count:1}}
]};
const watch={...watchBody,sha256:crypto.createHash('sha256').update(JSON.stringify(watchBody)).digest('hex')};
const z=buildExecutionDraftTemplate(readiness,watch);
assert.equal(z.protocol,EXECUTION_DRAFT_TEMPLATE_PROTOCOL);assert.equal(z.protocol,'BANDALYTICS_EXECUTION_DRAFT_TEMPLATE_V2');assert.equal(z.decision_state,'UNRESOLVED');assert.deepEqual(z.cut_labels,['BASEBALL_CUT','COMFORT_CUT']);assert.equal(z.rows.length,2);assert.equal(z.rows[0].eligible_for_final_cut,true);assert.equal(z.rows[1].eligible_for_final_cut,false);assert.equal(z.rows[0].final_cut,null);assert.equal(z.rows[0].cut_type,null);assert.equal(z.rows[0].cut_reason,null);assert.equal(z.rows[0].exposure_state,'UNCLASSIFIED');assert.deepEqual(z.rows[0].evidence_lanes,[]);assert.deepEqual(z.tickets,[]);assert.equal(z.source_readiness_sha256,readiness.sha256);assert.equal(z.source_compression_watch_sha256,watch.sha256);assert.equal(z.compression_watch.length,1);assert.equal(z.compression_watch[0].player,'C');assert.equal(z.compression_watch[0].review_disposition,null);assert.equal(z.compression_watch[0].review_cut_type,null);assert.equal(z.compression_watch[0].review_reason,null);assert.equal(z.compression_watch[0].auto_promote,false);assert.match(z.sha256,/^[a-f0-9]{64}$/);
assert.throws(()=>buildExecutionDraftTemplate({...readiness,protocol:'BAD'},watch),/valid lock readiness v2 required/);assert.throws(()=>buildExecutionDraftTemplate(readiness,{...watch,date:'2026-09-20'}),/valid same-date compression escape watch required/);
console.log('V38 EXECUTION DRAFT TEMPLATE CONTRACT PASS');
