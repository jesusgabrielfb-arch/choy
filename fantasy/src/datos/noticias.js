// Noticias en español: feeds en español primero y los que vienen en inglés se traducen en el
// mismo teléfono con el traductor del navegador (gratis, sin enviar nada a otro servidor).
import { pedirJSON, leerCache, guardarCache, MINUTO, viaProxy } from './http.js';

export async function noticias() {
  return pedirJSON('/api/noticias', { clave: 'noticias', ttl: 10 * MINUTO });
}

let traductor = null;
let traductorListo = null;

export function puedeTraducir() {
  return typeof self !== 'undefined' && 'Translator' in self;
}

async function obtenerTraductor() {
  if (traductor) return traductor;
  if (!puedeTraducir()) return null;
  traductorListo ??= (async () => {
    try {
      const disp = await self.Translator.availability({ sourceLanguage: 'en', targetLanguage: 'es' });
      if (disp === 'unavailable') return null;
      traductor = await self.Translator.create({ sourceLanguage: 'en', targetLanguage: 'es' });
      return traductor;
    } catch {
      return null;
    }
  })();
  return traductorListo;
}

/** Traduce al español (con caché). Si no se puede, devuelve null. */
export async function traducir(texto) {
  if (!texto) return texto;
  const clave = 'tr:' + texto.slice(0, 120);
  const c = leerCache(clave, 7 * 24 * 60 * MINUTO);
  if (c) return c;
  const t = await obtenerTraductor();
  if (!t) return null;
  try {
    const res = await t.translate(texto);
    guardarCache(clave, res);
    return res;
  } catch {
    return null;
  }
}

export const enlaceTraductor = (url) =>
  `https://translate.google.com/translate?sl=auto&tl=es&u=${encodeURIComponent(url)}`;

/** Une cada noticia con los jugadores que menciona. */
export function marcarJugadores(lista, jugadoresPorNombre) {
  return lista.map((n) => {
    const texto = `${n.titulo} ${n.resumen}`;
    const ids = [];
    for (const [nombre, id] of jugadoresPorNombre) {
      if (texto.includes(nombre)) ids.push(id);
    }
    return { ...n, jugadores: ids };
  });
}

// ---------- Analistas en Bluesky (red social abierta, API gratis) ----------
const BSKY = 'https://public.api.bsky.app/xrpc';

export function analistasGuardados() {
  return leerCache('analistas') || [];
}

export function guardarAnalistas(lista) {
  guardarCache('analistas', [...new Set(lista)]);
}

export async function buscarAnalistas(texto = 'fantasy football') {
  const d = await pedirJSON(`${BSKY}/app.bsky.actor.searchActors?q=${encodeURIComponent(texto)}&limit=25`,
    { proxy: true });
  return (d.actors || []).map((a) => ({
    handle: a.handle, nombre: a.displayName || a.handle, foto: a.avatar || null,
    descripcion: a.description || '',
  }));
}

export async function publicacionesAnalista(handle) {
  const d = await pedirJSON(
    `${BSKY}/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=15&filter=posts_no_replies`,
    { clave: `bsky:${handle}`, ttl: 10 * MINUTO, proxy: true },
  );
  return (d.feed || []).map(({ post }) => ({
    titulo: post.record?.text || '',
    enlace: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
    fecha: Date.parse(post.record?.createdAt) || 0,
    fuente: post.author.displayName || post.author.handle,
    idioma: (post.record?.langs || ['en'])[0]?.startsWith('es') ? 'es' : 'en',
    resumen: '',
  }));
}

export { viaProxy };
