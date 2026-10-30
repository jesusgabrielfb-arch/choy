// Ventanitas propias para confirmar o escribir algo (en lugar de confirm/prompt del navegador).
import { breadSVG } from './bread.js';
import { esc } from './fx.js';

function open({ title, text = '', input = null, ok = 'Aceptar', danger = false }) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const root = document.createElement('div');
    root.className = 'dialog';
    root.innerHTML = `
      <div class="dialog-scrim" data-d="cancel"></div>
      <form class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <div class="dialog-pan">${breadSVG({ burn: danger ? 0.7 : 0.4, mood: danger ? 'scared' : 'happy', label: 'Pancracio' })}</div>
        <div>
          <h3 id="dlg-title">${esc(title)}</h3>
          ${text ? `<p>${esc(text)}</p>` : ''}
          ${input ? `<input id="dlg-input" class="dialog-input" placeholder="${esc(input.placeholder || '')}" value="${esc(input.value || '')}" autocomplete="off" />` : ''}
          <div class="dialog-btns">
            <button type="button" class="btn btn-paper btn-small" data-d="cancel">Cancelar</button>
            <button type="submit" class="btn ${danger ? 'btn-danger' : 'btn-fire'} btn-small">${esc(ok)}</button>
          </div>
        </div>
      </form>`;
    document.body.appendChild(root);
    const field = root.querySelector('#dlg-input');
    (field || root.querySelector('[type=submit]')).focus();
    const close = (value) => {
      root.classList.add('out');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => root.remove(), 220);
      prev?.focus?.({ preventScroll: true });
      resolve(value);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(input ? null : false); };
    document.addEventListener('keydown', onKey);
    root.addEventListener('click', (e) => { if (e.target.closest('[data-d="cancel"]')) close(input ? null : false); });
    root.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      close(input ? field.value.trim() || null : true);
    });
  });
}

export const askConfirm = (title, text, ok = 'Sí, hazlo') => open({ title, text, ok, danger: true });
export const askText = (title, placeholder) => open({ title, input: { placeholder }, ok: 'Agregar' });
