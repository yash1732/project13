self.addEventListener('install', (e) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
  // Just pass the request through (no offline caching for now)
  // This is enough to trick Chrome into thinking it's an App
});