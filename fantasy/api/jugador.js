// Función de Vercel: registro de juego de un jugador (semana por semana, hecho y proyectado).
//   /api/jugador?id=4046&temporada=2026
import { registroJugador } from './_lib/sleeper.js';

export default async function handler(req, res) {
  const q = new URL(req.url, 'http://x').searchParams;
  const id = q.get('id') || '';
  const temporada = q.get('temporada') || '';
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!/^[A-Z0-9]{1,8}$/i.test(id) || !/^\d{4}$/.test(temporada)) {
    res.statusCode = 400;
    return res.end('{"error":"Parámetros no válidos"}');
  }
  try {
    const semanas = await registroJugador(id, temporada);
    res.statusCode = 200;
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    res.end(JSON.stringify({ id, temporada, semanas }));
  } catch (e) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: e.message }));
  }
}
