import {runBandalyticsSim,simulateGame} from '../sim-core.mjs';
const num=(x,d)=>Number.isFinite(+x)?+x:d;
export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS'){res.setHeader('Allow','GET, POST, OPTIONS');return res.status(204).end()}
    let payload={};
    if(req.method==='POST') payload=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    else if(req.method==='GET'){
      const q=req.query||{};
      if(q.awayExpectedRuns!=null||q.homeExpectedRuns!=null){
        const sim=simulateGame({away:q.away||'AWAY',home:q.home||'HOME',awayExpectedRuns:num(q.awayExpectedRuns,4.2),homeExpectedRuns:num(q.homeExpectedRuns,4.6),sims:num(q.sims,100000)});
        return res.status(200).json({ok:true,mode:'direct-means',sim});
      }
      payload={awayCode:q.away||'AWAY',homeCode:q.home||'HOME',sims:num(q.sims,50000)};
    } else {res.setHeader('Allow','GET, POST, OPTIONS');return res.status(405).json({ok:false,error:'method_not_allowed'})}
    const out=runBandalyticsSim(payload);
    return res.status(200).json({ok:true,mode:'matchup-inputs',...out});
  }catch(e){return res.status(400).json({ok:false,error:String(e?.message||e)})}
}
