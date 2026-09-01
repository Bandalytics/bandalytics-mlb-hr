# BANDALYTICS Full Sim — Phase 13

## Added
- Simulation Lab now exposes Game Board, Player Board, Market Lab, Exact Score, Calibration, and Model Health in one research UI.
- Exact Score tab can select one exact-score outcome across multiple games and evaluate model joint probability, fair odds, offered odds, and EV using the existing cross-game independence contract.
- Same-game exact-score combinations remain blocked until joint-event correlation simulation is implemented.
- Calibration tab calls the historical calibration endpoint and surfaces games, winner accuracy, team-run MAE/RMSE, total-run MAE, and moneyline Brier score.
- Calibration remains visibly non-actionable because historical hydration is not yet strict as-of-date.
- Sim Lab slate date initialization is local-calendar based instead of UTC to avoid iPhone evening slate rollover.
- `npm test` now includes the full sim regression set in addition to the frozen v37/site/direct-feed suite.

## Invariants
- Research only.
- v37 scoring unchanged.
- Production qualification/pool/ticket logic unchanged.
- ZIP production truth unchanged.
- No calibration gate cleared.
