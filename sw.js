// Service worker: guarda la app en el móvil para que funcione SIN internet.
// Estrategia "caché primero": abre siempre desde la copia local y, si hay
// conexión, actualiza la copia en segundo plano para la próxima vez.
const CACHE = "bateria-info-v10";
const FILES = ["./", "./index.html", "./manifest.json", "./icon.svg",
  "./fonts/Barlow-400.woff2", "./fonts/Barlow-500.woff2", "./fonts/Barlow-600.woff2",
  "./fonts/BarlowCondensed-600.woff2", "./fonts/BarlowCondensed-700.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const net = fetch(e.request)
        .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
        .catch(() => cached);
      return cached || net;
    })
  );
});
