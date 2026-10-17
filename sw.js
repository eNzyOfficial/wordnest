// Offline cache.
// App files: saved on install, network first so updates show straight away.
// Dictionary chunks (data/<id>/<build>/...): cache first, kept across app updates;
// the build id in the path changes whenever the data does.
// Bump VERSION whenever app files change so phones pick up the update.
const VERSION = 'wordnest-v1';
const DATA_CACHE = 'dict-data';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.json', 'sources.html',
  'js/core.js', 'js/data.js', 'js/search.js', 'js/speech.js', 'js/word.js', 'js/views.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'data/dicts.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== DATA_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const url = new URL(req.url);
  const isChunk = url.pathname.includes('/data/') && !url.pathname.endsWith('/dicts.json');
  e.respondWith(isChunk ? cacheFirst(req) : networkFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(DATA_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

// Network first with a short timeout so a weak connection does not make the app hang.
async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await Promise.race([
      fetch(req, { cache: 'no-cache' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true }))
      || (req.mode === 'navigate' ? await cache.match('index.html') : Response.error());
  }
}
