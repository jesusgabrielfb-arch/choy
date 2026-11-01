// Ficha de jugador (como en Sleeper): registro de juego partido por partido y sus próximos partidos.
// Se abre tocando a cualquier jugador en la app.
import { esc, $, $$, pts, miles, etiquetaLesion, cargando } from './comun.js';
import { registro, columnas, resumen, LEYENDA, REGLAS_PPR } from '../datos/registro.js';
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
  const cols = columnas(j.pos);
  const jugadas = semanas.filter((w) => w.semana < semanaActual || (w.stats && Object.keys(w.stats).length && w.semana <= semanaActual));
  const proximas = semanas.filter((w) => w.semana >= semanaActual && !(w.stats && Object.keys(w.stats).length && w.semana < semanaActual));

  // Horarios de los próximos partidos desde el calendario
  const futuras = [...new Set(proximas.map((w) => w.semana))].slice(0, 6);
  const calendario = {};
  await Promise.all(futuras.map(async (w) => {
    const ps = await partidosSemana(temporada, w).catch(() => []);
    calendario[w] = ps.find((p) => p.local === j.equipo || p.visita === j.equipo) || null;
  }));

  const filaRegistro = (w) => {
    const s = w.stats || {};
    const jugo = Object.keys(s).length && (s.gp ?? 1) > 0;
    const rival = w.rival ? `${esc(w.rival)}` : '–';
    return `<tr class="${jugo ? '' : 'sin-jugar'}"><th>S${w.semana}</th><td class="rival">${rival}</td>
      <td class="pts-col">${jugo ? pts(puntos(s, reglas)) : 'DNP'}</td>
      ${cols.map(([, f]) => `<td>${jugo ? esc(f(s)) : ''}</td>`).join('')}</tr>`;
  };
  const totales = {};
  for (const w of jugadas) for (const [k, v] of Object.entries(w.stats || {})) totales[k] = (totales[k] || 0) + v;

  cuerpo.innerHTML = `
    <div class="ficha-resumen">
      <div><small>Partidos</small><b>${r.partidos}</b></div>
      <div><small>Pts totales</small><b>${pts(r.total)}</b></div>
      <div><small>Promedio</small><b>${pts(r.promedio)}</b></div>
      ${d ? `<div><small>Valor trade</small><b>${miles(d.valor(id))}</b></div>` : `<div><small>Mejor partido</small><b>${pts(r.mejor)}</b></div>`}
    </div>
    <div class="chips" id="ficha-tabs"><button data-t="registro" class="activo">📊 Registro de juego</button><button data-t="proximos">🗓️ Próximos partidos</button></div>
    <div id="ficha-tab-registro">
      ${jugadas.length ? `<div class="tabla-scroll"><table class="registro">
        <thead><tr><th>SEM</th><th>RIVAL</th><th class="pts-col">PTS</th>${cols.map(([t]) => `<th>${esc(t)}</th>`).join('')}</tr></thead>
        <tbody>${jugadas.map(filaRegistro).join('')}</tbody>
        <tfoot><tr><th colspan="2">Total</th><td class="pts-col">${pts(r.total)}</td>${cols.map(([, f]) => `<td>${esc(f(totales))}</td>`).join('')}</tr></tfoot>
      </table></div>
      <p class="nota" style="margin-top:8px">${esc(LEYENDA[j.pos] || '')}${reglas === REGLAS_PPR ? ' · Puntos en formato PPR' : ' · Puntos con las reglas de tu liga'}</p>`
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
  $$('#ficha-tabs button', capa).forEach((b) => (b.onclick = () => {
    $$('#ficha-tabs button', capa).forEach((x) => x.classList.toggle('activo', x === b));
    $('#ficha-tab-registro', capa).hidden = b.dataset.t !== 'registro';
    $('#ficha-tab-proximos', capa).hidden = b.dataset.t !== 'proximos';
  }));
  // Cody comenta
  if (ctx?.mascota && r.partidos) {
    import('./comun.js').then(({ codyDice }) => codyDice(document, ctx,
      `${j.nombre}: ${pts(r.promedio)} pts por partido en ${r.partidos} partido${r.partidos > 1 ? 's' : ''}. Su mejor: ${pts(r.mejor)}.`, { animo: 'Hablar' }));
  }
}
