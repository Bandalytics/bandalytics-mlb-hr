# BANDALYTICS Full Sim — Phase 19

## Added
- Sim Lab SGP Joint builder can now mix player props and game markets from the same matchup.
- Game legs supported in UI: ML, ±1.5 run line, game total, team totals, exact score, and ±1 score band.
- Game legs are removable chips and reset when the selected matchup changes.
- Joint request now uses `/api/sim-joint-game-player`, so game and player legs are evaluated in the same coupled Monte Carlo state.
- Builder enforces at least two total legs, regardless of whether they are player or game selections.
- Added UI regression coverage.

## Result
The research sim can now price structures such as:
- player HR + team ML
- player 2+ TB + game over
- two hitters + team total over
- player HR + exact-score band
without assuming the legs are independent.

## Still blocked
- No sportsbook SGP EV label until historical conditional/joint calibration exists.
- No production ticket-builder hook.
