import assert from 'node:assert/strict';
import {buildCompressionEscapeWatch,COMPRESSION_ESCAPE_WATCH_PROTOCOL} from './scripts/build-v38-compression-escape-watch.mjs';
const base={ev:91,hh:42,barrel:12,iso:.22,pullair:24,blast:10};
const verified={bbe_cryptographically_verified:true,pitchfit_cryptographically_verified:true};
const row=(id,profile,extra={})=>({player_id:id,player:`P${id}`,gamePk:100+id,matchup:'AAA @ BBB',start_time:'2026-09-22T23:00:00Z',profile,gate_count:extra.gate_count,final_review_queue:extra.final_review_queue??false,context:{lineup:extra.lineup??3,confirmed_lineup:extra.confirmed_lineup??true,market:extra.market??null},modifier_evidence:extra.modifier_evidence??{},bbe_band:extra.bbe_band??null,pitchfit:extra.pitchfit??null,park_factor:extra.park_factor??null});
const board={protocol:'V38_LIVE_RESEARCH_BOARD_V1',date:'2026-09-22',generated_at:'2026-09-22T20:00:00Z',profile_snapshot_sha256:'a'.repeat(64),point_in_time:true,research_only:true,rows:[
 row(1,base,{gate_count:6,final_review_queue:true}),
 row(2,{...base,blast:7},{gate_count:5,modifier_evidence:verified,bbe_band:{hrshape_band:'TOP_QUARTILE'},pitchfit:{fit_status:'TRUE'}}),
 row(3,{...base,blast:7},{gate_count:5,modifier_evidence:{bbe_cryptographically_verified:true},bbe_band:{hrshape_band:'BASE'},confirmed_lineup:false,lineup:null}),
 row(4,{...base,blast:7,pullair:17},{gate_count:4}),
 row(5,{...base,blast:7,pullair:17,iso:.12},{gate_count:3})
]};
const z=buildCompressionEscapeWatch(board);
assert.equal(z.protocol,COMPRESSION_ESCAPE_WATCH_PROTOCOL);assert.equal(z.point_in_time,true);assert.equal(z.research_only,true);assert.equal(z.scoring_enabled,false);assert.equal(z.production_rule_changed,false);assert.equal(z.auto_promote,false);
assert.equal(z.summary.qualified_outside_review,2);assert.equal(z.summary.verified_opportunity,1);assert.equal(z.summary.multi_lane_outside_review,1);assert.equal(z.summary.by_gate_count.five_of_six,2);
const p2=z.rows.find(r=>r.player_id===2);assert.equal(p2.watch_state,'MULTI_LANE_OUTSIDE_REVIEW');assert.deepEqual(p2.evidence.confirmed_lanes,['PROFILE','HEAT','MATCHUP']);assert.equal(p2.evidence.VALUE.support,null);
const p3=z.rows.find(r=>r.player_id===3);assert.equal(p3.watch_state,'OUTSIDE_REVIEW_PENDING_OPPORTUNITY');assert.equal(p3.evidence.confirmed_lane_count,1);
assert.equal(z.rows.some(r=>r.player_id===1),false);assert.equal(z.rows.some(r=>r.player_id===4),false);assert.equal(z.rows.some(r=>r.player_id===5),false);assert.match(z.sha256,/^[a-f0-9]{64}$/);
assert.throws(()=>buildCompressionEscapeWatch({...board,point_in_time:false}),/valid point-in-time live research board required/);
console.log('V38 COMPRESSION ESCAPE WATCH CONTRACT PASS');
