const UPSTREAM='https://bandalytics-v42-history.vercel.app/api/pitchfit';
const TEAM_ALIAS={OAK:'ATH',ARI:'AZ'};
const aliasTeam=t=>TEAM_ALIAS[String(t||'').toUpperCase()]||String(t||'').toUpperCase();
const canon=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[.'’\-]/g,' ').replace(/\s+/g,' ').trim();
async function jget(url){const r=await fetch(url,{headers:{accept:'application/json'}});if(!r.ok)throw Error('MLB identity HTTP '+r.status);return r.json()}
async function verifyIdentity(h){
  const id=Number(h.player_id??h.hitter_id??h.batter_id);
  if(!Number.isInteger(id)||id<=0)throw Error('IDENTITY RESEARCH — valid hitter MLBAM ID required');
  const z=await jget(`https://statsapi.mlb.com/api/v1/people/${id}?hydrate=currentTeam`),p=z?.people?.[0];
  if(!p||Number(p.id)!==id)throw Error('IDENTITY RESEARCH — MLBAM hitter ID not found');
  if(canon(p.fullName)!==canon(h.name))throw Error('IDENTITY RESEARCH — MLBAM hitter name mismatch');
  let officialTeam=null,teamId=p.currentTeam?.id;
  if(teamId){try{const tz=await jget(`https://statsapi.mlb.com/api/v1/teams/${teamId}`);officialTeam=tz?.teams?.[0]?.abbreviation||null}catch{}}
  if(h.team&&officialTeam&&aliasTeam(h.team)!==aliasTeam(officialTeam))throw Error('IDENTITY RESEARCH — MLBAM hitter team mismatch');
  return{id,name:p.fullName,team:officialTeam||h.team||null,team_id:teamId||null};
}
async function upstream(body){const r=await fetch(UPSTREAM,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(body)});let z;try{z=await r.json()}catch{throw Error('Pitch Fit upstream returned non-JSON')};if(!r.ok)throw Error(z?.error||('Pitch Fit upstream HTTP '+r.status));return z}
function withVerifiedId(z,h,v){
  const entries=Object.entries(z?.players||{});
  if(entries.length!==1)throw Error('IDENTITY RESEARCH — isolated Pitch Fit returned '+entries.length+' hitters');
  const [key,e]=entries[0];
  if(canon(key)!==canon(h.name)&&canon(e?.name)!==canon(h.name)&&canon(e?.player)!==canon(h.name))throw Error('IDENTITY RESEARCH — Pitch Fit response hitter name mismatch');
  const rid=e?.player_id??e?.hitter_id??e?.batter_id??z?.player_id??z?.hitter_id??z?.batter_id;
  if(rid!=null&&Number(rid)!==v.id)throw Error('IDENTITY RESEARCH — Pitch Fit hitter MLBAM mismatch');
  const out={...(e||{}),player_id:v.id,hitter_id:v.id,batter_id:v.id,identity_verified:true,identity_source:rid!=null?'UPSTREAM MLBAM ECHO + MLB OFFICIAL':'MLB OFFICIAL ID + ISOLATED PLAYER-ID REQUEST'};
  return{...z,player_id:v.id,hitter_id:v.id,batter_id:v.id,identity_verified:true,players:{[key]:out}};
}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  try{
    const body=req.body||{},hitters=Array.isArray(body.hitters)?body.hitters:[];
    if(!hitters.length)return res.status(400).json({error:'hitters required'});
    const idRows=hitters.filter(h=>h&&(h.player_id!=null||h.hitter_id!=null||h.batter_id!=null));
    if(!idRows.length){const z=await upstream(body);return res.status(200).json(z)}
    if(hitters.length!==1||idRows.length!==1)return res.status(400).json({error:'IDENTITY RESEARCH — MLBAM-ID Pitch Fit requests must be isolated one hitter at a time'});
    const h=hitters[0],v=await verifyIdentity(h);
    const safe={...body,hitters:[{...h,player_id:v.id,hitter_id:v.id,batter_id:v.id,team:aliasTeam(h.team||v.team)}]};
    const z=await upstream(safe),out=withVerifiedId(z,h,v);
    return res.status(200).json(out);
  }catch(e){return res.status(422).json({error:e?.message||String(e),identity_verified:false})}
}
export{aliasTeam,canon,verifyIdentity,withVerifiedId};
