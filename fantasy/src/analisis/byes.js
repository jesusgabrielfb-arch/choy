// Alertas de bye week (esta semana y la siguiente) con cambios sugeridos por waivers.
import { mejorAlineacion, puestosTitulares, ELEGIBLES } from './alineacion.js';

/**
 * miRoster: ids. valor(id): valor de trade (para ordenar). proy(semana, id): proyección o null.
 * byesPorSemana: { semana: Set(equipos) }. libres: ids que nadie tiene en la liga.
 */
export function alertasBye({ semanas, miRoster, jugadores, byesPorSemana, rosterPositions, libres, valor, proy }) {
  const alertas = [];
  for (const semana of semanas) {
    const byes = byesPorSemana[semana] || new Set();
    const puntaje = (id) => proy(semana, id) ?? valor(id) / 1000;
    const todos = miRoster.filter((id) => jugadores[id]).map((id) => ({
      id, pos: jugadores[id].pos, valor: puntaje(id),
    }));
    const normal = mejorAlineacion(todos.map((j) => ({ ...j, valor: valor(j.id) })), rosterPositions);
    const afectados = normal.titulares.filter((t) => t.id && byes.has(jugadores[t.id]?.equipo)).map((t) => t.id);
    const enBye = miRoster.filter((id) => byes.has(jugadores[id]?.equipo));
    if (!enBye.length) continue;

    const sinBye = todos.filter((j) => !byes.has(jugadores[j.id].equipo));
    const conBye = mejorAlineacion(sinBye, rosterPositions);
    const huecos = conBye.titulares.filter((t) => !t.id).map((t) => t.puesto);

    // Posiciones donde hace falta refuerzo: huecos o titulares que se fueron de bye
    const necesito = new Set();
    for (const p of huecos) ELEGIBLES[p].forEach((x) => necesito.add(x));
    for (const id of afectados) necesito.add(jugadores[id].pos);

    const sugerencias = libres
      .filter((id) => jugadores[id] && necesito.has(jugadores[id].pos) && !byes.has(jugadores[id].equipo) &&
        jugadores[id].equipo && !['Out', 'IR', 'PUP', 'Sus'].includes(jugadores[id].lesion))
      .map((id) => ({ id, pos: jugadores[id].pos, puntaje: puntaje(id) }))
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, 6);

    const titularesNormales = new Set(normal.titulares.map((t) => t.id));
    const soltar = miRoster
      .filter((id) => jugadores[id] && !titularesNormales.has(id))
      .sort((a, b) => valor(a) - valor(b))
      .slice(0, 3);

    alertas.push({
      semana,
      enBye,
      titularesAfectados: afectados,
      huecos,
      grave: huecos.length > 0,
      sugerencias,
      soltar,
    });
  }
  return alertas;
}

export { puestosTitulares };
