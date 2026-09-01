# BANDALYTICS Full Sim — Phase 21

## Added
- Official MLB boxscore settlement for historical joint game + player tickets.
- Player settlement supports HR, 1+ hit, 2+ hits, 2+/3+/4+ TB, walk, SB, and 2+ strikeouts.
- Game settlement supports ML, ±1.5, totals, team totals, exact score, and ±1 score band.
- Pushes are represented explicitly during settlement.
- Added `/api/sim-settle-joint` for replay/audit workflows.
- Added a fail-closed pricing guard: joint total/team-total selections must use half-run lines so an integer-line push cannot be incorrectly counted as a loss by the binary joint Monte Carlo.
- Added settlement and push-guard regression tests.

## Why this matters
Phase 20 removed historical hitter-stat leakage. Phase 21 adds the other half of the backtest loop: actual settlement. We can now compare a historical pregame joint probability to what actually happened without manually grading every leg.

## Next
Build the historical joint replay/calibration runner that pairs strict as-of simulations with official settlement over a repeatable ticket-selection sample.
