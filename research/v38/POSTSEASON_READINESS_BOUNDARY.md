# V38 postseason readiness boundary

## Audit finding

The unfinished regular-season 5/10 forward-canary gate must not count 2026 postseason settlements. Postseason observations remain research-only.

The current regular-season readiness summarizer accepts any otherwise valid settlement date and its existing contract fixture used October 2026 dates. That creates a comparability leak: a postseason settlement could advance the regular-season readiness count even though the frozen offseason contract explicitly forbids that.

## Safe remediation target

- Keep postseason settlement/ledger observations available as separately labeled research evidence.
- Fail closed if a 2026 postseason observation is supplied to the regular-season 5/10 readiness aggregator.
- Resume the carried gate with clean 2027 regular-season canaries.
- Do not change Core6, candidate source, starter suppression, protected 4/6, ranking, board share, ticket budget, Priority-25, pairing, or production-volume rules.

A code change to the readiness summarizer should be contract-tested before merge. The fixture dates should be 2027 regular-season dates, plus a negative test proving a 2026 postseason settlement cannot advance readiness.

## Verified pregame HR-price replacement research

SportsGameOdds remains unsuitable as the sole source while its entity quota is exhausted. Candidate replacements researched on 2026-09-28 UTC:

1. **The Odds API** — official MLB documentation explicitly exposes the `batter_home_runs` event market for current/upcoming games. Its historical event-odds endpoint supports player props from May 2023 on paid plans, which is useful for timestamp/provenance audits. Candidate for a narrow 2027 adapter/probe; do not treat it as integrated until a real pregame response is captured and mapped.
2. **SportsDataIO** — official MLB coverage advertises pregame player props and odds/line movement, and its historical-data guide documents an MLB BettingPropsArchive endpoint. Candidate for coverage/identity comparison; access and exact HR-market payload still need a credentialed probe.
3. **OpticOdds** — official API materials advertise MLB, player props, pre-match odds, historical odds, and 200+ sportsbooks. Candidate for redundancy/coverage testing; exact commercial access and HR-market mapping still need a credentialed probe.

No source is promoted by this research note. A replacement must preserve bookmaker, market, player identity, observed timestamp, event start time, raw price, and source provenance before freeze. No postgame backfill is admissible.
