# BANDALYTICS Full Sim — Phase 22

## Added
- Joint/SGP calibration scoring core for settled historical replay records.
- Tracks observed hit rate, mean predicted probability, Brier score, log loss, 10% probability calibration buckets, maximum calibration gap, and comparison versus the naive independence benchmark.
- Added explicit promotion gates for sample size, bucket coverage, calibration error, and improvement versus independence.
- Added `/api/sim-joint-calibration` for replay batches.
- Sportsbook SGP EV remains fail-closed unless every calibration gate passes.

## Important
These thresholds are diagnostic promotion gates, not a guarantee of profitability. The replay sample still must be generated without outcome leakage and monitored out of sample.

## Next
Automate replay-record generation from strict as-of joint simulations + official settlement, then accumulate enough historical combinations to test the calibration gate.
