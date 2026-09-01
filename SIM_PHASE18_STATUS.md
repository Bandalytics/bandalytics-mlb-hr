# BANDALYTICS Full Sim — Phase 18

## Added
- Coupled game + player Monte Carlo core.
- Player props and game markets now share the same simulated game-environment and team-offense shocks.
- Supported game legs: away/home ML, game over/under, away/home team total over/under, ±1.5 run lines, exact score, and ±1 score bands.
- New `/api/sim-joint-game-player` research endpoint combines those game legs with player HR/hit/TB/walk/SB/K legs in one simulation path.
- This removes another major independence shortcut for future SGP pricing.

## Guardrails
- Research-only and explicitly uncalibrated.
- No automatic recommendation or production ticket construction.
- Existing frozen HR model remains unchanged.

## Next
- Add these game legs to the Sim Lab joint builder UI.
- Add historical calibration for conditional/joint outcomes before any SGP EV labels are allowed.
