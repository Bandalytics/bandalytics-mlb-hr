import fs from'node:fs/promises';
import{buildNativeFeed}from'../native-feed-core.mjs';
import{fetchText,parseCsv,pitcherDamage,savantPitcherUrl}from'../starter-native-core.mjs';

function etDate(d=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
const requested=process.argv[2],profilePath=process.argv[3],date=/^2026-\d\d-\d\d$/.test(String(requested||''))?requested:etDate();
const feed=await buildNativeFeed({date,timeoutMs:16000});
const lineups=(feed.lineup_players||[]).filter(x=>Number.isInteger(+x.player_id)&&Number.isInteger(+x.opp_pitcher_id));
const pitcherIds=[...new Set(lineups.map(x=>+x.opp_pitcher_id))];
let raw=[],fetch_error=null;try{const csv=await fetchText(savantPitcherUrl(pitcherIds,date),{timeoutMs:45000});raw=parseCsv(csv)}catch(e){fetch_error=String(e?.message||e)}
const damages=new Map(pitcherIds.map(id=>[id,pitcherDamage(raw,id)]));
let profileById=new Map();if(profilePath){const p=JSON.parse(await fs.readFile(profilePath,'utf8'));if(p.protocol!=='V38_POINT_IN_TIME_REPLAY_V1'||p.date!==date||p.point_in_time!==true)throw Error('Invalid point-in-time profile artifact');profileById=new Map((p.rows||[]).map(r=>[+r.player_id,r]))}
function splitFor(x,d){const s=String(x.bat_side||'').toUpperCase();return s==='L'?d.vs_lhb:s==='R'?d.vs_rhb:d.overall}
function band(hr9,small){if(small)return'SMALL_SAMPLE';if(!Number.isFinite(hr9))return'UNAVAILABLE';if(hr9<1.2)return'LOW_LT_1_2';if(hr9<1.5)return'MID_1_2_TO_1_5';return'HIGH_GE_1_5'}
const rows=lineups.map(x=>{const d=damages.get(+x.opp_pitcher_id)||pitcherDamage([],x.opp_pitcher_id),s=splitFor(x,d),hr9=Number.isFinite(s.hr9)?+s.hr9.toFixed(3):null,p=profileById.get(+x.player_id)||{};return{player_id:+x.player_id,player:x.player||null,team:x.team||null,lineup:x.lineup??null,matchup:x.matchup||null,bat_side:x.bat_side||null,pitcher_id:+x.opp_pitcher_id,pitcher:x.opp_pitcher||null,pitcher_hand:x.opp_pitcher_hand||null,homer:typeof p.homer==='boolean'?p.homer:null,profile_complete:p.profile_complete===true,gate_count:Number.isFinite(+p.gate_count)?+p.gate_count:null,profile_4of6:p.candidate_rules?.['4of6']===true,profile_4of6_iso:p.candidate_rules?.['4of6_iso']===true,profile_5of6:p.candidate_rules?.['5of6']===true,profile_score:Number.isFinite(+p.profile_score)?+p.profile_score:null,split:s===d.vs_lhb?'vs_lhb':s===d.vs_rhb?'vs_rhb':'overall',ip:+(s.ip||0).toFixed(1),small_ip:s.small_ip===true,hr9,iso_allowed:Number.isFinite(s.iso)?+s.iso.toFixed(3):null,slg_allowed:Number.isFinite(s.slg)?+s.slg.toFixed(3):null,ev_allowed:Number.isFinite(s.ev)?+s.ev.toFixed(1):null,hard_hit_allowed:Number.isFinite(s.hard_hit)?+s.hard_hit.toFixed(1):null,barrel_allowed:Number.isFinite(s.barrel)?+s.barrel.toFixed(1):null,starter_hr9_band:band(s.hr9,s.small_ip)}});
function summarize(set){const withOutcome=set.filter(r=>typeof r.homer==='boolean'),hr=withOutcome.filter(r=>r.homer).length;return{rows:set.length,outcome_rows:withOutcome.length,hr,hr_rate:withOutcome.length?+(100*hr/withOutcome.length).toFixed(2):null}}
const bands={};for(const k of['LOW_LT_1_2','MID_1_2_TO_1_5','HIGH_GE_1_5','SMALL_SAMPLE','UNAVAILABLE'])bands[k]=summarize(rows.filter(r=>r.starter_hr9_band===k));
const metrics=['hr9','iso_allowed','slg_allowed','hard_hit_allowed','barrel_allowed'];const separation={};for(const k of metrics){const h=rows.filter(r=>r.homer===true&&Number.isFinite(r[k])).map(r=>r[k]),n=rows.filter(r=>r.homer===false&&Number.isFinite(r[k])).map(r=>r[k]);const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;const ha=avg(h),na=avg(n);separation[k]={hr_avg:ha==null?null:+ha.toFixed(3),non_hr_avg:na==null?null:+na.toFixed(3),difference:ha==null||na==null?null:+(ha-na).toFixed(3)}}
const interactions={
  low_hr9_all:summarize(rows.filter(r=>r.starter_hr9_band==='LOW_LT_1_2')),
  low_hr9_profile_4of6:summarize(rows.filter(r=>r.starter_hr9_band==='LOW_LT_1_2'&&r.profile_4of6)),
  low_hr9_profile_4of6_iso:summarize(rows.filter(r=>r.starter_hr9_band==='LOW_LT_1_2'&&r.profile_4of6_iso)),
  low_hr9_profile_5of6:summarize(rows.filter(r=>r.starter_hr9_band==='LOW_LT_1_2'&&r.profile_5of6)),
  mid_or_high_profile_4of6_iso:summarize(rows.filter(r=>['MID_1_2_TO_1_5','HIGH_GE_1_5'].includes(r.starter_hr9_band)&&r.profile_4of6_iso)),
  high_hr9_profile_4of6_iso:summarize(rows.filter(r=>r.starter_hr9_band==='HIGH_GE_1_5'&&r.profile_4of6_iso)),
  small_sample_profile_4of6_iso:summarize(rows.filter(r=>r.starter_hr9_band==='SMALL_SAMPLE'&&r.profile_4of6_iso))
};
const out={protocol:'V38_STARTER_DAMAGE_VALIDATION_V2',date,captured_at:new Date().toISOString(),capture_mode:'AS_OF_RECONSTRUCTABLE',point_in_time:true,as_of_verified:true,as_of_rule:'Baseball Savant pitcher search uses game_date_lt equal to the slate date.',research_only:true,scoring_enabled:false,scoring_eligible:false,model_scoring_changed:false,locked_rule_reference:'SP HR/9 < 1.2 requires an exceptional hitter; small IP is caution, not automatic pass/fail.',lineup_rows:lineups.length,pitchers:pitcherIds.length,statcast_rows:raw.length,fetch_error,bands,separation,interactions,rows};
await fs.mkdir('snapshots',{recursive:true});const path=`snapshots/v38-starter-damage-${date}.json`;await fs.writeFile(path,JSON.stringify(out,null,2)+'\n');console.log(`V38_STARTER_DAMAGE_PATH=${path}`);console.log(`V38_STARTER_DAMAGE_SUMMARY=${JSON.stringify({...out,rows:undefined})}`);
