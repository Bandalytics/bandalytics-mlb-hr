import fs from 'node:fs/promises';
const s=await fs.readFile('postdeploy-smoke.mjs','utf8');
for(const marker of ["root cache-control is not no-store","asset not immutable","direct_mode not RESEARCH_ONLY","research contract scoring enabled","pool-before-tickets invariant missing","Sharp Money not LOCKED","v37 direct gate not BLOCKED","Final Pool direct gate not BLOCKED","Tickets direct gate not BLOCKED","duplicate Max Muncy IDs collapsed","8/27 HR events regression","mixed-date isolation guard missing","historical replay status guard missing"]){if(!s.includes(marker))throw new Error('postdeploy smoke missing '+marker)}
console.log('POSTDEPLOY SMOKE CONTRACT PASS');
