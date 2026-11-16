"""Convierte una fuente variable de Google Fonts en TTF estáticos (evita fuentes Type 3 en el PDF).
Uso: python3 fuentes_estaticas.py <fuente-variable.woff2> <prefijo-salida> 400 600 700 800
     (pip install fonttools brotli)
Descarga el .woff2 "latin" desde fonts.googleapis.com/css2?family=... con un User-Agent de Chrome.
Ya hay Figtree estática lista en ../plantilla/fuentes/.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
src, pre, *ws = sys.argv[1:]
for w in ws:
    f = TTFont(src)
    if 'fvar' in f:
        f = instancer.instantiateVariableFont(f, {'wght': int(w)}, updateFontNames=False)
    f.flavor = None
    f.save(f'{pre}-{w}.ttf'); print(f'{pre}-{w}.ttf')
