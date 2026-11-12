# The north-side climbing route as an approximate line on the DEM, and its elevation profile.
# The line is a least-cost path through NASADEM (cost grows with slope and with climbing/descending), pinned at
# published points: the Base Camp, the North Col and the summit. It is a sketch of the route, not a GPS track.
# Camps are placed where the profile first reaches the camp's published altitude (FACTS.md), so map and profile agree.
# Output: data/route.json  { pts: [[lat, lon, z, dist_m], ...], camps: [...] }
# Run from the library root:  .venv/bin/python -I styles/pen-plotter/demo/tools/route.py
import json, os
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra

HERE = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(HERE, '..', 'data')
dem = np.load(os.path.join(DATA, 'dem.npy')).astype(np.float64); M = json.load(open(os.path.join(DATA, 'dem.json')))
(LAT1, LAT0), (LON0, LON1) = M['lat'], M['lon']; DX, DY = M['dx_m'], M['dy_m']
H, W = dem.shape
def rc(lat, lon): return int(round((LAT1 - lat) * 3600)), int(round((lon - LON0) * 3600))
# pinned points (lat, lon): see FACTS.md for the sources of the coordinates
PINS = [('base', 28.1414, 86.8514), ('col', 28.01583, 86.92500), ('summit', 27.98806, 86.92500)]
# snap each pin to the local maximum (summit) / keep as is
r, c = rc(PINS[2][1], PINS[2][2]); win = dem[r - 3:r + 4, c - 3:c + 4]; dr, dc = np.unravel_index(win.argmax(), win.shape)
PINS[2] = ('summit', LAT1 - (r - 3 + dr) / 3600, LON0 + (c - 3 + dc) / 3600)

# graph: 8-neighbour grid; edge cost = horizontal distance × slope penalty + vertical change penalty
idx = np.arange(H * W).reshape(H, W)
rows, cols, wts = [], [], []
for di, dj in [(0, 1), (1, 0), (1, 1), (1, -1)]:
    a = idx[0:H - di, max(0, -dj):W - max(0, dj)]; b = idx[di:H, max(0, dj):W - max(0, -dj)]
    za, zb = dem.flat[a.ravel()], dem.flat[b.ravel()]
    d = np.hypot(di * DY, dj * DX); dz = np.abs(zb - za); s = dz / d
    w = d * (1 + (s / .22) ** 2 * 3) + dz * 2.0
    rows += [a.ravel(), b.ravel()]; cols += [b.ravel(), a.ravel()]; wts += [w, w]
G = coo_matrix((np.concatenate(wts), (np.concatenate(rows), np.concatenate(cols))), shape=(H * W, H * W)).tocsr()

path = []
for (n0, la0, lo0), (n1, la1, lo1) in zip(PINS[:-1], PINS[1:]):
    s, t = idx[rc(la0, lo0)], idx[rc(la1, lo1)]
    dist, pred = dijkstra(G, indices=s, return_predecessors=True)
    seg = [t]
    while seg[-1] != s: seg.append(pred[seg[-1]])
    seg = seg[::-1]
    path += seg if not path else seg[1:]
P = np.array([[i // W, i % W] for i in path], np.float64)
# smooth (keep the pins) and resample every 40 m
for _ in range(6):
    Q = P.copy(); Q[1:-1] = (P[:-2] + 2 * P[1:-1] + P[2:]) / 4; P = Q
xy = np.stack([P[:, 1] * DX, P[:, 0] * DY], 1)
seglen = np.hypot(*np.diff(xy, axis=0).T); cum = np.concatenate([[0], np.cumsum(seglen)])
L = cum[-1]; ss = np.arange(0, L, 40.0); ss = np.append(ss, L)
rr = np.interp(ss, cum, P[:, 0]); cc = np.interp(ss, cum, P[:, 1])
def bil(r, c):
    i, j = np.clip(np.floor(r).astype(int), 0, H - 2), np.clip(np.floor(c).astype(int), 0, W - 2); a, b = r - i, c - j
    return (dem[i, j] * (1 - b) + dem[i, j + 1] * b) * (1 - a) + (dem[i + 1, j] * (1 - b) + dem[i + 1, j + 1] * b) * a
zz = bil(rr, cc)
pts = [[round(LAT1 - r / 3600, 6), round(LON0 + c / 3600, 6), round(float(z), 1), round(float(s), 1)] for r, c, z, s in zip(rr, cc, zz, ss)]
# camps: first point where the profile reaches the published altitude
CAMPS = [('base', 5200), ('mid', 5800), ('abc', 6500), ('c1', 7028), ('c2', 7790), ('c3', 8300)]
camps = []
for name, alt in CAMPS:
    k = 0 if name == 'base' else next(i for i, p in enumerate(pts) if p[2] >= alt)
    camps.append({'id': name, 'alt': alt, 'i': k, 'lat': pts[k][0], 'lon': pts[k][1], 'z_dem': pts[k][2], 'dist_m': pts[k][3]})
camps.append({'id': 'summit', 'alt': 8848.86, 'i': len(pts) - 1, 'lat': pts[-1][0], 'lon': pts[-1][1], 'z_dem': pts[-1][2], 'dist_m': pts[-1][3]})
json.dump({'note': 'approximate route: least-cost path on NASADEM pinned at Base Camp, North Col, summit', 'pins': PINS, 'pts': pts, 'camps': camps},
          open(os.path.join(DATA, 'route.json'), 'w'))
json.dump({'pts': [[p[0], p[1], ''] for p in pts[::25]] + [[c['lat'], c['lon'], c['id']] for c in camps]}, open(os.path.join(DATA, 'route_waypoints.json'), 'w'))
print('length km', round(L / 1000, 2), 'pins', PINS)
for c in camps: print(c)
