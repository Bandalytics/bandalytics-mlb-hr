# V2 Favorite-Flip Shadow Protocol — 2026-10-02

Status: RESEARCH ONLY / SHADOW ONLY

This protocol is isolated from frozen V1. It does not alter CROSS6 or BOOKS3PLUS_CROSS6, does not enable production, and does not use 2026 outcomes to select thresholds.

## Hypothesis

A favorite flip is a distinct market-structure event from generic spread movement: the same team moves from an underdog at the chronological opening observation to a favorite at the later eligible pregame decision observation.

The primary question is whether the direction of the flip carries stable ATS or moneyline information out of sample. This is a V2 research question only.

## Eligibility

A row is eligible only when all of the following are true:

1. A genuine chronological opening spread exists.
2. A later pregame spread observation exists and is not live.
3. Team/side orientation is stable between observations.
4. The opening and later observation refer to the same game and market.
5. Final score is available only for grading after the signal is frozen.
6. No public-ticket field is required or inferred.
7. No missing opener, timestamp, or side orientation is imputed.

## Frozen shadow definition

Let the spread be expressed from the home-team perspective.

- HOME_FLIP: home opening spread > 0 and later pregame home spread < 0.
- AWAY_FLIP: home opening spread < 0 and later pregame home spread > 0.
- Exactly 0 at either endpoint is not a favorite flip; classify separately as PICK_TRANSITION and do not pool with favorite flips.
- The signal side is the team that becomes the favorite.

No minimum movement magnitude beyond crossing zero is required for the primary shadow lane.

## Prespecified descriptive strata

Report these separately without using them to redefine the primary signal:

- opening absolute spread: (0, 2.5], (2.5, 3.5], (3.5, 6.5], >6.5
- later favorite price band by absolute spread: (0, 2.5], (2.5, 3.5], >3.5
- market_spread_book_count: <3 versus >=3 when the field is legitimately available
- home versus away signal
- season

Do not promote a stratum because it looks strong in the same sample.

## Evaluation

For each season and pooled discovery sample, report:

- qualifiers
- W/L/P ATS for the signal side at the later decision spread
- nonpush n
- ATS hit rate
- Wilson 95% confidence interval
- exact two-sided binomial p-value versus 0.50
- moneyline W/L only when a legitimate contemporaneous moneyline is available

Do not compute ROI unless a verified frozen executable price exists. Win rate is not ROI.

## Chronology / validation

- Discovery/descriptive lane: 2021–2024 compatible source rows.
- 2025 remains untouched validation for any future favorite-flip candidate only after a separate written freeze is created.
- 2026 prospective observations must not be used to tune this definition.
- If discovery evidence is insufficient, retain as shadow research and stop; do not loosen the definition.

## Promotion guard

This document is not a promotion freeze. No favorite-flip rule can enter production or V1 from this analysis. A candidate that survives discovery must receive a new versioned freeze before any untouched holdout is inspected.

## Explicit prohibitions

- no V1 mutation
- no revival of rejected DOG_MOVE_3PLUS
- no unverified public-ticket/RLM claims
- no inferred openings
- no closing-only substitution
- no outcome-driven threshold selection
- no ROI without verified frozen prices
