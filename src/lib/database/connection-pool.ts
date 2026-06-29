/**
 * Database Connection Pool Optimization
 * Manages database connection pooling for optimal performance
 */

import { Pool, PoolConfig, PoolClient } from 'pg';

export interface PoolStatistics {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  maxConnections: number;
}

export interface PoolConfigOptions {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class ConnectionPoolManager {
  private pools = new Map<string, Pool>();
  private statistics = new Map<string, PoolStatistics>();

  /**
   * Creates or gets a connection pool
   */
  getPool(name: string, config: PoolConfigOptions): Pool {
    if (this.pools.has(name)) {
      return this.pools.get(name)!;
    }

    const poolConfig: PoolConfig = {
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || parseInt(process.env.DB_PORT || '5432'),
      database: config.database || process.env.DB_NAME,
      user: config.user || process.env.DB_USER,
      password: config.password || process.env.DB_PASSWORD,
      max: config.max || 20,
      min: config.min || 2,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    };

    const pool = new Pool(poolConfig);

    // Handle pool errors
    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });

    this.pools.set(name, pool);
    return pool;
  }

  /**
   * Gets a client from a pool
   */
  async getClient(poolName: string): Promise<PoolClient> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }
    return pool.connect();
  }

  /**
   * Executes a query with automatic connection management
   */
  async query<T = any>(
    poolName: string,
    text: string,
    params?: any[]
  ): Promise<T[]> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool '${poolName}' not found`);
    }

    const result = await pool.query(text, params);
    return result.rows as T[];
  }

  /**
   * Executes a transaction
   */
  async transaction<T>(
    poolName: string,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient(poolName);

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
   * Gets pool statistics
   */
  getStatistics(poolName: string): PoolStatistics | null {
    const pool = this.pools.get(poolName);
    if (!pool) return null;

    return {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
      maxConnections: pool.options.max || 20,
    };
  }

  /**
   * Gets all pool statistics
   */
  getAllStatistics(): Record<string, PoolStatistics> {
    const stats: Record<string, PoolStatistics> = {};

    for (const [name, pool] of this.pools.entries()) {
      stats[name] = {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
        maxConnections: pool.options.max || 20,
      };
    }

    return stats;
  }

  /**
   * Closes a pool
   */
  async closePool(poolName: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (pool) {
      await pool.end();
      this.pools.delete(poolName);
      this.statistics.delete(poolName);
    }
  }

  /**
   * Closes all pools
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.pools.values()).map((pool) => pool.end());
    await Promise.all(closePromises);
    this.pools.clear();
    this.statistics.clear();
  }

  /**
   * Health check for a pool
   */
  async healthCheck(poolName: string): Promise<boolean> {
    try {
      await this.query(poolName, 'SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pings all pools
   */
  async pingAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const poolName of this.pools.keys()) {
      results[poolName] = await this.healthCheck(poolName);
    }

    return results;
  }
}

// Create singleton instance
const poolManager = new ConnectionPoolManager();

/**
 * Gets or creates a connection pool
 */
export function getConnectionPool(name: string, config: PoolConfigOptions): Pool {
  return poolManager.getPool(name, config);
}

/**
 * Gets a client from a pool
 */
export async function getDBClient(poolName: string): Promise<PoolClient> {
  return poolManager.getClient(poolName);
}

/**
 * Executes a query
 */
export async function dbQuery<T = any>(
  poolName: string,
  text: string,
  params?: any[]
): Promise<T[]> {
  return poolManager.query<T>(poolName, text, params);
}

/**
 * Executes a transaction
 */
export async function dbTransaction<T>(
  poolName: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  return poolManager.transaction(poolName, callback);
}

/**
 * Gets pool statistics
 */
export function getPoolStatistics(poolName: string): PoolStatistics | null {
  return poolManager.getStatistics(poolName);
}

/**
 * Gets all pool statistics
 */
export function getAllPoolStatistics(): Record<string, PoolStatistics> {
  return poolManager.getAllStatistics();
}

/**
 * Closes a pool
 */
export async function closeConnectionPool(poolName: string): Promise<void> {
  return poolManager.closePool(poolName);
}

/**
 * Closes all pools
 */
export async function closeAllConnectionPools(): Promise<void> {
  return poolManager.closeAll();
}

/**
 * Health check for a pool
 */
export async function healthCheckPool(poolName: string): Promise<boolean> {
  return poolManager.healthCheck(poolName);
}

/**
 * Pings all pools
 */
export async function pingAllPools(): Promise<Record<string, boolean>> {
  return poolManager.pingAll();
}

export default poolManager;
