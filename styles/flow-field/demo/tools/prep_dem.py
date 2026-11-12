"""ETOPO1 (NOAA NGDC, public domain) subsets -> the chart's geometry.
Run: .venv/bin/python -I styles/flow-field/demo/tools/prep_dem.py   (build.sh runs it when raw/chart.json is missing)
Inputs  raw/dem/region_2min.csv  (6–27N, 97–132E, every 2 arc-minutes)
        raw/dem/hainan_1min.csv  (17.6–21.8N, 107.5–111.8E, every arc-minute)
          downloaded from https://upwell.pfeg.noaa.gov/erddap/griddap/etopo180 (tools/fetch_data.py; see CREDITS)
Outputs raw/chart.json: coastlines, depth contours, land contours (lon/lat polylines), and two Int16 height grids (base64)
        that the page uses for the land mask, the terrain drag and the relief."""
import os, json, base64
import numpy as np
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(HERE, '..')

def load(path):
    a = np.genfromtxt(path, delimiter=',', skip_header=2)
    lat, lon, z = a[:, 0], a[:, 1], a[:, 2]
    la, lo = np.unique(lat), np.unique(lon)
    Z = np.full((len(la), len(lo)), np.nan)
    Z[np.searchsorted(la, lat), np.searchsorted(lo, lon)] = z
    return la, lo, Z

def march(Z, level):
    """marching squares -> list of polylines in fractional (row, col)"""
    ny, nx = Z.shape; segs = []
    a = Z[:-1, :-1] > level; b = Z[:-1, 1:] > level; c = Z[1:, 1:] > level; d = Z[1:, :-1] > level
    idx = a * 1 + b * 2 + c * 4 + d * 8
    def ip(z0, z1): return (level - z0) / (z1 - z0)
    for (j, i) in zip(*np.nonzero((idx != 0) & (idx != 15))):
        z00, z01, z11, z10 = Z[j, i], Z[j, i + 1], Z[j + 1, i + 1], Z[j + 1, i]
        e = {}
        if (z00 > level) != (z01 > level): e['t'] = (j, i + ip(z00, z01))
        if (z01 > level) != (z11 > level): e['r'] = (j + ip(z01, z11), i + 1)
        if (z10 > level) != (z11 > level): e['b'] = (j + 1, i + ip(z10, z11))
        if (z00 > level) != (z10 > level): e['l'] = (j + ip(z00, z10), i)
        k = list(e.values())
        if len(k) == 2: segs.append((k[0], k[1]))
        elif len(k) == 4:
            segs.append((e['t'], e['r'])); segs.append((e['b'], e['l']))
    # chain
    key = lambda p: (round(p[0] * 1e4), round(p[1] * 1e4))
    adj = {}
    for s in segs:
        for p, q in ((s[0], s[1]), (s[1], s[0])): adj.setdefault(key(p), []).append((p, q))
    used = set(); lines = []
    for s in segs:
        sid = (key(s[0]), key(s[1]))
        if sid in used or (sid[1], sid[0]) in used: continue
        used.add(sid); line = [s[0], s[1]]
        for direction in (0, 1):
            while True:
                end = line[-1] if direction == 0 else line[0]
                nxt = None
                for p, q in adj.get(key(end), []):
                    k2 = (key(p), key(q))
                    if k2 in used or (k2[1], k2[0]) in used: continue
                    used.add(k2); nxt = q; break
                if nxt is None: break
                if direction == 0: line.append(nxt)
                else: line.insert(0, nxt)
        lines.append(line)
    return lines

def dp(pts, eps):
    pts = np.asarray(pts)
    if len(pts) < 3: return pts
    keep = np.zeros(len(pts), bool); keep[0] = keep[-1] = True; stack = [(0, len(pts) - 1)]
    while stack:
        i0, i1 = stack.pop(); a, b = pts[i0], pts[i1]; ab = b - a; L = np.hypot(*ab)
        seg = pts[i0 + 1:i1]
        if len(seg) == 0: continue
        dd = np.abs(ab[0] * (seg[:, 1] - a[1]) - ab[1] * (seg[:, 0] - a[0])) / L if L > 0 else np.hypot(*(seg - a).T)
        k = int(np.argmax(dd))
        if dd[k] > eps: keep[i0 + 1 + k] = True; stack += [(i0, i0 + 1 + k), (i0 + 1 + k, i1)]
    return pts[keep]

def to_ll(lines, la, lo, eps, minlen):
    out = []
    for L in lines:
        P = np.array([[lo[0] + c * (lo[1] - lo[0]), la[0] + r * (la[1] - la[0])] for r, c in L])
        if len(P) < minlen: continue
        P = dp(P, eps)
        out.append([round(float(v), 4) for xy in P for v in xy])
    return out

la, lo, Z = load(os.path.join(D, 'raw/dem/region_2min.csv'))
hla, hlo, HZ = load(os.path.join(D, 'raw/dem/hainan_1min.csv'))
print('region', Z.shape, 'hainan', HZ.shape)

chart = {}
# coastlines: region grid everywhere, the 1' grid inside its box (the page swaps by box)
chart['coast'] = to_ll(march(ndimage.gaussian_filter(Z, 0.6), 0.0), la, lo, 0.012, 4)
chart['coastHi'] = to_ll(march(ndimage.gaussian_filter(HZ, 0.7), 0.0), hla, hlo, 0.006, 4)
chart['coastHiBox'] = [float(hlo[0]), float(hla[0]), float(hlo[-1]), float(hla[-1])]
Zs = ndimage.gaussian_filter(Z, 2.0)
chart['depth'] = {str(d): to_ll(march(Zs, d), la, lo, 0.03, 12) for d in (-50, -200, -1000, -2000, -3000, -4000)}
Hs = ndimage.gaussian_filter(HZ, 1.2)
chart['relief'] = {str(h): to_ll(march(Hs, h), hla, hlo, 0.008, 8) for h in (100, 250, 400, 600, 800, 1000, 1200, 1400)}
landR = ndimage.gaussian_filter(Z, 1.5)
chart['reliefRegion'] = {str(h): to_ll(march(landR, h), la, lo, 0.02, 10) for h in (200, 500, 1000, 1500)}

def grid(la, lo, Z):
    z = np.nan_to_num(Z, nan=0).clip(-12000, 9000).astype('<i2')
    return {'lat0': float(la[0]), 'dlat': float(la[1] - la[0]), 'lon0': float(lo[0]), 'dlon': float(lo[1] - lo[0]),
            'ny': int(z.shape[0]), 'nx': int(z.shape[1]), 'b64': base64.b64encode(z.tobytes()).decode()}
chart['gridR'] = grid(la, lo, Z)
chart['gridH'] = grid(hla, hlo, HZ)
out = os.path.join(D, 'raw/chart.json')
json.dump(chart, open(out, 'w'), separators=(',', ':'))
print('wrote', out, os.path.getsize(out) // 1024, 'KB; coast lines', len(chart['coast']), 'hi', len(chart['coastHi']))
for k, v in chart['depth'].items(): print('depth', k, len(v))
for k, v in chart['relief'].items(): print('relief', k, len(v))
