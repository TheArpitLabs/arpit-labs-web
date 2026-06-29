/**
 * Database query logging utilities
 */

export interface QueryLog {
  id: string;
  query: string;
  duration: number;
  timestamp: string;
  params?: any[];
  rowCount?: number;
  error?: string;
}

export interface QueryStatistics {
  totalQueries: number;
  totalDuration: number;
  averageDuration: number;
  slowQueries: QueryLog[];
  errorQueries: QueryLog[];
  queriesByType: Record<string, number>;
}

class QueryLogger {
  private logs: QueryLog[] = [];
  private maxLogs = 1000;
  private slowThreshold = 1000; // 1 second

  /**
   * Log a query
   */
  logQuery(query: string, duration: number, params?: any[], rowCount?: number, error?: string): void {
    const log: QueryLog = {
      id: this.generateId(),
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date().toISOString(),
      params,
      rowCount,
      error,
    };

    this.logs.push(log);

    // Evict oldest logs if limit reached
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log slow queries
    if (duration > this.slowThreshold) {
      console.warn(`Slow query detected (${duration}ms):`, query);
    }

    // Log errors
    if (error) {
      console.error(`Query error:`, query, error);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): QueryLog[] {
    return [...this.logs];
  }

  /**
   * Get logs by time range
   */
  getLogsByTimeRange(startDate: Date, endDate: Date): QueryLog[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return this.logs.filter(log => {
      const timestamp = new Date(log.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold?: number): QueryLog[] {
    const thresholdToUse = threshold || this.slowThreshold;
    return this.logs.filter(log => log.duration > thresholdToUse);
  }

  /**
   * Get error queries
   */
  getErrorQueries(): QueryLog[] {
    return this.logs.filter(log => log.error);
  }

  /**
   * Get query statistics
   */
  getStatistics(): QueryStatistics {
    const totalQueries = this.logs.length;
    const totalDuration = this.logs.reduce((sum, log) => sum + log.duration, 0);
    const averageDuration = totalQueries > 0 ? totalDuration / totalQueries : 0;

    const queriesByType: Record<string, number> = {};
    
    this.logs.forEach(log => {
      const type = this.getQueryType(log.query);
      queriesByType[type] = (queriesByType[type] || 0) + 1;
    });

    return {
      totalQueries,
      totalDuration,
      averageDuration,
      slowQueries: this.getSlowQueries(),
      errorQueries: this.getErrorQueries(),
      queriesByType,
    };
  }

  /**
   * Get query type from SQL
   */
  private getQueryType(query: string): string {
    const trimmed = query.trim().toUpperCase();
    
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('CREATE')) return 'DDL';
    if (trimmed.startsWith('ALTER')) return 'DDL';
    if (trimmed.startsWith('DROP')) return 'DDL';
    
    return 'OTHER';
  }

  /**
   * Sanitize query for logging
   */
  private sanitizeQuery(query: string): string {
    // Truncate very long queries
    if (query.length > 1000) {
      return query.substring(0, 1000) + '...';
    }
    return query;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Clear old logs
   */
  clearOldLogs(olderThan: Date): void {
    const cutoff = olderThan.getTime();
    this.logs = this.logs.filter(log => {
      const timestamp = new Date(log.timestamp).getTime();
      return timestamp > cutoff;
    });
  }

  /**
   * Set slow query threshold
   */
  setSlowThreshold(threshold: number): void {
    this.slowThreshold = threshold;
  }

  /**
   * Get slow query threshold
   */
  getSlowThreshold(): number {
    return this.slowThreshold;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Import logs from JSON
   */
  importLogs(json: string): void {
    try {
      const logs = JSON.parse(json) as QueryLog[];
      this.logs = logs;
    } catch (error) {
      console.error('Failed to import logs:', error);
    }
  }
}

// Create singleton instance
const queryLogger = new QueryLogger();

export { queryLogger };

/**
 * Log database query
 */
export function logQuery(
  query: string,
  duration: number,
  params?: any[],
  rowCount?: number,
  error?: string
): void {
  queryLogger.logQuery(query, duration, params, rowCount, error);
}

/**
 * Get query statistics
 */
export function getQueryStatistics(): QueryStatistics {
  return queryLogger.getStatistics();
}

/**
 * Get slow queries
 */
export function getSlowQueries(threshold?: number): QueryLog[] {
  return queryLogger.getSlowQueries(threshold);
}

/**
 * Get error queries
 */
export function getErrorQueries(): QueryLog[] {
  return queryLogger.getErrorQueries();
}

/**
 * Clear query logs
 */
export function clearQueryLogs(): void {
  queryLogger.clearLogs();
}

/**
 * Set slow query threshold
 */
export function setSlowQueryThreshold(threshold: number): void {
  queryLogger.setSlowThreshold(threshold);
}

/**
 * Query logging decorator
 */
export function withQueryLogging(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    let error: string | undefined;
    let rowCount: number | undefined;

    try {
      const result = await originalMethod.apply(this, args);
      
      // Try to get row count from result
      if (result && typeof result === 'object' && 'rowCount' in result) {
        rowCount = result.rowCount;
      }
      
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const query = args[0] || 'unknown';
      const params = args.slice(1);
      
      logQuery(query, duration, params, rowCount, error);
    }
  };

  return descriptor;
}

/**
 * Create query logging middleware
 */
export function createQueryLoggingMiddleware(options: {
  slowThreshold?: number;
  logErrors?: boolean;
  logSlowQueries?: boolean;
} = {}) {
  const { slowThreshold, logErrors = true, logSlowQueries = true } = options;

  if (slowThreshold) {
    queryLogger.setSlowThreshold(slowThreshold);
  }

  return {
    log: (query: string, duration: number, params?: any[], rowCount?: number, error?: string) => {
      if (error && !logErrors) return;
      if (!error && duration > queryLogger.getSlowThreshold() && !logSlowQueries) return;
      
      queryLogger.logQuery(query, duration, params, rowCount, error);
    },
  };
}

/**
 * Analyze query patterns
 */
export function analyzeQueryPatterns(): {
  frequentQueries: Array<{ query: string; count: number; avgDuration: number }>;
  slowPatterns: Array<{ pattern: string; avgDuration: number; count: number }>;
  errorPatterns: Array<{ pattern: string; count: number }>;
} {
  const logs = queryLogger.getLogs();
  const queryMap = new Map<string, { count: number; totalDuration: number }>();

  logs.forEach(log => {
    const pattern = log.query.split(/\s+/).slice(0, 3).join(' '); // First 3 words as pattern
    const existing = queryMap.get(pattern) || { count: 0, totalDuration: 0 };
    existing.count++;
    existing.totalDuration += log.duration;
    queryMap.set(pattern, existing);
  });

  const frequentQueries = Array.from(queryMap.entries())
    .map(([query, data]) => ({
      query,
      count: data.count,
      avgDuration: data.totalDuration / data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const slowPatterns = Array.from(queryMap.entries())
    .map(([pattern, data]) => ({
      pattern,
      avgDuration: data.totalDuration / data.count,
      count: data.count,
    }))
    .filter(p => p.avgDuration > queryLogger.getSlowThreshold())
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  const errorLogs = logs.filter(log => log.error);
  const errorMap = new Map<string, number>();

  errorLogs.forEach(log => {
    const pattern = log.query.split(/\s+/).slice(0, 3).join(' ');
    errorMap.set(pattern, (errorMap.get(pattern) || 0) + 1);
  });

  const errorPatterns = Array.from(errorMap.entries())
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    frequentQueries,
    slowPatterns,
    errorPatterns,
  };
}
