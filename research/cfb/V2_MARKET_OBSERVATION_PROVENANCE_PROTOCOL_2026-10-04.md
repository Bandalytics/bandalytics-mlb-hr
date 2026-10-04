# CFB V2 Shadow — Market Observation Provenance Protocol — 2026-10-04

Status: PREDECLARED / RESEARCH SHADOW ONLY / NO PRODUCTION  
Effective only for new observations after this commit.  
Frozen V1 impact: NONE. CROSS6 and BOOKS3PLUS_CROSS6 remain unchanged.

## Objective
Study whether timestamped market-observation provenance improves research quality without contaminating frozen signal research. This is a data-integrity protocol, not a predictive rule.

## Observation unit
Each candidate observation receives an immutable ID before outcome is known.

Required fields:
- event identity and scheduled kickoff
- candidate_created_at
- market_type: SIDE | TOTAL | MONEYLINE | DERIVATIVE
- selection and line when applicable
- American price
- source
- quote_timestamp
- quote_origin: USER_EXECUTABLE | FRIEND_ONLY | THIRD_PARTY | MODEL_REFERENCE
- evidence timestamps
- injury/status timestamps when used
- research_disposition: INCLUDE | EXCLUDE | WAIT
- disposition_timestamp and reason
- snapshot hash when a frozen artifact exists

Missing fields remain NULL and are never inferred from outcome or a later screen.

## Cross-source comparison
A comparison is VERIFIED only when every quote is the same event, market, selection and settlement rule; carries an explicit pre-kickoff non-live timestamp; is temporally comparable; and preserves both line and price. Otherwise mark UNVERIFIED.

Friend-only observations cannot be labeled user-executable without an independent user-accessible capture. Different lines are distinct observations even when price differs favorably.

## Chronology freeze
The last eligible pre-kickoff research disposition is immutable after kickoff. Outcomes are joined only afterward. WAIT must resolve before kickoff or becomes EXCLUDE_UNVERIFIED rather than being reconstructed.

## Market-type separation
Report SIDE, TOTAL, MONEYLINE and DERIVATIVE separately before any pooled descriptive summary. A side move is not evidence for a total without an independently predeclared relationship.

## Exclusion control
EXCLUDE is a first-class research disposition. Predeclared reasons:
- PRICE_OUTSIDE_RESEARCH_BAND
- LINE_MOVED_PAST_THRESHOLD
- INJURY_UNCERTAINTY
- MARKET_DISAGREEMENT
- NO_VERIFIED_PRICE
- INSUFFICIENT_EVIDENCE
- OTHER_PREDECLARED_REASON

After final score, excluded observations may be graded descriptively only at the exact frozen line. They are never counted as actual executions or ROI.

## Price math
Mechanical break-even implied probability:
- negative American odds -a: a / (a + 100)
- positive American odds +b: 100 / (b + 100)

This is price arithmetic, not an estimated true probability. Hypothetical payout arithmetic is allowed only from an exact documented price and must remain labeled hypothetical.

## Multi-leg display provenance
For any multi-leg display preserve:
- component candidate IDs
- displayed combined price
- promotion/boost terms and timestamp
- source availability status for each component
- observed stake only when documented

Never reconstruct one display from later component quotes. Boosted and unboosted displays remain separate quote sets unless the artifact proves continuity.

## Guardrails
- no retroactive threshold changes from results
- no V1 mutation
- no unverified public percentages or RLM
- no ROI without exact frozen prices and documented stakes
- outcomes do not prove or disprove pregame research quality
- near-threshold results receive NEAR_THRESHOLD_VARIANCE tag only
- any future promotion requires a separately versioned freeze and untouched validation

## First prospective test
Apply this schema to the next new slate only after this commit. Do not backfill October 2 or October 3 into the prospective test; those dates remain retrospective audit examples.
