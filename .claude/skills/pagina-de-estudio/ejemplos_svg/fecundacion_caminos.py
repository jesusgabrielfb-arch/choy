F='font-family="Figtree,sans-serif"'
def T(x,y,t,size=12,w=700,fill='#45403F',a='middle'):return f'<text x="{x}" y="{y}" text-anchor="{a}" {F} font-size="{size}" font-weight="{w}" fill="{fill}">{t}</text>'
def egg(x,y,r=16,op=1):return f'<g opacity="{op}"><circle cx="{x}" cy="{y}" r="{r+4}" fill="#FCEFF4" stroke="#E7A3BB" stroke-width="1.6"/><circle cx="{x}" cy="{y}" r="{r}" fill="url(#fCy)" stroke="#C47D99" stroke-width="1.4"/><circle cx="{x-3}" cy="{y-2}" r="{r*.35:.1f}" fill="#B5607F"/></g>'
def sperm(x,y,rot=0):return f'<g transform="translate({x},{y}) rotate({rot})"><ellipse rx="6" ry="4.2" fill="#DCE0F8" stroke="#7680C4" stroke-width="1.2"/><path d="M6,0 q5,-4 10,0 t10,0" stroke="#7680C4" stroke-width="1.4" fill="none"/></g>'
def uterus(x,y,shed=False,emb=False):
    s=f'<g transform="translate({x-30},{y-30})"><path d="M4,6 C4,-4 56,-4 56,6 C56,30 44,44 36,52 L24,52 C16,44 4,30 4,6Z" fill="#F6B9A6" stroke="#C97560" stroke-width="1.4"/><path d="M12,8 C22,2 38,2 48,8 C44,24 36,36 31,46 L29,46 C24,36 16,24 12,8Z" fill="{"#E9798F" if not shed else "#D4566F"}"/>'
    if emb: s+='<circle cx="40" cy="16" r="5" fill="#FBE0EA" stroke="#B5607F" stroke-width="1.2"><animate attributeName="r" values="4;6;4" dur="2.4s" repeatCount="indefinite"/></circle>'
    if shed: s+=''.join(f'<circle cx="{28+i*3}" cy="56" r="2.6" fill="#C2334F"><animate attributeName="cy" values="52;70" dur="1.6s" begin="{i*.5}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.6s" begin="{i*.5}s" repeatCount="indefinite"/></circle>' for i in range(3))
    return s+'</g>'
def luteo(x,y,big=True):
    return f'<g><ellipse cx="{x}" cy="{y}" rx="28" ry="19" fill="#F0BFCF" stroke="#C47D99" stroke-width="1.4"/><circle cx="{x+6}" cy="{y}" r="{10 if big else 5}" fill="#F4C95D" stroke="#C99A3E" stroke-width="1.2">{"" if big else ""}</circle></g>'
def arrow(x1,y1,x2,y2,c):return f'<path d="M{x1},{y1} L{x2},{y2}" stroke="{c}" stroke-width="2.4" marker-end="url(#fA{c[1:]})"/>'
G,Rd='#3E9A72','#D0665E'
TY,BY=92,252
xs=[226,382,538,694]
s=''
s+=egg(70,172,20)+T(70,214,'Ovulación',12.5,800)+T(70,230,'el ovocito II',11,600,'#8A8381')+T(70,244,'llega a la trompa',11,600,'#8A8381')
s+=f'<path d="M100,160 C130,140 140,{TY} 172,{TY}" stroke="{G}" stroke-width="2.6" fill="none" marker-end="url(#fA{G[1:]})"/>'
s+=f'<path d="M100,184 C130,204 140,{BY} 172,{BY}" stroke="{Rd}" stroke-width="2.6" fill="none" marker-end="url(#fA{Rd[1:]})"/>'
s+=f'<rect x="150" y="{TY-74}" width="190" height="26" rx="13" fill="#E3F5EC" stroke="{G}"/>'+T(245,TY-56,'SÍ hay fecundación',13,800,G)
s+=f'<rect x="150" y="{BY-76}" width="190" height="26" rx="13" fill="#FBE9E7" stroke="{Rd}"/>'+T(245,BY-58,'NO hay fecundación',13,800,Rd)
# top row
top=[(egg(xs[0],TY,15)+sperm(xs[0]+26,TY+10,200),'Fecundación','en la ámpula → cigoto'),
     (''.join(f'<circle cx="{xs[1]+dx}" cy="{TY+dy}" r="9" fill="url(#fCy)" stroke="#C47D99" stroke-width="1.2"/>' for dx,dy in [(-9,-8),(9,-8),(-9,8),(9,8)]),'El cigoto se divide','y baja por la trompa'),
     (uterus(xs[2],TY,emb=True),'Se implanta','en el endometrio'),
     (luteo(xs[3]-14,TY)+f'<path d="M{xs[3]+26},{TY+12} L{xs[3]+26},{TY-14}" stroke="{G}" stroke-width="3" marker-end="url(#fA{G[1:]})"/>','Cuerpo lúteo sigue:','progesterona alta → embarazo')]
for i,(icon,a,b) in enumerate(top):
    s+=f'<g class="fst" style="--i:{i}">{icon}'+T(xs[i],TY+42,a,12.5,800)+T(xs[i],TY+58,b,11,600,'#8A8381')+'</g>'
    if i<3:s+=arrow(xs[i]+44,TY,xs[i+1]-46,TY,G)
bot=[(egg(xs[0],BY,15,.45)+f'<g transform="translate({xs[0]+20},{BY-18})"><circle r="9" fill="#fff" stroke="#8A8381" stroke-width="1.4"/><path d="M0,-5 L0,0 L4,3" stroke="#8A8381" stroke-width="1.4" fill="none"/></g>','El ovocito II se degrada','(vive ~24 horas)'),
     (luteo(xs[1],BY,big=False),'Se degrada','el cuerpo lúteo'),
     (f'<text x="{xs[2]}" y="{BY+8}" text-anchor="middle" {F} font-size="26" font-weight="800" fill="{Rd}">P</text><path d="M{xs[2]+20},{BY-14} L{xs[2]+20},{BY+12}" stroke="{Rd}" stroke-width="3" marker-end="url(#fA{Rd[1:]})"/>','Baja la progesterona',''),
     (uterus(xs[3],BY,shed=True),'Se desprende el endometrio:','menstruación → nuevo ciclo')]
for i,(icon,a,b) in enumerate(bot):
    s+=f'<g class="fst" style="--i:{i+4}">{icon}'+T(xs[i],BY+40 if i!=3 else BY+44,a,12.5,800)+(T(xs[i],BY+56 if i!=3 else BY+60,b,11,600,'#8A8381') if b else '')+'</g>'
    if i<3:s+=arrow(xs[i]+44,BY,xs[i+1]-46,BY,Rd)
svg=f'''<svg viewBox="0 0 800 330" role="img" aria-label="Qué pasa después de la ovulación. Si hay fecundación: se forma el cigoto, se divide, se implanta en el endometrio y el cuerpo lúteo sigue produciendo progesterona, así que no hay menstruación y empieza el embarazo. Si no hay fecundación: el ovocito II se degrada, el cuerpo lúteo se degrada, baja la progesterona, se desprende el endometrio y llega la menstruación.">
<defs><radialGradient id="fCy" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#FFF0F5"/><stop offset=".7" stop-color="#F6C3D3"/><stop offset="1" stop-color="#E7A3BB"/></radialGradient>
<marker id="fA{G[1:]}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="{G}"/></marker>
<marker id="fA{Rd[1:]}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="{Rd}"/></marker></defs>
{s}</svg>'''
open('fec.svg','w').write(svg)
