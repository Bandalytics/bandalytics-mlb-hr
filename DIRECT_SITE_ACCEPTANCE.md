# BANDALYTICS v95 Direct Feed Lab — Acceptance Contract

Automated acceptance before any user iPhone test:

1. Production ZIP path still loads without any dependency on Direct Lab.
2. Direct Lab must not contain v37 / qualification / Final Pool / ticket write hooks.
3. Direct Lab must show `scoring_enabled=false`.
4. Both `/api/direct-preview` and `/api/feed-status` failures must fail closed and leave production state untouched.
5. Duplicate-name rows must display team + MLBAM ID where returned.
6. True Pitch Fit research gate must remain BLOCKED until exact-ID upstream parity is proven.
7. Profile gate must remain PARTIAL until PullAir and Blast definitions pass historical parity.
8. Market gate must remain PARTIAL until a live HR price provider is connected and historical replay passes.
9. Sharp Money may display LOCKED because 71/71 historical entries reproduce at >= +2.00 implied probability points.
10. Direct mode may not create Final Pool or tickets.

Only after a public preview passes browser smoke tests should the user be asked for one meaningful iPhone/Safari acceptance.
