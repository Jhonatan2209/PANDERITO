// ============================================================
// Service Worker de Panderito PWA — cache del "app shell" para
// que la app funcione SIN internet.
//
// Estrategia: cache-first para los archivos propios (la app es
// offline-first; los datos del usuario viven en el dispositivo
// con localStorage, no dependen de la red).
//
// INSTRUCCIONES DE MANTENIMIENTO:
// - Si cambias cualquier archivo de la app (js, css, html, íconos),
//   sube la versión de CACHE (v5 → v6) para que los usuarios
//   reciban la versión nueva; el evento "activate" borra las cachés viejas.
//   Sube TAMBIÉN `VERSION` en js/app.js (mismo número) y escribe las
//   NOVEDADES: el Inicio se las muestra al usuario una vez por versión.
// - Si agregas un archivo nuevo al proyecto, inclúyelo en ASSETS.
// - El SW solo se registra sobre HTTPS o sobre http://localhost.
// ============================================================

const CACHE = 'panderito-pwa-v6';           // nombre + versión de la caché actual
const ASSETS = [                             // "app shell": todo lo necesario para arrancar sin red
  './',
  './index.html',
  './css/estilos.css',
  './js/datos.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/panderito-icon.svg',
  './icons/panderito-maskable.svg',
];

// install: se dispara al instalar el SW por primera vez (o al cambiar este archivo).
// Descarga y guarda en caché todos los ASSETS. skipWaiting() activa el SW nuevo
// de inmediato sin esperar a que se cierren las pestañas abiertas.
self.addEventListener('install', (event) => {
  event.waitUntil(
    // cache:'reload' salta la caché HTTP del navegador: garantiza que la versión
    // nueva del SW guarde archivos frescos y no copias viejas del navegador.
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())
  );
});

// activate: limpia cachés de versiones anteriores (todo lo que no sea CACHE actual)
// y toma control de las pestañas ya abiertas con clients.claim().
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    ).then(() => self.clients.claim())
  );
});

// fetch: intercepta cada petición GET de la página.
// 1) Si el recurso está en caché → lo devuelve al instante (cache-first, funciona offline).
// 2) Si no está → lo pide a la red y guarda una copia (solo recursos del mismo origen).
// 3) Si no hay red y no está en caché → devuelve index.html como respaldo (la SPA resuelve la ruta).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // no interferir con POST u otros métodos

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
