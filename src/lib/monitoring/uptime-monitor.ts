/**
 * Uptime monitoring utilities
 */

export interface EndpointStatus {
  url: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  statusCode: number;
  lastChecked: string;
  uptime: number;
  downtime: number;
  incidentCount: number;
}

class UptimeMonitor {
  private endpoints: Map<string, EndpointStatus> = new Map();
  private checkInterval: number = 60000; // 1 minute
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Add endpoint to monitor
   */
  addEndpoint(url: string): void {
    this.endpoints.set(url, {
      url,
      status: 'up',
      responseTime: 0,
      statusCode: 200,
      lastChecked: new Date().toISOString(),
      uptime: 0,
      downtime: 0,
      incidentCount: 0,
    });
  }

  /**
   * Remove endpoint from monitoring
   */
  removeEndpoint(url: string): void {
    this.endpoints.delete(url);
  }

  /**
   * Check a single endpoint
   */
  private async checkEndpoint(url: string): Promise<EndpointStatus> {
    const startTime = Date.now();
    let status: EndpointStatus;

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
      });

      const responseTime = Date.now() - startTime;
      const statusCode = response.status;

      const currentStatus = this.endpoints.get(url);
      const isUp = statusCode >= 200 && statusCode < 400;
      const isDegraded = responseTime > 1000;

      status = {
        url,
        status: isDegraded ? 'degraded' : (isUp ? 'up' : 'down'),
        responseTime,
        statusCode,
        lastChecked: new Date().toISOString(),
        uptime: currentStatus?.uptime || 0,
        downtime: currentStatus?.downtime || 0,
        incidentCount: currentStatus?.incidentCount || 0,
      };

      // Update uptime/downtime
      if (isUp && !isDegraded) {
        status.uptime += this.checkInterval;
      } else {
        status.downtime += this.checkInterval;
        if (!isUp) {
          status.incidentCount++;
        }
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const currentStatus = this.endpoints.get(url);

      status = {
        url,
        status: 'down',
        responseTime,
        statusCode: 0,
        lastChecked: new Date().toISOString(),
        uptime: currentStatus?.uptime || 0,
        downtime: (currentStatus?.downtime || 0) + this.checkInterval,
        incidentCount: (currentStatus?.incidentCount || 0) + 1,
      };
    }

    this.endpoints.set(url, status);
    return status;
  }

  /**
   * Check all endpoints
   */
  async checkAllEndpoints(): Promise<EndpointStatus[]> {
    const checks = Array.from(this.endpoints.keys()).map(url => 
      this.checkEndpoint(url)
    );

    return Promise.all(checks);
  }

  /**
   * Start automatic monitoring
   */
  startMonitoring(interval: number = 60000): void {
    this.checkInterval = interval;
    
    if (this.intervalId) {
      this.stopMonitoring();
    }

    this.intervalId = setInterval(() => {
      this.checkAllEndpoints();
    }, interval);
  }

  /**
   * Stop automatic monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get endpoint status
   */
  getEndpointStatus(url: string): EndpointStatus | undefined {
    return this.endpoints.get(url);
  }

  /**
   * Get all endpoint statuses
   */
  getAllStatuses(): EndpointStatus[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Get overall system status
   */
  getOverallStatus(): {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    endpointCount: number;
    upEndpoints: number;
    downEndpoints: number;
    degradedEndpoints: number;
  } {
    const statuses = this.getAllStatuses();
    const upEndpoints = statuses.filter(s => s.status === 'up').length;
    const downEndpoints = statuses.filter(s => s.status === 'down').length;
    const degradedEndpoints = statuses.filter(s => s.status === 'degraded').length;
    
    const totalUptime = statuses.reduce((sum, s) => sum + s.uptime, 0);
    const totalDowntime = statuses.reduce((sum, s) => sum + s.downtime, 0);
    const totalTime = totalUptime + totalDowntime;
    const uptime = totalTime > 0 ? (totalUptime / totalTime) * 100 : 100;

    let status: 'healthy' | 'degraded' | 'down';
    if (downEndpoints > 0) {
      status = 'down';
    } else if (degradedEndpoints > 0 || uptime < 99) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      uptime,
      endpointCount: statuses.length,
      upEndpoints,
      downEndpoints,
      degradedEndpoints,
    };
  }

  /**
   * Get uptime percentage for a specific endpoint
   */
  getEndpointUptime(url: string): number {
    const status = this.endpoints.get(url);
    if (!status) return 0;

    const totalTime = status.uptime + status.downtime;
    return totalTime > 0 ? (status.uptime / totalTime) * 100 : 100;
  }

  /**
   * Get average response time for all endpoints
   */
  getAverageResponseTime(): number {
    const statuses = this.getAllStatuses();
    if (statuses.length === 0) return 0;

    const totalResponseTime = statuses.reduce((sum, s) => sum + s.responseTime, 0);
    return totalResponseTime / statuses.length;
  }

  /**
   * Clear all monitoring data
   */
  clearData(): void {
    this.endpoints.clear();
  }
}

// Create singleton instance
const uptimeMonitor = new UptimeMonitor();

export { uptimeMonitor };

/**
 * Monitor application health
 */
export function monitorApplicationHealth(): void {
  // Add key endpoints
  uptimeMonitor.addEndpoint('/api/health');
  uptimeMonitor.addEndpoint('/api/status');
  
  // Start monitoring
  uptimeMonitor.startMonitoring(60000); // Check every minute
}

/**
 * Get health report
 */
export function getHealthReport(): {
  overall: ReturnType<typeof uptimeMonitor['getOverallStatus']>;
  endpoints: EndpointStatus[];
  averageResponseTime: number;
  timestamp: string;
} {
  return {
    overall: uptimeMonitor.getOverallStatus(),
    endpoints: uptimeMonitor.getAllStatuses(),
    averageResponseTime: uptimeMonitor.getAverageResponseTime(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if system is healthy
 */
export function isSystemHealthy(): boolean {
  const overall = uptimeMonitor.getOverallStatus();
  return overall.status === 'healthy';
}

/**
 * Get system uptime in human-readable format
 */
export function getSystemUptime(): string {
  const overall = uptimeMonitor.getOverallStatus();
  const uptimePercentage = overall.uptime;

  if (uptimePercentage >= 99.9) return 'Excellent (99.9%+)';
  if (uptimePercentage >= 99) return 'Good (99%+)';
  if (uptimePercentage >= 95) return 'Fair (95%+)';
  return 'Poor (<95%)';
}
