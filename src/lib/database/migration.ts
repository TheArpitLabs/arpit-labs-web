/**
 * Database Migration System
 * Manages database schema migrations
 */

import { Pool, PoolClient } from 'pg';

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  timestamp: number;
}

export interface MigrationResult {
  success: boolean;
  migrationId: string;
  error?: string;
}

class DatabaseMigrationManager {
  private migrations = new Map<string, Migration>();
  private pool: Pool;
  private tableName = 'migrations';

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Registers a migration
   */
  registerMigration(migration: Omit<Migration, 'timestamp'>): void {
    this.migrations.set(migration.id, {
      ...migration,
      timestamp: Date.now(),
    });
  }

  /**
   * Initializes the migrations table
   */
  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        timestamp BIGINT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Gets executed migrations
   */
  async getExecutedMigrations(): Promise<string[]> {
    const { rows } = await this.pool.query(
      `SELECT id FROM ${this.tableName} ORDER BY timestamp ASC`
    );
    return rows.map((row: any) => row.id);
  }

  /**
   * Runs pending migrations
   */
  async migrate(): Promise<MigrationResult[]> {
    await this.initialize();

    const executed = await this.getExecutedMigrations();
    const pending = Array.from(this.migrations.values())
      .filter(m => !executed.includes(m.id))
      .sort((a, b) => a.timestamp - b.timestamp);

    const results: MigrationResult[] = [];

    for (const migration of pending) {
      const result = await this.runMigration(migration);
      results.push(result);

      if (!result.success) {
        break; // Stop on first error
      }
    }

    return results;
  }

  /**
   * Runs a single migration
   */
  private async runMigration(migration: Migration): Promise<MigrationResult> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Execute migration
      await client.query(migration.up);

      // Record migration
      await client.query(
        `INSERT INTO ${this.tableName} (id, name, timestamp) VALUES ($1, $2, $3)`,
        [migration.id, migration.name, migration.timestamp]
      );

      await client.query('COMMIT');

      return {
        success: true,
        migrationId: migration.id,
      };
    } catch (error) {
      await client.query('ROLLBACK');

      return {
        success: false,
        migrationId: migration.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      client.release();
    }
  }

  /**
   * Rolls back a migration
   */
  async rollback(migrationId: string): Promise<MigrationResult> {
    const migration = this.migrations.get(migrationId);

    if (!migration) {
      return {
        success: false,
        migrationId,
        error: 'Migration not found',
      };
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Execute rollback
      await client.query(migration.down);

      // Remove from migrations table
      await client.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [migrationId]);

      await client.query('COMMIT');

      return {
        success: true,
        migrationId,
      };
    } catch (error) {
      await client.query('ROLLBACK');

      return {
        success: false,
        migrationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      client.release();
    }
  }

  /**
   * Gets migration status
   */
  async getStatus(): Promise<{
    pending: Migration[];
    executed: string[];
    total: number;
  }> {
    await this.initialize();
    const executed = await this.getExecutedMigrations();

    const pending = Array.from(this.migrations.values())
      .filter(m => !executed.includes(m.id))
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      pending,
      executed,
      total: this.migrations.size,
    };
  }

  /**
   * Gets all registered migrations
   */
  getAllMigrations(): Migration[] {
    return Array.from(this.migrations.values()).sort((a, b) => a.timestamp - b.timestamp);
  }
}

/**
 * Creates a migration manager
 */
export function createMigrationManager(pool: Pool): DatabaseMigrationManager {
  return new DatabaseMigrationManager(pool);
}

export default DatabaseMigrationManager;
