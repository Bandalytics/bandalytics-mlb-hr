# v95 Site Deployment Gate

Do not deploy again before the Vercel API deployment quota resets.

When quota is available:

1. Run `npm test` and require every test to pass.
2. Deploy this exact source branch as a preview first.
3. Verify build state READY and inspect build logs for route/function packaging.
4. Browser-smoke the public preview:
   - root renders meaningful BANDALYTICS UI;
   - ZIP production uploader remains present;
   - `ZIP • PRODUCTION TRUTH` badge renders;
   - `DIRECT • RESEARCH ONLY` badge renders;
   - Direct Lab opens/closes;
   - `/api/research-status` returns scoring_enabled=false;
   - `/api/direct-preview?date=2026-08-28` returns research data;
   - `/api/feed-status?date=2026-08-28` returns official feed data;
   - Direct Lab field replay appears after matching ZIP is loaded;
   - Results route remains MLBAM ID-aware.
5. Check Vercel runtime errors. Require none attributable to v95.
6. Do not promote Direct mode into v37 regardless of structural readiness.
7. Only after automated browser smoke is green request one iPhone/Safari acceptance.
