// Simulador: mueve las notas que te faltan y mira en vivo si el pan se salva o se quema.
import { getState, closedFlags } from '../grades/store.js';
import {
  analyzeSubject, bimesterGrade, componentAvg, pendingSlots, COMPONENTS, COMPONENT_LONG, ROMAN, BIM_NAMES,
  PASS, MIN, MAX, fmt, fmt2, tone, TONE_LABEL,
} from '../grades/calc.js';
import { breadSVG, burnFor } from './bread.js';
import { crumbs, esc } from './fx.js';

const drawer = () => document.getElementById('drawer');
let lastFocus = null;
let onCloseCb = null;

export function closeSimulator() {
  const d = drawer();
  if (d.hidden) return;
  d.classList.add('closing');
  setTimeout(() => { d.hidden = true; d.classList.remove('closing'); lastFocus?.focus?.(); onCloseCb?.(); }, 280);
}

export function openSimulator(subjectId, { onReact, onClose } = {}) {
  const state = getState();
  const subj = state.subjects.find((s) => s.id === subjectId);
  if (!subj) return;
  onCloseCb = onClose;
  const closed = closedFlags(state);
  const entries = state.bims.map((b) => b.data[subj.id] || null);
  const a = analyzeSubject(entries, closed);

  // Espacios simulables.
  const start = clamp(a.currentNeed?.g ?? a.needPerBim ?? PASS);
  const sim = { current: null, others: [] };
  if (a.current != null) {
    const entry = entries[a.current];
    const slots = pendingSlots(entry);
    sim.current = { idx: a.current, entry, extra: {} };
    for (const c of COMPONENTS) {
      sim.current.extra[c] = Array.from({ length: slots[c] }, (_, i) => ({
        v: start,
        label: c === 'bim' ? 'Examen bimestral' : `${c === 'dig' ? 'Diaria' : 'Apreciación'} pendiente ${slots[c] > 1 ? i + 1 : ''}`.trim(),
        user: false,
      }));
    }
  }
  for (const i of a.openIdx) if (i !== a.current) sim.others.push({ idx: i, v: clamp(a.needPerBim ?? PASS) });

  const d = drawer();
  const panel = document.getElementById('drawer-panel');
  lastFocus = document.activeElement;
  d.hidden = false;
  let lastPass = null;

  function simulatedEntry() {
    const { entry, extra } = sim.current;
    const out = {};
    for (const c of COMPONENTS) {
      const vals = extra[c].map((s) => s.v);
      let k = 0;
      const items = (entry[c] || []).map((v) => (String(v).trim() === '-' ? vals[k++] ?? v : v));
      while (k < vals.length) items.push(vals[k++]);
      out[c] = items;
    }
    return out;
  }

  function compute() {
    const finals = [...a.finals];
    let curEntry = null;
    if (sim.current) {
      curEntry = simulatedEntry();
      finals[sim.current.idx] = bimesterGrade(curEntry);
    }
    for (const o of sim.others) finals[o.idx] = o.v;
    const valid = finals.filter((f) => f != null);
    const year = valid.length === 4 ? valid.reduce((x, y) => x + y, 0) / 4 : null;
    return { finals, year, curEntry };
  }

  function render() {
    const { finals, year, curEntry } = compute();
    const pass = year != null && year >= PASS;
    const gap = year != null && !pass ? (PASS * 4 - finals.reduce((x, y) => x + (y ?? 0), 0)) / 10 : 0;
    const yt = year == null ? null : Math.floor(year + 1e-9);
    const verdict = year == null ? 'Faltan datos para calcular el año.'
      : pass ? (year >= 40 ? '¡Sale dorado! Pasas holgado.' : '¡Te salvas! El pan no se quema.')
        : `Te quedas: te faltan ${gap.toFixed(1)} puntos entre los bimestres.`;

    panel.innerHTML = `
      <div class="drawer-head">
        ${breadSVG({ burn: burnFor(yt), mood: year == null ? 'happy' : pass ? (year >= 40 ? 'proud' : 'happy') : year < 25 ? 'dead' : 'scared', label: 'Pan de ' + esc(subj.name) })}
        <div>
          <p class="kicker" style="margin:0">Simulador</p>
          <h2 id="drawer-title">${esc(subj.name)}</h2>
        </div>
        <button class="close" data-act="close" aria-label="Cerrar">×</button>
      </div>

      <div class="sim-result">
        <div class="row">
          <div>
            <p class="kicker">Promedio del año</p>
            <div class="big-number tone-${tone(yt)}"><span class="tc">${year == null ? '—' : fmt2(year)}</span></div>
          </div>
          <div class="verdict" style="color:${pass ? '#2e6a35' : '#9a2b14'}">${verdict}<br><span style="font-weight:700;color:var(--ink-3);font-size:13px">${yt == null ? '' : TONE_LABEL[tone(yt)]}</span></div>
        </div>
        <div class="meter" aria-hidden="true"><i style="left:${year == null ? 0 : ((year - MIN) / (MAX - MIN)) * 100}%"></i><span class="pass-mark">3.0</span></div>
      </div>

      <div class="sim-year">
        ${finals.map((f, i) => `<div class="bim tone-${tone(f)} ${a.openIdx.includes(i) ? 'open' : ''}"><small>${ROMAN[i]}</small><b>${fmt(f)}</b></div>`).join('')}
      </div>

      ${sim.current ? currentBlock(curEntry) : ''}
      ${sim.others.map((o) => `
        <div class="comp">
          <div class="comp-head"><h4>${BIM_NAMES[o.idx]}</h4><span>sin notas todavía</span></div>
          ${slider(`o${o.idx}`, 'Nota del bimestre', o.v, false)}
        </div>`).join('')}
      ${!sim.current && !sim.others.length ? '<p class="sim-note">Todos los bimestres de esta materia ya están cerrados.</p>' : ''}

      ${sim.current || sim.others.length ? `
        <div class="sim-actions">
          ${a.currentNeed?.g != null || a.needPerBim != null ? '<button class="btn btn-paper btn-small" data-act="min">Poner lo mínimo para pasar</button>' : ''}
          <button class="btn btn-paper btn-small" data-act="all" data-v="40">Todo en 4.0</button>
          <button class="btn btn-paper btn-small" data-act="all" data-v="50">Todo en 5.0</button>
        </div>` : ''}
      <p class="sim-note">Cada parte (diarias, apreciación y bimestral) vale 33.33 %. Se trunca a un decimal como en el portal. Las notas que ya tienes no cambian; solo mueves lo que falta.</p>`;

    if (lastPass !== null && pass !== lastPass) {
      panel.querySelector('.drawer-head .bread')?.classList.add('hop');
      if (pass) {
        const r = panel.querySelector('.big-number').getBoundingClientRect();
        crumbs(r.left + r.width / 2, r.top + r.height / 2);
      }
      onReact?.(pass);
    }
    lastPass = pass;
  }

  function currentBlock(curEntry) {
    const { idx, entry, extra } = sim.current;
    return `<p class="kicker" style="margin:4px 0 10px">${BIM_NAMES[idx]} · en curso</p>` + COMPONENTS.map((c) => {
      const fixed = (entry[c] || []).filter((v) => String(v).trim() !== '-');
      const avg = componentAvg(curEntry[c]);
      return `<div class="comp">
        <div class="comp-head"><div><h4>${COMPONENT_LONG[c]}</h4><span>33.33 %</span></div><strong class="tone-${tone(avg)}"><span class="tc">${fmt(avg)}</span></strong></div>
        <div class="chips">${fixed.map((v) => `<span class="chip ${String(v).toUpperCase() === 'X' ? 'chip-x' : `tone-${tone(Math.round(parseFloat(v) * 10))}`}">${esc(v)}</span>`).join('') || '<span style="font-size:13px;color:var(--ink-3)">Sin notas todavía</span>'}</div>
        ${extra[c].map((s, i) => slider(`${c}:${i}`, s.label, s.v, s.user)).join('')}
        ${c !== 'bim' ? `<button class="btn btn-paper btn-small" style="margin-top:10px" data-act="add" data-comp="${c}">+ Simular otra nota</button>` : ''}
      </div>`;
    }).join('');
  }

  function slider(key, label, v, removable) {
    const id = `s-${key.replace(':', '-')}`;
    return `<div class="slot">
      <label for="${id}">${esc(label)}</label>
      <input type="range" id="${id}" min="${MIN}" max="${MAX}" step="1" value="${v}" data-key="${key}" aria-valuetext="${fmt(v)}"/>
      <output for="${id}" class="tone-${tone(v)}"><span class="tc">${fmt(v)}</span></output>
      ${removable ? `<button class="x" data-act="remove" data-key="${key}" aria-label="Quitar">×</button>` : '<span></span>'}
    </div>`;
  }

  function setKey(key, v) {
    if (key.startsWith('o')) {
      const o = sim.others.find((x) => x.idx === Number(key.slice(1)));
      if (o) o.v = v;
    } else {
      const [c, i] = key.split(':');
      sim.current.extra[c][Number(i)].v = v;
    }
  }

  panel.oninput = (e) => {
    const r = e.target;
    if (r.type !== 'range') return;
    const v = Number(r.value);
    setKey(r.dataset.key, v);
    // Actualizar sin perder el foco del deslizador.
    const keep = r.id;
    render();
    const again = document.getElementById(keep);
    again?.focus({ preventScroll: true });
  };
  panel.onclick = (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'close') closeSimulator();
    else if (act === 'add') {
      sim.current.extra[t.dataset.comp].push({ v: start, label: `Nota extra de ${t.dataset.comp === 'dig' ? 'diarias' : 'apreciación'}`, user: true });
      render();
    } else if (act === 'remove') {
      const [c, i] = t.dataset.key.split(':');
      sim.current.extra[c].splice(Number(i), 1);
      render();
    } else if (act === 'all' || act === 'min') {
      const v = act === 'all' ? Number(t.dataset.v) : null;
      if (sim.current) for (const c of COMPONENTS) for (const s of sim.current.extra[c]) s.v = v ?? clamp(minUniform());
      for (const o of sim.others) o.v = v ?? clamp(a.needPerBim ?? PASS);
      render();
    }
  };

  /** La mínima nota igual para todo lo pendiente que deja el año en 3.0. */
  function minUniform() {
    for (let g = MIN; g <= MAX; g++) {
      for (const c of COMPONENTS) for (const s of sim.current.extra[c]) s.v = g;
      for (const o of sim.others) o.v = g;
      const { year } = compute();
      if (year != null && year >= PASS) return g;
    }
    return MAX;
  }

  const onKey = (e) => {
    if (e.key === 'Escape') { closeSimulator(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
  d.querySelector('.drawer-scrim').onclick = closeSimulator;
  render();
  panel.scrollTop = 0;
  panel.querySelector('.close')?.focus();
}

const clamp = (t) => Math.max(MIN, Math.min(MAX, Math.round(t)));
