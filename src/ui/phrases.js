// Lo que dice Pancracio. {m} = materia, {n} = nota necesaria.

export const PHRASES = {
  hello: [
    '¡Hola! Soy Pancracio. Mete tus notas al horno y te digo cómo vas.',
    '¡Buenas! Medio quemado, pero listo para ayudarte con tus notas.',
  ],
  poke: [
    '¡Ay! Cuidado, que todavía estoy caliente.',
    'Mi lado quemado es mi lado bueno. Bueno… más o menos.',
    'Si me sigues tocando me voy a tostar más.',
    '¡Eso dio cosquillas!',
    'No soy pan de ayer, ¿eh? Estoy recién horneado.',
    'Toc toc. ¿Quién es? El IV bimestre… 😬',
  ],
  oven: [
    'Ese horno es el año escolar. El IV bimestre es la puerta… ahí se quema el pan.',
    'No toques el horno, que quema. Mejor mete tus capturas abajo.',
  ],
  baking: [
    'Horneando tus notas… huele a promedio.',
    'Leyendo cada nota con lupa de panadero…',
    'Comparando con lo que calcula el portal…',
  ],
  // Va bien: ánimo para seguir así.
  good: [
    '¡Vas dorado! Sigue así y este año sale del horno perfecto.',
    '¡Eso es! Ninguna materia se te está quemando. No aflojes ahora.',
    'Qué orgullo de masa. Mantén el ritmo hasta el último bimestre.',
    'Vas muy bien. El secreto está en no confiarse en la puerta del horno.',
    '¡Pan de panadería fina! Sigue estudiando igual y lo cierras con broche de oro.',
  ],
  // Aprobando todo, pero alguna con poco margen.
  tight: [
    'Vas pasando todo, pero {m} va justita: en lo que falta necesitas {n}. ¡No la sueltes!',
    '¡Bien! Nada se quema todavía. Eso sí, {m} está tibiecita: sigue entregando todo.',
    'Buen ritmo. Ponle un poquito más de horno a {m} y sale dorada.',
  ],
  // Va regular: unas pocas en riesgo.
  mixed: [
    'Vas bien en casi todo, pero {m} está en la puerta del horno. Necesitas {n}.',
    'Ojo con {m}: con {n} en lo que falta, te salvas. ¡Tú puedes!',
    'Casi todo está dorado. Dale cariño a {m} y no se quema.',
  ],
  // Va mal: frases motivadoras.
  bad: [
    'Tranquilo: un pan medio quemado todavía se come. Aún hay tiempo para salvar {m}.',
    'No te rindas. {m} necesita {n}: es difícil, pero se puede. Un tema por día.',
    'Yo también me quemé un poco y aquí sigo. Organízate, pregunta y entrega todo.',
    'Las notas no definen quién eres, pero sí se pueden mejorar. ¡Vamos con {m}!',
    'Un examen bueno lo cambia todo. Concéntrate en {m} y haz cada tarea que falta.',
    'Respira. Haz un plan pequeño: hoy repasas {m} 30 minutos. Mañana otro poquito.',
  ],
  lost: [
    '{m} ya no se salva este año, pero lo demás sí. Enfócate en lo que todavía puedes ganar.',
  ],
  allPassed: ['¡Año horneado y salvado! Estoy tan orgulloso que me voy a dorar más.'],
  tourDone: ['¡Listo! Ahora sí, a hornear esas notas.'],
};

let last = '';

/** Escoge una frase al azar (sin repetir la anterior) y rellena {m} y {n}. */
export function say(kind, vars = {}) {
  const list = PHRASES[kind] || PHRASES.hello;
  let pick = list[Math.floor(Math.random() * list.length)];
  if (list.length > 1 && pick === last) pick = list[(list.indexOf(pick) + 1) % list.length];
  last = pick;
  return pick.replace('{m}', vars.m ?? 'esa materia').replace('{n}', vars.n ?? 'un poco más');
}
