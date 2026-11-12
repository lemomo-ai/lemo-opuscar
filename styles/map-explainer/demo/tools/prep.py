"""Turn the raw strait tiles into the demo's assets.

assets/height.bin   float32 metres (land: SRTM-based; sea: bathymetry), GW x GH, row 0 = north
assets/albedo.jpg   graded Sentinel-2 cloudless land + depth-shaded sea
assets/meta.json    grid size, mercator box, km per pixel, lon/lat box
usage (library root): .venv/bin/python -I styles/map-explainer/demo/tools/prep.py styles/map-explainer/demo
"""
import sys, os, json, math
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

D = sys.argv[1]
RAW = os.path.join(D, 'raw'); OUT = os.path.join(D, 'assets'); os.makedirs(OUT, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None
m = json.load(open(os.path.join(RAW, 'bbox.json')))
W, S, E, N = m['bbox']


def merc(lon, lat, z):
    n = 2 ** z * 256
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n


# ---- imagery crop (z11 pixels) ----
s2m = m['s2']; z = s2m['z']
x0, y0 = merc(W, N, z); x1, y1 = merc(E, S, z)
ox, oy = s2m['tx0'] * 256, s2m['ty0'] * 256
img = Image.open(os.path.join(RAW, f's2_z{z}.jpg')).convert('RGB')
box = (int(x0 - ox), int(y0 - oy), int(x1 - ox), int(y1 - oy))
img = img.crop(box)
IW, IH = img.size
print('image', IW, IH)

# ---- terrain crop at z10, upsampled to the image grid ----
tm = m['terrain']; zt = tm['z']
tx0, ty0 = merc(W, N, zt); tx1, ty1 = merc(E, S, zt)
tox, toy = tm['tx0'] * 256, tm['ty0'] * 256
t = np.asarray(Image.open(os.path.join(RAW, f'terrain_z{zt}.png')).convert('RGB'), np.float64)
h = t[..., 0] * 256 + t[..., 1] + t[..., 2] / 256 - 32768
# sub-pixel crop via map_coordinates onto the image grid
ys = (np.arange(IH) + .5) / IH * (ty1 - ty0) + ty0 - toy - .5
xs = (np.arange(IW) + .5) / IW * (tx1 - tx0) + tx0 - tox - .5
X, Y = np.meshgrid(xs, ys)
hi = ndimage.map_coordinates(h, [Y, X], order=3, mode='nearest').astype(np.float32)

# ---- water mask from imagery + elevation ----
a = np.asarray(img, np.float32) / 255
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = .3 * r + .59 * g + .11 * b
watery = (b > r + .015) & (lum < .42)          # sea in S2 cloudless is dark and bluer than red
water = (hi <= 1.0) | (watery & (hi < 12))
water = ndimage.binary_opening(water, iterations=2)
water = ndimage.binary_closing(water, iterations=2)
# drop tiny inland "water" blobs (salt flats, shadows)
lab, n = ndimage.label(water)
sizes = ndimage.sum(water, lab, range(1, n + 1))
keep = np.zeros(n + 1, bool); keep[1:] = sizes > 4000
water = keep[lab]
land = ~water

# heights: land >= 2 m, sea <= 0 (bathymetry); keep a smooth seam
hl = np.where(land, np.maximum(hi, 2.0), np.minimum(hi, -1.0))
dist_land = ndimage.distance_transform_edt(water)       # px from coast, in sea
dist_sea = ndimage.distance_transform_edt(land)

# ---- albedo ----
lin = a ** 2.2
# land grade: warm, a bit lower saturation and contrast, lifted shadows
L = lin.copy()
l = (L * [.2126, .7152, .0722]).sum(-1, keepdims=True)
L = l + (L - l) * .82
L = L * np.array([1.06, 1.0, .88])
L = np.clip(L * .9, 0, 1)
L = L ** 1.12 * 1.08  # a little more contrast in the land
# sea: depth-shaded navy; coastal shallows keep S2 texture, toned teal
depth = np.clip(-hl, 0, 120)
sh = np.exp(-depth / 9.0)                          # 1 at the shore, ~0 past ~25 m
sh = np.maximum(sh, np.exp(-dist_land / 5.0) * .6)
deep = np.array([.008, .030, .066]); mid = np.array([.014, .055, .095]); teal = np.array([.03, .17, .19])
dd = np.clip(depth / 90, 0, 1)[..., None]
sea = mid * (1 - dd) + deep * dd
s2sea = lin * np.array([.55, .95, 1.0])
shallow = .55 * teal + .45 * s2sea
sea = sea * (1 - sh[..., None] * .85) + shallow * (sh[..., None] * .85)
# soft coastline: blend 2 px
wm = ndimage.gaussian_filter(water.astype(np.float32), 1.2)[..., None]
alb = L * (1 - wm) + sea * wm
alb8 = (np.clip(alb, 0, 1) ** (1 / 2.2) * 255 + .5).astype(np.uint8)
Image.fromarray(alb8).save(os.path.join(OUT, 'albedo.jpg'), quality=93)

# roughness/ water mask texture (R = water)
Image.fromarray((wm[..., 0] * 255).astype(np.uint8)).resize((IW // 2, IH // 2), Image.LANCZOS).save(os.path.join(OUT, 'water.png'))

# ---- height grid for the mesh (half image resolution) ----
GW, GH = IW // 4, IH // 4
hg = np.asarray(Image.fromarray(hl).resize((GW, GH), Image.BILINEAR), np.float32)
hg.astype('<f4').tofile(os.path.join(OUT, 'height.bin'))

# km per image pixel at the centre latitude
latc = (S + N) / 2
km_px = 40075.016 * math.cos(math.radians(latc)) / (2 ** z * 256)
meta = {'GW': GW, 'GH': GH, 'IW': IW, 'IH': IH, 'bbox': [W, S, E, N], 'z': z,
        'merc': [x0, y0, x1, y1], 'km_px': km_px,
        'width_km': IW * km_px, 'height_km': IH * km_px, 'hmax': float(hl.max()), 'hmin': float(hl.min())}
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)
print(meta)
