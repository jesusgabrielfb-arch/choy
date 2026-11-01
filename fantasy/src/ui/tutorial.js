// Tutorial con Cody: resalta cada parte de la pantalla y la explica. Sale solo la primera vez
// (se puede saltar) y se puede volver a ver desde el buscador.
import { esc } from './comun.js';
import { leerCache, guardarCache } from '../datos/http.js';

export const tutorialVisto = () => !!leerCache('tutorial');
export const marcarVisto = () => guardarCache('tutorial', true);
export const reiniciarTutorial = () => { try { localStorage.removeItem('fg:tutorial'); } catch { /* nada */ } };

export const PASOS = [
  { texto: '¡Bienvenido a Fantasy x Cody! 🐛 Te enseño en un minuto cómo funciona. Si ya sabes, toca "Saltar".', animo: 'Saludar' },
  { sel: '#selector-semana', texto: 'Aquí cambias de semana: ◀ para ver las pasadas (con resultados) y ▶ para las que vienen.', animo: 'Hablar' },
  { sel: '.cody', texto: 'Yo vivo aquí arriba y te digo lo más importante. Toca "¿Qué hago?" para mis consejos… y no me toques mucho, que me enojo. 😤', animo: 'Feliz' },
  { sel: '#ver-enfrentamiento', texto: 'Tu enfrentamiento, puesto por puesto, como en Sleeper. Número grande: puntos hechos; chico: proyección. Arriba va el % de ganar, en vivo.', animo: 'Hablar' },
  { sel: '.plan', texto: 'Lo que tienes que hacer: los cambios que más puntos te dan esta semana. Toca uno para ver el detalle.', animo: 'Cool' },
  { sel: '.accesos', texto: 'Más cosas: los duelos de toda la liga, tu defensa, tu punto débil y la tabla. Se abren al tocarlos.', animo: 'Hablar' },
  { sel: '#buscar', texto: 'La lupa 🔍 encuentra cualquier función o jugador, con su ficha y botón para armar un trade.', animo: 'Hablar' },
  { sel: '.pestanas a[href*="/equipo"]', texto: 'Equipo: tu alineación recomendada (quién entra y quién sale), lesionados y las mejores defensas de la semana.', animo: 'Hablar' },
  { sel: '.pestanas a[href*="/mercado"]', texto: 'Mercado: arma trades justos (yo te digo si te roban 😠), compra barato y vende caro.', animo: 'Cool' },
  { sel: '.pestanas a[href*="/jugadores"]', texto: 'Jugadores: qué agregar de waivers, byes, stash y los suplentes que suben.', animo: 'Hablar' },
  { sel: '.pestanas a[href*="/noticias"]', texto: 'Noticias en español, primero las de tus jugadores.', animo: 'Hablar' },
  { texto: 'Y en la pantalla de tus ligas activas los avisos 🔔 y cambias tu equipo favorito. ¡A ganar esa liga! 🏆', animo: 'Touchdown' },
];

/** Inicia el tutorial. hablar(texto, animo) hace que Cody lo diga. */
export function iniciarTutorial({ hablar = () => {}, pasos = PASOS } = {}) {
  document.querySelector('.tutorial')?.remove();
  const validos = pasos.filter((p) => !p.sel || document.querySelector(p.sel));
  let i = 0;
  const capa = document.createElement('div');
  capa.className = 'tutorial';
  capa.innerHTML = '<div class="tut-foco"></div><div class="tut-globo" role="dialog" aria-live="polite"></div>';
  document.body.appendChild(capa);
  const foco = capa.querySelector('.tut-foco');
  const globo = capa.querySelector('.tut-globo');

  const terminar = () => {
    marcarVisto();
    capa.remove();
    removeEventListener('resize', mostrar);
  };

  function mostrar() {
    const paso = validos[i];
    const el = paso.sel ? document.querySelector(paso.sel) : null;
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'instant' in document.body.style ? 'instant' : 'auto' });
      const r = el.getBoundingClientRect();
      const m = 6;
      Object.assign(foco.style, { display: 'block', top: `${r.top - m}px`, left: `${r.left - m}px`, width: `${r.width + m * 2}px`, height: `${r.height + m * 2}px` });
      // el globo va arriba o abajo según dónde quede lo resaltado
      globo.classList.toggle('arriba', r.top + r.height / 2 > innerHeight / 2);
    } else {
      foco.style.display = 'none';
      globo.classList.remove('arriba');
    }
    globo.classList.toggle('centro', !el);
    capa.classList.toggle('oscuro', !el);
    const ultimo = i === validos.length - 1;
    globo.innerHTML = `<div class="tut-cab"><span class="tut-cody">🐛</span><b>Cody</b><span class="tut-paso">${i + 1}/${validos.length}</span></div>
      <p>${esc(paso.texto)}</p>
      <div class="tut-botones">
        ${ultimo ? '' : '<button class="chip-boton" data-saltar>Saltar</button>'}
        ${i > 0 ? '<button class="chip-boton" data-atras>‹ Atrás</button>' : ''}
        <button class="chip-boton principal" data-sig>${ultimo ? '¡Listo! 🏈' : 'Siguiente ›'}</button>
      </div>`;
    globo.querySelector('[data-sig]').onclick = () => { if (ultimo) terminar(); else { i++; mostrar(); } };
    globo.querySelector('[data-atras]')?.addEventListener('click', () => { i--; mostrar(); });
    globo.querySelector('[data-saltar]')?.addEventListener('click', terminar);
    hablar(paso.texto, paso.animo);
  }
  addEventListener('resize', mostrar);
  mostrar();
  return { terminar };
}
