// Bienvenida, elegir equipo favorito y "carpetas" (una por cada liga de fantasy).
import { esc, $, $$, cargando, codyHtml, ponerCody, codyDice } from './comun.js';
import { cargarInicio, sesion } from '../estado.js';
import { avatar } from '../datos/sleeper.js';
import { EQUIPOS, aplicarTema } from '../datos/equipos.js';
import { soporte, preferencias, activar, desactivar, esIOS } from '../notificaciones.js';
import { abrirBuscador, abrirPendiente } from './buscador.js';

export async function vistaBienvenida(app, ctx) {
  app.innerHTML = `<section class="bienvenida">
    ${codyHtml({ grande: true })}
    <p class="marca">Fantasy <span>x</span> Cody</p>
    <h1>¡Hola! Soy Cody 🐛</h1>
    <p>Tu gusano del fantasy. Dame tu usuario de Sleeper y te digo qué hacer cada semana en cada una de tus ligas.</p>
    <form class="campo" id="form">
      <input id="usuario" autocomplete="username" autocapitalize="off" spellcheck="false"
        placeholder="Usuario de Sleeper" aria-label="Usuario de Sleeper" required />
      <button class="boton" type="submit">Entrar 🏈</button>
    </form>
    <div class="error" id="error" role="alert"></div>
    <p class="nota" style="margin-top:14px">Solo leo tu liga. No pido contraseña.</p>
  </section>`;
  ponerCody(app, ctx, 'Escribe tu usuario y vamos a ganar esta liga. 🏆', { animo: 'Feliz' }).then(() => {
    if (sesion.equipo) return;
    // Sin equipo elegido todavía: Cody se va probando camisetas y la página cambia con él
    const lista = Object.keys(EQUIPOS);
    let k = Math.floor(Math.random() * lista.length);
    const cambiar = () => {
      const e = aplicarTema(lista[k++ % lista.length]);
      ctx.mascota?.vestir(e);
    };
    cambiar();
    ctx.ciclo = setInterval(cambiar, 2200);
  });
  $('#form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = $('#usuario').value.trim();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    $('#error').textContent = '';
    clearInterval(ctx.ciclo);
    codyDice(app, ctx, 'Buscándote en Sleeper…', { animo: 'Hablar' });
    try {
      const datos = await cargarInicio(nombre);
      sesion.usuario = { nombre, id: datos.usuario.user_id, display: datos.usuario.display_name };
      location.hash = sesion.equipo ? '#/' : '#/equipo-favorito';
      ctx.ir();
    } catch (err) {
      const noExiste = /404|usuario/.test(err.message);
      $('#error').textContent = noExiste ? 'No encontré ese usuario. Revisa cómo está escrito en Sleeper.'
        : 'No me pude conectar con Sleeper. Intenta de nuevo en un momento.';
      codyDice(app, ctx, noExiste ? 'Mmm… ese usuario no existe. ¿Lo escribiste bien?' : 'Se me cayó la conexión. Prueba otra vez.', { animo: 'Triste' });
    } finally {
      btn.disabled = false;
    }
  });
}

export function vistaEquipoFavorito(app, ctx) {
  let elegido = sesion.equipo || null;
  const orden = Object.entries(EQUIPOS).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));
  app.innerHTML = `<header class="barra">
      ${sesion.equipo ? '<a class="boton-icono" href="#/" aria-label="Volver">←</a>' : ''}
      <div class="titulo"><h1>Tu equipo favorito</h1><small>Cody se pone su camiseta y la app sus colores</small></div>
    </header>
    ${codyHtml()}
    <div class="equipos-nfl">${orden.map(([abr, e]) => `<button class="equipo-nfl ${abr === elegido ? 'sel' : ''}" data-abr="${abr}" aria-label="${esc(e.nombre)}">
      <span class="bolita" style="background:${e.camiseta};box-shadow:inset 0 0 0 3px ${e.ribete}">${abr}</span>${esc(e.nombre.split(' ').slice(-1)[0])}</button>`).join('')}</div>
    <div class="pie-fijo"><button class="boton ancho" id="listo" ${elegido ? '' : 'disabled'}>¡Listo, a jugar! ✅</button></div>`;
  ponerCody(app, ctx, '¿De qué equipo eres? Toca uno y me lo pruebo.', { animo: 'Saludar' });
  $$('.equipo-nfl').forEach((b) => b.addEventListener('click', () => {
    elegido = b.dataset.abr;
    $$('.equipo-nfl').forEach((x) => x.classList.toggle('sel', x === b));
    const e = aplicarTema(elegido);
    ctx.mascota?.vestir(e);
    $('#listo').disabled = false;
    codyDice(app, ctx, `¡${e.nombre}! ¿Cómo me queda? 😎`, { animo: 'Cool' });
  }));
  $('#listo').onclick = () => {
    sesion.equipo = elegido;
    location.hash = '#/';
    ctx.ir();
  };
}

export async function vistaCarpetas(app, ctx) {
  const u = sesion.usuario;
  const eq = EQUIPOS[sesion.equipo];
  app.innerHTML = `<header class="barra">
      <div class="titulo"><h1>Fantasy <span class="x">x</span> Cody</h1><small>@${esc(u.display || u.nombre)} · tus ligas</small></div>
      <button class="boton-icono" id="buscar" aria-label="Buscar">🔍</button>
      <a class="punto-equipo" href="#/equipo-favorito" title="Cambiar equipo favorito">${esc(sesion.equipo || 'NFL')}</a>
      <a class="boton-icono" href="#/noticias" aria-label="Noticias">📰</a>
      <button class="boton-icono" id="salir" aria-label="Cambiar de usuario">⎋</button>
    </header>
    ${codyHtml()}
    <div id="cuerpo">${cargando('Un momento…')}</div>`;
  ponerCody(app, ctx, 'Buscando tus ligas…', { animo: 'Hablar' });
  $('#salir').onclick = () => { sesion.salir(); location.hash = '#/'; ctx.ir(); };
  $('#buscar').onclick = () => abrirBuscador({ ctx });
  try {
    const { ligas, temporada } = await cargarInicio(u.nombre);
    const cuerpo = $('#cuerpo');
    if (!ligas.length) {
      cuerpo.innerHTML = `<div class="tarjeta vacio">No tienes ligas de NFL en Sleeper para ${esc(temporada)}.</div>`;
      codyDice(app, ctx, `No encontré ligas tuyas en ${temporada}. ¿Es el usuario correcto?`, { animo: 'Triste' });
      return;
    }
    codyDice(app, ctx, `Tienes ${ligas.length} liga${ligas.length > 1 ? 's' : ''}${eq ? ` y ya tengo puesta la camiseta de los ${eq.nombre.split(' ').slice(-1)[0]}` : ''}. Elige una y te digo qué hacer esta semana.`, { animo: 'Feliz' });
    cuerpo.innerHTML = `<div class="carpetas">${ligas.map((l) => {
      const tipo = l.settings?.type === 2 ? 'Dinastía' : l.settings?.type === 1 ? 'Keeper' : 'Redraft';
      const rec = l.scoring_settings?.rec ?? 0;
      const ppr = rec >= 1 ? 'PPR' : rec > 0 ? 'Medio PPR' : 'Estándar';
      const sf = (l.roster_positions || []).includes('SUPER_FLEX') ? 'Superflex' : '';
      const img = l.avatar ? `<img src="${avatar(l.avatar)}" alt="" loading="lazy">` : `<div class="avatar">${esc(l.name[0] || '?')}</div>`;
      return `<a class="carpeta" href="#/liga/${l.league_id}/inicio">
        <div class="fila">${img}<div style="min-width:0"><h3>${esc(l.name)}</h3><small class="nota">${l.total_rosters} equipos · ${esc(temporada)}</small></div></div>
        <div class="datos"><span class="etiqueta">${tipo}</span><span class="etiqueta">${ppr}</span>${sf ? `<span class="etiqueta">${sf}</span>` : ''}</div>
      </a>`;
    }).join('')}</div><div id="avisos"></div>`;
    tarjetaAvisos($('#avisos'), ctx, { usuario: { id: u.id, nombre: u.nombre }, ligas: ligas.map((l) => ({ id: l.league_id, nombre: l.name })) });
    abrirPendiente(app);
  } catch {
    $('#cuerpo').innerHTML = '<div class="tarjeta vacio">No me pude conectar con Sleeper. Revisa tu internet e intenta de nuevo.</div>';
    codyDice(app, ctx, 'No pude hablar con Sleeper. Revisa tu internet.', { animo: 'Triste' });
  }
}

/** Tarjeta para activar las notificaciones de Cody (tu equipo y noticias). */
function tarjetaAvisos(el, ctx, datos) {
  const pintar = () => {
    const p = preferencias();
    const s = soporte();
    el.innerHTML = `<section class="tarjeta"><header><h2>🔔 Avisos de Cody</h2>
      <small>Te aviso si un titular se lesiona o se va de bye, si tienes un puesto vacío y las noticias de tus jugadores.</small></header>
      ${s === 'instalar' ? `<p class="nota">📲 En iPhone primero agrega la app a tu pantalla de inicio: toca <b>Compartir</b> → <b>Agregar a pantalla de inicio</b>, ábrela desde ahí y vuelve a esta tarjeta.</p>`
      : s === 'no' ? '<p class="nota">Este navegador no permite notificaciones. Prueba con Chrome o Safari actualizado.</p>'
      : `<div class="chips">
          <button data-op="equipo" class="${p.equipo ? 'activo' : ''}">🏈 Mi equipo</button>
          <button data-op="noticias" class="${p.noticias ? 'activo' : ''}">📰 Noticias</button>
        </div>
        <button class="boton ancho" id="btn-avisos">${p.activo ? '🔕 Apagar avisos' : '🔔 Activar avisos'}</button>
        <p class="nota" style="margin-top:8px" id="estado-avisos">${p.activo ? '✅ Avisos activados en este teléfono.' : esIOS() ? 'Funciona con la app agregada a tu pantalla de inicio.' : ''}</p>`}
    </section>`;
    if (s !== 'si') return;
    $$('[data-op]', el).forEach((b) => b.addEventListener('click', async () => {
      const actual = preferencias();
      const nuevo = { ...actual, [b.dataset.op]: !actual[b.dataset.op] };
      localStorage.setItem('fg:avisos', JSON.stringify({ t: Date.now(), v: nuevo }));
      if (actual.activo) await activar({ ...datos, equipo: nuevo.equipo, noticias: nuevo.noticias }).catch(() => {});
      pintar();
    }));
    $('#btn-avisos', el).onclick = async () => {
      const btn = $('#btn-avisos', el);
      btn.disabled = true;
      try {
        if (preferencias().activo) {
          await desactivar();
          codyDice(document, ctx, 'Listo, ya no te molesto. Si me necesitas, aquí estoy. 🐛', { animo: 'Triste' });
        } else {
          const p2 = preferencias();
          await activar({ ...datos, equipo: p2.equipo, noticias: p2.noticias });
          codyDice(document, ctx, '¡Hecho! 🔔 Te aviso si pasa algo con tu equipo o hay noticias de tus jugadores.', { animo: 'Touchdown' });
        }
      } catch (e) {
        codyDice(document, ctx, e.message === 'permiso'
          ? 'Necesito tu permiso para mandarte avisos. Revisa los permisos de notificaciones del navegador.'
          : 'No pude activar los avisos ahora. Intenta en un rato.', { animo: 'Triste' });
      }
      pintar();
    };
  };
  pintar();
}
