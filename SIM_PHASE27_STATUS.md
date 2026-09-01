# BANDALYTICS Full Sim — Phase 27

## Added
- Expanding-window walk-forward evaluation for joint/SGP probabilities.
- Forward-only test folds with explicit temporal-separation checks and non-overlapping out-of-sample records.
- Aggregate out-of-sample calibration by protocol and leg count.
- Fold stability check reuses the existing calibration gates for folds with at least 100 records; no new profitability claim is introduced.
- CLI (`replay:joint-walkforward`) and `/api/sim-joint-walkforward` endpoint.

## Promotion rule
A single lucky holdout period is no longer enough. Readiness requires at least three forward folds, no out-of-sample overlap, the aggregate OOS calibration gate, and stable eligible folds.

## Next
Wire replay/calibration/holdout/walk-forward status into a single research readiness endpoint and Sim Lab diagnostics card while keeping all sportsbook EV labels fail-closed until the full gate passes.
