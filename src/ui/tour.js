// Tutorial de la primera visita: Pancracio te enseña a usar la página paso a paso.
import { breadSVG } from './bread.js';

const KEY = 'horno-tour-visto';

const STEPS = [
  {
    target: null,
    title: '¡Hola! Soy Pancracio',
    text: 'Soy un pan medio quemado y te voy a ayudar a que tus notas no se quemen. Te enseño la página en 30 segundos.',
    mood: 'proud',
  },
  {
    target: '[data-action="pick"]',
    title: '1 · Mete tus notas al horno',
    text: 'En SEDUCA abre <b>Académico → Calificaciones</b> y toma una captura de cada bimestre. Luego toca este botón y elígelas todas juntas.',
  },
  {
    target: '#dropzone',
    title: 'También puedes arrastrarlas',
    text: 'Suéltalas aquí o pégalas con ⌘V / Ctrl+V. Yo leo cada nota, detecto qué bimestre es y lo compruebo con los promedios del portal. Todo pasa en tu dispositivo.',
  },
  {
    target: '#panaderia .section-head',
    title: '2 · La panadería',
    text: 'Cada materia es un pan: <b>dorado</b> si vas bien, <b>quemado</b> si estás bajo 3.0. Ahí te digo cuánto necesitas en el IV bimestre para no quedarte.',
  },
  {
    target: '#cards',
    title: 'Toca un pan para simular',
    text: 'Mueve las notas que te faltan (diarias, apreciación y el examen bimestral) y mira en vivo si te salvas. Cada parte vale 33.33 %.',
    mood: 'scared',
  },
  {
    target: '#review-panel',
    title: '3 · Revisa la masa',
    text: 'Si algo quedó mal leído, toca la nota y corrígela. Las que marco con borde rojo punteado son las que conviene revisar.',
  },
  {
    target: null,
    title: '¡A hornear!',
    text: 'Si vas mal te voy a echar porras, y si vas bien te voy a recordar que no te confíes: <i>en la puerta del horno se quema el pan</i>. Puedes volver a ver esto desde el menú ⋯.',
    mood: 'happy',
  },
];

export const tourSeen = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };

export function startTour({ onStep, onDone } = {}) {
  let i = 0;
  const root = document.createElement('div');
  root.className = 'tour';
  root.innerHTML = `
    <div class="tour-spot" aria-hidden="true"></div>
    <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div class="tour-pan"></div>
      <div class="tour-body">
        <h3 id="tour-title"></h3>
        <p class="tour-text"></p>
        <div class="tour-foot">
          <div class="tour-dots">${STEPS.map(() => '<i></i>').join('')}</div>
          <div class="tour-btns">
            <button class="btn btn-paper btn-small" data-t="skip">Saltar</button>
            <button class="btn btn-paper btn-small" data-t="prev">Atrás</button>
            <button class="btn btn-fire btn-small" data-t="next">Siguiente</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(root);
  const spot = root.querySelector('.tour-spot');
  const card = root.querySelector('.tour-card');
  const prevFocus = document.activeElement;

  function place() {
    const step = STEPS[i];
    const el = step.target ? document.querySelector(step.target) : null;
    if (!el) {
      spot.style.cssText = 'left:50%;top:50%;width:0;height:0;';
      card.classList.add('center');
      card.style.cssText = '';
      return;
    }
    card.classList.remove('center');
    const r = el.getBoundingClientRect();
    const pad = 10;
    const vh = window.innerHeight, vw = window.innerWidth;
    const top = Math.max(8, r.top - pad), height = Math.min(r.height + pad * 2, vh * 0.5);
    spot.style.cssText = `left:${r.left - pad}px;top:${top}px;width:${r.width + pad * 2}px;height:${height}px;`;
    // La tarjeta va debajo del objetivo si cabe; si no, arriba.
    const cw = Math.min(420, vw - 32);
    const left = Math.min(vw - cw - 16, Math.max(16, r.left));
    const below = top + height + 16;
    const cardH = card.offsetHeight || 220;
    const y = below + cardH < vh - 8 ? below : Math.max(8, top - cardH - 16);
    card.style.cssText = `left:${left}px;top:${y}px;width:${cw}px;`;
  }

  function show() {
    const step = STEPS[i];
    root.querySelector('#tour-title').textContent = step.title;
    root.querySelector('.tour-text').innerHTML = step.text;
    root.querySelector('.tour-pan').innerHTML = breadSVG({ burn: 0.45, mood: step.mood || 'happy', label: 'Pancracio' });
    root.querySelectorAll('.tour-dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    root.querySelector('[data-t="prev"]').hidden = i === 0;
    root.querySelector('[data-t="next"]').textContent = i === STEPS.length - 1 ? '¡Vamos!' : 'Siguiente';
    card.classList.remove('swap');
    void card.offsetWidth;
    card.classList.add('swap');
    const el = step.target ? document.querySelector(step.target) : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(place, 450);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    place();
    onStep?.(i, step);
    root.querySelector('[data-t="next"]').focus({ preventScroll: true });
  }

  function end() {
    try { localStorage.setItem(KEY, '1'); } catch { /* sin almacenamiento */ }
    root.classList.add('out');
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place);
    document.removeEventListener('keydown', onKey);
    setTimeout(() => root.remove(), 300);
    prevFocus?.focus?.({ preventScroll: true });
    onDone?.();
  }

  const onKey = (e) => {
    if (e.key === 'Escape') end();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft' && i > 0) { i--; show(); }
  };
  const next = () => { if (i < STEPS.length - 1) { i++; show(); } else end(); };

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    if (b.dataset.t === 'skip') end();
    if (b.dataset.t === 'prev' && i > 0) { i--; show(); }
    if (b.dataset.t === 'next') next();
  });
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, { passive: true });
  document.addEventListener('keydown', onKey);
  show();
}
