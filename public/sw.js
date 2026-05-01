// RemindTogether service worker.
//
// Responsibilities:
//   1. Receive Web Push events and surface them as OS notifications.
//   2. Wire `notificationclick` to open / focus the right page in the app.
//   3. Stay out of the way of the network — caching is intentionally
//      minimal in v1; we let Next.js handle freshness and only cache the
//      offline shell. Phase 9 may add a richer offline strategy.
//
// We don't import Workbox; the surface here is small enough that hand-
// rolling keeps the bundle tiny.

const CACHE = "rt-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => {
        /* network may be flaky on first install; ignore */
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "RemindTogether", body: event.data.text() || "" };
  }
  const { title = "RemindTogether", body = "", url, tag, data } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      tag,
      data: { url: url || "/app", ...(data || {}) },
      // Don't vibrate aggressively — encouragement, not alarm.
      vibrate: [80, 40, 80],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/app";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Focus an existing tab on the same origin if possible.
      for (const client of allClients) {
        if ("focus" in client) {
          try {
            await client.focus();
            // Best-effort navigation if the page differs.
            if ("navigate" in client) {
              try {
                await client.navigate(target);
              } catch {
                /* not all browsers permit cross-page navigate */
              }
            }
            return;
          } catch {
            /* keep trying others */
          }
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
