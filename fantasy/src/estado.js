// Junta todos los datos de una liga y corre los análisis.
import * as S from './datos/sleeper.js';
import { valores as pedirValores, valorRespaldo } from './datos/valores.js';
import { partidosSemana, equiposEnBye, rivales as rivalesDe } from './datos/calendario.js';
import { leerCache, guardarCache } from './datos/http.js';
import { puntos, promedioReciente } from './analisis/puntos.js';
import { puntosPermitidos, recomendarTitulares, factorCruce, rankingDefensas } from './analisis/defensas.js';
import { comprarBarato, venderCaro } from './analisis/compraventa.js';
import { alertasBye } from './analisis/byes.js';
import { analizarLesiones } from './analisis/lesiones.js';
import { puestosTitulares } from './analisis/alineacion.js';

export const sesion = {
  get usuario() { return leerCache('sesion'); },
  set usuario(u) { guardarCache('sesion', u); },
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

export async function cargarLiga(ligaId, usuarioId, { forzar = false } = {}) {
  if (!forzar && cacheLigas.has(ligaId)) return cacheLigas.get(ligaId);
  const p = armarLiga(ligaId, usuarioId);
  cacheLigas.set(ligaId, p);
  p.catch(() => cacheLigas.delete(ligaId));
  return p;
}

async function armarLiga(ligaId, usuarioId) {
  const [liga, rosters, usuarios, estado, jugadores] = await Promise.all([
    S.liga(ligaId), S.rosters(ligaId), S.usuariosLiga(ligaId), S.estadoNFL(), S.jugadores(),
  ]);
  const temporada = liga.season || estado.season;
  const enCurso = estado.season_type === 'regular' && String(estado.season) === String(temporada);
  const semana = Math.max(1, Math.min(18, enCurso ? (estado.display_week || estado.week || 1) : 1));
  const reglas = liga.scoring_settings || {};
  const puestos = liga.roster_positions || [];

  const pasadas = [];
  for (let w = Math.max(1, semana - 8); w < semana; w++) pasadas.push(w);
  const futuras = [semana, semana + 1, semana + 2, semana + 3].filter((w) => w <= 18);

  const [vals, proyAhora, proySig, statsPasadas, partidos, matchAhora, tendAdd, tendDrop] = await Promise.all([
    seguro(pedirValores(liga), {}),
    seguro(S.proyecciones(temporada, semana), {}),
    seguro(S.proyecciones(temporada, semana + 1), {}),
    Promise.all(pasadas.map((w) => seguro(S.estadisticas(temporada, w), {}))),
    Promise.all([...pasadas, ...futuras].map((w) => seguro(partidosSemana(temporada, w), []))),
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
    liga, temporada, semana, enCurso, reglas, puestos, jugadores, valores: vals, valor, proy, equipos, mio,
    rosteados, libres, permitidos, rivalesPor, byesPor, tendAdd, tendDrop, sinValores: !Object.keys(vals).length,
    sinProyecciones: !Object.keys(proyAhora).length, sinStats: !semanasStats.some((s) => Object.keys(s.stats).length),
  };
  if (!mio) return res;

  res.titulares = recomendarTitulares({
    miRoster: mio.ids, titularesActuales: mio.titulares, jugadores, proy: proySemana, permitidos,
    rivales: rivalesPor[semana] || {}, rosterPositions: puestos, byes: byesPor[semana] || new Set(),
  });

  // Duelo de esta semana
  const miMatch = matchAhora.find((m) => m.roster_id === mio.rosterId);
  if (miMatch?.matchup_id) {
    const suyo = matchAhora.find((m) => m.matchup_id === miMatch.matchup_id && m.roster_id !== mio.rosterId);
    const proyTit = (m) => (m?.starters || []).reduce((s, id) => s + (proy(semana, id) ?? 0), 0);
    res.duelo = {
      mis: miMatch.points ?? 0, suyos: suyo?.points ?? 0, misProy: proyTit(miMatch), suyosProy: proyTit(suyo),
      rival: equipos.find((e) => e.rosterId === suyo?.roster_id) || null,
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

  // Mejores defensas para poner (streaming): DEF libres con el cruce más fácil
  const rivalesHoy = rivalesPor[semana] || {};
  res.defensasLibres = libres
    .filter((id) => jugadores[id].pos === 'DEF' && rivalesHoy[jugadores[id].equipo])
    .map((id) => ({ id, rival: rivalesHoy[jugadores[id].equipo], factor: factorCruce(permitidos, rivalesHoy[jugadores[id].equipo], 'DEF'), proy: proy(semana, id) }))
    .sort((a, b) => (b.proy ?? 0) * 0.5 + b.factor * 5 - ((a.proy ?? 0) * 0.5 + a.factor * 5))
    .slice(0, 5);
  res.ranking = (pos) => rankingDefensas(permitidos, pos);
  res.consejos = armarConsejos(res);
  return res;
}

/** Lo que la mascota te dice, en orden de importancia. */
export function armarConsejos(d) {
  const J = d.jugadores;
  const n = (id) => J[id]?.nombre || id;
  const c = [];
  const tit = new Set(d.mio.titulares);
  for (const j of d.lesiones.mios) {
    if (tit.has(j.id) && ['Out', 'IR', 'Doubtful', 'PUP', 'Sus'].includes(j.lesion)) {
      c.push({ animo: 'Sorpresa', tab: 'lesiones', texto: `¡Ojo! ${j.nombre} está de titular y viene ${j.lesion === 'Doubtful' ? 'muy en duda' : 'fuera'}. Cámbialo ya.` });
    }
  }
  for (const a of d.byes) {
    if (a.semana === d.semana && a.titularesAfectados.length) {
      c.push({ animo: 'Sorpresa', tab: 'waivers', texto: `Esta semana se te van de bye ${a.titularesAfectados.map(n).join(', ')}.${a.sugerencias[0] ? ` En waivers está ${n(a.sugerencias[0].id)}.` : ''}` });
    } else if (a.semana === d.semana + 1 && a.enBye.length) {
      c.push({ animo: 'Hablar', tab: 'waivers', texto: `Aviso: la semana que viene se van de bye ${a.enBye.map(n).join(', ')}. Ve preparando el cambio.` });
    }
  }
  if (d.titulares?.poner.length) {
    c.push({ animo: 'Hablar', tab: 'equipo', texto: `Pon de titular a ${d.titulares.poner.map(n).join(', ')} y sienta a ${d.titulares.sentar.map(n).join(', ') || 'quien está en la banca'}.` });
  }
  if (d.comprar[0]) {
    const j = d.comprar[0];
    c.push({ animo: 'Cool', tab: 'mercado', texto: `Compra barato: ${j.nombre} (${j.equipoFantasy?.nombre}) ${j.razones[0]}. Es buen momento para pedirlo.` });
  }
  if (d.vender[0]) {
    const j = d.vender[0];
    c.push({ animo: 'Cool', tab: 'mercado', texto: `Vende caro: ${j.nombre} ${j.razones[0]}. Aprovecha ahora.` });
  }
  if (d.lesiones.stash[0]) {
    const j = d.lesiones.stash[0];
    c.push({ animo: 'Hablar', tab: 'lesiones', texto: `Para guardar: ${j.nombre} está libre y lesionado, pero vale mucho cuando vuelva.` });
  }
  if (d.duelo) {
    const gano = d.duelo.misProy >= d.duelo.suyosProy;
    c.push({ animo: gano ? 'Feliz' : 'Triste', tab: 'resumen', texto: gano
      ? `Vas arriba en la proyección contra ${d.duelo.rival?.nombre || 'tu rival'}. ¡No te confíes!`
      : `Vas abajo en la proyección contra ${d.duelo.rival?.nombre || 'tu rival'}. Revisa tus titulares.` });
  }
  if (!c.length) c.push({ animo: 'Feliz', tab: 'resumen', texto: 'Todo tranquilo por aquí. Tu equipo está en orden.' });
  return c;
}
