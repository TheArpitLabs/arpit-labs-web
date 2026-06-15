/**
 * Search Layer Types
 * 
 * Defines the interfaces and types for semantic search and embeddings
 */

export interface ContentEmbedding {
  id: string;
  contentId: string;
  contentType: string;
  embedding: number[];
  embeddingModel: string;
  embeddingVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchIndexMetadata {
  id: string;
  contentId: string;
  contentType: string;
  indexFields: Record<string, unknown>;
  indexedAt: Date;
  needsReindex: boolean;
}

export interface SearchQuery {
  query: string;
  contentType?: string;
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  minScore?: number;
  domainId?: string;
  subdomainId?: string;
  domainSlug?: string;
  subdomainSlug?: string;
}

export interface SearchResult {
  contentId: string;
  contentType: string;
  score: number;
  metadata: Record<string, unknown>;
  highlights?: Record<string, string[]>;
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  queryTime: number;
  metadata: {
    query: string;
    filters: Record<string, unknown>;
    domainId?: string;
    subdomainId?: string;
    domainSlug?: string;
    subdomainSlug?: string;
  };
}

export interface EmbeddingConfig {
  model: string;
  dimension: number;
  batchSize: number;
  enableHybridSearch: boolean;
  hybridSearchWeights: {
    semantic: number;
    keyword: number;
  };
}
