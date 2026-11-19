/* Factorio Workbench offline cache. Increment VERSION for every published release. */
const VERSION = 'v0.19.0';
const CACHE = 'factorio-workbench-' + VERSION;
const PREFIX = 'factorio-workbench-';
const BASE = new URL('./', self.location.href);
const PRECACHE = [
  './', './index.html', './manifest.webmanifest', './pwa-register.js',
  './icons/app-192.png', './icons/app-512.png', './icons/app-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE.map(path => new URL(path, BASE).href))));
  // Do not skipWaiting here: ask the user before swapping versions.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const req=event.request;
  if (req.method !== 'GET') return;
  const url=new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE.pathname)) return;
  event.respondWith((async () => {
    const cache=await caches.open(CACHE);
    const cached=await cache.match(req,{ignoreSearch:true});
    if (cached) return cached;
    try {
      return await fetch(req);
    } catch (error) {
      if (req.mode === 'navigate') {
        return (await cache.match(new URL('./index.html',BASE).href)) || Response.error();
      }
      return Response.error();
    }
  })());
});
