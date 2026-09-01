# v94 backend routes that were upstream rewrites

These endpoints did not have local source files in the v94 deployment package. See `../vercel.json` for the canonical routing configuration.

| v94 route | Upstream implementation |
|---|---|
| `/api/core` | `bandalytics-v42-history.vercel.app/api/core` |
| `/api/context` | `bandalytics-v42-history.vercel.app/api/context` |
| `/api/environment` | `bandalytics-v42-history.vercel.app/api/environment` |
| `/api/pitchfit` | `bandalytics-v42-history.vercel.app/api/pitchfit` |
| `/api/results` | `bandalytics-v42-history.vercel.app/api/results` |
| `/api/feed-status` | `bandalytics-v88-direct-coverage.vercel.app/api/feed-status` |
| `/api/direct-preview` | `bandalytics-v88-direct-coverage.vercel.app/api/direct-preview` |
| `/api/player-bbe` | `bandalytics-v90-identity-loader.vercel.app/api/player-bbe` |
| `/slate-cache` | `bandalytics-v88-direct-coverage.vercel.app/slate-cache` |

`api/results-identity.js` **is** local and is included beside this file.
