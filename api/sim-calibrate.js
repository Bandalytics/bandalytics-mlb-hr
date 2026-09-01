import {simulateSlate} from '../sim-auto-core.mjs';
import {loadBaseContext,hydrateGameStatsAsOf,loadScheduleResults} from '../sim-data-core.mjs';
import {calibrationSummary} from '../sim-calibration-core.mjs';
export default async function handler(req,res){
 try{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'GET required'})}
  const date=String(req.query?.date||''),sims=Math.max(5000,Math.min(50000,+req.query?.sims||10000));if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'date=YYYY-MM-DD required'});
  const {feed,bullpen,park,weather}=await loadBaseContext(date),warnings=[],{pitcherStats,teamStats}=await hydrateGameStatsAsOf(feed,date,warnings),actuals=await loadScheduleResults(date);
  const slate=simulateSlate({feed,bullpen,park,weather,pitcherStats,teamStats,sims,includeLive:true,historicalSafe:true,includeScoreGrid:true}),summary=calibrationSummary(slate.games,actuals);
  const coverage={starters: [...pitcherStats.keys()].length,teams:[...teamStats.keys()].length,games:slate.games.length,actuals:actuals.length};
  const strictReady=coverage.games>0&&coverage.actuals===coverage.games&&coverage.starters>0&&coverage.teams>0&&!warnings.some(w=>String(w).startsWith('asof_'));
  return res.status(200).json({ok:true,date,sims,engine:'BANDALYTICS_CALIBRATION_ASOF_V2',research_only:true,asOfStats:true,historicalSafe:true,strictReady,coverage,warnings,notes:'Historical scoring neutralizes lineup ISO and park-factor scoring until those inputs have strict as-of-date snapshots. Bullpen workload remains date-relative.',summary});
 }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}
}
