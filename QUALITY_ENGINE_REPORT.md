# Quality Engine Report

## Implementation
- Added `calculateQualityScore` with a 0-100 score.
- Evaluates documentation, architecture, code quality, activity, and maintainability.
- Stores score on `content_acquisition_queue.quality_score`.

## Notes
- The heuristic version is deterministic and production-safe.
- More signals can be added from GitHub/GitLab API metadata without schema changes.
