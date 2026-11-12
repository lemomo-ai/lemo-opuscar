"""ETOPO1 (NOAA NGDC, public domain), 2–24°N 104–123°E every 6′ -> raw/inset.json for the 南海诸岛 inset:
a land mask on the 0.1° grid and the 0 m coastline as lon/lat polylines.
Run: .venv/bin/python -I styles/flow-field/demo/tools/prep_inset.py   (build.sh runs it when raw/inset.json is missing)"""
import os, json
import numpy as np
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a = np.genfromtxt(os.path.join(D, 'raw/dem/scs_6min.csv'), delimiter=',', skip_header=2)
la, lo = np.unique(a[:, 0]), np.unique(a[:, 1])
Z = np.full((len(la), len(lo)), np.nan); Z[np.searchsorted(la, a[:, 0]), np.searchsorted(lo, a[:, 1])] = a[:, 2]
land = (Z > 0).astype(np.uint8)

def march(Z, level=0.0):
    """marching squares -> polylines in fractional (row, col), chained"""
    segs = []
    for j in range(Z.shape[0] - 1):
        for i in range(Z.shape[1] - 1):
            z00, z01, z11, z10 = Z[j, i], Z[j, i + 1], Z[j + 1, i + 1], Z[j + 1, i]
            e = []
            ip = lambda p, q: (level - p) / (q - p)
            if (z00 > level) != (z01 > level): e.append((j, i + ip(z00, z01)))
            if (z01 > level) != (z11 > level): e.append((j + ip(z01, z11), i + 1))
            if (z10 > level) != (z11 > level): e.append((j + 1, i + ip(z10, z11)))
            if (z00 > level) != (z10 > level): e.append((j + ip(z00, z10), i))
            if len(e) == 2: segs.append((e[0], e[1]))
            elif len(e) == 4: segs += [(e[0], e[1]), (e[2], e[3])]
    key = lambda p: (round(p[0] * 1e4), round(p[1] * 1e4))
    nb = {}
    for k, (p, q) in enumerate(segs): nb.setdefault(key(p), []).append(k); nb.setdefault(key(q), []).append(k)
    used = [False] * len(segs); lines = []
    for k in range(len(segs)):
        if used[k]: continue
        used[k] = True; line = [segs[k][0], segs[k][1]]
        for end in (1, 0):
            while True:
                tip = line[-1] if end else line[0]; nxt = None
                for m in nb.get(key(tip), []):
                    if not used[m]: nxt = m; break
                if nxt is None: break
                used[nxt] = True; p, q = segs[nxt]; o = q if key(p) == key(tip) else p
                if end: line.append(o)
                else: line.insert(0, o)
        lines.append(line)
    return lines
coast = []
for L in march(Z):
    if len(L) < 3: continue
    pts = []
    for r, c in L[::2] + [L[-1]]: pts += [round(float(lo[0] + c * (lo[1] - lo[0])), 3), round(float(la[0] + r * (la[1] - la[0])), 3)]
    coast.append(pts)
out = dict(lon0=float(lo[0]), lat0=float(la[0]), dlon=float(lo[1] - lo[0]), dlat=float(la[1] - la[0]), nx=len(lo), ny=len(la),
           land=''.join(map(str, land.ravel().tolist())), coast=coast)
json.dump(out, open(os.path.join(D, 'raw/inset.json'), 'w'), separators=(',', ':'))
print('inset', land.shape, len(coast), 'coast lines')
