/* ---------- mascotas: Hidroxi y Etérea ---------- */
const SP='<b class="sp">Hidroxi:</b>',OV='<b class="ov">Etérea:</b>',BOTH='<b class="sp">Hidroxi</b> y <b class="ov">Etérea:</b>';
const PHR={
  happy:[SP+'¡Eso! Más rápido que un –OH buscando su carbono.',SP+'Nivel experto desbloqueado.',SP+'Ni con lentes de sol se ve algo tan brillante.',SP+'¡Bien! Esa te la sabías de memoria.',
         OV+'¡Me encanta! Eres el puente de oxígeno de este salón.',OV+'¡Bravo! Te ganaste mi moño.',OV+'¡Sí! Así se estudia.',OV+'¡Correcto! Estoy muy orgullosa.',
         SP+'¡Boom! Directo a la cadena principal.',SP+'Numeraste desde el lado correcto, se nota.',SP+'Respuesta con lentes de sol: cool y correcta.',SP+'Mi hidrógeno está bailando de la emoción.',
         OV+'¡Qué bonito! Me dan ganas de bailar.',OV+'¡Perfecto! Hasta mis carbonos brillan.',OV+'¡Lo sabías! Te estás volviendo una experta/o.',OV+'¡Excelente! El examen no te va a asustar.'],
  sad:[SP+'Tranqui, hasta yo me pierdo buscando la cadena más larga.',SP+'Uy, esa engaña. Vamos por la siguiente.',SP+'Me bajó la autoestima… pero tú puedes.',
       OV+'Ay… no pasa nada, repásalo conmigo.',OV+'Casi casi. ¡La próxima sí!',OV+'No llores, que la que llora soy yo.',
       SP+'Error de numeración. Recalculando…',SP+'Shhh, nadie vio nada. Siguiente.',SP+'¿Contaste bien los carbonos? Desarrolla los paréntesis.',
       OV+'Se me cayó el moño con esa…',OV+'Lee la explicación de abajo, ahí está la clave.',OV+'¿Pusiste el -oxi en el grupo menor? Revísalo.']
};
const NEXTQ=[SP+'Siguiente pregunta. Tú tranqui y yo hidroxilado.',OV+'Lee con calma, la respuesta está en la guía.',SP+'Esta tiene truco… o no. Piénsala bien.',
  OV+'Tú puedes, yo creo en ti.',SP+'Primero busca el –OH, después todo lo demás.',OV+'¿Te acuerdas de la tabla de radicales? Te va a servir.',
  SP+'Desarrolla los paréntesis antes de contar.',OV+'Esta es de las que pregunta la profe Yanin.',SP+'Respira, lee y elige.',OV+'¡Otra más! Ya casi lo dominas.',
  SP+'Descarta las que suenan raro primero.',OV+'Orden alfabético: iso sí cuenta; di, tri, sec y ter no.'];
const MILE={25:[OV+'¡Ya vas un cuarto del quiz! Sigue así.',SP+'25% completado. Calentando motores.'],
  50:[BOTH+'¡Mitad del quiz! Estamos bailando de la emoción.',SP+'50%. Ya vamos por el carbono del medio.'],
  75:[OV+'¡75%! Ya casi llegamos al final de la cadena.',SP+'Tres cuartos listos. ¡Último empujón!'],
  last:[BOTH+'¡Última pregunta! Dale con todo.',OV+'Esta es la última. ¡Tú puedes!']};
const IDLEQ=[SP+'¿Sigues ahí? Lee otra vez la pregunta.',OV+'Si dudas, descarta las que no tienen sentido.',SP+'Te estás tardando más que yo buscando mi carbono.',OV+'Tómate tu tiempo, pero no te quedes dormida/o.'];
const FLIP=[SP+'¿Le atinaste? Sé sincera/o.',OV+'¿Era lo que pensabas?',SP+'Ahí está. ¿Te la sabías?',OV+'Léela en voz alta, se te queda mejor.',SP+'Dale a "Me la sé" solo si de verdad te la sabías.'];
const REVP=[OV+'¿Lo dijiste antes de destaparlo? ¡Bien!',SP+'Destapado. ¿Coincide con lo que pensabas?',OV+'Repite esa en voz alta dos veces.',SP+'Esa sale seguro en el examen.',OV+'Vas muy bien con el repaso.'];
const YAI={
  bad:[SP+'Tres seguidas mal… la profe Yanin se va a molestar. ¡Concéntrate!',OV+'Si sigues así te vas a quedar en Química con la profe Yanin. ¡Repasa las tarjetas!',
       SP+'La profe Yanin está viendo esto… y no está feliz. ¡Tú puedes remontar!',OV+'Ay no… la profe Yanin nos va a regañar a los tres. ¡Lee bien la pregunta!',
       SP+'Racha mala detectada. La profe Yanin ya está sacando el bolígrafo rojo.',OV+'Respira hondo. Ve a "No te confundas" y vuelve: no le demos el gusto a la profe Yanin.',
       SP+'Si la profe Yanin ve esto, te pone tarea extra. ¡Vamos, la siguiente sí!',OV+'Así no, mi amor… la profe Yanin nos va a dejar en Química.',SP+'Houston, tenemos un problema: la profe Yanin.',OV+'Pausa: mira los ejercicios resueltos y regresa. La profe Yanin lo agradecerá.'],
  good:[OV+'¡La profe Yanin estaría orgullosa de ti!',SP+'Con esto le sacas un 5 a la profe Yanin.',OV+'¡Así, así! La profe Yanin te va a poner estrellita.',
        SP+'Ni la profe Yanin lo explica tan bien.',OV+'Si la profe Yanin te viera, te pone de ejemplo en clase.',SP+'Yanin: impresionada. Yo: impresionado.',BOTH+'¡Racha imparable! La profe Yanin no lo puede creer.'],
  end:{top:BOTH+'¡Un 5 seguro! La profe Yanin te va a felicitar.',ok:OV+'¡Muy bien! Repasa las falladas y vas por el 5.',low:SP+'Uy… con esa nota la profe Yanin se va a molestar. Repasa las falladas y lo intentamos otra vez.'},
  cards:[SP+'Ya van varias "todavía no"… la profe Yanin pregunta justo esas. ¡Repásalas!',OV+'Tranqui, pero no las dejes: la profe Yanin las va a preguntar.']
};
const TIPS=[SP+'Soy un oxígeno con mi hidrógeno: juntos somos el grupo hidroxilo (–OH).',OV+'Yo soy un puente de oxígeno entre dos carbonos: R–O–R\'.',SP+'Si el carbono donde vivo tiene 3 vecinos carbonos, soy un alcohol terciario.',
  OV+'En IUPAC, el grupo más pequeño de un éter termina en -oxi.',SP+'Siempre se numera desde el lado donde estoy yo, el –OH.',OV+'En RF los radicales van en orden alfabético: éter etil-metílico.',
  SP+'C₂H₅ y C₃H₇ son cadenas escondidas: ¡desarróllalas!',OV+'Si el radical es vinilo, en IUPAC se dice etenoxi.',SP+'El metanol es el alcohol de madera y el etanol, el espíritu de vino.',
  OV+'La glicerina es el 1,2,3-propanotriol: tres –OH.',SP+'El 2,4,5-hexanotriol está mal: es 2,3,5-hexanotriol.',OV+'La profe Yanin siempre pregunta cómo corregir nombres. ¡Practica la parte II!',
  SP+'Iso cuenta para el orden alfabético; di, tri, sec y ter no.',OV+'Termina todos los temas y la profe Yanin no te agarra desprevenida/o.'];
