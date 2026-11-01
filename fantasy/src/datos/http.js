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

// Lo que nunca se borra para hacer espacio (tus preferencias)
const FIJAS = new Set(['sesion', 'equipoFavorito', 'avisos', 'analistas']);

/** Si el teléfono se queda sin espacio, borra lo más viejo de la caché y vuelve a intentar. */
function hacerEspacio(necesario) {
  const items = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(PREFIJO) || FIJAS.has(k.slice(PREFIJO.length))) continue;
    try {
      items.push({ k, t: JSON.parse(localStorage.getItem(k)).t || 0, n: localStorage.getItem(k).length });
    } catch {
      items.push({ k, t: 0, n: 0 });
    }
  }
  items.sort((a, b) => a.t - b.t);
  let liberado = 0;
  for (const it of items) {
    localStorage.removeItem(it.k);
    liberado += it.n;
    if (liberado > necesario * 1.2) break;
  }
}

export function guardarCache(clave, valor) {
  const texto = JSON.stringify({ t: Date.now(), v: valor });
  try {
    localStorage.setItem(PREFIJO + clave, texto);
  } catch {
    try {
      hacerEspacio(texto.length);
      localStorage.setItem(PREFIJO + clave, texto);
    } catch {
      // modo privado o dato muy grande: se sigue sin caché
    }
  }
}

/** Pasa por nuestra función /api/proxy (para fuentes sin CORS). */
export const viaProxy = (url) => `/api/proxy?u=${encodeURIComponent(url)}`;

const enCurso = new Map();

// Cuando tocas ↻ Actualizar, todo se pide de nuevo (sin caché del teléfono ni de Vercel).
let fresco = 0;
export const estaFresco = () => fresco > 0;
export async function sinCache(fn) {
  fresco++;
  try {
    return await fn();
  } finally {
    fresco--;
  }
}

export async function pedirJSON(url, { clave, ttl = 0, proxy = false } = {}) {
  if (clave && ttl && !fresco) {
    const c = leerCache(clave, ttl);
    if (c !== null) return c;
  }
  let destino = proxy ? viaProxy(url) : url;
  if (fresco && destino.startsWith('/api/')) destino += `${destino.includes('?') ? '&' : '?'}_=${Date.now()}`;
  if (enCurso.has(destino)) return enCurso.get(destino);
  const p = (async () => {
    const r = await fetch(destino, fresco ? { cache: 'no-store' } : undefined);
    if (!r.ok) throw new Error(`Error ${r.status} al leer ${url.split('?')[0]}`);
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
