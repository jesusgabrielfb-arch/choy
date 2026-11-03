// Plan de la semana: acciones concretas ordenadas por cuántos puntos te hacen ganar.
// No solo avisa ("se va de bye"): dice qué hacer ("sienta a X, pon a Y, +6.2 pts"),
// y si no tienes reemplazo busca en waivers y te dice a quién soltar.
import { mejorAlineacion, ELEGIBLES, puestosTitulares } from './alineacion.js';
import { proponerTrades } from './trades.js';

const NO_JUEGA = ['Out', 'IR', 'PUP', 'Sus', 'NA', 'DNR'];
const MARGEN_WAIVER = 1.5;

/**
 * ctx:
 *  semana, miRoster, titularesActuales (ids en orden de puestos), jugadores, rosterPositions,
 *  proyAjustada(semana, id) → puntos esperados ya ajustados por el cruce (0 si no juega),
 *  enBye(semana, id) → bool, libres: ids, valor(id), tieneIRLibre, rosterIR: ids en IR
 *  bloqueado(id) → true si su partido ya empezó (ya no se puede mover)
 *  semanaWaivers → para qué semana conviene pedir waivers (si ya pasaron los de esta, la próxima)
 *  hora(id) → texto con el día y la hora de su partido; inicio(id) → fecha del partido en ms
 */
export function planSemana(ctx) {
  const { semana, miRoster, titularesActuales, jugadores: J, rosterPositions, proyAjustada, enBye, libres, valor } = ctx;
  const bloqueado = ctx.bloqueado || (() => false);
  // ¿No juega esa semana? (si la app sabe su disponibilidad, se usa; si no, la etiqueta de lesión)
  const noJuega = (id, w = semana) => (ctx.noJuega ? ctx.noJuega(w, id) : NO_JUEGA.includes(J[id]?.lesion));
  const semanaWaivers = ctx.semanaWaivers || semana;
  const hora = ctx.hora || (() => null);
  const inicio = ctx.inicio || (() => null);
  const conHora = (id) => (hora(id) && !bloqueado(id) ? ` ⏰ ${nombreCorto(J, id)} juega ${hora(id)}${/\.$/.test(hora(id)) ? '' : '.'}` : '');
  const acciones = [];
  const nombre = (id) => J[id]?.nombre || '—';
  const motivoSalida = (id, w = semana) => {
    const j = J[id];
    if (enBye(w, id)) return `está de bye`;
    if (noJuega(id, w)) return 'no juega (lesión)';
    if (j?.lesion === 'Doubtful') return 'casi seguro no juega';
    return 'tiene peor proyección';
  };

  // Quien está de bye o no juega no puede llenar un puesto.
  const lista = (w) => miRoster
    .filter((id) => J[id] && !enBye(w, id) && !noJuega(id, w))
    .map((id) => ({ id, pos: J[id].pos, valor: proyAjustada(w, id) }));
  const optima = mejorAlineacion(lista(semana), rosterPositions);
  const enOptima = new Set(optima.titulares.map((t) => t.id).filter(Boolean));
  const actuales = titularesActuales.filter((id) => id && id !== '0');
  const actualesSet = new Set(actuales);

  // 1) Cambios en tu alineación (con lo que ya tienes)
  const salen = actuales.filter((id) => !enOptima.has(id));
  const entran = [...enOptima].filter((id) => !actualesSet.has(id));
  const vacios = puestosTitulares(rosterPositions).length - actuales.length;
  for (const entra of entran) {
    if (bloqueado(entra)) continue;
    const pos = J[entra].pos;
    // empareja con quien sale de una posición compatible (o un puesto vacío)
    const k = salen.findIndex((s) => J[s].pos === pos) >= 0 ? salen.findIndex((s) => J[s].pos === pos) : 0;
    const sale = salen.length ? salen.splice(k, 1)[0] : null;
    if (sale && bloqueado(sale)) continue;
    const gana = proyAjustada(semana, entra) - (sale ? proyAjustada(semana, sale) : 0);
    if (gana <= 0.3 && sale && !enBye(semana, sale) && !noJuega(sale)) continue;
    const urgente = !sale || enBye(semana, sale) || noJuega(sale) || J[sale]?.lesion === 'Doubtful';
    acciones.push({
      tipo: 'alineacion', urgente, ganancia: gana, entra, sale,
      titulo: sale ? `Sienta a ${nombre(sale)} y pon a ${nombre(entra)}` : `Pon a ${nombre(entra)} en el puesto vacío`,
      detalle: (sale ? `${nombre(sale)} ${motivoSalida(sale)}. ${nombre(entra)} proyecta ${fmt(proyAjustada(semana, entra))}.` : `Tienes un puesto sin nadie (${vacios > 0 ? 'vacío' : 'bye'}).`) +
        conHora(sale && hora(sale) && (!hora(entra) || inicio(sale) < inicio(entra)) ? sale : entra),
    });
  }

  // Titulares que no juegan y no tienen reemplazo en tu banca
  for (const sale of salen) {
    if (!enBye(semana, sale) && !noJuega(sale)) continue;
    acciones.push({
      tipo: 'alineacion', urgente: true, ganancia: 0, sale,
      titulo: `Saca a ${nombre(sale)} de tu alineación`,
      detalle: `${nombre(sale)} ${motivoSalida(sale)} y no tienes otro ${J[sale].pos} en la banca. Mira abajo si hay uno en waivers.`,
    });
  }

  // 2) Mejoras desde waivers. Si los waivers de esta semana ya pasaron, se piensa en la próxima;
  //    solo un puesto vacío de esta semana se cubre con un agente libre que todavía no jugó.
  const usados = new Set();
  const banca = miRoster.filter((id) => J[id] && !enOptima.has(id));
  const prescindibles = () => banca
    .filter((id) => !usados.has(id) && !bloqueado(id))
    .sort((a, b) => valor(a) - valor(b));
  const buscar = (w, alineacion, { soloVacios = false, maximo = 3 } = {}) => {
    let n = 0;
    for (const t of [...alineacion.titulares].sort((a, b) => (a.valor ?? 0) - (b.valor ?? 0))) {
      if (soloVacios && t.id) continue;
      const elegibles = ELEGIBLES[t.puesto];
      const actual = t.id ? proyAjustada(w, t.id) : 0;
      const mejor = libres
        .filter((id) => !usados.has(id) && J[id] && elegibles.includes(J[id].pos) && !enBye(w, id) &&
          !noJuega(id, w) && (w !== semana || !bloqueado(id)))
        .map((id) => ({ id, p: proyAjustada(w, id) }))
        .sort((a, b) => b.p - a.p)[0];
      if (!mejor || mejor.p - actual < MARGEN_WAIVER) continue;
      usados.add(mejor.id);
      const soltar = prescindibles()[0] || null;
      if (soltar) usados.add(soltar);
      const sinNadie = !t.id;
      const proxima = w !== semana;
      acciones.push({
        tipo: 'waiver', urgente: sinNadie && !proxima, ganancia: mejor.p - actual, entra: mejor.id, sale: t.id, soltar, semana: w,
        titulo: proxima ? `Semana ${w}: pide a ${nombre(mejor.id)} en waivers`
          : soloVacios || ctx.semanaWaivers > semana ? `Agrega a ${nombre(mejor.id)} como agente libre` : `Agrega a ${nombre(mejor.id)} de waivers`,
        detalle: `${sinNadie ? `No tienes a nadie para ${t.puesto}${proxima ? ` en la semana ${w}` : ''}.` : `Proyecta ${fmt(mejor.p)} vs ${fmt(actual)} de ${nombre(t.id)}.`}` +
          `${soltar ? ` Para hacerle lugar, suelta a ${nombre(soltar)} (el que menos vale en tu banca).` : ''}` +
          (proxima ? ' Los waivers de esta semana ya pasaron: esto es para la que viene.' : conHora(mejor.id)),
      });
      if (++n >= maximo) break;
    }
  };
  if (semanaWaivers === semana) {
    buscar(semana, optima);
  } else {
    buscar(semana, optima, { soloVacios: true, maximo: 2 });
    if (semanaWaivers <= 18) buscar(semanaWaivers, mejorAlineacion(lista(semanaWaivers), rosterPositions));
  }

  // 3) Duda: plan B para titulares "Questionable"
  for (const t of optima.titulares) {
    if (!t.id || J[t.id]?.lesion !== 'Questionable' || bloqueado(t.id)) continue;
    const planB = optima.banca.filter((b) => ELEGIBLES[t.puesto].includes(b.pos) && !enBye(semana, b.id))
      .sort((a, b) => b.valor - a.valor)[0];
    acciones.push({
      tipo: 'duda', urgente: false, ganancia: 0, entra: planB?.id, sale: t.id,
      titulo: `${nombre(t.id)} está en duda`,
      detalle: (planB ? `Revisa el reporte antes del partido. Si no juega, pon a ${nombre(planB.id)} (${fmt(planB.valor)}).`
        : 'Revisa el reporte antes del partido; no tienes reemplazo en la banca, mira waivers.') + conHora(t.id),
    });
  }

  // 4) IR: liberar lugar
  if (ctx.tieneIRLibre) {
    const paraIR = miRoster.find((id) => ['IR', 'PUP'].includes(J[id]?.lesion) && !(ctx.rosterIR || []).includes(id));
    if (paraIR) {
      acciones.push({
        tipo: 'ir', urgente: false, ganancia: 0.5, sale: paraIR,
        titulo: `Mueve a ${nombre(paraIR)} a IR`,
        detalle: 'Tienes un lugar de IR libre: así te queda un espacio en la banca para agregar a alguien.',
      });
    }
  }

  // 5) La semana que viene: prepara los byes desde ahora
  const sig = semana + 1;
  if (sig <= 18) {
    const optSig = mejorAlineacion(lista(sig), rosterPositions);
    const huecos = optSig.titulares.filter((t) => !t.id);
    const seVan = miRoster.filter((id) => enBye(sig, id) && enOptima.has(id));
    if (huecos.length || seVan.length >= 2) {
      const pos = new Set(huecos.flatMap((h) => ELEGIBLES[h.puesto]).concat(seVan.map((id) => J[id].pos)));
      const candidato = libres
        .filter((id) => J[id] && pos.has(J[id].pos) && !enBye(sig, id) && !noJuega(id, sig))
        .map((id) => ({ id, p: proyAjustada(sig, id) || valor(id) / 1000 }))
        .sort((a, b) => b.p - a.p)[0];
      acciones.push({
        tipo: 'proxima', urgente: huecos.length > 0, ganancia: huecos.length ? 3 : 1, entra: candidato?.id,
        titulo: `Semana ${sig}: se te van ${seVan.length} titular${seVan.length === 1 ? '' : 'es'} de bye`,
        detalle: `${seVan.map(nombre).join(', ')}.` +
          (huecos.length ? ` Te quedarían ${huecos.length} puesto${huecos.length > 1 ? 's' : ''} vacío${huecos.length > 1 ? 's' : ''}.` : '') +
          (candidato ? ` Pide ya a ${nombre(candidato.id)} en waivers, antes que los demás.` : ''),
      });
    }
  }

  // 6) Horarios: titulares que juegan fuera del domingo (jueves, sábado, lunes…). Hay que decidir antes.
  const ahora = ctx.ahora ?? Date.now();
  const temprano = optima.titulares
    .filter((t) => t.id && !bloqueado(t.id) && inicio(t.id) && inicio(t.id) > ahora && new Date(inicio(t.id)).getDay() !== 0)
    .sort((a, b) => inicio(a.id) - inicio(b.id));
  if (temprano.length) {
    const primero = inicio(temprano[0].id);
    acciones.push({
      tipo: 'hora', urgente: primero - ahora < 24 * 3600_000, ganancia: 0, sale: temprano[0].id,
      titulo: `Ojo con los horarios ⏰`,
      detalle: `${temprano.slice(0, 3).map((t) => `${nombre(t.id)} juega ${hora(t.id)}`).join('; ')}${/\.$/.test(hora(temprano[Math.min(2, temprano.length - 1)].id)) ? ' ' : '. '}` +
        'Si lo vas a sacar o meter de tu alineación, hazlo antes de esa hora: después se bloquea.',
    });
  }

  return acciones.sort((a, b) => (Number(b.urgente) - Number(a.urgente)) || (b.ganancia - a.ganancia));
}

/**
 * Tu punto débil: la posición donde tus titulares rinden menos comparado con la liga,
 * y un trade justo para mejorarla usando lo que te sobra.
 * equipos: [{rosterId, nombre, ids, esMio}]
 */
export function puntoDebil({ equipos, jugadores: J, rosterPositions, proyAjustada, semana, valor, enLista = () => true }) {
  const pos = ['QB', 'RB', 'WR', 'TE'].filter((p) => rosterPositions.includes(p));
  const fuerza = (e) => {
    const opt = mejorAlineacion(e.ids.filter((id) => J[id]).map((id) => ({ id, pos: J[id].pos, valor: valor(id) })), rosterPositions);
    const res = {};
    for (const p of pos) res[p] = opt.titulares.filter((t) => t.id && J[t.id].pos === p).reduce((s, t) => s + valor(t.id), 0);
    return { res, titulares: new Set(opt.titulares.map((t) => t.id)) };
  };
  const tabla = equipos.map((e) => ({ e, ...fuerza(e) }));
  const mio = tabla.find((t) => t.e.esMio);
  if (!mio) return null;
  let peor = null;
  for (const p of pos) {
    const orden = [...tabla].sort((a, b) => b.res[p] - a.res[p]);
    const rank = orden.indexOf(mio) + 1;
    if (!peor || rank > peor.rank) peor = { pos: p, rank, total: tabla.length };
  }
  if (!peor || peor.rank <= Math.ceil(tabla.length / 2)) return { ...peor, sugerencia: null };

  // Objetivo: el mejor jugador de esa posición que esté en la banca de otro equipo (o que les sobre)
  const objetivos = [];
  for (const t of tabla) {
    if (t === mio) continue;
    for (const id of t.e.ids) {
      if (J[id]?.pos !== peor.pos || !enLista(id)) continue;
      const sobra = !t.titulares.has(id);
      objetivos.push({ id, equipo: t.e, puntaje: valor(id) * (sobra ? 1.3 : 1) });
    }
  }
  objetivos.sort((a, b) => b.puntaje - a.puntaje);
  for (const o of objetivos.slice(0, 6)) {
    const r = proponerTrades({
      recibo: [o.id], miRoster: mio.e.ids.filter((id) => J[id]?.pos !== peor.pos), rosterRival: o.equipo.ids,
      valor, titular: (id) => mio.titulares.has(id),
    });
    const op = r.opciones.find((x) => x.dolor === 0) || r.opciones[0];
    if (op) return { ...peor, sugerencia: { ...op, equipo: o.equipo } };
  }
  return { ...peor, sugerencia: null };
}

const fmt = (x) => (x == null ? '–' : (Math.round(x * 10) / 10).toFixed(1));

const nombreCorto = (J, id) => {
  const n = J[id]?.nombre || '';
  const p = n.split(' ');
  return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : n;
};
