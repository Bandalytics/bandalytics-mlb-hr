import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
fs.mkdirSync('tmp/canary-plan',{recursive:true});
const date='2027-04-01',frozen='2027-04-01T20:00:00Z',start='2027-04-02T01:00:00Z';
const rows=Array.from({length:80},(_,i)=>({player_id:i+1,player:`P${i+1}`,gamePk:1000+i,start_time:start,profile_gate_count:i<20?6:5,lineup:(i%9)+1,pitchfit_band:i%10===0?'TOP_QUARTILE':'INELIGIBLE',bbe_band:{hrshape_band:i%11===0?'BASE':'INELIGIBLE'}}));
const board={protocol:'V38_DAILY_RESEARCH_BOARD_V2',date,generated_at:'2027-04-01T19:30:00Z',point_in_time:true,rows};
const starterRows=rows.map((r,i)=>({gamePk:r.gamePk,player_id:r.player_id,starter_hr9_band:i===79?'LOW_LT_1_2':i%5===0?'HIGH_GE_1_5':'MID_1_2_TO_1_5'}));
const starterBody={protocol:'V38_STARTER_DAMAGE_SNAPSHOT_V1',date,captured_at:'2027-04-01T19:40:00Z',point_in_time:true,as_of_verified:true,research_only:true,scoring_enabled:false,scoring_eligible:false,rows:starterRows};
const starter={...starterBody,sha256:crypto.createHash('sha256').update(JSON.stringify(starterBody)).digest('hex')};
fs.writeFileSync('tmp/canary-plan/board.json',JSON.stringify(board)); fs.writeFileSync('tmp/canary-plan/starter.json',JSON.stringify(starter));
execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/board.json','tmp/canary-plan/starter.json',frozen,'1','tmp/canary-plan/plan.json'],{stdio:'inherit'});
const z=JSON.parse(fs.readFileSync('tmp/canary-plan/plan.json','utf8'));
if(z.protocol!=='V38_CANARY_EXECUTION_PLAN_V1'||!z.plan_sha256) throw Error('bad plan protocol/hash');
const m=z.research_metadata;
if(m.protocol!=='V38_CANARY_PLAN_BUILDER_V2'||m.ranking_contract!=='LINEUP_SLOT_EXCLUDED_FROM_ALL_RANKING_KEYS'||m.lineup_role!=='EXECUTION_ELIGIBILITY_ONLY') throw Error('lineup-free ranking contract missing');
if(m.architecture_status!=='PROVISIONAL_FORWARD_REVALIDATION_AFTER_LINEUP_CONTAMINATION_CLEANUP') throw Error('provisional architecture status missing');
if(m.candidate_source!=='STANDARD_5OF6_PLUS_ANTI_OVERCOMPRESSION'||m.protected_4of6_status!=='SHADOW_ONLY_NOT_MIXED_IN_REACTIVATION_CANARY') throw Error('bad candidate contract');
if(m.opportunity_guard!=='TICKET_LEGS_REQUIRE_CONFIRMED_LINEUP_SLOT_1_TO_9') throw Error('lineup guard missing');
if(m.freeze_scope!=='FULL_STANDARD_5OF6_PLUS_SLATE_BEFORE_EARLIEST_CANDIDATE_START'||m.earliest_standard_candidate_start!==new Date(start).toISOString()) throw Error('full-slate freeze metadata missing');
if(m.candidate_pool_rows!==79||m.excluded_concrete_negative!==1||m.slate_band!=='LARGE_GE_76'||z.candidate_pool_ranking_strategy!=='PITCHFIT_FIRST') throw Error('bad anti-overcompression/slate band');
if(m.verified_starter_provenance_rows!==80||m.missing_starter_provenance_rows!==0) throw Error('starter provenance coverage missing');
if(m.serious_board_rows!==32||z.serious_board_player_ids.length!==32||m.requested_ticket_budget!==13||z.tickets.length!==13) throw Error('bad 40% board/ticket budget');
const uses=new Map(); for(const t of z.tickets) for(const id of t.player_ids) uses.set(id,(uses.get(id)||0)+1);
if(Math.max(...uses.values())!==2) throw Error('large-slate priority repetition missing');
if(z.candidate_pool_player_ids.includes(80)) throw Error('concrete negative not removed');

// Reversing lineup positions must not change ranking, serious board, or tickets while all hitters remain confirmed starters.
const reversed=JSON.parse(JSON.stringify(board));
for(const r of reversed.rows) r.lineup=10-r.lineup;
fs.writeFileSync('tmp/canary-plan/board-reversed-lineup.json',JSON.stringify(reversed));
execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/board-reversed-lineup.json','tmp/canary-plan/starter.json',frozen,'1','tmp/canary-plan/plan-reversed-lineup.json'],{stdio:'inherit'});
const rev=JSON.parse(fs.readFileSync('tmp/canary-plan/plan-reversed-lineup.json','utf8'));
if(JSON.stringify(rev.candidate_pool_player_ids)!==JSON.stringify(z.candidate_pool_player_ids)) throw Error('lineup position changed candidate ranking');
if(JSON.stringify(rev.serious_board_player_ids)!==JSON.stringify(z.serious_board_player_ids)) throw Error('lineup position changed serious board');
if(JSON.stringify(rev.tickets)!==JSON.stringify(z.tickets)) throw Error('lineup position changed tickets');

// Remove lineup confirmation from a serious-board hitter: it must remain on the board but cannot appear on a ticket.
const target=z.serious_board_player_ids[0];
const board2=JSON.parse(JSON.stringify(board)); board2.rows.find(r=>r.player_id===target).lineup=null;
fs.writeFileSync('tmp/canary-plan/board-unconfirmed.json',JSON.stringify(board2));
execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/board-unconfirmed.json','tmp/canary-plan/starter.json',frozen,'1','tmp/canary-plan/plan-unconfirmed.json'],{stdio:'inherit'});
const u=JSON.parse(fs.readFileSync('tmp/canary-plan/plan-unconfirmed.json','utf8'));
if(JSON.stringify(u.serious_board_player_ids)!==JSON.stringify(z.serious_board_player_ids)) throw Error('lineup confirmation changed serious-board membership');
const ticketed=new Set(u.tickets.flatMap(t=>t.player_ids));
if(ticketed.has(target)) throw Error('unconfirmed lineup hitter was ticketed');
const zero=u.intentional_zeros.find(x=>x.player_id===target);
if(!zero||zero.reason!=='LINEUP_NOT_CONFIRMED_AT_FREEZE') throw Error('unconfirmed lineup zero reason missing');
if(u.research_metadata.unconfirmed_lineup_serious_rows<1) throw Error('unconfirmed lineup count missing');

// A freeze after any standard 5/6+ candidate has started must fail closed instead of silently shrinking/re-banding the slate.
const partial=JSON.parse(JSON.stringify(board)); partial.rows[0].start_time='2027-04-01T19:55:00Z';
fs.writeFileSync('tmp/canary-plan/board-partial.json',JSON.stringify(partial));
let partialFailed=false;
try{execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/board-partial.json','tmp/canary-plan/starter.json',frozen,'1','tmp/canary-plan/plan-partial.json'],{stdio:'pipe'});}catch(e){partialFailed=String(e.stderr||e.message).includes('FULL_SLATE_CANARY_FREEZE_REQUIRED_BEFORE_EARLIEST_STANDARD_CANDIDATE_START');}
if(!partialFailed) throw Error('partial-slate canary freeze did not fail closed');

// Source artifacts must already exist at the declared freeze time; otherwise the plan would time-travel.
const postFreezeBoard={...board,generated_at:'2027-04-01T20:00:01Z'}; fs.writeFileSync('tmp/canary-plan/board-post-freeze.json',JSON.stringify(postFreezeBoard));
let boardAsOfFailed=false; try{execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/board-post-freeze.json','tmp/canary-plan/starter.json',frozen,'1','tmp/canary-plan/plan-post-freeze-board.json'],{stdio:'pipe'});}catch(e){boardAsOfFailed=String(e.stderr||e.message).includes('DAILY_BOARD_MUST_EXIST_AT_OR_BEFORE_CANARY_FREEZE');}
if(!boardAsOfFailed) throw Error('post-freeze daily board was accepted');
const postFreezeStarterBody={...starterBody,captured_at:'2027-04-01T20:00:01Z'}; const postFreezeStarter={...postFreezeStarterBody,sha256:crypto.createHash('sha256').update(JSON.stringify(postFreezeStarterBody)).digest('hex')}; fs.writeFileSync('tmp/canary-plan/starter-post-freeze.json',JSON.stringify(postFreezeStarter));
let starterAsOfFailed=false; try{execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/board.json','tmp/canary-plan/starter-post-freeze.json',frozen,'1','tmp/canary-plan/plan-post-freeze-starter.json'],{stdio:'pipe'});}catch(e){starterAsOfFailed=String(e.stderr||e.message).includes('STARTER_SNAPSHOT_MUST_EXIST_AT_OR_BEFORE_CANARY_FREEZE');}
if(!starterAsOfFailed) throw Error('post-freeze starter snapshot was accepted');

// Starter damage must also be captured before the earliest standard candidate start for a comparable full-slate canary.
const lateStarterBody={...starterBody,captured_at:'2027-04-02T01:00:00Z'}; const lateStarter={...lateStarterBody,sha256:crypto.createHash('sha256').update(JSON.stringify(lateStarterBody)).digest('hex')};
fs.writeFileSync('tmp/canary-plan/starter-late.json',JSON.stringify(lateStarter));
let starterFailed=false;
try{execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/board.json','tmp/canary-plan/starter-late.json',frozen,'1','tmp/canary-plan/plan-late-starter.json'],{stdio:'pipe'});}catch(e){starterFailed=String(e.stderr||e.message).includes('STARTER_SNAPSHOT_MUST_EXIST_AT_OR_BEFORE_CANARY_FREEZE');}
if(!starterFailed) throw Error('late starter snapshot did not fail closed at the stricter as-of-freeze boundary');
// Any standard candidate without a verified starter row must fail the entire countable canary rather than receive neutral UNAVAILABLE treatment.
const missingStarterBody={...starterBody,rows:starterRows.filter(r=>r.player_id!==1)}; const missingStarter={...missingStarterBody,sha256:crypto.createHash('sha256').update(JSON.stringify(missingStarterBody)).digest('hex')};
fs.writeFileSync('tmp/canary-plan/starter-missing.json',JSON.stringify(missingStarter));
let missingStarterFailed=false;
try{execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/board.json','tmp/canary-plan/starter-missing.json',frozen,'1','tmp/canary-plan/plan-missing-starter.json'],{stdio:'pipe'});}catch(e){missingStarterFailed=String(e.stderr||e.message).includes('FULL_SLATE_VERIFIED_STARTER_PROVENANCE_REQUIRED');}
if(!missingStarterFailed) throw Error('missing starter provenance did not fail closed');
const doubleheader=JSON.parse(JSON.stringify(board)); doubleheader.rows[1].player_id=doubleheader.rows[0].player_id; fs.writeFileSync('tmp/canary-plan/board-doubleheader.json',JSON.stringify(doubleheader)); let doubleheaderFailed=false; try{execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/board-doubleheader.json','tmp/canary-plan/starter.json',frozen,'1','tmp/canary-plan/plan-doubleheader.json'],{stdio:'pipe'});}catch(e){doubleheaderFailed=String(e.stderr||e.message).includes('FULL_SLATE_DOUBLEHEADER_PLAYER_IDENTITY_UNSUPPORTED_GAMEPK_PLAYER_ID_REQUIRED');} if(!doubleheaderFailed) throw Error('ambiguous doubleheader player identity did not fail closed');
const postBoard={...board,date:'2026-10-01'}; const postStarterBody={...starterBody,date:'2026-10-01'}; const postStarter={...postStarterBody,sha256:crypto.createHash('sha256').update(JSON.stringify(postStarterBody)).digest('hex')}; fs.writeFileSync('tmp/canary-plan/post-board.json',JSON.stringify(postBoard)); fs.writeFileSync('tmp/canary-plan/post-starter.json',JSON.stringify(postStarter)); let postseasonFailed=false; try{execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/post-board.json','tmp/canary-plan/post-starter.json',frozen,'1','tmp/canary-plan/post-plan.json'],{stdio:'pipe'});}catch(e){postseasonFailed=String(e.stderr||e.message).includes('2027 dates only');} if(!postseasonFailed) throw Error('2026 postseason entered regular-season canary plan builder');
const octoberBoard={...board,date:'2027-10-01'}; const octoberStarterBody={...starterBody,date:'2027-10-01'}; const octoberStarter={...octoberStarterBody,sha256:crypto.createHash('sha256').update(JSON.stringify(octoberStarterBody)).digest('hex')}; fs.writeFileSync('tmp/canary-plan/october-board.json',JSON.stringify(octoberBoard)); fs.writeFileSync('tmp/canary-plan/october-starter.json',JSON.stringify(octoberStarter)); let octoberFailed=false; try{execFileSync('node',['scripts/build-v38-canary-execution-plan.mjs','tmp/canary-plan/october-board.json','tmp/canary-plan/october-starter.json',frozen,'1','tmp/canary-plan/october-plan.json'],{stdio:'pipe'});}catch(e){octoberFailed=String(e.stderr||e.message).includes('outside official MLB regular-season window');} if(!octoberFailed) throw Error('2027 postseason date entered regular-season canary plan');
console.log('V38_CANARY_PLAN_BUILDER_TEST_OK');
