# 応接間と表の廊下：床・壁・天井を src/walk.js の間取りから組み、光の回り込み（間接光と陰）を焼き込む。
# 直接光はゲームの灯りがそのまま当てるので、ここでは跳ね返りの光と隅の暗がりだけを焼く。
# python3 -c "import sys; sys.argv=['x','--','blender/room-raw.glb','blender/room_lm.png', SAMPLES]; exec(open('blender/room.py').read())"
import bpy, bmesh, math, sys, re
from mathutils import Vector
argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "blender/room-raw.glb"
LM = argv[1] if len(argv) > 1 else "public/tex/room_lm.png"
SAMPLES = int(argv[2]) if len(argv) > 2 else 64
RES = 1024
BAKE = set("RF")

src = open("src/walk.js").read()
MAP = re.findall(r'^"([#A-Za-z]{23})"', src, re.M)
cell = lambda x, z: MAP[int(math.floor(z))][int(math.floor(x))] if 0 <= z < len(MAP) and 0 <= x < len(MAP[0]) else "#"
H = 3.2

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
# ゲームの座標 (x, y, z)［yが上］→ Blender (x, -z, y)
B = lambda x, y, z: Vector((x, -z, y))

def mat(name, col):
    m = bpy.data.materials.new(name); m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*col, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.8
    return m
# 跳ね返りの色を決める、だいたいの地の色（寄木の茶、緑の壁、暗い天井）
MATS = {"floor": mat("floor", (0.18, 0.09, 0.05)), "wall": mat("wall", (0.06, 0.10, 0.06)), "ceil": mat("ceil", (0.03, 0.025, 0.02))}

me = bpy.data.meshes.new("room"); bm = bmesh.new()
uv0 = bm.loops.layers.uv.new("uv"); uv1 = bm.loops.layers.uv.new("lm")
slots = list(MATS)
def quad(kind, pts, uvs):
    vs = [bm.verts.new(B(*p)) for p in pts]
    f = bm.faces.new(vs); f.material_index = slots.index(kind)
    for l, uv in zip(f.loops, uvs): l[uv0].uv = uv
for z in range(len(MAP)):
    for x in range(len(MAP[0])):
        c = MAP[z][x]
        if c not in BAKE: continue
        # 床（上向き）。ゲームと同じUV：2mで一巡り
        quad("floor", [(x, 0, z), (x, 0, z+1), (x+1, 0, z+1), (x+1, 0, z)], [(x/2, z/2), (x/2, (z+1)/2), ((x+1)/2, (z+1)/2), ((x+1)/2, z/2)])
        # 天井（下向き）
        quad("ceil", [(x, H, z), (x+1, H, z), (x+1, H, z+1), (x, H, z+1)], [(x, z), (x+1, z), (x+1, z+1), (x, z+1)])
        # 壁：隣が壁の時だけ、内向きに立てる
        for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if cell(x+dx+0.5, z+dz+0.5) != "#": continue
            if dx == 1: a, b = (x+1, z+1), (x+1, z)
            elif dx == -1: a, b = (x, z), (x, z+1)
            elif dz == 1: a, b = (x, z+1), (x+1, z+1)
            else: a, b = (x+1, z), (x, z)
            a, b = b, a  # 内向きに表を向ける
            ua, ub = a[0]+a[1], b[0]+b[1]
            quad("wall", [(a[0], 0, a[1]), (b[0], 0, b[1]), (b[0], H, b[1]), (a[0], H, a[1])], [(ua, 1), (ub, 1), (ub, 0), (ua, 0)])  # glTFは縦が逆さになるので、上下を返しておく
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
# 同じ面の上に並ぶマス目を一枚にまとめる（光の継ぎ目が出ないように）
bmesh.ops.dissolve_limit(bm, angle_limit=0.01, verts=bm.verts, edges=bm.edges, delimit={"MATERIAL", "NORMAL"})
bm.normal_update(); bm.to_mesh(me); bm.free()
room = bpy.data.objects.new("room", me); sc.collection.objects.link(room)
for k in slots: me.materials.append(MATS[k])
for p in me.polygons: p.use_smooth = False

# 光の焼き込み用のUV（重ならないように並べ直す）
bpy.context.view_layer.objects.active = room; room.select_set(True)
me.uv_layers.active = me.uv_layers["lm"]
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(30), island_margin=0.008, area_weight=0.0, scale_to_bounds=False)
bpy.ops.object.mode_set(mode="OBJECT")

# 影を落とす家具（焼くだけで、書き出さない）。応接間の椅子と円卓、廊下の飾り棚と長椅子
blockers = bpy.data.collections.new("blockers"); sc.collection.children.link(blockers)
def blocker(w, h, d, x, y, z, ry=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=B(x, y+h/2, z))
    o = bpy.context.active_object; o.scale = (w, d, h); o.rotation_euler.z = ry
    for c in o.users_collection: c.objects.unlink(o)
    blockers.objects.link(o); o.data.materials.append(MATS["floor"])
for x, z, ry in [(1.6, 1.6, .25), (1.5, 3.0, .5), (1.5, 5.6, .75), (3.4, 6.4, 1), (5.3, 6.4, 1), (5.4, 1.6, -.2), (5.0, 5.5, -.8)]:
    blocker(0.73, 0.75, 0.71, x, 0, z, ry*math.pi); blocker(0.73, 0.5, 0.15, x, 0.6, z, ry*math.pi)
bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.06, location=B(3.6, 0.72, 2.6))
t = bpy.context.active_object; [c.objects.unlink(t) for c in t.users_collection]; blockers.objects.link(t)
blocker(1.1, 1.5, 0.42, 9.0, 0, 3.24); blocker(1.5, 0.6, 0.6, 12.0, 0, 4.68); blocker(1.1, 1.5, 0.42, 15.1, 0, 3.24)

# 灯り：ゲームの LIGHTS と同じ場所。廊下の奥の大広間の明かりも、廊下へ回り込む
LIGHTS = [(3.5, 2.7, 3.6, (1.0, 0.66, 0.38), 1.1), (11.5, 2.5, 4.0, (1.0, 0.6, 0.31), 0.9), (18.2, 5.2, 4.6, (1.0, 0.69, 0.44), 1.4)]
for x, y, z, col, i in LIGHTS:
    l = bpy.data.lights.new("lamp", "POINT"); l.energy = 120*i; l.color = col; l.shadow_soft_size = 0.12
    o = bpy.data.objects.new("lamp", l); o.location = B(x, y, z); sc.collection.objects.link(o)
# 壁の燭台（ゲームの灯りの粒と同じ場所）
for x, y, z in [(1.08, 2.1, 2.4), (1.08, 2.1, 4.8), (10.2, 2.1, 3.06), (13.4, 2.1, 4.94)]:
    l = bpy.data.lights.new("sconce", "POINT"); l.energy = 18; l.color = (1.0, 0.7, 0.42); l.shadow_soft_size = 0.05
    o = bpy.data.objects.new("sconce", l); o.location = B(x, y, z); sc.collection.objects.link(o)
sc.world = bpy.data.worlds.new("w"); sc.world.color = (0, 0, 0)

# 焼く：間接光だけ（直接光はゲームの灯りが受け持つ）。色は掛けず、光の量だけ
img = bpy.data.images.new("room_lm", RES, RES, float_buffer=True)
for m in MATS.values():
    n = m.node_tree.nodes.new("ShaderNodeTexImage"); n.image = img; m.node_tree.nodes.active = n
sc.render.engine = "CYCLES"; sc.cycles.samples = SAMPLES; sc.cycles.device = "CPU"
sc.cycles.use_denoising = False
bpy.ops.object.select_all(action="DESELECT"); room.select_set(True); bpy.context.view_layer.objects.active = room
bpy.ops.object.bake(type="DIFFUSE", pass_filter={"INDIRECT"}, margin=6, use_clear=True)

# 8bitに収める：明るさを LM_SCALE で割り、ガンマを掛けて保存（ゲーム側で掛け戻す）
LM_SCALE = 0.5
px = list(img.pixels)
mx = max(px[i] for i in range(0, len(px), 4) if True)
print("lightmap max", mx)
out = bpy.data.images.new("lm8", RES, RES, alpha=False)
out.pixels = [min(1.0, (v/LM_SCALE)) ** (1/2.2) if (i % 4) != 3 else 1.0 for i, v in enumerate(px)]
out.filepath_raw = LM; out.file_format = "PNG"; out.save()

# 焼く用の家具と灯りを外して、床・壁・天井だけを書き出す
for o in list(blockers.objects): bpy.data.objects.remove(o)
for m in MATS.values():
    for n in [n for n in m.node_tree.nodes if n.type == "TEX_IMAGE"]: m.node_tree.nodes.remove(n)
me.uv_layers.active = me.uv_layers["uv"]; me.uv_layers["uv"].active_render = True
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_yup=True, export_materials="EXPORT", export_image_format="NONE", use_selection=True, export_lights=False)
print("faces", len(me.polygons))
