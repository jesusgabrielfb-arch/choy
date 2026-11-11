// Memoria de los avisos (almacén privado de Vercel Blob) y envío de notificaciones push.
import { put, get } from '@vercel/blob';
import webpush from 'web-push';

const SUBS = 'avisos/suscripciones.json';
const STATE = 'avisos/estado.json';

export async function readJSON(path, fallback) {
  try {
    const r = await get(path, { access: 'private', useCache: false });
    if (!r?.stream) return fallback;
    return await new Response(r.stream).json();
  } catch {
    return fallback;
  }
}

export function writeJSON(path, data) {
  return put(path, JSON.stringify(data), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
  });
}

export const getSubs = () => readJSON(SUBS, []);
export const saveSubs = (subs) => writeJSON(SUBS, subs);
export const getState = () => readJSON(STATE, null);
export const saveState = (state) => writeJSON(STATE, state);

/** Envía la notificación a todos los dispositivos suscritos y olvida los que ya no existen. */
export async function notifyAll(payload) {
  webpush.setVapidDetails('mailto:avisos@en-la-puerta-del-horno.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const subs = await getSubs();
  const alive = [];
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 60 * 60 * 24, urgency: 'high' });
      alive.push(sub);
      sent++;
    } catch (err) {
      if (![404, 410].includes(err.statusCode)) alive.push(sub); // fallo pasajero: se conserva
    }
  }
  if (alive.length !== subs.length) await saveSubs(alive);
  return { sent, total: subs.length };
}
