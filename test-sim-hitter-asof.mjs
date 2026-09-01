import assert from 'node:assert/strict';
import {hydrateHittersAsOf} from './sim-data-core.mjs';
const oldFetch=globalThis.fetch;
const mk=(obj)=>({ok:true,json:async()=>obj});
globalThis.fetch=async(url)=>{
 const s=String(url);
 if(s.includes('/people/101/stats'))return mk({stats:[{splits:[{stat:{plateAppearances:100,atBats:90,hits:27,doubles:5,triples:1,homeRuns:4,baseOnBalls:9,strikeOuts:20,stolenBases:3,caughtStealing:1,avg:'.300',obp:'.360',slg:'.511',ops:'.871'}}]}]});
 if(s.includes('/people/202/stats'))return mk({stats:[{splits:[{stat:{plateAppearances:50,atBats:45,hits:10,doubles:2,triples:0,homeRuns:1,baseOnBalls:4,strikeOuts:12,stolenBases:0,caughtStealing:0,avg:'.222',obp:'.280',slg:'.333',ops:'.613'}}]}]});
 if(s.includes('/api/player-bbe'))return mk({items:[{player_id:101,bbe:{n:8,hrshape:51,hrq:2,trend:'RISING'}}]});
 throw new Error('unexpected '+s);
};
try{
 const warnings=[];
 const out=await hydrateHittersAsOf({lineup_players:[{player_id:101},{player_id:202}]},'2026-08-15',warnings);
 assert.equal(out.strict,true);assert.equal(out.asOfDate,'2026-08-15');assert.equal(out.hitterStats.size,2);
 assert.equal(out.hitterStats.get(101).pa,100);assert.ok(Math.abs(out.hitterStats.get(101).rates.hr-.04)<1e-9);
 assert.equal(out.bbeStats.get(101).trend,'RISING');assert.deepEqual(warnings,[]);
 console.log('sim hitter as-of test passed');
}finally{globalThis.fetch=oldFetch}
