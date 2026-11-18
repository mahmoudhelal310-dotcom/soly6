/* سيرفس وركر بسيط: يخزّن الصفحة وملفات التطبيق محلياً حتى تعمل بسرعة، ويُحدَّث تلقائياً عند رفع نسخة جديدة */
const CACHE = 'rafeek-v1';
const CORE = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // لا نخزّن طلبات القرآن والأذاعات الخارجية
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchP = fetch(e.request).then((res) => {
        if (res && res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fetchP;
    })
  );
});
