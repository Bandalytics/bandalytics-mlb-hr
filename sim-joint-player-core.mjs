import {uncertaintyFields} from './monte-carlo-core.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fair=p=>{if(!(p>0&&p<1))return null;return p>=.5?Math.round(-100*p/(1-p)):Math.round(100*(1-p)/p)};

function normal(rng){let u=0,v=0;while(!u)u=rng();while(!v)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function lognormalMean1(sd,rng){return Math.exp(sd*normal(rng)-.5*sd*sd)}
function paDraw(mean,rng){const lo=Math.floor(mean),frac=mean-lo;return clamp(lo+(rng()<frac?1:0)+(rng()<.08?1:0)-(rng()<.06?1:0),3,7)}
function eventDraw(rates={},mods={},rng=Math.random){
 const power=mods.power||1,hit=mods.hit||1,walk=mods.walk||1;
 let p1=(rates.single??.145)*hit,p2=(rates.double??.045)*hit*power,p3=(rates.triple??.004)*hit,phr=(rates.hr??.031)*power,pbb=(rates.bb??.085)*walk;
 const total=p1+p2+p3+phr+pbb;if(total>.74){const z=.74/total;p1*=z;p2*=z;p3*=z;phr*=z;pbb*=z}
 let u=rng(),c=pbb;if(u<c)return'BB';c+=phr;if(u<c)return'HR';c+=p3;if(u<c)return'3B';c+=p2;if(u<c)return'2B';c+=p1;if(u<c)return'1B';return'OUT';
}
function basePower(stats,starter={},parkHrFactor=1,bbe=null){
 const pa=+stats.pa||0,shrink=pa<35?.35:pa<90?.65:pa<180?.82:1,seasonHr=stats.rates?.hr??.031,starterHr=Number.isFinite(+starter.HR9)?clamp((+starter.HR9)/1.20,.65,1.50):1;
 const raw=clamp((seasonHr/.031)*Math.pow(starterHr,.35)*Math.pow(parkHrFactor,.45),.45,2.0),recent=bbe&&bbe.n?clamp(1+((bbe.hrshape??45)-45)/320+(bbe.hrq||0)*.008+(bbe.trend==='RISING'?.035:bbe.trend==='FALLING'?-.035:0),.90,1.12):1;
 return (1+(raw-1)*shrink)*recent;
}
function simulateOnePlayer(ctx,teamShock,gameShock,rng){
 const {player,teamExpectedRuns,starter,parkHrFactor,bbe}=ctx,stats=ctx.stats||{},spot=clamp(+player.lineup||6,1,9),basePA=4.62-(spot-1)*.055+clamp((teamExpectedRuns-4.45)*.075,-.18,.24),pa=paDraw(basePA,rng);
 const avg=Number.isFinite(+stats.avg)?+stats.avg:.245,baseHit=clamp(1+((avg-.245)/.245)*.45,.78,1.22),off=clamp(teamShock*gameShock,.72,1.35),hit=clamp(baseHit*Math.pow(off,.48),.68,1.38),power=clamp(basePower(stats,starter,parkHrFactor,bbe)*Math.pow(off,.72),.40,2.35),walk=clamp(Math.pow(off,.18),.90,1.10);
 let hits=0,tb=0,hrs=0,bbs=0,ks=0,onbaseNonHr=0;
 for(let j=0;j<pa;j++){
  const ev=eventDraw(stats.rates||{}, {power,hit,walk},rng);
  if(ev==='BB'){bbs++;onbaseNonHr++}else if(ev==='HR'){hits++;tb+=4;hrs++}else if(ev==='3B'){hits++;tb+=3;onbaseNonHr++}else if(ev==='2B'){hits++;tb+=2;onbaseNonHr++}else if(ev==='1B'){hits++;tb++;onbaseNonHr++}else if(rng()<(stats.rates?.k??.22))ks++;
 }
 let sb=0;for(let b=0;b<onbaseNonHr&&!sb;b++)if(rng()<clamp((stats.sbAttemptPerOnBase||.03)*(spot<=2?1.20:1),0,.35)&&rng()<(stats.sbSuccess||.78))sb=1;
 return {hr:hrs>=1,hit1:hits>=1,hits2:hits>=2,tb2:tb>=2,tb3:tb>=3,tb4:tb>=4,walk1:bbs>=1,sb1:sb>=1,strikeouts2:ks>=2,hits,tb,hrs,bbs,ks,sb,pa};
}

export function simulateJointPlayerSelections({selections=[],playerContexts=new Map(),sims=30000,teamShockSD=.16,gameShockSD=.08,rng=Math.random}={}){
 const N=clamp(Math.floor(sims)||30000,5000,150000),valid=selections.map(s=>({...s,playerId:+s.playerId,market:String(s.market||'')})).filter(s=>playerContexts.has(+s.playerId));
 if(!valid.length)return {ok:false,error:'no valid selections',sims:N};
 const legHits=new Array(valid.length).fill(0);let joint=0;
 for(let i=0;i<N;i++){
  const gameShock=lognormalMean1(gameShockSD,rng),teamShocks=new Map();let all=true;
  for(let k=0;k<valid.length;k++){
   const s=valid[k],ctx=playerContexts.get(+s.playerId),team=String(ctx.player?.team||s.team||'');if(!teamShocks.has(team))teamShocks.set(team,lognormalMean1(teamShockSD,rng));
   const result=simulateOnePlayer(ctx,teamShocks.get(team),gameShock,rng),hit=!!result[s.market];if(hit)legHits[k]++;else all=false;
  }
  if(all)joint++;
 }
 const legs=valid.map((s,i)=>{const p=legHits[i]/N;return {...s,probability:p,pct:+(100*p).toFixed(2),fairAmerican:fair(p),...uncertaintyFields(p,N)}}),p=joint/N;
 const independent=legs.reduce((a,x)=>a*x.probability,1),lift=independent>0?p/independent:null;
 return {ok:true,sims:N,legs,joint:{probability:p,pct:+(100*p).toFixed(3),fairAmerican:fair(p),...uncertaintyFields(p,N)},independenceBenchmark:{probability:independent,pct:+(100*independent).toFixed(3),fairAmerican:fair(independent)},correlationLift:lift==null?null:+lift.toFixed(3),model:'SHARED_TEAM_AND_GAME_SHOCK_V1',researchOnly:true,calibrated:false};
}
