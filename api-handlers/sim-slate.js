import {simulateSlate} from '../sim-auto-core.mjs';
import {loadBaseContext,hydrateGameStats} from '../sim-data-core.mjs';
const ymd=()=>new Date().toISOString().slice(0,10);
export default async function handler(req,res){
 try{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'GET required'})}
  const date=String(req.query?.date||ymd()),sims=Math.max(5000,Math.min(100000,Number(req.query?.sims)||30000));
  if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'invalid date'});
  const {feed,bullpen,park,weather}=await loadBaseContext(date),statsWarnings=[],{pitcherStats,teamStats}=await hydrateGameStats(feed,statsWarnings);
  const out=simulateSlate({feed,bullpen,park,weather,pitcherStats,teamStats,sims,includeLive:String(req.query?.includeLive||'0')==='1'});
  return res.status(200).json({...out,statsWarnings,coverage:{feedGames:feed.games||0,lineups:feed.lineups||0,starterStats:pitcherStats.size,teamStats:teamStats.size,bullpenTeams:(bullpen.items||[]).length,parkRows:(park.items||[]).length,weatherGames:(weather.items||[]).length}});
 }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}
}
