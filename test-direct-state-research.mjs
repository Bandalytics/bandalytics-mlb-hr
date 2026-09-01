import assert from'node:assert/strict';
import{buildResearchDirectState,REQUIRED_DIRECT_PARITY_GATES}from'./direct-state-research.mjs';
const roster={roster:[{person:{id:571970,fullName:'Max Muncy'}},{person:{id:691777,fullName:'Other'}}]};
const fetcher=async()=>({ok:true,json:async()=>roster});
const z=await buildResearchDirectState({date:'2026-08-28',fetcher,market:[{player:'Max Muncy',team:'LAD',open:319,now:343}],lineup:[{player:'Max Muncy',team:'LAD',player_id:571970,lineup:4}],profiles:[{player:'Max Muncy',team:'LAD',player_id:571970,ev:90.5,hard_hit:45.9,barrel:13.1,iso:.245,scoring_eligible:false,status:'RESEARCH_PARTIAL'}]});
assert.equal(z.research_only,true);assert.equal(z.v37_scoring_enabled,false);assert.deepEqual(z.required_parity_gates,[...REQUIRED_DIRECT_PARITY_GATES]);assert.equal(z.resolved_market,1);assert.equal(z.unresolved_market,0);assert.equal(z.items[0].player_id,571970);assert.equal(z.items[0].direct_scoring_eligible,false);assert.equal(z.items[0].direct_structurally_ready,false);assert.deepEqual(z.items[0].direct_scoring_blockers,['market','profile','bbe','lineup','starter','pitchfit','environment']);assert.equal(z.items[0].v37_scoring_enabled,false);
const full=await buildResearchDirectState({date:'2026-08-28',fetcher,
 market:[{player:'Max Muncy',team:'LAD',open:319,now:343,parity_verified:true}],
 lineup:[{player:'Max Muncy',team:'LAD',player_id:571970,lineup:4,parity_verified:true}],
 profiles:[{player:'Max Muncy',team:'LAD',player_id:571970,ev:90.5,hard_hit:45.9,barrel:13.1,iso:.245,pullair:22,blast:12,scoring_eligible:true,parity_verified:true,status:'PARITY_VERIFIED'}],
 bbe:[{player:'Max Muncy',team:'LAD',player_id:571970,parity_verified:true}],
 starter:[{player:'Max Muncy',team:'LAD',player_id:571970,opp_pitcher:'Drew Anderson',opp_id:999,hr9:1.5,parity_verified:true}],
 pitchfit:[{player:'Max Muncy',team:'LAD',player_id:571970,score:50,coverage:1,sample:50,status:'TRUE',identity_verified:true,parity_verified:true}],
 environment:[{player:'Max Muncy',team:'LAD',player_id:571970,parity_verified:true}]
});
assert.equal(full.items[0].direct_structurally_ready,true);assert.deepEqual(full.items[0].direct_scoring_blockers,[]);assert.equal(full.items[0].direct_scoring_eligible,false);assert.equal(full.items[0].v37_scoring_enabled,false);
const q=await buildResearchDirectState({date:'2026-08-28',fetcher,market:[{player:'Nobody',team:'LAD',now:800}]});assert.equal(q.unresolved_market,1);assert.equal(q.items[0].direct_status,'IDENTITY_PENDING');assert.equal(q.items[0].direct_structurally_ready,false);
console.log('DIRECT STATE RESEARCH PASS');
