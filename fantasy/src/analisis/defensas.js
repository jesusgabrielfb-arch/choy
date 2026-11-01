// Analizador de defensas: cuántos puntos de fantasy permite cada defensa a cada posición,
// y con eso quién conviene poner de titular y quién sentar esta semana.
import { puntos } from './puntos.js';
import { mejorAlineacion } from './alineacion.js';

const POS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

/**
 * semanas: [{ semana, stats: {id: {stats}}, rivales: {equipo: rival} }]
 * Para cada jugador que jugó, sus puntos se le cargan a la defensa rival.
 * (Para DEF, se le carga a la ofensiva rival: "cuánto le hacen las defensas a este equipo".)
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
      porEquipoPos[k] = (porEquipoPos[k] || 0) + puntos(fila.stats, reglas);
    }
    for (const [k, pts] of Object.entries(porEquipoPos)) {
      const [eq, pos] = k.split('|');
      tabla[eq] ??= {};
      tabla[eq][pos] ??= { total: 0, partidos: 0 };
      tabla[eq][pos].total += pts;
      tabla[eq][pos].partidos += 1;
    }
  }
  const res = {};
  for (const [eq, porPos] of Object.entries(tabla)) {
    res[eq] = {};
    for (const [pos, { total, partidos }] of Object.entries(porPos)) res[eq][pos] = total / partidos;
  }
  return res;
}

/** Ranking 1 = la defensa que MÁS puntos permite (el cruce más fácil). */
export function rankingDefensas(permitidos, pos) {
  const filas = Object.entries(permitidos)
    .filter(([, p]) => p[pos] != null)
    .map(([equipo, p]) => ({ equipo, permite: p[pos] }))
    .sort((a, b) => b.permite - a.permite);
  const prom = filas.reduce((s, f) => s + f.permite, 0) / (filas.length || 1);
  return filas.map((f, i) => ({ ...f, rank: i + 1, factor: prom ? f.permite / prom : 1 }));
}

export function factorCruce(permitidos, rival, pos) {
  const r = rankingDefensas(permitidos, pos).find((f) => f.equipo === rival);
  return r ? r.factor : 1;
}

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
  rosterPositions, byes = new Set() }) {
  const lista = miRoster
    .map((id) => {
      const j = jugadores[id];
      if (!j) return null;
      const enBye = byes.has(j.equipo);
      const fuera = ['Out', 'IR', 'PUP', 'Sus', 'DNR'].includes(j.lesion);
      const base = proy[id] ?? 0;
      const rival = rivales[j.equipo] || null;
      const factor = rival ? factorCruce(permitidos, rival, j.pos) : 1;
      const ajuste = enBye || fuera ? 0 : base * (0.6 + 0.4 * Math.min(1.35, Math.max(0.7, factor)));
      return { id, pos: j.pos, valor: ajuste, proy: base, rival, factor, enBye, fuera };
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
