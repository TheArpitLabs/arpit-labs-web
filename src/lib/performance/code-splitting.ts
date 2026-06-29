/**
 * Code splitting and lazy loading utilities
 */

import React from 'react';

/**
 * Lazy load a component with loading and error states
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    retryCount?: number;
  } = {}
): React.LazyExoticComponent<T> {
  const { fallback, errorFallback, retryCount = 3 } = options;

  return React.lazy(() => {
    return importFunc().catch((error) => {
      console.error('Failed to load component:', error);
      throw error;
    });
  });
}

/**
 * Load script dynamically
 */
export function loadScript(src: string, options: {
  async?: boolean;
  defer?: boolean;
  crossOrigin?: string;
  integrity?: string;
} = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = options.async ?? true;
    script.defer = options.defer ?? false;
    
    if (options.crossOrigin) {
      script.crossOrigin = options.crossOrigin;
    }
    
    if (options.integrity) {
      script.integrity = options.integrity;
    }

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

/**
 * Load stylesheet dynamically
 */
export function loadStylesheet(href: string, options: {
  media?: string;
  crossOrigin?: string;
} = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    
    if (options.media) {
      link.media = options.media;
    }
    
    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));

    document.head.appendChild(link);
  });
}

/**
 * Preload resource
 */
export function preloadResource(href: string, as: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Prefetch resource
 */
export function prefetchResource(href: string, as?: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  if (as) link.as = as;
  document.head.appendChild(link);
}

/**
 * Preconnect to origin
 */
export function preconnectToOrigin(origin: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  document.head.appendChild(link);
}

/**
 * DNS prefetch
 */
export function dnsPrefetch(hostname: string): void {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = hostname;
  document.head.appendChild(link);
}

/**
 * Load module dynamically
 */
export async function loadModule<T>(modulePath: string): Promise<T> {
  try {
    const loadedModule = await import(/* @vite-ignore */ modulePath);
    return loadedModule as T;
  } catch (error) {
    console.error(`Failed to load module: ${modulePath}`, error);
    throw error;
  }
}

/**
 * Chunk loading with retry logic
 */
export async function loadChunkWithRetry<T>(
  loadFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await loadFn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Chunk load attempt ${i + 1} failed, retrying...`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to load chunk after retries');
}

/**
 * Intersection observer for lazy loading
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImages(selector: string = 'img[data-src]'): void {
  const images = document.querySelectorAll(selector);
  
  const observer = createIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });

  images.forEach(img => observer.observe(img));
}

/**
 * Lazy load components based on viewport
 */
export function lazyLoadComponent(
  componentLoader: () => Promise<any>,
  trigger: 'immediate' | 'viewport' | 'interaction' = 'viewport'
): () => Promise<any> {
  return async () => {
    if (trigger === 'immediate') {
      return componentLoader();
    }

    if (trigger === 'viewport') {
      return new Promise((resolve, reject) => {
        const observer = createIntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              componentLoader().then(resolve).catch(reject);
              observer.disconnect();
            }
          });
        });

        // Create a temporary element to observe
        const tempElement = document.createElement('div');
        tempElement.style.position = 'absolute';
        tempElement.style.top = '-9999px';
        document.body.appendChild(tempElement);
        observer.observe(tempElement);
      });
    }

    if (trigger === 'interaction') {
      return new Promise((resolve, reject) => {
        const handleInteraction = () => {
          componentLoader().then(resolve).catch(reject);
          document.removeEventListener('click', handleInteraction);
          document.removeEventListener('scroll', handleInteraction);
          document.removeEventListener('keydown', handleInteraction);
        };

        document.addEventListener('click', handleInteraction, { once: true });
        document.addEventListener('scroll', handleInteraction, { once: true });
        document.addEventListener('keydown', handleInteraction, { once: true });
      });
    }

    return componentLoader();
  };
}

/**
 * Route-based code splitting
 */
export function createRouteLoader(
  routes: Record<string, () => Promise<any>>
): (route: string) => Promise<any> {
  const loadedRoutes = new Map<string, any>();

  return async (route: string) => {
    if (loadedRoutes.has(route)) {
      return loadedRoutes.get(route);
    }

    const loader = routes[route];
    if (!loader) {
      throw new Error(`No loader found for route: ${route}`);
    }

    const loadedModule = await loader();
    loadedRoutes.set(route, loadedModule);
    return loadedModule;
  };
}

/**
 * Prefetch routes on hover
 */
export function setupRoutePrefetch(
  routes: Record<string, () => Promise<any>>,
  linkSelector: string = 'a[data-route]'
): void {
  const links = document.querySelectorAll(linkSelector);
  
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const route = (link as HTMLElement).dataset.route;
      if (route && routes[route]) {
        routes[route]().catch(error => {
          console.warn(`Failed to prefetch route: ${route}`, error);
        });
      }
    }, { once: true });
  });
}

/**
 * Dynamic import with timeout
 */
export function importWithTimeout<T>(
  importFn: () => Promise<T>,
  timeout: number = 5000
): Promise<T> {
  return Promise.race([
    importFn(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Import timeout')), timeout)
    ),
  ]);
}

/**
 * Bundle size monitoring
 */
export function getBundleSize(): Promise<{
  size: number;
  compressedSize: number;
  loadTime: number;
}> {
  return new Promise((resolve) => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('resource');
      const scriptEntries = entries.filter(entry => 
        (entry as PerformanceResourceTiming).initiatorType === 'script'
      );

      const totalSize = scriptEntries.reduce((sum, entry) => 
        sum + (entry as PerformanceResourceTiming).transferSize, 0
      );

      const totalLoadTime = scriptEntries.reduce((sum, entry) => 
        sum + (entry as PerformanceResourceTiming).duration, 0
      );

      resolve({
        size: totalSize,
        compressedSize: totalSize * 0.7, // Estimate
        loadTime: totalLoadTime,
      });
    } else {
      resolve({
        size: 0,
        compressedSize: 0,
        loadTime: 0,
      });
    }
  });
}
