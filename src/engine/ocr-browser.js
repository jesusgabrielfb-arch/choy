// OCR en el navegador: Tesseract corre en un Web Worker y sus archivos se sirven desde /ocr.
import { createWorker, PSM } from 'tesseract.js';
import { createOcr } from './ocr-adapter.js';

const base = new URL(`${import.meta.env.BASE_URL}ocr/`, location.href).href;

function encode({ gray, width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const out = ctx.createImageData(width, height);
  for (let i = 0; i < gray.length; i++) {
    const v = gray[i];
    out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

let pending = null;

// Algunos hosts (como las vistas previas de Claude) no sirven archivos .gz. En ese caso el build
// define VITE_LANG_FILE con otro nombre y el idioma se deja en la caché que Tesseract revisa primero.
const LANG_FILE = import.meta.env.VITE_LANG_FILE;

function primeLanguageCache() {
  return fetch(`${base}${LANG_FILE}`)
    .then((r) => { if (!r.ok) throw new Error(`No se pudo bajar el idioma (${r.status})`); return r.arrayBuffer(); })
    .then((buf) => new Promise((resolve, reject) => {
      const open = indexedDB.open('keyval-store');
      open.onupgradeneeded = () => open.result.createObjectStore('keyval');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const tx = open.result.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(new Uint8Array(buf), './spa.traineddata');
        tx.oncomplete = () => { open.result.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    }));
}

/** Crea (una sola vez) el lector OCR. La primera vez descarga ~6 MB y luego queda en caché. */
export function getOcr() {
  pending ??= (LANG_FILE ? primeLanguageCache() : Promise.resolve()).then(() => createOcr({
    createWorker,
    PSM,
    encode,
    workerOptions: {
      workerPath: `${base}worker.min.js`,
      corePath: `${base}core`,
      langPath: base.replace(/\/$/, ''),
      gzip: true,
    },
  })).catch((err) => {
    pending = null;
    throw err;
  });
  return pending;
}

const MAX_SIDE = 3200;

/** Convierte un archivo de imagen en { data, width, height } (RGBA). */
export async function fileToImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const { data } = ctx.getImageData(0, 0, width, height);
  return { data, width, height };
}
