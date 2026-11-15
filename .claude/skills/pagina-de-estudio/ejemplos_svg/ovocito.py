import math,random,json
cx,cy=250,205
rnd=random.Random(3)
cor=''
for i in range(26):
    a=i/26*2*math.pi;r=152+rnd.uniform(-4,6);x=cx+r*math.cos(a);y=cy+r*math.sin(a)
    cor+=f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="17" ry="12" transform="rotate({math.degrees(a):.0f} {x:.1f} {y:.1f})" fill="url(#vCo)" stroke="#E2A07F" stroke-width="1.2"/><circle cx="{x:.1f}" cy="{y:.1f}" r="3.6" fill="#C9784F"/>'
for i in range(14):
    a=(i+.5)/14*2*math.pi;r=176;x=cx+r*math.cos(a);y=cy+r*math.sin(a)
    if 18<y<400 and 6<x<500: cor+=f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="13" ry="9" transform="rotate({math.degrees(a):.0f} {x:.1f} {y:.1f})" fill="url(#vCo)" stroke="#E2A07F" stroke-width="1" opacity=".85"/>'
gran=''.join(f'<circle cx="{cx+r*math.cos(a):.1f}" cy="{cy+r*math.sin(a):.1f}" r="{rnd.uniform(1.4,3):.1f}" fill="#E5A3BA" opacity=".7"/>' for a,r in [(rnd.uniform(0,6.28),rnd.uniform(45,100)) for _ in range(60)])
sx,sy=398,302
svg=f'''<svg viewBox="0 0 560 400" role="img" aria-label="Ovocito II interactivo: corona radiada de células foliculares, zona pelúcida, membrana, citoplasma, núcleo haploide, primer cuerpo polar y un espermatozoide llegando con su acrosoma">
  <defs>
    <radialGradient id="vCy" cx="40%" cy="36%" r="70%"><stop offset="0" stop-color="#FFF4F7"/><stop offset=".7" stop-color="#F8CFDC"/><stop offset="1" stop-color="#EBA9BF"/></radialGradient>
    <radialGradient id="vNu" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#D88AA6"/><stop offset="1" stop-color="#99405F"/></radialGradient>
    <radialGradient id="vCo" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFE8DB"/><stop offset="1" stop-color="#F3B99B"/></radialGradient>
    <radialGradient id="vZo" cx="50%" cy="50%" r="50%"><stop offset=".86" stop-color="#FDF3F7"/><stop offset="1" stop-color="#F3D3E0"/></radialGradient>
    <filter id="vSoft" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#8A4A3C" flood-opacity=".18"/></filter>
    <radialGradient id="vHd" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#F4F5FF"/><stop offset="1" stop-color="#A9B1E4"/></radialGradient>
  </defs>
  <g class="part" data-part="corona">{cor}</g>
  <g class="part" data-part="zona" filter="url(#vSoft)"><circle cx="{cx}" cy="{cy}" r="134" fill="url(#vZo)" stroke="#E7A3BB" stroke-width="2"/></g>
  <g class="part" data-part="citoplasma"><circle cx="{cx}" cy="{cy}" r="112" fill="url(#vCy)"/>{gran}</g>
  <g class="part" data-part="membrana"><circle cx="{cx}" cy="{cy}" r="112" fill="none" stroke="#C0577C" stroke-width="3.2"/><circle class="hit" cx="{cx}" cy="{cy}" r="112" fill="none" stroke="transparent" stroke-width="12"/></g>
  <g class="part" data-part="polar"><circle cx="{cx+82}" cy="{cy-92}" r="14" fill="url(#vCy)" stroke="#C0577C" stroke-width="2"/><circle cx="{cx+80}" cy="{cy-94}" r="4.5" fill="url(#vNu)"/></g>
  <g class="part" data-part="nucleo"><circle cx="{cx-14}" cy="{cy-8}" r="36" fill="url(#vNu)" stroke="#86304F" stroke-width="1.6"/>
    <path d="M{cx-30},{cy-14} l8,10 M{cx-22},{cy-14} l-8,10 M{cx-6},{cy-18} l7,10 M{cx+1},{cy-18} l-7,10 M{cx-18},{cy+4} l7,10 M{cx-11},{cy+4} l-7,10" stroke="#FFE3EC" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M{cx-38},{cy-26} A30,30 0 0 1 {cx-14},{cy-40}" stroke="#fff" stroke-width="4" opacity=".4" fill="none" stroke-linecap="round"/></g>
  <g class="part" data-part="esperma" filter="url(#vSoft)" transform="translate({sx},{sy}) rotate(38)">
    <path d="M18,0 C34,-10 46,10 62,0 S90,-10 104,0" stroke="#6E78C2" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="12" y="-4" width="12" height="8" rx="3" fill="#EFA48C" stroke="#C26C55" stroke-width="1"/>
    <ellipse cx="0" cy="0" rx="14" ry="9" fill="url(#vHd)" stroke="#5E68B4" stroke-width="1.6"/>
    <path d="M-14,0 C-14,-7 -8,-9 -2,-9 C-8,-5 -9,5 -2,9 C-8,9 -14,7 -14,0 Z" fill="#F3B8D0" stroke="#C86F98" stroke-width="1"/>
  </g>
  <g id="anat-labels"></g>
</svg>'''
open('ovocito.svg','w').write(svg)
L={'corona':['Corona radiada (células foliculares)',[cx-150,cy-30],[4,10]],
   'zona':['Zona pelúcida',[cx-96,cy+92],[4,356]],
   'membrana':['Membrana',[cx+92,cy+64],[452,262]],
   'citoplasma':['Citoplasma',[cx+50,cy+40],[420,214]],
   'nucleo':['Núcleo (haploide)',[cx-14,cy-8],[396,140]],
   'polar':['Cuerpo polar',[cx+82,cy-92],[420,60]],
   'esperma':['Espermatozoide (acrosoma)',[sx-8,sy-6],[330,368]]}
json.dump(L,open('ovo_labels.json','w'),ensure_ascii=False)
