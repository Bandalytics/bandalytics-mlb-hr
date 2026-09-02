# v38 Full HR Workflow Validation — 2026-09-02

Research-only checkpoint. No scoring cutover.

## Scope
Seven genuine point-in-time historical slates: 2026-08-26 through 2026-09-01.
- Valid reconstructed profiles: 1,680
- HR hitters: 171
- Population HR rate: 10.18% (reference only, not optimization target)

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

## Market sanity check — Sep 2 pregame snapshot
Using the six profile thresholds diagnostically across all exact market-linked HR rows, not as universal qualification gates:
- < +400: 16 market rows; 16 were 4/6+, 16 were 5/6+.
- +400 to +499: 31 rows; 31 were 4/6+, 26 were 5/6+.
- +500 to +699: 71 rows; 47 were 4/6+, 25 were 5/6+.
- +700 to +999: 65 rows; 15 were 4/6+, 5 were 5/6+.
- +1000 or longer: 58 rows; 2 were 4/6+, 0 were 5/6+.

This is a structural sanity check only, not an outcome backtest. It shows reconstructed profile quality generally moves in the same direction as market HR pricing while leaving potential mispricing opportunities.

## Workflow interpretation
Keep the full HR workflow separate from the longshot branch:
1. Profile qualification establishes durable power quality.
2. Candidate profile score ranks the broad population, but is not yet a calibrated production tier scale.
3. Pitch-fit is the primary validated tonight-specific enhancer.
4. Recent BBE is a smaller modifier.
5. Starter/bullpen/environment and lineup remain contextual gates requiring continued outcome validation.
6. Market is a value layer, not a power-profile substitute.
7. Longshot +700 4/6 eligibility remains locked and separate.
8. Mandatory Escape Check remains required before final pool lock.
9. Final pool and ticket scoring remain blocked pending deliberate v38 cutover approval.

No scoring change was made from this validation.