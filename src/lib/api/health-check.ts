/**
 * API Health Check Endpoint
 * Provides health check functionality for monitoring
 */

export interface HealthCheckConfig {
  checks: Record<string, () => Promise<boolean>>;
  timeout?: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: Record<string, { status: boolean; duration?: number; error?: string }>;
  uptime: number;
}

export interface DependencyHealth {
  name: string;
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

class HealthChecker {
  private checks = new Map<string, () => Promise<boolean>>();
  private config: HealthCheckConfig;
  private startTime = Date.now();

  constructor(config: HealthCheckConfig) {
    this.config = config;
    
    for (const [name, check] of Object.entries(config.checks)) {
      this.checks.set(name, check);
    }
  }

  /**
   * Adds a health check
   */
  addCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  /**
   * Removes a health check
   */
  removeCheck(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Runs all health checks
   */
  async check(): Promise<HealthCheckResult> {
    const results: Record<string, { status: boolean; duration?: number; error?: string }> = {};
    let healthyCount = 0;
    let totalCount = this.checks.size;

    for (const [name, check] of this.checks.entries()) {
      try {
        const start = Date.now();
        const status = await this.withTimeout(check, this.config.timeout || 5000);
        const duration = Date.now() - start;

        results[name] = {
          status,
          duration,
        };

        if (status) {
          healthyCount++;
        }
      } catch (error) {
        results[name] = {
          status: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (totalCount === 0 || healthyCount === totalCount) {
      status = 'healthy';
    } else if (healthyCount === 0) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp: Date.now(),
      checks: results,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Wraps a check with timeout
   */
  private async withTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeout)
      ),
    ]);
  }

  /**
   * Checks database connectivity
   */
  async checkDatabase(): Promise<boolean> {
    // In a real implementation, this would check database connectivity
    return true;
  }

  /**
   * Checks cache connectivity
   */
  async checkCache(): Promise<boolean> {
    // In a real implementation, this would check cache connectivity
    return true;
  }

  /**
   * Checks external API connectivity
   */
  async checkExternalAPI(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Gets uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Gets dependency health
   */
  async getDependencyHealth(): Promise<DependencyHealth[]> {
    const dependencies: DependencyHealth[] = [];

    // Check database
    try {
      const start = Date.now();
      const dbUp = await this.checkDatabase();
      dependencies.push({
        name: 'database',
        status: dbUp ? 'up' : 'down',
        responseTime: Date.now() - start,
      });
    } catch (error) {
      dependencies.push({
        name: 'database',
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check cache
    try {
      const start = Date.now();
      const cacheUp = await this.checkCache();
      dependencies.push({
        name: 'cache',
        status: cacheUp ? 'up' : 'down',
        responseTime: Date.now() - start,
      });
    } catch (error) {
      dependencies.push({
        name: 'cache',
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return dependencies;
  }
}

// Create singleton instance
let healthChecker: HealthChecker | null = null;

/**
 * Initializes health checker
 */
export function initializeHealthChecker(config: HealthCheckConfig): void {
  healthChecker = new HealthChecker(config);
}

/**
 * Adds a health check
 */
export function addHealthCheck(name: string, check: () => Promise<boolean>): void {
  if (!healthChecker) {
    healthChecker = new HealthChecker({ checks: {} });
  }
  healthChecker.addCheck(name, check);
}

/**
 * Runs health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  if (!healthChecker) {
    healthChecker = new HealthChecker({ checks: {} });
  }
  return healthChecker.check();
}

/**
 * Gets uptime
 */
export function getUptime(): number {
  if (!healthChecker) return 0;
  return healthChecker.getUptime();
}

/**
 * Gets dependency health
 */
export async function getDependencyHealth(): Promise<DependencyHealth[]> {
  if (!healthChecker) {
    healthChecker = new HealthChecker({ checks: {} });
  }
  return healthChecker.getDependencyHealth();
}

/**
 * Middleware for health check endpoint
 */
export function healthCheckMiddleware(config?: HealthCheckConfig) {
  const checker = config ? new HealthChecker(config) : new HealthChecker({ checks: {} });

  return async (request: Request): Promise<Response | null> => {
    const url = new URL(request.url);

    if (url.pathname === '/health' || url.pathname === '/healthz') {
      const result = await checker.check();
      const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;

      return new Response(JSON.stringify(result), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/health/dependencies') {
      const dependencies = await checker.getDependencyHealth();
      return new Response(JSON.stringify({ dependencies }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return null;
  };
}

export default healthChecker;
