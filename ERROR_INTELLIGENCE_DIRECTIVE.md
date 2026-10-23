# BANDALYTICS — Reverse Engineering & Error Intelligence (2026-10-23)

**CONTINUATION, NOT A RESTART.** This is a research/evaluation operating contract; its presence does not certify that any production forecasting executable has been modified. Never overwrite production models, preserved Ridge/SOG/ATG versions, sealed holdouts, original forecast values/timestamps, sportsbooks prices, historical betting decisions or results.

## Objective
Use hindsight **to generate prospective, falsifiable hypotheses**, never to claim that retrospective corrections were genuine pregame predictions. Prioritize demonstrated future forecast accuracy, then threshold probability calibration, then verified sportsbook value and separately realized profitability. A development run without improved genuine future evidence is not a model improvement.

## Mandatory daily sequence
1. **Picks first.** Evaluate the actual available board from preserved production forecasts, verified participation and user-provided authentic DK/FD lines/odds. Show **QUALIFIED / WATCHLIST / NO BET / UNAVAILABLE**. Do not infer missing prices or fabricate edges. If lines, pregame inputs or certified probability are absent, report UNAVAILABLE/NO BET and move on.
2. **Postgame error intelligence.** Join original pre-event locked forecast ID + event ID + player/team + market + exact threshold + captured timestamp to authenticated outcomes; do not reconstruct a forecast from final-game information. Record coverage, DNP, cancellations and mismatched IDs separately. Zero only for verified participants.
3. **Error attribution.** Decompose important errors into (i) playing time/snap/TOI/minutes, (ii) opportunity/touches/routes/attempts, (iii) efficiency/shooting/conversion, (iv) opponent/game pace/scheme, (v) roster/availability, and (vi) unpredictable residual. Distinguish observed-after-game cause from an actually **available-before-start** indicator. Provide its original source timestamp, uncertainty and how the signal would alter the model. Never use a postgame feature as a pregame input.
4. **Repetition and priority.** Aggregate errors over multiple games/players/teams/roles/markets/game environments. Require a real denominator; separate high-variance one-offs. Rank issues by absolute error contribution, recurrence, evidence that the indicator was pregame-knowable, and plausible prospective accuracy/calibration benefit. If evidence insufficient, mark NOT ESTABLISHED.
5. **One challenger only.** Choose the highest-evidence targeted hypothesis. Preserve a simple baseline, incumbent production, original locked prediction and research challenger separately. Pre-register a specific feature, direction, eligibility cohort, parameters, primary metric, and stopping/promotion criteria **before** the next outcomes. No blanket patches.
6. **Validation.** Use chronological development without future information; treat historical replays as research discovery only. Maintain an untouched future cohort or protected test interval, keep as-of feature snapshots, and compare identical eligible games. Evaluate MAE, RMSE, signed bias, Brier/log loss and reliability at exact thresholds; include uncertainty/coverage. Do not tune repeatedly on the same validation games or sealed holdouts.
7. **Value layer.** Only after calibrated exact-threshold probabilities exist, compare to genuine manually provided pregame DK/FD prices at exact lines. Report expected value apart from realized P/L and CLV. Respect exclusions/no juice preferences; never force action.
8. **Stop rule.** Once the single hypothesis is frozen, wait for new genuine outcomes, availability confirmation or manual sportsbook board. No repetitive historical tweaks, forced simulations, redundant ZIPs or new scheduled jobs. Preserve original timestamps and receipts.

## Release gate
Production promotion requires repeated prospective, independent wins on the same eligible observations against incumbent **and** simple baseline, including material absolute-error and threshold probability performance, stable calibration across cohorts and no meaningful subgroup collapse. Small one-night gains are HOLD. Missing original frozen forecasts mean comparison is UNAVAILABLE, never reconstructed. Any postgame-produced probability is a research label, not a betting pick.

## Five sport application

### MLB
- Markets: HR, hits, total bases, walks, hitter strikeouts; HRR/RBI/SB research; exclude runs-scored props.
- Current highest-priority development gate: Offseason PAUSE for bets; preserve existing HR tier annotations and frozen forecasts. During next season, test opportunity (PA) vs contact/power/pitcher matchup errors prospectively.
- Only run on demand; no paid odds API capture or recurring data collection is authorized.

## Required output per one GO
- Bet board first, or explicit why unavailable.
- Top three **recurring, potentially fixable** weaknesses with sample size, magnitude, evidence of pregame predictability and a priority rank (or clearly INSUFFICIENT DATA).
- One research hypothesis/implementation and a precommitted test; separate historical discovery from real prospective gains.
- New results when available; accuracy, calibration, verified sportsbook value and realized P/L are four distinct ledgers.
- Status: QUALIFIED / WATCHLIST / NO BET / UNAVAILABLE, plus PROD HOLD / RESEARCH / VALIDATED where relevant.
