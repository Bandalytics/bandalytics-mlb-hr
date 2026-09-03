import fs from'node:fs/promises';
import crypto from'node:crypto';
import{buildNativeFeed}from'../native-feed-core.mjs';
import{buildSavantBbeUrl,summarizeBbeCsv}from'../bbe-core.mjs';
import{fetchText}from'../starter-native-core.mjs';

const MLB='https://statsapi.mlb.com';
function etDate(d=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function chunks(a,n){const out=[];for(let i=0;i<a.length;i+=n)out.push(a.slice(i,i+n));return out}
function q(a,p){const s=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!s.length)return null;const pos=(s.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos);return +(s[lo]+(s[hi]-s[lo])*(pos-lo)).toFixed(2)}
async function get(url,ms=16000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{headers:{accept:'application/json','user-agent':'BANDALYTICS-v38-bbe/2'},signal:c.signal});if(!r.ok)throw Error(`MLB HTTP ${r.status}`);return await r.json()}finally{clearTimeout(t)}}
const captured_at=new Date().toISOString(),requested=process.argv[2],date=/^2026-\d\d-\d\d$/.test(String(requested||''))?requested:etDate(),liveProspective=date===etDate(),feed=await buildNativeFeed({date,timeoutMs:16000});let allowedMatchups=null,pregame_game_pks=[];if(liveProspective){const schedule=await get(`${MLB}/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=team`),now=Date.parse(captured_at),games=(schedule.dates?.[0]?.games||[]).filter(g=>Number.isFinite(Date.parse(g.gameDate))&&Date.parse(g.gameDate)>now);pregame_game_pks=games.map(g=>+g.gamePk);allowedMatchups=new Set(games.flatMap(g=>{const a=feed.items.find(x=>+x.gamePk===+g.gamePk);return a?[`${a.away} @ ${a.home}`,`${a.home} @ ${a.away}`]:[]}))}
const lineups=(feed.lineup_players||[]).filter(x=>Number.isInteger(+x.player_id)).filter(x=>!allowedMatchups||allowedMatchups.has(String(x.matchup||'')));
const byId=new Map(lineups.map(x=>[+x.player_id,x])),summaries=[];
for(const batch of chunks([...byId.keys()],20)){
  try{
    const{url}=buildSavantBbeUrl({ids:batch,date}),csv=await fetchText(url,{timeoutMs:25000}),z=summarizeBbeCsv(csv,{ids:batch,date});
    for(const x of z){const p=byId.get(+x.player_id)||{};summaries.push({...x,player:p.player||null,team:p.team||null,lineup:p.lineup??null,matchup:p.matchup||null})}
  }catch(e){
    for(const id of batch){const p=byId.get(id)||{};summaries.push({player_id:id,player:p.player||null,team:p.team||null,lineup:p.lineup??null,matchup:p.matchup||null,tracked_bbe:0,bbe:null,error:e.message})}
  }
}
const usable=summaries.filter(x=>x.bbe&&x.tracked_bbe>0),full=summaries.filter(x=>x.bbe&&x.tracked_bbe>=15),metrics=['contact','hrshape','hrq','near','ev95','ev100','ev105','pulledAir','trendDelta','newestHR','priorHR','maxEV','maxDist'];
const quantiles=Object.fromEntries(metrics.map(m=>[m,{p10:q(usable.map(x=>+x.bbe?.[m]),.1),p25:q(usable.map(x=>+x.bbe?.[m]),.25),p50:q(usable.map(x=>+x.bbe?.[m]),.5),p75:q(usable.map(x=>+x.bbe?.[m]),.75),p90:q(usable.map(x=>+x.bbe?.[m]),.9)}]));
const trends=usable.reduce((o,x)=>{const k=x.bbe.trend||'UNKNOWN';o[k]=(o[k]||0)+1;return o},{}),body={protocol:'V38_RECENT_BBE_DISTRIBUTION_V1',date,captured_at,capture_mode:'AS_OF_RECONSTRUCTABLE',prospective_pregame_only:liveProspective,pregame_game_pks,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,as_of_verified:true,as_of_rule:'Recent BBE query excludes same-day events and includes the prior day, validated on 2026-09-02.',lineup_rows:lineups.length,summary_rows:summaries.length,usable_rows:usable.length,full_15_bbe_rows:full.length,trend_counts:trends,quantiles,top_hrshape:[...usable].sort((a,b)=>(b.bbe?.hrshape||0)-(a.bbe?.hrshape||0)).slice(0,25).map(x=>({player_id:x.player_id,player:x.player,team:x.team,tracked_bbe:x.tracked_bbe,...x.bbe})),rows:summaries};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'),out={...body,sha256};
await fs.mkdir('snapshots',{recursive:true});const stamp=captured_at.replaceAll(':','').replaceAll('.',''),path=liveProspective?`snapshots/v38-recent-bbe-${date}-${stamp}.json`:`snapshots/v38-recent-bbe-${date}.json`;await fs.writeFile(path,JSON.stringify(out,null,2)+'\n');console.log(`V38_BBE_PATH=${path}`);console.log(`V38_BBE_SUMMARY=${JSON.stringify({date,captured_at:out.captured_at,capture_mode:out.capture_mode,prospective_pregame_only:out.prospective_pregame_only,pregame_games:out.pregame_game_pks.length,lineup_rows:out.lineup_rows,usable_rows:out.usable_rows,full_15_bbe_rows:out.full_15_bbe_rows,trend_counts:out.trend_counts,quantiles:out.quantiles,top_hrshape:out.top_hrshape.slice(0,10),sha256:out.sha256})}`);