// Notificaciones push: este dispositivo se suscribe y la revisión de cada hora le avisa de notas nuevas.
import { getPin } from './sync.js';

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

const b64ToBytes = (b64) => {
  const s = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
};

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

/** ¿Ya están activas en este dispositivo? */
export async function notificationsOn() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    return !!(await reg?.pushManager?.getSubscription()) && Notification.permission === 'granted';
  } catch { return false; }
}

/**
 * Pide permiso y suscribe el dispositivo. Devuelve { ok } o { ok:false, reason, message }.
 * En iPad/iPhone solo funciona desde la app agregada a la pantalla de inicio.
 */
export async function enableNotifications() {
  if (!getPin()) return { ok: false, reason: 'pin', message: 'Primero conecta SEDUCA con tu PIN (menú ⋯).' };
  if (isIOS() && !isStandalone()) {
    return { ok: false, reason: 'ios', message: 'En iPad, abre la página desde el ícono de la pantalla de inicio (Compartir → Agregar a pantalla de inicio) y activa las notificaciones desde ahí.' };
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { ok: false, reason: 'unsupported', message: 'Este navegador no permite notificaciones. Prueba desde Safari con la app en la pantalla de inicio.' };
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied', message: 'No diste permiso. Puedes activarlo en Ajustes → Notificaciones → En la puerta del horno.' };
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const { publicKey } = await fetch('/api/suscribir').then((r) => r.json());
  if (!publicKey) return { ok: false, reason: 'server', message: 'Falta configurar las notificaciones en el servidor.' };
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
  const r = await fetch('/api/suscribir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: getPin(), subscription: sub.toJSON() }),
  }).then((x) => x.json());
  return r.ok ? { ok: true } : { ok: false, reason: 'server', message: r.error || 'No se pudo guardar la suscripción.' };
}
