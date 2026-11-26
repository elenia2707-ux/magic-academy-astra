const CACHE_NAME = 'astra-academy-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './apple-touch-icon.png',
  './icon-512.png',
  './art/heroes/flame_female.webp',
  './art/heroes/flame_male.webp',
  './art/heroes/frost_female.webp',
  './art/heroes/frost_male.webp',
  './art/heroes/thunder_female.webp',
  './art/heroes/thunder_male.webp',
  './art/heroes/earth_female.webp',
  './art/heroes/earth_male.webp',
  './art/familiars/raven.webp',
  './art/familiars/golem.webp',
  './art/familiars/wisp.webp',
  './art/familiars/wolf.webp',
  './art/familiars/owl.webp',
  './art/familiars/bat.webp',
  './art/bosses/boss_golem.webp',
  './art/bosses/boss_wraith.webp',
  './art/bosses/boss_witch.webp',
  './art/bosses/boss_knight.webp',
  './art/bosses/boss_demon.webp',
  './art/bosses/demon_lord.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
