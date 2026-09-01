# BANDALYTICS Full Sim — Phase 20

## Added
- Historical player simulation now has a strict as-of hitter-stat path instead of silently using full-season/current hitter stats.
- Added `hydrateHittersAsOf()` using MLB `byDateRange` batting stats through the requested historical date.
- Historical BBE requests remain date-addressed and fail soft to neutral when unavailable.
- `/api/sim-players` now supports `historical=1` and returns explicit `historicalMode`, `asOfDate`, and `strictHistoricalInputs` flags.
- `/api/sim-joint-game-player` now supports historical mode with both as-of starter/team stats and as-of hitter stats.
- Added unit and route-wiring regression tests.

## Why this matters
The player and SGP layers could not be honestly backtested while historical requests were allowed to see later-season hitter statistics. Phase 20 closes that leakage path so historical player/joint calibration can be built on pregame-only inputs.

## Still blocked
- Joint/SGP calibration still needs a historical ticket-selection replay set plus actual player/game leg settlement.
- Recent BBE historical parity depends on the native BBE endpoint honoring the requested date; missing data stays neutral rather than leaking current BBE.
- No sportsbook SGP EV or production ticket-builder label until joint calibration passes.
