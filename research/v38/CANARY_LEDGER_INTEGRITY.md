# V38 canary ledger integrity

Research/canary operations only. The append-only ledger records one verified readiness-eligible settlement per date and rejects duplicate-date replays, conflicting replacements, tampered prior ledgers, incomplete provenance, non-holdout-aligned settlements, or unsafe production flags.

Portfolio stake, net, and realized ROI are recomputed from raw settlement totals. Per-slate ROI percentages are never averaged. The ledger cannot enable normal-volume production.
