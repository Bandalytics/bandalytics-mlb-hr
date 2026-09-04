# V38 Combined Research Hub Deployment Gate

Do not intentionally trigger another Vercel deployment until the deployment rate limit resets.

Current GitHub `main` contains the combined research workspace, visual takeover, starter-damage layer, lineup transition audit, and dashboard-integrity regression. Production is known to be behind that source while quota is active.

When quota is available:

1. Run `npm test` and require every test to pass, including `test-v38-dashboard-integrity.mjs`.
2. Deploy the exact current `main` source as a preview first.
3. Verify the preview is `READY` and inspect build logs for route/function packaging.
4. Verify the preview HTML serves the current cache-busted assets and the dashboard shell reports the expected V38 combined-workspace version.
5. Browser-smoke the public preview:
   - combined `MLB Research Hub` visibly takes over the old public workspace after research data loads;
   - old ZIP/admin/Direct Lab UI remains hidden from the public surface while compatibility hooks remain intact;
   - matchup rail uses exact `gamePk` identity, including doubleheaders;
   - projected lineups clearly transition to confirmed lineups;
   - early profile looks remain `>=5/6` only;
   - no generic 4/6 pre-lineup rule appears;
   - starter damage loads from `/api/starter-damage-native` and visibly preserves the `<1.2 HR/9` major-filter rule plus small-sample labeling;
   - Pitch Fit and recent BBE remain supporting research layers only;
   - market readiness does not fabricate missing odds;
   - Environment remains unavailable/withheld unless a trusted environment contract is actually live;
   - `Game Class` remains `WITHHELD` under `V38_GAME_CLASSIFICATION_CONTRACT.md`;
   - no numeric Game Score, scoring promotion, ticket generation, or forced-pool behavior appears.
6. Verify `/api/projected-lineups?date=2026-09-04` remains research-only, exact-game-identity true, and scoring false.
7. Verify `/api/research-status` continues to report scoring disabled.
8. Check Vercel runtime errors and require no new errors attributable to the V38 combined hub or starter-damage route.
9. Only after automated/browser smoke is green request one real iPhone/Home-Screen Safari acceptance recording.
10. Do not promote game classification, scoring, tickets, or projected rows into evidence as part of deployment cleanup.
