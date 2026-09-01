import {evalMarket,evalCrossGameParlay} from '../market-eval-core.mjs';
export default async function handler(req,res){
 try{
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,error:'POST required'})}
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{}),markets=Array.isArray(body.markets)?body.markets:[];
  const rows=markets.map(evalMarket).sort((a,b)=>b.evPerUnit-a.evPerUnit);
  const parlay=Array.isArray(body.parlay?.legs)?evalCrossGameParlay(body.parlay.legs,body.parlay.offeredOdds):null;
  return res.status(200).json({ok:true,research_only:true,calibrated:false,count:rows.length,markets:rows,parlay,warning:parlay?'Cross-game parlay calculation assumes independence. Same-game correlations require joint simulation.':null});
 }catch(e){return res.status(400).json({ok:false,error:String(e?.message||e)})}
}
