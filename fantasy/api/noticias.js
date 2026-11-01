// Función de Vercel: junta noticias de la NFL de varios feeds RSS gratis y las devuelve
// ordenadas por fecha. Los feeds en español van primero; los que están en inglés se marcan
// para que la app los traduzca en el teléfono.
import { leerFeed } from '../src/datos/rss.js';

export const FEEDS = [
  { nombre: 'ESPN Deportes', url: 'https://espndeportes.espn.com/espn/rss/nfl/news', idioma: 'es' },
  { nombre: 'ESPN', url: 'https://www.espn.com/espn/rss/nfl/news', idioma: 'en' },
  { nombre: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/nfl/', idioma: 'en' },
  { nombre: 'RotoWire', url: 'https://www.rotowire.com/rss/news.php?sport=NFL', idioma: 'en' },
  { nombre: 'Yahoo Sports', url: 'https://sports.yahoo.com/nfl/rss/', idioma: 'en' },
];

export default async function handler(req, res) {
  const resultados = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const ctrl = AbortSignal.timeout(8000);
      const r = await fetch(f.url, { signal: ctrl, headers: { 'User-Agent': 'fantasy-gusano/0.1' } });
      if (!r.ok) throw new Error(`${f.nombre}: ${r.status}`);
      return leerFeed(await r.text(), f.nombre).map((n) => ({ ...n, idioma: f.idioma }));
    }),
  );
  const noticias = [];
  const fallaron = [];
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') noticias.push(...r.value);
    else fallaron.push(FEEDS[i].nombre);
  });
  const vistos = new Set();
  const unicas = noticias
    .sort((a, b) => b.fecha - a.fecha)
    .filter((n) => {
      const k = n.titulo.toLowerCase();
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    })
    .slice(0, 150);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.end(JSON.stringify({ noticias: unicas, fallaron, actualizado: Date.now() }));
}
