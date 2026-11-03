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
  Arm: 'brazo', Forearm: 'antebrazo', Head: 'cabeza', Leg: 'pierna', 'Lower Leg': 'pierna', Jaw: 'mandíbula',
  Heel: 'talón', Collarbone: 'clavícula', Clavicle: 'clavícula', Biceps: 'bíceps', Triceps: 'tríceps', Face: 'cara',
  Eye: 'ojo', Nose: 'nariz', Lung: 'pulmón', Kidney: 'riñón', Spleen: 'bazo', Glute: 'glúteo', Pelvis: 'pelvis',
  Turf: 'dedo del pie (turf toe)', 'Turf Toe': 'dedo del pie (turf toe)', Undisclosed: 'sin especificar', 'Not Injury Related': 'no es lesión',
};

export const parteEnEspanol = (p) => (p ? PARTES[p] || p.toLowerCase() : null);

export function consejoLesion(j, { titular, suplente, disponible } = {}) {
  const e = ESTADOS[j.lesion];
  if (!e) return null;
  // El reporte que tiene es el de la semana pasada: todavía no hay que sentarlo
  if (disponible && /todavía no sale/.test(disponible.texto || '')) {
    return `Su estado es del partido pasado; el reporte de esta semana sale entre miércoles y viernes. ${titular && suplente ? `Ten listo a ${suplente} por si acaso.` : 'Revísalo antes del partido.'}`;
  }
  if (disponible?.factor > 0 && ['IR', 'PUP'].includes(j.lesion)) {
    return 'Sleeper ya le proyecta puntos: podría regresar pronto. Revisa las noticias antes de activarlo.';
  }
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

  // Suplentes que suben: quién hereda los snaps de un jugador importante lesionado.
  // Se ordena el depth chart de cada equipo (y si Sleeper no lo trae, por ranking).
  const porEquipoPos = new Map();
  for (const s of Object.values(jugadores)) {
    if (!s.equipo || !['RB', 'WR', 'TE', 'QB'].includes(s.pos)) continue;
    const k = `${s.equipo}|${s.pos}`;
    if (!porEquipoPos.has(k)) porEquipoPos.set(k, []);
    porEquipoPos.get(k).push(s);
  }
  for (const lista of porEquipoPos.values()) {
    lista.sort((a, b) => (a.profundidad ?? 99) - (b.profundidad ?? 99) || (a.rank ?? 9999) - (b.rank ?? 9999));
  }
  const cuantos = { QB: 1, TE: 1, RB: 2, WR: 2 };
  const reemplazos = [];
  const vistos = new Set();
  for (const j of lesionados) {
    if (!['RB', 'WR', 'TE', 'QB'].includes(j.pos)) continue;
    const grupo = porEquipoPos.get(`${j.equipo}|${j.pos}`) || [];
    const lugar = grupo.findIndex((x) => x.id === j.id);
    const importante = (lugar >= 0 && lugar < (j.pos === 'WR' ? 3 : 2)) || valor(j.id) >= minValor * 0.5;
    if (!importante) continue;
    const seguro = ['Out', 'IR', 'PUP', 'Sus', 'Doubtful', 'NA'].includes(j.lesion);
    const sanos = grupo.filter((s) => s.id !== j.id && !['Out', 'IR', 'PUP', 'Sus', 'Doubtful', 'NA'].includes(s.lesion));
    // los que estaban detrás de él en la profundidad
    const detras = sanos.filter((s) => grupo.indexOf(s) > lugar).slice(0, cuantos[j.pos]);
    for (const suplente of detras.length ? detras : sanos.slice(0, 1)) {
      const k = `${j.id}>${suplente.id}`;
      if (vistos.has(k)) continue;
      vistos.add(k);
      reemplazos.push({
        lesionado: j, suplente, libre: !rosteados.has(suplente.id), mio: miRoster.includes(suplente.id),
        seguro, texto: seguro ? 'sube seguro' : 'puede subir',
      });
    }
  }
  reemplazos.sort((a, b) => (Number(b.libre) - Number(a.libre)) || (Number(b.seguro) - Number(a.seguro)) ||
    (valor(b.lesionado.id) - valor(a.lesionado.id)));
  return { mios, liga, stash, reemplazos: reemplazos.slice(0, 40) };
}

const LARGO_PLAZO = ['IR', 'PUP', 'NA', 'Sus', 'DNR'];

/**
 * ¿Qué tan probable es que juegue en la semana w? Devuelve { factor 0..1, texto }.
 * No basta con que tenga una etiqueta de lesión: se mira
 *  - si el reporte es de ESTA semana o se quedó de su partido pasado (actualizado vs. su último partido),
 *  - cómo practicó (Full / Limited / DNP),
 *  - si Sleeper le sigue proyectando puntos para ese partido,
 *  - y si es una semana futura (el reporte semanal solo habla del próximo partido).
 * ctx: { w, semanaActual, proy (pts de Sleeper o null), ultimoPartido (ms) }
 */
export function disponibilidad(j, { w, semanaActual, proy = null, ultimoPartido = null } = {}) {
  const est = j?.lesion;
  if (!est || !ESTADOS[est]) return { factor: 1, texto: '' };
  const proyecta = proy != null && proy >= 0.5;

  if (LARGO_PLAZO.includes(est)) {
    // Si Sleeper ya le proyecta puntos, es porque espera que regrese
    return proyecta ? { factor: 0.6, texto: 'podría regresar (Sleeper ya le proyecta puntos)' }
      : { factor: 0, texto: est === 'Sus' ? 'suspendido' : 'fuera por tiempo largo' };
  }
  if (w > semanaActual) {
    // El reporte de la semana habla del próximo partido, no de los siguientes
    return est === 'Out' ? { factor: 0.75, texto: 'fuera para su próximo partido; para esta semana puede volver' }
      : { factor: 0.95, texto: 'en duda para su próximo partido; para esta semana debería estar' };
  }
  // ¿El reporte es nuevo (salió después de su último partido) o es el de la semana pasada?
  const nuevo = !(j.actualizado && ultimoPartido) || j.actualizado > ultimoPartido;
  if (proy != null && proy < 0.5 && nuevo) return { factor: 0, texto: 'Sleeper ya no le proyecta puntos' };
  if (!nuevo) {
    const f = { Out: 0.5, Doubtful: 0.6, Questionable: 0.9 }[est] ?? 0.8;
    return { factor: f, texto: 'su reporte de esta semana todavía no sale' };
  }
  const pr = j.practica;
  switch (est) {
    case 'Out': return { factor: 0, texto: 'descartado para este partido' };
    case 'Doubtful': return pr === 'Full' ? { factor: 0.5, texto: 'muy en duda, pero practicó completo' }
      : { factor: 0.2, texto: 'muy en duda: lo más probable es que no juegue' };
    case 'Questionable': {
      const f = { Full: 0.95, Limited: 0.8, DNP: 0.55 }[pr] ?? 0.8;
      const como = { Full: 'practicó completo', Limited: 'practicó limitado', DNP: 'no practicó' }[pr] || 'sin reporte de práctica';
      return { factor: f, texto: `en duda, ${como}` };
    }
    default: return { factor: 0.8, texto: '' };
  }
}
