// Mejor alineación posible según los puestos de la liga.

export const ELEGIBLES = {
  QB: ['QB'], RB: ['RB'], WR: ['WR'], TE: ['TE'], K: ['K'], DEF: ['DEF'],
  FLEX: ['RB', 'WR', 'TE'],
  WRRB_FLEX: ['RB', 'WR'],
  REC_FLEX: ['WR', 'TE'],
  SUPER_FLEX: ['QB', 'RB', 'WR', 'TE'],
};

export const NOMBRE_PUESTO = {
  FLEX: 'FLEX', WRRB_FLEX: 'W/R', REC_FLEX: 'W/T', SUPER_FLEX: 'SFLEX',
};

/** Puestos titulares (sin banca, IR ni taxi). */
export const puestosTitulares = (rosterPositions = []) =>
  rosterPositions.filter((p) => ELEGIBLES[p]);

/**
 * jugadores: [{id, pos, valor}] donde `valor` es lo que se quiere maximizar (proyección).
 * Llena primero los puestos fijos y después los flex, siempre con el mejor disponible.
 */
export function mejorAlineacion(jugadores, rosterPositions) {
  const puestos = puestosTitulares(rosterPositions);
  const orden = puestos
    .map((p, i) => ({ p, i }))
    .sort((a, b) => ELEGIBLES[a.p].length - ELEGIBLES[b.p].length);
  const libres = [...jugadores].sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
  const titulares = new Array(puestos.length).fill(null);
  for (const { p, i } of orden) {
    const k = libres.findIndex((j) => ELEGIBLES[p].includes(j.pos));
    if (k >= 0) titulares[i] = { puesto: p, ...libres.splice(k, 1)[0] };
    else titulares[i] = { puesto: p, id: null, valor: 0 };
  }
  const total = titulares.reduce((s, t) => s + (t.valor || 0), 0);
  return { titulares, banca: libres, total };
}
