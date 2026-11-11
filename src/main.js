import './styles/main.css';
import { paintStaticBreads, burnFor, breadSVG } from './ui/bread.js';
import { toastName } from './grades/toast.js';
import { observeReveals, toast } from './ui/fx.js';
import { subscribe, exportState, importState, resetAll } from './grades/store.js';
import { renderDashboard, renderHeroStats, overview } from './ui/dashboard.js';
import { renderReview } from './ui/review.js';
import { openSimulator } from './ui/simulator.js';
import { initUpload } from './ui/upload.js';
import { say } from './ui/phrases.js';
import { startTour, tourSeen } from './ui/tour.js';
import { fmt } from './grades/calc.js';
import { askConfirm } from './ui/dialog.js';
import { syncNow } from './ui/sync.js';
import { enableNotifications, registerServiceWorker } from './ui/notify.js';

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
    } else if (act === 'notify') {
      toast('Activando notificaciones…');
      try {
        const r = await enableNotifications();
        if (r.ok) { toast('🔔 ¡Listo! Te llegará una notificación de prueba y luego un aviso por cada nota nueva.', 6000); kitchen?.pancracio.celebrate(); }
        else toast(r.message, 8000);
      } catch (err) {
        toast('No se pudieron activar: ' + err.message, 6000);
      }
    } else if (act === 'sync') {
      syncSeduca(true);
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

// ---------- SEDUCA ----------
let syncing = false;
async function syncSeduca(manual = false) {
  if (syncing) return;
  syncing = true;
  bubbleText.textContent = 'Revisando tus notas en SEDUCA…';
  kitchen?.setHeat(0.8);
  const r = await syncNow();
  kitchen?.setHeat(0.35);
  syncing = false;
  if (!r.ok) {
    if (manual || !/conectar/.test(r.error)) toast(r.error);
    speakStatus();
    return;
  }
  if (r.primera) {
    toast('¡Conectado con SEDUCA! Tus notas se actualizarán solas cada vez que abras la página.');
    speakStatus();
  } else if (r.nuevas.length) {
    const n = r.nuevas[0];
    bubbleText.textContent = r.nuevas.length === 1
      ? `¡Nota nueva! ${n.materia}: ${n.nota} en "${n.nombre}".`
      : `¡${r.nuevas.length} notas nuevas! La más reciente: ${n.materia} ${n.nota}.`;
    kitchen?.pancracio.talk(3);
    if (Number(n.nota) >= 3) kitchen?.pancracio.celebrate(); else kitchen?.pancracio.jump();
    const list = r.nuevas.slice(0, 3).map((x) => `${x.materia}: ${x.nota}`).join(' · ');
    toast(r.nuevas.length > 3 ? `${list} y ${r.nuevas.length - 3} más` : list, 6000);
  } else {
    if (manual) toast('Todo al día: no hay notas nuevas en SEDUCA.');
    speakStatus();
  }
}

// ---------- Arranque ----------
registerServiceWorker();
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
  // Las notas se traen solas de SEDUCA cada vez que se abre la página.
  syncSeduca();
  if (!tourSeen()) setTimeout(runTour, reduced ? 200 : 600);
});
