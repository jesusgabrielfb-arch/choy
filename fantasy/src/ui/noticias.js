// Noticias en español + analistas que sigas en Bluesky.
import { esc, $, $$, hace, cargando, tarjeta } from './comun.js';
import {
  noticias, traducir, puedeTraducir, enlaceTraductor, marcarJugadores,
  analistasGuardados, guardarAnalistas, buscarAnalistas, publicacionesAnalista,
} from '../datos/noticias.js';
import { jugadores as pedirJugadores } from '../datos/sleeper.js';

export async function vistaNoticias(el, d) {
  const J = d?.jugadores || (await pedirJugadores().catch(() => ({})));
  const misIds = new Set(d?.mio?.ids || []);
  const ligaIds = d?.rosteados || new Set();
  const porNombre = Object.values(J)
    .filter((j) => j.nombre && j.nombre.length > 6 && (ligaIds.has(j.id) || j.rank < 250))
    .map((j) => [j.nombre, j.id]);

  el.innerHTML = `
    <div class="chips" id="filtros">
      ${d ? '<button data-f="mios" class="activo">Mis jugadores</button><button data-f="liga">Mi liga</button>' : ''}
      <button data-f="todo" class="${d ? '' : 'activo'}">Todo</button>
      <button data-f="analistas">Analistas</button>
    </div>
    <div id="lista-noticias">${cargando('Buscando noticias…')}</div>`;

  let todas = [];
  let filtro = d ? 'mios' : 'todo';
  try {
    const r = await noticias();
    todas = marcarJugadores(r.noticias || [], porNombre);
  } catch {
    todas = [];
  }

  async function pintar() {
    const cont = $('#lista-noticias');
    if (filtro === 'analistas') return pintarAnalistas(cont, porNombre);
    const lista = todas.filter((n) => filtro === 'todo' ||
      (filtro === 'mios' && n.jugadores.some((id) => misIds.has(id))) ||
      (filtro === 'liga' && n.jugadores.some((id) => ligaIds.has(id))));
    cont.innerHTML = tarjeta(filtro === 'mios' ? 'Sobre tus jugadores' : filtro === 'liga' ? 'Sobre tu liga' : 'Últimas noticias',
      lista.length ? lista.slice(0, 60).map((n, k) => noticiaHtml(n, k, J)).join('')
        : `<div class="vacio">${todas.length ? 'No hay noticias recientes de este grupo.' : 'No pude leer las noticias ahora.'}</div>`,
      { sub: puedeTraducir() ? 'Las que están en inglés se traducen en tu teléfono' : '' });
    traducirVisibles(cont);
  }

  $$('#filtros button').forEach((b) => b.addEventListener('click', () => {
    $$('#filtros button').forEach((x) => x.classList.toggle('activo', x === b));
    filtro = b.dataset.f;
    pintar();
  }));
  pintar();
}

function noticiaHtml(n, k, J) {
  const tags = (n.jugadores || []).slice(0, 3).map((id) => `<span class="etiqueta verde">${esc(J[id]?.nombre)}</span>`).join(' ');
  const traducible = n.idioma !== 'es';
  return `<a class="noticia" href="${esc(traducible ? enlaceTraductor(n.enlace) : n.enlace)}" target="_blank" rel="noopener">
    <b data-tr="${traducible ? k : ''}">${esc(n.titulo)}</b>
    ${n.resumen ? `<p data-tr-res="${traducible ? k : ''}">${esc(n.resumen.slice(0, 220))}</p>` : ''}
    <div class="meta"><span>${esc(n.fuente)}</span><span>${hace(n.fecha)}</span>${traducible ? '<span>traducida</span>' : ''} ${tags}</div></a>`;
}

async function traducirVisibles(cont) {
  if (!puedeTraducir()) {
    $$('[data-tr]:not([data-tr=""])', cont).forEach((b) => {
      const meta = b.parentElement.querySelector('.meta span:nth-child(3)');
      if (meta) meta.textContent = 'en inglés · toca para leerla traducida';
    });
    return;
  }
  for (const el of $$('[data-tr]:not([data-tr=""]), [data-tr-res]:not([data-tr-res=""])', cont)) {
    const t = await traducir(el.textContent);
    if (t) el.textContent = t;
  }
}

async function pintarAnalistas(cont, porNombre) {
  const seguidos = analistasGuardados();
  cont.innerHTML = `<section class="tarjeta"><header><h2>Analistas que sigues</h2><small>Desde Bluesky</small></header>
      <div class="campo" style="max-width:none"><input id="buscar" placeholder="Buscar analistas (ej. fantasy football)"><button class="boton" id="btn-buscar">Buscar</button></div>
      <div id="resultados"></div>
      <div class="chips" style="margin-top:10px">${seguidos.map((h) => `<button data-quitar="${esc(h)}" title="Dejar de seguir">@${esc(h)} ✕</button>`).join('')}</div>
      ${seguidos.length ? '' : '<p class="nota">Busca a los analistas y periodistas de NFL que te gustan y tócalos para seguirlos. Muchos se pasaron de X a Bluesky.</p>'}
    </section><div id="posts">${seguidos.length ? cargando('Leyendo a tus analistas…') : ''}</div>`;
  $$('[data-quitar]', cont).forEach((b) => b.addEventListener('click', () => {
    guardarAnalistas(seguidos.filter((h) => h !== b.dataset.quitar));
    pintarAnalistas(cont, porNombre);
  }));
  const buscar = async () => {
    const q = $('#buscar').value.trim() || 'fantasy football';
    $('#resultados').innerHTML = cargando('Buscando…');
    try {
      const lista = await buscarAnalistas(q);
      $('#resultados').innerHTML = lista.map((a) => `<button class="elegible" data-seguir="${esc(a.handle)}">
        ${a.foto ? `<img src="${esc(a.foto)}" alt="" style="width:28px;height:28px;border-radius:50%">` : ''}
        <span class="n">${esc(a.nombre)} <span class="v">@${esc(a.handle)}</span></span><span class="v">Seguir</span></button>`).join('') || '<div class="vacio">Sin resultados.</div>';
      $$('[data-seguir]', cont).forEach((b) => b.addEventListener('click', () => {
        guardarAnalistas([...analistasGuardados(), b.dataset.seguir]);
        pintarAnalistas(cont, porNombre);
      }));
    } catch {
      $('#resultados').innerHTML = '<div class="vacio">No pude buscar en Bluesky ahora.</div>';
    }
  };
  $('#btn-buscar').onclick = buscar;
  $('#buscar').addEventListener('keydown', (e) => e.key === 'Enter' && buscar());
  if (!seguidos.length) return;
  const posts = (await Promise.all(seguidos.map((h) => publicacionesAnalista(h).catch(() => []))))
    .flat().sort((a, b) => b.fecha - a.fecha).slice(0, 50);
  const J = Object.fromEntries(porNombre.map(([nombre, id]) => [id, { nombre }]));
  const marcados = marcarJugadores(posts, porNombre);
  $('#posts').innerHTML = tarjeta('Lo último', marcados.map((n, k) => noticiaHtml(n, k, J)).join('') || '<div class="vacio">Sin publicaciones recientes.</div>');
  traducirVisibles($('#posts'));
}
