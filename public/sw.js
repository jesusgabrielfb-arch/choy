// Service worker: muestra las notificaciones de notas nuevas y abre la página al tocarlas.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || 'En la puerta del horno', {
    body: data.body || 'Hay novedades en tus notas.',
    icon: '/icon-192.png?v=2',
    badge: '/icon-192.png?v=2',
    tag: data.tag || undefined,
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { c.navigate?.(url); return c.focus(); }
    }
    return self.clients.openWindow(url);
  })());
});
