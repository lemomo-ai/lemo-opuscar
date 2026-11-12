# Build the plot: every mark on the A2 sheet as pen strokes in plotting order → plot.json (read by plot.js).
# Terrain is NASADEM (tools/fetch_dem.py, crop_dem.py); the route is tools/route.py; facts are in FACTS.md.
# Sheet: 594 × 420 mm, origin top left, y down. Map 1:80 000, contour interval 50 m (index every 250 m).
# Run from the library root:  .venv/bin/python -I styles/pen-plotter/demo/tools/make_plot.py
import json, os, sys, math
import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import textlib as T

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..'); DATA = os.path.join(ROOT, 'data')
dem = np.load(os.path.join(DATA, 'dem.npy')).astype(np.float64); M = json.load(open(os.path.join(DATA, 'dem.json')))
ROUTE = json.load(open(os.path.join(DATA, 'route.json')))
LAT1, LON0D = M['lat'][0], M['lon'][0]; DX, DY = M['dx_m'], M['dy_m']
SCALE = 80.0                         # metres per mm (1:80 000)
X0, Y0 = 24.0, 20.0                  # map frame top left (mm)
LON_W = 86.80                        # west edge of the map
C_OFF = round((LON_W - LON0D) * 3600)            # DEM column of the west edge
MW = 270.0; MH = 360.0
NC = int(MW * SCALE / DX) + 1; NR = min(dem.shape[0], int(MH * SCALE / DY) + 1)
def rc2mm(r, c): return X0 + (c - C_OFF) * DX / SCALE, Y0 + r * DY / SCALE
def ll2mm(lat, lon): return rc2mm((LAT1 - lat) * 3600, (lon - LON0D) * 3600)
LON_E = LON_W + MW * SCALE / DX / 3600; LAT_S = LAT1 - MH * SCALE / DY / 3600
print('map lon', LON_W, round(LON_E, 4), 'lat', round(LAT_S, 4), LAT1, 'grid', NR, NC)

S = []     # strokes in plotting order
BLOCKS = []  # text blocks: id, text, bbox, first/last stroke, read
PEN = {'black': 0, 'brown': 1, 'grey': 2, 'red': 3}
def R2(p): return [round(v, 2) for xy in p for v in xy]
def add(pts, pen, seg, **kw):
    if len(pts) >= 2: S.append({'p': PEN[pen], 'seg': seg, 'pts': R2(pts), **kw})
def text(tid, s, x, y, em, pen, seg, align='left', rot=0.0, read=True, passes=1, cjk='sans', **kw):
    L = T.layout(s, x, y, em, align=align, rot=rot, cjk=cjk, **kw)
    i0 = len(S)
    for st in L['strokes']:   # heavier lettering: the pen goes over each stroke again, a hair to the side
        for k in range(passes):
            off = [(0, 0), (.22, .1), (.1, .24), (.26, .26)][k] if em < 20 else [(0, 0), (.32, .12), (.14, .34)][k]
            add([(px + off[0], py + off[1]) for px, py in (st if k % 2 == 0 else st[::-1])], pen, seg, txt=tid)
    BLOCKS.append({'id': tid, 'text': s, 'bbox': [round(v, 2) for v in L['bbox']], 's0': i0, 's1': len(S), 'read': read})
    return L
def title_cjk(tid, s, x, y, em, pen, seg, sp=.42):
    L = T.layout(s, x, y, em, cjk='serif'); i0 = len(S)
    # per glyph: outline then hatch (glyphs are separated by advance; group strokes by x)
    for st in L['strokes']: add(st, pen, seg, txt=tid)
    for h in T.hatch_polys(L['strokes'], math.pi / 4, sp): add(h, pen, seg, txt=tid)
    BLOCKS.append({'id': tid, 'text': s, 'bbox': [round(v, 2) for v in L['bbox']], 's0': i0, 's1': len(S), 'read': True})
    return L
def rect(x0, y0, x1, y1, pen, seg, **kw): add([(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)], pen, seg, **kw)
def circle(cx, cy, r, n=28, a0=0.0, turns=1.0):
    return [(cx + r * math.cos(a0 + k / n * 2 * math.pi * turns), cy + r * math.sin(a0 + k / n * 2 * math.pi * turns)) for k in range(n + 1)]
def dashed(a, b, on=2.0, off=1.4):
    L = math.dist(a, b); out = []; s = 0.0
    while s < L:
        e = min(L, s + on); f0, f1 = s / L, e / L
        out.append([(a[0] + (b[0] - a[0]) * f0, a[1] + (b[1] - a[1]) * f0), (a[0] + (b[0] - a[0]) * f1, a[1] + (b[1] - a[1]) * f1)]); s = e + off
    return out

def rdp(P, eps):
    if len(P) < 3: return P
    P = np.asarray(P); keep = np.zeros(len(P), bool); keep[0] = keep[-1] = True; stack = [(0, len(P) - 1)]
    while stack:
        a, b = stack.pop(); A, B = P[a], P[b]; d = B - A; n = np.hypot(*d)
        seg = P[a + 1:b]
        if not len(seg): continue
        dist = np.abs(d[0] * (seg[:, 1] - A[1]) - d[1] * (seg[:, 0] - A[0])) / n if n > 1e-9 else np.hypot(*(seg - A).T)
        k = int(np.argmax(dist))
        if dist[k] > eps: keep[a + 1 + k] = True; stack += [(a, a + 1 + k), (a + 1 + k, b)]
    return [tuple(p) for p in P[keep]]
def chaikin(P, closed, it=2):
    P = list(P)
    for _ in range(it):
        Q = [] if closed else [P[0]]
        rng = range(len(P) - 1 if not closed else len(P) - 1)
        for i in rng:
            a, b = P[i], P[i + 1]
            Q += [(.75 * a[0] + .25 * b[0], .75 * a[1] + .25 * b[1]), (.25 * a[0] + .75 * b[0], .25 * a[1] + .75 * b[1])]
        if closed: Q.append(Q[0])
        else: Q.append(P[-1])
        P = Q
    return P
def plen(P): return sum(math.dist(a, b) for a, b in zip(P, P[1:]))

# ---------------- contours (marching squares on the lightly smoothed DEM, chained by shared cell edges)
Z = gaussian_filter(dem, 1.1)[:NR, C_OFF:C_OFF + NC]
def contours(Zg, lev):
    a = Zg[:-1, :-1]; b = Zg[:-1, 1:]; c = Zg[1:, 1:]; d = Zg[1:, :-1]
    case = (a > lev) * 8 + (b > lev) * 4 + (c > lev) * 2 + (d > lev) * 1
    ii, jj = np.nonzero((case > 0) & (case < 15))
    # edge ids: top (i,j)=('h',i,j), bottom=('h',i+1,j), left=('v',i,j), right=('v',i,j+1)
    def ept(kind, i, j):
        if kind == 'h': z0, z1 = Zg[i, j], Zg[i, j + 1]; t = (lev - z0) / (z1 - z0); return (i, j + t)
        z0, z1 = Zg[i, j], Zg[i + 1, j]; t = (lev - z0) / (z1 - z0); return (i + t, j)
    TOP, RIGHT, BOT, LEFT = 0, 1, 2, 3
    pairs = {1: [(BOT, LEFT)], 2: [(RIGHT, BOT)], 3: [(RIGHT, LEFT)], 4: [(TOP, RIGHT)], 6: [(TOP, BOT)], 7: [(TOP, LEFT)],
             8: [(TOP, LEFT)], 9: [(TOP, BOT)], 11: [(TOP, RIGHT)], 12: [(RIGHT, LEFT)], 13: [(RIGHT, BOT)], 14: [(BOT, LEFT)]}
    def eid(e, i, j): return (('h', i, j), ('v', i, j + 1), ('h', i + 1, j), ('v', i, j))[e]
    adj = {}; segs = []
    for i, j in zip(ii.tolist(), jj.tolist()):
        k = int(case[i, j])
        if k in (5, 10):
            centre = (Zg[i, j] + Zg[i, j + 1] + Zg[i + 1, j + 1] + Zg[i + 1, j]) / 4 > lev
            if k == 5: pr = [(TOP, RIGHT), (BOT, LEFT)] if not centre else [(TOP, LEFT), (BOT, RIGHT)]
            else: pr = [(TOP, LEFT), (BOT, RIGHT)] if not centre else [(TOP, RIGHT), (BOT, LEFT)]
        else: pr = pairs[k]
        for e0, e1 in pr:
            A, B = eid(e0, i, j), eid(e1, i, j); n = len(segs); segs.append((A, B))
            adj.setdefault(A, []).append(n); adj.setdefault(B, []).append(n)
    used = [False] * len(segs); lines = []
    for n in range(len(segs)):
        if used[n]: continue
        used[n] = True; A, B = segs[n]; chain = [A, B]
        for end in (1, 0):
            while True:
                e = chain[-1] if end else chain[0]
                nx = next((m for m in adj.get(e, []) if not used[m]), None)
                if nx is None: break
                used[nx] = True; P, Q = segs[nx]; o = Q if P == e else P
                if end: chain.append(o)
                else: chain.insert(0, o)
        closed = chain[0] == chain[-1]
        pts = [rc2mm(*ept(*e)) for e in chain]
        lines.append((pts, closed))
    return lines

LEVELS = list(range(4300, 8800, 50))
CONT = {}
for lev in LEVELS:
    out = []
    for pts, closed in contours(Z, lev):
        if len(pts) < 3: continue
        p = chaikin(pts, closed, 2); p = rdp(p, .035)
        p = [(min(X0 + MW, max(X0, x)), min(Y0 + MH, max(Y0, y))) for x, y in p]
        if plen(p) < 1.6: continue
        out.append(p)
    CONT[lev] = out
print('contour polylines', sum(len(v) for v in CONT.values()), 'length m', round(sum(plen(p) for v in CONT.values() for p in v) / 1000, 1))

# ---------------- labels that are on the sheet before the film starts (black pen): frame, graticule, title, camps
SUM = ROUTE['camps'][-1]; SX, SY = ll2mm(SUM['lat'], SUM['lon'])
CAMPMM = {c['id']: ll2mm(c['lat'], c['lon']) for c in ROUTE['camps']}
print('camps mm', {k: (round(v[0], 1), round(v[1], 1)) for k, v in CAMPMM.items()})
KEEP = []   # boxes that contours / hatching must leave clear
def keep(b, m=1.0): KEEP.append((b[0] - m, b[1] - m, b[2] + m, b[3] + m))

rect(X0, Y0, X0 + MW, Y0 + MH, 'black', 'pre')
rect(X0 - 2.2, Y0 - 2.2, X0 + MW + 2.2, Y0 + MH + 2.2, 'black', 'pre')
def dm(v, hemi): tm = int(round(v * 60)); return f"{tm // 60}°{tm % 60:02d}′{hemi}"
lon = math.ceil(LON_W * 50 - 1e-9) / 50
while lon <= LON_E + 1e-9:
    x, _ = ll2mm(LAT1, lon)
    add([(x, Y0 - 2.2), (x, Y0 + 2.4)], 'black', 'pre'); add([(x, Y0 + MH + 2.2), (x, Y0 + MH - 2.4)], 'black', 'pre')
    text('lon%.2f' % lon, dm(lon, 'E'), x, Y0 - 3.6, 2.5, 'black', 'pre', align='center', read=False); lon += .02
lat = math.floor(LAT1 * 50 + 1e-9) / 50
while lat >= LAT_S - 1e-9:
    _, y = ll2mm(lat, LON_W)
    add([(X0 - 2.2, y), (X0 + 2.4, y)], 'black', 'pre'); add([(X0 + MW + 2.2, y), (X0 + MW - 2.4, y)], 'black', 'pre')
    text('lat%.2f' % lat, dm(lat, 'N'), X0 - 3.6, y, 2.5, 'black', 'pre', align='center', rot=-math.pi / 2, read=False); lat -= .02
# north arrow (inside the frame, top right)
nx, ny = X0 + MW - 14, Y0 + 12
add([(nx, ny - 7), (nx - 2.6, ny + 3), (nx, ny + 1.4), (nx + 2.6, ny + 3), (nx, ny - 7)], 'black', 'pre')
for k in range(7): add([(nx - .35 * k * .37, ny - 6 + k * 1.0), (nx, ny - 6 + k * 1.0)], 'black', 'pre')
text('north', 'N', nx, ny + 8, 3.4, 'black', 'pre', align='center', read=False); keep((nx - 4, ny - 8, nx + 4, ny + 9))
# scale bar under the map
sb_y = Y0 + MH + 9
for k in range(5):
    x0 = X0 + k * 1000 / SCALE; x1 = X0 + (k + 1) * 1000 / SCALE
    rect(x0, sb_y, x1, sb_y + 1.6, 'black', 'pre')
    if k % 2 == 0:
        for h in np.arange(.4, x1 - x0, .5): add([(x0 + h, sb_y), (x0 + h, sb_y + 1.6)], 'black', 'pre')
    text('sb%d' % k, str(k), x0, sb_y + 5.2, 2.6, 'black', 'pre', align='center', read=False)
text('sb5', '5 km', X0 + 5000 / SCALE, sb_y + 5.2, 2.6, 'black', 'pre', align='center', read=False)
text('scale', '1:80 000', X0 + 5000 / SCALE + 12, sb_y + 1.8, 3.0, 'black', 'pre', read=False)
text('map_cn', '珠峰北坡 等高线与登山路线', X0 + MW, sb_y + 1.8, 3.2, 'black', 'pre', align='right', read=False)
text('map_en', 'North side of the summit: contours and climbing route', X0 + MW, sb_y + 7.0, 2.7, 'black', 'pre', align='right', read=False)

# camp labels on the map: CN name / EN name / altitude, placed beside each camp
CAMP_TXT = {
    'base': ('大本营', 'Base Camp', '5200 m', (4.0, -1.0), 'left'),
    'mid': ('中间营地', 'Interim Camp', '5800 m', (4.0, -1.0), 'left'),
    'abc': ('前进营地', 'Advanced Base Camp', '6500 m', (4.0, -2.0), 'left'),
    'c1': ('一号营地 北坳', 'Camp 1, North Col', '7028 m', (-4.0, -3.5), 'right'),
    'c2': ('二号营地', 'Camp 2', '7790 m', (-4.0, 0.5), 'right'),
    'c3': ('三号营地', 'Camp 3', '8300 m', (4.5, 0.5), 'left'),
}
for cid, (cn, en, alt, (dx, dy), al) in CAMP_TXT.items():
    x, y = CAMPMM[cid]
    L1 = text(cid + '_cn', cn, x + dx, y + dy, 3.3, 'black', 'pre', align=al)
    L2 = text(cid + '_en', en, x + dx, y + dy + 4.0, 2.8, 'black', 'pre', align=al)
    L3 = text(cid + '_alt', alt, x + dx, y + dy + 8.0, 2.8, 'black', 'pre', align=al)
    for L in (L1, L2, L3): keep(L['bbox'], .8)
    keep((x - 2.2, y - 2.2, x + 2.2, y + 2.2), 0)
L1 = text('peak_cn', '珠穆朗玛峰', SX - 5, SY + 7.5, 4.2, 'black', 'pre', align='right')
L2 = text('peak_en', 'Mount Qomolangma (Everest)', SX - 5, SY + 12.5, 3.2, 'black', 'pre', align='right')
for L in (L1, L2): keep(L['bbox'], .8)
keep((SX - 3, SY - 3, SX + 3, SY + 3), 0)

# right column: title block
RX0, RX1 = 322.0, 574.0
title_cjk('title_cn', '珠穆朗玛峰', RX0, 40, 19, 'black', 'pre')
text('title_en', 'Mount Qomolangma (Everest)', RX0, 55, 10.5, 'black', 'pre', passes=3)
text('sub_cn', '北坡地形与登山路线', RX0, 64.5, 4.6, 'black', 'pre', cjk='sansmed')
text('sub_en', 'North side: terrain and the climbing route', RX0, 71, 4.0, 'black', 'pre', passes=2)
# legend and sources, bottom right
ly = 389
text('leg1_cn', '等高距 50 米，计曲线每 250 米加粗', RX0, ly, 3.0, 'black', 'pre', read=False)
text('leg1_en', 'Contour interval 50 m, index contours every 250 m', RX0, ly + 4.4, 2.6, 'black', 'pre', read=False)
text('leg2_cn', '高程数据 NASADEM（美国航天局，公有领域），路线为示意', RX0, ly + 9.6, 3.0, 'black', 'pre', read=False)
text('leg2_en', 'Elevation data NASADEM (NASA, public domain). Route line approximate.', RX0, ly + 14.0, 2.6, 'black', 'pre', read=False)

# ---------------- brown: contours from the summit outwards, index contours traced twice, 1000 m values in the line
def in_keep(x, y): return any(b[0] <= x <= b[2] and b[1] <= y <= b[3] for b in KEEP)
def cut_keep(p):
    runs = []; cur = []
    for q in p:
        if in_keep(*q):
            if len(cur) >= 2: runs.append(cur)
            cur = []
        else: cur.append(q)
    if len(cur) >= 2: runs.append(cur)
    return runs
def chunk(p, maxL):
    out = []; cur = [p[0]]; acc = 0.0
    for a, b in zip(p, p[1:]):
        cur.append(b); acc += math.dist(a, b)
        if acc > maxL: out.append(cur); cur = [b]; acc = 0.0
    if len(cur) >= 2: out.append(cur)
    return out
def order_nn(lines, start):
    """greedy nearest-neighbour order, lines may be reversed"""
    if not lines: return []
    ends = np.array([[l[0][0], l[0][1], l[-1][0], l[-1][1]] for l in lines]); used = np.zeros(len(lines), bool)
    out = []; x, y = start
    for _ in range(len(lines)):
        d0 = (ends[:, 0] - x) ** 2 + (ends[:, 1] - y) ** 2; d1 = (ends[:, 2] - x) ** 2 + (ends[:, 3] - y) ** 2
        d0[used] = 1e18; d1[used] = 1e18
        i0, i1 = int(d0.argmin()), int(d1.argmin())
        if d0[i0] <= d1[i1]: k, rev = i0, False
        else: k, rev = i1, True
        used[k] = True; l = lines[k][::-1] if rev else lines[k]; out.append(l); x, y = l[-1]
    return out

pos = (SX, SY)
for lev in sorted(LEVELS, reverse=True):
    idx = lev % 250 == 0
    lines = []
    for p in CONT[lev]:
        for r in cut_keep(p): lines += chunk(r, 60)
    # value labels on the 1000 m contours: cut a gap and write the value along the line
    lab = []
    if lev % 1000 == 0 and lines:
        cand = sorted(lines, key=plen, reverse=True)[:6]
        for p in cand[:2 if lev < 8000 else 1]:
            L = plen(p)
            if L < 30: continue
            acc = 0.0; tgt = L * .45
            for a, b in zip(p, p[1:]):
                acc += math.dist(a, b)
                if acc >= tgt: break
            ang = math.atan2(b[1] - a[1], b[0] - a[0])
            if abs(ang) > math.pi / 2: ang += math.pi
            ang = (ang + math.pi) % (2 * math.pi) - math.pi
            cx, cy = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
            lab.append((str(lev), cx, cy, ang))
    if lab:
        new = []
        for p in lines:
            q = [pt for pt in p]
            runs = [[]]
            for pt in q:
                if any(math.dist(pt, (cx, cy)) < 6.0 for _, cx, cy, _ in lab): runs.append([])
                else: runs[-1].append(pt)
            new += [r for r in runs if len(r) >= 2]
        lines = new
    for l in order_nn(lines, pos):
        add(l, 'brown', 'contour', lv=lev, **({'dbl': 1} if idx else {}))
        pos = l[-1]
    for s, cx, cy, ang in lab:
        Lb = text('cl%d_%d' % (lev, int(cx)), s, cx - math.sin(ang) * -1.15, cy + math.cos(ang) * 1.15, 3.0, 'brown', 'contour', align='center', rot=ang, read=False)
        for k in range(BLOCKS[-1]["s0"], BLOCKS[-1]["s1"]): S[k]["lv"] = lev

# ---------------- grey: hillshade hatching (light from the north-west), from the north face outwards
Zs = gaussian_filter(dem, 2.2)[:NR, C_OFF:C_OFF + NC]
gy, gx = np.gradient(Zs, DY, DX)
az, alt = math.radians(315), math.radians(40)
Lx, Ly, Lz = math.sin(az) * math.cos(alt), math.cos(az) * math.cos(alt), math.sin(alt)   # x east, y north
nxv, nyv, nzv = -gx, gy, np.ones_like(Zs)   # gy is d/d(row) = southward; north component = +gy
shade = (nxv * Lx + nyv * Ly + nzv * Lz) / np.sqrt(nxv ** 2 + nyv ** 2 + 1)
def shade_at(x, y):
    c = (x - X0) * SCALE / DX; r = (y - Y0) * SCALE / DY
    return map_coordinates(shade, [[r], [c]], order=1, mode='nearest')[0]
def hatch_family(ang, sp, thr, step=.3):
    ca, sa = math.cos(ang), math.sin(ang); cx, cy = X0 + MW / 2, Y0 + MH / 2; Rr = 240
    out = []
    o = -Rr
    while o <= Rr:
        ts = np.arange(-Rr, Rr, step); xs = cx + ca * ts - sa * o; ys = cy + sa * ts + ca * o
        ins = (xs > X0 + .6) & (xs < X0 + MW - .6) & (ys > Y0 + .6) & (ys < Y0 + MH - .6)
        if ins.any():
            c = (xs - X0) * SCALE / DX; r = (ys - Y0) * SCALE / DY
            sh = map_coordinates(shade, [r, c], order=1, mode='nearest')
            on = ins & (sh < thr + .035 * np.sin(ts * .9 + o * 1.7))
            run = []
            for k in range(len(ts)):
                if on[k] and not in_keep(xs[k], ys[k]): run.append((float(xs[k]), float(ys[k])))
                else:
                    if len(run) >= 3: out += chunk(run, 16)
                    run = []
            if len(run) >= 3: out += chunk(run, 16)
        o += sp
    return [[l[0], l[-1]] for l in out]
H1 = hatch_family(math.pi / 4, .8, .42)
H2 = hatch_family(-math.pi / 4, 1.1, .2)
seed = (SX, SY - 18)   # the north face, below the summit
hat = order_nn(H1 + H2, seed)
for l in hat: add(l, 'grey', 'hatch')
print('hatch strokes', len(hat))

# ---------------- grey: profile frame and the summit-height inset scale (ready for the red and black pens)
PX0, PX1, PY0, PY1 = 336.0, 568.0, 176.0, 292.0      # profile plot area: 0–26 km, 5000–9000 m
KM = (PX1 - PX0) / 26.0; MPM = (PY1 - PY0) / 4000.0
def prof(d_m, z): return PX0 + d_m / 1000 * KM, PY1 - (z - 5000) * MPM
add([(PX0, PY0 - 2), (PX0, PY1), (PX1 + 2, PY1)], 'grey', 'axes')
for z in range(5000, 9001, 1000):
    y = PY1 - (z - 5000) * MPM
    add([(PX0 - 2, y), (PX0, y)], 'grey', 'axes')
    if z > 5000:
        for xx in np.arange(PX0 + 2, PX1, 3.0): add([(xx, y), (xx + 1.0, y)], 'grey', 'axes')
    text('pz%d' % z, str(z), PX0 - 3, y + 1.0, 2.8, 'grey', 'axes', align='right', read=False)
for km in range(0, 27, 5):
    x = PX0 + km * KM; add([(x, PY1), (x, PY1 + 2)], 'grey', 'axes')
    text('pk%d' % km, str(km), x, PY1 + 5.6, 2.8, 'grey', 'axes', align='center', read=False)
text('pax_cn', '距大本营距离（千米）', PX1, PY1 + 11.5, 3.0, 'grey', 'axes', align='right')
text('pax_en', 'Distance from Base Camp (km)', PX1, PY1 + 16.0, 2.7, 'grey', 'axes', align='right')
text('pay_cn', '海拔（米）', PX0, PY0 - 7.5, 3.0, 'grey', 'axes')
text('pay_en', 'Elevation (m)', PX0, PY0 - 3.2, 2.7, 'grey', 'axes')
# inset: summit height 8843–8850 m, enlarged
IX0, IX1, IY0, IY1 = 322.0, 572.0, 79.0, 160.0
AX, AY0, AY1 = 336.0, 104.0, 152.0          # vertical scale, 8850 m at AY0, 8843 m at AY1
def iy(h): return AY0 + (8850 - h) * (AY1 - AY0) / 7.0
rect(IX0, IY0, IX1, IY1, 'grey', 'axes')
add([(AX, AY0 - 2), (AX, AY1 + 2)], 'grey', 'axes')
for h in range(8843, 8851):
    add([(AX - (2.2 if h % 2 == 0 else 1.2), iy(h)), (AX, iy(h))], 'grey', 'axes')
    if h % 2 == 0: text('iz%d' % h, str(h), AX - 3.2, iy(h) + 1.0, 2.8, 'grey', 'axes', align='right', read=False)
for x in np.arange(AX + 2, IX1 - 3, 3.0):
    for h in (8844, 8846, 8848, 8850): add([(x, iy(h)), (x + .8, iy(h))], 'grey', 'axes')

# ---------------- red: the route from Base Camp, a ring at each camp
RP = [ll2mm(p[0], p[1]) for p in ROUTE['pts']]
cuts = [c['i'] for c in ROUTE['camps'][1:-1]]
prev = 0
add(circle(*RP[0], 1.5), 'red', 'route', camp='base')
for ci, c in zip(cuts, ROUTE['camps'][1:-1]):
    add(RP[prev:ci + 1], 'red', 'route'); add(circle(*RP[ci], 1.5, a0=math.atan2(RP[ci][1] - RP[ci - 1][1], RP[ci][0] - RP[ci - 1][0]) + math.pi), 'red', 'route', camp=c['id']); prev = ci
add(RP[prev:], 'red', 'route', camp='summit')
tri = [(SX, SY - 2.6), (SX + 2.3, SY + 1.4), (SX - 2.3, SY + 1.4), (SX, SY - 2.6)]   # the summit mark, as soon as the line arrives
add(tri, 'red', 'tri'); add([(SX, SY - 1.4), (SX + 1.2, SY + .7), (SX - 1.2, SY + .7), (SX, SY - 1.4)], 'red', 'tri')
# the zoom box where the profile will end and the dashed callout up to the inset first (the pen heads north-east, clear of the camps),
# then the profile line, which climbs into the waiting box
PP = [prof(p[3], p[2]) for p in ROUTE['pts']]
psx, psy = PP[-1]
rect(psx - 4, psy - 2.6, psx + 3, psy + 2.6, 'red', 'callout')
for a, b in [((psx - 4, psy - 2.6), (IX0 + 60, IY1)), ((psx + 3, psy - 2.6), (IX1, IY1))]:
    for d in dashed(a, b): add(d, 'red', 'callout')
prev = 0; add(circle(*PP[0], 1.2), 'red', 'profile', camp='base')
for ci, c in zip(cuts, ROUTE['camps'][1:-1]):
    add(PP[prev:ci + 1], 'red', 'profile'); add(circle(*PP[ci], 1.2), 'red', 'profile', camp=c['id']); prev = ci
add(PP[prev:], 'red', 'profile', camp='summit')

# ---------------- black: the three official heights in the inset, the caption under the number
text('in_cn', '峰顶高程 三次官方测量', IX0 + 6, IY0 + 9.5, 5.2, 'black', 'labels', cjk='sansmed')
text('in_en', 'Summit height: three official surveys', IX0 + 6, IY0 + 17.0, 4.6, 'black', 'labels', passes=2)
ROWS = [('2020', 8848.86, '8848.86 m', 110.5, ('雪面高程', 'snow surface')), ('1975', 8848.13, '8848.13 m', 129.0, None),
        ('2005', 8844.43, '8844.43 m', 143.5, ('岩面高程', 'rock surface'))]
LX = AX + 16
for yr, h, val, by, note in ROWS:
    ty = iy(h)
    add([(AX - .2, ty), (AX + 5, ty), (LX - 2, by - 2.0)], 'black', 'labels')
    text('row' + yr + '_y', yr, LX, by, 6.2, 'black', 'labels', passes=2)
    text('row' + yr, val, LX + 21, by, 6.2, 'black', 'labels', passes=2)
    if note:
        text('row' + yr + '_cn', note[0], LX + 78, by - 1.0, 4.0, 'black', 'labels', cjk='sansmed')
        text('row' + yr + '_en', note[1], LX + 78, by + 4.6, 3.6, 'black', 'labels', passes=2)
text('cap_cn', '2020年 中尼共同宣布', RX0 + 2, 363, 5.0, 'black', 'labels', cjk='sansmed')
text('cap_en', 'Announced by China and Nepal, 2020', RX0 + 2, 370.5, 4.4, 'black', 'labels', passes=2)

# ---------------- red: ring the 2020 value, then the number itself
rb = next(b for b in BLOCKS if b['id'] == 'row2020')['bbox']
cx, cy = (rb[0] + rb[2]) / 2, (rb[1] + rb[3]) / 2; rx, ry = (rb[2] - rb[0]) / 2 + 4.5, (rb[3] - rb[1]) / 2 + 3.2
ring = [(cx + rx * math.cos(a), cy + ry * math.sin(a)) for a in np.linspace(math.pi * .95, math.pi * .95 + 2 * math.pi * 1.06, 60)]
add(ring, 'red', 'circle')
text('number', '8848.86 m', RX0 + 1, 350, 46, 'red', 'number', passes=2)

# ---------------- lifted relief (for the low shot): every 100 m at true scale (1 mm = 80 m), fading to the paper away from the massif
LC = (SX + 2, SY - 22)   # centre of the lifted area (mm)
def lift_w(x, y):
    r = math.dist((x, y), LC); return 1.0 if r < 60 else (0.0 if r > 100 else 0.5 + 0.5 * math.cos((r - 60) / 40 * math.pi))
LIFT = []
for lev in LEVELS:
    if lev % 100: continue
    for p in CONT[lev]:
        q = rdp(p, .15)
        if plen(q) < 3: continue
        ws = [lift_w(x, y) for x, y in q]
        if max(ws) < .02: continue
        h = (lev - 4300) / SCALE
        LIFT.append({'lv': lev, 'pts': [round(v, 2) for x, y, w in zip([a for a, _ in q], [b for _, b in q], ws) for v in (x, y, h * w)]})

# ---------------- end card (screen pixels at 1920 × 1080, drawn by the page in paper-coloured line)
END = []
for eid, st, x, y, em, kw in [('end_title', '8848.86', 150, 470, 210, {}), ('end_en', '8,848.86 Metres', 156, 566, 62, {}),
                               ('end_cn', '笔绘仪', 156, 700, 58, {'cjk': 'sansmed'}), ('end_style', 'Pen Plotter', 156, 772, 52, {}),
                               ('end_sign', 'LemoLab × Claude Opus 5.5', 156, 890, 44, {})]:
    L = T.layout(st, x, y, em, **kw)
    END.append({'id': eid, 'text': st, 'bbox': [round(v, 1) for v in L['bbox']], 'strokes': [R2(q) for q in L['strokes']]})

out = {'sheet': [594, 420], 'map': [X0, Y0, MW, MH], 'scale': SCALE, 'summit': [round(SX, 2), round(SY, 2)],
       'camps': {k: [round(v[0], 2), round(v[1], 2)] for k, v in CAMPMM.items()},
       'profile': [PX0, PY0, PX1, PY1], 'inset': [IX0, IY0, IX1, IY1], 'pens': ['black', 'brown', 'grey', 'red'],
       'strokes': S, 'blocks': BLOCKS, 'lift': LIFT, 'end': END}
json.dump(out, open(os.path.join(ROOT, 'plot.json'), 'w'), separators=(',', ':'))
from collections import Counter
print('strokes', len(S), Counter(s['seg'] for s in S), 'lift', len(LIFT), 'size MB', round(os.path.getsize(os.path.join(ROOT, 'plot.json')) / 1e6, 1))
print('used CJK', {k: ''.join(sorted(v)) for k, v in T.USED.items()})
