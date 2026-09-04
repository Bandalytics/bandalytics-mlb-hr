import fs from 'node:fs/promises';

const src=await fs.readFile('bandalytics-dashboard-shell.js','utf8');
const fail=m=>{throw new Error('V38 DASHBOARD INTEGRITY: '+m)};

for(const marker of [
  "researchOnly:true",
  "scoringChanged:false",
  "evidenceChanged:false",
  "gameIdentityChanged:false",
  "profileGateChanged:false",
  "longshotRuleChanged:false",
  "gameClassificationWithheldUntilContext:true",
  "visualTakeover:true",
  "profile_passes>=5",
  "classification:'WITHHELD'",
  "environmentHydration:true",
  "environmentProtocol:'V38_ENVIRONMENT_NATIVE_V1'",
  "environmentStandaloneBoost:false",
  "environmentClassificationEligible:false",
  "/api/environment-native?date=",
  "exact_game_identity===true",
  "7 visible layers",
  "1.2",
  "17.1"
]) if(!src.includes(marker)) fail('missing marker '+marker);

for(const forbidden of [
  'Game Score',
  '78/100',
  'Elite HR Game',
  'profile_passes>=4',
  'profile_passes > 3',
  'fill to target',
  'scoringChanged:true',
  'evidenceChanged:true',
  'gameIdentityChanged:true',
  'environmentStandaloneBoost:true',
  'environmentClassificationEligible:true',
  'generic_team_workload_can_boost:true'
]) if(src.includes(forbidden)) fail('forbidden dashboard behavior/copy: '+forbidden);

if(!/data-game=\\?"\$\{esc\(g\.gamePk\)\}/.test(src)) fail('exact gamePk selector missing');
if(!src.includes("document.body.classList.add('bandalytics-combined-live')")) fail('combined visual takeover hook missing');
if(!src.includes("gamePk='+encodeURIComponent(g.gamePk)")) fail('environment request not exact-game scoped');

console.log('V38 DASHBOARD INTEGRITY PASS');
