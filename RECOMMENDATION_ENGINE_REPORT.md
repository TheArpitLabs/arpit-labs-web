# Recommendation Engine Report

## Implementation
- Added `/api/knowledge/recommendations`.
- Added `getRelatedKnowledge` for related projects, research, resources, and contributors.
- Persists generated relationships in `recommendation_links`.

## Similarity
- Uses content similarity now.
- Ready for embedding similarity once `ai_embeddings` has populated vectors.
