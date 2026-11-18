makeProc('anat-pasos',{steps:[
 ['Escribe la estructura','Desarrolla la fórmula: cada C con sus H y sus ramas. Los paréntesis se abren: C(CH₃)(C₂H₅) es un C con un <b>metil</b> y un <b>etil</b> colgando; CH(CH₃)OH es un C con un CH₃ y un –OH.'],
 ['Encuentra la cadena principal','Es la cadena <b>más larga que contiene el carbono con –OH</b> (y el doble enlace). Remárcala con color. Aquí tiene 7 C → hept-.'],
 ['Enumera desde el –OH','Empieza por el extremo <b>más cercano al –OH</b>: el –OH queda en el C2 (si numeras al revés quedaría en el C6). El doble enlace queda entre C5 y C6.'],
 ['Reconoce los radicales','Lo que queda fuera de la cadena: un <b>metil</b> y un <b>etil</b>, los dos en el C4.'],
 ['Escribe el nombre','Radicales en orden alfabético con su número → cadena con su enlace → número del –OH + <b>ol</b>: <b>4-etil-4-metil-5-hepten-2-ol</b>.']],
 parts:{estructura:['Estructura desarrollada','Paso 1: dibujar todos los carbonos con sus ramificaciones.',0],cadena:['Cadena principal','Paso 2: la cadena más larga que contiene el C del –OH.',1],numeros:['Numeración','Paso 3: se numera desde el extremo más cercano al –OH.',2],radicales:['Radicales','Paso 4: las ramificaciones (etil y metil).',3],nombre:['Nombre final','Paso 5: 4-etil-4-metil-5-hepten-2-ol.',4]},
 order:['estructura','cadena','numeros','radicales','nombre']},{stage:'stage-pasos'});
makeProc('anat-eterpasos',{steps:[
 ['Ubica el puente de oxígeno','El –O– en medio de dos carbonos indica que es un <b>éter</b>. Lo que está a cada lado son los dos radicales R y R\'.'],
 ['Cuenta el grupo menor','A la izquierda hay <b>1 C</b> (metil). Es el grupo con menos carbonos → se nombra con <b>-oxi</b>: metoxi.'],
 ['Cuenta el grupo mayor','A la derecha hay <b>3 C</b> con enlaces simples → <b>propano</b> (sería -eno con doble y -ino con triple).'],
 ['Nombre IUPAC','Grupo menor con -oxi + guion + grupo mayor: <b>metoxi-propano</b>.'],
 ['Nombre radico funcional','"Éter" + los radicales en orden alfabético; el primero en -il y el segundo en -ílico: <b>éter metil-propílico</b>.']],
 parts:{puente:['Puente de oxígeno','El –O– que une a los dos radicales.',0],menor:['Grupo menor (1 C)','Se nombra con -oxi: metoxi.',1],mayor:['Grupo mayor (3 C)','Se nombra con -ano: propano.',2],iupac:['Nombre IUPAC','metoxi-propano',3],rf:['Nombre RF','éter metil-propílico',4]},
 order:['puente','menor','mayor','iupac','rf']},{stage:'stage-eterpasos'});

/* ---------- ejercicios resueltos (molbox): pasos 1 a 5 y comprobar ---------- */
const _n=t=>(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),_e=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const NRM=t=>_n(t).replace(/[\s\-–—(),.']/g,'');
function ejHTML(e){const [id,q,cond,ch,hl,name,extra,ex]=e;
  return `<div class="molbox" data-s="1" data-k="${_e(id)}"><div class="mb-q"><span class="mb-id">${id}</span>${q}</div><div class="cond">${cond}</div>
  <div class="anat-tabs mb-steps" role="group" aria-label="Pasos">${['1 Estructura','2 Cadena principal','3 Enumerar','4 Radicales','5 Nombre'].map((t,i)=>`<button type="button" data-st="${i+1}" aria-pressed="${i?'false':'true'}">${t}</button>`).join('')}</div>
  <div class="mol">${molSVG(ch,{hl:hl||undefined,num:!hl,label:'Estructura desarrollada del ejercicio '+id})}</div>
  <div class="mb-try"><input placeholder="Escribe aquí tu nombre y comprueba…" aria-label="Tu respuesta para el ${_e(id)}"><button class="btn small primary" type="button">Comprobar</button><span class="mb-fb"></span></div>
  <div class="mb-ans"><div class="mb-nm">${name}</div><div class="mb-extra">${extra}</div><div class="mb-ex">${ex}</div></div></div>`}
const ALLEJ={};
[['guiaEj',EJ_GUIA],['ejI',EJ_I],['ejII',EJ_II],['eterEj',EJ_ETER]].forEach(([el,L])=>{const d=document.getElementById(el);L.forEach(e=>ALLEJ[e[0]]=e);if(d)d.innerHTML=L.map(ejHTML).join('')});
document.querySelectorAll('.mol[data-m]').forEach(d=>{const m=MOLS[d.dataset.m];d.innerHTML=molSVG(m[0],Object.assign({hl:false,num:false},m[1]||{}))});
document.addEventListener('click',ev=>{
  const b=ev.target.closest('.mb-steps button');if(b){const box=b.closest('.molbox');box.dataset.s=b.dataset.st;box.querySelectorAll('.mb-steps button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.st<=+b.dataset.st));if(b.dataset.st==='5'&&Math.random()<.4)react('stage-ej','happy*');return}
  const t=ev.target.closest('.mb-try .btn');if(t){const box=t.closest('.molbox'),inp=box.querySelector('input'),fb=box.querySelector('.mb-fb'),e=ALLEJ[box.dataset.k];
    const ok=e[8].some(a=>NRM(a)===NRM(inp.value));fb.className='mb-fb '+(ok?'ok':'no');
    fb.textContent=ok?'¡Correcto!':'Todavía no. Revisa los pasos y vuelve a intentarlo (o toca "5 Nombre").';
    react('stage-ej',ok?'happy*':'sad',ok?pick(PHR.happy):pick(PHR.sad));
    if(ok){box.dataset.s=5;box.querySelectorAll('.mb-steps button').forEach(x=>x.setAttribute('aria-pressed','true'));const r=t.getBoundingClientRect();confetti(r.left+r.width/2,r.top,40)}}
});
