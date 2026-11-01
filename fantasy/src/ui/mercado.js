// Mercado: armador de trades justos, comprar barato / vender caro y movimientos de miles de ligas.
import { esc, $, $$, filaJugador, miles, tarjeta } from './comun.js';
import { proponerTrades } from '../analisis/trades.js';

export function vistaMercado(el, d) {
  const J = d.jugadores;
  const rivales = d.equipos.filter((e) => !e.esMio);
  const titulares = new Set(d.titulares.alineacion.titulares.map((t) => t.id));
  const estado = { rival: rivales[0]?.rosterId, recibo: new Set(), doy: new Set() };
  const porValor = (ids) => [...ids].sort((a, b) => d.valor(b) - d.valor(a));

  el.innerHTML = `
    <section class="tarjeta"><header><h2>Armador de trades</h2><small>Elige un jugador del rival y, si quieres, uno tuyo</small></header>
      <select id="rival" aria-label="Equipo rival">${rivales.map((r) => `<option value="${r.rosterId}">${esc(r.nombre)} (@${esc(r.usuario)})</option>`).join('')}</select>
      <div class="trade" style="margin-top:10px">
        <div class="lado"><h3>Recibes</h3><div id="lista-rival"></div></div>
        <div class="lado"><h3>Das</h3><div id="lista-mia"></div></div>
      </div>
      <div id="resultado"></div>
    </section>
    ${tarjeta('Comprar barato', d.comprar.length ? `<div class="lista">${d.comprar.map((j) => `${filaJugador(J[j.id], {
      sub: `de ${esc(j.equipoFantasy?.nombre || '')}`, derecha: miles(j.valor), derechaSub: 'valor' })}
      <ul class="razones">${j.razones.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <button class="boton sec" style="margin:6px 0 10px 54px;padding:6px 12px;font-size:13px" data-pedir="${j.id}" data-roster="${j.equipoFantasy?.rosterId}">Armar trade</button>`).join('')}</div>`
      : '<div class="vacio">No encontré gangas claras esta semana.</div>', { sub: 'Rinden menos de lo que valen' })}
    ${tarjeta('Vender caro', d.vender.length ? `<div class="lista">${d.vender.map((j) => `${filaJugador(J[j.id], {
      derecha: miles(j.valor), derechaSub: 'valor' })}<ul class="razones">${j.razones.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`).join('')}</div>`
      : '<div class="vacio">Nadie de tu equipo está inflado ahora.</div>', { sub: 'Tus jugadores en su punto más alto' })}
    ${tarjeta('Lo que hacen miles de ligas', `<div class="trade">
      <div class="lado"><h3>Más agregados</h3>${d.tendAdd.slice(0, 8).filter((t) => J[t.player_id]).map((t) =>
        `<div class="elegible"><span class="pos ${J[t.player_id].pos}">${J[t.player_id].pos}</span><span class="n">${esc(J[t.player_id].nombre)}</span><span class="v sube">+${miles(t.count)}</span></div>`).join('')}</div>
      <div class="lado"><h3>Más soltados</h3>${d.tendDrop.slice(0, 8).filter((t) => J[t.player_id]).map((t) =>
        `<div class="elegible"><span class="pos ${J[t.player_id].pos}">${J[t.player_id].pos}</span><span class="n">${esc(J[t.player_id].nombre)}</span><span class="v baja">−${miles(t.count)}</span></div>`).join('')}</div>
    </div><p class="nota">Movimientos de las últimas 24 h en todas las ligas de Sleeper. Los valores de trade salen de FantasyCalc (miles de trades reales).</p>`)}`;

  const elegible = (id, lado) => {
    const j = J[id];
    const sel = estado[lado].has(id);
    return `<button class="elegible ${sel ? 'sel' : ''}" data-id="${id}" data-lado="${lado}" aria-pressed="${sel}">
      <span class="pos ${j.pos}">${j.pos}</span><span class="n">${esc(j.nombre)}</span><span class="v">${miles(d.valor(id))}</span></button>`;
  };
  const rosterRival = () => rivales.find((r) => String(r.rosterId) === String(estado.rival));

  function pintar() {
    $('#lista-rival').innerHTML = porValor(rosterRival()?.ids || []).map((id) => elegible(id, 'recibo')).join('');
    $('#lista-mia').innerHTML = porValor(d.mio.ids).map((id) => elegible(id, 'doy')).join('');
    $$('.elegible[data-lado]').forEach((b) => b.addEventListener('click', () => {
      const s = estado[b.dataset.lado];
      s.has(b.dataset.id) ? s.delete(b.dataset.id) : s.add(b.dataset.id);
      pintar();
    }));
    calcular();
  }

  function calcular() {
    const res = $('#resultado');
    if (!estado.recibo.size) {
      res.innerHTML = '<p class="nota">Toca a un jugador del rival para ver trades justos.</p>';
      return;
    }
    const r = proponerTrades({
      recibo: [...estado.recibo], doy: [...estado.doy], miRoster: d.mio.ids, rosterRival: rosterRival().ids,
      valor: d.valor, titular: (id) => titulares.has(id),
    });
    const nombres = (ids) => ids.map((id) => `<b>${esc(J[id].nombre)}</b>`).join(' + ');
    const medidor = (o) => {
      const pos = Math.max(2, Math.min(98, 50 + (o.vRecibo - o.vDoy) / Math.max(o.vRecibo, o.vDoy) * 50));
      return `<div class="medidor" title="Izquierda: le conviene al rival · Derecha: te conviene a ti"><span style="left:${pos}%"></span></div>`;
    };
    res.innerHTML = `${r.actual ? `<div class="opcion"><div class="linea">Das ${nombres(r.actual.doy)} · recibes ${nombres(r.actual.recibo)}</div>
        ${medidor(r.actual)}<div class="linea"><span class="etiqueta ${r.actual.tipo === 'justo' ? 'verde' : r.actual.tipo === 'ganas' ? 'amarillo' : 'rojo'}">${esc(r.actual.texto)}</span>
        <span class="nota">${miles(r.actual.vDoy)} vs ${miles(r.actual.vRecibo)}</span></div></div>` : ''}
      <h3 class="seccion-titulo">Opciones justas</h3>
      ${r.opciones.length ? r.opciones.map((o) => `<div class="opcion">
        <div class="linea">Das ${nombres(o.doy)}</div><div class="linea">Recibes ${nombres(o.recibo)}</div>
        <div class="linea"><span class="etiqueta ${o.tipo === 'justo' ? 'verde' : 'amarillo'}">${esc(o.texto)}</span>
        ${o.dolor ? `<span class="etiqueta naranja">Sale ${o.dolor} titular${o.dolor > 1 ? 'es' : ''}</span>` : '<span class="etiqueta">Sin tocar tus titulares</span>'}
        ${o.agrega ? `<span class="nota">(${o.agrega === 'tú' ? 'agregas uno tuyo' : 'pides uno más'})</span>` : ''}</div></div>`).join('')
      : '<div class="vacio">No encontré combinaciones parejas con tu equipo.</div>'}
      <p class="nota">Sleeper no deja que otras apps manden trades: proponlo desde Sleeper.</p>`;
  }

  $('#rival').addEventListener('change', (e) => { estado.rival = e.target.value; estado.recibo.clear(); pintar(); });
  $$('[data-pedir]').forEach((b) => b.addEventListener('click', () => {
    estado.rival = b.dataset.roster;
    $('#rival').value = b.dataset.roster;
    estado.recibo = new Set([b.dataset.pedir]);
    estado.doy.clear();
    pintar();
    $('#rival').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  pintar();
}
