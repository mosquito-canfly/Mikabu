// Minimal app-shell cache. Same-origin GET requests are served
// stale-while-revalidate: whatever's cached is returned immediately (so the
// app can open offline once something has been visited before), while a
// fresh copy is fetched in the background to keep the cache current.
//
// /api/* is never touched here — chat replies, study tools, and the health
// check must always hit the network, and a cached AI reply would be wrong.
const CACHE_NAME = "mikabu-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);

      return cached ?? networkFetch;
    })
  );
});
