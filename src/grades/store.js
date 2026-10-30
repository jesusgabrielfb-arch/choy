// Estado de la app: materias y notas de los 4 bimestres, guardado en este dispositivo.
import { isBimesterClosed, analyzeSubject, COMPONENTS } from './calc.js';

const KEY = 'horno-notas-v1';

const empty = () => ({
  version: 1,
  subjects: [], // [{ id, name, starred }]
  bims: [0, 1, 2, 3].map(() => ({ closed: undefined, data: {}, source: null })),
  updatedAt: null,
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return empty();
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
}

function save() {
  state.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* modo privado: solo en memoria */ }
  for (const fn of listeners) fn(state);
}

export const getState = () => state;
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

/** Busca una materia existente con nombre parecido (el OCR puede variar una letra). */
export function matchSubject(name, subjects = state.subjects) {
  const n = norm(name);
  if (!n) return null;
  let best = null, bestD = Infinity;
  for (const s of subjects) {
    const d = distance(n, norm(s.name));
    if (d < bestD) { bestD = d; best = s; }
  }
  return best && bestD <= Math.max(1, Math.floor(n.length * 0.2)) ? best : null;
}

let seq = 0;
const newId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Guarda lo leído de una captura en el bimestre indicado (0..3).
 * Reemplaza los datos de ese bimestre para las materias que aparecen en la captura.
 */
export function applyReading(bimIndex, reading, source) {
  const bim = state.bims[bimIndex];
  for (const r of reading.subjects) {
    let subj = matchSubject(r.name);
    if (!subj) {
      subj = { id: newId(), name: r.name, starred: r.starred };
      state.subjects.push(subj);
    }
    subj.starred = r.starred;
    // Marcas de lectura dudosa por nota, para resaltarlas al revisar.
    const flags = {};
    for (const c of COMPONENTS) {
      flags[c] = (r.cells || []).filter((x) => x.col === c)
        .map((x) => (x.confidence === 'high' ? null : x.corrected ? 'corrected' : 'uncertain'));
    }
    bim.data[subj.id] = {
      dig: [...r.dig], apr: [...r.apr], bim: [...r.bim],
      portal: { ...r.portal },
      flags,
    };
  }
  bim.source = source || null;
  bim.closed = undefined;
  save();
}

export function setGrades(bimIndex, subjectId, comp, items, flags = []) {
  const bim = state.bims[bimIndex];
  bim.data[subjectId] ??= { dig: [], apr: [], bim: [], portal: {}, flags: {} };
  const entry = bim.data[subjectId];
  entry[comp] = items;
  entry.portal = {}; // ya no coincide con lo que mostraba el portal
  entry.flags = { ...(entry.flags || {}), [comp]: flags }; // las que tocó la persona ya no son dudosas
  save();
}

export function setClosed(bimIndex, closed) {
  state.bims[bimIndex].closed = closed;
  save();
}

export function renameSubject(id, name) {
  const s = state.subjects.find((x) => x.id === id);
  if (s && name.trim()) { s.name = name.trim(); save(); }
}

export function addSubject(name) {
  const subj = { id: newId(), name: name.trim() || 'Nueva materia', starred: false };
  state.subjects.push(subj);
  save();
  return subj;
}

export function removeSubject(id) {
  state.subjects = state.subjects.filter((s) => s.id !== id);
  for (const b of state.bims) delete b.data[id];
  save();
}

export function clearBimester(bimIndex) {
  state.bims[bimIndex] = { closed: undefined, data: {}, source: null };
  save();
}

export function resetAll() {
  state = empty();
  save();
}

export function importState(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json;
  if (parsed?.version !== 1 || !Array.isArray(parsed.subjects)) throw new Error('Archivo no válido');
  state = { ...empty(), ...parsed };
  save();
}

export const exportState = () => JSON.stringify(state, null, 2);

/** ¿El bimestre i está cerrado (tiene examen bimestral) o en curso? */
export function closedFlags(s = state) {
  return s.bims.map((b) => {
    if (typeof b.closed === 'boolean') return b.closed;
    return isBimesterClosed({ subjects: b.data });
  });
}

/** Materias con al menos una nota en algún bimestre, con su análisis anual. */
export function subjectSummaries(s = state) {
  const closed = closedFlags(s);
  return s.subjects
    .map((subj) => {
      const entries = s.bims.map((b) => b.data[subj.id] || null);
      const hasAny = entries.some((e) => e && COMPONENTS.some((c) => (e[c] || []).some((v) => /\d/.test(String(v)))));
      return { subj, entries, hasAny, analysis: analyzeSubject(entries, closed) };
    });
}

export const hasData = (s = state) => s.bims.some((b) => Object.keys(b.data).length > 0);
