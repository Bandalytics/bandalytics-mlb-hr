# BANDALYTICS Full Sim — Phase 29

## Added
- Versioned simulator metadata and deterministic model fingerprint for every new strict replay record.
- Fingerprint encodes the joint model version, replay version, input schema, and locked stochastic/historical-safety configuration.
- Replay batches and calibration reports persist model metadata.
- Unified readiness gate now blocks mixed-model or missing-fingerprint calibration samples.
- Sim Lab readiness diagnostics display fingerprint pass/block state.

## Why
Historical calibration from incompatible model revisions cannot be pooled silently. A simulator change must produce a new fingerprint and therefore a new calibration cohort unless an explicit migration is created.

## Next
Add protocol/model cohort partitioning so old fingerprints remain queryable for comparison while only one explicitly selected cohort can be evaluated for promotion.
