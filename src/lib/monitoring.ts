/**
 * Error Monitoring & Sentry Configuration
 * Optional integration - requires NEXT_PUBLIC_SENTRY_DSN environment variable
 */

import { logger } from '@/lib/logger';

let Sentry: any = null;

try {
  Sentry = require("@sentry/nextjs");
} catch (error) {
  console.warn('Sentry error monitoring not configured.');
}

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

export function initializeSentry() {
  if (!SENTRY_DSN || !Sentry) {
    console.warn('SENTRY_DSN not configured or Sentry not installed');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    debug: ENVIRONMENT !== 'production',
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  });
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Exception:', error, context);
  }
}

export function captureMessage(message: string, level: string = 'info') {
  if (Sentry) {
    Sentry.captureMessage(message, level);
  } else {
    logger[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](message);
  }
}

export function setUserContext(userId: string, email?: string, name?: string) {
  if (Sentry) {
    Sentry.setUser({
      id: userId,
      email,
      username: name,
    });
  }
}

export function clearUserContext() {
  if (Sentry) {
    Sentry.setUser(null);
  }
}

export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: string = 'info'
) {
  if (Sentry) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
    });
  } else {
    console.debug(`[${category}]`, message);
  }
}

export const monitoring = {
  apiError: (endpoint: string, status: number, error: string) => {
    addBreadcrumb(`API Error: ${status} at ${endpoint}`, 'api', 'error');
    captureMessage(`API Error: ${endpoint} returned ${status}`, 'error');
  },

  databaseError: (operation: string, error: string) => {
    addBreadcrumb(`Database ${operation} failed`, 'database', 'error');
    captureMessage(`Database operation failed: ${operation}`, 'error');
  },

  authError: (message: string) => {
    addBreadcrumb(`Auth: ${message}`, 'auth', 'warning');
  },

  performanceIssue: (metric: string, value: number, threshold: number) => {
    if (value > threshold) {
      captureMessage(
        `Performance Issue: ${metric} = ${value}ms (threshold: ${threshold}ms)`,
        'warning'
      );
    }
  },

  featureFlag: (flag: string, enabled: boolean) => {
    addBreadcrumb(`Feature Flag: ${flag} = ${enabled}`, 'feature', 'info');
  },
};
