// Service Worker de Panderito PWA — cache del app shell para funcionar sin internet.
// Estrategia: cache-first para los archivos propios (la app es offline-first; los datos
// viven en el dispositivo con localStorage, no dependen de la red).

const CACHE = 'panderito-pwa-v3';
const ASSETS = [
  './',
  './index.html',
  './css/estilos.css',
  './js/datos.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/panderito-icon.svg',
  './icons/panderito-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cacheado) => {
      if (cacheado) return cacheado;
      return fetch(req)
        .then((resp) => {
          // Guarda una copia de lo que se pida en tiempo de ejecución (mismo origen).
          if (resp && resp.status === 200 && req.url.startsWith(self.location.origin)) {
            const copia = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copia));
          }
          return resp;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
