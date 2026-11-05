// Trades justos con valores de FantasyCalc.
import { mejorAlineacion } from './alineacion.js';
// Un paquete de varios jugadores vale menos que la suma: el mejor jugador manda.

const PESOS = [1, 0.72, 0.55, 0.45, 0.4];

export function valorPaquete(valores) {
  return [...valores]
    .sort((a, b) => b - a)
    .reduce((s, v, i) => s + v * (PESOS[i] ?? 0.35), 0);
}

// Las ofertas se arman a favor del que manda el trade, pero sin pasarse:
// das cerca del 88 % de lo que recibes (ni menos del 78 %, porque nadie lo aceptaría).
export const OBJETIVO = 0.88;
export const MINIMO = 0.78;
export const MAXIMO = 1.0;
/** Qué tan cerca está la oferta del punto ideal (1 = justo en el 88 %). */
const cercania = (ratio) => Math.max(0, 1 - Math.abs(ratio - OBJETIVO) / 0.25);

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
  return e >= MINIMO ? { tipo: 'ganas', texto: 'A tu favor y aceptable', aceptable: true } : { tipo: 'ganas', texto: 'Te favorece mucho (difícil que lo acepten)' };
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
    const ratio = vRecibo ? v / vRecibo : 1;
    if (ratio < MINIMO || ratio > MAXIMO) continue;
    const e = equidad(v, vRecibo);
    const dolor = combo.reduce((s, id) => s + (titular(id) ? 1 : 0), 0);
    opciones.push({ doy: combo, recibo, vDoy: v, vRecibo, equidad: e, ratio, dolor, ...veredicto(v, vRecibo) });
  }
  // 2) Si ya elegí qué dar, equilibrar sumando un jugador de un lado
  if (actual && (actual.vDoy / actual.vRecibo > MAXIMO || actual.vDoy / actual.vRecibo < MINIMO)) {
    if (vDoy < vRecibo) {
      for (const id of mios.filter((x) => !doy.includes(x))) {
        const nuevo = [...doy, id];
        const v = valorPaquete(nuevo.map(valor));
        const ratio = v / vRecibo;
        if (ratio >= MINIMO && ratio <= MAXIMO) opciones.push({ doy: nuevo, recibo, vDoy: v, vRecibo, equidad: equidad(v, vRecibo), ratio, dolor: titular(id) ? 1 : 0, agrega: 'tú', ...veredicto(v, vRecibo) });
      }
    } else {
      for (const id of rosterRival.filter((x) => !recibo.includes(x) && valor(x) > 0)) {
        const nuevo = [...recibo, id];
        const v = valorPaquete(nuevo.map(valor));
        const ratio = vDoy / v;
        if (ratio >= MINIMO && ratio <= MAXIMO) opciones.push({ doy, recibo: nuevo, vDoy, vRecibo: v, equidad: equidad(vDoy, v), ratio, dolor: 0, agrega: 'rival', ...veredicto(vDoy, v) });
      }
    }
  }
  const clave = (o) => [...o.doy].sort().join(',') + '>' + [...o.recibo].sort().join(',');
  const vistos = new Set();
  const unicas = opciones
    .sort((a, b) => (a.dolor - b.dolor) || (a.doy.length + a.recibo.length - b.doy.length - b.recibo.length) ||
      (cercania(b.ratio) - cercania(a.ratio)))
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

const POS_TRADE = ['QB', 'RB', 'WR', 'TE'];

/**
 * Buscador por necesidad: "necesito un WR".
 * 1) Ve qué te sobra a ti: jugadores que, si se van, casi no bajan tu alineación.
 * 2) Busca equipos a los que les SOBRA esa posición (tienen varios buenos y alguno no cabe de titular)
 *    y a los que les FALTA algo que a ti te sobra.
 * 3) Arma trades parejos (1 o 2 de los tuyos por 1 de ellos) que te mejoran la alineación
 *    y que también les sirven a ellos, así es más fácil que acepten.
 * equipos: [{ rosterId, nombre, ids, esMio }]; jugadores: { id: { pos } }; valor(id) → número.
 */
export function buscarPorNecesidad({ necesito, equipos, jugadores: J, rosterPositions, valor, limite = 9 }) {
  const fuerzaAlineacion = (ids) => mejorAlineacion(
    ids.filter((id) => J[id] && POS_TRADE.includes(J[id].pos)).map((id) => ({ id, pos: J[id].pos, valor: valor(id) })),
    rosterPositions,
  ).titulares.reduce((s, t) => s + (t.id ? valor(t.id) : 0), 0);
  // Cuánto pierde un equipo si se va este jugador, comparado con lo que vale (0 = le sobra del todo)
  const peso = (ids, base, id) => {
    const v = valor(id);
    return v ? (base - fuerzaAlineacion(ids.filter((x) => x !== id))) / v : 1;
  };
  // Fuerza de cada equipo por posición (suma de sus titulares en esa posición) → ranking de necesidades
  const titularesDe = (ids) => new Set(mejorAlineacion(
    ids.filter((id) => J[id]).map((id) => ({ id, pos: J[id].pos, valor: valor(id) })), rosterPositions,
  ).titulares.map((t) => t.id));
  const info = equipos.map((e) => {
    const base = fuerzaAlineacion(e.ids);
    const tit = titularesDe(e.ids);
    const porPos = {};
    for (const p of POS_TRADE) porPos[p] = e.ids.filter((id) => J[id]?.pos === p && tit.has(id)).reduce((s, id) => s + valor(id), 0);
    return { e, base, tit, porPos };
  });
  const lugar = {}; // lugar[rosterId][pos]: 1 = el más fuerte
  for (const p of POS_TRADE) {
    [...info].sort((a, b) => b.porPos[p] - a.porPos[p]).forEach((x, i) => { (lugar[x.e.rosterId] ??= {})[p] = i + 1; });
  }
  const total = info.length;
  const mio = info.find((x) => x.e.esMio);
  if (!mio) return { sobrantes: [], opciones: [] };

  // Lo que te sobra a ti (fuera de la posición que necesitas)
  const misCandidatos = mio.e.ids
    .filter((id) => J[id] && POS_TRADE.includes(J[id].pos) && J[id].pos !== necesito && valor(id) > 300)
    .map((id) => ({ id, pierde: peso(mio.e.ids, mio.base, id) }))
    .sort((a, b) => valor(b.id) - valor(a.id));
  const sobrantes = misCandidatos.filter((x) => x.pierde < 0.6).slice(0, 7);
  const sobraSet = new Set(sobrantes.map((x) => x.id));
  // Para el plan desesperado también entran tus titulares (los 4 que más valen fuera de esa posición)
  const titularesMios = misCandidatos.filter((x) => !sobraSet.has(x.id)).slice(0, 4);
  const pool = [...sobrantes, ...titularesMios].map((x) => x.id);

  const combos = [];
  for (let i = 0; i < pool.length; i++) {
    combos.push([pool[i]]);
    for (let k = i + 1; k < pool.length; k++) combos.push([pool[i], pool[k]]);
  }

  const opciones = [];
  for (const otro of info) {
    if (otro === mio) continue;
    const suyos = otro.e.ids.filter((id) => J[id]?.pos === necesito && valor(id) > 300);
    const buenos = suyos.filter((id) => valor(id) >= 1500).length;
    const pesos = suyos.map((id) => ({ id, pierde: peso(otro.e.ids, otro.base, id) }));
    // Les sobra: casi no les baja la alineación. Para el plan desesperado, también su mejor de esa posición.
    const objetivos = [
      ...pesos.filter((x) => x.pierde < 0.6).sort((a, b) => valor(b.id) - valor(a.id)).slice(0, 3).map((x) => ({ ...x, sobra: true })),
      ...pesos.filter((x) => x.pierde >= 0.6).sort((a, b) => valor(b.id) - valor(a.id)).slice(0, 1).map((x) => ({ ...x, sobra: false })),
    ];
    for (const obj of objetivos) {
      const vObj = valor(obj.id);
      for (const doy of combos) {
        const vDoy = valorPaquete(doy.map(valor));
        const e = equidad(vDoy, vObj);
        const ratio = vObj ? vDoy / vObj : 1;
        const pagoDeMas = ratio > MAXIMO + 0.02;
        // A tu favor (das entre 78 % y 100 % de lo que recibes) o, si estás desesperado, hasta 1.5 veces
        if (ratio < MINIMO || ratio > 1.5) continue;
        const misIds = [...mio.e.ids.filter((x) => !doy.includes(x)), obj.id];
        const susIds = [...otro.e.ids.filter((x) => x !== obj.id), ...doy];
        const yoGano = fuerzaAlineacion(misIds) - mio.base;
        const ellosGanan = fuerzaAlineacion(susIds) - otro.base;
        if (yoGano <= 0) continue;
        const lesFalta = doy.map((id) => J[id].pos).filter((p, i, arr) => arr.indexOf(p) === i)
          .map((p) => ({ pos: p, lugar: lugar[otro.e.rosterId][p] }))
          .sort((x, y) => y.lugar - x.lugar)[0];
        const necesidad = lesFalta ? (lesFalta.lugar - 1) / Math.max(1, total - 1) : 0;
        const tocaTitular = doy.some((id) => !sobraSet.has(id));
        // Nivel: lo mejor / lo medio / desesperado
        let nivel;
        if (tocaTitular || pagoDeMas || !obj.sobra) nivel = 'desesperado';
        else if (ratio >= 0.8 && ratio <= 0.97 && necesidad >= 0.5 && ellosGanan > 0) nivel = 'mejor';
        else nivel = 'medio';
        const puntaje = (0.4 + 0.6 * cercania(ratio)) * (0.45 + 0.35 * necesidad + 0.2 * (ellosGanan > 0 ? 1 : 0))
          * (1 + Math.min(1, yoGano / Math.max(1, vObj)));
        opciones.push({
          rosterId: otro.e.rosterId, equipo: otro.e, recibo: [obj.id], doy, vDoy, vRecibo: vObj, equidad: e,
          yoGano, ellosGanan, buenos, lesFalta, total, puntaje, nivel, tocaTitular, pagoDeMas, esSuTitular: !obj.sobra, ratio,
          ...veredicto(vDoy, vObj),
        });
      }
    }
  }
  // Por nivel: la mejor opción por jugador que recibes, hasta 3 por nivel
  const porNivel = {};
  const usados = new Set();
  for (const nivel of ['mejor', 'medio', 'desesperado']) {
    const vistos = new Set();
    porNivel[nivel] = opciones.filter((o) => o.nivel === nivel)
      // en el desesperado, lo que más te mejora primero
      .sort((a, b) => (nivel === 'desesperado' ? b.yoGano - a.yoGano : b.puntaje - a.puntaje))
      .filter((o) => {
        const k = o.recibo[0];
        // Cada jugador que recibes sale una sola vez (en el mejor nivel donde aparezca)
        if (vistos.has(k) || usados.has(k)) return false;
        vistos.add(k);
        return true;
      })
      .slice(0, 3);
    porNivel[nivel].forEach((o) => usados.add(o.recibo[0]));
  }
  const unicas = [...porNivel.mejor, ...porNivel.medio, ...porNivel.desesperado];
  return {
    sobrantes, opciones: unicas.slice(0, limite), porNivel,
    miLugar: lugar[mio.e.rosterId]?.[necesito] ?? null, total,
  };
}

/**
 * Calculadora de trades entre dos equipos cualesquiera.
 * a, b: { nombre, ids (su plantel), da: [ids que manda] }
 * Para cada lado: cuánto valor recibe y da, qué % del trade se lleva, cómo cambia su alineación
 * (en valor y en puntos proyectados de la semana) y el veredicto. Si no es parejo, qué falta para emparejarlo.
 * proy(id) → puntos proyectados de la semana (opcional).
 */
export function evaluarTrade({ a, b, valor, jugadores: J, rosterPositions, proy = null }) {
  const elegibles = (ids, f) => ids.filter((id) => J[id]).map((id) => ({ id, pos: J[id].pos, valor: f(id) }));
  const suma = (ids, f) => mejorAlineacion(elegibles(ids, f), rosterPositions).titulares.reduce((s, t) => s + (t.id ? f(t.id) : 0), 0);
  const lado = (yo, otro) => {
    const recibe = valorPaquete(otro.da.map(valor));
    const da = valorPaquete(yo.da.map(valor));
    const despues = [...yo.ids.filter((id) => !yo.da.includes(id)), ...otro.da];
    const antesV = suma(yo.ids, valor);
    const despuesV = suma(despues, valor);
    const antesP = proy ? suma(yo.ids, (id) => proy(id) || 0) : null;
    const despuesP = proy ? suma(despues, (id) => proy(id) || 0) : null;
    const conEquipo = yo.ids.length > 0; // sin equipo elegido solo se mide el valor
    return {
      nombre: yo.nombre, recibe, da, neto: recibe - da,
      alineacion: conEquipo && antesV ? (despuesV - antesV) / antesV : null,
      puntos: conEquipo && proy ? despuesP - antesP : null,
      // ¿Llena un hueco? Posiciones que recibe y que antes no tenía de titular
      posRecibe: [...new Set(otro.da.map((id) => J[id]?.pos).filter(Boolean))],
    };
  };
  const A = lado(a, b);
  const B = lado(b, a);
  const total = A.recibe + B.recibe;
  A.parte = total ? A.recibe / total : 0.5;
  B.parte = 1 - A.parte;
  const dif = Math.abs(A.parte - 0.5);
  let veredicto;
  if (!a.da.length && !b.da.length) veredicto = { tipo: 'vacio', texto: 'Elige jugadores de los dos lados' };
  else if (dif < 0.035) veredicto = { tipo: 'parejo', texto: 'Trade parejo: ninguno sale perdiendo' };
  else {
    const gana = A.parte > 0.5 ? A : B;
    const cuanto = dif < 0.08 ? 'un poco' : dif < 0.15 ? 'claramente' : 'por mucho';
    veredicto = { tipo: 'gana', gana: gana === A ? 'a' : 'b', texto: `${gana.nombre} gana ${cuanto}`, cuanto };
  }
  // Para emparejar: qué jugador del que gana podría agregar
  let emparejar = null;
  if (veredicto.tipo === 'gana') {
    const [gana, pierde, ladoGana] = veredicto.gana === 'a' ? [A, B, a] : [B, A, b];
    const otro = ladoGana === a ? b : a;
    const candidatos = (ladoGana.ids.length ? ladoGana.ids : []).filter((id) => !ladoGana.da.includes(id) && valor(id) > 0)
      .map((id) => {
        const nuevoDa = valorPaquete([...ladoGana.da, id].map(valor));
        const recibeOtro = nuevoDa;
        const recibeGana = valorPaquete(otro.da.map(valor));
        const parte = recibeGana / (recibeGana + recibeOtro);
        return { id, parte, dif: Math.abs(parte - 0.5) };
      })
      .sort((x, y) => x.dif - y.dif);
    if (candidatos[0] && candidatos[0].dif < dif) {
      emparejar = { quien: gana.nombre, para: pierde.nombre, id: candidatos[0].id, parte: candidatos[0].parte };
    } else {
      // Sin plantel para buscar: cuánto valor le falta al que pierde
      emparejar = { quien: gana.nombre, para: pierde.nombre, falta: Math.max(0, gana.recibe - pierde.recibe) };
    }
  }
  return { a: A, b: B, veredicto, emparejar };
}
