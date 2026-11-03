// Mis waivers: los reclamos que apuntaste (pendientes) y lo que Sleeper ya procesó.
// La API pública de Sleeper no muestra los reclamos pendientes (son privados);
// solo los movimientos ya procesados. Por eso los pendientes los apuntas tú en la app
// y Cody los marca solos como ganados o perdidos cuando Sleeper los procesa.

/**
 * transacciones: lista de Sleeper ({ type, status, roster_ids, adds, drops, settings, metadata, created, status_updated, leg })
 * Devuelve los movimientos que tocan tu equipo, del más nuevo al más viejo.
 */
export function misMovimientos(transacciones, miRosterId) {
  const mio = Number(miRosterId);
  return (transacciones || [])
    .filter((t) => (t.roster_ids || []).map(Number).includes(mio))
    .map((t) => {
      const entran = Object.entries(t.adds || {}).filter(([, r]) => Number(r) === mio).map(([id]) => id);
      const salen = Object.entries(t.drops || {}).filter(([, r]) => Number(r) === mio).map(([id]) => id);
      return {
        id: t.transaction_id, tipo: t.type, estado: t.status, entran, salen,
        faab: t.settings?.waiver_bid ?? null, semana: t.leg ?? null,
        fecha: t.status_updated || t.created || 0, nota: t.metadata?.notes || null,
      };
    })
    .filter((m) => m.entran.length || m.salen.length || m.tipo === 'trade')
    .sort((a, b) => b.fecha - a.fecha);
}

/**
 * apuntados: [{ id, soltar?, t (cuándo lo apuntaste), semana }]
 * Cruza lo que apuntaste con lo que Sleeper procesó. Cada uno queda:
 *  - ganado: entró a tu equipo (con lo que pagaste de FAAB si aplica)
 *  - perdido: tu reclamo falló o se lo llevó otro equipo
 *  - pendiente: todavía no se procesa
 * nombreDe(rosterId) → nombre del equipo que se lo llevó.
 */
export function estadoReclamos(apuntados, transacciones, { miRosterId, misIds = [], nombreDe = () => 'otro equipo' } = {}) {
  const mio = Number(miRosterId);
  const tienes = new Set(misIds);
  return (apuntados || []).map((a) => {
    // Solo cuentan movimientos de después de un día antes de apuntarlo
    const despues = (transacciones || []).filter((t) => (t.status_updated || t.created || 0) >= (a.t || 0) - 24 * 3600_000);
    const conEl = despues.filter((t) => t.adds && t.adds[a.id] != null)
      .sort((x, y) => (y.status_updated || y.created || 0) - (x.status_updated || x.created || 0));
    const mioOk = conEl.find((t) => t.status === 'complete' && Number(t.adds[a.id]) === mio);
    if (mioOk || tienes.has(a.id)) {
      return { ...a, estado: 'ganado', faab: mioOk?.settings?.waiver_bid ?? null, cuando: mioOk?.status_updated || null };
    }
    const otro = conEl.find((t) => t.status === 'complete' && Number(t.adds[a.id]) !== mio);
    if (otro) {
      return { ...a, estado: 'perdido', motivo: `se lo llevó ${nombreDe(Number(otro.adds[a.id]))}`,
        faabGanador: otro.settings?.waiver_bid ?? null, cuando: otro.status_updated || null };
    }
    const fallo = conEl.find((t) => t.status === 'failed' && Number(t.adds[a.id]) === mio);
    if (fallo) return { ...a, estado: 'perdido', motivo: fallo.metadata?.notes || 'tu reclamo no pasó', cuando: fallo.status_updated || null };
    return { ...a, estado: 'pendiente' };
  });
}
