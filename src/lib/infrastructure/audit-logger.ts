/**
 * Audit Logging System
 * Tracks all system actions for security and compliance
 */

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startTime?: Date;
  endTime?: Date;
  success?: boolean;
  limit?: number;
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs: number = 10000;

  /**
   * Log an audit event
   */
  log(event: Omit<AuditLog, 'id' | 'timestamp'>): string {
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event,
    };

    this.logs.push(auditLog);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    return auditLog.id;
  }

  /**
   * Query audit logs
   */
  query(query: AuditQuery): AuditLog[] {
    let results = [...this.logs];

    if (query.userId) {
      results = results.filter(log => log.userId === query.userId);
    }

    if (query.action) {
      results = results.filter(log => log.action === query.action);
    }

    if (query.resource) {
      results = results.filter(log => log.resource === query.resource);
    }

    if (query.resourceId) {
      results = results.filter(log => log.resourceId === query.resourceId);
    }

    if (query.startTime) {
      results = results.filter(log => log.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      results = results.filter(log => log.timestamp <= query.endTime!);
    }

    if (query.success !== undefined) {
      results = results.filter(log => log.success === query.success);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get audit log by ID
   */
  getById(id: string): AuditLog | null {
    return this.logs.find(log => log.id === id) || null;
  }

  /**
   * Get recent logs
   */
  getRecent(limit: number = 100): AuditLog[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Get logs for a user
   */
  getUserLogs(userId: string, limit: number = 100): AuditLog[] {
    return this.query({ userId, limit });
  }

  /**
   * Get logs for a resource
   */
  getResourceLogs(resource: string, resourceId?: string, limit: number = 100): AuditLog[] {
    return this.query({ resource, resourceId, limit });
  }

  /**
   * Get failed operations
   */
  getFailedOperations(limit: number = 100): AuditLog[] {
    return this.query({ success: false, limit });
  }

  /**
   * Get statistics
   */
  getStats(): Record<string, any> {
    const stats = {
      totalLogs: this.logs.length,
      successful: this.logs.filter(l => l.success).length,
      failed: this.logs.filter(l => !l.success).length,
      byAction: {} as Record<string, number>,
      byResource: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
    };

    for (const log of this.logs) {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Clear old logs (older than specified days)
   */
  clearOldLogs(days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const beforeCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    const afterCount = this.logs.length;

    return beforeCount - afterCount;
  }

  /**
   * Clear all logs
   */
  clearAll(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  export(): AuditLog[] {
    return [...this.logs];
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Common audit helpers
export const audit = {
  logAuth: (userId: string, action: 'login' | 'logout' | 'register', success: boolean, details?: Record<string, any>) => {
    auditLogger.log({
      userId,
      action: `auth_${action}`,
      resource: 'auth',
      success,
      details,
    });
  },

  logApiAccess: (userId: string | undefined, endpoint: string, method: string, success: boolean, details?: Record<string, any>) => {
    auditLogger.log({
      userId,
      action: `api_${method.toLowerCase()}`,
      resource: 'api',
      resourceId: endpoint,
      success,
      details,
    });
  },

  logDataAccess: (userId: string, resource: string, resourceId: string, action: 'read' | 'write' | 'delete', success: boolean) => {
    auditLogger.log({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      success,
    });
  },

  logAdminAction: (userId: string, action: string, resource: string, resourceId?: string, details?: Record<string, any>) => {
    auditLogger.log({
      userId,
      action: `admin_${action}`,
      resource,
      resourceId,
      success: true,
      details,
    });
  },

  logSystemEvent: (action: string, resource: string, details?: Record<string, any>) => {
    auditLogger.log({
      action: `system_${action}`,
      resource,
      success: true,
      details,
    });
  },
};
