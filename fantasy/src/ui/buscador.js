// Buscador: encuentra funciones de la app y jugadores (con su ficha).
import { esc, $, $$, pts, miles, etiquetaLesion } from './comun.js';

const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Funciones de la app: título, palabras para encontrarla y a dónde lleva.
export const FUNCIONES = [
  { t: '⚔️ Enfrentamiento de la semana', desc: 'Tus titulares vs los del rival, puesto por puesto', k: 'duelo matchup enfrentamiento rival puntos casilla', tab: 'inicio', abrir: 'enfrentamiento' },
  { t: '✅ Lo que tienes que hacer', desc: 'Cambios con los puntos que ganas', k: 'plan consejos que hago cambios semana', tab: 'inicio' },
  { t: '⚔️ Duelos de la liga', desc: 'Todos los duelos con su % de ganar', k: 'duelos porcentaje probabilidad ganar todos', tab: 'inicio', panel: 'duelos' },
  { t: '🏆 Tabla de la liga', desc: 'Posiciones, récord y puntos', k: 'tabla posiciones clasificacion record standings', tab: 'inicio', panel: 'tabla' },
  { t: '🎯 Tu punto débil', desc: 'Tu peor posición y un trade para arreglarla', k: 'punto debil posicion floja mejorar', tab: 'inicio', panel: 'debil' },
  { t: '🛡️ Defensa de la semana', desc: 'Tu DEF vs la mejor libre', k: 'defensa dst def streaming', tab: 'inicio', panel: 'defensa' },
  { t: '📋 Alineación recomendada', desc: 'Quién entra y quién sale', k: 'alineacion titulares lineup sentar poner start sit', tab: 'equipo', abrir: 'Alineación' },
  { t: '🪑 Banca', desc: 'Tus suplentes con su proyección', k: 'banca bench suplentes', tab: 'equipo', abrir: 'Banca' },
  { t: '🩹 Lesionados de tu equipo', desc: 'Estado y qué hacer con cada uno', k: 'lesion lesionados injury duda out', tab: 'equipo', abrir: 'Lesionados de tu equipo' },
  { t: '🔬 Analizador de defensas', desc: 'Qué defensa regala más puntos a cada posición', k: 'analizador defensas cruce matchup permite puntos', tab: 'equipo', abrir: 'Analizador' },
  { t: '🛡️ Mejores defensas de la semana', desc: 'Ranking de DEF por rival (esta y la próxima)', k: 'mejores defensas dst def semana rival', tab: 'equipo', abrir: 'Mejores defensas' },
  { t: '📝 Mis waivers', desc: 'Los que pediste (pendientes) y si los ganaste o perdiste', k: 'mis waivers reclamos pedidos claims faab ganados perdidos pendientes movimientos transacciones', tab: 'jugadores', abrir: 'Mis waivers' },
  { t: '🔎 Trade por necesidad', desc: 'Dime qué posición necesitas y te digo a quién le sobra y qué le falta', k: 'necesidad necesito busco falta sobra trade receptor corredor wr rb qb te', tab: 'mercado', abrir: 'Qué necesitas' },
  { t: '⚖️ Calculadora de trades', desc: 'Medidor de justicia: arma cualquier trade de la liga y te digo quién gana', k: 'calculadora medidor justicia justo trade cualquier jugador quien gana pierde valor', tab: 'mercado', abrir: 'Calculadora de trades' },
  { t: '🤝 Armador de trades', desc: 'Elige jugadores y te doy opciones justas', k: 'trade intercambio cambio justo armar', tab: 'mercado', abrir: 'Armador' },
  { t: '🛒 Comprar barato', desc: 'Jugadores que rinden menos de lo que valen', k: 'comprar barato buy low', tab: 'mercado', abrir: 'Comprar barato' },
  { t: '💰 Vender caro', desc: 'Tus jugadores en su punto más alto', k: 'vender caro sell high', tab: 'mercado', abrir: 'Vender caro' },
  { t: '🌎 Lo que hacen miles de ligas', desc: 'Más agregados y soltados en Sleeper', k: 'tendencias trending agregados soltados', tab: 'mercado', abrir: 'miles de ligas' },
  { t: '➕ Agrega esta semana (waivers)', desc: 'Lo que más suma a tu alineación', k: 'waivers agregar libres pickup', tab: 'jugadores', abrir: 'Agrega' },
  { t: '😴 Byes', desc: 'Quién se va de bye esta semana y la próxima', k: 'bye byes descanso semana', tab: 'jugadores', abrir: 'Byes' },
  { t: '🔎 Mejores libres', desc: 'Libres por posición con su proyección', k: 'libres agentes free agents', tab: 'jugadores', abrir: 'Mejores libres' },
  { t: '🐿️ Stash (guardar lesionados)', desc: 'Lesionados libres que valen mucho al volver', k: 'stash guardar ir lesionado', tab: 'jugadores', abrir: 'stash' },
  { t: '⬆️ Suplentes que suben', desc: 'Quién hereda el puesto de un lesionado', k: 'suplentes handcuff reemplazo', tab: 'jugadores', abrir: 'Suplentes' },
  { t: '🏥 Lesionados de la liga', desc: 'Lesionados importantes de otros equipos', k: 'lesionados liga importantes', tab: 'jugadores', abrir: 'Lesionados importantes' },
  { t: '📰 Noticias', desc: 'En español, primero las de tus jugadores', k: 'noticias news nfl', tab: 'noticias' },
  { t: '🎙️ Analistas', desc: 'Sigue analistas en Bluesky', k: 'analistas bluesky expertos', tab: 'noticias', abrir: 'analistas' },
  { t: '📅 Calendario NFL', desc: 'Todos los partidos de la semana con horas y marcadores', k: 'calendario partidos horario juegos schedule hora', tab: 'nfl' },
  { t: '🏟️ Los 32 equipos', desc: 'Plantilla de cada equipo dividida por posición', k: 'equipos plantilla roster nfl 32 depth', tab: 'nfl', abrir: '32 equipos' },
  { t: '📊 Registro de un jugador', desc: 'Toca a cualquier jugador: partidos jugados y próximos', k: 'registro estadisticas stats snaps yardas game log jugador', tab: 'nfl' },
  { t: '🎨 Equipo favorito y colores', desc: 'Cambia la camiseta de Cody y los colores', k: 'equipo favorito colores camiseta tema', href: '#/equipo-favorito' },
  { t: '🔔 Avisos (notificaciones)', desc: 'Activa o apaga las notificaciones', k: 'avisos notificaciones alertas push', href: '#/', abrir: 'Avisos' },
  { t: '📅 Cambiar de semana', desc: 'Ve semanas pasadas (resultados) y futuras', k: 'semana cambiar anterior siguiente week', tab: 'inicio' },
  { t: '🐛 Hablar con Cody', desc: 'Tócalo y te cuenta algo… pero no lo toques mucho', k: 'cody mascota hablar chiste', tab: 'inicio' },
  { t: '🎓 Ver el tutorial', desc: 'Cody te enseña otra vez cómo usar la app', k: 'tutorial ayuda como usar aprender guia', tab: 'inicio', tutorial: true },
  { t: '📁 Mis ligas', desc: 'Cambiar de liga', k: 'ligas carpetas cambiar liga', href: '#/' },
];

const GRUPOS = [
  ['inicio', '🐛 Cody (inicio)'], ['equipo', '🏈 Equipo'], ['mercado', '🔁 Mercado'],
  ['jugadores', '📋 Jugadores'], ['noticias', '📰 Noticias'], ['nfl', '🏟️ NFL'], ['general', '⚙️ General'],
];

/** Busca funciones y jugadores. d puede ser null (fuera de una liga). */
export function buscar(texto, d) {
  const q = sinAcentos(texto).trim();
  if (!q) return { funciones: FUNCIONES.filter((f) => d || f.href), jugadores: [] };
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
      <button class="chip-boton principal" data-registro>📊 Ver registro de juego</button>
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
    if (f.tutorial) sessionStorage.setItem('ver-tutorial', '1');
    sessionStorage.setItem('abrir', JSON.stringify({ texto: f.abrir || null, panel: f.panel || null }));
    cerrar();
    const destino = f.href || `#/liga/${ligaId}/${f.tab}${location.hash.split('/')[4] ? '/' + location.hash.split('/')[4] : ''}`;
    if (location.hash === destino) dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = destino;
  };

  const item = (f, k) => `<button class="res-item" data-fun="${k}"><span class="res-txt"><b>${esc(f.t)}</b>${f.desc ? `<small>${esc(f.desc)}</small>` : ''}</span><span class="nota">›</span></button>`;
  const pintar = () => {
    const { funciones, jugadores } = buscar(input.value, d);
    res.innerHTML = `
      ${jugadores.length ? `<h3 class="seccion-titulo">Jugadores</h3>${jugadores.map((j) => `<button class="res-item" data-jug="${esc(j.id)}">
        <span class="pos ${esc(j.pos)}">${esc(j.pos)}</span><span class="res-txt"><b>${esc(j.nombre)}</b><small>${esc(j.equipo || '')} · ${esc(dueno(d, j.id).texto)}</small></span>${etiquetaLesion(j)}</button>`).join('')}` : ''}
      ${funciones.length ? (input.value ? `<h3 class="seccion-titulo">Funciones</h3>${funciones.map((f, k) => item(f, k)).join('')}`
        : GRUPOS.map(([clave, titulo]) => {
          const del = funciones.map((f, k) => [f, k]).filter(([f]) => (f.tab || 'general') === clave);
          return del.length ? `<h3 class="seccion-titulo">${titulo}</h3>${del.map(([f, k]) => item(f, k)).join('')}` : '';
        }).join('')) : ''}
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
      $('[data-registro]', res)?.addEventListener('click', async () => {
        cerrar();
        const { abrirFicha } = await import('./ficha.js');
        abrirFicha({ id: j.id, d, ctx });
      });
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
  if (objetivo.tagName === 'BUTTON' && (objetivo.closest('.chips') || objetivo.hasAttribute('data-abrir-calc'))) { objetivo.click(); return; }
  const det = objetivo.closest('details');
  if (det) det.open = true;
  const caja = objetivo.closest('.tarjeta') || objetivo;
  caja.scrollIntoView({ behavior: 'smooth', block: 'start' });
  caja.classList.add('resaltar');
  setTimeout(() => caja.classList.remove('resaltar'), 1600);
}
