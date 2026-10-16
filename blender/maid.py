# 陶器人形の女中：絵付けの白磁の顔に細いひび、球の関節の腕、襞の寄った黒い長い服に白い前掛け。
# 右手に手提げのランプ。頭は "head" の結び目ごとかしげられる。前は +Y、足元 z=0、背丈およそ 1.6
# python3 -c "import sys; sys.argv=['x','--','out.glb','prev.png']; exec(open('blender/maid.py').read())"
import bpy, bmesh, math, sys, random, os, tempfile
from mathutils import Vector
from PIL import Image, ImageDraw, ImageFilter
argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "blender/maid-raw.glb"
PREV = argv[1] if len(argv) > 1 else None
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
TMP = tempfile.mkdtemp()

# ---------- 絵付け：顔の地、頬紅、眉、睫毛、目、唇、細かい貫入と、頬を走る一筋のひび ----------
TW, TH = 2048, 1024; K = 2.4   # K：画素の大きさの倍率
def uv_of(az, el):  # 方位（正面0、右が+）と仰角（度）→ 画素
    return (0.5 + az/360.0)*TW, (0.5 - el/180.0)*TH
def E(cx, cy, w, h): return (cx-w*K, cy-h*K, cx+w*K, cy+h*K)
def face_texture(path):
    im = Image.new("RGB", (TW, TH), (236, 228, 214)); d = ImageDraw.Draw(im, "RGBA")
    blush = Image.new("L", (TW, TH), 0); bd = ImageDraw.Draw(blush)
    for sx in (-1, 1):
        x, y = uv_of(sx*29, -14); bd.ellipse(E(x, y, 30, 22), fill=140)
    blush = blush.filter(ImageFilter.GaussianBlur(14*K))
    im = Image.composite(Image.new("RGB", (TW, TH), (226, 150, 140)), im, blush); d = ImageDraw.Draw(im, "RGBA")
    for sx in (-1, 1):
        x, y = uv_of(sx*20, 3); d.ellipse(E(x, y-2*K, 21, 12), fill=(150, 110, 100, 60))
    im = im.filter(ImageFilter.GaussianBlur(2*K)); d = ImageDraw.Draw(im, "RGBA")
    for sx in (-1, 1):
        cx, cy = uv_of(sx*20, 2)
        d.ellipse(E(cx, cy, 16, 9.5), fill=(240, 236, 228))
        d.ellipse(E(cx, cy, 9.5, 9.5), fill=(48, 30, 22)); d.ellipse(E(cx, cy, 5.5, 5.5), fill=(8, 6, 6))
        d.ellipse(E(cx-2*K+sx*2*K, cy-4.5*K, 2.6, 2.6), fill=(255, 255, 255, 235))
        d.arc(E(cx, cy, 18, 12), 195, 345, fill=(20, 12, 10), width=int(4*K))
        for i in range(7):
            t = math.radians(200 + i*21); x0 = cx + 18*K*math.cos(t); y0 = cy + 12*K*math.sin(t)
            d.line((x0, y0, x0 + 5*K*math.cos(t) + sx*1.5*K, y0 + 7*K*math.sin(t) - 2*K), fill=(20, 12, 10), width=int(2*K))
        d.arc(E(cx, cy-10*K, 21, 10), 200, 340, fill=(30, 20, 10), width=int(1*K))
        bx, by = uv_of(sx*21, 13); d.arc(E(bx, by+4*K, 21, 10), 205, 335, fill=(70, 40, 30), width=int(3*K))
    lx, ly = uv_of(0, -22)
    d.polygon([(lx-12*K, ly), (lx-5*K, ly-6*K), (lx, ly-3*K), (lx+5*K, ly-6*K), (lx+12*K, ly), (lx+5*K, ly+5*K), (lx-5*K, ly+5*K)], fill=(150, 26, 34))
    d.line((lx-11*K, ly, lx+11*K, ly), fill=(70, 10, 14), width=int(2*K))
    for sx in (-1, 1):
        nx, ny = uv_of(sx*4, -10); d.ellipse(E(nx, ny, 2, 1.2), fill=(150, 100, 90))
    for _ in range(320):
        x, y = random.uniform(0, TW), random.uniform(0, TH); pts = [(x, y)]
        for _ in range(random.randint(2, 5)):
            x += random.uniform(-14, 14)*K; y += random.uniform(-14, 14)*K; pts.append((x, y))
        d.line(pts, fill=(120, 100, 80, 26), width=1)
    x, y = uv_of(-12, 34); pts = [(x, y)]
    for i in range(16):
        x += random.uniform(-6, 2)*K; y += random.uniform(9, 13)*K; pts.append((x, y))
    d.line(pts, fill=(60, 44, 36, 210), width=int(2*K))
    for k in (5, 10):
        px, py = pts[k]; d.line((px, py, px - 18*K, py + 10*K, px - 26*K, py + 22*K), fill=(60, 44, 36, 150), width=int(1*K))
    im.save(path, quality=90)
def weave_texture(path, base, var):
    im = Image.new("RGB", (256, 256), base); px = im.load()
    for y in range(256):
        for x in range(256):
            w = (math.sin(x*1.6)*math.sin(y*1.6) > 0)
            n = random.uniform(-var, var) + (var*0.6 if w else -var*0.6)
            px[x, y] = tuple(max(0, min(255, int(c + n))) for c in base)
    im.filter(ImageFilter.GaussianBlur(0.6)).save(path, quality=90)
FACE = os.path.join(TMP, "maid_face.jpg"); face_texture(FACE)
WOOL = os.path.join(TMP, "maid_wool.jpg"); weave_texture(WOOL, (22, 20, 26), 7)
LINEN = os.path.join(TMP, "maid_linen.jpg"); weave_texture(LINEN, (222, 216, 202), 9)

def mat(name, col, rough, metal=0.0, coat=0.0, img=None, emit=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if coat: b.inputs["Coat Weight"].default_value = coat; b.inputs["Coat Roughness"].default_value = 0.06
    if img:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(img); nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = 3.0
    return m
FACEM = mat("face", (1, 1, 1), 0.28, coat=1.0, img=FACE)
PORC = mat("porcelain", (0.93, 0.90, 0.85), 0.28, coat=1.0)
DRESS = mat("dress", (1, 1, 1), 0.82, img=WOOL)
APRON = mat("apron", (1, 1, 1), 0.9, img=LINEN)
HAIR = mat("hair", (0.03, 0.022, 0.02), 0.32)
BRASS = mat("brass", (0.78, 0.55, 0.25), 0.3, metal=1.0)
GLASS = mat("glass", (1.0, 0.8, 0.5), 0.1, emit=(1.0, 0.7, 0.35))

def finish(ob, m, smooth=True):
    ob.data.materials.append(m)
    for p in ob.data.polygons: p.use_smooth = smooth
    return ob
def link(name, me):
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); return ob
def parent_to(o, p):
    bpy.context.view_layer.update(); o.parent = p; o.matrix_parent_inverse = p.matrix_world.inverted()

def lathe(name, prof, m, seg=48, rfun=None, uv_scale=(1, 1), close=True):
    # prof：(半径, 高さ) の列。rfun(θ, z, r) で半径を揺らせば襞になる
    me = bpy.data.meshes.new(name); bm = bmesh.new(); uvl = bm.loops.layers.uv.new(); rings = []
    for (r, z) in prof:
        ring = []
        for i in range(seg):
            a = 2*math.pi*i/seg; rr = rfun(a, z, r) if rfun else r
            ring.append(bm.verts.new((rr*math.cos(a), rr*math.sin(a), z)))
        rings.append(ring)
    zs = [z for _, z in prof]; z0, z1 = min(zs), max(zs)
    for k, (a, b) in enumerate(zip(rings, rings[1:])):
        for i in range(seg):
            j = (i+1) % seg; f = bm.faces.new((a[i], a[j], b[j], b[i]))
            for lp, (u, v) in zip(f.loops, [(i, prof[k][1]), (i+1, prof[k][1]), (i+1, prof[k+1][1]), (i, prof[k+1][1])]):
                lp[uvl].uv = (u/seg*uv_scale[0], (v - z0)*uv_scale[1])
    if close:
        bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free(); return finish(link(name, me), m)

def sphere(name, r, loc, m, scale=(1, 1, 1), seg=24, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg//2, radius=r, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = scale; finish(o, m)
    if parent: parent_to(o, parent)
    return o

def cyl(name, r1, r2, a, b, m, parent=None, verts=20):
    a, b = Vector(a), Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=d.length, location=(a+b)/2)
    o = bpy.context.active_object; o.name = name; o.rotation_euler = d.to_track_quat("Z", "Y").to_euler(); finish(o, m)
    if parent: parent_to(o, parent)
    return o

def ruffle(name, r_in, r_out, z, m, n=28, amp=0.012, droop=0.02, seg=112, parent=None, sy=1.0):
    # 円く縁取るフリル：外へ行くほど波打ち、少し垂れる
    def rf(a, zz, r): return r
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rings = []
    for k in range(4):
        t = k/3; r = r_in + (r_out - r_in)*t; ring = []
        for i in range(seg):
            a = 2*math.pi*i/seg
            ring.append(bm.verts.new((r*math.cos(a), r*math.sin(a)*sy, z - droop*t*t + amp*t*math.sin(a*n))))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(seg): bm.faces.new((a[i], a[(i+1) % seg], b[(i+1) % seg], b[i]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.003)
    bm.to_mesh(me); bm.free(); o = finish(link(name, me), m)
    if parent: parent_to(o, parent)
    return o

# ---------- 裾の広い黒い服：腰から下へ深くなる襞 ----------
def skirt_r(a, z, r):
    depth = max(0.0, 1 - z/0.98)**1.3
    return r*(1 + 0.055*depth*math.sin(a*13 + 0.6*math.sin(a*3)) + 0.02*depth*math.sin(a*29))
SKP = [(0.0, 0.0), (0.33, 0.0), (0.345, 0.025), (0.33, 0.12), (0.29, 0.40), (0.23, 0.70), (0.17, 0.93), (0.15, 0.99), (0.0, 0.99)]
lathe("skirt", SKP, DRESS, seg=96, rfun=skirt_r, uv_scale=(6, 6))
# 胴：細い腰から胸へ、肩はなで肩
BDP = [(0.0, 0.95), (0.145, 0.95), (0.13, 1.00), (0.15, 1.10), (0.16, 1.17), (0.15, 1.24), (0.12, 1.29), (0.06, 1.33), (0.0, 1.335)]
bod = lathe("bodice", BDP, DRESS, uv_scale=(4, 4))
bod.scale = (1.0, 0.74, 1.0)
# 腰帯（前掛けの紐）と背中の蝶結び
band = lathe("band", [(0.0, 0.965), (0.137, 0.965), (0.137, 1.0), (0.0, 1.0)], APRON); band.scale = (1.0, 0.76, 1.0)
for sx in (-1, 1):
    lp = sphere(f"bow{sx}", 0.05, (sx*0.05, -0.12, 0.985), APRON, scale=(1.0, 0.3, 0.55), seg=16)
    cyl(f"tail{sx}", 0.022, 0.03, (sx*0.02, -0.115, 0.97), (sx*0.06, -0.15, 0.68), APRON, verts=8)
sphere("knot", 0.02, (0, -0.118, 0.985), APRON, seg=12)

# ---------- 前掛け：襞を寄せた布と、フリルの肩紐 ----------
def rad_at(prof, z):
    pts = [(z0, r) for r, z0 in prof if r > 0]
    pts.sort()
    for (za, ra), (zb, rb) in zip(pts, pts[1:]):
        if za <= z <= zb: return ra + (rb - ra)*(z - za)/max(1e-6, zb - za)
    return pts[0][1] if z < pts[0][0] else pts[-1][1]
def panel(name, w0, w1, top, bot, prof, sy, folds, m, off=0.012):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); uvl = bm.loops.layers.uv.new()
    nx, nz = 24, 20; vs = []
    for j in range(nz+1):
        t = j/nz; z = top - (top-bot)*t; ww = w0 + (w1-w0)*t; row = []
        for i in range(nx+1):
            s = i/nx; x = -ww/2 + ww*s
            r = rad_at(prof, z)*(1.06 if prof is SKP else 1.0); xx = min(abs(x), r*0.98)
            y = sy*math.sqrt(r*r - xx*xx) + off + folds*t*math.sin(s*math.pi*7)
            row.append(bm.verts.new((x, y, z)))
        vs.append(row)
    for j in range(nz):
        for i in range(nx):
            f = bm.faces.new((vs[j][i], vs[j][i+1], vs[j+1][i+1], vs[j+1][i]))
            for lp, (u, v) in zip(f.loops, [(i, j), (i+1, j), (i+1, j+1), (i, j+1)]): lp[uvl].uv = (u/nx*2, v/nz*3)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.005)
    bm.to_mesh(me); bm.free(); return finish(link(name, me), m)
panel("apron", 0.26, 0.38, 0.975, 0.30, SKP, 1.0, 0.012, APRON, 0.014)
panel("bib", 0.16, 0.19, 1.24, 0.975, BDP, 0.74, 0.0, APRON, 0.008)
# 肩紐：胸当てから肩を越えて背へ。外側にフリル
for sx in (-1, 1):
    pts = [Vector((sx*0.075, 0.105, 1.24)), Vector((sx*0.10, 0.07, 1.30)), Vector((sx*0.11, -0.01, 1.32)), Vector((sx*0.10, -0.09, 1.27)), Vector((sx*0.08, -0.105, 1.0))]
    for k, (a, b) in enumerate(zip(pts, pts[1:])):
        cyl(f"strap{sx}{k}", 0.016, 0.016, a, b, APRON, verts=8)
        for t in (0.25, 0.75):
            p = a.lerp(b, t); sphere(f"frill{sx}{k}{t}", 0.022, (p.x + sx*0.018, p.y, p.z), APRON, scale=(0.5, 1.2, 0.9), seg=10)

# ---------- 首、高い襟、頭 ----------
lathe("neck", [(0.0, 1.31), (0.036, 1.31), (0.032, 1.40), (0.0, 1.40)], PORC)
ruffle("collar", 0.04, 0.075, 1.36, APRON, n=22, amp=0.01, droop=0.025, sy=0.85)
lathe("collarband", [(0.0, 1.33), (0.045, 1.33), (0.042, 1.375), (0.0, 1.375)], APRON)
head = bpy.data.objects.new("head", None); sc.collection.objects.link(head); head.location = (0, 0, 1.40)

def make_skull():
    # 卵形に顎を細め、頬をふくらませ、鼻をつまみ、目のくぼみを浅く押す。UV は正面を中心に方位と仰角で取る
    R = 0.098; c = Vector((0, 0.0, 1.495))
    me = bpy.data.meshes.new("skull"); bm = bmesh.new(); uvl = bm.loops.layers.uv.new()
    NU, NV = 64, 40; grid = []
    for j in range(NV+1):
        el = -90 + 180*j/NV; row = []
        for i in range(NU+1):
            az = -180 + 360*i/NU
            e, a = math.radians(el), math.radians(az)
            x, y, z = math.cos(e)*math.sin(a), math.cos(e)*math.cos(a), math.sin(e)
            sx, sy, sz = 0.83, 0.93, 1.1
            if z < 0: sx *= 1 - 0.2*(-z)**1.5; sy *= 1 - 0.1*(-z)**2   # 顎を細く
            p = Vector((x*sx, y*sy, z*sz))*R
            front = max(0.0, y)
            def bump(az0, el0, w, h):
                return math.exp(-((az-az0)/w)**2 - ((el-el0)/h)**2)
            p.y += R*(0.10*bump(0, -8, 6, 8)*front)                      # 鼻
            p.y -= R*(0.05*(bump(-20, 3, 12, 7) + bump(20, 3, 12, 7)))   # 目のくぼみ
            p += p.normalized()*R*0.05*(bump(-30, -12, 16, 14) + bump(30, -12, 16, 14))  # 頬
            p.y += R*0.012*bump(0, -36, 16, 10)                          # 顎先
            row.append((bm.verts.new(c + p), az, el))
        grid.append(row)
    for j in range(NV):
        for i in range(NU):
            q = [grid[j][i], grid[j][i+1], grid[j+1][i+1], grid[j+1][i]]
            try: f = bm.faces.new([v for v, _, _ in q])
            except ValueError: continue
            for lp, (_, az, el) in zip(f.loops, q): lp[uvl].uv = (0.5 + az/360, 0.5 + el/180)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free(); o = finish(link("skull", me), FACEM); parent_to(o, head); return o
make_skull()

def make_hair():
    # 額の真ん中で分け、こめかみへ撫でつけ、後ろで髷。筋は細い凹凸で
    R = 0.104; c = Vector((0, -0.006, 1.50))
    me = bpy.data.meshes.new("hair"); bm = bmesh.new(); NU, NV = 64, 24; grid = []
    for j in range(NV+1):
        el = -25 + 115*j/NV; row = []
        for i in range(NU):
            az = -180 + 360*i/NU; e, a = math.radians(min(el, 89.5)), math.radians(az)
            # 生え際：正面は額の上（仰角25度）まで、横は耳の上
            hairline = 16 + 10*math.cos(a)**4 - 26*(1 - math.cos(a)) if abs(az) < 100 else -25
            ee = max(e, math.radians(hairline)) if abs(az) < 100 else e
            x, y, z = math.cos(ee)*math.sin(a), math.cos(ee)*math.cos(a), math.sin(ee)
            strand = 1 + 0.025*math.sin(az*0.9 + (8 if az > 0 else 0)) * (1 - abs(z))
            part = 1 - 0.04*math.exp(-(az/6)**2)*max(0, y)
            p = Vector((x*0.92, y*0.99, z*1.1))*R*strand*part
            row.append(bm.verts.new(c + p))
        grid.append(row)
    for j in range(NV):
        for i in range(NU):
            try: bm.faces.new((grid[j][i], grid[j][(i+1) % NU], grid[j+1][(i+1) % NU], grid[j+1][i]))
            except ValueError: pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    bm.to_mesh(me); bm.free(); o = finish(link("hair", me), HAIR); parent_to(o, head)
    # 髷：ねじった巻き
    me = bpy.data.meshes.new("bun"); bm = bmesh.new(); NU, NV = 40, 16; g2 = []
    for j in range(NV+1):
        v = j/NV; row = []
        for i in range(NU):
            u = 2*math.pi*i/NU; r = 0.05*math.sin(math.pi*min(0.999, max(0.001, v)))*(1 + 0.12*math.sin(u*5 + v*14))
            row.append(bm.verts.new((r*math.cos(u), -0.11 - 0.04*v, 1.56 + r*math.sin(u)*0.9 - 0.02 + 0.0*v)))
        g2.append(row)
    for j in range(NV):
        for i in range(NU): bm.faces.new((g2[j][i], g2[j][(i+1) % NU], g2[j+1][(i+1) % NU], g2[j+1][i]))
    bm.to_mesh(me); bm.free(); b = finish(link("bun", me), HAIR); parent_to(b, head)
make_hair()
# 白い帽子：頭頂に襞を寄せたフリル
cap = ruffle("cap", 0.02, 0.085, 1.605, APRON, n=18, amp=0.007, droop=0.03, sy=0.9, parent=head)
capb = lathe("capband", [(0.0, 1.585), (0.07, 1.585), (0.075, 1.6), (0.0, 1.61)], APRON); capb.scale = (1, 0.9, 1); parent_to(capb, head)

# ---------- 腕：膨らんだ袖、白い袖口、球の関節でつないだ白磁の手 ----------
def hand(name, wrist, dirv, side, curl, parent):
    dirv = dirv.normalized(); side_v = dirv.cross(Vector((0, 0, 1))).normalized()
    if side_v.length < 0.1: side_v = Vector((1, 0, 0))
    up_v = side_v.cross(dirv).normalized()
    sphere(f"{name}_ball", 0.019, wrist, PORC, parent=parent, seg=16)
    palm_c = wrist + dirv*0.042
    pm = sphere(f"{name}_palm", 0.03, palm_c, PORC, scale=(1, 1, 1), seg=20, parent=parent)
    pm.rotation_euler = dirv.to_track_quat("Z", "Y").to_euler(); pm.scale = (0.95, 0.45, 1.05)
    for k in range(4):
        base = palm_c + dirv*0.028 + side_v*(-0.018 + 0.012*k)
        mid = base + (dirv*0.024 + up_v*curl*0.01)
        tip = mid + (dirv*0.012 + up_v*curl*0.02)
        cyl(f"{name}_f{k}a", 0.0065, 0.006, base, mid, PORC, parent=parent, verts=8)
        cyl(f"{name}_f{k}b", 0.006, 0.005, mid, tip, PORC, parent=parent, verts=8)
        sphere(f"{name}_f{k}t", 0.005, tip, PORC, parent=parent, seg=8)
    th = palm_c + side_v*side*0.0 + side_v*(-0.03*side) + dirv*0.005
    cyl(f"{name}_th", 0.007, 0.006, th, th + dirv*0.025 + up_v*0.012, PORC, parent=parent, verts=8)
def arm(tag, side, el_off, wr_off, curl):
    sh = Vector((side*0.165, 0.0, 1.25))
    root = bpy.data.objects.new(f"arm{tag}", None); sc.collection.objects.link(root); root.location = sh
    sphere(f"puff{tag}", 0.062, sh + Vector((side*0.012, 0, 0.0)), DRESS, scale=(0.9, 1.0, 1.05), parent=root)
    el = sh + Vector(el_off); wr = sh + Vector(wr_off)
    cyl(f"upper{tag}", 0.04, 0.032, sh, el, DRESS, parent=root)
    sphere(f"elbow{tag}", 0.033, el, DRESS, parent=root)
    cyl(f"fore{tag}", 0.032, 0.026, el, wr, DRESS, parent=root)
    ruffle(f"cuff{tag}", 0.024, 0.042, 0, APRON, n=16, amp=0.006, droop=0.012, seg=48)
    cf = sc.objects[f"cuff{tag}"]; d = (wr - el).normalized(); cf.location = wr - d*0.012
    cf.rotation_euler = (-d).to_track_quat("Z", "Y").to_euler(); parent_to(cf, root)
    hand(f"hand{tag}", wr + d*0.01, d, side, curl, root)
    return root, wr + d*0.06
arm("L", -1, (-0.03, 0.03, -0.25), (-0.02, 0.09, -0.47), 0.3)
_, grip = arm("R", 1, (0.02, 0.12, -0.21), (0.0, 0.33, -0.26), 1.0)

# ---------- 手提げランプ：真鍮の枠と硝子、上に提げ手 ----------
lc = Vector((0.17, 0.37, 0.84))
for dx in (-1, 1):
    for dy in (-1, 1):
        cyl(f"post{dx}{dy}", 0.005, 0.005, lc + Vector((dx*0.045, dy*0.045, -0.07)), lc + Vector((dx*0.045, dy*0.045, 0.06)), BRASS, verts=6)
cyl("lbase", 0.07, 0.065, lc + Vector((0, 0, -0.09)), lc + Vector((0, 0, -0.07)), BRASS, verts=4).rotation_euler.z += math.pi/4
cyl("ltop", 0.068, 0.02, lc + Vector((0, 0, 0.06)), lc + Vector((0, 0, 0.11)), BRASS, verts=4).rotation_euler.z += math.pi/4
sphere("lknob", 0.012, lc + Vector((0, 0, 0.115)), BRASS, seg=10)
bpy.ops.mesh.primitive_cube_add(size=1, location=lc + Vector((0, 0, -0.005))); g = bpy.context.active_object; g.name = "lglass"; g.scale = (0.085, 0.085, 0.125); finish(g, GLASS, False)
bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.004, location=lc + Vector((0, 0, 0.12)), rotation=(0, math.pi/2, 0))
bl = bpy.context.active_object; bl.name = "lbail"; finish(bl, BRASS)
for v in bl.data.vertices:
    if v.co.z < 0: v.co.z *= 0.2

for ob in list(sc.objects):
    if ob.type != "MESH": continue
    bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    for md in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
print("polys", sum(len(o.data.polygons) for o in sc.objects if o.type == "MESH"))
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_yup=True, export_materials="EXPORT", export_image_format="JPEG")

if PREV:
    cam = bpy.data.cameras.new("cam"); co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co)
    co.location = (0.9, 1.9, 1.35); d = Vector((0, 0, 1.0)) - co.location; co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler(); sc.camera = co; cam.lens = 50
    for loc, e in [((1.5, 1.5, 2.5), 220), ((-2, 1, 1.5), 50), ((0, -2, 2), 90)]:
        l = bpy.data.lights.new("l", "POINT"); l.energy = e; lo = bpy.data.objects.new("l", l); lo.location = loc; sc.collection.objects.link(lo)
    bpy.ops.mesh.primitive_plane_add(size=6); bpy.context.active_object.data.materials.append(mat("floor", (0.08, 0.05, 0.035), 0.6))
    sc.render.engine = "CYCLES"; sc.cycles.samples = 32; sc.render.resolution_x = 480; sc.render.resolution_y = 720; sc.render.filepath = PREV
    sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.03, 0.03, 0.035)
    bpy.ops.render.render(write_still=True)
    if len(argv) > 2:  # 顔の寄り
        co.location = (0.12, 0.55, 1.52); d = Vector((0, 0, 1.49)) - co.location; co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler(); cam.lens = 85
        sc.render.filepath = argv[2]; bpy.ops.render.render(write_still=True)
