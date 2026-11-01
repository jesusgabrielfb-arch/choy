"""Crea la mascota (gusano gordito con camiseta) en Blender, con esqueleto y animaciones.

Uso (Blender 5.2):
    blender --background --python mascota/crear_mascota.py -- mascota/salida
o con el módulo bpy de Python:
    python mascota/crear_mascota.py -- mascota/salida

Genera en la carpeta de salida:
    mascota.blend  escena para abrir y editar en Blender
    mascota.glb    modelo + esqueleto + animaciones para la app (Three.js)

Todo está hecho con formas simples, sin logos ni marcas. Los colores del equipo se
cambian en la app con los materiales "Camiseta", "Camiseta_Ribete", "Numero" y
"Numero_Borde".
"""

import math
import os
import sys

import bpy  # noqa: I001  (bpy va primero para que exista bmesh)
import bmesh
from mathutils import Matrix, Quaternion, Vector
from mathutils.bvhtree import BVHTree

SALIDA = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "."
os.makedirs(SALIDA, exist_ok=True)

FPS = 24
Y_ESCALA = 0.9  # el cuerpo es un poco más plano de frente a espalda que de lado a lado

# Colores en espacio lineal
PIEL = (0.30, 0.40, 0.045)
PIEL_OSCURA = (0.19, 0.26, 0.025)
NEGRO_CAMISETA = (0.006, 0.0065, 0.008)
AZUL_EQUIPO = (0.0, 0.23, 0.6)  # azul tipo Carolina, sin logos
BLANCO = (0.9, 0.9, 0.9)


# --------------------------------------------------------------------------- utilidades

def limpiar_escena():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS


def material(nombre, color, rugosidad=0.5, metal=0.0, sss=0.0, brillo=None):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rugosidad
    p.inputs["Metallic"].default_value = metal
    if sss:
        p.inputs["Subsurface Weight"].default_value = sss
        p.inputs["Subsurface Radius"].default_value = (0.4, 0.5, 0.15)
        p.inputs["Subsurface Scale"].default_value = 0.05
    if brillo is not None:
        p.inputs["Coat Weight"].default_value = brillo
    m.diffuse_color = (*color, 1)
    return m


def objeto_temporal(nombre, data):
    o = bpy.data.objects.new(nombre, data)
    bpy.context.scene.collection.objects.link(o)
    return o


def malla_evaluada(o):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    me.transform(o.matrix_world)
    return me


def borrar(o):
    data = o.data
    bpy.data.objects.remove(o)
    if data is not None and data.users == 0:
        if isinstance(data, bpy.types.Mesh):
            bpy.data.meshes.remove(data)
        elif isinstance(data, bpy.types.Curve):
            bpy.data.curves.remove(data)


def bm_a_malla(bm, nombre="tmp"):
    me = bpy.data.meshes.new(nombre)
    bm.to_mesh(me)
    return me


def elipsoide(bm, centro, radios, rot=None, seg=32, anillos=16):
    m = Matrix.Translation(centro)
    if rot is not None:
        m = m @ rot.to_4x4()
    m = m @ Matrix.Diagonal((*radios, 1))
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=anillos, radius=1.0, matrix=m)


def torno(bm, perfil, segmentos=64, y_escala=Y_ESCALA):
    """Gira un perfil [(radio, z), ...] alrededor del eje Z."""
    anillos = []
    for r, z in perfil:
        if r < 1e-6:
            anillos.append([bm.verts.new((0, 0, z))])
            continue
        anillo = []
        for i in range(segmentos):
            a = 2 * math.pi * i / segmentos
            anillo.append(bm.verts.new((r * math.cos(a), r * math.sin(a) * y_escala, z)))
        anillos.append(anillo)
    for a, b in zip(anillos, anillos[1:]):
        if len(a) == 1 and len(b) == 1:
            continue
        if len(a) == 1:
            for i in range(segmentos):
                bm.faces.new((a[0], b[(i + 1) % segmentos], b[i]))
        elif len(b) == 1:
            for i in range(segmentos):
                bm.faces.new((a[i], a[(i + 1) % segmentos], b[0]))
        else:
            for i in range(segmentos):
                j = (i + 1) % segmentos
                bm.faces.new((a[i], a[j], b[j], b[i]))
    return anillos


def suave(x0, x1, x):
    t = max(0.0, min(1.0, (x - x0) / (x1 - x0)))
    return t * t * (3 - 2 * t)


class Constructor:
    """Junta todas las piezas en una sola malla con materiales y pesos de huesos."""

    def __init__(self):
        self.bm = bmesh.new()
        self.capa = self.bm.verts.layers.deform.verify()
        self.materiales = []
        self.grupos = []

    def _mat(self, m):
        if m not in self.materiales:
            self.materiales.append(m)
        return self.materiales.index(m)

    def _grupo(self, nombre):
        if nombre not in self.grupos:
            self.grupos.append(nombre)
        return self.grupos.index(nombre)

    def agregar(self, me, materiales, pesos, liso=True):
        """materiales: material o función(centro_cara)->material.
        pesos: nombre de hueso o función(co)->{hueso: peso}."""
        nv, nf = len(self.bm.verts), len(self.bm.faces)
        self.bm.from_mesh(me)
        self.bm.verts.ensure_lookup_table()
        self.bm.faces.ensure_lookup_table()
        for f in self.bm.faces[nf:]:
            m = materiales(f.calc_center_median()) if callable(materiales) else materiales
            f.material_index = self._mat(m)
            f.smooth = liso
        for v in self.bm.verts[nv:]:
            w = pesos(v.co) if callable(pesos) else {pesos: 1.0}
            total = sum(x for x in w.values() if x > 1e-4) or 1.0
            for hueso, x in w.items():
                if x > 1e-4:
                    v[self.capa][self._grupo(hueso)] = x / total
        if me.users == 0:
            bpy.data.meshes.remove(me)

    def terminar(self, nombre):
        me = bpy.data.meshes.new(nombre)
        self.bm.to_mesh(me)
        self.bm.free()
        o = bpy.data.objects.new(nombre, me)
        bpy.context.scene.collection.objects.link(o)
        for m in self.materiales:
            me.materials.append(m)
        for g in self.grupos:
            o.vertex_groups.new(name=g)
        return o


# --------------------------------------------------------------------------- forma

# Perfil del cuerpo (radio, altura): base ancha con rollitos, cabeza sin cuello.
PERFIL_CUERPO = [
    (0.0, 0.0), (0.45, 0.0), (0.70, 0.03), (0.83, 0.11), (0.88, 0.21), (0.86, 0.30),
    (0.82, 0.34), (0.87, 0.40), (0.90, 0.50), (0.90, 0.60), (0.87, 0.69), (0.83, 0.73),
    (0.85, 0.79), (0.84, 0.90), (0.80, 1.02), (0.75, 1.14), (0.71, 1.26), (0.69, 1.38),
    (0.69, 1.50), (0.68, 1.60), (0.65, 1.70), (0.58, 1.80), (0.46, 1.89), (0.30, 1.95),
    (0.12, 1.98), (0.0, 1.985),
]

# Perfil de la camiseta: cuelga suelta, sin marcar los rollitos.
PERFIL_CAMISETA = [
    (0.96, 0.45), (0.955, 0.56), (0.94, 0.70), (0.91, 0.84), (0.865, 0.98),
    (0.81, 1.10), (0.765, 1.21), (0.74, 1.30),
]
CAMISETA_Z = (0.45, 1.30)

Z_HUESOS = {"cuerpo.1": 0.22, "cuerpo.2": 0.68, "cuerpo.3": 1.12, "cabeza": 1.62}


def pesos_cuerpo(co):
    """Reparte cada punto entre los huesos del tronco según su altura."""
    nombres = list(Z_HUESOS)
    zs = [Z_HUESOS[n] for n in nombres]
    z = co.z
    if z <= zs[0]:
        w = {nombres[0]: 1.0}
    elif z >= zs[-1]:
        w = {nombres[-1]: 1.0}
    else:
        w = {}
        for i in range(len(zs) - 1):
            if zs[i] <= z <= zs[i + 1]:
                t = suave(zs[i], zs[i + 1], z)
                w = {nombres[i]: 1 - t, nombres[i + 1]: t}
    # colita
    if co.y > 0.55 and co.z < 0.35:
        t = suave(0.55, 0.8, co.y)
        w = {k: v * (1 - t) for k, v in w.items()}
        w["cola"] = t
    return w


def crear_cuerpo():
    bm = bmesh.new()
    torno(bm, PERFIL_CUERPO)
    # cachetes, frente, piecitos y colita
    for s in (1, -1):
        elipsoide(bm, Vector((0.27 * s, -0.43, 1.45)), (0.21, 0.15, 0.16))
        elipsoide(bm, Vector((0.17 * s, -0.45, 1.77)), (0.16, 0.11, 0.07))
        elipsoide(bm, Vector((0.36 * s, -0.62, 0.04)), (0.15, 0.13, 0.07))
    elipsoide(bm, Vector((0, 0.70, 0.13)), (0.14, 0.24, 0.1),
              rot=Matrix.Rotation(math.radians(-35), 3, "X"))
    me = bm_a_malla(bm, "cuerpo_base")
    bm.free()
    o = objeto_temporal("cuerpo_base", me)
    rm = o.modifiers.new("remesh", "REMESH")
    rm.mode = "VOXEL"
    rm.voxel_size = 0.016
    sm = o.modifiers.new("suavizar", "SMOOTH")
    sm.factor = 0.7
    sm.iterations = 14
    dc = o.modifiers.new("reducir", "DECIMATE")
    dc.ratio = 0.2
    final = malla_evaluada(o)
    borrar(o)
    return final


def crear_camiseta():
    bm = bmesh.new()
    torno(bm, PERFIL_CAMISETA)
    me = bm_a_malla(bm, "camiseta")
    bm.free()
    o = objeto_temporal("camiseta", me)
    sub = o.modifiers.new("sub", "SUBSURF")
    sub.levels = 1
    so = o.modifiers.new("grosor", "SOLIDIFY")
    so.thickness = 0.025
    so.offset = 1.0
    final = malla_evaluada(o)
    borrar(o)
    return final


def material_camiseta(c, ribete, base):
    z0, z1 = CAMISETA_Z
    if c.z > z1 - 0.06 or c.z < z0 + 0.045:
        return ribete
    return base


def rayo(bvh, origen, direccion):
    p, n, _, _ = bvh.ray_cast(Vector(origen), Vector(direccion).normalized())
    if p is None:
        raise RuntimeError(f"El rayo no tocó la superficie: {origen}")
    return p, n


def base_ortonormal(adelante, arriba=Vector((0, 0, 1))):
    """Matriz cuyo -Y local apunta 'adelante' y Z local hacia 'arriba'."""
    y = -adelante.normalized()
    x = arriba.cross(y).normalized()
    z = y.cross(x).normalized()
    return Matrix((x, y, z)).transposed()


# --------------------------------------------------------------------------- esqueleto

def crear_esqueleto(puntos):
    arm = bpy.data.armatures.new("Esqueleto")
    o = bpy.data.objects.new("Esqueleto", arm)
    bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode="EDIT")

    def hueso(nombre, cabeza, cola, padre=None, deforma=True):
        b = arm.edit_bones.new(nombre)
        b.head, b.tail = Vector(cabeza), Vector(cola)
        b.roll = 0
        b.use_deform = deforma
        if padre:
            b.parent = arm.edit_bones[padre]
        return b

    hueso("raiz", (0, 0, 0), (0, 0.3, 0), deforma=False)
    hueso("cuerpo.1", (0, 0, 0.0), (0, 0, 0.45), "raiz")
    hueso("cola", (0, 0.55, 0.15), (0, 0.85, 0.22), "cuerpo.1")
    hueso("cuerpo.2", (0, 0, 0.45), (0, 0, 0.90), "cuerpo.1")
    hueso("cuerpo.3", (0, 0, 0.90), (0, 0, 1.32), "cuerpo.2")
    hueso("cabeza", (0, 0, 1.32), (0, 0, 1.95), "cuerpo.3")
    for lado, s in (("L", 1), ("R", -1)):
        h, m = puntos[f"hombro.{lado}"], puntos[f"muneca.{lado}"]
        hueso(f"brazo.{lado}", h, m, "cuerpo.3")
        hueso(f"mano.{lado}", m, m + (m - h).normalized() * 0.15, f"brazo.{lado}")
        a0, a1, a2 = puntos[f"antena.{lado}"]
        hueso(f"antena.{lado}.1", a0, a1, "cabeza")
        hueso(f"antena.{lado}.2", a1, a2, f"antena.{lado}.1")
        ojo = puntos[f"ojo.{lado}"]
        hueso(f"parpado.{lado}", ojo, ojo + Vector((0, -0.15, 0)), "cabeza")
        hueso(f"parpado_inf.{lado}", ojo, ojo + Vector((0, -0.15, 0)), "cabeza")
        mej = puntos[f"mejilla.{lado}"]
        hueso(f"mejilla.{lado}", mej, mej + Vector((0, -0.1, 0)), "cabeza")
        ceja = puntos[f"ceja.{lado}"]
        hueso(f"ceja.{lado}", ceja, ceja + Vector((0, -0.12, 0)), "cabeza")
        hueso(f"comisura.{lado}", puntos[f"comisura.{lado}"],
              puntos[f"comisura.{lado}"] + Vector((0, -0.08, 0)), "cabeza")
    boca = puntos["boca"]
    hueso("mandibula", boca, boca + Vector((0, -0.1, 0)), "cabeza")
    hueso("lentes", puntos["lentes"], puntos["lentes"] + Vector((0, -0.12, 0)), "cabeza")
    bpy.ops.object.mode_set(mode="OBJECT")
    return o


# --------------------------------------------------------------------------- construcción

def construir():
    limpiar_escena()
    m_piel = material("Piel", PIEL, 0.55, sss=0.12)
    m_piel_osc = material("Piel_Oscura", PIEL_OSCURA, 0.6, sss=0.1)
    m_cam = material("Camiseta", NEGRO_CAMISETA, 0.95)
    m_rib = material("Camiseta_Ribete", AZUL_EQUIPO, 0.6)
    m_num = material("Numero", BLANCO, 0.5)
    m_num_b = material("Numero_Borde", AZUL_EQUIPO, 0.5)
    m_ojo = material("Ojo", (0.85, 0.85, 0.82), 0.15, brillo=0.6)
    m_iris = material("Iris", (0.08, 0.2, 0.28), 0.2, brillo=0.6)
    m_pupila = material("Pupila", (0.003, 0.003, 0.003), 0.1, brillo=0.8)
    m_boca = material("Boca", (0.09, 0.005, 0.008), 0.6)
    m_lengua = material("Lengua", (0.55, 0.09, 0.1), 0.45)
    m_punta = material("Antena_Punta", (0.02, 0.12, 0.42), 0.35)
    m_brillo = material("Brillo_Ojo", (1, 1, 1), 0.0)
    m_labio = material("Labios", (0.22, 0.2, 0.035), 0.5, sss=0.1)
    m_lentes = material("Lentes", (0.005, 0.005, 0.006), 0.08, brillo=1.0)

    c = Constructor()
    puntos = {}

    # Cuerpo
    cuerpo = crear_cuerpo()
    bvh = BVHTree.FromPolygons([v.co.copy() for v in cuerpo.vertices],
                               [tuple(p.vertices) for p in cuerpo.polygons])
    zc, w = 1.43, 0.26
    anclas = {"abajo_boca": rayo(bvh, (0, -3, zc - 0.17), (0, 1, 0))[0]}
    for lado, s in (("L", 1), ("R", -1)):
        anclas[f"comisura.{lado}"] = rayo(bvh, (w * s, -3, zc + 0.055), (0, 1, 0))[0]
        anclas[f"mejilla.{lado}"] = rayo(bvh, (0.28 * s, -3, 1.50), (0, 1, 0))[0]
        anclas[f"ceja.{lado}"] = rayo(bvh, (0.18 * s, -3, 1.79), (0, 1, 0))[0]
        puntos[f"mejilla.{lado}"] = anclas[f"mejilla.{lado}"] - Vector((0, -0.05, 0))

    def pesos_piel(co):
        """La piel de la cara se estira con la boca, los cachetes y las cejas."""
        base = pesos_cuerpo(co)
        if co.y > -0.15 or co.z < 1.18:
            return base

        def g(punto, sigma):
            d = (co - punto).length
            return math.exp(-(d * d) / (2 * sigma * sigma))

        cara_w = {"mandibula": 0.65 * g(anclas["abajo_boca"], 0.09)}
        for lado in ("L", "R"):
            cara_w[f"comisura.{lado}"] = 0.75 * g(anclas[f"comisura.{lado}"], 0.055)
            cara_w[f"mejilla.{lado}"] = 0.8 * g(anclas[f"mejilla.{lado}"], 0.09)
            cara_w[f"ceja.{lado}"] = 0.85 * g(anclas[f"ceja.{lado}"], 0.075)
        total = sum(cara_w.values())
        if total > 0.95:
            cara_w = {k: v * 0.95 / total for k, v in cara_w.items()}
            total = 0.95
        res = {k: v * (1 - total) for k, v in base.items()}
        for k, v in cara_w.items():
            res[k] = res.get(k, 0) + v
        return res

    c.agregar(cuerpo, m_piel, pesos_piel)

    # Camiseta
    cam = crear_camiseta()
    bvh_cam = BVHTree.FromPolygons([v.co.copy() for v in cam.vertices],
                                   [tuple(p.vertices) for p in cam.polygons])
    c.agregar(cam, lambda ce: material_camiseta(ce, m_rib, m_cam), pesos_cuerpo)

    # Número "1" estilo bloque, con borde
    p, n = rayo(bvh_cam, (0, -3, 0.86), (0, 1, 0))
    marco = base_ortonormal(-n)
    uno = [(-0.06, -0.23), (0.07, -0.23), (0.07, 0.23), (-0.02, 0.23),
           (-0.135, 0.13), (-0.135, 0.06), (-0.06, 0.095)]

    def figura(puntos2d, desplaz, grosor, mat):
        bm = bmesh.new()
        vs = [bm.verts.new((x, 0, z)) for x, z in puntos2d]
        cara = bm.faces.new(vs)
        bmesh.ops.triangulate(bm, faces=[cara])
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=5, use_grid_fill=True)
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        bm.transform(Matrix.Translation(p) @ marco.to_4x4())
        # pegar cada punto a la tela para que siga su curva
        for v in bm.verts:
            hit, nn, _, _ = bvh_cam.ray_cast(v.co + n * 0.3, -n)
            if hit is not None:
                v.co = hit + n * desplaz
        ext = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
        bmesh.ops.translate(bm, vec=-n * grosor,
                            verts=[v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)])
        me = bm_a_malla(bm)
        bm.free()
        c.agregar(me, mat, lambda co: pesos_cuerpo(co), liso=False)

    def ensanchar(poly, d):
        res = []
        k = len(poly)
        area = sum(poly[i][0] * poly[(i + 1) % k][1] - poly[(i + 1) % k][0] * poly[i][1]
                   for i in range(k))
        s = 1 if area > 0 else -1
        for i in range(k):
            a, b, cc = Vector(poly[i - 1]), Vector(poly[i]), Vector(poly[(i + 1) % k])
            e1, e2 = (b - a).normalized(), (cc - b).normalized()
            n1 = Vector((e1.y, -e1.x)) * s
            n2 = Vector((e2.y, -e2.x)) * s
            bis = (n1 + n2).normalized()
            res.append(tuple(b + bis * d / max(0.3, bis.dot(n1))))
        return res

    figura(ensanchar(uno, 0.028), 0.01, 0.006, m_num_b)
    figura(uno, 0.013, 0.008, m_num)

    # Ojos
    for lado, s in (("L", 1), ("R", -1)):
        p, n = rayo(bvh, (0.18 * s, -3, 1.62), (0, 1, 0))
        adelante = (n.normalized() + Vector((0, -1.6, 0))).normalized()
        centro = p - n * 0.055
        puntos[f"ojo.{lado}"] = centro
        R = base_ortonormal(adelante)
        r = 0.125
        bm = bmesh.new()
        elipsoide(bm, centro, (r, r, r), seg=32, anillos=16)
        c.agregar(bm_a_malla(bm), m_ojo, "cabeza")
        bm.free()
        for rad, prof, mat in ((0.062, 0.004, m_iris), (0.032, 0.009, m_pupila)):
            bm = bmesh.new()
            pos = centro + adelante * (r - 0.012 + prof)
            elipsoide(bm, pos, (rad, 0.02, rad), rot=R, seg=24, anillos=12)
            c.agregar(bm_a_malla(bm), mat, "cabeza")
            bm.free()
        bm = bmesh.new()
        elipsoide(bm, centro + adelante * (r + 0.006) + Vector((0.022 * s, 0, 0.03)),
                  (0.014, 0.008, 0.014), rot=R, seg=12, anillos=6)
        c.agregar(bm_a_malla(bm), m_brillo, "cabeza")
        bm.free()

        # Párpado: media esfera de piel que cubre la parte de arriba del ojo
        bm = bmesh.new()
        rp = r + 0.022
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=rp)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.002], context="VERTS")
        so = bm_a_malla(bm)
        bm.free()
        o = objeto_temporal("parpado", so)
        mod = o.modifiers.new("g", "SOLIDIFY")
        mod.thickness = 0.012
        o.matrix_world = (Matrix.Translation(centro) @ R.to_4x4()
                          @ Matrix.Rotation(math.radians(-12), 4, "X"))
        me = malla_evaluada(o)
        borrar(o)
        c.agregar(me, m_piel, f"parpado.{lado}")

        # Párpado de abajo: sube al sonreír y le da vida a la mirada
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=r + 0.018)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > 0.002], context="VERTS")
        so = bm_a_malla(bm)
        bm.free()
        o = objeto_temporal("parpado_inf", so)
        mod = o.modifiers.new("g", "SOLIDIFY")
        mod.thickness = 0.01
        o.matrix_world = (Matrix.Translation(centro) @ R.to_4x4()
                          @ Matrix.Rotation(math.radians(58), 4, "X"))
        me = malla_evaluada(o)
        borrar(o)
        c.agregar(me, m_piel, f"parpado_inf.{lado}")

        # Ceja (rollito de piel que se mueve con las expresiones)
        p2, n2 = rayo(bvh, (0.18 * s, -3, 1.79), (0, 1, 0))
        puntos[f"ceja.{lado}"] = p2
        bm = bmesh.new()
        elipsoide(bm, p2 - n2 * 0.01, (0.1, 0.035, 0.03),
                  rot=base_ortonormal((n2 + Vector((0, -1, 0))).normalized())
                  @ Matrix.Rotation(math.radians(-10 * s), 3, "Y"), seg=24, anillos=10)
        c.agregar(bm_a_malla(bm), m_piel_osc, f"ceja.{lado}")
        bm.free()

    # Boca: sonrisa abierta con lengua
    puntos["boca"] = rayo(bvh, (0, -3, zc - 0.05), (0, 1, 0))[0]
    for lado, s in (("L", 1), ("R", -1)):
        puntos[f"comisura.{lado}"] = rayo(bvh, (w * s, -3, zc + 0.055), (0, 1, 0))[0]
    nx, ny = 56, 16
    bm = bmesh.new()
    rejilla = []
    for j in range(ny + 1):
        sj = j / ny
        fila = []
        for i in range(nx + 1):
            t = -1 + 2 * i / nx
            zu = zc + 0.012 + 0.043 * t * t
            zl = zc - 0.095 * (1 - t * t) + 0.055 * t * t
            z = zu + (zl - zu) * sj
            pp, nn = rayo(bvh, (t * w, -3, z), (0, 1, 0))
            fila.append(bm.verts.new(pp + nn * 0.004))
        rejilla.append(fila)
    for j in range(ny):
        for i in range(nx):
            bm.faces.new((rejilla[j][i], rejilla[j][i + 1], rejilla[j + 1][i + 1], rejilla[j + 1][i]))
    me = bm_a_malla(bm)
    bm.free()

    def mat_boca(ce):
        t = ce.x / w
        zl = zc - 0.095 * (1 - t * t) + 0.055 * t * t
        zu = zc + 0.012 + 0.043 * t * t
        sj = (zu - ce.z) / max(1e-6, zu - zl)
        return m_lengua if sj > 0.5 + 0.45 * t ** 4 else m_boca

    def pesos_boca(co):
        t = max(-1.0, min(1.0, co.x / w))
        zu = zc + 0.012 + 0.043 * t * t
        zl = zc - 0.095 * (1 - t * t) + 0.055 * t * t
        sj = 0.0 if abs(zu - zl) < 1e-6 else max(0.0, min(1.0, (zu - co.z) / (zu - zl)))
        wm = sj * (1 - t * t)
        wl = suave(0.35, 1.0, t)
        wr = suave(0.35, 1.0, -t)
        return {"mandibula": wm, "comisura.L": wl, "comisura.R": wr,
                "cabeza": max(0.0, 1 - wm - wl - wr)}

    c.agregar(me, mat_boca, pesos_boca)

    # Labios: un borde con volumen alrededor de la boca
    contorno = []
    for i in range(0, nx + 1, 2):
        t = -1 + 2 * i / nx
        contorno.append(rayo(bvh, (t * w, -3, zc + 0.012 + 0.043 * t * t), (0, 1, 0)))
    for i in range(nx - 2, 0, -2):
        t = -1 + 2 * i / nx
        contorno.append(rayo(bvh, (t * w, -3, zc - 0.095 * (1 - t * t) + 0.055 * t * t),
                             (0, 1, 0)))
    cu = bpy.data.curves.new("labios", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.012
    cu.bevel_resolution = 3
    sp = cu.splines.new("NURBS")
    sp.points.add(len(contorno) - 1)
    for k, (pp, nn) in enumerate(contorno):
        sp.points[k].co = (*(pp + nn * 0.006), 1)
    sp.use_cyclic_u = True
    sp.order_u = 3
    sp.resolution_u = 4
    o = objeto_temporal("labios", cu)
    me = malla_evaluada(o)
    borrar(o)
    c.agregar(me, m_labio, pesos_boca)

    # Antenas con punta azul
    for lado, s in (("L", 1), ("R", -1)):
        base, _ = rayo(bvh, (0.09 * s, -0.04, 3), (0, 0, -1))
        a0 = base - Vector((0, 0, 0.04))
        a1 = base + Vector((0.035 * s, 0.01, 0.2))
        a2 = base + Vector((0.13 * s, -0.04, 0.37))
        punta = base + Vector((0.2 * s, -0.12, 0.39))
        puntos[f"antena.{lado}"] = (a0, a1, punta)
        cu = bpy.data.curves.new("antena", "CURVE")
        cu.dimensions = "3D"
        cu.bevel_depth = 0.024
        cu.bevel_resolution = 4
        cu.use_fill_caps = True
        sp = cu.splines.new("NURBS")
        pts = [a0, a0 + Vector((0, 0, 0.05)), a1, a2, punta]
        sp.points.add(len(pts) - 1)
        for k, (pt, rr) in enumerate(zip(pts, (1.25, 1.15, 1.0, 0.85, 0.75))):
            sp.points[k].co = (*pt, 1)
            sp.points[k].radius = rr
        sp.use_endpoint_u = True
        sp.order_u = 4
        sp.resolution_u = 10
        o = objeto_temporal("antena", cu)
        me = malla_evaluada(o)
        borrar(o)

        def pesos_antena(co, a0=a0, a1=a1, lado=lado):
            t = suave(a1.z - 0.07, a1.z + 0.07, co.z)
            return {f"antena.{lado}.1": 1 - t, f"antena.{lado}.2": t}

        c.agregar(me, m_piel, pesos_antena)
        d = (punta - a2).normalized()
        bm = bmesh.new()
        rot = d.to_track_quat("Z", "Y").to_matrix()
        elipsoide(bm, punta + d * 0.05, (0.045, 0.032, 0.085), rot=rot, seg=20, anillos=10)
        c.agregar(bm_a_malla(bm), m_punta, f"antena.{lado}.2")
        bm.free()

    # Brazos cortitos con mano y pulgar, y manga con puño de color
    for lado, s in (("L", 1), ("R", -1)):
        pp, _ = rayo(bvh, (3 * s, -0.12, 1.14), (-s, 0, 0))
        hombro = pp - Vector((0.1 * s, 0, 0))
        muneca = hombro + Vector((0.2 * s, -0.27, -0.27))
        puntos[f"hombro.{lado}"] = hombro
        puntos[f"muneca.{lado}"] = muneca
        eje = (muneca - hombro)
        largo = eje.length
        d = eje.normalized()
        rot = d.to_track_quat("Z", "Y").to_matrix()

        def pesos_brazo(co, hombro=hombro, d=d, largo=largo, lado=lado):
            t = (co - hombro).dot(d) / largo
            u = suave(0.75, 1.05, t)
            return {f"brazo.{lado}": 1 - u, f"mano.{lado}": u}

        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.135, radius2=0.115,
                              depth=largo, matrix=Matrix.Translation(hombro + d * largo / 2)
                              @ rot.to_4x4())
        elipsoide(bm, hombro, (0.135, 0.135, 0.135), seg=24, anillos=12)
        mano = muneca + d * 0.05
        elipsoide(bm, mano, (0.13, 0.11, 0.13), rot=rot, seg=24, anillos=12)
        elipsoide(bm, mano + Vector((-0.05 * s, -0.06, 0.07)), (0.045, 0.045, 0.06),
                  seg=16, anillos=8)
        me = bm_a_malla(bm)
        bm.free()
        o = objeto_temporal("brazo", me)
        rm = o.modifiers.new("r", "REMESH")
        rm.mode = "VOXEL"
        rm.voxel_size = 0.012
        sm = o.modifiers.new("s", "SMOOTH")
        sm.factor = 0.5
        sm.iterations = 4
        dc = o.modifiers.new("d", "DECIMATE")
        dc.ratio = 0.4
        me = malla_evaluada(o)
        borrar(o)
        c.agregar(me, m_piel, pesos_brazo)

        # manga
        bm = bmesh.new()
        lm = largo * 0.55
        bmesh.ops.create_cone(bm, cap_ends=False, segments=32, radius1=0.175, radius2=0.19,
                              depth=lm + 0.12, matrix=Matrix.Translation(
                                  hombro + d * (lm - 0.12) / 2) @ rot.to_4x4())
        me = bm_a_malla(bm)
        bm.free()
        o = objeto_temporal("manga", me)
        so = o.modifiers.new("g", "SOLIDIFY")
        so.thickness = 0.02
        me = malla_evaluada(o)
        borrar(o)
        c.agregar(me, lambda ce, h=hombro, d=d, lm=lm:
                  m_rib if (ce - h).dot(d) > lm - 0.05 else m_cam,
                  lambda co, h=hombro, d=d, lado=lado: {
                      f"brazo.{lado}": suave(-0.05, 0.12, (co - h).dot(d)),
                      "cuerpo.3": 1 - suave(-0.05, 0.12, (co - h).dot(d))})

    # Lentes oscuros (escondidos salvo en la animación "Cool")
    ojo_l, ojo_r = puntos["ojo.L"], puntos["ojo.R"]
    medio = (ojo_l + ojo_r) / 2 + Vector((0, -0.14, 0.0))
    puntos["lentes"] = medio
    bm = bmesh.new()
    for ojo in (ojo_l, ojo_r):
        pos = Vector((ojo.x * 1.05, medio.y + abs(ojo.x) * 0.25, ojo.z))
        elipsoide(bm, pos, (0.155, 0.03, 0.105),
                  rot=Matrix.Rotation(math.radians(-14 if ojo.x > 0 else 14), 3, "Z"),
                  seg=32, anillos=12)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.015, radius2=0.015,
                          depth=0.12, matrix=Matrix.Translation(medio + Vector((0, 0.01, 0.03)))
                          @ Matrix.Rotation(math.radians(90), 4, "Y"))
    for ojo in (ojo_l, ojo_r):
        s = 1 if ojo.x > 0 else -1
        ini = Vector((ojo.x * 1.05 + 0.12 * s, medio.y + 0.06, ojo.z + 0.02))
        fin = ini + Vector((0.08 * s, 0.32, 0.0))
        dd = (fin - ini)
        bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.012, radius2=0.012,
                              depth=dd.length, matrix=Matrix.Translation((ini + fin) / 2)
                              @ dd.normalized().to_track_quat("Z", "Y").to_matrix().to_4x4())
    c.agregar(bm_a_malla(bm), m_lentes, "lentes")
    bm.free()

    mascota = c.terminar("Mascota")
    arm = crear_esqueleto(puntos)
    mascota.parent = arm
    mod = mascota.modifiers.new("Esqueleto", "ARMATURE")
    mod.object = arm
    return mascota, arm


# --------------------------------------------------------------------------- animaciones

def a_local(pb, v):
    return pb.bone.matrix_local.to_3x3().inverted() @ Vector(v)


def rot_local(pb, rotaciones):
    m = pb.bone.matrix_local.to_3x3()
    q = Quaternion()
    for eje, ang in rotaciones:
        q = Quaternion(eje, ang) @ q
    return (m.inverted() @ q.to_matrix() @ m).to_quaternion()


def escala_local(pb, s):
    m = pb.bone.matrix_local.to_3x3()
    res = [1.0, 1.0, 1.0]
    for i in range(3):
        col = [abs(m[j][i]) for j in range(3)]
        res[i] = s[col.index(max(col))]
    return res


X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)


def onda(f, periodo, fase=0.0):
    return math.sin(2 * math.pi * (f / periodo + fase))


def cara(p, parpado=0.0, ceja=(0.0, 0.0), boca=0.0, sonrisa=0.0, o=0.0, asim=0.0):
    """parpado: + cierra, - abre. ceja: (giro interior abajo +, sube).
    boca: + abre. sonrisa: + comisuras arriba. o: forma de O."""
    alegria = max(0.0, sonrisa)
    for lado, s in (("L", 1), ("R", -1)):
        sl0 = sonrisa + (asim if s == 1 else -asim)
        p[f"mejilla.{lado}"] = {"loc": (0.006 * s * max(0, sl0), -0.012 * max(0, sl0),
                                        0.022 * max(0, sl0) + 0.012 * min(0, sl0))}
        p[f"parpado_inf.{lado}"] = {"rot": [(X, -0.32 * min(1.4, alegria) + 0.15 * o)]}
        p[f"parpado.{lado}"] = {"rot": [(X, parpado)]}
        p[f"ceja.{lado}"] = {"rot": [(Y, -ceja[0] * s)], "loc": (0, 0, ceja[1])}
        sl = sonrisa + (asim if s == 1 else -asim)
        p[f"comisura.{lado}"] = {"loc": (-0.07 * o * s, 0, 0.03 * sl - 0.02 * o)}
    p["mandibula"] = {"loc": (0, 0, -0.06 * boca)}


def pose_reposo(f, N):
    p = {}
    r = onda(f, N)
    p["cuerpo.2"] = {"scale": (1 + 0.015 * r, 1 + 0.015 * r, 1 + 0.01 * r)}
    p["cabeza"] = {"rot": [(X, 0.03 * onda(f, N, 0.25)), (Y, 0.02 * onda(f, N * 2))]}
    cara(p, boca=-0.3, sonrisa=0.3)
    for lado, s in (("L", 1), ("R", -1)):
        p[f"antena.{lado}.1"] = {"rot": [(Y, 0.06 * s * onda(f, N, 0.1))]}
        p[f"antena.{lado}.2"] = {"rot": [(Y, 0.12 * s * onda(f, N, 0.3))]}
        p[f"brazo.{lado}"] = {"rot": [(Y, 0.04 * s * r)]}
    return p


def pose_hablar(f, N):
    p = pose_reposo(f, N)
    abre = max(0.0, 0.5 + 0.6 * onda(f, 9) * abs(onda(f, 23)))
    cara(p, boca=abre, sonrisa=0.4)
    p["cabeza"] = {"rot": [(X, 0.05 * onda(f, 12)), (Y, 0.04 * onda(f, N))]}
    for lado, s in (("L", 1), ("R", -1)):
        p[f"brazo.{lado}"] = {"rot": [(X, 0.25 * max(0, onda(f, N, 0 if s == 1 else 0.5))),
                                      (Y, -0.2 * s)]}
    return p


def pose_feliz(f, N):
    p = {}
    b = abs(onda(f, N / 2))
    p["raiz"] = {"loc": (0, 0, 0.06 * b), "scale": (1 + 0.03 * (1 - b), 1 + 0.03 * (1 - b),
                                                   1 - 0.04 * (1 - b))}
    p["cabeza"] = {"rot": [(X, -0.12 + 0.05 * onda(f, N / 2)), (Y, 0.05 * onda(f, N))]}
    cara(p, parpado=0.85, ceja=(-0.15, 0.025), boca=1.3, sonrisa=1.4)
    for lado, s in (("L", 1), ("R", -1)):
        p[f"brazo.{lado}"] = {"rot": [(Y, -0.6 * s - 0.2 * s * b), (X, 0.3)]}
        p[f"antena.{lado}.1"] = {"rot": [(Y, 0.15 * s * onda(f, N / 2))]}
        p[f"antena.{lado}.2"] = {"rot": [(Y, 0.3 * s * onda(f, N / 2, 0.2))]}
    return p


def pose_triste(f, N):
    p = {}
    r = onda(f, N)
    p["cuerpo.3"] = {"rot": [(X, 0.04)]}
    p["cabeza"] = {"rot": [(X, 0.07 + 0.02 * r)]}
    p["cuerpo.2"] = {"scale": (1 + 0.02 * r, 1 + 0.02 * r, 0.98)}
    cara(p, parpado=0.45, ceja=(-0.4, 0.03), boca=-1.4, sonrisa=-2.2)
    for lado, s in (("L", 1), ("R", -1)):
        p[f"antena.{lado}.1"] = {"rot": [(Y, 0.55 * s), (X, 0.3)]}
        p[f"antena.{lado}.2"] = {"rot": [(Y, 0.6 * s + 0.05 * r)]}
        p[f"brazo.{lado}"] = {"rot": [(Y, 0.18 * s)]}
    return p


def pose_enojado(f, N):
    p = {}
    tiembla = 0.03 * onda(f, 4)
    p["raiz"] = {"rot": [(Z, tiembla)], "scale": (1.02, 1.02, 0.97)}
    p["cabeza"] = {"rot": [(X, 0.05)]}
    cara(p, parpado=0.4, ceja=(0.45, -0.03), boca=-0.9, sonrisa=-1.3)
    for lado, s in (("L", 1), ("R", -1)):
        p[f"brazo.{lado}"] = {"rot": [(X, 0.5 + 0.1 * onda(f, 6)), (Y, 0.15 * s)]}
        p[f"antena.{lado}.1"] = {"rot": [(Y, -0.1 * s), (X, 0.25)]}
        p[f"antena.{lado}.2"] = {"rot": [(X, 0.3)]}
    return p


def pose_sorpresa(f, N):
    p = {}
    t = min(1.0, f / 6)
    salto = math.sin(math.pi * min(1.0, f / 12)) * 0.12
    p["raiz"] = {"loc": (0, 0, salto), "scale": (1 - 0.04 * t, 1 - 0.04 * t, 1 + 0.06 * t)}
    p["cabeza"] = {"rot": [(X, -0.1 * t)]}
    cara(p, parpado=-0.45 * t, ceja=(-0.1 * t, 0.06 * t), boca=1.2 * t, o=1.0 * t)
    for lado, s in (("L", 1), ("R", -1)):
        p[f"brazo.{lado}"] = {"rot": [(Y, -0.9 * s * t), (X, 0.4 * t)]}
        p[f"antena.{lado}.1"] = {"rot": [(Y, -0.15 * s * t + 0.08 * onda(f, 5) * (1 - f / N))]}
        p[f"antena.{lado}.2"] = {"rot": [(Y, -0.3 * s * t)]}
    return p


def pose_cool(f, N):
    p = {}
    nod = onda(f, N / 2)
    p["cuerpo.3"] = {"rot": [(X, -0.08)]}
    p["cabeza"] = {"rot": [(X, -0.12 + 0.06 * nod), (Y, 0.1)]}
    p["lentes"] = {"scale": (1, 1, 1)}
    cara(p, parpado=0.2, boca=-1.0, sonrisa=1.0, asim=0.8)
    for lado, s in (("L", 1), ("R", -1)):
        p[f"brazo.{lado}"] = {"rot": [(Y, -0.25 * s), (X, -0.2)]}
        p[f"antena.{lado}.1"] = {"rot": [(Y, 0.1 * s * nod)]}
    return p


def pose_arrastrarse(f, N):
    p = {}
    w = onda(f, N)
    p["raiz"] = {"scale": (1 - 0.05 * w, 1 + 0.12 * w, 1 - 0.1 * w)}
    p["cuerpo.1"] = {"rot": [(X, 0.08 * w)]}
    p["cuerpo.2"] = {"rot": [(X, -0.15 * w)]}
    p["cuerpo.3"] = {"rot": [(X, 0.12 * w)]}
    p["cabeza"] = {"rot": [(X, -0.1 * onda(f, N, 0.25))]}
    p["cola"] = {"rot": [(X, 0.4 * onda(f, N, 0.5))]}
    cara(p, boca=-0.5, sonrisa=0.5)
    for lado, s in (("L", 1), ("R", -1)):
        p[f"brazo.{lado}"] = {"rot": [(X, 0.3 * onda(f, N, 0 if s == 1 else 0.5))]}
        p[f"antena.{lado}.2"] = {"rot": [(X, 0.25 * onda(f, N, 0.3))]}
    return p


def pose_celebrar(f, N):
    p = {}
    fase = f / N
    if fase < 0.2:  # agacharse
        t = fase / 0.2
        p["raiz"] = {"scale": (1 + 0.08 * t, 1 + 0.08 * t, 1 - 0.15 * t)}
    elif fase < 0.75:  # salto
        t = (fase - 0.2) / 0.55
        alto = math.sin(math.pi * t) * 0.5
        p["raiz"] = {"loc": (0, 0, alto), "scale": (0.95, 0.95, 1.1)}
    else:  # caer y rebotar
        t = (fase - 0.75) / 0.25
        sq = math.sin(math.pi * t) * 0.15
        p["raiz"] = {"scale": (1 + 0.6 * sq, 1 + 0.6 * sq, 1 - sq)}
    arriba = suave(0.1, 0.3, fase) * (1 - suave(0.85, 1.0, fase))
    cara(p, parpado=0.85 * arriba, boca=1.4 * arriba, sonrisa=1.4 * arriba)
    for lado, s in (("L", 1), ("R", -1)):
        p[f"brazo.{lado}"] = {"rot": [(Y, -1.5 * s * arriba), (X, 0.2 * arriba)]}
        p[f"antena.{lado}.1"] = {"rot": [(Y, 0.3 * s * math.sin(fase * 12))]}
        p[f"antena.{lado}.2"] = {"rot": [(Y, 0.5 * s * math.sin(fase * 12 - 1))]}
    return p


def pose_caminar(f, N):
    p = {}
    fase = f / N
    paso = abs(math.sin(2 * math.pi * fase))
    lado_a_lado = math.sin(2 * math.pi * fase)
    p["raiz"] = {"loc": (0, 0, 0.07 * paso),
                 "rot": [(Z, 0.07 * lado_a_lado), (Y, 0.06 * lado_a_lado)],
                 "scale": (1 + 0.04 * (1 - paso), 1 + 0.04 * (1 - paso), 1 - 0.05 * (1 - paso))}
    p["cuerpo.3"] = {"rot": [(Y, -0.04 * lado_a_lado)]}
    p["cabeza"] = {"rot": [(Y, -0.05 * lado_a_lado), (X, -0.03 * paso)]}
    cara(p, boca=-0.2, sonrisa=0.6)
    for lado, s in (("L", 1), ("R", -1)):
        p[f"brazo.{lado}"] = {"rot": [(X, 0.45 * s * lado_a_lado), (Y, -0.15 * s)]}
        p[f"cola"] = {"rot": [(Z, 0.3 * lado_a_lado)]}
    return p


def pose_saludar(f, N):
    p = pose_reposo(f % 48, 48)
    t = suave(0, 6, f) * (1 - suave(N - 6, N, f))
    ola = math.sin(2 * math.pi * f / 12)
    p["cabeza"] = {"rot": [(Y, -0.1 * t), (X, -0.06 * t)]}
    cara(p, boca=0.4 * t, sonrisa=1.2 * t, ceja=(-0.1 * t, 0.02 * t))
    p["brazo.R"] = {"rot": [(Y, 1.9 * t), (X, 0.25 * t)]}
    p["mano.R"] = {"rot": [(X, 0.5 * ola * t)]}
    p["brazo.L"] = {"rot": [(Y, -0.1 * t)]}
    return p


ANIMACIONES = [
    ("Reposo", 48, pose_reposo),
    ("Hablar", 48, pose_hablar),
    ("Feliz", 24, pose_feliz),
    ("Triste", 48, pose_triste),
    ("Enojado", 24, pose_enojado),
    ("Sorpresa", 24, pose_sorpresa),
    ("Cool", 48, pose_cool),
    ("Arrastrarse", 32, pose_arrastrarse),
    ("Celebrar", 36, pose_celebrar),
    ("Caminar", 24, pose_caminar),
    ("Saludar", 48, pose_saludar),
]

CON_PARPADEO = {"Reposo", "Hablar", "Triste", "Enojado", "Cool", "Caminar", "Saludar",
                "Arrastrarse"}


def _z_raiz(p):
    return p.get("raiz", {}).get("loc", (0, 0, 0))[2]


def pose_completa(nombre, fn, f, N):
    """Pose con detalles que dan vida: parpadeo y antenas/cuerpo que siguen el movimiento."""
    p = fn(f, N)
    z0, z1, z2 = (_z_raiz(fn(k % (N + 1), N)) for k in (f - 1, f, f + 1))
    vel, acel = z2 - z0, z2 - 2 * z1 + z0
    for lado in ("L", "R"):
        for hueso, k in ((f"antena.{lado}.1", 2.5), (f"antena.{lado}.2", 6.0)):
            p.setdefault(hueso, {}).setdefault("rot", []).append((X, -k * vel))
    sc = p.setdefault("cuerpo.2", {}).get("scale", (1, 1, 1))
    p["cuerpo.2"]["scale"] = (sc[0] * (1 - 2 * acel), sc[1] * (1 - 2 * acel), sc[2] * (1 + 4 * acel))
    if nombre in CON_PARPADEO:
        for inicio in (int(N * 0.62), int(N * 0.62) + 5 if N >= 48 else -99):
            k = f - inicio
            if 0 <= k <= 4:
                cierre = (0.5, 1.0, 1.0, 0.6, 0.2)[k]
                for lado in ("L", "R"):
                    actual = sum(a for eje, a in p.get(f"parpado.{lado}", {}).get("rot", [])
                                 if eje == X)
                    extra = max(0.0, 1.15 - actual) * cierre
                    p.setdefault(f"parpado.{lado}", {}).setdefault("rot", []).append((X, extra))
                    p.setdefault(f"parpado_inf.{lado}", {}).setdefault("rot", []).append(
                        (X, -0.2 * cierre))
            if N < 48:
                break
    return p


def aplicar_pose(arm, p):
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
        datos = p.get(pb.name, {})
        pb.location = a_local(pb, datos.get("loc", (0, 0, 0)))
        pb.rotation_quaternion = rot_local(pb, datos.get("rot", []))
        esc = datos.get("scale", (1, 1, 1))
        if pb.name == "lentes" and "scale" not in datos:
            esc = (1e-4, 1e-4, 1e-4)
        pb.scale = escala_local(pb, esc)


def crear_animaciones(arm):
    arm.animation_data_create()
    for nombre, N, fn in ANIMACIONES:
        accion = bpy.data.actions.new(nombre)
        accion.use_fake_user = True
        arm.animation_data.action = accion
        for f in range(N + 1):
            aplicar_pose(arm, pose_completa(nombre, fn, f, N))
            for pb in arm.pose.bones:
                for prop in ("location", "rotation_quaternion", "scale"):
                    pb.keyframe_insert(prop, frame=f, group=pb.name)
        track = arm.animation_data.nla_tracks.new()
        track.name = nombre
        tira = track.strips.new(nombre, 0, accion)
        tira.name = nombre
        track.mute = True
    arm.animation_data.action = bpy.data.actions["Reposo"]


# --------------------------------------------------------------------------- texturas

TEX = 2048


def _nodo(nt, tipo, x, y, **props):
    n = nt.nodes.new(tipo)
    n.location = (x, y)
    for k, v in props.items():
        if k in n.inputs:
            n.inputs[k].default_value = v
        else:
            setattr(n, k, v)
    return n


def _mezcla(nt, x, y, fac, a, b):
    m = _nodo(nt, "ShaderNodeMix", x, y, data_type="RGBA")
    nt.links.new(fac, m.inputs["Factor"])
    for entrada, valor in ((m.inputs[6], a), (m.inputs[7], b)):
        if isinstance(valor, tuple):
            entrada.default_value = (*valor, 1)
        else:
            nt.links.new(valor, entrada)
    return m.outputs[2]


def piel_procedural(m):
    """Piel con manchitas, tono irregular, panza más clara y poros."""
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tc = _nodo(nt, "ShaderNodeTexCoord", -1600, 0)
    xyz = _nodo(nt, "ShaderNodeSeparateXYZ", -1400, -400)
    nt.links.new(tc.outputs["Object"], xyz.inputs[0])
    ruido = _nodo(nt, "ShaderNodeTexNoise", -1400, 300, Scale=2.5, Detail=4.0)
    nt.links.new(tc.outputs["Object"], ruido.inputs["Vector"])
    rampa = _nodo(nt, "ShaderNodeMapRange", -1200, 300, **{"From Min": 0.35, "From Max": 0.65})
    nt.links.new(ruido.outputs["Fac"], rampa.inputs["Value"])
    base = _mezcla(nt, -1000, 300, rampa.outputs[0],
                   tuple(c * 0.8 for c in PIEL), tuple(min(1, c * 1.12) for c in PIEL))
    # panza y cara un poco más claras
    claro = _nodo(nt, "ShaderNodeMapRange", -1200, -400, **{"From Min": 0.2, "From Max": -0.8,
                                                            "To Min": 0.0, "To Max": 0.35})
    nt.links.new(xyz.outputs["Y"], claro.inputs["Value"])
    base = _mezcla(nt, -800, 200, claro.outputs[0], base, (0.42, 0.52, 0.12))
    # manchitas oscuras, pocas y repartidas
    vor = _nodo(nt, "ShaderNodeTexVoronoi", -1400, -50, Scale=6.0)
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    mancha = _nodo(nt, "ShaderNodeMapRange", -1200, -50, **{"From Min": 0.09, "From Max": 0.05})
    nt.links.new(vor.outputs["Distance"], mancha.inputs["Value"])
    ruido2 = _nodo(nt, "ShaderNodeTexNoise", -1400, -250, Scale=1.6)
    nt.links.new(tc.outputs["Object"], ruido2.inputs["Vector"])
    filtro = _nodo(nt, "ShaderNodeMapRange", -1200, -250, **{"From Min": 0.55, "From Max": 0.6})
    nt.links.new(ruido2.outputs["Fac"], filtro.inputs["Value"])
    mascara = _nodo(nt, "ShaderNodeMath", -1000, -100, operation="MULTIPLY")
    nt.links.new(mancha.outputs[0], mascara.inputs[0])
    nt.links.new(filtro.outputs[0], mascara.inputs[1])
    color = _mezcla(nt, -600, 100, mascara.outputs[0], base, (0.1, 0.12, 0.02))
    nt.links.new(color, bsdf.inputs["Base Color"])
    # relieve: piel suave con poros y manchas apenas hundidas
    poros = _nodo(nt, "ShaderNodeTexNoise", -1000, -500, Scale=45.0, Detail=8.0)
    nt.links.new(tc.outputs["Object"], poros.inputs["Vector"])
    alto = _nodo(nt, "ShaderNodeMath", -800, -450, operation="MULTIPLY_ADD")
    nt.links.new(mascara.outputs[0], alto.inputs[0])
    alto.inputs[1].default_value = -0.4
    nt.links.new(poros.outputs["Fac"], alto.inputs[2])
    bump = _nodo(nt, "ShaderNodeBump", -600, -450, Strength=0.3, Distance=0.004)
    nt.links.new(alto.outputs[0], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


def tela_procedural(m):
    """Arrugas suaves y tejido de camiseta."""
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tc = _nodo(nt, "ShaderNodeTexCoord", -1200, 0)
    ondas = _nodo(nt, "ShaderNodeTexWave", -1000, 100, bands_direction="Z", Scale=4.0,
                  Distortion=6.0, Detail=3.0)
    nt.links.new(tc.outputs["Object"], ondas.inputs["Vector"])
    ruido = _nodo(nt, "ShaderNodeTexNoise", -1000, -150, Scale=60.0, Detail=2.0)
    nt.links.new(tc.outputs["Object"], ruido.inputs["Vector"])
    suma = _nodo(nt, "ShaderNodeMath", -800, 0, operation="MULTIPLY_ADD")
    nt.links.new(ondas.outputs["Fac"], suma.inputs[0])
    suma.inputs[1].default_value = 0.6
    nt.links.new(ruido.outputs["Fac"], suma.inputs[2])
    bump = _nodo(nt, "ShaderNodeBump", -600, 0, Strength=0.35, Distance=0.006)
    nt.links.new(suma.outputs[0], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


def hornear_texturas(mascota, arm):
    """Pasa la piel y la tela procedurales a imágenes que funcionan en la app (glTF)."""
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 4
    sc.render.bake.margin = 8
    arm.data.pose_position = "REST"
    bpy.ops.object.select_all(action="DESELECT")
    mascota.select_set(True)
    bpy.context.view_layer.objects.active = mascota
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
    bpy.ops.object.mode_set(mode="OBJECT")

    mats = {m.name: m for m in mascota.data.materials}
    piel_procedural(mats["Piel"])
    for nombre in ("Camiseta", "Camiseta_Ribete"):
        tela_procedural(mats[nombre])

    img_color = bpy.data.images.new("Piel_Color", TEX, TEX)
    img_normal = bpy.data.images.new("Mascota_Normal", TEX, TEX)
    img_normal.colorspace_settings.name = "Non-Color"
    nodos = {}
    for m in mascota.data.materials:
        n = m.node_tree.nodes.new("ShaderNodeTexImage")
        n.location = (-1800, 600)
        m.node_tree.nodes.active = n
        nodos[m.name] = n

    for n in nodos.values():
        n.image = img_color
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, use_clear=True)
    for n in nodos.values():
        n.image = img_normal
    bpy.ops.object.bake(type="NORMAL", use_clear=True)

    for m in mascota.data.materials:
        m.node_tree.nodes.remove(nodos[m.name])
    for img in (img_color, img_normal):
        img.pack()

    # Materiales finales: imágenes en lugar de nodos procedurales
    def limpiar(m):
        nt = m.node_tree
        bsdf = nt.nodes["Principled BSDF"]
        salida = nt.nodes["Material Output"]
        for n in list(nt.nodes):
            if n not in (bsdf, salida):
                nt.nodes.remove(n)
        return nt, bsdf

    def mapa_normal(nt, bsdf, fuerza=1.0):
        img = _nodo(nt, "ShaderNodeTexImage", -700, -300, image=img_normal)
        nm = _nodo(nt, "ShaderNodeNormalMap", -350, -300, Strength=fuerza)
        nt.links.new(img.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])

    nt, bsdf = limpiar(mats["Piel"])
    img = _nodo(nt, "ShaderNodeTexImage", -700, 200, image=img_color)
    nt.links.new(img.outputs["Color"], bsdf.inputs["Base Color"])
    mapa_normal(nt, bsdf)
    for nombre in ("Camiseta", "Camiseta_Ribete"):
        nt, bsdf = limpiar(mats[nombre])
        mapa_normal(nt, bsdf)
    arm.data.pose_position = "POSE"


# --------------------------------------------------------------------------- escena y guardado

def preparar_escena():
    sc = bpy.context.scene
    mundo = bpy.data.worlds.new("Mundo")
    mundo.use_nodes = True
    mundo.node_tree.nodes["Background"].inputs["Color"].default_value = (0.03, 0.032, 0.04, 1)
    sc.world = mundo
    for nombre, pos, energia, tam, color in (
        ("Luz_Principal", (-2.5, -3.2, 3.2), 900, 2.5, (1, 0.96, 0.9)),
        ("Luz_Relleno", (3, -2.5, 1.5), 300, 3.0, (0.85, 0.9, 1)),
        ("Luz_Contorno", (1.5, 3.0, 2.8), 700, 1.5, (0.6, 0.75, 1)),
    ):
        luz = bpy.data.lights.new(nombre, "AREA")
        luz.energy = energia
        luz.size = tam
        luz.color = color
        o = bpy.data.objects.new(nombre, luz)
        sc.collection.objects.link(o)
        o.location = pos
        o.rotation_euler = (Vector((0, 0, 1.1)) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    suelo = bpy.data.meshes.new("Suelo")
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, segments=64, radius=4)
    bm.to_mesh(suelo)
    bm.free()
    o = bpy.data.objects.new("Suelo", suelo)
    sc.collection.objects.link(o)
    suelo.materials.append(material("Suelo", (0.035, 0.037, 0.045), 0.8))
    cam = bpy.data.cameras.new("Camara")
    cam.lens = 60
    o = bpy.data.objects.new("Camara", cam)
    sc.collection.objects.link(o)
    sc.camera = o
    return o


def apuntar(cam, pos, objetivo=(0, 0, 1.1)):
    cam.location = pos
    cam.rotation_euler = (Vector(objetivo) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()


def exportar(mascota, arm):
    bpy.ops.object.select_all(action="DESELECT")
    mascota.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(SALIDA, "mascota.glb"),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_skins=True,
        export_morph=False,
        export_apply=False,
        export_yup=True,
        export_image_format="JPEG",
        export_jpeg_quality=85,
    )


def main():
    mascota, arm = construir()
    crear_animaciones(arm)
    hornear_texturas(mascota, arm)
    cam = preparar_escena()
    apuntar(cam, (2.2, -5.2, 1.6))
    exportar(mascota, arm)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(SALIDA, "mascota.blend")))
    tris = sum(len(p.vertices) - 2 for p in mascota.data.polygons)
    print(f"Listo: {len(mascota.data.vertices)} vértices, {tris} triángulos, "
          f"{len(arm.data.bones)} huesos, {len(ANIMACIONES)} animaciones")


if __name__ == "__main__":
    main()
