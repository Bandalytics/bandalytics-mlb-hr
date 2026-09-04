import {fetchText,parseCsv,pitcherDamage,savantPitcherUrl} from '../starter-native-core.mjs';

const cleanIds=v=>[...new Set(String(v||'').split(',').map(Number).filter(x=>Number.isInteger(x)&&x>0))].slice(0,12);
const r1=v=>v==null?null:Math.round(Number(v)*10)/10;
const r2=v=>v==null?null:Math.round(Number(v)*100)/100;
const sampleGrade=ip=>ip==null?'UNKNOWN':ip<17.1?'SMALL':ip<35?'LIMITED':'ESTABLISHED';
const hr9Flag=hr9=>hr9==null?'UNKNOWN':hr9<1.2?'MAJOR_FILTER':'NO_MAJOR_FILTER';
const splitSummary=s=>({ip:r1(s?.ip),hr9:r2(s?.hr9),slg:r2(s?.slg),iso:r2(s?.iso),barrel:r1(s?.barrel),hard_hit:r1(s?.hard_hit),sample_grade:sampleGrade(s?.ip),hr9_filter:hr9Flag(s?.hr9)});

export default async function handler(req,res){
  const date=String(req.query?.date||''),ids=cleanIds(req.query?.ids);
  if(!/^20\d\d-\d\d-\d\d$/.test(date))return res.status(400).json({ok:false,error:'date required',research_only:true,scoring_enabled:false});
  if(!ids.length)return res.status(400).json({ok:false,error:'ids required',research_only:true,scoring_enabled:false});
  try{
    const csv=await fetchText(savantPitcherUrl(ids,date),{timeoutMs:20000}),rows=parseCsv(csv);
    const items=ids.map(pitcher_id=>{const d=pitcherDamage(rows,pitcher_id);return{pitcher_id,overall:splitSummary(d.overall),vs_lhb:splitSummary(d.vs_lhb),vs_rhb:splitSummary(d.vs_rhb)};});
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    return res.status(200).json({ok:true,date,items,protocol:'V38_STARTER_DAMAGE_RESEARCH_V1',source:'BASEBALL_SAVANT_NATIVE_STARTER_DAMAGE',hr9_major_filter_threshold:1.2,small_ip_threshold:17.1,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,rule_changed:false});
  }catch(e){return res.status(502).json({ok:false,date,error:e?.name==='AbortError'?'Baseball Savant timeout':(e?.message||String(e)),protocol:'V38_STARTER_DAMAGE_RESEARCH_V1',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,rule_changed:false})}
}
