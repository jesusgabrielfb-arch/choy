"""Optimiza el PDF para la web (vista rápida: la primera página aparece mientras baja el resto).
Uso: python3 optimizar_pdf.py <entrada.pdf> <salida.pdf>     (pip install pikepdf)
Revisa también: pdffonts salida.pdf  → no debe haber fuentes "Type 3".
"""
import sys, os, pikepdf
pdf = pikepdf.open(sys.argv[1])
pdf.save(sys.argv[2], linearize=True, object_stream_mode=pikepdf.ObjectStreamMode.generate,
         compress_streams=True, recompress_flate=True)
print(os.path.getsize(sys.argv[2]) // 1024, 'KB')
