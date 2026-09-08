const CACHE_NAME = 'v1.8.6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Tucano-mini.png',
  'https://unpkg.com/html5-qrcode'
];

// 1. Instalação: Salva os arquivos no cache e força a ativação imediata
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // Força o novo SW a assumir imediatamente
  );
});

// 2. Ativação: Limpa caches antigos automaticamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Assume o controle das páginas abertas
  );
});

// 3. Interceptação de requisições (Cache First com fallback para Rede)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
