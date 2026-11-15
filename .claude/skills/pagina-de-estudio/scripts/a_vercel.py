"""Convierte la página del artefacto (sin doctype) en un index.html completo para Vercel.

Uso:
  python3 a_vercel.py <pagina-artefacto.html> <index.html> \
      --nombre "Reproductor" --titulo "Sistema Reproductor" \
      --descripcion "Resumen, práctica, simulacro y test de ..." \
      --url https://mi-proyecto.vercel.app [--pdf guia-de-estudio.pdf]

- Agrega doctype, metas, íconos (iconos/icon-*.png), manifest y Open Graph.
- Si se pasa --pdf, agrega el botón "Abrir guía PDF" junto al botón del quiz del hero
  (busca el enlace <a class="btn" href="#practica">…</a>).
"""
import argparse
ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--nombre', required=True, help='nombre corto en la pantalla de inicio')
ap.add_argument('--titulo', required=True)
ap.add_argument('--descripcion', required=True)
ap.add_argument('--url', required=True)
ap.add_argument('--pdf', default='')
a = ap.parse_args()
s = open(a.src, encoding='utf-8').read()
i = s.index('</style>') + len('</style>')
head = s[:i].replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
body = s[i:]
if a.pdf:
    import re
    m = re.search(r'<a class="btn" href="#practica">[^<]*</a>', body)
    assert m, 'no encontré el botón del hero que lleva a #practica'
    body = body.replace(m.group(0), m.group(0) + f'\n          <a class="btn" href="{a.pdf}" target="_blank" rel="noopener">Abrir guía PDF</a>', 1)
out = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{a.descripcion}">
<meta name="theme-color" content="#F7F6F2">
<link rel="icon" type="image/svg+xml" href="iconos/icon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="iconos/icon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="iconos/icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="{a.nombre}">
<meta name="application-name" content="{a.nombre}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta property="og:title" content="{a.titulo}">
<meta property="og:description" content="{a.descripcion}">
<meta property="og:image" content="{a.url.rstrip('/')}/iconos/icon-512.png">
<style>body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
''' + head + '\n</head>\n<body>' + body + '\n</body>\n</html>\n'
open(a.dst, 'w', encoding='utf-8').write(out)
import json, os
man = {"name": a.nombre, "short_name": a.nombre, "start_url": "./", "scope": "./", "display": "standalone",
       "background_color": "#F7F6F2", "theme_color": "#F7F6F2",
       "icons": [{"src": "iconos/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
                 {"src": "iconos/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
                 {"src": "iconos/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
json.dump(man, open(os.path.join(os.path.dirname(os.path.abspath(a.dst)), 'manifest.webmanifest'), 'w'), ensure_ascii=False, indent=2)
print('ok', len(out))
