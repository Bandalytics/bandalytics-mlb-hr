# BANDALYTICS v95 Native Pipeline Status

## Scoring-safe cutovers
- MLB slate / probable starters / posted lineups / MLBAM IDs: direct MLB feed.
- Recent BBE: direct Baseball Savant with frozen classifier; 24/24 real-player/date parity vs v90.

## Native research enrichments (no v37 scoring write access)
- Hitter profile bulk: ISO, EV, Sweet Spot, Barrel%, Hard-Hit%, Pull%, Blast-contact/swing.
- Pull AIR: exact Savant Batted Ball Profile definition, targeted candidate fetch.
- Starter damage: overall + vs-LHB/vs-RHB HR/9, AVG, SLG, ISO, IP plus Savant contact damage.
- Pitch arsenal: pitcher usage/damage and hitter performance by exact pitch type.
- Bullpen: 3/5-day workload, reliever usage, rest days, R/L availability.
- Park: current + rolling-3 Statcast HR factors.
- Weather: MLB venue coordinates + game-time Open-Meteo hourly forecast with next-UTC-day handling.

## Live market
- SportsGameOdds adapter implemented and unit-tested.
- Exact roster identity + stale-slate isolation + per-book open/current movement + best price supported.
- Requires SPORTSGAMEODDS_API_KEY for live HR prices.
- Live market has zero scoring write access until connected and replay-calibrated.
