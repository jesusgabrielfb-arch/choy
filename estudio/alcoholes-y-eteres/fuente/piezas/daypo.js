const AT=(x,y,s,c,sz=15)=>`<text x="${x}" y="${y}" ${F} font-size="${sz}" font-weight="800" text-anchor="middle" fill="${c}">${s}</text>`;
const BALL=(x,y,r,f,s)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${s}" stroke-width="1.5"/>`;
const BOND=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9A9284" stroke-width="5" stroke-linecap="round"/>`;
const PULSE=`<animate attributeName="r" dur="1.6s" repeatCount="indefinite" values="13;16;13"/>`;
const S={
 oh:()=>SV(`${BOND(60,70,120,70)}${BOND(120,70,160,44)}${BALL(60,70,20,'#4A4A52','#2E2E33')}<circle cx="120" cy="70" r="15" fill="#D9473E" stroke="#9E2C25" stroke-width="1.5">${PULSE}</circle>${BALL(160,44,10,'#fff','#9A9284')}
  ${T(44,110,'R (hidrocarburo)')}${T(110,104,'O')}${T(166,30,'H')}${T(150,120,'grupo hidroxilo –OH',`fill="${C.coral}"`)}`),
 eter:()=>SV(`${BOND(50,70,120,70)}${BOND(120,70,190,70)}${BALL(50,70,20,'#4A4A52','#2E2E33')}${BALL(190,70,20,'#4A4A52','#2E2E33')}<circle cx="120" cy="70" r="15" fill="#D9473E" stroke="#9E2C25" stroke-width="1.5">${PULSE}</circle>
  <path d="M60,40 Q120,0 180,40" stroke="${C.blue}" stroke-width="2" fill="none" stroke-dasharray="5 4"><animate attributeName="stroke-dashoffset" dur="1.5s" repeatCount="indefinite" values="18;0"/></path>
  ${T(38,108,'R')}${T(186,108,"R'")}${T(80,124,'puente de oxígeno',`fill="${C.coral}"`)}`),
 tipos:()=>{const ring=(n,b)=>`<g opacity="0"><animate attributeName="opacity" dur="6s" begin="${b}s" repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;.05;.3;.35;1"/>${[[60,40],[60,100],[180,70]].slice(0,n).map(([x,y])=>BOND(120,70,x,y)+BALL(x,y,13,'#4A4A52','#2E2E33')).join('')}${T(140,124,['1 C → primario','2 C → secundario','3 C → terciario'][n-1],`fill="${C.coral}"`)}</g>`;
  return SV(`${ring(1,0)}${ring(2,2)}${ring(3,4)}${BOND(120,70,120,24)}${BALL(120,70,16,'#4A4A52','#2E2E33')}<circle cx="120" cy="22" r="11" fill="#D9473E"/>${T(132,20,'OH')}`)},
 poli:()=>SV(`${BOND(50,80,120,80)}${BOND(120,80,190,80)}${[50,120,190].map(x=>BALL(x,80,15,'#4A4A52','#2E2E33')).join('')}
  ${[50,120,190].map((x,i)=>`<g opacity="0"><animate attributeName="opacity" dur="4.5s" begin="${i*.9}s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;.1;.85;1"/>${BOND(x,80,x,38)}<circle cx="${x}" cy="34" r="10" fill="#D9473E"/></g>`).join('')}
  ${T(30,20,'1 OH: mono · 2: di · 3: tri')}${T(60,122,'1,2,3-propanotriol',`fill="${C.coral}"`)}`),
 cadena:()=>{const xs=[24,62,100,138,176,214];return SV(`${xs.slice(0,-1).map((x,i)=>BOND(x,70,xs[i+1],70)).join('')}${xs.map(x=>BALL(x,70,11,'#4A4A52','#2E2E33')).join('')}${BOND(62,70,62,32)}<circle cx="62" cy="28" r="9" fill="#D9473E"/>
  <rect x="10" y="56" width="20" height="28" rx="12" fill="${C.blue}" fill-opacity=".35" stroke="${C.blue}" stroke-width="2"><animate attributeName="width" dur="4s" repeatCount="indefinite" values="20;220;220" keyTimes="0;.6;1"/></rect>
  ${xs.map((x,i)=>`<text x="${x}" y="104" ${F} font-size="13" font-weight="800" text-anchor="middle" fill="${C.coral}" opacity="0">${i+1}<animate attributeName="opacity" dur="4s" begin="0s" repeatCount="indefinite" values="0;0;1;1" keyTimes="0;${(.1+i*.08).toFixed(2)};${(.15+i*.08).toFixed(2)};1"/></text>`).join('')}
  ${T(10,124,'cadena más larga con el –OH, numerada desde el –OH')}`)},
 radical:()=>SV(`${BOND(30,80,210,80)}${[30,90,150,210].map(x=>BALL(x,80,11,'#4A4A52','#2E2E33')).join('')}
  <g>${BOND(90,80,90,44)}${BALL(90,40,10,'#4A4A52','#2E2E33')}<animateTransform attributeName="transform" type="translate" dur="2s" repeatCount="indefinite" values="0,0;0,-4;0,0"/></g>
  <g>${BOND(150,80,150,44)}${BOND(150,44,150,14)}${BALL(150,44,10,'#4A4A52','#2E2E33')}${BALL(150,14,10,'#4A4A52','#2E2E33')}<animateTransform attributeName="transform" type="translate" dur="2s" begin=".5s" repeatCount="indefinite" values="0,0;0,-4;0,0"/></g>
  ${T(60,30,'metil')}${T(160,34,'etil')}${T(40,118,'radicales en orden alfabético',`fill="${C.coral}"`)}`),
 oxi:()=>SV(`${BOND(30,60,90,60)}${BOND(90,60,130,60)}${BOND(130,60,210,60)}${BALL(30,60,12,'#4A4A52','#2E2E33')}<circle cx="90" cy="60" r="13" fill="#D9473E"/>${[130,170,210].map(x=>BALL(x,60,12,'#4A4A52','#2E2E33')).join('')}
  <rect x="14" y="40" width="32" height="40" rx="12" fill="none" stroke="${C.blue}" stroke-width="2.5"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0;1;1" keyTimes="0;.3;1"/></rect>
  <rect x="114" y="40" width="112" height="40" rx="14" fill="none" stroke="${C.blue}" stroke-width="2.5"><animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0;0;1;1" keyTimes="0;.4;.6;1"/></rect>
  ${T(12,100,'menor → metoxi')}${T(126,100,'mayor → propano')}${T(54,124,'metoxi-propano',`fill="${C.coral}"`)}`),
 alfa:()=>SV(`${['etil','isopropil','metil'].map((w,i)=>`<g><rect x="${20+i*72}" y="40" width="64" height="30" rx="8" fill="#FFF0B5" stroke="#E6CF77"/><text x="${52+i*72}" y="60" ${F} font-size="13" font-weight="700" text-anchor="middle" fill="${C.ink}">${w}</text><animateTransform attributeName="transform" type="translate" dur="3s" begin="${i*.3}s" repeatCount="indefinite" values="0,0;0,-6;0,0"/></g>`).join('')}
  ${T(20,26,'e → i → m (iso sí cuenta)')}${T(20,104,'di, tri, sec y ter no cuentan',`fill="${C.coral}"`)}`),
 etanol:()=>SV(`<path d="M30,20 L70,20 L64,100 L36,100 Z" fill="#FFF3E0" stroke="${C.ink}" stroke-width="1.5"/><rect x="38" y="50" width="26" height="48" fill="${C.blue}" opacity=".6"><animate attributeName="height" dur="3s" repeatCount="indefinite" values="48;10;48"/><animate attributeName="y" dur="3s" repeatCount="indefinite" values="50;88;50"/></rect>
  <path d="M120,50 C120,30 200,26 214,44 C226,62 196,92 160,92 C134,92 120,72 120,50Z" fill="#C9775B" stroke="#8E4A36"><animate attributeName="fill" dur="3s" repeatCount="indefinite" values="#C9775B;#E3C27A;#C9775B"/></path>
  ${T(26,118,'etanol')}${T(130,110,'hígado graso')}${T(100,16,'corto: mareos · largo: daños',`fill="${C.coral}"`)}`),
 card:(word)=>SV(`<rect x="20" y="22" width="200" height="86" rx="14" fill="#FFF0B5" stroke="#E6CF77"><animate attributeName="y" dur="3s" repeatCount="indefinite" values="22;18;22"/></rect><text class="qmark" x="120" y="76" ${F} font-size="34" font-weight="800" text-anchor="middle" fill="#C9A227">?</text><text x="120" y="70" ${F} font-size="14" font-weight="700" text-anchor="middle" fill="${C.ink}">${String(word).slice(0,30)}</text>`)
};
function scene(q){if(q[5]&&q[5].img)return picHTML(q[5]);
  const t=norm(q[2]+' '+(q[0]==='mc'?q[3][0]:'')+' '+(q[4]||''));const has=r=>r.test(t);
  if(has(/etanol|mareo|nausea|higado|gastritis|pancrea|hepatitis|cancer|desnutri|triglic|psicolog|memoria|bebida/))return S.etanol();
  if(has(/primario|secundario|terciario|terbutanol/))return S.tipos();
  if(has(/diol|triol|glicer|dihidrox|trihidrox|monohidrox/))return S.poli();
  if(has(/-oxi|oxi\b|metoxi|etoxi|propoxi|etenoxi|grupo menor|menos carbonos/))return S.oxi();
  if(has(/alfabet|orden alfab|dimetil|isopropil se ordena|terbutil se ordena/))return S.alfa();
  if(has(/eter|puente|r–o–r|r-o-r|simetric/))return S.eter();
  if(has(/radical|metil|etil|propil|butil/))return S.radical();
  if(has(/cadena|enumer|numer|extremo|largo|larga/))return S.cadena();
  if(has(/hidroxilo|alcohol|-ol|r–oh|r-oh|derivad|grupo funcional/))return S.oh();
  return S.card(q[0]==='mc'?q[3][0]:(q[3]?'Verdadero':'Falso'));
}
