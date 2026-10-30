// Adaptador de OCR para correr el lector en Node (pruebas).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { createOcr } from '../../src/engine/ocr-adapter.js';

const require = createRequire(import.meta.url);
const { createWorker, PSM } = require('tesseract.js');

export function loadPng(path) {
  const png = PNG.sync.read(readFileSync(path));
  return { data: png.data, width: png.width, height: png.height };
}

function encode({ gray, width, height }) {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) {
    png.data[i * 4] = png.data[i * 4 + 1] = png.data[i * 4 + 2] = gray[i];
    png.data[i * 4 + 3] = 255;
  }
  return PNG.sync.write(png);
}

export function nodeOcr() {
  const langPath = new URL('../../node_modules/@tesseract.js-data/spa/4.0.0_best_int', import.meta.url).pathname;
  return createOcr({ createWorker, PSM, encode, workerOptions: { langPath, cacheMethod: 'none', gzip: true } });
}
