import { LONGSHOT_POLICY_V1, evaluateLongshotProfile } from './longshot-policy-v1.mjs';

export const LONGSHOT_QUALITY_V1 = Object.freeze({
  protocol: 'LONGSHOT_QUALITY_V1',
  research_only: true,
  scoring_enabled: false,
  scoring_eligible: false,
  model_scoring_changed: false,
  eligible_rule: LONGSHOT_POLICY_V1.protocol,
  quality_candidate: 'eligible_4of6_plus_iso',
  protected_profile: '5of6_or_better'
});

export function classifyLongshotQuality(profile, americanOdds) {
  const base = evaluateLongshotProfile(profile, americanOdds);
  if (!base.longshot_applicable) return { ...base, quality_tier: 'NOT_LONGSHOT_WINDOW' };
  if (!base.eligible) return { ...base, quality_tier: 'INELIGIBLE' };
  const isoPass = Number(profile?.iso) > 0.180;
  if (base.pass_count >= 5) return { ...base, quality_tier: 'PROTECTED_5OF6_PLUS', iso_quality: isoPass };
  if (isoPass) return { ...base, quality_tier: 'QUALITY_4OF6_PLUS_ISO', iso_quality: true };
  return { ...base, quality_tier: 'BASE_ELIGIBLE_4OF6', iso_quality: false };
}
