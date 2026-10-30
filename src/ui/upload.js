// Bandeja del horno: elegir, arrastrar o pegar capturas, leerlas y guardar sus notas.
import { readScreenshot } from '../engine/reader.js';
import { getOcr, fileToImage } from '../engine/ocr-browser.js';
import { applyReading, clearBimester, getState } from '../grades/store.js';
import { BIM_NAMES } from '../grades/calc.js';
import { esc, toast } from './fx.js';

const STEP_TEXT = {
  horno: 'Precalentando el horno…',
  colores: 'Buscando las notas por color…',
  texto: 'Leyendo materias y encabezados…',
  tabla: 'Ubicando filas y columnas…',
  numeros: 'Leyendo cada nota…',
  verificando: 'Comparando con los promedios del portal…',
  bimestre: '¿Qué bimestre es?…',
  listo: 'Listo',
};

export function initUpload({ kitchen, speak, onBaked }) {
  const zone = document.getElementById('dropzone');
  const input = document.getElementById('file-input');
  const list = document.getElementById('loaves');
  const queue = [];
  let running = false;
  const batchClaims = new Set();

  const pick = () => input.click();
  document.querySelectorAll('[data-action="pick"]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('horno').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(pick, 250);
  }));
  zone.addEventListener('click', (e) => { if (!e.target.closest('.loaf')) pick(); });
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  input.addEventListener('change', () => { add([...input.files]); input.value = ''; });

  ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.remove('drag'); }));
  zone.addEventListener('drop', (e) => add([...e.dataTransfer.files]));
  window.addEventListener('paste', (e) => {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (files.length) { add(files); document.getElementById('horno').scrollIntoView({ behavior: 'smooth' }); }
  });

  function add(files) {
    const images = files.filter((f) => f.type.startsWith('image/') || /\.(png|jpe?g|heic|webp)$/i.test(f.name));
    if (!images.length) { toast('Eso no parece una imagen. Sube capturas de pantalla.'); return; }
    zone.classList.add('has-items');
    for (const file of images) {
      const item = { file, url: URL.createObjectURL(file), el: document.createElement('li'), reading: null, bim: null };
      item.el.className = 'loaf baking';
      list.appendChild(item.el);
      paint(item, { step: 'En la fila del horno…', progress: 0.02 });
      queue.push(item);
    }
    if (!running) run();
  }

  async function run() {
    running = true;
    batchClaims.clear();
    kitchen?.setHeat(1);
    kitchen?.setBusy(true);
    kitchen?.openDoor(false);
    speak('baking');
    let ocr;
    try {
      paint(queue[0], { step: STEP_TEXT.horno, progress: 0.04 });
      ocr = await getOcr();
    } catch (err) {
      console.error(err);
      for (const item of queue.splice(0)) fail(item, 'No pude prender el horno (OCR). Revisa tu conexión y recarga la página.');
      running = false;
      kitchen?.setHeat(0.35);
      kitchen?.setBusy(false);
      return;
    }
    let baked = 0;
    while (queue.length) {
      const item = queue.shift();
      try {
        const img = await fileToImage(item.file);
        const reading = await readScreenshot(img, ocr, (step, p) => paint(item, { step: STEP_TEXT[step] || step, progress: p }));
        if (!reading.valid || !reading.subjects.length || !reading.subjects.some((s) => s.cells.length)) {
          fail(item, 'No encontré una tabla de notas en esta imagen.');
          continue;
        }
        item.reading = reading;
        item.bim = chooseBimester(reading);
        batchClaims.add(item.bim);
        applyReading(item.bim, reading, { name: item.file.name, readAt: Date.now() });
        item.el.classList.remove('baking');
        paint(item);
        baked++;
      } catch (err) {
        console.error(err);
        fail(item, 'Algo salió mal leyendo esta captura. Prueba con otra o súbela de nuevo.');
      }
    }
    running = false;
    kitchen?.setHeat(0.35);
    kitchen?.setBusy(false);
    if (baked) {
      kitchen?.openDoor(true);
      setTimeout(() => kitchen?.openDoor(false), 2600);
      onBaked?.(baked);
    }
  }

  /** Bimestre detectado, o el primero libre (el IV si no hay columna "Bimestral"). */
  function chooseBimester(reading) {
    if (reading.bimestre) return reading.bimestre - 1;
    const state = getState();
    const free = [0, 1, 2, 3].filter((i) => !batchClaims.has(i) && !Object.keys(state.bims[i].data).length);
    if (!reading.hasBimestralColumn) return free.length ? free[free.length - 1] : 3;
    return free[0] ?? 0;
  }

  function fail(item, msg) {
    item.el.classList.remove('baking');
    item.el.innerHTML = `
      <div class="loaf-img"><img src="${item.url}" alt="Captura subida" /></div>
      <div class="loaf-body"><p class="warn">${esc(msg)}</p></div>
      <button class="remove" aria-label="Quitar">×</button>`;
    item.el.querySelector('.remove').onclick = () => item.el.remove();
  }

  function paint(item, progress) {
    if (!item) return;
    if (progress) {
      item.el.innerHTML = `
        <div class="loaf-img"><img src="${item.url}" alt="Captura horneándose" /><span class="loaf-heat" style="width:${Math.round(progress.progress * 100)}%"></span></div>
        <div class="loaf-body"><span class="loaf-step">${esc(progress.step)}</span></div>`;
      return;
    }
    const r = item.reading;
    const uncertain = r.stats.uncertain + r.stats.mismatches;
    const options = BIM_NAMES.map((n, i) => `<option value="${i}" ${i === item.bim ? 'selected' : ''}>${n}</option>`).join('');
    item.el.innerHTML = `
      <div class="loaf-img"><img src="${item.url}" alt="Captura de ${BIM_NAMES[item.bim]}" /></div>
      <div class="loaf-body">
        <div class="loaf-row">
          <select aria-label="¿Qué bimestre es esta captura?">${options}</select>
          ${uncertain ? `<span class="warn">Revisa ${uncertain} nota${uncertain === 1 ? '' : 's'}</span>` : '<span class="badge-ok">Cuadra con el portal</span>'}
        </div>
        <span class="meta">${r.subjects.length} materias · ${r.stats.badges} notas leídas${r.bimestre ? '' : ' · elige el bimestre'}</span>
        ${r.warnings.map((w) => `<span class="warn">${esc(w)}</span>`).join('')}
      </div>
      <button class="remove" aria-label="Quitar de la bandeja">×</button>`;
    item.el.querySelector('select').onchange = (e) => {
      const to = Number(e.target.value);
      if (to === item.bim) return;
      clearBimester(item.bim);
      item.bim = to;
      applyReading(to, item.reading, { name: item.file.name, readAt: Date.now() });
      toast(`Movido al ${BIM_NAMES[to]}.`);
    };
    item.el.querySelector('.remove').onclick = () => {
      item.el.remove();
      if (!list.children.length) zone.classList.remove('has-items');
    };
  }

  return { pick, add };
}
