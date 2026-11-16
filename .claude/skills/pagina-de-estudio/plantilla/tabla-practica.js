/* ---------- cuadros para practicar: "llena el cuadro" ----------
   Marca un cuadro con <div class="tbl" data-practica="celdas|columna|derecha"> y este script le agrega
   dos modos: "Ver cuadro" y "Practicar: llena el cuadro" (las casillas quedan vacías y abajo aparece un
   banco con las respuestas mezcladas; tocas una respuesta y luego la casilla, o al revés).
   - celdas : la primera columna (nombre de la fila) queda visible; cada casilla debe ir en su lugar exacto.
   - columna: no hay nombres de fila; basta con poner cada frase en la columna correcta (ej. Cesárea vs Parto).
   - derecha: solo se vacía la última columna (ej. "No te confundas"). */
(function(){
  const N=t=>(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
  const SH=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  document.querySelectorAll('.tbl[data-practica]').forEach((wrap,ti)=>{
    const mode=wrap.dataset.practica,table=wrap.querySelector('table');if(!table)return;
    const rows=[...table.tBodies[0].rows],cells=[];
    rows.forEach(r=>[...r.cells].forEach((td,c)=>{const n=r.cells.length;
      const slot=mode==='derecha'?c===n-1:mode==='columna'?true:c>0;
      if(slot)cells.push({td,c,html:td.innerHTML,text:N(td.textContent)})}));
    if(cells.length<2)return;
    const bar=document.createElement('div');bar.className='tp-bar';
    bar.innerHTML='<button type="button" data-m="ver" aria-pressed="true">Ver cuadro</button><button type="button" data-m="prac" aria-pressed="false">✎ Practicar: llena el cuadro</button>';
    wrap.before(bar);
    let bank=null,bankH=null,res=null,sel=null,on=false;
    const chipHTML=(x,i)=>`<button type="button" class="tp-chip" data-i="${i}">${x.html}</button>`;
    function restore(){cells.forEach(x=>{x.td.innerHTML=x.html;x.td.classList.remove('tp-slot','ok','bad','tp-target')});wrap.classList.remove('tp-on');
      [bank,bankH,res].forEach(e=>e&&e.remove());bank=bankH=res=null;sel=null;on=false;
      [...table.querySelectorAll('tbody td')].forEach(td=>td.onclick=null)}
    function start(){restore();on=true;wrap.classList.add('tp-on');
      cells.forEach(x=>{x.td.innerHTML='';x.td.classList.add('tp-slot')});
      bankH=document.createElement('div');bankH.className='tp-bank-h';bankH.textContent='Banco de respuestas: toca una y luego su casilla';
      bank=document.createElement('div');bank.className='tp-bank';
      bank.innerHTML=SH(cells.map((x,i)=>i)).map(i=>chipHTML(cells[i],i)).join('');
      res=document.createElement('div');res.className='tp-res';
      res.innerHTML=`<button type="button" class="btn small primary">Comprobar</button> <button type="button" class="btn small">Mezclar de nuevo</button>`;
      wrap.after(bankH);bankH.after(bank);bank.after(res);
      res.children[0].onclick=check;res.children[1].onclick=start;
      bank.onclick=e=>{const b=e.target.closest('.tp-chip');if(!b)return;
        const tgt=table.querySelector('td.tp-target');if(tgt){place(b,tgt);return}
        if(sel===b){b.classList.remove('sel');sel=null;return}if(sel)sel.classList.remove('sel');sel=b;b.classList.add('sel')};
      cells.forEach(x=>x.td.onclick=e=>{if(!on)return;const inside=x.td.querySelector('.tp-chip');
        x.td.classList.remove('ok','bad');const s=x.td.querySelector('.tp-sol');if(s)s.remove();
        if(sel){place(sel,x.td);return}
        if(inside){inside.classList.remove('sel');bank.appendChild(inside);return}
        table.querySelectorAll('td.tp-target').forEach(t=>t.classList.remove('tp-target'));x.td.classList.add('tp-target')})}
    function place(chip,td){const old=td.querySelector('.tp-chip');if(old)bank.appendChild(old);
      chip.classList.remove('sel');td.innerHTML='';td.appendChild(chip);td.classList.remove('tp-target','ok','bad');sel=null}
    function check(){let ok=0;cells.forEach(x=>{const ch=x.td.querySelector('.tp-chip');const s=x.td.querySelector('.tp-sol');if(s)s.remove();
        let good=false;if(ch){const y=cells[+ch.dataset.i];good=mode==='columna'?y.c===x.c:y.text===x.text}
        if(good)ok++;x.td.classList.toggle('ok',good);x.td.classList.toggle('bad',!good);
        if(!good&&mode!=='columna'){const sp=document.createElement('span');sp.className='tp-sol';sp.innerHTML='✓ '+x.html;x.td.appendChild(sp)}});
      const n=cells.length,nota=(1+4*ok/n).toFixed(1);
      res.innerHTML=`${ok} de ${n} bien <span class="nota">Nota: ${nota} / 5</span> ${ok===n?'¡Perfecto! 🎉':mode==='columna'?'Las rojas van en la otra columna.':'En verde está lo que iba en cada casilla.'} <button type="button" class="btn small">Otra vez</button>`;
      res.querySelector('button').onclick=start;
      if(ok===n&&typeof confetti==='function'){const r=res.getBoundingClientRect();confetti(r.left+r.width/2,r.top,90)}}
    bar.onclick=e=>{const b=e.target.closest('button');if(!b)return;bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));
      if(b.dataset.m==='prac')start();else restore()};
  });
})();
