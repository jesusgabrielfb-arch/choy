// Trades justos con valores de FantasyCalc.
// Un paquete de varios jugadores vale menos que la suma: el mejor jugador manda.

const PESOS = [1, 0.72, 0.55, 0.45, 0.4];

export function valorPaquete(valores) {
  return [...valores]
    .sort((a, b) => b - a)
    .reduce((s, v, i) => s + v * (PESOS[i] ?? 0.35), 0);
}

/** 1 = perfectamente parejo. */
export function equidad(a, b) {
  if (!a && !b) return 1;
  return Math.min(a, b) / Math.max(a, b);
}

export function veredicto(doy, recibo) {
  const e = equidad(doy, recibo);
  if (e >= 0.93) return { tipo: 'justo', texto: 'Trade justo' };
  if (doy > recibo) {
    return e >= 0.8 ? { tipo: 'pierdes', texto: 'Das un poco de más' } : { tipo: 'pierdes', texto: 'Das demasiado' };
  }
  return e >= 0.8 ? { tipo: 'ganas', texto: 'Te favorece un poco' } : { tipo: 'ganas', texto: 'Te favorece mucho (difícil que lo acepten)' };
}

function combinaciones(lista, max) {
  const res = [];
  const n = lista.length;
  for (let i = 0; i < n; i++) {
    res.push([lista[i]]);
    if (max < 2) continue;
    for (let j = i + 1; j < n; j++) {
      res.push([lista[i], lista[j]]);
      if (max < 3) continue;
      for (let k = j + 1; k < n; k++) res.push([lista[i], lista[j], lista[k]]);
    }
  }
  return res;
}

/**
 * Evalúa lo elegido y propone trades justos.
 * recibo: ids del rival que quiero; doy: ids míos que ofrezco (puede estar vacío).
 * miRoster / rosterRival: ids; valor(id) → número; titular(id) → bool (para no desarmar tu equipo).
 */
export function proponerTrades({ recibo, doy = [], miRoster, rosterRival, valor, titular = () => false }) {
  const vRecibo = valorPaquete(recibo.map(valor));
  const vDoy = valorPaquete(doy.map(valor));
  const actual = doy.length ? { doy, recibo, vDoy, vRecibo, equidad: equidad(vDoy, vRecibo), ...veredicto(vDoy, vRecibo) } : null;

  const opciones = [];
  // 1) Paquetes míos que igualan lo que pido
  const mios = miRoster.filter((id) => !recibo.includes(id) && valor(id) > 0);
  for (const combo of combinaciones(mios, 3)) {
    const v = valorPaquete(combo.map(valor));
    const e = equidad(v, vRecibo);
    if (e < 0.88) continue;
    const dolor = combo.reduce((s, id) => s + (titular(id) ? 1 : 0), 0);
    opciones.push({ doy: combo, recibo, vDoy: v, vRecibo, equidad: e, dolor, ...veredicto(v, vRecibo) });
  }
  // 2) Si ya elegí qué dar, equilibrar sumando un jugador de un lado
  if (actual && actual.equidad < 0.93) {
    if (vDoy < vRecibo) {
      for (const id of mios.filter((x) => !doy.includes(x))) {
        const nuevo = [...doy, id];
        const v = valorPaquete(nuevo.map(valor));
        const e = equidad(v, vRecibo);
        if (e >= 0.9) opciones.push({ doy: nuevo, recibo, vDoy: v, vRecibo, equidad: e, dolor: titular(id) ? 1 : 0, agrega: 'tú', ...veredicto(v, vRecibo) });
      }
    } else {
      for (const id of rosterRival.filter((x) => !recibo.includes(x) && valor(x) > 0)) {
        const nuevo = [...recibo, id];
        const v = valorPaquete(nuevo.map(valor));
        const e = equidad(vDoy, v);
        if (e >= 0.9) opciones.push({ doy, recibo: nuevo, vDoy, vRecibo: v, equidad: e, dolor: 0, agrega: 'rival', ...veredicto(vDoy, v) });
      }
    }
  }
  const clave = (o) => [...o.doy].sort().join(',') + '>' + [...o.recibo].sort().join(',');
  const vistos = new Set();
  const unicas = opciones
    .sort((a, b) => (a.dolor - b.dolor) || (a.doy.length + a.recibo.length - b.doy.length - b.recibo.length) ||
      (b.equidad - a.equidad))
    .filter((o) => (vistos.has(clave(o)) ? false : vistos.add(clave(o))));
  return { actual, opciones: unicas.slice(0, 8) };
}

/**
 * Para un jugador mío: qué equipos de la liga podrían darme algo parecido y qué jugador.
 * rosters: [{rosterId, dueno, ids}] (sin el mío). necesidad(rosterId, pos) → 0..1
 */
export function buscarCompradores({ mio, rosters, valor, posDe, necesidad = () => 0.5 }) {
  const v = valor(mio);
  const res = [];
  for (const r of rosters) {
    for (const id of r.ids) {
      const e = equidad(v, valor(id));
      if (e < 0.85 || posDe(id) === posDe(mio)) continue;
      res.push({ rosterId: r.rosterId, dueno: r.dueno, recibo: [id], equidad: e,
        puntaje: e * (0.6 + 0.4 * necesidad(r.rosterId, posDe(mio))) });
    }
  }
  return res.sort((a, b) => b.puntaje - a.puntaje).slice(0, 10);
}
