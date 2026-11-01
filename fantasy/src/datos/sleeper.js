// API pública de Sleeper (solo lectura, sin clave). https://docs.sleeper.com
import { pedirJSON, leerCache, guardarCache, HORA, MINUTO } from './http.js';

const API = 'https://api.sleeper.app/v1';
const POSICIONES = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

export const usuario = (nombre) =>
  pedirJSON(`${API}/user/${encodeURIComponent(nombre.trim())}`, { clave: `u:${nombre.toLowerCase()}`, ttl: 24 * HORA });

export const estadoNFL = () => pedirJSON(`${API}/state/nfl`, { clave: 'estado', ttl: 30 * MINUTO });

export const ligas = (userId, temporada) =>
  pedirJSON(`${API}/user/${userId}/leagues/nfl/${temporada}`, { clave: `ligas:${userId}:${temporada}`, ttl: 30 * MINUTO });

export const liga = (id) => pedirJSON(`${API}/league/${id}`, { clave: `liga:${id}`, ttl: 30 * MINUTO });
export const rosters = (id) => pedirJSON(`${API}/league/${id}/rosters`, { clave: `rosters:${id}`, ttl: 5 * MINUTO });
export const usuariosLiga = (id) => pedirJSON(`${API}/league/${id}/users`, { clave: `usuarios:${id}`, ttl: HORA });
export const matchups = (id, semana) =>
  pedirJSON(`${API}/league/${id}/matchups/${semana}`, { clave: `matchups:${id}:${semana}`, ttl: 5 * MINUTO });

export const tendencias = (tipo = 'add', horas = 24, limite = 60) =>
  pedirJSON(`${API}/players/nfl/trending/${tipo}?lookback_hours=${horas}&limit=${limite}`,
    { clave: `trend:${tipo}`, ttl: 30 * MINUTO });

/** Deja solo lo que la app usa de cada jugador (la lista completa pesa ~5 MB). */
export function resumirJugador(id, p) {
  const nombre = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ');
  return {
    id,
    nombre,
    pos: p.position,
    equipo: p.team || null,
    lesion: p.injury_status || null,
    parte: p.injury_body_part || null,
    nota: p.injury_notes || null,
    practica: p.practice_participation || null,
    edad: p.age || null,
    rank: p.search_rank ?? 9999,
    activo: p.active !== false,
    profundidad: p.depth_chart_order ?? null,
  };
}

/** Todos los jugadores de fantasy. Se descarga una vez al día. */
export async function jugadores() {
  const c = leerCache('jugadores', 24 * HORA);
  if (c) return c;
  const todos = await pedirJSON(`${API}/players/nfl`);
  const resumen = {};
  for (const [id, p] of Object.entries(todos)) {
    if (!POSICIONES.includes(p.position)) continue;
    if (!p.team && !p.injury_status && (p.search_rank ?? 9999) > 600) continue;
    resumen[id] = resumirJugador(id, p);
  }
  guardarCache('jugadores', resumen);
  return resumen;
}

const consultaPos = POSICIONES.map((p) => `position[]=${p}`).join('&');

/** Lista de [{player_id, stats, opponent?, team?}] → { id: {stats, rival, equipo} } */
export function normalizarSemana(lista) {
  const res = {};
  for (const fila of Array.isArray(lista) ? lista : []) {
    const id = fila.player_id;
    if (!id || !fila.stats) continue;
    res[id] = { stats: fila.stats, rival: fila.opponent || null, equipo: fila.team || null };
  }
  return res;
}

/** Proyecciones de Sleeper (no oficiales, las mismas que usa su app). */
export async function proyecciones(temporada, semana) {
  const lista = await pedirJSON(
    `https://api.sleeper.app/projections/nfl/${temporada}/${semana}?season_type=regular&${consultaPos}`,
    { clave: `proy:${temporada}:${semana}`, ttl: 3 * HORA, proxy: true },
  );
  return normalizarSemana(lista);
}

/** Estadísticas reales de una semana ya jugada. */
export async function estadisticas(temporada, semana, terminada = true) {
  const lista = await pedirJSON(
    `https://api.sleeper.app/stats/nfl/${temporada}/${semana}?season_type=regular&${consultaPos}`,
    { clave: `stats:${temporada}:${semana}`, ttl: terminada ? 7 * 24 * HORA : 20 * MINUTO, proxy: true },
  );
  return normalizarSemana(lista);
}

export const avatar = (id, chico = true) =>
  id ? `https://sleepercdn.com/avatars/${chico ? 'thumbs/' : ''}${id}` : null;
