// Registro de juego de un jugador (semana por semana) desde nuestra función /api/jugador.
import { pedirJSON, MINUTO } from './http.js';
import { puntos } from '../analisis/puntos.js';

// Reglas PPR estándar, para cuando se mira un jugador fuera de una liga.
export const REGLAS_PPR = {
  pass_yd: 0.04, pass_td: 4, pass_int: -1, pass_2pt: 2, rush_yd: 0.1, rush_td: 6, rush_2pt: 2, rec: 1, rec_yd: 0.1,
  rec_td: 6, rec_2pt: 2, fum_lost: -2, fgm: 3, xpm: 1, fgmiss: -1, xpmiss: -1, sack: 1, int: 2, fum_rec: 2,
  def_td: 6, safe: 2, def_st_td: 6,
};

export async function registro(id, temporada) {
  const r = await pedirJSON(`/api/jugador?id=${encodeURIComponent(id)}&temporada=${temporada}`,
    { clave: `reg:${temporada}:${id}`, ttl: 20 * MINUTO });
  return r.semanas || [];
}

const div = (a, b) => (b ? a / b : null);
const n = (x) => x || 0;

/** Columnas del registro según la posición: [título, función(stats) → valor]. */
export function columnas(pos) {
  const snp = (s) => (s.tm_off_snp ? `${Math.round((100 * n(s.off_snp)) / s.tm_off_snp)}%` : s.off_snp ?? '–');
  const r1 = (x) => (x == null ? '–' : x.toFixed(1));
  switch (pos) {
    case 'QB': return [['C/I', (s) => `${n(s.pass_cmp)}/${n(s.pass_att)}`], ['YDS', (s) => n(s.pass_yd)], ['TD', (s) => n(s.pass_td)],
      ['INT', (s) => n(s.pass_int)], ['CAR', (s) => n(s.rush_att)], ['YD C', (s) => n(s.rush_yd)]];
    case 'RB': return [['SNAP', snp], ['CAR', (s) => n(s.rush_att)], ['YDS', (s) => n(s.rush_yd)], ['Y/C', (s) => r1(div(n(s.rush_yd), s.rush_att))],
      ['TD', (s) => n(s.rush_td) + n(s.rec_td)], ['OBJ', (s) => n(s.rec_tgt)], ['REC', (s) => n(s.rec)], ['YD R', (s) => n(s.rec_yd)]];
    case 'WR': case 'TE': return [['SNAP', snp], ['OBJ', (s) => n(s.rec_tgt)], ['REC', (s) => n(s.rec)], ['YDS', (s) => n(s.rec_yd)],
      ['Y/R', (s) => r1(div(n(s.rec_yd), s.rec))], ['TD', (s) => n(s.rec_td)], ['CAR', (s) => n(s.rush_att)]];
    case 'K': return [['FG', (s) => `${n(s.fgm)}/${n(s.fga)}`], ['XP', (s) => `${n(s.xpm)}/${n(s.xpa)}`], ['LARGO', (s) => s.fgm_lng ?? '–']];
    case 'DEF': return [['SACK', (s) => n(s.sack)], ['INT', (s) => n(s.int)], ['FR', (s) => n(s.fum_rec)], ['TD', (s) => n(s.def_td) + n(s.def_st_td)],
      ['PTS PERM', (s) => s.pts_allow ?? '–']];
    default: return [];
  }
}

export const LEYENDA = {
  QB: 'C/I completos/intentos · CAR acarreos · YD C yardas por tierra',
  RB: 'SNAP % de jugadas en el campo · CAR acarreos · Y/C yardas por acarreo · OBJ veces que lo buscaron',
  WR: 'SNAP % de jugadas en el campo · OBJ veces que lo buscaron · Y/R yardas por recepción',
  TE: 'SNAP % de jugadas en el campo · OBJ veces que lo buscaron · Y/R yardas por recepción',
  K: 'FG goles de campo · XP puntos extra',
  DEF: 'FR balones sueltos recuperados · PTS PERM puntos permitidos',
};

/** Resumen de temporada: partidos, puntos totales y promedio. */
export function resumen(semanas, reglas) {
  const jugadas = semanas.filter((w) => w.stats && (w.stats.gp ?? 1) > 0 && Object.keys(w.stats).length);
  const pts = jugadas.map((w) => puntos(w.stats, reglas));
  const total = pts.reduce((a, b) => a + b, 0);
  return { partidos: jugadas.length, total, promedio: jugadas.length ? total / jugadas.length : 0, mejor: pts.length ? Math.max(...pts) : 0 };
}
