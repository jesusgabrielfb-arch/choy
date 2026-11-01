// Puntos de fantasy con las reglas de TU liga (las claves de stats de Sleeper coinciden con
// las de scoring_settings: pass_yd, rec, rush_td, ...).

export function puntos(stats, reglas) {
  if (!stats) return 0;
  let total = 0;
  for (const [clave, valor] of Object.entries(reglas || {})) {
    const s = stats[clave];
    if (typeof s === 'number' && typeof valor === 'number') total += s * valor;
  }
  return Math.round(total * 100) / 100;
}

/** Promedio de puntos en las últimas `n` semanas jugadas (sin contar semanas sin jugar). */
export function promedioReciente(id, semanas, reglas, n = 3) {
  const jugadas = [];
  for (let i = semanas.length - 1; i >= 0 && jugadas.length < n; i--) {
    const fila = semanas[i]?.[id];
    if (fila && (fila.stats.gp ?? 1) > 0) jugadas.push(puntos(fila.stats, reglas));
  }
  if (!jugadas.length) return null;
  return jugadas.reduce((a, b) => a + b, 0) / jugadas.length;
}

export const redondear = (x, d = 1) => (x == null ? '–' : (Math.round(x * 10 ** d) / 10 ** d).toFixed(d));
