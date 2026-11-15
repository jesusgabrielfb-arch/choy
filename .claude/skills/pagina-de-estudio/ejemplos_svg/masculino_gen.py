import math,re
s=open('masc.svg').read()
P0=(266,232);P1=(118,300)
dx,dy=P1[0]-P0[0],P1[1]-P0[1];L=math.hypot(dx,dy);ux,uy=dx/L,dy/L;nx,ny=-uy,ux  # n: perpendicular
if ny<0:nx,ny=-nx,-ny  # n points downward
def pt(t,o):x=P0[0]+dx*t+nx*o;y=P0[1]+dy*t+ny*o;return f"{x:.1f},{y:.1f}"
def band(o1,o2,t0=0,t1=1,taper=0.0):
    a=[pt(t0+(t1-t0)*i/10,o1*(1-taper*i/10)) for i in range(11)];b=[pt(t0+(t1-t0)*i/10,o2*(1-taper*i/10)) for i in range(11)][::-1]
    return 'M'+' L'.join(a)+' L'+' L'.join(b)+' Z'
def line(o,t0=0,t1=1,taper=0.0):
    return 'M'+' L'.join(pt(t0+(t1-t0)*i/10,o*(1-taper*i/10)) for i in range(11))
skin=band(-30,30,-0.06,1,0.12)
cav=band(-25,-2,0.02,0.97,0.12)
spo=band(3,21,0.0,0.97,0.12)
ur=line(12,0,1.0,0.12)
tip=pt(1.0,12*0.88)
gx,gy=P1[0]+ux*14+nx*2,P1[1]+uy*14+ny*2
ang=math.degrees(math.atan2(uy,ux))
penis=f'''  <!-- pene -->
  <path d="{skin}" fill="url(#mSkin)" stroke="#D59A84" stroke-width="2" filter="url(#mTissue)"/>
  <circle cx="{pt(-0.06,0).split(',')[0]}" cy="{pt(-0.06,0).split(',')[1]}" r="29" fill="#F6D2C2"/>
  <g class="part" data-part="cavernoso"><path d="{cav}" fill="url(#mCav)" stroke="#B85E58" stroke-width="1.4"/>
    <path d="{line(-14,0.06,0.9,0.12)}" stroke="#F7C4BC" stroke-width="1.2" fill="none" stroke-dasharray="2 5" opacity=".9"/></g>
  <path d="{spo}" fill="#F4C9C0" stroke="#D8988B" stroke-width="1.2"/>
'''
urpath=f"M314,194 C316,214 318,236 314,250 C310,264 {pt(-0.02,12)} {pt(0.08,12*(1-0.12*0.8))} L"+' L'.join(pt(0.08+0.92*i/10,12*(1-0.12*(0.08+0.92*i/10)*10/10)) for i in range(1,11))
urpath=urpath.replace('L','L',)
glans=f'''  <g class="part" data-part="glande" filter="url(#mSoft)">
    <ellipse cx="{gx:.1f}" cy="{gy:.1f}" rx="26" ry="27" fill="url(#mGl)" stroke="#C0615D" stroke-width="1.8" transform="rotate({ang:.1f} {gx:.1f} {gy:.1f})"/>
    <ellipse cx="{gx+ux*24+nx*8:.1f}" cy="{gy+uy*24+ny*8:.1f}" rx="3.4" ry="2.2" fill="#A84A4A" transform="rotate({ang:.1f} {gx+ux*24+nx*8:.1f} {gy+uy*24+ny*8:.1f})"/>
  </g>
  <g class="part" data-part="prepucio">
    <path d="M{pt(0.93,-27)} Q{pt(1.0,-31)} {gx+ux*2-nx*27:.1f},{gy+uy*2-ny*27:.1f}" stroke="#D59A84" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M{pt(0.93,27)} Q{pt(1.0,31)} {gx+ux*2+nx*27:.1f},{gy+uy*2+ny*27:.1f}" stroke="#D59A84" stroke-width="7" fill="none" stroke-linecap="round"/>
  </g>
'''
# replace old penis/urethra/glans/prepucio blocks
s=re.sub(r'  <!-- pene: cuerpo cavernoso -->.*?<g id="anat-labels-m"></g>',penis+f'''  <!-- uretra -->
  <g class="part" data-part="uretra">
    <path d="{urpath}" fill="none" stroke="#E7B74A" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="{urpath}" fill="none" stroke="#FFF2C9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
'''+glans+'  <g id="anat-labels-m"></g>',s,flags=re.S)
# silhouettes out
s=re.sub(r'  <path d="M206,20 .*?\n','',s);s=re.sub(r'  <path d="M500,20 .*?\n','',s)
# vas deferens new route
old=re.search(r'M266,394 C290,392.*?346,210',s).group(0)
new='M266,394 C290,394 302,372 298,344 C294,318 274,306 254,298 C232,288 214,268 212,236 C210,196 220,130 254,88 C282,54 340,46 372,76 C392,96 390,150 376,180 C368,196 358,204 348,210'
s=s.replace(old,new)
s=re.sub(r'<path class="hit" d="M298,344 C296,310.*?stroke-width="18"/>',f'<path class="hit" d="{new}" fill="none" stroke="transparent" stroke-width="16"/>',s)
# move pubis label
s=s.replace('<text x="226" y="244" font-size="11"','<text x="232" y="168" font-size="11"')
open('masc2.svg','w').write(s)

s=open('masc2.svg').read()
import re
pub=re.search(r'  <path d="M232,178.*?\n',s).group(0);s=s.replace(pub,'')
s=s.replace('  <!-- uretra -->',pub+'  <!-- uretra -->')
s=re.sub(r'    <path d="M244,300 C246,330.*?\n','',s)
open('masc2.svg','w').write(s)

print("AXIS",[pt(t,12) for t in (0.3,0.5,0.7)],"glans",round(gx),round(gy),"cav",pt(0.4,-14))
s=open('masc2.svg').read()
a=s.index('  <!-- pene -->');b=s.index('  <!-- uretra -->')
blk=s[a:b];s=s[:a]+s[b:]
s=s.replace('  <!-- conducto deferente -->',blk+'  <!-- conducto deferente -->')
c=s.index('  <g class="part" data-part="prepucio">');d=s.index('  <g id="anat-labels-m">')
cx,cy=P1[0]+ux*2,P1[1]+uy*2
s=s[:c]+f'''  <g class="part" data-part="prepucio">
    <ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="11" ry="31" fill="url(#mSkin)" stroke="#D59A84" stroke-width="1.8" transform="rotate({ang:.1f} {cx:.1f} {cy:.1f})"/>
    <path d="M{cx-ux*6-nx*26:.1f},{cy-uy*6-ny*26:.1f} Q{cx-ux*14:.1f},{cy-uy*14:.1f} {cx-ux*6+nx*26:.1f},{cy-uy*6+ny*26:.1f}" stroke="#E7B7A3" stroke-width="1.2" fill="none"/>
  </g>
'''+s[d:]
open('masc2.svg','w').write(s)
print('collar',round(cx),round(cy))
