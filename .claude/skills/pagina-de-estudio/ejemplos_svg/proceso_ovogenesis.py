F='font-family="Figtree,sans-serif"'
def T(x,y,t,size=13,w=700,fill='#45403F',anchor='middle',cls=''):
    c=f' class="{cls}"' if cls else ''
    return f'<text{c} x="{x}" y="{y}" text-anchor="{anchor}" {F} font-size="{size}" font-weight="{w}" fill="{fill}">{t}</text>'
def lab(key,x,y,name,sub):
    return f'<g class="plab" data-lab="{key}">'+T(x,y,name,13,800,cls='nm')+T(x,y,'?',16,800,'#C9A227',cls='q')+T(x,y+16,sub,12,600,'#8A8381',cls='sub')+'</g>'
def cell(cx,cy,r,zona=False,nuc=True,chrom='',fill='url(#oCy)'):
    s=''
    if zona: s+=f'<circle cx="{cx}" cy="{cy}" r="{r+7}" fill="#FCEFF4" stroke="#E7A3BB" stroke-width="2"/>'
    s+=f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="#C47D99" stroke-width="1.8"/>'
    if nuc: s+=f'<circle cx="{cx-r*.12:.1f}" cy="{cy-r*.1:.1f}" r="{r*.36:.1f}" fill="url(#oNu)"/>'+chrom
    s+=f'<path d="M{cx-r*.6:.1f},{cy-r*.55:.1f} A{r*.8:.1f},{r*.8:.1f} 0 0 1 {cx+r*.1:.1f},{cy-r*.85:.1f}" stroke="#fff" stroke-width="{max(2,r*.12):.1f}" fill="none" opacity=".55" stroke-linecap="round"/>'
    return s
def X(cx,cy,c,sz=6):
    return f'<path d="M{cx-sz/2},{cy-sz} L{cx+sz/2},{cy+sz} M{cx+sz/2},{cy-sz} L{cx-sz/2},{cy+sz}" stroke="{c}" stroke-width="2.4" stroke-linecap="round"/>'
def arrow(x1,x2,y,l1,l2,col='#E07A5F'):
    return f'<path d="M{x1},{y} L{x2-6},{y}" stroke="{col}" stroke-width="2.6" marker-end="url(#oArr)"/>'+(T((x1+x2)/2,y-12,l1,12.5,800,col) if l1 else '')+(T((x1+x2)/2,y+20,l2,10.5,600,'#8A8381') if l2 else '')
Y=150;A,B,C,D,E=64,250,480,730,880
st=[]
g='<g class="part" data-part="ovogonia">'+cell(A,Y,22,chrom=X(A-4,Y-3,'#fff',4)+X(A+4,Y+2,'#fff',4))+'</g>'
g+=cell(A-24,Y-58,11)+cell(A+24,Y-58,11)
g+=f'<path d="M{A-12},{Y-26} Q{A-18},{Y-40} {A-22},{Y-46} M{A+12},{Y-26} Q{A+18},{Y-40} {A+22},{Y-46}" stroke="#B38FA0" stroke-width="1.6" fill="none" marker-end="url(#oArrS)"/>'+T(A,Y-78,'mitosis',11,700,'#8A8381')
g+=lab('ovogonia',A,Y+44,'Ovogonia','2n · 46')
st.append(g)
st.append(arrow(A+30,B-42,Y,'crece','en el embrión'))
g='<g class="part" data-part="ovocito1">'+cell(B,Y,34,chrom=''.join(X(B-12+i*9,Y-4+(i%2)*6,'#fff',5) for i in range(3)))+'</g>'
g+=f'<g transform="translate({B},{Y-60})"><rect x="-66" y="-13" width="132" height="24" rx="12" fill="#FFF3C4" stroke="#E6CF77"/><rect x="-56" y="-6" width="3.5" height="11" rx="1" fill="#8A6D1A"/><rect x="-50" y="-6" width="3.5" height="11" rx="1" fill="#8A6D1A"/>'+T(8,4,'pausa en profase I',10.5,800,'#8A6D1A')+'</g>'
g+=lab('ovocito1',B,Y+56,'Ovocito I (primario)','2n · 46')
st.append(g)
st.append(arrow(B+40,C-52,Y,'Meiosis I','pubertad, cada ciclo'))
g='<g class="part" data-part="ovocito2">'+cell(C,Y,40,zona=True,chrom=''.join(X(C-10+i*10,Y-2,'#fff',5) for i in range(2)))+'</g>'
g+='<g class="part" data-part="polar"><circle cx="'+str(C+44)+'" cy="'+str(Y-50)+'" r="16" fill="transparent"/>'+cell(C+44,Y-50,9,nuc=False,fill='#FBE0EA')+'</g>'+T(C+58,Y-66,'1.er cuerpo polar',10,700,'#B5607F','start',cls='sub')
g+=f'<g transform="translate({C-20},{Y-82})"><rect x="-58" y="-13" width="116" height="24" rx="12" fill="#E3F5EC" stroke="#7CC7A4"/>'+T(0,4,'ovulación: sale',10.5,800,'#2F7D5B')+'</g>'
g+=lab('ovocito2',C,Y+64,'Ovocito II (secundario)','n · 23 + 1.er cuerpo polar')
st.append(g)
sp=f'<g transform="translate({(C+D)//2+18},{Y+48}) rotate(-25)"><ellipse rx="7" ry="5" fill="#DCE0F8" stroke="#7680C4" stroke-width="1.4"/><path d="M7,0 q6,-5 12,0 t12,0" stroke="#7680C4" stroke-width="1.6" fill="none"/></g>'
st.append(arrow(C+52,D-54,Y,'Meiosis II','solo si hay fecundación')+sp)
g='<g class="part" data-part="ovulo">'+cell(D,Y,42,zona=True,chrom=X(D-8,Y-2,'#fff',5)+X(D+6,Y,'#7680C4',5))+'</g>'
g+='<g class="part" data-part="polar">'+''.join(cell(x,y,8,nuc=False,fill='#FBE0EA') for (x,y) in [(D+50,Y-46),(D+34,Y-66),(D+60,Y-72)])+'</g>'
g+=lab('ovulo',D,Y+66,'Óvulo (fecundado)','n · 23 + 3 cuerpos polares')
st.append(g)
st.append(arrow(D+52,E-30,Y,'',''))
g='<g class="part" data-part="cigoto">'+cell(E,Y,24,chrom=X(E-8,Y-2,'#fff',4)+X(E+6,Y+2,'#fff',4))+'</g>'
g+=lab('cigoto',E,Y+46,'Cigoto','2n · 46')
st.append(g)
tl='<g class="otl">'+T(30,276,'En la vida de la mujer',12,800,'#B5607F','start')
tl+='<line x1="40" y1="300" x2="900" y2="300" stroke="#E7E2DC" stroke-width="6" stroke-linecap="round"/>'
tl+='<line x1="40" y1="300" x2="900" y2="300" stroke="#E58BA0" stroke-width="6" stroke-linecap="round" pathLength="1" stroke-dasharray="1" class="otl-fill"/>'
pts=[('Embrión','empieza la ovogénesis'),('Nacimiento','~400 mil ovocitos I'),('Pubertad','se retoma: 1 ovocito II por ciclo'),('Fecundación','el ovocito II termina la meiosis'),('Menopausia','se acaba')]
for i,(a,b) in enumerate(pts):
    x=80+i*190
    tl+=f'<circle cx="{x}" cy="300" r="7" fill="#fff" stroke="#E58BA0" stroke-width="3"/>'+T(x,326,a,12.5,800)+T(x,342,b,10.5,600,'#8A8381')
tl+='</g>'
STEP=[0,1,1,2,2,3,3,4,4]
body=''.join(f'<g class="pstep" data-step="{STEP[i]}">{g}</g>' for i,g in enumerate(st))
svg=f'''<svg viewBox="0 0 940 352" role="img" aria-label="Esquema de la ovogénesis: ovogonia (2n) por mitosis, ovocito I (2n) detenido en profase I, meiosis I en la pubertad da el ovocito II (n) y el primer cuerpo polar, meiosis II solo si hay fecundación da el óvulo y en total 3 cuerpos polares; y la línea de tiempo en la vida de la mujer">
<defs><radialGradient id="oCy" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#FFF0F5"/><stop offset=".7" stop-color="#F6C3D3"/><stop offset="1" stop-color="#E7A3BB"/></radialGradient>
<radialGradient id="oNu" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#D47D9B"/><stop offset="1" stop-color="#9C4467"/></radialGradient>
<marker id="oArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#E07A5F"/></marker>
<marker id="oArrS" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#B38FA0"/></marker></defs>
{body}{tl}</svg>'''
open('../proc/ovp.svg','w').write(svg)
import json;json.dump({'ovogonia':[A,Y],'ovocito1':[B,Y],'ovocito2':[C,Y],'polar':[C+44,Y-50],'ovulo':[D,Y],'cigoto':[E,Y]},open('../proc/ovp_anch.json','w'))
