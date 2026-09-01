// BANDALYTICS v95 — read-only ZIP vs Direct Preview parity comparator.
// Reads loaded production state; never mutates it and never feeds direct data into scoring.
(function(){
  'use strict';
  const canon=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[.'’\-]/g,' ').replace(/\s+/g,' ').trim();
  const alias=t=>({ARI:'AZ',OAK:'ATH'}[String(t||'').toUpperCase()]||String(t||'').toUpperCase());
  const key=(p,t)=>canon(p)+'::'+alias(t);
  const num=v=>v==null||v===''?null:(Number.isFinite(+v)?+v:null);
  const close=(a,b,t)=>{a=num(a);b=num(b);return a!=null&&b!=null&&Math.abs(a-b)<=t};
  function zipRows(){try{return typeof P!=='undefined'?Object.values(P||{}):[]}catch{return[]}}
  function compare(preview){
    const direct=Array.isArray(preview?.items)?preview.items:[],zip=zipRows(),zm=new Map(zip.map(x=>[key(x.player,x.team),x])),rows=[];
    for(const d of direct){
      const k=key(d.player,d.team),z=zm.get(k);if(!z)continue;
      const identity=(d.player_id==null||z.player_id==null)?null:(+d.player_id===+z.player_id);
      const lineup=(d.lineup==null||z.lineup==null)?null:(+d.lineup===+z.lineup);
      const starter=(!d.opp_pitcher||!z.opp)?null:(canon(d.opp_pitcher)===canon(z.opp));
      const ev=close(d.ev,z.ev,.15),hh=close(d.hard_hit,z.hh,.25),barrel=close(d.barrel,z.barrel,.25),iso=close(d.iso,z.iso,.003);
      rows.push({player:d.player,team:alias(d.team),player_id:d.player_id??z.player_id??null,identity,lineup,starter,ev,hh,barrel,iso,profile_fields_compared:[d.ev,z.ev,d.hard_hit,z.hh,d.barrel,z.barrel,d.iso,z.iso].every(v=>num(v)!=null)});
    }
    const count=(field,val=true)=>rows.filter(r=>r[field]===val).length,known=field=>rows.filter(r=>r[field]!=null).length,prof=rows.filter(r=>r.profile_fields_compared);
    return {research_only:true,scoring_enabled:false,zip_entities:zip.length,direct_entities:direct.length,overlap:rows.length,identity:{known:known('identity'),match:count('identity')},lineup:{known:known('lineup'),match:count('lineup')},starter:{known:known('starter'),match:count('starter')},profile:{compared:prof.length,ev_match:prof.filter(r=>r.ev).length,hh_match:prof.filter(r=>r.hh).length,barrel_match:prof.filter(r=>r.barrel).length,iso_match:prof.filter(r=>r.iso).length},rows};
  }
  window.BANDALYTICS_DIRECT_PARITY={compare,scoring_enabled:false,model_scoring_changed:false,read_only:true};
})();
