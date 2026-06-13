# Duplicate Detection Report

## Layers
1. Repository URL matching through `repository_url`.
2. Repository/provider ID matching through `provider + external_id`.
3. Content hash matching through normalized SHA-256.
4. Embedding similarity placeholder through local token similarity, ready to swap for pgvector RPC.
5. Screenshot similarity through screenshot URL matching, ready for perceptual hash storage.

## Behavior
- Duplicate candidates are marked `duplicate` before approval.
- Duplicate signals are persisted in `content_acquisition_queue.duplicate_signals`.
