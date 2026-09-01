import assert from'node:assert/strict';import{summarizeStatcast,normalizeProfileEntity}from'./profile-adapter.mjs';
const rows=[
 {launch_speed:100,bb_type:'fly_ball',launch_speed_angle:6,events:'home_run'},
 {launch_speed:96,bb_type:'line_drive',launch_speed_angle:4,events:'double'},
 {launch_speed:90,bb_type:'ground_ball',launch_speed_angle:2,events:'field_out'},
 {events:'walk'}
];
const s=summarizeStatcast(rows);assert.equal(s.bbe_sample,3);assert.equal(s.ab_sample,3);assert.equal(s.hard_hit,200/3);assert.equal(s.barrel,100/3);assert.equal(s.iso,4/3);assert.equal(s.pullair,null);assert.equal(s.blast,null);
const p=normalizeProfileEntity({player:'Test',team:'LAD',player_id:1,rows});assert.equal(p.scoring_eligible,false);assert.equal(p.profile_status,'RESEARCH_PARTIAL');assert.deepEqual(p.unsupported_fields,['pullair','blast']);
console.log('profile adapter PASS');
