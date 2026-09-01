# BANDALYTICS Full Sim — Phase 17

## Added
- Same-game joint player-prop builder directly in Sim Lab.
- Game selector uses current player-sim slate and keeps all selected legs inside one game.
- Supports HR, 1+ hit, 2+ hits, 2+/3+/4+ TB, walk, SB, and 2+ strikeouts.
- Standalone probability/fair price updates when the chosen market changes.
- Joint simulation calls `/api/sim-joint-player` and displays correlated joint probability, fair odds, naive independence benchmark, and correlation lift.
- Requires at least two legs before a joint request can run.
- New UI regression test is included in the full test suite.

## Guardrails
- Research-only / uncalibrated banner remains intact.
- No automatic +EV or ticket-builder recommendation is emitted.
- Same-game props are not priced by naive probability multiplication.
- Production HR scoring remains untouched.

## Next
- Extend joint state so player legs can be combined with team ML, team total, game total, and exact-score bands in the same Monte Carlo path.
- Add bookmaker SGP price entry and no-vig/EV comparison only after joint calibration work is available.
