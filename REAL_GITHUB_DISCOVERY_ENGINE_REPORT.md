# Real GitHub Discovery Engine Report

Date: 2026-06-18

## Summary

The fake domain population path has been disabled and the project discovery system has been upgraded into a real GitHub repository discovery engine. The implementation reuses the existing admin dashboard, admin API route, GitHub utility helpers, and `projects` table.

## Files Modified

- `package.json`
- `package-lock.json`
- `scripts/populate-domain-content.js`
- `src/lib/project-discovery/project-discovery-engine.ts`
- `src/app/api/admin/project-discovery/route.ts`
- `src/components/admin/ProjectDiscoveryEngine.tsx`

## Services Created / Upgraded

### `GitHubDiscoveryEngine`

Location: `src/lib/project-discovery/project-discovery-engine.ts`

Capabilities:

- Uses `@octokit/rest`.
- Calls GitHub Repository Search API.
- Fetches repository detail and languages through Octokit.
- Supports:
  - Artificial Intelligence
  - Machine Learning
  - Deep Learning
  - NLP
  - Computer Vision
  - Web Development
  - DevOps
  - Cloud Computing
  - Cybersecurity
  - Robotics
  - IoT
- Validates repositories before insert.
- Classifies repositories using topics, names, descriptions, and languages.
- Deduplicates by `github_url` and `slug`.
- Tracks fetched, inserted, skipped, duplicate, failed, category, log, and last-run statistics.

## APIs Created / Updated

### `GET /api/admin/project-discovery`

Admin protected.

Supported actions:

- `action=status`
- `action=statistics`
- `action=logs`

Returns:

- `isActive`
- `statistics`
- `logs`
- `categories`

### `POST /api/admin/project-discovery`

Admin protected.

Supported actions:

- `start`
- `stop`
- `runCategory`

Configuration:

- `categories`
- `category`
- `page`
- `limit`
- `maxResultsPerCategory`
- `minStars`
- `minForks`

## Database Changes

No database schema changes were made.

The engine uses the existing `projects` table and existing metadata columns:

- `title`
- `slug`
- `description`
- `content`
- `overview`
- `project_type`
- `branch`
- `domain`
- `category`
- `technologies`
- `languages`
- `tools`
- `github_url`
- `demo_url`
- `cover_image`
- `status`
- `published`
- `featured`
- `tags`
- `tech_stack`
- `views_count`
- `likes_count`
- `stars`
- `forks`
- `language`
- `github_stars`
- `created_at`
- `updated_at`

## Discovery Flow

1. Admin opens `/admin/discovery`.
2. Admin starts all-category discovery or runs one category.
3. API validates admin authorization.
4. Engine searches GitHub with category queries and quality filters.
5. Engine fetches repository details and language metadata.
6. Engine rejects invalid repositories:
   - private
   - archived
   - disabled
   - missing useful description
   - stars below minimum
   - invalid GitHub URL
7. Engine classifies category.
8. Engine checks duplicates by `github_url` and `slug`.
9. Engine inserts valid real repositories into `projects`.
10. Admin dashboard displays logs and statistics.

## Metadata Mapping

- `title` -> repository name
- `description` -> repository description
- `github_url` -> `repo.html_url`
- `language` -> `repo.language`
- `github_stars` -> `repo.stargazers_count`
- `stars` -> `repo.stargazers_count`
- `forks` -> `repo.forks_count`
- `demo_url` -> `repo.homepage`
- `tags` -> category + topics + languages
- `tech_stack` -> languages
- `cover_image` -> GitHub social preview URL

## Fake Engine Cleanup

`scripts/populate-domain-content.js` is disabled.

It now exits immediately and warns that it generated fake projects. The legacy fake generator implementation has been removed from the script.

## Performance Notes

- Public project APIs already use `page` and `limit`, defaulting to 24.
- Discovery limits GitHub search pages with `limit <= 100`.
- Deduplication checks targeted indexed-style fields: `github_url` and `slug`.
- Admin UI polls status only while discovery is active.

## Production Notes

- Set `GITHUB_TOKEN` in production to avoid low unauthenticated rate limits.
- For runs beyond 10,000 projects, move execution from in-process API memory to BullMQ or another durable queue worker.
- Keep `minStars` at 50 or higher to avoid low-quality imports.
- Consider adding a moderation state if discovered projects should be reviewed before publication.

## Verification

Commands run:

- `npm install @octokit/rest`
- `npm run lint`
- `npm run build`

Result:

- Lint passed with existing warnings unrelated to discovery.
- Production build completed successfully.
- Build emitted an existing Supabase DNS warning during static page generation, but completed with exit code 0.

## Future Improvements

- Persist discovery logs in a database table.
- Add background queue execution for long runs.
- Add category-specific search tuning dashboard.
- Add repository README analysis before publication.
- Add repository owner/contributor resolution.
- Add dry-run mode for admin review.
