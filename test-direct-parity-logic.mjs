import fs from'node:fs/promises';import vm from'node:vm';import assert from'node:assert/strict';
const s=await fs.readFile('direct-parity-compare.js','utf8');
const context={window:{},P:{
 a:{player:'Max Muncy',team:'LAD',player_id:571970,lineup:4,opp:'Drew Anderson',ev:90.9,hh:47,barrel:11.8,iso:.234},
 b:{player:'Max Muncy',team:'ATH',player_id:691777,lineup:5,opp:'Brandon Young',ev:88,hh:40,barrel:8,iso:.180}
}};vm.createContext(context);vm.runInContext(s,context);
const z=context.window.BANDALYTICS_DIRECT_PARITY.compare({items:[
 {player:'Max Muncy',team:'LAD',player_id:571970,lineup:4,opp_pitcher:'Drew Anderson',ev:90.9,hard_hit:47,barrel:11.8,iso:.234},
 {player:'Max Muncy',team:'OAK',player_id:691777,lineup:5,opp_pitcher:'Brandon Young',ev:88,hard_hit:40,barrel:8,iso:.180}
]});
assert.equal(z.overlap,2);assert.equal(z.identity.known,2);assert.equal(z.identity.match,2);assert.equal(z.lineup.match,2);assert.equal(z.starter.match,2);assert.equal(z.profile.compared,2);assert.equal(z.profile.ev_match,2);assert.equal(z.profile.hh_match,2);assert.equal(z.profile.barrel_match,2);assert.equal(z.profile.iso_match,2);assert.equal(z.scoring_enabled,false);
console.log('DIRECT PARITY LOGIC PASS');
