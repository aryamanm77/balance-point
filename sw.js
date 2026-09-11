/* ================================================================
   BalancePoint — Service Worker  (sw.js)
   Cache-first for app shell · Network-first for Firebase/CDN
   ================================================================ */

const CACHE_NAME = 'balancepoint-v10';
const CACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './js/firebase-init.js',
  './js/auth.js',
  './js/dashboard.js',
  './js/history.js',
  './js/fitness.js',
  './js/charts.js',
  './js/telemetry.js',
  './js/medications.js',
  './js/widgets.js',
  './assets/medications.png',
  './assets/history.png',
  './assets/sleep.png',
  './assets/fitness.png',
  './assets/telemetry.png',
  './manifest.json'
];

/* ── INSTALL: pre-cache app shell ── */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(err => {
        console.warn('[SW] Some assets failed to pre-cache:', err);
      });
    })
  );
});

/* ── ACTIVATE: clear old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: strategy router ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Network-first for Firebase, Google APIs, YouTube, Chart.js CDN */
  const isExternal = (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('youtube') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('jsdelivr') ||
    url.hostname.includes('img.youtube')
  );

  if (isExternal) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — content unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
