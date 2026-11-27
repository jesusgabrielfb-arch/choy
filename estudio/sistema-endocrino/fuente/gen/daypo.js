const C={ink:'#3F3A4F',mut:'#837D93',vio:'#7B5CC4',lil:'#B9A6EE',mint:'#4E8F9C',green:'#3E9A72',pink:'#E58BA0',rose:'#F6C3D3',yel:'#E3B33C',red:'#D0465A',cream:'#FBEDE4',blood:'#FDE3E6'};
const F='font-family="Figtree,sans-serif"';
const T=(x,y,s,o='')=>`<text x="${x}" y="${y}" ${F} font-size="11" font-weight="700" fill="${C.mut}" ${o}>${s}</text>`;
const SV=i=>`<svg viewBox="0 0 240 130" role="img" aria-hidden="true">${i}</svg>`;
const mv=(path,dur,begin=0,extra='')=>`<animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}" ${extra}/>`;
const hx=(r=6,fill=C.vio)=>{let p='';for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;p+=`${(r*Math.cos(a)).toFixed(1)},${(r*Math.sin(a)).toFixed(1)} `}return `<polygon points="${p}" fill="${fill}" stroke="#fff" stroke-width="1"/>`};
const bloodV=(y=96)=>`<rect x="8" y="${y-14}" width="224" height="28" rx="14" fill="${C.blood}" stroke="#E9A5B0"/>`;
const thy=(x,y,s=1,f=C.lil)=>`<g transform="translate(${x},${y}) scale(${s})"><path d="M0,8 C-5,-10 -24,-24 -30,-13 C-36,0 -32,24 -16,25 C-8,26 -3,20 0,20 C3,20 8,26 16,25 C32,24 36,0 30,-13 C24,-24 5,-10 0,8 Z" fill="${f}" stroke="${C.vio}" stroke-width="1.6"/></g>`;
const S={
 sangre:()=>SV(`${bloodV(96)}<rect x="14" y="20" width="56" height="44" rx="12" fill="#EDE4FC" stroke="${C.vio}"/>${T(18,14,'glándula')}<g>${hx(6)}${mv('M42,42 L42,96 L210,96',3)}</g><g>${hx(6,C.pink)}${mv('M42,42 L42,96 L210,96',3,1.5)}</g>
  <circle cx="210" cy="50" r="22" fill="#E3F5EC" stroke="${C.green}" stroke-width="2"/>${T(176,20,'órgano diana')}${T(90,124,'hormona → sangre')}`),
 exo:()=>SV(`<rect x="8" y="24" width="100" height="70" rx="12" fill="#FFF4DF" stroke="${C.yel}"/>${T(14,16,'exocrina: conducto')}<path d="M58,60 L58,8" stroke="${C.yel}" stroke-width="6"/><circle cx="58" r="3" fill="${C.yel}">${mv('M0,60 L0,4',1.6)}</circle>
  <rect x="132" y="24" width="100" height="70" rx="12" fill="#EDE4FC" stroke="${C.vio}"/>${T(132,16,'endocrina: a la sangre')}<rect x="124" y="104" width="116" height="16" rx="8" fill="${C.blood}" stroke="#E9A5B0"/><g>${hx(4)}${mv('M182,60 L182,112 L236,112',2)}</g>`),
 maestra:()=>SV(`<ellipse cx="60" cy="34" rx="34" ry="16" fill="#FCE4EC" stroke="#C2577A"/>${T(36,16,'hipotálamo')}<ellipse cx="60" cy="74" rx="18" ry="14" fill="#F8C9C6" stroke="#A9403D"/>${T(84,78,'hipófisis')}
  ${[0,1,2].map(i=>`<path d="M60,88 L${150+i*30},${110-i*10}" stroke="${C.vio}" stroke-width="1.6" stroke-dasharray="4 3"/><circle cx="${150+i*30}" cy="${110-i*10}" r="10" fill="#E3F5EC" stroke="${C.green}"><animate attributeName="r" values="8;12;8" dur="1.6s" begin="${i*.4}s" repeatCount="indefinite"/></circle>`).join('')}${T(150,62,'glándulas periféricas')}`),
 eje:()=>SV(`<path d="M30,30 C60,6 180,6 210,30 C220,44 200,56 150,58 L94,58 C40,56 20,44 30,30 Z" fill="#FCE4EC" stroke="#C2577A"/>${T(96,26,'hipotálamo')}
  <ellipse cx="96" cy="104" rx="26" ry="18" fill="#F8C9C6" stroke="#A9403D"/><ellipse cx="148" cy="104" rx="20" ry="18" fill="#FFF3C4" stroke="#B08A1C"/>
  <path d="M100,58 L96,88" stroke="${C.red}" stroke-width="3"/><circle r="3" fill="${C.vio}">${mv('M100,58 L96,88',1.4)}</circle><path d="M140,58 L146,88" stroke="${C.yel}" stroke-width="3"/><circle r="3" fill="${C.yel}">${mv('M140,58 L146,88',1.4,.7)}</circle>
  ${T(14,108,'adeno (anterior)')}${T(172,108,'neuro (post.)')}${T(50,76,'porta')}${T(150,76,'tracto')}`),
 retro:()=>SV(`<ellipse cx="40" cy="40" rx="26" ry="14" fill="#FCE4EC" stroke="#C2577A"/>${T(18,18,'hipotálamo')}<ellipse cx="120" cy="40" rx="18" ry="14" fill="#F8C9C6" stroke="#A9403D"/>${T(104,18,'hipófisis')}${thy(200,40,.8)}
  <path d="M66,40 L100,40 M138,40 L172,40" stroke="${C.vio}" stroke-width="2"/>${T(70,56,'TRH')}${T(146,56,'TSH')}
  <path d="M200,66 C200,120 40,120 40,58" fill="none" stroke="${C.red}" stroke-width="2.4" stroke-dasharray="6 5"><animate attributeName="stroke-dashoffset" values="22;0" dur="1s" repeatCount="indefinite"/></path><circle cx="120" cy="108" r="10" fill="#FCEBE8" stroke="${C.red}"/><path d="M114,108 L126,108" stroke="${C.red}" stroke-width="2.4"/>${T(140,124,'T3/T4 frena')}`),
 mel:()=>SV(`<rect x="0" y="0" width="240" height="130" fill="#2F2A4A"><animate attributeName="fill" values="#FFF6DA;#2F2A4A;#2F2A4A;#FFF6DA" dur="6s" repeatCount="indefinite"/></rect>
  <circle cx="40" cy="36" r="16" fill="#FFD66B"><animate attributeName="opacity" values="1;0;0;1" dur="6s" repeatCount="indefinite"/></circle><path d="M46,20 A16,16 0 1 0 46,52 A12,12 0 1 1 46,20 Z" fill="#B9A6EE"><animate attributeName="opacity" values="0;1;1;0" dur="6s" repeatCount="indefinite"/></path>
  <path d="M140,96 C150,70 160,60 170,96 Z" fill="#FFF2C6" stroke="#A9811A"/>${[0,1,2,3].map(i=>`<g transform="translate(${186+i*12},${80-i*8})">${hx(4,C.lil)}<animate attributeName="opacity" values="0;1;1;0" dur="6s" repeatCount="indefinite"/></g>`).join('')}
  <text x="120" y="122" ${F} font-size="11" font-weight="700" fill="#B9A6EE">menos luz → más melatonina</text>`),
 tiro:()=>SV(`<rect x="104" y="20" width="32" height="104" rx="8" fill="#F3EEF7" stroke="#CFC2DA"/>${thy(120,64,1.4)}${T(8,16,'tiroides · cuello')}
  <g>${[0,1,2,3].map(i=>`<circle cx="${30+i*12}" cy="110" r="5" fill="${C.yel}"/>`).join('')}${T(26,98,'T4: 4 yodos')}</g><g>${[0,1,2].map(i=>`<circle cx="${184+i*12}" cy="110" r="5" fill="${C.yel}"><animate attributeName="r" values="4;6;4" dur="1.4s" begin="${i*.3}s" repeatCount="indefinite"/></circle>`).join('')}${T(178,98,'T3: 3 yodos')}</g>`),
 calcio:()=>SV(`<rect x="20" y="58" width="200" height="14" rx="7" fill="#FFFDF6" stroke="#B9A77E"/><circle cx="20" cy="56" r="10" fill="#FFFDF6" stroke="#B9A77E"/><circle cx="20" cy="74" r="10" fill="#FFFDF6" stroke="#B9A77E"/><circle cx="220" cy="56" r="10" fill="#FFFDF6" stroke="#B9A77E"/><circle cx="220" cy="74" r="10" fill="#FFFDF6" stroke="#B9A77E"/>
  <circle r="6" fill="#F4F1E6" stroke="#8A7A50">${mv('M80,64 L80,14',2)}</circle><circle r="6" fill="#F4F1E6" stroke="#8A7A50">${mv('M160,14 L160,64',2)}</circle>
  ${T(30,18,'paratohormona ↑ calcio')}${T(130,118,'calcitonina → al hueso')}`),
 supra:()=>SV(`<path d="M80,60 C110,40 150,50 152,90 C154,120 120,128 96,118 C76,110 78,90 70,80 C62,70 66,64 80,60 Z" fill="#F6D3CF" stroke="#9E4E47"/>${T(160,112,'riñón')}
  <path d="M70,58 C80,30 120,18 140,30 C152,38 150,54 146,60 C120,48 96,50 70,58 Z" fill="#FFE6BF" stroke="#B0651F"><animateTransform attributeName="transform" type="translate" values="0,0;0,-2;0,0" dur="1s" repeatCount="indefinite"/></path>
  <path d="M200,20 L184,52 L198,52 L186,84" stroke="${C.yel}" stroke-width="4" fill="none" stroke-linejoin="round"><animate attributeName="opacity" values="1;.2;1" dur=".6s" repeatCount="indefinite"/></path>${T(8,20,'suprarrenal')}${T(168,100,'adrenalina')}`),
 glucosa:(up)=>SV(`${bloodV(96)}${[0,1,2,3,4].map(i=>`<g transform="translate(${40+i*36},96)">${hx(5,C.yel)}<animate attributeName="opacity" values="${up?'1;0':'0;1'}" dur="2.4s" begin="${i*.2}s" repeatCount="indefinite"/></g>`).join('')}
  <circle cx="56" cy="40" r="24" fill="${up?'#EADFFF':'#DDF6EC'}" stroke="${up?C.vio:C.green}" stroke-width="2"/>${T(30,14,up?'células alfa':'células beta')}
  <g>${hx(7,up?C.vio:C.green)}${mv('M56,52 L56,96 L210,96',2.4)}</g>${T(120,40,up?'glucagón: sube':'insulina: baja',`fill="${up?C.vio:C.green}"`)}${T(120,58,up?'hígado → glucosa':'glucosa → músculos')}`),
 clasif:()=>SV(`${[0,1,2,3,4].map(i=>`<circle cx="${20+i*20}" cy="50" r="9" fill="#EDE4FC" stroke="${C.vio}"><animate attributeName="cy" values="50;44;50" dur="1.6s" begin="${i*.15}s" repeatCount="indefinite"/></circle>`).join('')}${T(14,84,'peptídica: aminoácidos')}
  <g transform="translate(176,50)">${[0,1,2].map(i=>`<polygon points="0,-14 12,-7 12,7 0,14 -12,7 -12,-7" fill="#FFF4DF" stroke="${C.yel}" transform="translate(${i*20-20},${i%2?8:0})"/>`).join('')}</g>${T(132,84,'lipídica: colesterol')}`),
 enf:()=>SV(`<circle cx="60" cy="56" r="34" fill="${C.cream}" stroke="#C98F72"/><circle cx="48" cy="50" r="4" fill="${C.ink}"/><circle cx="72" cy="50" r="4" fill="${C.ink}"/>${thy(60,108,.9)}
  <g>${thy(180,64,1)}<animateTransform attributeName="transform" type="scale" values="1;1.06;1" dur="1.4s" additive="sum" repeatCount="indefinite"/></g>${T(140,118,'¿exceso o déficit?')}`),
 rel:()=>SV(`<circle cx="120" cy="65" r="22" fill="#EDE4FC" stroke="${C.vio}" stroke-width="2"/>${T(98,69,'endocrino',`fill="${C.vio}"`)}
  ${[['nervioso',40,22],['circulatorio',190,22],['urinario',40,112],['digestivo',190,112],['reproductor',120,124]].map(([n,x,y],i)=>`<line x1="120" y1="65" x2="${x}" y2="${y-4}" stroke="${C.lil}" stroke-width="1.6" stroke-dasharray="4 3"><animate attributeName="stroke-dashoffset" values="14;0" dur="1s" repeatCount="indefinite"/></line><text x="${x}" y="${y}" text-anchor="middle" ${F} font-size="11" font-weight="700" fill="${C.mut}">${n}</text>`).join('')}`),
 lact:()=>SV(`<ellipse cx="60" cy="30" rx="26" ry="14" fill="#FCE4EC" stroke="#C2577A"/><ellipse cx="46" cy="66" rx="14" ry="12" fill="#F8C9C6" stroke="#A9403D"/><ellipse cx="76" cy="66" rx="12" ry="12" fill="#FFF3C4" stroke="#B08A1C"/>
  <path d="M150,30 C220,20 236,100 180,110 C150,116 140,90 150,30 Z" fill="${C.cream}" stroke="#C98F72"/><circle r="4" fill="#fff" stroke="#D7C9B0">${mv('M180,80 L232,96',1.4)}</circle>
  <path d="M60,66 L150,60" stroke="${C.pink}" stroke-width="2"/><path d="M88,70 L160,96" stroke="${C.yel}" stroke-width="2"/>${T(92,52,'prolactina')}${T(98,104,'oxitocina')}`),
 card:(word)=>SV(`<rect x="20" y="22" width="200" height="86" rx="14" fill="#FCEFD2" stroke="#E6CF77"><animate attributeName="y" dur="3s" repeatCount="indefinite" values="22;18;22"/></rect><text class="qmark" x="120" y="80" text-anchor="middle" ${F} font-size="40" font-weight="800" fill="#E6CF77">?</text><text x="120" y="70" text-anchor="middle" ${F} font-size="${word.length>22?13:17}" font-weight="800" fill="#5A4A16">${word.length>34?word.slice(0,32)+'…':word}</text>${T(84,124,'recuerda esta idea')}`)
};
function scene(q){if(q[5]&&q[5].img)return picHTML(q[5]);
  const t=norm(q[2]+' '+(q[0]==='mc'?q[3][0]:'')+' '+(q[4]||''));const has=r=>r.test(t);
  if(has(/prolactina|oxitocina|lactancia|leche|amamant/))return S.lact();
  if(has(/retroaliment|trh|detiene|frena/))return S.retro();
  if(has(/porta|tracto|adenohipof|neurohipof|eje hipot/))return S.eje();
  if(has(/melatonina|pineal|epifisis|circadiano|sueno|vigilia|retina|diurno/))return S.mel();
  if(has(/calcitonina|paratohormona|parathormona|paratiroides|calcio|oseo|osteoporosis/))return S.calcio();
  if(has(/suprarrenal|adrenalina|noradrenalina|cortisol|aldosterona|medula|corteza/))return S.supra();
  if(has(/glucagon|glucogeno|celulas alfa|ayun/))return S.glucosa(true);
  if(has(/insulina|celulas beta|glucosa|diabetes|langerhans/))return S.glucosa(false);
  if(has(/hipertiroid|hipotiroid|bocio|cushing|acromegalia|hirsutismo|enfermedad/))return S.enf();
  if(has(/tiroxina|t4|t3|yodo|tiroides/))return S.tiro();
  if(has(/peptid|lipid|colesterol|aminoacido|eliminacion|equilibrio/))return S.clasif();
  if(has(/sistema (nervioso|circulatorio|urinario|digestivo|reproductor|oseo|muscular)|relacion/))return S.rel();
  if(has(/exocrin|conducto|sudorip|saliva|mamari/))return S.exo();
  if(has(/maestra|periferic|hipotalamo|hipofisis|estimulante|gnrh|crh|ghrh|somatost|dopamina|tsh|acth|fsh|lh/))return S.maestra();
  if(has(/sangre|diana|hormona|endocrin/))return S.sangre();
  return S.card(q[0]==='mc'?q[3][0]:(q[3]?'Verdadero':'Falso'));
}
