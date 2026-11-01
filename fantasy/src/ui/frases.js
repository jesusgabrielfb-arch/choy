// Frases de Cody: humor, ánimo y algún que otro regaño.

const al = (lista) => lista[Math.floor(Math.random() * lista.length)];

export function saludo(nombre = '') {
  const h = new Date().getHours();
  const quien = nombre ? `, ${nombre}` : '';
  if (h < 12) return al([`¡Buenos días${quien}! ☀️ Ya revisé tu equipo mientras dormías.`, `¡Buen día${quien}! El café para ti, las estadísticas para mí. ☕`]);
  if (h < 19) return al([`¡Buenas tardes${quien}! 🏈 Vamos a ver cómo va esa liga.`, `¡Qué tal${quien}! Traigo noticias frescas de tu equipo.`]);
  return al([`¡Buenas noches${quien}! 🌙 Antes de dormir, revisa esto.`, `Nada de dormirse${quien}: los waivers no se piden solos. 😴`]);
}

export const planVacio = () => al([
  'Tu alineación está más pulida que mis antenas. ✨ Nada que cambiar.',
  'Nada que tocar: si la cambias, la empeoras. 😎',
  'Todo en orden, capitán. Puedes ver el partido tranquilo. 🍿',
]);

export const resumenPlan = (n, urgentes) => (urgentes
  ? al([`Ojo 👀: tienes ${n} cosa${n > 1 ? 's' : ''} por hacer y ${urgentes} ${urgentes > 1 ? 'son urgentes' : 'es urgente'}.`,
    `¡Alerta gusanera! 🚨 ${urgentes} cambio${urgentes > 1 ? 's' : ''} urgente${urgentes > 1 ? 's' : ''} antes del partido.`])
  : al([`Tengo ${n} idea${n > 1 ? 's' : ''} para sumar puntos esta semana. 💡`, `${n} jugada${n > 1 ? 's' : ''} maestra${n > 1 ? 's' : ''} lista${n > 1 ? 's' : ''}. Tú solo dale clic en Sleeper. 🧠`]));

export const ganando = () => al(['¡Vamos arriba! 🔥 Pero no te confíes: el pan se quema en la puerta del horno.', 'Vas ganando. Yo ya estoy practicando el baile de la victoria. 💃']);
export const perdiendo = () => al(['Vamos abajo, pero esto no se acaba hasta el último snap. 💪', 'Hay que remontar. Haz los cambios del plan y crúzale los dedos conmigo. 🤞']);

export const alTocar = () => al([
  '¡Ey, eso hace cosquillas! 🐛',
  'Dato gusano: los kickers ganan más ligas de las que crees. 🦶',
  '¿Sabías que soy el único gusano con Super Bowl de fantasy? Bueno… casi. 🏆',
  'No me toques tanto, que me arrugas la camiseta. 👕',
  'Si tu rival te ofrece un 3 por 1, desconfía. Siempre. 🕵️',
  'Mi consejo gratis: nunca dejes un puesto vacío. Nunca. 😤',
  'Revisa los reportes de lesiones el viernes. Yo lo hago a diario. 🩹',
  '¡Hola! Sí, sigo aquí. Me encanta trabajar para ti. 💚',
]);

export const defensa = (d, J) => {
  if (!d?.mejorLibre) return null;
  const libre = `${J[d.mejorLibre.id]?.nombre} (${d.mejorLibre.razon})`;
  if (d.miaEnBye) return `🛡️ Tu defensa está de bye. Agarra a ${libre}.`;
  if (d.cambiar) return `🛡️ Cambia de defensa: ${libre} está libre y tiene mejor cruce que la tuya.`;
  return al(['🛡️ Tu defensa tiene buen cruce esta semana. Déjala quieta.', '🛡️ Tu defensa está bien parada. No hay una libre mejor.']);
};
