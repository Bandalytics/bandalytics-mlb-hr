# CFB V2 Shadow — Prospective Execution Protocol Freeze (2026-10-03)

Status: PREDECLARED SHADOW RESEARCH PROTOCOL. No V1 changes. Production remains disabled.

Purpose: test ticket-intake, quote provenance, and executable-price discipline without using outcomes to define rules.

## Unit of observation
One candidate quote at one source and timestamp. Matching selections at different sources, prices, lines, or timestamps are distinct observations.

## Required frozen fields
event_id, kickoff, market_type, selection, line, american_price, source, quote_timestamp, user_executable, friend_only, evidence_pointer, injury_snapshot_timestamp, market_comparison_status, signal_lane, decision, decision_timestamp, rejection_reason, ticket_id.

market_type must be one of SIDE, TOTAL, ML, DERIVATIVE. Analysis is stratified by market_type.

## Decision states
BET: exact executable quote passed the shadow research threshold before kickoff.
NO_BET: reviewed exact quote failed price/evidence/execution threshold.
WAIT: unresolved before the next required information checkpoint; must become BET or NO_BET before kickoff to enter decision evaluation.

NO_BET is retained after the event. Results cannot upgrade it.

## Quote-comparison contract
Only timestamped, user-executable quotes may compete for best executable number. Friend-only prices are contextual and never substituted. Cross-market comparisons require timestamped provenance. Missing provenance is UNVERIFIED, not inferred.

## Ticket construction
Freeze leg decisions first. Then construct tickets. Promotions, combined payout, and correlation belong to construction metadata; they cannot cause a failed leg to become qualified.

## Evaluation
Grade exact frozen selections after final. Report W/L/P and raw counts by market_type and decision state. Treat threshold wins/losses as variance descriptors, not causal proof. No ROI without exact verified frozen executed prices. No public-percentage analysis without verified historical public data.

## Anti-leakage
No outcome-derived signal creation, no closing-line reconstruction of missing snapshots, no post-event price substitution, and no retroactive V1 edits.
