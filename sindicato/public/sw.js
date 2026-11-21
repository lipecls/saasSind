// Service worker do app do sindicato.
// Regra de privacidade: páginas e dados (filiados, financeiro…) NUNCA são guardados no aparelho.
// Só ficam em cache os arquivos estáticos do app (JS/CSS com hash, ícones) e a página "sem conexão".
const VERSAO = 'v3';
const CACHE = `sindgestao-${VERSAO}`;
const OFFLINE = '/offline.html';
const PRECACHE = [OFFLINE, '/icones/icone-192.png', '/icones/icone-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith('sindgestao-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: sempre pela rede; sem conexão, mostra a página offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  // Arquivos estáticos imutáveis (nome com hash) e ícones: cache primeiro.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icones/')) {
    e.respondWith(
      caches.match(req).then(
        (salvo) =>
          salvo ||
          fetch(req).then((resp) => {
            if (resp.ok) {
              const copia = resp.clone();
              caches.open(CACHE).then((c) => c.put(req, copia));
            }
            return resp;
          }),
      ),
    );
  }
  // Demais requisições (dados, ações): direto pela rede, sem cache.
});
