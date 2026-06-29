/**
 * Monitoring and alerting system
 */

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  type: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (data: any) => boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  cooldown: number; // milliseconds
  lastTriggered?: number;
}

class AlertingSystem {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private maxAlerts = 1000;
  private alertCallbacks: Map<string, (alert: Alert) => void> = new Map();

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Unregister an alert rule
   */
  unregisterRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Check data against all rules
   */
  checkRules(data: any): Alert[] {
    const triggeredAlerts: Alert[] = [];
    const now = Date.now();

    this.rules.forEach(rule => {
      if (!rule.enabled) return;

      // Check cooldown
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldown) {
        return;
      }

      try {
        if (rule.condition(data)) {
          const alert: Alert = {
            id: this.generateAlertId(),
            severity: rule.severity,
            type: rule.name,
            message: `Alert triggered: ${rule.name}`,
            timestamp: new Date().toISOString(),
            metadata: { ruleId: rule.id, data },
            resolved: false,
          };

          this.addAlert(alert);
          triggeredAlerts.push(alert);
          rule.lastTriggered = now;
        }
      } catch (error) {
        console.error(`Error checking rule ${rule.id}:`, error);
      }
    });

    return triggeredAlerts;
  }

  /**
   * Add an alert manually
   */
  addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.alerts.push(newAlert);

    // Evict oldest alerts if limit reached
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }

    // Trigger callbacks
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(newAlert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });

    return newAlert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
    }
  }

  /**
   * Register callback for alerts
   */
  onAlert(callback: (alert: Alert) => void): () => void {
    const callbackId = this.generateAlertId();
    this.alertCallbacks.set(callbackId, callback);

    // Return cleanup function
    return () => {
      this.alertCallbacks.delete(callbackId);
    };
  }

  /**
   * Get all alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: 'info' | 'warning' | 'error' | 'critical'): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get resolved alerts
   */
  getResolvedAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.resolved);
  }

  /**
   * Get alerts by time range
   */
  getAlertsByTimeRange(startDate: Date, endDate: Date): Alert[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return this.alerts.filter(alert => {
      const timestamp = new Date(alert.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThan: Date): void {
    const cutoff = olderThan.getTime();
    this.alerts = this.alerts.filter(alert => {
      const timestamp = new Date(alert.timestamp).getTime();
      return timestamp > cutoff;
    });
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    total: number;
    unresolved: number;
    resolved: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  } {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    this.alerts.forEach(alert => {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    });

    return {
      total: this.alerts.length,
      unresolved: this.alerts.filter(a => !a.resolved).length,
      resolved: this.alerts.filter(a => a.resolved).length,
      bySeverity,
      byType,
    };
  }

  private generateAlertId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Create singleton instance
const alertingSystem = new AlertingSystem();

export { alertingSystem };

/**
 * Predefined alert rules
 */
export const commonAlertRules = {
  highErrorRate: {
    id: 'high-error-rate',
    name: 'High Error Rate',
    condition: (data: { errorRate: number }) => data.errorRate > 0.05,
    severity: 'error' as const,
    enabled: true,
    cooldown: 300000, // 5 minutes
  },

  highResponseTime: {
    id: 'high-response-time',
    name: 'High Response Time',
    condition: (data: { avgResponseTime: number }) => data.avgResponseTime > 1000,
    severity: 'warning' as const,
    enabled: true,
    cooldown: 300000,
  },

  lowMemory: {
    id: 'low-memory',
    name: 'Low Memory',
    condition: (data: { memoryUsage: number }) => data.memoryUsage > 0.9,
    severity: 'critical' as const,
    enabled: true,
    cooldown: 60000,
  },

  highCPU: {
    id: 'high-cpu',
    name: 'High CPU Usage',
    condition: (data: { cpuUsage: number }) => data.cpuUsage > 0.8,
    severity: 'warning' as const,
    enabled: true,
    cooldown: 300000,
  },

  diskSpaceLow: {
    id: 'disk-space-low',
    name: 'Low Disk Space',
    condition: (data: { diskUsage: number }) => data.diskUsage > 0.9,
    severity: 'critical' as const,
    enabled: true,
    cooldown: 600000,
  },

  databaseConnectionFailed: {
    id: 'db-connection-failed',
    name: 'Database Connection Failed',
    condition: (data: { dbConnected: boolean }) => !data.dbConnected,
    severity: 'critical' as const,
    enabled: true,
    cooldown: 60000,
  },

  apiRateLimitExceeded: {
    id: 'api-rate-limit',
    name: 'API Rate Limit Exceeded',
    condition: (data: { rateLimitHits: number }) => data.rateLimitHits > 10,
    severity: 'warning' as const,
    enabled: true,
    cooldown: 300000,
  },
};

/**
 * Register common alert rules
 */
export function registerCommonAlertRules(): void {
  Object.values(commonAlertRules).forEach(rule => {
    alertingSystem.registerRule(rule);
  });
}

/**
 * Create custom alert rule
 */
export function createAlertRule(
  id: string,
  name: string,
  condition: (data: any) => boolean,
  severity: 'info' | 'warning' | 'error' | 'critical',
  options: {
    enabled?: boolean;
    cooldown?: number;
  } = {}
): AlertRule {
  return {
    id,
    name,
    condition,
    severity,
    enabled: options.enabled ?? true,
    cooldown: options.cooldown ?? 300000,
  };
}

/**
 * Send alert notification
 */
export async function sendAlertNotification(alert: Alert): Promise<void> {
  try {
    await fetch('/api/alerts/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alert),
    });
  } catch (error) {
    console.error('Failed to send alert notification:', error);
  }
}

/**
 * Setup automatic alert notifications
 */
export function setupAlertNotifications(): () => void {
  const unsubscribe = alertingSystem.onAlert((alert) => {
    // Send critical and error alerts immediately
    if (alert.severity === 'critical' || alert.severity === 'error') {
      sendAlertNotification(alert);
    }
  });

  return unsubscribe;
}
