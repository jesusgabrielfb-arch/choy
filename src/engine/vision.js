// Operaciones de píxeles puras (sin DOM): sirven igual en el navegador y en Node.
// Una "imagen" es { data: RGBA Uint8(Clamped)Array, width, height }.

/** Escala de colores del portal SEDUCA → rango de notas que representa. */
export const BADGE_COLORS = {
  red:    { min: 1.0, max: 2.9 },
  orange: { min: 3.0, max: 3.4 },
  yellow: { min: 3.5, max: 3.9 },
  lime:   { min: 4.0, max: 4.4 },
  green:  { min: 4.5, max: 5.0 },
  blue:   null, // "-" asignación pendiente
  muted:  null, // "X" (exonerado / no cuenta)
};

function hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: mx ? d / mx : 0, v: mx / 255 };
}

/** Clasifica el color de fondo de una insignia según la escala del portal. */
export function colorClass([r, g, b]) {
  const { h, s } = hsv(r, g, b);
  if (h >= 170 && h <= 260) return 'blue';
  if (h < 12 || h > 340) return s < 0.8 ? 'muted' : 'red';
  if (h < 38) return 'orange';
  if (h < 62) return 'yellow';
  if (h < 115) return 'lime';
  if (h < 170) return 'green';
  return 'red';
}

/**
 * Encuentra regiones de color saturado (insignias de notas y celdas de promedio).
 * Devuelve cajas con su color medio. Ignora texto, fondos crema/grises y líneas.
 */
const TONE_IDS = ['', 'red', 'muted', 'orange', 'yellow', 'lime', 'green', 'blue'];

/** Clase de color de un píxel (índice en TONE_IDS); 0 si no es un color saturado. */
function pixelTone(r, g, b) {
  const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
  const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
  const d = mx - mn;
  if (!(mx > 90 && d > 70 && d > mx * 0.4)) return 0;
  let h;
  if (mx === r) h = (60 * (g - b)) / d;
  else if (mx === g) h = 120 + (60 * (b - r)) / d;
  else h = 240 + (60 * (r - g)) / d;
  if (h < 0) h += 360;
  if (h < 12 || h > 340) return d > mx * 0.8 ? 1 : 2;
  if (h < 38) return 3;
  if (h < 62) return 4;
  if (h < 115) return 5;
  if (h < 170) return 6;
  if (h <= 260) return 7;
  return 1;
}

/** Fracción de la caja que tiene el color indicado (para descartar pedazos vacíos tras un corte). */
export function toneFill(img, box, tone) {
  const { data, width: W } = img;
  const id = TONE_IDS.indexOf(tone);
  let hit = 0, total = 0;
  for (let y = box.y0; y <= box.y1; y += 2) {
    for (let x = box.x0; x <= box.x1; x += 2) {
      const p = (y * W + x) * 4;
      total++;
      if (pixelTone(data[p], data[p + 1], data[p + 2]) === id) hit++;
    }
  }
  return total ? hit / total : 0;
}

export function findBlobs(img, { minArea = 60 } = {}) {
  const { data, width: W, height: H } = img;
  const N = W * H;
  // Cada píxel saturado recibe la clase de color de la escala del portal. Solo se conectan
  // píxeles de la MISMA clase: así dos celdas vecinas de distinto color nunca se funden,
  // aunque la captura esté reducida o comprimida y se pierda el borde entre ellas.
  const mask = new Uint8Array(N);
  for (let i = 0, p = 0; i < N; i++, p += 4) mask[i] = pixelTone(data[p], data[p + 1], data[p + 2]);
  const seen = new Uint8Array(N);
  const stack = new Int32Array(N);
  const blobs = [];
  for (let i = 0; i < N; i++) {
    const cls = mask[i];
    if (!cls || seen[i]) continue;
    let sp = 0;
    stack[sp++] = i;
    seen[i] = 1;
    let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0, R = 0, G = 0, B = 0;
    while (sp) {
      const j = stack[--sp];
      const x = j % W, y = (j - x) / W;
      n++;
      R += data[j * 4]; G += data[j * 4 + 1]; B += data[j * 4 + 2];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && mask[j - 1] === cls && !seen[j - 1]) { seen[j - 1] = 1; stack[sp++] = j - 1; }
      if (x < W - 1 && mask[j + 1] === cls && !seen[j + 1]) { seen[j + 1] = 1; stack[sp++] = j + 1; }
      if (y > 0 && mask[j - W] === cls && !seen[j - W]) { seen[j - W] = 1; stack[sp++] = j - W; }
      if (y < H - 1 && mask[j + W] === cls && !seen[j + W]) { seen[j + W] = 1; stack[sp++] = j + W; }
    }
    if (n < minArea) continue;
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const fill = n / (w * h);
    const aspect = w / h;
    // Insignias y celdas: rectángulos casi llenos (el texto blanco deja huecos). Se aceptan
    // columnas altas: son celdas de promedio del mismo color pegadas, que luego se cortan.
    if (h < 8 || fill < 0.5 || aspect < 0.1 || aspect > 7) continue;
    const color = [Math.round(R / n), Math.round(G / n), Math.round(B / n)];
    blobs.push({ x0, y0, x1, y1, w, h, n, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, color, tone: TONE_IDS[cls] });
  }
  return blobs;
}

/** Corta una región en dos (por x o por y) — para celdas del mismo color que quedaron unidas. */
export function splitBlob(b, axis, at) {
  if (axis === 'x') {
    const a = { ...b, x1: Math.floor(at) - 1 }, c = { ...b, x0: Math.ceil(at) + 1 };
    return [a, c].filter((p) => p.x1 - p.x0 > 4).map(refresh);
  }
  const a = { ...b, y1: Math.floor(at) - 1 }, c = { ...b, y0: Math.ceil(at) + 1 };
  return [a, c].filter((p) => p.y1 - p.y0 > 4).map(refresh);
}

function refresh(b) {
  const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
  return { ...b, w, h, n: Math.round(w * h * 0.9), cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2 };
}

/**
 * Extrae el texto blanco de una insignia como máscara binaria recortada a los glifos.
 * Funciona con texto blanco simple y con texto blanco contorneado en negro.
 */
export function extractInk(img, blob) {
  const { data, width: W } = img;
  const inset = Math.max(2, Math.round(blob.h * 0.06));
  const x0 = blob.x0 + inset, y0 = blob.y0 + inset;
  const w = blob.w - inset * 2, h = blob.h - inset * 2;
  if (w < 4 || h < 4) return null;
  const mins = new Uint8Array(w * h);
  const hist = new Uint32Array(256);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = ((y0 + y) * W + x0 + x) * 4;
      const r = data[p], g = data[p + 1], b = data[p + 2];
      const v = r < g ? (r < b ? r : b) : (g < b ? g : b);
      mins[y * w + x] = v;
      hist[v]++;
    }
  }
  // El fondo de la insignia domina: su canal mínimo es la moda baja del histograma.
  let acc = 0, bg = 0;
  const target = w * h * 0.3;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= target) { bg = v; break; } }
  const thr = (bg + 255) / 2;
  const m = new Uint8Array(w * h);
  // Intensidad de "tinta" 0..1 (con antialias) para reescalar los dígitos sin escalones.
  const v = new Float32Array(w * h);
  const span = Math.max(1, 255 - bg);
  for (let i = 0; i < m.length; i++) {
    m[i] = mins[i] > thr ? 1 : 0;
    v[i] = Math.min(1, Math.max(0, (mins[i] - bg) / span));
  }

  // Quita manchas pegadas al borde (esquinas redondeadas que dejan ver el fondo blanco).
  const stack = [];
  const clear = (i) => { if (m[i]) { m[i] = 0; v[i] = 0; stack.push(i); } };
  for (let x = 0; x < w; x++) { clear(x); clear((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { clear(y * w); clear(y * w + w - 1); }
  while (stack.length) {
    const j = stack.pop();
    const x = j % w, y = (j - x) / w;
    if (x > 0) clear(j - 1);
    if (x < w - 1) clear(j + 1);
    if (y > 0) clear(j - w);
    if (y < h - 1) clear(j + w);
  }

  let bx0 = w, by0 = h, bx1 = -1, by1 = -1, count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      count++;
      if (x < bx0) bx0 = x;
      if (x > bx1) bx1 = x;
      if (y < by0) by0 = y;
      if (y > by1) by1 = y;
    }
  }
  if (bx1 < 0 || count < 6) return null;
  // Apaga la tinta débil que no pertenece a ningún glifo (halo del contorno, ruido JPEG).
  for (let i = 0; i < v.length; i++) if (!m[i] && v[i] < 0.35) v[i] = 0;
  return { m, v, w, h, bx0, by0, bx1, by1, iw: bx1 - bx0 + 1, ih: by1 - by0 + 1 };
}

function sampleBilinear(v, w, h, x, y) {
  const xa = Math.max(0, Math.min(w - 1, Math.floor(x))), ya = Math.max(0, Math.min(h - 1, Math.floor(y)));
  const xb = Math.min(w - 1, xa + 1), yb = Math.min(h - 1, ya + 1);
  const fx = Math.max(0, Math.min(1, x - xa)), fy = Math.max(0, Math.min(1, y - ya));
  const top = v[ya * w + xa] * (1 - fx) + v[ya * w + xb] * fx;
  const bot = v[yb * w + xa] * (1 - fx) + v[yb * w + xb] * fx;
  return top * (1 - fy) + bot * fy;
}

/**
 * Arma una imagen en escala de grises con una línea por insignia (texto negro sobre blanco,
 * todas a la misma altura) para leerlas todas en una sola pasada de OCR.
 */
export function buildDigitSheet(img, blobs, { glyphH = 44, lineH = 92, margin = 32 } = {}) {
  const items = blobs.map((b) => {
    const ink = extractInk(img, b);
    if (!ink) return null;
    const sc = glyphH / ink.ih;
    return { ink, sc, ow: Math.max(1, Math.round(ink.iw * sc)) };
  });
  const maxW = Math.max(60, ...items.filter(Boolean).map((it) => it.ow));
  const width = maxW + margin * 2;
  const height = blobs.length * lineH + margin * 2;
  const gray = new Uint8Array(width * height).fill(255);
  items.forEach((it, idx) => {
    if (!it) return;
    const { ink, sc, ow } = it;
    const oy = margin + idx * lineH + Math.round((lineH - glyphH) / 2);
    const pad = Math.ceil(sc); // un píxel de origen alrededor para conservar el antialias
    for (let y = -pad; y < glyphH + pad; y++) {
      const sy = ink.by0 + (y + 0.5) / sc - 0.5;
      for (let x = -pad; x < ow + pad; x++) {
        const sx = ink.bx0 + (x + 0.5) / sc - 0.5;
        const val = sampleBilinear(ink.v, ink.w, ink.h, sx, sy);
        if (val > 0.02) gray[(oy + y) * width + margin + x] = Math.round(255 * (1 - val));
      }
    }
  });
  return { gray, width, height, lineH, margin, empty: items.map((it) => !it) };
}

/** Imagen en grises con las insignias borradas: deja solo el texto (materias, encabezados). */
export function buildTextImage(img, blobs, { maxWidth = 2400 } = {}) {
  const { data, width: W, height: H } = img;
  const scale = W > maxWidth ? maxWidth / W : 1;
  const width = Math.round(W * scale), height = Math.round(H * scale);
  const gray = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const sy = Math.min(H - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(W - 1, Math.floor(x / scale));
      const p = (sy * W + sx) * 4;
      gray[y * width + x] = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
    }
  }
  for (const b of blobs) {
    const pad = 2;
    const xa = Math.max(0, Math.floor((b.x0 - pad) * scale)), xb = Math.min(width - 1, Math.ceil((b.x1 + pad) * scale));
    const ya = Math.max(0, Math.floor((b.y0 - pad) * scale)), yb = Math.min(height - 1, Math.ceil((b.y1 + pad) * scale));
    for (let y = ya; y <= yb; y++) gray.fill(255, y * width + xa, y * width + xb + 1);
  }
  return { gray, width, height, scale };
}

/**
 * Lee el número romano que está justo antes de la palabra "Bimestre" contando sus trazos:
 * una "I" es una barra delgada y una "V" es ancha. Más confiable que el OCR para 1–3 letras.
 * `box` es la caja de la palabra "Bimestre" en coordenadas de la imagen.
 */
export function romanBefore(img, box) {
  const { data, width: W, height: H } = img;
  const h = box.y1 - box.y0;
  const x0 = Math.max(0, Math.floor(box.x0 - h * 4)), x1 = Math.max(0, Math.floor(box.x0 - 1));
  const y0 = Math.max(0, Math.floor(box.y0 - h * 0.15)), y1 = Math.min(H - 1, Math.ceil(box.y1 + h * 0.15));
  const w = x1 - x0 + 1, hh = y1 - y0 + 1;
  if (w < 3 || hh < 3) return '';
  const lum = new Uint8Array(w * hh);
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < w; x++) {
      const p = ((y0 + y) * W + x0 + x) * 4;
      lum[y * w + x] = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
    }
  }
  const bg = [...lum].sort((a, b) => a - b)[Math.floor(lum.length * 0.6)];
  const dark = lum.map((v) => (v < bg - 70 ? 1 : 0));
  const seen = new Uint8Array(w * hh);
  const glyphs = [];
  for (let i = 0; i < dark.length; i++) {
    if (!dark[i] || seen[i]) continue;
    const st = [i];
    seen[i] = 1;
    let gx0 = w, gx1 = 0, gy0 = hh, gy1 = 0;
    while (st.length) {
      const j = st.pop();
      const x = j % w, y = (j - x) / w;
      if (x < gx0) gx0 = x;
      if (x > gx1) gx1 = x;
      if (y < gy0) gy0 = y;
      if (y > gy1) gy1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= hh) continue;
          const k = ny * w + nx;
          if (dark[k] && !seen[k]) { seen[k] = 1; st.push(k); }
        }
      }
    }
    const gh = gy1 - gy0 + 1, gw = gx1 - gx0 + 1;
    if (gh >= h * 0.6 && gh <= h * 1.4) glyphs.push({ x0: gx0, x1: gx1, w: gw, h: gh });
  }
  glyphs.sort((a, b) => b.x0 - a.x0);
  const run = [];
  let edge = w;
  for (const g of glyphs) {
    if (edge - g.x1 > h * (run.length ? 0.6 : 1.2)) break;
    run.unshift(g);
    edge = g.x0;
  }
  return run.map((g) => (g.w / g.h < 0.45 ? 'I' : 'V')).join('');
}

/** Recorta una zona de la imagen a grises, ampliada (para leer textos cortos como "IV Bimestre"). */
export function cropGray(img, { x0, y0, x1, y1 }, zoom = 2) {
  const { data, width: W, height: H } = img;
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(W - 1, Math.ceil(x1)); y1 = Math.min(H - 1, Math.ceil(y1));
  const width = Math.max(1, Math.round((x1 - x0 + 1) * zoom));
  const height = Math.max(1, Math.round((y1 - y0 + 1) * zoom));
  const gray = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const sy = y0 + Math.floor(y / zoom);
    for (let x = 0; x < width; x++) {
      const p = (sy * W + x0 + Math.floor(x / zoom)) * 4;
      gray[y * width + x] = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
    }
  }
  return { gray, width, height };
}
