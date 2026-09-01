import assert from'node:assert/strict';
import{contactEventScore,hrEventScore,bbeSummary,estimatePulled,buildSavantBbeUrl,summarizeBbeCsv}from'./bbe-core.mjs';
assert.equal(contactEventScore({ev:100,la:20}),96);assert.equal(hrEventScore({ev:100,la:25,dist:390,pulled:1}),100);assert.equal(estimatePulled({hc_x:'110',stand:'R'}),1);assert.equal(estimatePulled({hc_x:'140',stand:'L'}),1);
const evs=Array.from({length:15},(_,i)=>({ev:i<10?90:105,la:25,dist:i<10?320:400,pulled:i>=10?1:0,sequence:i}));const s=bbeSummary(evs);assert.equal(s.n,15);assert.equal(s.trend,'RISING');assert.equal(s.hrq,5);assert.equal(s.ev105,5);
const {start,end,url}=buildSavantBbeUrl({ids:[621566,660670],date:'2026-08-30'});assert.equal(start,'2026-08-09');assert.equal(end,'2026-08-29');assert(url.includes('batters_lookup%5B%5D=621566'));
const csv='batter,game_date,at_bat_number,pitch_number,launch_speed,launch_angle,hit_distance_sc,hc_x,stand\n621566,2026-08-29,1,1,100,25,390,110,R\n';const o=summarizeBbeCsv(csv,{ids:[621566],date:'2026-08-30'})[0];assert.equal(o.tracked_bbe,1);assert.equal(o.bbe.hrq,1);assert.equal(o.start,'2026-08-09');console.log('NATIVE BBE PASS');
