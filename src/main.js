import './styles/main.css';
import { paintStaticBreads, burnFor, breadSVG } from './ui/bread.js';
import { toastName } from './grades/toast.js';
import { observeReveals, toast } from './ui/fx.js';
import { subscribe, exportState, importState, resetAll, hasData } from './grades/store.js';
import { renderDashboard, renderHeroStats, overview } from './ui/dashboard.js';
import { renderReview } from './ui/review.js';
import { openSimulator } from './ui/simulator.js';
import { initUpload } from './ui/upload.js';
import { say } from './ui/phrases.js';
import { startTour, tourSeen } from './ui/tour.js';
import { fmt } from './grades/calc.js';
import { askConfirm } from './ui/dialog.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let kitchen = null;

// ---------- Pancracio habla ----------
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');

function speak(kind, vars) {
  const text = say(kind, vars);
  bubbleText.textContent = text;
  bubble.classList.remove('bump');
  void bubble.offsetWidth;
  bubble.classList.add('bump');
  kitchen?.pancracio.talk(Math.min(4, 1 + text.length / 30));
}

/** Qué decir según cómo van las notas: porras si va mal, ánimo para seguir si va bien. */
function speakStatus() {
  const o = overview();
  if (!o.rows.length) return speak('hello');
  const vars = o.urgent ? { m: o.urgent.subj.name, n: fmt(o.urgent.analysis.needPerBim) } : {};
  const allClosed = o.rows.every((r) => r.analysis.year != null);
  if (allClosed && !o.lost.length) { speak('allPassed'); kitchen?.pancracio.celebrate(); return; }
  if (o.lost.length && !o.risky.length) return speak('lost', { m: o.lost[0].subj.name });
  if (o.risky.length >= 3 || o.lost.length) return speak('bad', vars);
  if (o.risky.length) return speak('mixed', vars);
  if (o.tight.length) return speak('tight', vars);
  speak('good');
  kitchen?.pancracio.celebrate();
}

/** El pan 3D se tuesta y cambia de cara según el promedio general y el riesgo. */
function updateMood() {
  if (!kitchen) return;
  const o = overview();
  const p = kitchen.pancracio;
  if (!o.rows.length) {
    p.setMood('happy');
    p.setBurn(0.45);
    kitchen.setGauge(0.3);
    return;
  }
  const danger = o.lost.length * 1.5 + o.risky.length;
  p.setMood(o.lost.length || o.risky.length >= 3 ? 'scared' : o.risky.length ? 'worried' : 'proud');
  p.setBurn(Math.max(burnFor(o.general == null ? null : Math.floor(o.general)), Math.min(1, danger / Math.max(4, o.rows.length))));
  kitchen.setGauge(Math.min(1, 0.15 + danger / o.rows.length));
}

// ---------- Render ----------
function renderAll() {
  renderHeroStats();
  renderDashboard({ onOpen: (id) => openSimulator(id, { onReact: (pass) => (pass ? kitchen?.pancracio.jump() : null) }) });
  renderReview();
  updateMood();
}

// ---------- Cocina 3D ----------
function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

async function initKitchen() {
  if (!webglOK()) { document.documentElement.classList.add('no-webgl'); return; }
  try {
    const { createKitchen } = await import('./three/kitchen.js');
    kitchen = createKitchen(document.getElementById('kitchen'), {
      reducedMotion: reduced,
      onPancracio: (what) => speak(what === 'oven' ? 'oven' : 'poke'),
    });
    updateMood();
    await kitchen.entered;
  } catch (err) {
    console.error(err);
    document.documentElement.classList.add('no-webgl');
  }
}

// ---------- Menú ----------
function initMenu() {
  const btn = document.getElementById('menu-btn');
  const pop = document.getElementById('menu-pop');
  const toggle = (open = pop.hidden) => { pop.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target)) toggle(false); });
  pop.addEventListener('click', async (e) => {
    const act = e.target.closest('[data-action]')?.dataset.action;
    if (!act) return;
    toggle(false);
    if (act === 'export') {
      const blob = new Blob([exportState()], { type: 'application/json' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'mis-notas-horno.json' });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Respaldo guardado. Con él puedes cargar tus notas en otro dispositivo.');
    } else if (act === 'reset') {
      if (await askConfirm('¿Borrar todas tus notas?', 'Se borran de este dispositivo. Si quieres conservarlas, guarda antes un respaldo.', 'Borrar todo')) {
        resetAll();
        toast('Horno limpio.');
        speak('hello');
      }
    } else if (act === 'tour') {
      runTour();
    }
  });
  document.getElementById('import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    toggle(false);
    if (!file) return;
    try { importState(await file.text()); toast('Respaldo cargado.'); speakStatus(); } catch { toast('Ese archivo no es un respaldo válido.'); }
  });
}

function runTour() {
  startTour({
    onStep: (i, step) => {
      if (!kitchen) return;
      if (i === 0) { kitchen.pancracio.wave(); kitchen.pancracio.talk(3); }
      else kitchen.pancracio.talk(2);
      if (step.mood === 'scared') kitchen.pancracio.setMood('worried');
    },
    onDone: () => {
      updateMood();
      if (kitchen) { kitchen.pancracio.celebrate(); }
      speak('tourDone');
    },
  });
}

// ---------- Arranque ----------
paintStaticBreads();
document.getElementById('toast-scale').innerHTML = [50, 45, 40, 35, 30, 25, 20].map((t) => {
  const b = burnFor(t);
  return `<figure>${breadSVG({ burn: b, mood: t >= 40 ? 'proud' : t >= 30 ? 'happy' : t > 20 ? 'scared' : 'dead', smoke: b > 0.6, label: toastName(b) })}
    <figcaption><b>${(t / 10).toFixed(1)}</b>${toastName(b)}</figcaption></figure>`;
}).join('');
observeReveals();
initMenu();

const topbar = document.getElementById('topbar');
const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

bubble.addEventListener('click', speakStatus);
bubble.style.cursor = 'pointer';
bubble.title = 'Toca para que Pancracio te diga otra cosa';

initUpload({
  kitchen: {
    setHeat: (v) => kitchen?.setHeat(v),
    setBusy: (v) => kitchen?.setBusy(v),
    openDoor: (v) => kitchen?.openDoor(v),
  },
  speak,
  onBaked: (n) => {
    toast(n === 1 ? '¡Captura horneada!' : `¡${n} capturas horneadas!`);
    setTimeout(() => {
      speakStatus();
      document.getElementById('panaderia').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 700);
  },
});

subscribe(renderAll);
renderAll();

initKitchen().then(() => {
  if (!tourSeen()) setTimeout(runTour, reduced ? 200 : 600);
  else if (hasData()) setTimeout(speakStatus, 300);
  else speak('hello');
});
