/**
 * Database query optimization utilities
 */

import { Pool, PoolConfig } from 'pg';
import type { QueryResult } from 'pg';

// Database connection pool configuration
const poolConfig: PoolConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  max: 20, // Maximum pool size
  min: 5,  // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
let pool: Pool | null = null;

/**
 * Get database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    
    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
}

/**
 * Execute a query with connection pooling
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (more than 1 second)
    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms): ${text}`);
    }
    
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Build optimized query with pagination
 */
export function buildPaginatedQuery(
  baseQuery: string,
  page: number = 1,
  limit: number = 10
): { query: string; params: any[]; offset: number } {
  const offset = (page - 1) * limit;
  const query = `${baseQuery} LIMIT $1 OFFSET $2`;
  const params = [limit, offset];
  
  return { query, params, offset };
}

/**
 * Add index suggestion for common query patterns
 */
export const indexSuggestions = {
  // Users table indexes
  users: [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
  ],
  
  // Projects table indexes
  projects: [
    'CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug)',
    'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
    'CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category)',
    'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_projects_domain ON projects(domain)',
    'CREATE INDEX IF NOT EXISTS idx_projects_subdomain ON projects(subdomain)',
  ],
  
  // Analytics table indexes
  analytics: [
    'CREATE INDEX IF NOT EXISTS idx_analytics_project_id ON analytics(project_id)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(type)',
  ],
};

/**
 * Apply index suggestions
 */
export async function applyIndexes(table: keyof typeof indexSuggestions): Promise<void> {
  const indexes = indexSuggestions[table];
  
  for (const indexSql of indexes) {
    try {
      await query(indexSql);
      console.log(`Applied index: ${indexSql}`);
    } catch (error) {
      console.error(`Failed to apply index: ${indexSql}`, error);
    }
  }
}

/**
 * Analyze query performance
 */
export async function analyzeQuery(queryText: string, params?: any[]): Promise<any> {
  const explainQuery = `EXPLAIN ANALYZE ${queryText}`;
  return query(explainQuery, params);
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<any> {
  const stats = await query(`
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_tuples,
      n_dead_tup as dead_tuples,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    ORDER BY schemaname, tablename
  `);
  
  return stats;
}

/**
 * Get slow queries
 */
export async function getSlowQueries(thresholdMs: number = 1000): Promise<any> {
  const queries = await query(`
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      max_time
    FROM pg_stat_statements
    WHERE mean_time > $1
    ORDER BY mean_time DESC
    LIMIT 20
  `, [thresholdMs]);
  
  return queries;
}

/**
 * Vacuum table to reclaim space
 */
export async function vacuumTable(tableName: string): Promise<void> {
  await query(`VACUUM ANALYZE ${tableName}`);
  console.log(`Vacuumed table: ${tableName}`);
}

/**
 * Close connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
