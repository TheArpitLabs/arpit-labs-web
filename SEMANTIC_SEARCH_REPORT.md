# Semantic Search Report

## Implementation
- Added `/api/knowledge/search`.
- Added keyword, vector-compatible, and hybrid search modes.
- Query logs are stored in `semantic_search_queries`.

## Example
Query: `Show Arduino projects using AI and Computer Vision.`

Recommended request:
```json
{
  "query": "Show Arduino projects using AI and Computer Vision.",
  "mode": "hybrid",
  "limit": 10
}
```
