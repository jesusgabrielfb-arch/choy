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
const r1 = (x) => (x == null ? '–' : x.toFixed(1));
const snaps = (s) => (s.tm_off_snp ? `${Math.round((100 * n(s.off_snp)) / s.tm_off_snp)}%` : s.off_snp ?? '–');

// Cada sección: { icono, titulo, stats: [[nombre, valor(s)]], solo?(s) → si se muestra }
const PASE = { icono: '🎯', titulo: 'Pase', stats: [['Completos', (s) => `${n(s.pass_cmp)}/${n(s.pass_att)}`], ['Yardas', (s) => n(s.pass_yd)],
  ['TD', (s) => n(s.pass_td)], ['Intercep.', (s) => n(s.pass_int)]] };
const CARRERA = { icono: '🏃', titulo: 'Carrera', stats: [['Acarreos', (s) => n(s.rush_att)], ['Yardas', (s) => n(s.rush_yd)],
  ['Yds/acarreo', (s) => r1(div(n(s.rush_yd), s.rush_att))], ['TD', (s) => n(s.rush_td)]] };
const RECEPCION = { icono: '🙌', titulo: 'Recepción', stats: [['Objetivos', (s) => n(s.rec_tgt)], ['Atrapadas', (s) => n(s.rec)],
  ['Yardas', (s) => n(s.rec_yd)], ['TD', (s) => n(s.rec_td)]] };
const USO = { icono: '⏱️', titulo: 'Uso', stats: [['En el campo', snaps], ['Jugadas', (s) => s.off_snp ?? '–']], solo: (s) => s.off_snp != null };
const conCarreras = { ...CARRERA, solo: (s) => n(s.rush_att) > 0 };
const conRecepciones = { ...RECEPCION, solo: (s) => n(s.rec_tgt) > 0 };

/** Secciones del registro según la posición. */
export function secciones(pos) {
  switch (pos) {
    case 'QB': return [PASE, conCarreras, USO];
    case 'RB': return [CARRERA, conRecepciones, USO];
    case 'WR': case 'TE': return [RECEPCION, conCarreras, USO];
    case 'K': return [{ icono: '🦶', titulo: 'Pateo', stats: [['Goles de campo', (s) => `${n(s.fgm)}/${n(s.fga)}`],
      ['Extras', (s) => `${n(s.xpm)}/${n(s.xpa)}`], ['Más largo', (s) => s.fgm_lng ?? '–']] }];
    case 'DEF': return [{ icono: '🛡️', titulo: 'Defensa', stats: [['Capturas', (s) => n(s.sack)], ['Intercep.', (s) => n(s.int)],
      ['Balones', (s) => n(s.fum_rec)], ['TD', (s) => n(s.def_td) + n(s.def_st_td)], ['Pts permitidos', (s) => s.pts_allow ?? '–']] }];
    default: return [];
  }
}

const jugo = (w) => w.stats && Object.keys(w.stats).length && (w.stats.gp ?? 1) > 0;

/**
 * Resumen pensado en cómo viene (no en el total de la temporada):
 * promedio, últimos 3, cuántas veces superó lo proyectado y su mejor partido.
 */
export function resumen(semanas, reglas) {
  const jugadas = semanas.filter(jugo).sort((a, b) => a.semana - b.semana);
  const pts = jugadas.map((w) => puntos(w.stats, reglas));
  const total = pts.reduce((a, b) => a + b, 0);
  const ult = pts.slice(-3);
  const conProy = jugadas.filter((w) => w.proy && Object.keys(w.proy).length);
  const supero = conProy.filter((w) => puntos(w.stats, reglas) >= puntos(w.proy, reglas)).length;
  return {
    partidos: jugadas.length, total,
    promedio: jugadas.length ? total / jugadas.length : 0,
    ultimos3: ult.length ? ult.reduce((a, b) => a + b, 0) / ult.length : 0,
    mejor: pts.length ? Math.max(...pts) : 0,
    supero, conProy: conProy.length,
  };
}
