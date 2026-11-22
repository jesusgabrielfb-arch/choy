"""Arma sistema-endocrino.html a partir de la página de referencia."""
import json, re, os, subprocess
D = os.path.dirname(os.path.abspath(__file__))
REF = '/home/user/choy/estudio/sistema-reproductor/fuente/sistema-reproductor.html'
SK = '/home/user/choy/.claude/skills/pagina-de-estudio/plantilla/'
s = open(REF, encoding='utf8').read()
rd = lambda f: open(os.path.join(D, f), encoding='utf8').read()

def rep(a, b, cnt=1):
    global s
    n = s.count(a)
    assert n == cnt, (n, a[:90])
    s = s.replace(a, b)

def region(start, end, new, keep_end=True):
    global s
    i = s.index(start); j = s.index(end, i)
    assert s.count(start) == 1, start[:60]
    s = s[:i] + new + (s[j:] if keep_end else s[j + len(end):])

# ---------------------------------------------------------------- cabecera y CSS
rep('<title>Sistema Reproductor</title>', '<title>Sistema Endocrino</title>')
s = s.replace('data-who="spermi"', 'data-who="tiro"').replace('data-who="ovulina"', 'data-who="insulina"')
s = s.replace('mascotas/spermi_', 'mascotas/tiro_').replace('mascotas/ovulina_', 'mascotas/insulina_')
rep('.bubble .sp{color:#5B6BB0}.bubble .ov{color:#C2457A}', '.bubble .sp{color:#6E52B8}.bubble .ov{color:#2F8A6C}')
EXTRA_CSS = r'''
/* ---------- endocrino: extras ---------- */
#ovo-cursor .corona{fill:none;stroke:#4E8F9C}
.lab-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:16px 0}
@media (max-width:820px){.lab-grid{grid-template-columns:1fr}}
.lab-card{border:1.5px solid var(--line2);border-radius:18px;background:var(--page);box-shadow:var(--hard);padding:14px 16px;min-width:0}
.lab-card svg{width:100%;height:auto;display:block;margin:6px 0}
.lab-btns{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}
.lab-range{display:grid;gap:4px;font-size:14.5px}.lab-range input{width:100%;accent-color:var(--coral)}
.lab-out{font-size:14.5px;background:var(--blue-soft);border-radius:12px;padding:8px 12px;min-height:44px}
.yodo-box{display:flex;flex-wrap:wrap;gap:8px;min-height:54px;margin:6px 0;align-items:center}
.yodo-box .mol{display:inline-flex;align-items:center;gap:3px;border:1.5px solid var(--line2);border-radius:999px;padding:4px 9px;background:#F6F4FA;animation:pop .4s cubic-bezier(.2,1.4,.4,1)}
.yodo-box .mol b{font-size:13px;margin-right:3px;color:var(--coral)}
.yodo-box .mol i{width:10px;height:10px;border-radius:50%;background:#E3B33C;display:inline-block;border:1px solid #B88A1E}
.cp-grid select{font:inherit;padding:10px 12px;border:1.5px solid var(--line2);border-radius:10px;background:var(--page);color:var(--ink);width:100%}
.cp-grid select.ok,.cp-grid input.ok{border-color:var(--ok);background:var(--ok-soft)}.cp-grid select.bad,.cp-grid input.bad{border-color:var(--bad);background:var(--bad-soft)}
.anat-tabs .real-btn{margin-left:auto;background:var(--sticky);border-color:#E6CF77;color:var(--sticky-ink)}
.anat-tabs .real-btn[aria-pressed="true"]{background:var(--blue);border-color:var(--blue);color:#fff}
.anat.show-real > svg,.anat.show-real .proc-scroll,.anat.show-real .proc-swipe,.anat.show-real .proc-ctrl,.anat.show-real .anat-foot{display:none!important}
.real-view{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));margin:6px 0;animation:pop .45s cubic-bezier(.2,1.2,.4,1)}
.real-view figure,.gal figure,.real-inline figure{margin:0;background:#fff;border:1.5px solid var(--line2);border-radius:14px;padding:8px;box-shadow:var(--hard)}
.real-view img,.gal img,.real-inline img{display:block;width:100%;height:auto;max-height:440px;object-fit:contain;border-radius:8px;background:#fff}
.real-view figcaption,.gal figcaption,.real-inline figcaption{font-size:13px;color:var(--muted);margin-top:6px;line-height:1.35}
.real-note{grid-column:1/-1;font-size:13px;color:var(--muted);margin:0}
.gal{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr));margin:12px 0}
.real-inline{margin:10px 0}.real-inline summary{cursor:pointer;font-weight:700;color:var(--blue);display:inline-block;padding:6px 12px;border:1.5px solid var(--line2);border-radius:999px;background:var(--page)}
.real-inline figure{max-width:340px;margin-top:10px}
.cp-top{align-items:flex-start!important}.cp-top .cp-q{align-self:flex-start!important}
'''
i = s.index('</style>')
s = s[:i] + open(SK + 'temas-visuales.css', encoding='utf8').read() + EXTRA_CSS + open(SK + 'rendimiento.css', encoding='utf8').read() + s[i:]

# ---------------------------------------------------------------- piezas HTML
def stage_mini(sid):
    return (f'<div class="stage mini-stage" id="{sid}"><figure class="mfig"><div class="mascot" data-who="tiro" data-state="idle" role="img" aria-label="Tiro"></div></figure>'
            f'<figure class="mfig"><div class="mascot" data-who="insulina" data-state="idle" role="img" aria-label="Insulina"></div></figure></div>')

def stage_full(sid, txt):
    return (f'<div class="stage" id="{sid}"><div class="bubble" aria-live="polite"><b class="ov">Insulina:</b>{txt}</div>'
            f'<figure class="mfig"><div class="mascot" data-who="tiro" data-state="idle" role="img" aria-label="Tiro"></div><figcaption>Tiro</figcaption></figure>'
            f'<figure class="mfig"><div class="mascot" data-who="insulina" data-state="idle" role="img" aria-label="Insulina"></div><figcaption>Insulina</figcaption></figure></div>')

def anat_block(k, info, cap):
    svg = rd(f'anat_{k}.svg')
    return (f'<div class="anat anat-wide" id="anat-{k}">\n<div class="anat-tabs" role="group" aria-label="Modo del dibujo"><button type="button" data-mode="ver" aria-pressed="true">Ver</button>'
            f'<button type="button" data-mode="tapar" aria-pressed="false">Tapar nombres</button><button type="button" data-mode="juego" aria-pressed="false">Juego: toca la parte</button></div>\n'
            f'{svg}\n<div class="anat-row"><div class="anat-info" aria-live="polite">{info}</div>{stage_mini("stage-" + k)}</div>\n<div class="anat-foot"></div>\n<p class="anat-cap">{cap}</p>\n</div>')

def proc_block(k, title):
    svg = rd(f'proc_{k}.svg')
    return (f'<div class="anat proc" id="anat-{k}">\n<div class="proc-h"><h3 style="margin:0">{title}</h3></div>\n'
            '<div class="anat-tabs" role="group" aria-label="Modo de la animación"><button type="button" data-mode="paso" aria-pressed="true">▶ Paso a paso</button>'
            '<button type="button" data-mode="tapar" aria-pressed="false">Tapar nombres</button><button type="button" data-mode="juego" aria-pressed="false">Juego: toca la etapa</button>'
            '<button type="button" data-mode="ordena" aria-pressed="false">Ordena el proceso</button></div>\n'
            f'<div class="proc-scroll">{svg}</div>\n<p class="proc-swipe">Desliza el dibujo para verlo completo →</p>\n'
            '<div class="proc-ctrl"><button class="btn small" type="button" data-act="prev" aria-label="Paso anterior">◀</button><div class="proc-dots"></div><button class="btn small" type="button" data-act="next" aria-label="Paso siguiente">▶</button><button class="btn small primary" type="button" data-act="play">▶ Reproducir</button></div>\n'
            f'<div class="anat-row"><div class="anat-info" aria-live="polite">Dale a ▶ o toca una etapa para ver qué pasa.</div>{stage_mini("stage-p" + k)}</div>\n<div class="anat-foot"></div>\n</div>')

sec = rd('sections.html')
sec = re.sub(r'<!--ANAT:(\w+)\|(.*?)\|(.*?)-->', lambda m: anat_block(m.group(1), m.group(2), m.group(3)), sec)
sec = re.sub(r'<!--PROC:(\w+)\|(.*?)-->', lambda m: proc_block(m.group(1), m.group(2)), sec)
sec = re.sub(r'<!--STAGE:(\w+)\|(.*?)-->', lambda m: stage_full('stage-' + m.group(1), m.group(2)), sec)
assert '<!--' not in sec.replace('<!-- ', '')
# imagen real junto al cuadro exocrina/endocrina
from PIL import Image as _I
def _wh(src):
    w, h = _I.open(os.path.join(D, 'reales', src + '.webp')).size
    return f'width="{w}" height="{h}"'
fig = lambda src, cap: f'<figure><img src="reales/{src}.webp" {_wh(src)} alt="{re.sub("<[^>]+>", "", cap)}" loading="lazy" decoding="async"><figcaption>{cap}</figcaption></figure>'
a = '<div class="sticky"><span class="t">glándula mixta</span>'
assert sec.count(a) == 1
sec = sec.replace(a, '<details class="real-inline"><summary>📷 Ver la imagen real del PPT</summary>' + fig('exo-endo', 'Glándula exocrina (arriba: secreta por un conducto) y endocrina (abajo: vierte hormonas al vaso sanguíneo). Lámina del PPT.') + '</details>\n  ' + a)
a = '<h3>Hormonas de la hipófisis (pituitaria) <span class="chip c-ppt">PPT</span></h3>'
assert sec.count(a) == 1
sec = sec.replace(a, '<details class="real-inline"><summary>📷 Ver la tabla real del PPT</summary>' + fig('tabla-hipotalamo', 'Tabla del PPT: hormonas del hipotálamo.') + '</details>\n  ' + a)
a = '<h3>Cadena completa: hipotálamo'
sec = sec.replace(a, '<details class="real-inline"><summary>📷 Ver la tabla real del PPT</summary>' + fig('tabla-hipofisis', 'Tabla del PPT: hormonas de la hipófisis.') + '</details>\n  ' + a, 1)
GAL = [('diabetes', 'Diabetes: células productoras de insulina sanas y destruidas'), ('bocio1', 'Bocio: la tiroides aumentada'), ('bocio2', 'Bocio: cuello hinchado'),
       ('hipo-hiper', 'Hipotiroidismo (tiroides disminuida) e hipertiroidismo (tiroides aumentada)'), ('hirsutismo', 'Hirsutismo (lámina del PPT)'),
       ('cushing-sintomas', 'Síndrome de Cushing: síntomas'), ('cushing-causas', 'Síndrome de Cushing: causas y tratamiento'),
       ('deficiencia-gh', 'Deficiencia de la hormona del crecimiento: el problema está en la hipófisis'), ('enanismo', 'Deficiencias en el crecimiento: tumor que causa panhipopituitarismo'),
       ('acromegalia', 'Acromegalia: exceso de GH por un tumor en la hipófisis'), ('osteoporosis', 'Hueso saludable y hueso con osteoporosis')]
gal = '<h3>Fotos reales de las láminas <span class="chip c-ppt">PPT</span></h3>\n  <p>Así salen las enfermedades en el PPT. Mira cada foto y di en voz alta qué enfermedad es y qué glándula falla.</p>\n  <div class="gal">' + ''.join(fig(a_, b_) for a_, b_ in GAL) + '</div>\n  '
a = '<div class="done-row"><button class="btn small tprac" type="button" data-prac="enf">'
assert sec.count(a) == 1
sec = sec.replace(a, gal + a)

CURSOR = ('<div id="ovo-cursor" aria-hidden="true"><svg viewBox="-30 -30 60 60" width="52" height="52">\n  <g class="corona" stroke-width="2.4" stroke-linecap="round">'
          + ''.join(f'<path d="M{17*__import__("math").cos(a):.1f},{17*__import__("math").sin(a):.1f} L{25*__import__("math").cos(a):.1f},{25*__import__("math").sin(a):.1f} M{25*__import__("math").cos(a)-3*__import__("math").sin(a):.1f},{25*__import__("math").sin(a)+3*__import__("math").cos(a):.1f} L{25*__import__("math").cos(a):.1f},{25*__import__("math").sin(a):.1f} L{25*__import__("math").cos(a)+3*__import__("math").sin(a):.1f},{25*__import__("math").sin(a)-3*__import__("math").cos(a):.1f}"/>' for a in [i * 0.785 for i in range(8)])
          + '</g>\n  <circle r="17" fill="#D7F2E8" stroke="#4E8F9C" stroke-width="3"/><circle cx="-3" cy="-2" r="6.5" fill="#7B5CC4" opacity=".85"/><circle cx="-5" cy="-4" r="2" fill="#fff" opacity=".8"/>\n</svg></div>')

NAVS = [('base', 'Base'), ('eje', 'Eje'), ('hormonas', 'Hormonas'), ('retro', 'Retro'), ('pineal', 'Pineal'), ('tiroides', 'Tiroides'), ('suprarrenales', 'Suprarrenales'),
        ('pancreas', 'Páncreas'), ('clasificacion', 'Clasificación'), ('enfermedades', 'Enfermedades'), ('laboratorio', 'Laboratorio'), ('relacion', 'Relación')]
NAV = ('<nav class="nav" aria-label="Secciones">\n  <div class="wrap nav-row" id="navrow">\n    <a class="brand" href="#" aria-label="Sistema Endocrino, by Jesús Fuentes. Ir al inicio"><span class="b1">Sistema Endocrino ✿</span><span class="b2">by: Jesús Fuentes</span></a>\n'
       + ''.join(f'    <a href="#{k}" data-sec="{k}"><span class="tick">✓</span>{n}</a>\n' for k, n in NAVS)
       + '    <a href="#practica" class="practice">Practicar →</a>\n    <a href="#simulacro" class="practice sim-nav">Simulacro</a>\n    <a href="#test" class="practice dp-nav">Test</a>\n  </div>\n  <div class="progress" aria-hidden="true"><i id="progbar"></i></div>\n</nav>\n')
HERO = '''<div class="wrap">
<header class="hero">
  <div class="hero-card">
    <canvas id="swim" aria-hidden="true"></canvas>
    <div class="hero-inner">
      <div>
        <a class="eyebrow" href="https://mis-guias-bio.vercel.app" style="text-decoration:none" title="Ver todas mis guías">← mis guías de bio ~</a>
        <h1><span class="w">Sistema</span><br><span class="w"><em>Endocrino</em></span></h1>
        <p class="lede">El PPT de clase y tus apuntes en un solo lugar (cuando no coinciden, manda el PPT): glándulas, eje hipotálamo-hipófisis, todas las hormonas, retroalimentación, pineal, tiroides, suprarrenales, páncreas, enfermedades y la relación con los otros sistemas. Marca cada tema cuando lo domines y termina con el simulacro.</p>
        <div class="cta">
          <a class="btn primary" href="#base">Empezar a estudiar</a>
          <a class="btn" href="#practica">Ir directo al quiz</a>
        </div>
        <div class="stats">
          <span><b>12</b>temas</span>
          <span><b>42</b>tarjetas</span>
          <span><b>500+</b>preguntas</span>
          <span><b>10</b>dibujos y procesos</span>
        </div>
      </div>
      <div class="hero-side">
      <div class="stage" id="stage-hero">
        <div class="bubble" id="bubble-hero" aria-live="polite"><b class="sp">Tiro:</b>¡Hola! Yo soy Tiro, la tiroides, y ella es Insulina. ¡Vamos por ese 5!</div>
        <figure class="mfig"><div class="mascot" data-who="tiro" data-state="idle" role="img" aria-label="Tiro, la glándula tiroides"></div><figcaption>Tiro</figcaption></figure>
        <figure class="mfig"><div class="mascot" data-who="insulina" data-state="idle" role="img" aria-label="Insulina, la hormona"></div><figcaption>Insulina</figcaption></figure>
      </div>
      <div class="ring-card" aria-live="polite">
        <h4>mi avance</h4>
        <div class="ring">
          <svg viewBox="0 0 84 84" aria-hidden="true">
            <circle class="bg" cx="42" cy="42" r="34" fill="none" stroke-width="9"/>
            <circle class="fg" id="ringfg" cx="42" cy="42" r="34" fill="none" stroke-width="9" stroke-linecap="round" transform="rotate(-90 42 42)" stroke-dasharray="213.6" stroke-dashoffset="213.6"/>
            <text id="ringtxt" x="42" y="48" text-anchor="middle">0/12</text>
          </svg>
          <p id="ringmsg">Marca "Lo tengo" al final de cada tema.</p>
        </div>
        <div class="legend">
          <div><span class="chip c-hot">Muy probable</span> pinta para examen</div>
          <div><span class="chip c-ok">Seguro</span> lo básico</div>
          <div><span class="chip c-extra">Extra</span> si te sobra tiempo</div>
        </div>
      </div>
      </div>
    </div>
  </div>
</header>

'''
region('<div id="ovo-cursor"', '<!-- PRACTICA -->', CURSOR + '\n\n' + NAV + '\n' + HERO + sec + '\n\n')

# ---------------------------------------------------------------- textos de práctica / simulacro / test
s = s.replace('<b class="sp">Spermi:</b>', '<b class="sp">Tiro:</b>').replace('<b class="ov">Ovulina:</b>', '<b class="ov">Insulina:</b>')
s = s.replace('aria-label="Spermi"', 'aria-label="Tiro"').replace('aria-label="Ovulina"', 'aria-label="Insulina"').replace('<figcaption>Spermi</figcaption>', '<figcaption>Tiro</figcaption>').replace('<figcaption>Ovulina</figcaption>', '<figcaption>Insulina</figcaption>')
rep('Hay más de 520 preguntas basadas en tus apuntes y en el PPT de clase', 'Hay más de 500 preguntas basadas en el PPT y tus apuntes')
s = re.sub(r'(<section class="sim-wrap" id="simulacro">.*?<p class="lede">).*?(</p>)', r'\1Un examen completo como los de la profe Yaisel: <b>I.</b> pareo de 25 palabras y 30 líneas, <b>II.</b> 15 preguntas de respuesta corta, <b>III.</b> dos casos clínicos, <b>IV.</b> tres imágenes para identificar y explicar, y <b>V.</b> desarrollo de la <b>relación anatómica y fisiológica</b> entre sistemas, con una pregunta de nivel alto. Cada simulacro nuevo cambia palabras, casos e imágenes.\2', s, count=1, flags=re.S)
rep('sistema-reproductor.vercel.app</b>', 'sistema-endocrino-opal.vercel.app</b>')
rep('<h2>Test: Sistema Reproductor</h2>', '<h2>Test: Sistema Endocrino</h2>')
TOPICS = {'base': ['El sistema endocrino', '#base'], 'eje': ['Hipotálamo e hipófisis', '#eje'], 'horm': ['Hormonas del hipotálamo y la hipófisis', '#hormonas'], 'retro': ['Retroalimentación', '#retro'],
          'pineal': ['Glándula pineal', '#pineal'], 'tiro': ['Tiroides y paratiroides', '#tiroides'], 'supra': ['Glándulas suprarrenales', '#suprarrenales'], 'panc': ['Páncreas', '#pancreas'],
          'clasif': ['Clasificación y equilibrio', '#clasificacion'], 'enf': ['Enfermedades', '#enfermedades'], 'lab': ['Laboratorio (números)', '#laboratorio'], 'rel': ['Relación con otros sistemas', '#relacion']}
s = re.sub(r'<select id="dp-topic">.*?</select>', '<select id="dp-topic"><option value="all">Todos los temas</option>' + ''.join(f'<option value="{k}">{v[0]}</option>' for k, v in TOPICS.items()) + '</select>', s, count=1, flags=re.S)
s = re.sub(r'<footer>.*?</footer>', '<footer><a href="https://mis-guias-bio.vercel.app" style="font-weight:700;color:var(--coral)">← Todas mis guías</a><br><span class="hand">¡tú puedes, vas por el 5! ✿</span><br>Guía hecha con el PPT de clase y tus apuntes. Lo que agregué o aclaré está marcado como "Extra".</footer>', s, count=1, flags=re.S)
s = s.replace("'repro-", "'endo-")
assert 'repro-' not in s.replace('sistema-reproductor', ''), [m.start() for m in re.finditer('repro-', s)][:3]

# ---------------------------------------------------------------- JavaScript
region('/* ---------- hero: espermatozoides', '/* ---------- reveal / highlighter', rd('hero.js') + '\n')
region('/* ---------- mascotas: Spermi y Ovulina', "ensure('idle');addEventListener('load'", rd('mascots.js'))
s = re.sub(r"const SECS=\[[^\]]*\];", "const SECS=" + json.dumps([k for k, _ in NAVS]) + ";", s, count=1)
P = json.load(open(os.path.join(D, 'anat_P.json'), encoding='utf8'))
CPROC = json.load(open(os.path.join(D, 'proc_C.json'), encoding='utf8'))
ANCH = {k: {kk: v['a'] for kk, v in P[k].items()} for k in P}
HELLO = {'cuerpo': 'Toca una glándula (o su nombre) para ver qué es.', 'eje': 'Toca una parte del eje para ver qué es.', 'tiro': 'Toca una parte para ver qué es.', 'supra': 'Toca una parte para ver qué es.', 'panc': 'Toca una parte para ver qué es.'}
ACC = {'cuerpo': {}, 'eje': {}, 'tiro': {}, 'supra': {'glandula': ['corteza', 'medula']}, 'panc': {'islote': ['alfa', 'beta'], 'pancreas': ['conducto']}}
calls = ''.join(f"makeAnat('anat-{k}',{json.dumps(P[k], ensure_ascii=False)},{json.dumps(ACC[k])},{{stage:'stage-{k}',hello:{json.dumps(HELLO[k], ensure_ascii=False)}}});\n" for k in P)
calls += 'const ANCH=' + json.dumps(ANCH) + ';\n'
region("makeAnat('anat-fem',", '/* ---------- procesos animados interactivos', calls)
pcalls = ''.join(f"makeProc('anat-{k}',{json.dumps(CPROC[k], ensure_ascii=False)},{{stage:'stage-p{k}'}});\n" for k in CPROC)
region("makeProc('anat-esp',", '/* ---------- gráfica del ciclo', pcalls + '\n')
REALES = {
 'anat-cuerpo': [['glandulas-cuerpo', 'Glándulas endocrinas en la mujer y el hombre (lámina del PPT): pineal, hipófisis, tiroides, timo, suprarrenal, páncreas, ovario y testículo.'], ['sistema-endocrino', 'El sistema endocrino completo con sus glándulas (lámina del PPT).']],
 'anat-eje': [['eje', 'Eje hipotálamo-hipofisario (lámina del PPT, en portugués: <i>adenoipófise</i> = adenohipófisis, <i>neuroipófise</i> = neurohipófisis, <i>hormônios liberadores</i> = hormonas liberadoras).'], ['hipotalamo-hipofisis', 'Hipotálamo e hipófisis dentro de la cabeza: las hormonas se vierten a la sangre.']],
 'anat-tiro': [['tiroides-paratiroides', 'Tiroides (morada) y paratiroides (rosa fuerte, por detrás). Lámina del PPT.'], ['hipo-hiper', 'La tiroides disminuida (hipotiroidismo) y aumentada (hipertiroidismo).']],
 'anat-supra': [['suprarrenal', 'Cápsula suprarrenal encima del riñón, con la arteria y la vena renal y el uréter. Lámina del PPT.']],
 'anat-panc': [['pancreas', 'El páncreas real (en inglés: <i>gallbladder</i> = vesícula biliar, <i>bile duct</i> = conducto biliar, <i>small intestine</i> = intestino delgado/duodeno).'], ['diabetes', 'Islotes con células productoras de insulina (beta): sanas y destruidas en la diabetes.']],
 'anat-lact': [['eje', 'Lámina del PPT: la prolactina va a la glándula mamaria (producción de leche) y la oxitocina a la glándula mamaria (expulsión de la leche) y al útero (contracciones).']],
 'anat-retro': [['hipotalamo-hipofisis', 'Hipotálamo y hipófisis: las glándulas maestras de la cadena.'], ['tiroides-paratiroides', 'La tiroides, que recibe la TSH y libera T3 y T4.']],
 'anat-mel': [['cerebro-pineal', 'Corte del cerebro (lámina del PPT): la glándula pineal es la pequeña estructura marcada en verde, en el centro, encima del cerebelo.']],
 'anat-gluc': [['diabetes', 'Insulina en la sangre que sale de las células beta (izquierda) y células beta destruidas en la diabetes (derecha).'], ['pancreas', 'El páncreas real.']],
 'anat-ca': [['tiroides-paratiroides', 'Tiroides (calcitonina) y paratiroides (paratohormona).'], ['osteoporosis', 'Cuando el calcio del hueso falla: hueso saludable vs. osteoporosis.']]}
region('/* ---------- gráfica del ciclo', '/* ---------- banco de preguntas por tema', 'window.REALES=' + json.dumps(REALES, ensure_ascii=False) + ';\n' + rd('lab.js') + '\n')
BANK = json.load(open(os.path.join(D, 'bank.json'), encoding='utf8'))
bank_js = 'const BANK=[\n' + ',\n'.join(json.dumps(q, ensure_ascii=False) for q in BANK) + '\n];\n'
TYPES = "const TYPES={mc:'Selección múltiple',tf:'Verdadero o falso',fill:'Llenar espacios',open:'Desarrollo',order:'Ordenar procesos',match:'Pareo'};\n"
region('/* ---------- banco de preguntas por tema', '/* ---------- configuración: temas', '/* ---------- banco de preguntas por tema ---------- */\nconst TOPICS=' + json.dumps(TOPICS, ensure_ascii=False) + ';\n' + TYPES + bank_js + rd('data.js') + '\n')
SUBT = {
 'base': [['dibujo', '@img'], ['exo', 'exocrin|conducto|sudorip|saliva|mamari|mixta'], ['maestra', 'maestra|periferic'], ['gonada', 'gonada|ovario|testicul|sexo|estrogeno|testosterona'], ['def', 'hormona|sangre|diana|endocrin|glandula|interrelacion|largo plazo']],
 'eje': [['dibujo', '@img'], ['porta', 'porta|capilar|liberadora'], ['tracto', 'tracto|axon|neurohormona'], ['lobulos', 'adenohipof|neurohipof|anterior|posterior'], ['estimul', 'estimulante|tsh|acth|todo el cuerpo|pituitaria|eje']],
 'horm': [['hipot', 'gnrh|trh|crh|ghrh|somatostatina|dopamina|liberadora'], ['neuro', 'oxitocina|adh|vasopresina|nefrona|presion'], ['hipof', 'somatotropina|prolactina|tsh|acth|lpd|lpH|fsh|lh|gonadotrop|crecimiento|leche']],
 'retro': [['cadena', 'trh|tsh|adenohipof'], ['freno', 'detien|frena|suficiente|negativa|termostato|retroaliment|controle'], ['tiroidea', 'tiroides|tiroidea|t3|t4|hipotiroid']],
 'pineal': [['luz', 'luz|retina|hipotalamo|noche|celular'], ['ritmo', 'circadiano|24|diurno|vigilia|sueño|sueno'], ['glandula', 'pineal|epifisis|cono|diencefalo|neuroendocrina|melatonina|pubertad']],
 'tiro': [['dibujo', '@img'], ['hormonas', 't4|t3|tiroxina|triyodo|yodo|metabolismo'], ['calcio', 'calcitonina|paratohormona|paratiroides|calcio|oseo'], ['ubic', 'cuello|traquea|laringe|grande|posterior|seguro'], ['enf', 'hipertiroid|hipotiroid']],
 'supra': [['dibujo', '@img'], ['medula', 'medula|adrenalina|noradrenalina|vegetativo|emergencia|perro'], ['corteza', 'corteza|cortisol|aldosterona|adiposo|sodio|acth'], ['ubic', 'riñon|encima|capsula|urinario']],
 'panc': [['dibujo', '@img'], ['celulas', 'beta|alfa|langerhans|islote'], ['accion', 'glucagon|glucogeno|higado|musculo|insulina|glucosa|antagon'], ['mixta', 'mixta|exocrin|jugo'], ['diabetes', 'diabetes']],
 'clasif': [['tipos', 'peptid|lipid|colesterol|aminoacido|progesterona|aldosterona|tiroxina'], ['equilibrio', 'equilibrio|eliminacion|orina|higado|pequeñas|pequenas|enfermedad']],
 'enf': [['tiroides', 'hipertiroid|hipotiroid|bocio|ojos|cabello'], ['cushing', 'cushing|cortisol|corticoster|luna|bufalo|endogen|exogen'], ['gh', 'acromegalia|crecimiento|gh|tumor'], ['diabetes', 'diabetes|insulina|glucosa'], ['otras', 'osteoporosis|hirsutismo|hueso|vello']],
 'lab': [['glucosa', 'glucosa|mg/dl|prediabetes|insulina|glucagon'], ['yodo', 'yodo|t4|t3'], ['calcio', 'calcio|paratohormona|calcitonina'], ['luz', 'melatonina|hora|circadiano|luz']],
 'rel': [['nervioso', 'nervioso|retina|encefalo|vegetativo|axon'], ['circ', 'circulatorio|sangre|capilar|presion|porta'], ['urin', 'urinario|riñon|nefrona|orina|aldosterona'], ['dig', 'digestivo|pancreas|higado|jugo|duodeno'], ['repro', 'reproductor|gonada|oxitocina|fsh|estrogeno'], ['oseo', 'oseo|muscul|calcio|somatotropina|anatomica|fisiologica']]}
s = re.sub(r'const SUBT=\{.*?\};\n', lambda m: 'const SUBT=' + json.dumps(SUBT, ensure_ascii=False) + ';\n', s, count=1, flags=re.S)
rep("({masc:MASC_P,ovocito:OVO_P,esp:ESP_P,ovp:OVP_P}[sp.img]||{})[sp.p]", "(ANCH[sp.img]||{})[sp.p]")
# simulacro
SIM_IMG = {}
TITLES = {'cuerpo': 'Glándulas del sistema endocrino', 'eje': 'Eje hipotálamo-hipofisario', 'tiro': 'Tiroides y paratiroides', 'supra': 'Glándula suprarrenal', 'panc': 'Páncreas e islote de Langerhans'}
KEYW = {'hipotalamo': ['hipotalamo'], 'hipofisis': ['hipofisis', 'pituitaria'], 'pineal': ['pineal', 'epifisis'], 'tiroides': ['tiroides'], 'paratiroides': ['paratiroides'], 'timo': ['timo'], 'suprarrenales': ['suprarrenal'],
        'pancreas': ['pancreas'], 'ovarios': ['ovario'], 'testiculos': ['testiculo'], 'porta': ['porta'], 'tracto': ['tracto'], 'adeno': ['adenohipofisis', 'anterior'], 'neuro': ['neurohipofisis', 'posterior'],
        'laringe': ['laringe'], 'lobder': ['derecho', 'lobulo'], 'lobizq': ['izquierdo', 'lobulo'], 'istmo': ['istmo'], 'traquea': ['traquea'], 'glandula': ['suprarrenal'], 'rinon': ['riñon', 'rinon'],
        'corteza': ['corteza'], 'medula': ['medula'], 'duodeno': ['duodeno'], 'conducto': ['conducto'], 'islote': ['islote', 'langerhans'], 'alfa': ['alfa'], 'beta': ['beta'], 'acinos': ['acino'], 'capilar': ['capilar']}
EXPL = {
 'cuerpo': {'q': 'Escoge dos glándulas numeradas: di si son maestras o periféricas y qué hormonas producen.', 'model': 'Ejemplo: el hipotálamo y la hipófisis son maestras (hormonas liberadoras; hormonas estimulantes como TSH, ACTH, FSH, LH, GH y prolactina). La tiroides es periférica (T4, T3 y calcitonina); el páncreas es periférico y mixto (insulina y glucagón); las suprarrenales (adrenalina, noradrenalina, cortisol, aldosterona).', 'k': ['maestra|periferica', 'hormona|tsh|insulina|tiroxina|cortisol|melatonina'], 'pts': 3},
 'eje': {'q': 'Explica los dos mecanismos con los que el hipotálamo controla a la hipófisis y qué hormonas pasan por cada uno.', 'model': 'Sistema porta hipofisario: capilares que llevan las hormonas liberadoras (GnRH, TRH, CRH, GHRH) a la adenohipófisis, que libera las hormonas estimulantes. Tracto hipotalamohipofisario: axones que llevan las neurohormonas (oxitocina y ADH) a la neurohipófisis, donde se almacenan y se liberan.', 'k': ['porta', 'capilar|liberadora', 'adenohipofisis', 'tracto|axon', 'oxitocina|adh', 'neurohipofisis'], 'pts': 4},
 'tiro': {'q': 'Explica qué hormonas producen la tiroides y las paratiroides, sus órganos diana y cómo regulan el calcio.', 'model': 'La tiroides produce T4 (4 yodos) y T3 (3 yodos) que actúan en todos los órganos (metabolismo, crecimiento, sistema nervioso) y calcitonina, que actúa en el tejido óseo. Las paratiroides producen paratohormona, que actúa en riñones y huesos. Calcitonina y paratohormona son antagonistas y regulan el calcio en la sangre.', 'k': ['t4|tiroxina', 't3', 'calcitonina', 'paratohormona', 'riñon|hueso|oseo', 'antagon|calcio'], 'pts': 4},
 'supra': {'q': 'Explica qué produce cada zona numerada de la glándula y para qué sirve.', 'model': 'La médula (interna) produce adrenalina (acción excitante, actividad muscular en emergencias) y noradrenalina (acción relajante), que actúan en el sistema nervioso vegetativo. La corteza (externa) produce cortisol (metabolismo de las grasas, tejido adiposo) y aldosterona (sodio y potasio en sangre y riñones); está regulada por la ACTH de la hipófisis.', 'k': ['medula', 'adrenalina', 'corteza', 'cortisol', 'aldosterona', 'acth|hipofisis'], 'pts': 4},
 'panc': {'q': 'Explica por qué el páncreas es una glándula mixta y cómo sus células regulan la glucosa.', 'model': 'Es mixto: los acinos producen jugo pancreático que sale por el conducto al duodeno (exocrino) y los islotes de Langerhans vierten hormonas a la sangre por los capilares (endocrino). Las células beta producen insulina, que baja la glucosa metiéndola a los músculos; las células alfa producen glucagón, que la sube degradando el glucógeno del hígado.', 'k': ['exocrin|jugo', 'endocrin|langerhans', 'beta', 'insulina', 'alfa', 'glucagon'], 'pts': 4}}
for k in P:
    SIM_IMG[k] = {'title': TITLES[k], 'src': f'#anat-{k} svg', 'parts': [[v['n'], v['a'][0], v['a'][1], KEYW[kk]] for kk, v in P[k].items()], 'pick': min(6, len(P[k])), 'explain': EXPL[k]}
LBL = {k: {v['n']: v['l'] for v in P[k].values()} for k in P}
sim = rd('sim.js') + '\n/* partes para las imágenes */\nconst SIM_IMG=' + json.dumps(SIM_IMG, ensure_ascii=False) + ';\n\n'
region('/* ---------- simulacro de examen ---------- */\nconst SIM={', '(function(){\nconst sheet=document.getElementById', sim)
region("const LBL={", "function rng(seed)", "const LBL=" + json.dumps(LBL, ensure_ascii=False) + ";\n")
s = re.sub(r"ex\.imgs=shufR\(\[.*?explain:d\.explain\}\}\);", "ex.imgs=shufR(['cuerpo','eje','tiro','supra','panc'],r).slice(0,3).map(k=>{const d=SIM_IMG[k];const parts=shufR(d.parts,r).slice(0,d.pick).map(p=>[p[0],p[3],p[1],p[2]]);return {k,title:d.title,parts,explain:d.explain}});", s, count=1, flags=re.S)
region('function imgHTML(im){', '/* ---------- pintar el examen', "function imgHTML(im){const s=cloneSvg('#anat-'+im.k+' svg');if(!s)return '';s.querySelectorAll('.part').forEach(e=>e.classList.remove('part','hot','ok','bad'));return marks(s,im.k,im.parts).outerHTML}\n\n")
rep('Sistema Reproductor · Simulacro #', 'Sistema Endocrino · Simulacro #')
rep('<h4><span>V</span>Desarrollo: hombre y mujer</h4><p class="sim-inst">Responde comparando anatomía y fisiología de ambos sistemas.</p>', '<h4><span>V</span>Desarrollo: relación entre sistemas</h4><p class="sim-inst">Explica la relación anatómica (dónde se conectan) y fisiológica (cómo trabajan juntos), como en el examen de la profe.</p>')
# Daypo
region("const C={ink:'#45403F'", '/* ---------- datos y estado', rd('daypo.js') + '\n')
# paleta
rep('<script>\nconst RM=', "<script>\ndocument.body.classList.add('paleta-lavanda');\nconst RM=")
s = s.rstrip() + '\n<script>\n' + open(SK + 'rendimiento.js', encoding='utf8').read() + '</script>\n'
open(os.path.join(D, 'sistema-endocrino.html'), 'w', encoding='utf8').write(s)
print('ok', len(s) // 1024, 'KB')
