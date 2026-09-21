import {v38GateCount,V38_GATE_NAMES} from './v38-gate-rules.mjs';

export const LOCKED_POLICY_VERSION='BANDALYTICS_LOCKED_POLICY_V2';
export const LOCKED_HR_MARKET_SCHEMA='BANDALYTICS_MLB_HR_MARKET_CURRENT_V1';
export const LOCKED_POLICY_LABELS=Object.freeze({
  QUALIFIED_6OF6:'QUALIFIED_6OF6',
  QUALIFIED_5OF6:'QUALIFIED_5OF6',
  PROTECTED_4OF6_700PLUS:'PROTECTED_4OF6_700PLUS',
  PRICE_UNKNOWN_4OF6:'PRICE_UNKNOWN_4OF6',
  NOT_QUALIFIED_4OF6_PRICE_SHORT:'NOT_QUALIFIED_4OF6_PRICE_SHORT',
  NOT_QUALIFIED_PROFILE:'NOT_QUALIFIED_PROFILE',
  INCOMPLETE_PROFILE:'INCOMPLETE_PROFILE'
});

function parseAmerican(v){
  if(v==null)return null;
  if(typeof v==='number'&&Number.isFinite(v)&&v!==0)return Math.trunc(v);
  if(typeof v==='string'){
    const s=v.trim().replaceAll(',','');
    if(!s)return null;
    const m=s.match(/^([+-]?\d+(?:\.\d+)?)$/);
    if(m){const n=Math.trunc(Number(m[1]));return n===0?null:n}
  }
  return null;
}
function coreValue(row,name){
  if(name==='hh')return row?.hh??row?.hard_hit;
  if(name==='pullair')return row?.pullair??row?.pull_air;
  if(name==='blast')return row?.blast??row?.blast_swing??row?.blasts_swing;
  return row?.[name];
}
export function lockedCoreProfileComplete(row={}){
  return V38_GATE_NAMES.every(name=>Number.isFinite(Number(coreValue(row,name))));
}
export function extractPregameHrAmericanOdds(row={}){
  const direct=parseAmerican(row?.hr_odds);
  if(direct!=null)return direct;
  const market=row?.context?.market??row?.market??null;
  if(!market||typeof market!=='object')return null;
  const explicitFrozenPlan=market?.source==='FROZEN_EXECUTION_PLAN'&&parseAmerican(market?.hr_odds)!=null;
  if(explicitFrozenPlan)return parseAmerican(market.hr_odds);
  const exactCurrentHrMarket=market?.market_schema===LOCKED_HR_MARKET_SCHEMA&&market?.market_type==='MLB_BATTER_HOME_RUN_YES'&&market?.identity_status==='EXACT';
  return exactCurrentHrMarket?parseAmerican(market.best_odds):null;
}

export function classifyLockedPolicy(row={}){
  const profileComplete=lockedCoreProfileComplete(row);
  const suppliedGate=row?.gate_count!=null&&Number.isInteger(Number(row.gate_count))?Number(row.gate_count):null;
  const gateCount=profileComplete?(suppliedGate??v38GateCount(row)):v38GateCount(row);
  const odds=extractPregameHrAmericanOdds(row);
  let label,qualified=false,priceRequired=false;
  if(!profileComplete){label=LOCKED_POLICY_LABELS.INCOMPLETE_PROFILE}
  else if(gateCount===6){label=LOCKED_POLICY_LABELS.QUALIFIED_6OF6;qualified=true}
  else if(gateCount===5){label=LOCKED_POLICY_LABELS.QUALIFIED_5OF6;qualified=true}
  else if(gateCount===4){
    priceRequired=true;
    if(odds==null)label=LOCKED_POLICY_LABELS.PRICE_UNKNOWN_4OF6;
    else if(odds>=700){label=LOCKED_POLICY_LABELS.PROTECTED_4OF6_700PLUS;qualified=true}
    else label=LOCKED_POLICY_LABELS.NOT_QUALIFIED_4OF6_PRICE_SHORT;
  }else label=LOCKED_POLICY_LABELS.NOT_QUALIFIED_PROFILE;
  return Object.freeze({policy_version:LOCKED_POLICY_VERSION,profile_complete:profileComplete,gate_count:gateCount,hr_american_odds:odds,price_required:priceRequired,label,qualified});
}

export function summarizeLockedPolicy(rows=[]){
  const classified=(rows||[]).map(row=>({...row,locked_policy:classifyLockedPolicy(row)}));
  const byLabel={};
  for(const row of classified){
    const k=row.locked_policy.label;(byLabel[k]||(byLabel[k]={rows:0,hr:0}));byLabel[k].rows++;if(row.homer===true)byLabel[k].hr++;
  }
  for(const v of Object.values(byLabel))v.descriptive_hr_rate_pct=v.rows?+(100*v.hr/v.rows).toFixed(2):null;
  const eligible=classified.filter(r=>r.locked_policy.qualified),eligibleHr=eligible.filter(r=>r.homer===true).length;
  const priceUnknown4=classified.filter(r=>r.locked_policy.label===LOCKED_POLICY_LABELS.PRICE_UNKNOWN_4OF6).length;
  return {policy_version:LOCKED_POLICY_VERSION,rate_semantics:'DESCRIPTIVE_OUTCOME_RATE_NOT_MODEL_PROBABILITY',rows:classified.length,qualified_rows:eligible.length,qualified_hr:eligibleHr,qualified_descriptive_hr_rate_pct:eligible.length?+(100*eligibleHr/eligible.length).toFixed(2):null,price_unknown_4of6:priceUnknown4,by_label:byLabel,rows_classified:classified};
}
