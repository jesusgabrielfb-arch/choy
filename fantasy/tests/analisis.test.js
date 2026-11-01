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
  assert.deepEqual(r.liga.map((j) => j.id), ['c']);
});

test('calendario de ESPN: partidos, byes y rivales', () => {
  const datos = { events: [{ date: '2026-11-08', competitions: [{ competitors: [
    { homeAway: 'home', team: { abbreviation: 'WSH' } }, { homeAway: 'away', team: { abbreviation: 'KC' } }] }] }] };
  const p = leerPartidos(datos);
  assert.deepEqual(p[0], { local: 'WAS', visita: 'KC', fecha: '2026-11-08' });
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
