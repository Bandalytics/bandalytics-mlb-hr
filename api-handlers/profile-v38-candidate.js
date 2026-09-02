import{normalizeV38Candidate,V38_PROFILE_CANDIDATE}from'../profile-v38-candidate.mjs';
const ORIGIN='https://bandalytics-native-profile.vercel.app';
async function get(url,timeoutMs=12000){const c=new AbortController(),t=setTimeout(()=>c.abort(),timeoutMs);try{const r=await fetch(url,{headers:{accept:'application/json','user-agent':'BANDALYTICS-v38-research'},signal:c.signal});const text=await r.text();if(!r.ok)throw Error(`native profile HTTP ${r.status}: ${text.slice(0,120)}`);return JSON.parse(text)}finally{clearTimeout(t)}}
export default async function handler(req,res){
  try{
    const ids=[...new Set(String(req.query?.ids||'').split(',').map(Number).filter(Number.isInteger))].slice(0,40),year=Number(req.query?.year||2026);
    if(!ids.length)return res.status(400).json({ok:false,error:'ids required',research_only:true,scoring_enabled:false});
    if(year!==2026)return res.status(400).json({ok:false,error:'v38 candidate route currently supports 2026 only',research_only:true,scoring_enabled:false});
    const q=ids.join(','),[bulk,pull]=await Promise.all([get(`${ORIGIN}/api/bulk?ids=${q}&year=${year}`),get(`${ORIGIN}/api/pull-air?ids=${q}&year=${year}`)]);
    const b=new Map((bulk.items||[]).map(x=>[+x.player_id,x])),p=new Map((pull.items||[]).map(x=>[+x.player_id,x]));
    const items=ids.map(player_id=>normalizeV38Candidate({bulk:b.get(player_id)||{player_id},pullair:p.get(player_id)||{player_id}}));
    return res.status(200).json({ok:true,model:'v38',status:'RESEARCH_CANDIDATE',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,v37_parity_verified:false,identity_mode:'MLBAM_EXACT',live_research_eligible:true,point_in_time_verified:false,backtest_eligible:false,point_in_time_reason:'Retained native profile service is season/current-state; historical as-of semantics are not proven.',semantics:V38_PROFILE_CANDIDATE.fields,items});
  }catch(e){return res.status(502).json({ok:false,model:'v38',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,error:e?.name==='AbortError'?'v38 profile timeout':String(e?.message||e)})}
}
