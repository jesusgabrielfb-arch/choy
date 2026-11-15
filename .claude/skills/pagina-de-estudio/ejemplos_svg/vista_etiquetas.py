import json,sys
L=json.load(open('labels.json'));g=''
for k,(n,(ax,ay),(x,y)) in L.items():
    w=round(len(n)*7.3+18);h=24;cx=max(x,min(ax,x+w));cy=max(y,min(ay,y+h))
    g+=f'<g class="lab"><line x1="{ax}" y1="{ay}" x2="{cx}" y2="{cy}" stroke="#8A8381" stroke-dasharray="3 3"/><circle cx="{ax}" cy="{ay}" r="3" fill="#E07A5F"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#FAF8F5" stroke="#D9D1C9" stroke-width="1.2"/><text x="{x+9}" y="{y+16.5}" font="700 13px Figtree" font-family="Figtree,sans-serif" font-weight="700" font-size="13" fill="#45403F">{n}</text></g>'
    if x+w>560 or y+h>420: print('OUT',k,x+w,y+h)
s=open('masc2.svg').read().replace('<g id="anat-labels-m"></g>','<g>'+g+'</g>')
open('masc_l.svg','w').write(s)
