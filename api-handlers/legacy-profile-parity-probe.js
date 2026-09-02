// Temporary research-only parity witness for the frozen v37 profile fields.
// Fixed sample only: this is not a generic proxy and has zero scoring write access.
const SAMPLE=Object.freeze([
  {player:'Aaron Judge',player_id:592450},
  {player:'Shohei Ohtani',player_id:660271},
  {player:'Kyle Schwarber',player_id:656941},
  {player:'Gunnar Henderson',player_id:683002}
]);
const LEGACY='https://bandalytics-v42-history.vercel.app/api/core';
const NATIVE='https://bandalytics-native-profile.vercel.app';

const num=v=>v==null||v===''?null:(Number.isFinite(+v)?+v:null);
async function json(url,opts={}){const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);try{const r=await fetch(url,{...opts,signal:c.signal});const text=await r.text();if(!r.ok)throw Error(`${url} HTTP ${r.status}: ${text.slice(0,160)}`);return JSON.parse(text)}finally{clearTimeout(t)}}
function pickLegacy(z,name){const p=z?.players?.[name]||Object.values(z?.players||{}).find(x=>String(x?.player||x?.name||'').toLowerCase()===name.toLowerCase())||null;if(!p)return null;return{ev:num(p.ev),hh:num(p.hh??p.hard_hit),barrel:num(p.barrel),iso:num(p.iso),sweet:num(p.sweet??p.sweet_spot),pull:num(p.pull),pullair:num(p.pullair??p.pull_air_pct),blast:num(p.blast??p.blast_pct),source:p.source??null}}
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'GET only',research_only:true,scoring_enabled:false});
  try{
    const names=SAMPLE.map(x=>x.player),ids=SAMPLE.map(x=>x.player_id).join(',');
    const [legacy,bulk,pull]=await Promise.all([
      json(LEGACY,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({names,end:'2026-09-01',year:2026})}),
      json(`${NATIVE}/api/bulk?ids=${ids}&year=2026`),
      json(`${NATIVE}/api/pull-air?ids=${ids}&year=2026`)
    ]);
    const byId=new Map((bulk.items||[]).map(x=>[+x.player_id,x])),pa=new Map((pull.items||[]).map(x=>[+x.player_id,x]));
    const items=SAMPLE.map(s=>{const l=pickLegacy(legacy,s.player),n=byId.get(s.player_id)||{},a=pa.get(s.player_id)||{};return{player:s.player,player_id:s.player_id,legacy:l,native:{ev:num(n.ev),hh:num(n.hard_hit),barrel:num(n.barrel),iso:num(n.iso),sweet:num(n.sweet_spot),pull:num(n.pull),pullair:num(a.pull_air),blast_contact:num(n.blast_contact),blast_swing:num(n.blast_swing)}}});
    return res.status(200).json({ok:true,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,sample_date:'2026-09-01',legacy_source:'v42 /api/core',native_source:'Baseball Savant retained native-profile service',pullair_definition:pull.definition||null,blast_candidates:{contact:bulk.profile_semantics?.blast_contact||null,swing:bulk.profile_semantics?.blast_swing||null},items});
  }catch(e){return res.status(502).json({ok:false,research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,error:String(e?.message||e)})}
}
