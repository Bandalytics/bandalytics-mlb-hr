import {simulateSlate} from '../sim-auto-core.mjs';
import {loadBaseContext,hydrateGameStatsAsOf,loadScheduleResults} from '../sim-data-core.mjs';
import {calibrationSummary,aggregateCalibration} from '../sim-calibration-core.mjs';

const DATE_RE=/^20\d\d-\d\d-\d\d$/;
function addDays(date,delta){const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)}
async function runDay(date,sims){
 try{
  const {feed,bullpen,park,weather}=await loadBaseContext(date),warnings=[];
  const {pitcherStats,teamStats}=await hydrateGameStatsAsOf(feed,date,warnings),actuals=await loadScheduleResults(date);
  const slate=simulateSlate({feed,bullpen,park,weather,pitcherStats,teamStats,sims,includeLive:true,historicalSafe:true,includeScoreGrid:true});
  const summary=calibrationSummary(slate.games,actuals,{date});
  const coverage={starters:pitcherStats.size,teams:teamStats.size,games:slate.games.length,actuals:actuals.length};
  const strictReady=coverage.games>0&&coverage.actuals===coverage.games&&coverage.starters>0&&coverage.teams>0&&!warnings.some(w=>String(w).startsWith('asof_'));
  return {ok:true,date,strictReady,coverage,warnings,summary};
 }catch(e){return {ok:false,date,strictReady:false,error:String(e?.message||e),warnings:[],summary:{rows:[],games:0}}}
}

export default async function handler(req,res){
 try{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'GET required'})}
  const end=String(req.query?.end||req.query?.date||''),days=Math.max(2,Math.min(14,+req.query?.days||7)),sims=Math.max(5000,Math.min(25000,+req.query?.sims||7500));
  if(!DATE_RE.test(end))return res.status(400).json({ok:false,error:'end=YYYY-MM-DD required'});
  const dates=Array.from({length:days},(_,i)=>addDays(end,i-(days-1))),results=[];
  for(const date of dates)results.push(await runDay(date,sims));
  const aggregate=aggregateCalibration(results);
  const strictReady=results.length===days&&results.every(d=>d.ok&&d.strictReady);
  return res.status(200).json({ok:true,engine:'BANDALYTICS_CALIBRATION_RANGE_ASOF_V1',research_only:true,actionable:false,end,days,sims,strictReady,results,aggregate,notes:'Range calibration uses as-of-date starter/team stats. Historical lineup ISO and park scoring stay neutral until strict historical snapshots exist. No betting edge gate is cleared by this endpoint.'});
 }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}
}
