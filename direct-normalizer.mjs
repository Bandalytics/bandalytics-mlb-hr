import {identityKey,teamAlias} from './identity-resolver.mjs';
import {deltaImpliedPct,impliedAmerican} from './market-adapter.mjs';

export function mergeDirectState({market=[],lineup=[],profiles=[],bbe=[],starter=[],pitchfit=[],environment=[],quoteHistory=[]}={}){
 const out=new Map(),touch=(player,team)=>{const k=identityKey(player,team);if(!out.has(k))out.set(k,{player,team:teamAlias(team),player_key:k,identity_key:k,direct_mode:true});return out.get(k)};
 for(const m of market){const p=touch(m.player,m.team);Object.assign(p,{player_id:m.player_id??p.player_id,matchup:m.matchup||p.matchup,open:m.open??p.open,now:m.now??m.odds??p.now,delta:m.delta_implied_pct??(m.open!=null&&(m.now??m.odds)!=null?deltaImpliedPct(m.open,m.now??m.odds):p.delta),implied_probability:m.implied_probability??impliedAmerican(m.now??m.odds),best_book:m.book??m.best_book??p.best_book,market_source:m.provider??m.market_source??'DIRECT_MARKET',market_ready:true,market_parity_verified:m.parity_verified===true,identity_source:m.identity_source??p.identity_source});}
 for(const l of lineup){const p=touch(l.player,l.team);Object.assign(p,{player_id:l.player_id??p.player_id,matchup:l.matchup||p.matchup,lineup:l.lineup??p.lineup,opp:l.opp_pitcher??p.opp,lineup_source:l.lineup_source??'MLB_POSTED_LINEUP',lineup_ready:true,lineup_parity_verified:l.parity_verified===true});}
 for(const x of profiles){const p=touch(x.player,x.team),eligible=x.scoring_eligible===true&&x.parity_verified===true;Object.assign(p,{player_id:x.player_id??p.player_id,ev:x.ev??p.ev,hh:x.hard_hit??x.hh??p.hh,barrel:x.barrel??p.barrel,iso:x.iso??p.iso,sweet:x.sweet??p.sweet,pullair:x.pullair??x.pull_air_pct??p.pullair,blast:x.blast??x.blast_pct??p.blast,profile_source:x.profile_source??'DIRECT_PROFILE',profile_sample:x.savant_attempts??x.sample??x.bbe_sample??p.profile_sample,profile_sample_grade:x.sample_grade??p.profile_sample_grade,profile_research_ready:true,profile_ready:eligible,profile_scoring_eligible:eligible,profile_parity_verified:x.parity_verified===true&&eligible,profile_status:x.profile_status??x.status??(eligible?'PARITY_VERIFIED':'RESEARCH_PARTIAL'),profile_reason:x.profile_reason??(!eligible?'DIRECT RESEARCH — profile not parity-approved for v37':null)});}
 for(const x of bbe){const p=touch(x.player,x.team);Object.assign(p,{player_id:x.player_id??p.player_id,bbe_source:x.source??'DIRECT_BBE',bbe_ready:true,bbe_parity_verified:x.parity_verified===true,bbe_status:x.status??(x.parity_verified===true?'PARITY_VERIFIED':'RESEARCH')});}
 for(const x of starter){const p=touch(x.player,x.team);Object.assign(p,{player_id:x.player_id??p.player_id,opp:x.opp_pitcher??x.opp??p.opp,opp_id:x.opp_id??p.opp_id,hr9:x.hr9??p.hr9,starter_ready:x.ready!==false,starter_parity_verified:x.parity_verified===true,starter_source:x.source??'DIRECT_STARTER'});}
 for(const x of pitchfit){const p=touch(x.player,x.team);Object.assign(p,{player_id:x.player_id??p.player_id,pitchfit:x.score??x.pitchfit??p.pitchfit,pitchfit_coverage:x.coverage??p.pitchfit_coverage,pitchfit_sample:x.sample??p.pitchfit_sample,pitchfit_status:x.status??p.pitchfit_status,pitchfit_ready:x.status==='TRUE'&&x.score!=null,pitchfit_identity_verified:x.identity_verified===true,pitchfit_parity_verified:x.parity_verified===true&&x.identity_verified===true&&x.status==='TRUE'&&x.score!=null,pitchfit_source:x.source??'DIRECT_PITCHFIT'});}
 for(const x of environment){const p=touch(x.player,x.team);Object.assign(p,{player_id:x.player_id??p.player_id,env_ready:x.ready!==false,environment_parity_verified:x.parity_verified===true,pen_fresh:x.pen_fresh??p.pen_fresh,pen_hr9_5:x.pen_hr9_5??p.pen_hr9_5,park_label:x.park_label??p.park_label,weather_label:x.weather_label??p.weather_label,env_grade:x.env_grade??p.env_grade,environment_source:x.source??'DIRECT_ENVIRONMENT'});}
 for(const p of out.values()){
  p.direct_status=p.market_ready?(p.lineup_ready?'POSTED_LINEUP':'MARKET_ONLY'):'UNPRICED_RESEARCH';
  p.research_only=!p.market_ready;
  p.workflow_gate_reason=!p.market_ready?'DIRECT RESEARCH — no current HR market':(!p.lineup_ready?'DIRECT PENDING — priced player not in posted lineup':null);
  p.quote_history=(quoteHistory||[]).filter(q=>identityKey(q.player,q.team)===p.identity_key).sort((a,b)=>(a.seen_at??a.updated_at??0)-(b.seen_at??b.updated_at??0));
 }
 return [...out.values()];
}

export function appendQuoteHistory(history,quotes,{seenAt=Date.now(),maxPerPlayer=64}={}){
 const map=new Map();for(const q of history||[]){const k=identityKey(q.player,q.team);const a=map.get(k)||[];a.push(q);map.set(k,a)}
 for(const q of quotes||[]){const k=identityKey(q.player,q.team),a=map.get(k)||[];const stamp=q.seen_at??q.updated_at??seenAt,odds=q.odds??q.now;if(odds==null)continue;const last=a[a.length-1];if(!last||last.odds!==odds||last.book!==q.book)a.push({player:q.player,team:teamAlias(q.team),player_id:q.player_id??null,book:q.book??null,odds:+odds,seen_at:stamp});map.set(k,a.slice(-maxPerPlayer))}
 return [...map.values()].flat();
}

export function historyDerivedSignals(item){const h=item.quote_history||[];if(h.length<2)return{steam_research:false,steam_reason:'INSUFFICIENT QUOTE HISTORY'};let maxRise=0;for(let i=1;i<h.length;i++){const d=deltaImpliedPct(h[i-1].odds,h[i].odds);if(d!=null)maxRise=Math.max(maxRise,d)}return{steam_research:maxRise>0,steam_max_step_delta:maxRise,steam_reason:'RESEARCH ONLY — legacy trigger threshold/path not yet proven'}}

export function promotedLegacyLenses(item){
 const out=[];
 if(item?.open!=null&&item?.now!=null){
   const d=deltaImpliedPct(item.open,item.now);
   if(d!=null&&d>=2.00)out.push('Sharp Money');
 }
 return out;
}
