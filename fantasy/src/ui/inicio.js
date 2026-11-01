// Pantalla de bienvenida y "carpetas" (una por cada liga de fantasy).
import { esc, cargando } from './comun.js';
import { cargarInicio, sesion } from '../estado.js';
import { avatar } from '../datos/sleeper.js';

export async function vistaBienvenida(app, ctx) {
  app.innerHTML = `<section class="bienvenida">
    <div class="escenario" id="escenario"></div>
    <h1>¡Hola! Soy tu gusano del fantasy</h1>
    <p>Escribe tu usuario de Sleeper y te armo una carpeta por cada liga: titulares, trades justos,
      waivers, lesiones y noticias en español.</p>
    <form class="campo" id="form">
      <input id="usuario" autocomplete="username" autocapitalize="off" spellcheck="false"
        placeholder="Usuario de Sleeper" aria-label="Usuario de Sleeper" required />
      <button class="boton" type="submit">Entrar</button>
    </form>
    <div class="error" id="error" role="alert"></div>
    <p class="nota">Solo leo tu liga (Sleeper no deja a otras apps hacer cambios). No pido contraseña.</p>
  </section>`;
  ctx.ponerMascota(document.getElementById('escenario'));
  document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('usuario').value.trim();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    document.getElementById('error').textContent = '';
    try {
      const datos = await cargarInicio(nombre);
      sesion.usuario = { nombre, id: datos.usuario.user_id, display: datos.usuario.display_name };
      location.hash = '#/';
      ctx.ir();
    } catch (err) {
      document.getElementById('error').textContent = err.message.includes('404') || err.message.includes('usuario')
        ? 'No encontré ese usuario. Revisa cómo está escrito en Sleeper.'
        : 'No me pude conectar con Sleeper. Intenta de nuevo en un momento.';
      ctx.mascota?.animo('Triste');
    } finally {
      btn.disabled = false;
    }
  });
}

export async function vistaCarpetas(app, ctx) {
  const u = sesion.usuario;
  app.innerHTML = `<header class="barra">
      <div class="titulo"><h1>Tus carpetas</h1><small>@${esc(u.display || u.nombre)}</small></div>
      <a class="boton-icono" href="#/noticias" title="Noticias">📰</a>
      <button class="boton-icono" id="salir" title="Cambiar de usuario">⎋</button>
    </header>
    <div id="cuerpo">${cargando('Buscando tus ligas…')}</div>`;
  document.getElementById('salir').onclick = () => { sesion.salir(); location.hash = '#/'; ctx.ir(); };
  try {
    const { ligas, temporada } = await cargarInicio(u.nombre);
    const cuerpo = document.getElementById('cuerpo');
    if (!ligas.length) {
      cuerpo.innerHTML = `<div class="tarjeta vacio">No tienes ligas de NFL en Sleeper para ${esc(temporada)}.</div>`;
      return;
    }
    cuerpo.innerHTML = `<p class="nota">Temporada ${esc(temporada)} · ${ligas.length} liga${ligas.length > 1 ? 's' : ''}</p>
      <div class="carpetas">${ligas.map((l) => {
        const tipo = l.settings?.type === 2 ? 'Dinastía' : l.settings?.type === 1 ? 'Keeper' : 'Redraft';
        const ppr = (l.scoring_settings?.rec ?? 0) >= 1 ? 'PPR' : (l.scoring_settings?.rec ?? 0) > 0 ? 'Medio PPR' : 'Estándar';
        const sf = (l.roster_positions || []).includes('SUPER_FLEX') ? ' · Superflex' : '';
        const img = l.avatar ? `<img src="${avatar(l.avatar)}" alt="" loading="lazy">` : `<div class="avatar">${esc(l.name[0] || '?')}</div>`;
        return `<a class="carpeta" href="#/liga/${l.league_id}/resumen">
          <div class="fila">${img}<div><h3>${esc(l.name)}</h3><small class="nota">${l.total_rosters} equipos</small></div></div>
          <div class="datos"><span>${tipo}</span><span>${ppr}${sf}</span></div>
        </a>`;
      }).join('')}</div>`;
  } catch {
    document.getElementById('cuerpo').innerHTML = '<div class="tarjeta vacio">No me pude conectar con Sleeper. Revisa tu internet e intenta de nuevo.</div>';
  }
}
