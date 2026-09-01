import assert from'node:assert/strict';import{impliedAmerican,deltaImpliedPct,sharpMoney,buildMarketState,marketKey}from'./market-adapter.mjs';
assert.equal(+impliedAmerican(400).toFixed(6),0.2);assert.equal(+impliedAmerican(-200).toFixed(6),0.666667);
assert.equal(+deltaImpliedPct(400,300).toFixed(2),5.00);assert.equal(sharpMoney(400,300),true);assert.equal(sharpMoney(400,380),false);
const t=Date.parse('2026-08-28T20:00:00Z'),opens=new Map();
let r=buildMarketState([
 {player:'Max Muncy',team:'LAD',matchup:'LAD @ DET',book:'A',odds:319,updated_at:t-1000},
 {player:'Max Muncy',team:'OAK',matchup:'BAL @ OAK',book:'A',odds:568,updated_at:t-1000},
 {player:'Max Muncy',team:'LAD',matchup:'LAD @ DET',book:'B',odds:300,updated_at:t-1000}
],{now:t,openState:opens});
assert.equal(r.items.length,2);assert.notEqual(marketKey(r.items[0]),marketKey(r.items[1]));
let r2=buildMarketState([
 {player:'Max Muncy',team:'LAD',matchup:'LAD @ DET',book:'A',odds:343,updated_at:t+60_000},
 {player:'Max Muncy',team:'OAK',matchup:'BAL @ OAK',book:'A',odds:450,updated_at:t+60_000},
 {player:'Max Muncy',team:'LAD',matchup:'LAD @ DET',book:'STALE',odds:999,updated_at:t-3600_000}
],{now:t+60_000,openState:opens,maxAgeMs:10*60_000});
let lad=r2.items.find(x=>x.team==='LAD'),ath=r2.items.find(x=>x.team==='ATH');assert.equal(lad.open,319);assert.equal(lad.now,343);assert.equal(ath.open,568);assert.equal(ath.now,450);assert.equal(ath.sharp_money,true);assert.equal(lad.sharp_money,false);
console.log('MARKET ADAPTER PASS');
