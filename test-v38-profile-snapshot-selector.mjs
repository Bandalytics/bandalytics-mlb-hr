import crypto from'node:crypto';
import{validProfileSnapshot,selectLatestValidProfileSnapshot,selectCanonicalPostgameProfileSnapshot,V38_PROFILE_SNAPSHOT_PROTOCOL,V38_POSTGAME_PROFILE_SELECTION}from'./v38-profile-snapshot-selector.mjs';

function sign(body){return{...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')}}
function snap({captured='2026-09-03T14:00:00.000Z',gameCount=1,gamesTotal=gameCount,excludedCount=0,profileComplete=1}={}){const starts=Array.from({length:gameCount},(_,i)=>({gamePk:i+1,start_time:'2026-09-03T23:00:00.000Z'})),excluded=Array.from({length:excludedCount},(_,i)=>({gamePk:100+i,start_time:'2026-09-03T13:00:00.000Z'}));return sign({snapshot_protocol:V38_PROFILE_SNAPSHOT_PROTOCOL,date:'2026-09-03',captured_at:captured,point_in_time:true,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,games_total:gamesTotal,pregame_games:starts,excluded_started_games:excluded,profile_complete:profileComplete,items:[{player_id:1}]})}
const old=snap({captured:'2026-09-03T14:00:00.000Z'}),latest=snap({captured:'2026-09-03T15:00:00.000Z'});
if(!validProfileSnapshot(old,{date:'2026-09-03'}))throw Error('valid signed snapshot rejected');
if(selectLatestValidProfileSnapshot([old,latest],{date:'2026-09-03'})?.captured_at!==latest.captured_at)throw Error('latest valid snapshot not selected');
const fullEarly=snap({captured:'2026-09-03T14:11:00.000Z',gameCount:9,profileComplete:260}),shrunkLate=snap({captured:'2026-09-03T20:00:00.000Z',gameCount:7,gamesTotal:9,excludedCount:2,profileComplete:280});
if(selectCanonicalPostgameProfileSnapshot([shrunkLate,fullEarly],{date:'2026-09-03'})?.sha256!==fullEarly.sha256)throw Error('postgame selector preferred partial later slate');
if(selectCanonicalPostgameProfileSnapshot([shrunkLate],{date:'2026-09-03'})!==null)throw Error('postgame selector accepted a slate after games had started');
const malformedCardinality=snap({captured:'2026-09-03T14:12:00.000Z',gameCount:8,gamesTotal:9,excludedCount:0,profileComplete:275});
if(selectCanonicalPostgameProfileSnapshot([malformedCardinality],{date:'2026-09-03'})!==null)throw Error('postgame selector accepted zero-excluded snapshot missing a slate game');
const fullLow=snap({captured:'2026-09-03T14:20:00.000Z',gameCount:9,profileComplete:250}),fullHigh=snap({captured:'2026-09-03T14:15:00.000Z',gameCount:9,profileComplete:270});
if(selectCanonicalPostgameProfileSnapshot([fullLow,fullHigh],{date:'2026-09-03'})?.sha256!==fullHigh.sha256)throw Error('postgame selector did not prefer more complete profile capture within full slate');
const fullHighLater=snap({captured:'2026-09-03T14:30:00.000Z',gameCount:9,profileComplete:270});
if(selectCanonicalPostgameProfileSnapshot([fullHigh,fullHighLater],{date:'2026-09-03'})?.sha256!==fullHighLater.sha256)throw Error('postgame selector did not use latest equally complete full-slate capture');
const tampered=structuredClone(latest);tampered.items.push({player_id:2});if(validProfileSnapshot(tampered,{date:'2026-09-03'}))throw Error('tampered snapshot accepted');
const late=snap({captured:'2026-09-04T00:00:00.000Z'});if(validProfileSnapshot(late,{date:'2026-09-03'}))throw Error('snapshot containing already-started game accepted');
const wrongDate=snap();if(validProfileSnapshot(wrongDate,{date:'2026-09-04'}))throw Error('wrong-date snapshot accepted');
if(V38_POSTGAME_PROFILE_SELECTION.selection_rule!=='require games_total equals verified pregame game count with zero excluded started games; then maximize verified pregame game count; then profile_complete; then latest captured_at')throw Error('postgame selection rule drift');
if(V38_POSTGAME_PROFILE_SELECTION.requires_full_slate_pregame!==true)throw Error('full-slate requirement drift');
console.log('V38_PROFILE_SNAPSHOT_SELECTOR_PASS');
