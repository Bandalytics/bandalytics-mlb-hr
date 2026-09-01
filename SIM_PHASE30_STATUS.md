# BANDALYTICS Full Sim — Phase 30

## Added
- Model-fingerprint cohort partitioning for historical replay records.
- Cohort inventory reports record counts, valid counts, date span, protocols, model versions, and replay versions per fingerprint.
- Unified readiness can now evaluate one explicitly selected fingerprint cohort without deleting or rewriting older model history.
- Mixed fingerprints remain fail-closed when no cohort is explicitly selected.

## Next
Add replay-batch deduplication and immutable record IDs so rerunning the same date/game/protocol/seed cannot silently double-count calibration observations.
