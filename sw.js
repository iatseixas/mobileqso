const CACHE_NAME = 'qso-logbook-pwa-v2.6-16';
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

const DATABANK_WINDOW_STYLE = '<style id="qso-databank-window-fix">\n'
  + '#qsoFreqPicker[open],#qsoRadioPicker[open]{display:grid!important;grid-template-rows:auto minmax(0,1fr);height:min(48dvh,390px)!important;max-height:min(48dvh,390px)!important;overflow:hidden!important}\n'
  + '#qsoFreqPicker[open]>.inline-picker-body,#qsoRadioPicker[open]>.inline-picker-body{min-height:0;display:flex;flex-direction:column;overflow:hidden;padding:0 11px 11px}\n'
  + '#qsoFreqPicker[open] .searchbox,#qsoRadioPicker[open] .searchbox{flex:0 0 auto;position:static!important;margin-top:10px}\n'
  + '#qsoFreqPicker[open] .radio-picker-results,#qsoRadioPicker[open] .radio-picker-results{flex:1 1 auto;min-height:0;max-height:none!important;overflow-y:auto!important;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding-bottom:4px}\n'
  + '#qsoFreqPicker[open] .inline-picker-body>.row,#qsoRadioPicker[open] .inline-picker-body>.row{flex:0 0 auto}\n'
  + '#qsoFreqPicker[open] .radio-picker-results::-webkit-scrollbar,#qsoRadioPicker[open] .radio-picker-results::-webkit-scrollbar{width:6px}\n'
  + '#qsoFreqPicker[open] .radio-picker-results::-webkit-scrollbar-thumb,#qsoRadioPicker[open] .radio-picker-results::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--muted) 58%,transparent);border-radius:999px}\n'
  + '@media (min-width:768px){#qsoFreqPicker[open],#qsoRadioPicker[open]{height:min(55dvh,460px)!important;max-height:min(55dvh,460px)!important}}\n'
  + '</style>';

function patchIndex(html) {
  const tags = [];
  if (!html.includes('id="qso-databank-window-fix"')) tags.push(DATABANK_WINDOW_STYLE);
  if (!html.includes('id="anatel-databank-runtime"')) tags.push('<script id="anatel-databank-runtime" src="./anatel-databank.js?v=2.6-5"></script>');

  // Sempre substitui a referência anterior para garantir que a PWA carregue
  // o script visual mais recente, mesmo quando o HTML já tinha a tag antiga.
  html = html.replace(/<script\b[^>]*theme-coherence\.js[^>]*><\/script>/gi, '');
  tags.push('<script id="theme-coherence-runtime" src="./theme-coherence.js?v=2.6-11"></script>');

  const inject = tags.join('');
  return html.includes('</body>') ? html.replace('</body>', inject + '</body>') : html + inject;
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    await Promise.all(windows.map(async client => {
      try { await client.navigate(client.url); } catch (_) {}
    }));
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(async resp => {
      const html = patchIndex(await resp.text());
      const headers = new Headers(resp.headers);
      headers.delete('content-length');
      const patched = new Response(html, {status: resp.status, statusText: resp.statusText, headers});
      caches.open(CACHE_NAME).then(cache => cache.put('./index.html', patched.clone()));
      return patched;
    }).catch(() => caches.match('./index.html').then(async resp => {
      if (!resp) return caches.match('./');
      const html = patchIndex(await resp.text());
      const headers = new Headers(resp.headers);
      headers.delete('content-length');
      return new Response(html, {status: resp.status, statusText: resp.statusText, headers});
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
