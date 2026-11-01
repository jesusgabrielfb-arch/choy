// Service worker de Fantasy x Cody: muestra las notificaciones y abre la app al tocarlas.
const CACHE = 'fxc-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

// Lo que no cambia (código con nombre único, Cody en 3D, íconos, letras) se guarda en el teléfono:
// la segunda vez la app abre al instante. La página y los datos siempre se piden frescos.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const fijo = url.pathname.startsWith('/assets/') || url.pathname === '/mascota.glb' || /^\/icono-.*\.png$/.test(url.pathname);
  if (fijo) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(e.request);
      if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    })());
  } else if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(e.request);
        (await caches.open(CACHE)).put('/', r.clone());
        return r;
      } catch {
        return (await caches.match('/')) || Response.error();
      }
    })());
  }
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { cuerpo: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Cody tiene algo para ti 🐛', {
    body: d.cuerpo || '',
    icon: '/icono-192.png',
    badge: '/icono-192.png',
    tag: d.tag,
    data: { url: d.url || '/' },
    lang: 'es',
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || '/', self.location.origin).href;
  e.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const v of ventanas) {
      if (new URL(v.url).origin === self.location.origin) {
        await v.focus();
        return v.navigate(url);
      }
    }
    return self.clients.openWindow(url);
  })());
});
