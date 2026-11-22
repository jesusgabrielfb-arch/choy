"""Arma la guía PDF (HTML imprimible) a partir de sections.html y los SVG."""
import json, re, os, shutil
D = os.path.dirname(os.path.abspath(__file__))
REF = '/home/user/choy/estudio/sistema-reproductor/fuente/guia.html'
G = os.path.join(D, 'guia'); os.makedirs(G, exist_ok=True)
if not os.path.exists(os.path.join(G, 'fonts')):
    shutil.copytree('/home/user/choy/estudio/sistema-reproductor/fuente/fonts', os.path.join(G, 'fonts'))
if not os.path.exists(os.path.join(G, 'reales')):
    shutil.copytree(os.path.join(D, 'reales'), os.path.join(G, 'reales'))
ref = open(REF, encoding='utf8').read()
head = ref[:ref.index('</style>')]
head = head.replace('Sistema Reproductor · Guía de estudio', 'Sistema Endocrino · Guía de estudio')
# paleta lavanda
for a, b in [('--grid:#F0F3EE', '--grid:#EEEAF6'), ('--margin:#F6C9C0', '--margin:#D4C6F0'), ('--ink:#45403F', '--ink:#3F3A4F'), ('--muted:#8A8381', '--muted:#837D93'),
             ('--hl:#FFDCCF', '--hl:#E6DBFB'), ('--hl2:#D4EFE2', '--hl2:#D7F2E8'), ('--coral:#E07A5F', '--coral:#7B5CC4'), ('--sage:#5E958A', '--sage:#4E8F9C'), ('--sage-soft:#EEF6F2', '--sage-soft:#EEF6F7'),
             ('#FFE9DF 0%,#F3ECFA 55%,#E3F4EC 100%', '#EDE4FC 0%,#F6F4FA 55%,#DDF4EC 100%'), ('#FFF3EC 70%', '#F4EFFD 70%'), ('rgba(224,122,95,.28)', 'rgba(123,92,196,.25)'),
             ('th{text-align:left;background:#FFEDE5;color:#7A4A3C', 'th{text-align:left;background:#EFE8FC;color:#5B4596'), ('background:#F3A9A0', 'background:#C9B8EE'), ('background:#F8CFC9', 'background:#E2D8F6')]:
    assert a in head, a
    head = head.replace(a, b)
head += '''
ul.flow{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin:6px 0}
ul.flow li{border:1.3px solid var(--line2);border-radius:9px;padding:4px 9px;font-weight:700;font-size:9.4pt;background:#fff;margin:0}
ul.flow li small{display:block;font-weight:400;color:var(--muted);font-size:8pt}ul.flow li.arr{border:0;padding:0;color:var(--coral);background:none}
ul.dots li::marker{content:"✶  ";color:var(--coral)}
.scribble{font-family:"Gochi Hand",cursive;color:var(--coral);font-size:13pt;margin:4px 0}
.plab .q{display:none}.anat-cap{font-size:8.6pt;color:var(--muted);font-style:italic;text-align:center;margin:3px 0 0}
.psteps{font-size:9.3pt;columns:2;column-gap:16px;margin:4px 0 0;padding-left:18px}.psteps li{break-inside:avoid}
.gal{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:6px 0}.gal figure{padding:5px}.gal img{width:100%;height:30mm;object-fit:contain;display:block}
.gal figcaption{font-size:7.6pt}
.real{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:6px 0}.real img{width:100%;height:44mm;object-fit:contain;display:block}
td,th{font-size:9.2pt}
</style></head><body>
'''
P = json.load(open(os.path.join(D, 'anat_P.json'), encoding='utf8'))
C = json.load(open(os.path.join(D, 'proc_C.json'), encoding='utf8'))
def clean(svg):
    svg = re.sub(r' filter="url\(#\w+Tx\)"', '', svg)
    svg = re.sub(r'<circle[^>]*><animateMotion[^>]*/></circle>', '', svg)
    svg = re.sub(r'<animate[^>]*/>', '', svg)
    svg = re.sub(r'<g><polygon[^>]*/><animateMotion[^>]*/></g>', '', svg)
    return svg
def labels(k):
    g = ''
    for p in P[k].values():
        w = round(len(p['n']) * 7.3 + 18); h = 24; ax, ay = p['a']; x, y = p['l']
        cx = max(x, min(ax, x + w)); cy = max(y, min(ay, y + h))
        g += f'<g class="lab"><line x1="{ax}" y1="{ay}" x2="{cx}" y2="{cy}"/><circle cx="{ax}" cy="{ay}" r="3"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/><text x="{x+9}" y="{y+16.5}">{p["n"]}</text></g>'
    return g
REALG = {'cuerpo': [('glandulas-cuerpo', 'Lámina del PPT'), ('sistema-endocrino', 'Lámina del PPT')], 'eje': [('eje', 'Eje (PPT)'), ('hipotalamo-hipofisis', 'Hipotálamo e hipófisis (PPT)')],
         'tiro': [('tiroides-paratiroides', 'Tiroides y paratiroides (PPT)')], 'supra': [('suprarrenal', 'Cápsula suprarrenal (PPT)')], 'panc': [('pancreas', 'Páncreas (PPT)'), ('diabetes', 'Diabetes (PPT)')]}
def anat(m):
    k, cap = m.group(1), m.group(3)
    svg = clean(open(os.path.join(D, f'anat_{k}.svg'), encoding='utf8').read()).replace('<g id="anat-labels"></g>', labels(k))
    real = ''.join(f'<figure><img src="reales/{a}.webp"><figcaption>{b}</figcaption></figure>' for a, b in REALG.get(k, []))
    return f'<figure>{svg}<p class="anat-cap">{cap}</p></figure><div class="real">{real}</div>'
def proc(m):
    k, title = m.group(1), m.group(2)
    svg = clean(open(os.path.join(D, f'proc_{k}.svg'), encoding='utf8').read())
    steps = ''.join(f'<li><b>{t}:</b> {h}</li>' for t, h in C[k]['steps'])
    return f'<h3>{title}</h3><figure>{svg}</figure><ol class="psteps">{steps}</ol>'
sec = open(os.path.join(D, 'sections.html'), encoding='utf8').read()
sec = re.sub(r'<!--ANAT:(\w+)\|(.*?)\|(.*?)-->', anat, sec)
sec = re.sub(r'<!--PROC:(\w+)\|(.*?)-->', proc, sec)
# laboratorio: versión estática
i = sec.index('<div class="lab-grid">'); j = sec.index('<div class="sticky"><span class="t">valores de referencia')
sec = sec[:i] + '''<ul class="dots"><li><b>Glucosa alta</b> (después de comer) → células <b>beta</b> → <b>insulina</b> → músculos → baja la glucosa.</li>
<li><b>Glucosa baja</b> (ayuno, ejercicio) → células <b>alfa</b> → <b>glucagón</b> → hígado (glucógeno → glucosa) → sube.</li>
<li><b>Calcio bajo</b> → <b>paratiroides</b> → <b>paratohormona</b> (riñones y huesos). <b>Calcio alto</b> → <b>tiroides</b> → <b>calcitonina</b> (tejido óseo).</li>
<li><b>Yodos:</b> T4 × 4 + T3 × 3. Ej.: 3 T4 + 2 T3 = 12 + 6 = <b>18</b>.</li>
<li><b>Melatonina:</b> de noche (poca luz) alta; al mediodía (mucha luz) baja.</li></ul>
<p>Los simuladores y ejercicios con números están en la versión interactiva (sección Laboratorio).</p>
''' + sec[j:]
sec = re.sub(r'<span class="stamp">.*?</span>', '', sec)
sec = re.sub(r'<div class="done-row">.*?</div>', '', sec)
sec = re.sub(r'<!--STAGE:.*?-->', '', sec)
sec = re.sub(r'<section class="topic reveal" id="\w+"[^>]*>', '<section>', sec)
sec = re.sub(r'<div class="topic-head"><span class="num">(\d+)</span><h2>(.*?)</h2>(.*?)</div>', lambda m: f'<h2 class="brk"><span class="n">{m.group(1)}</span>{m.group(2)} {m.group(3)}</h2>', sec)
sec = sec.replace('<h2 class="brk"><span class="n">1</span>', '<h2><span class="n">1</span>')
sec = sec.replace('<span class="t">', '<b class="t">').replace('</span>', '</span>')
sec = re.sub(r'<b class="t">(.*?)</span>', r'<b class="t">\1</b>', sec)
sec = sec.replace(' data-practica="celdas"', '').replace(' data-practica="columna"', '').replace(' data-practica="derecha"', '')
sec = re.sub(r'<div class="tbl"><table>', '<table>', sec).replace('</table></div>', '</table>')
sec = re.sub(r'<a href="#\w+">(.*?)</a>', r'\1', sec)
GAL = [('diabetes', 'Diabetes'), ('bocio1', 'Bocio'), ('bocio2', 'Bocio'), ('hipo-hiper', 'Hipo e hipertiroidismo'), ('hirsutismo', 'Hirsutismo'), ('cushing-sintomas', 'Cushing: síntomas'), ('cushing-causas', 'Cushing: causas'),
       ('deficiencia-gh', 'Deficiencia de GH'), ('enanismo', 'Deficiencia en el crecimiento'), ('acromegalia', 'Acromegalia'), ('osteoporosis', 'Osteoporosis')]
gal = '<h3>Fotos de las láminas del PPT</h3><div class="gal">' + ''.join(f'<figure><img src="reales/{a}.webp"><figcaption>{b}</figcaption></figure>' for a, b in GAL) + '</div>'
sec = sec.replace('<!-- 11 LABORATORIO -->', gal + '\n<!-- 11 LABORATORIO -->', 1)
sec = re.sub(r'<details class="real-inline">.*?</details>', '', sec, flags=re.S)
# repaso y autoevaluación
data = open(os.path.join(D, 'data.js'), encoding='utf8').read()
rev = re.findall(r"\['([^']*)','([^']*)','\w+'\]", data[data.index('const REV'):])
REV = '<table><thead><tr><th style="width:32%">Término clave</th><th>En una frase</th></tr></thead><tbody>' + ''.join(f'<tr><td style="color:#6E52B8">{a}</td><td>{b}</td></tr>' for a, b in rev) + '</tbody></table>'
QS = [('¿Qué diferencia hay entre una glándula exocrina y una endocrina? Da un ejemplo de cada una.', 'Exocrina: con conductos hacia una superficie (sudorípara). Endocrina: sin conductos, a la sangre (tiroides).'),
      ('¿Cuáles son las glándulas maestras y por qué se llaman así?', 'Hipotálamo e hipófisis: regulan y estimulan a otras glándulas.'),
      ('Explica los dos mecanismos del eje hipotálamo-hipofisario.', 'Sistema porta (capilares, hormonas liberadoras → adenohipófisis) y tracto hipotalamohipofisario (axones, neurohormonas → neurohipófisis).'),
      ('¿Qué hormona libera cada una: GnRH, TRH, CRH y GHRH?', 'FSH y LH; TSH; ACTH; GH.'),
      ('¿Qué hacen la prolactina y la oxitocina en la lactancia?', 'Prolactina produce la leche; oxitocina permite su salida.'),
      ('Explica qué pasa cuando baja la hormona tiroidea.', 'Hipotálamo TRH → adenohipófisis TSH → tiroides T3/T4 → si hay suficiente, se detiene la TRH.'),
      ('¿Qué hormona produce la pineal y cómo influye la luz?', 'Melatonina; a menor luz, más melatonina (sueño).'),
      ('¿Cuántos yodos tienen la T4 y la T3?', '4 y 3.'),
      ('¿Qué hacen la calcitonina y la paratohormona? ¿Cuáles son sus órganos diana?', 'Regulan el calcio, son antagonistas; calcitonina → tejido óseo; paratohormona → riñones y huesos.'),
      ('¿Qué produce la médula y qué produce la corteza suprarrenal?', 'Médula: adrenalina y noradrenalina. Corteza: cortisol y aldosterona.'),
      ('¿Qué células producen insulina y glucagón? ¿Dónde actúa cada una?', 'Beta: insulina (músculos). Alfa: glucagón (hígado).'),
      ('Clasifica: insulina, progesterona, tiroxina y aldosterona.', 'Peptídicas: insulina, tiroxina. Lipídicas: progesterona, aldosterona.'),
      ('¿Por dónde se eliminan las hormonas?', 'Por la orina o destruyéndose en el hígado.'),
      ('Da tres señales del hipertiroidismo y tres del hipotiroidismo.', 'Hiper: pérdida de peso, ojos saltones, sudoración. Hipo: cabello seco, cansancio, piel seca.'),
      ('¿Qué es la acromegalia y qué la causa?', 'Exceso de GH, casi siempre por un tumor benigno en la hipófisis.'),
      ('Explica la relación anatómica y fisiológica entre el endocrino y el urinario.', 'Suprarrenales encima de los riñones; ADH en las nefronas, aldosterona (sodio y potasio), eliminación por la orina.')]
auto = '<div class="qs"><h3>Autoevaluación</h3><ol>' + ''.join(f'<li>{q}</li>' for q, _ in QS) + '</ol><p class="ans"><b>Respuestas:</b> ' + ' '.join(f'{i+1}) {a}' for i, (_, a) in enumerate(QS)) + '</p></div>'
TOC = ['El sistema endocrino', 'Hipotálamo e hipófisis', 'Hormonas del hipotálamo y la hipófisis', 'Retroalimentación', 'Glándula pineal', 'Tiroides y paratiroides', 'Glándulas suprarrenales', 'Páncreas', 'Clasificación y equilibrio', 'Enfermedades', 'Laboratorio de hormonas', 'Relación con otros sistemas y repaso', 'Repaso rápido y autoevaluación']
cover = f'''<section class="cover"><div class="grid"></div>
<svg class="egg" viewBox="0 0 512 512">{open('/home/user/choy/estudio/sistema-endocrino/iconos/icon.svg', encoding='utf8').read().split('>', 1)[1].rsplit('</svg>', 1)[0]}</svg>
<div class="in"><span class="eye">guía de estudio · biología</span><h1>Sistema<br><em>Endocrino</em></h1>
<p class="sub">Glándulas, eje hipotálamo-hipófisis, hormonas, retroalimentación, pineal, tiroides, suprarrenales, páncreas, enfermedades y relación con otros sistemas. Hecha con el <b>PPT de clase</b> y tus apuntes (si no coinciden, manda el PPT).</p>
<div class="toc"><b>contenido</b><ol>{''.join(f'<li>{t}</li>' for t in TOC)}</ol></div></div>
<div class="sticker"><b>versión interactiva</b>Dibujos, procesos, quiz, simulacro y test en sistema-endocrino-opal.vercel.app</div></section>
<div class="mline"></div>
<div class="legend"><b>Guía de prioridad</b> (mi estimado; ajústalo a lo que diga la profe Yaisel):
  <span class="chip c-hot">Muy probable</span> pinta para examen · <span class="chip c-ok">Seguro</span> lo básico · <span class="chip c-extra">Extra</span> si te sobra tiempo · <span class="chip c-ppt">PPT</span> dato del PPT</div>
'''
html = head + cover + sec + f'<h2 class="brk"><span class="n">13</span>Repaso rápido antes del examen</h2>{REV}<div class="pruebate"><b>Ponte a prueba:</b> tapa la columna derecha y explica cada término con tus palabras.</div>{auto}</body></html>'
open(os.path.join(G, 'guia.html'), 'w', encoding='utf8').write(html)
print('ok', len(html) // 1024, 'KB')
