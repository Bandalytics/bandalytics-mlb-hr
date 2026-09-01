const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const num=x=>Number.isFinite(+x)?+x:null;
const normTeam=t=>String(t||'').toUpperCase()==='ARI'?'AZ':String(t||'').toUpperCase()==='OAK'?'ATH':String(t||'').toUpperCase();

export function hitterSnapshot(stat={}){
  const pa=num(stat.plateAppearances)||0,ab=num(stat.atBats)||0,h=num(stat.hits)||0,d2=num(stat.doubles)||0,d3=num(stat.triples)||0,hr=num(stat.homeRuns)||0,bb=num(stat.baseOnBalls)||0,k=num(stat.strikeOuts)||0,sb=num(stat.stolenBases)||0,cs=num(stat.caughtStealing)||0;
  const singles=Math.max(0,h-d2-d3-hr),den=Math.max(pa,1);
  const raw=pa>0?{single:singles/den,double:d2/den,triple:d3/den,hr:hr/den,bb:bb/den,k:k/den}:{single:.145,double:.045,triple:.004,hr:.031,bb:.085,k:.22};
  const known=raw.single+raw.double+raw.triple+raw.hr+raw.bb;
  const out=clamp(1-known,0,1);
  const attempt=sb+cs;
  return {pa,ab,hits:h,avg:num(stat.avg),obp:num(stat.obp),slg:num(stat.slg),ops:num(stat.ops),
    rates:{...raw,out},sbSuccess:attempt?sb/attempt:.78,sbAttemptPerOnBase:(h+bb)?attempt/(h+bb):.03};
}

export function extractHydratedHitterStats(data={}){
  const out=new Map();
  for(const p of data.people||[]){
    const splits=p.stats?.flatMap(x=>x.splits||[])||[],st=splits.find(x=>x.stat)?.stat||{};
    out.set(+p.id,hitterSnapshot(st));
  }
  return out;
}

function choosePA(mean){
  const lo=Math.floor(mean),frac=mean-lo;
  return clamp(lo+(Math.random()<frac?1:0)+(Math.random()<.08?1:0)-(Math.random()<.06?1:0),3,7);
}
function draw(rates,mods={}){
  const power=mods.power||1,hit=mods.hit||1,walk=mods.walk||1;
  let p1=rates.single*hit,p2=rates.double*hit*power,p3=rates.triple*hit,phr=rates.hr*power,pbb=rates.bb*walk;
  const total=p1+p2+p3+phr+pbb;
  if(total>.72){const z=.72/total;p1*=z;p2*=z;p3*=z;phr*=z;pbb*=z}
  const u=Math.random();let c=pbb;if(u<c)return'BB';c+=phr;if(u<c)return'HR';c+=p3;if(u<c)return'3B';c+=p2;if(u<c)return'2B';c+=p1;if(u<c)return'1B';return'OUT';
}

export function simulatePlayer({player={},stats={},bbe=null,teamExpectedRuns=4.45,opponentStarter={},parkHrFactor=1,sims=30000}={}){
  const N=clamp(Math.floor(sims)||30000,5000,100000),spot=clamp(+player.lineup||6,1,9);
  const basePA=4.62-(spot-1)*.055+clamp((teamExpectedRuns-4.45)*.075,-.18,.24);
  const sampleShrink=stats.pa<35?.35:stats.pa<90?.65:stats.pa<180?.82:1;
  const seasonHr=stats.rates?.hr??.03,neutralHr=.031;
  const starterHr=Number.isFinite(opponentStarter.HR9)?clamp(opponentStarter.HR9/1.20,.65,1.50):1;
  const rawPower=clamp((seasonHr/neutralHr)*Math.pow(starterHr,.35)*Math.pow(parkHrFactor,.45),.45,2.0);
  // Recent BBE is intentionally a small modifier, never the foundation.
  const recent=bbe&&bbe.n?clamp(1+((bbe.hrshape??45)-45)/320+(bbe.hrq||0)*.008+(bbe.trend==='RISING'?.035:bbe.trend==='FALLING'?-.035:0),.90,1.12):1;
  const power=(1+(rawPower-1)*sampleShrink)*recent;
  const hit=clamp(1+(((stats.avg??.245)-.245)/.245)*.45,.78,1.22);
  let hrHit=0,h1=0,h2=0,tb2=0,tb3=0,tb4=0,bb1=0,sb1=0,k2=0,paSum=0;
  for(let i=0;i<N;i++){
    const pa=choosePA(basePA);paSum+=pa;let hits=0,tb=0,hrs=0,bbs=0,ks=0,onbaseNonHr=0;
    for(let j=0;j<pa;j++){
      const ev=draw(stats.rates||{}, {power,hit,walk:1});
      if(ev==='BB'){bbs++;onbaseNonHr++}
      else if(ev==='HR'){hits++;tb+=4;hrs++}
      else if(ev==='3B'){hits++;tb+=3;onbaseNonHr++}
      else if(ev==='2B'){hits++;tb+=2;onbaseNonHr++}
      else if(ev==='1B'){hits++;tb+=1;onbaseNonHr++}
      else if(Math.random()<(stats.rates?.k??.22))ks++;
    }
    let stole=false;
    for(let b=0;b<onbaseNonHr&&!stole;b++)if(Math.random()<clamp((stats.sbAttemptPerOnBase||.03)*(spot<=2?1.20:1),0,.35)&&Math.random()<(stats.sbSuccess||.78))stole=true;
    if(hrs)hrHit++;if(hits>=1)h1++;if(hits>=2)h2++;if(tb>=2)tb2++;if(tb>=3)tb3++;if(tb>=4)tb4++;if(bbs>=1)bb1++;if(stole)sb1++;if(ks>=2)k2++;
  }
  const pct=x=>+(100*x/N).toFixed(2),fair=x=>{const p=x/N;if(!p||p>=1)return null;return p>=.5?Math.round(-100*p/(1-p)):Math.round(100*(1-p)/p)};
  return {player:player.player,playerId:+player.player_id,team:normTeam(player.team),lineup:spot,expectedPA:+(paSum/N).toFixed(2),samplePA:stats.pa,powerMultiplier:+power.toFixed(3),recentBbe:bbe?{n:bbe.n,hrshape:bbe.hrshape,hrq:bbe.hrq,trend:bbe.trend}:null,markets:{
    hr:{pct:pct(hrHit),fairAmerican:fair(hrHit)},hit1:{pct:pct(h1),fairAmerican:fair(h1)},hits2:{pct:pct(h2),fairAmerican:fair(h2)},tb2:{pct:pct(tb2),fairAmerican:fair(tb2)},tb3:{pct:pct(tb3),fairAmerican:fair(tb3)},tb4:{pct:pct(tb4),fairAmerican:fair(tb4)},walk1:{pct:pct(bb1),fairAmerican:fair(bb1)},sb1:{pct:pct(sb1),fairAmerican:fair(sb1)},strikeouts2:{pct:pct(k2),fairAmerican:fair(k2)}}};
}

export function simulateLineup({players=[],hitterStats=new Map(),bbeStats=new Map(),teamExpectedRuns=4.45,opponentStarter={},parkHrFactor=1,sims=30000}={}){
  return players.filter(p=>+p.lineup>=1&&+p.lineup<=9).sort((a,b)=>+a.lineup-+b.lineup).map(p=>simulatePlayer({player:p,stats:hitterStats.get(+p.player_id)||hitterSnapshot({}),bbe:bbeStats.get(+p.player_id)||null,teamExpectedRuns,opponentStarter,parkHrFactor,sims}));
}
