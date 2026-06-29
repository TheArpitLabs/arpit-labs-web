/**
 * Database migration system
 */

export interface Migration {
  id: string;
  name: string;
  up: string; // SQL for applying migration
  down: string; // SQL for rolling back migration
  timestamp: string;
}

export interface MigrationStatus {
  id: string;
  name: string;
  applied: boolean;
  appliedAt?: string;
}

class MigrationManager {
  private migrations: Migration[] = [];
  private appliedMigrations: Set<string> = new Set();

  /**
   * Register a migration
   */
  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
  }

  /**
   * Get all migrations
   */
  getMigrations(): Migration[] {
    return [...this.migrations];
  }

  /**
   * Get migration by ID
   */
  getMigration(id: string): Migration | undefined {
    return this.migrations.find(m => m.id === id);
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations(): Migration[] {
    return this.migrations.filter(m => !this.appliedMigrations.has(m.id));
  }

  /**
   * Get applied migrations
   */
  getAppliedMigrations(): Migration[] {
    return this.migrations.filter(m => this.appliedMigrations.has(m.id));
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<void> {
    try {
      // Execute the migration SQL
      await this.executeSql(migration.up);
      
      // Mark as applied
      this.appliedMigrations.add(migration.id);
      
      // Record in migration table
      await this.recordMigration(migration, 'up');
      
      console.log(`Migration applied: ${migration.name}`);
    } catch (error) {
      console.error(`Migration failed: ${migration.name}`, error);
      throw error;
    }
  }

  /**
   * Rollback a single migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    try {
      // Execute the rollback SQL
      await this.executeSql(migration.down);
      
      // Mark as not applied
      this.appliedMigrations.delete(migration.id);
      
      // Record in migration table
      await this.recordMigration(migration, 'down');
      
      console.log(`Migration rolled back: ${migration.name}`);
    } catch (error) {
      console.error(`Rollback failed: ${migration.name}`, error);
      throw error;
    }
  }

  /**
   * Apply all pending migrations
   */
  async migrate(): Promise<void> {
    const pending = this.getPendingMigrations();
    
    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Applying ${pending.length} pending migrations...`);
    
    // Sort by timestamp to ensure correct order
    const sorted = pending.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const migration of sorted) {
      await this.applyMigration(migration);
    }

    console.log('All migrations applied successfully');
  }

  /**
   * Rollback the last migration
   */
  async rollbackLast(): Promise<void> {
    const applied = this.getAppliedMigrations();
    
    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    // Get the last applied migration
    const lastMigration = applied[applied.length - 1];
    await this.rollbackMigration(lastMigration);
  }

  /**
   * Rollback to a specific migration
   */
  async rollbackTo(migrationId: string): Promise<void> {
    const applied = this.getAppliedMigrations();
    const targetIndex = applied.findIndex(m => m.id === migrationId);
    
    if (targetIndex === -1) {
      throw new Error('Migration not found');
    }

    // Rollback migrations in reverse order
    const toRollback = applied.slice(targetIndex + 1).reverse();
    
    for (const migration of toRollback) {
      await this.rollbackMigration(migration);
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<MigrationStatus[]> {
    const allMigrations = this.getMigrations();
    
    return allMigrations.map(migration => ({
      id: migration.id,
      name: migration.name,
      applied: this.appliedMigrations.has(migration.id),
    }));
  }

  /**
   * Create migration table
   */
  async createMigrationTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await this.executeSql(sql);
  }

  /**
   * Load applied migrations from database
   */
  async loadAppliedMigrations(): Promise<void> {
    try {
      const result = await this.executeSql('SELECT id FROM migrations');
      
      if (result && result.rows) {
        result.rows.forEach((row: any) => {
          this.appliedMigrations.add(row.id);
        });
      }
    } catch (error) {
      console.error('Failed to load applied migrations:', error);
    }
  }

  /**
   * Execute SQL
   */
  private async executeSql(sql: string): Promise<any> {
    // This would execute SQL using your database client
    // For now, return a placeholder
    console.log('Executing SQL:', sql);
    return { rows: [] };
  }

  /**
   * Record migration in database
   */
  private async recordMigration(migration: Migration, direction: 'up' | 'down'): Promise<void> {
    if (direction === 'up') {
      const sql = `
        INSERT INTO migrations (id, name, applied_at)
        VALUES ('${migration.id}', '${migration.name}', CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING;
      `;
      await this.executeSql(sql);
    } else {
      const sql = `
        DELETE FROM migrations WHERE id = '${migration.id}';
      `;
      await this.executeSql(sql);
    }
  }

  /**
   * Validate migrations
   */
  validateMigrations(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const ids = new Set<string>();

    for (const migration of this.migrations) {
      // Check for duplicate IDs
      if (ids.has(migration.id)) {
        errors.push(`Duplicate migration ID: ${migration.id}`);
      }
      ids.add(migration.id);

      // Check for required fields
      if (!migration.id) {
        errors.push('Migration missing ID');
      }
      if (!migration.name) {
        errors.push('Migration missing name');
      }
      if (!migration.up) {
        errors.push(`Migration ${migration.id} missing up SQL`);
      }
      if (!migration.down) {
        errors.push(`Migration ${migration.id} missing down SQL`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Create singleton instance
const migrationManager = new MigrationManager();

export { migrationManager };

/**
 * Create a new migration
 */
export function createMigration(config: {
  id: string;
  name: string;
  up: string;
  down: string;
}): Migration {
  return {
    ...config,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Register a migration
 */
export function registerMigration(migration: Migration): void {
  migrationManager.registerMigration(migration);
}

/**
 * Run migrations
 */
export async function runMigrations(): Promise<void> {
  await migrationManager.createMigrationTable();
  await migrationManager.loadAppliedMigrations();
  await migrationManager.migrate();
}

/**
 * Rollback last migration
 */
export async function rollbackLastMigration(): Promise<void> {
  await migrationManager.rollbackLast();
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<MigrationStatus[]> {
  return migrationManager.getStatus();
}

/**
 * Validate all migrations
 */
export function validateAllMigrations(): {
  isValid: boolean;
  errors: string[];
} {
  return migrationManager.validateMigrations();
}
