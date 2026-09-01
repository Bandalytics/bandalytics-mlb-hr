import {simulateSlate} from '../sim-auto-core.mjs';
import {simulateLineup} from '../sim-player-core.mjs';
import {loadBaseContext,hydrateGameStats,hydrateGameStatsAsOf,hydrateHitters,hydrateHittersAsOf} from '../sim-data-core.mjs';
const parkHr=(rows,venue)=>{const x=(rows||[]).find(r=>String(r.venue||'').toLowerCase()===String(venue||'').toLowerCase());if(!x)return 1;const c=+x.current?.hr_factor||100,r=+x.rolling3?.hr_factor||c;return Math.max(.70,Math.min(1.35,(.35*c+.65*r)/100))};
export default async function handler(req,res){
 try{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'GET required'})}
  const date=String(req.query?.date||new Date().toISOString().slice(0,10)),sims=Math.max(3000,Math.min(25000,+req.query?.sims||6000)),warnings=[],historical=String(req.query?.historical||'0')==='1';
  const {feed,bullpen,park,weather}=await loadBaseContext(date);
  const gameStats=historical?await hydrateGameStatsAsOf(feed,date,warnings):await hydrateGameStats(feed,warnings);
  const hitterHydration=historical?await hydrateHittersAsOf(feed,date,warnings):await hydrateHitters(feed,date,warnings);
  const {pitcherStats,teamStats}=gameStats,{hitterIds,hitterStats,bbeStats}=hitterHydration;
  const slate=simulateSlate({feed,bullpen,park,weather,pitcherStats,teamStats,sims:Math.max(5000,sims),includeLive:String(req.query?.includeLive||'0')==='1'});
  const games=slate.games.map(g=>{const raw=(feed.items||[]).find(x=>+x.gamePk===+g.gamePk)||{},awayPlayers=(feed.lineup_players||[]).filter(p=>p.team===g.away),homePlayers=(feed.lineup_players||[]).filter(p=>p.team===g.home),awayMu=g.estimates.away.expectedRuns,homeMu=g.estimates.home.expectedRuns,hrf=parkHr(park.items,g.venue);return{gamePk:g.gamePk,away:g.away,home:g.home,expectedRuns:{away:awayMu,home:homeMu},parkHrFactor:hrf,awayPlayers:simulateLineup({players:awayPlayers,hitterStats,bbeStats,teamExpectedRuns:awayMu,opponentStarter:pitcherStats.get(+raw.homeStarterId)||{},parkHrFactor:hrf,sims}),homePlayers:simulateLineup({players:homePlayers,hitterStats,bbeStats,teamExpectedRuns:homeMu,opponentStarter:pitcherStats.get(+raw.awayStarterId)||{},parkHrFactor:hrf,sims})}});
  return res.status(200).json({ok:true,date,sims,engine:'BANDALYTICS_PLAYER_SIM_V1',research_only:true,calibrated:false,historicalMode:historical,asOfDate:historical?date:null,strictHistoricalInputs:historical,coverage:{games:games.length,hitterStats:hitterStats.size,hitterSlots:hitterIds.length,bbeStats:bbeStats.size,starterStats:pitcherStats.size},warnings,games});
 }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}
}
