# Discovery Engine Audit

Date: 2026-06-18

## Scope

Audited project discovery and ingestion paths related to GitHub/project population:

- `scripts/populate-domain-content.js`
- `scripts/seed-projects.ts`
- `src/app/api/seed-projects/route.ts`
- `src/lib/project-discovery/project-discovery-engine.ts`
- `src/lib/project-discovery/github-discovery-core.ts`
- `src/app/api/admin/project-discovery/route.ts`
- `src/components/admin/ProjectDiscoveryEngine.tsx`
- `src/lib/repositories/projects.repository.ts`
- `src/lib/acquisition/source-discovery/github-connector.ts`

## Fake Sources Found

### `scripts/populate-domain-content.js`

Status before stabilization: unsafe fake data generator.

Findings:

- Generated synthetic project titles and descriptions from templates.
- Created fake GitHub URLs using `https://github.com/example/...`.
- Created fake demo URLs using `https://demo.example.com/...`.
- Generated random views, likes, and dates.
- Inserted directly into the existing `projects` table.
- Could produce thousands of non-real projects.

Action taken:

- Script is now deprecated and hard-disabled.
- Running it exits immediately with a warning and non-zero status.
- Legacy fake generation code was removed from the executable script.

### `scripts/seed-projects.ts`

Status: curated seed data, not a discovery engine.

Findings:

- Seeds fixed Arpit Labs showcase projects.
- Uses static repository URLs under `github.com/arpit-labs/...`.
- Does not discover external content.
- Should remain separate from automated discovery.

### `src/app/api/seed-projects/route.ts`

Status: manual seed endpoint, not a discovery engine.

Findings:

- Inserts a fixed list of projects.
- Uses service role or anon Supabase key.
- Does not call GitHub or validate repository existence.
- Should not be treated as production discovery.

## Real Sources Found

### `src/lib/acquisition/source-discovery/github-connector.ts`

Status: real GitHub source connector for acquisition pipeline.

Findings:

- Calls GitHub search API.
- Requires a token in connector config.
- Produces normalized discovery items.
- Does not insert directly into `projects`.
- Reusable for the broader acquisition pipeline, but not sufficient for direct project ingestion.

### `src/lib/project-discovery/project-discovery-engine.ts`

Status before implementation: partially real, incomplete.

Findings:

- Queried GitHub with raw `fetch`.
- Did not use Octokit.
- Did not validate all required repository conditions.
- Used old category names (`AI`, `ML`) instead of the requested production categories.
- Did not map complete GitHub metadata into project fields.
- Inserted limited project records and left important metadata out.

Action taken:

- Replaced with a real Octokit-powered discovery engine.
- Uses GitHub Repository Search plus repository detail/language validation.
- Validates public, non-archived, non-disabled repositories with descriptions and stars above threshold.
- Enforces the production discovery threshold of more than 50 stars.
- Deduplicates by `github_url` and `slug`.
- Writes real metadata into the existing `projects` table as draft/unpublished records for review.

## Existing Architecture

Reusable pieces:

- `src/lib/repositories/projects.repository.ts`
  - Existing paginated project repository pattern.
  - Already returns `data`, `totalCount`, `totalPages`, `current page` style metadata through `meta`.

- `src/app/api/projects/route.ts`
  - Existing public project pagination route.
  - Uses `page` and `limit`, default limit 24.

- `src/app/api/admin/project-discovery/route.ts`
  - Existing admin-protected control route.
  - Reused for status, logs, stats, start, stop, and single-category runs.

- `src/components/admin/ProjectDiscoveryEngine.tsx`
  - Existing admin dashboard component.
  - Reused and upgraded for real category controls/statistics.

- `src/lib/github.service.ts`
  - Existing GitHub utility helpers for slugs and social preview images.
  - Reused for slug generation and cover image mapping.

## Gaps Closed

- Fake `github.com/example` generation disabled.
- Octokit added.
- Repository Search API implemented.
- Validation implemented before insert.
- Duplicate prevention implemented.
- Category classification implemented.
- Unit-testable core helpers extracted from Supabase/GitHub side effects.
- Existing admin control surface reused.
- Existing projects table reused.
- Pagination remains enforced in public project APIs.

## Remaining Risks

- A GitHub token is strongly recommended for reliable rate limits.
- The discovery engine runs in-process. Long production runs should eventually move to a durable queue worker.
- Existing seed endpoints still contain static sample data and should be access-reviewed separately.
- Search quality depends on category keyword tuning over time.
