// Función de Vercel: datos de Sleeper ya recortados y guardados en la caché de Vercel.
//   /api/datos?tipo=jugadores
//   /api/datos?tipo=proy&temporada=2026&semana=9
//   /api/datos?tipo=stats&temporada=2026&semana=8
import { jugadoresLivianos, semanaLiviana } from './_lib/sleeper.js';

export default async function handler(req, res) {
  const q = new URL(req.url, 'http://x').searchParams;
  const tipo = q.get('tipo');
  try {
    let datos;
    let cache = 3600;
    if (tipo === 'jugadores') {
      datos = await jugadoresLivianos();
      cache = 6 * 3600;
    } else if (tipo === 'proy' || tipo === 'stats') {
      const temporada = q.get('temporada');
      const semana = Number(q.get('semana'));
      if (!/^\d{4}$/.test(temporada || '') || !(semana >= 1 && semana <= 18)) throw new Error('Parámetros no válidos');
      datos = await semanaLiviana(tipo, temporada, semana);
      cache = tipo === 'proy' ? 1800 : (q.get('terminada') === '1' ? 7 * 24 * 3600 : 300);
    } else {
      res.statusCode = 400;
      return res.end('{"error":"tipo no válido"}');
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', `public, s-maxage=${cache}, stale-while-revalidate=${cache * 2}`);
    res.end(JSON.stringify(datos));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: e.message }));
  }
}
