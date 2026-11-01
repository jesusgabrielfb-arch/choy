// Guardado en el almacenamiento privado de Vercel (Blob). Solo lo usan las funciones del servidor.
import { put, get, list, del } from '@vercel/blob';
import webpush from 'web-push';

export async function leerJSON(ruta) {
  try {
    const r = await get(ruta, { access: 'private', useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch {
    return null;
  }
}

export async function guardarJSON(ruta, datos, { sobrescribir = true } = {}) {
  await put(ruta, JSON.stringify(datos), {
    access: 'private', addRandomSuffix: false, allowOverwrite: sobrescribir, contentType: 'application/json',
  });
}

export async function listar(prefijo) {
  const res = [];
  let cursor;
  do {
    const r = await list({ prefix: prefijo, cursor, limit: 1000 });
    res.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return res;
}

export const borrar = (ruta) => del(ruta).catch(() => {});

/** Llaves para firmar las notificaciones: se crean una sola vez y quedan guardadas en privado. */
export async function llaves() {
  let k = await leerJSON('config/vapid.json');
  if (k?.publicKey && k?.privateKey) return k;
  const nuevas = webpush.generateVAPIDKeys();
  try {
    await guardarJSON('config/vapid.json', nuevas, { sobrescribir: false });
    return nuevas;
  } catch {
    k = await leerJSON('config/vapid.json');
    return k || nuevas;
  }
}

/** Nombre de archivo estable para una suscripción. */
export async function claveSuscripcion(endpoint) {
  const datos = new TextEncoder().encode(endpoint);
  const hash = await crypto.subtle.digest('SHA-256', datos);
  return 'subs/' + [...new Uint8Array(hash)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('') + '.json';
}

// Solo servicios de notificaciones conocidos (evita que alguien nos haga llamar a otras direcciones).
const SERVICIOS = [/\.googleapis\.com$/, /\.mozilla\.com$/, /push\.apple\.com$/, /\.notify\.windows\.com$/, /\.push\.services\.mozilla\.com$/];
export function endpointValido(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && SERVICIOS.some((r) => r.test(u.hostname));
  } catch {
    return false;
  }
}

export async function leerCuerpo(req, max = 20_000) {
  if (req.body && typeof req.body === 'object') return req.body;
  let texto = '';
  for await (const parte of req) {
    texto += parte;
    if (texto.length > max) throw new Error('Demasiado grande');
  }
  return texto ? JSON.parse(texto) : {};
}

export function responder(res, estado, datos) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(datos));
}
