# 主役の肘掛椅子を台本で組む：深く鋲留めした背、巻いた肘、ろくろ挽きの脚、真鍮の鋲。
# blender --background --python blender/chair.py -- out.glb [preview.png]
import bpy, bmesh, math, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "public/models/chair.glb"
PREV = argv[1] if len(argv) > 1 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, col, rough, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    return m
LEATHER = mat("leather", (0.32, 0.12, 0.07), 0.45)
WOOD = mat("wood", (0.12, 0.06, 0.03), 0.35)
BRASS = mat("brass", (0.8, 0.6, 0.3), 0.3, 1.0)

def finish(ob, m, sub=2, smooth=True):
    ob.data.materials.append(m)
    if sub:
        md = ob.modifiers.new("sub", "SUBSURF"); md.levels = sub; md.render_levels = sub
    if smooth:
        for p in ob.data.polygons: p.use_smooth = True
    return ob

def link(ob, name):
    ob.name = name; sc.collection.objects.link(ob); return ob

def box(name, size, loc, m, sub=2, bevel=0.0):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x*size[0], v.co.y*size[1], v.co.z*size[2]))
    if bevel: bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=4, profile=0.5, affect="EDGES")
    bm.to_mesh(me); bm.free()
    ob = link(bpy.data.objects.new(name, me), name); ob.location = loc
    return finish(ob, m, sub)

# --- 寸法（m）。座の高さ0.42、幅0.86、奥行0.84、背の上端1.02。中に人ひとり ---
W, D = 0.86, 0.84

# 胴（座の下の箱）：前は少し膨らむ
box("body", (W, D, 0.30), (0, 0, 0.27), LEATHER, sub=0, bevel=0.04)
# 座のクッション
box("cushion", (W-0.2, D-0.2, 0.12), (0, 0.06, 0.47), LEATHER, sub=0, bevel=0.05)

# 背：鋲留めの格子に窪みをつけた曲面。少し後ろへ傾ける
def tufted(name, w, h, nx, ny, depth, thick):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    res_x, res_y = 48, 52
    grid = bmesh.ops.create_grid(bm, x_segments=res_x, y_segments=res_y, size=0.5)
    btn = []
    for j in range(ny):
        for i in range(nx - (j % 2)):
            bx = (i + (0.5 if j % 2 else 0) + 0.5)/nx - 0.5
            by = (j + 0.5)/ny - 0.5
            btn.append((bx*w, by*h))
    for v in bm.verts:
        x, y = v.co.x*w, v.co.y*h
        z = 0.0
        for bx, by in btn:
            d2 = ((x-bx)/(w/nx*0.42))**2 + ((y-by)/(h/ny*0.42))**2
            z += depth*math.exp(-d2*2.2)
        # 全体を緩く丸める（縁が座る人の側へ回り込む）
        z -= 0.06*((x/(w/2))**2) + 0.02*((y/(h/2))**4)
        v.co = Vector((x, y, z))
    bm.normal_update()
    ret = bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=thick)
    bm.to_mesh(me); bm.free()
    ob = link(bpy.data.objects.new(name, me), name)
    finish(ob, LEATHER, sub=1)
    return ob, btn

back, btns = tufted("back", W-0.06, 0.62, 5, 4, 0.035, 0.10)
back.rotation_euler = (math.radians(102), 0, 0)
back.location = (0, -D/2+0.12, 0.74)
# 鋲（ボタン）：背の窪みに革くるみの小さな釦
for k, (bx, by) in enumerate(btns):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.014, location=(bx, by, 0.035-0.012-0.06*((bx/((W-0.06)/2))**2)))
    s = bpy.context.active_object; s.scale.z = 0.5; s.name = f"btn{k}"
    s.data.materials.append(LEATHER); s.parent = back
# 背の上の巻き（笠木代わりの革の丸み）
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.07, depth=W-0.02, location=(0, -D/2+0.05, 1.04), rotation=(0, math.radians(90), 0))
top = bpy.context.active_object; top.name = "backroll"; finish(top, LEATHER, sub=0)
# 背の裏板（外から見える革の背）
box("backpanel", (W-0.02, 0.08, 0.66), (0, -D/2+0.03, 0.72), LEATHER, sub=0, bevel=0.03)

# 肘：板＋外へ巻いた丸み（スクロール）
def arm(side):
    x = side*(W/2-0.06)
    a = box(f"arm_{'L' if side<0 else 'R'}", (0.12, D-0.06, 0.30), (x, 0.0, 0.57), LEATHER, sub=0, bevel=0.03)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.085, depth=D-0.02, location=(x+side*0.03, 0.0, 0.73), rotation=(math.radians(90), 0, 0))
    r = bpy.context.active_object; r.name = f"armroll_{'L' if side<0 else 'R'}"; finish(r, LEATHER, sub=0)
    # 肘の前の渦巻き（前面の円盤）
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.09, depth=0.03, location=(x+side*0.03, D/2-0.0, 0.72), rotation=(math.radians(90), 0, 0))
    f = bpy.context.active_object; f.name = f"armface_{'L' if side<0 else 'R'}"; finish(f, WOOD, sub=0)
    # 前の縁の真鍮鋲
    for i in range(9):
        t = i/8; ang = math.radians(-100 + 290*t)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.008, location=(x+side*0.03+math.cos(ang)*0.085, D/2+0.017, 0.72+math.sin(ang)*0.085))
        n = bpy.context.active_object; n.name = f"nail_arm{side}_{i}"; n.data.materials.append(BRASS)
arm(-1); arm(1)
# 前の縁の真鍮鋲の列
for i in range(17):
    x = -W/2+0.05 + (W-0.1)*i/16
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.009, location=(x, D/2+0.012, 0.36))
    n = bpy.context.active_object; n.name = f"nail_f{i}"; n.data.materials.append(BRASS)

# 脚：ろくろ挽き（輪郭を回して作る）。前脚は玉、後脚は細く外へ反る
def turned(name, loc, prof, rear=False):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    seg = 20; rings = []
    for (r, z) in prof:
        ring = [bm.verts.new((r*math.cos(2*math.pi*i/seg), r*math.sin(2*math.pi*i/seg), z)) for i in range(seg)]
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            bm.faces.new((a[i], a[(i+1) % seg], b[(i+1) % seg], b[i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bm.to_mesh(me); bm.free()
    ob = link(bpy.data.objects.new(name, me), name); ob.location = loc
    if rear: ob.rotation_euler = (math.radians(-8), 0, 0)
    for p in ob.data.polygons: p.use_smooth = True
    ob.data.materials.append(WOOD)
    # 足先の真鍮のキャスター
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.022, location=(0, 0, 0.02))
    c = bpy.context.active_object; c.name = name+"_caster"; c.data.materials.append(BRASS); c.parent = ob
    return ob
front = [(0.020, 0.0), (0.024, 0.03), (0.036, 0.05), (0.042, 0.08), (0.030, 0.11), (0.026, 0.125), (0.036, 0.14), (0.028, 0.15)]
reard = [(0.018, 0.0), (0.022, 0.04), (0.025, 0.09), (0.027, 0.13), (0.027, 0.15)]
legs = [("leg_FL", (-W/2+0.07, D/2-0.07, 0.0), front, False), ("leg_FR", (W/2-0.07, D/2-0.07, 0.0), front, False),
        ("leg_BL", (-W/2+0.07, -D/2+0.07, 0.0), reard, True), ("leg_BR", (W/2-0.07, -D/2+0.07, 0.0), reard, True)]
for n, l, p, r in legs: turned(n, l, p, r)

# 座の下の縁を少し浮かせる（脚の上に胴）
for ob in sc.objects:
    if not ob.name.startswith("leg") and not ob.parent and ob.type == "MESH": ob.location.z += 0.0

# 修飾子を適用し、UVを付ける
bpy.ops.object.select_all(action="DESELECT")
for ob in list(sc.objects):
    if ob.type != "MESH": continue
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    for md in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.02, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT"); ob.select_set(False)

# Three.js 向け：+Y上・-Z前に合わせて書き出す（glTFの変換に任せる。前は +Y→glTFの -Z）
tri = sum(len(o.data.polygons) for o in sc.objects if o.type == "MESH")
print("polys", tri)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT", export_image_format="NONE")

if PREV:
    cam = bpy.data.cameras.new("cam"); co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co)
    co.location = (1.7, 2.1, 1.35); d = Vector((0, 0, 0.5)) - co.location; co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler(); sc.camera = co; cam.lens = 45
    for loc, e in [((2, 1, 2.5), 300), ((-2, 2, 1.5), 80)]:
        l = bpy.data.lights.new("l", "POINT"); l.energy = e; lo = bpy.data.objects.new("l", l); lo.location = loc; sc.collection.objects.link(lo)
    bpy.ops.mesh.primitive_plane_add(size=6); pl = bpy.context.active_object; pl.data.materials.append(mat("floor", (0.08, 0.05, 0.035), 0.6))
    sc.render.engine = "CYCLES"; sc.cycles.samples = 24; sc.cycles.device = "CPU"
    sc.render.resolution_x = 640; sc.render.resolution_y = 640; sc.render.filepath = PREV
    sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.02, 0.02, 0.025)
    bpy.ops.render.render(write_still=True)
