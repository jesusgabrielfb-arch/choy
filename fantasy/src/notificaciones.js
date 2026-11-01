// Notificaciones de Cody (Web Push, gratis). En iPhone solo funcionan con la app agregada a la pantalla de inicio.
import { leerCache, guardarCache } from './datos/http.js';

export const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
export const instalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

export function soporte() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return esIOS() && !instalada() ? 'instalar' : 'no';
  }
  return 'si';
}

export function registrarServiceWorker() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

export const preferencias = () => leerCache('avisos') || { activo: false, equipo: true, noticias: true };

function aBytes(base64) {
  const b = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
}

async function suscripcionActual() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/** Pide permiso, se suscribe y le dice al servidor de qué avisarte. */
export async function activar({ usuario, ligas, equipo = true, noticias = true }) {
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('permiso');
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publica } = await (await fetch('/api/suscribir')).json();
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(publica) });
  }
  const r = await fetch('/api/suscribir', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suscripcion: sub.toJSON(), usuario, ligas, opciones: { equipo, noticias } }),
  });
  if (!r.ok) throw new Error('servidor');
  guardarCache('avisos', { activo: true, equipo, noticias });
}

export async function desactivar() {
  const sub = await suscripcionActual().catch(() => null);
  if (sub) {
    await fetch('/api/suscribir', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suscripcion: sub.toJSON(), borrar: true }) }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
  guardarCache('avisos', { ...preferencias(), activo: false });
}
