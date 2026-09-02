export const LONGSHOT_700_POLICY=Object.freeze({
  id:'MLB_HR_LONGSHOT_700_4OF6_V1',
  american_odds_min:+700,
  qualification_required:4,
  metrics:Object.freeze({
    barrel:Object.freeze({op:'>',value:8}),
    hh:Object.freeze({op:'>',value:35}),
    blast:Object.freeze({op:'>',value:8}),
    pullair:Object.freeze({op:'>',value:18}),
    ev:Object.freeze({op:'>',value:89}),
    iso:Object.freeze({op:'>',value:0.180})
  }),
  stronger_profile_protection:Object.freeze({qualification_required:5}),
  locked:true,
  scoring_change_requires_deliberate_approval:true
});

const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
export function longshot700MetricPasses(profile={}){
  const m=LONGSHOT_700_POLICY.metrics;
  return {
    barrel:finite(profile.barrel)&&Number(profile.barrel)>m.barrel.value,
    hh:finite(profile.hh)&&Number(profile.hh)>m.hh.value,
    blast:finite(profile.blast)&&Number(profile.blast)>m.blast.value,
    pullair:finite(profile.pullair)&&Number(profile.pullair)>m.pullair.value,
    ev:finite(profile.ev)&&Number(profile.ev)>m.ev.value,
    iso:finite(profile.iso)&&Number(profile.iso)>m.iso.value
  };
}
export function evaluateLongshot700(profile={},americanOdds){
  const applicable=finite(americanOdds)&&Number(americanOdds)>=LONGSHOT_700_POLICY.american_odds_min;
  const passes=longshot700MetricPasses(profile);
  const passCount=Object.values(passes).filter(Boolean).length;
  return {policy_id:LONGSHOT_700_POLICY.id,applicable,american_odds:finite(americanOdds)?Number(americanOdds):null,passes,pass_count:passCount,qualifies:applicable&&passCount>=LONGSHOT_700_POLICY.qualification_required,stronger_5of6:applicable&&passCount>=5};
}
