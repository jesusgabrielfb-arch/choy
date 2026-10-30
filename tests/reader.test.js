// Prueba el lector con capturas reales. Las capturas tienen datos personales, así que no se
// suben al repositorio: colócalas en tests/private/ (b1.png … b4.png + truth.json) para correrla.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { readScreenshot, parseRoman, parseBadge } from '../src/engine/reader.js';

test('números romanos del selector de bimestre', () => {
  assert.equal(parseRoman('|'), 1);
  assert.equal(parseRoman('Il'), 2);
  assert.equal(parseRoman('III'), 3);
  assert.equal(parseRoman('IV'), 4);
  assert.equal(parseRoman('1V'), 4);
});

test('lectura de insignias con el color como pista', () => {
  assert.equal(parseBadge('3.9', 'yellow').value, '3.9');
  assert.equal(parseBadge('24.6', 'green').value, '4.6');
  assert.equal(parseBadge('39', 'yellow').value, '3.9');
  assert.equal(parseBadge('', 'blue').value, '-');
  assert.equal(parseBadge('X', 'muted').value, 'X');
  assert.equal(parseBadge('3.8', 'lime').confidence, 'low'); // 3.8 no puede ser verde claro → a revisar
  const fixed = parseBadge('4.8', 'lime'); // 8↔3 es una confusión típica y 4.3 sí es verde claro
  assert.equal(fixed.value, '4.3');
  assert.equal(fixed.corrected, true);
});

const dir = new URL('./private/', import.meta.url).pathname;
const hasPrivate = existsSync(dir + 'truth.json');

test('capturas reales: todas las notas y bimestres', { skip: !hasPrivate && 'sin capturas privadas' }, async () => {
  const { loadPng, nodeOcr } = await import('./helpers/node-ocr.js');
  const truth = JSON.parse(readFileSync(dir + 'truth.json', 'utf8'));
  const ocr = await nodeOcr();
  try {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.png'))) {
      const key = file.replace('.png', '');
      const exp = truth[key];
      if (!exp) continue;
      const r = await readScreenshot(loadPng(dir + file), ocr);
      assert.equal(r.bimestre, exp.bim, `${file}: bimestre`);
      const names = Object.keys(exp.rows);
      assert.deepEqual(r.subjects.map((s) => s.name), names, `${file}: materias`);
      r.subjects.forEach((s, i) => {
        const e = exp.rows[names[i]];
        const got = [s.dig, s.portal.digProm ?? '', s.apr, s.portal.aprProm ?? '', s.bim, s.portal.bimProm ?? '', s.portal.final ?? ''];
        assert.deepEqual(got, e, `${file}: ${names[i]}`);
      });
    }
  } finally {
    await ocr.terminate();
  }
});
