/**
 * Error Monitoring & Sentry Configuration
 * Optional integration - requires NEXT_PUBLIC_SENTRY_DSN environment variable
 */

import { logger } from '@/lib/logger';

let Sentry: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
let sentryInitialized = false;

// Lazy load Sentry on first use (optional dependency)
async function loadSentry() {
  if (sentryInitialized) return;
  sentryInitialized = true;

  try {
    // @ts-expect-error - Sentry is an optional dependency
    const sentryModule = await import('@sentry/nextjs');
    Sentry = sentryModule.default || sentryModule;
  } catch (_error) {
    // Sentry not installed - that's okay, it's optional
    logger.debug('Sentry error monitoring not available');
  }
}

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

export async function initializeSentry() {
  await loadSentry();

  if (!SENTRY_DSN || !Sentry) {
    logger.debug('SENTRY_DSN not configured or Sentry not installed');
    return;
  }

  try {
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
  } catch (error) {
    logger.debug('Failed to initialize Sentry', error);
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  } else {
    logger.error('Exception:', { error, context });
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
    logger.debug(`[${category}]`, message);
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
