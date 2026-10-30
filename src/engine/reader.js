// Lee una captura de "Notas por materia y periodo" del portal SEDUCA.
//
// 1. Detecta por color cada insignia de nota y cada celda de promedio.
// 2. Borra las insignias y lee con OCR solo el texto: encabezados, materias y el bimestre.
// 3. Ubica cada insignia en su fila (materia) y columna (Digitación, Apreciación, Bimestral, Prom.).
// 4. Lee todos los números en una sola pasada de OCR y los valida contra el color de la insignia
//    y contra los promedios que calcula el propio portal.
//
// `ocr` es un adaptador: { text(grayImg), digits(grayImg), line(grayImg, whitelist) } — ver ocr-browser.js.

import { findBlobs, splitBlob, toneFill, buildDigitSheet, buildTextImage, cropGray, romanBefore, BADGE_COLORS } from './vision.js';
import { auditAgainstPortal, toTenths, truncAvg, COMPONENTS } from '../grades/calc.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/**
 * Encuentra las columnas a partir de la fila de encabezados del portal.
 * Agrupa por posición (no por renglón del OCR): con capturas pequeñas Tesseract
 * suele partir el encabezado en bloques separados.
 */
function findHeader(lines) {
  const all = lines.flatMap((l) => l.words).filter((w) => w.text.trim());
  const cy = (w) => (w.bbox.y0 + w.bbox.y1) / 2;
  for (const key of all.filter((w) => /digit|aprec/.test(norm(w.text)))) {
    const h = key.bbox.y1 - key.bbox.y0;
    const words = all.filter((w) => Math.abs(cy(w) - cy(key)) < h * 0.6).sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const n = words.map((w) => norm(w.text));
    const anchors = [];
    let last = null;
    words.forEach((w, i) => {
      const t = n[i];
      if (t.includes('materia')) anchors.push({ key: 'name', x0: w.bbox.x0, bbox: w.bbox });
      else if (t.includes('digit')) { last = 'dig'; anchors.push({ key: 'dig', x0: w.bbox.x0, bbox: w.bbox }); }
      else if (t.includes('aprec')) { last = 'apr'; anchors.push({ key: 'apr', x0: w.bbox.x0, bbox: w.bbox }); }
      else if (t.includes('bimestral')) { last = 'bim'; anchors.push({ key: 'bim', x0: w.bbox.x0, bbox: w.bbox }); }
      else if (t.startsWith('prom') || t === 'pro' || t === 'prom.') {
        const next = n[i + 1] || '';
        if (next.startsWith('fin')) anchors.push({ key: 'final', x0: w.bbox.x0, bbox: w.bbox });
        else if (last) anchors.push({ key: last + 'Prom', x0: w.bbox.x0, bbox: w.bbox });
      }
    });
    if (anchors.filter((a) => a.key !== 'name').length >= 3) {
      anchors.sort((a, b) => a.x0 - b.x0);
      const bbox = {
        x0: Math.min(...words.map((w) => w.bbox.x0)), y0: Math.min(...words.map((w) => w.bbox.y0)),
        x1: Math.max(...words.map((w) => w.bbox.x1)), y1: Math.max(...words.map((w) => w.bbox.y1)),
      };
      return { anchors, bbox };
    }
  }
  return null;
}

const ROMAN_MAP = { I: 1, II: 2, III: 3, IV: 4 };

/** Convierte lo que leyó el OCR antes de "Bimestre" en número de bimestre. */
export function parseRoman(raw) {
  if (!raw) return null;
  let s = raw.toUpperCase().replace(/[|L1!ÍÌ\]\[]/g, 'I').replace(/[^IV]/g, '');
  if (s.includes('V')) return 4;
  s = s.slice(-3);
  return ROMAN_MAP[s] || null;
}

function detectBimestre(img, lines, headerY) {
  // Buscar la palabra "Bimestre" (no "Bimestral") por encima de la tabla.
  const all = lines.flatMap((l) => l.words);
  for (const word of all) {
    if (!/^bimestre/.test(norm(word.text.trim()))) continue;
    if (headerY != null && word.bbox.y0 > headerY) continue;
    const h = word.bbox.y1 - word.bbox.y0;
    // La palabra inmediatamente a la izquierda, en el mismo renglón.
    const prev = all
      .filter((w) => w !== word && w.bbox.x1 <= word.bbox.x0 + 2 && word.bbox.x0 - w.bbox.x1 < h * 2
        && Math.abs((w.bbox.y0 + w.bbox.y1) / 2 - (word.bbox.y0 + word.bbox.y1) / 2) < h * 0.6)
      .sort((a, b) => b.bbox.x1 - a.bbox.x1)[0];
    const fromGlyphs = parseRoman(romanBefore(img, word.bbox));
    const fromText = parseRoman(prev?.text || '');
    const value = fromGlyphs || fromText;
    if (value) return { value, sure: fromGlyphs != null && fromGlyphs === fromText };
  }
  // A veces el selector dice "4to Bimestre" o "Bimestre 4".
  for (const line of lines) {
    const m = norm(line.text).match(/(?:([1-4])\s*(?:er|do|ro|to|°|º)?\s*bimestre|bimestre\s*([1-4]))/);
    if (m) return { value: Number(m[1] || m[2]), sure: false };
  }
  return { value: null, sure: false };
}

/** Lee la columna de materias por separado: sin la tabla al lado el OCR es mucho más preciso. */
async function readNameColumn(img, ocr, zone, textHeight) {
  const zoom = textHeight && textHeight < 18 ? 2 : 1;
  const crop = cropGray(img, zone, zoom);
  const lines = await ocr.text(crop);
  const off = (b) => ({
    x0: zone.x0 + b.x0 / zoom, y0: zone.y0 + b.y0 / zoom,
    x1: zone.x0 + b.x1 / zoom, y1: zone.y0 + b.y1 / zoom,
  });
  return lines.map((l) => ({
    text: l.text,
    bbox: off(l.bbox),
    words: (l.words || []).map((w) => ({ text: w.text, bbox: off(w.bbox), confidence: w.confidence })),
  }));
}

const CONFUSABLE = { '3': '85', '8': '36', '5': '6', '6': '58', '1': '74', '7': '1', '0': '86', '9': '8', '4': '1', '2': '7' };

/** Interpreta lo leído por el OCR para una insignia, usando su color como pista. */
export function parseBadge(text, tone) {
  const raw = (text || '').replace(/\s+/g, '');
  if (tone === 'blue') return { value: '-', confidence: 'high' };
  if (/x/i.test(raw) && !/\d\.\d/.test(raw)) return { value: 'X', confidence: tone === 'muted' ? 'high' : 'medium' };
  if (tone === 'muted' && !/\d/.test(raw)) return { value: 'X', confidence: 'medium' };
  let m = raw.match(/([1-5])\.(\d)/);
  if (!m) m = raw.match(/([1-5])(\d)(?!.*\d)/); // se comió el punto: "39" → 3.9
  if (!m) return { value: null, confidence: 'none', raw };
  let value = `${m[1]}.${m[2]}`;
  if (value > '5.0') value = '5.0';
  const range = BADGE_COLORS[tone];
  if (!range) return { value, confidence: 'medium', raw };
  const t = toTenths(value) / 10;
  if (t >= range.min - 1e-9 && t <= range.max + 1e-9) return { value, confidence: 'high', raw };
  // El color no coincide con el número: probar confusiones típicas del OCR.
  const fixes = [];
  const digits = [m[1], m[2]];
  for (let k = 0; k < 2; k++) {
    for (const alt of CONFUSABLE[digits[k]] || '') {
      const d = [...digits];
      d[k] = alt;
      const v = Number(`${d[0]}.${d[1]}`);
      if (v >= range.min - 1e-9 && v <= range.max + 1e-9) fixes.push(`${d[0]}.${d[1]}`);
    }
  }
  if (fixes.length === 1) return { value: fixes[0], confidence: 'medium', raw, corrected: true };
  return { value, confidence: 'low', raw };
}

/** Asigna columnas sin encabezados: usa el tamaño de las celdas de promedio como guía. */
function structuralColumns(blobs) {
  const hs = blobs.map((b) => b.h);
  const small = median(hs.filter((h) => h <= median(hs) * 1.1)) || median(hs);
  const big = blobs.filter((b) => b.h > small * 1.25);
  // Agrupar x0 de celdas grandes en columnas.
  const cols = [];
  for (const b of [...big].sort((a, b) => a.x0 - b.x0)) {
    const c = cols.find((c) => Math.abs(c.x0 - b.x0) < small * 0.6);
    if (c) c.n++;
    else cols.push({ x0: b.x0, n: 1 });
  }
  const keys = cols.length >= 4 ? ['digProm', 'aprProm', 'bimProm', 'final'] : ['digProm', 'aprProm', 'final'];
  const anchors = cols.slice(-keys.length).map((c, i) => ({ key: keys[i], x0: c.x0 }));
  const firstSmall = Math.min(...blobs.filter((b) => b.h <= small * 1.1).map((b) => b.x0));
  anchors.unshift({ key: 'dig', x0: firstSmall });
  // Las insignias pequeñas entre dos celdas de promedio pertenecen al componente siguiente.
  const withComponents = [];
  for (let i = 0; i < anchors.length; i++) {
    withComponents.push(anchors[i]);
    const a = anchors[i];
    if (a.key === 'digProm') withComponents.push({ key: 'apr', x0: a.x0 + small * 1.2 });
    if (a.key === 'aprProm' && keys.includes('bimProm')) withComponents.push({ key: 'bim', x0: a.x0 + small * 1.2 });
  }
  return withComponents.sort((a, b) => a.x0 - b.x0);
}

/**
 * @param img  { data, width, height } RGBA
 * @param ocr  adaptador de OCR
 * @param onStep (etapa, progreso 0..1) para la animación
 */
export async function readScreenshot(img, ocr, onStep = () => {}) {
  onStep('colores', 0.05);
  const blobs = findBlobs(img);
  const warnings = [];

  onStep('texto', 0.15);
  const textImg = buildTextImage(img, blobs);
  const s = textImg.scale;
  const rawLines = await ocr.text(textImg);
  // Pasar las cajas a coordenadas de la imagen original.
  const scaleBox = (b) => ({ x0: b.x0 / s, y0: b.y0 / s, x1: b.x1 / s, y1: b.y1 / s });
  const lines = rawLines.map((l) => ({
    text: l.text,
    bbox: scaleBox(l.bbox),
    words: (l.words || []).map((w) => ({ text: w.text, bbox: scaleBox(w.bbox), confidence: w.confidence })),
  }));

  onStep('tabla', 0.45);
  const header = findHeader(lines);
  const badgeH = median(blobs.map((b) => b.h)) || 20;
  const footer = lines.find((l) => /asterisco|significa que el profesor/i.test(l.text));
  const top = header ? header.bbox.y1 : 0;
  const bottom = footer ? footer.bbox.y0 : img.height;

  let anchors = header?.anchors.filter((a) => a.key !== 'name') || [];
  const nameAnchor = header?.anchors.find((a) => a.key === 'name');
  let tableBlobs = blobs.filter((b) => b.cy > top && b.cy < bottom);
  if (anchors.length) {
    const minX = anchors[0].x0 - badgeH;
    tableBlobs = tableBlobs.filter((b) => b.x1 > minX);
  } else {
    // Sin encabezados: quedarnos con las regiones que comparten tamaño de insignia.
    const typical = median(tableBlobs.map((b) => b.h));
    tableBlobs = tableBlobs.filter((b) => b.h > typical * 0.7 && b.h < typical * 2.2);
    if (tableBlobs.length) anchors = structuralColumns(tableBlobs);
    warnings.push('No encontré los encabezados de la tabla; ubiqué las columnas por tamaño.');
  }

  // Materias: texto de la primera columna dentro de la tabla.
  const firstDataX = anchors.length ? anchors[0].x0 - badgeH * 0.3 : img.width * 0.3;
  let nameSource = lines;
  if (header) {
    try {
      const zone = { x0: Math.max(0, (nameAnchor?.x0 ?? 0) - badgeH), y0: top + 1, x1: firstDataX, y1: bottom - 1 };
      const textH = nameAnchor ? nameAnchor.bbox.y1 - nameAnchor.bbox.y0 : null;
      const col = await readNameColumn(img, ocr, zone, textH);
      if (col.some((l) => /[a-z]/i.test(l.text))) nameSource = col;
    } catch { /* se usa la lectura de la página completa */ }
  }
  const nameLines = [];
  for (const l of nameSource) {
    const cy = (l.bbox.y0 + l.bbox.y1) / 2;
    if (cy <= top + 2 || cy >= bottom) continue;
    const words = l.words.filter((w) => w.bbox.x1 < firstDataX && /[a-záéíóúñü]/i.test(w.text));
    if (!words.length) continue;
    if (nameAnchor && words[0].bbox.x0 < nameAnchor.x0 - badgeH * 2) continue;
    const text = words.map((w) => w.text).join(' ');
    nameLines.push({
      text,
      starred: /^[*+#=]/.test(l.words[0]?.text?.trim() || '') || /^\*/.test(l.text.trim()),
      y0: Math.min(...words.map((w) => w.bbox.y0)),
      y1: Math.max(...words.map((w) => w.bbox.y1)),
    });
  }
  nameLines.sort((a, b) => a.y0 - b.y0);
  // Unir nombres partidos en dos renglones.
  const rows = [];
  for (const nl of nameLines) {
    const prev = rows[rows.length - 1];
    const lh = nl.y1 - nl.y0;
    if (prev && nl.y0 - prev.y1 < lh * 0.45) {
      prev.text += ' ' + nl.text;
      prev.y1 = nl.y1;
    } else rows.push({ ...nl });
  }
  for (const r of rows) {
    r.name = cleanName(r.text);
    r.cy = (r.y0 + r.y1) / 2;
  }

  // Filas sin nombre detectado: agrupar insignias por altura y crear materias genéricas.
  const rowOf = (b) => {
    let best = null, bestD = Infinity;
    for (const r of rows) {
      const d = Math.abs(r.cy - b.cy);
      if (d < bestD) { bestD = d; best = r; }
    }
    return bestD < badgeH * 1.6 ? best : null;
  };
  const orphans = tableBlobs.filter((b) => !rowOf(b));
  if (orphans.length) {
    const groups = [];
    for (const b of orphans.sort((a, c) => a.cy - c.cy)) {
      const g = groups.find((g) => Math.abs(g.cy - b.cy) < badgeH * 0.8);
      if (g) g.items.push(b);
      else groups.push({ cy: b.cy, items: [b] });
    }
    groups.forEach((g, i) => rows.push({ name: `Materia ${rows.length + 1}`, cy: g.cy, y0: g.cy, y1: g.cy, starred: false, guessed: true }));
    rows.sort((a, b) => a.cy - b.cy);
    if (groups.length) warnings.push('Algunas filas no tenían nombre legible; revisa los nombres.');
  }

  const colOf = (b) => {
    const tol = badgeH * 0.45;
    let col = null;
    for (const a of anchors) if (a.x0 <= b.x0 + tol) col = a.key;
    return col;
  };

  // Separar celdas del mismo color que quedaron unidas (capturas reducidas o comprimidas):
  // ninguna celda puede cruzar el inicio de una columna ni el borde entre dos materias.
  const cutsX = anchors.slice(1).map((a) => a.x0 - badgeH * 0.2);
  const centers = rows.map((r) => r.cy).sort((a, b) => a - b);
  const cutsY = centers.slice(1).map((c, i) => (c + centers[i]) / 2);
  const margin = badgeH * 0.3;
  const splitAll = (b) => {
    const x = cutsX.find((cx) => b.x0 < cx - margin && b.x1 > cx + margin);
    if (x != null) return splitBlob(b, 'x', x).flatMap(splitAll);
    const y = cutsY.find((cy) => b.y0 < cy - margin && b.y1 > cy + margin);
    if (y != null) return splitBlob(b, 'y', y).flatMap(splitAll);
    return [b];
  };
  tableBlobs = tableBlobs.flatMap(splitAll).filter((b) => b.n > 0 && toneFill(img, b, b.tone) > 0.5);

  onStep('numeros', 0.55);
  const placed = [];
  for (const b of tableBlobs) {
    const row = rowOf(b);
    const col = colOf(b);
    if (!row || !col) continue;
    placed.push({ blob: b, row, col });
  }
  // Orden de lectura: por fila y luego de izquierda a derecha.
  placed.sort((a, b) => a.row.cy - b.row.cy || a.blob.x0 - b.blob.x0);

  const toRead = placed.filter((p) => p.blob.tone !== 'blue');
  const sheet = buildDigitSheet(img, toRead.map((p) => p.blob));
  const digitLines = toRead.length ? await ocr.digits(sheet) : [];
  const texts = new Array(toRead.length).fill('');
  const confs = new Array(toRead.length).fill(0);
  for (const l of digitLines) {
    const cy = (l.bbox.y0 + l.bbox.y1) / 2;
    const idx = Math.floor((cy - sheet.margin) / sheet.lineH);
    if (idx >= 0 && idx < texts.length) {
      texts[idx] += l.text.trim();
      confs[idx] = Math.max(confs[idx], l.confidence ?? 0);
    }
  }
  onStep('verificando', 0.8);
  // Releer de forma individual lo que no salió legible en la hoja completa.
  for (let i = 0; i < toRead.length; i++) {
    const parsed = parseBadge(texts[i], toRead[i].blob.tone);
    if (parsed.value && parsed.confidence === 'high') continue;
    const single = buildDigitSheet(img, [toRead[i].blob], { glyphH: 56, lineH: 110, margin: 40 });
    try {
      const res = await ocr.line(single, '0123456789.X');
      const alt = parseBadge(res.text, toRead[i].blob.tone);
      if (alt.value && (!parsed.value || rank(alt.confidence) > rank(parsed.confidence))) {
        texts[i] = res.text;
        confs[i] = res.confidence ?? confs[i];
      }
    } catch { /* se queda la primera lectura */ }
  }
  toRead.forEach((p, i) => { p.read = parseBadge(texts[i], p.blob.tone); p.ocrConfidence = confs[i]; });
  for (const p of placed) if (p.blob.tone === 'blue') p.read = { value: '-', confidence: 'high' };

  // Armar materias.
  const subjects = rows.map((r) => ({
    name: r.name,
    starred: !!r.starred,
    guessedName: !!r.guessed,
    dig: [], apr: [], bim: [],
    portal: { digProm: null, aprProm: null, bimProm: null, final: null },
    cells: [],
    issues: [],
  }));
  const byRow = new Map(rows.map((r, i) => [r, subjects[i]]));
  for (const p of placed) {
    const subj = byRow.get(p.row);
    const v = p.read?.value;
    const cell = { col: p.col, value: v, confidence: p.read?.confidence || 'none', tone: p.blob.tone, corrected: !!p.read?.corrected, box: [p.blob.x0, p.blob.y0, p.blob.x1, p.blob.y1] };
    subj.cells.push(cell);
    if (['dig', 'apr', 'bim'].includes(p.col)) subj[p.col].push(v ?? '?');
    else if (p.col in subj.portal) subj.portal[p.col] = v;
  }
  let low = 0;
  for (const subj of subjects) {
    repairWithPortal(subj);
    for (const c of subj.cells) if (c.confidence !== 'high') low++;
    subj.issues = auditAgainstPortal(subj, subj.portal);
  }

  onStep('bimestre', 0.92);
  const bim = detectBimestre(img, lines, header ? header.bbox.y0 : null);
  const hasBimestralColumn = anchors.some((a) => a.key === 'bim');
  if (!bim.value) warnings.push('No pude leer qué bimestre es; elígelo tú.');
  // ¿Es de verdad una tabla de notas? Con encabezados basta; sin ellos, exigir varias notas legibles.
  const numeric = placed.filter((p) => /^\d\.\d$/.test(p.read?.value || '')).length;
  const valid = !!header || numeric >= 5;
  if (!valid) warnings.push('No encontré una tabla de notas en esta imagen.');

  onStep('listo', 1);
  return {
    valid,
    bimestre: bim.value,
    bimestreSure: bim.sure,
    hasBimestralColumn,
    subjects: subjects.filter((s) => s.name),
    warnings,
    stats: { badges: placed.length, uncertain: low, mismatches: subjects.reduce((a, s) => a + s.issues.length, 0) },
    size: { width: img.width, height: img.height },
  };
}

const rank = (c) => ({ none: 0, low: 1, medium: 2, high: 3 }[c] ?? 0);

const inRange = (t, tone) => {
  const r = BADGE_COLORS[tone];
  return !r || (t >= Math.round(r.min * 10) && t <= Math.round(r.max * 10));
};

/** Valores alternativos de una nota que respetan el color de su insignia (cambiando un dígito). */
function alternatives(value, tone) {
  const t = toTenths(value);
  if (t == null) return [];
  const out = [];
  const [a, b] = [Math.floor(t / 10), t % 10];
  for (let d = 0; d <= 9; d++) if (d !== b) out.push(a * 10 + d);
  for (let d = 1; d <= 5; d++) if (d !== a) out.push(d * 10 + b);
  return out.filter((x) => x >= 10 && x <= 50 && inRange(x, tone));
}

const fmtT = (t) => (t / 10).toFixed(1);

/**
 * El portal ya muestra sus propios promedios: si un número leído no cuadra con ellos,
 * se busca la única corrección de un dígito que lo haga cuadrar (respetando el color).
 */
export function repairWithPortal(subj) {
  const keyOf = { dig: 'digProm', apr: 'aprProm', bim: 'bimProm' };
  const cellsOf = (col) => subj.cells.filter((c) => c.col === col);
  for (const comp of COMPONENTS) {
    const items = cellsOf(comp);
    const promCell = cellsOf(keyOf[comp])[0];
    const nums = items.map((c) => toTenths(c.value));
    const computed = truncAvg(nums);
    const shown = toTenths(promCell?.value);
    if (computed == null || shown == null) continue;
    if (computed === shown) {
      for (const c of [...items, promCell]) if (c.confidence === 'low') c.confidence = 'medium';
      continue;
    }
    const fixes = [];
    // a) El número equivocado es una insignia.
    items.forEach((c, i) => {
      for (const alt of alternatives(c.value, c.tone)) {
        const trial = [...nums];
        trial[i] = alt;
        if (truncAvg(trial) === shown) fixes.push({ cell: c, value: fmtT(alt) });
      }
    });
    // b) El número equivocado es la celda del promedio.
    if (inRange(computed, promCell.tone) && alternatives(promCell.value, promCell.tone).includes(computed)) {
      fixes.push({ cell: promCell, value: fmtT(computed) });
    }
    const lowFirst = fixes.filter((f) => f.cell.confidence !== 'high');
    const pick = lowFirst.length === 1 ? lowFirst[0] : fixes.length === 1 ? fixes[0] : null;
    if (pick) {
      pick.cell.value = pick.value;
      pick.cell.corrected = true;
      pick.cell.confidence = 'medium';
    } else {
      for (const c of [...items, promCell]) if (c.confidence === 'high') c.confidence = 'low';
    }
  }
  // La nota final del bimestre contra los tres promedios.
  const finalCell = cellsOf('final')[0];
  const proms = COMPONENTS.map((c) => toTenths(cellsOf(keyOf[c])[0]?.value));
  const computedFinal = truncAvg(proms);
  const shownFinal = toTenths(finalCell?.value);
  if (finalCell && computedFinal != null && shownFinal !== computedFinal) {
    if (inRange(computedFinal, finalCell.tone)) {
      finalCell.value = fmtT(computedFinal);
      finalCell.corrected = true;
      finalCell.confidence = 'medium';
    } else finalCell.confidence = 'low';
  }
  // Reflejar los cambios en las listas de la materia.
  for (const comp of COMPONENTS) subj[comp] = cellsOf(comp).map((c) => c.value ?? '?');
  for (const k of Object.keys(subj.portal)) subj.portal[k] = cellsOf(k)[0]?.value ?? null;
}

/** Limpia el nombre de una materia leído por OCR. */
export function cleanName(text) {
  return text
    .replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ(]+/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/[|_~«»"“”]+/g, '')
    .trim();
}
