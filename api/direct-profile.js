import {buildSavantProfileUrl,summarizeSavantCsv,profileBatchPlan,profileParityState} from '../profile-api.mjs';

async function fetchText(url,timeoutMs=12000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),timeoutMs);
  try{
    const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','accept':'text/csv,*/*'},signal:c.signal});
    if(!r.ok)throw Error('Baseball Savant profile HTTP '+r.status);
    return await r.text();
  }finally{clearTimeout(t)}
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'POST only',research_only:true,scoring_enabled:false});
  try{
    const body=req.body||{},entities=Array.isArray(body.entities)?body.entities:[],end=String(body.end||body.date||'');
    if(!/^20\d\d-\d\d-\d\d$/.test(end))return res.status(400).json({error:'end/date required',research_only:true,scoring_enabled:false});
    if(!entities.length)return res.status(400).json({error:'entities required',research_only:true,scoring_enabled:false});
    if(entities.length>300)return res.status(400).json({error:'too many entities',research_only:true,scoring_enabled:false});
    const invalid=entities.filter(x=>!Number.isInteger(Number(x?.player_id))||Number(x.player_id)<=0||!x.player||!x.team);
    if(invalid.length)return res.status(422).json({error:'RESEARCH IDENTITY — every profile entity requires player + team + MLBAM player_id',research_only:true,scoring_enabled:false});
    const items=[],batches=profileBatchPlan(entities,20);
    for(const batch of batches){
      const url=buildSavantProfileUrl({playerIds:batch.map(x=>x.player_id),start:body.start||`${end.slice(0,4)}-03-01`,end,season:+end.slice(0,4)});
      const csv=await fetchText(url,+body.timeout_ms||12000);items.push(...summarizeSavantCsv(csv,batch));
    }
    const parity=items.map(x=>({...x,parity:profileParityState(x)}));
    return res.status(200).json({ok:true,research_only:true,scoring_enabled:false,model_scoring_changed:false,end,requested:entities.length,returned:parity.length,batches:batches.length,items:parity,pending_fields:['pullair','blast']});
  }catch(e){return res.status(502).json({ok:false,research_only:true,scoring_enabled:false,error:e?.name==='AbortError'?'Baseball Savant timeout':(e?.message||String(e))})}
}
