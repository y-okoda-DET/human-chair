# 陶器人形の女中：白磁の顔と手、球の関節、黒い長い服に白い前掛け。灯りを提げる右腕は前へ。
# python3 -c "import sys; sys.argv=['x','--','out.glb','prev.png']; exec(open('blender/maid.py').read())"
import bpy, bmesh, math, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "blender/maid-raw.glb"
PREV = argv[1] if len(argv) > 1 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, col, rough, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    return m
PORC = mat("porcelain", (0.92, 0.89, 0.84), 0.18)
DRESS = mat("dress", (0.02, 0.02, 0.025), 0.7)
APRON = mat("apron", (0.85, 0.83, 0.78), 0.8)
HAIR = mat("hair", (0.015, 0.01, 0.01), 0.35)
EYE = mat("eye", (0.01, 0.01, 0.012), 0.05)
LIP = mat("lip", (0.45, 0.04, 0.05), 0.3)

def smooth(ob, m, sub=0):
    ob.data.materials.append(m)
    for p in ob.data.polygons: p.use_smooth = True
    if sub:
        md = ob.modifiers.new("s", "SUBSURF"); md.levels = sub; md.render_levels = sub
    return ob

def lathe(name, prof, m, seg=32, loc=(0, 0, 0)):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rings = []
    for (r, z) in prof:
        rings.append([bm.verts.new((r*math.cos(2*math.pi*i/seg), r*math.sin(2*math.pi*i/seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg): bm.faces.new((a[i], a[(i+1) % seg], b[(i+1) % seg], b[i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); ob.location = loc
    return smooth(ob, m)

def sphere(name, r, loc, m, scale=(1, 1, 1), seg=24, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg//2, radius=r, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = scale; smooth(o, m)
    if parent: o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o

def cyl(name, r1, r2, length, a, b, m, parent=None):
    # a から b へ伸びる、太さの変わる円筒
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=r1, radius2=r2, depth=d.length, location=(a+b)/2)
    o = bpy.context.active_object; o.name = name; o.rotation_euler = d.to_track_quat("Z", "Y").to_euler(); smooth(o, m)
    if parent: o.parent = parent; o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o

# 前は +Y。足元 z=0、背丈 1.58
skirt = lathe("skirt", [(0.0, 0.0), (0.30, 0.0), (0.31, 0.03), (0.27, 0.35), (0.21, 0.70), (0.16, 0.92), (0.0, 0.93)], DRESS)
# 裾の揺れ：前後に少し波打たせる
for v in skirt.data.vertices:
    if v.co.z < 0.4: v.co.x += 0.012*math.sin(math.atan2(v.co.y, v.co.x)*6)*(0.4-v.co.z)/0.4
bodice = lathe("bodice", [(0.0, 0.88), (0.15, 0.88), (0.17, 1.02), (0.16, 1.18), (0.12, 1.28), (0.06, 1.33), (0.0, 1.34)], DRESS)
bodice.scale = (1.0, 0.78, 1.0)
# 前掛け：胸当てと、膝下までの布。少し身体に沿わせて曲げる
def apron_panel(name, w, top, bot, y0, bulge):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    nx, nz = 10, 16; vs = []
    for j in range(nz+1):
        z = top - (top-bot)*j/nz; row = []
        ww = w*(0.75 + 0.35*j/nz)
        for i in range(nx+1):
            x = -ww/2 + ww*i/nx
            y = y0 + bulge*(1-(2*i/nx-1)**2) - 0.012*math.sin(j*1.3)*(j/nz)
            row.append(bm.verts.new((x, y, z)))
        vs.append(row)
    for j in range(nz):
        for i in range(nx): bm.faces.new((vs[j][i], vs[j][i+1], vs[j+1][i+1], vs[j+1][i]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.006)
    bm.to_mesh(me); bm.free(); ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); return smooth(ob, APRON)
apron_panel("apron", 0.30, 0.90, 0.30, 0.19, 0.06)
apron_panel("bib", 0.20, 1.22, 0.90, 0.135, 0.02)
# 襟
lathe("collar", [(0.0, 1.30), (0.085, 1.30), (0.075, 1.35), (0.0, 1.35)], APRON)
# 首と頭（頭は別の結び目にして、首をかしげられるようにする）
neck = lathe("neck", [(0.0, 1.32), (0.035, 1.32), (0.03, 1.40), (0.0, 1.40)], PORC)
head = bpy.data.objects.new("head", None); sc.collection.objects.link(head); head.location = (0, 0, 1.40)
skull = sphere("skull", 0.095, (0, 0.0, 1.49), PORC, scale=(0.92, 0.96, 1.08), parent=head)
# 顔：ガラスの目、細い眉、小さな紅
for sx in (-1, 1):
    sphere(f"eye{sx}", 0.017, (sx*0.034, 0.078, 1.50), EYE, scale=(1.2, 0.6, 0.9), seg=16, parent=head)
    cyl(f"brow{sx}", 0.003, 0.002, 0.03, (sx*0.018, 0.085, 1.528), (sx*0.05, 0.078, 1.535), HAIR, parent=head)
sphere("lip", 0.012, (0, 0.085, 1.448), LIP, scale=(1.3, 0.5, 0.55), seg=12, parent=head)
# 髪：額の上で分け、後ろで髷
sphere("hair", 0.10, (0, -0.012, 1.515), HAIR, scale=(0.95, 0.98, 1.0), parent=head)
for o in [sc.objects["hair"]]:
    for v in o.data.vertices:
        if v.co.y > 0.04 and v.co.z < 0.02: v.co.y -= 0.05  # 顔の前を空ける
sphere("bun", 0.055, (0, -0.09, 1.55), HAIR, parent=head)
# 白いレースの帽子
cap = lathe("cap", [(0.0, 1.585), (0.07, 1.585), (0.10, 1.575), (0.11, 1.565), (0.0, 1.60)], APRON); cap.parent = head; cap.matrix_parent_inverse = head.matrix_world.inverted()
cap.scale = (1.0, 0.85, 1.0)
# 腕：球の関節でつないだ人形の腕。左は下げ、右は灯りを提げて前へ
def arm(side, hand_to):
    sh = Vector((side*0.17, 0.0, 1.24))
    root = bpy.data.objects.new(f"arm{'L' if side<0 else 'R'}", None); sc.collection.objects.link(root); root.location = sh
    sphere(f"shoulder{side}", 0.045, sh, DRESS, parent=root)
    el = sh + Vector(hand_to[0]); wr = sh + Vector(hand_to[1])
    cyl(f"upper{side}", 0.04, 0.032, 0, sh, el, DRESS, parent=root)
    sphere(f"elbow{side}", 0.03, el, PORC, parent=root)
    cyl(f"fore{side}", 0.03, 0.024, 0, el, wr, DRESS, parent=root)
    sphere(f"cuff{side}", 0.028, wr, APRON, scale=(1, 1, 0.5), parent=root)
    sphere(f"hand{side}", 0.026, wr + (wr-el).normalized()*0.035, PORC, scale=(0.8, 1, 1.25), parent=root)
    return root
arm(-1, [(-0.03, 0.02, -0.25), (-0.02, 0.06, -0.48)])
arm(1, [(0.02, 0.12, -0.22), (0.0, 0.34, -0.26)])

for ob in list(sc.objects):
    if ob.type != "MESH": continue
    bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    for md in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
print("polys", sum(len(o.data.polygons) for o in sc.objects if o.type == "MESH"))
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_yup=True, export_materials="EXPORT", export_image_format="NONE")

if PREV:
    cam = bpy.data.cameras.new("cam"); co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co)
    co.location = (1.1, 2.2, 1.3); d = Vector((0, 0, 0.95)) - co.location; co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler(); sc.camera = co; cam.lens = 50
    for loc, e in [((1.5, 1.5, 2.5), 250), ((-2, 1, 1.5), 60), ((0, -2, 2), 80)]:
        l = bpy.data.lights.new("l", "POINT"); l.energy = e; lo = bpy.data.objects.new("l", l); lo.location = loc; sc.collection.objects.link(lo)
    bpy.ops.mesh.primitive_plane_add(size=6); bpy.context.active_object.data.materials.append(mat("floor", (0.08, 0.05, 0.035), 0.6))
    sc.render.engine = "CYCLES"; sc.cycles.samples = 24; sc.render.resolution_x = 480; sc.render.resolution_y = 720; sc.render.filepath = PREV
    sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.03, 0.03, 0.035)
    bpy.ops.render.render(write_still=True)
