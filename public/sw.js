const CACHE_NAME = 'astra-academy-v15';
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
  './art/heroes/aw_flame_female.webp',
  './art/heroes/aw_thunder_female.webp',
  './art/heroes/aw_frost_female.webp',
  './art/heroes/aw_earth_female.webp',
  './art/heroes/aw_flame_male.webp',
  './art/heroes/aw_thunder_male.webp',
  './art/heroes/aw_frost_male.webp',
  './art/heroes/aw_earth_male.webp',
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
  './art/bosses/exam_1_kalion.webp',
  './art/bosses/exam_2_malaki.webp',
  './art/bosses/exam_3_isolde.webp',
  './art/bosses/exam_4_vesper.webp',
  './art/bosses/exam_5_astien.webp',
  './art/npcs/bernard.webp',
  './art/npcs/lucia.webp',
  './art/npcs/karen.webp',
  './art/npcs/sebastian.webp',
  './art/npcs/volta.webp',
  './art/npcs/morden.webp',
  './art/npcs/irene.webp',
  './art/npcs/seraphina.webp',
  './art/npcs/martha.webp',
  './art/monsters/m1_1_slime.webp',
  './art/monsters/m1_2_bats.webp',
  './art/monsters/m1_3_kobold.webp',
  './art/monsters/m1_4_guardian.webp',
  './art/monsters/m2_1_parchment.webp',
  './art/monsters/m2_2_candelabra.webp',
  './art/monsters/m2_3_apprentice.webp',
  './art/monsters/m2_4_warden.webp',
  './art/monsters/m3_1_thorn.webp',
  './art/monsters/m3_2_flame.webp',
  './art/monsters/m3_3_wolf.webp',
  './art/monsters/m3_4_gargoyle.webp',
  './art/monsters/m4_1_infantry.webp',
  './art/monsters/m4_2_alchemist.webp',
  './art/monsters/m4_3_knight.webp',
  './art/monsters/m4_4_lich.webp',
  './art/monsters/m5_1_hound.webp',
  './art/monsters/m5_2_eye.webp',
  './art/monsters/m5_3_giant.webp',
  './art/monsters/m5_4_apostle.webp',
  './art/monsters/m6_1_obsidian_knight.webp',
  './art/monsters/m6_2_wyrm.webp',
  './art/monsters/m6_3_priest.webp',
  './art/monsters/m6_4_orthrus.webp',
  './audio/bgm_academy.mp3',
  './audio/bgm_battle.mp3',
  './audio/bgm_boss.mp3',
  './art/backgrounds/act_1.webp',
  './art/backgrounds/act_2.webp',
  './art/backgrounds/act_3.webp',
  './art/backgrounds/act_4.webp',
  './art/backgrounds/act_5.webp',
  './art/backgrounds/act_6.webp',
  './art/gear/staff_0.webp',
  './art/gear/staff_1.webp',
  './art/gear/staff_2.webp',
  './art/gear/staff_3.webp',
  './art/gear/robe_0.webp',
  './art/gear/robe_1.webp',
  './art/gear/robe_2.webp',
  './art/gear/robe_3.webp',
  './art/gear/grimoire_0.webp',
  './art/gear/grimoire_1.webp',
  './art/gear/grimoire_2.webp',
  './art/gear/grimoire_3.webp',
  './art/gear/relic_0.webp',
  './art/gear/relic_1.webp',
  './art/gear/relic_2.webp',
  './art/gear/relic_3.webp',
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
