// Pequeños efectos: aparición al hacer scroll, números que cuentan, migas, toast e inclinación 3D.

export const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
  : null;

export function observeReveals(root = document) {
  root.querySelectorAll('.reveal:not(.in)').forEach((el, i) => {
    if (el.closest('.hero')) el.style.setProperty('--i', i);
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add('in');
  });
}

/** Anima un número desde su valor actual hasta `to` (con decimales). */
export function countUp(el, to, { decimals = 1, duration = 900 } = {}) {
  if (to == null || Number.isNaN(to)) { el.textContent = '—'; return; }
  const from = parseFloat(el.dataset.value ?? '0') || 0;
  el.dataset.value = String(to);
  if (prefersReduced() || from === to) { el.textContent = to.toFixed(decimals); return; }
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const k = 1 - Math.pow(1 - p, 4);
    el.textContent = (from + (to - from) * k).toFixed(decimals);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Lluvia de migas de pan desde un punto (para celebrar). */
export function crumbs(x, y, count = 26) {
  if (prefersReduced()) return;
  const colors = ['#e9a94b', '#f4d58d', '#b8692c', '#fbe7b8', '#7a3d1c'];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('i');
    c.className = 'crumb';
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    c.style.background = colors[i % colors.length];
    document.body.appendChild(c);
    const a = Math.random() * Math.PI * 2;
    const v = 80 + Math.random() * 160;
    const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 120;
    c.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy + 260}px) rotate(${(Math.random() - 0.5) * 720}deg)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => c.remove();
  }
}

let toastTimer = 0;
export function toast(msg, ms = 3200) {
  const el = document.getElementById('toast');
  el.onclick = () => { el.hidden = true; }; // tocarlo lo cierra
  el.textContent = msg;
  el.hidden = false;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

/** Inclinación 3D de tarjetas siguiendo el puntero (solo con mouse/lápiz). */
export function tilt(container) {
  if (prefersReduced()) return;
  container.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const card = e.target.closest('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateZ(6px)`;
  });
  container.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.card');
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
