/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `sensorapp-cache-${version}`;
const API_CACHE = 'sensorapp-api-v1';
const STATIC_CACHE = `sensorapp-static-${version}`;
const NAVIGATION_TIMEOUT_MS = 2500;
const API_TIMEOUT_MS = 2500;

// All build assets (JS/CSS chunks) and static files (icons, manifest)
const ASSETS = [...build, ...files, '/'];

// API paths that should be cached for offline use
const CACHEABLE_API_PATTERNS = [
  /\/api\/sensors$/,
  /\/api\/sensors\/[^/]+$/,
  /\/api\/sensors\/[^/]+\/measurements$/
];

function isApiRequest(url: string): boolean {
  return url.includes('/api/');
}

function isCacheableApiRequest(url: string): boolean {
  return CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url));
}

function shouldCacheResponse(response: Response): boolean {
  return response.ok && response.type !== 'opaque';
}

async function getCachedResponse(cacheName: string, request: Request): Promise<Response | undefined> {
  const cache = await caches.open(cacheName);
  return (await cache.match(request, { ignoreSearch: true })) || undefined;
}

async function cacheResponse(cacheName: string, request: Request, response: Response): Promise<void> {
  if (!shouldCacheResponse(response)) {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

async function fetchWithTimeout(request: Request, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function withCacheHeader(response: Response, headerName: string, headerValue: string): Response {
  const headers = new Headers(response.headers);
  headers.set(headerName, headerValue);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function networkFirstWithFallback(request: Request, cacheName: string, timeoutMs: number): Promise<Response> {
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

// Install - pre-cache all build assets (JS/CSS/static files)
sw.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE).then((cache) => cache.addAll(ASSETS)),
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS))
    ])
  );
  sw.skipWaiting();
});

// Activate - delete old caches but keep API cache
sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE && key !== API_CACHE && key !== STATIC_CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  sw.clients.claim();
});

// Fetch handler
sw.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === sw.location.origin;

  if (!isSameOrigin && !isApiRequest(request.url)) {
    return;
  }

  // 1. Handle cacheable API requests - network first, cache fallback
  if (isApiRequest(request.url) && isCacheableApiRequest(request.url)) {
    event.respondWith(
      networkFirstWithFallback(request, API_CACHE, API_TIMEOUT_MS)
        .then((response) => {
          if (!response.ok) {
            return getCachedResponse(API_CACHE, request).then((cached) => cached ? withCacheHeader(cached, 'X-SW-Cache', 'true') : response);
          }

          return response;
        })
        .catch(() => {
          return getCachedResponse(API_CACHE, request).then((cached) => {
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
          });
        })
    );
    return;
  }

  // 2. Skip non-cacheable API requests
  if (isApiRequest(request.url)) return;

  // 3. Static build assets - cache first with background refresh
  if (ASSETS.includes(url.pathname)) {
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

  // 4. Navigation requests (HTML pages) - network first with timeout, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstWithFallback(request, CACHE, NAVIGATION_TIMEOUT_MS)
        .catch(async () => {
          const cachedPage = await getCachedResponse(CACHE, request);
          if (cachedPage) {
            return withCacheHeader(cachedPage, 'X-SW-Cache', 'true');
          }

          const appShell = await getCachedResponse(CACHE, new Request('/'));
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

  // 5. Other requests - cache first, network fallback
  event.respondWith(
    getCachedResponse(CACHE, request).then(async (cached) => {
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);
        void cacheResponse(CACHE, request, response);
        return response;
      } catch {
        const staticCached = await getCachedResponse(STATIC_CACHE, request);
        if (staticCached) {
          return staticCached;
        }

        throw new Error('network-failed');
      }
    }).catch(() => {
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
