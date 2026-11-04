// Mercado: armador de trades justos (Cody opina), comprar barato / vender caro y lo que hacen miles de ligas.
import { esc, $, $$, filaJugador, miles, tarjeta, codyDice } from './comun.js';
import { proponerTrades, buscarPorNecesidad } from '../analisis/trades.js';

export function vistaMercado(el, d, ctx) {
  const J = d.jugadores;
  const rivales = d.equipos.filter((e) => !e.esMio);
  const titulares = new Set(d.titulares.alineacion.titulares.map((t) => t.id));
  const estado = { rival: rivales[0]?.rosterId, recibo: new Set(), doy: new Set() };
  const porValor = (ids) => [...ids].sort((a, b) => d.valor(b) - d.valor(a));

  // Si vengo desde "Tu punto débil", cargo ese trade
  try {
    const s = JSON.parse(sessionStorage.getItem('trade-sugerido') || 'null');
    if (s && rivales.some((r) => r.rosterId === s.equipo)) {
      estado.rival = s.equipo;
      estado.recibo = new Set(s.recibo);
      estado.doy = new Set(s.doy);
    }
    sessionStorage.removeItem('trade-sugerido');
  } catch { /* nada */ }

  const posTrade = ['QB', 'RB', 'WR', 'TE'].filter((p) => d.puestos.includes(p));
  const inicial = posTrade.includes(d.debil?.pos) ? d.debil.pos : posTrade.includes('WR') ? 'WR' : posTrade[0];
  el.innerHTML = `
    <section class="tarjeta" id="necesidad"><header><h2>🔎 ¿Qué necesitas?</h2><small>Elige la posición y busco equipos a los que les sobra justo eso y les falta lo que a ti te sobra</small></header>
      <div class="chips" id="chips-necesito">${posTrade.map((p) => `<button data-pos="${p}" class="${p === inicial ? 'activo' : ''}">${p === d.debil?.pos ? '⚠️ ' : ''}${p}</button>`).join('')}</div>
      <div id="res-necesito"></div>
    </section>
    <section class="tarjeta" id="armador"><header><h2>🤝 Armador de trades</h2><small>1. Elige rival · 2. Toca lo que quieres · 3. (Opcional) lo que das</small></header>
      <select id="rival" aria-label="Equipo rival">${rivales.map((r) => `<option value="${r.rosterId}">${esc(r.nombre)} · @${esc(r.usuario)}</option>`).join('')}</select>
      <div class="pasos dos" style="margin-top:10px">
        <div class="lado"><h3>📥 Recibes</h3><div class="scroll" id="lista-rival"></div></div>
        <div class="lado"><h3>📤 Das</h3><div class="scroll" id="lista-mia"></div></div>
      </div>
      <div id="resultado"></div>
    </section>
    ${tarjeta('🛒 Comprar barato', d.comprar.length ? `<div class="lista">${d.comprar.map((j) => `${filaJugador(J[j.id], {
      sub: `de ${esc(j.equipoFantasy?.nombre || '')}`, derecha: miles(j.valor), derechaSub: 'valor',
      consejo: `${j.razones.map(esc).join(' · ')} <button class="chip-boton" style="margin-left:4px" data-pedir="${j.id}" data-roster="${j.equipoFantasy?.rosterId}">🤝 Armar trade</button>` })}`).join('')}</div>`
      : '<div class="vacio">No encontré gangas claras esta semana.</div>', { sub: `${d.comprar.length} oportunidades`, plegable: true })}
    ${tarjeta('💰 Vender caro', d.vender.length ? `<div class="lista">${d.vender.map((j) => filaJugador(J[j.id], {
      derecha: miles(j.valor), derechaSub: 'valor', consejo: j.razones.map(esc).join(' · ') })).join('')}</div>`
      : '<div class="vacio">Nadie de tu equipo está inflado ahora.</div>', { sub: `${d.vender.length} de tus jugadores`, plegable: true })}
    ${tarjeta('🌎 Lo que hacen miles de ligas', `<div class="pasos dos">
      <div class="lado"><h3>Más agregados</h3>${d.tendAdd.filter((t) => J[t.player_id]).slice(0, 8).map((t) =>
        `<div class="elegible"><span class="pos ${J[t.player_id].pos}">${J[t.player_id].pos}</span><span class="n">${esc(J[t.player_id].nombre)}</span><span class="v sube">+${miles(t.count)}</span></div>`).join('')}</div>
      <div class="lado"><h3>Más soltados</h3>${d.tendDrop.filter((t) => J[t.player_id]).slice(0, 8).map((t) =>
        `<div class="elegible"><span class="pos ${J[t.player_id].pos}">${J[t.player_id].pos}</span><span class="n">${esc(J[t.player_id].nombre)}</span><span class="v baja">−${miles(t.count)}</span></div>`).join('')}</div>
    </div><p class="nota" style="margin-top:8px">Todas las ligas de Sleeper, últimas 24 h. Los valores de trade son de FantasyCalc (miles de trades reales).</p>`, { plegable: true })}`;

  const elegible = (id, lado) => {
    const j = J[id];
    const sel = estado[lado].has(id);
    return `<button class="elegible ${sel ? 'sel' : ''}" data-id="${id}" data-lado="${lado}" aria-pressed="${sel}">
      <span class="pos ${j.pos}">${j.pos}</span><span class="n">${esc(j.nombre)}</span><span class="v">${miles(d.valor(id))}</span></button>`;
  };
  const rosterRival = () => rivales.find((r) => String(r.rosterId) === String(estado.rival));

  function pintar() {
    $('#rival').value = String(estado.rival);
    $('#lista-rival').innerHTML = porValor(rosterRival()?.ids || []).map((id) => elegible(id, 'recibo')).join('');
    $('#lista-mia').innerHTML = porValor(d.mio.ids).map((id) => elegible(id, 'doy')).join('');
    $$('.elegible[data-lado]', el).forEach((b) => b.addEventListener('click', () => {
      const s = estado[b.dataset.lado];
      s.has(b.dataset.id) ? s.delete(b.dataset.id) : s.add(b.dataset.id);
      const scroll = [$('#lista-rival').scrollTop, $('#lista-mia').scrollTop];
      pintar();
      [$('#lista-rival').scrollTop, $('#lista-mia').scrollTop] = scroll;
    }));
    calcular();
  }

  function calcular() {
    const res = $('#resultado');
    if (!estado.recibo.size) {
      res.innerHTML = '<p class="nota" style="margin-top:10px">Toca a un jugador del rival y te digo qué trades son justos.</p>';
      codyDice(document, ctx, 'Elige a quién quieres del rival y yo te busco un trade justo con tu equipo.', { animo: 'Hablar' });
      return;
    }
    const r = proponerTrades({
      recibo: [...estado.recibo], doy: [...estado.doy], miRoster: d.mio.ids, rosterRival: rosterRival().ids,
      valor: d.valor, titular: (id) => titulares.has(id),
    });
    const nombres = (ids) => ids.map((id) => `<b>${esc(J[id].nombre)}</b>`).join(' + ');
    const medidor = (o) => {
      const pos = Math.max(3, Math.min(97, 50 + (o.vRecibo - o.vDoy) / Math.max(o.vRecibo, o.vDoy) * 60));
      return `<div class="medidor"><span style="left:${pos}%"></span></div><div class="medidor-leyenda"><span>Pierdes</span><span>Justo</span><span>Ganas</span></div>`;
    };
    res.innerHTML = `${r.actual ? `<div class="opcion" style="margin-top:8px"><div class="linea"><span class="que">Das</span>${nombres(r.actual.doy)}</div>
        <div class="linea"><span class="que">Recibes</span>${nombres(r.actual.recibo)}</div>${medidor(r.actual)}</div>` : ''}
      <h3 class="seccion-titulo" style="margin-left:0">⚖️ Ofertas a tu favor (que sí pueden aceptar)</h3>
      ${r.opciones.length ? r.opciones.slice(0, 5).map((o) => `<div class="opcion">
        <div class="linea"><span class="que">Das</span>${nombres(o.doy)}</div><div class="linea"><span class="que">Recibes</span>${nombres(o.recibo)}</div>
        <div class="linea"><span class="etiqueta ${o.tipo === 'justo' || o.aceptable ? 'verde' : 'amarillo'}">${esc(o.texto)}</span>
        ${o.dolor ? `<span class="etiqueta naranja">Sale ${o.dolor} titular${o.dolor > 1 ? 'es' : ''}</span>` : '<span class="etiqueta">No toca tus titulares</span>'}</div></div>`).join('')
      : '<div class="vacio">No encontré combinaciones parejas con tu equipo.</div>'}
      <p class="nota">Proponlo desde Sleeper: no deja que otras apps manden trades.</p>`;

    // Cody opina
    const a = r.actual;
    if (a) {
      const opinion = a.tipo === 'justo' ? ['¡Trade justo! Ninguno sale perdiendo. Yo lo mandaría. 🏈', 'Lanzar']
        : a.tipo === 'pierdes' ? [`¡Ni se te ocurra! Das ${miles(a.vDoy)} por ${miles(a.vRecibo)}. ${a.equidad < 0.8 ? 'Te están robando.' : 'Pide un poquito más.'}`, 'Enojado']
          : [`Te favorece (${miles(a.vRecibo)} por ${miles(a.vDoy)}). ${a.equidad < 0.8 ? 'Difícil que lo acepten, pero probar no cuesta.' : 'Mándalo antes de que se den cuenta. 😎'}`, 'Cool'];
      codyDice(document, ctx, opinion[0], { animo: opinion[1] });
    } else if (r.opciones[0]) {
      codyDice(document, ctx, `Por ${[...estado.recibo].map((id) => J[id].nombre).join(' + ')} te armé ${r.opciones.length} opciones justas. La primera no te desarma la alineación.`, { animo: 'Cool' });
    } else {
      codyDice(document, ctx, 'Con tu equipo no llego a ese valor sin dar demasiado. Prueba con otro jugador.', { animo: 'Triste' });
    }
  }

  // ---------- Buscador por necesidad
  const NOMBRE_POS = { QB: 'quarterback', RB: 'corredor', WR: 'receptor', TE: 'ala cerrada' };
  const NIVELES = [
    ['mejor', '🏆 Lo mejor', 'Das solo lo que te sobra, es parejo y a ellos les hace falta.'],
    ['medio', '👍 Lo medio', 'Parejo, pero no les urge tanto o te mejora menos.'],
    ['desesperado', '🆘 Si estás desesperado', 'Das un poco de más o a un titular, pero consigues la posición que necesitas.'],
  ];
  const tarjetaOpcion = (o, k, pos) => {
    const nombre = (id) => `<b>${esc(J[id].nombre)}</b> <span class="pos ${J[id].pos}">${J[id].pos}</span>`;
    return `<div class="opcion necesidad nivel-${o.nivel}">
      <div class="linea"><span class="que">Equipo</span><b>${esc(o.equipo.nombre)}</b></div>
      <div class="linea"><span class="que">Recibes</span><span class="lista-j">${o.recibo.map(nombre).join(' + ')}</span></div>
      <div class="linea"><span class="que">Das</span><span class="lista-j">${o.doy.map(nombre).join(' <span class="mas">+</span> ')}</span></div>
      <div class="por-que">
        ${o.esSuTitular ? `<span class="etiqueta naranja">Es su titular</span>` : o.buenos >= 3 ? `<span class="etiqueta verde">Tienen ${o.buenos} ${pos} buenos</span>` : `<span class="etiqueta verde">Les sobra en ${pos}</span>`}
        ${o.lesFalta && o.lesFalta.lugar > o.total / 2 ? `<span class="etiqueta naranja">Sus ${o.lesFalta.pos} son ${o.lesFalta.lugar}º de ${o.total}</span>` : ''}
        ${o.tocaTitular ? '<span class="etiqueta rojo">Das a un titular tuyo</span>' : ''}
        <span class="etiqueta ${o.tipo === 'justo' || o.aceptable ? 'verde' : o.tipo === 'pierdes' ? 'rojo' : 'amarillo'}">${esc(o.texto)}</span>
        ${o.ellosGanan > 0 ? '<span class="etiqueta acento">A ellos también les conviene</span>' : ''}
      </div>
      <button class="chip-boton principal" data-abrir="${k}">🤝 Ver en el armador</button>
    </div>`;
  };
  function necesito(pos) {
    const r = buscarPorNecesidad({ necesito: pos, equipos: d.equipos, jugadores: J, rosterPositions: d.puestos, valor: d.valor });
    const caja = $('#res-necesito');
    const corto = (n) => { const p = n.split(' '); return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : n; };
    const sobran = r.sobrantes.map((x) => esc(corto(J[x.id].nombre))).join(', ');
    caja.innerHTML = `
      <p class="nota" style="margin:8px 2px">${r.miLugar ? `Tus ${pos} titulares son los <b>${r.miLugar}º de ${r.total}</b> de la liga. ` : ''}${sobran ? `Lo que te sobra para cambiar: ${sobran}.` : 'No veo jugadores que te sobren: cualquier trade te quita un titular.'}</p>
      ${r.opciones.length ? NIVELES.filter(([n]) => r.porNivel[n].length).map(([n, titulo, sub]) => `
        <h3 class="seccion-titulo nivel-${n}" style="margin-left:0">${titulo}</h3><p class="nota" style="margin:0 2px 6px">${sub}</p>
        ${r.porNivel[n].map((o) => tarjetaOpcion(o, r.opciones.indexOf(o), pos)).join('')}`).join('')
      : `<div class="vacio">No encontré a nadie que tenga ${pos} para cambiarte. Prueba con otra posición o busca en waivers.</div>`}`;
    $$('[data-abrir]', caja).forEach((b) => (b.onclick = () => {
      const o = r.opciones[Number(b.dataset.abrir)];
      estado.rival = o.rosterId;
      estado.recibo = new Set(o.recibo);
      estado.doy = new Set(o.doy);
      pintar();
      $('#armador').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    const o = r.porNivel.mejor[0] || r.porNivel.medio[0] || r.opciones[0];
    codyDice(document, ctx, o
      ? `Buscando ${NOMBRE_POS[pos] || pos}… En ${o.equipo.nombre} les sobra ${pos}${o.lesFalta && o.lesFalta.lugar > o.total / 2 ? ` y andan flojos en ${o.lesFalta.pos}` : ''}. Ofréceles ${o.doy.map((id) => J[id].nombre).join(' + ')} por ${J[o.recibo[0]].nombre}. 🤝`
      : `Nadie tiene ${pos} de sobra para lo que tú puedes dar. Te toca buscar en waivers. 🧐`, { animo: o ? 'Cool' : 'Triste' });
  }
  $$('#chips-necesito button').forEach((b) => (b.onclick = () => {
    $$('#chips-necesito button').forEach((x) => x.classList.toggle('activo', x === b));
    necesito(b.dataset.pos);
  }));

  $('#rival').addEventListener('change', (e) => { estado.rival = e.target.value; estado.recibo.clear(); pintar(); });
  $$('[data-pedir]', el).forEach((b) => b.addEventListener('click', () => {
    estado.rival = b.dataset.roster;
    estado.recibo = new Set([b.dataset.pedir]);
    estado.doy.clear();
    pintar();
    $('#rival').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  pintar();
  ctx.ponerMascota($('[data-cody]')).then(() => (inicial ? necesito(inicial) : calcular()));
}
