/* ---------- mascotas: Tiro e Insulina ---------- */
const SP='<b class="sp">Tiro:</b>',OV='<b class="ov">Insulina:</b>',BOTH='<b class="sp">Tiro</b> e <b class="ov">Insulina:</b>';
const PHR={
  happy:[SP+'¡Eso! Mi metabolismo celular está a mil.',SP+'Nivel experto desbloqueado. T4 de 4 yodos.',SP+'Ni con lentes de sol se ve algo tan brillante.',SP+'¡Bien! Esa te la sabías de memoria.',
         OV+'¡Me encanta! Me subiste el azúcar de la emoción.',OV+'¡Bravo! Te ganaste mi moño.',OV+'¡Sí! Así se estudia.',OV+'¡Correcto! Estoy muy orgullosa.'],
  sad:[SP+'Tranqui, hasta yo me confundo entre TRH y TSH.',SP+'Uy, esa engaña. Vamos por la siguiente.',SP+'Me bajó la tiroxina… pero tú puedes.',
       OV+'Ay… no pasa nada, repásalo conmigo.',OV+'Casi casi. ¡La próxima sí!',OV+'Se me bajó la glucosa con esa…']
};
PHR.happy.push(SP+'¡Boom! Directo al órgano diana.',SP+'Retroalimentación positiva para ti.',SP+'Mis dos lóbulos aplauden esa respuesta.',SP+'Respuesta con lentes de sol: cool y correcta.',
  SP+'¡Choca esos cinco! Bueno… ese lóbulo.',SP+'Ni la hipófisis manda tan bien como tú.',
  OV+'¡Qué bonito! Me dan ganas de bailar.',OV+'¡Perfecto! Glucosa en equilibrio y tú en racha.',OV+'¡Lo sabías! Te estás volviendo una experta/o.',
  OV+'¡Sí, sí, sí! Así me gusta.',OV+'Esa respuesta merece un abrazo de hormona.',OV+'¡Excelente! El examen no te va a asustar.');
PHR.sad.push(SP+'Esa me dio hipotiroidismo de la tristeza.',SP+'Ni modo, hasta las glándulas maestras fallan.',SP+'Error de ruta. Recalculando por el sistema porta…',
  SP+'Shhh, nadie vio nada. Siguiente.',
  OV+'Ay, se me cayó el moño con esa…',OV+'No pasa nada, de los errores se aprende.',OV+'Lee la explicación de abajo, ahí está la clave.',
  OV+'Esa la repasamos juntos en las tarjetas, ¿va?',OV+'Uy, casi. ¡Ánimo que vamos bien!');
const NEXTQ=[SP+'Siguiente pregunta. Tú tranqui y yo con mis lentes.',OV+'Lee con calma, la respuesta está en el PPT.',SP+'Esta tiene truco… o no. Piénsala bien.',
  OV+'Tú puedes, yo creo en ti.',SP+'Concentración nivel glándula maestra.',OV+'¿Te acuerdas de la tabla? Te va a servir.',
  SP+'Vamos, que se acaba la T4.',OV+'Esta es de las que pregunta la profe Yaisel.',SP+'Respira, lee y elige.',OV+'¡Otra más! Ya casi lo dominas.',
  SP+'Descarta las que suenan raro primero.',OV+'Piensa en el dibujo del cuerpo, ayuda mucho.'];
const MILE={25:[OV+'¡Ya vas un cuarto del quiz! Sigue así.',SP+'25% completado. Calentando el metabolismo.'],
  50:[BOTH+'¡Mitad del quiz! Estamos bailando de la emoción.',SP+'50%. Ya vamos por la mitad del eje.'],
  75:[OV+'¡75%! Ya casi llegamos al órgano diana.',SP+'Tres cuartos listos. ¡Último empujón!'],
  last:[BOTH+'¡Última pregunta! Dale con todo.',OV+'Esta es la última. ¡Tú puedes!']};
const IDLEQ=[SP+'¿Sigues ahí? Lee otra vez la pregunta.',OV+'Si dudas, descarta las que no tienen sentido.',SP+'Te estás tardando más que la hormona en llegar por la sangre.',OV+'Tómate tu tiempo, pero no te quedes dormida/o: no hay tanta melatonina.'];
const FLIP=[SP+'¿Le atinaste? Sé sincera/o.',OV+'¿Era lo que pensabas?',SP+'Ahí está. ¿Te la sabías?',OV+'Léela en voz alta, se te queda mejor.',SP+'Dale a "Me la sé" solo si de verdad te la sabías.'];
const REVP=[OV+'¿Lo dijiste antes de destaparlo? ¡Bien!',SP+'Destapado. ¿Coincide con lo que pensabas?',OV+'Repite esa en voz alta dos veces.',SP+'Esa sale seguro en el examen.',OV+'Vas muy bien con el repaso.'];
const YAI={
  bad:[SP+'Tres seguidas mal… la profe Yaisel se va a molestar. ¡Concéntrate!',OV+'Si sigues así te vas a quedar en Biología con la profe Yaisel. ¡Repasa las tarjetas!',
       SP+'La profe Yaisel está viendo esto… y no está feliz. ¡Tú puedes remontar!',OV+'Ay no… la profe Yaisel nos va a regañar a los tres. ¡Lee bien la pregunta!',
       SP+'Racha mala detectada. Yaisel ya está sacando el bolígrafo rojo.',OV+'Respira hondo. Ve a "No te confundas" y vuelve: no le demos el gusto a la profe Yaisel.',
       SP+'Si la profe Yaisel ve esto, te pone tarea extra. ¡Vamos, la siguiente sí!',OV+'Así no, mi amor… la profe Yaisel nos va a dejar en Biología.',SP+'Houston, tenemos un problema: la profe Yaisel.',OV+'Esto es hipoglucemia de respuestas. La profe Yaisel lo va a notar.'],
  good:[OV+'¡La profe Yaisel estaría orgullosa de ti!',SP+'Con esto le sacas un 5 a la profe Yaisel.',OV+'¡Así, así! Yaisel te va a poner estrellita.',
        SP+'Ni la profe Yaisel lo explica tan bien.',OV+'Si la profe Yaisel te viera, te pone de ejemplo en clase.',SP+'Yaisel: impresionada. Yo: impresionado.',BOTH+'¡Racha imparable! La profe Yaisel no lo puede creer.'],
  end:{top:BOTH+'¡Un 5 seguro! La profe Yaisel te va a felicitar.',ok:OV+'¡Muy bien! Repasa las falladas y vas por el 5.',low:SP+'Uy… con esa nota la profe Yaisel se va a molestar. Repasa las falladas y lo intentamos otra vez.'},
  cards:[SP+'Ya van varias "todavía no"… la profe Yaisel pregunta justo esas. ¡Repásalas!',OV+'Tranqui, pero no las dejes: la profe Yaisel las va a preguntar.']
};
const TIPS=[SP+'Soy la glándula endocrina más grande del cuerpo. Con lentes, obvio.',OV+'Me fabrican las células beta de los islotes de Langerhans.',SP+'Mi T4 tiene 4 yodos y mi T3 tiene 3. Fácil.',
  OV+'Yo bajo la glucosa; mi rival, el glucagón, la sube. Somos antagónicos.',SP+'Mis 4 primas, las paratiroides, viven detrás de mí.',OV+'Si falto, la glucosa se acumula en la sangre: eso es diabetes.',
  SP+'La TSH de la hipófisis es la que me despierta.',OV+'El glucagón trabaja en el hígado y yo en los músculos.',SP+'Mi calcitonina y la paratohormona se pelean por el calcio.',
  OV+'Soy una hormona peptídica: cadena de aminoácidos.',SP+'Si produzco de más es hipertiroidismo; si de menos, hipotiroidismo.',OV+'A menor luz, más melatonina. Por eso da sueño de noche.',
  SP+'La profe Yaisel siempre pregunta el eje hipotálamo-hipófisis. ¡Dale a ▶!',OV+'Termina los 12 temas y la profe Yaisel no te agarra desprevenida/o.',
  SP+'La ADH aumenta la presión. No me la subas tú con tantos toques.',OV+'La prolactina hace la leche y la oxitocina la saca.',SP+'Las suprarrenales viven encima de los riñones.',
  OV+'Las hormonas se eliminan por la orina o en el hígado.',SP+'Adeno = anterior. Neuro = posterior. No se te olvide.',OV+'La adrenalina te ayuda a correr si te persigue un perro.'];
const pick=a=>{if(a.length<2)return a[0];a._u=a._u||[];let v,t=0;do{v=a[Math.floor(Math.random()*a.length)];t++}while(a._u.includes(v)&&t<20);a._u.push(v);if(a._u.length>Math.min(6,a.length-1))a._u.shift();return v};
const SPR=new Map();
function ensure(mood){return Promise.all(['tiro','insulina'].map(w=>{const src=`mascotas/${w}_${mood}.webp`;if(!SPR.has(src)){const i=new Image();i.src=src;SPR.set(src,(i.decode?i.decode():Promise.resolve()).catch(()=>{}))}return SPR.get(src)}))}
function play(m,mood){m.dataset.state=mood;m.style.animation='none';void m.offsetWidth;m.style.animation=''}
document.querySelectorAll('.mascot').forEach(m=>m.addEventListener('animationend',e=>{if(e.animationName==='spriteOnce'&&m.dataset.state!=='idle')play(m,'idle')}));
const HAPPY_V=()=>{const r=Math.random();return r<.55?'happy':r<.8?'dance':r<.92?'love':'spin'};
function react(id,mood,text){if(mood==='happy*')mood=HAPPY_V();
  const st=document.getElementById(id);if(!st)return;
  const tok=st._tok=(st._tok||0)+1;ensure(mood).then(()=>{if(st._tok===tok)st.querySelectorAll('.mascot').forEach(m=>play(m,mood))});
  const b=st.querySelector('.bubble');
  if(text!=null&&b){b.innerHTML=text;b.className='bubble'+(mood==='idle'?'':' '+mood);void b.offsetWidth;b.classList.add('pop')}
  clearTimeout(st._t);
  if(mood!=='idle')st._t=setTimeout(()=>{st._tok++;st.querySelectorAll('.mascot').forEach(m=>play(m,'idle'));if(b)b.className='bubble'},2250);
}
/* datos que se turnan en la portada */
let tipI=0,tipPause=0;
setInterval(()=>{if(Date.now()<tipPause||document.hidden)return;const st=document.getElementById('stage-hero');if(!st)return;
  const r=st.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
  const b=st.querySelector('.bubble');b.innerHTML='<span style="font-size:12px;color:var(--muted);display:block">¿Sabías que…?</span>'+TIPS[tipI++%TIPS.length];b.className='bubble';void b.offsetWidth;b.classList.add('pop')},7000);
const TAP={
  tiro:{fun:[['dance','¡Música, maestro! Mira cómo muevo los lóbulos.'],['spin','¡Mira mi vuelta! Ni el istmo se me dobla.'],['love','Ay, me caes bien. Pero estudia, ¿eh?'],['happy','¡Hola! ¿Estudiamos el eje hipotálamo-hipófisis?'],['dance','Paso de baile número 4… como los yodos de la T4.']],
    annoyed:['Oye… ya van varias. Me vas a despeinar los lóbulos.','¿Me vas a tocar todo el día o vas a estudiar?','Una más y me quito los lentes… y no te va a gustar.'],
    angry:['¡Ya, caramba! Que no soy un botón.','¡Rayos! Me vas a dar hipertiroidismo de la rabia.','¡Diablos! Me rayaste los lentes.','¡Qué ladilla! La profe Yaisel te va a ver.','¡Recórcholis, ya! Estudia en vez de molestarme.','¡Caray! Me dejaste sin T4 de tanto toque.']},
  insulina:{fun:[['love','Aww, ¡gracias! Me pongo dulce.'],['dance','¡A bailar! Un, dos, glucosa en equilibrio.'],['spin','¡Mira cómo giro! Mi moño vuela.'],['happy','¡Hola! ¿Repasamos el páncreas?'],['dance','¡Me encanta esta canción!']],
    annoyed:['Oye, ya… me vas a desacomodar el moño.','¿No tienes que estudiar o qué?','Mira que me enojo, ¿eh? Una más…'],
    angry:['¡Ay, caramba! Me desacomodaste el moño.','¡Ya basta, rayos! Me vas a subir la glucosa.','¡Diablos, qué intensa/o! Ve a estudiar.','¡Caray, deja de tocarme!','¡Ya, recórcholis! Le voy a decir a la profe Yaisel.','¡Qué fastidio! Haz el quiz y déjame en paz.']}
};
document.querySelectorAll('.stage .mascot').forEach(m=>m.addEventListener('click',()=>{
  const st=m.closest('.stage'),who=m.dataset.who,T=TAP[who],tag=who==='tiro'?SP:OV;
  tipPause=Date.now()+10000;
  const now=Date.now();if(now-(m._last||0)>8000)m._n=0;m._last=now;m._n=(m._n||0)+1;
  let mood,txt;
  if(m._n<=3){let i;do{i=Math.floor(Math.random()*T.fun.length)}while(T.fun.length>1&&i===m._fi);m._fi=i;[mood,txt]=T.fun[i]}
  else if(m._n<=5){mood='sad';txt=pick(T.annoyed)}
  else{mood='angry';txt=pick(T.angry)}
  const tok=st._tok=(st._tok||0)+1;ensure(mood).then(()=>{if(st._tok===tok)play(m,mood)});
  const other=[...st.querySelectorAll('.mascot')].find(x=>x!==m);if(other&&other.dataset.state!=='idle')play(other,'idle');
  if(mood==='angry'&&other&&Math.random()<.5){ensure('love').then(()=>{if(st._tok===tok)play(other,'love')});
    txt+=`<br><span style="font-weight:400">${who==='tiro'?OV+'Jaja, ya lo hiciste enojar.':SP+'Uy, la hiciste enojar. Yo me salgo de esto.'}</span>`}
  const b=st.querySelector('.bubble');b.innerHTML=tag+txt;b.className='bubble'+(mood==='angry'||mood==='sad'?' sad':' happy');void b.offsetWidth;b.classList.add('pop');
  clearTimeout(st._t);st._t=setTimeout(()=>{st._tok++;st.querySelectorAll('.mascot').forEach(x=>play(x,'idle'));b.className='bubble'},2250);
}));
