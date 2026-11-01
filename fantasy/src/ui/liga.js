// Carpeta de una liga: Inicio (plan de la semana), Equipo, Mercado, Jugadores y Noticias.
// Cody aparece arriba en cada pestaña con un comentario de esa pantalla.
import { esc, $, $$, filaJugador, pts, miles, cargando, tarjeta, notaCruce, etiquetaLesion, codyHtml, ponerCody } from './comun.js';
import { cargarLiga, sesion } from '../estado.js';
import { NOMBRE_PUESTO } from '../analisis/alineacion.js';
import { consejoLesion } from '../analisis/lesiones.js';
import { vistaMercado } from './mercado.js';
import { vistaNoticias } from './noticias.js';

export const PESTANAS = [
  ['inicio', '🐛', 'Inicio'],
  ['equipo', '🏈', 'Equipo'],
  ['mercado', '🔁', 'Mercado'],
  ['jugadores', '📋', 'Jugadores'],
  ['noticias', '📰', 'Noticias'],
];

export async function vistaLiga(app, ctx, ligaId, pestana = 'inicio') {
  if (!PESTANAS.some(([id]) => id === pestana)) pestana = 'inicio';
  const u = sesion.usuario;
  app.innerHTML = `<header class="barra">
      <a class="boton-icono" href="#/" aria-label="Volver a tus ligas">←</a>
      <div class="titulo"><h1 id="nombre-liga">Cargando…</h1><small id="sub-liga"></small></div>
      <button class="boton-icono" id="recargar" aria-label="Actualizar">↻</button>
    </header>
    ${codyHtml()}
    <div id="cuerpo">${cargando('Revisando tu liga, rivales, lesiones y byes…')}</div>
    <div class="pestanas"><nav>${PESTANAS.map(([id, ico, txt]) =>
      `<a href="#/liga/${ligaId}/${id}" class="${id === pestana ? 'activa' : ''}"><span class="ico">${ico}</span>${txt}</a>`).join('')}</nav></div>`;
  $('#recargar').onclick = () => { cargarLiga(ligaId, u.id, { forzar: true }); ctx.ir(); };
  ponerCody(app, ctx, 'Dame un segundo, estoy revisando tu liga…', { animo: 'Hablar' });

  let d;
  try {
    d = await cargarLiga(ligaId, u.id);
  } catch (e) {
    console.error(e);
    $('#cuerpo').innerHTML = '<div class="tarjeta vacio">No pude cargar esta liga. Revisa tu internet e intenta de nuevo.</div>';
    ponerCody(app, ctx, 'Uy, no pude cargar la liga. Toca ↻ para intentar otra vez.', { animo: 'Triste' });
    return;
  }
  $('#nombre-liga').textContent = d.liga.name;
  $('#sub-liga').textContent = `Semana ${d.semana}${d.mio ? ' · ' + d.mio.nombre : ''}`;
  const cuerpo = $('#cuerpo');
  if (!d.mio) {
    cuerpo.innerHTML = '<div class="tarjeta vacio">No encontré tu equipo en esta liga.</div>';
    return;
  }
  const avisos = [
    d.sinValores && 'No pude leer los valores de trade de hoy; uso uno aproximado.',
    d.sinProyecciones && 'Todavía no hay proyecciones para esta semana.',
  ].filter(Boolean);
  cuerpo.innerHTML = (avisos.length ? `<p class="nota" style="margin:4px 4px 0">ℹ️ ${avisos.join(' ')}</p>` : '') + '<div id="vista"></div>';
  const vistas = { inicio, equipo, mercado: vistaMercado, jugadores, noticias: vistaNoticias };
  await vistas[pestana]($('#vista'), d, ctx, ligaId);
}

const ir = (ligaId, tab) => () => { location.hash = `#/liga/${ligaId}/${tab}`; };

// ---------------------------------------------------------------- Inicio
function inicio(el, d, ctx, ligaId) {
  const J = d.jugadores;
  const duelo = d.duelo;
  const prob = duelo ? Math.round(100 * (duelo.misProy + 1) / (duelo.misProy + duelo.suyosProy + 2)) : null;
  const tabPara = (a) => (a.tipo === 'waiver' || a.tipo === 'proxima' ? 'jugadores' : 'equipo');
  const ganancia = d.plan.reduce((s, a) => s + (a.tipo === 'alineacion' || a.tipo === 'waiver' ? Math.max(0, a.ganancia) : 0), 0);

  el.innerHTML = `
    ${duelo ? `<section class="tarjeta">
      <div class="duelo">
        <div class="lado-duelo"><div class="eq">${esc(d.mio.nombre)}</div><div class="pts">${pts(duelo.mis)}</div><div class="proy">Proy. ${pts(duelo.misProy)}</div></div>
        <div class="vs">VS</div>
        <div class="lado-duelo"><div class="eq">${esc(duelo.rival?.nombre || 'Rival')}</div><div class="pts">${pts(duelo.suyos)}</div><div class="proy">Proy. ${pts(duelo.suyosProy)}</div></div>
      </div>
      <div class="barra-prob"><span style="width:${prob}%"></span></div>
      <p class="nota" style="margin-top:8px">Tienes ~${prob}% de ganar esta semana${ganancia > 0.5 ? `. Con el plan sumas unos <b class="sube">+${ganancia.toFixed(1)}</b> puntos` : ''}.</p>
    </section>` : ''}
    <h2 class="seccion-titulo">Tu plan de la semana ${d.semana}</h2>
    <div class="plan">${d.plan.length ? d.plan.map((a, i) => `
      <article class="accion ${a.urgente ? 'urgente' : ''}">
        <div class="num">${i + 1}</div>
        <div><h3>${esc(a.titulo)}</h3><p>${esc(a.detalle)}</p>
          <div class="chips-accion">
            ${a.urgente ? '<span class="etiqueta rojo">Urgente</span>' : ''}
            ${a.ganancia > 0.5 ? `<span class="etiqueta ganancia">+${a.ganancia.toFixed(1)} pts</span>` : ''}
            <button class="chip-boton" data-tab="${tabPara(a)}">Ver ${tabPara(a) === 'equipo' ? 'alineación' : 'waivers'}</button>
          </div></div>
      </article>`).join('') : '<div class="tarjeta vacio">Nada que cambiar: tu alineación ya es la mejor posible. 💪</div>'}</div>
    ${d.debil ? `<h2 class="seccion-titulo">Tu punto débil</h2>
      <section class="tarjeta">
        <p><b>${esc(d.debil.pos)}</b> · puesto ${d.debil.rank} de ${d.debil.total} en la liga</p>
        ${d.debil.sugerencia ? `<p class="nota" style="margin-top:6px">Trade justo para mejorarlo con <b>${esc(d.debil.sugerencia.equipo.nombre)}</b>:</p>
          <div class="opcion"><div class="linea"><span class="que">Das</span>${d.debil.sugerencia.doy.map((id) => `<b>${esc(J[id].nombre)}</b>`).join(' + ')}</div>
          <div class="linea"><span class="que">Recibes</span>${d.debil.sugerencia.recibo.map((id) => `<b>${esc(J[id].nombre)}</b>`).join(' + ')}</div></div>
          <button class="chip-boton principal" data-tab="mercado">Armar este trade</button>`
          : '<p class="nota" style="margin-top:6px">Estás bien en todas las posiciones comparado con la liga.</p>'}
      </section>` : ''}
    ${tarjeta('Tabla de la liga', `<div class="lista">${[...d.equipos].sort((a, b) => {
      const [wa] = a.record.split('-').map(Number); const [wb] = b.record.split('-').map(Number);
      return (wb - wa) || (b.puntos - a.puntos);
    }).map((e, i) => `<div class="jugador"><span class="pos">${i + 1}</span>
      <div style="min-width:0"><div class="nombre"><span class="txt">${esc(e.nombre)}</span>${e.esMio ? '<span class="etiqueta acento">Tú</span>' : ''}</div><div class="sub">@${esc(e.usuario)}</div></div>
      <div class="der">${esc(e.record)}<small>${pts(e.puntos)} pts</small></div></div>`).join('')}</div>`, { plegable: true })}`;

  $$('[data-tab]', el).forEach((b) => (b.onclick = () => {
    if (b.dataset.tab === 'mercado' && d.debil?.sugerencia) {
      sessionStorage.setItem('trade-sugerido', JSON.stringify({ ...d.debil.sugerencia, equipo: d.debil.sugerencia.equipo.rosterId }));
    }
    ir(ligaId, b.dataset.tab)();
  }));

  let i = 0;
  const decir = () => {
    const c = d.consejos[i % d.consejos.length];
    ponerCody(document, ctx, c.texto, {
      animo: c.animo,
      acciones: [
        ...(c.tab !== 'inicio' ? [{ texto: 'Ver', principal: true, alHacer: ir(ligaId, c.tab) }] : []),
        ...(d.consejos.length > 1 ? [{ texto: `Siguiente (${(i % d.consejos.length) + 1}/${d.consejos.length})`, alHacer: () => { i++; decir(); } }] : []),
      ],
    });
  };
  decir();
}

// ---------------------------------------------------------------- Equipo
function equipo(el, d, ctx) {
  const J = d.jugadores;
  const t = d.titulares;
  const semana = d.semana;
  const infoFila = (id) => {
    const info = t.porId[id];
    if (!info) return {};
    return {
      sub: info.enBye ? '<b class="baja">BYE</b>' : info.rival ? `vs ${esc(info.rival)}` : '',
      etiquetas: info.rival && !info.enBye ? notaCruce(info.factor) : '',
      derecha: info.enBye || info.fuera ? '0.0' : pts(d.proyAjustada(semana, id)),
      derechaSub: 'proy.',
    };
  };
  const tit = new Set(d.mio.titulares);
  const suplenteDe = (j) => t.alineacion.banca.find((b) => b.pos === j.pos && !J[b.id]?.lesion)?.id;
  const posiciones = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].filter((p) => d.puestos.includes(p));
  const cambios = d.plan.filter((a) => a.tipo === 'alineacion');

  el.innerHTML = `
    ${tarjeta('Alineación recomendada', `<div class="lista">${t.alineacion.titulares.map((s) => {
      const j = J[s.id];
      const cambia = s.id && !tit.has(s.id);
      return filaJugador(j, { puesto: NOMBRE_PUESTO[s.puesto] || s.puesto, ...infoFila(s.id),
        etiquetas: `${infoFila(s.id).etiquetas || ''}${cambia ? '<span class="etiqueta verde">Entra</span>' : ''}` });
    }).join('')}</div>`, { sub: 'Proyección ajustada por la defensa rival (A = fácil, F = difícil)' })}
    ${tarjeta('Banca', `<div class="lista">${t.alineacion.banca.map((b) => filaJugador(J[b.id], {
      ...infoFila(b.id), etiquetas: `${infoFila(b.id).etiquetas || ''}${tit.has(b.id) ? '<span class="etiqueta rojo">Sale</span>' : ''}` })).join('') || '<div class="vacio">Sin banca</div>'}</div>`)}
    ${d.lesiones.mios.length ? tarjeta('Lesionados de tu equipo', `<div class="lista">${d.lesiones.mios.map((j) => filaJugador(j, {
      etiquetas: tit.has(j.id) ? '<span class="etiqueta">Titular</span>' : '',
      consejo: esc(consejoLesion(j, { titular: tit.has(j.id), suplente: J[suplenteDe(j)]?.nombre })) })).join('')}</div>`) : ''}
    <details class="tarjeta"><summary><div><h2>Analizador de defensas</h2><small class="nota">Quién le permite más puntos a cada posición</small></div></summary>
      <div class="chips" id="chips-pos">${posiciones.map((p, k) => `<button data-pos="${p}" class="${k === 0 ? 'activo' : ''}">${p}</button>`).join('')}</div>
      <div id="ranking"></div>
    </details>
    ${d.defensasLibres.length ? tarjeta('Defensas libres para rotar', `<div class="lista">${d.defensasLibres.map((x) => filaJugador(J[x.id], {
      sub: `vs ${esc(x.rival)}`, etiquetas: notaCruce(x.factor), derecha: pts(x.proy), derechaSub: 'proy.' })).join('')}</div>`, { plegable: true }) : ''}`;

  const misPorRival = {};
  for (const id of d.mio.ids) {
    const r = d.rivalesPor[semana]?.[J[id]?.equipo];
    if (r) (misPorRival[r] ??= []).push(J[id]);
  }
  const pintar = (pos) => {
    const filas = d.ranking(pos);
    $('#ranking').innerHTML = filas.length ? `<div class="lista">${filas.map((f) => {
      const mios = (misPorRival[f.equipo] || []).filter((j) => j.pos === pos);
      return `<div class="jugador"><span class="pos">${f.rank}</span>
        <div style="min-width:0"><div class="nombre"><span class="txt">${esc(f.equipo)}</span>${notaCruce(f.factor)}</div>
        <div class="sub">${mios.length ? 'Esta semana: ' + mios.map((j) => esc(j.nombre)).join(', ') : ''}</div></div>
        <div class="der">${pts(f.permite)}<small>pts/partido</small></div></div>`;
    }).join('')}</div>` : '<div class="vacio">Todavía no hay semanas jugadas para analizar.</div>';
  };
  $$('#chips-pos button').forEach((b) => b.addEventListener('click', () => {
    $$('#chips-pos button').forEach((x) => x.classList.toggle('activo', x === b));
    pintar(b.dataset.pos);
  }));
  if (posiciones[0]) pintar(posiciones[0]);

  const texto = cambios.length
    ? `${cambios[0].titulo}. ${cambios[0].detalle}${cambios.length > 1 ? ` Y ${cambios.length - 1} cambio${cambios.length > 2 ? 's' : ''} más: los marqué con "Entra" y "Sale".` : ''}`
    : 'Tu alineación ya es la mejor que puedes poner. Las letras te dicen si el rival es fácil (A) o difícil (F).';
  ponerCody(document, ctx, texto, { animo: cambios.some((c) => c.urgente) ? 'Sorpresa' : cambios.length ? 'Hablar' : 'Cool' });
}

// ---------------------------------------------------------------- Jugadores (waivers, byes, lesiones)
function jugadores(el, d, ctx) {
  const J = d.jugadores;
  const libres = new Set(d.libres);
  const tendencia = d.tendAdd.filter((t) => libres.has(t.player_id) && J[t.player_id]).slice(0, 10);
  const L = d.lesiones;
  const vistos = new Set();
  const waivers = d.plan.filter((a) => (a.tipo === 'waiver' || a.tipo === 'proxima') && !(a.entra && vistos.has(a.entra)) && (vistos.add(a.entra) || true));
  const posMias = ['QB', 'RB', 'WR', 'TE'].filter((p) => d.puestos.includes(p));
  el.innerHTML = `
    ${waivers.length ? tarjeta('Agrega esta semana', `<div class="lista">${waivers.filter((a) => a.entra).map((a) => filaJugador(J[a.entra], {
      etiquetas: a.ganancia > 0.5 && a.tipo === 'waiver' ? `<span class="etiqueta ganancia">+${a.ganancia.toFixed(1)}</span>` : '<span class="etiqueta acento">Bye</span>',
      derecha: pts(d.proyAjustada(a.tipo === 'proxima' ? d.semana + 1 : d.semana, a.entra)), derechaSub: 'proy.',
      consejo: a.soltar ? `Suelta a <b>${esc(J[a.soltar]?.nombre)}</b>` : esc(a.tipo === 'proxima' ? `Para la semana ${d.semana + 1}` : ''),
    })).join('')}</div>`, { sub: 'Lo que más suma a tu alineación' }) : ''}
    ${d.byes.length ? d.byes.map((a) => tarjeta(a.semana === d.semana ? `Byes de esta semana` : `Byes de la semana ${a.semana}`,
      `<div class="lista">${a.enBye.map((id) => filaJugador(J[id], { etiquetas: a.titularesAfectados.includes(id) ? '<span class="etiqueta naranja">Titular</span>' : '' })).join('')}</div>`,
      { plegable: true, abierta: a.semana === d.semana })).join('') : ''}
    <section class="tarjeta"><header><h2>Mejores libres</h2><small>Por proyección de esta semana</small></header>
      <div class="chips" id="chips-libres">${posMias.map((p, k) => `<button data-pos="${p}" class="${k === 0 ? 'activo' : ''}">${p}</button>`).join('')}</div>
      <div id="libres"></div></section>
    ${tarjeta('Lo que más agregan en Sleeper', `<div class="lista">${tendencia.map((t) => filaJugador(J[t.player_id], {
      derecha: `+${miles(t.count)}`, derechaSub: 'ligas (24 h)' })).join('') || '<div class="vacio">Ninguno de los más agregados está libre en tu liga.</div>'}</div>`, { plegable: true })}
    ${tarjeta('Para guardar (stash)', L.stash.length ? `<div class="lista">${L.stash.map((j) => filaJugador(j, {
      derecha: miles(d.valor(j.id)), derechaSub: 'valor', consejo: esc(j.motivo) })).join('')}</div>`
      : '<div class="vacio">No hay lesionados valiosos libres ahora.</div>', { sub: 'Lesionados libres que valen mucho cuando vuelvan', plegable: true })}
    ${tarjeta('Suplentes que suben', L.reemplazos.length ? `<div class="lista">${L.reemplazos.slice(0, 10).map((r) => filaJugador(r.suplente, {
      sub: `entra por ${esc(r.lesionado.nombre)}`, etiquetas: etiquetaLesion(r.lesionado) })).join('')}</div>`
      : '<div class="vacio">Nada por ahora.</div>', { sub: 'Libres que heredan el puesto de un titular lesionado', plegable: true })}
    ${tarjeta('Lesionados importantes de la liga', L.liga.length ? `<div class="lista">${L.liga.slice(0, 20).map((j) => filaJugador(j, {
      derecha: miles(d.valor(j.id)), derechaSub: 'valor' })).join('')}</div>` : '<div class="vacio">Nadie importante lesionado.</div>', { plegable: true })}`;

  const pintar = (pos) => {
    const lista = d.libres.filter((id) => J[id].pos === pos)
      .map((id) => ({ id, p: d.proyAjustada(d.semana, id) }))
      .sort((a, b) => b.p - a.p || d.valor(b.id) - d.valor(a.id)).slice(0, 8);
    $('#libres').innerHTML = `<div class="lista">${lista.map((x) => filaJugador(J[x.id], {
      sub: d.rivalesPor[d.semana]?.[J[x.id].equipo] ? `vs ${esc(d.rivalesPor[d.semana][J[x.id].equipo])}` : 'BYE',
      derecha: pts(x.p), derechaSub: 'proy.' })).join('') || '<div class="vacio">Sin jugadores libres.</div>'}</div>`;
  };
  $$('#chips-libres button').forEach((b) => b.addEventListener('click', () => {
    $$('#chips-libres button').forEach((x) => x.classList.toggle('activo', x === b));
    pintar(b.dataset.pos);
  }));
  if (posMias[0]) pintar(posMias[0]);

  const w = waivers.find((a) => a.tipo === 'waiver');
  const texto = w ? `${w.titulo}. ${w.detalle}`
    : waivers[0] ? `${waivers[0].titulo}. ${waivers[0].detalle}`
      : L.stash[0] ? `Nada urgente en waivers. Si te sobra un lugar, guarda a ${L.stash[0].nombre}: vale mucho cuando vuelva.`
        : 'Nada urgente en waivers esta semana. Tu equipo está cubierto.';
  ponerCody(document, ctx, texto, { animo: w ? 'Cool' : 'Hablar' });
}

export { inicio, equipo, jugadores };
