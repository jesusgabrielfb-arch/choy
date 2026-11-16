/* ---------- buscador (lupa) ----------
   Busca en todo el resumen (títulos, definiciones, listas, tablas, notas, nombres de los dibujos),
   en los términos clave (REV) y en las preguntas de práctica (BANK). Sin tildes ni mayúsculas.
   Atajos: tecla "/" o Ctrl/Cmd + K. Esc cierra. Flechas + Enter para elegir. */
(function(){
  const N=t=>(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const E=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';
  const btn=document.createElement('button');btn.type='button';btn.className='lupa-btn';btn.setAttribute('aria-label','Buscar en la página');btn.innerHTML=ICON+'<span class="k">/</span>';document.body.appendChild(btn);
  let IDX=null,ov=null,sel=0,items=[];
  function build(){IDX=[];
    document.querySelectorAll('section.topic').forEach(sec=>{const h2=sec.querySelector('h2');const st=h2?h2.textContent.trim():'';
      sec.querySelectorAll('h2,h3,h4,.def,p,li,td,.sticky,.fix,figcaption,.plab .nm,.anat svg .lab text:first-of-type').forEach(el=>{
        if(el.closest('.anat-tabs,.done-row,.proc-ctrl,.anat-info,.anat-foot'))return;
        if(el.matches('p,li')&&el.closest('.def,.sticky,.fix'))return;
        const t=el.textContent.replace(/\s+/g,' ').trim();if(t.length<2)return;
        const tag=el.matches('h2,h3,h4')?'h':el.matches('.def')?'d':el.closest('svg')?'s':'t';
        IDX.push({kind:'res',el,t,n:N(t),sec:st,tag})})});
    if(typeof REV!=='undefined')REV.forEach(r=>IDX.push({kind:'term',t:r[0],d:r[1],n:N(r[0]+' '+r[1]),nt:N(r[0]),topic:r[2]}));
    if(typeof BANK!=='undefined')BANK.forEach(q=>{if(q[0]!=='mc'&&q[0]!=='tf'&&q[0]!=='fill')return;
      const ans=q[0]==='mc'?q[3][0]:q[0]==='tf'?(q[3]?'Verdadero':'Falso'):q[3].map(a=>a[0]).join(' · ');
      IDX.push({kind:'q',t:q[2],d:ans+(typeof q[4]==='string'?' — '+q[4]:''),n:N(q[2]+' '+ans),topic:q[1]})})}
  function snip(t,words){const nt=N(t);let i=-1;for(const w of words){i=nt.indexOf(w);if(i>=0)break}
    let a=Math.max(0,i-60),b=Math.min(t.length,(i<0?0:i)+120);let s=(a>0?'…':'')+t.slice(a,b)+(b<t.length?'…':'');
    return mark(E(s),words)}
  function mark(html,words){const plain=html;const nn=N(plain);const hits=[];
    words.forEach(w=>{if(w.length<2)return;let i=0;while((i=nn.indexOf(w,i))>=0){hits.push([i,i+w.length]);i+=w.length}});
    if(!hits.length)return plain;hits.sort((a,b)=>a[0]-b[0]);let out='',p=0;
    hits.forEach(([a,b])=>{if(a<p)return;out+=plain.slice(p,a)+'<mark>'+plain.slice(a,b)+'</mark>';p=b});return out+plain.slice(p)}
  function search(q){const words=N(q).split(/\s+/).filter(Boolean);if(!words.length)return null;
    const sc=x=>{if(!words.every(w=>x.n.includes(w)))return null;let s=0;
      if(x.kind==='term'&&words.every(w=>x.nt.includes(w)))s+=60;if(x.tag==='h')s+=40;if(x.tag==='d')s+=25;if(x.tag==='s')s+=15;
      if(x.n.startsWith(words[0]))s+=10;s-=Math.min(20,x.n.length/40);return s};
    const R={res:[],term:[],q:[]};IDX.forEach(x=>{const s=sc(x);if(s!==null)R[x.kind].push([s,x])});
    for(const k in R)R[k]=R[k].sort((a,b)=>b[0]-a[0]).map(a=>a[1]);
    const seen=new Set();R.res=R.res.filter(x=>{const k=x.sec+'|'+x.t.slice(0,80);if(seen.has(k))return false;seen.add(k);return true}).slice(0,18);
    R.term=R.term.slice(0,6);R.q=R.q.slice(0,6);return {R,words}}
  /* subrayar la palabra buscada dentro de la sección */
  let curWords=[],clearT=null;
  function clearFound(){clearTimeout(clearT);document.querySelectorAll('span.busca-found').forEach(sp=>{const p=sp.parentNode;sp.replaceWith(document.createTextNode(sp.textContent));if(p)p.normalize()});
    document.querySelectorAll('.busca-svg').forEach(t=>t.classList.remove('busca-svg'))}
  function markFound(root,words){words=words.filter(w=>w.length>=2);if(!root||!words.length)return [];const out=[];
    const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||p.closest('script,style,svg,button,input,textarea,.busca-found,.anat-tabs,.proc-ctrl'))return NodeFilter.FILTER_REJECT;return n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});
    const nodes=[];while(tw.nextNode())nodes.push(tw.currentNode);
    nodes.forEach(node=>{const txt=node.nodeValue;let norm='',map=[];for(let i=0;i<txt.length;i++){const c=N(txt[i]);for(const ch of c){norm+=ch;map.push(i)}}
      const hits=[];words.forEach(w=>{let i=0;while((i=norm.indexOf(w,i))>=0){hits.push([map[i],map[i+w.length-1]+1]);i+=w.length}});
      if(!hits.length)return;hits.sort((a,b)=>b[0]-a[0]);let last=Infinity;
      hits.forEach(([a,b])=>{if(b>last)return;last=a;const r=document.createRange();r.setStart(node,a);r.setEnd(node,b);const sp=document.createElement('span');sp.className='busca-found';r.surroundContents(sp);out.push(sp)})});
    root.querySelectorAll('svg text').forEach(t=>{const n=N(t.textContent);if(words.some(w=>n.includes(w))){t.classList.add('busca-svg');out.push(t)}});
    return out}
  function render(){const box=ov.querySelector('.busca-res'),q=ov.querySelector('input').value;const r=search(q);items=[];sel=0;
    if(!r){box.innerHTML='<div class="busca-vacio">Escribe una palabra: <i>próstata</i>, <i>haploide</i>, <i>ovulación</i>…</div>';return}
    const {R,words}=r;curWords=words;let h='';
    const TN=k=>typeof TOPICS!=='undefined'&&TOPICS[k]?TOPICS[k][0]:'';
    if(R.term.length){h+='<h5>Términos clave</h5>'+R.term.map(x=>{items.push(x);return `<button type="button" class="busca-item" data-i="${items.length-1}"><b class="t">${mark(E(x.t),words)}</b><small>${mark(E(x.d),words)}${TN(x.topic)?' · '+E(TN(x.topic)):''}</small></button>`}).join('')}
    if(R.res.length){h+='<h5>En el resumen</h5>'+R.res.map(x=>{items.push(x);return `<button type="button" class="busca-item" data-i="${items.length-1}"><b class="t">${E(x.sec)}</b><small>${snip(x.t,words)}</small></button>`}).join('')}
    if(R.q.length){h+='<h5>Preguntas de práctica (toca para ver la respuesta)</h5>'+R.q.map(x=>{items.push(x);return `<button type="button" class="busca-item" data-i="${items.length-1}"><b class="t">${mark(E(x.t),words)}</b><small>${E(TN(x.topic))}</small><span class="ans">✓ ${mark(E(x.d),words)}</span></button>`}).join('')}
    box.innerHTML=h||`<div class="busca-vacio">No encontré "${E(q)}". Prueba con otra palabra o sin tildes.</div>`;
    box.querySelectorAll('.busca-item').forEach(b=>b.onclick=()=>go(items[+b.dataset.i],b));hl()}
  function hl(){ov.querySelectorAll('.busca-item').forEach((b,i)=>b.classList.toggle('sel',i===sel));const s=ov.querySelector('.busca-item.sel');if(s)s.scrollIntoView({block:'nearest'})}
  function go(x,b){if(x.kind==='q'){b.classList.toggle('open');return}
    let el=x.el;if(x.kind==='term'&&typeof TOPICS!=='undefined'&&TOPICS[x.topic])el=document.querySelector(TOPICS[x.topic][1]);
    close();clearFound();if(!el)return;const sec=el.closest('section');if(sec)sec.classList.remove('pre');
    const found=markFound(sec||el,curWords);const inEl=found.filter(f=>el.contains(f)||f===el);
    const tgt=el.closest('svg')?el.closest('.anat')||el:el;
    const first=x.kind==='term'?found[0]:(inEl[0]||null);const dest=(first&&!first.closest('svg'))?first:tgt;
    setTimeout(()=>{dest.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'});
      tgt.classList.remove('search-hit');void tgt.offsetWidth;tgt.classList.add('search-hit');setTimeout(()=>tgt.classList.remove('search-hit'),2700);
      const lab=el.closest('.lab,.plab');const box=el.closest('.anat');if(lab&&box&&(box.classList.contains('m-ver')||box.classList.contains('m-paso')))setTimeout(()=>lab.dispatchEvent(new MouseEvent('click',{bubbles:true})),500);
      inEl.forEach(f=>f.classList&&f.classList.add('busca-main'));clearT=setTimeout(clearFound,15000)},60)}
  function open(){if(ov)return;clearFound();if(!IDX)build();
    ov=document.createElement('div');ov.className='busca-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Buscar en la página');
    ov.innerHTML=`<div class="busca"><div class="busca-top">${ICON}<input type="search" placeholder="Buscar en la página…" aria-label="Buscar" autocomplete="off" spellcheck="false"><button type="button">Cerrar</button></div><div class="busca-res"></div><div class="busca-tip">Busca sin tildes · ↑ ↓ para moverte · Enter para ir · Esc para cerrar</div></div>`;
    document.body.appendChild(ov);requestAnimationFrame(()=>ov.classList.add('on'));
    const inp=ov.querySelector('input');let t;inp.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(render,90)});
    inp.addEventListener('keydown',e=>{const n=ov.querySelectorAll('.busca-item').length;
      if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(n-1,sel+1);hl()}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,sel-1);hl()}
      else if(e.key==='Enter'){e.preventDefault();const b=ov.querySelector('.busca-item.sel');if(b)b.click()}});
    ov.querySelector('.busca-top button').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});render();setTimeout(()=>inp.focus(),30)}
  function close(){if(!ov)return;const o=ov;ov=null;o.classList.remove('on');setTimeout(()=>o.remove(),200)}
  btn.onclick=open;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ov){close();return}
    const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable;
    if((e.key==='/'&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();open()}});
})();
