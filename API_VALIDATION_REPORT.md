# API Validation Report

Audit date: 2026-06-14  
Local server: `http://localhost:3001` because port `3000` was already in use.

## Endpoints Tested

| Endpoint | Test | Result | Evidence |
|---|---|---:|---|
| `GET /api/admin/acquisition` | No auth cookie | Pass | Returned `403` with `{"success":false,"error":"Forbidden"}` |
| `POST /api/knowledge/search` | Missing query `{}` | Pass | Returned `400` with `{"success":false,"error":"Missing query"}` |
| `POST /api/knowledge/search` | Valid query | Pass after stabilization | Returned `200` with structured `results` |
| `POST /api/knowledge/recommendations` | Missing entity fields `{}` | Pass | Returned `400` with `{"success":false,"error":"Missing entityType or entityId"}` |
| `POST /api/knowledge/recommendations` | Unknown project UUID | Pass | Returned `200` with `{"success":true,"recommendations":[]}` |

## Stabilization Applied

- `src/lib/knowledge-ecosystem/search.ts`: query logging to `semantic_search_queries` now warns instead of crashing when the table is absent.
- `src/app/api/knowledge/search/route.ts`: added route-level `try/catch` and structured JSON failure response.
- `src/app/api/knowledge/recommendations/route.ts`: added route-level `try/catch` and structured JSON failure response.

## Request Validation

Status: **Partial**

- Search validates only presence/type of `query`.
- Recommendations validates only presence of `entityType` and `entityId`.
- Admin acquisition relies on action branching and does not use Zod/runtime schemas.
- `mode`, `limit`, provider names, URLs, and action payloads are not strongly validated.

## Authentication & Authorization

Status: **Partial**

- Admin acquisition correctly blocks unauthenticated requests.
- Search and recommendation APIs are public and have no rate limiting.
- Authenticated admin actions beyond unauthenticated 403 were not tested because no admin credentials were available.

## Error Handling

Status: **Improved but incomplete**

- Public knowledge APIs now return structured JSON for caught failures.
- Admin acquisition still has complex action paths and some branches can surface dependency errors.
- Missing migration tables are degraded in base search, but broader enhanced APIs may still fail if migrations are not applied.

## Response Format

Status: **Pass for tested paths**

- Tested endpoints return consistent `success` booleans.
- Search success includes `query`, `mode`, `results`.
- Recommendations success includes `recommendations`.

## Launch Risk

**Medium-High** until request schemas, rate limits, migration verification, and authenticated admin action tests are completed.
