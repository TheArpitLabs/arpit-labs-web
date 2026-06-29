/**
 * Semantic Search Engine
 * 
 * Provides AI-powered semantic search using vector embeddings and hybrid search
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { 
  ContentEmbedding, 
  SearchQuery, 
  SearchResult, 
  SearchResults, 
  EmbeddingConfig 
} from './types';

export interface SemanticSearchConfig extends EmbeddingConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  enableCache: boolean;
  cacheTTL: number; // milliseconds
}

export interface SemanticSearchEngine {
  indexContent(contentId: string, contentType: string, text: string, metadata?: Record<string, unknown>): Promise<void>;
  search(query: SearchQuery): Promise<SearchResults>;
  deleteFromIndex(contentId: string): Promise<void>;
  batchIndex(contents: Array<{ contentId: string; contentType: string; text: string; metadata?: Record<string, unknown> }>): Promise<void>;
  getEmbedding(text: string): Promise<number[]>;
  hybridSearch(query: SearchQuery): Promise<SearchResults>;
  clearCache(): Promise<void>;
  getIndexStats(): Promise<{ totalIndexed: number; byType: Record<string, number> }>;
}

class BaseSemanticSearchEngine implements SemanticSearchEngine {
  private supabase: SupabaseClient;
  private config: SemanticSearchConfig;
  private cache: Map<string, { data: SearchResults; timestamp: number }>;
  private embeddingCache: Map<string, { embedding: number[]; timestamp: number }>;

  constructor(config: SemanticSearchConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    this.cache = new Map();
    this.embeddingCache = new Map();
  }

  private generateCacheKey(query: SearchQuery): string {
    return JSON.stringify({
      query: query.query,
      contentType: query.contentType,
      filters: query.filters,
      limit: query.limit,
      offset: query.offset,
      minScore: query.minScore,
      domainId: query.domainId,
      subdomainId: query.subdomainId,
      domainSlug: query.domainSlug,
      subdomainSlug: query.subdomainSlug
    });
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.config.cacheTTL;
  }

  async getEmbedding(text: string): Promise<number[]> {
    // Check embedding cache
    const cached = this.embeddingCache.get(text);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.embedding;
    }

    // Generate embedding using OpenAI or similar service
    // For now, we'll use a simple hash-based approach as placeholder
    const embedding = await this.generateEmbedding(text);
    
    // Cache the embedding
    this.embeddingCache.set(text, {
      embedding,
      timestamp: Date.now()
    });

    return embedding;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Placeholder for actual embedding generation
    // In production, this would call OpenAI's embedding API or similar
    const words = text.toLowerCase().split(/\s+/);
    const dimension = this.config.dimension;
    const embedding = new Array(dimension).fill(0);
    
    // Simple hash-based embedding (placeholder)
    for (let i = 0; i < words.length; i++) {
      const hash = this.simpleHash(words[i]);
      for (let j = 0; j < dimension; j++) {
        embedding[j] += ((hash >> j) & 1) ? 1 : -1;
      }
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async indexContent(
    contentId: string, 
    contentType: string, 
    text: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Generate embedding
      const embedding = await this.getEmbedding(text);
      
      // Store in database
      const { error } = await this.supabase
        .from('content_embeddings')
        .upsert({
          content_id: contentId,
          content_type: contentType,
          embedding,
          embedding_model: this.config.model,
          embedding_version: '1.0',
          metadata: metadata || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'content_id'
        });

      if (error) {
        logger.error('Error indexing content:', error);
        throw error;
      }

      // Update search index metadata
      await this.supabase
        .from('search_index_metadata')
        .upsert({
          content_id: contentId,
          content_type: contentType,
          index_fields: metadata || {},
          indexed_at: new Date().toISOString(),
          needs_reindex: false
        }, {
          onConflict: 'content_id'
        });

    } catch (error) {
      logger.error('Error in indexContent:', error);
      throw error;
    }
  }

  async batchIndex(
    contents: Array<{ contentId: string; contentType: string; text: string; metadata?: Record<string, unknown> }>
  ): Promise<void> {
    const batchSize = this.config.batchSize;
    
    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      await Promise.all(
        batch.map(content => 
          this.indexContent(content.contentId, content.contentType, content.text, content.metadata)
        )
      );
    }
  }

  async search(query: SearchQuery): Promise<SearchResults> {
    const startTime = Date.now();
    
    // Check cache
    if (this.config.enableCache) {
      const cacheKey = this.generateCacheKey(query);
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data;
      }
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.getEmbedding(query.query);
      
      // Build database query with domain filtering
      let dbQuery = this.supabase
        .from('content_embeddings')
        .select(`
          content_id,
          content_type,
          embedding,
          metadata,
          search_index_metadata!inner(
            index_fields,
            needs_reindex
          ),
          content_domain_mapping!left(
            domain_id,
            subdomain_id,
            confidence_score
          )
        `);

      // Apply content type filter
      if (query.contentType) {
        dbQuery = dbQuery.eq('content_type', query.contentType);
      }

      // Apply domain filters
      if (query.domainId) {
        dbQuery = dbQuery.eq('content_domain_mapping.domain_id', query.domainId);
      }
      if (query.subdomainId) {
        dbQuery = dbQuery.eq('content_domain_mapping.subdomain_id', query.subdomainId);
      }

      // Apply custom filters
      if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          dbQuery = dbQuery.filter(`search_index_metadata.index_fields->>${key}`, 'eq', value);
        });
      }

      // Exclude items needing reindex
      dbQuery = dbQuery.eq('search_index_metadata.needs_reindex', false);

      const { data: embeddings, error } = await dbQuery;

      if (error) {
        logger.error('Error searching embeddings:', error);
        throw error;
      }

      // Calculate similarity scores
      const results: SearchResult[] = (embeddings || [])
        .map(item => {
          const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);
          const metadata = (item.metadata as Record<string, unknown>) || {};
          
          // Add domain information to metadata if available
          if (item.content_domain_mapping && item.content_domain_mapping[0]) {
            metadata.domainId = item.content_domain_mapping[0].domain_id;
            metadata.subdomainId = item.content_domain_mapping[0].subdomain_id;
            metadata.confidenceScore = item.content_domain_mapping[0].confidence_score;
          }
          
          return {
            contentId: item.content_id,
            contentType: item.content_type,
            score: similarity,
            metadata,
            highlights: this.generateHighlights(query.query, metadata)
          };
        })
        .filter(result => (query.minScore || 0) <= result.score)
        .sort((a, b) => b.score - a.score)
        .slice(query.offset || 0, (query.offset || 0) + (query.limit || 20));

      const searchResults: SearchResults = {
        results,
        total: results.length,
        queryTime: Date.now() - startTime,
        metadata: {
          query: query.query,
          filters: query.filters || {},
          domainId: query.domainId,
          subdomainId: query.subdomainId,
          domainSlug: query.domainSlug,
          subdomainSlug: query.subdomainSlug
        }
      };

      // Cache results
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(query);
        this.cache.set(cacheKey, {
          data: searchResults,
          timestamp: Date.now()
        });
      }

      return searchResults;

    } catch (error) {
      logger.error('Error in search:', error);
      throw error;
    }
  }

  async hybridSearch(query: SearchQuery): Promise<SearchResults> {
    if (!this.config.enableHybridSearch) {
      return this.search(query);
    }

    const startTime = Date.now();
    
    try {
      // Get semantic search results
      const semanticResults = await this.search({
        ...query,
        limit: (query.limit || 20) * 2 // Get more for reranking
      });

      // Get keyword search results (using full-text search)
      const keywordResults = await this.keywordSearch(query);

      // Combine and rerank results
      const combinedResults = this.combineResults(
        semanticResults.results,
        keywordResults.results,
        this.config.hybridSearchWeights
      );

      const searchResults: SearchResults = {
        results: combinedResults.slice(0, query.limit || 20),
        total: combinedResults.length,
        queryTime: Date.now() - startTime,
        metadata: {
          query: query.query,
          filters: query.filters || {}
        }
      };

      return searchResults;

    } catch (error) {
      logger.error('Error in hybridSearch:', error);
      throw error;
    }
  }

  private async keywordSearch(query: SearchQuery): Promise<SearchResults> {
    try {
      let dbQuery = this.supabase
        .from('search_index_metadata')
        .select(`
          content_id,
          content_type,
          index_fields
        `, { count: 'exact' });

      // Apply content type filter
      if (query.contentType) {
        dbQuery = dbQuery.eq('content_type', query.contentType);
      }

      // Apply text search (if supported)
      // This is a simplified version - in production, use pgvector or similar
      const { data: results, error, count } = await dbQuery;

      if (error) {
        logger.error('Error in keyword search:', error);
        throw error;
      }

      // Calculate simple keyword relevance scores
      const queryTerms = query.query.toLowerCase().split(/\s+/);
      const scoredResults = (results || []).map(item => {
        const metadata = item.index_fields as Record<string, unknown>;
        const text = Object.values(metadata).join(' ').toLowerCase();
        
        let score = 0;
        queryTerms.forEach(term => {
          if (text.includes(term)) score += 1;
        });
        
        return {
          contentId: item.content_id,
          contentType: item.content_type,
          score: score / queryTerms.length,
          metadata,
          highlights: this.generateHighlights(query.query, metadata)
        };
      });

      return {
        results: scoredResults.filter(r => r.score > 0),
        total: count || 0,
        queryTime: 0,
        metadata: {
          query: query.query,
          filters: query.filters || {}
        }
      };

    } catch (error) {
      logger.error('Error in keywordSearch:', error);
      return {
        results: [],
        total: 0,
        queryTime: 0,
        metadata: { query: query.query, filters: query.filters || {} }
      };
    }
  }

  private combineResults(
    semanticResults: SearchResult[],
    keywordResults: SearchResult[],
    weights: { semantic: number; keyword: number }
  ): SearchResult[] {
    const combined = new Map<string, SearchResult>();

    // Add semantic results
    semanticResults.forEach(result => {
      combined.set(result.contentId, {
        ...result,
        score: result.score * weights.semantic
      });
    });

    // Add and merge keyword results
    keywordResults.forEach(result => {
      const existing = combined.get(result.contentId);
      if (existing) {
        existing.score = (existing.score / weights.semantic) * weights.semantic + result.score * weights.keyword;
      } else {
        combined.set(result.contentId, {
          ...result,
          score: result.score * weights.keyword
        });
      }
    });

    // Sort by combined score
    return Array.from(combined.values()).sort((a, b) => b.score - a.score);
  }

  private generateHighlights(query: string, metadata: Record<string, unknown>): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    const queryTerms = query.toLowerCase().split(/\s+/);

    Object.entries(metadata).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const matches = queryTerms.filter(term => value.toLowerCase().includes(term));
        if (matches.length > 0) {
          highlights[key] = matches;
        }
      }
    });

    return highlights;
  }

  async deleteFromIndex(contentId: string): Promise<void> {
    try {
      await this.supabase
        .from('content_embeddings')
        .delete()
        .eq('content_id', contentId);

      await this.supabase
        .from('search_index_metadata')
        .delete()
        .eq('content_id', contentId);

      // Clear cache entries related to this content
      for (const [key, value] of this.cache.entries()) {
        if (value.data.results.some(r => r.contentId === contentId)) {
          this.cache.delete(key);
        }
      }

    } catch (error) {
      logger.error('Error deleting from index:', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    this.embeddingCache.clear();
  }

  async getIndexStats(): Promise<{ totalIndexed: number; byType: Record<string, number> }> {
    try {
      const { data, error } = await this.supabase
        .from('content_embeddings')
        .select('content_type');

      if (error) {
        logger.error('Error getting index stats:', error);
        throw error;
      }

      const byType: Record<string, number> = {};
      (data || []).forEach(item => {
        byType[item.content_type] = (byType[item.content_type] || 0) + 1;
      });

      return {
        totalIndexed: data?.length || 0,
        byType
      };

    } catch (error) {
      logger.error('Error in getIndexStats:', error);
      return { totalIndexed: 0, byType: {} };
    }
  }
}

// Singleton instance
let semanticSearchEngineInstance: SemanticSearchEngine | null = null;

export function getSemanticSearchEngine(config?: SemanticSearchConfig): SemanticSearchEngine {
  if (!semanticSearchEngineInstance && config) {
    semanticSearchEngineInstance = new BaseSemanticSearchEngine(config);
  }
  return semanticSearchEngineInstance!;
}

export function resetSemanticSearchEngine(): void {
  semanticSearchEngineInstance = null;
}
