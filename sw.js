const CACHE = 'itrace-bank-v1';
const SHELL = [
  './', 'index.html', 'barclays-login.html', 'barclays-signup.html', 'barclays-dashboard.html',
  'itrace-theme.css', 'itrace-logo.svg', 'bank-db.js', 'manifest.json', 'icon-192.png', 'icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Network first: always fresh when online, saved copy when offline.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(event.request, copy));
      return res;
    }).catch(() => caches.match(event.request))
  );
});
