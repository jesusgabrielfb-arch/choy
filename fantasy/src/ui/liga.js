// Carpeta de una liga: Inicio (plan de la semana), Equipo, Mercado, Jugadores y Noticias.
// Cody aparece arriba en cada pestaña con un comentario de esa pantalla.
import { esc, $, $$, filaJugador, pts, miles, cargando, tarjeta, notaCruce, etiquetaLesion, codyHtml, ponerCody } from './comun.js';
import { cargarLiga, sesion } from '../estado.js';
import { NOMBRE_PUESTO } from '../analisis/alineacion.js';
import { consejoLesion, ESTADOS } from '../analisis/lesiones.js';
import { vistaMercado } from './mercado.js';
import { vistaNoticias } from './noticias.js';
import * as F from './frases.js';
import { enfrentamientoHtml } from './enfrentamiento.js';
import { abrirBuscador, abrirPendiente } from './buscador.js';
import { tutorialVisto, iniciarTutorial } from './tutorial.js';
import { codyDice } from './comun.js';

export const PESTANAS = [
  ['inicio', '🐛', 'Cody'],
  ['equipo', '🏈', 'Equipo'],
  ['mercado', '🔁', 'Mercado'],
  ['jugadores', '📋', 'Jugadores'],
  ['noticias', '📰', 'Noticias'],
];

export async function vistaLiga(app, ctx, ligaId, pestana = 'inicio', semanaVista = null) {
  if (!PESTANAS.some(([id]) => id === pestana)) pestana = 'inicio';
  const u = sesion.usuario;
  const sufijo = semanaVista ? `/${semanaVista}` : '';
  app.innerHTML = `<header class="barra">
      <a class="boton-icono" href="#/" aria-label="Volver a tus ligas">←</a>
      <div class="titulo"><h1 id="nombre-liga">Cargando…</h1><small id="sub-liga"></small></div>
      <button class="boton-icono" id="buscar" aria-label="Buscar">🔍</button>
      <button class="boton-icono" id="recargar" aria-label="Actualizar">↻</button>
    </header>
    <nav class="selector-semana" id="selector-semana" aria-label="Cambiar de semana"></nav>
    ${codyHtml()}
    <div id="cuerpo">${cargando('Cody está revisando tu liga, rivales, lesiones y byes… 🐛')}</div>
    <div class="pestanas"><nav>${PESTANAS.map(([id, ico, txt]) =>
      `<a href="#/liga/${ligaId}/${id}${sufijo}" class="${id === pestana ? 'activa' : ''}"><span class="ico">${ico}</span>${txt}</a>`).join('')}</nav></div>`;
  $('#recargar').onclick = () => { cargarLiga(ligaId, u.id, { forzar: true, semana: semanaVista }); ctx.ir(); };
  ponerCody(app, ctx, 'Dame un segundo, estoy revisando tu liga…', { animo: 'Hablar' });

  let d;
  try {
    d = await cargarLiga(ligaId, u.id, { semana: semanaVista });
  } catch (e) {
    console.error(e);
    $('#cuerpo').innerHTML = '<div class="tarjeta vacio">No pude cargar esta liga. Revisa tu internet e intenta de nuevo.</div>';
    ponerCody(app, ctx, 'Uy, no pude cargar la liga. Toca ↻ para intentar otra vez.', { animo: 'Triste' });
    return;
  }
  $('#nombre-liga').textContent = d.liga.name;
  $('#sub-liga').textContent = `${d.mio ? d.mio.nombre : ''}`;
  // Selector de semana: ‹ Semana 9 ›
  const irSemana = (w) => { location.hash = `#/liga/${ligaId}/${pestana}${w === d.semanaActual ? '' : '/' + w}`; };
  const etiquetaSemana = d.esPasada ? '📜 ya jugada' : d.esFutura ? '🔮 próxima' : '🟢 en curso';
  $('#selector-semana').innerHTML = `
    <button class="chip-boton" ${d.semana <= 1 ? 'disabled' : ''} data-w="${d.semana - 1}" aria-label="Semana anterior">◀</button>
    <div class="semana-actual"><b>Semana ${d.semana}</b><small>${etiquetaSemana}</small></div>
    <button class="chip-boton" ${d.semana >= 18 ? 'disabled' : ''} data-w="${d.semana + 1}" aria-label="Semana siguiente">▶</button>
    ${d.semana !== d.semanaActual ? `<button class="chip-boton principal" data-w="${d.semanaActual}">Hoy</button>` : ''}`;
  $$('#selector-semana [data-w]').forEach((b) => (b.onclick = () => irSemana(Number(b.dataset.w))));
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
  $('#buscar').onclick = () => abrirBuscador({ d, ligaId, ctx });
  await vistas[pestana]($('#vista'), d, ctx, ligaId);
  abrirPendiente(app);
  // Tutorial: solo la primera vez (o si lo pidieron desde el buscador)
  const pedido = sessionStorage.getItem('ver-tutorial');
  if (pestana === 'inicio' && (!tutorialVisto() || pedido)) {
    sessionStorage.removeItem('ver-tutorial');
    setTimeout(() => iniciarTutorial({
      hablar: (texto, animo) => codyDice(document, ctx, texto, { animo: animo === 'Hablar' ? 'Reposo' : animo }),
    }), 600);
  }
}

const ir = (ligaId, tab) => () => {
  const w = location.hash.split('/')[4];
  location.hash = `#/liga/${ligaId}/${tab}${w ? '/' + w : ''}`;
};

function barraDuelo(dd, resaltar = false, k = 0) {
  const pa = Math.round(dd.a.prob * 100);
  return `<div class="duelo-mini ${resaltar ? 'mio' : ''}" data-duelo="${k}" role="button" tabindex="0">
    <div class="fila-duelo"><span class="eq">${esc(dd.a.equipo.nombre)}</span><b>${pts(dd.a.hechos || dd.a.puntos)}</b><span class="pct ${pa >= 50 ? 'sube' : ''}">${pa}%</span></div>
    <div class="barra-prob"><span style="width:${pa}%"></span></div>
    <div class="fila-duelo"><span class="eq">${esc(dd.b.equipo.nombre)}</span><b>${pts(dd.b.hechos || dd.b.puntos)}</b><span class="pct ${100 - pa > 50 ? 'sube' : ''}">${100 - pa}%</span></div>
  </div>`;
}

// ---------------------------------------------------------------- Inicio
function inicio(el, d, ctx, ligaId) {
  const J = d.jugadores;
  const duelo = d.duelo;
  const prob = duelo ? Math.round(duelo.prob * 100) : null;
  const tabPara = (a) => (a.tipo === 'waiver' || a.tipo === 'proxima' ? 'jugadores' : 'equipo');
  const ganancia = d.plan.reduce((s, a) => s + (a.tipo === 'alineacion' || a.tipo === 'waiver' ? Math.max(0, a.ganancia) : 0), 0);

  const accionHtml = (a, k) => `
      <details class="accion ${a.urgente ? 'urgente' : ''}">
        <summary><span class="num">${k + 1}</span><span class="tit">${esc(a.titulo)}</span>
          ${a.ganancia > 0.5 ? `<span class="etiqueta ganancia">+${a.ganancia.toFixed(1)}</span>` : a.urgente ? '<span class="etiqueta rojo">🚨</span>' : ''}</summary>
        <p>${esc(a.detalle)}</p>
        <button class="chip-boton" data-tab="${tabPara(a)}">${tabPara(a) === 'equipo' ? '📋 Ir a mi alineación' : '🔎 Ir a waivers'}</button>
      </details>`;
  const tabla = [...d.equipos].sort((a, b) => {
    const [wa] = a.record.split('-').map(Number); const [wb] = b.record.split('-').map(Number);
    return (wb - wa) || (b.puntos - a.puntos);
  });
  const miPuesto = tabla.findIndex((e) => e.esMio) + 1;
  const accesos = [
    d.duelos?.length > 1 && ['duelos', '⚔️', 'Duelos', `${d.duelos.length} esta semana`],
    !d.esPasada && (d.defensa?.mia || d.defensa?.mejorLibre) && ['defensa', '🛡️', 'Defensa', d.defensa.cambiar ? 'hay una mejor libre' : 'todo bien'],
    !d.esPasada && d.debil && ['debil', '🎯', 'Punto débil', d.debil.pos],
    ['tabla', '🏆', 'Tabla', `vas ${miPuesto}º`],
  ].filter(Boolean);

  el.innerHTML = `
    ${duelo?.detalle ? `<div id="ver-enfrentamiento">${enfrentamientoHtml(duelo.detalle, d)}</div>` : ''}
    ${d.esPasada ? '' : `
    <h2 class="seccion-titulo">✅ Lo que tienes que hacer</h2>
    <div class="plan">${d.plan.length ? d.plan.slice(0, 3).map(accionHtml).join('') : `<div class="tarjeta vacio">${esc(F.planVacio())}</div>`}</div>
    ${d.plan.length > 3 ? `<details class="mas-acciones"><summary class="chip-boton">Ver ${d.plan.length - 3} más</summary>
      <div class="plan">${d.plan.slice(3).map((a, k) => accionHtml(a, k + 3)).join('')}</div></details>` : ''}
    ${ganancia > 0.5 ? `<p class="nota" style="margin:8px 4px 0">Si haces todo sumas unos <b class="sube">+${ganancia.toFixed(1)}</b> puntos.</p>` : ''}`}
    <h2 class="seccion-titulo">Más</h2>
    <div class="accesos">${accesos.map(([id, ico, txt, sub]) => `<button class="acceso" data-panel="${id}"><span class="ico">${ico}</span><b>${txt}</b><small>${esc(sub)}</small></button>`).join('')}</div>
    <div id="panel"></div>`;

  const paneles = {
    duelos: () => tarjeta('⚔️ Duelos de la liga', d.duelos.map((dd, k) => barraDuelo(dd, dd.a.equipo.esMio, k)).join('') + '<div id="duelo-elegido"></div>',
      { sub: `${d.esPasada ? 'Resultados finales' : 'Probabilidad de ganar, en vivo'} · toca uno para verlo completo` }),
    defensa: () => tarjeta('🛡️ Defensa de la semana', `<div class="lista">
        ${d.defensa.mia ? filaJugador(J[d.defensa.mia.id], { etiquetas: '<span class="etiqueta acento">Tuya</span>', sub: esc(d.defensa.mia.razon), derecha: `#${d.defensa.mia.rank}` }) : ''}
        ${d.defensa.mejorLibre ? filaJugador(J[d.defensa.mejorLibre.id], { etiquetas: '<span class="etiqueta verde">Libre</span>', sub: esc(d.defensa.mejorLibre.razon), derecha: `#${d.defensa.mejorLibre.rank}` }) : ''}
      </div><p class="nota" style="margin-top:8px">${esc(F.defensa(d.defensa, J) || '')}</p>
      <button class="chip-boton" data-tab="equipo" style="margin-top:10px">🛡️ Ver todas</button>`),
    debil: () => tarjeta('🎯 Tu punto débil', `<p><b>${esc(d.debil.pos)}</b> · puesto ${d.debil.rank} de ${d.debil.total} en la liga</p>
      ${d.debil.sugerencia ? `<div class="opcion"><div class="linea"><span class="que">Das</span>${d.debil.sugerencia.doy.map((id) => `<b>${esc(J[id].nombre)}</b>`).join(' + ')}</div>
        <div class="linea"><span class="que">Recibes</span>${d.debil.sugerencia.recibo.map((id) => `<b>${esc(J[id].nombre)}</b>`).join(' + ')}</div>
        <p class="nota">Trade justo con ${esc(d.debil.sugerencia.equipo.nombre)}</p></div>
        <button class="chip-boton principal" data-tab="mercado">🤝 Armar este trade</button>`
        : '<p class="nota" style="margin-top:6px">Estás bien en todas las posiciones.</p>'}`),
    tabla: () => tarjeta('🏆 Tabla de la liga', `<div class="lista">${tabla.map((e, k) => `<div class="jugador"><span class="pos">${k + 1}</span>
      <div style="min-width:0"><div class="nombre"><span class="txt">${esc(e.nombre)}</span>${e.esMio ? '<span class="etiqueta acento">Tú</span>' : ''}</div><div class="sub">@${esc(e.usuario)}</div></div>
      <div class="der">${esc(e.record)}<small>${pts(e.puntos)} pts</small></div></div>`).join('')}</div>`),
  };
  const conectarTabs = (raiz) => $$('[data-tab]', raiz).forEach((b) => (b.onclick = () => {
    if (b.dataset.tab === 'mercado' && d.debil?.sugerencia) {
      sessionStorage.setItem('trade-sugerido', JSON.stringify({ ...d.debil.sugerencia, equipo: d.debil.sugerencia.equipo.rosterId }));
    }
    ir(ligaId, b.dataset.tab)();
  }));
  $$('.acceso', el).forEach((b) => (b.onclick = () => {
    const abierto = b.classList.contains('activo');
    $$('.acceso', el).forEach((x) => x.classList.remove('activo'));
    $('#panel', el).innerHTML = abierto ? '' : paneles[b.dataset.panel]();
    if (!abierto) {
      b.classList.add('activo');
      conectarTabs($('#panel', el));
      $$('[data-duelo]', el).forEach((x) => (x.onclick = () => {
        $('#duelo-elegido', el).innerHTML = enfrentamientoHtml(d.duelos[Number(x.dataset.duelo)], d);
        $('#duelo-elegido', el).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
      $('#panel', el).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }));
  if (d.esPasada && d.duelos?.length) $('[data-panel="duelos"]', el)?.click();
  conectarTabs(el);

  // Cody saluda, resume el plan y luego va dando cada consejo
  const urgentes = d.plan.filter((a) => a.urgente).length;
  const intro = d.esPasada ? {
    texto: duelo && (duelo.mis || duelo.suyos) && duelo.mis !== duelo.suyos ? (duelo.prob >= 0.5 ? `🏆 La semana ${d.semana} la ganaste ${pts(duelo.mis)} a ${pts(duelo.suyos)}. ¡Así se juega!`
      : `😓 La semana ${d.semana} se perdió ${pts(duelo.mis)} a ${pts(duelo.suyos)}. Pasado pisado: vamos por la próxima.`)
      : `Esta es la semana ${d.semana}, ya jugada.`,
    animo: duelo && duelo.mis > duelo.suyos ? 'Touchdown' : duelo && duelo.mis < duelo.suyos ? 'Triste' : 'Hablar', tab: 'inicio',
  } : {
    texto: `${F.saludo(sesion.usuario?.display || '')} ${d.esFutura ? `Mirando la semana ${d.semana}: ` : ''}${d.plan.length ? F.resumenPlan(d.plan.length, urgentes) : F.planVacio()}`,
    animo: urgentes ? 'Sorpresa' : prob != null && prob >= 70 ? 'Touchdown' : prob != null && prob >= 55 ? 'Feliz' : prob != null && prob < 40 ? 'Triste' : 'Saludar',
    tab: 'inicio',
  };
  const consejos = d.esPasada ? [intro] : [intro, ...d.consejos];
  let i = 0;
  const decir = () => {
    const c = consejos[i % consejos.length];
    ponerCody(document, ctx, c.texto, {
      animo: c.animo,
      acciones: [
        ...(c.tab !== 'inicio' ? [{ texto: '👀 Ver', principal: true, alHacer: ir(ligaId, c.tab) }] : []),
        ...(consejos.length > 1 ? [{ texto: i === 0 ? '💬 ¿Qué hago?' : `💬 Siguiente (${i % consejos.length}/${consejos.length - 1})`, principal: i === 0, alHacer: () => { i++; decir(); } }] : []),
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
    ${tarjeta('📋 Alineación recomendada', `<div class="lista">${t.alineacion.titulares.map((s) => {
      const j = J[s.id];
      const cambia = s.id && !tit.has(s.id);
      return filaJugador(j, { puesto: NOMBRE_PUESTO[s.puesto] || s.puesto, ...infoFila(s.id),
        etiquetas: `${infoFila(s.id).etiquetas || ''}${cambia ? '<span class="etiqueta verde">Entra</span>' : ''}` });
    }).join('')}</div>`, { sub: 'Proyección ajustada por la defensa rival (A = fácil, F = difícil)' })}
    ${tarjeta('🪑 Banca', `<div class="lista">${t.alineacion.banca.map((b) => filaJugador(J[b.id], {
      ...infoFila(b.id), etiquetas: `${infoFila(b.id).etiquetas || ''}${tit.has(b.id) ? '<span class="etiqueta rojo">Sale</span>' : ''}` })).join('') || '<div class="vacio">Sin banca</div>'}</div>`, { plegable: true, sub: `${t.alineacion.banca.length} jugadores` })}
    ${d.lesiones.mios.length ? tarjeta('🩹 Lesionados de tu equipo', `<div class="lista">${d.lesiones.mios.map((j) => filaJugador(j, {
      etiquetas: tit.has(j.id) ? '<span class="etiqueta">Titular</span>' : '',
      consejo: esc(consejoLesion(j, { titular: tit.has(j.id), suplente: J[suplenteDe(j)]?.nombre })) })).join('')}</div>`) : ''}
    <details class="tarjeta"><summary><div><h2>🔬 Analizador de defensas</h2><small class="nota">Quién le permite más puntos a cada posición</small></div></summary>
      <div class="chips" id="chips-pos">${posiciones.map((p, k) => `<button data-pos="${p}" class="${k === 0 ? 'activo' : ''}">${p}</button>`).join('')}</div>
      <div id="ranking"></div>
    </details>
    <details class="tarjeta" id="defensas-semana"><summary><div><h2>🛡️ Mejores defensas de la semana</h2><small class="nota">Según la ofensiva rival que enfrentan</small></div></summary>
      <div class="chips" id="chips-sem">${[d.semana, d.semana + 1].filter((w) => w <= 18).map((w, k) => `<button data-sem="${w}" class="${k === 0 ? 'activo' : ''}">${k === 0 ? '📅 Esta semana' : '⏭️ Semana ' + w}</button>`).join('')}</div>
      <div id="lista-def"></div>
      <p class="nota" style="margin-top:8px">${esc(F.defensa(d.defensa, J) || '')}</p>
    </details>`;

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

  const etiquetaDueno = (x) => (x.dueno === 'mia' ? '<span class="etiqueta acento">Tuya</span>'
    : x.dueno === 'libre' ? '<span class="etiqueta verde">✅ Libre</span>' : `<span class="etiqueta">${esc(x.dueno)}</span>`);
  const pintarDef = (w) => {
    const lista = d.defensasSemana(w).slice(0, 12);
    $('#lista-def').innerHTML = lista.length ? `<div class="lista">${lista.map((x) => filaJugador(J[x.id], {
      puesto: `#${x.rank}`, etiquetas: notaCruce(x.factor) + etiquetaDueno(x), sub: esc(x.razon),
      derecha: x.proy != null ? pts(x.proy) : '', derechaSub: x.proy != null ? 'proy.' : '' })).join('')}</div>`
      : '<div class="vacio">Todavía no hay calendario para esa semana.</div>';
  };
  $$('#chips-sem button').forEach((b) => b.addEventListener('click', () => {
    $$('#chips-sem button').forEach((x) => x.classList.toggle('activo', x === b));
    pintarDef(Number(b.dataset.sem));
  }));
  pintarDef(d.semana);

  const texto = cambios.length
    ? `${cambios[0].titulo}. ${cambios[0].detalle}${cambios.length > 1 ? ` Y ${cambios.length - 1} cambio${cambios.length > 2 ? 's' : ''} más: los marqué con "Entra" y "Sale".` : ''}`
    : `${F.planVacio()} Las letras te dicen si el rival es fácil (A) o difícil (F). ${F.defensa(d.defensa, J) || ''}`;
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
    ${waivers.length ? tarjeta('➕ Agrega esta semana', `<div class="lista">${waivers.filter((a) => a.entra).map((a) => filaJugador(J[a.entra], {
      etiquetas: a.ganancia > 0.5 && a.tipo === 'waiver' ? `<span class="etiqueta ganancia">+${a.ganancia.toFixed(1)}</span>` : '<span class="etiqueta acento">Bye</span>',
      derecha: pts(d.proyAjustada(a.tipo === 'proxima' ? d.semana + 1 : d.semana, a.entra)), derechaSub: 'proy.',
      consejo: a.soltar ? `Suelta a <b>${esc(J[a.soltar]?.nombre)}</b>` : esc(a.tipo === 'proxima' ? `Para la semana ${d.semana + 1}` : ''),
    })).join('')}</div>`, { sub: 'Lo que más suma a tu alineación' }) : ''}
    ${d.byes.length ? d.byes.map((a) => tarjeta(a.semana === d.semana ? `😴 Byes de esta semana` : `😴 Byes de la semana ${a.semana}`,
      `<div class="lista">${a.enBye.map((id) => filaJugador(J[id], { etiquetas: a.titularesAfectados.includes(id) ? '<span class="etiqueta naranja">Titular</span>' : '' })).join('')}</div>`,
      { plegable: true, abierta: a.semana === d.semana })).join('') : ''}
    <details class="tarjeta"><summary><div><h2>🔎 Mejores libres</h2><small class="nota">Por proyección de esta semana</small></div></summary>
      <div class="chips" id="chips-libres">${posMias.map((p, k) => `<button data-pos="${p}" class="${k === 0 ? 'activo' : ''}">${p}</button>`).join('')}</div>
      <div id="libres"></div></details>
    ${tarjeta('🔥 Lo que más agregan en Sleeper', `<div class="lista">${tendencia.map((t) => filaJugador(J[t.player_id], {
      derecha: `+${miles(t.count)}`, derechaSub: 'ligas (24 h)' })).join('') || '<div class="vacio">Ninguno de los más agregados está libre en tu liga.</div>'}</div>`, { plegable: true })}
    ${tarjeta('🐿️ Para guardar (stash)', L.stash.length ? `<div class="lista">${L.stash.map((j) => filaJugador(j, {
      derecha: miles(d.valor(j.id)), derechaSub: 'valor', consejo: esc(j.motivo) })).join('')}</div>`
      : '<div class="vacio">No hay lesionados valiosos libres ahora.</div>', { sub: 'Lesionados libres que valen mucho cuando vuelvan', plegable: true })}
    ${tarjeta('⬆️ Suplentes que suben', L.reemplazos.length ? `<div class="chips" id="chips-sup">
        <button data-f="libres" class="activo">✅ Libres (${L.reemplazos.filter((r) => r.libre).length})</button>
        <button data-f="todos">Todos (${L.reemplazos.length})</button></div><div id="lista-sup"></div>`
      : '<div class="vacio">Nada por ahora.</div>', { sub: 'Heredan el puesto de un titular lesionado o en duda', plegable: true })}
    ${tarjeta('🏥 Lesionados importantes de la liga', L.liga.length ? `<div class="lista">${L.liga.slice(0, 20).map((j) => filaJugador(j, {
      derecha: miles(d.valor(j.id)), derechaSub: 'valor' })).join('')}</div>` : '<div class="vacio">Nadie importante lesionado.</div>', { plegable: true })}`;

  const pintarSup = (filtro) => {
    const lista = L.reemplazos.filter((r) => filtro === 'todos' || r.libre).slice(0, 25);
    $('#lista-sup').innerHTML = lista.length ? `<div class="lista">${lista.map((r) => filaJugador(r.suplente, {
      sub: `entra por ${esc(r.lesionado.nombre)} (${esc(ESTADOS[r.lesionado.lesion]?.texto || r.lesionado.lesion)})`,
      etiquetas: r.libre ? '<span class="etiqueta verde">✅ Libre</span>' : r.mio ? '<span class="etiqueta acento">Tuyo</span>' : '',
      derecha: d.proyAjustada(d.semana, r.suplente.id) ? pts(d.proyAjustada(d.semana, r.suplente.id)) : '',
      derechaSub: r.texto,
    })).join('')}</div>` : '<div class="vacio">Ninguno libre ahora. Toca "Todos" para ver los demás.</div>';
  };
  if ($('#chips-sup')) {
    $$('#chips-sup button').forEach((b) => b.addEventListener('click', () => {
      $$('#chips-sup button').forEach((x) => x.classList.toggle('activo', x === b));
      pintarSup(b.dataset.f);
    }));
    pintarSup('libres');
  }

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
