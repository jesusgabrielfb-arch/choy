import './estilos/app.css';
import { sesion } from './estado.js';
import { vistaBienvenida, vistaCarpetas, vistaEquipoFavorito } from './ui/inicio.js';
import { vistaLiga } from './ui/liga.js';
import { vistaNoticias } from './ui/noticias.js';
import { crearMascota } from './mascota/mascota3d.js';
import { aplicarTema, EQUIPOS } from './datos/equipos.js';
import { codyHtml } from './ui/comun.js';
import { registrarServiceWorker } from './notificaciones.js';

const app = document.getElementById('app');
aplicarTema(sesion.equipo);

// Un solo Cody en 3D que se muda a la pantalla donde se necesite.
// Mientras carga el 3D se ve una foto idéntica de Cody (public/cody.webp), así nunca sale vacío.
const ctx = {
  mascota: null,
  _cargando: null,
  _lienzo: null,
  cargarMascota() {
    if (!ctx._lienzo) {
      ctx._lienzo = document.createElement('div');
      ctx._lienzo.style.cssText = 'width:100%;height:100%';
    }
    ctx._cargando ??= crearMascota(ctx._lienzo).then((m) => {
      ctx.mascota = m;
      // Si lo tocas, Cody te dice algo… y si lo tocas mucho seguido, se enoja y suelta palabrotas
      let toques = 0;
      let ultimo = 0;
      ctx._lienzo.addEventListener('click', async () => {
        const ahora = Date.now();
        toques = ahora - ultimo < 6000 ? toques + 1 : 1;
        ultimo = ahora;
        if (toques > 10) toques = 1;
        const [F, { codyDice }] = await Promise.all([import('./ui/frases.js'), import('./ui/comun.js')]);
        const [frase, animo] = F.alTocarSeguido(toques);
        codyDice(document, ctx, frase, { animo });
      });
      const e = EQUIPOS[sesion.equipo];
      if (e) m.vestir(e);
      // Quita la foto cuando el 3D ya dibujó su primer cuadro (sin parpadeo)
      requestAnimationFrame(() => requestAnimationFrame(() => ctx._lienzo.parentElement?.classList.add('con-3d')));
      return m;
    }).catch((e) => {
      console.warn('Sin 3D, se queda la foto de Cody:', e);
      return null;
    });
    return ctx._cargando;
  },
  async ponerMascota(contenedor) {
    if (!contenedor) return null;
    ctx.cargarMascota();
    contenedor.appendChild(ctx._lienzo);
    if (ctx.mascota) contenedor.classList.add('con-3d');
    return ctx._cargando;
  },
  ir,
};

async function ir() {
  clearInterval(ctx.ciclo);
  ctx.liga = null;
  if (sesion.equipo) {
    const e = aplicarTema(sesion.equipo);
    ctx.mascota?.vestir(e);
  }
  const ruta = location.hash.replace(/^#\/?/, '').split('/');
  window.scrollTo(0, 0);
  if (!sesion.usuario) return vistaBienvenida(app, ctx);
  if (ruta[0] === 'equipo-favorito' || !sesion.equipo) return vistaEquipoFavorito(app, ctx);
  if (ruta[0] === 'liga' && ruta[1]) return vistaLiga(app, ctx, ruta[1], ruta[2] || 'inicio', ruta[3] ? Number(ruta[3]) : null);
  if (ruta[0] === 'nfl') {
    app.innerHTML = `<header class="barra"><a class="boton-icono" href="#/" aria-label="Volver">←</a><div class="titulo"><h1>NFL 🏟️</h1><small>Calendario y los 32 equipos</small></div></header>
      ${codyHtml()}<div id="vista">${'<div class="cargando"><div class="gusanito"></div></div>'}</div>`;
    const { ponerCody } = await import('./ui/comun.js');
    ponerCody(app, ctx, 'Aquí está toda la NFL: el calendario con las horas y la plantilla de cada equipo. Toca a un jugador para ver su registro.', { animo: 'Hablar' });
    const [{ vistaNFL }, S] = await Promise.all([import('./ui/nfl.js'), import('./datos/sleeper.js')]);
    const [jugadores, est] = await Promise.all([S.jugadores(), S.estadoNFL()]);
    const semana = Math.max(1, Math.min(18, est.display_week || est.week || 1));
    ctx.nfl = { jugadores, temporada: est.season, semana };
    return vistaNFL(document.getElementById('vista'), ctx.nfl, ctx);
  }
  if (ruta[0] === 'noticias') {
    app.innerHTML = `<header class="barra"><a class="boton-icono" href="#/" aria-label="Volver">←</a><div class="titulo"><h1>Noticias NFL</h1><small>En español</small></div></header>
      ${codyHtml()}<div id="vista"></div>`;
    ctx.ponerMascota(document.querySelector('[data-cody]'));
    return vistaNoticias(document.getElementById('vista'), null, ctx);
  }
  return vistaCarpetas(app, ctx);
}

// Tocar a cualquier jugador (en listas, el enfrentamiento, equipos…) abre su ficha con el registro de juego
document.addEventListener('click', async (e) => {
  // Tocar la letra del cruce (A–F): Cody explica por qué
  const nota = e.target.closest('.nota-cruce');
  if (nota) {
    e.stopPropagation();
    const { codyDice } = await import('./ui/comun.js');
    const animo = { A: 'Feliz', B: 'Feliz', C: 'Hablar', D: 'Sorpresa', F: 'Enojado' }[nota.textContent.trim()] || 'Hablar';
    codyDice(document, ctx, `${nota.textContent.trim()}: ${nota.getAttribute('aria-label') || ''}`, { animo });
    document.querySelector('.cody')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const fila = e.target.closest('.jugador[data-id], .ef-j[data-id]');
  if (!fila || e.target.closest('button, a, input, select, summary')) return;
  if (fila.closest('.ficha-capa, .buscador, .tutorial')) return;
  const { abrirFicha } = await import('./ui/ficha.js');
  const d = ctx.liga;
  const jugador = d?.jugadores?.[fila.dataset.id] || ctx.nfl?.jugadores?.[fila.dataset.id];
  abrirFicha({ id: fila.dataset.id, jugador, d, temporada: d?.temporada || ctx.nfl?.temporada, semanaActual: d?.semanaActual || ctx.nfl?.semana, ctx });
});

// Cody empieza a cargar desde el primer instante, en paralelo con todo lo demás
ctx.cargarMascota();
registrarServiceWorker();
addEventListener('hashchange', ir);
ir();
