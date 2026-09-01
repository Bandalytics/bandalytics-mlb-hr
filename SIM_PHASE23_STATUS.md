# BANDALYTICS Full Sim — Phase 23

## Added
- Strict prior-day cutoff for historical cumulative MLB pitcher, hitter, and team stats. Historical replays no longer include the target game's same-day stats in their cumulative inputs.
- Historical joint game/player route now actually enables `historicalSafe`, neutralizing full-season park/weather/feed ISO inputs during replay, and uses neutral HR park factor for player legs.
- Deterministic seeded RNG utilities for reproducible replay probabilities.
- Automated `/api/sim-joint-replay` route: strict as-of simulation -> official MLB boxscore settlement -> calibration-ready record.
- Replay records fail closed on pushes, invalid/missing player settlement, simulation failure, or unsettled games.
- Added strict cutoff + replay-record regression tests.

## Calibration rule
Only records with `valid:true` may enter the joint calibration endpoint. `statsCutoffDate` is emitted on every replay record so leakage auditing is explicit.

## Next
Add a date-range replay batch runner that generates a fixed, predeclared combination protocol (not outcome-selected), writes NDJSON/JSON batches, and feeds those valid records into the Phase 22 calibration gate.
