/**
 * Offline support utilities
 * Provides service worker registration, offline detection, and cache management
 */

export interface OfflineConfig {
  enableServiceWorker: boolean;
  cacheName: string;
  offlinePages: string[];
  staticAssets: string[];
}

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true;
}

/**
 * Get network information (if available)
 */
export function getNetworkInformation(): NetworkStatus {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      online: navigator.onLine,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  
  return {
    online: isOnline(),
  };
}

/**
 * Register network status change listeners
 */
export function onNetworkStatusChange(
  callback: (status: NetworkStatus) => void
): () => void {
  const handleOnline = () => callback(getNetworkInformation());
  const handleOffline = () => callback(getNetworkInformation());
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Register service worker
 */
export async function registerServiceWorker(
  scriptUrl: string = '/sw.js'
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(scriptUrl);
    console.log('Service worker registered successfully');
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('Service worker unregistered successfully');
    }
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
  }
}

/**
 * Cache data for offline use using IndexedDB
 */
export class OfflineCache {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'offline-cache', storeName: string = 'cache') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllKeys(): Promise<string[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }
}

export const offlineCache = new OfflineCache();

/**
 * Queue actions for when back online
 */
export class ActionQueue {
  private queue: Array<{ action: () => Promise<any>; timestamp: number }> = [];
  private isProcessing: boolean = false;

  async enqueue(action: () => Promise<any>): Promise<void> {
    this.queue.push({ action, timestamp: Date.now() });
    
    if (isOnline() && !this.isProcessing) {
      await this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && isOnline()) {
      const item = this.queue.shift();
      if (item) {
        try {
          await item.action();
        } catch (error) {
          console.error('Failed to process queued action:', error);
          // Re-queue for later
          this.queue.push(item);
          break;
        }
      }
    }

    this.isProcessing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
  }
}

export const actionQueue = new ActionQueue();

/**
 * Sync manager for offline data synchronization
 */
export class SyncManager {
  private pendingChanges: Map<string, any> = new Map();
  private lastSyncTime: number = 0;

  async addPendingChange(key: string, data: any): Promise<void> {
    this.pendingChanges.set(key, {
      data,
      timestamp: Date.now(),
    });
    
    if (isOnline()) {
      await this.sync();
    }
  }

  async sync(): Promise<void> {
    if (!isOnline() || this.pendingChanges.size === 0) {
      return;
    }

    try {
      // In a real implementation, this would send changes to the server
      console.log('Syncing pending changes:', this.pendingChanges.size);
      
      this.pendingChanges.clear();
      this.lastSyncTime = Date.now();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  getPendingChangesCount(): number {
    return this.pendingChanges.size;
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }
}

export const syncManager = new SyncManager();

/**
 * Offline-aware fetch wrapper
 */
export async function offlineAwareFetch(
  url: string,
  options: RequestInit = {},
  cacheKey?: string
): Promise<Response> {
  if (isOnline()) {
    try {
      const response = await fetch(url, options);
      
      // Cache successful GET requests
      if (cacheKey && response.ok && options.method === 'GET') {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        await offlineCache.set(cacheKey, data);
      }
      
      return response;
    } catch (error) {
      console.error('Fetch failed, trying cache:', error);
    }
  }

  // Try to get from cache
  if (cacheKey) {
    const cachedData = await offlineCache.get(cacheKey);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' },
      });
    }
  }

  throw new Error('Offline and no cached data available');
}

/**
 * Initialize offline support
 */
export async function initOfflineSupport(config: OfflineConfig): Promise<void> {
  // Initialize offline cache
  await offlineCache.init();

  // Register service worker if enabled
  if (config.enableServiceWorker) {
    await registerServiceWorker();
  }

  // Set up network status monitoring
  onNetworkStatusChange((status) => {
    console.log('Network status changed:', status);
    
    if (status.online) {
      // Process queued actions when back online
      actionQueue.processQueue();
      syncManager.sync();
    }
  });

  console.log('Offline support initialized');
}

/**
 * Check if current connection is slow
 */
export function isSlowConnection(): boolean {
  const networkInfo = getNetworkInformation();
  
  if (networkInfo.effectiveType) {
    return ['slow-2g', '2g'].includes(networkInfo.effectiveType);
  }
  
  if (networkInfo.saveData) {
    return true;
  }
  
  return false;
}

/**
 * Get appropriate quality based on connection
 */
export function getOptimalQualityForConnection(): number {
  if (isSlowConnection()) {
    return 50; // Lower quality for slow connections
  }
  
  const networkInfo = getNetworkInformation();
  
  if (networkInfo.effectiveType === '3g') {
    return 70;
  }
  
  return 80; // Default quality
}
