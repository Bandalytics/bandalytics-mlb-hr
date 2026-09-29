import fs from 'node:fs';
import crypto from 'node:crypto';

const [inputPath,outPathArg]=process.argv.slice(2);
if(!inputPath) throw Error('Usage: node scripts/capture-v38-external-shadow-snapshot.mjs <input.json> [output.json]');
const input=JSON.parse(fs.readFileSync(inputPath,'utf8'));
if(input.protocol!=='V38_EXTERNAL_SHADOW_INPUT_V1') throw Error('invalid external shadow input protocol');
if(!/^\d{4}-\d{2}-\d{2}$/.test(String(input.date||''))) throw Error('invalid date');
if(!input.captured_at||!Number.isFinite(Date.parse(input.captured_at))) throw Error('invalid captured_at');
const provider=String(input.provider||'').toUpperCase();
if(!['LINESTAR','OPTIMAL_BET','VIG'].includes(provider)) throw Error('unsupported external shadow provider');
const sourceRef=String(input.source_ref||'').trim();
if(sourceRef.length<8||/^manual$|^unknown$|^source$/i.test(sourceRef)) throw Error('external shadow source_ref must be a specific verifiable reference');
if(!Array.isArray(input.rows)||!input.rows.length) throw Error('external shadow rows missing');
const seen=new Set();
const numOrNull=v=>v==null||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
const rows=input.rows.map((r,i)=>{
  const player_id=Number(r.player_id),gamePk=Number(r.gamePk),start_time=String(r.start_time||'');
  if(!Number.isInteger(player_id)||player_id<=0||!Number.isInteger(gamePk)||gamePk<=0) throw Error(`invalid identity row ${i+1}`);
  if(!Number.isFinite(Date.parse(start_time))||Date.parse(input.captured_at)>=Date.parse(start_time)) throw Error(`external shadow evidence not strictly pregame for ${player_id}`);
  const market=String(r.market||'').trim().toUpperCase(); if(!market) throw Error(`missing market for ${player_id}`);
  const key=`${player_id}:${gamePk}:${market}`; if(seen.has(key)) throw Error(`duplicate external shadow row ${key}`); seen.add(key);
  return {player_id,player:r.player?String(r.player):null,gamePk,start_time,market,selection:r.selection?String(r.selection):null,sportsbook:r.sportsbook?String(r.sportsbook):null,american_odds:numOrNull(r.american_odds),provider_projection:numOrNull(r.provider_projection),provider_edge_pct:numOrNull(r.provider_edge_pct),provider_grade:r.provider_grade?String(r.provider_grade):null,l5_hit_pct:numOrNull(r.l5_hit_pct),l10_hit_pct:numOrNull(r.l10_hit_pct),provider_signal:r.provider_signal?String(r.provider_signal):null,notes:r.notes?String(r.notes):null};
});
const body={protocol:'V38_EXTERNAL_SHADOW_SNAPSHOT_V1',date:input.date,captured_at:new Date(input.captured_at).toISOString(),provider,source_ref:sourceRef,point_in_time:true,research_only:true,scoring_enabled:false,decision_authority:false,production_input:false,outcome_input:false,row_count:rows.length,rows,notes:['External research evidence is captured only as an immutable shadow layer.','It cannot change Core6, candidate ranking, ticket membership, frozen sportsbook prices, or stakes during the initial 2027 canary gate.','Any future promotion requires a predeclared development hypothesis and separate forward validation.']};
const output={...body,sha256:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
const out=outPathArg||`snapshots/v38-external-shadow-${provider.toLowerCase()}-${input.date}.json`;
fs.mkdirSync(out.split('/').slice(0,-1).join('/')||'.',{recursive:true});fs.writeFileSync(out,JSON.stringify(output,null,2)+'\n');
console.log('V38_EXTERNAL_SHADOW='+JSON.stringify({provider,date:output.date,rows:output.row_count,sha256:output.sha256}));
