"""Genera la página de inicio que reúne todas las páginas de estudio.

Uso:
  python3 estudio/inicio/generar.py                      # regenera con lo que hay en paginas.json
  python3 estudio/inicio/generar.py --agregar estudio/sistema-x https://sistema-x.vercel.app

Todo lo demás se detecta solo leyendo la carpeta de cada página: título, temas (menú),
número de preguntas, mascotas (mascotas/*_idle.webp), paleta de colores y guía PDF.
"""
import json, os, re, shutil, sys, html as H
AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(AQUI, '..', '..'))
CSS_PALETAS = os.path.join(REPO, '.claude/skills/pagina-de-estudio/plantilla/temas-visuales.css')
LISTA = os.path.join(AQUI, 'paginas.json')

paginas = json.load(open(LISTA, encoding='utf8')) if os.path.exists(LISTA) else []
if len(sys.argv) >= 4 and sys.argv[1] == '--agregar':
    carpeta, url = sys.argv[2].rstrip('/'), sys.argv[3].rstrip('/')
    carpeta = os.path.relpath(os.path.abspath(carpeta), REPO)
    paginas = [p for p in paginas if p['carpeta'] != carpeta] + [{'carpeta': carpeta, 'url': url}]
    json.dump(paginas, open(LISTA, 'w', encoding='utf8'), ensure_ascii=False, indent=2)

def paleta(nombre):
    """Lee los colores de la paleta desde temas-visuales.css (durazno = colores base)."""
    base = {'desk': '#F7F6F2', 'coral': '#E07A5F', 'blue': '#5E958A', 'hl': '#FFDCCF', 'hl2': '#D4EFE2', 'ink': '#45403F', 'margin': '#F6C9C0'}
    if nombre and os.path.exists(CSS_PALETAS):
        css = open(CSS_PALETAS, encoding='utf8').read()
        m = re.search(r'body\.paleta-' + nombre + r'\{(.*?)\}', css, re.S)
        if m:
            for k in base:
                v = re.search(r'--' + k + r':(#[0-9A-Fa-f]{6})', m.group(1))
                if v: base[k] = v.group(1)
    return base

tarjetas = []
os.makedirs(os.path.join(AQUI, 'mascotas'), exist_ok=True)
for p in paginas:
    d = os.path.join(REPO, p['carpeta'])
    idx = open(os.path.join(d, 'index.html'), encoding='utf8').read()
    titulo = p.get('titulo') or H.unescape(re.search(r'<title>(.*?)</title>', idx).group(1)).split('·')[0].strip()
    temas = [H.unescape(re.sub('<[^>]+>', '', t)).replace('✓', '').strip() for t in re.findall(r'<a href="#[^"]+" data-sec="[^"]+">(.*?)</a>', idx)]
    banco = idx[idx.find('const BANK=['):]
    banco = banco[:banco.find('\n];')]
    npreg = len(re.findall(r'^\[\s*"', banco, re.M))
    pal = re.search(r"classList\.add\('paleta-(\w+)'\)", idx)
    col = paleta(pal.group(1) if pal else '')
    masc = sorted({f.split('_')[0] for f in os.listdir(os.path.join(d, 'mascotas')) if f.endswith('_idle.webp')}) if os.path.isdir(os.path.join(d, 'mascotas')) else []
    orden = re.findall(r'data-who="(\w+)"', idx[idx.find('id="stage-hero"'):])
    masc.sort(key=lambda m: orden.index(m) if m in orden else 99)
    for m in masc:
        shutil.copy(os.path.join(d, 'mascotas', f'{m}_idle.webp'), os.path.join(AQUI, 'mascotas', f'{m}_idle.webp'))
    pdf = os.path.exists(os.path.join(d, 'guia-de-estudio.pdf'))
    desc = re.search(r'<meta name="description" content="(.*?)"', idx)
    tarjetas.append({'id': os.path.basename(d), 'titulo': titulo, 'url': p['url'], 'temas': temas, 'npreg': npreg, 'col': col, 'masc': masc,
                     'pdf': pdf, 'desc': re.sub(r',?\s*by:.*$', '.', H.unescape(desc.group(1))).replace('..', '.') if desc else ''})

def tarjeta(t, i):
    c = t['col']
    partes = t['titulo'].split(' ', 1)
    tit = H.escape(partes[0]) + ('<br><em>' + H.escape(partes[1]) + '</em>' if len(partes) > 1 else '')
    chips = ''.join(f'<li>{H.escape(x)}</li>' for x in t['temas'][:7]) + (f'<li class="mas">+{len(t["temas"])-7}</li>' if len(t['temas']) > 7 else '')
    masc = ''.join(f'<figure><div class="m" style="background-image:url(mascotas/{m}_idle.webp);--d:{-k*.6}s" data-happy="{t["url"]}/mascotas/{m}_happy.webp" role="img" aria-label="{m.capitalize()}"></div><figcaption>{m.capitalize()}</figcaption></figure>' for k, m in enumerate(t['masc']))
    links = (f'<a href="{t["url"]}/#practica">Practicar</a><a href="{t["url"]}/#simulacro">Simulacro</a><a href="{t["url"]}/#test">Test</a>'
             + (f'<a href="{t["url"]}/guia-de-estudio.pdf" target="_blank" rel="noopener">Guía PDF</a>' if t['pdf'] else ''))
    return f'''<article class="card" data-id="{t['id']}" style="--c:{c['coral']};--c2:{c['blue']};--hl:{c['hl']};--hl2:{c['hl2']};--desk:{c['desk']};--mg:{c['margin']};--i:{i}">
  <a class="cover" href="{t['url']}/" aria-label="Abrir {H.escape(t['titulo'])}">
    <span class="tape"></span><span class="num">{i+1:02d}</span><span class="last" hidden>la última que abriste</span>
    <div class="stage">{masc}</div>
    <h2>{tit}</h2>
    <p class="desc">{H.escape(t['desc'])}</p>
    <ul class="temas">{chips}</ul>
    <div class="stats"><span><b>{len(t['temas'])}</b>temas</span><span><b>{t['npreg']}</b>preguntas</span>{'<span><b>PDF</b>guía</span>' if t['pdf'] else ''}</div>
    <span class="go">Abrir guía <i aria-hidden="true">→</i></span>
  </a>
  <nav class="quick" aria-label="Ir directo">{links}</nav>
</article>'''

total_p = sum(t['npreg'] for t in tarjetas)
PAGE = '''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Mis guías de Bio</title>
<meta name="description" content="Todas mis guías de estudio de biología en un solo lugar.">
<meta name="theme-color" content="#F7F5F1"><link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="iconos/icon-32.png"><link rel="apple-touch-icon" href="iconos/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Mis guías">
<meta property="og:title" content="Mis guías de Bio"><meta property="og:description" content="Todas mis guías de estudio en un solo lugar."><meta property="og:image" content="iconos/icon-512.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:wght@400;600;700;800&family=Gochi+Hand&display=swap">
<style>
:root{--bg:#F7F5F1;--page:#fff;--ink:#3F3A3D;--muted:#857E80;--line:#E7E2DC;--line2:#D9D1C9;--grid:#EFEDE6;
  --f-display:"Instrument Serif",Georgia,serif;--f-body:"Figtree",system-ui,-apple-system,"Segoe UI",sans-serif;--f-hand:"Gochi Hand","Comic Sans MS",cursive;color-scheme:light}
*{box-sizing:border-box}html,body{overflow-x:clip}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--f-body);font-size:16px;line-height:1.55;min-height:100vh;position:relative;isolation:isolate}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:-2;background:radial-gradient(circle at 8% 4%,#FFE6DA 0,transparent 32%),radial-gradient(circle at 94% 10%,#ECE3FC 0,transparent 34%),radial-gradient(circle at 60% 100%,#DDF3EA 0,transparent 40%)}
body::before{content:"";position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:26px 26px;opacity:.55;z-index:-1}
.wrap{max-width:1120px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 34px) max(16px,env(safe-area-inset-right,0px)) 40px max(16px,env(safe-area-inset-left,0px))}
header{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:end;margin-bottom:28px}
.eye{font-family:var(--f-hand);font-size:22px;color:#5E958A;transform:rotate(-2deg);display:inline-block}
h1{font-family:var(--f-display);font-weight:400;font-size:clamp(52px,9vw,104px);line-height:.9;margin:4px 0 10px;letter-spacing:-.02em}
h1 em{background:linear-gradient(90deg,#E07A5F,#7B5CC4 60%,#4E8F9C);-webkit-background-clip:text;background-clip:text;color:transparent}
h1 .w{display:inline-block;animation:rise .9s cubic-bezier(.2,.8,.2,1) both}h1 .w+.w{animation-delay:.1s}
@keyframes rise{from{transform:translateY(.3em) rotate(2deg);opacity:0}to{transform:none;opacity:1}}
.lede{color:var(--muted);max-width:52ch;margin:0;font-size:17px}.by{font-family:var(--f-hand);font-size:18px;color:var(--muted)}
.note{background:#FFF0B5;color:#5A4A16;padding:14px 18px;width:min(100%,250px);transform:rotate(2.5deg);box-shadow:0 12px 24px -14px rgba(0,0,0,.45);position:relative}
.note::before{content:"";position:absolute;top:-11px;left:50%;width:80px;height:22px;margin-left:-40px;background:rgba(94,149,138,.3);transform:rotate(-4deg)}
.note b{font-family:var(--f-display);font-weight:400;font-size:40px;line-height:1;display:block}.note span{font-size:14px}
@media (max-width:700px){header{grid-template-columns:1fr}.note{justify-self:start;transform:rotate(-1.5deg)}}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:26px}
.card{position:relative;animation:pop .7s cubic-bezier(.2,1.1,.3,1) both;animation-delay:calc(var(--i)*.09s + .15s)}
@keyframes pop{from{transform:translateY(18px) scale(.98);opacity:0}to{transform:none;opacity:1}}
.cover{display:flex;flex-direction:column;gap:10px;position:relative;text-decoration:none;color:inherit;background:var(--page);border-radius:6px 6px 26px 6px;padding:28px 26px 22px 44px;
  box-shadow:0 1px 2px rgba(80,60,60,.06),0 22px 40px -26px rgba(80,60,60,.45);border:1.5px solid var(--line);overflow:hidden;
  background-image:linear-gradient(90deg,transparent 24px,var(--mg) 24px,var(--mg) 26px,transparent 26px),linear-gradient(var(--desk) 1px,transparent 1px),linear-gradient(90deg,var(--desk) 1px,transparent 1px);background-size:100% 100%,22px 22px,22px 22px;
  transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s;will-change:transform;-webkit-tap-highlight-color:transparent}
.cover::after{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,var(--hl) 0,transparent 68%);opacity:.9;pointer-events:none}
@media (hover:hover){.cover:hover{transform:translateY(-6px) rotate(-.6deg);box-shadow:0 2px 4px rgba(80,60,60,.06),0 34px 50px -28px rgba(80,60,60,.55)}
  .cover:hover .go i{transform:translateX(5px)}}
.cover:active{transform:scale(.985)}
.cover:focus-visible{outline:3px solid var(--c);outline-offset:4px}
.tape{position:absolute;top:-8px;left:90px;width:110px;height:26px;background:var(--c);opacity:.3;transform:rotate(-3deg);background-image:repeating-linear-gradient(45deg,transparent 0 6px,rgba(255,255,255,.4) 6px 12px)}
.num{position:absolute;top:18px;right:22px;font-family:var(--f-hand);font-size:22px;color:var(--c);border:2.5px solid var(--c);border-radius:52% 46% 55% 44%/48% 55% 45% 52%;width:48px;height:42px;display:grid;place-items:center;transform:rotate(-6deg);z-index:1}
.last{position:absolute;top:66px;right:14px;font-family:var(--f-hand);font-size:15px;color:#fff;background:var(--c);padding:1px 10px;border-radius:999px;transform:rotate(4deg);z-index:1}
.stage{display:flex;gap:2px;align-items:flex-end;min-height:132px;position:relative;z-index:1}
.stage figure{margin:0;text-align:center}.stage figcaption{font-family:var(--f-hand);font-size:16px;color:var(--c);margin-top:-6px}
.m{--w:124px;width:var(--w);height:var(--w);background-repeat:no-repeat;background-size:calc(var(--w)*48) var(--w);animation:sprite 2s steps(48) infinite;animation-delay:var(--d)}
.m.happy{animation-duration:1.6s}
@keyframes sprite{from{background-position:0 0}to{background-position:calc(var(--w)*-48) 0}}
.paused .m{animation-play-state:paused}
h2{font-family:var(--f-display);font-weight:400;font-size:clamp(44px,6vw,60px);line-height:.9;margin:4px 0 0;letter-spacing:-.01em;position:relative;z-index:1}
h2 em{color:var(--c)}
.desc{margin:0;color:var(--muted);font-size:15px;max-width:46ch}
.temas{list-style:none;padding:0;margin:2px 0 0;display:flex;flex-wrap:wrap;gap:6px}
.temas li{font-size:12.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,var(--hl) 70%,#fff);color:color-mix(in srgb,var(--c) 80%,#000)}
.temas li:nth-child(even){background:color-mix(in srgb,var(--hl2) 75%,#fff);color:color-mix(in srgb,var(--c2) 80%,#000)}
.temas li.mas{background:#fff;border:1.5px dashed var(--line2);color:var(--muted)}
.stats{display:flex;gap:22px;margin-top:4px;font-size:13px;color:var(--muted)}.stats b{display:block;font-family:var(--f-display);font-weight:400;font-size:30px;color:var(--ink);line-height:1}
.go{align-self:flex-start;margin-top:6px;display:inline-flex;gap:10px;align-items:center;background:var(--c);color:#fff;font-weight:800;padding:11px 20px;border-radius:14px;
  box-shadow:0 3px 0 color-mix(in srgb,var(--c) 70%,#000)}.go i{font-style:normal;transition:transform .25s}
.quick{display:flex;flex-wrap:wrap;gap:8px;margin:12px 4px 0}
.quick a{font-size:13.5px;font-weight:700;text-decoration:none;color:var(--ink);background:var(--page);border:1.5px solid var(--line2);border-radius:999px;padding:6px 13px;box-shadow:0 2px 0 var(--line2);transition:transform .15s,border-color .15s}
.quick a:hover{transform:translateY(-2px);border-color:var(--c);color:var(--c)}
footer{text-align:center;color:var(--muted);margin-top:46px;font-size:14px}footer .hand{font-family:var(--f-hand);font-size:22px;color:#E07A5F}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
</style></head><body>
<div class="wrap">
<header>
  <div>
    <span class="eye">mi escritorio de estudio ~</span>
    <h1><span class="w">Mis guías</span><br><span class="w"><em>de Bio</em></span></h1>
    <p class="lede">Elige qué vas a estudiar hoy. Cada guía tiene resumen interactivo, dibujos para practicar, quiz, simulacro y test.</p>
    <p class="by">by: Jesús Fuentes</p>
  </div>
  <div class="note"><b>__NP__</b><span>preguntas para practicar en __NG__ guías. ¡Vamos por el 5!</span></div>
</header>
<main class="grid">
__CARDS__
</main>
<footer><span class="hand">¡tú puedes! ✿</span><br>Las guías nuevas aparecen aquí solas.</footer>
</div>
<script>
(function(){
  /* "la última que abriste" (solo en este navegador) */
  let last=null;try{last=localStorage.getItem('guias-last')}catch(e){}
  document.querySelectorAll('.card').forEach(c=>{if(c.dataset.id===last){const t=c.querySelector('.last');if(t)t.hidden=false}
    c.addEventListener('click',()=>{try{localStorage.setItem('guias-last',c.dataset.id)}catch(e){}})});
  /* mascotas: al pasar el mouse o tocar, bailan (la hoja "happy" se carga solo la primera vez) */
  const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.card').forEach(card=>{const ms=[...card.querySelectorAll('.m')];let busy=false;
    const party=()=>{if(RM||busy)return;busy=true;let n=0;ms.forEach(m=>{const i=new Image();i.src=m.dataset.happy;(i.decode?i.decode():Promise.resolve()).then(()=>{m.dataset.idle=m.dataset.idle||m.style.backgroundImage;m.style.backgroundImage=`url(${m.dataset.happy})`;m.classList.add('happy')}).catch(()=>{}).finally(()=>{if(++n===ms.length)setTimeout(()=>{ms.forEach(x=>{if(x.dataset.idle)x.style.backgroundImage=x.dataset.idle;x.classList.remove('happy')});busy=false},1700)})})};
    card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')party()});card.addEventListener('touchstart',party,{passive:true})});
  /* pausar las animaciones que no están en pantalla */
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('paused',!e.isIntersecting)));document.querySelectorAll('.stage').forEach(s=>io.observe(s))}
})();
</script>
</body></html>
'''
out = PAGE.replace('__CARDS__', '\n'.join(tarjeta(t, i) for i, t in enumerate(tarjetas))).replace('__NP__', str(total_p)).replace('__NG__', str(len(tarjetas)))
open(os.path.join(AQUI, 'index.html'), 'w', encoding='utf8').write(out)
print('ok:', ', '.join(f"{t['titulo']} ({len(t['temas'])} temas, {t['npreg']} preguntas, {'/'.join(t['masc'])})" for t in tarjetas))
