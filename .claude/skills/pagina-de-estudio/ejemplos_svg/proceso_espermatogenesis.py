import math,json
F='font-family="Figtree,sans-serif"'
def T(x,y,t,size=13,w=700,fill='#45403F',a='middle',cls=''):
    c=f' class="{cls}"' if cls else ''
    return f'<text{c} x="{x}" y="{y}" text-anchor="{a}" {F} font-size="{size}" font-weight="{w}" fill="{fill}">{t}</text>'
def lab(key,x,y,name,sub):
    return f'<g class="plab" data-lab="{key}">'+T(x,y,name,12.5,800,cls='nm')+T(x,y,'?',16,800,'#C9A227',cls='q')+T(x,y+15,sub,11,600,'#8A8381',cls='sub')+'</g>'
def cell(cx,cy,r,fill='url(#eCy)',stroke='#7680C4',chrom=''):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.8"/>'
            f'<circle cx="{cx-r*.1:.1f}" cy="{cy-r*.08:.1f}" r="{r*.42:.1f}" fill="url(#eNu)"/>'+chrom+
            f'<path d="M{cx-r*.62:.1f},{cy-r*.5:.1f} A{r*.8:.1f},{r*.8:.1f} 0 0 1 {cx+r*.05:.1f},{cy-r*.85:.1f}" stroke="#fff" stroke-width="{max(2,r*.12):.1f}" fill="none" opacity=".6" stroke-linecap="round"/>')
def X(cx,cy,c='#fff',sz=4.5):return f'<path d="M{cx-sz/2},{cy-sz} L{cx+sz/2},{cy+sz} M{cx+sz/2},{cy-sz} L{cx-sz/2},{cy+sz}" stroke="{c}" stroke-width="2.2" stroke-linecap="round"/>'
def sperm(x,y,sc=1):
    return (f'<g transform="translate({x},{y}) scale({sc})"><path d="M10,0 C18,-7 26,7 34,0 S48,-7 56,0" stroke="#5E68B4" stroke-width="2.2" fill="none" stroke-linecap="round"><animate attributeName="d" dur="1.2s" repeatCount="indefinite" values="M10,0 C18,-7 26,7 34,0 S48,-7 56,0;M10,0 C18,7 26,-7 34,0 S48,7 56,0;M10,0 C18,-7 26,7 34,0 S48,-7 56,0"/></path>'
            f'<rect x="8" y="-2.6" width="9" height="5.2" rx="2" fill="#EFA48C"/><ellipse cx="0" cy="0" rx="10" ry="6.5" fill="url(#eHd)" stroke="#5E68B4" stroke-width="1.4"/><path d="M-10,0 C-10,-5 -6,-6.5 -1,-6.5 C-5,-3.5 -5,3.5 -1,6.5 C-6,6.5 -10,5 -10,0Z" fill="#F3B8D0"/></g>')
def arr(x1,y1,x2,y2,step,c='#E07A5F'):
    return f'<path class="pstep parr" data-step="{step}" d="M{x1},{y1} L{x2},{y2}" stroke="{c}" stroke-width="2.4" marker-end="url(#eArr)" pathLength="1"/>'
o=[]
# --- step 0: tubo seminífero (corte) ---
cx,cy,R=118,206,98
tub=f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="#FBE9E2" stroke="#C97560" stroke-width="2.4"/>'
tub+=f'<circle cx="{cx}" cy="{cy}" r="{R-6}" fill="none" stroke="#E7B3A1" stroke-width="1"/>'
sertc=''
for i in range(10):
    a=i/10*2*math.pi;x1=cx+(R-8)*math.cos(a);y1=cy+(R-8)*math.sin(a);x2=cx+30*math.cos(a);y2=cy+30*math.sin(a)
    sertc+=f'<path d="M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f}" stroke="#F3CDBB" stroke-width="15" stroke-linecap="round"/>'
tub2=f'<circle cx="{cx}" cy="{cy}" r="27" fill="#FFF8F4"/>'
for i in range(14):
    a=(i+.5)/14*2*math.pi;x=cx+(R-16)*math.cos(a);y=cy+(R-16)*math.sin(a)
    tub2+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="#DCE0F8" stroke="#7680C4" stroke-width="1.1"/>'
for i in range(10):
    a=(i+.25)/10*2*math.pi;x=cx+(R-44)*math.cos(a);y=cy+(R-44)*math.sin(a)
    tub2+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.5" fill="#E6E8FA" stroke="#7680C4" stroke-width="1"/>'
for i in range(6):
    a=i/6*2*math.pi;x=cx+14*math.cos(a);y=cy+14*math.sin(a)
    tub2+=f'<path d="M{x:.1f},{y:.1f} q{6*math.cos(a+1):.1f},{6*math.sin(a+1):.1f} {-12*math.cos(a):.1f},{-12*math.sin(a):.1f}" stroke="#5E68B4" stroke-width="1.4" fill="none"/><circle cx="{x:.1f}" cy="{y:.1f}" r="2.6" fill="#7680C4"/>'
_unused=f'<g class="part" data-part="sertoli"><path d="M{cx+(R-8)*math.cos(0.31):.1f},{cy+(R-8)*math.sin(0.31):.1f} L{cx+30*math.cos(0.31):.1f},{cy+30*math.sin(0.31):.1f}" stroke="#EDB59C" stroke-width="16" stroke-linecap="round" opacity=".001"/></g>'
ley=''.join(f'<circle cx="{x}" cy="{y}" r="6" fill="#F7D27A" stroke="#C99A3E" stroke-width="1.2"/>' for x,y in [(214,108),(226,120),(210,124),(30,310),(42,322),(24,326)])
o.append(f'<g class="pstep" data-step="0"><g class="part" data-part="tubo">{tub}</g><g class="part" data-part="sertoli">{sertc}</g><g class="part" data-part="tubo">{tub2}</g><g class="part" data-part="leydig">{ley}</g>'+
         f'<g class="plab" data-lab="tubo">'+T(cx,332,'Tubo seminífero (corte)',12,800,'#C97560',cls='nm')+T(cx,332,'?',16,800,'#C9A227',cls='q')+T(cx,347,'dentro del testículo',10.5,600,'#8A8381',cls='sub')+'</g>'+
         f'<path d="M{cx+70},{cy+76} L{cx+50},{cy+56}" stroke="#8A8381" stroke-width="1" stroke-dasharray="3 3"/>'+f'<g class="plab" data-lab="sertoli">'+T(cx+74,cy+90,'Sertoli',10.5,700,'#B9774E','start',cls='nm')+T(cx+84,cy+92,'?',15,800,'#C9A227',cls='q')+'</g>'+
         f'<path d="M232,114 L250,106" stroke="#8A8381" stroke-width="1" stroke-dasharray="3 3"/>'+f'<g class="plab" data-lab="leydig">'+T(252,106,'Leydig',10.5,700,'#A67C1A','start',cls='nm')+T(262,108,'?',15,800,'#C9A227',cls='q')+'</g>'+'</g>')
o.append(f'<path class="pstep pzoom" data-step="1" d="M{cx+R-6},{cy-30} C230,170 240,190 262,192" stroke="#B9B2AC" stroke-width="1.4" stroke-dasharray="4 4" fill="none"/>')
# --- lineage ---
GX,G1,G2,G3,G4=290,410,545,680,808
Y=206;Y2=[134,278];Y3=[96,172,240,316]
o.append(f'<g class="pstep" data-step="1"><g class="part" data-part="gonia">{cell(GX,Y,24,chrom=X(GX-6,Y-3)+X(GX+3,Y+2))}</g>'+
         cell(GX-4,Y-70,12)+f'<path d="M{GX-2},{Y-26} Q{GX-14},{Y-42} {GX-6},{Y-54}" stroke="#9AA2D8" stroke-width="1.6" fill="none" marker-end="url(#eArrS)"/>'+T(GX+18,Y-74,'mitosis',10.5,700,'#8A8381','start')+
         lab('gonia',GX,Y+44,'Espermatogonia','2n · 44 + XY')+'</g>')
o.append(arr(GX+28,Y,G1-36,Y,2))
o.append(f'<g class="pstep" data-step="2"><g class="part" data-part="cito1">{cell(G1,Y,31,chrom="".join(X(G1-12+i*8,Y-3+(i%2)*5) for i in range(3)))}</g>'+lab('cito1',G1,Y+52,'Espermatocito I','2n · 44 + XY')+'</g>')
o.append(f'<g class="pstep" data-step="3">'+T((G1+G2)/2+4,Y+5,'Meiosis I',12,800,'#E07A5F')+'</g>')
for yy in Y2: o.append(arr(G1+30,Y+(yy-Y)*.18,G2-28,yy+(Y-yy)*.12,3))
for yy,sx in zip(Y2,['X','Y']):
    o.append(f'<g class="pstep" data-step="3"><g class="part" data-part="cito2">{cell(G2,yy,24,chrom=X(G2-4,yy-2,"#fff")+T(G2+5,yy+5,sx,11,800,"#fff"))}</g>'+lab('cito2',G2,(yy-48 if sx=='X' else yy+42),'Espermatocito II','n · 22 + '+sx)+'</g>')
o.append(f'<g class="pstep" data-step="4">'+T((G2+G3)/2+4,24,'Meiosis II',12,800,'#E07A5F')+'</g>')
for i,yy in enumerate(Y3):
    src=Y2[i//2];o.append(arr(G2+26,src+(yy-src)*.2,G3-20,yy,4))
for i,yy in enumerate(Y3):
    sx='X' if i<2 else 'Y'
    o.append(f'<g class="pstep" data-step="4"><g class="part" data-part="tida">{cell(G3,yy,17,chrom=T(G3+2,yy+4,sx,9.5,800,"#fff"))}</g>'+(lab('tida',G3,yy-40,'Espermátida','n · 22 + X') if i==0 else lab('tida',G3,yy+32,'Espermátida','n · 22 + Y') if i==3 else '')+'</g>')
o.append(f'<g class="pstep" data-step="5">'+T((G3+G4)/2+6,24,'Espermiogénesis',12,800,'#E07A5F')+'</g>')
for yy in Y3: o.append(arr(G3+20,yy,G4-30,yy,5))
for i,yy in enumerate(Y3):
    sx='X' if i<2 else 'Y'
    o.append(f'<g class="pstep" data-step="5"><g class="part" data-part="zoide"><circle cx="{G4+14}" cy="{yy}" r="26" fill="transparent"/>{sperm(G4,yy)}</g>'+T(G4+22,yy+24,'22 + '+sx,10.5,700,'#8A8381',cls='sub')+'</g>')
o.append(f'<g class="pstep" data-step="5"><path d="M880,{Y3[0]-6} q10,0 10,10 L890,{Y-8} q0,8 8,8 q-8,0 -8,8 L890,{Y3[-1]-4} q0,10 -10,10" stroke="#3E9A72" stroke-width="2" fill="none"/>'+
         f'<g class="plab" data-lab="zoide">'+T(912,Y-2,'4',22,800,'#3E9A72',cls='nm')+T(912,Y-2,'?',16,800,'#C9A227',cls='q')+T(912,Y+16,'espermato-',10.5,700,'#3E9A72',cls='sub')+T(912,Y+29,'zoides',10.5,700,'#3E9A72',cls='sub')+'</g></g>')
svg=f'''<svg viewBox="0 0 940 372" role="img" aria-label="Espermatogénesis interactiva: en los tubos seminíferos la espermatogonia (2n) se divide por mitosis, el espermatocito I (2n) hace la meiosis I y da 2 espermatocitos II (n, 22+X y 22+Y), la meiosis II da 4 espermátidas (n) y la espermiogénesis las convierte en 4 espermatozoides">
<defs><radialGradient id="eCy" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#F4F5FF"/><stop offset=".7" stop-color="#D6DBF7"/><stop offset="1" stop-color="#A9B1E4"/></radialGradient>
<radialGradient id="eNu" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#8E9BE0"/><stop offset="1" stop-color="#4C59A8"/></radialGradient>
<radialGradient id="eHd" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#AEB6EA"/></radialGradient>
<marker id="eArr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#E07A5F"/></marker>
<marker id="eArrS" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#9AA2D8"/></marker></defs>
{''.join(o)}</svg>'''
open('esp.svg','w').write(svg)
anch={'tubo':[cx-60,cy-40],'sertoli':[cx+50,cy+56],'leydig':[220,118],'gonia':[GX,Y],'cito1':[G1,Y],'cito2':[G2,Y2[0]],'tida':[G3,Y3[0]],'zoide':[G4,Y3[1]]}
json.dump(anch,open('esp_anch.json','w'))
