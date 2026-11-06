"""Convierte los frames PNG en hojas de sprites WebP (24 frames en fila)."""
import os, sys, glob
from PIL import Image

OUT = sys.argv[1]
DEST = sys.argv[2]
SIZE = 200
os.makedirs(DEST, exist_ok=True)
for char in ('spermi', 'ovulina'):
    for anim in ('idle', 'happy', 'sad', 'dance', 'spin', 'love', 'angry'):
        frames = sorted(glob.glob(os.path.join(OUT, f"{char}_{anim}", "f_*.png")))
        assert len(frames) == 48, (char, anim, len(frames))
        sheet = Image.new('RGBA', (SIZE * len(frames), SIZE), (0, 0, 0, 0))
        for i, fp in enumerate(frames):
            im = Image.open(fp).convert('RGBA').resize((SIZE, SIZE), Image.LANCZOS)
            sheet.paste(im, (i * SIZE, 0))
        path = os.path.join(DEST, f"{char}_{anim}.webp")
        sheet.save(path, 'WEBP', quality=82, method=6, alpha_quality=90)
        print(path, os.path.getsize(path) // 1024, 'KB')
