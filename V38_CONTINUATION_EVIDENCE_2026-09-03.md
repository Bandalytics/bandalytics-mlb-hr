# v38 continuation evidence — 2026-09-03

Research-only continuation checkpoint. No production scoring cutover and no ticket construction.

## Ten-slate preregistered historical promotion window

The fixed Aug. 23 through Sep. 1 point-in-time window completed successfully across 10 slates.

Selected control: `4of6_iso+pitchfit_top_quartile`.

- population: 2,398 complete profiles, 237 HR = 9.88%
- selected: 285 hitters, 47 HR = 16.49%
- lift vs population: 1.669x
- HR capture: 19.83%
- positive-lift slates: 70%

Promotion-gate interpretation:
- 10 historical slates: PASS
- >=200 historical selected hitters: PASS
- >=35 historical HR: PASS
- >=1.50x lift: PASS
- >=30% HR capture: **FAIL**
- >=70% positive-lift slates: PASS

The failed capture gate must not be repaired by retroactively loosening the selected definition or changing thresholds on this same outcome window.

## Reproducible historical Escape Audit

`V38_HISTORICAL_ESCAPE_AUDIT_V1` is complete and manifest-validated.

- total historical HR: 237
- captured by quality + top PitchFit control: 47
- escaped HR: 190
- audit manifest digest: `0abee09427fad59594256174d52012c10c206f53b4cdf084ca931fbac9361353`

Descriptive escape buckets:
- captured quality + top PitchFit: 47
- quality + PitchFit below top quartile: 27
- quality + PitchFit unavailable/ineligible: 34
- 4/6 without ISO: 34
- 3/6 profile: 35
- 0–2/6 profile: 60

These buckets are an audit, not a new selection rule. The audit contract explicitly records no threshold change, no scoring change, no pool-fill change, and no production promotion from this evidence.

## Prospective readiness after the audit

Sep. 2 remains the only accepted finalized V5 prospective slate at this checkpoint.

For the existing `quality_plus_pitchfit` control:
- prospective slates: 1 / required 3
- selected hitters: 15 / required 40
- selected HR: 4 / required 6
- context coverage: 94.32% / required 90% — PASS
- per-game modifier-evidence selection coverage: 100% / required 80% — PASS
- true PitchFit evidence itself was present on 96 of 317 complete hitters, about 30.28%; this is a different measurement from the 100% per-game modifier-evidence selection coverage and must not be conflated.
- market-band reporting: PASS
- Escape Audit: PASS
- threshold review: not approved
- deliberate approval: not approved

`eligible_for_promotion` remains false.

## Future-only escape-protection watch

A separate research contract, `V38_PROSPECTIVE_ESCAPE_WATCH_V1`, was preregistered on Sep. 3 and begins with the **Sep. 4** slate.

It does not change the current core. It only measures three fixed groups among `4of6_iso` quality hitters:
1. `CORE_CONTROL` — top-quartile/top-decile PitchFit
2. `QUALITY_PITCHFIT_BASE_TRUE` — valid PitchFit below the top quartile
3. `QUALITY_PITCHFIT_UNAVAILABLE` — quality profile with unavailable/ineligible PitchFit

Guardrails:
- no Sep. 2 or Sep. 3 backfill
- no historical backfill
- no use as historical promotion evidence
- watch groups do not join the core
- no threshold changes from the watch
- no scoring changes
- no automatic production promotion
- 20–25 remains a target only and is never forced
- deliberate review is required after independent future evidence

The purpose is to measure the capture cost of nightly PitchFit gating without using already-seen historical outcomes to rewrite the rule.

## Environment parity — per-game latest pre-first-pitch evaluation

`V38_ENVIRONMENT_PARITY_WINDOW_V1` now reconstructs the environment input using the **latest valid immutable context snapshot strictly before each individual game start**, then compares those frozen pregame values with MLB's recorded game weather only for parity validation.

Sep. 2 result from workflow run `33774992553`, artifact `9901200476`, digest `sha256:bf0e8f95f1f4e740f283ac59442cd022f200b93439de1257a7d0f5c5c1398327`:
- valid context snapshots loaded: 6
- games selected with point-in-time context: 14
- weather-covered games: 14
- venue exact agreement: 100%
- condition agreement: 85.71%
- wind-class agreement: **78.57%**
- temperature MAE: 2.0°F
- wind-speed MAE: 1.5 mph

All numeric gates passed except the locked 80% wind-class agreement threshold. Three genuine direction changes drove the miss: two pregame OUT winds were recorded as CROSS, and one pregame CROSS wind was recorded as OUT. This is not being repaired by lowering the threshold. `threshold_review:false`, `deliberate_approval:false`, and environment promotion remains blocked.

During validation, MLB shorthand strings such as `L To R` / `R To L` were found to be unrecognized by the original crosswind parser. The parser was fixed and regression-tested before the parity result above was accepted. The parity-window protocol overwrite bug was also corrected so the output retains `V38_ENVIRONMENT_PARITY_WINDOW_V1` rather than inheriting the lower-level comparison protocol.

## Prospective park-factor support

`V38_PARK_PROSPECTIVE_VALIDATION_V1` was preregistered before Sep. 3 outcomes. It starts with the **Sep. 3** slate and explicitly forbids Sep. 2 or historical backfill.

The live board and the prospective evaluator now require:
- latest valid park snapshot strictly before first pitch
- exact venue match
- exact effective L/R batting side
- switch-hitter side resolved from the opposing starter hand
- immutable park snapshot SHA attached to each accepted factor

There is no silent `ALL`-hand fallback. If effective batting side is unknown, or the requested L/R venue factor is unavailable, park support is `UNAVAILABLE` rather than imputed.

Fixed diagnostic bands are preregistered as:
- `HITTER_FRIENDLY`: HR park factor >= 105
- `NEUTRAL`: 95 through 104.99
- `SUPPRESSIVE`: < 95

Those bands are measured both for all exact-park rows and for the existing `4of6_iso` quality subgroup. They are prospective diagnostics only: no band changes hierarchy eligibility, creates an HR boost, changes scoring, fills the pool, or auto-promotes the model. The automated evaluator runs after a finalized V5 postgame slate and cleanly skips when no eligible Sep. 3+ final evidence exists.

## Other research families

Gas Can remains pinned to its frozen Aug. 26–Sep. 1 seven-slate diagnostic. The expanded 10-slate historical workflow does not silently change that frozen window. Gas Can + strong profile remains promising context, but same-team stacking remains blocked.

Generic bullpen workload remains non-boosting. The current specific-bullpen thresholds remain diagnostic-only because coverage was too sparse. Environment remains parity-blocked. Park factor remains prospective support-only.

## Production state

GitHub `main` remains the engineering source of truth and is research-only with one consolidated Node-lambda architecture. The source research-status handler now includes the ten-slate historical gate state, completed Escape Audit, and future-only Sep. 4 escape-watch preregistration, but the canonical Vercel deployment is temporarily behind those source commits because the project exceeded its 24-hour build limit. No manual deployment spam is being used; one consolidated production deployment should be performed after the quota resets. `scoring_enabled:false`, `model_scoring_changed:false`, and pool-before-tickets remain enforced.
