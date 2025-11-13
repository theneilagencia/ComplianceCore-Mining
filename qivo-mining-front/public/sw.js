/**
 * Service Worker - QIVO Mining PWA
 * 
 * ⚠️ VERSÃO CORRIGIDA - Nov 2024
 * 
 * PROBLEMAS RESOLVIDOS:
 * 1. ❌ Cache agressivo de JS/CSS causava versões antigas em produção
 * 2. ❌ Bundle JS com hash não era atualizado após deploy
 * 3. ❌ Network First agora é padrão para JS/CSS (não Cache First)
 * 4. ✅ HTML continua com Cache First para PWA offline
 * 
 * ESTRATÉGIAS:
 * - JS/CSS/Assets: Network First (sempre busca nova versão)
 * - HTML: Cache First + revalidation (offline PWA)
 * - API: Network First com fallback
 * - Images: Cache First (imagens não mudam com frequência)
 */

// IMPORTANTE: Incrementar a cada deploy para forçar limpeza de cache
const CACHE_VERSION = 'qivo-v1.2.1-fix'; // ← MUDOU: versão com fix de cache
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to cache on install (APENAS HTML e manifests, NÃO JS/CSS)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install event - Version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets (HTML only, no JS/CSS)');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some assets:', err);
        // Não falhar se alguns assets não existirem
        return Promise.resolve();
      });
    })
  );
  
  // Force activation IMEDIATA
  self.skipWaiting();
});

// Activate event - LIMPEZA AGRESSIVA DE CACHE ANTIGO
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event - Clearing old caches');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Deletar TODOS os caches que não sejam a versão atual
            const isOldCache = name.startsWith('qivo-') && 
                               name !== STATIC_CACHE && 
                               name !== API_CACHE && 
                               name !== IMAGE_CACHE;
            if (isOldCache) {
              console.log('[SW] 🗑️ Deleting old cache:', name);
            }
            return isOldCache;
          })
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      console.log('[SW] ✅ Cache cleanup complete');
    })
  );
  
  // Take control immediately (sem esperar reload)
  return self.clients.claim();
});

// Fetch event - ESTRATÉGIA CORRIGIDA
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
  
  // ⚠️ FIX CRÍTICO: JS/CSS sempre busca da rede primeiro (Network First)
  // Isso garante que após deploy, novos bundles sejam carregados
  if (url.pathname.match(/\.(js|css|mjs|ts|tsx)$/)) {
    console.log('[SW] JS/CSS detected - Network First:', url.pathname);
    event.respondWith(networkFirstNoCacheStrategy(request));
    return;
  }
  
  // Images: Cache first (imagens não mudam com frequência)
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }
  
  // HTML: Cache first + revalidation (para PWA offline)
  if (request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(cacheFirstWithRevalidation(request, STATIC_CACHE));
    return;
  }
  
  // Outros assets: Network First (fontes, JSON, etc)
  event.respondWith(networkFirstNoCacheStrategy(request));
});

/**
 * Cache first strategy (com revalidação em background)
 * Usado para HTML (PWA offline)
 */
async function cacheFirstWithRevalidation(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Retorna cache imediatamente
  if (cached) {
    console.log('[SW] Cache hit (with revalidation):', request.url);
    
    // Revalidar em background (não bloqueia resposta)
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        console.log('[SW] Cache updated in background:', request.url);
      }
    }).catch(() => {
      // Falha silenciosa na revalidação
    });
    
    return cached;
  }
  
  // Cache miss: buscar da rede
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
 * Cache first strategy (tradicional)
 * Usado para imagens
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
 * Network First strategy (SEM cache de JS/CSS)
 * ⚠️ FIX CRÍTICO: JS/CSS nunca usa cache - sempre busca versão nova
 */
async function networkFirstNoCacheStrategy(request) {
  try {
    console.log('[SW] Network First (no cache):', request.url);
    const response = await fetch(request, {
      cache: 'no-cache', // ← Força bypass de cache HTTP
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    
    if (response.ok) {
      console.log('[SW] ✅ Fresh version fetched:', request.url);
      return response;
    }
    
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.error('[SW] Network failed:', error);
    // NÃO tenta cache - retorna erro direto
    return new Response('Network Error', { 
      status: 503, 
      statusText: 'Service Unavailable - No Cache Available' 
    });
  }
}

/**
 * Network first strategy (para APIs)
 * Usado para /api/ e /trpc/ com fallback para cache
 */
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cacheia apenas respostas 200 OK
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Using cached API response:', request.url);
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

