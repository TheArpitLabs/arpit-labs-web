/**
 * Database seeding utilities
 */

export interface SeedData {
  name: string;
  version: string;
  data: any;
  dependencies?: string[];
}

export interface SeedConfig {
  truncateBeforeSeed: boolean;
  batchSize: number;
  skipExisting: boolean;
}

class SeedManager {
  private seeds: Map<string, SeedData> = new Map();
  private appliedSeeds: Set<string> = new Set();
  private config: SeedConfig = {
    truncateBeforeSeed: false,
    batchSize: 100,
    skipExisting: true,
  };

  /**
   * Register seed data
   */
  registerSeed(seed: SeedData): void {
    this.seeds.set(seed.name, seed);
  }

  /**
   * Get seed by name
   */
  getSeed(name: string): SeedData | undefined {
    return this.seeds.get(name);
  }

  /**
   * Get all seeds
   */
  getAllSeeds(): SeedData[] {
    return Array.from(this.seeds.values());
  }

  /**
   * Get pending seeds
   */
  getPendingSeeds(): SeedData[] {
    return this.getAllSeeds().filter(seed => !this.appliedSeeds.has(seed.name));
  }

  /**
   * Apply a single seed
   */
  async applySeed(seedName: string): Promise<void> {
    const seed = this.getSeed(seedName);
    if (!seed) {
      throw new Error(`Seed not found: ${seedName}`);
    }

    // Check dependencies
    if (seed.dependencies) {
      for (const dep of seed.dependencies) {
        if (!this.appliedSeeds.has(dep)) {
          await this.applySeed(dep);
        }
      }
    }

    try {
      // Truncate table if configured
      if (this.config.truncateBeforeSeed) {
        await this.truncateTable(seed.name);
      }

      // Insert data in batches
      const data = Array.isArray(seed.data) ? seed.data : [seed.data];
      const batches = this.createBatches(data, this.config.batchSize);

      for (const batch of batches) {
        await this.insertBatch(seed.name, batch);
      }

      // Mark as applied
      this.appliedSeeds.add(seed.name);
      
      // Record seed application
      await this.recordSeed(seed);

      console.log(`Seed applied: ${seed.name}`);
    } catch (error) {
      console.error(`Seed failed: ${seed.name}`, error);
      throw error;
    }
  }

  /**
   * Apply all pending seeds
   */
  async seedAll(): Promise<void> {
    const pending = this.getPendingSeeds();
    
    if (pending.length === 0) {
      console.log('No pending seeds');
      return;
    }

    console.log(`Applying ${pending.length} seeds...`);

    for (const seed of pending) {
      await this.applySeed(seed.name);
    }

    console.log('All seeds applied successfully');
  }

  /**
   * Reset all seeds
   */
  async resetSeeds(): Promise<void> {
    const allSeeds = this.getAllSeeds();
    
    // Clear in reverse order to handle dependencies
    for (let i = allSeeds.length - 1; i >= 0; i--) {
      const seed = allSeeds[i];
      await this.truncateTable(seed.name);
      this.appliedSeeds.delete(seed.name);
    }

    console.log('All seeds reset');
  }

  /**
   * Create batches from data array
   */
  private createBatches<T>(data: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Truncate table
   */
  private async truncateTable(tableName: string): Promise<void> {
    const sql = `TRUNCATE TABLE ${tableName} CASCADE;`;
    await this.executeSql(sql);
  }

  /**
   * Insert batch of data
   */
  private async insertBatch(tableName: string, data: any[]): Promise<void> {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const values = data.map(row => 
      `(${columns.map(col => this.formatValue(row[col])).join(', ')})`
    ).join(', ');

    const sql = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${values}
      ON CONFLICT DO NOTHING;
    `;

    await this.executeSql(sql);
  }

  /**
   * Format value for SQL
   */
  private formatValue(value: any): string {
    if (value === null) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return value.toString();
    if (value instanceof Date) return `'${value.toISOString()}'`;
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }

  /**
   * Execute SQL
   */
  private async executeSql(sql: string): Promise<any> {
    // This would execute SQL using your database client
    console.log('Executing SQL:', sql);
    return { rows: [] };
  }

  /**
   * Record seed application
   */
  private async recordSeed(seed: SeedData): Promise<void> {
    const sql = `
      INSERT INTO seeds (name, version, applied_at)
      VALUES ('${seed.name}', '${seed.version}', CURRENT_TIMESTAMP)
      ON CONFLICT (name) DO UPDATE SET
        version = EXCLUDED.version,
        applied_at = CURRENT_TIMESTAMP;
    `;
    await this.executeSql(sql);
  }

  /**
   * Create seeds table
   */
  async createSeedsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS seeds (
        name VARCHAR(255) PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.executeSql(sql);
  }

  /**
   * Load applied seeds from database
   */
  async loadAppliedSeeds(): Promise<void> {
    try {
      const result = await this.executeSql('SELECT name FROM seeds');
      
      if (result && result.rows) {
        result.rows.forEach((row: any) => {
          this.appliedSeeds.add(row.name);
        });
      }
    } catch (error) {
      console.error('Failed to load applied seeds:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SeedConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get seed status
   */
  getSeedStatus(): Array<{
    name: string;
    version: string;
    applied: boolean;
  }> {
    return this.getAllSeeds().map(seed => ({
      name: seed.name,
      version: seed.version,
      applied: this.appliedSeeds.has(seed.name),
    }));
  }
}

// Create singleton instance
const seedManager = new SeedManager();

export { seedManager };

/**
 * Create seed data
 */
export function createSeedData(config: {
  name: string;
  version: string;
  data: any;
  dependencies?: string[];
}): SeedData {
  return config;
}

/**
 * Register seed data
 */
export function registerSeed(seed: SeedData): void {
  seedManager.registerSeed(seed);
}

/**
 * Run all seeds
 */
export async function runSeeds(): Promise<void> {
  await seedManager.createSeedsTable();
  await seedManager.loadAppliedSeeds();
  await seedManager.seedAll();
}

/**
 * Reset all seeds
 */
export async function resetSeeds(): Promise<void> {
  await seedManager.resetSeeds();
}

/**
 * Get seed status
 */
export function getSeedStatus(): Array<{
  name: string;
  version: string;
  applied: boolean;
}> {
  return seedManager.getSeedStatus();
}

/**
 * Common seed data generators
 */
export const seedGenerators = {
  users: (count: number = 10) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      username: `user${i + 1}`,
      role: i === 0 ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    }));
  },

  projects: (count: number = 20) => {
    const categories = ['AI', 'IoT', 'Software', 'Hardware', 'Cybersecurity'];
    return Array.from({ length: count }, (_, i) => ({
      id: `project-${i + 1}`,
      title: `Project ${i + 1}`,
      description: `Description for project ${i + 1}`,
      slug: `project-${i + 1}`,
      category: categories[i % categories.length],
      status: i % 3 === 0 ? 'draft' : 'published',
      createdAt: new Date().toISOString(),
    }));
  },

  engineeringDomains: () => {
    return [
      { id: 'domain-1', name: 'Artificial Intelligence', slug: 'ai', description: 'AI projects' },
      { id: 'domain-2', name: 'Internet of Things', slug: 'iot', description: 'IoT projects' },
      { id: 'domain-3', name: 'Software Engineering', slug: 'software', description: 'Software projects' },
      { id: 'domain-4', name: 'Hardware Engineering', slug: 'hardware', description: 'Hardware projects' },
      { id: 'domain-5', name: 'Cybersecurity', slug: 'cybersecurity', description: 'Security projects' },
    ];
  },
};
