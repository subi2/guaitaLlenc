// guaitaLlenç · service worker (v0.13.2) — ús sense connexió
// Guaita Apps · SPDX-License-Identifier: AGPL-3.0-only · © 2026 SBS BiM Consulting, Jordi Subirós
const CACHE = 'guaitallenc-0.13.2';
const SHELL = [
  './',
  './guaitaLlenc.html',
  './manifest.webmanifest',
  './HLP%20guaitaLlenc-ajuda.html',
  '../icons/icon.svg',
  '../icons/icon-192.png',
  '../icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('guaitallenc-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primer la memòria cau; si no hi és, la xarxa (i la guarda)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match('./guaitaLlenc.html')))
  );
});
