# Check the route waypoints against the terrain: hillshade + 250 m contours + 0.02° grid + waypoints → data/route_check.png
# Run from the library root:  .venv/bin/python -I styles/pen-plotter/demo/tools/preview_route.py
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(HERE, '..', 'data')
dem = np.load(os.path.join(DATA, 'dem.npy')).astype(np.float32); M = json.load(open(os.path.join(DATA, 'dem.json')))
S = 3
(LAT1, LAT0), (LON0, LON1) = M['lat'], M['lon']
def rc(lat, lon): return ((LAT1 - lat) * 3600, (lon - LON0) * 3600)
gy, gx = np.gradient(dem, M['dy_m'], M['dx_m']); l = np.sqrt(gx ** 2 + gy ** 2 + 1)
sh = (gx * .6 + gy * .55 + .58) / l
img = np.clip(sh * 170 + 40, 0, 255).astype(np.uint8)
rgb = np.stack([img] * 3, -1)
for lev in range(4500, 8800, 250):
    m = (dem >= lev).astype(np.int8); e = (np.abs(np.diff(m, axis=0, prepend=m[:1])) + np.abs(np.diff(m, axis=1, prepend=m[:, :1]))) > 0
    rgb[e] = [255, 60, 0] if lev % 1000 == 0 else [230, 200, 0]
im = Image.fromarray(rgb).resize((rgb.shape[1] * S, rgb.shape[0] * S), Image.NEAREST); d = ImageDraw.Draw(im)
for k in range(20):
    lat = round(LAT1 * 50) / 50 - k * .02; r, _ = rc(lat, LON0); d.line([(0, r * S), (im.width, r * S)], fill=(80, 80, 255)); d.text((4, r * S + 2), f'{lat:.2f}', fill=(0, 0, 255))
    lon = round(LON0 * 50) / 50 + k * .02; _, c = rc(LAT1, lon); d.line([(c * S, 0), (c * S, im.height)], fill=(80, 80, 255)); d.text((c * S + 2, 4), f'{lon:.2f}', fill=(0, 0, 255))
R = json.load(open(os.path.join(DATA, 'route_waypoints.json'))) if os.path.exists(os.path.join(DATA, 'route_waypoints.json')) else {'pts': []}
pp = [rc(p[0], p[1]) for p in R['pts']]
d.line([(c * S, r * S) for r, c in pp], fill=(255, 0, 200), width=3)
for (r, c), p in zip(pp, R['pts']):
    z = dem[int(round(r)), int(round(c))]; d.ellipse([c * S - 5, r * S - 5, c * S + 5, r * S + 5], outline=(255, 0, 200), width=2); d.text((c * S + 7, r * S - 6), f'{p[2] if len(p) > 2 else ""} {z:.0f}', fill=(255, 255, 255))
im.save(os.path.join(DATA, 'route_check.png')); print(im.size)
