// La panadería: resumen general y una tarjeta (un pan) por materia.
import { fmt, fmt2, tone, TONE_LABEL, ROMAN } from '../grades/calc.js';
import { subjectSummaries, closedFlags, getState } from '../grades/store.js';
import { breadSVG, burnFor, moodFor } from './bread.js';
import { countUp, esc, tilt } from './fx.js';

/** Clasifica una materia: ¿está en riesgo? ¿qué etiqueta lleva? */
export function describe(a) {
  const k = a.status.kind;
  const prov = a.current != null ? a.finals[a.current] : null;
  const known = a.finals.filter((t) => t != null);
  const pace = prov ?? (known.length ? Math.floor(known.reduce((x, y) => x + y, 0) / known.length) : null);
  const risky = k === 'needs' && (pace == null || pace < a.needPerBim);
  // Aprobando, pero con poco margen: promedio bajo 3.3 o el ritmo actual apenas pasa lo necesario.
  const tight = !risky && k === 'needs' && ((a.partial != null && a.partial < 33) || (pace != null && pace - a.needPerBim < 5));
  let pill;
  if (k === 'passed') pill = ['ok', 'Aprobada'];
  else if (k === 'failed') pill = ['bad', 'Reprobada'];
  else if (k === 'safe') pill = ['ok', 'Ya está salvada'];
  else if (k === 'lost') pill = ['bad', 'Se quemó'];
  else if (risky) pill = ['bad', 'En la puerta del horno'];
  else if (tight) pill = ['warn', 'Vas justo'];
  else if (a.needPerBim >= 35) pill = ['warn', 'Vas bien, sin confiarte'];
  else pill = ['ok', 'Vas bien'];
  const shown = a.year ?? a.partial;
  return { risky, tight, pill, shown, burn: burnFor(shown == null ? null : Math.floor(shown + 1e-9)), mood: moodFor(k, risky) };
}

/** Resumen de todo el año para Pancracio y la portada. */
export function overview() {
  const all = subjectSummaries().filter((s) => s.hasAny);
  const rows = all.map((s) => ({ ...s, d: describe(s.analysis) }));
  const avgs = rows.map((r) => r.d.shown).filter((x) => x != null);
  const general = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
  const lost = rows.filter((r) => ['lost', 'failed'].includes(r.analysis.status.kind));
  const risky = rows.filter((r) => r.d.risky);
  const tight = rows.filter((r) => r.d.tight);
  const safe = rows.length - lost.length - risky.length - tight.length;
  // La más urgente: en riesgo con la nota necesaria más alta; si no, la más justa; si no, una perdida.
  const urgent = [...risky].sort((a, b) => b.analysis.needPerBim - a.analysis.needPerBim)[0]
    || [...tight].sort((a, b) => a.d.shown - b.d.shown)[0] || lost[0] || null;
  return { rows, general, lost, risky, tight, safe, urgent };
}

function needText(a) {
  const k = a.status.kind;
  const open = a.openIdx.length;
  if (k === 'passed') return `Promedio final <b>${fmt2(a.year)}</b>. ¡Salió del horno dorada!`;
  if (k === 'failed') return `Promedio final <b>${fmt2(a.year)}</b>. No llegó a 3.0.`;
  if (k === 'safe') return `Pasas con lo que saques en ${open === 1 ? `el ${ROMAN[a.openIdx[0]]} bimestre` : 'lo que falta'}. <b>¡Ya está salvada!</b>`;
  if (k === 'lost') return `Aunque saques 5.0 ${open === 1 ? 'en el último bimestre' : 'en lo que falta'} no alcanza el 3.0.`;
  const where = open === 1 ? `en el <b>${ROMAN[a.openIdx[0]]} bimestre</b>` : `de promedio en los <b>${open} bimestres</b> que faltan`;
  let s = `Necesitas <b>${fmt(a.needPerBim)}</b> ${where} para llegar a 3.0.`;
  const cn = a.currentNeed;
  if (open === 1 && cn) {
    if (cn.g == null && cn.slots.total) s += ' Con lo que ya tienes no alcanza ni con 5.0 en lo pendiente; habla con tu profe.';
    else if (cn.g === 10 && cn.slots.total) s += ' Con lo que llevas ya casi está: no dejes nada sin entregar.';
    else if (cn.g != null && cn.slots.total) s += ` Eso es sacar <b>${fmt(cn.g)}</b> en cada nota que falta (${cn.slots.total} pendiente${cn.slots.total === 1 ? '' : 's'}, contando el examen).`;
  }
  return s;
}

function gaugeSVG(t) {
  const p = t == null ? 0 : Math.max(0, Math.min(1, (t - 10) / 40));
  const c = 2 * Math.PI * 19;
  return `<svg class="gauge" viewBox="0 0 46 46" aria-hidden="true">
    <circle cx="23" cy="23" r="19" fill="none" stroke="#ecdcbc" stroke-width="5"/>
    <circle cx="23" cy="23" r="19" fill="none" stroke="var(--tone)" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 23 23)"/>
    <text x="23" y="27.5" text-anchor="middle" font-size="12" font-weight="800" fill="#2b1a10">${t == null ? '—' : fmt(t)}</text>
  </svg>`;
}

export function renderDashboard({ onOpen }) {
  const { rows, general, lost, risky, tight, safe } = overview();
  const summary = document.getElementById('summary');
  const cards = document.getElementById('cards');
  const closed = closedFlags(getState());

  if (!rows.length) {
    summary.innerHTML = '';
    cards.innerHTML = `<div class="empty">${breadSVG({ burn: 0.2, mood: 'happy', label: 'Pancracio esperando' })}
      <b>Todavía no hay panes en la panadería.</b><span>Sube tus capturas arriba y aquí aparecerán tus materias.</span></div>`;
    return;
  }

  const gTone = tone(general == null ? null : Math.floor(general + 1e-9));
  const total = rows.length;
  summary.innerHTML = `
    <div class="summary-main tone-${gTone}">
      ${breadSVG({ burn: burnFor(general == null ? null : Math.floor(general)), mood: lost.length ? 'scared' : risky.length ? 'happy' : 'proud', label: 'Tu pan general' })}
      <div>
        <p class="kicker">Promedio general del año</p>
        <div class="big-number tc" data-count="${general ?? ''}">0.00</div>
        <p class="note">${TONE_LABEL[gTone]} · ${total} materias con notas · cuenta los bimestres que ya tienes${closed.some((c) => !c) ? ' (el que está en curso, con lo que llevas)' : ''}.</p>
      </div>
    </div>
    <div class="summary-side">
      ${tally('Van bien o salvadas', safe, total, 'var(--t-perfect)')}
      ${tally('Van justo', tight.length, total, 'var(--t-golden)')}
      ${tally('En la puerta del horno', risky.length, total, 'var(--t-toasted)')}
      ${tally('Quemadas', lost.length, total, 'var(--t-burnt)')}
    </div>`;
  const big = summary.querySelector('[data-count]');
  if (general != null) countUp(big, Math.floor(general * 10 + 1e-9) / 100, { decimals: 2 });

  // Primero lo urgente, luego por promedio de menor a mayor.
  const order = [...rows].sort((a, b) => rank(b) - rank(a) || (a.d.shown ?? 99) - (b.d.shown ?? 99));
  cards.innerHTML = order.map((r, i) => card(r, i, closed)).join('');
  cards.onclick = (e) => {
    const c = e.target.closest('.card');
    if (c) onOpen(c.dataset.id);
  };
  if (!cards.dataset.tilt) { tilt(cards); cards.dataset.tilt = '1'; }
}

const rank = (r) => (['lost', 'failed'].includes(r.analysis.status.kind) ? 3 : r.d.risky ? 2 : r.d.tight ? 1 : 0);

function tally(label, n, total, color) {
  return `<div class="tally"><span class="n">${n}</span><div style="flex:1">
    <div style="font-size:14px;margin-bottom:4px">${label}</div>
    <div class="bar"><i style="width:${total ? (n / total) * 100 : 0}%;background:${color}"></i></div></div></div>`;
}

function card({ subj, analysis: a, d }, i, closed) {
  const t = d.shown == null ? null : Math.floor(d.shown + 1e-9);
  const bims = a.finals.map((f, k) => `
    <div class="bim tone-${tone(f)} ${closed[k] ? '' : 'open'}" title="${ROMAN[k]} bimestre">
      <small>${ROMAN[k]}</small><b>${fmt(f)}</b>
    </div>`).join('');
  const needTone = tone(a.needPerBim ?? null);
  return `
  <button class="card tone-${tone(t)} ${d.risky || ['lost', 'failed'].includes(a.status.kind) ? 'risk' : ''}" data-id="${subj.id}" style="animation-delay:${Math.min(i, 12) * 60}ms"
    aria-label="${esc(subj.name)}: ${d.pill[1]}. Toca para simular.">
    <div class="card-top">
      ${breadSVG({ burn: d.burn, mood: d.mood, label: esc(subj.name) })}
      <div>
        <h3>${esc(subj.name)}${subj.starred ? ' <span title="Hay una nota pendiente de asignar">*</span>' : ''}</h3>
        <div class="avg"><strong class="tc">${d.shown == null ? '—' : fmt2(d.shown)}</strong><span>${a.year != null ? 'final' : 'hasta ahora'}</span></div>
        <span class="pill ${d.pill[0]}">${d.pill[1]}</span>
      </div>
    </div>
    <div class="bims">${bims}</div>
    <div class="need tone-${a.status.kind === 'needs' ? needTone : tone(t)}">
      ${gaugeSVG(a.status.kind === 'needs' ? a.needPerBim : t)}
      <p>${needText(a)}</p>
    </div>
    <span class="go">Simular lo que falta <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
  </button>`;
}

export function renderHeroStats() {
  const el = document.getElementById('hero-stats');
  const { rows, general, risky, tight, lost, safe } = overview();
  if (!rows.length) { el.hidden = true; return; }
  el.hidden = false;
  const gt = general == null ? null : Math.floor(general + 1e-9);
  el.innerHTML = `
    <span class="stat-pill tone-${tone(gt)}"><span class="swatch" style="background:var(--tone)">★</span>Promedio <strong>${general == null ? '—' : fmt2(general)}</strong></span>
    <span class="stat-pill" style="animation-delay:.08s"><span class="swatch" style="background:var(--t-perfect)">${safe}</span>bien</span>
    <span class="stat-pill" style="animation-delay:.16s"><span class="swatch" style="background:var(--t-golden);color:#3b2410">${tight.length}</span>justas</span>
    <span class="stat-pill" style="animation-delay:.24s"><span class="swatch" style="background:var(--t-toasted)">${risky.length}</span>en riesgo</span>
    <span class="stat-pill" style="animation-delay:.32s"><span class="swatch" style="background:var(--t-burnt)">${lost.length}</span>quemadas</span>`;
}

