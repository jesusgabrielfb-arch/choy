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

/** Corteza del pan: dorado con manchas quemadas según `burn` (0..1). */
export function crustTexture(burn = 0.5, seed = 5) {
  const [c, g] = canvas(512, 256);
  const r = rng(seed);
  // Base: más dorada abajo (el UV de la esfera va de polo a polo en v).
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#8a4a1c');
  grad.addColorStop(0.35, '#c97a34');
  grad.addColorStop(0.62, '#e7a752');
  grad.addColorStop(1, '#f2cf8c');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 256);
  // Poros y harina.
  for (let i = 0; i < 900; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(90,40,10,0.18)' : 'rgba(255,240,210,0.16)';
    g.beginPath();
    g.arc(r() * 512, r() * 256, 0.6 + r() * 1.6, 0, Math.PI * 2);
    g.fill();
  }
  // Quemado: un lado (u ≈ 0.55–0.95) y la coronilla.
  const blobs = Math.round(6 + burn * 26);
  for (let i = 0; i < blobs; i++) {
    const x = 280 + r() * 220, y = r() * 150;
    const rad = 18 + r() * 46 * (0.5 + burn);
    const rg = g.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, `rgba(25,12,6,${0.55 + burn * 0.4})`);
    rg.addColorStop(0.6, `rgba(60,24,8,${0.25 + burn * 0.35})`);
    rg.addColorStop(1, 'rgba(60,24,8,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  const top = g.createLinearGradient(0, 0, 0, 90);
  top.addColorStop(0, `rgba(20,10,5,${0.25 + burn * 0.6})`);
  top.addColorStop(1, 'rgba(20,10,5,0)');
  g.fillStyle = top;
  g.fillRect(0, 0, 512, 90);
  const t = texture(c);
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
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
