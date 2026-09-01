# BANDALYTICS Full Sim — Phase 34

## Added
- Fail-closed sportsbook joint-offer evaluator.
- Computes sportsbook break-even probability, point-estimate edge/EV, and lower-95%-bound edge/EV.
- Market-positive labeling is allowed only when the unified historical calibration + chronological holdout + walk-forward readiness gate is cleared **and** the lower Monte Carlo confidence bound remains positive EV.
- `/api/sim-joint-offer-eval` derives readiness from supplied calibration records instead of trusting a caller-provided boolean.

## Current state
This does not activate sportsbook SGP recommendations. Without a cleared calibration cohort, evaluation status is `BLOCKED_UNCALIBRATED` regardless of the point estimate.

## Next material blocker
Populate a real strict-as-of replay cohort at scale. The source layer is ready, but this environment cannot access the historical network feeds directly and the Phase 23+ replay route still needs to be deployed to a reachable preview/runtime before bulk replay can run.
