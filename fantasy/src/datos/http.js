// Pedidos con caché en el teléfono (localStorage) para no repetir descargas.

const PREFIJO = 'fg:';

export function leerCache(clave, ttlMs) {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    if (!crudo) return null;
    const { t, v } = JSON.parse(crudo);
    if (ttlMs && Date.now() - t > ttlMs) return null;
    return v;
  } catch {
    return null;
  }
}

export function guardarCache(clave, valor) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify({ t: Date.now(), v: valor }));
  } catch {
    // sin espacio o modo privado: se sigue sin caché
  }
}

/** Pasa por nuestra función /api/proxy (para fuentes sin CORS). */
export const viaProxy = (url) => `/api/proxy?u=${encodeURIComponent(url)}`;

const enCurso = new Map();

export async function pedirJSON(url, { clave, ttl = 0, proxy = false } = {}) {
  if (clave && ttl) {
    const c = leerCache(clave, ttl);
    if (c !== null) return c;
  }
  const destino = proxy ? viaProxy(url) : url;
  if (enCurso.has(destino)) return enCurso.get(destino);
  const p = (async () => {
    const r = await fetch(destino);
    if (!r.ok) throw new Error(`Error ${r.status} al leer ${new URL(url).hostname}`);
    const datos = await r.json();
    if (clave) guardarCache(clave, datos);
    return datos;
  })();
  enCurso.set(destino, p);
  try {
    return await p;
  } finally {
    enCurso.delete(destino);
  }
}

export const MINUTO = 60_000;
export const HORA = 60 * MINUTO;
