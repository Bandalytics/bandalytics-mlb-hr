# CFB BANDALYTICS — 2026-10-02 Four-Leg Missed-Ticket Execution Audit

Status: POSTGAME EXECUTION AUDIT / V2 RESEARCH ONLY  
V1 impact: NONE. Frozen `CROSS6` and `BOOKS3PLUS_CROSS6` are unchanged. Production remains disabled.

## Purpose

Audit a documented friend-supplied four-leg ticket as an execution/process case study, not as evidence for a new betting rule. This file separates opportunity identification, executable price, quote timing, football information, and realized outcome. Outcomes grade decisions; they do not retroactively create signals.

## Source / quote-set boundary

Two distinct friend quote displays were documented and MUST NOT be merged:

**Quote set A — original documented ticket**
- Liberty ML -350
- Pitt–Virginia Tech Over 53.5 -114
- Penn State–Northwestern Over 46.5 -115
- Montana State–Idaho Over 55.5 -115
- displayed parlay price: +743

**Quote set B — later friend display**
- showed different +105 / +104 / +104 component prices and a +1115 displayed price after a 50% boost.
- The available record here does not establish a timestamped one-to-one mapping of those plus-money prices to the same exact legs/markets in Quote set A.
- Therefore Quote set B is retained as a separate display artifact only. It is not used to recompute Quote set A, compare books, or infer a missed executable price.

**User-executable observation**
- Montana State–Idaho Over 56.5 -107 was independently observed on the user's DraftKings screen.
- It was identified but NOT bet.
- It is a different line/price from the friend's Over 55.5 -115 and must never be substituted for it.

No other friend price is labeled independently executable for the user unless a timestamped sportsbook capture proves it.

## Exact price math for Quote set A

American-odds break-even probabilities:
- Liberty ML -350: 350 / 450 = **77.78%**
- Pitt–VT O53.5 -114: 114 / 214 = **53.27%**
- PSU–NW O46.5 -115: 115 / 215 = **53.49%**
- Montana State–Idaho O55.5 -115: **53.49%**

The displayed +743 parlay implies a break-even probability of 100 / 843 = **11.86%**. At the exact displayed +743 price, each $1 risked would return $8.43 total ($7.43 profit) if won; $10 would return $84.30 total ($74.30 profit). This is payout arithmetic only, NOT modeled EV or ROI.

The later +1115 boosted display implies 100 / 1215 = **8.23%** and $12.15 total return per $1 risked ($11.15 profit). It belongs only to Quote set B and cannot be treated as the price of Quote set A.

## Leg-by-leg audit

### 1. Liberty ML -350 — WIN
Final: Liberty 30, Delaware 14.

**Pregame decision quality:** structurally defensible as a high-probability anchor, but expensive. The documented price required 77.78% merely to break even. A moneyline favorite can improve ticket survival while still be poor value if the true win probability does not clear that threshold.

**Execution lesson:** classify separately as MONEYLINE. Do not let a winning -350 anchor hide whether the price was efficient. No verified timestamped cross-book comparison is preserved here, so no claim that -350 was best/worst market price.

### 2. Pitt–Virginia Tech Over 53.5 -114 — WIN
Final: Pitt 35, Virginia Tech 33; total 68.

**Pregame decision quality:** the total cleared comfortably, but the result cannot validate the pregame thesis by itself. Earlier market information was conflicted enough that timing mattered. The user's workflow had also seen substantial side-market reversal in this game; that side movement is not evidence for a total unless independently linked.

**Postgame note:** Pitt QB Mason Heintschel suffered a major knee injury during the game. In-game injury effects are outcome context, not permissible pregame justification.

**Execution lesson:** classify as TOTAL and preserve the exact total number, juice, sportsbook, and timestamp. A later/other total cannot be substituted.

### 3. Penn State–Northwestern Over 46.5 -115 — WIN BY 0.5
Final: Northwestern 34, Penn State 13; total 47.

**Pregame decision quality:** this is the most important anti-hindsight leg. The ticket won by one half-point. Treat the result as **near-threshold variance**, not proof that the Over process was correct. The pregame side market showed a large Penn State favorite contraction, but Penn State remained favored; this was NOT a favorite flip.

**Execution lesson:** number shopping was decisive ex post, but that does not mean 46.5 was predictably guaranteed to beat a later number. Preserve the available number at decision time and never grade process from the final 47 alone.

### 4. Montana State–Idaho Over 55.5 -115 — WIN
Final: Idaho 35, Montana State 34; total 69.

**Pregame decision quality:** the game had a plausible scoring thesis, but injury information created real uncertainty. Montana State entered with major offensive absences, including starting QB Justin Lamson, leading receiver Taco Dowler and leading rusher Adam Jones in the documented pregame research. That made blindly copying an Over inappropriate even though it later won.

**Execution distinction:** friend had O55.5 -115. User independently had DK O56.5 -107. The user number required one extra point but reduced juice: 51.69% break-even at -107 versus 53.49% at -115. The user did not bet it. This is an **identified opportunity / no execution** case, not a betting loss and not evidence that the friend-only 55.5 was available to the user.

## Ticket-level result

All four Quote set A legs won, so the documented +743 ticket would have cashed at that exact display price. This does NOT establish that BANDALYTICS “missed a guaranteed winner,” nor that copying the friend was the correct pregame action.

The process failure to study is narrower:
1. the workflow identified at least one independently executable related opportunity (Montana State–Idaho O56.5 -107);
2. it did not convert that identification into a bet;
3. some friend prices were not independently established as executable for the user;
4. injury/market disagreement justified caution;
5. therefore the audit must separate **opportunity identification** from **execution failure** and from **friend-only price availability**.

No ROI is computed because there is no verified BANDALYTICS frozen stake/execution ledger for this ticket.

## Frozen lessons for V2 research

- Every candidate must carry market type: SIDE / TOTAL / MONEYLINE / DERIVATIVE.
- Friend/third-party quotes are leads, not executable prices.
- Preserve exact line, juice, sportsbook and timestamp before recommendation.
- A better-looking postgame number cannot be backfilled.
- NO_BET is a valid prospective decision.
- Near-threshold wins/losses are variance observations, not automatic process validation/failure.
- Injury information must be timestamped relative to the decision.
- Cross-book “value” claims require timestamped comparable quotes; otherwise mark comparison UNVERIFIED.
- Ticket construction cannot rescue an individually weak or unpriced leg.

## Provenance note

Final-score grading was reconciled after the games. Pregame quote facts above come only from the documented conversation artifacts. Any market comparison without a preserved timestamped source remains UNVERIFIED.
