// Función de Vercel: revisa a cada persona suscrita y le manda las notificaciones nuevas
// (lesiones y byes de sus titulares, puestos vacíos, byes de la semana que viene y noticias de sus jugadores).
// La llaman una tarea programada de Vercel (1 vez al día, gratis) y la de GitHub Actions (cada 30 min).
// No repite avisos: guarda las claves de lo que ya mandó.
import webpush from 'web-push';
import { llaves, leerJSON, guardarJSON, listar, borrar, responder } from './_lib/almacen.js';
import { juntarNoticias } from './noticias.js';
import { generarAvisos } from '../src/analisis/avisos.js';
import { leerPartidos, equiposEnBye } from '../src/datos/calendario.js';
import { jugadoresLivianos } from './_lib/sleeper.js';

const SLEEPER = 'https://api.sleeper.app/v1';
const SITIO = 'https://fantasy-x-cody.vercel.app';
const json = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': 'fantasy-x-cody/1.0' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

export default async function handler(req, res) {
  const inicio = Date.now();
  const forzar = new URL(req.url, 'http://x').searchParams.has('forzar');
  const ultima = await leerJSON('estado/ultima.json');
  if (!forzar && ultima?.t && inicio - ultima.t < 4 * 60_000) {
    return responder(res, 200, { ok: true, omitido: 'Se revisó hace menos de 4 minutos' });
  }
  await guardarJSON('estado/ultima.json', { t: inicio });

  const subs = await listar('subs/');
  if (!subs.length) return responder(res, 200, { ok: true, suscritos: 0 });

  const { publicKey, privateKey } = await llaves();
  webpush.setVapidDetails(SITIO, publicKey, privateKey);

  const estado = await json(`${SLEEPER}/state/nfl`);
  const semana = Math.max(1, estado.display_week || estado.week || 1);
  const temporada = estado.season;
  const espn = (w) => json(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${w}&dates=${temporada}`)
    .then(leerPartidos).catch(() => []);
  const [todos, partidos, partidosSig, noticias] = await Promise.all([
    jugadoresLivianos(),
    espn(semana), espn(semana + 1),
    juntarNoticias().then((r) => r.noticias).catch(() => []),
  ]);
  const jugadores = {};
  for (const [id, p] of Object.entries(todos)) jugadores[id] = { nombre: p.n, equipo: p.t, lesion: p.l, parte: p.b };
  const enRegular = estado.season_type === 'regular';
  const byes = enRegular ? equiposEnBye(partidos) : new Set();
  const byesSig = enRegular ? equiposEnBye(partidosSig) : new Set();
  const rosterCache = new Map();

  const resumen = { suscritos: subs.length, enviados: 0, borrados: 0, errores: 0 };
  const revisar = async (b) => {
    const s = await leerJSON(b.pathname);
    if (!s?.suscripcion) return;
    try {
      const ligas = [];
      for (const l of s.ligas || []) {
        if (!rosterCache.has(l.id)) rosterCache.set(l.id, json(`${SLEEPER}/league/${l.id}/rosters`).catch(() => []));
        const mio = (await rosterCache.get(l.id)).find((r) => r.owner_id === s.usuario.id || (r.co_owners || []).includes(s.usuario.id));
        if (mio) ligas.push({ id: l.id, nombre: l.nombre || 'tu liga', titulares: mio.starters || [], plantel: mio.players || [] });
      }
      const enviados = new Set(s.enviados || []);
      const avisos = generarAvisos({
        ligas, jugadores, semana, byes, byesSig, noticias, enviados, opciones: s.opciones,
        // Noticias desde la revisión anterior (con 1 hora de margen), nunca más de 30 horas atrás
        desde: Math.max(s.creado || 0, Math.min(ultima?.t ? ultima.t - 3600_000 : inicio - 12 * 3600_000, inicio - 3600_000), inicio - 30 * 3600_000),
      });
      // Máximo 4 por vuelta; si hay más, un resumen
      const lote = avisos.length > 4
        ? [...avisos.filter((a) => a.urgente).slice(0, 3), { clave: `resumen:${inicio}`, url: '/', titulo: `🐛 Cody tiene ${avisos.length} avisos para ti`, cuerpo: 'Abre la app para verlos todos.' }]
        : avisos;
      for (const a of lote) {
        await webpush.sendNotification(s.suscripcion, JSON.stringify({ titulo: a.titulo, cuerpo: a.cuerpo, url: a.url, tag: a.clave }), { TTL: 6 * 3600 });
        resumen.enviados++;
      }
      avisos.forEach((a) => enviados.add(a.clave));
      if (avisos.length) await guardarJSON(b.pathname, { ...s, enviados: [...enviados].slice(-400) });
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await borrar(b.pathname);
        resumen.borrados++;
      } else {
        resumen.errores++;
      }
    }
  };
  // De 6 en 6 para no tardar demasiado cuando haya muchas personas
  for (let i = 0; i < subs.length; i += 6) await Promise.all(subs.slice(i, i + 6).map(revisar));
  return responder(res, 200, { ok: true, semana, ...resumen, ms: Date.now() - inicio });
}
