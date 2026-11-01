// Carpeta de una liga: resumen con la mascota, equipo, mercado, waivers, lesiones y noticias.
import { esc, $, $$, filaJugador, pts, miles, cargando, tarjeta, notaCruce, etiquetaLesion } from './comun.js';
import { cargarLiga, sesion } from '../estado.js';
import { NOMBRE_PUESTO } from '../analisis/alineacion.js';
import { consejoLesion } from '../analisis/lesiones.js';
import { vistaMercado } from './mercado.js';
import { vistaNoticias } from './noticias.js';

export const PESTANAS = [
  ['resumen', '🐛', 'Resumen'],
  ['equipo', '🏈', 'Equipo'],
  ['mercado', '🔁', 'Mercado'],
  ['waivers', '📋', 'Waivers'],
  ['lesiones', '🩹', 'Lesiones'],
  ['noticias', '📰', 'Noticias'],
];

export async function vistaLiga(app, ctx, ligaId, pestana = 'resumen') {
  const u = sesion.usuario;
  app.innerHTML = `<header class="barra">
      <a class="boton-icono" href="#/" title="Volver a tus carpetas">←</a>
      <div class="titulo"><h1 id="nombre-liga">…</h1><small id="sub-liga"></small></div>
      <button class="boton-icono" id="recargar" title="Actualizar">↻</button>
    </header>
    <div id="cuerpo">${cargando('Revisando tu liga…')}</div>
    <div class="pestanas"><nav>${PESTANAS.map(([id, ico, txt]) =>
      `<a href="#/liga/${ligaId}/${id}" class="${id === pestana ? 'activa' : ''}"><span class="ico">${ico}</span>${txt}</a>`).join('')}</nav></div>`;
  $('#recargar').onclick = () => { cargarLiga(ligaId, u.id, { forzar: true }); ctx.ir(); };

  let d;
  try {
    d = await cargarLiga(ligaId, u.id);
  } catch (e) {
    console.error(e);
    $('#cuerpo').innerHTML = '<div class="tarjeta vacio">No pude cargar esta liga. Revisa tu internet e intenta de nuevo.</div>';
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
    d.sinValores && 'No pude leer los valores de trade de hoy; uso un valor aproximado.',
    d.sinProyecciones && 'Todavía no hay proyecciones para esta semana.',
    d.sinStats && 'No hay estadísticas de semanas pasadas para analizar defensas.',
  ].filter(Boolean);
  const avisoHtml = avisos.length ? `<p class="nota">ℹ️ ${avisos.join(' ')}</p>` : '';
  const vistas = { resumen, equipo, mercado: vistaMercado, waivers, lesiones, noticias: vistaNoticias };
  cuerpo.innerHTML = avisoHtml + '<div id="vista"></div>';
  await (vistas[pestana] || resumen)($('#vista'), d, ctx, ligaId);
}

// ---------------------------------------------------------------- Resumen
function resumen(el, d, ctx, ligaId) {
  const duelo = d.duelo;
  const prob = duelo ? Math.round(100 * (duelo.misProy + 1) / (duelo.misProy + duelo.suyosProy + 2)) : 50;
  el.innerHTML = `
    <section class="mascota-zona">
      <div class="escenario" id="escenario"></div>
      <div class="globo" aria-live="polite"><div id="consejo"></div>
        <div class="acciones"><button class="ir" id="ir">Ver</button><button id="otro">Otro consejo</button></div></div>
    </section>
    ${duelo ? tarjeta('Duelo de la semana', `
      <div class="duelo">
        <div><div class="nota">${esc(d.mio.nombre)}</div><div class="pts">${pts(duelo.mis)}</div><div class="proy">Proy. ${pts(duelo.misProy)}</div></div>
        <div class="vs">VS</div>
        <div><div class="nota">${esc(duelo.rival?.nombre || 'Rival')}</div><div class="pts">${pts(duelo.suyos)}</div><div class="proy">Proy. ${pts(duelo.suyosProy)}</div></div>
      </div>
      <div class="barra-prob" title="Probabilidad aproximada"><span style="width:${prob}%"></span></div>
      <p class="nota">Según las proyecciones tienes ~${prob}% de ganar.</p>`, { sub: `Semana ${d.semana}` }) : ''}
    <h3 class="seccion-titulo">Lo más importante</h3>
    ${d.consejos.map((c) => `<a class="tarjeta" style="display:block;color:inherit" href="#/liga/${ligaId}/${c.tab}">${esc(c.texto)}</a>`).join('')}
    ${tarjeta('Tabla', `<div class="lista">${[...d.equipos].sort((a, b) => {
      const [wa] = a.record.split('-').map(Number); const [wb] = b.record.split('-').map(Number);
      return (wb - wa) || (b.puntos - a.puntos);
    }).map((e, i) => `<div class="jugador"><span class="pos">${i + 1}</span>
      <div><div class="nombre">${esc(e.nombre)} ${e.esMio ? '<span class="etiqueta verde">Tú</span>' : ''}</div><div class="sub">@${esc(e.usuario)}</div></div>
      <div class="der">${esc(e.record)}<small>${pts(e.puntos)} pts</small></div></div>`).join('')}</div>`)}`;

  let i = 0;
  const mostrar = () => {
    const c = d.consejos[i % d.consejos.length];
    $('#consejo').textContent = c.texto;
    $('#ir').onclick = () => { location.hash = `#/liga/${ligaId}/${c.tab}`; };
    $('#ir').hidden = c.tab === 'resumen';
    ctx.mascota?.hablar(c.texto, c.animo === 'Hablar' ? 'Reposo' : c.animo);
  };
  ctx.ponerMascota($('#escenario')).then(mostrar);
  $('#otro').onclick = () => { i++; mostrar(); };
}

// ---------------------------------------------------------------- Equipo
function equipo(el, d) {
  const J = d.jugadores;
  const t = d.titulares;
  const filaPuesto = (s) => {
    const info = t.porId[s.id];
    const j = J[s.id];
    return filaJugador(j, {
      puesto: NOMBRE_PUESTO[s.puesto] || s.puesto,
      sub: info?.enBye ? '<b class="baja">BYE</b>' : info?.rival ? `vs ${esc(info.rival)}` : '',
      etiquetas: info?.rival && !info.enBye ? notaCruce(info.factor) : '',
      derecha: info ? pts(info.proy) : '',
      derechaSub: 'proy.',
    });
  };
  const cambios = t.poner.map((id, k) => ({ entra: id, sale: t.sentar[k] }));
  const posiciones = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].filter((p) => d.puestos.includes(p));
  el.innerHTML = `
    ${tarjeta('Cambios recomendados', cambios.length ? cambios.map((c) => `<div class="cambio">
        <span class="sube">▲</span><div style="flex:1"><b>${esc(J[c.entra]?.nombre)}</b> <span class="nota">(${pts(t.porId[c.entra]?.proy)})</span></div>
        <span class="flecha">por</span>
        <div style="flex:1;text-align:right">${c.sale ? `<b>${esc(J[c.sale]?.nombre)}</b> <span class="nota">(${pts(t.porId[c.sale]?.proy)})</span>` : '<span class="nota">puesto vacío</span>'}</div><span class="baja">▼</span>
      </div>`).join('') : '<div class="vacio">Tu alineación ya es la mejor. ¡Bien ahí!</div>',
      { sub: 'Proyección ajustada por el cruce' })}
    ${tarjeta('Alineación recomendada', `<div class="lista">${t.alineacion.titulares.map(filaPuesto).join('')}</div>`,
      { sub: `Total ${pts(t.alineacion.titulares.reduce((s, x) => s + (t.porId[x.id]?.proy || 0), 0))}` })}
    ${tarjeta('Banca', `<div class="lista">${t.alineacion.banca.map((b) => filaJugador(J[b.id], {
      sub: t.porId[b.id]?.enBye ? '<b class="baja">BYE</b>' : t.porId[b.id]?.rival ? `vs ${esc(t.porId[b.id].rival)}` : '',
      etiquetas: t.porId[b.id]?.rival ? notaCruce(t.porId[b.id].factor) : '', derecha: pts(t.porId[b.id]?.proy), derechaSub: 'proy.',
    })).join('') || '<div class="vacio">Sin banca</div>'}</div>`)}
    <section class="tarjeta"><header><h2>Analizador de defensas</h2><small>Puntos que permite a cada posición</small></header>
      <div class="chips" id="chips-pos">${posiciones.map((p, k) => `<button data-pos="${p}" class="${k === 0 ? 'activo' : ''}">${p}</button>`).join('')}</div>
      <div id="ranking"></div>
      <p class="nota">A = cruce muy fácil (la defensa permite muchos puntos) · F = defensa muy dura. Basado en las últimas semanas con las reglas de tu liga.</p>
    </section>
    ${d.defensasLibres.length ? tarjeta('Defensas libres para esta semana', `<div class="lista">${d.defensasLibres.map((x) => filaJugador(J[x.id], {
      sub: `vs ${esc(x.rival)}`, etiquetas: notaCruce(x.factor), derecha: pts(x.proy), derechaSub: 'proy.',
    })).join('')}</div>`, { sub: 'Para rotar tu DEF' }) : ''}`;

  const misPorRival = {};
  for (const id of d.mio.ids) {
    const r = d.rivalesPor[d.semana]?.[J[id]?.equipo];
    if (r) (misPorRival[r] ??= []).push(J[id]);
  }
  const pintar = (pos) => {
    const filas = d.ranking(pos);
    $('#ranking').innerHTML = filas.length ? `<div class="lista">${filas.map((f) => {
      const mios = (misPorRival[f.equipo] || []).filter((j) => j.pos === pos);
      return `<div class="jugador"><span class="pos">${f.rank}</span>
        <div><div class="nombre">${esc(f.equipo)} ${notaCruce(f.factor)}</div>
        <div class="sub">${mios.length ? 'Esta semana contra: ' + mios.map((j) => esc(j.nombre)).join(', ') : ''}</div></div>
        <div class="der">${pts(f.permite)}<small>pts/partido</small></div></div>`;
    }).join('')}</div>` : '<div class="vacio">Todavía no hay semanas jugadas para analizar.</div>';
  };
  $$('#chips-pos button').forEach((b) => b.addEventListener('click', () => {
    $$('#chips-pos button').forEach((x) => x.classList.toggle('activo', x === b));
    pintar(b.dataset.pos);
  }));
  if (posiciones[0]) pintar(posiciones[0]);
}

// ---------------------------------------------------------------- Waivers
function waivers(el, d) {
  const J = d.jugadores;
  const libres = new Set(d.libres);
  const tendencia = d.tendAdd.filter((t) => libres.has(t.player_id) && J[t.player_id]).slice(0, 12);
  el.innerHTML = `
    ${d.byes.length ? d.byes.map((a) => tarjeta(
      a.semana === d.semana ? `Bye esta semana (${a.semana})` : `Bye la semana que viene (${a.semana})`,
      `<p>${a.grave ? '<b class="baja">Te quedan puestos vacíos.</b> ' : ''}Se van: ${a.enBye.map((id) => `<b>${esc(J[id].nombre)}</b>`).join(', ')}.</p>
       ${a.sugerencias.length ? `<h3 class="seccion-titulo">Puedes agregar</h3><div class="lista">${a.sugerencias.map((s) => filaJugador(J[s.id], {
         derecha: d.proy(a.semana, s.id) != null ? pts(d.proy(a.semana, s.id)) : miles(d.valor(s.id)),
         derechaSub: d.proy(a.semana, s.id) != null ? 'proy.' : 'valor' })).join('')}</div>` : ''}
       ${a.soltar.length ? `<p class="nota">Si necesitas lugar, los que menos valen en tu banca: ${a.soltar.map((id) => esc(J[id].nombre)).join(', ')}.</p>` : ''}`,
      { clase: `alerta ${a.grave ? 'grave' : ''}` })).join('') : tarjeta('Byes', '<div class="vacio">Nadie de tu equipo se va de bye esta semana ni la que viene.</div>')}
    ${tarjeta('Lo que más agregan en Sleeper', `<div class="lista">${tendencia.map((t) => filaJugador(J[t.player_id], {
      derecha: `+${miles(t.count)}`, derechaSub: 'ligas hoy' })).join('') || '<div class="vacio">Ninguno de los más agregados está libre en tu liga.</div>'}</div>`,
      { sub: 'Libres en tu liga · últimas 24 h' })}
    ${tarjeta('Mejores libres por valor', `<div class="lista">${d.libres.slice(0, 15).map((id) => filaJugador(J[id], {
      derecha: miles(d.valor(id)), derechaSub: 'valor' })).join('')}</div>`)}`;
}

// ---------------------------------------------------------------- Lesiones
function lesiones(el, d) {
  const J = d.jugadores;
  const L = d.lesiones;
  const tit = new Set(d.mio.titulares);
  const suplenteDe = (j) => d.titulares.alineacion.banca.find((b) => b.pos === j.pos && !J[b.id]?.lesion)?.id;
  el.innerHTML = `
    ${tarjeta('Tu equipo', L.mios.length ? `<div class="lista">${L.mios.map((j) => `${filaJugador(j, {
      etiquetas: tit.has(j.id) ? '<span class="etiqueta">Titular</span>' : '' })}
      <p class="nota" style="margin:0 0 8px 54px">${esc(consejoLesion(j, { titular: tit.has(j.id), suplente: J[suplenteDe(j)]?.nombre }))}
      ${j.nota ? `<br><i>${esc(j.nota)}</i>` : ''}</p>`).join('')}</div>` : '<div class="vacio">Tu equipo está sano. 💪</div>')}
    ${tarjeta('Para guardar (stash)', L.stash.length ? `<div class="lista">${L.stash.map((j) => `${filaJugador(j, {
      derecha: miles(d.valor(j.id)), derechaSub: 'valor' })}<p class="nota" style="margin:0 0 8px 54px">${esc(j.motivo)}</p>`).join('')}</div>`
      : '<div class="vacio">No hay lesionados valiosos libres ahora.</div>', { sub: 'Libres en tu liga' })}
    ${tarjeta('Suplentes que suben', L.reemplazos.length ? `<div class="lista">${L.reemplazos.slice(0, 10).map((r) => filaJugador(r.suplente, {
      sub: `entra por ${esc(r.lesionado.nombre)} ${etiquetaLesion(r.lesionado)}` })).join('')}</div>`
      : '<div class="vacio">Nada por ahora.</div>', { sub: 'Libres en tu liga' })}
    ${tarjeta('Lesionados importantes de la liga', L.liga.length ? `<div class="lista">${L.liga.slice(0, 20).map((j) => filaJugador(j, {
      derecha: miles(d.valor(j.id)), derechaSub: 'valor' })).join('')}</div>` : '<div class="vacio">Nadie importante lesionado.</div>')}`;
}

export { lesiones, waivers, equipo, resumen };
