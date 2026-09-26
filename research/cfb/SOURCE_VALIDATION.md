# CFB source validation — 2026-09-26

CFBD is acceptable for the first historical market lane: its official access page explicitly includes historical data and betting lines, and its GameLines schema exposes provider, spread, spreadOpen, overUnder, overUnderOpen, moneylineHome and moneylineAway.

Important limitation: GameLines documents open/current-style fields but not a timestamped intraday history for each change. Therefore V1 may test open-to-recorded-line movement and cross-provider disagreement, but must NOT label that as a precisely timed pre-kickoff steam sequence unless a separately timestamped source is available.

Historical public ticket percentages remain unavailable in the verified CFBD schema and must stay NULL. RLM-vs-public, resistance-vs-public, and ticket-imbalance buckets remain quarantined.

Data acquisition is credential-dependent. Do not commit API keys. A user/CI secret may be used later, or exported historical CSV/JSON can be supplied to the replay tools.

## Split policy
Discovery: 2021-2024 (subject to source completeness).
Holdout: 2025, untouched until the discovery specification is frozen.
Prospective: 2026.

The split is research scaffolding, not a betting rule.
