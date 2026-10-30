// Revisar la masa: tablas por bimestre donde se corrige, agrega o quita cualquier nota.
import { getState, setGrades, setClosed, renameSubject, addSubject, removeSubject, clearBimester, closedFlags } from '../grades/store.js';
import { BIM_NAMES, COMPONENTS, COMPONENT_LABEL, bimesterBreakdown, auditAgainstPortal, toTenths, tone, fmt } from '../grades/calc.js';
import { esc, toast } from './fx.js';

let current = null;

export function renderReview() {
  const state = getState();
  const closed = closedFlags(state);
  const tabs = document.getElementById('bim-tabs');
  const panel = document.getElementById('review-panel');
  if (current == null) {
    // Abrir el último bimestre con datos.
    const withData = state.bims.map((b, i) => (Object.keys(b.data).length ? i : -1)).filter((i) => i >= 0);
    current = withData.length ? withData[withData.length - 1] : 0;
  }
  tabs.innerHTML = BIM_NAMES.map((n, i) => {
    const has = Object.keys(state.bims[i].data).length > 0;
    return `<button class="tab" role="tab" aria-selected="${i === current}" data-tab="${i}">
      <span class="dot ${has ? (closed[i] ? 'on' : 'open') : ''}"></span>${n}</button>`;
  }).join('');
  tabs.onclick = (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    current = Number(b.dataset.tab);
    renderReview();
  };

  const bim = state.bims[current];
  if (!state.subjects.length) {
    panel.innerHTML = `<div class="empty" style="color:var(--ink-2);border-color:var(--paper-edge)"><b>Aún no hay notas.</b>
      <span>Sube una captura o agrega una materia a mano.</span>
      <button class="btn btn-paper btn-small" data-act="add-subject">+ Agregar materia</button></div>`;
    panel.onclick = onPanelClick;
    return;
  }

  const rows = state.subjects.map((s) => row(s, bim.data[s.id])).join('');
  panel.innerHTML = `
    <div class="review-bar">
      <div><b>${BIM_NAMES[current]}</b>${bim.source ? ` <span style="color:var(--ink-3);font-size:13px">· leído de ${esc(bim.source.name)}</span>` : ''}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <label class="switch"><input type="checkbox" data-act="closed" ${closed[current] ? 'checked' : ''}/> Bimestre cerrado</label>
        ${Object.keys(bim.data).length ? '<button class="btn btn-paper btn-small" data-act="clear">Vaciar</button>' : ''}
      </div>
    </div>
    <div class="table-wrap">
      <table class="grades">
        <thead><tr><th>Materia</th><th>${COMPONENT_LABEL.dig}</th><th>${COMPONENT_LABEL.apr}</th><th>${COMPONENT_LABEL.bim}</th><th>Nota</th><th>Portal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="review-foot">
      <div class="legend-inline">
        <span><span class="chip uncertain tone-golden" style="min-width:30px;height:22px;animation:none">?</span> Revisar</span>
        <span><span class="chip corrected tone-golden" style="min-width:30px;height:22px">✓</span> Corregida con el portal</span>
        <span><span class="chip chip-pend" style="min-width:30px;height:22px">-</span> Pendiente</span>
      </div>
      <button class="btn btn-paper btn-small" data-act="add-subject">+ Agregar materia</button>
    </div>
    <p style="margin:0;padding:0 14px 14px;font-size:13px;color:var(--ink-3)">"Bimestre cerrado" = ya tiene examen bimestral. Si está en curso, te digo cuánto necesitas en lo que falta.</p>`;
  panel.onclick = onPanelClick;
  panel.onchange = onPanelChange;
}

function row(subj, entry) {
  const b = entry ? bimesterBreakdown(entry) : { final: null };
  const issues = entry?.portal && Object.values(entry.portal).some((v) => v) ? auditAgainstPortal(entry, entry.portal) : null;
  const check = issues == null ? '<span class="check" style="color:var(--ink-3)">—</span>'
    : issues.length ? `<span class="check bad" title="${issues.map((i) => `${i.field}: portal ${fmt(i.portal)} / calculado ${fmt(i.mine)}`).join(' · ')}">≠ revisar</span>`
      : '<span class="check ok">✓ cuadra</span>';
  const cells = COMPONENTS.map((c) => `<td><div class="chips">${chips(subj.id, c, entry?.[c] || [], entry?.flags?.[c] || [])}</div></td>`).join('');
  return `<tr>
    <td class="name"><div style="display:flex;gap:4px;align-items:center"><input value="${esc(subj.name)}" data-act="rename" data-sid="${subj.id}" aria-label="Nombre de la materia"/>
      <button class="del" data-act="remove-subject" data-sid="${subj.id}" aria-label="Quitar ${esc(subj.name)}" title="Quitar materia">×</button></div></td>
    ${cells}
    <td class="final-cell tone-${tone(b.final)}"><span class="tc">${fmt(b.final)}</span></td>
    <td>${check}</td>
  </tr>`;
}

function chips(sid, comp, items, flags) {
  return items.map((v, i) => {
    const s = String(v).trim();
    const cls = s === '-' ? 'chip-pend' : s.toUpperCase() === 'X' ? 'chip-x' : `tone-${tone(toTenths(s))}`;
    const flag = flags[i] ? ` ${flags[i]}` : '';
    return `<button class="chip ${cls}${flag}" data-act="edit" data-sid="${sid}" data-comp="${comp}" data-idx="${i}" aria-label="${COMPONENT_LABEL[comp]} ${s}. Toca para cambiar">${esc(s)}</button>`;
  }).join('') + `<button class="chip chip-add" data-act="add" data-sid="${sid}" data-comp="${comp}" aria-label="Agregar nota de ${COMPONENT_LABEL[comp]}">+</button>`;
}

function onPanelChange(e) {
  const t = e.target;
  if (t.dataset.act === 'closed') setClosed(current, t.checked);
  if (t.dataset.act === 'rename') renameSubject(t.dataset.sid, t.value);
}

function onPanelClick(e) {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const act = t.dataset.act;
  if (act === 'clear') {
    if (confirm(`¿Vaciar todas las notas del ${BIM_NAMES[current]}?`)) clearBimester(current);
  } else if (act === 'add-subject') {
    const name = prompt('Nombre de la materia');
    if (name) addSubject(name);
  } else if (act === 'remove-subject') {
    const subj = getState().subjects.find((x) => x.id === t.dataset.sid);
    if (subj && confirm(`¿Quitar ${subj.name} de todos los bimestres?`)) removeSubject(subj.id);
  } else if (act === 'edit' || act === 'add') {
    startEdit(t);
  }
}

function startEdit(chip) {
  const { sid, comp } = chip.dataset;
  const idx = chip.dataset.idx != null ? Number(chip.dataset.idx) : null;
  const entry = getState().bims[current].data[sid];
  const items = [...(entry?.[comp] || [])];
  const flags = [...(entry?.flags?.[comp] || [])];
  const input = document.createElement('input');
  input.className = 'chip-input';
  input.inputMode = 'decimal';
  input.placeholder = '4.5';
  input.value = idx != null ? items[idx] : '';
  input.setAttribute('aria-label', 'Nota (1.0 a 5.0, X o -). Déjala vacía para borrarla.');
  chip.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const commit = (save) => {
    if (done) return;
    done = true;
    if (!save) { renderReview(); return; }
    const raw = input.value.trim().replace(',', '.').toUpperCase();
    let value = null;
    if (raw === '') value = null;
    else if (raw === 'X' || raw === '-') value = raw;
    else {
      const n = /^\d$/.test(raw) ? `${raw}.0` : /^\d\d$/.test(raw) ? `${raw[0]}.${raw[1]}` : raw;
      if (toTenths(n) == null) { toast('Escribe una nota de 1.0 a 5.0, X (exonerado) o - (pendiente).'); done = false; input.focus(); return; }
      value = (toTenths(n) / 10).toFixed(1);
    }
    if (idx == null) { if (value != null) { items.push(value); flags.push(null); } }
    else if (value == null) { items.splice(idx, 1); flags.splice(idx, 1); }
    else { items[idx] = value; flags[idx] = null; }
    setGrades(current, sid, comp, items, flags);
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit(true);
    if (e.key === 'Escape') commit(false);
  });
  input.addEventListener('blur', () => commit(true));
}

export function focusBimester(i) { current = i; }
