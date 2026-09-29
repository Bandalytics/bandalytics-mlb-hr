# BANDALYTICS v38 — 2027 Controlled Canary Runbook

## Scope

This runbook is operational guidance for **2027 MLB regular-season controlled canaries only**.

- Official countable window: **2027-03-24 through 2027-09-26**.
- Spring Training and postseason observations are research-only and cannot advance the regular-season gate.
- Frozen 2026 baseline commit remains `090e25a12af97ed2e3154a50c7fab880b5ef9ef8`.
- Normal-volume production remains OFF.
- Profitability remains unproven until forward price/stake settlement evidence exists.

## Non-negotiable sequence

1. **Daily research board**
   - Build only from cryptographically verified point-in-time profile/context/modifier/park evidence.
   - Lineup slot is not ranking evidence.
2. **Starter snapshot**
   - Must be verified, same-date, and captured no later than the canary freeze.
3. **Live prep**
   - Build the full-slate standard 5/6+ anti-overcompression candidate pool before the earliest standard candidate starts.
   - Bundle the exact source board and starter snapshot with the immutable plan.
   - Confirmed lineup is execution eligibility only.
4. **Price capture**
   - Capture exact sportsbook HR prices before the plan freeze and before each hitter's first pitch.
   - Never infer, interpolate, reconstruct, or postgame-backfill a missing price.
   - Manual fallback must include player ID, American odds, book, capture timestamp, and a specific source reference; generic labels such as "screenshot" are not sufficient.
5. **Operational freeze + preflight**
   - Run `v38 Canary Operational Freeze` against one successful main-branch Live Prep artifact.
   - The manual price capture timestamp must be at or before the plan `frozen_at`.
   - Full requested ticket budget is required for a countable slate.
6. **Outcome capture + settlement**
   - After the slate, run `v38 Canary Operational Settlement` against one successful main-branch operational-freeze artifact.
   - Outcome source must be an HTTPS reference or `MLB_FINAL_RESULTS:<specific-reference>`.
   - Settlement timestamp must be after all ticketed games have started; source finality must still be verified by the operator.
   - Outcomes may determine win/loss only. They may not change ticket membership, price, or stake.
7. **Append-only ledger**
   - Append only settlement artifacts from successful main-branch `v38 Canary Operational Settlement` runs.
   - Duplicate dates, conflicting replacements, architecture mismatches, vague outcome sources, bad aggregates, and non-regular-season dates fail closed.
8. **Readiness review**
   - Run the operational readiness summary using explicit settlement run IDs.
   - 5 clean comparable slates = initial review.
   - 10 clean comparable slates = preferred full reactivation review.
   - Neither state automatically enables normal volume.

## Frozen architecture under forward test

- Candidate universe: standard 5/6+ Core6 rows, anti-overcompression applied.
- Protected 4/6 +700 remains shadow-only during the initial reactivation canaries.
- Small slate (<=50 candidates): PROFILE_FIRST.
- Medium slate (51–75): PITCHFIT_FIRST.
- Large slate (>=76): PITCHFIT_FIRST.
- Serious board: top 40% of ordered candidate pool.
- Ticket budget: 40% of serious-board size.
- Default tickets: cross-game two-leg.
- Large-slate top-25% second-path repetition remains provisional.
- Full ticket budget is required to count toward the 5/10-slate gate.

## External research tools

LineStar, Optimal Bet, Vig, or other third-party tools may be recorded as **shadow evidence** only with a specific capture/source reference. They do not rewrite Core6, candidate ranking, ticket membership, frozen prices, or stakes during the initial 2027 canary gate. Any proposed promotion of an external signal requires a separate predeclared development hypothesis and new forward validation.

## Fail-closed rule

If a required point-in-time artifact, starter identity, lineup eligibility, exact price, timestamp, source reference, hash, full ticket budget, or provenance link is missing, the slate may remain a research observation but **does not count** toward reactivation.
