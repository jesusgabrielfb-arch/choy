import './estilos/app.css';
import { sesion } from './estado.js';
import { vistaBienvenida, vistaCarpetas } from './ui/inicio.js';
import { vistaLiga } from './ui/liga.js';
import { vistaNoticias } from './ui/noticias.js';
import { crearMascota } from './mascota/mascota3d.js';

const app = document.getElementById('app');

// Una sola mascota que se muda al lugar donde se necesite.
const ctx = {
  mascota: null,
  _cargando: null,
  async ponerMascota(contenedor) {
    if (!contenedor) return null;
    try {
      if (!ctx._cargando) {
        ctx._lienzo = document.createElement('div');
        ctx._lienzo.style.cssText = 'width:100%;height:100%';
        contenedor.appendChild(ctx._lienzo);
        ctx._cargando = crearMascota(ctx._lienzo).then((m) => (ctx.mascota = m));
      } else {
        contenedor.appendChild(ctx._lienzo);
      }
      return await ctx._cargando;
    } catch (e) {
      console.warn('Sin 3D:', e);
      contenedor.innerHTML = '<div style="font-size:72px;text-align:center;line-height:1.6">🐛</div>';
      return null;
    }
  },
  ir,
};

async function ir() {
  const ruta = location.hash.replace(/^#\/?/, '').split('/');
  window.scrollTo(0, 0);
  if (!sesion.usuario) return vistaBienvenida(app, ctx);
  if (ruta[0] === 'liga' && ruta[1]) return vistaLiga(app, ctx, ruta[1], ruta[2] || 'resumen');
  if (ruta[0] === 'noticias') {
    app.innerHTML = `<header class="barra"><a class="boton-icono" href="#/">←</a><div class="titulo"><h1>Noticias NFL</h1><small>En español</small></div></header><div id="vista"></div>`;
    return vistaNoticias(document.getElementById('vista'), null);
  }
  return vistaCarpetas(app, ctx);
}

addEventListener('hashchange', ir);
ir();
