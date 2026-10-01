# CFB V2 shadow research protocol — 2026-09-30

Status: RESEARCH ONLY. This document does not modify frozen V1, CROSS6, BOOKS3PLUS_CROSS6, the 2026 prospective ledger, or production status.

## Isolation contract

- Frozen V1 remains exactly as preregistered.
- 2026 outcomes may evaluate V1 prospectively but may not retune it.
- V2 findings are shadow evidence only and cannot be backfilled into V1.
- No nonqualifier may be counted as a V1 decision.
- Rejected DOG_MOVE_3PLUS and BOOKS3PLUS_DOG_MOVE_3PLUS screens stay rejected for V1.
- No public-ticket percentages are used unless a historical field is source-verifiable and timestamped.
- No ROI is computed without a verified frozen decision price.
- All market records must preserve chronology and provider provenance.

## Preregistered V2 lanes

These lanes are descriptive hypothesis tests, not betting rules.

### Lane A — adjacent key structure
Compare exact single-key crossings at 3, 6, 7, 10, and 14 using the same open-to-recorded semantics and exact single-key classification used by the corrected V1 stability audit. Report each season separately before pooled summaries.

### Lane B — movement magnitude within key class
Within each exact key-crossing class, stratify absolute spread movement into fixed bins: <1, 1–1.99, 2–2.99, and 3+. Do not adapt bin edges after seeing outcomes.

### Lane C — book confirmation
Within each exact key-crossing class, compare recorded market_spread_book_count groups 1, 2, and 3+. Treat book count as confirmation metadata only; do not infer independence among books.

### Lane D — role interaction
Within each exact key-crossing class, split recorded home role into favorite, dog, and pick'em. This is V2 only; it does not revive the rejected V1 dog/movement screen.

## Reporting contract

For every lane:
1. report W-L-P, non-push N, ATS hit rate, and Wilson 95% interval;
2. report season-by-season results before any pooled result;
3. label 2021–2024 discovery/descriptive;
4. keep untouched 2025 interpretation separate from discovery;
5. never use discovery-selected p-values as confirmatory evidence;
6. reject strata with missing required opening/recorded spread fields rather than imputing;
7. do not promote any V2 result to production from this branch.

## Older-era stress tests

Exact frozen V1 may be tested in older seasons only when both compatible opening and recorded spread fields exist with auditable provenance. Closing-only 2015–2019 data remains incompatible and must not be reconstructed or imputed.

## Promotion gate

No V2 feature can alter V1. Any future candidate requires a new version, a written freeze before evaluation on a genuinely untouched sample, and its own prospective ledger.
