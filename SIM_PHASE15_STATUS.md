# BANDALYTICS Full Sim — Phase 15

## Added
- Multi-day historical calibration core now aggregates daily as-of runs without reconstructing/losing exact-score probabilities.
- Calibration rows carry their slate date, preserving date-aware auditability across ranges.
- Aggregate diagnostics now include winner accuracy, ML Brier, team-run MAE/RMSE, total-run MAE/bias, exact-score mean realized probability, exact-score log loss, probability buckets, strict-day count, failed-day count, and daily trend rows.
- New research-only `/api/sim-calibrate-range` endpoint supports 2–14 completed-date windows and runs each date with as-of starter/team stats plus the historical-safe scoring contract.
- Range endpoint reports per-day strict readiness and never marks results actionable.
- Sim Lab Calibration tab now supports 1-day or 7/10/14-day ranges and visibly reports strict historical readiness.
- Removed outdated UI wording that said as-of stats were not implemented; it now accurately states which inputs are date-locked and which historical inputs remain neutral.
- Added regression coverage for range aggregation and exact-score calibration preservation.

## Historical-safety contract
- Starter/team stats: as-of-date.
- Lineup ISO scoring: neutral in historical calibration until strict historical lineup snapshots are available.
- Park scoring: neutral in historical calibration until strict date-aware park snapshots are implemented.
- Bullpen workload: date-relative feed.
- No calibration result clears a betting/action gate automatically.

## Test status
- Full `npm test`: PASS.
- Existing frozen v37/site/direct-feed tests remain included.

## Next
- Add strict historical lineup reconstruction from MLB boxscore/lineup sources.
- Add date-valid park-factor snapshots or season-to-date park priors.
- Then run a sufficiently large multi-week/month backtest before tuning dispersion, shared-environment variance, or market thresholds.
