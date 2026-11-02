// Ficha de jugador (como en Sleeper): registro de juego partido por partido y sus próximos partidos.
// Se abre tocando a cualquier jugador en la app.
import { esc, $, $$, pts, miles, etiquetaLesion, cargando, comoLeFue, LEYENDA_PV } from './comun.js';
import { registro, secciones, resumen, REGLAS_PPR } from '../datos/registro.js';
import { partidosSemana } from '../datos/calendario.js';
import { puntos } from '../analisis/puntos.js';
import { EQUIPOS } from '../datos/equipos.js';
import { fmtHora } from '../estado.js';

function dueno(d, id) {
  if (!d) return null;
  if (d.mio?.ids.includes(id)) return 'Tuyo';
  const e = d.equipos.find((x) => x.ids.includes(id));
  return e ? e.nombre : 'Libre';
}

/**
 * opciones: { id, jugador, d (liga, opcional), temporada, semanaActual, ctx }
 */
export async function abrirFicha({ id, jugador, d = null, temporada, semanaActual, ctx }) {
  const j = jugador || d?.jugadores?.[id];
  if (!j) return;
  temporada = temporada || d?.temporada;
  semanaActual = semanaActual || d?.semanaActual || d?.semana || 1;
  const reglas = d?.reglas && Object.keys(d.reglas).length ? d.reglas : REGLAS_PPR;
  const eq = EQUIPOS[j.equipo];
  document.querySelector('.ficha-capa')?.remove();
  const capa = document.createElement('div');
  capa.className = 'ficha-capa';
  capa.innerHTML = `<div class="ficha-hoja" role="dialog" aria-label="Ficha de ${esc(j.nombre)}">
    <header class="ficha-top" style="--eq:${eq?.camiseta || '#1a2130'};--eq2:${eq?.ribete || '#555'}">
      <button class="boton-icono" data-cerrar aria-label="Cerrar">✕</button>
      <div class="ficha-id">
        <span class="pos ${esc(j.pos)}">${esc(j.pos)}</span>
        <div><h2>${esc(j.nombre)}</h2>
          <small>${esc(eq?.nombre || j.equipo || 'Sin equipo')}${j.edad ? ` · ${j.edad} años` : ''}${dueno(d, id) ? ` · ${esc(dueno(d, id))}` : ''}</small></div>
      </div>
      ${j.lesion ? `<p class="ficha-lesion">${etiquetaLesion(j)} ${j.nota ? esc(j.nota) : ''}</p>` : ''}
    </header>
    <div class="ficha-cuerpo">${cargando('Buscando su registro de juego…')}</div>
  </div>`;
  document.body.appendChild(capa);
  document.body.style.overflow = 'hidden';
  const cerrar = () => { capa.remove(); document.body.style.overflow = ''; };
  capa.addEventListener('click', (e) => { if (e.target === capa || e.target.closest('[data-cerrar]')) cerrar(); });
  const cuerpo = $('.ficha-cuerpo', capa);

  let semanas = [];
  try {
    semanas = await registro(id, temporada);
  } catch {
    cuerpo.innerHTML = '<div class="vacio">No pude traer su registro ahora. Intenta en un rato.</div>';
    return;
  }
  const r = resumen(semanas, reglas);
  const secs = secciones(j.pos);
  const tieneStats = (w) => w.stats && Object.keys(w.stats).length;
  const jugo = (w) => tieneStats(w) && (w.stats.gp ?? 1) > 0;
  const jugadas = semanas.filter((w) => w.semana < semanaActual || (tieneStats(w) && w.semana <= semanaActual));
  const proximas = semanas.filter((w) => w.semana >= semanaActual && !(tieneStats(w) && w.semana < semanaActual));

  // Horarios de los próximos partidos desde el calendario
  const futuras = [...new Set(proximas.map((w) => w.semana))].slice(0, 6);
  const calendario = {};
  await Promise.all(futuras.map(async (w) => {
    const ps = await partidosSemana(temporada, w).catch(() => []);
    calendario[w] = ps.find((p) => p.local === j.equipo || p.visita === j.equipo) || null;
  }));

  // Puntos y proyección de cada semana jugada
  const ultimaJugada = Math.max(0, ...jugadas.map((w) => w.semana));
  const info = {};
  for (const w of jugadas) {
    const hechos = jugo(w) ? puntos(w.stats, reglas) : null;
    const proy = w.proy && Object.keys(w.proy).length ? puntos(w.proy, reglas) : null;
    info[w.semana] = { w, hechos, proy, como: comoLeFue(hechos, proy) };
  }
  // Semanas sin partido suyo: si su equipo sí jugó, se lo perdió (lesión); si no, era su bye.
  const hasta = Math.max(ultimaJugada, Math.min(18, semanaActual - 1));
  // Su equipo en esa semana (por si lo cambiaron a mitad de temporada): el del partido jugado más cercano
  const equipoEn = (k) => {
    const cerca = semanas.filter((w) => w.equipo).sort((a, b) => Math.abs(a.semana - k) - Math.abs(b.semana - k) || b.semana - a.semana)[0];
    return cerca?.equipo || j.equipo;
  };
  const huecos = Array.from({ length: hasta }, (_, i) => i + 1).filter((k) => !info[k] || info[k].hechos == null);
  await Promise.all(huecos.map(async (k) => {
    const ps = await partidosSemana(temporada, k).catch(() => []);
    if (!ps.length) return; // sin calendario no sabemos: se queda como estaba
    const eq = equipoEn(k);
    const p = ps.find((x) => x.local === eq || x.visita === eq);
    if (!p) { delete info[k]; return; } // bye de verdad
    const rival = p.local === eq ? p.visita : p.local;
    info[k] = { ...(info[k] || {}), w: { semana: k, rival, fecha: p.fecha?.slice(0, 10), ...(info[k]?.w || {}) }, hechos: null, proy: info[k]?.proy ?? null, lesion: true };
  }));
  const fechaCorta = (f) => (f ? new Date(`${f}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : '');
  const textoSemana = (k) => {
    const x = info[k];
    if (!x) return `Semana ${k}: 😴 descanso (bye)`;
    if (x.hechos == null) return `Semana ${k}${x.w.rival ? ` vs ${x.w.rival}` : ''}: 🩹 no jugó${x.lesion ? ' por lesión' : ''}`;
    return `Semana ${k}${x.w.rival ? ` vs ${x.w.rival}` : ''}: ${pts(x.hechos)} pts${x.proy != null ? ` (proyectaban ${pts(x.proy)}) ${x.como.icono} ${x.como.texto}` : ''}`;
  };

  // Gráfica: una barra por semana, con una rayita en lo que le proyectaban
  const tope = Math.max(1, ...Object.values(info).flatMap((x) => [x.hechos || 0, x.proy || 0]));
  const barras = Array.from({ length: hasta }, (_, i) => i + 1).map((k) => {
    const x = info[k];
    const alto = x?.hechos != null ? Math.max(3, (100 * x.hechos) / tope) : 0;
    const raya = x?.proy != null ? (100 * x.proy) / tope : null;
    return `<button class="barra-sem" data-sem="${k}" aria-label="${esc(textoSemana(k))}">
      <span class="barra-zona">${x?.hechos != null ? `<span class="barra ${x.como.clase}" style="height:${alto}%"></span>` : `<span class="barra-vacia${x ? ' les' : ''}">${x ? '🩹' : 'BYE'}</span>`}
        ${raya != null ? `<span class="raya-proy" style="bottom:${raya}%"></span>` : ''}</span>
      <small>${k}</small></button>`;
  }).join('');

  const cajas = (st, conBrillo = true) => secs.filter((sec) => !sec.solo || sec.solo(st)).map((sec) => `
    <div class="reg-seccion sec-${sec.color || 'gris'}"><div class="reg-titulo">${sec.icono} ${esc(sec.titulo)}</div>
      <div class="reg-cajas">${sec.stats.map(([t, f, destaca]) => {
        const brilla = conBrillo && destaca?.(st);
        return `<div class="reg-caja${brilla ? ' destaca' : ''}"><b>${esc(String(f(st)))}</b><small>${esc(t)}</small>${brilla ? '<i class="estrella" aria-label="destacado">⭐</i>' : ''}</div>`;
      }).join('')}</div></div>`).join('');

  const tarjetaPartido = (k) => {
    const x = info[k];
    if (!x) return `<div class="partido-reg corto" data-sem="${k}"><span class="sem">S${k}</span><span class="nota">😴 Descanso (bye)</span></div>`;
    const er = EQUIPOS[x.w.rival];
    const cab = `<span class="sem">S${k}</span><div class="partido-rival"><b>${x.w.rival ? `vs <span class="rival-eq" style="--c1:${er?.camiseta || '#333'};--c2:${er?.ribete || '#777'}">${esc(x.w.rival)}</span>` : '–'}</b><small>${esc(fechaCorta(x.w.fecha))}</small></div>`;
    if (x.hechos == null) return `<div class="partido-reg corto lesion" data-sem="${k}">${cab}<span class="etiqueta rojo">🩹 ${x.lesion ? 'Fuera por lesión' : 'No jugó'}</span></div>`;
    return `<article class="partido-reg res-${x.como.clase.replace('pv-', '')}" data-sem="${k}">
      <header>${cab}
        <div class="partido-pts"><span class="pv ${x.como.clase}"><i>${x.como.icono}</i>${pts(x.hechos)}</span><small>${x.proy != null ? `de ${pts(x.proy)} proy.` : 'pts'}</small></div>
      </header>
      ${cajas(x.w.stats)}
    </article>`;
  };

  const totales = {};
  for (const w of jugadas) if (jugo(w)) for (const [k, v] of Object.entries(w.stats)) if (typeof v === 'number') totales[k] = (totales[k] || 0) + v;
  const tendencia = r.ultimos3 - r.promedio;

  cuerpo.innerHTML = `
    <div class="ficha-resumen">
      <div><small>Últimos 3</small><b>${pts(r.ultimos3)}</b><em class="${tendencia > 1 ? 'sube' : tendencia < -1 ? 'baja' : ''}">${tendencia > 1 ? '▲ en alza' : tendencia < -1 ? '▼ a la baja' : '= parejo'}</em></div>
      <div><small>Promedio</small><b>${pts(r.promedio)}</b><em>por partido</em></div>
      <div><small>Vs proyectado</small><b>${r.supero}/${r.conProy}</b><em>lo superó</em></div>
      ${d ? `<div><small>Valor trade</small><b>${miles(d.valor(id))}</b><em>FantasyCalc</em></div>` : `<div><small>Mejor partido</small><b>${pts(r.mejor)}</b><em>pts</em></div>`}
    </div>
    <div class="chips" id="ficha-tabs"><button data-t="registro" class="activo">📊 Registro de juego</button><button data-t="proximos">🗓️ Próximos partidos</button></div>
    <div id="ficha-tab-registro">
      ${r.partidos ? `
      <section class="tarjeta grafica-sem">
        <header><h2>📈 Puntos por semana</h2><small>Toca una barra · la rayita es lo que le proyectaban</small></header>
        <div class="barras-sem" role="group" aria-label="Puntos por semana">${barras}</div>
        <p class="tip-sem" id="tip-sem">${esc(textoSemana(hasta))}</p>
        ${LEYENDA_PV}
      </section>
      <h3 class="seccion-titulo">🎮 Partido por partido</h3>
      <div class="partidos-reg">${Array.from({ length: hasta }, (_, i) => hasta - i).map(tarjetaPartido).join('')}</div>
      <details class="tarjeta totales-reg"><summary><div><h2>🧮 Totales de la temporada</h2><small class="nota">${r.partidos} partidos · ${pts(r.total)} pts</small></div></summary>${cajas(totales, false)}</details>
      <p class="nota" style="margin:8px 4px">${reglas === REGLAS_PPR ? 'Puntos en formato PPR' : 'Puntos con las reglas de tu liga'}</p>`
      : '<div class="vacio">Todavía no ha jugado esta temporada.</div>'}
    </div>
    <div id="ficha-tab-proximos" hidden>
      ${proximas.length ? `<div class="lista">${proximas.slice(0, 8).map((w) => {
        const p = calendario[w.semana];
        const local = p ? p.local === j.equipo : null;
        const rival = p ? (local ? p.visita : p.local) : w.rival;
        const proy = w.proy && Object.keys(w.proy).length ? puntos(w.proy, reglas) : null;
        const bye = d?.byesPor?.[w.semana]?.has(j.equipo) || (!p && !w.rival && calendario[w.semana] === null);
        return `<div class="jugador"><span class="pos">S${w.semana}</span>
          <div><div class="nombre">${bye ? '😴 BYE' : `${local === false ? '@' : 'vs'} ${esc(rival || '?')}`}</div>
            <div class="sub">${p?.fecha ? esc(fmtHora(Date.parse(p.fecha))) : ''}${p?.tv ? ` · ${esc(p.tv)}` : ''}${p?.marcador ? ` · ${esc(p.detalle || '')}` : ''}</div></div>
          <div class="der">${proy != null ? pts(proy) : '–'}<small>proy.</small></div></div>`;
      }).join('')}</div>` : '<div class="vacio">No le quedan partidos esta temporada.</div>'}
    </div>`;
  // Tocar una barra: muestra cómo le fue y resalta ese partido
  $$('.barra-sem', capa).forEach((b) => (b.onclick = () => {
    $$('.barra-sem', capa).forEach((x) => x.classList.toggle('activa', x === b));
    $('#tip-sem', capa).textContent = textoSemana(Number(b.dataset.sem));
    const t = $(`.partido-reg[data-sem="${b.dataset.sem}"]`, capa);
    $$('.partido-reg', capa).forEach((x) => x.classList.toggle('resaltado', x === t));
  }));
  $(`.barra-sem[data-sem="${hasta}"]`, capa)?.classList.add('activa');
  $$('#ficha-tabs button', capa).forEach((b) => (b.onclick = () => {
    $$('#ficha-tabs button', capa).forEach((x) => x.classList.toggle('activo', x === b));
    $('#ficha-tab-registro', capa).hidden = b.dataset.t !== 'registro';
    $('#ficha-tab-proximos', capa).hidden = b.dataset.t !== 'proximos';
  }));
  // Cody comenta
  if (ctx?.mascota && r.partidos) {
    import('./comun.js').then(({ codyDice }) => codyDice(document, ctx,
      `${j.nombre}: ${pts(r.ultimos3)} pts en sus últimos 3 (${r.ultimos3 - r.promedio > 1 ? 'viene en alza 📈' : r.ultimos3 - r.promedio < -1 ? 'viene a la baja 📉' : 'parejo'}). Superó lo proyectado ${r.supero} de ${r.conProy} veces.`, { animo: 'Hablar' }));
  }
}
