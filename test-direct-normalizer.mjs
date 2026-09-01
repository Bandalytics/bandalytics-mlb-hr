import assert from'node:assert/strict';import{mergeDirectState,appendQuoteHistory,historyDerivedSignals,promotedLegacyLenses}from'./direct-normalizer.mjs';
const market=[{player:'Max Muncy',team:'LAD',player_id:571970,open:360,now:343,matchup:'LAD @ DET'},{player:'Max Muncy',team:'ATH',player_id:691777,open:475,now:450,matchup:'ATH @ BAL'},{player:'Joc Pederson',team:'TEX',player_id:592626,open:600,now:575}];
const lineup=[{player:'Max Muncy',team:'LAD',player_id:571970,lineup:4,opp_pitcher:'Drew Anderson'},{player:'Max Muncy',team:'ATH',player_id:691777,lineup:6,opp_pitcher:'Brandon Young'},{player:'TJ Friedl',team:'CIN',player_id:670770,lineup:1}];
let hist=appendQuoteHistory([],market,{seenAt:1});hist=appendQuoteHistory(hist,[{player:'Max Muncy',team:'LAD',player_id:571970,odds:330,book:'x'}],{seenAt:2});
const s=mergeDirectState({market,lineup,quoteHistory:hist});
assert.equal(s.length,4);const lad=s.find(x=>x.player==='Max Muncy'&&x.team==='LAD'),ath=s.find(x=>x.player==='Max Muncy'&&x.team==='ATH'),joc=s.find(x=>x.player==='Joc Pederson'),tj=s.find(x=>x.player==='TJ Friedl');
assert.equal(lad.player_id,571970);assert.equal(ath.player_id,691777);assert.equal(lad.opp,'Drew Anderson');assert.equal(ath.opp,'Brandon Young');assert.equal(joc.direct_status,'MARKET_ONLY');assert.equal(joc.research_only,false);assert.equal(tj.direct_status,'UNPRICED_RESEARCH');assert.equal(tj.research_only,true);assert.equal(lad.quote_history.length,2);assert.equal(historyDerivedSignals(lad).steam_research,true);

const partial=mergeDirectState({market:[{player:'Max Muncy',team:'LAD',player_id:571970,now:343}],profiles:[{player:'Max Muncy',team:'LAD',player_id:571970,ev:90.5,hard_hit:45.9,barrel:13.1,iso:.245,pullair:null,blast:null,scoring_eligible:false,status:'RESEARCH_PARTIAL'}]})[0];
assert.equal(partial.profile_research_ready,true);assert.equal(partial.profile_ready,false);assert.equal(partial.profile_scoring_eligible,false);assert.match(partial.profile_reason,/not parity-approved/);
const verified=mergeDirectState({market:[{player:'Test Bat',team:'ATL',now:500,parity_verified:true}],profiles:[{player:'Test Bat',team:'ATL',ev:91,hard_hit:50,barrel:14,iso:.24,pullair:22,blast:12,scoring_eligible:true,parity_verified:true,status:'PARITY_VERIFIED'}],bbe:[{player:'Test Bat',team:'ATL',parity_verified:true}],starter:[{player:'Test Bat',team:'ATL',opp_pitcher:'Starter',parity_verified:true}],pitchfit:[{player:'Test Bat',team:'ATL',score:50,status:'TRUE',identity_verified:true,parity_verified:true}],environment:[{player:'Test Bat',team:'ATL',parity_verified:true}]})[0];
assert.equal(verified.profile_ready,true);assert.equal(verified.profile_scoring_eligible,true);assert.equal(verified.profile_parity_verified,true);assert.equal(verified.bbe_parity_verified,true);assert.equal(verified.starter_parity_verified,true);assert.equal(verified.pitchfit_parity_verified,true);assert.equal(verified.environment_parity_verified,true);

let unsafe=mergeDirectState({market:[{player:'Max Muncy',team:'LAD',open:400,now:400}],profiles:[{player:'Max Muncy',team:'LAD',ev:90,hard_hit:45,barrel:12,iso:.220,pullair:22,blast:12,scoring_eligible:true,parity_verified:false}]})[0];assert.equal(unsafe.profile_ready,false);assert.equal(unsafe.profile_scoring_eligible,false);assert.equal(unsafe.profile_parity_verified,false);
console.log('direct normalizer PASS');

assert.deepEqual(promotedLegacyLenses({open:600,now:450}),['Sharp Money']);
assert.deepEqual(promotedLegacyLenses({open:450,now:600}),[]);
