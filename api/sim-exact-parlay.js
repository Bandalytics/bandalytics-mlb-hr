import {buildGameMatchup,bullpenSnapshot} from '../sim-auto-core.mjs';
import {runBandalyticsSim} from '../sim-core.mjs';
import {loadBaseContext,hydrateGameStats} from '../sim-data-core.mjs';
import {evalCrossGameParlay} from '../market-eval-core.mjs';
const norm=t=>String(t||'').toUpperCase()==='ARI'?'AZ':String(t||'').toUpperCase()==='OAK'?'ATH':String(t||'').toUpperCase();
export default async function handler(req,res){
 try{
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'POST required'})}
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),date=String(body.date||new Date().toISOString().slice(0,10)),sels=Array.isArray(body.selections)?body.selections:[],sims=Math.max(20000,Math.min(250000,+body.sims||100000));
  if(!sels.length)return res.status(400).json({ok:false,error:'selections required'});const ids=sels.map(x=>+x.gamePk);if(new Set(ids).size!==ids.length)return res.status(400).json({ok:false,error:'one exact-score selection per game; same-game combinations require joint-event logic'});
  const {feed,bullpen,park,weather}=await loadBaseContext(date),warnings=[],{pitcherStats,teamStats}=await hydrateGameStats(feed,warnings),bp=new Map((bullpen.items||[]).map(x=>[norm(x.team),bullpenSnapshot(x)])),wx=new Map((weather.items||[]).map(x=>[+x.gamePk,x]));
  const legs=[];
  for(const s of sels){const g=(feed.items||[]).find(x=>+x.gamePk===+s.gamePk);if(!g)return res.status(404).json({ok:false,error:`gamePk ${s.gamePk} not found`});const matchup=buildGameMatchup({game:g,feed,bulpenByTeam:bp,parkItems:park.items||[],weatherByGame:wx,pitcherStats,teamStats,sims});matchup.includeScoreGrid=true;matchup.scoreGridMax=Math.max(12,+s.awayRuns,+s.homeRuns);const {estimates,sim}=runBandalyticsSim(matchup),key=`${+s.awayRuns}-${+s.homeRuns}`,cell=sim.scoreGrid?.[key]||{probability:0,pct:0,fairAmerican:null};legs.push({gamePk:+g.gamePk,away:g.away,home:g.home,selection:`${g.away} ${+s.awayRuns} – ${g.home} ${+s.homeRuns}`,modelProb:cell.probability,modelPct:cell.pct,fairAmerican:cell.fairAmerican,expectedRuns:{away:estimates.away.expectedRuns,home:estimates.home.expectedRuns},bookOdds:Number.isFinite(+s.bookOdds)?+s.bookOdds:null})}
  const parlay=evalCrossGameParlay(legs,Number.isFinite(+body.offeredParlayOdds)?+body.offeredParlayOdds:null);
  return res.status(200).json({ok:true,date,sims,research_only:true,calibrated:false,warnings,legs,parlay,warning:'Cross-game exact-score probabilities are multiplied under an independence assumption. Calibration must pass before treating fair odds as actionable.'});
 }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}
}
