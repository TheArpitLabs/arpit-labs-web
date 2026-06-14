# Performance Audit Report

Audit date: 2026-06-14  
Environment: local Next dev server on `http://localhost:3001`

## Route Smoke Tests

### Cold Dev Requests

| Route | Status | Time | Download |
|---|---:|---:|---:|
| `/` | 200 | 10.11s | 273,756 B |
| `/projects` | 200 | 7.84s | 38,432 B |
| `/research` | 200 | 9.69s | 198,599 B |
| `/marketplace` | 200 | 7.84s | 38,353 B |
| `/community/global` | 200 | 9.71s | 61,139 B |

Cold timings include dev-route compilation and should not be treated as production TTFB.

### Warm Dev Requests

| Route | Status | Time | Download |
|---|---:|---:|---:|
| `/` | 200 | 0.748s | 273,686 B |
| `/projects` | 200 | 0.162s | 38,432 B |
| `/research` | 200 | 0.767s | 198,591 B |
| `/marketplace` | 200 | 0.249s | 38,353 B |
| `/community/global` | 200 | 0.469s | 61,137 B |

## Query Count Estimate

Measured by static repository/action review and observed behavior, not DB query tracing:

| Route | Estimated Server Data Calls | Notes |
|---|---:|---|
| Homepage | 4+ | `getExperiments`, `getLabNotes`, `getJourneyTimeline`, `getProjects` run in parallel |
| Projects | 1+ | Project list fetch plus client-side UI filtering |
| Research | 1+ | Research content fetch/render path |
| Marketplace | 1+ | Marketplace items/categories depending current route code |
| Community | 1+ | Community/global content fetch |

No database query tracer is installed, so exact query counts were not available.

## Bundle Size Findings

From `npm run build`:

- Homepage first load JS: **347 kB**. High.
- Dashboard first load JS: **346 kB**. High.
- AI page first load JS: **416 kB**. Very high.
- Projects first load JS: **229 kB**. Medium-high.
- Research, marketplace, community are more reasonable at **153-168 kB**.

## Bottlenecks

- Homepage payload is large: 273 KB HTML in local dev response.
- Homepage first-load JS is high due to many dynamic/client-heavy sections.
- AI page bundle is very large.
- Supabase DNS failures during build indicate external dependency fragility.
- `AI Chat Service initialized` during build suggests import-time side effects.
- No Redis/cache layer is active for Phase X search/recommendation.

## Performance Completion

Completion: **55%**

The main public routes respond successfully, but homepage/dashboard/AI need bundle and data-fetch optimization before launch-grade performance.
