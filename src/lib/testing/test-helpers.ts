/**
 * Testing utilities and helpers
 */

import { vi, beforeEach, afterEach } from 'vitest';

/**
 * Mock localStorage for testing
 */
export function createMockLocalStorage() {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    _store: store,
  };
}

/**
 * Mock fetch for testing
 */
export function createMockFetch(responses: Record<string, any>) {
  return vi.fn(async (url: string) => {
    const response = responses[url];
    if (response) {
      return {
        ok: true,
        json: async () => response,
        status: 200,
      };
    }
    throw new Error(`No mock response for ${url}`);
  });
}

/**
 * Mock window.location for testing
 */
export function createMockLocation(url: string = 'http://localhost:3000') {
  return {
    href: url,
    origin: new URL(url).origin,
    protocol: new URL(url).protocol,
    host: new URL(url).host,
    hostname: new URL(url).hostname,
    port: new URL(url).port,
    pathname: new URL(url).pathname,
    search: new URL(url).search,
    hash: new URL(url).hash,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  };
}

/**
 * Mock IntersectionObserver for testing
 */
export function createMockIntersectionObserver() {
  return class IntersectionObserver {
    root: Element | null = null;
    rootMargin = '';
    thresholds: number[] = [];
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

/**
 * Mock ResizeObserver for testing
 */
export function createMockResizeObserver() {
  return class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/**
 * Mock PerformanceObserver for testing
 */
export function createMockPerformanceObserver() {
  return class PerformanceObserver {
    static supportedEntryTypes: readonly string[] = [];
    constructor() {}
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

/**
 * Create mock user event
 */
export function createMockEvent(type: string, properties: any = {}) {
  return {
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: {},
    currentTarget: {},
    ...properties,
  };
}

/**
 * Create mock React component props
 */
export function createMockProps<T extends Record<string, any>>(defaults: T, overrides: Partial<T> = {}): T {
  return { ...defaults, ...overrides };
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await waitFor(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Mock async function with delay
 */
export function createMockAsyncFunction<T>(
  result: T,
  delay: number = 0,
  shouldReject: boolean = false
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    await waitFor(delay);
    if (shouldReject) {
      throw new Error('Mock function rejected');
    }
    return result;
  };
}

/**
 * Create mock stream
 */
export function createMockStream<T>(items: T[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) {
        yield item;
      }
    },
  };
}

/**
 * Mock console methods
 */
export function mockConsole() {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();
  });
  
  afterEach(() => {
    Object.assign(console, originalConsole);
  });
}

/**
 * Clear all mocks
 */
export function clearAllMocks() {
  vi.clearAllMocks();
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  vi.resetAllMocks();
}

/**
 * Restore all mocks
 */
export function restoreAllMocks() {
  vi.restoreAllMocks();
}

/**
 * Create mock response
 */
export function createMockResponse(data: any, status: number = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  };
}

/**
 * Create mock request
 */
export function createMockRequest(url: string, options: RequestInit = {}) {
  return {
    url,
    method: options.method || 'GET',
    headers: new Headers(options.headers),
    body: options.body,
    cache: options.cache || 'default',
    credentials: options.credentials || 'same-origin',
  };
}

/**
 * Mock FormData
 */
export function createMockFormData(data: Record<string, any>) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value as string);
  });
  return formData;
}

/**
 * Create mock file
 */
export function createMockFile(name: string, type: string, size: number = 1024) {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/**
 * Mock navigator
 */
export function createMockNavigator(properties: Partial<Navigator> = {}) {
  return {
    userAgent: 'Mozilla/5.0 (test)',
    language: 'en-US',
    platform: 'test',
    ...properties,
  };
}

/**
 * Mock screen
 */
export function createMockScreen(properties: Partial<Screen> = {}) {
  return {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1080,
    colorDepth: 24,
    pixelDepth: 24,
    ...properties,
  };
}

/**
 * Mock window
 */
export function createMockWindow(properties: Partial<Window> = {}) {
  return {
    location: createMockLocation(),
    navigator: createMockNavigator(),
    screen: createMockScreen(),
    localStorage: createMockLocalStorage(),
    sessionStorage: createMockLocalStorage(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scrollTo: vi.fn(),
    scrollBy: vi.fn(),
    ...properties,
  };
}

/**
 * Setup test environment
 */
export function setupTestEnvironment() {
  // Mock browser APIs
  global.localStorage = createMockLocalStorage();
  global.sessionStorage = createMockLocalStorage();
  global.IntersectionObserver = createMockIntersectionObserver();
  global.ResizeObserver = createMockResizeObserver();
  global.PerformanceObserver = createMockPerformanceObserver();
}

/**
 * Cleanup test environment
 */
export function cleanupTestEnvironment() {
  clearAllMocks();
}

/**
 * Create mock Supabase client
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: [],
        error: null,
      })),
      insert: vi.fn(() => ({
        data: null,
        error: null,
      })),
      update: vi.fn(() => ({
        data: null,
        error: null,
      })),
      delete: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  };
}

/**
 * Assert element exists
 */
export function assertElementExists(selector: string): HTMLElement {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}

/**
 * Assert element has text
 */
export function assertElementHasText(selector: string, text: string): void {
  const element = assertElementExists(selector);
  if (!element.textContent?.includes(text)) {
    throw new Error(`Element ${selector} does not contain text: ${text}`);
  }
}

/**
 * Assert element is visible
 */
export function assertElementIsVisible(selector: string): void {
  const element = assertElementExists(selector);
  const styles = window.getComputedStyle(element);
  if (styles.display === 'none' || styles.visibility === 'hidden') {
    throw new Error(`Element ${selector} is not visible`);
  }
}

/**
 * Assert element is disabled
 */
export function assertElementIsDisabled(selector: string): void {
  const element = assertElementExists(selector) as HTMLInputElement;
  if (!element.disabled) {
    throw new Error(`Element ${selector} is not disabled`);
  }
}

/**
 * Assert element is enabled
 */
export function assertElementIsEnabled(selector: string): void {
  const element = assertElementExists(selector) as HTMLInputElement;
  if (element.disabled) {
    throw new Error(`Element ${selector} is disabled`);
  }
}

/**
 * Get test data generator
 */
export function createTestDataGenerator() {
  return {
    uuid: () => crypto.randomUUID(),
    email: () => `test-${Date.now()}@example.com`,
    username: () => `user-${Date.now()}`,
    number: (min: number = 0, max: number = 100) => 
      Math.floor(Math.random() * (max - min + 1)) + min,
    string: (length: number = 10) => 
      Math.random().toString(36).substring(2, 2 + length),
    date: () => new Date().toISOString(),
    boolean: () => Math.random() > 0.5,
    array: <T>(generator: () => T, length: number = 5): T[] => 
      Array.from({ length }, generator),
    object: <T extends Record<string, any>>(schema: Record<string, () => any>): T => {
      const obj: any = {};
      Object.entries(schema).forEach(([key, generator]) => {
        obj[key] = generator();
      });
      return obj;
    },
  };
}
