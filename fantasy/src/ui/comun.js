// Piezas de interfaz que se repiten.
import { ESTADOS, parteEnEspanol } from '../analisis/lesiones.js';
import { calificar } from '../analisis/defensas.js';
import { redondear } from '../analisis/puntos.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

export function etiquetaLesion(j) {
  const e = ESTADOS[j?.lesion];
  if (!e) return '';
  const parte = parteEnEspanol(j.parte);
  return `<span class="etiqueta ${e.color}" title="${esc(j.nota || '')}">${esc(e.texto)}${parte ? ' · ' + esc(parte) : ''}</span>`;
}

export function notaCruce(factor) {
  const c = calificar(factor ?? 1);
  return `<span class="nota-cruce ${c.nota}" title="${c.texto}">${c.nota}</span>`;
}

/** Fila de jugador. extra: { sub, derecha, derechaSub, puesto } */
export function filaJugador(j, extra = {}) {
  if (!j) return `<div class="jugador"><span class="pos ${esc(extra.puesto || '')}">${esc(extra.puesto || '?')}</span><div class="sub">Puesto vacío</div><div></div></div>`;
  const puesto = extra.puesto || j.pos;
  return `<div class="jugador" data-id="${esc(j.id)}">
    <span class="pos ${esc(puesto)}">${esc(puesto)}</span>
    <div><div class="nombre">${esc(j.nombre)} ${etiquetaLesion(j)} ${extra.etiquetas || ''}</div>
      <div class="sub">${esc(j.pos)} · ${esc(j.equipo || 'Libre')}${extra.sub ? ' · ' + extra.sub : ''}</div></div>
    <div class="der">${extra.derecha ?? ''}${extra.derechaSub ? `<small>${extra.derechaSub}</small>` : ''}</div>
  </div>`;
}

export const pts = (x) => redondear(x, 1);
export const miles = (x) => (x == null ? '–' : Math.round(x).toLocaleString('es'));

export function cargando(texto = 'Cargando…') {
  return `<div class="cargando"><div class="gusanito"></div><div>${esc(texto)}</div></div>`;
}

export function hace(ms) {
  if (!ms) return '';
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export function tarjeta(titulo, cuerpo, { sub = '', clase = '' } = {}) {
  return `<section class="tarjeta ${clase}"><header><h2>${titulo}</h2>${sub ? `<small>${sub}</small>` : ''}</header>${cuerpo}</section>`;
}
