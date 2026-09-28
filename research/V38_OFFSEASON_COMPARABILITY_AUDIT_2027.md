# BANDALYTICS v38 — Offseason Comparability Audit / 2027 Validation Plan

## Baseline

Frozen baseline: `main@090e25a12af97ed2e3154a50c7fab880b5ef9ef8` (PR #29).

This audit is additive research. It does not modify the frozen 2026 baseball contract, Core6 thresholds, slate routing, serious-board share, ticket budget, priority-repeat share, or cross-game pairing rule.

## Audit finding: historical ticket replay is not fully execution-comparable

The no-lineup historical revalidation correctly excludes lineup slot from every ranking key.

However, `scripts/evaluate-v38-ticket-no-lineup-revalidation.mjs` builds tickets from the entire serious board. It does not apply the forward canary's confirmed-lineup execution guard.

The forward path in `scripts/build-v38-canary-execution-plan.mjs` ranks candidates without lineup slot, then separately restricts ticket construction to hitters whose lineup membership is confirmed at freeze.

Therefore:

- historical serious-board ranking evidence remains valid for studying lineup-position contamination removal;
- historical ticket outcomes remain research diagnostics;
- historical ticket fill, coverage, and architecture results are **not fully execution-comparable** to the 2027 forward canary;
- those historical outcomes must not be used to promote the provisional ticket architecture;
- no postgame lineup reconstruction may be relabeled as verified pregame confirmation.

This is a comparability classification, not a reason to outcome-mine a replacement architecture.

## Remaining leakage / integrity boundaries

1. **Ranking:** lineup slot must remain absent from ranking keys.
2. **Execution eligibility:** confirmed lineup membership may gate ticket legs only after ranking.
3. **Historical actual participation:** may be descriptive metadata, but cannot establish point-in-time pregame confirmation.
4. **Prices:** no inferred or postgame-backfilled HR prices may enter ROI validation.
5. **Stakes:** every countable forward ticket requires a positive frozen stake.
6. **Outcomes:** must be captured after freeze with source provenance and hash chaining.
7. **Postseason:** separate research sample; never advances the regular-season 5/10 gate.
8. **Holdout outcomes:** may diagnose the provisional architecture but may not silently select a new one.

## 2027 preseason validation plan

### Phase A — preseason integrity rehearsal

Before Opening Day:

- run the frozen-contract CI guard;
- run deterministic ranking replays twice from identical inputs and require identical candidate/serious-board IDs;
- verify lineup values cannot alter rank order when all non-lineup inputs are fixed;
- verify unconfirmed lineup membership can remove a hitter from ticket execution without changing the pre-execution rank order;
- verify a canary fails closed when any required Core6 input is incomplete;
- verify protected 4/6 remains shadow-only;
- verify starter HR/9 < 1.20 remains suppressive under the frozen anti-overcompression contract;
- verify price/stake freeze rejects missing, non-pregame, or nonpositive inputs;
- verify settlement rejects unhashed outcomes, changed plan hashes, changed prices/stakes, duplicate dates, and underfilled ticket budgets.

No preseason rehearsal counts toward the 5/10 forward-slate evidence gate.

### Phase B — Opening Day / early-season controlled canaries

For each countable regular-season slate:

1. Build the full standard 5/6+ candidate universe before the earliest standard-candidate game starts.
2. Apply anti-overcompression without lineup slot in ranking.
3. Route small slates Profile-first; medium/large PitchFit-first.
4. Freeze the 40% serious board.
5. Apply confirmed lineup membership only as execution eligibility.
6. Build the provisional 40% ticket budget, cross-game by default; large-slate Priority-25 repetition remains provisional.
7. Require the full requested ticket budget for comparability. Underfilled slates are research observations only.
8. Freeze exact pregame prices and positive stakes with timestamp/provenance.
9. Hash plan/preflight/frozen execution artifacts.
10. Capture sourced outcomes after games, hash them, settle from frozen prices/stakes, and append to the ledger.

### Phase C — evidence reviews

- **After 5 clean countable slates:** initial review only. Inspect pipeline failures, rank stability, opportunity exclusions, ticket fill, raw stake/net totals, and descriptive signal behavior. Do not auto-enable normal volume.
- **After 10 clean countable slates:** preferred full reactivation review. Evaluate hitter-selection behavior separately from ticket/exposure performance and profitability.
- Any architecture change must come from a separately declared development hypothesis and then face new forward validation. Holdout or postseason outcomes alone cannot choose it.

## Opening Day go/no-go checklist

A slate is countable only when all are true:

- frozen 2026 contract passes;
- full-slate pregame freeze precedes earliest standard-candidate start;
- Core6 inputs are complete for included standard candidates;
- lineup slot is absent from ranking evidence;
- lineup membership is used only after ranking as execution eligibility;
- starter snapshot provenance is valid;
- requested ticket budget is fully filled;
- every ticket has verified frozen pregame prices and positive stakes;
- preflight is READY_FOR_CONTROLLED_FORWARD_CANARY;
- outcomes are sourced and hash-verified;
- settlement recomputes from frozen ticket detail;
- append-only ledger integrity passes.

If any item fails, the slate can be retained for research diagnostics but does not advance the 5/10 gate.

## Postseason research lane

Postseason work should write to a separately labeled sample and report descriptive differences in candidate counts, slate bands, starter/bullpen context, opportunity exclusions, and signal behavior. It must not mutate the frozen 2027 restart contract or be pooled into regular-season profitability evidence.
