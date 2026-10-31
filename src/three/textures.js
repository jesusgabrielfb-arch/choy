import { toastColors } from '../grades/toast.js';
// Texturas dibujadas en canvas: no se descarga ninguna imagen.
import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function texture(c, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}

// Generador pseudoaleatorio con semilla: la cocina se ve igual en cada carga.
export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Azulejos tipo metro, verde azulado, con juntas claras y leve variación de tono. */
export function tilesTexture() {
  const [c, g] = canvas(512, 512);
  const r = rng(11);
  g.fillStyle = '#d9cbb0';
  g.fillRect(0, 0, 512, 512);
  const rows = 8, cols = 4, tw = 128, th = 64, gap = 5;
  for (let y = 0; y < rows; y++) {
    for (let x = -1; x < cols + 1; x++) {
      const ox = (y % 2) * (tw / 2);
      const px = x * tw + ox + gap / 2, py = y * th + gap / 2;
      const l = 30 + r() * 6;
      const grad = g.createLinearGradient(px, py, px, py + th);
      grad.addColorStop(0, `hsl(176 34% ${l + 6}%)`);
      grad.addColorStop(1, `hsl(178 38% ${l - 2}%)`);
      g.fillStyle = grad;
      g.beginPath();
      g.roundRect(px, py, tw - gap, th - gap, 6);
      g.fill();
      // brillo del esmalte
      g.fillStyle = 'rgba(255,255,255,0.10)';
      g.beginPath();
      g.roundRect(px + 6, py + 5, tw - gap - 30, 7, 4);
      g.fill();
    }
  }
  return texture(c, { repeat: [3.5, 2.6] });
}

/** Veta de madera para el mesón (tabla de carnicero). */
export function woodTexture({ base = '#9a6236', dark = '#6e4021', seed = 3, strips = 9 } = {}) {
  const [c, g] = canvas(1024, 256);
  const r = rng(seed);
  const sw = 1024 / strips;
  for (let i = 0; i < strips; i++) {
    const tint = (r() - 0.5) * 18;
    g.fillStyle = shade(base, tint);
    g.fillRect(i * sw, 0, sw, 256);
    for (let k = 0; k < 26; k++) {
      g.strokeStyle = `rgba(60,30,10,${0.06 + r() * 0.12})`;
      g.lineWidth = 0.6 + r() * 1.8;
      g.beginPath();
      const y0 = r() * 256;
      g.moveTo(i * sw, y0);
      for (let x = 0; x <= sw; x += 16) g.lineTo(i * sw + x, y0 + Math.sin((x + k * 13) / 40) * 3 + (r() - 0.5) * 2);
      g.stroke();
    }
    g.fillStyle = dark;
    g.globalAlpha = 0.5;
    g.fillRect(i * sw, 0, 2, 256);
    g.globalAlpha = 1;
  }
  return texture(c, { repeat: [2, 1] });
}

/** Puertas de gabinete: paneles con moldura. */
export function cabinetTexture() {
  const [c, g] = canvas(1024, 256);
  g.fillStyle = '#1f3d44';
  g.fillRect(0, 0, 1024, 256);
  const n = 4, w = 1024 / n;
  for (let i = 0; i < n; i++) {
    const x = i * w;
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(x, 0, 3, 256);
    g.strokeStyle = 'rgba(255,255,255,0.08)';
    g.lineWidth = 4;
    g.strokeRect(x + 22, 26, w - 44, 204);
    g.strokeStyle = 'rgba(0,0,0,0.30)';
    g.lineWidth = 3;
    g.strokeRect(x + 28, 32, w - 56, 192);
  }
  return texture(c);
}

/**
 * Miga de la rebanada: poros, borde de corteza, marcas de tostadora y un lado quemado.
 * `outline` es la silueta (Vector2) y `box` su caja, para que la textura calce con las UV.
 * Devuelve { map, bump } (color y relieve de los poros).
 */
export function crumbTexture(outline, box, burn = 0.45, seed = 5) {
  const size = 512;
  const W = box.maxX - box.minX, H = box.maxY - box.minY;
  const toC = (p) => [((p.x - box.minX) / W) * size, ((box.maxY - p.y) / H) * size];
  const path = (g) => {
    g.beginPath();
    outline.forEach((p, i) => { const [x, y] = toC(p); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.closePath();
  };
  const [c, g] = canvas(size, size);
  const [bc, bg] = canvas(size, size);
  const r = rng(seed);

  // Fondo (fuera de la silueta) en tono corteza por si el bisel muestra un borde.
  g.fillStyle = '#9b5422';
  g.fillRect(0, 0, size, size);
  bg.fillStyle = '#808080';
  bg.fillRect(0, 0, size, size);
  g.save(); path(g); g.clip();
  bg.save(); path(bg); bg.clip();

  // Miga: crema al centro, más dorada hacia la corteza.
  const tc = toastColors(burn);
  const rad = g.createRadialGradient(size * 0.45, size * 0.52, size * 0.05, size * 0.5, size * 0.5, size * 0.62);
  rad.addColorStop(0, tc.center);
  rad.addColorStop(1, tc.edge);
  g.fillStyle = rad;
  g.fillRect(0, 0, size, size);

  // Poros: huequitos más oscuros con brillo arriba (y su relieve en el mapa de bump).
  for (let i = 0; i < 2200; i++) {
    const x = r() * size, y = r() * size;
    const rw = 0.8 + r() * r() * 5.5, rh = rw * (0.5 + r() * 0.6);
    const a = r() * Math.PI;
    g.fillStyle = `rgba(150,96,40,${0.18 + r() * 0.25})`;
    g.beginPath(); g.ellipse(x, y, rw, rh, a, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,248,225,0.35)';
    g.beginPath(); g.ellipse(x - rw * 0.3, y - rh * 0.5, rw * 0.5, rh * 0.35, a, 0, Math.PI * 2); g.fill();
    bg.fillStyle = `rgba(0,0,0,${0.35 + r() * 0.4})`;
    bg.beginPath(); bg.ellipse(x, y, rw, rh, a, 0, Math.PI * 2); bg.fill();
  }

  // Tostado: marcas de la parrilla y lado derecho quemado.
  if (burn > 0.25 && burn < 0.85) {
    g.save();
    g.globalAlpha = Math.min(0.3, (burn - 0.1) * 0.45);
    g.strokeStyle = '#6b3410';
    g.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      g.lineWidth = 16 + r() * 6;
      g.beginPath();
      g.moveTo(size * (0.05 + k * 0.26), size * 0.95);
      g.lineTo(size * (0.35 + k * 0.26), size * 0.08);
      g.stroke();
    }
    g.restore();
  }
  const side = g.createLinearGradient(size * 0.42, 0, size, size * 0.15);
  side.addColorStop(0, 'rgba(70,30,8,0)');
  const half = Math.max(0, (burn - 0.3) / 0.7); // el lado quemado aparece desde "tostado"
  side.addColorStop(0.45, `rgba(70,30,8,${0.35 * half})`);
  side.addColorStop(1, `rgba(22,9,3,${Math.min(0.95, half * 1.05)})`);
  g.fillStyle = side;
  g.fillRect(0, 0, size, size);
  const blobs = Math.round(Math.max(0, burn - 0.35) * 40);
  for (let i = 0; i < blobs; i++) {
    const x = size * (0.62 + r() * 0.42), y = size * (r() * 0.85);
    const rr = 14 + r() * 42 * (0.4 + burn);
    const rg = g.createRadialGradient(x, y, 0, x, y, rr);
    rg.addColorStop(0, `rgba(18,8,3,${0.5 + burn * 0.45})`);
    rg.addColorStop(1, 'rgba(18,8,3,0)');
    g.fillStyle = rg;
    g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
  }
  // Grietas de carbón.
  if (burn > 0.35) {
    g.strokeStyle = `rgba(10,4,2,${burn * 0.7})`;
    g.lineWidth = 2;
    for (let i = 0; i < Math.round(burn * 9); i++) {
      let x = size * (0.7 + r() * 0.28), y = size * r() * 0.8;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 30; y += 10 + r() * 18; g.lineTo(x, y); }
      g.stroke();
    }
  }
  g.restore();
  bg.restore();

  // Corteza: un borde café siguiendo la silueta (más oscuro del lado quemado).
  const crustW = size * 0.075;
  g.save(); path(g); g.clip();
  const cr = g.createLinearGradient(0, 0, size, 0);
  cr.addColorStop(0, tc.crust);
  cr.addColorStop(0.55, tc.crust);
  cr.addColorStop(1, toastColors(Math.min(1, burn + 0.3)).crust);
  g.strokeStyle = cr;
  g.lineWidth = crustW * 2;
  g.lineJoin = 'round';
  path(g); g.stroke();
  g.restore();
  bg.save(); path(bg); bg.clip();
  bg.strokeStyle = '#c0c0c0';
  bg.lineWidth = crustW * 2;
  path(bg); bg.stroke();
  bg.restore();

  const map = texture(c);
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  const bump = texture(bc, { srgb: false });
  bump.wrapS = bump.wrapT = THREE.ClampToEdgeWrapping;
  return { map, bump };
}

/** Costado de la rebanada (corteza): café tostado con textura, más oscuro si está quemado. */
export function crustSideTexture(burn = 0.45, seed = 9) {
  const [c, g] = canvas(256, 256);
  const r = rng(seed);
  const grad = g.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, toastColors(burn).crust);
  grad.addColorStop(1, toastColors(Math.min(1, burn + 0.3)).crust);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = r() > 0.5 ? `rgba(60,25,8,${0.15 + r() * 0.25})` : 'rgba(255,214,150,0.12)';
    g.beginPath();
    g.arc(r() * 256, r() * 256, 0.6 + r() * 2.2, 0, Math.PI * 2);
    g.fill();
  }
  return texture(c, { repeat: [4, 4] });
}

/** Vidrio del horno: resplandor naranja con rejilla. */
export function ovenGlassTexture() {
  const [c, g] = canvas(256, 160);
  const rg = g.createRadialGradient(128, 110, 6, 128, 90, 170);
  rg.addColorStop(0, '#ffd27a');
  rg.addColorStop(0.35, '#ff8a2a');
  rg.addColorStop(0.75, '#7a2208');
  rg.addColorStop(1, '#1a0703');
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 160);
  g.strokeStyle = 'rgba(30,10,4,0.55)';
  g.lineWidth = 3;
  for (let x = 20; x < 256; x += 22) {
    g.beginPath();
    g.moveTo(x, 70);
    g.lineTo(x, 150);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(0, 72);
  g.lineTo(256, 72);
  g.stroke();
  // Siluetas de panes en la rejilla.
  g.fillStyle = 'rgba(40,12,3,0.55)';
  for (const [x, w] of [[52, 58], [128, 64], [204, 54]]) {
    g.beginPath();
    g.moveTo(x - w / 2, 70);
    g.bezierCurveTo(x - w / 2, 36, x + w / 2, 36, x + w / 2, 70);
    g.closePath();
    g.fill();
  }
  // reflejo
  g.fillStyle = 'rgba(255,255,255,0.10)';
  g.beginPath();
  g.moveTo(20, 10);
  g.lineTo(90, 10);
  g.lineTo(40, 150);
  g.lineTo(10, 150);
  g.fill();
  return texture(c);
}

/** Etiqueta de frasco escrita a mano. */
export function labelTexture(text, { bg = '#f4ead6', ink = '#5b3418' } = {}) {
  const [c, g] = canvas(256, 128);
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = 'rgba(91,52,24,0.35)';
  g.setLineDash([6, 5]);
  g.lineWidth = 3;
  g.strokeRect(10, 10, 236, 108);
  g.fillStyle = ink;
  g.font = '700 46px "Fraunces Variable", Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 66);
  const t = texture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Punto suave para humo y vapor. */
export function softDotTexture() {
  const [c, g] = canvas(64, 64);
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}
