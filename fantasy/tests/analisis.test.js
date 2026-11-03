import { test } from 'node:test';
import assert from 'node:assert/strict';
import { puntos, promedioReciente } from '../src/analisis/puntos.js';
import { mejorAlineacion } from '../src/analisis/alineacion.js';
import { puntosPermitidos, rankingDefensas, recomendarTitulares } from '../src/analisis/defensas.js';
import { valorPaquete, equidad, proponerTrades } from '../src/analisis/trades.js';
import { comprarBarato, venderCaro } from '../src/analisis/compraventa.js';
import { alertasBye } from '../src/analisis/byes.js';
import { analizarLesiones } from '../src/analisis/lesiones.js';
import { equiposEnBye, leerPartidos, rivales } from '../src/datos/calendario.js';
import { normalizarValores, formatoLiga } from '../src/datos/valores.js';
import { leerFeed } from '../src/datos/rss.js';

const PPR = { pass_yd: 0.04, pass_td: 4, rec: 1, rec_yd: 0.1, rush_yd: 0.1, rush_td: 6, rec_td: 6 };
const PUESTOS = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF', 'BN', 'BN', 'BN', 'IR'];

const J = {
  qb1: { id: 'qb1', pos: 'QB', equipo: 'KC' },
  rb1: { id: 'rb1', pos: 'RB', equipo: 'KC' },
  rb2: { id: 'rb2', pos: 'RB', equipo: 'BUF' },
  rb3: { id: 'rb3', pos: 'RB', equipo: 'MIA' },
  wr1: { id: 'wr1', pos: 'WR', equipo: 'BUF' },
  wr2: { id: 'wr2', pos: 'WR', equipo: 'MIA' },
  wr3: { id: 'wr3', pos: 'WR', equipo: 'CAR' },
  te1: { id: 'te1', pos: 'TE', equipo: 'CAR' },
  k1: { id: 'k1', pos: 'K', equipo: 'KC' },
  KC: { id: 'KC', pos: 'DEF', equipo: 'KC' },
};

test('puntos usa las reglas de la liga', () => {
  assert.equal(puntos({ rec: 5, rec_yd: 80, rec_td: 1 }, PPR), 19);
  assert.equal(puntos({ pass_yd: 300, pass_td: 2, rush_yd: 20 }, PPR), 22);
  assert.equal(puntos(null, PPR), 0);
});

test('promedio reciente ignora semanas sin jugar', () => {
  const semanas = [{ a: { stats: { rec: 10 } } }, { a: { stats: { gp: 0 } } }, { a: { stats: { rec: 4 } } }];
  assert.equal(promedioReciente('a', semanas, PPR, 3), 7);
});

test('mejor alineación llena fijos y luego FLEX', () => {
  const lista = Object.values(J).map((j, i) => ({ id: j.id, pos: j.pos, valor: 20 - i }));
  const { titulares, banca } = mejorAlineacion(lista, PUESTOS);
  assert.equal(titulares.length, 9);
  const flex = titulares.find((t) => t.puesto === 'FLEX');
  assert.equal(flex.id, 'rb3'); // el mejor que sobra entre RB/WR/TE
  assert.deepEqual(banca.map((b) => b.id), ['wr3']);
});

test('puntos permitidos por defensa y ranking', () => {
  const semanas = [
    { stats: { wr1: { stats: { rec: 10, rec_yd: 100 } }, wr2: { stats: { rec: 2, rec_yd: 20 } } },
      rivales: { BUF: 'NYJ', NYJ: 'BUF', MIA: 'NE', NE: 'MIA' } },
  ];
  const p = puntosPermitidos(semanas, J, PPR);
  assert.equal(p.NYJ.WR, 20);
  assert.equal(p.NE.WR, 4);
  const r = rankingDefensas(p, 'WR');
  assert.equal(r[0].equipo, 'NYJ');
  assert.ok(r[0].factor > 1 && r[1].factor < 1);
});

test('recomendar titulares sienta a quien está en bye', () => {
  const lista = Object.keys(J);
  const proy = Object.fromEntries(lista.map((id, i) => [id, 15 - i]));
  const r = recomendarTitulares({
    miRoster: lista, titularesActuales: ['qb1', 'rb1', 'rb2', 'wr1', 'wr2', 'te1', 'rb3', 'k1', 'KC'],
    jugadores: J, proy, permitidos: {}, rivales: {}, rosterPositions: PUESTOS, byes: new Set(['MIA']),
  });
  assert.ok(r.sentar.includes('rb3') || r.sentar.includes('wr2'));
  assert.ok(r.poner.includes('wr3'));
});

test('trades: paquete vale menos que la suma y propone opciones justas', () => {
  assert.ok(valorPaquete([5000, 5000]) < 10000);
  assert.equal(equidad(100, 100), 1);
  const V = { a: 6000, b: 3500, c: 3000, d: 800, x: 6200, y: 900 };
  const { actual, opciones } = proponerTrades({
    recibo: ['x'], doy: ['b'], miRoster: ['a', 'b', 'c', 'd'], rosterRival: ['x', 'y'], valor: (id) => V[id] ?? 0,
  });
  assert.equal(actual.tipo, 'ganas'); // doy 3500 por 6200
  assert.ok(opciones.length > 0);
  assert.ok(opciones.every((o) => o.equidad >= 0.88));
  assert.ok(opciones.some((o) => o.doy.includes('a')));
});

test('comprar barato y vender caro', () => {
  const barato = comprarBarato([
    { id: 'x', valor: 5000, tendencia: -300, reciente: 8, esperado: 15, proximosCruces: 1.1 },
    { id: 'y', valor: 5000, tendencia: 0, reciente: 15, esperado: 15, proximosCruces: 1 },
  ]);
  assert.deepEqual(barato.map((b) => b.id), ['x']);
  const caro = venderCaro([
    { id: 'm', pos: 'RB', valor: 4000, tendencia: 400, reciente: 25, esperado: 14, proximosCruces: 0.9, edad: 29 },
    { id: 'n', pos: 'WR', valor: 4000, tendencia: 0, reciente: 14, esperado: 14, proximosCruces: 1 },
  ]);
  assert.deepEqual(caro.map((c) => c.id), ['m']);
  assert.ok(caro[0].razones.length >= 3);
});

test('alertas de bye con sugerencias de waivers', () => {
  const jugadores = { ...J, wrL: { id: 'wrL', pos: 'WR', equipo: 'DAL' }, rbL: { id: 'rbL', pos: 'RB', equipo: 'BUF' } };
  const valor = (id) => ({ wrL: 900, rbL: 500 }[id] ?? 3000);
  const alertas = alertasBye({
    semanas: [9, 10], miRoster: Object.keys(J), jugadores,
    byesPorSemana: { 9: new Set(['BUF']), 10: new Set() }, rosterPositions: PUESTOS,
    libres: ['wrL', 'rbL'], valor, proy: () => null,
  });
  assert.equal(alertas.length, 1);
  assert.equal(alertas[0].semana, 9);
  assert.deepEqual(alertas[0].enBye.sort(), ['rb2', 'wr1']);
  assert.ok(alertas[0].sugerencias.some((s) => s.id === 'wrL'));
  assert.ok(!alertas[0].sugerencias.some((s) => s.id === 'rbL')); // también está en bye
});

test('lesiones: mías, stash y suplentes', () => {
  const jugadores = {
    a: { id: 'a', pos: 'RB', equipo: 'KC', lesion: 'Questionable' },
    b: { id: 'b', pos: 'WR', equipo: 'BUF', lesion: 'IR' },
    c: { id: 'c', pos: 'RB', equipo: 'SF', lesion: 'Out', profundidad: 1 },
    d: { id: 'd', pos: 'RB', equipo: 'SF', profundidad: 2 },
  };
  const r = analizarLesiones({ jugadores, miRoster: ['a'], rosteados: new Set(['a', 'c']),
    valor: (id) => ({ a: 3000, b: 4000, c: 5000, d: 900 }[id]), tieneIR: true });
  assert.deepEqual(r.mios.map((j) => j.id), ['a']);
  assert.deepEqual(r.stash.map((j) => j.id), ['b']);
  assert.equal(r.reemplazos[0].suplente.id, 'd');
  assert.ok(r.reemplazos[0].libre && r.reemplazos[0].seguro);
  assert.deepEqual(r.liga.map((j) => j.id), ['c']);
});

test('calendario de ESPN: partidos, byes y rivales', () => {
  const datos = { events: [{ date: '2026-11-08', competitions: [{ competitors: [
    { homeAway: 'home', team: { abbreviation: 'WSH' } }, { homeAway: 'away', team: { abbreviation: 'KC' } }] }] }] };
  const p = leerPartidos(datos);
  assert.deepEqual(p[0], { local: 'WAS', visita: 'KC', fecha: '2026-11-08', progreso: 0, marcador: null, detalle: null, tv: null });
  assert.equal(rivales(p).KC, 'WAS');
  const byes = equiposEnBye(p);
  assert.equal(byes.size, 30);
  assert.ok(!byes.has('WAS'));
});

test('valores de FantasyCalc y formato de liga', () => {
  const v = normalizarValores([{ player: { sleeperId: '4046' }, value: 7000, positionRank: 3, trend30Day: -120 }]);
  assert.equal(v['4046'].valor, 7000);
  assert.equal(v['4046'].tendencia, -120);
  const f = formatoLiga({ roster_positions: ['QB', 'SUPER_FLEX'], scoring_settings: { rec: 0.5 }, total_rosters: 10 });
  assert.deepEqual(f, { qbs: 2, equipos: 10, ppr: 0.5, dinastia: false });
});

test('lector de RSS y Atom', () => {
  const rss = `<rss><channel><item><title><![CDATA[Mahomes &amp; Kelce]]></title><link>https://x.com/1</link>
    <pubDate>Sun, 01 Nov 2026 12:00:00 GMT</pubDate><description>&lt;p&gt;Hola&lt;/p&gt;</description></item></channel></rss>`;
  const [n] = leerFeed(rss, 'X');
  assert.equal(n.titulo, 'Mahomes & Kelce');
  assert.equal(n.enlace, 'https://x.com/1');
  assert.ok(n.fecha > 0);
  const atom = '<feed><entry><title>Hola</title><link href="https://y.com/2"/><updated>2026-11-01T00:00:00Z</updated></entry></feed>';
  assert.equal(leerFeed(atom)[0].enlace, 'https://y.com/2');
});

import { planSemana, puntoDebil } from '../src/analisis/plan.js';

test('plan: bye sin reemplazo en banca → busca en waivers y dice a quién soltar', () => {
  const J2 = { ...J, wrL: { id: 'wrL', pos: 'WR', equipo: 'DAL' }, rbB: { id: 'rbB', pos: 'RB', equipo: 'KC' } };
  const proy = { qb1: 20, rb1: 15, rb2: 12, rb3: 9, wr1: 14, wr2: 11, wr3: 8, te1: 7, k1: 8, KC: 7, wrL: 13, rbB: 2 };
  const byes = { 9: new Set(['CAR']), 10: new Set() };
  const enBye = (w, id) => byes[w]?.has(J2[id]?.equipo);
  const acciones = planSemana({
    semana: 9, miRoster: [...Object.keys(J), 'rbB'],
    titularesActuales: ['qb1', 'rb1', 'rb2', 'wr1', 'wr2', 'te1', 'rb3', 'k1', 'KC'],
    jugadores: J2, rosterPositions: PUESTOS, libres: ['wrL'], valor: (id) => proy[id] * 100,
    proyAjustada: (w, id) => (enBye(w, id) ? 0 : proy[id] ?? 0), enBye,
  });
  // te1 y wr3 (CAR) están de bye: el TE queda vacío y wrL (13) mejora el FLEX (rb3, 9)
  const w = acciones.find((a) => a.tipo === 'waiver');
  assert.ok(w, 'propone un waiver');
  assert.equal(w.entra, 'wrL');
  assert.equal(w.soltar, 'rbB'); // el que menos vale en la banca
  assert.ok(acciones.some((a) => a.urgente));
});

test('plan: cambia a un titular en bye por uno de la banca con la ganancia', () => {
  const proy = { qb1: 20, rb1: 15, rb2: 12, rb3: 9, wr1: 14, wr2: 11, wr3: 8, te1: 7, k1: 8, KC: 7 };
  const byes = { 9: new Set(['MIA']) };
  const enBye = (w, id) => byes[w]?.has(J[id]?.equipo);
  const acciones = planSemana({
    semana: 9, miRoster: Object.keys(J), titularesActuales: ['qb1', 'rb1', 'rb2', 'wr1', 'wr2', 'te1', 'rb3', 'k1', 'KC'],
    jugadores: J, rosterPositions: PUESTOS, libres: [], valor: () => 1000,
    proyAjustada: (w, id) => (enBye(w, id) ? 0 : proy[id]), enBye,
  });
  const cambio = acciones.find((a) => a.tipo === 'alineacion');
  assert.equal(cambio.entra, 'wr3');
  assert.ok(['wr2', 'rb3'].includes(cambio.sale));
  assert.ok(cambio.urgente);
  assert.ok(cambio.ganancia >= 8);
});

test('punto débil y trade sugerido', () => {
  const jug = {
    a: { pos: 'RB' }, b: { pos: 'WR' }, c: { pos: 'WR' }, d: { pos: 'WR' },
    x: { pos: 'RB' }, y: { pos: 'RB' }, z: { pos: 'WR' },
  };
  const V = { a: 500, b: 6000, c: 5500, d: 5000, x: 7000, y: 6800, z: 900 };
  const r = puntoDebil({
    equipos: [{ rosterId: 1, esMio: true, ids: ['a', 'b', 'c', 'd'] }, { rosterId: 2, nombre: 'Rival', ids: ['x', 'y', 'z'] }],
    jugadores: jug, rosterPositions: ['RB', 'WR'], valor: (id) => V[id],
  });
  assert.equal(r.pos, 'RB');
  assert.ok(r.sugerencia);
  assert.ok(['x', 'y'].includes(r.sugerencia.recibo[0]));
});

import { mejoresDefensas } from '../src/analisis/defensas.js';

test('mejores defensas de la semana según el rival', () => {
  const jug = {
    BUF: { id: 'BUF', pos: 'DEF', equipo: 'BUF' }, MIA: { id: 'MIA', pos: 'DEF', equipo: 'MIA' },
    NYJ: { id: 'NYJ', pos: 'DEF', equipo: 'NYJ' }, NE: { id: 'NE', pos: 'DEF', equipo: 'NE' },
    KC: { id: 'KC', pos: 'DEF', equipo: 'KC' },
  };
  // A las defensas que juegan contra NYJ les va muy bien; contra NE, mal.
  const permitidos = { NYJ: { DEF: 14 }, NE: { DEF: 3 }, BUF: { DEF: 7 }, MIA: { DEF: 7 } };
  const r = mejoresDefensas({ jugadores: jug, rivales: { BUF: 'NYJ', NYJ: 'BUF', MIA: 'NE', NE: 'MIA' },
    permitidos, dueno: (id) => (id === 'BUF' ? 'mia' : 'libre') });
  assert.equal(r[0].equipo, 'BUF');
  assert.equal(r[0].dueno, 'mia');
  assert.equal(r[r.length - 1].equipo, 'MIA');
  assert.ok(!r.some((x) => x.equipo === 'KC')); // KC está de bye
  assert.match(r[0].razon, /vs NYJ/);
});

import { normal, equipoEsperado, probGanar, duelosSemana } from '../src/analisis/probabilidad.js';
import { progreso } from '../src/datos/calendario.js';

test('probabilidad de ganar', () => {
  assert.ok(Math.abs(normal(0) - 0.5) < 1e-6);
  assert.ok(normal(1.96) > 0.97 && normal(1.96) < 0.98);
  const proy = (id) => ({ a: 20, b: 15, c: 10, d: 10 }[id]);
  const fuerte = equipoEsperado({ titulares: ['a', 'b'], proy, progreso: () => 0 });
  const debil = equipoEsperado({ titulares: ['c', 'd'], proy, progreso: () => 0 });
  const p = probGanar(fuerte, debil);
  assert.ok(p > 0.6 && p < 0.95, `p=${p}`);
  // Partido terminado: lo que pasó es lo que cuenta
  const fin1 = equipoEsperado({ titulares: ['a'], puntosHechos: { a: 5 }, proy, progreso: () => 1 });
  const fin2 = equipoEsperado({ titulares: ['c'], puntosHechos: { c: 12 }, proy, progreso: () => 1 });
  assert.equal(probGanar(fin1, fin2), 0);
});

test('duelos de la semana y progreso del partido', () => {
  const d = duelosSemana({
    matchups: [{ roster_id: 1, matchup_id: 1, starters: ['a'], points: 0 }, { roster_id: 2, matchup_id: 1, starters: ['c'], points: 0 }],
    equipos: [{ rosterId: 1, nombre: 'Yo' }, { rosterId: 2, nombre: 'Rival' }],
    proy: (id) => ({ a: 20, c: 10 }[id]), progreso: () => 0,
  });
  assert.equal(d.length, 1);
  assert.ok(d[0].a.prob > 0.5 && Math.abs(d[0].a.prob + d[0].b.prob - 1) < 1e-9);
  assert.equal(progreso({ type: { state: 'pre' } }), 0);
  assert.equal(progreso({ type: { state: 'post', completed: true } }), 1);
  assert.ok(Math.abs(progreso({ type: { state: 'in' }, period: 3, displayClock: '7:30' }) - 0.625) < 0.01);
});

import { generarAvisos } from '../src/analisis/avisos.js';

test('avisos: lesión, bye, puesto vacío, byes de la semana que viene y noticias, sin repetir', () => {
  const J = {
    a: { nombre: 'Ana Pérez', equipo: 'KC', lesion: 'Out' },
    b: { nombre: 'Beto Smith', equipo: 'MIA' },
    c: { nombre: 'Caro Jones', equipo: 'BUF', lesion: 'Questionable' },
  };
  const ligas = [{ id: 'L1', nombre: 'Panas', titulares: ['a', 'b', 'c', '0'], plantel: ['a', 'b', 'c'] }];
  const noticias = [{ titulo: 'Beto Smith firma extensión', enlace: 'https://x/1', fecha: 2000 }, { titulo: 'Otro tema', enlace: 'https://x/2', fecha: 3000 }];
  const avisos = generarAvisos({ ligas, jugadores: J, semana: 9, byes: new Set(['MIA']), byesSig: new Set(['BUF']), noticias, desde: 1000 });
  const claves = avisos.map((a) => a.clave);
  assert.ok(claves.includes('les:L1:a:Out:9'));
  assert.ok(claves.includes('bye:L1:b:9'));
  assert.ok(claves.includes('duda:L1:c:9'));
  assert.ok(claves.includes('vacio:L1:9'));
  assert.ok(claves.includes('byesig:L1:10'));
  assert.ok(claves.includes('not:https://x/1'));
  assert.equal(claves.length, 6);
  const otraVez = generarAvisos({ ligas, jugadores: J, semana: 9, byes: new Set(['MIA']), byesSig: new Set(['BUF']), noticias, desde: 1000, enviados: new Set(claves) });
  assert.equal(otraVez.length, 0);
  const soloNoticias = generarAvisos({ ligas, jugadores: J, semana: 9, noticias, opciones: { equipo: false, noticias: true } });
  assert.deepEqual(soloNoticias.map((a) => a.clave), ['not:https://x/1']);
});

import { alTocarSeguido } from '../src/ui/frases.js';

test('Cody se va enojando si lo tocas mucho', () => {
  assert.ok(['Lanzar', 'Malabares', 'Feliz'].includes(alTocarSeguido(1)[1]));
  assert.equal(alTocarSeguido(3)[1], 'Hablar');
  assert.equal(alTocarSeguido(6)[1], 'Enojado');
  assert.match(alTocarSeguido(8)[0], /Mierda|Puñeta|cago|Coño/);
  assert.equal(alTocarSeguido(10)[1], 'Cool');
});

import { buscar } from '../src/ui/buscador.js';

test('buscador: funciones y jugadores sin importar acentos', () => {
  const d = {
    jugadores: { a: { id: 'a', nombre: 'José Pérez', pos: 'WR', rank: 3 }, b: { id: 'b', nombre: 'Ana Smith', pos: 'RB', rank: 1 } },
    valor: () => 1,
  };
  const r = buscar('jose', d);
  assert.deepEqual(r.jugadores.map((j) => j.id), ['a']);
  assert.ok(buscar('defensa', d).funciones.some((f) => /Analizador|defensa/i.test(f.t)));
  assert.ok(buscar('trade', d).funciones.some((f) => /trades/.test(f.t)));
  // Fuera de una liga solo salen funciones generales
  assert.ok(buscar('avisos', null).funciones.every((f) => f.href));
});

import { PASOS } from '../src/ui/tutorial.js';

test('tutorial: empieza saludando, termina celebrando y explica las pestañas', () => {
  assert.equal(PASOS[0].sel, undefined);
  assert.equal(PASOS.at(-1).animo, 'Touchdown');
  for (const t of ['equipo', 'mercado', 'jugadores', 'noticias']) assert.ok(PASOS.some((p) => p.sel?.includes(t)), t);
});

test('plan inteligente: no mueve jugadores que ya jugaron y los waivers pasan a la próxima semana', () => {
  const J2 = { ...J, wrL: { id: 'wrL', pos: 'WR', equipo: 'DAL', nombre: 'Libre WR' } };
  const proy = { qb1: 20, rb1: 15, rb2: 12, rb3: 9, wr1: 14, wr2: 11, wr3: 8, te1: 7, k1: 8, KC: 7, wrL: 16 };
  const byes = { 9: new Set(['MIA']), 10: new Set() };
  const enBye = (w, id) => byes[w]?.has(J2[id]?.equipo);
  const base = {
    semana: 9, miRoster: Object.keys(J), titularesActuales: ['qb1', 'rb1', 'rb2', 'wr1', 'wr2', 'te1', 'rb3', 'k1', 'KC'],
    jugadores: J2, rosterPositions: PUESTOS, libres: ['wrL'], valor: (id) => proy[id] * 100,
    proyAjustada: (w, id) => (enBye(w, id) ? 0 : proy[id] ?? 0), enBye,
  };
  // wr3 (el que entraría por el de bye) ya jugó: no se puede mover
  const conBloqueo = planSemana({ ...base, bloqueado: (id) => id === 'wr3' });
  assert.ok(!conBloqueo.some((a) => a.tipo === 'alineacion' && a.entra === 'wr3'));
  // Los waivers de esta semana ya pasaron: la sugerencia es para la semana 10
  const proxima = planSemana({ ...base, semanaWaivers: 10 });
  // Esta semana queda un FLEX vacío (2 de bye): se cubre con un agente libre que no ha jugado…
  const ahora = proxima.find((a) => a.tipo === 'waiver' && a.semana === 9);
  assert.match(ahora.titulo, /agente libre/);
  // …y las mejoras de waivers ya piensan en la semana 10
  assert.ok(proxima.every((a) => a.tipo !== 'waiver' || a.semana === 9 || a.semana === 10));
});

test('plan avisa de los titulares que juegan fuera del domingo', () => {
  const jueves = new Date(2026, 10, 5, 20, 15).getTime(); // jueves
  const domingo = new Date(2026, 10, 8, 13, 0).getTime();
  const proy = { qb1: 20, rb1: 15, rb2: 12, rb3: 9, wr1: 14, wr2: 11, wr3: 8, te1: 7, k1: 8, KC: 7 };
  const acciones = planSemana({
    semana: 9, miRoster: Object.keys(J), titularesActuales: ['qb1', 'rb1', 'rb2', 'wr1', 'wr2', 'te1', 'rb3', 'k1', 'KC'],
    jugadores: J, rosterPositions: PUESTOS, libres: [], valor: () => 1, enBye: () => false,
    proyAjustada: (w, id) => proy[id], ahora: new Date(2026, 10, 4, 12).getTime(),
    inicio: (id) => (J[id].equipo === 'KC' ? jueves : domingo), hora: (id) => (J[id].equipo === 'KC' ? 'jue 8:15 p. m.' : 'dom 1:00 p. m.'),
  });
  const h = acciones.find((a) => a.tipo === 'hora');
  assert.ok(h, 'hay aviso de horario');
  assert.match(h.detalle, /jue 8:15/);
});

import { secciones, resumen, REGLAS_PPR } from '../src/datos/registro.js';

test('registro de juego: secciones por posición y resumen de cómo viene', () => {
  const s = { off_snp: 40, tm_off_snp: 60, rush_att: 10, rush_yd: 55, rush_td: 1, rec_tgt: 4, rec: 3, rec_yd: 20 };
  const rb = secciones('RB');
  assert.deepEqual(rb.map((x) => x.titulo), ['Carrera', 'Recepción', 'Uso']);
  const valor = (sec, nombre) => sec.stats.find(([t]) => t === nombre)[1](s);
  assert.equal(valor(rb[0], 'Yds/acarreo'), '5.5');
  assert.equal(valor(rb[2], 'En el campo'), '67%');
  // un receptor sin acarreos no muestra la sección de carrera
  assert.equal(secciones('WR')[1].solo(s), true);
  assert.equal(secciones('WR')[1].solo({ rec: 3 }), false);
  const r = resumen([{ semana: 1, stats: s, proy: { rush_yd: 50 } }, { semana: 2, stats: { gp: 0 } }, { semana: 3 }], REGLAS_PPR);
  assert.equal(r.partidos, 1);
  assert.equal(Math.round(r.total * 10) / 10, 16.5); // 5.5 carrera + 6 TD + 3 rec + 2 yardas
  assert.equal(r.supero, 1); // 16.5 contra 5 proyectados
  assert.equal(r.conProy, 1);
});

test('equipoEsperado: puntos sin marcador cuentan como partido a medias', async () => {
  const { equipoEsperado } = await import('../src/analisis/probabilidad.js');
  const r = equipoEsperado({ titulares: ['a', 'b'], puntosHechos: { a: 10 }, proy: () => 20, progreso: () => 0 });
  // a: 10 hechos + 20*0.5 que le faltan; b: no ha jugado, cuenta su proyección completa
  assert.equal(r.hechos, 10);
  assert.equal(r.esperado, 10 + 10 + 20);
});

test('avisos de noticias: encuentra al jugador sin importar mayúsculas, acentos ni si sale solo en el resumen', () => {
  const J = { 1: { nombre: 'Bijan Robinson', equipo: 'ATL' }, 2: { nombre: 'Kenneth Walker', equipo: 'SEA' } };
  const ligas = [{ id: 'L', nombre: 'Liga', titulares: [], plantel: ['1', '2'] }];
  const noticias = [
    { titulo: 'BIJAN ROBINSON, listo para el domingo', enlace: 'a', fecha: 5000 },
    { titulo: 'Reporte de lesiones de Seattle', resumen: 'Kenneth Walker no practicó el miércoles', enlace: 'b', fecha: 4000 },
    { titulo: 'Noticia vieja de Bijan Robinson', enlace: 'c', fecha: 10 },
  ];
  const av = generarAvisos({ ligas, jugadores: J, semana: 9, noticias, desde: 1000, opciones: { equipo: false, noticias: true } });
  assert.deepEqual(av.map((a) => a.clave), ['not:a', 'not:b']);
});

import { disponibilidad } from '../src/analisis/lesiones.js';
import { notaPorLugar } from '../src/analisis/defensas.js';

test('disponibilidad: no pone 0 nomás por estar lesionado', () => {
  const ultimo = 1000;
  const base = { w: 9, semanaActual: 9, ultimoPartido: ultimo, proy: 14 };
  // Reporte nuevo de esta semana
  assert.equal(disponibilidad({ lesion: 'Out', actualizado: 2000 }, base).factor, 0);
  assert.equal(disponibilidad({ lesion: 'Questionable', practica: 'Full', actualizado: 2000 }, base).factor, 0.95);
  assert.equal(disponibilidad({ lesion: 'Questionable', practica: 'DNP', actualizado: 2000 }, base).factor, 0.55);
  assert.equal(disponibilidad({ lesion: 'Doubtful', practica: 'Limited', actualizado: 2000 }, base).factor, 0.2);
  // "Fuera" que se quedó del partido pasado: todavía no sale el reporte de esta semana
  const viejo = disponibilidad({ lesion: 'Out', actualizado: 500 }, base);
  assert.equal(viejo.factor, 0.5);
  assert.match(viejo.texto, /todavía no sale/);
  // En IR pero Sleeper ya le proyecta puntos: puede regresar
  assert.equal(disponibilidad({ lesion: 'IR' }, { ...base, proy: 10 }).factor, 0.6);
  assert.equal(disponibilidad({ lesion: 'IR' }, { ...base, proy: null }).factor, 0);
  // Semana que viene: el "Fuera" de esta semana no lo deja en 0
  assert.equal(disponibilidad({ lesion: 'Out', actualizado: 2000 }, { ...base, w: 10 }).factor, 0.75);
  // Sleeper ya no le proyecta nada con reporte nuevo: no juega
  assert.equal(disponibilidad({ lesion: 'Questionable', actualizado: 2000 }, { ...base, proy: 0 }).factor, 0);
  assert.equal(disponibilidad({}, base).factor, 1);
});

test('cruce: mezcla yardas y puntos permitidos a la posición y da la nota por lugar', () => {
  const semanas = [{
    stats: {
      rb1: { stats: { rush_yd: 150, rec_yd: 30 }, rival: 'NYJ' }, // a NYJ le corren mucho
      rb2: { stats: { rush_yd: 40, rush_td: 2 }, rival: 'NE' }, // a NE pocas yardas pero 2 TD
    },
    rivales: {},
  }];
  const p = puntosPermitidos(semanas, J, PPR);
  assert.equal(p.yardas.NYJ.RB, 180);
  const r = rankingDefensas(p, 'RB');
  assert.equal(r[0].equipo, 'NYJ'); // 180 yds y 18 pts > 40 yds y 16 pts
  assert.match(r[0].texto, /180 yds/);
  assert.match(r[0].texto, /MÁS le regala/);
  assert.match(r[1].texto, /MÁS dura/);
  assert.equal(notaPorLugar(1, 32).nota, 'A');
  assert.equal(notaPorLugar(10, 32).nota, 'B');
  assert.equal(notaPorLugar(16, 32).nota, 'C');
  assert.equal(notaPorLugar(24, 32).nota, 'D');
  assert.equal(notaPorLugar(32, 32).nota, 'F');
});

import { buscarPorNecesidad } from '../src/analisis/trades.js';

test('buscar por necesidad: necesito WR, me sobra RB → equipo con WR de sobra y que necesita RB', () => {
  const P = ['QB', 'RB', 'RB', 'WR', 'WR', 'FLEX', 'BN', 'BN', 'BN', 'BN'];
  const Jn = {}; const V = {};
  const jug = (id, pos, v) => { Jn[id] = { id, pos }; V[id] = v; return id; };
  const equipos = [
    { rosterId: 1, nombre: 'Yo', esMio: true, ids: [jug('q1', 'QB', 5000), jug('r1', 'RB', 7000), jug('r2', 'RB', 6500), jug('r3', 'RB', 6000), jug('r4', 'RB', 5800),
      jug('w1', 'WR', 2500), jug('w2', 'WR', 2000)] },
    { rosterId: 2, nombre: 'Ricos en WR', ids: [jug('q2', 'QB', 5000), jug('r5', 'RB', 1500), jug('r6', 'RB', 1200),
      jug('w3', 'WR', 7500), jug('w4', 'WR', 7000), jug('w5', 'WR', 6500), jug('w6', 'WR', 6000)] },
    { rosterId: 3, nombre: 'Normales', ids: [jug('q3', 'QB', 5000), jug('r7', 'RB', 5000), jug('r8', 'RB', 4800),
      jug('w7', 'WR', 5000), jug('w8', 'WR', 4500), jug('w9', 'WR', 900)] },
  ];
  const r = buscarPorNecesidad({ necesito: 'WR', equipos, jugadores: Jn, rosterPositions: P, valor: (id) => V[id] ?? 0 });
  assert.ok(r.sobrantes.some((s) => s.id === 'r4'), 'mi 4º RB me sobra');
  assert.ok(r.opciones.length > 0);
  const o = r.opciones[0];
  assert.equal(o.rosterId, 2);
  assert.equal(Jn[o.recibo[0]].pos, 'WR');
  assert.ok(o.doy.every((id) => Jn[id].pos === 'RB'));
  assert.ok(o.yoGano > 0 && o.ellosGanan > 0);
  assert.equal(o.lesFalta.pos, 'RB');
  assert.equal(o.nivel, 'mejor');
  // Los desesperados tocan un titular, pagan de más o piden a su titular
  assert.ok(r.porNivel.desesperado.every((x) => x.tocaTitular || x.pagoDeMas || x.esSuTitular));
});

import { misMovimientos, estadoReclamos } from '../src/analisis/waivers.js';

test('mis waivers: cruza lo que apunté con lo que Sleeper procesó', () => {
  const t0 = 1_000_000_000;
  const txs = [
    { transaction_id: '1', type: 'waiver', status: 'complete', roster_ids: [3], adds: { a: 3 }, drops: { x: 3 }, settings: { waiver_bid: 12 }, status_updated: t0 + 5000 },
    { transaction_id: '2', type: 'waiver', status: 'complete', roster_ids: [7], adds: { b: 7 }, settings: { waiver_bid: 30 }, status_updated: t0 + 5000 },
    { transaction_id: '3', type: 'waiver', status: 'failed', roster_ids: [3], adds: { c: 3 }, metadata: { notes: 'Otro reclamo con más prioridad' }, status_updated: t0 + 5000 },
    { transaction_id: '4', type: 'free_agent', status: 'complete', roster_ids: [3], adds: { e: 3 }, status_updated: t0 + 9000 },
  ];
  const apuntados = [{ id: 'a', t: t0 }, { id: 'b', t: t0 }, { id: 'c', t: t0 }, { id: 'd', t: t0 }];
  const r = estadoReclamos(apuntados, txs, { miRosterId: 3, misIds: [], nombreDe: (rid) => `Equipo ${rid}` });
  const por = Object.fromEntries(r.map((x) => [x.id, x]));
  assert.equal(por.a.estado, 'ganado');
  assert.equal(por.a.faab, 12);
  assert.equal(por.b.estado, 'perdido');
  assert.match(por.b.motivo, /Equipo 7/);
  assert.equal(por.c.estado, 'perdido');
  assert.equal(por.d.estado, 'pendiente');
  const m = misMovimientos(txs, 3);
  assert.deepEqual(m.map((x) => x.id), ['4', '1', '3']); // del más nuevo al más viejo, solo los míos
  assert.deepEqual(m[1].salen, ['x']);
});
