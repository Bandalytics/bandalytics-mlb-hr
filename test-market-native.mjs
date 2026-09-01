import assert from 'node:assert/strict';
import {americanNumber,impliedFromAmerican,buildIdentityIndex,normalizeSportsGameOdds} from './market-native-core.mjs';
assert.equal(americanNumber('+267'),267);
assert.equal(americanNumber('-120'),-120);
assert.ok(Math.abs(impliedFromAmerican(300)-.25)<1e-12);
const identityPlayers=[
 {player_id:665487,player:'Fernando Tatis Jr.',team:'SD'},
 {player_id:592518,player:'Manny Machado',team:'SD'},
];
const events=[{
 eventID:'evt1',awayTeamID:'SD',homeTeamID:'CIN',
 teams:{away:{abbreviation:'SD'},home:{abbreviation:'CIN'}},
 players:{
  FERNANDO_TATIS_JR_1_MLB:{playerID:'FERNANDO_TATIS_JR_1_MLB',teamID:'SAN_DIEGO_PADRES_MLB',name:'Fernando Tatis Jr.'},
  MANNY_MACHADO_1_MLB:{playerID:'MANNY_MACHADO_1_MLB',teamID:'SAN_DIEGO_PADRES_MLB',name:'Manny Machado'}
 },
 odds:{
  'batting_homeRuns-FERNANDO_TATIS_JR_1_MLB-game-yn-yes':{
   statID:'batting_homeRuns',statEntityID:'FERNANDO_TATIS_JR_1_MLB',playerID:'FERNANDO_TATIS_JR_1_MLB',periodID:'game',betTypeID:'yn',sideID:'yes',bookOdds:'+285',fairOdds:'+305',
   byBookmaker:{draftkings:{odds:'+268',openOdds:'+310',available:true},fanduel:{odds:'+275',openOdds:'+320',available:true},betmgm:{odds:'+300',openOdds:'+300',available:true}}
  }
 }
}];
const out=normalizeSportsGameOdds(events,{identityIndex:buildIdentityIndex(identityPlayers),allowedMatchups:['SD @ CIN']});
assert.equal(out.rows.length,1);
assert.equal(out.rows[0].player_id,665487);
assert.equal(out.rows[0].best_odds,300);
assert.equal(out.rows[0].signal,'STEAM');
const stale=normalizeSportsGameOdds(events,{identityPlayers,allowedMatchups:['BAL @ COL']});
assert.equal(stale.rows.length,0);assert.equal(stale.rejected[0].reason,'STALE_MATCHUP');
const dup=normalizeSportsGameOdds(events,{identityPlayers:[...identityPlayers,{player_id:999999,player:'Fernando Tatis Jr.',team:'SD'}],allowedMatchups:['SD @ CIN']});
assert.equal(dup.rows[0].player_id,null);assert.equal(dup.rows[0].identity_status,'UNRESOLVED');
console.log('NATIVE MARKET ADAPTER PASS');
