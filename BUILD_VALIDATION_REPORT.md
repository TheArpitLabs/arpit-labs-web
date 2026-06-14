# Build Validation Report

Audit date: 2026-06-14

## Commands Run

```bash
npm run lint
npm run build
```

## Results

| Command | Result | Notes |
|---|---:|---|
| `npm run lint` | Pass | `next lint` is deprecated in Next 15, but completed with no warnings/errors after stabilization |
| `npm run build` | Pass | Production build completed successfully |

## Stabilization Applied

- Escaped unescaped apostrophes in `src/app/dashboard/page.tsx`.
- Stabilized `/api/knowledge/search` and `/api/knowledge/recommendations` error handling.
- Stabilized base search when `semantic_search_queries` is missing from DB.

## Build Warnings / Runtime Notes

- `next lint` is deprecated and should be migrated to ESLint CLI before Next 16.
- Build logged Supabase DNS failures during static page generation:
  - `getaddrinfo ENOTFOUND lxbtuwltzljmnwxbygcl.supabase.co`
  - Affected `getProjects` and `getLabNotes`
- Build still completed because repository actions recover/fallback from those failures.
- Build logged: `Using edge runtime on a page currently disables static generation for that page`.
- `AI Chat Service initialized` appears multiple times during build, suggesting side effects at import/build time.

## Bundle / Route Evidence

Notable build output:

- `/`: `184 kB`, first load JS `347 kB`
- `/projects`: `8.51 kB`, first load JS `229 kB`
- `/research`: `3.81 kB`, first load JS `164 kB`
- `/marketplace`: `5.18 kB`, first load JS `168 kB`
- `/community/global`: `1.96 kB`, first load JS `153 kB`
- `/dashboard`: `11.8 kB`, first load JS `346 kB`
- `/ai`: `267 kB`, first load JS `416 kB`

## Build Readiness

Completion: **85%**

The app builds and lints, but production readiness still depends on stable Supabase connectivity, migration application, and reducing large first-load bundles on homepage/dashboard/AI.
