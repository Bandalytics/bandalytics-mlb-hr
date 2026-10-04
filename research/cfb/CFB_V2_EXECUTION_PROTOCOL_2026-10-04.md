# CFB V2 execution protocol — 2026-10-04

Status: V2 SHADOW ONLY. Frozen V1 CROSS6 and BOOKS3PLUS_CROSS6 remain unchanged. Production remains disabled.

This protocol is prospective for new slates after this commit.

For every candidate freeze before kickoff: event, kickoff time, market class (SIDE, TOTAL, MONEYLINE, TEAM_TOTAL, DERIVATIVE), selection, exact line, American price, book/source, quote timestamp, evidence timestamps, user-executable YES/NO/UNKNOWN, source class (USER_BOOK, FRIEND_ONLY, PUBLIC_MARKET, MODEL_TOOL), known injury/status information, market-comparison status (VERIFIED_TIMESTAMPED, UNVERIFIED, NOT_CHECKED), and decision (BET, PASS, NO_BET, UNAVAILABLE) with reason.

Never copy a friend's line or price into the user's executable ledger. Cross-book comparisons require source plus pre-kick timestamp. Better friend-only numbers may show price sensitivity but cannot establish a missed executable opportunity.

Evaluate sides, totals and moneylines in separate shadow lanes before ticket construction. Team totals and derivatives remain separate classes. NO_BET is a valid prospective decision and must be frozen before the result is joined.

Ticket construction starts only after individual legs pass their own decision-quality gate. Preserve constituent prices and actual displayed combined price. Promo/boost states are separate quote states and must not be conflated.

Outcome is joined only after opportunity identification, availability, decision quality and execution fields are frozen. A later win cannot convert a weak or unavailable pregame decision into a good one; a later loss cannot by itself invalidate a sound pregame decision.

No public-ticket percentages or ROI are inferred without verified historical data and exact frozen prices.