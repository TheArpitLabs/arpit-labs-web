import { CACHE_CONFIG, PAGINATION_CONFIG } from "@/constants/constants";
import { globalCache } from './cache';

/**
 * Database query optimization utilities
 * Provides query builders, pagination helpers, and performance optimization
 */

export interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  orderBy?: {
    column: string;
    ascending?: boolean;
  }[];
  limit?: number;
  offset?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Build optimized select query
 */
export function buildSelectQuery(columns: string[] = ['*']): string {
  if (columns.includes('*')) {
    return '*';
  }
  return columns.join(', ');
}

/**
 * Build where clause with parameterized queries
 */
export function buildWhereClause(conditions: Record<string, any>): {
  clause: string;
  params: any[];
} {
  const clauses: string[] = [];
  const params: any[] = [];

  Object.entries(conditions).forEach(([key, value], index) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        clauses.push(`${key} = ANY($${index + 1})`);
        params.push(value);
      } else if (typeof value === 'object') {
        // Handle operators like { gt: 5, lt: 10 }
        Object.entries(value).forEach(([operator, operand]) => {
          const operatorMap: Record<string, string> = {
            gt: '>',
            gte: '>=',
            lt: '<',
            lte: '<=',
            ne: '!=',
            like: 'LIKE',
            ilike: 'ILIKE',
          };
          if (operatorMap[operator]) {
            clauses.push(`${key} ${operatorMap[operator]} $${params.length + 1}`);
            params.push(operand);
          }
        });
      } else {
        clauses.push(`${key} = $${params.length + 1}`);
        params.push(value);
      }
    }
  });

  return {
    clause: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
    params,
  };
}

/**
 * Build order by clause
 */
export function buildOrderByClause(orderBy: QueryOptions['orderBy']): string {
  if (!orderBy || orderBy.length === 0) {
    return '';
  }

  return orderBy
    .map(
      (order) =>
        `${order.column} ${order.ascending === false ? 'DESC' : 'ASC'}`
    )
    .join(', ');
}

/**
 * Build pagination parameters
 */
export function buildPagination(params: PaginationParams = {}): {
  limit: number;
  offset: number;
  page: number;
} {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(
    PAGINATION_CONFIG.MAX_PAGE_SIZE,
    Math.max(PAGINATION_CONFIG.MIN_PAGE_SIZE, params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE)
  );

  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    page,
  };
}

/**
 * Execute paginated query with caching
 */
export async function executePaginatedQuery<T>(
  queryFn: (options: QueryOptions) => Promise<{ data: T[]; count: number }>,
  params: PaginationParams & QueryOptions,
  cacheKey?: string
): Promise<PaginatedResult<T>> {
  const { limit, offset, page } = buildPagination(params);
  const cacheTTL = cacheKey ? CACHE_CONFIG.DEFAULT_TTL : undefined;

  // Try cache first
  if (cacheKey) {
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Execute query
  const result = await queryFn({
    ...params,
    limit,
    offset,
  });

  const totalCount = result.count;
  const totalPages = Math.ceil(totalCount / limit);

  const paginatedResult: PaginatedResult<T> = {
    data: result.data,
    pagination: {
      page,
      pageSize: limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };

  // Cache result
  if (cacheKey) {
    globalCache.set(cacheKey, paginatedResult, cacheTTL);
  }

  return paginatedResult;
}

/**
 * Batch query executor for multiple queries
 */
export async function executeBatchQueries<T>(
  queries: Array<{
    key: string;
    queryFn: () => Promise<T>;
    cache?: boolean;
  }>
): Promise<Record<string, T>> {
  const results: Record<string, T> = {};

  await Promise.all(
    queries.map(async ({ key, queryFn, cache = true }) => {
      try {
        if (cache) {
          const cached = globalCache.get(key);
          if (cached) {
            results[key] = cached;
            return;
          }
        }

        const result = await queryFn();
        results[key] = result;

        if (cache) {
          globalCache.set(key, result, CACHE_CONFIG.DEFAULT_TTL);
        }
      } catch (error) {
        console.error(`Failed to execute batch query for key: ${key}`, error);
        throw error;
      }
    })
  );

  return results;
}

/**
 * Query result transformer for performance
 */
export function transformQueryResult<T, R>(
  data: T[],
  transformer: (item: T) => R
): R[] {
  return data.map(transformer);
}

/**
 * Debounce function for query optimization
 */
export function debounceQuery<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function for query optimization
 */
export function throttleQuery<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 1000
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Query performance monitor
 */
export class QueryPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordQuery(queryKey: string, duration: number): void {
    if (!this.metrics.has(queryKey)) {
      this.metrics.set(queryKey, []);
    }
    this.metrics.get(queryKey)!.push(duration);
  }

  getAverageTime(queryKey: string): number {
    const times = this.metrics.get(queryKey);
    if (!times || times.length === 0) {
      return 0;
    }
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getSlowQueries(threshold: number = 1000): string[] {
    const slowQueries: string[] = [];

    this.metrics.forEach((times, key) => {
      const avg = this.getAverageTime(key);
      if (avg > threshold) {
        slowQueries.push(key);
      }
    });

    return slowQueries;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

export const queryMonitor = new QueryPerformanceMonitor();

/**
 * Execute query with performance monitoring
 */
export async function executeMonitoredQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    queryMonitor.recordQuery(queryKey, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    queryMonitor.recordQuery(queryKey, duration);
    throw error;
  }
}

/**
 * Build optimized join query hints
 */
export function getJoinHint(joinType: 'inner' | 'left' | 'right' | 'full'): string {
  const hints: Record<string, string> = {
    inner: 'INNER JOIN',
    left: 'LEFT JOIN',
    right: 'RIGHT JOIN',
    full: 'FULL OUTER JOIN',
  };
  return hints[joinType];
}

/**
 * Generate index suggestion for query
 */
export function suggestIndex(columns: string[], tableName: string): string {
  const indexName = `idx_${tableName}_${columns.join('_')}`;
  return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columns.join(', ')});`;
}
