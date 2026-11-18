/* ---------- examen real interactivo ----------
   Uso: pega el bloque <section id="parcial-2024"> de la página de referencia y, ANTES de este script:
   <script>window.EXAMEN_DATA={p1:[[pregunta,[opciones],índiceCorrecto,explicación],...],
     p2:[{q:'pregunta',any:false,items:[{acc:['palabras aceptadas'],show:'respuesta'}],ex:'nota'}],
     p3:[{t:'término',model:'definición modelo',keys:['regex1|sinónimo','regex2']}]};</script>
   Puntos: I = 40, II = 35, III = 2 por término (cámbialos en grade()). Guarda en localStorage (cambia KEY). */
/* ---------- Parcial 2024 interactivo ---------- */
(function(){const D=window.EXAMEN_DATA;const box=document.getElementById('ex24');if(!box)return;
  const N=t=>(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const E=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const KEY='repro-ex24';let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}};
  let h='<div class="ex24"><h3>I Parte. Selección de respuestas <span class="chip c-ok">40 puntos</span></h3><p class="hint">Elige la respuesta correcta.</p>';
  D.p1.forEach((q,i)=>{h+=`<div class="p1q" data-i="${i}"><span class="n">${i+1}.</span><div><div>${E(q[0])}</div><div class="opts">${q[1].map((o,k)=>`<label><input type="radio" name="ex24p1-${i}" value="${k}">${'abcd'[k]}. ${E(o)}</label>`).join('')}</div><div class="sol"></div></div></div>`});
  h+='<h3>II Parte. Complete los espacios <span class="chip c-ok">35 puntos</span></h3><table class="p2"><tbody>';
  D.p2.forEach((q,i)=>{h+=`<tr data-i="${i}"><td>${E(q.q)}</td><td>${q.items.map((it,k)=>`<input type="text" data-k="${k}" autocomplete="off" spellcheck="false" aria-label="${E(q.q)} ${k+1}" placeholder="${q.items.length>1?'abcd'[k]+'.':''}">`).join('')}<div class="sol"></div></td></tr>`});
  h+='</tbody></table><h3>III Parte. Definición de términos <span class="chip c-ok">10 puntos</span></h3><div class="p3">';
  D.p3.forEach((q,i)=>{h+=`<div class="row" data-i="${i}"><b>${E(q.t)}</b><div><textarea aria-label="Definición de ${E(q.t)}"></textarea><div class="sol"></div></div></div>`});
  box.innerHTML=h+'</div></div>';
  // restore + save
  box.querySelectorAll('input[type=radio]').forEach(r=>{if(saved[r.name]===r.value)r.checked=true;r.addEventListener('change',()=>{saved[r.name]=r.value;save();tick()})});
  box.querySelectorAll('.p2 input,.p3 textarea').forEach((el,j)=>{const k='t'+j;if(saved[k])el.value=saved[k];el.addEventListener('input',()=>{saved[k]=el.value;save();tick()})});
  // timer (starts on first answer)
  let t0=saved.t0||null,iv=null;const tm=document.getElementById('ex24-timer');
  const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  function tick(){if(!t0){t0=Date.now();saved.t0=t0;save()}if(!iv)iv=setInterval(()=>{tm.textContent='⏱ '+fmt(Math.floor((Date.now()-t0)/1000))},1000)}
  if(t0)tick();
  const hit=(v,acc)=>{const x=N(v);if(!x)return false;return acc.some(a=>{const y=N(a);return x.includes(y)||(typeof fillOk==='function'&&fillOk(v,[a]))})};
  function grade(showAll){let p1=0,p2=0,p2n=0,p3=0;
    D.p1.forEach((q,i)=>{const el=box.querySelector(`.p1q[data-i="${i}"]`),pick=el.querySelector('input:checked'),ok=pick&&+pick.value===q[2];if(ok)p1++;
      el.querySelectorAll('label').forEach((l,k)=>{l.classList.toggle('right',k===q[2]);l.classList.toggle('wrong',!!pick&&k===+pick.value&&!ok)});
      const sol=el.querySelector('.sol');sol.className='sol on'+(ok?'':' bad');sol.innerHTML=(ok?'✓ ':'✗ Respuesta: <b>'+'abcd'[q[2]]+'. '+E(q[1][q[2]])+'</b>. ')+E(q[3])});
    D.p2.forEach((q,i)=>{const tr=box.querySelector(`tr[data-i="${i}"]`),ins=[...tr.querySelectorAll('input')];let used=new Set(),good=0;
      ins.forEach((inp,k)=>{let ok=false;if(q.any){const j=q.items.findIndex((it,jj)=>!used.has(jj)&&hit(inp.value,it.acc));if(j>=0){used.add(j);ok=true}}else ok=hit(inp.value,q.items[k].acc);
        inp.classList.remove('ok','bad','half');inp.classList.add(ok?'ok':'bad');if(ok)good++});
      p2+=good;p2n+=q.items.length;const sol=tr.querySelector('.sol');sol.className='sol on'+(good===q.items.length?'':' bad');
      sol.innerHTML=(good===q.items.length?'✓ ':'✗ ')+'Respuesta: <b>'+q.items.map(it=>E(it.show)).join(' · ')+'</b>'+(q.ex?'. '+E(q.ex):'')});
    D.p3.forEach((q,i)=>{const row=box.querySelector(`.p3 .row[data-i="${i}"]`),ta=row.querySelector('textarea'),x=N(ta.value);
      const k=q.keys.filter(r=>new RegExp(r).test(x)).length,sc=!x?0:k===q.keys.length?2:k>=Math.ceil(q.keys.length/2)?1:0;p3+=sc;
      ta.classList.remove('ok','bad','half');ta.classList.add(sc===2?'ok':sc===1?'half':'bad');const sol=row.querySelector('.sol');sol.className='sol on'+(sc===2?'':' bad');
      sol.innerHTML=(sc===2?'✓ ':sc===1?'½ ':'✗ ')+'Modelo: <b>'+E(q.model)+'</b>'});
    const P1=40*p1/D.p1.length,P2=35*p2/p2n,P3=p3,T=P1+P2+P3,nota=(1+4*T/85).toFixed(1);
    const r=document.getElementById('ex24-res');
    if(showAll){r.innerHTML='<p class="hint">Estas son todas las respuestas correctas. Tu nota cuenta solo lo que escribiste.</p>'}
    r.innerHTML=(showAll?r.innerHTML:'')+`<div class="big">${T.toFixed(1).replace('.',',')} <small style="font-size:20px">de 85</small></div><p><span class="chip ${nota>=4?'c-ok':nota>=3?'c-extra':'c-hot'}" style="font-size:16px;padding:5px 14px">Nota: ${nota} / 5</span></p><div class="parts"><span>I. ${P1.toFixed(1)} / 40 (${p1} de ${D.p1.length})</span><span>II. ${P2.toFixed(1)} / 35 (${p2} de ${p2n})</span><span>III. ${P3} / 10</span></div><p class="hint">En la III parte la corrección busca las ideas clave; compárala con el modelo.</p>`;
    if(!showAll&&nota>=4.5&&typeof confetti==='function'){const b=r.getBoundingClientRect();confetti(b.left+b.width/2,b.top,140)}
    r.scrollIntoView({behavior:'smooth',block:'center'})}
  document.getElementById('ex24-check').onclick=()=>grade(false);
  document.getElementById('ex24-show').onclick=()=>grade(true);
  document.getElementById('ex24-reset').onclick=()=>{if(!confirm('¿Borrar todas tus respuestas del Parcial 2024?'))return;saved={};save();clearInterval(iv);iv=null;t0=null;tm.textContent='⏱ 00:00';
    box.querySelectorAll('input[type=radio]').forEach(r=>r.checked=false);box.querySelectorAll('.p2 input,.p3 textarea').forEach(el=>{el.value='';el.classList.remove('ok','bad','half')});
    box.querySelectorAll('.sol').forEach(x=>{x.className='sol';x.innerHTML=''});box.querySelectorAll('label').forEach(l=>l.classList.remove('right','wrong'));document.getElementById('ex24-res').innerHTML=''};
})();
