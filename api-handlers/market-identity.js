import {resolveMarketIdentities} from '../identity-resolver.mjs';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'POST only',research_only:true,scoring_enabled:false});
  try{
    const body=req.body||{},date=String(body.date||''),market=Array.isArray(body.market)?body.market.slice(0,500):[];
    if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({error:'date required',research_only:true,scoring_enabled:false});
    if(!market.length)return res.status(400).json({error:'market rows required',research_only:true,scoring_enabled:false});
    const out=await resolveMarketIdentities(market,{date,fetcher:fetch});
    return res.status(200).json({ok:true,research_only:true,scoring_enabled:false,model_scoring_changed:false,date,resolved_count:out.resolved.length,unresolved_count:out.unresolved.length,resolved:out.resolved,unresolved:out.unresolved,roster_unavailable:out.roster_unavailable});
  }catch(e){return res.status(502).json({ok:false,research_only:true,scoring_enabled:false,error:e?.message||String(e)})}
}
