# BANDALYTICS Full Sim — Phase 33

## Added
- Binomial Monte Carlo standard error and Wilson 95% confidence intervals for every joint leg and combined joint probability.
- Replay records persist the joint Monte Carlo SE and 95% interval for uncertainty auditing.
- Sim Lab SGP Joint card now displays the 95% probability interval beside fair odds.

## Guardrail
A simulated probability is not treated as infinitely precise. Future market/EV promotion can require the lower confidence bound—not only the point estimate—to clear the sportsbook break-even threshold.

## Next
Add a fail-closed joint market evaluator that requires both calibration readiness and positive lower-bound EV before it can label a combination as market-positive.
