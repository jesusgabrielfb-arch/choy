// Junta todos los datos de una liga y corre los análisis.
import * as S from './datos/sleeper.js';
import { valores as pedirValores, valorRespaldo } from './datos/valores.js';
import { partidosSemana, equiposEnBye, rivales as rivalesDe } from './datos/calendario.js';
import { leerCache, guardarCache } from './datos/http.js';
import { puntos, promedioReciente } from './analisis/puntos.js';
import { puntosPermitidos, recomendarTitulares, factorCruce, rankingDefensas, mejoresDefensas } from './analisis/defensas.js';
import { comprarBarato, venderCaro } from './analisis/compraventa.js';
import { alertasBye } from './analisis/byes.js';
import { analizarLesiones } from './analisis/lesiones.js';
import { puestosTitulares } from './analisis/alineacion.js';
import { planSemana, puntoDebil } from './analisis/plan.js';
import { duelosSemana } from './analisis/probabilidad.js';
import { progresoPorEquipo } from './datos/calendario.js';

export const sesion = {
  get usuario() { return leerCache('sesion'); },
  set usuario(u) { guardarCache('sesion', u); },
  get equipo() { return leerCache('equipoFavorito'); },
  set equipo(abr) { guardarCache('equipoFavorito', abr); },
  salir() { localStorage.removeItem('fg:sesion'); },
};

const seguro = (p, defecto) => p.catch((e) => { console.warn(e); return defecto; });

export async function cargarInicio(nombre) {
  const u = await S.usuario(nombre);
  if (!u?.user_id) throw new Error('No encontré ese usuario en Sleeper');
  const estado = await S.estadoNFL();
  const temporada = estado.league_season || estado.season;
  const lista = await S.ligas(u.user_id, temporada);
  return { usuario: u, estado, temporada, ligas: lista || [] };
}

const cacheLigas = new Map();

export async function cargarLiga(ligaId, usuarioId, { forzar = false, semana = null } = {}) {
  const clave = `${ligaId}:${semana || 'actual'}`;
  if (!forzar && cacheLigas.has(clave)) return cacheLigas.get(clave);
  const p = armarLiga(ligaId, usuarioId, semana);
  cacheLigas.set(clave, p);
  p.catch(() => cacheLigas.delete(clave));
  return p;
}

async function armarLiga(ligaId, usuarioId, semanaVista = null) {
  const [liga, rosters, usuarios, estado, jugadores] = await Promise.all([
    S.liga(ligaId), S.rosters(ligaId), S.usuariosLiga(ligaId), S.estadoNFL(), S.jugadores(),
  ]);
  const temporada = liga.season || estado.season;
  const enCurso = estado.season_type === 'regular' && String(estado.season) === String(temporada);
  const semanaActual = Math.max(1, Math.min(18, enCurso ? (estado.display_week || estado.week || 1) : 1));
  const semana = semanaVista ? Math.max(1, Math.min(18, Number(semanaVista))) : semanaActual;
  const reglas = liga.scoring_settings || {};
  const puestos = liga.roster_positions || [];

  const pasadas = [];
  for (let w = Math.max(1, semanaActual - 8); w < semanaActual; w++) pasadas.push(w);
  const futuras = [...new Set([semana, semana + 1, semana + 2, semana + 3, semanaActual])].filter((w) => w <= 18 && !pasadas.includes(w));

  const [vals, proyAhora, proySig, statsPasadas, partidos, matchAhora, tendAdd, tendDrop] = await Promise.all([
    seguro(pedirValores(liga), {}),
    seguro(S.proyecciones(temporada, semana), {}),
    seguro(S.proyecciones(temporada, semana + 1), {}),
    Promise.all(pasadas.map((w) => seguro(S.estadisticas(temporada, w), {}))),
    Promise.all([...pasadas, ...futuras].map((w) => seguro(partidosSemana(temporada, w, { vivo: w === semanaActual }), []))),
    seguro(S.matchups(ligaId, semana), []),
    seguro(S.tendencias('add'), []),
    seguro(S.tendencias('drop'), []),
  ]);

  const partidosPor = {};
  [...pasadas, ...futuras].forEach((w, i) => { partidosPor[w] = partidos[i]; });
  const rivalesPor = Object.fromEntries(Object.entries(partidosPor).map(([w, p]) => [w, rivalesDe(p)]));
  const byesPor = Object.fromEntries(Object.entries(partidosPor).map(([w, p]) => [w, equiposEnBye(p)]));

  // FantasyCalc solo valora a ~200 jugadores; al resto le doy un valor aproximado que nunca
  // supera al último que sí tiene valor.
  const minimoFC = Math.min(...Object.values(vals).map((v) => v.valor).filter((v) => v > 0), Infinity);
  const tope = Number.isFinite(minimoFC) ? minimoFC * 0.95 : Infinity;
  const valor = (id) => vals[id]?.valor ?? Math.min(tope, valorRespaldo(jugadores[id]));
  const proyecciones = { [semana]: proyAhora, [semana + 1]: proySig };
  const proy = (w, id) => {
    const f = proyecciones[w]?.[id];
    return f ? puntos(f.stats, reglas) : null;
  };

  const nombres = Object.fromEntries(usuarios.map((u) => [u.user_id, u]));
  const equipos = rosters.map((r) => {
    const u = nombres[r.owner_id] || {};
    return {
      rosterId: r.roster_id,
      dueno: r.owner_id,
      nombre: u.metadata?.team_name || u.display_name || `Equipo ${r.roster_id}`,
      usuario: u.display_name || '',
      avatar: u.avatar || null,
      ids: (r.players || []).filter((id) => jugadores[id]),
      titulares: r.starters || [],
      reserva: r.reserve || [],
      record: r.settings ? `${r.settings.wins ?? 0}-${r.settings.losses ?? 0}${r.settings.ties ? '-' + r.settings.ties : ''}` : '',
      puntos: (r.settings?.fpts ?? 0) + (r.settings?.fpts_decimal ?? 0) / 100,
      esMio: r.owner_id === usuarioId || (r.co_owners || []).includes(usuarioId),
    };
  });
  const mio = equipos.find((e) => e.esMio) || null;
  const rosteados = new Set(equipos.flatMap((e) => e.ids));
  const posLiga = new Set(puestosTitulares(puestos).flatMap((p) => ({
    FLEX: ['RB', 'WR', 'TE'], WRRB_FLEX: ['RB', 'WR'], REC_FLEX: ['WR', 'TE'], SUPER_FLEX: ['QB', 'RB', 'WR', 'TE'],
  }[p] || [p])));
  const libres = Object.values(jugadores)
    .filter((j) => j.equipo && posLiga.has(j.pos) && !rosteados.has(j.id))
    .sort((a, b) => valor(b.id) - valor(a.id) || a.rank - b.rank)
    .slice(0, 400)
    .map((j) => j.id);

  // Defensas
  const semanasStats = pasadas.map((w, i) => ({ semana: w, stats: statsPasadas[i], rivales: rivalesPor[w] || {} }));
  const permitidos = puntosPermitidos(semanasStats, jugadores, reglas);
  const proySemana = Object.fromEntries(Object.keys(proyAhora).map((id) => [id, proy(semana, id)]));

  const res = {
    semanaActual, esPasada: semana < semanaActual, esFutura: semana > semanaActual,
    liga, temporada, semana, enCurso, reglas, puestos, jugadores, valores: vals, valor, proy, equipos, mio,
    rosteados, libres, permitidos, rivalesPor, byesPor, tendAdd, tendDrop, sinValores: !Object.keys(vals).length,
    sinProyecciones: !Object.keys(proyAhora).length, sinStats: !semanasStats.some((s) => Object.keys(s.stats).length),
  };
  if (!mio) return res;

  res.titulares = recomendarTitulares({
    miRoster: mio.ids, titularesActuales: mio.titulares, jugadores, proy: proySemana, permitidos,
    rivales: rivalesPor[semana] || {}, rosterPositions: puestos, byes: byesPor[semana] || new Set(),
  });

  // Duelos de la semana con probabilidad de ganar (en vivo si hay partidos jugándose)
  const prog = progresoPorEquipo(partidosPor[semana] || []);
  const progresoDe = (id) => (semana < semanaActual ? 1 : prog[jugadores[id]?.equipo] ?? (byesPor[semana]?.has(jugadores[id]?.equipo) ? 1 : 0));
  res.duelos = duelosSemana({ matchups: matchAhora, equipos, proy: (id) => proy(semana, id), progreso: progresoDe })
    .map((dd) => (dd.b.equipo.esMio ? { a: dd.b, b: dd.a } : dd))
    .sort((x, y) => Number(!!y.a.equipo.esMio) - Number(!!x.a.equipo.esMio));
  const mioDuelo = res.duelos.find((dd) => dd.a.equipo.esMio);
  if (mioDuelo) {
    res.duelo = {
      mis: mioDuelo.a.hechos || mioDuelo.a.puntos, suyos: mioDuelo.b.hechos || mioDuelo.b.puntos,
      misProy: mioDuelo.a.esperado, suyosProy: mioDuelo.b.esperado, prob: mioDuelo.a.prob, rival: mioDuelo.b.equipo,
    };
  }

  // Comprar barato / vender caro
  const proximos = (id) => {
    const j = jugadores[id];
    const fs = futuras.slice(0, 3).map((w) => rivalesPor[w]?.[j.equipo]).filter(Boolean)
      .map((r) => factorCruce(permitidos, r, j.pos));
    return fs.length ? fs.reduce((a, b) => a + b, 0) / fs.length : 1;
  };
  const datosJugador = (id) => {
    const j = jugadores[id];
    return {
      id, nombre: j.nombre, pos: j.pos, equipo: j.equipo, edad: j.edad, lesion: j.lesion, valor: valor(id),
      tendencia: vals[id]?.tendencia ?? 0, reciente: promedioReciente(id, statsPasadas, reglas, 3),
      esperado: proy(semana, id) ?? promedioReciente(id, statsPasadas, reglas, 8), proximosCruces: proximos(id),
    };
  };
  const dueno = Object.fromEntries(equipos.flatMap((e) => e.ids.map((id) => [id, e])));
  res.comprar = comprarBarato(equipos.filter((e) => !e.esMio).flatMap((e) => e.ids).map(datosJugador))
    .slice(0, 12).map((j) => ({ ...j, equipoFantasy: dueno[j.id] }));
  res.vender = venderCaro(mio.ids.map(datosJugador)).slice(0, 8);

  // Byes y lesiones
  res.byes = alertasBye({
    semanas: [semana, semana + 1].filter((w) => w <= 18), miRoster: mio.ids, jugadores, byesPorSemana: byesPor,
    rosterPositions: puestos, libres, valor, proy,
  });
  const tieneIR = (liga.settings?.reserve_slots ?? 0) > 0;
  res.lesiones = analizarLesiones({ jugadores, miRoster: mio.ids, rosteados, valor, tieneIR });

  // Mejores defensas de cada semana según el rival (todas: tuya, libres y de otros equipos)
  const duenoDe = (id) => (mio.ids.includes(id) ? 'mia' : dueno[id] ? dueno[id].nombre : 'libre');
  const defensas = {};
  res.defensasSemana = (w) => (defensas[w] ??= mejoresDefensas({
    jugadores, rivales: rivalesPor[w] || {}, permitidos, proy: (id) => proy(w, id), dueno: duenoDe, limite: 32,
  }));
  const todasHoy = res.defensasSemana(semana);
  const miDef = todasHoy.find((x) => x.dueno === 'mia') || null;
  const mejorLibre = todasHoy.find((x) => x.dueno === 'libre') || null;
  res.defensa = {
    mia: miDef, mejorLibre,
    miaEnBye: mio.ids.some((id) => jugadores[id]?.pos === 'DEF') && !miDef,
    cambiar: !!mejorLibre && (!miDef || mejorLibre.puntaje - miDef.puntaje >= 1.5),
  };
  const rankings = {};
  res.ranking = (pos) => (rankings[pos] ??= rankingDefensas(permitidos, pos));
  const factor = (rival, pos) => res.ranking(pos).find((f) => f.equipo === rival)?.factor ?? 1;
  const enBye = (w, id) => !!byesPor[w]?.has(jugadores[id]?.equipo);
  const proyAjustada = (w, id) => {
    const j = jugadores[id];
    if (!j || enBye(w, id) || ['Out', 'IR', 'PUP', 'Sus'].includes(j.lesion)) return 0;
    const base = proy(w, id);
    if (base == null) return 0;
    const rival = rivalesPor[w]?.[j.equipo];
    const f = rival ? factor(rival, j.pos) : 1;
    return base * (0.6 + 0.4 * Math.min(1.35, Math.max(0.7, f)));
  };
  res.proyAjustada = proyAjustada;
  const ocupadoIR = (mio.reserva || []).length;
  res.plan = planSemana({
    semana, miRoster: mio.ids.filter((id) => !(mio.reserva || []).includes(id)), titularesActuales: mio.titulares,
    jugadores, rosterPositions: puestos, proyAjustada, enBye, libres, valor,
    tieneIRLibre: (liga.settings?.reserve_slots ?? 0) > ocupadoIR, rosterIR: mio.reserva,
  });
  res.debil = puntoDebil({ equipos, jugadores, rosterPositions: puestos, proyAjustada, semana, valor });
  res.consejos = armarConsejos(res);
  return res;
}

/** Lo que Cody te dice, en orden de importancia (sale del plan de la semana). */
export function armarConsejos(d) {
  const J = d.jugadores;
  const c = [];
  const animoDe = { alineacion: 'Sorpresa', waiver: 'Cool', duda: 'Hablar', ir: 'Hablar', proxima: 'Hablar' };
  for (const a of d.plan.slice(0, 5)) {
    const mas = a.ganancia > 0.5 ? ` Eso te da +${a.ganancia.toFixed(1)} puntos.` : '';
    c.push({ animo: a.urgente ? 'Sorpresa' : animoDe[a.tipo] || 'Hablar', tab: a.tipo === 'waiver' || a.tipo === 'proxima' ? 'jugadores' : 'equipo',
      texto: `${a.titulo}. ${a.detalle}${mas}` });
  }
  if (d.defensa?.cambiar && d.defensa.mejorLibre) {
    const x = d.defensa.mejorLibre;
    c.push({ animo: 'Cool', tab: 'equipo', texto: `🛡️ Defensa de la semana: ${J[x.id]?.nombre} está libre (${x.razon}). ` +
      (d.defensa.mia ? `Es mejor que la tuya (${J[d.defensa.mia.id]?.nombre}, #${d.defensa.mia.rank}).` : 'Tu defensa no juega esta semana.') });
  }
  if (d.debil?.sugerencia) {
    const s = d.debil.sugerencia;
    c.push({ animo: 'Cool', tab: 'mercado', texto: `Tu punto débil es ${d.debil.pos} (puesto ${d.debil.rank} de ${d.debil.total}). ` +
      `Pídele a ${s.equipo.nombre} a ${s.recibo.map((id) => J[id].nombre).join(' + ')} y ofrece ${s.doy.map((id) => J[id].nombre).join(' + ')}: es un trade justo.` });
  }
  if (d.comprar[0]) {
    const j = d.comprar[0];
    c.push({ animo: 'Cool', tab: 'mercado', texto: `Compra barato: ${j.nombre} (${j.equipoFantasy?.nombre}) ${j.razones[0]}.` });
  }
  if (d.vender[0]) {
    const j = d.vender[0];
    c.push({ animo: 'Cool', tab: 'mercado', texto: `Vende caro: ${j.nombre} ${j.razones[0]}. Aprovecha ahora.` });
  }
  if (d.duelo) {
    const pct = Math.round(d.duelo.prob * 100);
    const rival = d.duelo.rival?.nombre || 'tu rival';
    const gano = d.duelo.prob >= 0.5;
    c.push({ animo: gano ? 'Feliz' : 'Triste', tab: 'inicio', texto: gano
      ? `Tienes ${pct}% de ganarle a ${rival}. ¡No te confíes, que el pan se quema en la puerta del horno!`
      : `Solo tienes ${pct}% contra ${rival} (te faltan ${(d.duelo.suyosProy - d.duelo.misProy).toFixed(1)} puntos). Haz los cambios del plan.` });
  }
  if (!c.length) c.push({ animo: 'Feliz', tab: 'inicio', texto: 'Aquí Cody: todo tranquilo. Tu alineación ya es la mejor posible.' });
  return c;
}
