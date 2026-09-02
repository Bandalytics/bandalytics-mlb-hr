export const V38_CONTEXT_MODIFIER_POLICY = Object.freeze({
  protocol: 'V38_CONTEXT_MODIFIER_POLICY_V1',
  research_only: true,
  scoring_enabled: false,
  scoring_eligible: false,
  model_scoring_changed: false,
  lineup_position: Object.freeze({
    role: 'SMALL_EXPOSURE_TIEBREAK_MODIFIER',
    hard_gate: false,
    lower_order_auto_downgrade: false,
    evidence_window: '2026-08-26..2026-09-01',
    profile_group: '4of6_plus_iso',
    historical: Object.freeze({
      top_1_4: Object.freeze({rows: 321, hr: 58, hr_rate: 18.07}),
      middle_5_6: Object.freeze({rows: 98, hr: 16, hr_rate: 16.33}),
      bottom_7_9: Object.freeze({rows: 48, hr: 9, hr_rate: 18.75, small_sample: true})
    }),
    rule: 'Use batting order for plate-appearance exposure, confidence, and close-call tie breaks only. A valid power profile may not be cut solely for batting 7-9.'
  }),
  bullpen_workload: Object.freeze({
    role: 'SUPPORTING_NOTE_AND_ESCAPE_CONTEXT',
    hard_gate: false,
    standalone_hr_boost: false,
    evidence_window: '2026-08-26..2026-09-01',
    historical: Object.freeze({
      all_normal: Object.freeze({rows: 1232, hr: 125, hr_rate: 10.15}),
      all_top_quartile: Object.freeze({rows: 453, hr: 46, hr_rate: 10.15}),
      profile_4of6_iso_normal: Object.freeze({rows: 335, hr: 61, hr_rate: 18.21}),
      profile_4of6_iso_top_quartile: Object.freeze({rows: 132, hr: 22, hr_rate: 16.67})
    }),
    rule: 'Recent bullpen workload alone cannot increase an HR grade. Preserve workload, repeat-use, handedness availability, and bullpen quality for context/escape analysis; require additional evidence before any fatigue boost.'
  })
});

export function validateContextModifierPolicy(policy = V38_CONTEXT_MODIFIER_POLICY) {
  const errors = [];
  if (policy.scoring_enabled !== false || policy.scoring_eligible !== false) errors.push('policy must remain scoring-disabled');
  if (policy.lineup_position?.hard_gate !== false) errors.push('lineup position cannot be a hard gate');
  if (policy.lineup_position?.lower_order_auto_downgrade !== false) errors.push('lower-order automatic downgrade is prohibited');
  if (policy.bullpen_workload?.standalone_hr_boost !== false) errors.push('bullpen workload cannot be a standalone HR boost');
  return {pass: errors.length === 0, errors};
}
