# BANDALYTICS Cloudflare Migration V1

Status: PREVIEW-ONLY migration path. Do not switch production DNS until the Cloudflare preview passes the same research-integrity checks used for the Vercel candidate.

## Goal
Move BANDALYTICS frontend preview/deployment work off the Vercel build-rate bottleneck without changing locked MLB HR research logic.

## What this branch changes
- Adds a dedicated Cloudflare build command: `npm run build:cloudflare`.
- Keeps the normal Vercel `npm run build` command unchanged.
- Writes Cloudflare Pages `_headers` after the normal build.
- Adds a Cloudflare Pages Function bridge for `/api/*` that forwards requests to the current canonical BANDALYTICS Vercel production API during transition.
- Adds a `/slate-cache` bridge matching the existing Vercel rewrite.
- Adds `wrangler.toml` with `dist` as the Pages output directory.

## What this branch does NOT change
- Core 6-check HR profile thresholds.
- Standard 5/6 qualification rule.
- +700 longshot 4/6 protected rule.
- Recent-contact modifier policy.
- Pitcher filters, environment policy, market policy, escape policy, pool lock policy, or scoring/ticket locks.
- Immutable prospective snapshots or outcome settlement behavior.
- Production DNS.

## Transitional architecture
Cloudflare Pages serves the built frontend and edge functions.

`Browser -> Cloudflare Pages -> /api/* Pages Function -> current BANDALYTICS Vercel production API`

This is intentionally transitional. It lets Cloudflare handle frontend builds and previews first while avoiding an unsafe all-at-once rewrite of the Node/Vercel API layer.

## Cloudflare Pages setup
In Cloudflare Dashboard:
1. Workers & Pages -> Create -> Pages -> Connect to Git.
2. Select GitHub repository `Bandalytics/bandalytics-mlb-hr`.
3. Production branch: leave `main` for later. For first validation, deploy `cloudflare-migration-v1` as a preview branch.
4. Build command: `npm run build:cloudflare`.
5. Build output directory: `dist`.
6. Root directory: repository root.
7. No production custom domain switch yet.

Cloudflare Pages should discover the root `functions/` directory automatically for Pages Functions.

## Preview acceptance gates
Before any production cutover:
- Cloudflare build completes successfully.
- Home page loads on iPhone Safari.
- `bandalytics-prospective-profile-tracker.js` is the corrected current-main tracker version, not a regressed legacy copy.
- No old unsafe prospective report is introduced.
- `/api/projected-lineups`, `/api/results-identity`, `/api/starter-damage-native`, `/api/environment-native`, and other research endpoints respond successfully through the Cloudflare origin.
- Projected lineups remain research-only/non-evidence.
- Scoring/ticket UI remains disabled.
- No fake odds, fake Game Score, or diagnostic leakage appears publicly.
- Environment readiness remains guarded.
- Existing immutable prospective snapshots are not rewritten.
- Browser console/runtime check shows no migration-specific errors.

## Important dependency still present
`build.mjs` currently fetches the upstream shell from `https://bandalytics-v93-flat-routes.vercel.app`. Cloudflare removes the BANDALYTICS project build-rate bottleneck, but the build still depends on that existing upstream Vercel-hosted shell being reachable. A later migration phase can vendor or replace that upstream shell so Cloudflare becomes fully independent.

## Phase 2
After the Cloudflare frontend preview is accepted, port the API router/handlers to Cloudflare-native Workers/Pages Functions one route group at a time. Do not rewrite all handlers in one pass. Preserve exact route behavior and run parity checks against the current production API before cutover.
