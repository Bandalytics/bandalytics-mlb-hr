# CFB BANDALYTICS — Historical Market Research V1

Status: RESEARCH ONLY. Nothing here changes MLB BANDALYTICS or creates CFB production betting rules.

## Goal
Test whether market-structure signals contain repeatable pregame information before defining a CFB production model.

## Frozen research hypotheses
- Reverse line movement (RLM)
- Public steam
- Resistance / failure to move with ticket pressure
- Spread + moneyline confirmation
- Cross-book confirmation / source conflict
- Key-number behavior
- Total movement
- Favorite/dog, home/away, conference/nonconference and spread-size interactions

These are hypotheses, not grades or locked rules.

## Anti-leakage contract
Every row is evaluated only from information timestamped before kickoff. Final score is joined only after the signal snapshot is frozen. Closing line may be used as an outcome/market-efficiency comparator only when the simulated decision snapshot predates it. No future-season statistics. No reconstructed public ticket percentages.

## Required game schema
season, week, kickoff, home_team, away_team, home_score, away_score,
provider, snapshot_time, spread_home, spread_open_home, total, total_open,
moneyline_home, moneyline_away, ticket_pct_home, ticket_pct_away,
ticket_pct_over, ticket_pct_under, ticket_source

Ticket percentage fields may be null. Null is NOT inferred.

## Research outputs
Aggregate raw wins/losses/pushes and sample counts. Never average weekly hit percentages.
Break out:
- side / total
- dog / favorite
- home / away
- spread bands and key numbers (3, 6, 7, 10, 14)
- movement magnitude
- single-market vs spread+ML confirmation
- single-provider vs cross-book confirmation
- public-ticket buckets only when verified historical percentages exist

Report ATS/total hit rate with binomial uncertainty and sample size. ROI is forbidden unless the exact historical price/juice at the simulated decision timestamp is verified.

## Development / holdout
Use earlier seasons for discovery. Keep a later complete season untouched as holdout. 2026 remains prospective whenever possible.

## Ticket-construction phase
Only after individual-leg signals survive holdout:
1. straight-leg baseline
2. 2-leg / 3-leg combinations
3. selective longer tickets
4. alt-spread / ML substitutions
5. equal-ticket-budget comparisons

The Sep 2026 winning 5-leg example is stored only as a qualitative construction example: favorite spread + total + dog spread + protected alt dog + moneyline. It must never be used to derive rules from its known outcome.

## Data-source notes
CFBD exposes provider game lines including spread/spreadOpen, total/totalOpen and moneylines. Historical public-ticket percentages require a separate verified source; until one is available, RLM-vs-public and resistance-vs-public are UNTESTABLE rather than estimated.
