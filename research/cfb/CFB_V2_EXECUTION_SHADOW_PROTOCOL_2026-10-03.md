# CFB V2 execution shadow protocol — frozen 2026-10-03

Prospective shadow research only. Frozen V1 CROSS6 / BOOKS3PLUS_CROSS6 is unchanged; production remains disabled. This protocol is predeclared before grading new slates.

## Unit of observation
One candidate market expression at one executable quote. Keep SIDE, TOTAL, and MONEYLINE as separate market families. Derivatives (team total, half, quarter) require their own market_type and are never silently pooled with full-game markets.

## Intake fields
Record before kickoff: event_id, kickoff timestamp, market_type, selection, line, American price, book, observed_at timestamp, source/provenance, quote_status, and decision.

quote_status:
- REFERENCE_ONLY: observed on a friend's ticket/screenshot or source but not established executable for the user.
- EXECUTABLE: independently available to the user at the recorded book/time.
- UNVERIFIED: source/book/time mapping incomplete.

decision:
- BET_CANDIDATE
- PASS_PRICE
- PASS_LINE
- PASS_EVIDENCE
- NO_BET

A NO_BET is a first-class outcome and remains in the ledger.

## Number-shopping rule
Never substitute a reference quote for an executable quote. Compare lines/prices only when each comparison has a timestamped source. If the best market number is unavailable to the user, preserve it as REFERENCE_ONLY and evaluate the independently executable alternative on its own requirement and price.

For negative American odds -A, break-even = A/(A+100). For positive +A, break-even = 100/(A+100). Promotional prices/boosts are separate quote records and cannot overwrite the base quote.

## Timing and injury rule
Freeze the decision using only information available at decision_at. Later injury news, market moves, and game events may explain outcome paths but cannot alter the pregame grade. If material availability is unresolved, WAIT is allowed until a final pregame quote; if no acceptable quote remains, grade NO_BET.

## Postgame grading
Store settlement W/L/P separately from decision quality. A near-threshold result is variance evidence, not proof of calibration. Track:
1. opportunity identification,
2. executable-price availability,
3. execution decision,
4. settlement.

Do not calculate ROI unless the ledger contains verified executable frozen prices and stakes. Do not use unverified public percentages.

## Ticket construction
Ticket/parlay membership is downstream of leg qualification. Grade every leg independently first. Do not infer leg quality from a parlay hitting or missing. Distinct quote sets must remain distinct; never reconstruct a hypothetical ticket by mixing prices captured at different times/books unless explicitly labeled hypothetical.

## Forward review
Report raw counts by market family and decision state before any pooled summary. No V1 retuning from V2 results. No rule changes after seeing outcomes without a newly dated prospective protocol.
