/**
 * Database Query Optimization
 * Optimizes database queries for better performance
 */

import { Pool, PoolClient } from 'pg';

export interface QueryOptimization {
  addIndex?: boolean;
  useConnectionPool?: boolean;
  batchInsert?: boolean;
  usePreparedStatements?: boolean;
  enableQueryCache?: boolean;
}

export interface QueryAnalysis {
  query: string;
  executionTime: number;
  rowsAffected: number;
  indexesUsed: string[];
  recommendations: string[];
}

class QueryOptimizer {
  private pool: Pool;
  private queryCache = new Map<string, { result: any; timestamp: number }>();
  private preparedStatements = new Map<string, string>();

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Executes an optimized query
   */
  async execute<T = any>(
    query: string,
    params?: any[],
    options: QueryOptimization = {}
  ): Promise<T[]> {
    const {
      usePreparedStatements = true,
      enableQueryCache = false,
    } = options;

    // Check cache
    if (enableQueryCache) {
      const cacheKey = this.getCacheKey(query, params);
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.result;
      }
    }

    let result: T[];

    if (usePreparedStatements && this.shouldUsePreparedStatement(query)) {
      result = await this.executePrepared(query, params);
    } else {
      const { rows } = await this.pool.query(query, params);
      result = rows as T[];
    }

    // Cache result
    if (enableQueryCache) {
      const cacheKey = this.getCacheKey(query, params);
      this.queryCache.set(cacheKey, { result, timestamp: Date.now() });
    }

    return result;
  }

  /**
   * Checks if query should use prepared statement
   */
  private shouldUsePreparedStatement(query: string): boolean {
    // Use prepared statements for queries with parameters
    return query.includes('$') || query.includes('?');
  }

  /**
   * Executes a prepared statement
   */
  private async executePrepared<T = any>(
    query: string,
    params?: any[]
  ): Promise<T[]> {
    const name = this.getStatementName(query);

    if (!this.preparedStatements.has(name)) {
      await this.pool.query(`PREPARE ${name} AS ${query}`);
      this.preparedStatements.set(name, query);
    }

    const { rows } = await this.pool.query(`EXECUTE ${name}(${params?.join(',') || ''})`);
    return rows as T[];
  }

  /**
   * Gets statement name from query
   */
  private getStatementName(query: string): string {
    const hash = this.hashQuery(query);
    return `stmt_${hash.substring(0, 16)}`;
  }

  /**
   * Hashes a query
   */
  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Gets cache key
   */
  private getCacheKey(query: string, params?: any[]): string {
    return `${query}:${JSON.stringify(params || [])}`;
  }

  /**
   * Batch inserts records
   */
  async batchInsert<T = any>(
    table: string,
    columns: string[],
    values: any[][],
    options: { batchSize?: number } = {}
  ): Promise<void> {
    const { batchSize = 100 } = options;

    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      const placeholders = batch
        .map(
          (_, rowIndex) =>
            `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(',')})`
        )
        .join(',');
      const params = batch.flat();

      await this.pool.query(
        `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`,
        params
      );
    }
  }

  /**
   * Analyzes a query
   */
  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    const startTime = Date.now();
    const { rows } = await this.pool.query(`EXPLAIN ANALYZE ${query}`);
    const executionTime = Date.now() - startTime;

    const indexesUsed: string[] = [];
    const recommendations: string[] = [];

    // Parse EXPLAIN ANALYZE output
    for (const row of rows) {
      const plan = row['QUERY PLAN'];
      if (plan.includes('Index Scan')) {
        const match = plan.match(/Index Scan using (\w+)/);
        if (match) {
          indexesUsed.push(match[1]);
        }
      }
      if (plan.includes('Seq Scan')) {
        recommendations.push('Consider adding an index for this query');
      }
      if (plan.includes('Nested Loop')) {
        recommendations.push('Consider restructuring the query to avoid nested loops');
      }
    }

    return {
      query,
      executionTime,
      rowsAffected: rows.length,
      indexesUsed,
      recommendations,
    };
  }

  /**
   * Suggests indexes for a table
   */
  async suggestIndexes(table: string): Promise<string[]> {
    const { rows } = await this.pool.query(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        null_frac
      FROM pg_stats
      WHERE tablename = $1
      ORDER BY n_distinct DESC
      LIMIT 10
    `, [table]);

    const suggestions: string[] = [];

    for (const row of rows) {
      if (row.n_distinct > 100 && row.null_frac < 0.1) {
        suggestions.push(`CREATE INDEX idx_${table}_${row.attname} ON ${table}(${row.attname})`);
      }
    }

    return suggestions;
  }

  /**
   * Creates an index
   */
  async createIndex(
    table: string,
    columns: string[],
    options: { unique?: boolean; name?: string } = {}
  ): Promise<void> {
    const { unique = false, name } = options;
    const indexName = name || `idx_${table}_${columns.join('_')}`;

    await this.pool.query(
      `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${table}(${columns.join(',')})`
    );
  }

  /**
   * Drops an index
   */
  async dropIndex(indexName: string): Promise<void> {
    await this.pool.query(`DROP INDEX IF EXISTS ${indexName}`);
  }

  /**
   * Clears query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys()),
    };
  }
}

/**
 * Creates a query optimizer instance
 */
export function createQueryOptimizer(pool: Pool): QueryOptimizer {
  return new QueryOptimizer(pool);
}

export default QueryOptimizer;
