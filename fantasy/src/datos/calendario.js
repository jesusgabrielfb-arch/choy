// Calendario de la NFL desde la API pública de ESPN: partidos de cada semana y equipos en bye.
import { pedirJSON, HORA } from './http.js';

// Abreviaturas de ESPN que Sleeper escribe distinto.
const A_SLEEPER = { WSH: 'WAS', JAC: 'JAX', LA: 'LAR' };
export const EQUIPOS_NFL = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND',
  'JAX', 'KC', 'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SEA',
  'SF', 'TB', 'TEN', 'WAS',
];

export const aSleeper = (abr) => A_SLEEPER[abr] || abr;

/** Marcador de ESPN → [{local, visita, fecha}] */
export function leerPartidos(datos) {
  const partidos = [];
  for (const ev of datos?.events || []) {
    const comp = ev.competitions?.[0];
    const eq = comp?.competitors || [];
    const local = eq.find((c) => c.homeAway === 'home')?.team?.abbreviation;
    const visita = eq.find((c) => c.homeAway === 'away')?.team?.abbreviation;
    if (local && visita) {
      partidos.push({ local: aSleeper(local), visita: aSleeper(visita), fecha: ev.date || null });
    }
  }
  return partidos;
}

export async function partidosSemana(temporada, semana) {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' +
    `?seasontype=2&week=${semana}&dates=${temporada}`;
  const datos = await pedirJSON(url, { clave: `espn:${temporada}:${semana}`, ttl: 12 * HORA, proxy: true });
  return leerPartidos(datos);
}

/** Equipos que no juegan esa semana. */
export function equiposEnBye(partidos) {
  if (!partidos.length) return new Set();
  const juegan = new Set(partidos.flatMap((p) => [p.local, p.visita]));
  return new Set(EQUIPOS_NFL.filter((e) => !juegan.has(e)));
}

/** { equipo: rival } para una semana. */
export function rivales(partidos) {
  const r = {};
  for (const p of partidos) {
    r[p.local] = p.visita;
    r[p.visita] = p.local;
  }
  return r;
}
