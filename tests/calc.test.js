import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toTenths, truncAvg, componentAvg, bimesterGrade, bimesterBreakdown, analyzeSubject,
  minUniformForBimester, pendingSlots, auditAgainstPortal,
} from '../src/grades/calc.js';

test('toTenths acepta notas válidas y descarta X, - y basura', () => {
  assert.equal(toTenths('3.7'), 37);
  assert.equal(toTenths('5'), 50);
  assert.equal(toTenths('4,5'), 45);
  assert.equal(toTenths(4.2), 42);
  assert.equal(toTenths('X'), null);
  assert.equal(toTenths('-'), null);
  assert.equal(toTenths('6.0'), null);
  assert.equal(toTenths('0.5'), null);
});

test('el portal trunca, no redondea', () => {
  assert.equal(truncAvg([48, 47]), 47); // 4.75 → 4.7
  assert.equal(truncAvg([39, 30, 50, 37]), 39); // 3.9 exacto, sin error de coma flotante
  assert.equal(componentAvg(['5.0', 'X', '2.7', '4.5']), 40); // X no cuenta
  assert.equal(componentAvg(['4.3', '-']), 43); // - pendiente no cuenta
});

// Casos reales de las capturas (I a III bimestre) con lo que muestra el portal.
const real = [
  { e: { dig: ['3.2', '4.5'], apr: ['5.0', '4.0', '5.0'], bim: ['3.2'] }, portal: { digProm: '3.8', aprProm: '4.6', bimProm: '3.2', final: '3.8' } },
  { e: { dig: ['2.2', '4.6', '2.8'], apr: ['4.5', '4.6'], bim: ['3.6'] }, portal: { digProm: '3.2', aprProm: '4.5', bimProm: '3.6', final: '3.7' } },
  { e: { dig: ['2.7', '3.8'], apr: ['5.0', '4.7', '4.6'], bim: ['2.4'] }, portal: { digProm: '3.2', aprProm: '4.7', bimProm: '2.4', final: '3.4' } },
  { e: { dig: ['1.7', '1.4', '2.4'], apr: ['4.8', '4.7'], bim: ['1.8'] }, portal: { digProm: '1.8', aprProm: '4.7', bimProm: '1.8', final: '2.7' } },
  { e: { dig: ['4.3', '-'], apr: ['5.0'], bim: [] }, portal: { digProm: '4.3', aprProm: '5.0', final: '4.6' } },
];

test('reproduce exactamente los promedios del portal', () => {
  for (const { e, portal } of real) assert.deepEqual(auditAgainstPortal(e, portal), [], JSON.stringify(e));
  assert.equal(bimesterGrade(real[0].e), 38);
  assert.deepEqual(bimesterBreakdown(real[1].e), { dig: 32, apr: 45, bim: 36, final: 37 });
});

test('pendientes: cada "-" y el examen bimestral que falta', () => {
  assert.deepEqual(pendingSlots({ dig: ['4.1', '-'], apr: ['-', '-'], bim: [] }), { dig: 1, apr: 2, bim: 1, total: 4 });
  assert.deepEqual(pendingSlots({ dig: ['4.1'], apr: ['4.0'], bim: ['3.0'] }), { dig: 0, apr: 0, bim: 0, total: 0 });
});

test('Química: lo que hace falta en el IV bimestre para pasar con 3.0', () => {
  // I 3.7, II 3.1, III 3.0 → suman 9.8; el IV debe dar al menos 2.2.
  const iv = { dig: ['2.3', '-'], apr: ['-', '-'], bim: [] };
  const entries = [
    { dig: ['2.6', '4.4', '2.3'], apr: ['4.7', '4.3', '3.2', '5.0'], bim: ['3.7'] },
    { dig: ['3.3', '2.3', '3.0'], apr: ['5.0', '2.0', '4.8', '3.9'], bim: ['2.7'] },
    { dig: ['2.2', '2.3', '2.7'], apr: ['4.9', '4.8', '4.3'], bim: ['2.1'] },
    iv,
  ];
  const a = analyzeSubject(entries, [true, true, true, false]);
  assert.deepEqual(a.finals, [37, 31, 30, 23]);
  assert.equal(a.needPerBim, 22);
  assert.equal(a.status.kind, 'needs');
  assert.equal(a.current, 3);
  const need = minUniformForBimester(iv, 22);
  assert.ok(need.g >= 10 && need.g <= 50);
  // Con g en todo lo pendiente el IV llega al menos a 2.2; con g-1 no.
  assert.equal(a.currentNeed.g, need.g);
});

test('materia salvada y materia perdida', () => {
  const good = { dig: ['5.0'], apr: ['5.0'], bim: ['5.0'] };
  const bad = { dig: ['1.0'], apr: ['1.0'], bim: ['1.0'] };
  assert.equal(analyzeSubject([good, good, good, { dig: ['-'], apr: [], bim: [] }], [true, true, true, false]).status.kind, 'safe');
  assert.equal(analyzeSubject([bad, bad, bad, { dig: ['-'], apr: [], bim: [] }], [true, true, true, false]).status.kind, 'lost');
  assert.equal(analyzeSubject([good, good, good, good], [true, true, true, true]).status.kind, 'passed');
});

test('salvada: con 1.0 en todo lo pendiente (y el bimestral) el año sigue en 3.0', () => {
  const ok = { dig: ['4.0'], apr: ['4.0'], bim: ['4.0'] };
  // I-III en 4.0 (suman 12.0). El IV con 1.0 en todo da 1.0 → (12.0 + 1.0) / 4 = 3.25 → salvada.
  const a = analyzeSubject([ok, ok, ok, { dig: ['-'], apr: ['-'], bim: [] }], [true, true, true, false]);
  assert.equal(a.status.kind, 'safe');
  assert.ok(a.worst >= 30);
  // Química real: I 3.7, II 3.1, III 3.0 y 2.3 en el IV → con 1.0 en lo demás no alcanza.
  const q = analyzeSubject([
    { dig: ['2.6', '4.4', '2.3'], apr: ['4.7', '4.3', '3.2', '5.0'], bim: ['3.7'] },
    { dig: ['3.3', '2.3', '3.0'], apr: ['5.0', '2.0', '4.8', '3.9'], bim: ['2.7'] },
    { dig: ['2.2', '2.3', '2.7'], apr: ['4.9', '4.8', '4.3'], bim: ['2.1'] },
    { dig: ['2.3', '-'], apr: ['-', '-'], bim: [] },
  ], [true, true, true, false]);
  assert.equal(q.status.kind, 'needs');
  assert.ok(q.worst < 30);
});
