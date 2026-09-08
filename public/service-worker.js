const CACHE = 'jardin-de-jade-v3';
const ROOT = new URL('./', self.registration.scope).href;
const CORE = [
  ROOT,
  new URL('manifest.webmanifest', ROOT).href,
  new URL('favicon.svg', ROOT).href,
  new URL('icon-192.png', ROOT).href,
  new URL('icon-512.png', ROOT).href,
  new URL('apple-touch-icon.png', ROOT).href,
  new URL('art/garden.png', ROOT).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(CORE);
      const page = await fetch(ROOT);
      const html = await page.clone().text();
      await cache.put(ROOT, page);
      const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
        .map((match) => new URL(match[1], ROOT))
        .filter((url) => url.origin === self.location.origin)
        .map((url) => url.href);
      await Promise.allSettled(
        [...new Set(assets)].map((url) => cache.add(url)),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE).then((cache) => cache.put(event.request, copy)),
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match(ROOT);
        return Response.error();
      }),
  );
});
