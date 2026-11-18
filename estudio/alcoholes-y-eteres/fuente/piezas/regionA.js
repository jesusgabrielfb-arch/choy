/* ---------- química: dibujos de moléculas (estructura desarrollada) ---------- */
const SUBS=s=>String(s).replace(/(\d)/g,'<tspan baseline-shift="sub" font-size="72%">$1</tspan>');
const tw=t=>String(t).replace(/<[^>]+>/g,'').length*9.4+10;
/* "CH3|CH{u:OH;p:clave;pu:clave;pd:clave;pb:clave}|C=|C#" → átomos de la cadena */
function C(str){return str.split('|').map(t=>{const m=t.match(/^([^{]+?)(?:\{(.*)\})?$/);let g=m[1];const a={b:'-'};
  if(/=$/.test(g)){a.b='=';g=g.slice(0,-1)}else if(/#$/.test(g)){a.b='#';g=g.slice(0,-1)}a.g=g;
  if(m[2])m[2].split(';').forEach(kv=>{const i=kv.indexOf(':'),k=kv.slice(0,i),v=kv.slice(i+1);a[k]=(k==='u'||k==='d')?v.split(','):v});return a})}
const INK='#47402F',OHC='#C8443B';
/* dibuja la molécula; devuelve el svg interno, las anclas de cada parte y el tamaño */
function molDraw(chain,o={}){
  const GAP=34,H=46,top=o.top||0;let x=o.x0||10;const pos=[];
  chain.forEach(a=>{const w=Math.max(tw(a.g),30);pos.push({x,w,c:x+w/2});x+=w+GAP});
  const width=x-GAP+10,up=Math.max(0,...chain.map(a=>(a.u||[]).length)),dn=Math.max(0,...chain.map(a=>(a.d||[]).length));
  const y0=top+22+up*H,height=y0+34+dn*H+6;const anc={};const A=(k,x,y)=>{if(k&&!anc[k])anc[k]=[Math.round(x),Math.round(y)]};
  let s='';const hl=o.hl||[0,chain.length-1];
  if(o.hl!==false){const p1=pos[hl[0]],p2=pos[hl[1]];s+=`<rect class="chain-hl" x="${p1.x-6}" y="${y0-17}" width="${p2.x+p2.w-p1.x+12}" height="34" rx="14" fill="#FFD9D4" stroke="#D8473E" stroke-width="2"/>`}
  const wrap=(k,inner)=>k?`<g class="part" data-part="${k}">${inner}</g>`:inner;
  chain.forEach((a,i)=>{const p=pos[i];
    if(i<chain.length-1){const q=pos[i+1],x1=p.x+p.w+3,x2=q.x-3,b=a.b||'-';const ys=b==='='?[-3.5,3.5]:b==='#'?[-6,0,6]:[0];
      let l=ys.map(dy=>`<line x1="${x1}" y1="${y0+dy}" x2="${x2}" y2="${y0+dy}" stroke="${INK}" stroke-width="1.9"/>`).join('');
      if(a.pb)l+=`<rect x="${x1}" y="${y0-12}" width="${x2-x1}" height="24" fill="transparent"/>`;s+=wrap(a.pb,l);A(a.pb,(x1+x2)/2,y0+9)}
    const isO=a.g==='O';
    s+=wrap(a.p,`<rect x="${p.x-4}" y="${y0-15}" width="${p.w+8}" height="30" rx="8" fill="transparent"/><text x="${p.c}" y="${y0+6}" text-anchor="middle" font-size="16" font-weight="${isO?800:600}" fill="${isO?OHC:INK}" font-family="Figtree,sans-serif">${SUBS(a.g)}</text>`);A(a.p,p.x+p.w-2,y0+12);
    if(o.num!==false&&i>=hl[0]&&i<=hl[1])s+=`<g class="nums"><circle cx="${p.x}" cy="${y0+17}" r="9" fill="#D8473E"/><text x="${p.x}" y="${y0+21}" text-anchor="middle" font-size="11" fill="#fff" font-weight="800" font-family="Figtree,sans-serif">${i-hl[0]+1}</text></g>`;
    [['u',-1,'pu'],['d',1,'pd']].forEach(([k,dir,pk])=>{const L=a[k]||[];if(!L.length)return;let inner='';
      L.forEach((g,j)=>{const yt=y0+dir*H*(j+1),yl1=y0+dir*(j===0?(dir<0?15:12):H*j+12),yl2=yt+(dir<0?12:-14),isOH=g==='OH';
        inner+=`<line x1="${p.c}" y1="${yl1}" x2="${p.c}" y2="${yl2}" stroke="${INK}" stroke-width="1.9"/><g class="${isOH?'oh':'br'}"><text x="${p.c}" y="${yt+6}" text-anchor="middle" font-size="16" fill="${isOH?OHC:INK}" font-weight="${isOH?800:600}" font-family="Figtree,sans-serif">${SUBS(g)}</text></g>`;
        if(j===L.length-1)A(a[pk],p.c,dir<0?yt-14:yt+12)});
      const yA=Math.min(y0+dir*12,y0+dir*H*L.length+dir*14),yB=Math.max(y0+dir*12,y0+dir*H*L.length+dir*14);
      const wB=Math.max(...L.map(tw))+8;
      if(a[pk])inner=`<rect x="${p.c-wB/2}" y="${yA}" width="${wB}" height="${yB-yA}" rx="8" fill="transparent"/>`+inner;
      s+=wrap(a[pk],inner)})});
  return {s,anc,width,height,y0,pos};
}
function molSVG(chain,o={}){const m=molDraw(chain,o);return `<svg viewBox="0 0 ${m.width} ${m.height}" width="${m.width}" height="${m.height}" role="img" aria-label="${o.label||'Estructura desarrollada'}">${m.s}</svg>`}
/* dibujo interactivo de una molécula (usa makeAnat): las etiquetas se acomodan arriba y abajo sin pisarse */
const ANCH={};const ANAT_LBL={};const ANAT_NAMES={};
function anatChem(id,chain,P,o){const box=document.getElementById(id);if(!box)return;
  const TOPM=64,m=molDraw(chain,Object.assign({hl:false,num:false,top:TOPM},o.draw||{}));
  const keys=Object.keys(P);keys.forEach(k=>{if(!m.anc[k])console.warn('sin ancla',k)});
  const row={t:[],b:[]};keys.slice().sort((a,b)=>m.anc[a][0]-m.anc[b][0]).forEach(k=>{(m.anc[k][1]<m.y0||(P[k].row==='t'))&&P[k].row!=='b'?row.t.push(k):row.b.push(k)});
  let W=m.width;const HH=m.height+60;
  [['t',8],['b',HH-32]].forEach(([r,y])=>{let end=4;row[r].forEach(k=>{const w=Math.round(P[k].n.length*7.3+18);let x=Math.max(end+8,m.anc[k][0]-w/2);end=x+w;P[k].l=[Math.round(x),y];P[k].a=m.anc[k]});W=Math.max(W,end+8)});
  const slot=box.querySelector('.chem-slot');
  slot.outerHTML=`<div class="proc-scroll"><svg viewBox="0 0 ${Math.ceil(W)} ${HH}" role="img" aria-label="${o.label}"><g>${m.s}</g><g id="anat-labels"></g></svg></div>`;
  ANCH[o.key]={};ANAT_LBL[o.key]={};ANAT_NAMES[o.key]={};keys.forEach(k=>{ANCH[o.key][k]=P[k].a;ANAT_LBL[o.key][P[k].n]=P[k].l;ANAT_NAMES[o.key][k]=P[k].n});
  makeAnat(id,P,o.accept||{},{stage:o.stage,hello:o.hello});
}
anatChem('anat-tipos',C('CH2{p:cprim;u:OH;pu:oh1}|CH{p:csec;u:OH;pu:oh2}|C{p:cter;u:OH;pu:oh3;d:CH3;pd:metil}|CH3{p:c4}'),{
  oh1:{n:'–OH de alcohol primario',d:'Este –OH está en un carbono unido a <b>un solo</b> carbono: es la parte "primaria" de la molécula.'},
  oh2:{n:'–OH de alcohol secundario',d:'Está en un carbono unido a <b>dos</b> carbonos.'},
  oh3:{n:'–OH de alcohol terciario',d:'Está en un carbono unido a <b>tres</b> carbonos (C2, C4 y el metil).'},
  cprim:{n:'Carbono primario (C1)',d:'Unido a 1 carbono. Un alcohol con el –OH aquí es <b>primario</b>.'},
  csec:{n:'Carbono secundario (C2)',d:'Unido a 2 carbonos. Un alcohol con el –OH aquí es <b>secundario</b>.'},
  cter:{n:'Carbono terciario (C3)',d:'Unido a 3 carbonos. Un alcohol con el –OH aquí es <b>terciario</b>.'},
  metil:{n:'Radical metil',d:'Ramificación –CH₃ en el C3. Por eso el nombre lleva "3-metil".'},
  c4:{n:'Carbono 4 (CH₃)',d:'Final de la cadena principal de 4 C (butano). El nombre completo es <b>3-metil-1,2,3-butanotriol</b> (trihidroxilado).'}
},{key:'tipos',stage:'stage-tipos',label:'3-metil-1,2,3-butanotriol con sus carbonos primario, secundario y terciario',hello:'Toca un –OH o un carbono para ver de qué tipo es.',accept:{cprim:['oh1'],csec:['oh2'],cter:['oh3']}});
anatChem('anat-alc',C('CH3{p:c1}|CH{p:c2;u:OH;pu:hidroxilo}|CH2{p:cadena}|C{p:c4;u:CH3;pu:metil;d:CH2,CH3;pd:etil}|CH={p:doble;pb:doble}|CH{p:doble}|CH3{p:cadena}'),{
  c1:{n:'Carbono 1',d:'Se empieza a numerar aquí porque es el extremo <b>más cercano al –OH</b>.'},
  hidroxilo:{n:'Grupo hidroxilo (–OH)',d:'Grupo funcional de los alcoholes. Le da la terminación <b>-ol</b>: "2-ol".'},
  c2:{n:'Carbono 2 (secundario)',d:'Carbono que tiene el –OH. Está unido a 2 carbonos → alcohol <b>secundario</b>.'},
  cadena:{n:'Cadena principal',d:'La cadena más larga que contiene el carbono con –OH (y el doble enlace): 7 C → <b>hepteno</b>.'},
  c4:{n:'Carbono 4 (con 2 ramas)',d:'Tiene dos radicales: etil y metil → "4-etil-4-metil".'},
  metil:{n:'Radical metil',d:'–CH₃ en el C4.'},
  etil:{n:'Radical etil',d:'–CH₂–CH₃ en el C4. Va primero en el nombre por orden alfabético (e antes que m).'},
  doble:{n:'Doble enlace (C5=C6)',d:'Por él la cadena es un <b>alqueno</b>: "5-hepten". Se numera con el número más bajo del doble enlace.'}
},{key:'alc',stage:'stage-alc',label:'4-etil-4-metil-5-hepten-2-ol con sus partes',hello:'Toca una parte: así se arma el nombre <b>4-etil-4-metil-5-hepten-2-ol</b>.',accept:{c2:['hidroxilo'],cadena:['c1','c2','c4','doble'],doble:['cadena']}});
anatChem('anat-eter',C('CH3{p:menor}|O{p:puente}|CH2{p:c1}|CH2{p:mayor}|CH2{p:mayor}|CH{p:c4;u:CH3;pu:metil}|CH3{p:mayor}'),{
  menor:{n:'Grupo menor → metoxi',d:'Es el hidrocarburo con <b>menos carbonos</b> (1 C). Se cambia -ano por <b>-oxi</b>: metoxi.'},
  puente:{n:'Puente de oxígeno',d:'El –O– une los dos radicales: por eso es un <b>éter</b> (R–O–R\').'},
  c1:{n:'C1 del grupo mayor',d:'El grupo mayor se numera desde el carbono <b>pegado al oxígeno</b>.'},
  mayor:{n:'Grupo mayor → pentano',d:'Cadena de 5 C con enlaces simples → termina en <b>-ano</b>: pentano.'},
  c4:{n:'Carbono 4',d:'Tiene la ramificación: por eso "4-metil".'},
  metil:{n:'Radical metil',d:'Ramificación –CH₃. Nombre: <b>metoxi-4-metil-pentano</b> (formal: 1-metoxi-4-metilpentano).'}
},{key:'eter',stage:'stage-eter',label:'Éter metoxi-4-metil-pentano con sus partes',hello:'Toca una parte del éter para ver cómo se nombra.',accept:{mayor:['c1','c4']}});

/* ---------- procesos (pasos para nombrar), dibujados con la misma molécula ---------- */
function procChem(id,chain,steps){const box=document.getElementById(id);if(!box)return;
  const TOPM=70,m=molDraw(chain,{hl:false,num:false,top:TOPM});const st=steps(m);
  const W=Math.max(m.width,st.minW||0),HH=m.height+70;
  const slot=box.querySelector('.chem-slot');
  slot.outerHTML=`<div class="proc-scroll"><svg viewBox="0 0 ${Math.ceil(W)} ${HH}" role="img" aria-label="${st.label}">${st.svg(W,HH)}</svg></div>`;
}
const PL=(k,x,y,nm,anchor='middle')=>`<g class="plab" data-lab="${k}"><text class="nm" x="${x}" y="${y}" text-anchor="${anchor}" font-family="Figtree,sans-serif" font-size="13" font-weight="800" fill="#B8352D">${nm}</text><text class="q" x="${x}" y="${y}" text-anchor="${anchor}" font-family="Figtree,sans-serif" font-size="16" font-weight="800" fill="#2A8FB8">?</text></g>`;
procChem('anat-pasos',C('CH3|CH{u:OH}|CH2|C{u:CH3;d:CH2,CH3}|CH=|CH|CH3'),m=>({label:'Los 5 pasos para nombrar 4-etil-4-metil-5-hepten-2-ol',minW:640,svg:(W,HH)=>{
  const p=m.pos,y0=m.y0,a=p[0],b=p[p.length-1];
  const nums=p.map((q,i)=>`<circle cx="${q.x-2}" cy="${y0+19}" r="10" fill="#D8473E"/><text x="${q.x-2}" y="${y0+23}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="Figtree,sans-serif">${i+1}</text>`).join('');
  const br=[[p[3].c,y0-46,26,16],[p[3].c,y0+70,30,40]].map(([x,y,rx,ry])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#CDEEF8" fill-opacity=".55" stroke="#2A8FB8" stroke-width="2.4" stroke-dasharray="6 4"/>`).join('');
  return `
  <g class="pstep" data-step="1"><g class="part" data-part="cadena"><rect x="${a.x-8}" y="${y0-19}" width="${b.x+b.w-a.x+16}" height="38" rx="16" fill="#FFD9D4" fill-opacity=".45" stroke="#D8473E" stroke-width="3"/></g></g>
  <g class="pstep" data-step="2"><g class="part" data-part="numeros">${nums}</g></g>
  <g class="pstep" data-step="3"><g class="part" data-part="radicales">${br}</g></g>
  <g class="pstep" data-step="4"><g class="part" data-part="nombre"><rect x="${W/2-190}" y="${HH-44}" width="380" height="36" rx="12" fill="#fff" stroke="#D8473E" stroke-width="2"/><text x="${W/2}" y="${HH-20}" text-anchor="middle" font-family="Instrument Serif,serif" font-size="24" fill="#B8352D">4-etil-4-metil-5-hepten-2-ol</text></g></g>
  <g class="pstep" data-step="0"><g class="part" data-part="estructura">${m.s}</g></g>${PL('estructura',a.x,22,'1 · Estructura','start')}${PL('cadena',b.x+b.w,y0+46,'2 · Cadena principal','end')}${PL('numeros',b.x+b.w,22,'3 · Enumerar','end')}${PL('radicales',p[3].c+60,y0+110,'4 · Radicales','start')}${PL('nombre',W/2,HH-52,'5 · Nombre')}`}}));
procChem('anat-eterpasos',C('CH3|O|CH2|CH2|CH3'),m=>({label:'Pasos para nombrar el éter CH3–O–CH2–CH2–CH3',minW:600,svg:(W,HH)=>{
  const p=m.pos,y0=m.y0;const box=(i,j,c)=>`<rect x="${p[i].x-8}" y="${y0-19}" width="${p[j].x+p[j].w-p[i].x+16}" height="38" rx="14" fill="${c}" fill-opacity=".4" stroke="${c}" stroke-width="2.6"/>`;
  return `<g class="pstep" data-step="0"><g>${m.s}</g><g class="part" data-part="puente"><circle cx="${p[1].c}" cy="${y0}" r="20" fill="#F9DCD0" fill-opacity=".5" stroke="#C8443B" stroke-width="2.6"/></g></g>
  <g class="pstep" data-step="1"><g class="part" data-part="menor">${box(0,0,'#2A8FB8')}<text x="${p[0].c}" y="${y0+44}" text-anchor="middle" font-size="13" font-weight="800" fill="#2A8FB8" font-family="Figtree,sans-serif">1 C</text></g></g>
  <g class="pstep" data-step="2"><g class="part" data-part="mayor">${box(2,4,'#D8473E')}<text x="${(p[2].c+p[4].c)/2}" y="${y0+44}" text-anchor="middle" font-size="13" font-weight="800" fill="#B8352D" font-family="Figtree,sans-serif">3 C</text></g></g>
  <g class="pstep" data-step="3"><g class="part" data-part="iupac"><rect x="${W/2-150}" y="${HH-62}" width="300" height="32" rx="10" fill="#fff" stroke="#2A8FB8" stroke-width="2"/><text x="${W/2}" y="${HH-40}" text-anchor="middle" font-family="Instrument Serif,serif" font-size="22" fill="#1F6F90">metoxi-propano</text></g></g>
  <g class="pstep" data-step="4"><g class="part" data-part="rf"><rect x="${W/2-150}" y="${HH-26}" width="300" height="24" rx="8" fill="#FDE8F2" stroke="#D8473E" stroke-width="1.6"/><text x="${W/2}" y="${HH-9}" text-anchor="middle" font-family="Figtree,sans-serif" font-size="14" font-weight="700" fill="#B8352D">RF: éter metil-propílico</text></g></g>
  ${PL('puente',p[1].c,22,'1 · Puente de O')}${PL('menor',p[0].x,48,'2 · Grupo menor','start')}${PL('mayor',p[4].x+p[4].w,48,'3 · Grupo mayor','end')}${PL('iupac',W/2-160,HH-41,'4 · IUPAC','end')}${PL('rf',W/2-160,HH-9,'5 · RF','end')}`}}));
