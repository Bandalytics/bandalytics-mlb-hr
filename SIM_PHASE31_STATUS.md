# BANDALYTICS Full Sim — Phase 31

## Added
- Immutable replay record IDs derived from date, game, protocol, model fingerprint, seed, and canonicalized selections.
- Automatic deduplication before calibration/readiness evaluation.
- Batch summaries now distinguish raw valid records from unique valid records and report duplicate count.
- Unified readiness reports input count and duplicate records removed.

## Guardrail
Rerunning the same historical game/protocol/seed can no longer inflate calibration sample size. A changed seed or selection produces a different immutable record ID and remains auditable.

## Next
Add a deterministic replay seed policy that is locked by protocol/version rather than caller choice for calibration batches, while preserving custom seeds only for ad-hoc research.
