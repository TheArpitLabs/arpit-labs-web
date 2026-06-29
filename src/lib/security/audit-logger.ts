/**
 * Security audit logging utilities
 */

export enum AuditEventType {
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_PASSWORD_CHANGE = 'AUTH_PASSWORD_CHANGE',
  AUTH_PASSWORD_RESET = 'AUTH_PASSWORD_RESET',
  AUTH_MFA_ENABLED = 'AUTH_MFA_ENABLED',
  AUTH_MFA_DISABLED = 'AUTH_MFA_DISABLED',
  
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  DATA_EXPORT = 'DATA_EXPORT',
  
  ADMIN_ACTION = 'ADMIN_ACTION',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  
  API_ACCESS = 'API_ACCESS',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_ERROR = 'API_ERROR',
  
  SECURITY_EVENT = 'SECURITY_EVENT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 10000;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushTimer();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private getSeverity(eventType: AuditEventType): 'low' | 'medium' | 'high' | 'critical' {
    const criticalEvents = [
      AuditEventType.AUTH_FAILED,
      AuditEventType.USER_DELETED,
      AuditEventType.SECURITY_EVENT,
      AuditEventType.SUSPICIOUS_ACTIVITY,
    ];

    const highEvents = [
      AuditEventType.AUTH_PASSWORD_CHANGE,
      AuditEventType.AUTH_MFA_DISABLED,
      AuditEventType.USER_ROLE_CHANGED,
      AuditEventType.PERMISSION_CHANGE,
      AuditEventType.DATA_DELETION,
      AuditEventType.ADMIN_ACTION,
    ];

    if (criticalEvents.includes(eventType)) return 'critical';
    if (highEvents.includes(eventType)) return 'high';
    return 'medium';
  }

  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'severity'>): void {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      severity: this.getSeverity(entry.eventType),
    };

    this.logs.push(auditEntry);

    // Evict oldest logs if limit reached
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Flush critical events immediately
    if (auditEntry.severity === 'critical') {
      this.flushLog(auditEntry);
    }
  }

  private async flushLog(entry: AuditLogEntry): Promise<void> {
    try {
      await fetch('/api/audit/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to flush audit log:', error);
    }
  }

  private async flushAllLogs(): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      await fetch('/api/audit/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: this.logs }),
      });

      // Clear flushed logs
      this.logs = [];
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushAllLogs();
    }, this.flushInterval);
  }

  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  getLogsByEventType(eventType: AuditEventType): AuditLogEntry[] {
    return this.logs.filter(log => log.eventType === eventType);
  }

  getLogsByUserId(userId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  getLogsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): AuditLogEntry[] {
    return this.logs.filter(log => log.severity === severity);
  }

  getLogsByTimeRange(startDate: Date, endDate: Date): AuditLogEntry[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return this.logs.filter(log => {
      const timestamp = new Date(log.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

export { auditLogger };

/**
 * Log authentication event
 */
export function logAuthEvent(
  eventType: AuditEventType.AUTH_LOGIN | AuditEventType.AUTH_LOGOUT | AuditEventType.AUTH_FAILED,
  userId?: string,
  success: boolean = true,
  details?: Record<string, any>
): void {
  auditLogger.log({
    eventType,
    userId,
    success,
    details,
    ipAddress: getClientIp(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Log user action
 */
export function logUserAction(
  eventType: AuditEventType,
  userId: string,
  resource?: string,
  action?: string,
  success: boolean = true,
  details?: Record<string, any>
): void {
  auditLogger.log({
    eventType,
    userId,
    resource,
    action,
    success,
    details,
    ipAddress: getClientIp(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(
  eventType: AuditEventType.SECURITY_EVENT | AuditEventType.SUSPICIOUS_ACTIVITY,
  details: Record<string, any>
): void {
  auditLogger.log({
    eventType,
    success: false,
    details,
    ipAddress: getClientIp(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Log API access
 */
export function logApiAccess(
  endpoint: string,
  method: string,
  userId?: string,
  success: boolean = true,
  statusCode?: number,
  details?: Record<string, any>
): void {
  auditLogger.log({
    eventType: AuditEventType.API_ACCESS,
    userId,
    resource: endpoint,
    action: method,
    success,
    details: {
      ...details,
      statusCode,
    },
    ipAddress: getClientIp(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Log data access
 */
export function logDataAccess(
  resource: string,
  action: 'read' | 'write' | 'delete',
  userId: string,
  success: boolean = true,
  details?: Record<string, any>
): void {
  const eventType = action === 'delete' ? AuditEventType.DATA_DELETION :
                    action === 'write' ? AuditEventType.DATA_MODIFICATION :
                    AuditEventType.DATA_ACCESS;

  auditLogger.log({
    eventType,
    userId,
    resource,
    action,
    success,
    details,
    ipAddress: getClientIp(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Get client IP address
 */
function getClientIp(): string {
  // In a real implementation, this would get the IP from headers
  return 'unknown';
}

/**
 * Get audit statistics
 */
export function getAuditStatistics(): {
  total: number;
  byEventType: Record<string, number>;
  bySeverity: Record<string, number>;
  successRate: number;
  recentActivity: AuditLogEntry[];
} {
  const logs = auditLogger.getLogs();
  
  const byEventType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let successCount = 0;

  logs.forEach(log => {
    byEventType[log.eventType] = (byEventType[log.eventType] || 0) + 1;
    bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    if (log.success) successCount++;
  });

  const recentActivity = logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  return {
    total: logs.length,
    byEventType,
    bySeverity,
    successRate: logs.length > 0 ? (successCount / logs.length) * 100 : 0,
    recentActivity,
  };
}
