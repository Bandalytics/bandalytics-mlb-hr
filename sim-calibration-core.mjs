const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;

function summarizeRows(rows=[]){
 const absTeam=rows.flatMap(r=>[Math.abs(r.awayError),Math.abs(r.homeError)]),
       absTotal=rows.map(r=>Math.abs(r.totalError)),
       sqTeam=rows.flatMap(r=>[r.awayError**2,r.homeError**2]);
 const buckets=[];
 for(let lo=0;lo<1;lo+=.1){
  const b=rows.filter(r=>r.homeWinProb>=lo&&r.homeWinProb<(lo+.1));
  if(b.length)buckets.push({min:+lo.toFixed(1),max:+(lo+.1).toFixed(1),n:b.length,avgPred:mean(b.map(r=>r.homeWinProb)),actualRate:mean(b.map(r=>r.actualHomeWin))});
 }
 const winnerAccuracy=rows.length?mean(rows.map(r=>(r.homeWinProb>=.5?1:0)===r.actualHomeWin?1:0)):null;
 return {
  games:rows.length,
  winnerAccuracy,
  teamRunMAE:mean(absTeam),
  teamRunRMSE:sqTeam.length?Math.sqrt(mean(sqTeam)):null,
  totalRunMAE:mean(absTotal),
  meanTotalBias:mean(rows.map(r=>r.totalError)),
  moneylineBrier:mean(rows.map(r=>r.brier)),
  meanActualExactScoreProb:mean(rows.map(r=>r.exactScoreProb)),
  exactScoreLogLoss:mean(rows.map(r=>r.exactScoreLogLoss)),
  calibrationBuckets:buckets,
  rows
 };
}

export function calibrationSummary(predictions=[],actuals=[],meta={}){
 const act=new Map(actuals.map(x=>[+x.gamePk,x]));
 const rows=[];
 for(const p of predictions){
  const a=act.get(+p.gamePk);if(!a||!Number.isFinite(+a.awayRuns)||!Number.isFinite(+a.homeRuns))continue;
  const pa=+p.estimates?.away?.expectedRuns,ph=+p.estimates?.home?.expectedRuns,homeP=(+p.sim?.fullGame?.homeWinPct||0)/100;
  if(!Number.isFinite(pa)||!Number.isFinite(ph)||!Number.isFinite(homeP))continue;
  const actualHomeWin=+a.homeRuns>+a.awayRuns?1:0;
  const exactKey=`${+a.awayRuns}-${+a.homeRuns}`, exactP=+p.sim?.scoreGrid?.[exactKey]?.probability||0;
  rows.push({date:meta.date||p.date||a.date||null,gamePk:+p.gamePk,away:p.away,home:p.home,predAway:pa,predHome:ph,actualAway:+a.awayRuns,actualHome:+a.homeRuns,
   awayError:pa-(+a.awayRuns),homeError:ph-(+a.homeRuns),totalError:(pa+ph)-(+a.awayRuns+ +a.homeRuns),homeWinProb:homeP,actualHomeWin,brier:(homeP-actualHomeWin)**2,exactScoreProb:exactP,exactScoreLogLoss:-Math.log(Math.max(exactP,1e-9))});
 }
 return summarizeRows(rows);
}

export function aggregateCalibration(days=[]){
 const rows=days.flatMap(d=>(d?.summary?.rows||d?.rows||[]).map(r=>({...r,date:r.date||d.date||null})));
 const out=summarizeRows(rows);
 out.days=days.length;
 out.strictDays=days.filter(d=>d?.strictReady===true).length;
 out.failedDays=days.filter(d=>d?.ok===false).length;
 out.daily=days.map(d=>({date:d.date,ok:d.ok!==false,strictReady:!!d.strictReady,games:d?.summary?.games??d?.rows?.length??0,moneylineBrier:d?.summary?.moneylineBrier??null,teamRunMAE:d?.summary?.teamRunMAE??null,totalRunMAE:d?.summary?.totalRunMAE??null,winnerAccuracy:d?.summary?.winnerAccuracy??null}));
 return out;
}
