# BANDALYTICS legacy lens parity — current checkpoint

## PROMOTED
- Sharp Money: delta implied HR probability >= +2.00 percentage points.
  - Historical validation: 71/71 across 2026-08-26, 08-27, 08-28; 0 FP, 0 FN.

## RESEARCH / NOT PROMOTED
- Steam: path/history dependent. Historical Steam membership can remain present after final odds reverse/lengthen; final open→current snapshot is insufficient. Direct mode must retain timestamped quote history before recreation is attempted.
- Sweet Spot: UI description states +200 to +600 value window, but historical membership is not equivalent to every row in that price range; additional eligibility/board-generation state exists. Do not recreate from price alone.
- Double Edge: UI description = "A hot bat running straight into a fading starter." Requires recent hitter-form/contact plus starter context; not market-only.
- Tired Pen: bullpen-state lens. Requires bullpen workload/freshness data.
- Dialed-In Power: recent perfect-contact/power-contact lens. Requires BBE/recent-contact semantics.
- Barrel Match / Mispriced / Hidden Edge / Sleeper Edge: still research until exact cross-slate membership rule is proven.

No research lens may enter v37 scoring or Final Pool as a recreated legacy tag.

## Enforcement layer
- `lens-registry.mjs` is now the direct-mode allowlist.
- Only `Sharp Money` is `PROMOTED` + `direct_safe=true`.
- All other recovered lens concepts are explicitly `RESEARCH` and blocked from recreated direct scoring/tag output.
- `promotedLegacyLenses()` currently emits Sharp Money only.

## Fixture replay hardening
The three original historical ZIPs are now replayed directly by `historical-replay.py` rather than relying only on copied counts. Sharp Money remains the only promoted regenerated legacy lens: 71/71 exact across 8/26–8/28, 0 FP, 0 FN.

Steam board membership should be distinguished from the per-row legacy `Steam=yes` annotation appearing inside other boards. The dedicated Steam board contains shortening candidates at capture time, while the annotation can survive later price reversal. Therefore future direct recreation still requires timestamped quote history and a proven board-generation trigger; final-state movement alone remains insufficient.

## Structural replay update
- Tired Pen: RESEARCH. Strong cohort-level evidence recovered: 275 rows / 35 team+starter cohorts / 33 complete cohorts. Exact bullpen threshold is still unknown, so do not promote.
- Vs Weak Pitcher: RESEARCH. 52 rows / 20 cohorts / 0 complete cohorts; clearly hitter-filtered after starter selection.
- Barrel Match: RESEARCH. 29 rows / 11 cohorts / 0 complete cohorts; interaction filter, not a team blanket.
- Double Edge: RESEARCH. 20 rows / 8 cohorts / 0 complete cohorts; cross-layer hitter+starter filter.
