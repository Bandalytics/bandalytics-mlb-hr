// Research-only direct feed orchestrator. No v37 scoring hooks live here.
import {resolveMarketIdentities} from './identity-resolver.mjs';
import {mergeDirectState,promotedLegacyLenses} from './direct-normalizer.mjs';

export const REQUIRED_DIRECT_PARITY_GATES=Object.freeze([
  'identity','market','profile','bbe','lineup','starter','pitchfit','environment'
]);

export function directParityMatrix(p){
  return {
    identity:p.player_id!=null,
    market:p.market_ready===true&&p.market_parity_verified===true,
    profile:p.profile_scoring_eligible===true&&p.profile_parity_verified===true,
    bbe:p.bbe_ready===true&&p.bbe_parity_verified===true,
    lineup:p.lineup_ready===true&&p.lineup_parity_verified===true,
    starter:p.starter_ready===true&&p.starter_parity_verified===true,
    pitchfit:p.pitchfit_ready===true&&p.pitchfit_identity_verified===true&&p.pitchfit_parity_verified===true,
    environment:p.env_ready===true&&p.environment_parity_verified===true
  };
}

export async function buildResearchDirectState({date,market=[],lineup=[],profiles=[],bbe=[],starter=[],pitchfit=[],environment=[],quoteHistory=[],fetcher=fetch}={}){
  if(!/^20\d\d-\d\d-\d\d$/.test(String(date||'')))throw new Error('date required');
  const id=await resolveMarketIdentities(market,{date,fetcher});
  const state=mergeDirectState({market:id.resolved,lineup,profiles,bbe,starter,pitchfit,environment,quoteHistory});
  const unresolved=id.unresolved.map(x=>({...x,direct_status:'IDENTITY_PENDING',research_only:true,workflow_gate_reason:'DIRECT RESEARCH — market identity unresolved',lenses:[],direct_parity:Object.fromEntries(REQUIRED_DIRECT_PARITY_GATES.map(g=>[g,false])),direct_structurally_ready:false,v37_scoring_enabled:false,research_mode:true}));
  for(const p of state){
    p.generated_legacy_lenses=promotedLegacyLenses(p);
    p.direct_parity=directParityMatrix(p);
    p.direct_scoring_blockers=REQUIRED_DIRECT_PARITY_GATES.filter(g=>!p.direct_parity[g]);
    p.direct_structurally_ready=p.direct_scoring_blockers.length===0;
    // Direct Preview remains research-only even if every structural gate eventually verifies.
    p.direct_scoring_eligible=false;
    p.research_mode=true;
    p.v37_scoring_enabled=false;
  }
  return {date,research_only:true,v37_scoring_enabled:false,required_parity_gates:[...REQUIRED_DIRECT_PARITY_GATES],items:[...state,...unresolved],resolved_market:id.resolved.length,unresolved_market:id.unresolved.length,roster_unavailable:id.roster_unavailable};
}
