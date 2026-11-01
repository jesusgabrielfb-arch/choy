// Probabilidad de ganar un duelo: puntos que ya hizo cada titular + lo que le falta por jugar,
// con una incertidumbre que baja a medida que avanzan los partidos.

/** Función de distribución normal estándar. */
export function normal(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * titulares: ids; puntosHechos: {id: pts}; proy(id): proyección total; progreso(id): 0..1
 * Devuelve { hechos, esperado, varianza }.
 */
export function equipoEsperado({ titulares, puntosHechos = {}, proy, progreso }) {
  let hechos = 0;
  let esperado = 0;
  let varianza = 0;
  for (const id of titulares) {
    if (!id || id === '0') continue;
    const h = puntosHechos[id] ?? 0;
    const p = progreso(id);
    const falta = Math.max(0, (proy(id) ?? 0) * (1 - p));
    hechos += h;
    esperado += h + falta;
    // un jugador puede rendir bastante más o menos que su proyección (~45%)
    varianza += (0.45 * falta) ** 2 + (p < 1 ? 1 : 0);
  }
  return { hechos, esperado, varianza };
}

export function probGanar(a, b) {
  const sd = Math.sqrt(a.varianza + b.varianza);
  if (sd < 0.01) return a.esperado > b.esperado ? 1 : a.esperado < b.esperado ? 0 : 0.5;
  return normal((a.esperado - b.esperado) / sd);
}

/**
 * Todos los duelos de la semana. matchups: respuesta de Sleeper; equipos: [{rosterId, nombre, ...}]
 */
export function duelosSemana({ matchups, equipos, proy, progreso }) {
  const porId = Object.fromEntries(equipos.map((e) => [e.rosterId, e]));
  const grupos = {};
  for (const m of matchups || []) {
    if (!m.matchup_id) continue;
    (grupos[m.matchup_id] ??= []).push(m);
  }
  return Object.values(grupos).filter((g) => g.length === 2).map(([m1, m2]) => {
    const lado = (m) => ({
      equipo: porId[m.roster_id] || { nombre: `Equipo ${m.roster_id}` },
      puntos: m.points ?? 0,
      titulares: m.starters || [],
      banca: (m.players || []).filter((id) => !(m.starters || []).includes(id)),
      puntosJugador: m.players_points || {},
      ...equipoEsperado({ titulares: m.starters || [], puntosHechos: m.players_points || {}, proy, progreso }),
    });
    const a = lado(m1);
    const b = lado(m2);
    const p = probGanar(a, b);
    return { a: { ...a, prob: p }, b: { ...b, prob: 1 - p } };
  });
}
