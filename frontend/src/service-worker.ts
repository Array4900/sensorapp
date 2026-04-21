/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `sensorapp-cache-${version}`;
const API_CACHE = 'sensorapp-api-v1';

// All build assets (JS/CSS chunks) and static files (icons, manifest)
const ASSETS = [...build, ...files];

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

// Install - pre-cache all build assets (JS/CSS/static files)
sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  sw.skipWaiting();
});

// Activate - delete old caches but keep API cache
sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE && key !== API_CACHE) {
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

  // 1. Handle cacheable API requests - network first, cache fallback
  if (isApiRequest(request.url) && isCacheableApiRequest(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is not ok (e.g., 502 from proxy when backend is down), try cache
          if (!response.ok) {
            return caches.match(request).then((cached) => cached || response);
          }
          // Cache successful responses
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Network failed - try cache
          return caches.match(request).then((cached) => {
            if (cached) {
              const headers = new Headers(cached.headers);
              headers.set('X-SW-Cache', 'true');
              return new Response(cached.body, {
                status: cached.status,
                statusText: cached.statusText,
                headers
              });
            }
            // No cache available - return offline JSON error
            return new Response(
              JSON.stringify({ message: 'Ste offline a dáta nie sú dostupné z cache.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // 2. Skip non-cacheable API requests
  if (isApiRequest(request.url)) return;

  // 3. Build assets - cache first (immutable hashed filenames)
  if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // 4. Navigation requests (HTML pages) - network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page responses for offline use
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Server is down - try cached version of this page
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Fallback to cached root page (SvelteKit client router handles routing)
            return caches.match('/').then((fallback) => {
              return fallback || new Response('Offline', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          });
        })
    );
    return;
  }

  // 5. Other requests - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
