// AED Finder service worker.
//
// - App shell, static assets and icons: cache-first (Next fingerprints them).
// - Pages and /api/aeds: network-first, falling back to the last copy, so the
//   map and every AED already loaded keep working with no signal.
// - Never cached: admin, auth, submissions, search, anything non-GET.
// - Map tiles are left to the browser's own HTTP cache (OSM tile policy).

const VERSION = "v1";
const STATIC_CACHE = `aed-static-${VERSION}`;
const PAGES_CACHE = `aed-pages-${VERSION}`;
const DATA_CACHE = `aed-data-${VERSION}`;
const PRECACHE = ["/", "/offline", "/about", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith("aed-") && !k.endsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function neverCache(url) {
  return (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/search") ||
    url.pathname.startsWith("/api/submissions") ||
    url.pathname.startsWith("/api/health")
  );
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || neverCache(url)) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.pathname === "/api/aeds" || url.pathname.startsWith("/photos/")) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES_CACHE, "/offline"));
    return;
  }
  // RSC payloads for client-side navigation between cached pages.
  if (request.headers.get("RSC") === "1") {
    event.respondWith(networkFirst(request, PAGES_CACHE));
  }
});
