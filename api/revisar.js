// Revisión automática (la llama GitHub Actions cada hora): entra a SEDUCA, compara con la vez
// anterior y manda una notificación por cada nota nueva. No devuelve notas, solo conteos.
import { readAll } from './_seduca.js';
import { getState, saveState, notifyAll } from './_avisos.js';
import { analyzeSubject, gradedTenths } from '../src/grades/calc.js';

const key = (it) => `${it.id}:${it.value}`;

/** ¿Qué materias quedan salvadas con estas notas? (1.0 en todo lo que falta y aun así 3.0). */
function savedSubjects(bims) {
  const byName = new Map();
  const closed = [0, 1, 2, 3].map((i) => (bims.find((b) => b.bim === i + 1)?.subjects || []).some((s) => gradedTenths(s.bim).length > 0));
  for (const b of bims) {
    for (const s of b.subjects) {
      if (!byName.has(s.name)) byName.set(s.name, [null, null, null, null]);
      byName.get(s.name)[b.bim - 1] = { dig: s.dig, apr: s.apr, bim: s.bim };
    }
  }
  const saved = new Set();
  for (const [name, entries] of byName) {
    if (!entries.some((e) => e && [...e.dig, ...e.apr, ...e.bim].some((v) => /\d/.test(v)))) continue;
    const kind = analyzeSubject(entries, closed).status.kind;
    if (kind === 'safe' || kind === 'passed') saved.add(name);
  }
  return saved;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const bims = await readAll();
    const items = bims.flatMap((b) => b.subjects.flatMap((s) => s.items
      .filter((it) => /^\d\.\d$|^X$/.test(it.value))
      .map((it) => ({ ...it, materia: s.name, bim: b.bim }))));
    const saved = savedSubjects(bims);
    const prev = await getState();
    const state = { vistos: items.map(key), salvadas: [...saved], at: new Date().toISOString() };
    if (!prev) {
      await saveState(state);
      return res.status(200).json({ ok: true, primera: true, notas: items.length });
    }
    const seen = new Set(prev.vistos);
    const nuevas = items.filter((it) => !seen.has(key(it)) && it.value !== 'X');
    const recienSalvadas = [...saved].filter((n) => !(prev.salvadas || []).includes(n));
    let push = null;
    if (nuevas.length) {
      const first = nuevas[0];
      const pan = (v) => (Number(v) >= 4.5 ? '🍞✨' : Number(v) >= 3 ? '🍞' : '🔥');
      const title = nuevas.length === 1
        ? `${pan(first.value)} Nota nueva en ${first.materia}: ${first.value}`
        : `🍞 ${nuevas.length} notas nuevas en SEDUCA`;
      const lines = nuevas.slice(0, 4).map((n) => `${n.materia}: ${n.value}${nuevas.length === 1 ? ` · ${n.name}` : ''}`);
      if (nuevas.length > 4) lines.push(`y ${nuevas.length - 4} más…`);
      if (recienSalvadas.length) lines.push(`✅ ¡Ya salvaste ${recienSalvadas.join(', ')}!`);
      push = await notifyAll({ title, body: lines.join('\n'), url: '/#panaderia' });
    } else if (recienSalvadas.length) {
      push = await notifyAll({ title: '✅ ¡Materia salvada!', body: `${recienSalvadas.join(', ')} ya no se quema aunque saques 1.0 en lo que falta.`, url: '/#panaderia' });
    }
    await saveState(state);
    return res.status(200).json({ ok: true, nuevas: nuevas.length, salvadas: recienSalvadas.length, push });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}
