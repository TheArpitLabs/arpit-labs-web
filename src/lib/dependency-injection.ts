/**
 * Simple dependency injection container
 * This improves testability by allowing dependencies to be mocked or replaced
 */

type Factory<T> = () => T;
type SingletonFactory<T> = () => T;

class DIContainer {
  private singletons = new Map<string, unknown>();
  private factories = new Map<string, Factory<unknown>>();

  /**
   * Register a singleton dependency
   */
  registerSingleton<T>(token: string, factory: SingletonFactory<T>): void {
    this.factories.set(token, factory);
  }

  /**
   * Register a transient dependency (new instance each time)
   */
  registerTransient<T>(token: string, factory: Factory<T>): void {
    this.factories.set(token, factory);
  }

  /**
   * Resolve a dependency
   */
  resolve<T>(token: string): T {
    // Check if it's already instantiated as a singleton
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    // Get the factory
    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`Dependency not registered: ${token}`);
    }

    // Create the instance
    const instance = factory();

    // Store as singleton (for now, all are singletons)
    this.singletons.set(token, instance);

    return instance as T;
  }

  /**
   * Check if a dependency is registered
   */
  has(token: string): boolean {
    return this.factories.has(token);
  }

  /**
   * Clear all dependencies (useful for testing)
   */
  clear(): void {
    this.singletons.clear();
    this.factories.clear();
  }

  /**
   * Clear a specific dependency
   */
  clearDependency(token: string): void {
    this.singletons.delete(token);
    this.factories.delete(token);
  }
}

// Global container instance
const container = new DIContainer();

/**
 * Dependency tokens for common services
 */
export const DI_TOKENS = {
  // Database
  SUPABASE_CLIENT: 'SUPABASE_CLIENT',
  SUPABASE_SERVER: 'SUPABASE_SERVER',
  
  // External services
  GITHUB_CLIENT: 'GITHUB_CLIENT',
  STRIPE_CLIENT: 'STRIPE_CLIENT',
  RAZORPAY_CLIENT: 'RAZORPAY_CLIENT',
  
  // Internal services
  LOGGER: 'LOGGER',
  CACHE: 'CACHE',
  QUEUE: 'QUEUE',
  
  // Feature flags
  FEATURE_FLAGS: 'FEATURE_FLAGS',
  
  // Configuration
  CONFIG: 'CONFIG',
} as const;

/**
 * Register a dependency
 */
export function registerDependency<T>(token: string, factory: Factory<T>, singleton: boolean = true): void {
  if (singleton) {
    container.registerSingleton(token, factory);
  } else {
    container.registerTransient(token, factory);
  }
}

/**
 * Resolve a dependency
 */
export function resolveDependency<T>(token: string): T {
  return container.resolve<T>(token);
}

/**
 * Check if a dependency exists
 */
export function hasDependency(token: string): boolean {
  return container.has(token);
}

/**
 * Clear all dependencies (useful for testing)
 */
export function clearDependencies(): void {
  container.clear();
}

/**
 * Clear a specific dependency
 */
export function clearDependency(token: string): void {
  container.clearDependency(token);
}

/**
 * Initialize default dependencies
 */
export function initializeDefaultDependencies(): void {
  // Logger is already a singleton, just register it
  const { logger } = require('./logger');
  registerDependency(DI_TOKENS.LOGGER, () => logger);
  
  // Feature flags
  const { FEATURE_FLAGS } = require('./constants');
  registerDependency(DI_TOKENS.FEATURE_FLAGS, () => FEATURE_FLAGS);
  
  // Config
  const { ENV_CONFIG } = require('./constants');
  registerDependency(DI_TOKENS.CONFIG, () => ENV_CONFIG);
}

/**
 * Higher-order function to inject dependencies into a class or function
 */
export function injectDependencies<T extends Record<string, unknown>>(
  tokens: Record<keyof T, string>,
  target: (deps: T) => unknown
): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => {
    const deps = {} as T;
    
    for (const [key, token] of Object.entries(tokens)) {
      deps[key as keyof T] = resolveDependency(token);
    }
    
    return target(deps);
  };
}

/**
 * Decorator for property injection (experimental, requires TypeScript decorators)
 */
export function Inject(token: string) {
  return function (target: unknown, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return resolveDependency(token);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Service locator pattern for cases where constructor injection isn't feasible
 */
export const ServiceLocator = {
  get: resolveDependency,
  has: hasDependency,
  register: registerDependency,
  clear: clearDependencies,
  clearOne: clearDependency,
};
