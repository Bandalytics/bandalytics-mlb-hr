import crypto from'node:crypto';
import{validProfileSnapshot,selectLatestValidProfileSnapshot,V38_PROFILE_SNAPSHOT_PROTOCOL}from'./v38-profile-snapshot-selector.mjs';

function sign(body){return{...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')}}
function base(captured='2026-09-03T14:00:00.000Z'){return sign({snapshot_protocol:V38_PROFILE_SNAPSHOT_PROTOCOL,date:'2026-09-03',captured_at:captured,point_in_time:true,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,pregame_games:[{gamePk:1,start_time:'2026-09-03T18:00:00.000Z'}],excluded_started_games:[],items:[{player_id:1}]})}

const old=base('2026-09-03T14:00:00.000Z'),latest=base('2026-09-03T15:00:00.000Z');
if(!validProfileSnapshot(old,{date:'2026-09-03'}))throw Error('valid signed snapshot rejected');
if(selectLatestValidProfileSnapshot([old,latest],{date:'2026-09-03'})?.captured_at!==latest.captured_at)throw Error('latest valid snapshot not selected');
const tampered=structuredClone(latest);tampered.items.push({player_id:2});
if(validProfileSnapshot(tampered,{date:'2026-09-03'}))throw Error('tampered snapshot accepted');
const late=base('2026-09-03T19:00:00.000Z');
if(validProfileSnapshot(late,{date:'2026-09-03'}))throw Error('snapshot containing already-started game accepted');
const wrongDate=base();
if(validProfileSnapshot(wrongDate,{date:'2026-09-04'}))throw Error('wrong-date snapshot accepted');
console.log('V38_PROFILE_SNAPSHOT_SELECTOR_PASS');
