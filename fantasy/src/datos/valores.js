// Valores de trade de FantasyCalc: salen de miles de trades reales en ligas de verdad.
// Gratis y sin clave. https://www.fantasycalc.com
import { pedirJSON, HORA } from './http.js';

/** Ajustes de la liga que cambian el valor de los jugadores. */
export function formatoLiga(liga) {
  const pos = liga?.roster_positions || [];
  const rec = liga?.scoring_settings?.rec ?? 1;
  return {
    qbs: pos.includes('SUPER_FLEX') || pos.filter((p) => p === 'QB').length > 1 ? 2 : 1,
    equipos: liga?.total_rosters || 12,
    ppr: rec >= 0.75 ? 1 : rec >= 0.25 ? 0.5 : 0,
    dinastia: liga?.settings?.type === 2,
  };
}

/** Respuesta de FantasyCalc → { sleeperId: {valor, rankPos, tendencia} } */
export function normalizarValores(lista) {
  const res = {};
  for (const fila of Array.isArray(lista) ? lista : []) {
    const id = fila?.player?.sleeperId;
    if (!id) continue;
    res[id] = {
      valor: fila.value ?? 0,
      rank: fila.overallRank ?? null,
      rankPos: fila.positionRank ?? null,
      tendencia: fila.trend30Day ?? 0,
    };
  }
  return res;
}

export async function valores(liga) {
  const f = formatoLiga(liga);
  const url = `https://api.fantasycalc.com/values/current?isDynasty=${f.dinastia}` +
    `&numQbs=${f.qbs}&numTeams=${f.equipos}&ppr=${f.ppr}`;
  const lista = await pedirJSON(url, {
    clave: `valores:${f.dinastia}:${f.qbs}:${f.equipos}:${f.ppr}`, ttl: 6 * HORA, proxy: true,
  });
  return normalizarValores(lista);
}

/** Si FantasyCalc falla, un valor aproximado a partir del ranking de Sleeper. */
export function valorRespaldo(jugador) {
  const r = jugador?.rank ?? 9999;
  return r >= 9999 ? 0 : Math.round(10000 * Math.exp(-r / 120));
}
