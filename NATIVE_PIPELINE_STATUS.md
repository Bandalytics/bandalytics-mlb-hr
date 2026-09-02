# BANDALYTICS v95 Native Pipeline Status

## Scoring-safe cutovers
- MLB slate / probable starters / posted lineups / MLBAM IDs: direct MLB feed.
- Recent BBE: direct Baseball Savant with frozen classifier; 24/24 real-player/date parity vs v90.

## Direct Lab identity + profile path
- Direct Preview is identity-first and returns the MLB lineup layer immediately.
- Baseball Savant profile hydration is progressive in the client in MLBAM-ID batches; failed batches can be split into smaller requests instead of blocking the entire slate.
- Directly available profile fields on the deployed path: EV, Hard-Hit%, Barrel%, and standard batting ISO.
- Historical 8/26–8/28 ZIP evidence does **not** export exact PullAir% or Blast% values. Those fields remain PENDING; profile scoring parity is therefore blocked.
- Direct profile rows remain `scoring_eligible=false` and have zero v37 scoring write access.

## Native research enrichments (no v37 scoring write access)
- Starter damage: overall + vs-LHB/vs-RHB HR/9, AVG, SLG, ISO, IP plus Savant contact damage.
- Exact-ID Pitch Fit: native research route is keyed by hitter MLBAM ID + pitcher MLBAM ID; legacy score parity remains unproven.
- Bullpen/environment research: workload/handedness, park and weather layers exist as research inputs; legacy thresholds remain non-scoring until parity is proven.

## Live market
- SportsGameOdds adapter implemented and unit-tested.
- Exact roster identity + stale-slate isolation + per-book open/current movement + best price supported.
- Requires `SPORTSGAMEODDS_API_KEY` for live HR prices.
- Live market has zero scoring write access until connected and replay-calibrated.

## Hard invariant
ZIP remains production scoring truth. Direct mode cannot create or modify v37 qualification, Tonight HR Score, Final Pool, Daily Card, or tickets until the required parity gates are independently proven.
