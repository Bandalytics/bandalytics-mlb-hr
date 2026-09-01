import {simulateSlate,bullpenSnapshot} from '../sim-auto-core.mjs';
import {loadBaseContext,hydrateGameStats,hydrateHitters} from '../sim-data-core.mjs';
import {simulateJointPlayerSelections} from '../sim-joint-player-core.mjs';
const norm=t=>String(t||'').toUpperCase()==='ARI'?'AZ':String(t||'').toUpperCase()==='OAK'?'ATH':String(t||'').toUpperCase();
const parkHr=(rows,venue)=>{const x=(rows||[]).find(r=>String(r.venue||'').toLowerCase()===String(venue||'').toLowerCase());if(!x)return 1;const c=+x.current?.hr_factor||100,r=+x.rolling3?.hr_factor||c;return Math.max(.70,Math.min(1.35,(.35*c+.65*r)/100))};
export default async function handler(req,res){
 try{
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'POST required'})}
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),date=String(body.date||''),gamePk=+body.gamePk,selections=Array.isArray(body.selections)?body.selections:[],sims=Math.max(5000,Math.min(100000,+body.sims||30000));
  if(!/^20\d\d-\d\d-\d\d$/.test(date)||!Number.isInteger(gamePk)||!selections.length)return res.status(400).json({ok:false,error:'date, gamePk and selections required'});
  const warnings=[],{feed,bullpen,park,weather}=await loadBaseContext(date),raw=(feed.items||[]).find(g=>+g.gamePk===gamePk);if(!raw)return res.status(404).json({ok:false,error:'game not found'});
  const {pitcherStats,teamStats}=await hydrateGameStats(feed,warnings),{hitterStats,bbeStats}=await hydrateHitters(feed,date,warnings),slate=simulateSlate({feed,bullpen,park,weather,pitcherStats,teamStats,sims:5000,includeLive:true}),sg=slate.games.find(g=>+g.gamePk===gamePk);if(!sg)return res.status(404).json({ok:false,error:'sim game unavailable'});
  const hrf=parkHr(park.items,sg.venue),contexts=new Map();
  for(const p of (feed.lineup_players||[]).filter(p=>norm(p.team)===norm(sg.away)||norm(p.team)===norm(sg.home))){const isAway=norm(p.team)===norm(sg.away);contexts.set(+p.player_id,{player:p,stats:hitterStats.get(+p.player_id),bbe:bbeStats.get(+p.player_id)||null,teamExpectedRuns:isAway?sg.estimates.away.expectedRuns:sg.estimates.home.expectedRuns,starter:pitcherStats.get(+(isAway?raw.homeStarterId:raw.awayStarterId))||{},parkHrFactor:hrf})}
  const result=simulateJointPlayerSelections({selections,playerContexts:contexts,sims});
  return res.status(result.ok?200:400).json({...result,date,gamePk,away:sg.away,home:sg.home,warnings,warning:'Joint player probabilities use a research shared team/game offensive-shock model. They are not calibrated SGP prices and do not clear the betting gate.'});
 }catch(e){return res.status(500).json({ok:false,error:String(e?.message||e)})}
}
