"""Genera los procesos animados (makeProc) del sistema endocrino.
Salida: proc_<id>.svg y proc_C.json (configuración steps/parts/order)."""
import json, math, os
OUT = os.path.dirname(os.path.abspath(__file__))
FF = 'font-family="Figtree,sans-serif"'
INK, MUT, GOLD = '#3F3A4F', '#837D93', '#C9A227'

def rg(i, a, b):
    return f'<radialGradient id="{i}" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></radialGradient>'

def defs(p, extra=''):
    return ('<defs>' + rg(p + 'Hy', '#FCE4EC', '#EC9DB4') + rg(p + 'Ad', '#FBC9C6', '#D9625E') + rg(p + 'Ne', '#FFF3C4', '#EAC24A')
            + rg(p + 'Th', '#E9DEFF', '#9476DC') + rg(p + 'Pa', '#FFF2C6', '#E3B33C') + rg(p + 'Be', '#DDF6EC', '#55B392') + rg(p + 'Al', '#EADFFF', '#9B7FE0')
            + rg(p + 'Li', '#F2C3AE', '#B5664A') + rg(p + 'Mu', '#F8C6C3', '#D4706B') + rg(p + 'Bo', '#FFFDF6', '#E6DCC4') + rg(p + 'Ki', '#F6D3CF', '#C9746B')
            + rg(p + 'Sk', '#FBEDE4', '#EBC7B2') + rg(p + 'Bl', '#FDE3E6', '#F2AFB8') + rg(p + 'Ey', '#FFFFFF', '#E7E2F0')
            + f'<marker id="{p}Ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#7B5CC4"/></marker>'
            + f'<marker id="{p}ArR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#D0665E"/></marker>'
            + f'<marker id="{p}ArG" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#3E9A72"/></marker>'
            + extra + '</defs>')

def lab(k, x, y, name, sub='', col=INK, size=12.5, anchor='middle'):
    s = (f'<g class="plab" data-lab="{k}"><text class="nm" x="{x}" y="{y}" text-anchor="{anchor}" {FF} font-size="{size}" font-weight="800" fill="{col}">{name}</text>'
         f'<text class="q" x="{x}" y="{y}" text-anchor="{anchor}" {FF} font-size="16" font-weight="800" fill="{GOLD}">?</text>')
    if sub:
        s += f'<text class="sub" x="{x}" y="{y+15}" text-anchor="{anchor}" {FF} font-size="11" fill="{MUT}">{sub}</text>'
    return s + '</g>'

def arrow(d, p, col='', w=3, dash=''):
    m = {'': 'Ar', 'r': 'ArR', 'g': 'ArG'}[col]
    c = {'': '#7B5CC4', 'r': '#D0665E', 'g': '#3E9A72'}[col]
    da = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<path d="{d}" stroke="{c}" stroke-width="{w}" fill="none" stroke-linecap="round"{da} marker-end="url(#{p}{m})"/>'

def flow(d, p, col='#7B5CC4', n=3, dur=2.4, r=3.2):
    return ''.join(f'<circle r="{r}" fill="{col}"><animateMotion dur="{dur}s" begin="{i*dur/n:.2f}s" repeatCount="indefinite" path="{d}"/></circle>' for i in range(n))

def part(k, inner):
    return f'<g class="part" data-part="{k}">{inner}</g>'

def step(i, inner):
    return f'<g class="pstep" data-step="{i}">{inner}</g>'

def badge(x, y, txt, fill='#7B5CC4', w=None):
    w = w or (len(txt) * 8.4 + 18)
    return f'<rect x="{x-w/2}" y="{y-13}" width="{w}" height="26" rx="13" fill="{fill}"/><text x="{x}" y="{y+4.5}" text-anchor="middle" {FF} font-size="12.5" font-weight="800" fill="#fff">{txt}</text>'

# ---------- íconos ----------
def hypo(p, x, y, s=1):
    return f'<path transform="translate({x},{y}) scale({s})" d="M-46,-4 C-40,-30 36,-32 46,-8 C52,8 36,22 10,24 L-12,24 C-36,22 -52,10 -46,-4 Z" fill="url(#{p}Hy)" stroke="#C2577A" stroke-width="1.8"/>'

def pit(p, x, y):
    return (f'<path d="M{x-4},{y-34} L{x+6},{y-34} L{x+6},{y-14} L{x-4},{y-14} Z" fill="#F6D8E2"/>'
            f'<ellipse cx="{x-16}" cy="{y}" rx="24" ry="20" fill="url(#{p}Ad)" stroke="#A9403D" stroke-width="1.6"/>'
            f'<ellipse cx="{x+20}" cy="{y+2}" rx="17" ry="17" fill="url(#{p}Ne)" stroke="#B08A1C" stroke-width="1.6"/>')

def adeno(p, x, y, rx=30, ry=24):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="url(#{p}Ad)" stroke="#A9403D" stroke-width="1.8"/><circle cx="{x-8}" cy="{y-6}" r="3" fill="#FFE2E0"/><circle cx="{x+9}" cy="{y+5}" r="3" fill="#FFE2E0"/>'

def neuro(p, x, y, r=22):
    return f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r}" fill="url(#{p}Ne)" stroke="#B08A1C" stroke-width="1.8"/>'

def thyroid(p, x, y, s=1):
    return (f'<g transform="translate({x},{y}) scale({s})"><path d="M0,10 C-6,-12 -30,-30 -38,-16 C-46,0 -40,30 -20,32 C-10,33 -4,26 0,26 C4,26 10,33 20,32 C40,30 46,0 38,-16 C30,-30 6,-12 0,10 Z" fill="url(#{p}Th)" stroke="#5F45AA" stroke-width="1.8"/>'
            '<path d="M0,10 L0,26" stroke="#5F45AA" stroke-width="1" opacity=".5"/></g>')

def vessel(p, x, y, w, h, n, col='#7B5CC4', seed=1):
    import random
    rnd = random.Random(seed)
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="url(#{p}Bl)" stroke="#D88B97" stroke-width="1.6"/>'
    for i in range(n):
        s += f'<circle cx="{x+14+rnd.random()*(w-28):.1f}" cy="{y+10+rnd.random()*(h-20):.1f}" r="4" fill="{col}" stroke="#fff" stroke-width="1"/>'
    return s

def hexa(x, y, r=6, fill='#E3B33C'):
    pts = ' '.join(f'{x+r*math.cos(math.pi/3*i+math.pi/6):.1f},{y+r*math.sin(math.pi/3*i+math.pi/6):.1f}' for i in range(6))
    return f'<polygon points="{pts}" fill="{fill}" stroke="#fff" stroke-width="1"/>'

def drop(p, x, y, n, seed=2, s=1):
    import random
    rnd = random.Random(seed)
    g = f'<path transform="translate({x},{y}) scale({s})" d="M0,-40 C14,-20 30,-6 30,12 C30,30 16,40 0,40 C-16,40 -30,30 -30,12 C-30,-6 -14,-20 0,-40 Z" fill="url(#{p}Bl)" stroke="#D0465A" stroke-width="1.8"/>'
    for i in range(n):
        g += hexa(x + (rnd.random() - .5) * 34 * s, y + (rnd.random() * 46 - 14) * s, 4.6)
    return g

def cell(p, x, y, kind, r=24):
    gid = {'beta': 'Be', 'alfa': 'Al'}[kind]
    st = {'beta': '#2F8A6C', 'alfa': '#5F45AA'}[kind]
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#{p}{gid})" stroke="{st}" stroke-width="1.8"/><circle cx="{x-4}" cy="{y-3}" r="{r*.36}" fill="{st}" opacity=".55"/>'

def muscle(p, x, y):
    return (f'<path d="M{x-44},{y} C{x-30},{y-30} {x+30},{y-30} {x+44},{y} C{x+30},{y+30} {x-30},{y+30} {x-44},{y} Z" fill="url(#{p}Mu)" stroke="#A9403D" stroke-width="1.8"/>'
            + ''.join(f'<path d="M{x-36},{y+o} C{x-14},{y+o-6} {x+14},{y+o-6} {x+36},{y+o}" stroke="#F3B1AC" stroke-width="1.4" fill="none"/>' for o in (-10, 0, 10)))

def liver(p, x, y):
    return f'<path d="M{x-52},{y-6} C{x-44},{y-30} {x+10},{y-34} {x+46},{y-22} C{x+60},{y-16} {x+50},{y+4} {x+30},{y+12} C{x+4},{y+24} {x-30},{y+28} {x-46},{y+14} C{x-54},{y+8} {x-56},{y+2} {x-52},{y-6} Z" fill="url(#{p}Li)" stroke="#7E3B26" stroke-width="1.8"/>'

def bone(p, x, y, s=1):
    return (f'<g transform="translate({x},{y}) scale({s})"><path d="M-40,-6 L40,-6 L40,6 L-40,6 Z" fill="url(#{p}Bo)" stroke="#B9A77E" stroke-width="1.6"/>'
            + ''.join(f'<circle cx="{cx}" cy="{cy}" r="10" fill="url(#{p}Bo)" stroke="#B9A77E" stroke-width="1.6"/>' for cx, cy in ((-44, -8), (-44, 8), (44, -8), (44, 8)))
            + '<path d="M-40,-4.5 L40,-4.5 L40,4.5 L-40,4.5 Z" fill="#FFFDF6"/></g>')

def kidney(p, x, y, s=1):
    return f'<path transform="translate({x},{y}) scale({s})" d="M-6,-30 C16,-34 30,-14 28,6 C26,28 10,36 -6,30 C-16,26 -12,14 -20,8 C-28,2 -26,-10 -18,-14 C-10,-18 -24,-26 -6,-30 Z" fill="url(#{p}Ki)" stroke="#9E4E47" stroke-width="1.8"/>'

def eye(p, x, y):
    return (f'<path d="M{x-40},{y} C{x-20},{y-26} {x+20},{y-26} {x+40},{y} C{x+20},{y+26} {x-20},{y+26} {x-40},{y} Z" fill="url(#{p}Ey)" stroke="#837D93" stroke-width="1.8"/>'
            f'<circle cx="{x}" cy="{y}" r="14" fill="#7FB6C8" stroke="#3F7E92" stroke-width="1.4"/><circle cx="{x}" cy="{y}" r="6" fill="#23303A"/><circle cx="{x+4}" cy="{y-4}" r="2.4" fill="#fff"/>')

def sun(x, y, r=18):
    rays = ''.join(f'<path d="M{x+(r+5)*math.cos(t):.1f},{y+(r+5)*math.sin(t):.1f} L{x+(r+13)*math.cos(t):.1f},{y+(r+13)*math.sin(t):.1f}" stroke="#E6A93C" stroke-width="3" stroke-linecap="round"/>' for t in [i * math.pi / 4 for i in range(8)])
    return f'<g>{rays}<circle cx="{x}" cy="{y}" r="{r}" fill="#FFD66B" stroke="#E6A93C" stroke-width="2"/></g>'

def moon(x, y, r=18):
    return f'<path d="M{x+6},{y-r} A{r},{r} 0 1 0 {x+6},{y+r} A{r*.75},{r*.75} 0 1 1 {x+6},{y-r} Z" fill="#B9A6EE" stroke="#7B5CC4" stroke-width="1.8"/>'

def pineal(p, x, y, s=1):
    return f'<path transform="translate({x},{y}) scale({s})" d="M0,-24 C12,-10 18,6 14,16 C10,24 -10,24 -14,16 C-18,6 -12,-10 0,-24 Z" fill="url(#{p}Pa)" stroke="#A9811A" stroke-width="1.8"/>' + ''.join(f'<path d="M{x-8*s},{y+o*s} q{8*s},4 {16*s},0" stroke="#D4A732" stroke-width="1.2" fill="none"/>' for o in (-6, 2, 10))

def para(p, x, y):
    return thyroid(p, x, y, .82).replace('url(#' + p + 'Th)', 'url(#' + p + 'Th)" opacity=".45') + ''.join(f'<ellipse cx="{x+dx}" cy="{y+dy}" rx="8" ry="6.5" fill="url(#{p}Pa)" stroke="#A9811A" stroke-width="1.6"/>' for dx, dy in ((-24, -10), (24, -10), (-20, 16), (20, 16)))

def gauge(x, y, lvl, lab_):
    # termómetro de nivel (0..1)
    h = 74
    return (f'<rect x="{x-11}" y="{y-h/2}" width="22" height="{h}" rx="11" fill="#fff" stroke="{INK}" stroke-width="1.6"/>'
            f'<rect x="{x-6}" y="{y+h/2-6-(h-12)*lvl:.1f}" width="12" height="{(h-12)*lvl:.1f}" rx="6" fill="#7B5CC4"/>'
            f'<text x="{x+18}" y="{y+4}" {FF} font-size="11" font-weight="700" fill="{MUT}">{lab_}</text>')

def baby(p, x, y):
    return (f'<circle cx="{x}" cy="{y-18}" r="24" fill="url(#{p}Sk)" stroke="#C98F72" stroke-width="1.6"/>'
            f'<path d="M{x-26},{y+40} C{x-30},{y+4} {x+30},{y+4} {x+26},{y+40} Z" fill="#DCD0F6" stroke="#9B88D4" stroke-width="1.6"/>'
            f'<circle cx="{x-8}" cy="{y-20}" r="2.4" fill="{INK}"/><path d="M{x+4},{y-24} q4,3 8,0" stroke="{INK}" stroke-width="1.6" fill="none"/><circle cx="{x+10}" cy="{y-8}" r="4" fill="#E99A9A"/>')

def breast(p, x, y, milk=0):
    s = f'<path d="M{x-40},{y-40} C{x+30},{y-50} {x+52},{y+20} {x+16},{y+40} C{x-6},{y+50} {x-40},{y+36} {x-40},{y+20} Z" fill="url(#{p}Sk)" stroke="#C98F72" stroke-width="1.6"/>'
    for i in range(4):
        a = -0.9 + i * 0.5
        s += f'<path d="M{x+20},{y+12} C{x+2},{y+2} {x-10+math.cos(a)*10:.1f},{y-14+math.sin(a)*18:.1f} {x-24+math.cos(a)*6:.1f},{y-16+math.sin(a)*26:.1f}" stroke="#E7A9B8" stroke-width="2" fill="none"/><circle cx="{x-24+math.cos(a)*6:.1f}" cy="{y-16+math.sin(a)*26:.1f}" r="5" fill="#F5C6D2" stroke="#D98AA0"/>'
    s += f'<circle cx="{x+24}" cy="{y+14}" r="5" fill="#D98A8A"/>'
    return s

C = {}
SV = {}

# =============================================================== 1. retroalimentación (tiroides)
p = 'r'
s = [defs(p)]
s.append(f'<text x="470" y="22" text-anchor="middle" {FF} font-size="12" font-weight="700" fill="{MUT}">Ejemplo del PPT: ¿qué pasa si baja la hormona tiroidea?</text>')
s.append(step(0, part('bajo', vessel(p, 20, 196, 150, 56, 2, '#9476DC', 3) + gauge(196, 224, .18, '')) + lab('bajo', 96, 284, 'Hormona tiroidea baja', 'en la sangre')))
s.append(step(1, arrow('M96,192 C96,140 150,110 200,104', p, '', 2.4, '6 5')
              + f'<text x="40" y="150" {FF} font-size="11" font-weight="700" fill="{MUT}">detecta</text>'
              + part('hipot', hypo(p, 270, 100, 1.25)) + lab('hipot', 270, 150, 'Hipotálamo', 'detecta y secreta TRH')
              + part('trh', arrow('M330,112 C380,120 410,150 432,188', p) + flow('M330,112 C380,120 410,150 432,188', p, '#E07D98') + badge(392, 136, 'TRH', '#D86C86')) + lab('trh', 392, 176, '', '', INK)))
s.append(step(2, part('adeno', adeno(p, 470, 222, 38, 30)) + lab('adeno', 470, 276, 'Adenohipófisis', 'secreta TSH')
              + part('tsh', arrow('M512,222 L626,222', p) + flow('M512,222 L626,222', p, '#D0465A') + badge(568, 196, 'TSH', '#C84D61')) + lab('tsh', 568, 252, 'por la sangre', '', MUT, 11)))
s.append(step(3, part('tiro', thyroid(p, 680, 218, 1.15)) + lab('tiro', 680, 276, 'Tiroides', 'libera T3 y T4')
              + part('t3t4', arrow('M730,222 L780,222', p) + vessel(p, 790, 196, 140, 56, 9, '#9476DC', 5) + gauge(912, 160, .82, '')) + lab('t3t4', 860, 284, 'Suficiente T3/T4', 'en la sangre')))
s.append(step(4, part('freno', '<path d="M860,190 C860,60 520,40 330,70" stroke="#D0665E" stroke-width="3" fill="none" stroke-dasharray="8 6" marker-end="url(#rArR)"/>'
                       + '<circle cx="600" cy="60" r="16" fill="#FCEBE8" stroke="#D0665E" stroke-width="2"/><path d="M592,60 L608,60" stroke="#D0665E" stroke-width="3"/>')
              + lab('freno', 600, 98, 'Retroalimentación negativa', 'el hipotálamo detiene la TRH')))
SV['retro'] = ('0 0 940 310', 'Retroalimentación de la hormona tiroidea: niveles bajos, el hipotálamo secreta TRH, la adenohipófisis secreta TSH, la tiroides libera T3 y T4 y, cuando hay suficiente, el hipotálamo detiene la TRH', ''.join(s))
C['retro'] = {'steps': [
 ['Baja la hormona tiroidea', 'Digamos que los niveles de <b>hormona tiroidea</b> (T3 y T4) en la sangre <b>han disminuido</b>. <span class="chip c-ppt">PPT</span>'],
 ['El hipotálamo detecta y secreta TRH', 'El <b>hipotálamo</b> detecta los niveles bajos y secreta la <b>hormona liberadora de tirotropina (TRH)</b> hacia la adenohipófisis (por el <b>sistema porta hipofisario</b>).'],
 ['La adenohipófisis secreta TSH', 'La <b>adenohipófisis</b> (lóbulo anterior de la pituitaria) secreta la <b>hormona estimulante de la tiroides (TSH)</b>, que viaja por la <b>corriente sanguínea</b> hasta la tiroides.'],
 ['La tiroides libera hormona tiroidea', 'La TSH estimula a la <b>tiroides</b> para liberar <b>T4 (tiroxina)</b> y <b>T3</b> a la sangre.'],
 ['Retroalimentación negativa', 'Cuando hay <b>suficiente</b> hormona tiroidea, el hipotálamo lo detecta y <b>detiene la secreción de TRH</b>, hasta que los niveles vuelvan a bajar. Así el sistema <b>se controla a sí mismo</b>.']],
 'parts': {'bajo': ['Hormona tiroidea baja', 'Pocos niveles de T3/T4 en la sangre: eso dispara el proceso.', 0],
           'hipot': ['Hipotálamo', 'Detecta los niveles bajos y secreta TRH.', 1],
           'trh': ['TRH', 'Hormona liberadora de tirotropina: va del hipotálamo a la adenohipófisis.', 1],
           'adeno': ['Adenohipófisis', 'Lóbulo anterior de la hipófisis: recibe la TRH y secreta TSH.', 2],
           'tsh': ['TSH (tirotropina)', 'Hormona estimulante de la tiroides: viaja por la sangre hasta la tiroides.', 2],
           'tiro': ['Tiroides', 'Recibe la TSH y libera T4 y T3.', 3],
           't3t4': ['Suficiente T3/T4', 'Ya hay suficiente hormona tiroidea en la sangre.', 3],
           'freno': ['Retroalimentación negativa', 'El hipotálamo detecta que hay suficiente y detiene la TRH.', 4]},
 'order': ['bajo', 'hipot', 'trh', 'adeno', 'tsh', 'tiro', 't3t4', 'freno']}

# =============================================================== 2. glucosa (insulina y glucagón)
p = 'g'
s = [defs(p)]
s.append(f'<text x="20" y="22" {FF} font-size="12" font-weight="800" fill="#3E9A72">Después de comer</text><text x="20" y="190" {FF} font-size="12" font-weight="800" fill="#7B5CC4">En ayunas o con ejercicio</text>')
apple = (f'<circle cx="70" cy="92" r="26" fill="#F08C8C" stroke="#B94D4D" stroke-width="1.8"/><path d="M70,66 q4,-12 12,-14" stroke="#7A5230" stroke-width="3" fill="none"/>'
         f'<path d="M74,62 q14,-10 22,0 q-12,8 -22,0" fill="#7CC59B"/><circle cx="60" cy="82" r="6" fill="#fff" opacity=".5"/>')
s.append(step(0, part('comida', apple) + lab('comida', 70, 140, 'Comes', 'entra glucosa')
              + arrow('M102,92 L146,92', p, 'g') + part('alta', drop(p, 196, 86, 12, 5) + gauge(244, 92, .85, '')) + lab('alta', 200, 150, 'Glucosa alta', 'en la sangre')))
s.append(step(1, arrow('M270,92 L318,92', p, 'g') + part('beta', cell(p, 360, 92, 'beta', 28)) + lab('beta', 360, 140, 'Células beta', 'islotes de Langerhans')
              + part('insulina', arrow('M396,92 L520,92', p, 'g') + flow('M396,92 L520,92', p, '#3E9A72') + badge(458, 66, 'INSULINA', '#3E9A72')) + lab('insulina', 458, 116, '', '')))
s.append(step(2, part('musculo', muscle(p, 600, 92) + ''.join(hexa(570 + i * 14, 92 + (i % 2) * 6, 4.2) for i in range(5))) + lab('musculo', 600, 140, 'Músculos', 'absorben la glucosa')
              + arrow('M652,100 C720,120 760,150 800,180', p, 'g')))
s.append(step(3, f'<path d="M30,262 a22,22 0 1 0 44,0 a22,22 0 1 0 -44,0" fill="#fff" stroke="{INK}" stroke-width="1.8"/><path d="M52,262 L52,248 M52,262 L62,268" stroke="{INK}" stroke-width="2.4" stroke-linecap="round"/>'
              + arrow('M82,262 L146,262', p) + part('baja', drop(p, 196, 256, 2, 7) + gauge(244, 262, .15, '')) + lab('baja', 200, 320, 'Glucosa baja', 'ayuno o ejercicio')))
s.append(step(4, arrow('M270,262 L318,262', p) + part('alfa', cell(p, 360, 262, 'alfa', 28)) + lab('alfa', 360, 310, 'Células alfa', 'islotes de Langerhans')
              + part('glucagon', arrow('M396,262 L520,262', p) + flow('M396,262 L520,262', p, '#7B5CC4') + badge(458, 236, 'GLUCAGÓN', '#7B5CC4')) + lab('glucagon', 458, 286, '', '')))
s.append(step(5, part('higado', liver(p, 604, 262) + ''.join(hexa(650 + i * 14, 244 - i * 8, 4.2) for i in range(3))) + lab('higado', 600, 310, 'Hígado', 'glucógeno → glucosa')
              + arrow('M660,250 C720,236 760,220 800,200', p)))
s.append(step(6, part('normal', f'<circle cx="852" cy="190" r="44" fill="#E3F5EC" stroke="#3E9A72" stroke-width="2.2"/>' + ''.join(hexa(830 + (i % 3) * 22, 176 + (i // 3) * 22, 5) for i in range(6))
                         + gauge(912, 190, .5, '')) + lab('normal', 852, 254, 'Glucosa normal', 'equilibrio')))
SV['gluc'] = ('0 0 940 346', 'Regulación de la glucosa: al comer sube la glucosa, las células beta liberan insulina y los músculos absorben la glucosa; en ayunas baja la glucosa, las células alfa liberan glucagón y el hígado libera glucosa', ''.join(s))
C['gluc'] = {'steps': [
 ['Comes: sube la glucosa', 'Después de comer, la <b>glucosa</b> (azúcar) de la sangre <b>sube</b>.'],
 ['Células beta → insulina', 'Las <b>células beta</b> de los <b>islotes de Langerhans</b> del páncreas liberan <b>insulina</b> a la sangre.'],
 ['La insulina mete la glucosa a los músculos', 'La insulina facilita la <b>absorción de la glucosa</b> por los tejidos, sobre todo los <b>músculos</b>, donde se usa como energía. Así <b>baja</b> la glucosa en la sangre.'],
 ['Ayuno: baja la glucosa', 'Si no comes (o haces ejercicio), la glucosa de la sangre <b>baja</b>.'],
 ['Células alfa → glucagón', 'Las <b>células alfa</b> liberan <b>glucagón</b>.'],
 ['El hígado libera glucosa', 'El glucagón actúa en el <b>hígado</b>: favorece la <b>degradación del glucógeno</b> almacenado y libera <b>glucosa</b> a la sangre para los órganos que la necesiten.'],
 ['Equilibrio', 'Insulina y glucagón son <b>antagónicos</b> (una hace lo contrario de la otra) y mantienen la glucosa en equilibrio. Si falta insulina, la glucosa se acumula: <b>diabetes</b>.']],
 'parts': {'comida': ['Comer', 'Al comer entra glucosa a la sangre.', 0],
           'alta': ['Glucosa alta', 'Mucha glucosa en la sangre (después de comer).', 0],
           'beta': ['Células beta', 'Producen insulina.', 1],
           'insulina': ['Insulina', 'Baja la glucosa: facilita que entre a los músculos.', 1],
           'musculo': ['Músculos', 'Órgano diana de la insulina: absorben la glucosa y la usan como energía.', 2],
           'baja': ['Glucosa baja', 'Poca glucosa en la sangre (ayuno o ejercicio).', 3],
           'alfa': ['Células alfa', 'Producen glucagón.', 4],
           'glucagon': ['Glucagón', 'Sube la glucosa: actúa sobre el hígado.', 4],
           'higado': ['Hígado', 'Órgano diana del glucagón: degrada el glucógeno y libera glucosa.', 5],
           'normal': ['Glucosa normal', 'Equilibrio gracias a dos hormonas antagónicas.', 6]},
 'order': ['comida', 'alta', 'beta', 'insulina', 'musculo', 'baja', 'alfa', 'glucagon', 'higado', 'normal']}

# =============================================================== 3. melatonina
p = 'm'
s = [defs(p)]
s.append(step(0, part('luz', '<rect x="16" y="56" width="104" height="120" rx="16" fill="#2F2A4A" opacity=".9"/>' + moon(52, 96, 16) + ''.join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="#fff"/>' for x, y in ((90, 76), (100, 120), (80, 150), (34, 150))))
              + lab('luz', 68, 200, 'Poca luz', 'de noche')
              + arrow('M122,116 L170,116', p) + part('ojo', eye(p, 220, 116)) + lab('ojo', 220, 160, 'Retina (ojo)', 'capta la luz')))
s.append(step(1, arrow('M262,116 L318,116', p) + flow('M262,116 L318,116', p, '#7B5CC4', 2, 1.6) + part('hipot', hypo(p, 380, 116, 1.15)) + lab('hipot', 380, 162, 'Hipotálamo', 'recibe la información')))
s.append(step(2, arrow('M440,116 L496,116', p) + part('pineal', pineal(p, 540, 116, 1.4)) + lab('pineal', 540, 168, 'Glándula pineal', '(epífisis)')))
s.append(step(3, part('mel', arrow('M584,116 L700,116', p) + ''.join(hexa(612 + i * 22, 100 + (i % 2) * 30, 6, '#9B7FE0') for i in range(4)) + flow('M584,116 L700,116', p, '#9B7FE0', 3, 2)) + lab('mel', 654, 168, '+ Melatonina', 'menos luz → más')))
bed = (f'<rect x="716" y="104" width="190" height="34" rx="8" fill="#EDE4FC" stroke="#9B88D4" stroke-width="1.6"/><rect x="722" y="88" width="44" height="22" rx="10" fill="#fff" stroke="#9B88D4" stroke-width="1.4"/>'
       f'<circle cx="752" cy="92" r="14" fill="url(#{p}Sk)" stroke="#C98F72" stroke-width="1.4"/><path d="M744,92 q4,3 8,0" stroke="{INK}" stroke-width="1.6" fill="none"/>'
       f'<text x="800" y="80" {FF} font-size="20" font-weight="800" fill="#7B5CC4">z<tspan font-size="15" dy="-8">z</tspan><tspan font-size="11" dy="-6">z</tspan><animate attributeName="opacity" values=".3;1;.3" dur="2.4s" repeatCount="indefinite"/></text>')
s.append(step(4, part('sueno', bed) + lab('sueno', 810, 168, 'Sueño', 'ciclo sueño-vigilia')))
s.append(step(5, '<path d="M16,226 L924,226" stroke="#E7E2F0" stroke-width="1.4" stroke-dasharray="5 5"/>'
              + part('vigilia', sun(68, 282, 18)) + lab('vigilia', 68, 326, 'Mucha luz', 'de día')
              + arrow('M110,282 L520,282', p, 'r', 2.4, '6 5')
              + f'<text x="316" y="270" text-anchor="middle" {FF} font-size="12" font-weight="700" fill="{MUT}">retina → hipotálamo → pineal</text>'
              + part('poca', pineal(p, 560, 282, 1.1) + hexa(600, 282, 5, '#CBBDF1')) + lab('poca', 580, 326, '− Melatonina', 'baja la producción')
              + arrow('M620,282 L700,282', p, 'r', 2.4) + part('despierto', f'<circle cx="760" cy="282" r="26" fill="url(#{p}Sk)" stroke="#C98F72" stroke-width="1.6"/><circle cx="751" cy="278" r="3" fill="{INK}"/><circle cx="769" cy="278" r="3" fill="{INK}"/><path d="M750,292 q10,8 20,0" stroke="{INK}" stroke-width="2" fill="none"/>')
              + lab('despierto', 760, 326, 'Despierto', 'vigilia (diurnos)')))
SV['mel'] = ('0 0 940 344', 'Melatonina y ritmo circadiano: con poca luz la retina avisa al hipotálamo, este a la glándula pineal, que produce más melatonina e induce el sueño; con mucha luz produce menos y estamos despiertos', ''.join(s))
C['mel'] = {'steps': [
 ['La luz llega a la retina', 'La melatonina se regula según la <b>cantidad de luz</b> que llega a la <b>retina</b> del ojo. De noche llega <b>poca luz</b>.'],
 ['La retina avisa al hipotálamo', 'La retina envía esta información al <b>hipotálamo</b>.'],
 ['El hipotálamo avisa a la pineal', 'El hipotálamo transmite la información a la <b>glándula pineal (epífisis)</b>, la pequeña glándula en forma de cono del diencéfalo.'],
 ['Más melatonina', '<b>A menor cantidad de luz, mayor cantidad de melatonina</b>.'],
 ['Sueño', 'La melatonina <b>induce el sueño</b>: regula el <b>ciclo sueño-vigilia</b> y mantiene el <b>ritmo circadiano</b> (ciclo de unas <b>24 horas</b>).'],
 ['De día: menos melatonina', 'Con <b>mucha luz</b> la producción de melatonina <b>disminuye</b> y estamos despiertos: por eso los humanos somos principalmente <b>diurnos</b>. Quien trabaja de noche puede alterar este ritmo.']],
 'parts': {'luz': ['Poca luz', 'De noche llega poca luz a la retina.', 0],
           'ojo': ['Retina (ojo)', 'Capta la cantidad de luz y envía la información al hipotálamo.', 0],
           'hipot': ['Hipotálamo', 'Recibe la información de la retina y la pasa a la glándula pineal.', 1],
           'pineal': ['Glándula pineal (epífisis)', 'Glándula neuroendocrina en forma de cono: secreta melatonina.', 2],
           'mel': ['Más melatonina', 'A menor luz, más melatonina.', 3],
           'sueno': ['Sueño', 'La melatonina induce el sueño (ciclo sueño-vigilia).', 4],
           'vigilia': ['Mucha luz', 'De día llega mucha luz a la retina.', 5],
           'poca': ['Menos melatonina', 'Con más luz, la pineal produce menos melatonina.', 5],
           'despierto': ['Despierto (vigilia)', 'Sin mucha melatonina estamos despiertos: somos diurnos.', 5]},
 'order': ['luz', 'ojo', 'hipot', 'pineal', 'mel', 'sueno']}

# =============================================================== 4. calcio
p = 'c'
s = [defs(p)]
s.append(f'<text x="20" y="22" {FF} font-size="12" font-weight="800" fill="#D0665E">Si el calcio en sangre baja</text><text x="20" y="196" {FF} font-size="12" font-weight="800" fill="#7B5CC4">Si el calcio en sangre sube</text>')
def ca(x, y):
    return f'<circle cx="{x}" cy="{y}" r="7" fill="#F4F1E6" stroke="#B9A77E" stroke-width="1.4"/><text x="{x}" y="{y+3.5}" text-anchor="middle" {FF} font-size="7.5" font-weight="800" fill="#8A7A50">Ca</text>'
s.append(step(0, part('bajo', vessel(p, 18, 70, 120, 50, 0) + ca(56, 95) + gauge(158, 95, .15, '')) + lab('bajo', 78, 146, 'Calcio bajo', 'en la sangre')))
s.append(step(1, arrow('M178,95 L210,95', p, 'r') + part('para', para(p, 256, 92)) + lab('para', 256, 146, 'Paratiroides', '(detrás de la tiroides)')
              + part('pth', arrow('M302,95 L420,95', p, 'r') + flow('M302,95 L420,95', p, '#E3B33C') + badge(362, 70, 'PARATOHORMONA', '#C9A227', 132)) + lab('pth', 362, 120, '(PTH)', '', MUT, 11)))
s.append(step(2, part('hueso', bone(p, 494, 92) + ca(470, 66) + ca(504, 60)) + lab('hueso', 494, 146, 'Huesos', 'sueltan calcio')
              + part('rinon', kidney(p, 610, 94, 1.1) + ca(636, 70)) + lab('rinon', 610, 146, 'Riñones', 'calcio en orina')
              + arrow('M650,96 C730,104 770,140 800,166', p, 'r')))
s.append(step(3, part('alto', vessel(p, 18, 240, 120, 50, 0) + ''.join(ca(36 + i * 18, 255 + (i % 2) * 20) for i in range(6)) + gauge(158, 265, .88, '')) + lab('alto', 78, 316, 'Calcio alto', 'en la sangre')))
s.append(step(4, arrow('M178,265 L210,265', p) + part('tiro', thyroid(p, 256, 260, 1)) + lab('tiro', 256, 316, 'Tiroides', 'células que hacen calcitonina')
              + part('calcitonina', arrow('M302,265 L420,265', p) + flow('M302,265 L420,265', p, '#9476DC') + badge(362, 240, 'CALCITONINA', '#7B5CC4', 112)) + lab('calcitonina', 362, 290, 'antagonista de la PTH', '', MUT, 11)))
s.append(step(5, part('oseo', bone(p, 520, 262, 1.2) + ''.join(ca(480 + i * 20, 262) for i in range(5))) + lab('oseo', 520, 316, 'Tejido óseo', 'guarda el calcio')
              + arrow('M590,262 C700,250 760,220 800,200', p)))
s.append(step(6, part('normal', f'<circle cx="852" cy="184" r="42" fill="#E3F5EC" stroke="#3E9A72" stroke-width="2.2"/>' + ''.join(ca(834 + (i % 3) * 18, 172 + (i // 3) * 22) for i in range(6)) + gauge(912, 184, .5, ''))
              + lab('normal', 852, 246, 'Calcio normal', 'huesos y músculos sanos')))
SV['ca'] = ('0 0 940 340', 'Regulación del calcio: si baja, la paratiroides libera paratohormona que actúa en huesos y riñones; si sube, la tiroides libera calcitonina que lo lleva al tejido óseo', ''.join(s))
C['ca'] = {'steps': [
 ['Baja el calcio', 'La secreción de la paratiroides se regula según los <b>niveles de calcio en la sangre</b>. Aquí el calcio está <b>bajo</b>.'],
 ['Paratiroides → paratohormona', 'Las <b>paratiroides</b> (4 glándulas detrás de la tiroides) liberan <b>paratohormona (PTH o parathormona)</b>.'],
 ['Actúa en huesos y riñones', 'Sus órganos diana son los <b>riñones y los huesos</b>: regula el calcio en <b>sangre y en orina</b>. <i>(Dato extra: saca calcio de los huesos y evita perderlo por la orina, así sube el calcio en la sangre.)</i>'],
 ['Sube el calcio', 'Ahora hay <b>mucho calcio</b> en la sangre.'],
 ['Tiroides → calcitonina', 'La <b>tiroides</b> libera <b>calcitonina</b>, que es la <b>antagonista de la paratohormona</b> (hace lo contrario).'],
 ['El calcio va al tejido óseo', 'La calcitonina actúa sobre el <b>tejido óseo</b> y regula los niveles de calcio en sangre. <i>(Dato extra: ayuda a guardar el calcio en el hueso, así baja en la sangre.)</i>'],
 ['Equilibrio del calcio', 'El calcio es importante para la <b>formación y resistencia de los huesos</b> y para la <b>contracción muscular</b>. Tiroides y paratiroides están juntas en el cuello: un "seguro" para mantener el equilibrio.']],
 'parts': {'bajo': ['Calcio bajo', 'Poco calcio en la sangre.', 0],
           'para': ['Paratiroides', 'Detectan el calcio bajo y liberan paratohormona.', 1],
           'pth': ['Paratohormona (PTH)', 'Hormona de las paratiroides. Órganos diana: riñones y huesos.', 1],
           'hueso': ['Huesos', 'Órgano diana de la PTH (sueltan calcio a la sangre).', 2],
           'rinon': ['Riñones', 'Órgano diana de la PTH: calcio en la orina.', 2],
           'alto': ['Calcio alto', 'Mucho calcio en la sangre.', 3],
           'tiro': ['Tiroides', 'Libera calcitonina.', 4],
           'calcitonina': ['Calcitonina', 'Hormona de la tiroides, antagonista de la paratohormona. Órgano diana: tejido óseo.', 4],
           'oseo': ['Tejido óseo', 'Órgano diana de la calcitonina (guarda el calcio).', 5],
           'normal': ['Calcio normal', 'Equilibrio: huesos fuertes y músculos que se contraen bien.', 6]},
 'order': ['bajo', 'para', 'pth', 'hueso', 'alto', 'tiro', 'calcitonina', 'oseo', 'normal']}

# =============================================================== 5. lactancia
p = 'l'
s = [defs(p)]
s.append(step(0, part('bebe', baby(p, 70, 214) + breast(p, 150, 212)) + lab('bebe', 104, 286, 'El bebé succiona', 'estímulo en el pecho')))
s.append(step(1, arrow('M110,160 C120,110 160,80 214,76', p, '', 2.4, '6 5') + f'<text x="20" y="140" {FF} font-size="11" font-weight="700" fill="{MUT}">señal nerviosa</text>'
              + part('hipot', hypo(p, 290, 70, 1.25)) + lab('hipot', 290, 30, 'Hipotálamo', '')))
s.append(step(2, '<path d="M286,96 L286,136" stroke="#F6D8E2" stroke-width="10"/>' + part('adeno', adeno(p, 262, 160, 30, 24)) + lab('adeno', 212, 206, 'Adenohipófisis', '', INK, 11.5)
              + part('prl', arrow('M294,156 L470,128', p) + flow('M294,156 L470,128', p, '#D86C86') + badge(392, 120, 'PROLACTINA', '#D86C86')) + lab('prl', 392, 162, '', '')))
s.append(step(3, part('produce', breast(p, 540, 118) + ''.join(f'<circle cx="{500+i*14}" cy="{96+(i%2)*14}" r="5" fill="#FFFFFF" stroke="#D7C9B0"/>' for i in range(4))) + lab('produce', 540, 186, 'Produce la leche', 'glándula mamaria')))
s.append(step(4, part('neuro', neuro(p, 312, 166, 20)) + lab('neuro', 354, 212, 'Neurohipófisis', '', INK, 11.5)
              + part('oxi', arrow('M330,178 L470,262', p) + flow('M330,178 L470,262', p, '#E3B33C') + badge(408, 246, 'OXITOCINA', '#C9A227')) + lab('oxi', 408, 282, '', '')))
s.append(step(5, part('sale', breast(p, 540, 262) + ''.join(f'<path d="M570,{276+i*6} q{20+i*6},{-4+i*3} {34+i*8},{6+i*4}" stroke="#E9E2D4" stroke-width="3" fill="none" stroke-linecap="round"><animate attributeName="stroke-dasharray" values="0 60;40 60" dur="1.2s" begin="{i*0.3}s" repeatCount="indefinite"/></path>' for i in range(3)))
              + lab('sale', 548, 330, 'Sale la leche', 'eyección (contracción)')))
s.append(step(6, f'<rect x="700" y="116" width="226" height="142" rx="16" fill="#FCEBE8" stroke="#D0665E" stroke-width="1.6" stroke-dasharray="6 5"/>'
              + part('fin', baby(p, 760, 206).replace('fill="#E99A9A"', 'fill="none"') + f'<path d="M800,184 L900,184 M800,206 L880,206" stroke="#D0665E" stroke-width="3" stroke-linecap="round"/><path d="M872,226 l14,14 m0,-14 l-14,14" stroke="#D0665E" stroke-width="3"/>')
              + lab('fin', 813, 140, 'Deja de succionar', 'el cuerpo deja de producir leche', '#B44A43', 12)))
SV['lact'] = ('0 0 940 352', 'Lactancia: la succión del bebé avisa al hipotálamo; la adenohipófisis libera prolactina, que produce la leche, y la neurohipófisis libera oxitocina, que permite su salida', ''.join(s))
C['lact'] = {'steps': [
 ['El bebé succiona', 'Cuando el bebé <b>succiona el pecho</b>, se genera un estímulo.'],
 ['La señal llega al hipotálamo', 'El estímulo llega al <b>hipotálamo</b>, que controla a la hipófisis.'],
 ['Adenohipófisis → prolactina', 'La <b>adenohipófisis</b> libera <b>prolactina</b>, una hormona estimulante.'],
 ['La prolactina produce la leche', 'La prolactina <b>estimula la producción de leche</b> en las <b>glándulas mamarias</b>.'],
 ['Neurohipófisis → oxitocina', 'La <b>oxitocina</b> (fabricada en el hipotálamo) se almacena en la <b>neurohipófisis</b> y se libera en mayor cantidad durante el <b>amamantamiento</b>.'],
 ['La oxitocina hace salir la leche', '<b>Prolactina produce la leche y oxitocina permite su salida.</b> Trabajan en conjunto.'],
 ['Si deja de succionar…', 'Cuando el bebé deja de pegarse al pecho, <b>disminuye el estímulo</b> y, poco a poco, el cuerpo <b>deja de producir leche</b>.']],
 'parts': {'bebe': ['Succión del bebé', 'El estímulo que inicia todo.', 0],
           'hipot': ['Hipotálamo', 'Recibe la señal y ordena a la hipófisis.', 1],
           'adeno': ['Adenohipófisis', 'Lóbulo anterior: libera prolactina.', 2],
           'prl': ['Prolactina', 'Estimula la producción de leche materna.', 2],
           'produce': ['Producción de leche', 'En las glándulas mamarias, gracias a la prolactina.', 3],
           'neuro': ['Neurohipófisis', 'Lóbulo posterior: almacena y libera la oxitocina.', 4],
           'oxi': ['Oxitocina', 'Permite la salida de la leche (y las contracciones del útero).', 4],
           'sale': ['Salida de la leche', 'Gracias a la oxitocina.', 5],
           'fin': ['Deja de succionar', 'Baja el estímulo y se deja de producir leche.', 6]},
 'order': ['bebe', 'hipot', 'adeno', 'prl', 'produce', 'neuro', 'oxi', 'sale', 'fin']}

for k, (vb, lab_, body) in SV.items():
    with open(os.path.join(OUT, f'proc_{k}.svg'), 'w') as f:
        f.write(f'<svg viewBox="{vb}" role="img" aria-label="{lab_}">{body}</svg>')
with open(os.path.join(OUT, 'proc_C.json'), 'w') as f:
    json.dump(C, f, ensure_ascii=False)
print('ok', list(SV))
