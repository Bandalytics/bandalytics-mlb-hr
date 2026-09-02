import fs from'node:fs/promises';
import crypto from'node:crypto';
import{normalizeV38Candidate,V38_PROFILE_CANDIDATE}from'../profile-v38-candidate.mjs';

const MLB='https://statsapi.mlb.com',PROFILE='https://bandalytics-native-profile.vercel.app';
const SNAPSHOT_PROTOCOL='V38_PREGAME_SNAPSHOT_V1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uniq=a=>[...new Set(a)];
const finite=v=>v!==null&&v!==''&&Number.isFinite(+v);
export const profileComplete=x=>[x.ev,x.hh,x.barrel,x.iso,x.sweet,x.pullair,x.blast].every(finite);
async function get(url,ms=20000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{headers:{accept:'application/json','user-agent':'BANDALYTICS-v38-snapshot/2'},signal:c.signal});const text=await r.text();if(!r.ok)throw Error(`${url} HTTP ${r.status}: ${text.slice(0,160)}`);return JSON.parse(text)}finally{clearTimeout(t)}}
function etDate(d=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function chunks(a,n){const o=[];for(let i=0;i<a.length;i+=n)o.push(a.slice(i,i+n));return o}
async function teamRoster(teamId,date){try{const z=await get(`${MLB}/api/v1/teams/${teamId}/roster?rosterType=active&date=${date}`);return(z.roster||[]).filter(x=>!['P','SP','RP'].includes(String(x.position?.abbreviation||''))).map(x=>({player_id:+x.person?.id,player:x.person?.fullName||null,team_id:+teamId,position:x.position?.abbreviation||null})).filter(x=>Number.isInteger(x.player_id))}catch(e){return[]}}
async function profileBatch(ids){const q=ids.join(','),[bulk,pull]=await Promise.all([get(`${PROFILE}/api/bulk?ids=${q}&year=2026`,30000),get(`${PROFILE}/api/pull-air?ids=${q}&year=2026`,30000)]),bm=new Map((bulk.items||[]).map(x=>[+x.player_id,x])),pm=new Map((pull.items||[]).map(x=>[+x.player_id,x]));return ids.map(id=>normalizeV38Candidate({bulk:bm.get(id)||{player_id:id},pullair:pm.get(id)||{player_id:id}}))}

const requested=process.argv[2],date=/^2026-\d\d-\d\d$/.test(String(requested||''))?requested:etDate();
const capturedAt=new Date().toISOString();
const schedule=await get(`${MLB}/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=team`),games=(schedule.dates?.[0]?.games||[]).map(g=>({gamePk:+g.gamePk,start_time:g.gameDate||null,status:g.status?.detailedState||null,away_team_id:+g.teams?.away?.team?.id,away:g.teams?.away?.team?.abbreviation||g.teams?.away?.team?.name||null,home_team_id:+g.teams?.home?.team?.id,home:g.teams?.home?.team?.abbreviation||g.teams?.home?.team?.name||null})).filter(g=>g.gamePk);
const captureMs=Date.parse(capturedAt),pregameGames=games.filter(g=>Number.isFinite(Date.parse(g.start_time))&&Date.parse(g.start_time)>captureMs),excludedStarted=games.filter(g=>!pregameGames.some(x=>x.gamePk===g.gamePk));
const teamIds=uniq(pregameGames.flatMap(g=>[g.away_team_id,g.home_team_id]).filter(Number.isInteger)),rosters=(await Promise.all(teamIds.map(id=>teamRoster(id,date)))).flat(),players=new Map();for(const x of rosters)if(!players.has(x.player_id))players.set(x.player_id,x);
const ids=[...players.keys()],profiles=[];for(const batch of chunks(ids,15)){let done=false,last=null;for(let attempt=1;attempt<=3&&!done;attempt++){try{profiles.push(...await profileBatch(batch));done=true}catch(e){last=e;await sleep(500*attempt)}}if(!done)throw last||Error('profile batch failed');await sleep(250)}
const pm=new Map(profiles.map(x=>[x.player_id,x])),items=[...players.values()].map(x=>({...x,...(pm.get(x.player_id)||{player_id:x.player_id}),snapshot_protocol:SNAPSHOT_PROTOCOL}));
const body={snapshot_protocol:SNAPSHOT_PROTOCOL,candidate_model:'v38',candidate_status:V38_PROFILE_CANDIDATE.status,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,point_in_time:true,date,captured_at:capturedAt,capture_timezone:'America/New_York',rule:'Only games with scheduled start_time strictly after captured_at are eligible for this snapshot.',games_total:games.length,pregame_games:pregameGames,excluded_started_games:excludedStarted.map(g=>({gamePk:g.gamePk,start_time:g.start_time,status:g.status,away:g.away,home:g.home})),team_count:teamIds.length,player_count:items.length,profile_complete:items.filter(profileComplete).length,profile_incomplete:items.filter(x=>!profileComplete(x)).length,semantics:V38_PROFILE_CANDIDATE.fields,items};
const digest=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'),out={...body,sha256:digest};
await fs.mkdir('snapshots',{recursive:true});const path=`snapshots/v38-pregame-${date}-${capturedAt.replaceAll(':','').replaceAll('.','')}.json`;await fs.writeFile(path,JSON.stringify(out,null,2)+'\n');
console.log(`V38_SNAPSHOT_PATH=${path}`);console.log(`V38_SNAPSHOT_SUMMARY=${JSON.stringify({date,captured_at:capturedAt,games_total:games.length,pregame_games:pregameGames.length,excluded_started_games:excludedStarted.length,team_count:teamIds.length,player_count:items.length,profile_complete:out.profile_complete,profile_incomplete:out.profile_incomplete,sha256:digest})}`);
