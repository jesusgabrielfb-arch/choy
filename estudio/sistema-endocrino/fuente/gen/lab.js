/* ---------- laboratorio: simuladores ---------- */
(function(){
  const $=id=>document.getElementById(id);if(!$('glu-r'))return;
  const F='font-family="Figtree,sans-serif"';
  const hexp=(x,y,r,f)=>{let p='';for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;p+=`${(x+r*Math.cos(a)).toFixed(1)},${(y+r*Math.sin(a)).toFixed(1)} `}return `<polygon points="${p}" fill="${f}" stroke="#fff" stroke-width="1"/>`};
  function bar(v,min,max,zones,col){const W=300,x0=10,y=96,w=v=>x0+(Math.min(max,Math.max(min,v))-min)/(max-min)*W;
    let s=zones.map(z=>`<rect x="${w(z[0])}" y="${y}" width="${w(z[1])-w(z[0])}" height="14" fill="${z[2]}"/><text x="${(w(z[0])+w(z[1]))/2}" y="${y+28}" text-anchor="middle" ${F} font-size="10" font-weight="700" fill="#837D93">${z[3]}</text>`).join('');
    return s+`<path d="M${w(v)},${y-4} l-7,-12 h14 Z" fill="${col}" style="transition:all .4s"/>`}
  /* glucosa */
  let noIns=false;
  function glu(){const v=+$('glu-r').value;$('glu-v').textContent=v;
    const st=v<70?'baja':v<100?'normal':v<126?'prediabetes (en ayunas)':'alta';
    const hi=v>=110,lo=v<80;let horm,txt;
    if(noIns&&hi){horm='—';txt=`<b>Sin insulina:</b> la glucosa no puede entrar a los músculos y se queda en la sangre → <b>diabetes</b>.`}
    else if(hi){horm='insulina';txt=`Glucosa <b>${st}</b>: las <b>células beta</b> liberan <b>insulina</b>, que mete la glucosa a los <b>músculos</b> y la baja.`}
    else if(lo){horm='glucagón';txt=`Glucosa <b>${st}</b>: las <b>células alfa</b> liberan <b>glucagón</b>, que degrada el <b>glucógeno del hígado</b> y la sube.`}
    else{horm='equilibrio';txt=`Glucosa <b>${st}</b>: insulina y glucagón están en equilibrio.`}
    const n=Math.round(Math.min(14,Math.max(1,(v-30)/18)));let dots='';for(let i=0;i<n;i++)dots+=hexp(20+((i*37)%120),18+((i*23)%46),5,'#E3B33C');
    const col=horm==='insulina'?'#3E9A72':horm==='glucagón'?'#7B5CC4':horm==='—'?'#D0665E':'#837D93';
    $('glu-svg').innerHTML=`<rect x="10" y="8" width="140" height="66" rx="16" fill="#FDE3E6" stroke="#E9A5B0"/>${dots}<text x="80" y="88" text-anchor="middle" ${F} font-size="10.5" fill="#837D93">sangre</text>
      <rect x="170" y="20" width="140" height="42" rx="21" fill="${col}"/><text x="240" y="46" text-anchor="middle" ${F} font-size="14" font-weight="800" fill="#fff">${horm==='equilibrio'?'equilibrio':horm==='—'?'¡falta insulina!':horm.toUpperCase()}</text>`
      +bar(v,40,220,[[40,70,'#E7DDFB','baja'],[70,100,'#D8F2E6','normal'],[100,126,'#FFF1C9','pre'],[126,220,'#FCDDE0','diabetes']],col);
    $('glu-out').innerHTML=txt}
  $('glu-r').addEventListener('input',()=>{noIns=false;glu()});
  document.querySelectorAll('[data-glu]').forEach(b=>b.onclick=()=>{const k=b.dataset.glu,r=$('glu-r');noIns=k==='diabetes';
    const target=k==='comer'?175:k==='ayuno'?68:k==='ejercicio'?62:220;let v=+r.value;clearInterval(glu._t);
    glu._t=setInterval(()=>{v+=Math.sign(target-v)*Math.min(6,Math.abs(target-v));r.value=v;glu();if(v===target){clearInterval(glu._t);
      if(k!=='diabetes'){const back=setTimeout(()=>{glu._t=setInterval(()=>{v+=Math.sign(90-v)*Math.min(4,Math.abs(90-v));r.value=v;glu();if(v===90)clearInterval(glu._t)},60)},1400)}
      react('stage-calc',k==='diabetes'?'sad':'happy',k==='comer'?OV+'¡Comiste! Ahí voy yo a bajar esa glucosa.':k==='diabetes'?OV+'Sin mí la glucosa se queda en la sangre… eso es diabetes.':SP+'Glucosa baja: le toca al glucagón sacar glucosa del hígado.')}},50)});
  glu();
  /* calcio */
  function ca(){const v=+$('ca-r').value;$('ca-v').textContent=v.toFixed(1);let txt,col,lab;
    if(v<8.5){col='#C9A227';lab='PARATOHORMONA';txt=`Calcio <b>bajo</b>: las <b>paratiroides</b> liberan <b>paratohormona</b>, que actúa en <b>huesos y riñones</b> y sube el calcio.`}
    else if(v>10.5){col='#7B5CC4';lab='CALCITONINA';txt=`Calcio <b>alto</b>: la <b>tiroides</b> libera <b>calcitonina</b>, que actúa en el <b>tejido óseo</b> y baja el calcio.`}
    else{col='#3E9A72';lab='EQUILIBRIO';txt='Calcio <b>normal</b>: huesos resistentes y músculos que se contraen bien.'}
    const n=Math.round((v-5)*1.6);let dots='';for(let i=0;i<n;i++)dots+=`<circle cx="${22+((i*29)%118)}" cy="${20+((i*17)%44)}" r="5" fill="#F4F1E6" stroke="#B9A77E"/>`;
    $('ca-svg').innerHTML=`<rect x="10" y="8" width="140" height="66" rx="16" fill="#FDE3E6" stroke="#E9A5B0"/>${dots}<text x="80" y="88" text-anchor="middle" ${F} font-size="10.5" fill="#837D93">calcio en sangre</text>
      <rect x="170" y="20" width="140" height="42" rx="21" fill="${col}"/><text x="240" y="46" text-anchor="middle" ${F} font-size="13" font-weight="800" fill="#fff">${lab}</text>`
      +bar(v,6,13,[[6,8.5,'#FFF1C9','bajo'],[8.5,10.5,'#D8F2E6','normal'],[10.5,13,'#E7DDFB','alto']],col);
    $('ca-out').innerHTML=txt}
  $('ca-r').addEventListener('input',ca);ca();
  /* melatonina */
  function mel(){const h=+$('mel-r').value;$('mel-v').textContent=String(h).padStart(2,'0')+':00';
    const light=Math.max(0,Math.sin((h-6)/12*Math.PI)),m=Math.max(0,1-light*1.15);
    const sky=light>.15?`rgb(${255-60*(1-light)|0},${246-80*(1-light)|0},${218-40*(1-light)|0})`:'#2F2A4A';
    let curve='';for(let x=0;x<=24;x++){const l=Math.max(0,Math.sin((x-6)/12*Math.PI)),mm=Math.max(0,1-l*1.15);curve+=(x?' L':'M')+(170+x*5.6).toFixed(1)+','+(84-mm*60).toFixed(1)}
    $('mel-svg').innerHTML=`<rect x="10" y="8" width="140" height="80" rx="16" fill="${sky}"/>${light>.15?`<circle cx="${30+h*4.5}" cy="${70-light*46}" r="13" fill="#FFD66B" stroke="#E6A93C"/>`:`<circle cx="80" cy="42" r="16" fill="#B9A6EE"/><circle cx="88" cy="36" r="14" fill="#2F2A4A"/><circle cx="40" cy="24" r="1.6" fill="#fff"/><circle cx="120" cy="30" r="1.6" fill="#fff"/><circle cx="110" cy="66" r="1.4" fill="#fff"/>`}
      <rect x="166" y="16" width="144" height="72" rx="10" fill="#F6F4FA" stroke="#E7E2F0"/><path d="${curve}" fill="none" stroke="#7B5CC4" stroke-width="2.4"/><circle cx="${170+h*5.6}" cy="${84-m*60}" r="5" fill="#7B5CC4" stroke="#fff" stroke-width="1.5"/>
      <text x="238" y="104" text-anchor="middle" ${F} font-size="10.5" fill="#837D93">melatonina en el día (0 a 24 h)</text>`;
    $('mel-out').innerHTML=m>.6?`<b>Poca luz</b> → la retina avisa al hipotálamo → la <b>pineal</b> produce <b>mucha melatonina</b>: da sueño. 😴`:m>.2?'Luz intermedia: la melatonina está cambiando.':`<b>Mucha luz</b> → la pineal produce <b>poca melatonina</b>: estás despierta/o (somos diurnos). ☀️`}
  $('mel-r').addEventListener('input',mel);mel();
  /* yodos */
  let mols=[];
  function yodo(){const box=$('yodo-box');box.innerHTML=mols.map(n=>`<span class="mol"><b>T${n}</b>${'<i></i>'.repeat(n)}</span>`).join('')||'<span style="color:var(--muted);font-size:14px">Vacío. Agrega moléculas.</span>';
    const t4=mols.filter(n=>n===4).length,t3=mols.filter(n=>n===3).length;
    $('yodo-out').innerHTML=mols.length?`${t4} T4 × 4 + ${t3} T3 × 3 = <b>${t4*4+t3*3} átomos de yodo</b>`:''}
  document.querySelectorAll('[data-yo]').forEach(b=>b.onclick=()=>{const k=b.dataset.yo;if(k==='T4'&&mols.length<12)mols.push(4);if(k==='T3'&&mols.length<12)mols.push(3);
    if(k==='quita'){const i=mols.indexOf(4);if(i>=0){mols[i]=3;react('stage-calc','happy',SP+'¡Le quitaste un yodo a la T4 y quedó una T3! (Dato extra: así se activa.)')}else react('stage-calc','sad',SP+'No hay ninguna T4 para quitarle un yodo.')}
    if(k==='reset')mols=[];yodo()});
  yodo();
})();

/* ---------- práctica con números ---------- */
(function(){
  const $=id=>document.getElementById(id);if(!$('cp-q'))return;
  const NAMES=['Ana','Sofía','Luis','Valentina','Camilo','Lucía','Mateo','Daniela','Gabriel','Mariana'];
  const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  let ex=null,ok=0,tot=0,streak=0;
  const sel=(id,opts)=>`<select id="${id}"><option value="">Elige…</option>${opts.map(o=>`<option>${o}</option>`).join('')}</select>`;
  const GENS=[
   ()=>{const g=pick([58,64,82,91,97,104,112,121,130,145,168,190]),n=pick(NAMES);
     const cls=g<70?'Baja (hipoglucemia)':g<100?'Normal':g<126?'Prediabetes':'Diabetes';const hor=g<70?'Glucagón':'Insulina';const cel=g<70?'Alfa':'Beta';
     return {q:`<b>${n}</b> se hizo un análisis de <b>glucosa en ayunas</b>: <b>${g} mg/dL</b>. Usa los valores de referencia (extra) del post-it.`,
      f:[['Interpretación',sel('cpa',['Baja (hipoglucemia)','Normal','Prediabetes','Diabetes']),cls],['Hormona que hace falta para corregirla',sel('cpb',['Insulina','Glucagón','Calcitonina','Melatonina']),g>=70&&g<100?'Ninguna (está normal)':hor,g>=70&&g<100],['Células del páncreas que la liberan',sel('cpc',['Alfa','Beta','Acinos']),cel,g>=70&&g<100]],
      sol:`<li>${g} mg/dL está en el rango <b>${cls}</b> (70-99 normal; 100-125 prediabetes; 126 o más diabetes; menos de 70 baja).</li><li>${g<70?'Glucosa baja → <b>glucagón</b> de las <b>células alfa</b> (actúa en el hígado).':g<100?'Está normal: insulina y glucagón en equilibrio.':'Glucosa alta → hace falta <b>insulina</b> de las <b>células beta</b> (mete la glucosa a los músculos).'}</li>`}},
   ()=>{const a=R(1,6),b=R(1,6),n=pick(NAMES);return {q:`En una muestra hay <b>${a} moléculas de T4</b> y <b>${b} moléculas de T3</b>. ¿Cuántos átomos de yodo hay?`,
      f:[['Yodos en las T4','<input id="cpa" type="number" min="0">',String(a*4)],['Yodos en las T3','<input id="cpb" type="number" min="0">',String(b*3)],['Total de yodos','<input id="cpc" type="number" min="0">',String(a*4+b*3)]],
      sol:`<li>T4 tiene 4 yodos: ${a} × 4 = <b>${a*4}</b>.</li><li>T3 tiene 3 yodos: ${b} × 3 = <b>${b*3}</b>.</li><li>Total: ${a*4} + ${b*3} = <b>${a*4+b*3}</b>.</li>`}},
   ()=>{const c=pick([6.9,7.4,7.9,8.2,9.1,9.8,10.2,11.1,11.6,12.3]),n=pick(NAMES);const cls=c<8.5?'Bajo':c>10.5?'Alto':'Normal';
     const gl=c<8.5?'Paratiroides':c>10.5?'Tiroides':'Ninguna';const ho=c<8.5?'Paratohormona':c>10.5?'Calcitonina':'Ninguna';
     return {q:`El calcio en sangre de <b>${n}</b> es <b>${c} mg/dL</b> (normal: 8.5 a 10.5, dato extra).`,
      f:[['¿Cómo está?',sel('cpa',['Bajo','Normal','Alto']),cls],['Glándula que responde',sel('cpb',['Paratiroides','Tiroides','Páncreas','Ninguna']),gl],['Hormona que libera',sel('cpc',['Paratohormona','Calcitonina','Insulina','Ninguna']),ho]],
      sol:`<li>${c} está ${cls.toLowerCase()} (8.5-10.5 normal).</li><li>${c<8.5?'Calcio bajo → <b>paratiroides</b> → <b>paratohormona</b> (riñones y huesos).':c>10.5?'Calcio alto → <b>tiroides</b> → <b>calcitonina</b> (tejido óseo).':'Normal: no hace falta que respondan.'}</li>`}},
   ()=>{const h=pick([1,3,8,12,15,20,23]);const lvl=(h>=19||h<=5)?'Alta':(h>=10&&h<=16)?'Baja':'Intermedia';
     return {q:`Son las <b>${String(h).padStart(2,'0')}:00</b> ${h>=19||h<=5?'y está oscuro':'y hay luz de día'}. ¿Cómo está la melatonina?`,
      f:[['Nivel de melatonina',sel('cpa',['Alta','Intermedia','Baja']),lvl],['Glándula que la produce',sel('cpb',['Pineal','Hipófisis','Tiroides']),'Pineal'],['Quién le avisa de la luz',sel('cpc',['Hipotálamo','Páncreas','Paratiroides']),'Hipotálamo']],
      sol:`<li>A menor luz, mayor melatonina: a las ${h}:00 está <b>${lvl.toLowerCase()}</b>.</li><li>Retina → <b>hipotálamo</b> → glándula <b>pineal</b> (epífisis).</li>`}}
  ];
  const PH={all:[BOTH+'¡Todo bien! Eres un laboratorio con patas.',SP+'Perfecto. Ni mi T4 es tan exacta.',OV+'¡Bravo! Así se lo explicas a la profe Yaisel.'],
    some:[OV+'Vas bien, revisa lo que salió en rojo.',SP+'Casi todo. Mira la solución paso a paso.'],
    none:[SP+'Uy… ninguna. Lee el post-it de valores y vuelve a intentar.',OV+'Tranqui: primero mira si está alto o bajo. ¡Otra vez!'],
    yai:[SP+'Tres seguidos mal… la profe Yaisel se va a molestar. ¡Mira la solución!',OV+'Si sigues así te quedas en Biología. Lee los pasos de abajo.']};
  function gen(){ex=pick(GENS)();$('cp-q').innerHTML=ex.q;
    $('cp-form').innerHTML=ex.f.map((f,i)=>`<div class="field"><label>${f[0]}</label>${f[1]}<small class="cp-ans" id="cp-a${i}"></small></div>`).join('');
    $('cp-steps').hidden=true;react('stage-calc','idle',pick([OV+'Nuevo ejercicio. Primero mira si está alto o bajo.',SP+'Va otro. Piensa en qué glándula responde.',OV+'Tú puedes, es como en el laboratorio de arriba.']))}
  function steps(){$('cp-steps').innerHTML=`<b>Solución paso a paso</b><ol>${ex.sol}</ol>`;$('cp-steps').hidden=false}
  $('cp-check').onclick=()=>{let n=0;const ids=['cpa','cpb','cpc'];
    ex.f.forEach((f,i)=>{const el=$(ids[i]),a=$('cp-a'+i),want=f[2],free=f[3];const v=(el.value||'').trim();
      const good=free?true:norm(v)===norm(want);if(good)n++;el.className=good?'ok':'bad';a.className='cp-ans'+(good?'':' bad');a.textContent=!v&&!free?'Falta llenar':good?'¡Bien!':'Era: '+want});
    tot++;const all=n===ex.f.length;if(all){ok++;streak=0}else streak++;
    $('cp-score').textContent=`Ejercicios perfectos: ${ok} de ${tot}`;
    if(all){react('stage-calc',pick(['dance','happy','love']),pick(PH.all));const r=$('cp-check').getBoundingClientRect();confetti(r.left+r.width/2,r.top,60)}
    else if(streak>=3)react('stage-calc','angry',pick(PH.yai)),steps();
    else if(n>=2)react('stage-calc','happy',pick(PH.some)),steps();
    else react('stage-calc','sad',pick(PH.none)),steps()};
  $('cp-sol').onclick=()=>{steps();react('stage-calc','idle',OV+'Léela con calma y después intenta uno nuevo.')};
  $('cp-new').onclick=gen;gen();
})();

/* ---------- imagen real (del PPT) junto a cada dibujo ---------- */
(function(){
  const R=window.REALES||{};
  Object.keys(R).forEach(id=>{const box=document.getElementById(id);if(!box)return;const tabs=box.querySelector('.anat-tabs');if(!tabs)return;
    const btn=document.createElement('button');btn.type='button';btn.className='real-btn';btn.setAttribute('aria-pressed','false');btn.innerHTML='📷 Imagen real';tabs.appendChild(btn);
    const view=document.createElement('div');view.className='real-view';view.hidden=true;
    view.innerHTML=R[id].map(([src,cap])=>`<figure><img src="reales/${src}.webp" alt="${cap.replace(/<[^>]+>/g,'').replace(/"/g,'')}" loading="lazy" decoding="async"><figcaption>${cap}</figcaption></figure>`).join('')
      +'<p class="real-note">Imágenes reales del PPT de clase. Busca en ellas las mismas partes del dibujo: así las reconoces si salen en el examen.</p>';
    const anchor=box.querySelector('.proc-scroll')||box.querySelector('svg');anchor.after(view);
    btn.onclick=()=>{const on=btn.getAttribute('aria-pressed')!=='true';btn.setAttribute('aria-pressed',on);box.classList.toggle('show-real',on);view.hidden=!on;btn.innerHTML=on?'✏️ Volver al dibujo':'📷 Imagen real';
      if(on){const st=box.querySelector('.mini-stage');if(st)react(st.id,'happy',SP+'¡Esta es la imagen de verdad del PPT! Compárala con el dibujo.')}};
    tabs.querySelectorAll('button:not(.real-btn)').forEach(b=>b.addEventListener('click',()=>{if(btn.getAttribute('aria-pressed')==='true')btn.click()}))});
})();
