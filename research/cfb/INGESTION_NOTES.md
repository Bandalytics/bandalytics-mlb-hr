# Historical ingestion notes

Primary candidate: CollegeFootballData historical game lines. Official documentation confirms game ID, provider, spread, opening spread, total, opening total, and home/away moneyline fields.

Important limitation: the documented GameLines schema provides opening and current/final provider line fields, not a timestamped intraday history. V1 can therefore test open-to-final movement, provider disagreement, key-number crossing, ATS/O-U outcomes, and moneyline availability. It cannot identify when a move occurred or simulate a midweek snapshot unless a timestamped source is added.

Historical public ticket percentages remain unavailable unless a verified source is acquired.

## Holdout scaffold
Discovery: 2018-2023
Validation: 2024
Untouched holdout: 2025
Prospective: 2026

Before inspecting signals, audit each season/provider for raw counts with final scores, spread, opening spread, total, opening total, both moneylines, multiple providers, and verified ticket percentages. No signal conclusion is valid without its denominator.
