export const V38_GATE_NAMES=Object.freeze(['ev','hh','barrel','iso','pullair','blast']);
export const V38_SELECTIVE_GATES=Object.freeze(['ev','barrel','iso','pullair']);

export function v38GatePasses(x={}){
  return Object.freeze({
    ev:Number.isFinite(+x.ev)&&+x.ev>89,
    hh:Number.isFinite(+x.hh)&&+x.hh>35,
    barrel:Number.isFinite(+x.barrel)&&+x.barrel>8,
    iso:Number.isFinite(+x.iso)&&+x.iso>.180,
    pullair:Number.isFinite(+x.pullair)&&+x.pullair>18,
    blast:Number.isFinite(+x.blast)&&+x.blast>8
  });
}

export function v38GateCount(x={}){return Object.values(v38GatePasses(x)).filter(Boolean).length}

export const V38_CANDIDATE_RULES=Object.freeze({
  '4of6':r=>Object.values(r).filter(Boolean).length>=4,
  '5of6':r=>Object.values(r).filter(Boolean).length>=5,
  '6of6':r=>Object.values(r).filter(Boolean).length===6,
  '4of6_barrel':r=>Object.values(r).filter(Boolean).length>=4&&r.barrel===true,
  '4of6_iso':r=>Object.values(r).filter(Boolean).length>=4&&r.iso===true,
  '4of6_barrel_or_iso':r=>Object.values(r).filter(Boolean).length>=4&&(r.barrel===true||r.iso===true),
  '4of6_barrel_and_iso':r=>Object.values(r).filter(Boolean).length>=4&&r.barrel===true&&r.iso===true,
  '4of6_3selective':r=>Object.values(r).filter(Boolean).length>=4&&V38_SELECTIVE_GATES.filter(g=>r[g]===true).length>=3
});

export function evaluateV38CandidateRules(x={}){
  const passes=v38GatePasses(x),out={};
  for(const [name,fn] of Object.entries(V38_CANDIDATE_RULES))out[name]=fn(passes)===true;
  return Object.freeze({passes,gate_count:Object.values(passes).filter(Boolean).length,rules:Object.freeze(out)});
}
