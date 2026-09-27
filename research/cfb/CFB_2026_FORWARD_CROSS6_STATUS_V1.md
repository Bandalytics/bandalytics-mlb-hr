# CFB BANDALYTICS — 2026 CROSS6 Forward Status V1

Status: RESEARCH / SHADOW VALIDATION ONLY. No production enable.

## Frozen candidates

Only the two 2025 holdout survivors are tracked:
- `CROSS6`
- `BOOKS3PLUS_CROSS6`

Definitions are unchanged. No public-ticket data, no new filters, no threshold search, and no ROI without verified frozen prices.

## Prospective snapshot contract

For each game, use the final immutable non-live home-spread quote captured strictly before kickoff from each available sportsbook. The decision spread is the median of those final eligible pre-kickoff quotes. The opening spread remains the processed `market_spread_open` consensus. A signal exists only when open-to-snapshot movement produces exactly `CROSS_6` under the frozen key-group definition. `BOOKS3PLUS_CROSS6` additionally requires at least 3 contributing books.

This contract is deliberately timestamped and fail-closed. It is a shadow-validation contract, not an execution-price or betting rule.

## First settled 2026 observations

Current settled forward sample from the timestamped snapshot ledger:
- `CROSS6`: 1-3-0, 25.0%, n=4 decisions.
- `BOOKS3PLUS_CROSS6`: 1-3-0, 25.0%, n=4 decisions.

The four settled qualifying games are:
1. Jacksonville State @ North Dakota State — followed move toward away — L.
2. Missouri @ Kansas — followed move toward home — L.
3. North Carolina Central @ Gardner-Webb — followed move toward home — W.
4. Fresno State @ San José State — followed move toward home — L.

## Interpretation

This is a poor start, but four decisions are far too few to make a reliability conclusion. The result is retained exactly as observed and cannot be filtered away. It materially lowers short-term confidence relative to the 2025 holdout, so the signal remains research-only.

Pending and future qualifying events stay in the ledger with `result=null` until final scores are available. They must be settled under the same definitions.

## Readiness rule

Do not enable production from this sample. Continue accumulating raw W/L/P prospectively. No retrospective exclusions or definition changes are permitted. Any redesigned rule must be versioned separately and receive a new independent validation sample.
