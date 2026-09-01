# BANDALYTICS Full Sim — Phase 16

## Added
- New same-game joint player-prop simulation core.
- Player legs are simulated in the same Monte Carlo iteration instead of multiplying standalone player probabilities.
- A shared game-environment shock and same-team offensive shock introduce positive/negative dependency structure across player outcomes.
- Supported joint markets: HR, 1+ hit, 2+ hits, 2+/3+/4+ TB, walk, stolen base, 2+ strikeouts.
- New `/api/sim-joint-player` research endpoint accepts one game plus selected player props and returns:
  - marginal probability for each leg
  - joint probability
  - joint fair odds
  - naive independence benchmark
  - correlation lift vs independence
- Joint endpoint reuses Bandalytics expected runs, confirmed lineup slots, starter HR context, park HR factor, season hitter rates, and recent BBE modifier.
- Explicitly remains uncalibrated/research-only and cannot clear a betting gate.

## Why this matters
A full sim cannot price same-game player combinations by blindly multiplying standalone probabilities. Team offensive environments create shared outcomes. Phase 16 establishes the first correlation-aware player SGP path.

## Guardrails
- Research-only.
- No production ticket builder hooks.
- No automatic +EV labels.
- Frozen v37 HR scoring unchanged.
- Existing exact-score cross-game independence rule remains unchanged.

## Tests
- Added deterministic joint-player simulation regression.
- Full `npm test`: PASS.

## Next
- Add Sim Lab UI builder for joint player selections.
- Extend joint game state to correlate player props with team ML, team total, game total, and exact-score bands.
- Historical calibration for player marginals and joint correlation lift remains required.
