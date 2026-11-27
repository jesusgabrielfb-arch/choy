import json,sys,re
P=json.load(open('anat_P.json'))
html='<style>body{margin:0;background:#fff;font-family:sans-serif}svg{width:620px;display:inline-block;border:1px solid #ddd;margin:4px}.lab rect{fill:#fff;stroke:#7B5CC4}.lab text{font:700 12px Figtree,sans-serif;fill:#3F3A4F}.lab line{stroke:#7B5CC4}.lab circle{fill:#7B5CC4}.lab .q{display:none}</style>'
for k in sys.argv[1:]:
    s=open(f'anat_{k}.svg').read();g=''
    for key,p in P[k].items():
        w=round(len(p['n'])*7.3+18);h=24;ax,ay=p['a'];x,y=p['l']
        cx=max(x,min(ax,x+w));cy=max(y,min(ay,y+h))
        g+=f'<g class="lab"><line x1="{ax}" y1="{ay}" x2="{cx}" y2="{cy}"/><circle cx="{ax}" cy="{ay}" r="3"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/><text x="{x+9}" y="{y+16.5}">{p["n"]}</text></g>'
    html+=s.replace('<g id="anat-labels"></g>',g)
open('prev.html','w').write(html)
