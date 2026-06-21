# Admin Discovery Report

Date: 2026-06-18

## Admin Integration

The discovery engine is integrated into the existing admin dashboard at:

- `/admin/discovery`

No new admin system was created.

## Admin Controls

Available controls:

- Run Discovery
- Stop Discovery
- Discover By Category
- View Logs
- View Statistics

## API

Route:

- `/api/admin/project-discovery`

Authentication:

- Uses existing `getAdminUserFromRequest`.
- Non-admin requests receive `403 Forbidden`.

GET actions:

- `status`
- `statistics`
- `logs`

POST actions:

- `start`
- `stop`
- `runCategory`

## Statistics

The dashboard displays:

- repositories fetched
- repositories inserted
- duplicates skipped
- skipped repositories
- failed imports
- categories processed
- logs
- last execution through engine statistics

## Pagination

Discovery requests support:

- `page`
- `limit`

Defaults:

- `limit = 24`

Limits:

- GitHub per-page requests are capped at 100.

## Safety

Discovered repositories are stored as draft/unpublished records:

- `status = draft`
- `published = false`
- `featured = false`
- `owner_id = null`

This prevents newly discovered repositories from immediately appearing publicly without review.
