// Buscador: encuentra funciones de la app y jugadores (con su ficha).
import { esc, $, $$, pts, miles, etiquetaLesion } from './comun.js';

const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Funciones de la app: título, palabras para encontrarla y a dónde lleva.
export const FUNCIONES = [
  { t: '⚔️ Enfrentamiento de la semana', k: 'duelo matchup enfrentamiento rival puntos casilla', tab: 'inicio', abrir: 'enfrentamiento' },
  { t: '✅ Lo que tienes que hacer', k: 'plan consejos que hago cambios semana', tab: 'inicio' },
  { t: '⚔️ Duelos de la liga', k: 'duelos porcentaje probabilidad ganar todos', tab: 'inicio', panel: 'duelos' },
  { t: '🏆 Tabla de la liga', k: 'tabla posiciones clasificacion record standings', tab: 'inicio', panel: 'tabla' },
  { t: '🎯 Tu punto débil', k: 'punto debil posicion floja mejorar', tab: 'inicio', panel: 'debil' },
  { t: '🛡️ Defensa de la semana', k: 'defensa dst def streaming', tab: 'inicio', panel: 'defensa' },
  { t: '📋 Alineación recomendada', k: 'alineacion titulares lineup sentar poner start sit', tab: 'equipo', abrir: 'Alineación' },
  { t: '🪑 Banca', k: 'banca bench suplentes', tab: 'equipo', abrir: 'Banca' },
  { t: '🩹 Lesionados de tu equipo', k: 'lesion lesionados injury duda out', tab: 'equipo', abrir: 'Lesionados de tu equipo' },
  { t: '🔬 Analizador de defensas', k: 'analizador defensas cruce matchup permite puntos', tab: 'equipo', abrir: 'Analizador' },
  { t: '🛡️ Mejores defensas de la semana', k: 'mejores defensas dst def semana rival', tab: 'equipo', abrir: 'Mejores defensas' },
  { t: '🤝 Armador de trades', k: 'trade intercambio cambio justo armar', tab: 'mercado', abrir: 'Armador' },
  { t: '🛒 Comprar barato', k: 'comprar barato buy low', tab: 'mercado', abrir: 'Comprar barato' },
  { t: '💰 Vender caro', k: 'vender caro sell high', tab: 'mercado', abrir: 'Vender caro' },
  { t: '🌎 Lo que hacen miles de ligas', k: 'tendencias trending agregados soltados', tab: 'mercado', abrir: 'miles de ligas' },
  { t: '➕ Agrega esta semana (waivers)', k: 'waivers agregar libres pickup', tab: 'jugadores', abrir: 'Agrega' },
  { t: '😴 Byes', k: 'bye byes descanso semana', tab: 'jugadores', abrir: 'Byes' },
  { t: '🔎 Mejores libres', k: 'libres agentes free agents', tab: 'jugadores', abrir: 'Mejores libres' },
  { t: '🐿️ Stash (guardar lesionados)', k: 'stash guardar ir lesionado', tab: 'jugadores', abrir: 'stash' },
  { t: '⬆️ Suplentes que suben', k: 'suplentes handcuff reemplazo', tab: 'jugadores', abrir: 'Suplentes' },
  { t: '🏥 Lesionados de la liga', k: 'lesionados liga importantes', tab: 'jugadores', abrir: 'Lesionados importantes' },
  { t: '📰 Noticias', k: 'noticias news nfl', tab: 'noticias' },
  { t: '🎙️ Analistas', k: 'analistas bluesky expertos', tab: 'noticias', abrir: 'analistas' },
  { t: '🎨 Equipo favorito y colores', k: 'equipo favorito colores camiseta tema', href: '#/equipo-favorito' },
  { t: '🔔 Avisos (notificaciones)', k: 'avisos notificaciones alertas push', href: '#/', abrir: 'Avisos' },
  { t: '📁 Mis ligas', k: 'ligas carpetas cambiar liga', href: '#/' },
];

/** Busca funciones y jugadores. d puede ser null (fuera de una liga). */
export function buscar(texto, d) {
  const q = sinAcentos(texto).trim();
  if (!q) return { funciones: FUNCIONES.slice(0, 8), jugadores: [] };
  const palabras = q.split(/\s+/);
  const funciones = FUNCIONES
    .filter((f) => (d || f.href) && palabras.every((p) => sinAcentos(f.t + ' ' + f.k).includes(p)));
  let jugadores = [];
  if (d && q.length >= 2) {
    jugadores = Object.values(d.jugadores)
      .filter((j) => j.nombre && sinAcentos(j.nombre).includes(q))
      .sort((a, b) => d.valor(b.id) - d.valor(a.id) || a.rank - b.rank)
      .slice(0, 8);
  }
  return { funciones, jugadores };
}

function dueno(d, id) {
  if (d.mio?.ids.includes(id)) return { tipo: 'mio', texto: 'Tuyo' };
  const e = d.equipos.find((x) => x.ids.includes(id));
  return e ? { tipo: 'rival', texto: e.nombre, equipo: e } : { tipo: 'libre', texto: 'Libre' };
}

function fichaHtml(d, j) {
  const du = dueno(d, j.id);
  const p = d.proy(d.semana, j.id);
  const rival = d.rivalesPor[d.semana]?.[j.equipo];
  const titular = d.mio?.titulares.includes(j.id);
  return `<div class="ficha">
    <div class="ficha-cab"><span class="pos ${esc(j.pos)}">${esc(j.pos)}</span><div><h3>${esc(j.nombre)}</h3>
      <small class="nota">${esc(j.equipo || 'Sin equipo')}${j.edad ? ` · ${j.edad} años` : ''}</small></div></div>
    <div class="ficha-datos">
      <div><small>Dueño</small><b>${esc(du.texto)}</b></div>
      <div><small>Valor trade</small><b>${miles(d.valor(j.id))}</b></div>
      <div><small>Proy. sem ${d.semana}</small><b>${p != null ? pts(p) : '–'}</b></div>
      <div><small>Rival</small><b>${rival ? esc(rival) : d.byesPor[d.semana]?.has(j.equipo) ? 'BYE' : '–'}</b></div>
    </div>
    ${j.lesion ? `<p style="margin-top:8px">${etiquetaLesion(j)} ${j.nota ? `<span class="nota">${esc(j.nota)}</span>` : ''}</p>` : ''}
    <div class="acciones" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">
      ${du.tipo === 'rival' ? `<button class="chip-boton principal" data-trade="${esc(j.id)}" data-roster="${du.equipo.rosterId}">🤝 Armar trade por él</button>` : ''}
      ${du.tipo === 'libre' ? '<span class="etiqueta verde">✅ Está libre: agrégalo en Sleeper</span>' : ''}
      ${du.tipo === 'mio' ? `<span class="etiqueta acento">${titular ? 'Es titular tuyo' : 'Está en tu banca'}</span>` : ''}
      ${du.tipo === 'mio' ? `<button class="chip-boton" data-vender="${esc(j.id)}">🤝 Ver qué me dan por él</button>` : ''}
    </div>
  </div>`;
}

/** Abre el buscador encima de la pantalla. */
export function abrirBuscador({ d = null, ligaId = null, ctx } = {}) {
  document.querySelector('.buscador')?.remove();
  const capa = document.createElement('div');
  capa.className = 'buscador';
  capa.innerHTML = `<div class="buscador-caja" role="dialog" aria-label="Buscar">
    <div class="buscador-barra"><span>🔍</span>
      <input type="search" placeholder="${d ? 'Buscar funciones o jugadores…' : 'Buscar funciones…'}" aria-label="Buscar" autocomplete="off" />
      <button class="boton-icono" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="buscador-res"></div></div>`;
  document.body.appendChild(capa);
  document.body.style.overflow = 'hidden';
  const input = $('input', capa);
  const res = $('.buscador-res', capa);
  const cerrar = () => { capa.remove(); document.body.style.overflow = ''; };
  capa.addEventListener('click', (e) => { if (e.target === capa || e.target.closest('[data-cerrar]')) cerrar(); });
  addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { cerrar(); removeEventListener('keydown', esc_); } });

  const irA = (f) => {
    sessionStorage.setItem('abrir', JSON.stringify({ texto: f.abrir || null, panel: f.panel || null }));
    cerrar();
    const destino = f.href || `#/liga/${ligaId}/${f.tab}${location.hash.split('/')[4] ? '/' + location.hash.split('/')[4] : ''}`;
    if (location.hash === destino) dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = destino;
  };

  const pintar = () => {
    const { funciones, jugadores } = buscar(input.value, d);
    res.innerHTML = `
      ${jugadores.length ? `<h3 class="seccion-titulo">Jugadores</h3>${jugadores.map((j) => `<button class="res-item" data-jug="${esc(j.id)}">
        <span class="pos ${esc(j.pos)}">${esc(j.pos)}</span><span class="res-txt"><b>${esc(j.nombre)}</b><small>${esc(j.equipo || '')} · ${esc(dueno(d, j.id).texto)}</small></span>${etiquetaLesion(j)}</button>`).join('')}` : ''}
      ${funciones.length ? `<h3 class="seccion-titulo">${input.value ? 'Funciones' : 'Ir a…'}</h3>${funciones.map((f, k) => `<button class="res-item" data-fun="${k}"><span class="res-txt"><b>${esc(f.t)}</b></span><span class="nota">›</span></button>`).join('')}` : ''}
      ${!funciones.length && !jugadores.length ? '<div class="vacio">No encontré nada con eso. 🐛</div>' : ''}`;
    $$('[data-fun]', res).forEach((b) => (b.onclick = () => irA(funciones[Number(b.dataset.fun)])));
    $$('[data-jug]', res).forEach((b) => (b.onclick = () => {
      const j = d.jugadores[b.dataset.jug];
      res.innerHTML = `<button class="chip-boton" data-volver>← Volver</button>${fichaHtml(d, j)}`;
      $('[data-volver]', res).onclick = pintar;
      $('[data-trade]', res)?.addEventListener('click', (e) => {
        sessionStorage.setItem('trade-sugerido', JSON.stringify({ recibo: [j.id], doy: [], equipo: Number(e.target.dataset.roster) }));
        irA({ tab: 'mercado' });
      });
      $('[data-vender]', res)?.addEventListener('click', () => irA({ tab: 'mercado', abrir: 'Armador' }));
      ctx?.mascota && import('./comun.js').then(({ codyDice }) => codyDice(document, ctx,
        `${j.nombre}: ${dueno(d, j.id).tipo === 'libre' ? '¡está libre! Si te sirve, agárralo.' : dueno(d, j.id).tipo === 'mio' ? 'es de los tuyos. 💪' : `lo tiene ${dueno(d, j.id).texto}.`}`, { animo: 'Hablar' }));
    }));
  };
  input.addEventListener('input', pintar);
  pintar();
  setTimeout(() => input.focus(), 50);
}

/** Después de navegar desde el buscador: abre y resalta la sección pedida. */
export function abrirPendiente(raiz = document) {
  let pedido;
  try { pedido = JSON.parse(sessionStorage.getItem('abrir') || 'null'); } catch { pedido = null; }
  sessionStorage.removeItem('abrir');
  if (!pedido) return;
  if (pedido.panel) {
    const b = raiz.querySelector(`[data-panel="${pedido.panel}"]`);
    if (b && !b.classList.contains('activo')) b.click();
    return;
  }
  if (!pedido.texto) return;
  const objetivo = pedido.texto === 'enfrentamiento' ? raiz.querySelector('#ver-enfrentamiento')
    : [...raiz.querySelectorAll('h2, button')].find((h) => sinAcentos(h.textContent).includes(sinAcentos(pedido.texto)));
  if (!objetivo) return;
  if (objetivo.id === 'ver-enfrentamiento') { objetivo.click(); return; }
  const det = objetivo.closest('details');
  if (det) det.open = true;
  const caja = objetivo.closest('.tarjeta') || objetivo;
  caja.scrollIntoView({ behavior: 'smooth', block: 'start' });
  caja.classList.add('resaltar');
  setTimeout(() => caja.classList.remove('resaltar'), 1600);
}
