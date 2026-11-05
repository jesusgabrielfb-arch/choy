// Calculadora de trades: medidor de justicia entre dos lados con CUALQUIER jugador de la liga
// (de cualquier equipo o libres). Si eliges el equipo de cada lado, también dice cómo le cambia la alineación.
import { esc, $, $$, miles, pts } from './comun.js';
import { evaluarTrade } from '../analisis/trades.js';

const sinAcentos = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * d: liga cargada. inicial (opcional): { a: { equipo, da }, b: { equipo, da } }
 */
export function abrirCalculadora({ d, inicial = null }) {
  const J = d.jugadores;
  const posLiga = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].filter((p) => d.puestos.includes(p) || ['RB', 'WR', 'TE'].includes(p)));
  const duenoDe = {};
  for (const e of d.equipos) for (const id of e.ids) duenoDe[id] = e;
  const equipoPor = (rid) => d.equipos.find((e) => String(e.rosterId) === String(rid)) || null;
  // Todos los jugadores que se pueden elegir: los de la liga y los libres que valen algo
  const todos = Object.values(J).filter((j) => posLiga.has(j.pos) && (duenoDe[j.id] || (j.equipo && d.valor(j.id) > 300)))
    .sort((x, y) => d.valor(y.id) - d.valor(x.id));

  const lado = (k) => ({
    equipo: inicial?.[k]?.equipo ?? (k === 'a' ? d.mio?.rosterId ?? '' : ''),
    da: [...(inicial?.[k]?.da || [])],
    busca: '',
  });
  const estado = { a: lado('a'), b: lado('b') };

  document.querySelector('.ficha-capa')?.remove();
  const capa = document.createElement('div');
  capa.className = 'ficha-capa calc-capa';
  capa.innerHTML = `<div class="ficha-hoja" role="dialog" aria-label="Calculadora de trades">
    <header class="calc-top"><div><h2>⚖️ Calculadora de trades</h2><small>Cualquier jugador de la liga. Te digo qué tan justo es y para quién.</small></div>
      <button class="boton-icono" data-cerrar aria-label="Cerrar">✕</button></header>
    <div class="ficha-cuerpo">
      <div id="calc-resultado"></div>
      <div class="calc-lados">${['a', 'b'].map((k) => `
        <section class="calc-lado" data-lado="${k}">
          <h3>${k === 'a' ? '🅰️ Lado A manda' : '🅱️ Lado B manda'}</h3>
          <select data-equipo="${k}" aria-label="Equipo del lado ${k.toUpperCase()}">
            <option value="">Cualquier jugador (sin equipo)</option>
            ${d.equipos.map((e) => `<option value="${e.rosterId}">${esc(e.nombre)}${e.esMio ? ' (tú)' : ''}</option>`).join('')}
          </select>
          <div class="calc-elegidos" data-elegidos="${k}"></div>
          <input type="search" data-busca="${k}" placeholder="🔍 Buscar jugador…" autocomplete="off" />
          <div class="calc-opciones scroll" data-opciones="${k}"></div>
        </section>`).join('')}
      </div>
      <p class="nota" style="margin:10px 2px">Valores de FantasyCalc (trades reales de miles de ligas). Un paquete de varios vale menos que la suma: el mejor jugador manda.</p>
    </div></div>`;
  document.body.appendChild(capa);
  document.body.style.overflow = 'hidden';
  const cerrar = () => { capa.remove(); document.body.style.overflow = ''; };
  capa.addEventListener('click', (e) => { if (e.target === capa || e.target.closest('[data-cerrar]')) cerrar(); });

  const nombreLado = (k) => equipoPor(estado[k].equipo)?.nombre || (k === 'a' ? 'Lado A' : 'Lado B');
  const chipJugador = (id, k) => {
    const j = J[id];
    const e = duenoDe[id];
    return `<button class="calc-chip" data-quitar="${esc(id)}" data-lado="${k}">
      <span class="pos ${j.pos}">${j.pos}</span><span class="n">${esc(j.nombre)}</span>
      <small>${e ? esc(e.nombre) : 'Libre'} · ${miles(d.valor(id))}</small><b aria-hidden="true">✕</b></button>`;
  };

  function opciones(k) {
    const s = estado[k];
    const otros = new Set([...estado.a.da, ...estado.b.da]);
    const q = sinAcentos(s.busca.trim());
    let lista;
    if (q) lista = todos.filter((j) => sinAcentos(j.nombre).includes(q));
    else if (s.equipo) lista = (equipoPor(s.equipo)?.ids || []).map((id) => J[id]).filter(Boolean).sort((x, y) => d.valor(y.id) - d.valor(x.id));
    else lista = todos;
    return lista.filter((j) => !otros.has(j.id)).slice(0, q ? 12 : 40);
  }

  function pintarLado(k) {
    const s = estado[k];
    $(`[data-equipo="${k}"]`, capa).value = String(s.equipo || '');
    $(`[data-elegidos="${k}"]`, capa).innerHTML = s.da.length ? s.da.map((id) => chipJugador(id, k)).join('')
      : '<p class="nota" style="margin:4px 2px">Toca jugadores abajo o búscalos por nombre.</p>';
    $(`[data-opciones="${k}"]`, capa).innerHTML = opciones(k).map((j) => `<button class="elegible" data-agregar="${esc(j.id)}" data-lado="${k}">
      <span class="pos ${j.pos}">${j.pos}</span><span class="n">${esc(j.nombre)}<small>${duenoDe[j.id] ? esc(duenoDe[j.id].nombre) : 'Libre'}</small></span>
      <span class="v">${miles(d.valor(j.id))}</span></button>`).join('') || '<p class="nota">Nadie con ese nombre.</p>';
    $$(`[data-agregar][data-lado="${k}"]`, capa).forEach((b) => (b.onclick = () => {
      const id = b.dataset.agregar;
      // Si eligió el equipo de este lado y el jugador es de otro, lo dejamos en "cualquier jugador"
      if (s.equipo && String(duenoDe[id]?.rosterId) !== String(s.equipo)) s.equipo = '';
      if (!s.equipo && duenoDe[id] && !s.da.length) s.equipo = duenoDe[id].rosterId; // el primero define el equipo
      s.da.push(id);
      s.busca = '';
      $(`[data-busca="${k}"]`, capa).value = '';
      pintarTodo();
    }));
    $$(`[data-quitar][data-lado="${k}"]`, capa).forEach((b) => (b.onclick = () => {
      s.da = s.da.filter((x) => x !== b.dataset.quitar);
      pintarTodo();
    }));
  }

  function resultado() {
    const ladoDe = (k) => {
      const eq = equipoPor(estado[k].equipo);
      // Solo se mide la alineación si todos los que manda son de ese equipo
      const delEquipo = eq && estado[k].da.every((id) => eq.ids.includes(id));
      return { nombre: nombreLado(k), ids: delEquipo ? eq.ids : [], da: estado[k].da };
    };
    const r = evaluarTrade({
      a: ladoDe('a'), b: ladoDe('b'), valor: d.valor, jugadores: J, rosterPositions: d.puestos,
      proy: d.proyAjustada ? (id) => d.proyAjustada(d.semana, id) : null,
    });
    const caja = $('#calc-resultado', capa);
    if (r.veredicto.tipo === 'vacio' || !estado.a.da.length || !estado.b.da.length) {
      caja.innerHTML = `<div class="calc-vacio">🐛 ${!estado.a.da.length && !estado.b.da.length ? 'Elige qué manda cada lado y te digo quién gana.' : `Falta lo que manda el ${!estado.a.da.length ? 'lado A' : 'lado B'}.`}</div>`;
      return;
    }
    const pa = Math.round(r.a.parte * 100);
    const color = (x) => (r.veredicto.tipo === 'parejo' ? 'parejo' : x.parte > 0.5 ? 'gana' : 'pierde');
    const tarjeta = (x, k) => `<div class="calc-ficha ${color(x)}">
      <div class="calc-ficha-cab"><b>${esc(x.nombre)}</b><span class="etiqueta ${color(x) === 'gana' ? 'verde' : color(x) === 'pierde' ? 'rojo' : 'amarillo'}">${color(x) === 'gana' ? '✅ Gana' : color(x) === 'pierde' ? '❌ Pierde' : '🤝 Parejo'}</span></div>
      <div class="calc-datos">
        <div><small>Recibe</small><b>${miles(x.recibe)}</b></div>
        <div><small>Da</small><b>${miles(x.da)}</b></div>
        <div><small>Se lleva</small><b>${Math.round(x.parte * 100)}%</b></div>
      </div>
      ${x.alineacion != null ? `<p class="calc-linea">📋 Su alineación: <b class="${x.alineacion >= 0 ? 'sube' : 'baja'}">${x.alineacion >= 0 ? '+' : ''}${(x.alineacion * 100).toFixed(1)}%</b> de valor${x.puntos != null ? ` · <b class="${x.puntos >= 0 ? 'sube' : 'baja'}">${x.puntos >= 0 ? '+' : ''}${pts(x.puntos)}</b> pts esta semana` : ''}</p>`
        : `<p class="calc-linea nota">Elige su equipo arriba para ver cómo le cambia la alineación.</p>`}
      <p class="calc-linea">📥 Recibe: ${estado[k === 'a' ? 'b' : 'a'].da.map((id) => `<b>${esc(J[id].nombre)}</b> <span class="pos ${J[id].pos}">${J[id].pos}</span>`).join(', ') || '—'}</p>
      ${color(x) === 'pierde' && x.alineacion > 0.01 ? '<p class="calc-linea consuelo">💡 Pierde en valor, pero le mejora la alineación: le puede convenir.</p>' : ''}
      ${color(x) === 'gana' && x.alineacion != null && x.alineacion < -0.01 ? '<p class="calc-linea consuelo">⚠️ Gana en valor, pero su alineación queda peor esta temporada.</p>' : ''}
    </div>`;
    const e = r.emparejar;
    caja.innerHTML = `
      <div class="calc-veredicto ${r.veredicto.tipo}"><b>${esc(r.veredicto.texto)}</b>
        ${r.veredicto.tipo === 'gana' ? `<small>${esc(r.veredicto.gana === 'a' ? r.a.nombre : r.b.nombre)} se lleva el ${Math.max(pa, 100 - pa)}% del valor</small>` : '<small>Se reparten el valor casi a la mitad</small>'}</div>
      <div class="calc-barra" role="img" aria-label="Lado A ${pa}%, lado B ${100 - pa}%">
        <span class="a" style="width:${pa}%">${pa}%</span><span class="b" style="width:${100 - pa}%">${100 - pa}%</span><i></i></div>
      <div class="calc-barra-nombres"><span>🅰️ ${esc(r.a.nombre)}</span><span>${esc(r.b.nombre)} 🅱️</span></div>
      <div class="calc-fichas">${tarjeta(r.a, 'a')}${tarjeta(r.b, 'b')}</div>
      ${e ? `<p class="calc-emparejar">⚖️ Para emparejarlo: ${e.id ? `que <b>${esc(e.quien)}</b> agregue a <b>${esc(J[e.id].nombre)}</b> (quedaría ${Math.round((1 - e.parte) * 100)}–${Math.round(e.parte * 100)})` : `a <b>${esc(e.para)}</b> le faltan unos <b>${miles(e.falta)}</b> de valor`}.</p>` : ''}`;
  }

  function pintarTodo() {
    pintarLado('a');
    pintarLado('b');
    resultado();
  }

  for (const k of ['a', 'b']) {
    $(`[data-equipo="${k}"]`, capa).addEventListener('change', (ev) => {
      estado[k].equipo = ev.target.value;
      const eq = equipoPor(estado[k].equipo);
      if (eq) estado[k].da = estado[k].da.filter((id) => eq.ids.includes(id));
      pintarTodo();
    });
    $(`[data-busca="${k}"]`, capa).addEventListener('input', (ev) => { estado[k].busca = ev.target.value; pintarLado(k); });
  }
  pintarTodo();
}
