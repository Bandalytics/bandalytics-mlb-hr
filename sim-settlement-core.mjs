const num=x=>Number.isFinite(+x)?+x:0;
export function boxscoreSettlement(box={}){
 const teamOut=(side)=>{const t=box?.teams?.[side]||{},b=t.teamStats?.batting||{};return{runs:num(b.runs),hits:num(b.hits),teamId:+t.team?.id||null,team:t.team?.abbreviation||t.team?.name||side}};
 const players=new Map();
 for(const side of ['away','home'])for(const [key,p] of Object.entries(box?.teams?.[side]?.players||{})){
  const id=+(p.person?.id||String(key).replace(/\D/g,''));if(!Number.isInteger(id))continue;const s=p.stats?.batting||{},hits=num(s.hits),d2=num(s.doubles),d3=num(s.triples),hr=num(s.homeRuns),tb=hits+d2+2*d3+3*hr;
  players.set(id,{playerId:id,player:p.person?.fullName||null,side,hits,doubles:d2,triples:d3,homeRuns:hr,totalBases:tb,walks:num(s.baseOnBalls),stolenBases:num(s.stolenBases),strikeOuts:num(s.strikeOuts),plateAppearances:num(s.plateAppearances),atBats:num(s.atBats)});
 }
 return{away:teamOut('away'),home:teamOut('home'),players};
}
export function settlePlayerLeg(sel={},stat={}){
 const m=String(sel.market||'');let hit=false;
 if(m==='hr')hit=num(stat.homeRuns)>=1;else if(m==='hit1')hit=num(stat.hits)>=1;else if(m==='hits2')hit=num(stat.hits)>=2;else if(m==='tb2')hit=num(stat.totalBases)>=2;else if(m==='tb3')hit=num(stat.totalBases)>=3;else if(m==='tb4')hit=num(stat.totalBases)>=4;else if(m==='walk1')hit=num(stat.walks)>=1;else if(m==='sb1')hit=num(stat.stolenBases)>=1;else if(m==='strikeouts2')hit=num(stat.strikeOuts)>=2;else return{status:'invalid',hit:false};
 return{status:hit?'win':'loss',hit};
}
export function settleGameLeg(sel={},awayRuns=0,homeRuns=0){
 const m=String(sel.market||''),line=+sel.line,a=+awayRuns,h=+homeRuns,ta=+sel.awayRuns,th=+sel.homeRuns;
 if(m==='away_ml')return{status:a>h?'win':'loss',hit:a>h};if(m==='home_ml')return{status:h>a?'win':'loss',hit:h>a};
 const cmp=(v,l,over)=>v===l?'push':(over?v>l:v<l)?'win':'loss';
 if(m==='game_over'||m==='game_under'){const st=cmp(a+h,line,m==='game_over');return{status:st,hit:st==='win'}}
 if(m==='away_tt_over'||m==='away_tt_under'){const st=cmp(a,line,m==='away_tt_over');return{status:st,hit:st==='win'}}
 if(m==='home_tt_over'||m==='home_tt_under'){const st=cmp(h,line,m==='home_tt_over');return{status:st,hit:st==='win'}}
 if(m==='away_plus_1_5')return{status:a+1.5>h?'win':'loss',hit:a+1.5>h};if(m==='home_plus_1_5')return{status:h+1.5>a?'win':'loss',hit:h+1.5>a};
 if(m==='away_minus_1_5')return{status:a-1.5>h?'win':'loss',hit:a-1.5>h};if(m==='home_minus_1_5')return{status:h-1.5>a?'win':'loss',hit:h-1.5>a};
 if(m==='exact_score'){const x=a===ta&&h===th;return{status:x?'win':'loss',hit:x}}if(m==='score_band'){const x=Math.abs(a-ta)<=1&&Math.abs(h-th)<=1;return{status:x?'win':'loss',hit:x}}
 return{status:'invalid',hit:false};
}
export function settleJoint({playerSelections=[],gameSelections=[],settlement}={}){
 const legs=[];for(const s of playerSelections){const st=settlement?.players?.get?.(+s.playerId);const r=st?settlePlayerLeg(s,st):{status:'missing',hit:false};legs.push({type:'player',...s,...r,actual:st||null})}
 for(const s of gameSelections){const r=settleGameLeg(s,settlement?.away?.runs,settlement?.home?.runs);legs.push({type:'game',...s,...r})}
 const losses=legs.filter(x=>x.status==='loss').length,invalid=legs.filter(x=>x.status==='invalid'||x.status==='missing').length,pushes=legs.filter(x=>x.status==='push').length,wins=legs.filter(x=>x.status==='win').length;
 const status=invalid?'unsettled':losses?'loss':wins?'win':'push';return{status,wins,losses,pushes,invalid,legs};
}
