import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const [draftFile,profileFile,contextFile]=process.argv.slice(2);
if(!draftFile||!profileFile||!contextFile)throw Error('usage: node scripts/hydrate-v38-execution-draft.mjs <draft.json> <profile.json> <context.json>');
const [draft,profile,context]=await Promise.all([draftFile,profileFile,contextFile].map(async f=>JSON.parse(await fs.readFile(f,'utf8'))));
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+(jr|sr|ii|iii|iv|v)$/,'').trim();
function verify(obj,label){
  if(typeof obj?.sha256!=='string')throw Error(`${label} sha256 required`);
  const {sha256,...body}=obj;
  const calc=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  if(calc!==sha256)throw Error(`${label} sha256 mismatch`);
}
verify(profile,'profile snapshot');verify(context,'context snapshot');
if(profile.snapshot_protocol!=='V38_PREGAME_SNAPSHOT_V1'||profile.point_in_time!==true)throw Error('valid point-in-time profile snapshot required');
if(context.context_protocol!=='V38_CONTEXT_SNAPSHOT_V1'||context.point_in_time!==true)throw Error('valid point-in-time context snapshot required');
const date=String(draft?.date||'');
if(!/^2026-\d\d-\d\d$/.test(date)||profile.date!==date||context.date!==date)throw Error('date mismatch');
const rows=Array.isArray(draft?.rows)?draft.rows:[];if(!rows.length)throw Error('draft rows required');
const tickets=Array.isArray(draft?.tickets)?draft.tickets:[];
const profiles=Array.isArray(profile?.items)?profile.items:[];
const lineups=Array.isArray(context?.lineup_rows)?context.lineup_rows:[];
const markets=Array.isArray(context?.market_rows)?context.market_rows:[];
const byName=new Map();
for(const p of profiles){const k=norm(p.player);if(!k)continue;if(!byName.has(k))byName.set(k,[]);byName.get(k).push(p)}
const lineupById=new Map();for(const l of lineups){const id=Number(l.player_id);if(Number.isInteger(id))lineupById.set(id,l)}
const marketById=new Map();for(const m of markets){const id=Number(m.player_id);if(Number.isInteger(id)&&m.identity_status==='EXACT')marketById.set(id,m)}
const hydrated=[];
for(const r of rows){
  const player=String(r?.player||'').trim();if(!player)throw Error('every draft row requires player');
  let pid=Number(r?.player_id);
  let p=null;
  if(Number.isInteger(pid))p=profiles.find(x=>Number(x.player_id)===pid)||null;
  if(!p){const hits=byName.get(norm(player))||[];if(hits.length!==1)throw Error(`cannot uniquely resolve player identity for ${player}: ${hits.length} profile matches`);p=hits[0];pid=Number(p.player_id)}
  if(!Number.isInteger(pid))throw Error(`resolved player_id invalid for ${player}`);
  const l=lineupById.get(pid)||null;
  const isFinal=r?.final_cut===true;
  if(isFinal&&!l)throw Error(`FINAL CUT player missing from confirmed lineup context: ${player}`);
  if(l&&(!Number.isInteger(Number(l.gamePk))||Number(l.lineup)<1||Number(l.lineup)>9))throw Error(`invalid lineup identity for ${player}`);
  if(Number.isInteger(Number(r?.gamePk))&&l&&Number(r.gamePk)!==Number(l.gamePk))throw Error(`gamePk mismatch for ${player}`);
  if(Number.isInteger(Number(r?.player_id))&&Number(r.player_id)!==pid)throw Error(`player_id mismatch for ${player}`);
  if(r?.opportunity_verified===true&&r?.observed_starting_lineup===false&&isFinal)throw Error(`FINAL CUT contradicts confirmed starting lineup for ${player}`);
  const m=marketById.get(pid)||null;
  const draftOdds=Number(r?.hr_odds??r?.odds??r?.american_odds);
  const marketOdds=Number(m?.best_odds);
  const hrOdds=Number.isFinite(draftOdds)?draftOdds:Number.isFinite(marketOdds)?marketOdds:null;
  hydrated.push({...r,player:p.player||player,player_id:pid,team:r?.team??l?.team??p?.team??null,gamePk:l?Number(l.gamePk):(Number.isInteger(Number(r?.gamePk))?Number(r.gamePk):null),lineup:l?Number(l.lineup):(r?.lineup??null),lineup_type:l?'CONFIRMED':(r?.lineup_type??null),opportunity_verified:l?true:(r?.opportunity_verified===true),observed_starting_lineup:l?true:(r?.observed_starting_lineup??null),hr_odds:hrOdds,identity_source:'PREGAME_PROFILE_PLUS_CONTEXT',market_identity_status:m?.identity_status||null,market_book:m?.best_book||null});
}
const body={...draft,rows:hydrated,tickets,date,hydration_protocol:'BANDALYTICS_EXECUTION_DRAFT_HYDRATION_V1',hydrated_at:new Date().toISOString(),profile_snapshot_sha256:profile.sha256,context_snapshot_sha256:context.sha256,point_in_time:true,research_only:true};
const sha256=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
const out={...body,sha256};
await fs.mkdir('hydrated-execution-drafts',{recursive:true});
const outfile=path.join('hydrated-execution-drafts',`${date}-${out.hydrated_at.replace(/[:.]/g,'-')}.json`);
await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n');
console.log('V38_EXECUTION_DRAFT_HYDRATED='+JSON.stringify({outfile,date,rows:hydrated.length,final_cut_rows:hydrated.filter(r=>r.final_cut===true).length,confirmed_final_cut_rows:hydrated.filter(r=>r.final_cut===true&&r.opportunity_verified===true&&r.observed_starting_lineup===true).length,rows_with_odds:hydrated.filter(r=>Number.isFinite(Number(r.hr_odds))).length,sha256}));
