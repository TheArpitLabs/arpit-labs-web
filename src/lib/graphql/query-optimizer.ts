/**
 * GraphQL Query Optimization
 * Optimizes GraphQL queries for better performance
 */

export interface QueryOptimization {
  limitFields?: boolean;
  maxDepth?: number;
  enableCache?: boolean;
  enablePersistedQueries?: boolean;
}

export interface QueryAnalysis {
  complexity: number;
  depth: number;
  fieldCount: number;
  recommendations: string[];
}

class GraphQLQueryOptimizer {
  private config: Required<QueryOptimization>;
  private queryCache = new Map<string, string>();
  private persistedQueries = new Map<string, string>();

  constructor(config: QueryOptimization = {}) {
    this.config = {
      limitFields: true,
      maxDepth: 10,
      enableCache: true,
      enablePersistedQueries: false,
      ...config,
    };
  }

  /**
   * Optimizes a GraphQL query
   */
  optimize(query: string): string {
    let optimized = query;

    // Remove unnecessary whitespace
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // Remove comments
    optimized = optimized.replace(/#.*$/gm, '');

    return optimized;
  }

  /**
   * Analyzes a query
   */
  analyze(query: string): QueryAnalysis {
    const depth = this.calculateDepth(query);
    const fieldCount = this.countFields(query);
    const complexity = this.calculateComplexity(query, depth, fieldCount);
    const recommendations = this.generateRecommendations(query, depth, fieldCount);

    return {
      complexity,
      depth,
      fieldCount,
      recommendations,
    };
  }

  /**
   * Calculates query depth
   */
  private calculateDepth(query: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of query) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  /**
   * Counts fields in query
   */
  private countFields(query: string): number {
    // Simple field counting - count words that look like field names
    const matches = query.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\s*(?:\(|:|\{)/g);
    return matches ? matches.length : 0;
  }

  /**
   * Calculates query complexity
   */
  private calculateComplexity(query: string, depth: number, fieldCount: number): number {
    // Simple complexity calculation
    return depth * 10 + fieldCount;
  }

  /**
   * Generates optimization recommendations
   */
  private generateRecommendations(query: string, depth: number, fieldCount: number): string[] {
    const recommendations: string[] = [];

    if (depth > this.config.maxDepth) {
      recommendations.push(`Query depth (${depth}) exceeds maximum (${this.config.maxDepth}). Consider using fragments or reducing nesting.`);
    }

    if (fieldCount > 50) {
      recommendations.push(`Query has ${fieldCount} fields. Consider using pagination or reducing the number of fields.`);
    }

    if (query.includes('...')) {
      recommendations.push('Consider using named fragments for better reusability.');
    }

    if (query.includes('@include') || query.includes('@skip')) {
      recommendations.push('Directives detected. Ensure they are used efficiently.');
    }

    return recommendations;
  }

  /**
   * Validates a query
   */
  validate(query: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for basic syntax
    if (!query.includes('{') || !query.includes('}')) {
      errors.push('Invalid GraphQL syntax: missing braces');
    }

    // Check depth
    const depth = this.calculateDepth(query);
    if (depth > this.config.maxDepth) {
      errors.push(`Query depth (${depth}) exceeds maximum (${this.config.maxDepth})`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Caches a query
   */
  cacheQuery(hash: string, query: string): void {
    if (this.config.enableCache) {
      this.queryCache.set(hash, query);
    }
  }

  /**
   * Gets a cached query
   */
  getCachedQuery(hash: string): string | undefined {
    return this.queryCache.get(hash);
  }

  /**
   * Registers a persisted query
   */
  registerPersistedQuery(hash: string, query: string): void {
    this.persistedQueries.set(hash, query);
  }

  /**
   * Gets a persisted query
   */
  getPersistedQuery(hash: string): string | undefined {
    return this.persistedQueries.get(hash);
  }

  /**
   * Generates a query hash
   */
  generateHash(query: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Clears cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; persistedCount: number } {
    return {
      size: this.queryCache.size,
      persistedCount: this.persistedQueries.size,
    };
  }
}

// Create singleton instance
const queryOptimizer = new GraphQLQueryOptimizer();

/**
 * Optimizes a GraphQL query
 */
export function optimizeGraphQLQuery(query: string): string {
  return queryOptimizer.optimize(query);
}

/**
 * Analyzes a query
 */
export function analyzeGraphQLQuery(query: string): QueryAnalysis {
  return queryOptimizer.analyze(query);
}

/**
 * Validates a query
 */
export function validateGraphQLQuery(query: string): { valid: boolean; errors: string[] } {
  return queryOptimizer.validate(query);
}

/**
 * Caches a query
 */
export function cacheGraphQLQuery(hash: string, query: string): void {
  queryOptimizer.cacheQuery(hash, query);
}

/**
 * Gets cached query
 */
export function getCachedGraphQLQuery(hash: string): string | undefined {
  return queryOptimizer.getCachedQuery(hash);
}

/**
 * Registers persisted query
 */
export function registerPersistedGraphQLQuery(hash: string, query: string): void {
  queryOptimizer.registerPersistedQuery(hash, query);
}

/**
 * Gets persisted query
 */
export function getPersistedGraphQLQuery(hash: string): string | undefined {
  return queryOptimizer.getPersistedQuery(hash);
}

/**
 * Generates query hash
 */
export function generateGraphQLQueryHash(query: string): string {
  return queryOptimizer.generateHash(query);
}

/**
 * Clears GraphQL cache
 */
export function clearGraphQLCache(): void {
  queryOptimizer.clearCache();
}

/**
 * Gets cache statistics
 */
export function getGraphQLCacheStats() {
  return queryOptimizer.getCacheStats();
}

export default queryOptimizer;
