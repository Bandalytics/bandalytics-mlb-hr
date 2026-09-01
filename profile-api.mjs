// Research-only direct Baseball Savant profile API helpers.
// These primitives intentionally cannot create a scoring-eligible v37 profile.
import {summarizeStatcast,normalizeProfileEntity} from './profile-adapter.mjs';

export const PROFILE_DIRECT_FIELDS=Object.freeze(['ev','hard_hit','barrel','iso']);
export const PROFILE_PENDING_FIELDS=Object.freeze(['pullair','blast']);

export function parseCsv(text=''){
  const rows=[]; let row=[],field='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(c==='"'){
      if(q&&n==='"'){field+='"';i++;} else q=!q;
    } else if(c===','&&!q){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(field);field='';if(row.some(x=>x!==''))rows.push(row);row=[];}
    else field+=c;
  }
  if(field||row.length){row.push(field);rows.push(row)}
  if(!rows.length)return [];
  const h=rows[0].map(x=>x.trim());
  return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])));
}

export function buildSavantProfileUrl({playerIds=[],start='2026-03-01',end,season=2026}={}){
  if(!end)throw new Error('end required');
  const ids=[...new Set(playerIds.map(Number).filter(Number.isInteger))];
  if(!ids.length)throw new Error('playerIds required');
  const p=new URLSearchParams({all:'true',hfGT:'R|',hfSea:`${season}|`,player_type:'batter',game_date_gt:start,game_date_lt:end,type:'details'});
  for(const id of ids)p.append('batters_lookup[]',String(id));
  return 'https://baseballsavant.mlb.com/statcast_search/csv?'+p.toString();
}

export function summarizeSavantCsv(csvText,entities=[]){
  const rows=parseCsv(csvText),byId=new Map();
  for(const r of rows){const id=Number(r.batter);if(!Number.isInteger(id))continue;(byId.get(id)||byId.set(id,[]).get(id)).push(r)}
  return entities.map(e=>normalizeProfileEntity({player:e.player,team:e.team,player_id:e.player_id,rows:byId.get(Number(e.player_id))||[]}));
}

export function profileBatchPlan(entities=[],size=20){
  const clean=entities.filter(e=>Number.isInteger(Number(e.player_id))&&Number(e.player_id)>0),out=[];
  for(let i=0;i<clean.length;i+=size)out.push(clean.slice(i,i+size));
  return out;
}

export function profileParityState(profile){
  if(!profile)return {state:'PENDING',scoring_eligible:false,reason:'No direct profile'};
  const direct=PROFILE_DIRECT_FIELDS.filter(k=>profile[k]!=null),pending=PROFILE_PENDING_FIELDS.filter(k=>profile[k]==null);
  return {state:pending.length?'RESEARCH_PARTIAL':'PARITY_CANDIDATE',scoring_eligible:false,direct_fields:direct,pending_fields:pending,reason:pending.length?'PullAir/Blast exact legacy parity not proven':'All six fields present but still requires historical field parity before scoring'};
}
