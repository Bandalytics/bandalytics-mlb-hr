import assert from 'node:assert/strict';
import {hitterSnapshot,simulatePlayer} from './sim-player-core.mjs';
const st=hitterSnapshot({plateAppearances:500,atBats:450,hits:120,doubles:25,triples:3,homeRuns:30,baseOnBalls:45,strikeOuts:120,stolenBases:12,caughtStealing:3,avg:.267,obp:.335,slg:.535});
assert(st.rates.hr>.05&&st.rates.double>.04);
const x=simulatePlayer({player:{player:'Test Bat',player_id:1,team:'TB',lineup:3},stats:st,teamExpectedRuns:5,opponentStarter:{HR9:1.5},parkHrFactor:1.1,sims:6000});
assert(x.markets.hr.pct>0&&x.markets.hit1.pct>x.markets.hr.pct&&x.markets.tb2.pct>0);
console.log('SIM PLAYER PASS');
