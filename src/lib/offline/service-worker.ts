/**
 * Offline Support with Service Worker
 * Provides offline functionality and background sync
 */

export interface OfflineConfig {
  cacheName: string;
  version: string;
  assetsToCache: string[];
  offlineFallback: string;
  maxCacheSize?: number;
}

export class OfflineManager {
  private config: OfflineConfig;
  private cache: Cache | null = null;
  private isOnline = true;
  private syncQueue: Array<{ url: string; options: RequestInit }> = [];

  constructor(config: OfflineConfig) {
    this.config = config;
  }

  /**
   * Initializes the service worker
   */
  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('Service Worker registered:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.notifyUpdateAvailable();
              }
            });
          }
        });

        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Check initial status
        this.isOnline = navigator.onLine;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Handles online event
   */
  private handleOnline(): void {
    this.isOnline = true;
    console.log('Connection restored');
    this.processSyncQueue();
  }

  /**
   * Handles offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
    console.log('Connection lost');
  }

  /**
   * Processes the sync queue when back online
   */
  private async processSyncQueue(): Promise<void> {
    while (this.syncQueue.length > 0 && this.isOnline) {
      const item = this.syncQueue.shift();
      if (item) {
        try {
          await fetch(item.url, item.options);
        } catch (error) {
          console.error('Sync failed:', error);
          // Re-queue for later
          this.syncQueue.push(item);
        }
      }
    }
  }

  /**
   * Queues a request for background sync
   */
  queueRequest(url: string, options?: RequestInit): void {
    this.syncQueue.push({ url, options: options || {} });
  }

  /**
   * Checks if online
   */
  isConnectionOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Notifies user of available update
   */
  private notifyUpdateAvailable(): void {
    // Dispatch custom event or show notification
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  }

  /**
   * Caches assets
   */
  async cacheAssets(urls: string[]): Promise<void> {
    if (!('caches' in window)) return;

    try {
      this.cache = await caches.open(this.config.cacheName);
      await this.cache.addAll(urls);
      console.log('Assets cached successfully');
    } catch (error) {
      console.error('Failed to cache assets:', error);
    }
  }

  /**
   * Clears cache
   */
  async clearCache(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      await caches.delete(this.config.cacheName);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Gets cached response
   */
  async getCachedResponse(request: Request): Promise<Response | null> {
    if (!this.cache) return null;

    try {
      const cached = await this.cache.match(request);
      return cached || null;
    } catch (error) {
      console.error('Failed to get cached response:', error);
      return null;
    }
  }

  /**
   * Caches a response
   */
  async cacheResponse(request: Request, response: Response): Promise<void> {
    if (!this.cache) return;

    try {
      await this.cache.put(request, response.clone());
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  /**
   * Gets cache size
   */
  async getCacheSize(): Promise<number> {
    if (!this.cache) return 0;

    try {
      const keys = await this.cache.keys();
      let size = 0;

      for (const request of keys) {
        const response = await this.cache.match(request);
        if (response) {
          const blob = await response.blob();
          size += blob.size;
        }
      }

      return size;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Checks if a resource is cached
   */
  async isCached(url: string): Promise<boolean> {
    if (!this.cache) return false;

    try {
      const cached = await this.cache.match(url);
      return cached !== undefined;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const offlineManager = new OfflineManager({
  cacheName: 'arpit-labs-v1',
  version: '1.0.0',
  assetsToCache: [
    '/',
    '/offline',
    '/manifest.json',
    '/favicon.ico',
  ],
  offlineFallback: '/offline',
  maxCacheSize: 50 * 1024 * 1024, // 50MB
});

/**
 * Initializes offline support
 */
export function initializeOffline(): Promise<void> {
  return offlineManager.initialize();
}

/**
 * Checks if online
 */
export function isOnline(): boolean {
  return offlineManager.isConnectionOnline();
}

/**
 * Queues a request for background sync
 */
export function queueOfflineRequest(url: string, options?: RequestInit): void {
  offlineManager.queueRequest(url, options);
}

/**
 * Caches assets
 */
export function cacheAssets(urls: string[]): Promise<void> {
  return offlineManager.cacheAssets(urls);
}

/**
 * Clears cache
 */
export function clearOfflineCache(): Promise<void> {
  return offlineManager.clearCache();
}

/**
 * Gets cache size
 */
export function getCacheSize(): Promise<number> {
  return offlineManager.getCacheSize();
}

/**
 * Checks if resource is cached
 */
export function isResourceCached(url: string): Promise<boolean> {
  return offlineManager.isCached(url);
}

export default offlineManager;
