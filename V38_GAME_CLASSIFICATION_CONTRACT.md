# V38 Game Classification Contract

Status: PREREGISTRATION / DISABLED IN PRODUCTION

The public V38 dashboard must keep `Game Class` WITHHELD until the required game-context stack is complete and the classification rule is explicitly locked prospectively.

## Allowed labels
- Elite HR Game
- Good HR Game
- One-Off Game
- Skip Game

These labels are research allocation classes, not predictive scores and not betting recommendations.

## Required inputs before classification can activate
1. Profile quality/depth from the locked 5/6 early profile screen. Candidate count alone cannot determine class.
2. Exact probable starter identity by `gamePk`, including doubleheaders.
3. Starter damage context with HR/9 and sample quality. The locked `<1.2 HR/9` rule remains a major filter unless the hitter is exceptional; small samples remain visibly downgraded/flagged.
4. Pitch Fit for relevant hitters, using the trusted native research contract.
5. Recent BBE/contact as support only, never as a standalone gate or boost.
6. Confirmed lineup state or an explicit pre-lineup research state. Projected lineups are not prospective evidence.
7. Market context where available, used only as a tie-break/valuation layer and never to weaken profile gates.
8. Environment contract containing trustworthy park/weather plus bullpen freshness/workload/handedness availability. No placeholder or inferred environment values may count as ready.

## Integrity rules
- No numeric Game Score.
- No class may be produced from profile-qualified count alone.
- No generic 4/6 pre-lineup relaxation. The 4/6 rule applies only to known +700-or-longer HR markets under the locked longshot policy.
- No forced pool count and no fill-to-target behavior.
- No scoring or ticket promotion may be enabled by game classification.
- No outcome-derived threshold changes, historical outcome mining, or retroactive relabeling of prospective evidence.
- Classification must preserve exact `gamePk` identity.
- Same-team stacking remains allowed only when the starter/bullpen/environment jointly support multiple-HR outcomes.

## Activation gate
Production activation requires all of the following:
- a trusted environment endpoint/contract exists;
- deterministic label rules are written and versioned before use;
- tests prove missing required inputs force `WITHHELD`;
- tests prove profile depth alone cannot produce a class;
- tests prove scoring/evidence flags remain false;
- one preview deployment passes desktop and iPhone/Safari acceptance.

Until that gate passes, the only valid public value is `WITHHELD`.
