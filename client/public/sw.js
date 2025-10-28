/**
 * Service Worker - QIVO Mining PWA
 * 
 * Features:
 * - Offline caching (static assets, API responses)
 * - Background sync (retry queue for failed requests)
 * - Push notifications (optional)
 */

const CACHE_VERSION = 'qivo-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Force activation
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('qivo-') && name !== STATIC_CACHE && name !== API_CACHE && name !== IMAGE_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Take control immediately
  return self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // API requests: Network first, fallback to cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/trpc/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }
  
  // Images: Cache first, fallback to network
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }
  
  // Static assets: Cache first, fallback to network
  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

/**
 * Cache first strategy
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  console.log('[SW] Cache miss, fetching:', request.url);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network first strategy
 */
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Queue for background sync if POST/PUT/DELETE
    if (request.method !== 'GET') {
      await queueRequest(request);
    }
    
    return new Response(JSON.stringify({ error: 'Offline', queued: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Queue failed request for background sync
 */
async function queueRequest(request) {
  const queue = await getQueue();
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };
  queue.push(requestData);
  await saveQueue(queue);
  console.log('[SW] Request queued for retry:', request.url);
}

/**
 * Get retry queue from IndexedDB
 */
async function getQueue() {
  try {
    const cache = await caches.open('qivo-queue');
    const response = await cache.match('/queue');
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('[SW] Failed to get queue:', error);
  }
  return [];
}

/**
 * Save retry queue to IndexedDB
 */
async function saveQueue(queue) {
  try {
    const cache = await caches.open('qivo-queue');
    await cache.put('/queue', new Response(JSON.stringify(queue), {
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (error) {
    console.error('[SW] Failed to save queue:', error);
  }
}

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'retry-queue') {
    event.waitUntil(retryQueuedRequests());
  }
});

/**
 * Retry queued requests
 */
async function retryQueuedRequests() {
  const queue = await getQueue();
  console.log('[SW] Retrying queued requests:', queue.length);
  
  const failedRequests = [];
  
  for (const requestData of queue) {
    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body,
      });
      
      if (!response.ok) {
        failedRequests.push(requestData);
      } else {
        console.log('[SW] Retry successful:', requestData.url);
      }
    } catch (error) {
      console.error('[SW] Retry failed:', requestData.url, error);
      failedRequests.push(requestData);
    }
  }
  
  await saveQueue(failedRequests);
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push event');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'QIVO Mining';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url || '/',
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

console.log('[SW] Service Worker loaded');

