const CACHE = 'voice-assistant-v1';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.add('./')).catch(() => {}));
});
self.addEventListener('activate', e => {
  self.clients.claim();
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 只处理同源的应用外壳；对 Groq/Gemini/xAI 等跨域 API 请求不拦截，直接走网络
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request);
    const net = fetch(e.request).then(r => {
      if (r && r.status === 200) cache.put(e.request, r.clone()).catch(() => {});
      return r;
    }).catch(() => cached);
    return cached || net;   // 秒开：有缓存先返回，同时后台拉新（下次启动生效）
  }));
});
