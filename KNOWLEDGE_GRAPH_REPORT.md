# Knowledge Graph Report

## Implementation
- Added `knowledge_nodes` for Project, Research, Dataset, API, Contributor, and Organization.
- Added `knowledge_edges` for Project -> Paper, Dataset, Contributor, API, and Organization relationships.
- Added `upsertKnowledgeNode` and `upsertKnowledgeEdge` service functions.

## Graph Relationships
- `uses_paper`
- `uses_dataset`
- `built_by`
- `uses_api`
- `belongs_to`
- `related_to`
