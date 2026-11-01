// Analista de lesiones: mi equipo, jugadores importantes de la liga y candidatos para "stash"
// (guardar en la banca o en IR a alguien lesionado que vale mucho cuando vuelva).

export const ESTADOS = {
  Questionable: { texto: 'Duda', gravedad: 1, color: 'amarillo' },
  Doubtful: { texto: 'Muy en duda', gravedad: 2, color: 'naranja' },
  Out: { texto: 'Fuera', gravedad: 3, color: 'rojo' },
  IR: { texto: 'Reserva de lesionados (IR)', gravedad: 4, color: 'rojo' },
  PUP: { texto: 'Lista PUP', gravedad: 4, color: 'rojo' },
  Sus: { texto: 'Suspendido', gravedad: 3, color: 'morado' },
  NA: { texto: 'No disponible', gravedad: 3, color: 'rojo' },
  DNR: { texto: 'No reportado', gravedad: 2, color: 'naranja' },
};

const PARTES = {
  Knee: 'rodilla', Ankle: 'tobillo', Hamstring: 'isquiotibial', Concussion: 'conmoción cerebral',
  Shoulder: 'hombro', Foot: 'pie', Back: 'espalda', Hip: 'cadera', Groin: 'ingle', Calf: 'pantorrilla',
  Quadricep: 'cuádriceps', Quad: 'cuádriceps', Wrist: 'muñeca', Hand: 'mano', Elbow: 'codo',
  Toe: 'dedo del pie', Neck: 'cuello', Ribs: 'costillas', Chest: 'pecho', Achilles: 'tendón de Aquiles',
  Thumb: 'pulgar', Finger: 'dedo', Illness: 'enfermedad', Abdomen: 'abdomen', Oblique: 'oblicuo',
  Pectoral: 'pectoral', Personal: 'asunto personal', Rest: 'descanso', Shin: 'espinilla',
};

export const parteEnEspanol = (p) => (p ? PARTES[p] || p.toLowerCase() : null);

export function consejoLesion(j, { titular, suplente } = {}) {
  const e = ESTADOS[j.lesion];
  if (!e) return null;
  switch (j.lesion) {
    case 'Questionable':
      return titular
        ? `Revisa el reporte final antes del partido${suplente ? `; ten listo a ${suplente}` : ''}. Si juega a la tarde/noche, ten un plan B que juegue después.`
        : 'Está en duda; no hace falta moverlo si está en la banca.';
    case 'Doubtful':
      return `Lo más probable es que no juegue. ${titular ? 'Siéntalo' + (suplente ? ` y pon a ${suplente}` : '') + '.' : ''}`.trim();
    case 'IR':
    case 'PUP':
      return 'Muévelo a tu puesto de IR para liberar un lugar en la banca.';
    case 'Out':
      return titular ? `No juega esta semana. Siéntalo${suplente ? ` y pon a ${suplente}` : ''}.` : 'No juega esta semana.';
    case 'Sus':
      return 'Suspendido: no suma puntos hasta que termine la suspensión.';
    default:
      return 'Revisa su estado antes del partido.';
  }
}

/**
 * Jugadores lesionados importantes. valor(id) para saber quién importa.
 * Devuelve { mios, liga, stash, reemplazos }.
 */
export function analizarLesiones({ jugadores, miRoster, rosteados, valor, tieneIR = false, minValor = 1500 }) {
  const lesionados = Object.values(jugadores).filter((j) => ESTADOS[j.lesion] && j.equipo);
  const porGravedad = (a, b) => (ESTADOS[b.lesion].gravedad - ESTADOS[a.lesion].gravedad) || (valor(b.id) - valor(a.id));
  const mios = lesionados.filter((j) => miRoster.includes(j.id)).sort(porGravedad);
  const liga = lesionados.filter((j) => rosteados.has(j.id) && !miRoster.includes(j.id) && valor(j.id) >= minValor)
    .sort((a, b) => valor(b.id) - valor(a.id));

  // Stash: libres, lesionados de varias semanas, pero con buen valor para cuando vuelvan.
  const stash = lesionados
    .filter((j) => !rosteados.has(j.id) && ['IR', 'PUP', 'Out', 'Doubtful'].includes(j.lesion) && valor(j.id) >= minValor * 0.4)
    .sort((a, b) => valor(b.id) - valor(a.id))
    .slice(0, 12)
    .map((j) => ({ ...j, motivo: tieneIR && ['IR', 'PUP'].includes(j.lesion)
      ? 'Puedes guardarlo en tu IR sin perder lugar en la banca.'
      : 'Si tienes un lugar libre en la banca, guárdalo: vale mucho cuando vuelva.' }));

  // Reemplazos: el suplente directo de un titular lesionado (handcuff) que está libre.
  const reemplazos = [];
  for (const j of lesionados) {
    if (!['Out', 'IR', 'PUP', 'Doubtful'].includes(j.lesion) || (j.profundidad ?? 9) > 1) continue;
    if (!['RB', 'WR', 'TE', 'QB'].includes(j.pos)) continue;
    const suplente = Object.values(jugadores).find((s) => s.equipo === j.equipo && s.pos === j.pos &&
      s.profundidad === 2 && !rosteados.has(s.id) && !ESTADOS[s.lesion]);
    if (suplente) reemplazos.push({ lesionado: j, suplente });
  }
  return { mios, liga, stash, reemplazos: reemplazos.sort((a, b) => valor(b.lesionado.id) - valor(a.lesionado.id)) };
}
