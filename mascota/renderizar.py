"""Renderiza vistas y expresiones de la mascota para revisarla.

Uso:
    python mascota/renderizar.py -- mascota/salida/mascota.blend mascota/salida
"""

import os
import sys

import bpy  # noqa: I001
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
BLEND, SALIDA = args[0], args[1]
MUESTRAS = int(args[2]) if len(args) > 2 else 48
os.makedirs(SALIDA, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.abspath(BLEND))
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = MUESTRAS
sc.cycles.use_denoising = True
sc.render.resolution_x = 640
sc.render.resolution_y = 720
sc.render.film_transparent = False
sc.view_settings.view_transform = "Standard"

cam = sc.camera
arm = bpy.data.objects["Esqueleto"]


def apuntar(pos, objetivo=(0, 0, 1.12)):
    cam.location = pos
    cam.rotation_euler = (Vector(objetivo) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()


def render(nombre, accion, frame, pos):
    arm.animation_data.action = bpy.data.actions[accion]
    sc.frame_set(frame)
    apuntar(pos)
    sc.render.filepath = os.path.join(os.path.abspath(SALIDA), nombre + ".png")
    bpy.ops.render.render(write_still=True)


FRENTE = (0.0, -7.0, 1.4)
TRES_CUARTOS = (3.0, -6.3, 1.6)
vistas = args[3:] if len(args) > 3 else None
trabajos = [
    ("vista_34", "Reposo", 0, TRES_CUARTOS),
    ("vista_frente", "Reposo", 0, FRENTE),
    ("vista_lado", "Reposo", 0, (7.0, 0.0, 1.4)),
    ("vista_espalda", "Reposo", 0, (0.0, 7.0, 1.4)),
    ("cara_feliz", "Feliz", 6, FRENTE),
    ("cara_triste", "Triste", 10, FRENTE),
    ("cara_enojado", "Enojado", 4, FRENTE),
    ("cara_sorpresa", "Sorpresa", 14, FRENTE),
    ("cara_cool", "Cool", 10, FRENTE),
    ("cara_hablar", "Hablar", 4, FRENTE),
    ("pose_celebrar", "Celebrar", 16, TRES_CUARTOS),
    ("pose_arrastrarse", "Arrastrarse", 8, (7.0, -1.8, 1.2)),
]
if vistas:
    trabajos = [t for t in trabajos if t[0] in vistas]
for t in trabajos:
    render(*t)
