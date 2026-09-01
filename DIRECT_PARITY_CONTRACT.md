# Direct-feed parity contract

1. Market universe is primary. Do not begin from posted lineup and accidentally delete priced bench/projected hitters.
2. Canonical identity = canonical player name + canonical team, with MLBAM player_id attached whenever resolvable.
3. Historical roster resolver closes identity for market-only hitters by team + slate date. 8/28 probe: 55/55 market-only names resolved; combined market identity coverage 266/266.
4. Posted lineup, profile, BBE, starter, Pitch Fit, environment are overlays onto that market universe.
5. Lineup-only/unpriced players may exist as UNPRICED_RESEARCH but cannot become a normal priced Final Pool play without a current HR market.
6. Missing data stays explicit PENDING/RESEARCH; never neutral-fill.
7. Duplicate-name Pitch Fit remains exact-MLBAM fail-closed.
8. Quote history must retain intermediate timestamped prices; Steam cannot be reconstructed from final snapshot only.
9. Only promoted legacy lens currently safe for direct recreation: Sharp Money = +2.00 percentage-point implied-probability increase.
10. v37 weights/qualification remain frozen.

## Direct profile parity gate
- Direct profile generation is research-only until every strict v37 profile field is either exactly reproduced or explicitly supplied by a validated source.
- Verified current direct primitives: EV, Hard-Hit%, Barrel%, standard batting ISO from AB/H/TB.
- PullAir% and Blast% MUST remain null/PENDING until exact legacy semantics are recovered and cross-slate validated.
- A direct partial profile sets `scoring_eligible=false`; generic hard contact may not backfill missing HR-specific fields.
- Market-universe first remains mandatory: profile overlays attach by MLBAM ID/name+team identity and cannot delete market-only entities.

## Historical replay harness — 2026-08-30 checkpoint
`historical-replay.py` is now the fixture-level oracle for ZIP-era market parity. It reads the original historical ZIPs without changing v37 and verifies:
- canonical market entity counts;
- display-name collision counts;
- standard American-odds implied-probability movement math;
- recreated Sharp Money membership;
- duplicate-name market rows independently.

Current three-slate replay:
- movement math: 759 / 759 exact;
- Sharp Money: 71 / 71 exact, 0 FP, 0 FN;
- 8/26: 272 market entities / 271 display names (both LAD + ATH Max Muncy present);
- 8/27: 229 / 229 (only ATH Max Muncy present in the market universe);
- 8/28: 266 / 265 (both LAD + ATH Max Muncy present).

This broadens the duplicate-name regression: the collision is not unique to 8/28. Identity safety must remain generic and slate-independent.

## Direct profile API contract
`profile-api.mjs` adds a research-only batch-safe adapter contract around Baseball Savant CSV. It can generate EV, Hard-Hit%, Barrel%, and batting ISO keyed by MLBAM ID. PullAir% and Blast% remain explicitly unsupported/pending until exact legacy definitions are recovered and field-level parity passes.

A partial direct profile is always `scoring_eligible=false`. Presence of four reproduced fields cannot substitute for the two missing profile gates.

## Fail-closed profile merge hardening
A latent direct-mode risk was removed in the normalizer: a research profile can no longer set `profile_ready=true` merely because some Savant fields exist. The merge now carries two separate states:
- `profile_research_ready=true` when a partial direct profile was generated;
- `profile_ready=true` only when `scoring_eligible===true` after explicit parity approval.

Current Savant-generated profiles therefore remain visible for research but cannot satisfy a v37 workflow gate. This preserves the locked rule that missing PullAir/Blast are not neutral and cannot be silently ignored.

## Full structural parity gate (added after historical replay)
Direct Preview is prohibited from v37 scoring even when individual feeds look complete. A player is only `direct_structurally_ready` when ALL eight independently verified gates are true:

1. identity (MLBAM ID)
2. market parity
3. profile parity
4. Recent BBE parity
5. posted lineup parity
6. starter/context parity
7. True Pitch Fit parity + exact hitter MLBAM identity
8. environment parity

`direct_scoring_eligible` remains hard-false while Direct Preview is a research mode. Structural readiness is diagnostic only and can never bypass the research flag.

## Tired Pen structural finding
Historical replay across 8/26–8/28 shows 275 saved Tired Pen rows across 35 team+starter cohorts. 33/35 cohorts include the complete priced team universe. The two exceptions are isolated 8/28 single-player anomalies (MIL/Cody Bradford and BAL/no resolved starter). This is strong evidence that Tired Pen is primarily a team/environment state applied to a batting cohort, not a hitter-specific threshold. Exact bullpen workload/freshness thresholds remain unrecovered, so the lens stays RESEARCH.

## PullAir / Blast recovery replay — fail-closed checkpoint
`profile-parity-replay.py` now audits the original 8/26–8/28 ZIP exports specifically for legacy field evidence. The saved board CSVs do **not** contain PullAir% or Blast% values. The metric-sort Pull/FB/HH boards preserve membership/order but not the underlying sorted metric value, so they cannot establish an exact field formula or denominator.

Result: PullAir and Blast remain `null`, profile parity remains blocked, and no v37 scoring gate is relaxed. This is an evidence boundary, not a guessed reconstruction.
