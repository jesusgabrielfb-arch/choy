"""Crea un cubo rojo en Blender.

Uso:
  - Dentro de Blender: abre la pestaña Scripting, carga este archivo y pulsa "Run Script".
  - Desde la terminal: blender --background --python blender/cubo_rojo.py
    (guarda cubo_rojo.blend y un render cubo_rojo.png junto a este script).
"""
import os
import bpy

# Escena limpia
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

# Cubo
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cubo = bpy.context.active_object
cubo.name = "CuboRojo"

# Material rojo
mat = bpy.data.materials.new(name="Rojo")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (1.0, 0.0, 0.0, 1.0)
bsdf.inputs["Roughness"].default_value = 0.4
mat.diffuse_color = (1.0, 0.0, 0.0, 1.0)  # color en la vista Solid
cubo.data.materials.append(mat)

# Cámara y luz
bpy.ops.object.camera_add(location=(6, -6, 4.5), rotation=(1.1, 0, 0.785))
bpy.context.scene.camera = bpy.context.active_object
bpy.ops.object.light_add(type="SUN", location=(4, -2, 6))
bpy.context.active_object.data.energy = 4

# Guardar y renderizar solo cuando se ejecuta sin interfaz
if bpy.app.background:
    out_dir = os.path.dirname(os.path.abspath(__file__))
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in {
        e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items
    } else "CYCLES"
    if scene.render.engine == "CYCLES":
        scene.cycles.samples = 32
    scene.render.resolution_x = 800
    scene.render.resolution_y = 600
    scene.render.filepath = os.path.join(out_dir, "cubo_rojo.png")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, "cubo_rojo.blend"))
    bpy.ops.render.render(write_still=True)
