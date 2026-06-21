# GitHub Discovery Engine Report

Date: 2026-06-18

## Summary

The project discovery engine is now a real GitHub-powered repository discovery system. It uses Octokit and GitHub Repository Search, validates repository quality before insert, deduplicates against the existing `projects` table, and stores real metadata only.

## Core Files

- `src/lib/project-discovery/project-discovery-engine.ts`
- `src/lib/project-discovery/github-discovery-core.ts`
- `src/app/api/admin/project-discovery/route.ts`
- `src/components/admin/ProjectDiscoveryEngine.tsx`

## Engine Name

Primary service:

- `GitHubDiscoveryEngine`

Backward-compatible alias:

- `ProjectDiscoveryEngine`

This preserves existing imports while making the real responsibility explicit.

## GitHub Integration

Technology:

- `@octokit/rest`
- GitHub Repository Search API
- GitHub repository detail API
- GitHub repository languages API

Search constraints:

- `is:public`
- `archived:false`
- `fork:false`
- `stars:>50`
- configurable `page`
- configurable `limit`
- maximum GitHub page size capped at 100

## Supported Categories

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

## Validation

Repositories are skipped before insert when:

- repository is private
- repository is archived
- repository is disabled
- description is missing or too short
- stars are not greater than 50
- URL is not a real `https://github.com/...` URL

## Deduplication

Duplicates are skipped using:

- `github_url`
- `slug`

Tracked statistics:

- fetched
- inserted
- skipped
- duplicates
- failed
- last execution

## Database Mapping

The implementation reuses the existing `projects` table.

Mapping:

- `title` = repository name
- `description` = repository description
- `github_url` = repository HTML URL
- `language` = repository primary language
- `github_stars` = repository stars
- `forks` = repository forks
- `tags` = repository topics plus category/languages
- `published` = `false`
- `featured` = `false`
- `owner_id` = `null`
- `status` = `draft`

No new project table was created.

## Production Behavior

The engine does not generate fake repositories, fake titles, fake descriptions, or placeholder `github.com/example` URLs.

Discovered repositories are draft/unpublished by default so admin review can happen before public exposure.

## Scale Notes

- Discovery is paginated.
- Public project API already defaults to `limit=24`.
- GitHub requests are bounded by page and limit.
- For 10,000+ repository ingestion, move long runs to a durable worker/queue while preserving this engine as the orchestration core.
