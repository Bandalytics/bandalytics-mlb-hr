const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const implied=o=>o>0?100/(o+100):Math.abs(o)/(Math.abs(o)+100);
export const fair=p=>!(p>0&&p<1)?null:p>=.5?Math.round(-100*p/(1-p)):Math.round(100*(1-p)/p);
export const decimal=o=>o>0?1+o/100:1+100/Math.abs(o);
export function noVigTwoWay(a,b){const pa=implied(+a),pb=implied(+b),z=pa+pb;return {a:pa/z,b:pb/z,hold:z-1}}
export function evalMarket({modelProb,americanOdds,oppositeOdds=null,...meta}={}){
 const p=clamp(+modelProb,0,1),o=+americanOdds,raw=implied(o);let book=raw,hold=null;
 if(Number.isFinite(+oppositeOdds)){const nv=noVigTwoWay(o,+oppositeOdds);book=nv.a;hold=nv.hold}
 const dec=decimal(o),ev=p*(dec-1)-(1-p),b=dec-1,kelly=b>0?clamp((b*p-(1-p))/b,0,.25):0;
 return {...meta,modelProb:p,modelPct:100*p,americanOdds:o,fairAmerican:fair(p),rawImpliedPct:100*raw,noVigImpliedPct:100*book,bookHoldPct:hold==null?null:100*hold,edgePct:100*(p-book),evPerUnit:ev,evPct:100*ev,kellyPct:100*kelly};
}
export function evalCrossGameParlay(legs=[],offeredOdds=null){
 const p=legs.reduce((z,x)=>z*clamp(+x.modelProb,0,1),1),f=fair(p),result={legs:legs.length,modelProb:p,modelPct:100*p,fairAmerican:f,independenceAssumed:true};
 if(Number.isFinite(+offeredOdds)){const o=+offeredOdds,imp=implied(o),dec=decimal(o),ev=p*(dec-1)-(1-p);Object.assign(result,{offeredOdds:o,bookImpliedPct:100*imp,edgePct:100*(p-imp),evPct:100*ev})}
 return result;
}
