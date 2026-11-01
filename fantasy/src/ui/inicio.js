// Bienvenida, elegir equipo favorito y "carpetas" (una por cada liga de fantasy).
import { esc, $, $$, cargando, codyHtml, ponerCody, codyDice } from './comun.js';
import { cargarInicio, sesion } from '../estado.js';
import { avatar } from '../datos/sleeper.js';
import { EQUIPOS, aplicarTema } from '../datos/equipos.js';

export async function vistaBienvenida(app, ctx) {
  app.innerHTML = `<section class="bienvenida">
    ${codyHtml({ grande: true })}
    <h1>¡Hola! Soy Cody</h1>
    <p>Tu gusano del fantasy. Dame tu usuario de Sleeper y te digo qué hacer cada semana en cada una de tus ligas.</p>
    <form class="campo" id="form">
      <input id="usuario" autocomplete="username" autocapitalize="off" spellcheck="false"
        placeholder="Usuario de Sleeper" aria-label="Usuario de Sleeper" required />
      <button class="boton" type="submit">Entrar</button>
    </form>
    <div class="error" id="error" role="alert"></div>
    <p class="nota" style="margin-top:14px">Solo leo tu liga. No pido contraseña.</p>
  </section>`;
  ponerCody(app, ctx, 'Escribe tu usuario y vamos a ganar esta liga. 🏆', { animo: 'Feliz' });
  $('#form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = $('#usuario').value.trim();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    $('#error').textContent = '';
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
    <div class="pie-fijo"><button class="boton ancho" id="listo" ${elegido ? '' : 'disabled'}>Listo</button></div>`;
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
      <div class="titulo"><h1>Tus ligas</h1><small>@${esc(u.display || u.nombre)}</small></div>
      <a class="punto-equipo" href="#/equipo-favorito" title="Cambiar equipo favorito">${esc(sesion.equipo || 'NFL')}</a>
      <a class="boton-icono" href="#/noticias" aria-label="Noticias">📰</a>
      <button class="boton-icono" id="salir" aria-label="Cambiar de usuario">⎋</button>
    </header>
    ${codyHtml()}
    <div id="cuerpo">${cargando('Un momento…')}</div>`;
  ponerCody(app, ctx, 'Buscando tus ligas…', { animo: 'Hablar' });
  $('#salir').onclick = () => { sesion.salir(); location.hash = '#/'; ctx.ir(); };
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
    }).join('')}</div>`;
  } catch {
    $('#cuerpo').innerHTML = '<div class="tarjeta vacio">No me pude conectar con Sleeper. Revisa tu internet e intenta de nuevo.</div>';
    codyDice(app, ctx, 'No pude hablar con Sleeper. Revisa tu internet.', { animo: 'Triste' });
  }
}
