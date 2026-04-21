const CACHE_VERSION = 'v5';
const PAGE_CACHE = `sensorapp-pages-${CACHE_VERSION}`;
const STATIC_CACHE = `sensorapp-static-${CACHE_VERSION}`;
const API_CACHE = `sensorapp-api-${CACHE_VERSION}`;
const NAVIGATION_TIMEOUT_MS = 10000;
const API_TIMEOUT_MS = 8000;
const STATIC_ASSETS = ['/', '/manifest.json', '/icon-192x192.png', '/icon-512x512.png'];
const CACHEABLE_API_PATTERNS = [
  /\/api\/sensors$/,
  /\/api\/sensors\/[^/]+$/,
  /\/api\/sensors\/[^/]+\/measurements$/,
  /\/api\/push\/history$/
];

function isApiRequest(url) {
  return url.includes('/api/');
}

function isCacheableApiRequest(url) {
  return CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url));
}

function shouldCacheResponse(response) {
  return response.ok && response.type !== 'opaque';
}

async function getCachedResponse(cacheName, request) {
  const cache = await caches.open(cacheName);
  return (await cache.match(request, { ignoreSearch: true })) || undefined;
}

async function cacheResponse(cacheName, request, response) {
  if (!shouldCacheResponse(response)) {
    return;
  }

  const responseToCache = response.clone();

  const cache = await caches.open(cacheName);
  await cache.put(request, responseToCache);
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function withCacheHeader(response, headerName, headerValue) {
  const headers = new Headers(response.headers);
  headers.set(headerName, headerValue);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function networkFirstWithFallback(request, cacheName, timeoutMs) {
  try {
    const response = await fetchWithTimeout(request, timeoutMs);

    if (shouldCacheResponse(response)) {
      void cacheResponse(cacheName, request, response);
    }

    return response;
  } catch {
    const cached = await getCachedResponse(cacheName, request);
    if (cached) {
      return withCacheHeader(cached, 'X-SW-Cache', 'true');
    }

    throw new Error('network-failed');
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(PAGE_CACHE).then((cache) => cache.addAll(['/'])),
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
    ])
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keep = new Set([PAGE_CACHE, STATIC_CACHE, API_CACHE]);

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!keep.has(key)) {
            return caches.delete(key);
          }

          return undefined;
        })
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method === 'OPTIONS' && isApiRequest(request.url)) {
    event.respondWith(
      new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': self.location.origin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type'
        }
      })
    );
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin && !isApiRequest(request.url)) {
    return;
  }

  if (isApiRequest(request.url) && isCacheableApiRequest(request.url)) {
    event.respondWith(
      networkFirstWithFallback(request, API_CACHE, API_TIMEOUT_MS)
        .then((response) => {
          if (!response.ok) {
            return getCachedResponse(API_CACHE, request).then((cached) => {
              return cached ? withCacheHeader(cached, 'X-SW-Cache', 'true') : response;
            });
          }

          return response;
        })
        .catch(async () => {
          const cached = await getCachedResponse(API_CACHE, request);
          if (cached) {
            return withCacheHeader(cached, 'X-SW-Cache', 'true');
          }

          return new Response(
            JSON.stringify({ message: 'Ste offline a dáta nie sú dostupné z cache.' }),
            {
              status: 503,
              headers: {
                'Content-Type': 'application/json',
                'X-SW-Offline': 'true'
              }
            }
          );
        })
    );
    return;
  }

  if (isApiRequest(request.url)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstWithFallback(request, PAGE_CACHE, NAVIGATION_TIMEOUT_MS).catch(async () => {
        const cachedPage = await getCachedResponse(PAGE_CACHE, request);
        if (cachedPage) {
          return withCacheHeader(cachedPage, 'X-SW-Cache', 'true');
        }

        const appShell = await getCachedResponse(PAGE_CACHE, new Request('/'));
        if (appShell) {
          return withCacheHeader(appShell, 'X-SW-Cache', 'true');
        }

        return new Response('Offline', {
          status: 503,
          headers: {
            'Content-Type': 'text/plain',
            'X-SW-Offline': 'true'
          }
        });
      })
    );
    return;
  }

  if (['style', 'script', 'worker', 'image', 'font'].includes(request.destination) || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      getCachedResponse(STATIC_CACHE, request).then(async (cached) => {
        if (cached) {
          void fetch(request)
            .then((response) => cacheResponse(STATIC_CACHE, request, response))
            .catch(() => undefined);

          return cached;
        }

        const response = await fetch(request);
        void cacheResponse(STATIC_CACHE, request, response);
        return response;
      })
    );
    return;
  }

  event.respondWith(
    getCachedResponse(PAGE_CACHE, request)
      .then(async (cached) => {
        if (cached) {
          return cached;
        }

        const response = await fetch(request);
        void cacheResponse(PAGE_CACHE, request, response);
        return response;
      })
      .catch(async () => {
        const fallback = await getCachedResponse(STATIC_CACHE, request);
        if (fallback) {
          return fallback;
        }

        return new Response('Offline', {
          status: 503,
          headers: {
            'Content-Type': 'text/plain',
            'X-SW-Offline': 'true'
          }
        });
      })
  );
});

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'Upozornenie';
  const options = {
    body: payload.body || 'Máte novú správu.',
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});