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
  // Salvada = aunque saque 1.0 en todo lo que falta (bimestral incluido), el año queda en 3.0.
  const saved = rows.filter((r) => ['safe', 'passed'].includes(r.analysis.status.kind));
  const toSave = rows.filter((r) => !['safe', 'passed'].includes(r.analysis.status.kind));
  return { rows, general, lost, risky, tight, safe, urgent, saved, toSave };
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

/** Lo que falta del bimestre en curso, con el nombre de cada asignación cuando viene de SEDUCA. */
export function pendingList(entry) {
  if (!entry) return [];
  const out = [];
  const names = { dig: 'Nota diaria', apr: 'Apreciación' };
  for (const c of ['dig', 'apr']) {
    (entry[c] || []).forEach((v, i) => {
      if (String(v).trim() === '-') out.push({ comp: c, name: entry.labels?.[c]?.[i] || `${names[c]} pendiente` });
    });
  }
  const hasExam = (entry.bim || []).some((v) => /\d/.test(String(v)));
  if (!hasExam) out.push({ comp: 'bim', name: 'Examen bimestral' });
  return out;
}

const COMP_TAG = { dig: 'Diaria', apr: 'Apreciación', bim: 'Bimestral' };

export function renderDashboard({ onOpen }) {
  const { rows, general, saved, toSave, lost } = overview();
  const summary = document.getElementById('summary');
  const cards = document.getElementById('cards');
  const closed = closedFlags(getState());

  if (!rows.length) {
    summary.innerHTML = '';
    cards.innerHTML = `<div class="empty">${breadSVG({ burn: 0.2, mood: 'happy', label: 'Pancracio esperando' })}
      <b>Todavía no hay panes en la panadería.</b><span>Conecta SEDUCA desde el menú ⋯ o sube tus capturas arriba.</span></div>`;
    return;
  }

  const gTone = tone(general == null ? null : Math.floor(general + 1e-9));
  const total = rows.length;
  const pct = total ? saved.length / total : 0;
  const C = 2 * Math.PI * 52;
  summary.innerHTML = `
    <div class="summary-main tone-${gTone}">
      ${breadSVG({ burn: burnFor(general == null ? null : Math.floor(general)), mood: lost.length ? 'scared' : toSave.length ? 'happy' : 'proud', label: 'Tu pan general' })}
      <div>
        <p class="kicker">Promedio general del año</p>
        <div class="big-number tc" data-count="${general ?? ''}">0.00</div>
        <p class="note">${TONE_LABEL[gTone]} · ${total} materias · cuenta los bimestres que ya tienes${closed.some((c) => !c) ? ' (el que está en curso, con lo que llevas)' : ''}.</p>
      </div>
    </div>
    <div class="summary-side saved-meter">
      <svg viewBox="0 0 120 120" class="ring" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#ecdcbc" stroke-width="12"/>
        <circle class="ring-fill" cx="60" cy="60" r="52" fill="none" stroke="var(--t-perfect)" stroke-width="12" stroke-linecap="round"
          stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 60 60)" style="--c:${C}"/>
      </svg>
      <div class="ring-label"><b>${saved.length}<small>/${total}</small></b><span>salvadas</span></div>
      <p class="saved-copy">${saved.length === total ? '¡Todas salvadas! Pase lo que pase, este año sale del horno.'
        : `Te faltan <b>${toSave.length}</b> por salvar. Una materia está salvada cuando, aunque saques <b>1.0</b> en todo lo que falta (bimestral incluido), el año queda en 3.0.`}</p>
    </div>`;
  const big = summary.querySelector('[data-count]');
  if (general != null) countUp(big, Math.floor(general * 10 + 1e-9) / 100, { decimals: 2 });

  const order = [...toSave].sort((a, b) => rank(b) - rank(a) || (a.d.shown ?? 99) - (b.d.shown ?? 99));
  cards.innerHTML = `
    ${order.length ? `<div class="group-head danger"><h3>🔥 Por salvar <span>${order.length}</span></h3><p>Esto es lo mínimo que necesitas en cada asignación que falta.</p></div>
    <div class="cards-grid">${order.map((r, i) => card(r, i, closed)).join('')}</div>` : ''}
    ${saved.length ? `<div class="group-head ok"><h3>✅ Ya salvadas <span>${saved.length}</span></h3><p>Aunque saques 1.0 en todo lo que falta, pasas con 3.0.</p></div>
    <div class="cards-grid saved">${[...saved].sort((a, b) => (b.d.shown ?? 0) - (a.d.shown ?? 0)).map((r, i) => savedCard(r, i)).join('')}</div>` : ''}`;
  cards.onclick = (e) => {
    const c = e.target.closest('[data-id]');
    if (c) onOpen(c.dataset.id);
  };
  if (!cards.dataset.tilt) { tilt(cards); cards.dataset.tilt = '1'; }
}

const rank = (r) => (['lost', 'failed'].includes(r.analysis.status.kind) ? 3 : r.d.risky ? 2 : r.d.tight ? 1 : 0);

function card({ subj, entries, analysis: a, d }, i, closed) {
  const t = d.shown == null ? null : Math.floor(d.shown + 1e-9);
  const bims = a.finals.map((f, k) => `
    <div class="bim tone-${tone(f)} ${closed[k] ? '' : 'open'}" title="${ROMAN[k]} bimestre">
      <small>${ROMAN[k]}</small><b>${fmt(f)}</b>
    </div>`).join('');
  const cn = a.currentNeed;
  const pend = a.openIdx.length === 1 && a.current != null ? pendingList(entries[a.current]) : [];
  let needs;
  if (a.status.kind === 'lost') needs = `<p class="need-text">Aunque saques 5.0 en todo lo que falta no alcanza el 3.0. Habla con tu profe sobre una recuperación.</p>`;
  else if (pend.length && cn?.g != null) {
    needs = `<div class="min-head"><span>Mínimo en cada una</span><b class="tone-${tone(cn.g)}"><span class="tc">${fmt(cn.g)}</span></b></div>
      <ul class="todo">${pend.map((p) => `<li><span class="tag tag-${p.comp}">${COMP_TAG[p.comp]}</span><span class="todo-name">${esc(p.name)}</span><b>${fmt(cn.g)}</b></li>`).join('')}</ul>`;
  } else needs = `<p class="need-text">${needText(a)}</p>`;
  return `
  <article class="card tone-${tone(t)} ${d.risky || ['lost', 'failed'].includes(a.status.kind) ? 'risk' : ''}" style="animation-delay:${Math.min(i, 12) * 60}ms">
    <div class="card-top">
      ${breadSVG({ burn: d.burn, mood: d.mood, label: esc(subj.name) })}
      <div>
        <h3>${esc(subj.name)}${subj.starred ? ' <span title="Hay una nota pendiente de asignar">*</span>' : ''}</h3>
        <div class="avg"><strong class="tc">${d.shown == null ? '—' : fmt2(d.shown)}</strong><span>${a.year != null ? 'final' : 'hasta ahora'}</span></div>
        <span class="pill ${d.pill[0]}">${d.pill[1]}</span>
      </div>
    </div>
    <div class="bims">${bims}</div>
    <div class="needs-box">${needs}</div>
    <button class="go" data-id="${subj.id}">Simular otras notas <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
  </article>`;
}

function savedCard({ subj, analysis: a, d }, i) {
  return `
  <button class="saved-card" data-id="${subj.id}" style="animation-delay:${Math.min(i, 12) * 50}ms" aria-label="${esc(subj.name)}: salvada. Toca para simular.">
    ${breadSVG({ burn: d.burn, mood: 'proud', label: esc(subj.name) })}
    <span class="saved-name">${esc(subj.name)}</span>
    <span class="saved-avg tone-${tone(d.shown == null ? null : Math.floor(d.shown + 1e-9))}"><span class="tc">${d.shown == null ? '—' : fmt2(d.shown)}</span></span>
    <span class="saved-floor">${a.status.kind === 'passed' ? 'Año cerrado' : `Con 1.0 en todo: ${fmt2(a.worst)}`}</span>
    <span class="seal" aria-hidden="true">✓</span>
  </button>`;
}

export function renderHeroStats() {
  const el = document.getElementById('hero-stats');
  const { rows, general, risky, lost, saved, toSave } = overview();
  if (!rows.length) { el.hidden = true; return; }
  el.hidden = false;
  const gt = general == null ? null : Math.floor(general + 1e-9);
  el.innerHTML = `
    <span class="stat-pill tone-${tone(gt)}"><span class="swatch" style="background:var(--tone)">★</span>Promedio <strong>${general == null ? '—' : fmt2(general)}</strong></span>
    <span class="stat-pill" style="animation-delay:.08s"><span class="swatch" style="background:var(--t-perfect)">${saved.length}</span>salvadas</span>
    <span class="stat-pill" style="animation-delay:.16s"><span class="swatch" style="background:var(--t-toasted)">${toSave.length}</span>por salvar</span>
    ${risky.length + lost.length ? `<span class="stat-pill" style="animation-delay:.24s"><span class="swatch" style="background:var(--t-burnt)">${risky.length + lost.length}</span>en peligro</span>` : ''}`;
}

