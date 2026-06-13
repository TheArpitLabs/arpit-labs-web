# Performance & Scaling Report

## Implementation
- Added `scalingPlan` with cache key conventions, queue names, and background job names.
- Added indexes for acquisition, graph edges, recommendations, observability, reviewer findings, and collaboration opportunities.

## Scaling Plan
- Redis caching: search results, recommendations, acquisition queue summaries.
- Queue processing: acquisition import, README analysis, duplicate scan, media generation, recommendation refresh.
- Background jobs: scheduled import, trend refresh, quality rescoring, broken-link review, embedding refresh.
- Search optimization: keyword indexes now, pgvector RPC path for embedding search.
