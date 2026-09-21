import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const seal=body=>({...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')});
const reseal=(obj,patch)=>{const{sha256,...body}=obj;return seal({...body,...patch})};
const date='2026-09-21';
const profile=seal({snapshot_protocol:'V38_PREGAME_SNAPSHOT_V1',date,point_in_time:true,research_only:true,items:[
  {player_id:101,player:'Alpha Batter',team_id:1},
  {player_id:202,player:'Beta Batter',team_id:2}
]});
const context=seal({context_protocol:'V38_CONTEXT_SNAPSHOT_V1',date,point_in_time:true,research_only:true,lineup_rows:[
  {gamePk:9001,player_id:101,player:'Alpha Batter',team:'AAA',lineup:2},
  {gamePk:9001,player_id:202,player:'Beta Batter',team:'BBB',lineup:5}
],market_rows:[
  {player_id:101,identity_status:'EXACT',best_odds:850,best_book:'Book A'}
]});
const good={date,rows:[
  {player:'Alpha Batter',final_cut:true,exposure_state:'PRIORITY',ticket_paths:1,evidence_lanes:['PROFILE','MATCHUP']},
  {player:'Beta Batter',final_cut:true,exposure_state:'ONE_PATH',ticket_paths:1,evidence_lanes:['PROFILE'],hr_odds:650}
],tickets:[['Alpha Batter','Beta Batter']]};
for(const [n,z] of Object.entries({profile,context,good}))await fs.writeFile(`/tmp/hyd-${n}.json`,JSON.stringify(z));
const run=(draft='/tmp/hyd-good.json',p='/tmp/hyd-profile.json',c='/tmp/hyd-context.json')=>spawnSync(process.execPath,['scripts/hydrate-v38-execution-draft.mjs',draft,p,c],{encoding:'utf8'});
let r=run();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/V38_EXECUTION_DRAFT_HYDRATED=/);
const meta=JSON.parse(r.stdout.trim().split('\n').find(x=>x.startsWith('V38_EXECUTION_DRAFT_HYDRATED=')).slice('V38_EXECUTION_DRAFT_HYDRATED='.length));
const out=JSON.parse(await fs.readFile(meta.outfile,'utf8'));
assert.equal(out.rows[0].player_id,101);assert.equal(out.rows[0].gamePk,9001);assert.equal(out.rows[0].lineup,2);assert.equal(out.rows[0].opportunity_verified,true);assert.equal(out.rows[0].observed_starting_lineup,true);assert.equal(out.rows[0].hr_odds,850);assert.equal(out.rows[1].hr_odds,650);

const missingLineup=reseal(context,{lineup_rows:[context.lineup_rows[0]]});await fs.writeFile('/tmp/hyd-missing-context.json',JSON.stringify(missingLineup));
r=run('/tmp/hyd-good.json','/tmp/hyd-profile.json','/tmp/hyd-missing-context.json');assert.notEqual(r.status,0);assert.match(r.stderr,/FINAL CUT player missing from confirmed lineup context: Beta Batter/);

const badId={...good,rows:[{...good.rows[0],player_id:999},good.rows[1]]};await fs.writeFile('/tmp/hyd-bad-id.json',JSON.stringify(badId));
r=run('/tmp/hyd-bad-id.json');assert.notEqual(r.status,0);assert.match(r.stderr,/player_id mismatch|cannot uniquely resolve/);

const dupProfile=reseal(profile,{items:[...profile.items,{player_id:303,player:'Alpha Batter',team_id:3}]});await fs.writeFile('/tmp/hyd-dup-profile.json',JSON.stringify(dupProfile));
r=run('/tmp/hyd-good.json','/tmp/hyd-dup-profile.json','/tmp/hyd-context.json');assert.notEqual(r.status,0);assert.match(r.stderr,/cannot uniquely resolve player identity for Alpha Batter: 2 profile matches/);
console.log('V38 EXECUTION DRAFT HYDRATOR CONTRACT PASS');
