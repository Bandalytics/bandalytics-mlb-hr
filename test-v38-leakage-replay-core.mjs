import assert from'node:assert/strict';
import{profileGate,candidatePowerScore,summarizeReplay,daysBetween}from'./v38-leakage-replay-core.mjs';

const elite={ev:92,hh:50,barrel:15,iso:.250,pullair:25,sweet:34,blast:14};
const weak={ev:87,hh:30,barrel:5,iso:.120,pullair:12,sweet:24,blast:4};
assert.equal(profileGate(elite).pass,6);
assert.equal(profileGate(elite).longshot_profile,true);
assert.equal(profileGate(elite).foundation_boost,true);
assert.equal(profileGate(weak).pass,0);
assert.equal(profileGate(weak).longshot_profile,false);
assert.ok(candidatePowerScore(elite)>candidatePowerScore(weak));
const s=summarizeReplay([
 {player_id:1,homer:true,profile_complete:true,longshot_profile:true,foundation_boost:true,profile_score:90},
 {player_id:2,homer:true,profile_complete:true,longshot_profile:true,foundation_boost:false,profile_score:70},
 {player_id:3,homer:false,profile_complete:true,longshot_profile:false,foundation_boost:false,profile_score:20},
 {player_id:4,homer:false,profile_complete:true,longshot_profile:true,foundation_boost:false,profile_score:50}
]);
assert.equal(s.hr_hitters,2);
assert.equal(s.non_hr_hitters,2);
assert.equal(s.longshot_4of6_rate_hr,100);
assert.equal(s.longshot_4of6_rate_non_hr,50);
assert.equal(daysBetween('2026-08-26','2026-09-02'),7);
console.log('V38 LEAKAGE REPLAY CORE PASS');
