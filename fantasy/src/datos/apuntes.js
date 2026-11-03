// Reclamos de waivers que apuntaste, guardados solo en tu teléfono (por liga).
const clave = (ligaId) => `fg:waivers:${ligaId}`;
const SEMANA = 7 * 24 * 3600_000;

export function leerApuntados(ligaId) {
  try {
    const lista = JSON.parse(localStorage.getItem(clave(ligaId)) || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function guardar(ligaId, lista) {
  try { localStorage.setItem(clave(ligaId), JSON.stringify(lista)); } catch { /* sin espacio: no pasa nada */ }
}

export const estaApuntado = (ligaId, id) => leerApuntados(ligaId).some((a) => a.id === id);

/** Apunta o quita un reclamo. Devuelve true si quedó apuntado. */
export function alternarApuntado(ligaId, { id, soltar = null, semana = null }) {
  const lista = leerApuntados(ligaId);
  const i = lista.findIndex((a) => a.id === id);
  if (i >= 0) {
    lista.splice(i, 1);
    guardar(ligaId, lista);
    return false;
  }
  lista.push({ id, soltar, semana, t: Date.now() });
  guardar(ligaId, lista);
  return true;
}

/** Borra los que ya se resolvieron hace más de una semana. resueltos: [{ id, estado, cuando }] */
export function limpiarApuntados(ligaId, resueltos) {
  const viejos = new Set(resueltos.filter((r) => r.estado !== 'pendiente' && r.cuando && Date.now() - r.cuando > SEMANA).map((r) => r.id));
  if (!viejos.size) return;
  guardar(ligaId, leerApuntados(ligaId).filter((a) => !viejos.has(a.id)));
}
