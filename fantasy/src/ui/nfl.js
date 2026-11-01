// Sección NFL: calendario de partidos con horas y los 32 equipos con su plantilla por posición.
import { esc, $, $$, filaJugador, cargando, tarjeta } from './comun.js';
import { partidosSemana } from '../datos/calendario.js';
import { EQUIPOS } from '../datos/equipos.js';
import { fmtHora } from '../estado.js';

const POS = [['QB', '🎯 Quarterbacks'], ['RB', '🏃 Corredores'], ['WR', '🙌 Receptores'], ['TE', '💪 Alas cerradas'], ['K', '🦶 Pateador'], ['DEF', '🛡️ Defensa']];

const dia = (ms) => new Date(ms).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' });
const horaSola = (ms) => new Date(ms).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });

function bolita(abr) {
  const e = EQUIPOS[abr];
  return `<span class="bolita-eq" style="background:${e?.camiseta || '#333'};box-shadow:inset 0 0 0 2px ${e?.ribete || '#666'}">${esc(abr)}</span>`;
}

/**
 * el: contenedor. datos: { jugadores, temporada, semana, d (liga, opcional) }
 */
export function vistaNFL(el, datos, ctx) {
  const estado = { sub: 'calendario', semana: datos.semana, equipo: null };
  const pintar = () => {
    el.innerHTML = `<div class="chips" id="nfl-tabs">
        <button data-s="calendario" class="${estado.sub === 'calendario' ? 'activo' : ''}">📅 Calendario</button>
        <button data-s="equipos" class="${estado.sub !== 'calendario' ? 'activo' : ''}">🏈 Los 32 equipos</button>
      </div><div id="nfl-cuerpo"></div>`;
    $$('#nfl-tabs button', el).forEach((b) => (b.onclick = () => { estado.sub = b.dataset.s; estado.equipo = null; pintar(); }));
    const cuerpo = $('#nfl-cuerpo', el);
    if (estado.sub === 'calendario') calendario(cuerpo);
    else if (estado.equipo) equipo(cuerpo, estado.equipo);
    else equipos(cuerpo);
  };

  async function calendario(cuerpo) {
    cuerpo.innerHTML = `<nav class="selector-semana">
        <button class="chip-boton" data-w="${estado.semana - 1}" ${estado.semana <= 1 ? 'disabled' : ''}>◀</button>
        <div class="semana-actual"><b>Semana ${estado.semana}</b><small>${estado.semana === datos.semana ? '🟢 esta semana' : ''}</small></div>
        <button class="chip-boton" data-w="${estado.semana + 1}" ${estado.semana >= 18 ? 'disabled' : ''}>▶</button>
      </nav><div id="juegos">${cargando('Trayendo los partidos…')}</div>`;
    $$('[data-w]', cuerpo).forEach((b) => (b.onclick = () => { estado.semana = Number(b.dataset.w); calendario(cuerpo); }));
    const partidos = (await partidosSemana(datos.temporada, estado.semana).catch(() => []))
      .sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha));
    const misIds = new Set(datos.d?.mio?.ids || []);
    const J = datos.jugadores;
    const mios = (abr) => [...misIds].filter((id) => J[id]?.equipo === abr);
    const porDia = {};
    for (const p of partidos) (porDia[dia(Date.parse(p.fecha))] ??= []).push(p);
    $('#juegos', cuerpo).innerHTML = partidos.length ? Object.entries(porDia).map(([d, lista]) => `
      <h3 class="seccion-titulo">${esc(d)}</h3>
      ${lista.map((p, k) => {
        const n = mios(p.local).length + mios(p.visita).length;
        const vivo = p.progreso > 0 && p.progreso < 1;
        return `<details class="tarjeta juego">
          <summary>
            <div class="juego-eqs">
              <div class="juego-eq">${bolita(p.visita)}<b>${esc(EQUIPOS[p.visita]?.nombre.split(' ').slice(-1)[0] || p.visita)}</b>${p.marcador ? `<span class="marca">${p.marcador.visita}</span>` : ''}</div>
              <div class="juego-eq">${bolita(p.local)}<b>${esc(EQUIPOS[p.local]?.nombre.split(' ').slice(-1)[0] || p.local)}</b>${p.marcador ? `<span class="marca">${p.marcador.local}</span>` : ''}</div>
            </div>
            <div class="juego-info">${vivo ? `<span class="etiqueta rojo">🔴 ${esc(p.detalle || 'En vivo')}</span>` : p.progreso >= 1 ? `<span class="etiqueta">${esc(p.detalle || 'Final')}</span>` : `<b>${esc(horaSola(Date.parse(p.fecha)))}</b>`}
              ${p.tv ? `<small>${esc(p.tv)}</small>` : ''}${n ? `<span class="etiqueta acento">${n} tuyo${n > 1 ? 's' : ''}</span>` : ''}</div>
          </summary>
          <div class="juego-detalle" data-k="${k}"></div>
        </details>`;
      }).join('')}`).join('') : '<div class="tarjeta vacio">No hay partidos para esta semana.</div>';
    // Al abrir un partido: tus jugadores y los más importantes de cada equipo
    $$('details.juego', cuerpo).forEach((det) => det.addEventListener('toggle', () => {
      if (!det.open) return;
      const caja = $('.juego-detalle', det);
      if (caja.dataset.listo) return;
      caja.dataset.listo = '1';
      const p = partidos.find((x) => det.innerHTML.includes(`>${x.local}<`) && det.innerHTML.includes(`>${x.visita}<`));
      if (!p) return;
      const top = (abr) => Object.values(J).filter((j) => j.equipo === abr && ['QB', 'RB', 'WR', 'TE'].includes(j.pos))
        .sort((a, b) => a.rank - b.rank).slice(0, 4);
      const lista = [...new Set([...mios(p.visita), ...mios(p.local)].map((id) => J[id]).concat(top(p.visita), top(p.local)))];
      caja.innerHTML = `<div class="lista">${lista.map((j) => filaJugador(j, {
        etiquetas: misIds.has(j.id) ? '<span class="etiqueta acento">Tuyo</span>' : '' })).join('')}</div>
        <p class="nota">Toca a un jugador para ver su registro.</p>`;
    }));
  }

  function equipos(cuerpo) {
    const orden = Object.entries(EQUIPOS).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));
    cuerpo.innerHTML = `<div class="equipos-nfl grande">${orden.map(([abr, e]) => `<button class="equipo-nfl" data-eq="${abr}">
      <span class="bolita" style="background:${e.camiseta};box-shadow:inset 0 0 0 3px ${e.ribete}">${abr}</span>${esc(e.nombre.split(' ').slice(-1)[0])}</button>`).join('')}</div>`;
    $$('[data-eq]', cuerpo).forEach((b) => (b.onclick = () => { estado.equipo = b.dataset.eq; pintar(); scrollTo(0, 0); }));
  }

  async function equipo(cuerpo, abr) {
    const e = EQUIPOS[abr];
    const J = datos.jugadores;
    const d = datos.d;
    const delEquipo = Object.values(J).filter((j) => j.equipo === abr);
    const due = (id) => (!d ? '' : d.mio?.ids.includes(id) ? '<span class="etiqueta acento">Tuyo</span>'
      : d.rosteados?.has(id) ? '' : '<span class="etiqueta verde">Libre</span>');
    cuerpo.innerHTML = `
      <button class="chip-boton" data-volver>← Todos los equipos</button>
      <section class="equipo-cab" style="--eq:${e.camiseta};--eq2:${e.ribete}">
        ${bolita(abr)}<div><h2>${esc(e.nombre)}</h2><small id="eq-proximo">Buscando su próximo partido…</small></div>
      </section>
      ${POS.map(([pos, titulo]) => {
        const lista = delEquipo.filter((j) => j.pos === pos)
          .sort((a, b) => (a.profundidad ?? 99) - (b.profundidad ?? 99) || a.rank - b.rank)
          .slice(0, pos === 'WR' ? 8 : pos === 'DEF' ? 1 : 5);
        if (!lista.length) return '';
        return tarjeta(titulo, `<div class="lista">${lista.map((j, k) => filaJugador(j, {
          etiquetas: (k === 0 && pos !== 'DEF' ? '<span class="etiqueta">Titular</span>' : '') + due(j.id),
          sub: j.profundidad ? `#${j.profundidad} en la profundidad` : '',
        })).join('')}</div>`);
      }).join('')}
      <p class="nota">Toca a cualquier jugador para ver su registro de juego.</p>`;
    $('[data-volver]', cuerpo).onclick = () => { estado.equipo = null; pintar(); };
    // Próximos partidos del equipo
    const prox = [];
    for (let w = datos.semana; w <= Math.min(18, datos.semana + 3); w++) {
      const p = (await partidosSemana(datos.temporada, w).catch(() => [])).find((x) => x.local === abr || x.visita === abr);
      prox.push(p ? `S${w} ${p.local === abr ? 'vs' : '@'} ${p.local === abr ? p.visita : p.local} · ${fmtHora(Date.parse(p.fecha))}` : `S${w} 😴 BYE`);
    }
    const el2 = $('#eq-proximo', cuerpo);
    if (el2) el2.innerHTML = prox.map(esc).join('<br>');
  }

  pintar();
}
