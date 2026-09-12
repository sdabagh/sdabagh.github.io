const CACHE = "sww-v3";
const FILES = ["./", "./index.html", "./app.js", "./stats.js", "./manifest.json", "./icon-192.png", "./icon-512.png", "./vendor/jstat.min.js", "./vendor/plotly-cartesian.min.js",
  "./data/STATC1000_Class_Data.csv", "./data/STATC1000_Sleep_Followup.csv", "./data/Dataset1_Finch_Beaks.csv", "./data/Dataset4_Global_Health.csv", "./data/popp_calls_for_service.csv", "./data/popp_academy_fitness.csv", "./data/popp_community_survey.csv", "./data/STATC1000_Class_Data_Exam1.csv"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => { e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request))); });
