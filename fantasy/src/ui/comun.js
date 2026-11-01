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

/** Fila de jugador. extra: { sub, derecha, derechaSub, puesto, etiquetas, consejo } */
export function filaJugador(j, extra = {}) {
  if (!j) {
    return `<div class="jugador"><span class="pos">${esc(extra.puesto || '?')}</span><div class="sub">Puesto vacío</div><div></div></div>`;
  }
  const puesto = extra.puesto || j.pos;
  return `<div class="jugador" data-id="${esc(j.id)}">
    <span class="pos ${esc(j.pos)}">${esc(puesto)}</span>
    <div style="min-width:0"><div class="nombre"><span class="txt">${esc(j.nombre)}</span>${extra.etiquetas || ''}${etiquetaLesion(j)}</div>
      <div class="sub">${esc(j.equipo || 'Libre')}${extra.sub ? ' · ' + extra.sub : ''}</div></div>
    <div class="der">${extra.derecha ?? ''}${extra.derechaSub ? `<small>${extra.derechaSub}</small>` : ''}</div>
    ${extra.consejo ? `<div class="consejo">${extra.consejo}</div>` : ''}
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

export function tarjeta(titulo, cuerpo, { sub = '', clase = '', plegable = false, abierta = false } = {}) {
  if (plegable) {
    return `<details class="tarjeta ${clase}" ${abierta ? 'open' : ''}><summary><div><h2>${titulo}</h2>${sub ? `<small class="nota">${sub}</small>` : ''}</div></summary>${cuerpo}</details>`;
  }
  return `<section class="tarjeta ${clase}"><header><h2>${titulo}</h2>${sub ? `<small>${sub}</small>` : ''}</header>${cuerpo}</section>`;
}

/**
 * Franja de Cody con su globito. Devuelve un control para cambiar lo que dice.
 * acciones: [{ texto, principal, alHacer }]
 */
export function codyHtml({ texto = '', grande = false } = {}) {
  return `<section class="cody ${grande ? 'grande' : ''}">
    <div class="escenario" data-cody></div>
    <div class="globo" aria-live="polite"><div class="quien">Cody</div><div class="dice">${esc(texto)}</div><div class="acciones"></div></div>
  </section>`;
}

export function codyDice(raiz, ctx, texto, { animo = 'Reposo', acciones = [] } = {}) {
  const zona = $('.cody', raiz);
  if (!zona) return;
  $('.dice', zona).textContent = texto;
  const cont = $('.acciones', zona);
  cont.innerHTML = '';
  for (const a of acciones) {
    const b = document.createElement('button');
    b.className = `chip-boton ${a.principal ? 'principal' : ''}`;
    b.textContent = a.texto;
    b.onclick = a.alHacer;
    cont.appendChild(b);
  }
  ctx.mascota?.hablar(texto, animo === 'Hablar' ? 'Reposo' : animo);
}

export async function ponerCody(raiz, ctx, texto, opciones = {}) {
  codyDice(raiz, ctx, texto, opciones);
  const yaEstaba = !!ctx.mascota;
  await ctx.ponerMascota($('[data-cody]', raiz));
  // Si Cody acaba de aparecer y nadie cambió el mensaje mientras cargaba, que lo diga
  const dice = $('.cody .dice', raiz);
  if (!yaEstaba && dice?.textContent === texto) {
    const animo = opciones.animo || 'Reposo';
    ctx.mascota?.hablar(texto, animo === 'Hablar' ? 'Reposo' : animo);
  }
}
