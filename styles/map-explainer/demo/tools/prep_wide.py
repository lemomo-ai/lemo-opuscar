"""Turn the wide raw tiles into the backdrop's assets, graded exactly like the strait assets (prep.py).

assets/wide_height.bin  float32 metres, GW x GH, row 0 = north
assets/wide_water.png   sea mask (R = water), half size
assets/wide_albedo.jpg  graded Sentinel-2 cloudless land + depth-shaded sea
assets/wide_meta.json   grid size, mercator box (at the imagery zoom), km per pixel
usage (library root): .venv/bin/python -I styles/map-explainer/demo/tools/prep_wide.py styles/map-explainer/demo
"""
import sys, os, json, math
import numpy as np
from PIL import Image
from scipy import ndimage

D = sys.argv[1]
RAW = os.path.join(D, 'raw'); OUT = os.path.join(D, 'assets')
Image.MAX_IMAGE_PIXELS = None
m = json.load(open(os.path.join(RAW, 'wbbox.json')))
W, S, E, N = m['bbox']


def merc(lon, lat, z):
    n = 2 ** z * 256
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n


s2m = m['s2']; z = s2m['z']
x0, y0 = merc(W, N, z); x1, y1 = merc(E, S, z)
img = Image.open(os.path.join(RAW, f'ws2_z{z}.jpg')).convert('RGB')
img = img.crop((int(x0 - s2m['tx0'] * 256), int(y0 - s2m['ty0'] * 256), int(x1 - s2m['tx0'] * 256), int(y1 - s2m['ty0'] * 256)))
IW, IH = img.size
latc = (S + N) / 2
# km per pixel: use the same reference latitude as the strait assets, so both meshes share one world scale
fine = json.load(open(os.path.join(OUT, 'meta.json')))
km_px = fine['km_px'] * 2 ** (fine['z'] - z)
px_km = 1 / km_px

tm = m['terrain']; zt = tm['z']
tx0, ty0 = merc(W, N, zt); tx1, ty1 = merc(E, S, zt)
t = np.asarray(Image.open(os.path.join(RAW, f'wterrain_z{zt}.png')).convert('RGB'), np.float64)
h = t[..., 0] * 256 + t[..., 1] + t[..., 2] / 256 - 32768
ys = (np.arange(IH) + .5) / IH * (ty1 - ty0) + ty0 - tm['ty0'] * 256 - .5
xs = (np.arange(IW) + .5) / IW * (tx1 - tx0) + tx0 - tm['tx0'] * 256 - .5
X, Y = np.meshgrid(xs, ys)
hi = ndimage.map_coordinates(h, [Y, X], order=3, mode='nearest').astype(np.float32)

a = np.asarray(img, np.float32) / 255
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = .3 * r + .59 * g + .11 * b
watery = (b > r + .015) & (lum < .42)
water = (hi <= 1.0) | (watery & (hi < 12))
water = ndimage.binary_opening(water, iterations=1)
water = ndimage.binary_closing(water, iterations=1)
lab, n = ndimage.label(water)
sizes = ndimage.sum(water, lab, range(1, n + 1))
keep = np.zeros(n + 1, bool); keep[1:] = sizes > 4000 / 16 * 4   # same area in km2 as prep.py's 4000 px at z11
water = keep[lab]
land = ~water
hl = np.where(land, np.maximum(hi, 2.0), np.minimum(hi, -1.0))
dist_land = ndimage.distance_transform_edt(water) * km_px          # km from the coast

lin = a ** 2.2
L = lin.copy()
l = (L * [.2126, .7152, .0722]).sum(-1, keepdims=True)
L = l + (L - l) * .82
L = L * np.array([1.06, 1.0, .88])
L = np.clip(L * .9, 0, 1)
L = L ** 1.12 * 1.08
depth = np.clip(-hl, 0, 120)
sh = np.exp(-depth / 9.0)
sh = np.maximum(sh, np.exp(-dist_land / (5.0 * 0.0687)) * .6)
deep = np.array([.008, .030, .066]); mid = np.array([.014, .055, .095]); teal = np.array([.03, .17, .19])
dd = np.clip(depth / 90, 0, 1)[..., None]
sea = mid * (1 - dd) + deep * dd
s2sea = lin * np.array([.55, .95, 1.0])
shallow = .55 * teal + .45 * s2sea
sea = sea * (1 - sh[..., None] * .85) + shallow * (sh[..., None] * .85)
wm = ndimage.gaussian_filter(water.astype(np.float32), .6)[..., None]
alb = L * (1 - wm) + sea * wm
Image.fromarray((np.clip(alb, 0, 1) ** (1 / 2.2) * 255 + .5).astype(np.uint8)).save(os.path.join(OUT, 'wide_albedo.jpg'), quality=92)
Image.fromarray((wm[..., 0] * 255).astype(np.uint8)).resize((IW // 2, IH // 2), Image.LANCZOS).save(os.path.join(OUT, 'wide_water.png'))

GW, GH = IW // 4, IH // 4
hg = np.asarray(Image.fromarray(hl).resize((GW, GH), Image.BILINEAR), np.float32)
hg.astype('<f4').tofile(os.path.join(OUT, 'wide_height.bin'))
meta = {'GW': GW, 'GH': GH, 'IW': IW, 'IH': IH, 'bbox': [W, S, E, N], 'z': z,
        'merc': [x0, y0, x1, y1], 'km_px': km_px, 'width_km': IW * km_px, 'height_km': IH * km_px}
json.dump(meta, open(os.path.join(OUT, 'wide_meta.json'), 'w'), indent=1)
print(meta)
