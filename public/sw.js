/**
 * Service Worker for offline support and caching
 */

const CACHE_NAME = 'arpit-labs-v1';
const STATIC_CACHE = 'arpit-labs-static-v1';
const DYNAMIC_CACHE = 'arpit-labs-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/favicon.svg',
  '/logo.png',
  '/manifest.json',
];

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME
            );
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event - handle requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests - use network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Cache static assets with cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Cache pages with network-first strategy
  if (url.pathname.startsWith('/engineering') || 
      url.pathname.startsWith('/projects') ||
      url.pathname.startsWith('/community')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Cache images with cache-first strategy
  if (url.pathname.startsWith('/images/') || 
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Default to network-first for other requests
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

/**
 * Cache-first strategy
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline');
    }
    throw error;
  }
}

/**
 * Network-first strategy
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline');
    }
    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  if (cached) {
    return cached;
  }

  return fetchPromise;
}

/**
 * Network-only strategy
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    throw error;
  }
}

/**
 * Cache-only strategy
 */
async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  throw new Error('No cache match');
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

/**
 * Sync analytics data when back online
 */
async function syncAnalytics() {
  try {
    const analyticsData = await getStoredAnalytics();
    if (analyticsData.length > 0) {
      await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: analyticsData }),
      });
      await clearStoredAnalytics();
    }
  } catch (error) {
    console.error('Failed to sync analytics:', error);
  }
}

/**
 * Sync form submissions when back online
 */
async function syncForms() {
  try {
    const formData = await getStoredForms();
    if (formData.length > 0) {
      for (const form of formData) {
        await fetch(form.endpoint, {
          method: form.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form.data),
        });
      }
      await clearStoredForms();
    }
  } catch (error) {
    console.error('Failed to sync forms:', error);
  }
}

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/logo.png',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification('Arpit Labs', options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none open
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

/**
 * Get stored analytics from IndexedDB
 */
async function getStoredAnalytics() {
  // Implementation would use IndexedDB
  return [];
}

/**
 * Clear stored analytics
 */
async function clearStoredAnalytics() {
  // Implementation would clear IndexedDB
}

/**
 * Get stored forms from IndexedDB
 */
async function getStoredForms() {
  // Implementation would use IndexedDB
  return [];
}

/**
 * Clear stored forms
 */
async function clearStoredForms() {
  // Implementation would clear IndexedDB
}
