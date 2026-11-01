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
const ctx = {
  mascota: null,
  _cargando: null,
  _lienzo: null,
  async ponerMascota(contenedor) {
    if (!contenedor) return null;
    if (!ctx._lienzo) {
      ctx._lienzo = document.createElement('div');
      ctx._lienzo.style.cssText = 'width:100%;height:100%';
    }
    contenedor.appendChild(ctx._lienzo);
    try {
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
        return m;
      });
      return await ctx._cargando;
    } catch (e) {
      console.warn('Sin 3D:', e);
      ctx._lienzo.innerHTML = '<div style="font-size:64px;display:grid;place-items:center;height:100%">🐛</div>';
      return null;
    }
  },
  ir,
};

async function ir() {
  clearInterval(ctx.ciclo);
  if (sesion.equipo) {
    const e = aplicarTema(sesion.equipo);
    ctx.mascota?.vestir(e);
  }
  const ruta = location.hash.replace(/^#\/?/, '').split('/');
  window.scrollTo(0, 0);
  if (!sesion.usuario) return vistaBienvenida(app, ctx);
  if (ruta[0] === 'equipo-favorito' || !sesion.equipo) return vistaEquipoFavorito(app, ctx);
  if (ruta[0] === 'liga' && ruta[1]) return vistaLiga(app, ctx, ruta[1], ruta[2] || 'inicio', ruta[3] ? Number(ruta[3]) : null);
  if (ruta[0] === 'noticias') {
    app.innerHTML = `<header class="barra"><a class="boton-icono" href="#/" aria-label="Volver">←</a><div class="titulo"><h1>Noticias NFL</h1><small>En español</small></div></header>
      ${codyHtml()}<div id="vista"></div>`;
    ctx.ponerMascota(document.querySelector('[data-cody]'));
    return vistaNoticias(document.getElementById('vista'), null, ctx);
  }
  return vistaCarpetas(app, ctx);
}

registrarServiceWorker();
addEventListener('hashchange', ir);
ir();
