// Analizador de defensas: cuántos puntos de fantasy permite cada defensa a cada posición,
// y con eso quién conviene poner de titular y quién sentar esta semana.
import { puntos } from './puntos.js';
import { mejorAlineacion } from './alineacion.js';

const POS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

// Yardas que cuentan para cada posición (lo que la defensa le permite a esa posición)
const YARDAS = {
  QB: (st) => (st.pass_yd || 0) + (st.rush_yd || 0),
  RB: (st) => (st.rush_yd || 0) + (st.rec_yd || 0),
  WR: (st) => st.rec_yd || 0,
  TE: (st) => st.rec_yd || 0,
};

/**
 * semanas: [{ semana, stats: {id: {stats}}, rivales: {equipo: rival} }]
 * Para cada jugador que jugó, sus puntos y yardas se le cargan a la defensa rival.
 * (Para DEF, se le carga a la ofensiva rival: "cuánto le hacen las defensas a este equipo".)
 * Devuelve { equipo: { pos: puntos por partido } } y, aparte, las yardas en .yardas[equipo][pos].
 */
export function puntosPermitidos(semanas, jugadores, reglas) {
  const tabla = {};
  for (const { stats, rivales } of semanas) {
    const porEquipoPos = {};
    for (const [id, fila] of Object.entries(stats)) {
      const j = jugadores[id];
      if (!j || !POS.includes(j.pos)) continue;
      const equipo = fila.equipo || j.equipo;
      const rival = fila.rival || rivales[equipo];
      if (!rival || (fila.stats.gp ?? 1) === 0) continue;
      const k = `${rival}|${j.pos}`;
      porEquipoPos[k] ??= { pts: 0, yds: 0 };
      porEquipoPos[k].pts += puntos(fila.stats, reglas);
      porEquipoPos[k].yds += YARDAS[j.pos]?.(fila.stats) ?? 0;
    }
    for (const [k, v] of Object.entries(porEquipoPos)) {
      const [eq, pos] = k.split('|');
      tabla[eq] ??= {};
      tabla[eq][pos] ??= { pts: 0, yds: 0, partidos: 0 };
      tabla[eq][pos].pts += v.pts;
      tabla[eq][pos].yds += v.yds;
      tabla[eq][pos].partidos += 1;
    }
  }
  const res = {};
  const yardas = {};
  for (const [eq, porPos] of Object.entries(tabla)) {
    res[eq] = {};
    yardas[eq] = {};
    for (const [pos, { pts, yds, partidos }] of Object.entries(porPos)) {
      res[eq][pos] = pts / partidos;
      if (YARDAS[pos]) yardas[eq][pos] = yds / partidos;
    }
  }
  Object.defineProperty(res, 'yardas', { value: yardas, enumerable: false });
  return res;
}

/** Nota por lugar en el ranking: las 6 que más regalan = A … las 6 más duras = F. */
export function notaPorLugar(rank, total) {
  const t = Math.max(2, total);
  const pct = (rank - 1) / (t - 1); // 0 = la que más permite, 1 = la más dura
  if (pct < 0.19) return { nota: 'A', texto: 'Cruce muy fácil' };
  if (pct < 0.375) return { nota: 'B', texto: 'Cruce fácil' };
  if (pct <= 0.625) return { nota: 'C', texto: 'Cruce normal' };
  if (pct <= 0.81) return { nota: 'D', texto: 'Cruce difícil' };
  return { nota: 'F', texto: 'Defensa muy dura' };
}

/**
 * Ranking 1 = la defensa que MÁS permite a esa posición (el cruce más fácil).
 * Mezcla puntos de fantasy y yardas permitidas a la posición (mitad y mitad).
 */
export function rankingDefensas(permitidos, pos) {
  const yardas = permitidos.yardas || {};
  const filas = Object.entries(permitidos)
    .filter(([, p]) => p[pos] != null)
    .map(([equipo, p]) => ({ equipo, permite: p[pos], yardas: yardas[equipo]?.[pos] ?? null }));
  const prom = (k) => {
    const v = filas.map((f) => f[k]).filter((x) => x != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const promPts = prom('permite');
  const promYds = prom('yardas');
  for (const f of filas) {
    const fp = promPts ? f.permite / promPts : 1;
    f.factor = f.yardas != null && promYds ? 0.5 * fp + 0.5 * (f.yardas / promYds) : fp;
  }
  filas.sort((a, b) => b.factor - a.factor);
  const total = filas.length;
  return filas.map((f, i) => {
    const c = notaPorLugar(i + 1, total);
    const lugar = i + 1;
    const duras = total - lugar + 1; // 1 = la más dura
    const donde = lugar <= total / 2
      ? (lugar === 1 ? `es la que MÁS le regala a ${pos} de las ${total}` : `es la ${lugar}ª que MÁS le regala a ${pos} de ${total}`)
      : (duras === 1 ? `es la defensa MÁS dura contra ${pos} de las ${total}` : `es la ${duras}ª defensa MÁS dura contra ${pos} de ${total}`);
    const detalle = `${f.equipo} ${donde}: permite ${f.yardas != null ? `${Math.round(f.yardas)} yds y ` : ''}${f.permite.toFixed(1)} pts por partido`;
    return { ...f, rank: i + 1, total, nota: c.nota, texto: `${c.texto}: ${detalle}` };
  });
}

export function cruceDe(permitidos, rival, pos) {
  return rankingDefensas(permitidos, pos).find((f) => f.equipo === rival) || null;
}

export function factorCruce(permitidos, rival, pos) {
  return cruceDe(permitidos, rival, pos)?.factor ?? 1;
}

/** Nota por factor (cuando no hay ranking a mano). */
export function calificar(factor) {
  if (factor >= 1.15) return { nota: 'A', texto: 'Cruce muy fácil' };
  if (factor >= 1.05) return { nota: 'B', texto: 'Cruce fácil' };
  if (factor > 0.95) return { nota: 'C', texto: 'Cruce normal' };
  if (factor > 0.85) return { nota: 'D', texto: 'Cruce difícil' };
  return { nota: 'F', texto: 'Defensa muy dura' };
}

/**
 * Titulares recomendados: proyección ajustada por el cruce.
 * miRoster: [ids]; titularesActuales: [ids]; proy: {id: puntos}; rivales: {equipo: rival}
 */
export function recomendarTitulares({ miRoster, titularesActuales, jugadores, proy, permitidos, rivales,
  rosterPositions, byes = new Set(), disponible = null }) {
  // Sin datos de disponibilidad, la regla de siempre: quien está fuera no suma
  const dispo = disponible || ((id) => ({ factor: ['Out', 'IR', 'PUP', 'Sus', 'DNR'].includes(jugadores[id]?.lesion) ? 0 : 1 }));
  const lista = miRoster
    .map((id) => {
      const j = jugadores[id];
      if (!j) return null;
      const enBye = byes.has(j.equipo);
      const d = dispo(id);
      const fuera = d.factor === 0;
      const base = proy[id] ?? 0;
      const rival = rivales[j.equipo] || null;
      const cruce = rival ? cruceDe(permitidos, rival, j.pos) : null;
      const factor = cruce?.factor ?? 1;
      const ajuste = enBye ? 0 : base * d.factor * (0.6 + 0.4 * Math.min(1.35, Math.max(0.7, factor)));
      return { id, pos: j.pos, valor: ajuste, proy: base, rival, factor, cruce, enBye, fuera, disponible: d };
    })
    .filter(Boolean);
  const mejor = mejorAlineacion(lista, rosterPositions);
  const recomendados = new Set(mejor.titulares.map((t) => t.id).filter(Boolean));
  const actuales = new Set(titularesActuales.filter((id) => id && id !== '0'));
  const poner = [...recomendados].filter((id) => !actuales.has(id));
  const sentar = [...actuales].filter((id) => !recomendados.has(id));
  const porId = Object.fromEntries(lista.map((l) => [l.id, l]));
  return { alineacion: mejor, poner, sentar, porId };
}

/**
 * Mejores defensas (DST) de una semana según el enfrentamiento.
 * Mira cuántos puntos les sacan las defensas a la ofensiva rival (permitidos[rival].DEF)
 * y lo mezcla con la proyección. dueno(id) → 'mia' | 'libre' | nombre del equipo.
 */
export function mejoresDefensas({ jugadores, rivales, permitidos, proy = () => null, dueno = () => 'libre', limite = 12 }) {
  const ranking = rankingDefensas(permitidos, 'DEF');
  const porEquipo = Object.fromEntries(ranking.map((r) => [r.equipo, r]));
  const total = ranking.length || 32;
  const lista = [];
  for (const j of Object.values(jugadores)) {
    if (j.pos !== 'DEF' || !j.equipo) continue;
    const rival = rivales[j.equipo];
    if (!rival) continue; // bye
    const r = porEquipo[rival];
    const factor = r?.factor ?? 1;
    const p = proy(j.id);
    const base = p ?? (r?.permite ?? 7);
    const puntaje = base * (0.6 + 0.4 * Math.min(1.4, Math.max(0.6, factor)));
    let razon = `vs ${rival}`;
    if (r) {
      razon += `: le sacan ${r.permite.toFixed(1)} pts por partido`;
      if (r.rank <= Math.ceil(total / 4)) razon += ` (de las ofensivas que más regalan, ${r.rank}ª)`;
      else if (r.rank > total - Math.ceil(total / 4)) razon += ` (ofensiva peligrosa, ${r.rank}ª de ${total})`;
    }
    lista.push({ id: j.id, equipo: j.equipo, rival, factor, cruce: r || null, proy: p, puntaje, razon, dueno: dueno(j.id) });
  }
  return lista.sort((a, b) => b.puntaje - a.puntaje).slice(0, limite).map((x, i) => ({ ...x, rank: i + 1 }));
}
