# Older-era source boundary — 2026-10-01

Frozen CROSS6 needs chronological opening and later spread observations plus final score. BOOKS3PLUS_CROSS6 also needs comparable multi-book observations.

A fresh source search did not find a free older-era archive with those required fields. The existing 2015–2019 archive remains closing-only, so it cannot test CROSS6. Do not infer openings or count closing-only rows as qualifiers.

Therefore older-era extension is currently source-limited. Keep 2015–2019 as a market control only. Continue exact-rule season stability on compatible seasons, chance-baseline audits, the append-only 2026 prospective ledger, and isolated V2 shadow research. Frozen V1 remains unchanged and production remains disabled.

## Fresh source probe — 2026-10-01

A fresh public-source probe identified two possible future extension paths, but neither is admitted into V1 evidence yet:

- ParlayAPI documents CFB historical sources derived from CollegeFootballData across 11 NCAAF seasons and explicitly separates point-in-time odds, closing odds, results, and forward line movement. This is promising for provenance, but exact older-era CROSS6 compatibility still must be verified at the row/schema level before any season can be counted.
- Scottfree Sports advertises NCAAF historical CSV data with opening lines where available plus closing odds and final scores. It is a paid dataset, so no rows were acquired or counted in this run.

Neither source changes the current boundary: no older-era observations are added until chronological opening and later spread observations can be verified under the exact frozen key-group semantics. No inferred openings, no closing-only substitutions, and no ROI calculation.


## Follow-up compatibility probe — 2026-10-02

ParlayAPI documentation was checked more closely before admitting any older season. Its historical product distinguishes point-in-time odds, closing odds, results, and forward line movement. Critically, the provider states that line-movement history is forward capture rather than a backfilled simulation, and that `last_update` / `commence_time` can be null on historical snapshot rows. Its NCAAF material advertises deep closing history, but that does not by itself establish chronological open-to-later spread observations for older seasons.

Result: **no older-era season is admitted to frozen CROSS6 evidence from this source yet.** Deep closing history is insufficient for the exact frozen rule. A future admission requires row-level proof of (1) a genuine earlier spread observation, (2) a chronologically later pregame spread observation, (3) consistent team/side orientation, (4) final score, and for BOOKS3PLUS_CROSS6 (5) comparable independent book observations at the decision state. Null timestamps cannot be inferred or repaired.

This probe strengthens the existing source boundary rather than relaxing it. 2015–2019 remains control-only; V1 remains frozen; production remains disabled; no 2026 outcome was used for retuning; no ROI was computed.
