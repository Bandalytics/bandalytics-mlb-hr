export const RESEARCH_GATE_ORDER=['identity','market','sharp_money','profile','bbe','lineup','starter','pitchfit','environment','v37','final_pool','tickets'];
export function safeGateStatus(z={}){return RESEARCH_GATE_ORDER.map(k=>({key:k,status:z?.gates?.[k]?.status||'UNKNOWN',detail:z?.gates?.[k]?.detail||'No status'}))}
