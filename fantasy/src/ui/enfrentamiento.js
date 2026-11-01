// Casilla del enfrentamiento (como la de Sleeper): tus titulares contra los del rival, puesto por puesto.
import { esc, pts, etiquetaLesion } from './comun.js';
import { puestosTitulares, NOMBRE_PUESTO } from '../analisis/alineacion.js';

export function enfrentamientoHtml(dd, d) {
  const J = d.jugadores;
  const puestos = puestosTitulares(d.puestos);
  const proy = (id) => d.proy(d.semana, id);
  const celda = (lado, id, derecha) => {
    const j = J[id];
    if (!id || id === '0' || !j) return `<div class="ef-j ${derecha ? 'der' : ''}"><span class="nota">Vacío</span></div>`;
    const hechos = lado.puntosJugador[id];
    const p = proy(id);
    const bye = d.byesPor[d.semana]?.has(j.equipo);
    const nombre = j.nombre.split(' ');
    const corto = nombre.length > 1 ? `${nombre[0][0]}. ${nombre.slice(1).join(' ')}` : j.nombre;
    return `<div class="ef-j ${derecha ? 'der' : ''}">
      <div class="ef-nom">${esc(corto)}</div>
      <div class="ef-sub">${esc(j.pos)} · ${esc(j.equipo || '')}${bye ? ' · <b class="baja">BYE</b>' : ''} ${etiquetaLesion(j)}</div>
      <div class="ef-pts"><b>${hechos != null ? pts(hechos) : '–'}</b><small>${p != null ? pts(p) : ''}</small></div>
    </div>`;
  };
  const filas = puestos.map((p, i) => {
    const a = dd.a.titulares[i];
    const b = dd.b.titulares[i];
    const pa = dd.a.puntosJugador[a] ?? 0;
    const pb = dd.b.puntosJugador[b] ?? 0;
    return `<div class="ef-fila">
      ${celda(dd.a, a, false)}
      <span class="ef-puesto ${pa > pb ? 'gana-a' : pb > pa ? 'gana-b' : ''}">${esc(NOMBRE_PUESTO[p] || p)}</span>
      ${celda(dd.b, b, true)}
    </div>`;
  }).join('');
  const pa = Math.round(dd.a.prob * 100);
  const bancaHtml = (lado) => lado.banca.filter((id) => J[id]).slice(0, 10).map((id) =>
    `<div class="ef-banca-j"><span>${esc(J[id].pos)} ${esc(J[id].nombre)}</span><b>${lado.puntosJugador[id] != null ? pts(lado.puntosJugador[id]) : '–'}</b></div>`).join('');
  return `<section class="tarjeta enfrentamiento">
    <div class="ef-cabeza">
      <div><div class="ef-equipo">${esc(dd.a.equipo.nombre)}</div><div class="ef-total">${pts(dd.a.hechos || dd.a.puntos)}</div><small>proy. ${pts(dd.a.esperado)} · ${pa}%</small></div>
      <div class="vs">VS</div>
      <div class="der"><div class="ef-equipo">${esc(dd.b.equipo.nombre)}</div><div class="ef-total">${pts(dd.b.hechos || dd.b.puntos)}</div><small>${100 - pa}% · proy. ${pts(dd.b.esperado)}</small></div>
    </div>
    <div class="barra-prob"><span style="width:${pa}%"></span></div>
    <div class="ef-filas">${filas}</div>
    <p class="nota" style="margin-top:6px">Número grande: puntos hechos · chico: proyección</p>
    <details class="ef-banca"><summary class="chip-boton">🪑 Ver bancas</summary>
      <div class="ef-bancas"><div>${bancaHtml(dd.a) || '<span class="nota">Sin banca</span>'}</div><div>${bancaHtml(dd.b) || '<span class="nota">Sin banca</span>'}</div></div>
    </details>
  </section>`;
}
