# Database Validation Report

Audit date: 2026-06-14  
Migration audited: `supabase/migrations/20260613_phase_x_knowledge_ecosystem.sql`

## Static Migration Review

| Area | Status | Evidence |
|---|---:|---|
| Tables defined | Pass | Migration defines acquisition queue, graph, recommendations, search queries, trends, reviewer findings, media assets, learning paths, hackathons, contributor links, collaboration, observability |
| Indexes defined | Partial | Useful indexes exist for acquisition, graph edges, recommendations, observability, review findings, collaboration |
| Foreign keys | Partial | `reviewed_by` references `auth.users`; `learning_paths.source_project_id` and collaboration `project_id` reference `projects`; many graph/entity IDs are generic UUIDs without FK integrity |
| RLS enabled | Pass | RLS enabled on all new tables |
| RLS policies | Partial | Public read policies exist for selected tables; no direct client mutation policies; service role expected |
| Migration conflicts | Not proven | Static SQL uses `IF NOT EXISTS`, but live DB validation showed at least one expected table missing |

## Runtime Evidence

During API validation, `/api/knowledge/search` failed before stabilization because Supabase returned:

`Could not find the table 'public.semantic_search_queries' in the schema cache`

This proves the Phase X migration is **not applied** or the connected Supabase schema cache has not picked it up.

## Schema Gaps

- `content_acquisition_queue.scheduled_for` exists but the current schedule API path stores `scheduledFor` inside metadata instead of the column.
- Some newer route code references fields such as `canonical_url` and `repository_id`; these are not present in the audited Phase X migration.
- Generic graph IDs are flexible but weak on referential integrity.
- No pgvector RPC/function is defined for semantic search.
- No queue/job tables are present for scheduled/background execution in this migration.

## Database Completion

Completion: **45%**

## Production Readiness

**Low until migrations are applied and reconciled with current code.**

The migration is a useful schema foundation, but runtime evidence shows the active database is behind the code.
