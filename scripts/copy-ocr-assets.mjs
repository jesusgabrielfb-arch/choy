// Copia el motor de OCR (Tesseract) y el idioma español a public/ocr para servirlos
// desde el mismo sitio: la página no depende de CDNs externos y funciona sin conexión.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'ocr');
mkdirSync(out, { recursive: true });

const files = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/@tesseract.js-data/spa/4.0.0_best_int/spa.traineddata.gz', 'spa.traineddata.gz'],
];
// Solo variantes LSTM: el lector usa el motor neuronal (oem 1) y el navegador elige la que soporte.
for (const variant of ['tesseract-core-lstm', 'tesseract-core-simd-lstm', 'tesseract-core-relaxedsimd-lstm']) {
  files.push([`node_modules/tesseract.js-core/${variant}.wasm.js`, `core/${variant}.wasm.js`]);
}
for (const [from, to] of files) {
  const src = join(root, from);
  if (!existsSync(src)) throw new Error(`Falta ${from}; ejecuta npm install`);
  mkdirSync(dirname(join(out, to)), { recursive: true });
  cpSync(src, join(out, to));
}
console.log(`OCR listo en public/ocr (${files.length} archivos)`);
