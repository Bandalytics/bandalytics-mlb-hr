import {v38GateCount} from './v38-gate-rules.mjs';

export const LOCKED_POLICY_VERSION='BANDALYTICS_LOCKED_POLICY_V1';
export const LOCKED_POLICY_LABELS=Object.freeze({
  QUALIFIED_6OF6:'QUALIFIED_6OF6',
  QUALIFIED_5OF6:'QUALIFIED_5OF6',
  PROTECTED_4OF6_700PLUS:'PROTECTED_4OF6_700PLUS',
  PRICE_UNKNOWN_4OF6:'PRICE_UNKNOWN_4OF6',
  NOT_QUALIFIED_4OF6_PRICE_SHORT:'NOT_QUALIFIED_4OF6_PRICE_SHORT',
  NOT_QUALIFIED_PROFILE:'NOT_QUALIFIED_PROFILE'
});

const ODDS_KEYS=new Set(['bestodds','best_odds','currentodds','current_odds','odds','americanodds','american_odds','price','hrodds','hr_odds']);
function parseAmerican(v){
  if(v==null)return null;
  if(typeof v==='number'&&Number.isFinite(v))return Math.trunc(v);
  if(typeof v==='string'){
    const s=v.trim().replaceAll(',','');
    if(!s)return null;
    const m=s.match(/^([+-]?\d+(?:\.\d+)?)$/);
    if(m)return Math.trunc(Number(m[1]));
  }
  return null;
}
function walkOdds(x,depth=0){
  if(!x||typeof x!=='object'||depth>4)return null;
  for(const [k,v] of Object.entries(x)){
    const key=String(k).toLowerCase();
    if(ODDS_KEYS.has(key)){
      const n=parseAmerican(v);
      if(n!=null)return n;
    }
  }
  for(const v of Object.values(x)){
    if(v&&typeof v==='object'){
      const n=walkOdds(v,depth+1);
      if(n!=null)return n;
    }
  }
  return null;
}

export function extractPregameHrAmericanOdds(row={}){
  return walkOdds(row?.context?.market??row?.market??null);
}

export function classifyLockedPolicy(row={}){
  const gateCount=Number.isInteger(+row.gate_count)?+row.gate_count:v38GateCount(row);
  const odds=extractPregameHrAmericanOdds(row);
  let label,qualified=false,priceRequired=false;
  if(gateCount>=6){label=LOCKED_POLICY_LABELS.QUALIFIED_6OF6;qualified=true}
  else if(gateCount===5){label=LOCKED_POLICY_LABELS.QUALIFIED_5OF6;qualified=true}
  else if(gateCount===4){
    priceRequired=true;
    if(odds==null)label=LOCKED_POLICY_LABELS.PRICE_UNKNOWN_4OF6;
    else if(odds>=700){label=LOCKED_POLICY_LABELS.PROTECTED_4OF6_700PLUS;qualified=true}
    else label=LOCKED_POLICY_LABELS.NOT_QUALIFIED_4OF6_PRICE_SHORT;
  }else label=LOCKED_POLICY_LABELS.NOT_QUALIFIED_PROFILE;
  return Object.freeze({policy_version:LOCKED_POLICY_VERSION,gate_count:gateCount,hr_american_odds:odds,price_required:priceRequired,label,qualified});
}

export function summarizeLockedPolicy(rows=[]){
  const classified=(rows||[]).map(row=>({...row,locked_policy:classifyLockedPolicy(row)}));
  const byLabel={};
  for(const row of classified){
    const k=row.locked_policy.label;(byLabel[k]||(byLabel[k]={rows:0,hr:0}));byLabel[k].rows++;if(row.homer===true)byLabel[k].hr++;
  }
  for(const v of Object.values(byLabel))v.hr_rate=v.rows?+(100*v.hr/v.rows).toFixed(2):null;
  const eligible=classified.filter(r=>r.locked_policy.qualified),eligibleHr=eligible.filter(r=>r.homer===true).length;
  const priceUnknown4=classified.filter(r=>r.locked_policy.label===LOCKED_POLICY_LABELS.PRICE_UNKNOWN_4OF6).length;
  return {policy_version:LOCKED_POLICY_VERSION,rows:classified.length,qualified_rows:eligible.length,qualified_hr:eligibleHr,qualified_hr_rate:eligible.length?+(100*eligibleHr/eligible.length).toFixed(2):null,price_unknown_4of6:priceUnknown4,by_label:byLabel,rows_classified:classified};
}
