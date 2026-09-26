import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {buildNativeFeed} from '../native-feed-core.mjs';
import {fetchText,parseCsv,pitcherDamage,savantPitcherUrl} from '../starter-native-core.mjs';

function etDate(d=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function band(hr9,small){if(small)return'SMALL_SAMPLE';if(!Number.isFinite(hr9))return'UNAVAILABLE';if(hr9<1.2)return'LOW_LT_1_2';if(hr9<1.5)return'MID_1_2_TO_1_5';return'HIGH_GE_1_5'}
function splitFor(x,d){const s=String(x.bat_side||'').toUpperCase();return s==='L'?d.vs_lhb:s==='R'?d.vs_rhb:d.overall}
const date=/^\d{4}-\d{2}-\d{2}$/.test(String(process.argv[2]||''))?process.argv[2]:etDate();
const outPath=process.argv[3]||`snapshots/v38-starter-damage-snapshot-${date}.json`;
const feed=await buildNativeFeed({date,timeoutMs:16000});
const lineups=(feed.lineup_players||[]).filter(x=>Number.isInteger(+x.player_id)&&Number.isInteger(+x.opp_pitcher_id));
const pitcherIds=[...new Set(lineups.map(x=>+x.opp_pitcher_id))];
let raw=[],fetch_error=null;
try{const csv=await fetchText(savantPitcherUrl(pitcherIds,date),{timeoutMs:45000});raw=parseCsv(csv)}catch(e){fetch_error=String(e?.message||e)}
const damages=new Map(pitcherIds.map(id=>[id,pitcherDamage(raw,id)]));
const captured_at=new Date().toISOString();
const rows=lineups.map(x=>{const d=damages.get(+x.opp_pitcher_id)||pitcherDamage([],x.opp_pitcher_id),s=splitFor(x,d),hr9=Number.isFinite(s.hr9)?+s.hr9.toFixed(3):null;return{gamePk:Number.isInteger(+x.gamePk)?+x.gamePk:null,player_id:+x.player_id,player:x.player||null,team:x.team||null,lineup:Number.isFinite(+x.lineup)?+x.lineup:null,matchup:x.matchup||null,bat_side:x.bat_side||null,pitcher_id:+x.opp_pitcher_id,pitcher:x.opp_pitcher||null,pitcher_hand:x.opp_pitcher_hand||null,split:s===d.vs_lhb?'vs_lhb':s===d.vs_rhb?'vs_rhb':'overall',ip:+(s.ip||0).toFixed(1),small_ip:s.small_ip===true,hr9,starter_hr9_band:band(s.hr9,s.small_ip),iso_allowed:Number.isFinite(s.iso)?+s.iso.toFixed(3):null,slg_allowed:Number.isFinite(s.slg)?+s.slg.toFixed(3):null,ev_allowed:Number.isFinite(s.ev)?+s.ev.toFixed(1):null,hard_hit_allowed:Number.isFinite(s.hard_hit)?+s.hard_hit.toFixed(1):null,barrel_allowed:Number.isFinite(s.barrel)?+s.barrel.toFixed(1):null};});
const body={protocol:'V38_STARTER_DAMAGE_SNAPSHOT_V1',date,captured_at,point_in_time:true,as_of_verified:true,as_of_rule:'Baseball Savant pitcher search uses game_date_lt equal to the slate date.',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,locked_rule_reference:'SP HR/9 < 1.2 is suppressive and requires exceptional convergence; <17.1 IP remains small-sample caution.',lineup_rows:lineups.length,pitchers:pitcherIds.length,statcast_rows:raw.length,fetch_error,rows};
const output={...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
await fs.mkdir(outPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});
await fs.writeFile(outPath,JSON.stringify(output,null,2)+'\n');
console.log(`V38_STARTER_DAMAGE_SNAPSHOT_PATH=${outPath}`);
console.log(`V38_STARTER_DAMAGE_SNAPSHOT=${JSON.stringify({date,captured_at,rows:rows.length,pitchers:pitcherIds.length,statcast_rows:raw.length,fetch_error,sha256:output.sha256})}`);
