"""Genera los dibujos interactivos (makeAnat) del sistema endocrino.
Salida: anat_<id>.svg (solo el <svg>) y anat_P.json (definiciones P para makeAnat)."""
import json, math, os
OUT = os.path.dirname(os.path.abspath(__file__))
F = 'font-family="Figtree,sans-serif"'

def filt(p):
    return (f'<filter id="{p}Tx" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.06 0.09" numOctaves="3" seed="7" result="n"/>'
            f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0 0.55  0 0 0 0.5 -0.14" result="nc"/><feComposite in="nc" in2="SourceGraphic" operator="in" result="tex"/><feBlend in="tex" in2="SourceGraphic" mode="multiply"/></filter>'
            f'<filter id="{p}Sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#4A3A6A" flood-opacity=".22"/></filter>')

def rg(i, a, b, cx='40%', cy='35%'):
    return f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="70%"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></radialGradient>'

def hit(x, y, r=12):
    return f'<circle class="hit" cx="{x}" cy="{y}" r="{r}" fill="transparent"/>'

def ctx(x, y, s, anchor='start'):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="11" fill="#A79FB0" {F}>{s}</text>'

P = {}
SV = {}

# ---------------------------------------------------------------- A. cuerpo con glándulas
X = 250
skin, skinS = '#F5EEF8', '#D9CBE6'
a = []
a.append('<defs>' + filt('c') + rg('cGl1', '#F9D3DD', '#E07D98') + rg('cGl2', '#E5DAFF', '#9B7FE0') + rg('cGl3', '#FFF1C9', '#E3B33C')
         + rg('cGl4', '#FFE0C2', '#EE9A55') + rg('cGl5', '#FFE6D0', '#F0A66B') + rg('cGl6', '#D8F3EA', '#5DB59A') + rg('cBr', '#FBF6FD', '#E8DAF2')
         + '<linearGradient id="cSk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8F2FA"/><stop offset="1" stop-color="#EFE5F4"/></linearGradient></defs>')
# silueta
a.append(f'<g opacity=".95">')
a.append(f'<path d="M178,156 C160,200 152,262 146,334" stroke="{skinS}" stroke-width="29" fill="none" stroke-linecap="round"/><path d="M178,156 C160,200 152,262 146,334" stroke="url(#cSk)" stroke-width="26" fill="none" stroke-linecap="round"/>')
a.append(f'<path d="M322,156 C340,200 348,262 354,334" stroke="{skinS}" stroke-width="29" fill="none" stroke-linecap="round"/><path d="M322,156 C340,200 348,262 354,334" stroke="url(#cSk)" stroke-width="26" fill="none" stroke-linecap="round"/>')
a.append(f'<path d="M224,396 L218,508" stroke="{skinS}" stroke-width="37" stroke-linecap="round"/><path d="M224,396 L218,508" stroke="url(#cSk)" stroke-width="34" stroke-linecap="round"/>')
a.append(f'<path d="M276,396 L282,508" stroke="{skinS}" stroke-width="37" stroke-linecap="round"/><path d="M276,396 L282,508" stroke="url(#cSk)" stroke-width="34" stroke-linecap="round"/>')
a.append(f'<path d="M250,128 C222,128 196,134 180,148 C168,160 172,200 178,240 C182,270 176,300 172,330 C170,360 178,385 188,404 L312,404 C322,385 330,360 328,330 C324,300 318,270 322,240 C328,200 332,160 320,148 C304,134 278,128 250,128 Z" fill="url(#cSk)" stroke="{skinS}" stroke-width="1.6"/>')
a.append(f'<rect x="236" y="100" width="28" height="34" rx="8" fill="url(#cSk)" stroke="{skinS}" stroke-width="1.4"/>')
a.append(f'<ellipse cx="{X}" cy="60" rx="42" ry="50" fill="url(#cSk)" stroke="{skinS}" stroke-width="1.6"/>')
a.append('</g>')
# cerebro (contexto)
a.append(f'<ellipse cx="{X}" cy="50" rx="31" ry="25" fill="url(#cBr)" stroke="#D8C3E8" stroke-width="1.4"/>'
         f'<path d="M226,46 q8,-8 16,-2 q8,-8 16,0 q8,-7 16,2 M228,58 q10,6 20,0 q10,6 20,0" fill="none" stroke="#E2D2EE" stroke-width="1.2"/>')
# riñones (contexto)
for kx, s in ((222, -1), (278, 1)):
    a.append(f'<path d="M{kx},252 c{-14*-s},0 {-18*-s},14 {-18*-s},24 c0,12 {6*-s},22 {16*-s},22 c{8*-s},0 {2*-s},-10 {2*-s},-22 c0,-12 {6*-s},-24 0,-24 Z" fill="#EEE8F1" stroke="#CFC4D8" stroke-width="1.3"/>')
a.append(ctx(X, 318, 'riñones', 'middle'))
# útero (contexto)
a.append('<path d="M240,362 q10,-10 20,0 l-4,22 h-12 Z" fill="#EFE6F1" stroke="#D5C8DE" stroke-width="1.2"/>')
# glándulas
def part(k, inner, filt_=True):
    f = ' filter="url(#cSh)"' if filt_ else ''
    a.append(f'<g class="part" data-part="{k}"{f}>{inner}</g>')
part('pineal', '<path d="M262,44 q5,6 0,12 q-5,-6 0,-12 Z" fill="url(#cGl3)" stroke="#B88A1E" stroke-width="1.2"/>' + hit(262, 50, 9))
part('hipotalamo', '<ellipse cx="242" cy="68" rx="10" ry="6" fill="url(#cGl1)" stroke="#B9566F" stroke-width="1.2"/>' + hit(242, 68, 9))
part('hipofisis', '<path d="M246,74 L248,82" stroke="#9B7FE0" stroke-width="2"/><circle cx="249" cy="86" r="6" fill="url(#cGl2)" stroke="#6E52B8" stroke-width="1.2"/>' + hit(249, 86, 9))
part('tiroides', '<path d="M250,146 C246,136 236,128 232,134 C228,142 232,154 242,154 C246,154 248,150 250,150 C252,150 254,154 258,154 C268,154 272,142 268,134 C264,128 254,136 250,146 Z" fill="url(#cGl2)" stroke="#6E52B8" stroke-width="1.3"/>' + hit(250, 144, 11))
part('paratiroides', ''.join(f'<circle cx="{x}" cy="{y}" r="2.8" fill="url(#cGl3)" stroke="#B88A1E" stroke-width="1"/>' for x, y in ((236, 136), (264, 136), (238, 150), (262, 150))) + hit(264, 140, 7) + hit(236, 140, 7))
part('timo', '<ellipse cx="244" cy="180" rx="8" ry="17" fill="url(#cGl1)" stroke="#C67C93" stroke-width="1.1" opacity=".85" transform="rotate(8 244 180)"/><ellipse cx="256" cy="180" rx="8" ry="17" fill="url(#cGl1)" stroke="#C67C93" stroke-width="1.1" opacity=".85" transform="rotate(-8 256 180)"/>')
part('suprarrenales', '<path d="M210,256 L222,238 L234,254 Q222,250 210,256 Z" fill="url(#cGl4)" stroke="#C26E28" stroke-width="1.2"/><path d="M266,254 L278,238 L290,256 Q278,250 266,254 Z" fill="url(#cGl4)" stroke="#C26E28" stroke-width="1.2"/>' + hit(222, 249, 9) + hit(278, 249, 9))
part('pancreas', '<path d="M218,300 C218,290 232,288 246,290 C262,292 278,284 292,282 C300,281 302,288 296,292 C282,300 262,302 248,304 C236,306 230,312 224,310 C218,308 218,304 218,300 Z" fill="url(#cGl5)" stroke="#C97A3A" stroke-width="1.3"/>')
part('ovarios', '<ellipse cx="226" cy="372" rx="10" ry="6.5" fill="url(#cGl1)" stroke="#B9566F" stroke-width="1.2"/><ellipse cx="274" cy="372" rx="10" ry="6.5" fill="url(#cGl1)" stroke="#B9566F" stroke-width="1.2"/>' + hit(226, 372, 9) + hit(274, 372, 9))
# recuadro: testículos
a.append('<circle cx="470" cy="458" r="44" fill="#FFFFFF" stroke="#CFC4D8" stroke-width="1.4" stroke-dasharray="5 4"/>' + ctx(470, 418 - 4, '', 'middle'))
a.append(f'<path d="M444,444 q26,-16 52,0 q2,30 -26,44 q-28,-14 -26,-44 Z" fill="#F3EAF5" stroke="#D5C8DE" stroke-width="1.2"/>')
part('testiculos', '<ellipse cx="459" cy="462" rx="10" ry="13" fill="url(#cGl6)" stroke="#3E8C74" stroke-width="1.2"/><ellipse cx="481" cy="462" rx="10" ry="13" fill="url(#cGl6)" stroke="#3E8C74" stroke-width="1.2"/>')
a.append(ctx(470, 516, 'en el hombre', 'middle'))
a.append(ctx(372, 300, 'gónadas: diferentes según el sexo'))
a.append('<g id="anat-labels"></g>')
SV['cuerpo'] = ('0 0 560 524', 'Cuerpo humano con las glándulas endocrinas: hipotálamo, hipófisis, glándula pineal, tiroides, paratiroides, timo, suprarrenales, páncreas, ovarios y testículos', ''.join(a))
P['cuerpo'] = {
 'hipotalamo': {'n': 'Hipotálamo', 'd': 'Glándula maestra (parte del encéfalo). Inicia la regulación hormonal: produce hormonas liberadoras e inhibidoras y neurohormonas (oxitocina y ADH).', 'a': [242, 68], 'l': [372, 50]},
 'hipofisis': {'n': 'Hipófisis (pituitaria)', 'd': 'Glándula maestra que está debajo del hipotálamo. Libera las hormonas estimulantes (TSH, ACTH, FSH, LH, GH, prolactina) que controlan a otras glándulas.', 'a': [249, 86], 'l': [372, 84]},
 'pineal': {'n': 'Pineal (epífisis)', 'd': 'Glándula pequeña en forma de cono, entre los hemisferios cerebrales (diencéfalo). Secreta melatonina: ritmo circadiano y ciclo sueño-vigilia.', 'a': [262, 50], 'l': [372, 16]},
 'tiroides': {'n': 'Tiroides', 'd': 'En la parte anterior del cuello, rodeando la tráquea y debajo de la laringe. Es la glándula endocrina más grande. Produce T4 (tiroxina), T3 y calcitonina.', 'a': [250, 147], 'l': [30, 118]},
 'paratiroides': {'n': 'Paratiroides', 'd': 'Generalmente 4 glándulas pequeñas adheridas a la parte posterior de la tiroides. Producen paratohormona: regula el calcio y el fósforo.', 'a': [264, 136], 'l': [372, 124]},
 'timo': {'n': 'Timo (extra)', 'd': 'Aparece en la lámina del PPT, pero no se explica. Dato extra: está detrás del esternón y ayuda a madurar las defensas (linfocitos T) sobre todo en la niñez.', 'a': [244, 186], 'l': [16, 176]},
 'suprarrenales': {'n': 'Glándulas suprarrenales', 'd': 'Encima de los riñones y adheridas a ellos. Médula: adrenalina y noradrenalina. Corteza: cortisol y aldosterona.', 'a': [278, 244], 'l': [372, 214]},
 'pancreas': {'n': 'Páncreas', 'd': 'Glándula mixta. Su parte endocrina (islotes de Langerhans) produce insulina (células beta) y glucagón (células alfa); su parte exocrina produce el jugo pancreático.', 'a': [262, 296], 'l': [30, 280]},
 'ovarios': {'n': 'Ovarios (mujer)', 'd': 'Gónadas femeninas: producen estrógenos y progesterona. Las gónadas son las únicas glándulas diferentes según el sexo.', 'a': [274, 372], 'l': [372, 340]},
 'testiculos': {'n': 'Testículos (hombre)', 'd': 'Gónadas masculinas: producen principalmente testosterona.', 'a': [481, 462], 'l': [372, 388]},
}

# ---------------------------------------------------------------- B. eje hipotálamo–hipófisis
b = []
b.append('<defs>' + filt('e') + rg('eHy', '#FCE4EC', '#EC9DB4') + rg('eAd', '#FBC9C6', '#D9625E') + rg('eNe', '#FFF3C4', '#EAC24A') + rg('eNeu', '#FFFFFF', '#D7A0E8')
         + '<marker id="eAr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#C2457A"/></marker></defs>')
b.append(ctx(150, 30, 'encéfalo (diencéfalo)'))
b.append('<path d="M60,40 C120,20 420,20 500,44" fill="none" stroke="#E4D8EE" stroke-width="2" stroke-dasharray="4 4"/>')
b.append('<g class="part" data-part="hipotalamo" filter="url(#eSh)"><path d="M120,70 C150,40 380,36 430,72 C452,90 440,130 410,144 C380,158 330,160 300,168 L262,170 C230,168 190,160 160,148 C126,134 106,96 120,70 Z" fill="url(#eHy)" stroke="#C2577A" stroke-width="1.8" filter="url(#eTx)"/></g>')
# neuronas
def neuron(x, y):
    return f'<circle cx="{x}" cy="{y}" r="11" fill="url(#eNeu)" stroke="#9A5DB5" stroke-width="1.4"/><circle cx="{x}" cy="{y}" r="4" fill="#9A5DB5"/>'
b.append(neuron(210, 96) + neuron(256, 110))
b.append(neuron(330, 92) + neuron(372, 108))
# infundíbulo / tallo
b.append('<path d="M258,168 C254,200 250,214 246,232 L300,232 C300,214 300,196 304,168 Z" fill="#F6D8E2" stroke="#D49AAF" stroke-width="1.4"/>')
# adenohipófisis
b.append('<g class="part" data-part="adeno" filter="url(#eSh)"><path d="M150,300 C140,256 190,226 244,228 C278,230 296,250 296,280 C296,330 262,358 222,360 C180,362 156,336 150,300 Z" fill="url(#eAd)" stroke="#A9403D" stroke-width="1.8" filter="url(#eTx)"/>'
         + ''.join(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#FFE2E0" opacity=".9"/>' for x, y in ((190, 280), (210, 300), (236, 286), (256, 310), (222, 326), (198, 318), (262, 272))) + '</g>')
# neurohipófisis
b.append('<g class="part" data-part="neuro" filter="url(#eSh)"><path d="M300,240 C340,228 392,244 398,286 C404,330 370,356 334,354 C306,352 296,330 298,300 Z" fill="url(#eNe)" stroke="#B08A1C" stroke-width="1.8" filter="url(#eTx)"/></g>')
# sistema porta (capilares)
porta = 'M214,104 C222,130 236,150 252,168 C262,186 258,206 250,226 C244,242 230,252 214,262'
b.append(f'<g class="part" data-part="porta"><path class="hit" d="{porta}" stroke="transparent" stroke-width="18" fill="none"/>'
         f'<path d="{porta}" stroke="#D0465A" stroke-width="4" fill="none" stroke-linecap="round"/>'
         f'<path d="M256,114 C252,140 256,156 262,170" stroke="#D0465A" stroke-width="3" fill="none"/>'
         + ''.join(f'<path d="M{x},{y} q-10,8 -4,18 q8,6 16,-2" stroke="#E1717F" stroke-width="2" fill="none"/>' for x, y in ((214, 262), (232, 286), (196, 300), (250, 304)))
         + ''.join(f'<circle cx="{x}" cy="{y}" r="2.6" fill="#7B5CC4"><animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="{d}s" repeatCount="indefinite"/></circle>' for x, y, d in ((240, 152, 0), (252, 196, .6), (238, 240, 1.2)))
         + '</g>')
# tracto hipotalamohipofisario (axones)
tr = ['M330,102 C322,150 312,196 322,262', 'M372,118 C362,170 344,214 346,276', 'M318,96 C306,150 302,206 312,250']
b.append('<g class="part" data-part="tracto">' + ''.join(f'<path class="hit" d="{p}" stroke="transparent" stroke-width="14" fill="none"/>' for p in tr[:2])
         + ''.join(f'<path d="{p}" stroke="#E2B12E" stroke-width="2.6" fill="none" stroke-linecap="round"/>' for p in tr)
         + ''.join(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#E2B12E" stroke="#9C7A12" stroke-width=".8"/>' for x, y in ((322, 262), (346, 276), (312, 250))) + '</g>')
# salida a la sangre
b.append('<path d="M224,360 C232,384 330,388 360,354" fill="none" stroke="#C84D61" stroke-width="3" opacity=".75" marker-end="url(#eAr)"/>'
         + ctx(292, 396, 'hormonas → sangre', 'middle'))
b.append(ctx(150, 386, 'anterior', 'middle') + ctx(412, 372, 'posterior', 'middle'))
b.append('<g id="anat-labels"></g>')
SV['eje'] = ('0 0 560 404', 'Eje hipotálamo-hipofisario: hipotálamo con neuronas, sistema porta hipofisario hacia la adenohipófisis (anterior) y tracto hipotalamohipofisario hacia la neurohipófisis (posterior)', ''.join(b))
P['eje'] = {
 'hipotalamo': {'n': 'Hipotálamo', 'd': 'Está encima de la hipófisis e inicia la regulación hormonal. Sus neuronas producen hormonas liberadoras/inhibidoras y neurohormonas.', 'a': [170, 86], 'l': [8, 50]},
 'porta': {'n': 'Sistema porta hipofisario', 'd': 'Red (plexo) de capilares sanguíneos que lleva las hormonas liberadoras del hipotálamo a la adenohipófisis.', 'a': [246, 200], 'l': [4, 178]},
 'tracto': {'n': 'Tracto hipotalamohipofisario', 'd': 'Conjunto de axones que lleva las neurohormonas (oxitocina y ADH) del hipotálamo a la neurohipófisis, donde se almacenan.', 'a': [356, 180], 'l': [334, 170]},
 'adeno': {'n': 'Adenohipófisis (anterior)', 'd': 'Lóbulo anterior de la hipófisis. Recibe hormonas liberadoras por el sistema porta y libera las hormonas estimulantes (TSH, ACTH, FSH, LH, GH, prolactina).', 'a': [176, 318], 'l': [4, 330]},
 'neuro': {'n': 'Neurohipófisis (posterior)', 'd': 'Lóbulo posterior de la hipófisis. No fabrica hormonas: almacena y libera a la sangre la oxitocina y la ADH (vasopresina) del hipotálamo.', 'a': [372, 300], 'l': [346, 214]},
}

# ---------------------------------------------------------------- C. tiroides y paratiroides
c = []
c.append('<defs>' + filt('t') + rg('tTh', '#E9DEFF', '#9476DC') + rg('tPa', '#FFF2C6', '#E3B33C') + rg('tLa', '#F6F0FA', '#D9CBE6')
         + '<linearGradient id="tTr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9E1EF"/><stop offset=".5" stop-color="#FBF8FD"/><stop offset="1" stop-color="#E3D9EB"/></linearGradient></defs>')
c.append(f'<text x="190" y="22" text-anchor="middle" font-size="13" font-weight="800" fill="#837D93" {F}>Vista de frente</text>')
c.append(f'<text x="440" y="22" text-anchor="middle" font-size="13" font-weight="800" fill="#837D93" {F}>Vista de atrás</text>')
def trachea(cx, top, bot, w=46):
    s = f'<rect x="{cx-w/2}" y="{top}" width="{w}" height="{bot-top}" rx="10" fill="url(#tTr)" stroke="#CFC2DA" stroke-width="1.4"/>'
    y = top + 10
    while y < bot - 6:
        s += f'<path d="M{cx-w/2+2},{y} Q{cx},{y+7} {cx+w/2-2},{y}" fill="none" stroke="#D9CCE4" stroke-width="3"/>'
        y += 17
    return s
c.append(f'<g class="part" data-part="traquea">{trachea(190, 112, 372)}</g>')
c.append('<g class="part" data-part="laringe" filter="url(#tSh)"><path d="M156,40 L224,40 L230,64 C226,92 208,108 190,114 C172,108 154,92 150,64 Z" fill="url(#tLa)" stroke="#BFAECD" stroke-width="1.6"/><path d="M178,44 L190,62 L202,44" fill="none" stroke="#C9B9D6" stroke-width="2"/></g>')
lobe = lambda cx, s: f'M{cx},{132} C{cx-18*s},{140} {cx-26*s},{196} {cx-18*s},{240} C{cx-12*s},{266} {cx+8*s},{270} {cx+16*s},{252} C{cx+24*s},{224} {cx+22*s},{170} {cx+10*s},{140} C{cx+6*s},{130} {cx+2*s},{128} {cx},{132} Z'
c.append(f'<g class="part" data-part="lobder" filter="url(#tSh)"><path d="{lobe(150, 1)}" fill="url(#tTh)" stroke="#5F45AA" stroke-width="1.7" filter="url(#tTx)"/></g>')
c.append(f'<g class="part" data-part="lobizq" filter="url(#tSh)"><path d="{lobe(230, -1)}" fill="url(#tTh)" stroke="#5F45AA" stroke-width="1.7" filter="url(#tTx)"/></g>')
c.append('<g class="part" data-part="istmo"><path d="M160,206 C176,198 204,198 220,206 L220,228 C204,222 176,222 160,228 Z" fill="url(#tTh)" stroke="#5F45AA" stroke-width="1.5"/></g>')
# vista posterior
c.append(f'<g opacity=".95">{trachea(440, 60, 372, 52)}</g>')
c.append(f'<path d="{lobe(400, 1)}" fill="url(#tTh)" stroke="#5F45AA" stroke-width="1.5" opacity=".9" transform="translate(0,-12)"/>')
c.append(f'<path d="{lobe(480, -1)}" fill="url(#tTh)" stroke="#5F45AA" stroke-width="1.5" opacity=".9" transform="translate(0,-12)"/>')
c.append('<g class="part" data-part="paratiroides" filter="url(#tSh)">' + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="9" ry="7" fill="url(#tPa)" stroke="#A9811A" stroke-width="1.4"/>' for x, y in ((392, 156), (488, 156), (396, 226), (484, 226))) + hit(392, 156, 12) + hit(488, 156, 12) + hit(396, 226, 12) + hit(484, 226, 12) + '</g>')
c.append(ctx(440, 392, 'las 4 paratiroides están pegadas atrás', 'middle'))
c.append('<g id="anat-labels"></g>')
SV['tiro'] = ('0 0 560 400', 'Tiroides vista de frente (laringe, lóbulos derecho e izquierdo, istmo y tráquea) y vista de atrás con las cuatro glándulas paratiroides', ''.join(c))
P['tiro'] = {
 'laringe': {'n': 'Laringe', 'd': 'Referencia: la tiroides está debajo de la laringe.', 'a': [210, 70], 'l': [246, 44]},
 'lobder': {'n': 'Lóbulo derecho', 'd': 'Uno de los dos lóbulos de la tiroides (la "mariposa"). Produce T4, T3 y calcitonina.', 'a': [140, 188], 'l': [4, 136]},
 'lobizq': {'n': 'Lóbulo izquierdo', 'd': 'El otro lóbulo de la tiroides. Recuerda: el lado derecho del paciente queda a tu izquierda.', 'a': [242, 170], 'l': [246, 96]},
 'istmo': {'n': 'Istmo', 'd': 'Puente de tejido que une los dos lóbulos por delante de la tráquea (dato de anatomía: no está en el PPT).', 'a': [190, 215], 'l': [4, 300]},
 'traquea': {'n': 'Tráquea', 'd': 'La tiroides está en la parte anterior del cuello, rodeando la tráquea.', 'a': [190, 330], 'l': [228, 330]},
 'paratiroides': {'n': 'Paratiroides', 'd': 'Generalmente 4 glándulas pequeñas adheridas a la parte posterior de la tiroides. Producen paratohormona (PTH): regula el calcio en sangre y orina.', 'a': [488, 156], 'l': [434, 266]},
}

# ---------------------------------------------------------------- D. suprarrenales
d = []
d.append('<defs>' + filt('s') + rg('sKi', '#F6D3CF', '#C9746B') + rg('sCo', '#FFE9B8', '#E6A93C') + rg('sMe', '#E9A59A', '#A8483F') + rg('sGl', '#FFE6BF', '#E99A45')
         + '<marker id="sAr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#8A8381"/></marker></defs>')
# vasos (contexto)
d.append('<path d="M40,40 L40,380" stroke="#E9C6C9" stroke-width="16" stroke-linecap="round"/><path d="M66,40 L66,380" stroke="#C9D7EC" stroke-width="16" stroke-linecap="round"/>' + ctx(14, 396, 'arteria aorta y vena cava (referencia)'))
d.append('<path d="M66,240 L118,240" stroke="#C9D7EC" stroke-width="10"/><path d="M40,252 L118,252" stroke="#E9C6C9" stroke-width="9"/>')
d.append('<g class="part" data-part="rinon" filter="url(#sSh)"><path d="M150,140 C200,110 260,140 262,220 C264,300 214,340 168,318 C140,304 146,272 132,252 C118,236 118,214 132,200 C146,186 120,162 150,140 Z" fill="url(#sKi)" stroke="#9E4E47" stroke-width="1.8" filter="url(#sTx)"/>'
         '<path d="M140,246 C170,236 196,250 214,300" stroke="#F7D8D2" stroke-width="5" fill="none"/></g>')
d.append(ctx(150, 372, 'uréter →', 'start'))
d.append('<path d="M172,316 C176,340 180,356 184,380" stroke="#E3C4BF" stroke-width="6" fill="none"/>')
d.append('<g class="part" data-part="glandula" filter="url(#sSh)"><path d="M150,132 C160,96 196,66 226,72 C252,78 262,108 252,136 C230,118 186,118 150,132 Z" fill="url(#sGl)" stroke="#B0651F" stroke-width="1.8" filter="url(#sTx)"/></g>')
# lupa
d.append('<circle cx="226" cy="100" r="40" fill="none" stroke="#B9AFC5" stroke-width="1.5" stroke-dasharray="5 4"/>')
d.append('<path d="M262,86 L340,60" stroke="#B9AFC5" stroke-width="1.4" stroke-dasharray="5 4"/><path d="M262,120 L340,330" stroke="#B9AFC5" stroke-width="1.4" stroke-dasharray="5 4"/>')
d.append(f'<text x="448" y="28" text-anchor="middle" font-size="13" font-weight="800" fill="#837D93" {F}>Corte de la glándula</text>')
d.append('<g class="part" data-part="corteza" filter="url(#sSh)"><path d="M346,300 C330,210 380,92 450,74 C520,58 556,150 546,230 C538,300 470,340 420,338 C380,336 352,326 346,300 Z" fill="url(#sCo)" stroke="#B37A1C" stroke-width="2" filter="url(#sTx)"/>'
         + ''.join(f'<path d="M{448+120*math.cos(t):.1f},{206+120*math.sin(t):.1f} L{448+70*math.cos(t):.1f},{206+70*math.sin(t):.1f}" stroke="#EBC06A" stroke-width="1.4"/>' for t in [i * 0.42 for i in range(15)])
         + '</g>')
d.append('<g class="part" data-part="medula" filter="url(#sSh)"><path d="M396,250 C388,200 420,150 456,146 C496,142 508,200 496,240 C486,276 456,290 432,286 C412,282 400,270 396,250 Z" fill="url(#sMe)" stroke="#7E2E28" stroke-width="1.8" filter="url(#sTx)"/>'
         + ''.join(f'<circle cx="{x}" cy="{y}" r="3" fill="#F6C9C2" opacity=".85"/>' for x, y in ((430, 210), (452, 186), (470, 228), (440, 252), (462, 262), (418, 236))) + '</g>')
d.append('<g id="anat-labels"></g>')
SV['supra'] = ('0 0 580 404', 'Glándula suprarrenal encima del riñón y su corte con la corteza (parte externa) y la médula (parte interna)', ''.join(d))
P['supra'] = {
 'glandula': {'n': 'Glándula suprarrenal', 'd': 'Se encuentra encima del riñón y adherida a él (por eso "supra-renal"). Tiene dos zonas: corteza y médula.', 'a': [206, 104], 'l': [96, 18]},
 'rinon': {'n': 'Riñón', 'd': 'Órgano del sistema urinario. La suprarrenal está encima de él. La aldosterona actúa sobre los riñones.', 'a': [214, 230], 'l': [180, 340]},
 'corteza': {'n': 'Corteza (externa)', 'd': 'Parte externa y endocrina. Produce dos hormonas: cortisol (grasas → energía) y aldosterona (sodio y potasio). Está regulada por la hipófisis (ACTH).', 'a': [372, 150], 'l': [296, 368]},
 'medula': {'n': 'Médula (interna)', 'd': 'Parte interna. Produce neurotransmisores: adrenalina (acción excitante, emergencia) y noradrenalina (acción relajante). Actúan en el sistema nervioso vegetativo.', 'a': [456, 220], 'l': [430, 300]},
}

# ---------------------------------------------------------------- E. páncreas e islote
e = []
e.append('<defs>' + filt('p') + rg('pPa', '#FFE7CF', '#EAA162') + rg('pDu', '#F7DCE2', '#D49AA8') + rg('pIs', '#FFFBF0', '#F4E3BE') + rg('pAl', '#EADFFF', '#9B7FE0') + rg('pBe', '#DDF6EC', '#55B392') + rg('pAc', '#FFE2D2', '#E79C78') + '</defs>')
# duodeno
e.append('<g class="part" data-part="duodeno" filter="url(#pSh)"><path d="M110,30 C40,40 30,150 70,196 C100,230 150,224 170,196" fill="none" stroke="#C98C9C" stroke-width="34" stroke-linecap="round"/><path d="M110,30 C40,40 30,150 70,196 C100,230 150,224 170,196" fill="none" stroke="url(#pDu)" stroke-width="30" stroke-linecap="round"/></g>')
e.append('<g class="part" data-part="pancreas" filter="url(#pSh)"><path d="M92,128 C100,98 140,98 176,108 C230,120 290,104 360,92 C420,82 488,68 520,82 C540,92 530,116 506,122 C450,136 392,140 340,150 C280,162 220,176 176,182 C136,186 98,166 92,128 Z" fill="url(#pPa)" stroke="#B36B2E" stroke-width="1.8" filter="url(#pTx)"/>'
         + ''.join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#FFF3E6" opacity=".8"/>' for x, y in ((140, 130), (200, 150), (260, 138), (330, 122), (400, 112), (460, 100), (170, 164), (300, 146))) + '</g>')
duct = 'M496,98 C430,112 360,118 300,130 C230,144 170,150 108,142'
e.append(f'<g class="part" data-part="conducto"><path class="hit" d="{duct}" stroke="transparent" stroke-width="14" fill="none"/><path d="{duct}" stroke="#E7C24A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="{duct}" stroke="#FFF1C2" stroke-width="1.6" fill="none"/></g>')
# islote pequeño en el páncreas + zoom
e.append('<circle cx="356" cy="114" r="7" fill="url(#pIs)" stroke="#B49A5E" stroke-width="1.4"/>')
e.append('<path d="M350,121 L262,214 M362,121 L452,214" stroke="#B9AFC5" stroke-width="1.4" stroke-dasharray="5 4"/>')
ZX, ZY, ZR = 356, 300, 98
e.append(f'<circle cx="{ZX}" cy="{ZY}" r="{ZR}" fill="#FFF8F2" stroke="#B9AFC5" stroke-width="1.6"/>')
# acinos alrededor
ac = ''
for i in range(10):
    t = i / 10 * 2 * math.pi + .2
    x, y = ZX + 74 * math.cos(t), ZY + 74 * math.sin(t)
    for j in range(6):
        u = j / 6 * 2 * math.pi
        ac += f'<circle cx="{x+9*math.cos(u):.1f}" cy="{y+9*math.sin(u):.1f}" r="6" fill="url(#pAc)" stroke="#C7805E" stroke-width=".8"/>'
    ac += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.4" fill="#FFF1E6"/>'
e.append(f'<g class="part" data-part="acinos">{ac}</g>')
cap = f'M{ZX-96},{ZY+26} C{ZX-40},{ZY+40} {ZX+20},{ZY-6} {ZX+96},{ZY+12}'
e.append(f'<g class="part" data-part="capilar"><path class="hit" d="{cap}" stroke="transparent" stroke-width="10" fill="none"/><path d="{cap}" stroke="#D0465A" stroke-width="6" fill="none" opacity=".8"/>'
         + ''.join(f'<circle r="2.6" fill="#7B5CC4"><animateMotion dur="3s" begin="{k}s" repeatCount="indefinite" path="{cap}"/></circle>' for k in (0, 1, 2)) + '</g>')
e.append(f'<g class="part" data-part="islote"><ellipse cx="{ZX}" cy="{ZY}" rx="54" ry="46" fill="url(#pIs)" stroke="#B49A5E" stroke-width="1.6"/></g>')
cells_b, cells_a = '', ''
BC = []
import random
random.seed(4)
for i in range(26):
    t = random.random() * 2 * math.pi
    rr = math.sqrt(random.random())
    x, y = ZX + 34 * rr * math.cos(t), ZY + 28 * rr * math.sin(t)
    BC.append((x, y))
    cells_b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.4" fill="url(#pBe)" stroke="#2F8A6C" stroke-width=".8"/>'
for i in range(11):
    t = i / 11 * 2 * math.pi
    x, y = ZX + 46 * math.cos(t), ZY + 38 * math.sin(t)
    cells_a += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5.6" fill="url(#pAl)" stroke="#5F45AA" stroke-width=".8"/>'
bx, by = min(BC, key=lambda c: (c[0]-352)**2 + (c[1]-292)**2)
e.append(f'<g class="part" data-part="beta">{cells_b}</g>')
e.append(f'<g class="part" data-part="alfa">{cells_a}</g>')
e.append(ctx(ZX, ZY + ZR + 18, 'islote de Langerhans (aumentado)', 'middle'))
e.append('<g id="anat-labels"></g>')
SV['panc'] = ('0 0 640 420', 'Páncreas junto al duodeno con su conducto y un islote de Langerhans aumentado: células alfa, células beta, acinos y capilar', ''.join(e))
P['panc'] = {
 'pancreas': {'n': 'Páncreas', 'd': 'Glándula mixta: endocrina (islotes de Langerhans → insulina y glucagón) y exocrina (jugo pancreático para la digestión).', 'a': [470, 119], 'l': [466, 30]},
 'duodeno': {'n': 'Duodeno', 'd': 'Primera parte del intestino delgado. Allí llega el jugo pancreático (función exocrina). Referencia para ubicar el páncreas.', 'a': [52, 120], 'l': [4, 236]},
 'conducto': {'n': 'Conducto pancreático', 'd': 'Lleva el jugo pancreático al duodeno: es la parte EXOCRINA (por conducto). Las hormonas, en cambio, salen a la sangre.', 'a': [240, 140], 'l': [176, 22]},
 'islote': {'n': 'Islote de Langerhans', 'd': 'Grupo de células endocrinas del páncreas. Produce insulina y glucagón y los vierte a la sangre.', 'a': [384, 274], 'l': [452, 196]},
 'alfa': {'n': 'Células alfa (glucagón)', 'd': 'Producen glucagón: degrada el glucógeno del hígado y libera glucosa a la sangre (sube el azúcar).', 'a': [402, 300], 'l': [452, 300]},
 'beta': {'n': 'Células beta (insulina)', 'd': 'Producen insulina: mete la glucosa a los tejidos, sobre todo músculos (baja el azúcar). Si no hay suficiente insulina → diabetes.', 'a': [round(bx), round(by)], 'l': [452, 340]},
 'acinos': {'n': 'Acinos (exocrino)', 'd': 'Racimos de células que fabrican el jugo pancreático (parte exocrina). No son parte del sistema endocrino.', 'a': [364, 374], 'l': [96, 380]},
 'capilar': {'n': 'Capilar sanguíneo', 'd': 'Las hormonas del islote pasan a la sangre por los capilares (por eso es endocrino: sin conductos).', 'a': [280, 318], 'l': [96, 296]},
}

for k, (vb, lab, body) in SV.items():
    with open(os.path.join(OUT, f'anat_{k}.svg'), 'w') as f:
        f.write(f'<svg viewBox="{vb}" role="img" aria-label="{lab}">{body}</svg>')
with open(os.path.join(OUT, 'anat_P.json'), 'w') as f:
    json.dump(P, f, ensure_ascii=False)
print('ok', list(SV))
