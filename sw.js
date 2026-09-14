const CACHE_NAME = 'qso-logbook-pwa-v2.6-6';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './anatel-databank.js',
  './theme-coherence.js',
  './icons/icon-64.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

function patchIndex(html) {
  const tags = [];
  if (!html.includes('id="anatel-databank-runtime"')) tags.push('<script id="anatel-databank-runtime" src="./anatel-databank.js?v=2.6-5"></script>');
  if (!html.includes('id="theme-coherence-runtime"')) tags.push('<script id="theme-coherence-runtime" src="./theme-coherence.js?v=2.6-5"></script>');
  if (!tags.length) return html;
  const inject = tags.join('');
  return html.includes('</body>') ? html.replace('</body>', inject + '</body>') : html + inject;
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
      caches.open(CACHE_NAME).then(cache => cache.put('./index.html', patched.clone()));
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
