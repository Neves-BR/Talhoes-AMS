const CACHE_NAME = 'v0.9.4.0.4';
const DEVELOPER = 'Guilherme Neves';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Tucano-mini.png',
  './sw.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// 1. Instalação: Salva os arquivos estáticos essenciais no cache inicial
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
      ASSETS.map((url) =>
        cache.add(url).catch((err) => console.warn('Falha ao cachear:', url, err))
      )
    );
    await self.skipWaiting(); // Força o novo SW a assumir imediatamente
  })());
});

// 2. Ativação: Limpa caches antigos de versões anteriores
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

// 3. Interceptação de requisições: Cache First + Gravação Dinâmica de novos mapas
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      // 1. Verifica se a imagem/recurso já está gravado no cache
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Se não estiver no cache, busca na rede e salva no cache dinamicamente
      try {
        const networkResponse = await fetch(event.request);

        // Se for uma resposta válida (ex: 200 OK para o novo mapa .jpg), grava no cache
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        // 3. Se estiver offline e for navegação de página, retorna o index.html principal
        if (event.request.mode === 'navigate') {
          return await caches.match('./index.html');
        }
      }
    })()
  );
});
