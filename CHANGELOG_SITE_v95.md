# BANDALYTICS v95 Site Changelog

- Preserved v74 loader/persistence and frozen v37 scoring.
- Hardened duplicate Pitch Fit request path: isolated duplicate requests carry MLBAM ID; no-ID/mismatch stays research.
- Preserved identity fields through persistence schema.
- Added local MLBAM-aware historical Results endpoint and fixed source build routing gap.
- Added research-only Direct Profile endpoint using MLBAM batters and Savant; PullAir/Blast remain null pending parity.
- Added research-only historical market identity endpoint.
- Added fail-closed `/api/research-status` contract.
- Added Direct Feed Lab UI with ZIP/direct source badges, feed coverage, parity gates, duplicate audit and ZIP action.
- Added read-only ZIP ↔ Direct field comparator for identity, lineup, starter, EV, HH, Barrel and ISO.
- Existing Direct Preview tab is upgraded to Direct Lab in generated site build and now includes MLBAM ID/source fields.
- Reinstated root no-store and immutable hashed-asset headers in source `vercel.json`.
- Tightened profile readiness so `scoring_eligible=true` alone is insufficient; `parity_verified=true` is also required.

- Locked a v74 infrastructure regression test around the production loader constants so identity/direct-feed work cannot silently change loader batching, retry, timeout, split-fallback, or recovery telemetry behavior.

- Added an automated post-deploy acceptance gate covering cache policy, hashed assets, research fail-closed rules, direct feeds, duplicate identity, and the frozen 8/27 Results oracle.
- Direct Lab now uses browser-local calendar dates instead of UTC dates, preventing late-night slate-date rollover on iPhone/Safari.
- Added iPhone safe-area handling to the Direct Lab floating control and bottom sheet.
- Site UI now explicitly labels the frozen model as `MODEL v37 • LOCKED` and the Tonight HR column as `Tonight HR Score v37`.

- Phase 20: added strict as-of hitter stats for historical player and joint-game/player simulations; historical mode now exposes explicit leakage-safety flags.

- Phase 21: added official boxscore settlement for player/game joint legs and blocked integer total lines from binary joint pricing to prevent push misclassification.

- Phase 22: added fail-closed joint/SGP historical calibration metrics and promotion gates versus naive independence.
