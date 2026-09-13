const CACHE_NAME = 'qso-mobile-pwa-v2.5-1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-64.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

function patchIndex(html) {
  return html
    .replace('.brand{font-size:25px;font-weight:800;letter-spacing:-.3px}', '.brand{font-size:clamp(20px,5.8vw,25px);font-weight:800;letter-spacing:-.3px;white-space:nowrap}')
    .replace('<div class="brand">QSO MOBILE</div><div class="version">Homologação v2.4 • offline-first</div>', '<div class="brand">MOBILE QSO</div><div class="version" id="headerMeta">46.112 indicativos • offline-first</div>')
    .replace('<div class="status-pill" id="dbStatus">Carregando base…</div>', '<div class="status-pill" id="dbStatus">PP5KHZ</div>')
    .replace("function setStatus(){const pill=$('#dbStatus');pill.textContent=`Offline • ${HAM_DB.length.toLocaleString('pt-BR')} indicativos`;}", "function setStatus(){const pill=$('#dbStatus');if(pill)pill.textContent='PP5KHZ';const meta=document.getElementById('headerMeta')||document.querySelector('.version');if(meta)meta.textContent=`${HAM_DB.length.toLocaleString('pt-BR')} indicativos • offline-first`;}");
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('qso-mobile-pwa-') && k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(async resp => {
      const html = patchIndex(await resp.text());
      const patched = new Response(html, {status: resp.status, statusText: resp.statusText, headers: resp.headers});
      const copy = patched.clone();
      caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
      return patched;
    }).catch(() => caches.match('./index.html').then(async resp => {
      if (!resp) return caches.match('./');
      const html = patchIndex(await resp.text());
      return new Response(html, {status: resp.status, statusText: resp.statusText, headers: resp.headers});
    })));
    return;
  }

  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(resp => {
    if (resp && resp.status === 200 && resp.type === 'basic') {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
    }
    return resp;
  })));
});
