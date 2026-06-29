# Axiora - Developer Guide

**Version**: 1.0  
**Last Updated**: June 22, 2026

This guide provides comprehensive documentation for developers working on the Axiora platform.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Utilities](#core-utilities)
4. [State Management](#state-management)
5. [API Integration](#api-integration)
6. [Testing](#testing)
7. [Performance Optimization](#performance-optimization)
8. [Security Best Practices](#security-best-practices)
9. [Deployment](#deployment)

---

## Architecture Overview

The Axiora platform is built on Next.js 14 with TypeScript, using a modern architecture that emphasizes:

- **Type Safety**: Comprehensive TypeScript usage with minimal `any` types
- **Performance**: Optimized loading, caching, and lazy loading
- **Security**: CSRF protection, content sanitization, and secure defaults
- **Scalability**: Event-driven architecture, dependency injection, and modular design
- **Developer Experience**: Comprehensive tooling and utilities

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Testing**: Vitest
- **State Management**: Custom store with React hooks
- **Caching**: In-memory cache with TTL support

---

## Project Structure

```
axiora/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   │   ├── admin/             # Admin dashboard components
│   │   ├── ai/                # AI-related components
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Core utilities and libraries
│   │   ├── constants.ts       # Configuration constants
│   │   ├── logger.ts          # Logging system
│   │   ├── errors.ts          # Error handling
│   │   ├── cache.ts           # Caching utilities
│   │   ├── csrf.ts            # CSRF protection
│   │   ├── retry.ts           # Retry logic with circuit breaker
│   │   ├── rate-limit.ts      # Rate limiting
│   │   ├── api-error-handler.ts # API error handling
│   │   ├── code-splitting.ts  # Dynamic imports
│   │   ├── dependency-injection.ts # DI container
│   │   ├── image-optimization.ts # Image optimization
│   │   ├── database-optimization.ts # DB query optimization
│   │   ├── content-sanitization.ts # Content sanitization
│   │   ├── offline-support.ts # Offline functionality
│   │   ├── mobile-responsiveness.ts # Mobile utilities
│   │   ├── event-driven.ts    # Event bus and architecture
│   │   ├── state-management.ts # State management
│   │   ├── performance-monitoring.ts # Performance monitoring
│   │   └── lazy-loading.ts    # Lazy loading utilities
│   ├── hooks/                 # Custom React hooks
│   └── __tests__/             # Test files
│       ├── unit/             # Unit tests
│       └── integration/      # Integration tests
├── public/                    # Static assets
├── supabase/                  # Database migrations
└── scripts/                   # Utility scripts
```

---

## Core Utilities

### Constants (`src/lib/constants.ts`)

Centralized configuration for the application:

```typescript
import {
  API_CONFIG,
  RATE_LIMIT_CONFIG,
  CACHE_CONFIG,
  PAGINATION_CONFIG,
  SECURITY_CONFIG,
  FEATURE_FLAGS,
  ERROR_MESSAGES,
  REGEX_PATTERNS,
} from '@/lib/constants';

// Example usage
const timeout = API_CONFIG.DEFAULT_TIMEOUT; // 30000ms
const maxRetries = API_CONFIG.RETRY_ATTEMPTS; // 3
```

### Logger (`src/lib/logger.ts`)

Environment-aware logging system:

```typescript
import { logger } from '@/lib/logger';

logger.debug('Debug message', { context: 'data' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', { error: err });
```

### Error Handling (`src/lib/errors.ts`)

Comprehensive error handling with classification:

```typescript
import {
  DatabaseError,
  ValidationError,
  NetworkError,
  classifyError,
  logError,
  withErrorHandler,
} from '@/lib/errors';

// Create custom errors
throw new DatabaseError('Connection failed');

// Classify errors automatically
const classified = classifyError(error);

// Log errors with context
logError(error, { userId, action });

// Wrap async functions with error handling
const safeFetch = withErrorHandler(async () => {
  return await fetchData();
});
```

### Caching (`src/lib/cache.ts`)

In-memory caching with TTL support:

```typescript
import { globalCache, withCache } from '@/lib/cache';

// Basic cache operations
globalCache.set('key', data, 300); // 5 minutes TTL
const cached = globalCache.get('key');

// Cache decorator for functions
const cachedFetch = withCache(async (id: string) => await fetchUser(id), {
  keyGenerator: (id) => `user:${id}`,
  ttl: 600,
});
```

### CSRF Protection (`src/lib/csrf.ts`)

CSRF token generation and validation:

```typescript
import { generateCSRFToken, validateCSRFToken, initializeCSRF, csrfProtection } from '@/lib/csrf';

// Generate token
const token = await generateCSRFToken();

// Validate token
const isValid = await validateCSRFToken(providedToken);

// Protect API routes
export const GET = csrfProtection(async (request) => {
  return Response.json({ success: true });
});
```

### Retry Logic (`src/lib/retry.ts`)

Retry with exponential backoff and circuit breaker:

```typescript
import { withRetry, CircuitBreaker } from '@/lib/retry';

// Retry with exponential backoff
const result = await withRetry(async () => await apiCall(), {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
});

// Circuit breaker pattern
const circuitBreaker = new CircuitBreaker(apiCall, {
  failureThreshold: 5,
  resetTimeout: 60000,
});

const result = await circuitBreaker.execute();
```

### Rate Limiting (`src/lib/rate-limit.ts`)

Per-endpoint rate limiting:

```typescript
import { rateLimiter } from '@/lib/rate-limit';

// Check rate limit
const { allowed, remaining, reset } = await rateLimiter.check('api:endpoint', 'user-id', {
  limit: 100,
  window: 60000,
});

if (!allowed) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

---

## State Management

### Store (`src/lib/state-management.ts`)

Custom state management with React hooks:

```typescript
import { appStore, actions, useAppState, selectors } from '@/lib/state-management';

// Using actions
actions.user.login(profile);
actions.ui.setTheme('dark');
actions.learning.updateProgress(50);

// Using React hook
function MyComponent() {
  const user = useAppState(selectors.user.profile);
  const theme = useAppState(selectors.ui.theme);

  return <div>Theme: {theme}</div>;
}

// Direct store access
const state = appStore.getState();
appStore.setState({ ui: { ...state.ui, sidebarOpen: false } });
```

### Creating Custom Stores

```typescript
import { createStore } from '@/lib/state-management';

const myStore = createStore(
  { count: 0, name: 'default' },
  {
    persist: true,
    persistKey: 'my-store',
    logger: true,
  }
);
```

---

## API Integration

### Error Handler (`src/lib/api-error-handler.ts`)

Standardized API error responses:

```typescript
import { handleAPIError, createAPIResponse } from '@/lib/api-error-handler';

// In API routes
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return createAPIResponse(data, 200);
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Database Optimization (`src/lib/database-optimization.ts`)

Query optimization utilities:

```typescript
import {
  buildWhereClause,
  buildPagination,
  executePaginatedQuery,
} from '@/lib/database-optimization';

// Build optimized queries
const { clause, params } = buildWhereClause({
  status: 'active',
  created_at: { gt: '2024-01-01' },
});

// Paginated queries
const result = await executePaginatedQuery((options) => await db.query('users', options), {
  page: 1,
  pageSize: 20,
});
```

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { classifyError } from '@/lib/errors';

describe('Error Classification', () => {
  it('should classify database errors', () => {
    const error = new Error('Database connection failed');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(DatabaseError);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import { rateLimiter } from '@/lib/rate-limit';

describe('Rate Limiting Integration', () => {
  it('should enforce rate limits', async () => {
    const result = await rateLimiter.check('test', 'user1', {
      limit: 2,
      window: 60000,
    });
    expect(result.allowed).toBe(true);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## Performance Optimization

### Image Optimization (`src/lib/image-optimization.ts`)

```typescript
import {
  getOptimizedImageUrl,
  generateSrcSet,
  getBestSupportedFormat,
} from '@/lib/image-optimization';

// Generate optimized URLs
const url = getOptimizedImageUrl(src, {
  width: 800,
  quality: 80,
  format: 'webp',
});

// Generate responsive srcset
const srcset = generateSrcSet(src, [400, 800, 1200]);
```

### Lazy Loading (`src/lib/lazy-loading.ts`)

```typescript
import { lazyLoadImage, lazyLoadComponent, initLazyLoading } from '@/lib/lazy-loading';

// Lazy load images
lazyLoadImage(imgElement, src, placeholder);

// Lazy load React components
const HeavyComponent = lazyLoadComponent(() => import('./HeavyComponent'));

// Initialize automatic lazy loading
initLazyLoading();
```

### Performance Monitoring (`src/lib/performance-monitoring.ts`)

```typescript
import {
  performanceMonitor,
  measureAPICall,
  initPerformanceMonitoring,
} from '@/lib/performance-monitoring';

// Initialize monitoring
initPerformanceMonitoring();

// Measure API calls
const data = await measureAPICall('/api/users', () => fetch('/api/users'));

// Get performance summary
const summary = performanceMonitor.getSummary();
```

---

## Security Best Practices

### Content Sanitization (`src/lib/content-sanitization.ts`)

```typescript
import { sanitizeHTML, sanitizeURL, sanitizeUserContent } from '@/lib/content-sanitization';

// Sanitize HTML content
const clean = sanitizeHTML(userInput);

// Sanitize URLs
const safeUrl = sanitizeURL(userUrl);

// Comprehensive sanitization
const safe = sanitizeUserContent(input, 'html');
```

### Mobile Responsiveness (`src/lib/mobile-responsiveness.ts`)

```typescript
import {
  isMobile,
  getCurrentBreakpoint,
  initMobileOptimizations,
} from '@/lib/mobile-responsiveness';

// Check device type
if (isMobile()) {
  // Mobile-specific logic
}

// Get current breakpoint
const bp = getCurrentBreakpoint();

// Initialize mobile optimizations
initMobileOptimizations();
```

### Offline Support (`src/lib/offline-support.ts`)

```typescript
import { isOnline, offlineAwareFetch, initOfflineSupport } from '@/lib/offline-support';

// Check online status
if (isOnline()) {
  // Online-specific logic
}

// Offline-aware fetch
const data = await offlineAwareFetch('/api/data', {}, 'cache-key');

// Initialize offline support
initOfflineSupport({
  enableServiceWorker: true,
  cacheName: 'app-cache',
});
```

---

## Event-Driven Architecture

### Event Bus (`src/lib/event-driven.ts`)

```typescript
import { eventBus, EventType, emitWithMiddleware, PublishEvent } from '@/lib/event-driven';

// Subscribe to events
eventBus.on(EventType.USER_LOGIN, (data) => {
  console.log('User logged in:', data);
});

// Emit events
await eventBus.emit(EventType.USER_LOGIN, { userId, timestamp });

// Use decorator for automatic publishing
class UserService {
  @PublishEvent(EventType.USER_CREATE)
  async createUser(data: any) {
    // This will automatically emit USER_CREATE event
  }
}
```

---

## Deployment

### Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

### Build Process

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Performance Checklist

Before deploying:

- [ ] Run all tests: `npm test`
- [ ] Check TypeScript errors: `npm run type-check`
- [ ] Build production bundle: `npm run build`
- [ ] Test performance: `npm run lighthouse`
- [ ] Verify environment variables
- [ ] Check database migrations
- [ ] Review security headers
- [ ] Test offline functionality
- [ ] Verify mobile responsiveness

---

## Contributing

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Write tests for new utilities
- Update documentation as needed

### Git Workflow

1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Run tests locally
4. Submit pull request with description
5. Address review feedback
6. Merge after approval

### Getting Help

- Check this documentation first
- Review existing utility implementations
- Look at test files for usage examples
- Ask questions in team channels

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Last Updated**: June 22, 2026  
**Maintained By**: Axiora Development Team
