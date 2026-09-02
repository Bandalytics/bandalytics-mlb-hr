import fs from'node:fs/promises';
import crypto from'node:crypto';
import{buildNativeFeed}from'../native-feed-core.mjs';

const MLB='https://statsapi.mlb.com';
const MARKET='https://bandalytics-mlb-hr.vercel.app/api/market-native';
const PROTOCOL='V38_CONTEXT_SNAPSHOT_V1';
async function get(url,ms=20000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{headers:{accept:'application/json','user-agent':'BANDALYTICS-v38-context/1'},signal:c.signal});const text=await r.text();if(!r.ok)throw Error(`${url} HTTP ${r.status}: ${text.slice(0,160)}`);return JSON.parse(text)}finally{clearTimeout(t)}}
function etDate(d=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function hasWeather(w={}){return w&&[w.condition,w.temp_f,w.wind].some(v=>v!=null&&String(v).trim()!=='')}
const requested=process.argv[2],date=/^2026-\d\d-\d\d$/.test(String(requested||''))?requested:etDate(),capturedAt=new Date().toISOString(),captureMs=Date.parse(capturedAt);
const [feed,schedule,market]=await Promise.all([
  buildNativeFeed({date,timeoutMs:16000}),
  get(`${MLB}/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=probablePitcher,team`,16000),
  get(`${MARKET}?date=${encodeURIComponent(date)}`,20000).catch(e=>({ok:false,error:e.message,rows:[],research_only:true,scoring_eligible:false}))
]);
const starts=new Map((schedule.dates?.[0]?.games||[]).map(g=>[+g.gamePk,g.gameDate||null]));
const pregameGames=(feed.items||[]).map(g=>({...g,start_time:starts.get(+g.gamePk)||null})).filter(g=>Number.isFinite(Date.parse(g.start_time))&&Date.parse(g.start_time)>captureMs);
const gamePks=new Set(pregameGames.map(g=>+g.gamePk)),matchups=new Set(pregameGames.flatMap(g=>[`${g.away} @ ${g.home}`,`${g.home} @ ${g.away}`]));
const lineupRows=(feed.lineup_players||[]).filter(x=>matchups.has(String(x.matchup||''))).map(x=>({player_id:+x.player_id,player:x.player||null,team:x.team||null,game_matchup:x.matchup||null,lineup:x.lineup??null,opp_pitcher_id:x.opp_pitcher_id??null,opp_pitcher:x.opp_pitcher??null,opp_pitcher_hand:x.opp_pitcher_hand??null,bat_side:x.bat_side??null}));
const marketRows=(market.rows||[]).filter(r=>matchups.has(String(r.matchup||''))).map(r=>({player_id:+r.player_id,player:r.player||null,team:r.team||null,matchup:r.matchup||null,best_book:r.best_book||null,best_odds:r.best_odds??null,open_odds:r.open_odds??null,books_with_open:r.books_with_open??0,signal:r.signal||null,move_pct:r.move_pct??null,identity_status:r.identity_status||null,event_id:r.event_id||null}));
const weatherCovered=pregameGames.filter(g=>hasWeather(g.weather)).length,weatherPct=pregameGames.length?+(100*weatherCovered/pregameGames.length).toFixed(2):0;
const body={context_protocol:PROTOCOL,date,captured_at:capturedAt,capture_timezone:'America/New_York',point_in_time:true,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,rule:'Only games with scheduled start_time strictly after captured_at are included. Later calibration must use the latest snapshot strictly before each game start.',pregame_games:pregameGames.map(g=>({gamePk:+g.gamePk,start_time:g.start_time,away:g.away,home:g.home,awayStarter:g.awayStarter||null,awayStarterId:g.awayStarterId||null,awayStarterHand:g.awayStarterHand||null,homeStarter:g.homeStarter||null,homeStarterId:g.homeStarterId||null,homeStarterHand:g.homeStarterHand||null,awayLineup:g.awayLineup??0,homeLineup:g.homeLineup??0,venue:g.venue||null,weather:g.weather||null,weather_available:hasWeather(g.weather)})),pregame_game_count:gamePks.size,weather_covered_games:weatherCovered,weather_coverage_pct:weatherPct,weather_point_in_time:true,weather_scoring_eligible:false,confirmed_lineups:pregameGames.reduce((n,g)=>n+(g.awayLineup>=9?1:0)+(g.homeLineup>=9?1:0),0),lineup_rows:lineupRows,market_ok:market.ok===true,market_rows:marketRows,market_exact_rows:marketRows.filter(r=>r.identity_status==='EXACT').length,market_error:market.ok===true?null:(market.error||'MARKET_UNAVAILABLE')};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'),out={...body,sha256};
await fs.mkdir('snapshots',{recursive:true});const path=`snapshots/v38-context-${date}-${capturedAt.replaceAll(':','').replaceAll('.','')}.json`;await fs.writeFile(path,JSON.stringify(out,null,2)+'\n');
console.log(`V38_CONTEXT_PATH=${path}`);console.log(`V38_CONTEXT_SUMMARY=${JSON.stringify({date,captured_at:capturedAt,pregame_games:out.pregame_game_count,weather_covered_games:out.weather_covered_games,weather_coverage_pct:out.weather_coverage_pct,confirmed_lineups:out.confirmed_lineups,lineup_rows:lineupRows.length,market_ok:out.market_ok,market_rows:marketRows.length,sha256})}`);
