// Grünschmiede – Service Worker
// Macht die Seite auf Android als echte App installierbar und zeigt ohne
// Netz eine Hinweisseite statt der Browser-Fehlermeldung.
// Daten (API) werden bewusst NICHT zwischengespeichert: es gilt immer der aktuelle Stand.
const VERSION = "gs-v1";
const OFFLINE = "/offline.html";
const VORAB = [OFFLINE, "/logo.png", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(VORAB)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Seitenaufrufe: immer frisch vom Server, ohne Netz die Offline-Seite
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  // Unveränderliche App-Dateien (Schrift, Skripte, Styles): einmal laden, dann aus dem Speicher
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.open(VERSION).then((c) =>
        c.match(req).then((treffer) => treffer || fetch(req).then((antwort) => {
          if (antwort.ok) c.put(req, antwort.clone());
          return antwort;
        }))
      )
    );
  }
});
