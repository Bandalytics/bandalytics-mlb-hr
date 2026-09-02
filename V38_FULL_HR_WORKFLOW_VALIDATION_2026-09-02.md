# v38 Full HR Workflow Validation — 2026-09-02

Research-only checkpoint. No scoring cutover.

## Scope
Seven genuine point-in-time historical slates: 2026-08-26 through 2026-09-01.
- Valid reconstructed profiles: 1,680
- HR hitters: 171
- Population HR rate: 10.18% (reference only, not optimization target)

The optimization target is selected-pool HR rate with HR capture, pool count and multi-slate stability guardrails. The population baseline must not be redefined to make performance look better.

Longshot +700 rule remains a separate market-specific eligibility branch. It is not the universal HR target.

## Individual field separation
All reconstructed power fields averaged higher for HR hitters than non-HR hitters.

| Field | HR avg | Non-HR avg | Difference |
|---|---:|---:|---:|
| EV | 88.912 | 87.611 | +1.301 |
| Hard Hit % | 41.542 | 38.033 | +3.509 |
| Barrel % | 9.749 | 7.635 | +2.114 |
| ISO | 0.195 | 0.152 | +0.043 |
| Sweet Spot % | 35.347 | 34.706 | +0.640 |
| PullAir % | 20.258 | 18.453 | +1.806 |
| Blast % | 11.341 | 10.047 | +1.294 |

Threshold pass separation:
- ISO > .180: HR 53.8% vs non-HR 27.8% (+26.0 pp)
- Barrel > 8: HR 58.5% vs non-HR 41.6% (+16.9 pp)
- HH > 35: HR 80.7% vs non-HR 66.5% (+14.2 pp)
- EV > 89: HR 52.0% vs non-HR 39.4% (+12.6 pp)
- Blast > 8: HR 86.5% vs non-HR 74.0% (+12.5 pp)
- PullAir > 18: HR 62.0% vs non-HR 52.9% (+9.0 pp)

ISO is currently the strongest individual threshold discriminator in this window.

## Gate-count behavior
Exact gate counts are not monotonic enough to use blindly as a universal scoring ladder.
- 0/6: 3.13% HR
- 1/6: 5.86%
- 2/6: 8.44%
- 3/6: 9.93%
- exactly 4/6: 9.70%
- exactly 5/6: 17.00%
- 6/6: 16.18%

Important split inside exact 4/6:
- exact 4/6 WITH ISO: 51 hitters, 11 HR = 21.57%
- exact 4/6 WITHOUT ISO: 217 hitters, 15 HR = 6.91%

Therefore the locked +700 4/6 rule remains longshot eligibility only. Exact 4/6 must not become a universal HR-selection rule.

The API contract is now regression-tested to expose exactly `4` required passes at +700 or longer using the locked `MLB_HR_LONGSHOT_700_4OF6_V1` policy.

## Candidate profile score validation
The reconstructed v38 profile score is NOT the legacy S/A/B/C board score.

Across all 1,680 valid profiles:
- top score quartile: 17.14% HR
- second quartile: 9.76%
- third quartile: 9.29%
- bottom quartile: 4.52%

Top score quartile beat each slate's population baseline on all seven slates.

However, fixed raw score cutoffs are not yet fully monotonic:
- score >= 30: 17.07% HR
- >= 40: 18.78%
- >= 50: 15.97%
- >= 60: 17.74%
- >= 70: 20.00% (small sample)

Conclusion: keep candidate profile score as a ranking signal for research; do not infer new fixed S/A/B/C thresholds from this seven-slate sample.

Within 5/6+ profiles, score ranking adds little incremental separation, so profile score and gate count should not be double-counted as independent evidence.

## Tonight-context validation
Seven-slate historical convergence:
- 4/6+ISO + top-quartile pitch-fit: 226 qualified, 49 HR, 21.68% HR rate, 28.7% HR capture, ~2.13x population lift; positive lift on all 7 slates.
- 4/6+ISO + top-quartile Recent BBE: 148 qualified, 23 HR, 15.54% HR rate; less stable by day.
- 4/6+ISO + both pitch-fit and BBE: 79 qualified, 15 HR, 18.99% HR rate, only 8.8% HR capture.

Current interpretation:
- Pitch-fit = strongest stable nightly enhancer.
- Recent BBE = supporting modifier, not a mandatory hard gate.
- Requiring both pitch-fit + BBE is too restrictive at current sample.

## Starter damage validation
Starter damage is a genuine independent context layer and is not redundant with hitter profile quality.

Seven-slate aggregate:
- starter HR/9 < 1.2, all hitters: 720 hitters, 55 HR = 7.64%
- HR/9 < 1.2 + 4/6+ISO: 212 hitters, 25 HR = 11.79%
- starter HR/9 >= 1.2 + 4/6+ISO: 151 hitters, 37 HR = 24.50%
- starter HR/9 >= 1.5 + 4/6+ISO: 96 hitters, 22 HR = 22.92%
- small-sample starter + 4/6+ISO: 114 hitters, 22 HR = 19.30%; this remains a separate caution bucket rather than a stable positive signal.

Interpretation:
- The existing `<1.2 HR/9` rule remains a material downgrade/caution, not a universal hard cut.
- Strong profiles can survive a low-HR/9 starter.
- Quality-profile hitters against >=1.2 HR/9 starters produced roughly twice the HR rate of the equivalent low-HR/9 group in this sample.
- Small pitcher IP must remain fail-closed/cautionary.

## Bullpen validation
Generic recent bullpen workload does not deserve a positive HR modifier.

Corrected seven-slate aggregate:
- all hitters, normal workload: 10.15% HR
- all hitters, top-quartile workload: 10.15% HR
- 4/6+ISO, normal workload: 18.21% HR
- 4/6+ISO, top-quartile workload: 16.67% HR

Interpretation:
- Generic “Tired Pen” workload alone cannot raise a hitter grade.
- Specific reliever availability, handedness and bullpen quality may still be valid matchup/escape context.
- Workload may remain visible in game notes, but it cannot count as an independent positive stacking family.

## Lineup-position validation
Lineup position is a small plate-appearance / tie-break modifier only.

Seven-slate 4/6+ISO results:
- spots 1–4: 18.07% HR
- spots 5–6: 16.33% HR
- spots 7–9: 18.75% HR, but only 48 hitters

Interpretation:
- Batting 7–9 cannot veto an otherwise strong power profile.
- Lineup position is not a qualification gate.

## Environment and park-factor status
Weather/environment remains fail-closed for production scoring because historical recorded weather has not yet passed a genuine pregame-parity gate. Intraday point-in-time weather capture is active and coverage improves materially later in the day, but this does not justify retroactive use of final/recorded conditions.

Park factor now has its own prospective-only integrity contract:
- official source: MLB Baseball Savant Statcast Park Factors
- HR-specific
- rolling three-year context
- ALL/L/R batting-side snapshots
- point-in-time capture required before game start
- no historical reconstruction from a later park-factor value
- support / close-call context only
- no standalone HR boost and no hard gate

The first live official park-factor capture completed successfully on Sep. 2. Because it was created after some Sep. 2 games had already started, it must not be retroactively applied to those games. Clean full-slate park-factor evidence begins prospectively.

## Stack and Gas-Can status
Same-team stacking is still research-only and requires multiple **independent evidence families** rather than several correlated versions of one starter weakness.

Current protected research families:
1. starter damage
2. hitter convergence
3. specific bullpen context
4. park/weather context
5. market context

A stack research candidate requires starter damage plus at least two additional independent families. Generic bullpen workload cannot count. The pool cannot be forced to create a stack.

The gas-can shortlist is deliberately separate from universal HR qualification. Research-candidate starter thresholds are being tested against the frozen seven-slate point-in-time matrix and same-team multi-HR clustering. These thresholds are not production-locked and cannot change scoring without validation and deliberate approval.

## Market sanity check — Sep 2 pregame snapshot
Using the six profile thresholds diagnostically across all exact market-linked HR rows, not as universal qualification gates:
- < +400: 16 market rows; 16 were 4/6+, 16 were 5/6+.
- +400 to +499: 31 rows; 31 were 4/6+, 26 were 5/6+.
- +500 to +699: 71 rows; 47 were 4/6+, 25 were 5/6+.
- +700 to +999: 65 rows; 15 were 4/6+, 5 were 5/6+.
- +1000 or longer: 58 rows; 2 were 4/6+, 0 were 5/6+.

This is a structural sanity check only, not an outcome backtest. It shows reconstructed profile quality generally moves in the same direction as market HR pricing while leaving potential mispricing opportunities.

The prospective selected-pool report now additionally records flat one-unit profit and ROI at the captured current HR price for every market band and key research group. This is an evaluation metric only; it does not create a staking recommendation.

## Prospective validation integrity
Protocol `V38_PREGAME_OUTCOME_EVAL_V5` is fail-closed:
- context, pitch-fit and Recent BBE are selected per game using the latest valid artifact strictly before that game's first pitch
- unfinished eligible games prevent finalization
- no partial slate can count as prospective evidence
- the final V5 row preserves the actual frozen EV, HH, Barrel, ISO, PullAir, Blast and Sweet Spot profile values
- selected-pool reporting uses the exact locked +700 evaluator rather than a generic gate-count shortcut
- an immutable `V38_EVIDENCE_MANIFEST_V1` fingerprints the rules, field definitions, PullAir 15.5° threshold, input artifacts and HR outcomes
- changing a rule or source artifact produces a different reproducibility/dedupe fingerprint

Postgame evaluation now checks the prior ET slate several times overnight and no-ops until every eligible game is final.

## Final-pool promotion gate
General final-pool promotion remains blocked under `V38_FINAL_POOL_PROMOTION_GATE_V1`.

Required evidence includes at least:
- 10 historical slates
- selected-pool historical lift >= 1.50x population baseline
- HR capture >= 30%
- positive lift on >=70% of slates
- 3 finalized V5 prospective slates
- >=40 prospective selected hitters and >=6 prospective HR
- >=90% context coverage
- >=80% modifier-evidence coverage
- market-band reporting
- escape audit
- documented threshold review
- deliberate approval

The 20–25 pool remains a target only, never a forced count. Auto-promotion is disabled.

## Workflow interpretation
Keep the full HR workflow separate from the longshot branch:
1. Profile qualification establishes durable power quality.
2. Candidate profile score ranks the broad population, but is not yet a calibrated production tier scale.
3. Pitch-fit is the primary validated tonight-specific enhancer.
4. Recent BBE is a smaller supporting modifier.
5. Starter damage is a validated material context layer; `<1.2 HR/9` remains a caution rather than an automatic cut.
6. Generic bullpen workload cannot boost; specific bullpen quality/availability remains contextual.
7. Lineup spot is a tie-break/exposure modifier only.
8. Weather is parity-blocked; park factor is prospective support-only.
9. Market is a value layer, not a power-profile substitute.
10. Longshot +700 4/6 eligibility remains locked and separate.
11. Same-team stack/gas-can logic remains research-only pending frozen-matrix validation.
12. Mandatory Escape Check remains required before final pool lock.
13. Final pool and ticket scoring remain blocked pending prospective evidence, threshold review and deliberate approval.

No production scoring change was made from this validation.
