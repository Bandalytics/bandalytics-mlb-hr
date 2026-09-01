# BANDALYTICS Full Sim — Phase 25

## Added / Fixed
- Fixed Phase 23 replay-record compatibility with the Phase 22 calibration core. Replay records now emit both canonical `modelProbability/status` fields and audit aliases `predictedProbability/settlementStatus`.
- Calibration core now safely accepts both legacy and replay-record schemas while excluding `valid:false` records.
- Grouped calibration reports by fixed protocol and leg count, plus overall promotion state.
- Explicit progress tracking: records remaining to 500, number of 25+ sample probability buckets, and records with an independence benchmark.
- Batch-to-calibration CLI and `/api/sim-joint-calibration-batch` route.
- Batch runner now embeds `protocolId` and `protocolVersion` directly in each persisted calibration record.

## Promotion behavior
The global Phase 22 gate still controls sportsbook-SGP EV eligibility. Leg-count diagnostics provide an additional guard against an overall pass being driven by only one combination size.

## Next
Build protocol-stratified train/holdout evaluation so the calibration gate is measured on untouched chronological holdout records rather than the same data used for tuning.
