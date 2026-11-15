"""Modela, anima y renderiza a Spermi y Ovulina con Blender (bpy).
Uso: python build.py <spermi|ovulina> <outdir> [preview]
Genera PNG con transparencia por animación: idle, happy, sad.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector

CHAR = sys.argv[1]
OUT = sys.argv[2]
PREVIEW = len(sys.argv) > 3 and sys.argv[3] == 'preview'
FR = 48          # frames por animación (24 fps)
RES = 300

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- materiales ----------
def mat(name, rgb, rough=0.4, coat=0.0, sss=0.0, emit=0.0, bump=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*rgb, 1)
    p.inputs["Roughness"].default_value = rough
    for key, val in (("Coat Weight", coat), ("Subsurface Weight", sss)):
        if key in p.inputs:
            p.inputs[key].default_value = val
    if sss and "Subsurface Radius" in p.inputs:
        p.inputs["Subsurface Radius"].default_value = (0.4, 0.2, 0.2)
    if emit:
        p.inputs["Emission Color"].default_value = (*rgb, 1)
        p.inputs["Emission Strength"].default_value = emit
    if bump:
        tex = nt.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = bump[0]
        tex.inputs["Detail"].default_value = 6
        b = nt.nodes.new("ShaderNodeBump")
        b.inputs["Strength"].default_value = bump[1]
        nt.links.new(tex.outputs["Fac"], b.inputs["Height"])
        nt.links.new(b.outputs["Normal"], p.inputs["Normal"])
    return m

def smooth(o):
    for f in o.data.polygons:
        f.use_smooth = True

def ellipsoid(name, loc, radii, material, parent=None, seg=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = radii
    smooth(o)
    o.data.materials.append(material)
    if parent:
        set_parent(o, parent)
    return o

def cylinder(name, loc, r, depth, material, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=r, depth=depth, location=loc)
    o = bpy.context.active_object
    o.name = name
    smooth(o)
    o.data.materials.append(material)
    if parent:
        set_parent(o, parent)
    return o

def empty(name, loc, parent=None):
    o = bpy.data.objects.new(name, None)
    scene.collection.objects.link(o)
    o.location = loc
    if parent:
        set_parent(o, parent)
    return o

def set_parent(o, parent):
    # mantiene la posición en el mundo
    bpy.context.view_layer.update()
    mw = o.matrix_world.copy()
    o.parent = parent
    o.matrix_parent_inverse = parent.matrix_world.inverted()
    o.matrix_world = mw

def update():
    bpy.context.view_layer.update()

# ---------- superficie de la cabeza (elipsoide) ----------
class Head:
    def __init__(self, c, r):
        self.c, self.r = Vector(c), Vector(r)
    def y(self, x, z, off=0.0):
        a, b, cz = self.r
        dx, dz = (x - self.c.x) / a, (z - self.c.z) / cz
        v = max(0.0, 1 - dx * dx - dz * dz)
        return self.c.y - b * math.sqrt(v) - off

def strip_mesh(name, head, top, bot, material, off, parent):
    """Cara curva entre dos líneas (top/bot = listas de (x,z)) pegada a la cabeza."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vt = [bm.verts.new((x, head.y(x, z, off), z)) for x, z in top]
    vb = [bm.verts.new((x, head.y(x, z, off), z)) for x, z in bot]
    for i in range(len(top) - 1):
        bm.faces.new((vt[i], vt[i + 1], vb[i + 1], vb[i]))
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    smooth(o)
    o.data.materials.append(material)
    set_parent(o, parent)
    return o

def arc(w, zc, h0, h1, n=16, curve=0.0):
    """Puntos (x,z) de x=-w..w con z = zc + h(x)."""
    pts = []
    for i in range(n + 1):
        t = i / n
        x = -w + 2 * w * t
        s = math.sqrt(max(0.0, 1 - (x / w) ** 2))
        pts.append((x, zc + h0 * s + h1 + curve * (x / w) ** 2))
    return pts

# ---------- personaje ----------
M_INK = mat("ink", (0.05, 0.035, 0.04), 0.5)
M_WHITE_EYE = mat("eyewhite", (0.97, 0.97, 0.98), 0.15, coat=0.6)
M_IRIS = mat("iris", (0.17, 0.07, 0.02), 0.2, coat=1.0)
M_PUPIL = mat("pupil", (0.01, 0.01, 0.01), 0.15, coat=1.0)
M_SHINE = mat("shine", (1, 1, 1), 0.1, emit=6)
M_MOUTH = mat("mouth", (0.32, 0.05, 0.07), 0.5)
M_TONGUE = mat("tongue", (0.95, 0.42, 0.45), 0.4)
M_GLOVE = mat("glove", (0.97, 0.97, 0.97), 0.6)
M_TEAR = mat("tear", (0.45, 0.75, 1.0), 0.05, coat=1.0, emit=0.4)

C = {}  # controles
root = empty("root", (0, 0, 0))
C['root'] = root

if CHAR == 'spermi':
    BODY = mat("spermi", (0.74, 0.77, 1.0), 0.28, coat=0.8, sss=0.08)
    SHOE = mat("shoe", (0.97, 0.97, 0.97), 0.45)
    SHOE2 = mat("shoe2", (0.12, 0.16, 0.36), 0.45)
    H = Head((0, 0, 1.8), (0.6, 0.52, 0.7))
    ellipsoid("head", H.c, H.r, BODY, root)
    ellipsoid("body", (0, 0, 0.98), (0.27, 0.23, 0.42), BODY, root)
    ex, ez, er = 0.23, 1.9, (0.2, 0.1, 0.25)
    brow_z, mouth_z, mouth_w = 2.23, 1.53, 0.2
    shoulder = (0.26, -0.04, 1.16); arm_len = 0.5; arm_r = 0.055; glove_r = 0.1
    hip_x, hip_z, leg_r = 0.13, 0.64, 0.065
    for s in (-1, 1):
        cylinder(f"leg{s}", (s * hip_x, 0, (hip_z + 0.18) / 2), leg_r, hip_z - 0.18, BODY, root)
        ellipsoid(f"shoe{s}", (s * 0.15, -0.07, 0.12), (0.14, 0.22, 0.1), SHOE, root)
        ellipsoid(f"shoetop{s}", (s * 0.15, -0.03, 0.18), (0.115, 0.16, 0.075), SHOE2, root)
    # cola
    cu = bpy.data.curves.new("tailc", 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 0.075
    cu.bevel_resolution = 6
    sp = cu.splines.new('NURBS')
    NT = 10
    sp.points.add(NT - 1)
    sp.order_u = 4
    sp.use_endpoint_u = True
    tail = bpy.data.objects.new("tail", cu)
    scene.collection.objects.link(tail)
    tail.data.materials.append(BODY)
    tail.parent = root
    C['tail'] = sp
else:
    BODY = mat("ovulina", (0.93, 0.2, 0.42), 0.6, sss=0.08, bump=(22, 0.7))
    SHOE = mat("shoe", (0.97, 0.38, 0.6), 0.45)
    SOLE = mat("sole", (0.98, 0.97, 0.97), 0.5)
    BOW = mat("bow", (0.98, 0.18, 0.56), 0.3, coat=0.6)
    BLUSH = mat("blush", (1.0, 0.45, 0.55), 0.6)
    H = Head((0, 0, 1.3), (0.82, 0.76, 0.82))
    ellipsoid("body", H.c, H.r, BODY, root, seg=96)
    ex, ez, er = 0.31, 1.45, (0.25, 0.11, 0.29)
    brow_z, mouth_z, mouth_w = 1.85, 1.04, 0.22
    shoulder = (0.74, 0, 1.12); arm_len = 0.4; arm_r = 0.05; glove_r = 0.11
    hip_x, hip_z, leg_r = 0.26, 0.58, 0.06
    for s in (-1, 1):
        cylinder(f"leg{s}", (s * hip_x, 0, (hip_z + 0.17) / 2), leg_r, hip_z - 0.17, BODY, root)
        ellipsoid(f"shoe{s}", (s * 0.28, -0.08, 0.15), (0.14, 0.21, 0.1), SHOE, root)
        ellipsoid(f"sole{s}", (s * 0.28, -0.08, 0.07), (0.15, 0.22, 0.05), SOLE, root)
    # moño
    BX, BY, BZ = 0.3, -0.34, 2.02
    bow = empty("bow", (BX, BY, BZ), root)
    for s in (-1, 1):
        o = ellipsoid(f"loop{s}", (BX + s * 0.22, BY + 0.02, BZ), (0.24, 0.1, 0.16), BOW, bow)
        o.rotation_euler.y = s * 0.3
    ellipsoid("knot", (BX, BY - 0.04, BZ), (0.1, 0.09, 0.1), BOW, bow)
    bow.rotation_euler.y = -0.25
    C['bow'] = bow
    # cachetes
    for s in (-1, 1):
        strip_mesh(f"blush{s}", H, arc(0.1, 1.2, 0.045, 0, 10, 0), arc(0.1, 1.2, -0.045, 0, 10, 0), BLUSH, 0.005, root).location.x = s * 0.45

# ojos
for side, s in (('L', -1), ('R', 1)):
    x = s * ex
    ey = H.y(x, ez, -0.035)
    eye = empty(f"eye{side}", (x, ey, ez), root)
    ellipsoid(f"white{side}", (x, ey, ez), er, M_WHITE_EYE, eye)
    look = empty(f"look{side}", (x, ey, ez), eye)
    fy = ey - er[1]
    ellipsoid(f"iris{side}", (x, fy + 0.02, ez - 0.02), (er[0] * 0.74, 0.045, er[2] * 0.7), M_IRIS, look)
    ellipsoid(f"pupil{side}", (x, fy + 0.0, ez - 0.02), (er[0] * 0.44, 0.035, er[2] * 0.42), M_PUPIL, look)
    ellipsoid(f"shine{side}", (x + 0.05, fy - 0.03, ez + 0.05), (0.042, 0.02, 0.045), M_SHINE, look)
    ellipsoid(f"shine2{side}", (x - 0.03, fy - 0.02, ez - 0.06), (0.014, 0.01, 0.014), M_SHINE, look)
    C['eye' + side], C['look' + side] = eye, look
    # cejas
    bz = brow_z
    brow = empty(f"brow{side}", (x, H.y(x, bz, 0.0), bz), root)
    ellipsoid(f"browm{side}", (x, H.y(x, bz, 0.0), bz), (er[0] * 0.8, 0.04, 0.036), M_INK, brow)
    C['brow' + side] = brow
    if CHAR == 'ovulina':
        for k in range(3):
            ang = 0.5 + k * 0.42
            lx = x + s * er[0] * math.cos(ang) * 0.95
            lz = ez + er[2] * math.sin(ang) * 0.95
            o = ellipsoid(f"lash{side}{k}", (lx + s * 0.03, H.y(lx, lz, 0.02), lz + 0.03), (0.055, 0.015, 0.018), M_INK, eye)
            o.rotation_euler.y = -s * (ang + 0.3)

# lentes de sol (solo Spermi)
if CHAR == 'spermi':
    GLASS = mat("glass", (0.004, 0.004, 0.008), 0.22, coat=0.25)
    gp = GLASS.node_tree.nodes.get("Principled BSDF")
    gp.inputs["Alpha"].default_value = 1.0
    for key, val in (("Specular IOR Level", 0.0), ("Coat Weight", 0.0)):
        if key in gp.inputs: gp.inputs[key].default_value = val
    SHINE2 = mat("lensshine", (1, 1, 1), 0.2, emit=1.2)
    FRAME = mat("frame", (0.04, 0.04, 0.05), 0.25, coat=0.8)
    gy = H.y(ex, ez, -0.035) - er[1] - 0.09
    gl = empty("glasses", (0, gy, ez), root)

    def lens_outline(cx, s, n=10):
        """Trapecio redondeado estilo wayfarer: más ancho arriba."""
        wt, wb, h, rad = 0.27, 0.21, 0.3, 0.07
        top, bot = ez + h * 0.48, ez - h * 0.52
        corners = [(cx - wt + rad, top - rad, 90, 180), (cx - wb + rad, bot + rad, 180, 270),
                   (cx + wb - rad, bot + rad, 270, 360), (cx + wt - rad, top - rad, 0, 90)]
        pts = []
        for x0, z0, a0, a1 in corners:
            for i in range(n + 1):
                t = math.radians(a0 + (a1 - a0) * i / n)
                pts.append((x0 + rad * math.cos(t), z0 + rad * math.sin(t)))
        return pts

    for s in (-1, 1):
        x = s * (ex + 0.02)
        pts = lens_outline(x, s)
        # cristal
        me = bpy.data.meshes.new(f"lens{s}")
        bm = bmesh.new()
        vs = [bm.verts.new((px, gy, pz)) for px, pz in pts]
        bm.faces.new(vs)
        bm.to_mesh(me); bm.free()
        lens = bpy.data.objects.new(f"lens{s}", me)
        scene.collection.objects.link(lens)
        lens.data.materials.append(GLASS)
        sol = lens.modifiers.new("sol", 'SOLIDIFY'); sol.thickness = 0.02
        set_parent(lens, gl)
        # brillo diagonal en el cristal
        for k, (w, off) in enumerate(((0.035, -0.05), (0.016, 0.04))):
            me2 = bpy.data.meshes.new(f"sh{s}{k}")
            bm2 = bmesh.new()
            c0 = x + off
            q = [(c0 - 0.11, ez - 0.12), (c0 - 0.11 + w, ez - 0.12), (c0 + 0.08 + w, ez + 0.1), (c0 + 0.08, ez + 0.1)]
            bm2.faces.new([bm2.verts.new((px, gy - 0.012, pz)) for px, pz in q])
            bm2.to_mesh(me2); bm2.free()
            o2 = bpy.data.objects.new(f"sh{s}{k}", me2)
            scene.collection.objects.link(o2)
            o2.data.materials.append(SHINE2)
            set_parent(o2, gl)
        # marco
        cu = bpy.data.curves.new(f"frame{s}", 'CURVE')
        cu.dimensions = '3D'; cu.bevel_depth = 0.032; cu.bevel_resolution = 4
        sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1); sp.use_cyclic_u = True
        for i, (px, pz) in enumerate(pts):
            sp.points[i].co = (px, gy - 0.01, pz, 1)
        fr = bpy.data.objects.new(f"frame{s}", cu)
        scene.collection.objects.link(fr)
        fr.data.materials.append(FRAME)
        set_parent(fr, gl)
        # patilla
        cylinder(f"temple{s}", (s * (ex + 0.31), gy + 0.2, ez + 0.1), 0.024, 0.42, FRAME, gl).rotation_euler.x = math.pi / 2
    # barra superior gruesa y puente
    bar = ellipsoid("topbar", (0, gy - 0.01, ez + 0.135), (2 * ex * 0.5 + 0.3, 0.035, 0.045), FRAME, gl)
    br = cylinder("bridge", (0, gy - 0.01, ez + 0.06), 0.026, 2 * ex - 0.4, FRAME, gl)
    br.rotation_euler.y = math.pi / 2
    C['glasses'], C['glasses_z'] = gl, gl.location.z

# bocas
mz, mw = mouth_z, mouth_w
mouths = {}
top = [(x, z) for x, z in arc(mw, mz, 0, 0, 18, 0.03)]
bot = [(x, z) for x, z in arc(mw, mz, -0.2, 0, 18, 0.03)]
mouths['happy'] = strip_mesh("m_happy", H, top, bot, M_MOUTH, 0.012, root)
tong_top = arc(mw * 0.6, mz - 0.1, 0.03, 0, 12)
tong_bot = arc(mw * 0.6, mz - 0.1, -0.055, 0, 12)
tong = strip_mesh("m_tongue", H, tong_top, tong_bot, M_TONGUE, 0.02, root)
mouths['smile'] = strip_mesh("m_smile", H, arc(mw * 0.75, mz + 0.01, -0.03, 0, 16), arc(mw * 0.75, mz + 0.01, -0.1, 0, 16), M_MOUTH, 0.012, root)
mouths['sad'] = strip_mesh("m_sad", H, arc(mw * 0.62, mz - 0.1, 0.09, 0, 16), arc(mw * 0.62, mz - 0.1, 0.035, 0, 16), M_MOUTH, 0.012, root)
mouths['angry'] = strip_mesh("m_angry", H, arc(mw * 0.7, mz - 0.04, 0, 0, 16, -0.04), arc(mw * 0.7, mz - 0.13, 0, 0, 16, -0.03), M_MOUTH, 0.012, root)
M_TEETH = mat("teeth", (0.98, 0.98, 0.96), 0.3)
teeth = strip_mesh("m_teeth", H, arc(mw * 0.62, mz - 0.065, 0, 0, 16, -0.038), arc(mw * 0.62, mz - 0.1, 0, 0, 16, -0.032), M_TEETH, 0.02, root)
C['mouths'], C['tongue'], C['teeth'] = mouths, tong, teeth
# ojos de corazón (enamorado)
M_HEART = mat("heart", (0.95, 0.05, 0.15), 0.25, coat=0.8, emit=0.3)
C['hearts'] = []
for side, s in (('L', -1), ('R', 1)):
    x = s * ex
    hy = H.y(x, ez, -0.035) - er[1] - 0.05
    if CHAR == 'spermi':
        hy = gy - 0.05
    me = bpy.data.meshes.new(f"heart{side}")
    bm = bmesh.new()
    sc = er[0] * (0.088 if CHAR == 'spermi' else 0.075)
    vs = []
    for i in range(48):
        t = i / 48 * 2 * math.pi
        hx = 16 * math.sin(t) ** 3
        hz = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        vs.append(bm.verts.new((hx * sc, 0, hz * sc)))
    bm.faces.new(vs)
    bm.to_mesh(me); bm.free()
    hobj = bpy.data.objects.new(f"heart{side}", me)
    scene.collection.objects.link(hobj)
    hobj.location = (x, hy, ez + 0.02)
    hobj.data.materials.append(M_HEART)
    sol = hobj.modifiers.new("sol", 'SOLIDIFY'); sol.thickness = 0.05
    bev = hobj.modifiers.new("bev", 'BEVEL'); bev.width = 0.02; bev.segments = 3
    set_parent(hobj, root)
    C['hearts'].append(hobj)

# lágrima
tear = ellipsoid("tear", (-ex - 0.02, H.y(-ex - 0.02, ez - er[2] - 0.05, 0.03), ez - er[2] - 0.05), (0.04, 0.03, 0.055), M_TEAR, root)
C['tear'], C['tear_z'] = tear, tear.location.z

# brazos
for side, s in (('L', -1), ('R', 1)):
    sh = empty(f"arm{side}", (s * shoulder[0], shoulder[1], shoulder[2]), root)
    cylinder(f"armm{side}", (s * shoulder[0], 0, shoulder[2] - arm_len / 2), arm_r, arm_len, BODY, sh)
    ellipsoid(f"glove{side}", (s * shoulder[0], -0.02, shoulder[2] - arm_len - 0.03), (glove_r, glove_r * 0.8, glove_r), M_GLOVE, sh)
    ellipsoid(f"thumb{side}", (s * shoulder[0] - s * 0.07, -0.06, shoulder[2] - arm_len + 0.02), (0.045, 0.04, 0.06), M_GLOVE, sh)
    C['arm' + side] = sh

update()

# ---------- cámara y luces ----------
cam_d = bpy.data.cameras.new("cam")
cam_d.type = 'ORTHO'
cam = bpy.data.objects.new("cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
cam.rotation_euler = (math.radians(86), 0, math.radians(-12))
if CHAR == 'spermi':
    cam_d.ortho_scale = 3.5
    target = Vector((-0.3, 0, 1.45))
else:
    cam_d.ortho_scale = 3.2
    target = Vector((0, 0, 1.4))
d = Vector((0, 0, 1))
d.rotate(cam.rotation_euler)
cam.location = target + d * 12

def light(name, loc, energy, size, color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy, ld.size, ld.color = energy, size, color
    o = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(o)
    o.location = loc
    dvec = Vector((0, 0, 1.3)) - Vector(loc)
    o.rotation_euler = dvec.to_track_quat('-Z', 'Y').to_euler()

light("key", (-4, -6, 6), 1100, 5, (1, 0.97, 0.94))
light("fill", (5, -5, 2.5), 320, 6, (0.92, 0.95, 1))
light("rim", (2.5, 6, 5), 1300, 4)
world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.9, 0.9, 0.95, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.22
scene.world = world

r = scene.render
r.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 12 if PREVIEW else 16
scene.cycles.use_denoising = True
r.film_transparent = True
r.resolution_x = r.resolution_y = RES
r.image_settings.file_format = 'PNG'
r.image_settings.color_mode = 'RGBA'
try:
    scene.view_settings.view_transform = 'Standard'
except Exception:
    pass

# ---------- animación ----------
ARM_REST = 0.45
RAISE = 1.5 if CHAR == "spermi" else 2.25
WAVE = 1.85 if CHAR == "spermi" else 2.35
def K(o, path, f, val, idx=None):
    attr = getattr(o, path)
    if idx is None:
        setattr(o, path, val)
    else:
        attr[idx] = val
    o.keyframe_insert(path, frame=f, index=-1 if idx is None else idx)

def clear():
    for o in scene.objects:
        o.animation_data_clear()
    if 'tail' in C:
        tail.data.animation_data_clear()

def set_mouth(name):
    for k, o in C['mouths'].items():
        o.hide_render = k != name
    C['tongue'].hide_render = name != 'happy'
    C['teeth'].hide_render = name != 'angry'

def tail_keys(f, amp, speed, droop=0.0):
    sp = C['tail']
    n = len(sp.points)
    for i, p in enumerate(sp.points):
        t = i / (n - 1)
        x = -0.18 - 1.15 * t
        y = 0.18 + 0.35 * t
        z = 0.82 - 0.3 * t - droop * t + amp * t * math.sin(speed * (f - 1) / FR * 2 * math.pi - 2.6 * t * math.pi)
        p.co = (x, y, z, 1)
        p.radius = 1.0 - 0.8 * t
        p.keyframe_insert('co', frame=f)

C['brow_rest'] = {s: C['brow' + s].location.z for s in ('L', 'R')}
C['look_rest'] = {s: C['look' + s].location.z for s in ('L', 'R')}

def brows(f, lift=0.0, tilt=0.0):
    for side, s in (('L', -1), ('R', 1)):
        b = C['brow' + side]
        K(b, 'location', f, C['brow_rest'][side] + lift, 2)
        K(b, 'rotation_euler', f, s * tilt, 1)

def eyes(f, blink=1.0, look_z=0.0):
    for side in ('L', 'R'):
        K(C['eye' + side], 'scale', f, blink, 2)
        K(C['look' + side], 'location', f, C['look_rest'][side] + look_z, 2)

def arms(f, l, rr):
    K(C['armL'], 'rotation_euler', f, l, 1)
    K(C['armR'], 'rotation_euler', f, -rr, 1)

def body(f, z=0.0, sq=0.0, rx=0.0, rz=0.0, x=0.0, ry=0.0):
    K(root, 'location', f, (x, 0, z))
    K(root, 'scale', f, (1 + sq * 0.5, 1 + sq * 0.5, 1 - sq))
    K(root, 'rotation_euler', f, (rx, ry, rz + 0.12))

def tear_keys(f, vis, drop=0.0):
    C['tear'].hide_render = not vis
    C['tear'].keyframe_insert('hide_render', frame=f)
    K(C['tear'], 'location', f, C['tear_z'] - drop, 2)

def heart_keys(f, vis, sc=1.0):
    for h in C['hearts']:
        h.hide_render = not vis
        h.keyframe_insert('hide_render', frame=f)
        K(h, 'scale', f, (sc, sc, sc))

def extras(f, glasses=0.0, bow=0.0):
    if 'glasses' in C: K(C['glasses'], 'location', f, C['glasses_z'] + glasses, 2)
    if 'bow' in C: K(C['bow'], 'rotation_euler', f, -0.25 + bow, 1)

def smooth01(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)

def anim(name):
    clear()
    for f in range(1, FR + 1):
        g = 1 + (f - 1) * 24 / FR          # tiempo en "frames de 24" (para reutilizar tiempos)
        ph = (f - 1) / FR * 2 * math.pi
        tear_vis, hearts, hsc = False, False, 1.0
        if name == 'idle':
            body(f, 0.035 * math.sin(ph), 0.015 * math.sin(2 * ph))
            arms(f, ARM_REST + 0.1 * math.sin(ph), WAVE + 0.35 * math.sin(2 * ph))
            blink = 1.0 - 0.9 * max(0.0, 1 - abs(g - 18) / 1.6)
            eyes(f, blink, 0); brows(f)
            if 'tail' in C: tail_keys(f, 0.18, 1)
            extras(f, 0, 0.08 * math.sin(2 * ph))
        elif name == 'happy':
            keys = {1: (0, 0), 3: (-0.05, 0.12), 5: (-0.06, 0.14), 8: (0.35, -0.08), 11: (0.55, -0.04), 14: (0.5, 0), 17: (0.15, -0.05), 19: (0, 0.15), 21: (0, -0.04), 25: (0, 0)}
            ks = sorted(keys); z = sq = 0
            for a, b in zip(ks, ks[1:]):
                if a <= g <= b:
                    t = smooth01((g - a) / (b - a))
                    z = keys[a][0] + (keys[b][0] - keys[a][0]) * t
                    sq = keys[a][1] + (keys[b][1] - keys[a][1]) * t
            up = smooth01((g - 4) / 4) * (1 - smooth01((g - 18) / 6))
            body(f, z, sq)
            arms(f, ARM_REST + up * RAISE + 0.15 * math.sin(3 * ph), ARM_REST + up * RAISE + 0.15 * math.sin(3 * ph + 1))
            eyes(f, 1.0, 0.01); brows(f, 0.045, -0.1)
            if 'tail' in C: tail_keys(f, 0.3, 3)
            extras(f, 0.04 * smooth01((g - 9) / 2) * (1 - smooth01((g - 15) / 2)), 0.25 * math.sin(3 * ph))
        elif name == 'sad':
            s = smooth01((g - 1) / 6)
            body(f, -0.06 * s, 0.05 * s, 0.1 * s, 0.16 * math.sin(2 * ph) * s)
            arms(f, ARM_REST - 0.35 * s, ARM_REST - 0.35 * s)
            eyes(f, 1.0 - 0.12 * s, -0.045 * s); brows(f, 0.02 * s, 0.32 * s)
            tear_vis = g >= 6
            tear_keys(f, tear_vis, max(0.0, (g - 6) / 18) * 0.42)
            if 'tail' in C: tail_keys(f, 0.06, 1, 0.25 * s)
            extras(f, -0.08 * s, -0.25 * s)
        elif name == 'dance':
            sw = math.sin(2 * ph)
            body(f, 0.1 * abs(math.sin(4 * ph)), -0.05 * math.cos(8 * ph), 0, 0.25 * sw, 0.16 * sw, 0.14 * sw)
            arms(f, ARM_REST + RAISE * (0.55 + 0.45 * sw), ARM_REST + RAISE * (0.55 - 0.45 * sw))
            eyes(f, 1.0, 0.01); brows(f, 0.04, -0.08)
            if 'tail' in C: tail_keys(f, 0.35, 4)
            extras(f, 0.02 * math.sin(4 * ph), 0.3 * math.sin(4 * ph))
        elif name == 'spin':
            t = smooth01((g - 3) / 18)
            hop = 0.3 * math.sin(math.pi * t)
            body(f, hop, -0.06 * math.sin(math.pi * t), 0, 2 * math.pi * t)
            arms(f, ARM_REST + RAISE * 0.8 * math.sin(math.pi * t), ARM_REST + RAISE * 0.8 * math.sin(math.pi * t))
            eyes(f, 1.0, 0); brows(f, 0.03, -0.05)
            if 'tail' in C: tail_keys(f, 0.25, 2)
            extras(f, 0, 0.2 * math.sin(2 * ph))
        elif name == 'love':
            hearts, hsc = True, 1.0 + 0.18 * abs(math.sin(3 * ph))
            body(f, 0.12 + 0.07 * math.sin(ph), 0.02 * math.sin(2 * ph), 0, 0, 0, 0.12 * math.sin(ph))
            arms(f, ARM_REST + 0.5 + 0.2 * math.sin(2 * ph), ARM_REST + 0.5 + 0.2 * math.sin(2 * ph + 1))
            eyes(f, 1.0, 0); brows(f, 0.05, -0.12)
            if 'tail' in C: tail_keys(f, 0.22, 1.5)
            extras(f, 0, 0.12 * math.sin(2 * ph))
        elif name == 'angry':
            s = smooth01((g - 1) / 3)
            shake = 0.035 * math.sin(14 * ph) * s
            stomp = -0.05 * abs(math.sin(4 * ph)) * s
            body(f, stomp, 0.04 * s, 0.06 * s, 0.05 * math.sin(14 * ph) * s, shake)
            arms(f, ARM_REST + (0.9 + 0.35 * math.sin(8 * ph)) * s, ARM_REST + (0.9 + 0.35 * math.sin(8 * ph + 2)) * s)
            eyes(f, 1.0 - 0.25 * s, -0.01); brows(f, (-0.05 if CHAR == 'spermi' else -0.08) * s, (-0.42 if CHAR == 'spermi' else -0.6) * s)
            if 'tail' in C: tail_keys(f, 0.12, 6)
            extras(f, -0.03 * s, -0.15 * s + 0.1 * math.sin(14 * ph) * s)
        if name != 'sad':
            tear_keys(f, False)
        heart_keys(f, hearts, hsc)
    set_mouth({'idle': 'smile', 'happy': 'happy', 'sad': 'sad', 'dance': 'happy', 'spin': 'smile', 'love': 'happy', 'angry': 'angry'}[name])
    for k, o in C['mouths'].items():
        o.hide_render = o.hide_render
    scene.frame_start, scene.frame_end = 1, FR

ANIMS = ('idle', 'happy', 'sad', 'dance', 'spin', 'love', 'angry')
ONLY = [a for a in sys.argv[4:]] if len(sys.argv) > 4 else ANIMS
os.makedirs(OUT, exist_ok=True)
for name in ONLY:
    anim(name)
    if PREVIEW:
        for fr in (14, 30):
            scene.frame_set(fr)
            r.filepath = os.path.join(OUT, f"{CHAR}_{name}_p{fr}.png")
            bpy.ops.render.render(write_still=True)
    else:
        d = os.path.join(OUT, f"{CHAR}_{name}")
        os.makedirs(d, exist_ok=True)
        r.filepath = os.path.join(d, "f_")
        bpy.ops.render.render(animation=True)
print("LISTO", CHAR)
