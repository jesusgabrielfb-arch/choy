// Matemática de notas idéntica a la del portal SEDUCA.
//
// Verificado contra las capturas reales: el portal TRUNCA a un decimal (no redondea).
//   promedio de componente = trunc(promedio de sus notas)           ej. 4.75 → 4.7
//   nota del bimestre      = trunc(promedio de los 3 componentes ya truncados)
// Digitación (diarias), Apreciación y Bimestral pesan 33.33 % cada una.
// "X" no cuenta (exonerado) y "-" es una asignación sin calificar todavía.
//
// Internamente todo se maneja en décimas enteras (3.7 → 37) para evitar errores de coma flotante.

export const PASS = 30; // 3.0
export const MIN = 10;  // 1.0
export const MAX = 50;  // 5.0
export const COMPONENTS = ['dig', 'apr', 'bim'];
export const COMPONENT_LABEL = { dig: 'Diarias', apr: 'Apreciación', bim: 'Bimestral' };
export const COMPONENT_LONG = { dig: 'Notas diarias (Digitación)', apr: 'Apreciación', bim: 'Examen bimestral' };
export const BIM_NAMES = ['I Bimestre', 'II Bimestre', 'III Bimestre', 'IV Bimestre'];
export const ROMAN = ['I', 'II', 'III', 'IV'];

/** "3.7" | 3.7 | 37 → 37 (décimas). Devuelve null si no es una nota válida. */
export function toTenths(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') {
    const t = Number.isInteger(v) && v >= MIN && v <= MAX ? v : Math.round(v * 10);
    return t >= MIN && t <= MAX ? t : null;
  }
  const s = String(v).trim().replace(',', '.');
  if (!/^\d(\.\d)?$/.test(s)) return null;
  const t = Math.round(parseFloat(s) * 10);
  return t >= MIN && t <= MAX ? t : null;
}

export const fmt = (t) => (t == null ? '—' : (t / 10).toFixed(1));
export const fmt2 = (x) => (x == null ? '—' : (Math.floor(x * 10 + 1e-9) / 100).toFixed(2));

/** Promedio truncado a décimas de una lista de notas en décimas. */
export function truncAvg(list) {
  const vals = list.filter((t) => t != null);
  if (!vals.length) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.floor(sum / vals.length + 1e-9);
}

/** Notas que cuentan de un componente (descarta "X" y "-"). */
export function gradedTenths(items = []) {
  return items.map(toTenths).filter((t) => t != null);
}

export function componentAvg(items) {
  return truncAvg(gradedTenths(items));
}

/** Nota del bimestre a partir de { dig: [...], apr: [...], bim: [...] }. */
export function bimesterGrade(entry) {
  if (!entry) return null;
  return truncAvg(COMPONENTS.map((c) => componentAvg(entry[c])));
}

export function bimesterBreakdown(entry) {
  const parts = {};
  for (const c of COMPONENTS) parts[c] = componentAvg(entry?.[c]);
  return { ...parts, final: truncAvg(COMPONENTS.map((c) => parts[c])) };
}

/** Promedio anual exacto (en décimas, con decimales) de las notas de bimestre disponibles. */
export function yearAverage(finals) {
  const vals = finals.filter((t) => t != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Estado según la nota (décimas). Tonos alineados con la escala de colores del portal. */
export function tone(t) {
  if (t == null) return 'none';
  if (t < 30) return 'burnt';
  if (t < 35) return 'toasted';
  if (t < 40) return 'golden';
  if (t < 45) return 'baked';
  return 'perfect';
}

export const TONE_LABEL = {
  none: 'Sin hornear',
  burnt: 'Quemado',
  toasted: 'Tostadito',
  golden: 'Dorado',
  baked: 'En su punto',
  perfect: 'De panadería',
};

/** ¿Un bimestre está cerrado? (tiene examen bimestral en alguna materia o el usuario lo marcó). */
export function isBimesterClosed(bimester) {
  if (!bimester) return false;
  if (typeof bimester.closed === 'boolean') return bimester.closed;
  return Object.values(bimester.subjects || {}).some((s) => gradedTenths(s.bim).length > 0);
}

/**
 * Nota mínima uniforme g (décimas) que hay que sacar en todo lo pendiente de un bimestre
 * abierto para que su nota final llegue a `target`.
 * Lo pendiente = cada "-" ya publicado + el examen bimestral si aún no tiene nota
 * (+ `extra` asignaciones hipotéticas por componente).
 * Devuelve { g, slots } con g = null si ni con 5.0 se alcanza, o g = MIN si ya está asegurado.
 */
export function minUniformForBimester(entry, target) {
  const slots = pendingSlots(entry);
  if (!slots.total) {
    const now = bimesterGrade(entry);
    return { g: now != null && now >= target ? MIN : null, slots, already: now };
  }
  for (let g = MIN; g <= MAX; g++) {
    if (bimesterGrade(fillPending(entry, g)) >= target) return { g, slots };
  }
  return { g: null, slots };
}

/** Cuántos espacios pendientes hay por componente. */
export function pendingSlots(entry) {
  const slots = { dig: 0, apr: 0, bim: 0, total: 0 };
  for (const c of COMPONENTS) {
    const items = entry?.[c] || [];
    let n = items.filter((v) => String(v).trim() === '-').length;
    if (c === 'bim' && gradedTenths(items).length === 0 && n === 0) n = 1; // falta el examen
    slots[c] = n;
    slots.total += n;
  }
  return slots;
}

/** Copia de la entrada con todo lo pendiente reemplazado por la nota g (décimas). */
export function fillPending(entry, g) {
  const out = {};
  const slots = pendingSlots(entry);
  for (const c of COMPONENTS) {
    const items = [...(entry?.[c] || [])].map((v) => (String(v).trim() === '-' ? g : v));
    const missing = slots[c] - (entry?.[c] || []).filter((v) => String(v).trim() === '-').length;
    for (let i = 0; i < missing; i++) items.push(g);
    out[c] = items;
  }
  return out;
}

/**
 * Análisis anual de una materia.
 * `entries` = arreglo de 4 posiciones (una por bimestre) con { dig, apr, bim } o null.
 * `closed`  = arreglo de 4 booleanos (bimestre cerrado o en curso).
 */
export function analyzeSubject(entries, closed) {
  const finals = entries.map((e) => (e ? bimesterGrade(e) : null));
  const closedIdx = [0, 1, 2, 3].filter((i) => closed[i] && finals[i] != null);
  const openIdx = [0, 1, 2, 3].filter((i) => !closedIdx.includes(i));
  const closedSum = closedIdx.reduce((a, i) => a + finals[i], 0);
  const remaining = openIdx.length;
  const needSum = PASS * 4 - closedSum; // décimas que faltan entre los bimestres abiertos

  // Promedio necesario en cada bimestre restante (ceil para no quedarse corto).
  let needPerBim = remaining ? Math.ceil(needSum / remaining - 1e-9) : null;
  const status = { kind: 'open' };
  if (!remaining) {
    const avg = closedSum / 4;
    status.kind = avg >= PASS ? 'passed' : 'failed';
  } else if (needPerBim <= MIN) {
    status.kind = 'safe';
    needPerBim = MIN;
  } else if (needPerBim > MAX) {
    status.kind = 'lost';
  } else {
    status.kind = 'needs';
  }

  // Bimestre en curso (el primero abierto con datos): qué hace falta en lo pendiente.
  const current = openIdx.find((i) => entries[i]) ?? null;
  let currentNeed = null;
  if (current != null && needPerBim != null && status.kind !== 'lost') {
    currentNeed = { bim: current, target: needPerBim, ...minUniformForBimester(entries[current], needPerBim) };
  }

  // Proyección: los bimestres abiertos se quedan como van (o igual al promedio actual si no hay datos).
  const known = finals.filter((t) => t != null);
  const projected = known.length
    ? yearAverage(finals.map((t, i) => (t != null ? t : truncAvg(known))))
    : null;

  return {
    finals,
    closedIdx,
    openIdx,
    year: closedIdx.length === 4 ? closedSum / 4 : null,
    partial: yearAverage(finals),
    projected,
    needPerBim,
    needSum,
    status,
    current,
    currentNeed,
  };
}

/** Compara lo calculado con lo que muestra el portal: devuelve diferencias para avisar al usuario. */
export function auditAgainstPortal(entry, portal) {
  const mine = bimesterBreakdown(entry);
  const issues = [];
  const keys = { dig: 'digProm', apr: 'aprProm', bim: 'bimProm', final: 'final' };
  for (const [k, pk] of Object.entries(keys)) {
    const p = toTenths(portal?.[pk]);
    if (p != null && mine[k] != null && p !== mine[k]) issues.push({ field: k, portal: p, mine: mine[k] });
  }
  return issues;
}
