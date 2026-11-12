"""Bake the low sun's terrain shadows into textures (no shadow map at render time, so nothing shimmers while the camera flies).

The sun comes from the west-north-west, 20.5 degrees above the horizon.
Heights are the exaggerated ones the page uses (metres / 1000 * EX, sea flat at 0).
For every texel a ray is marched toward the sun; the soft edge widens with distance to the occluder (penumbra).

assets/shadow.png       strait mesh (2x the height grid)
assets/wide_shadow.png  backdrop mesh (2x the height grid)
usage (library root): .venv/bin/python -I styles/map-explainer/demo/tools/bake.py styles/map-explainer/demo
"""
import sys, os, json, math
import numpy as np
from PIL import Image
from scipy import ndimage

D = sys.argv[1]; A = os.path.join(D, 'assets')
EX = 3.2
SUN = np.array([-150.0, 62.0, -70.0])            # world: x east, y up, z south
hor = math.hypot(SUN[0], SUN[2]); TAN = SUN[1] / hor
dx, dz = SUN[0] / hor, SUN[2] / hor               # unit horizontal step toward the sun (km)


def bake(hfile, mfile, out, up=2, reach=60.0):
    m = json.load(open(os.path.join(A, mfile)))
    GW, GH = m['GW'], m['GH']
    h = np.fromfile(os.path.join(A, hfile), '<f4').reshape(GH, GW)
    y = np.maximum(h, 0) / 1000 * EX
    if up > 1:
        y = ndimage.zoom(y, up, order=1)
    H, Wd = y.shape
    kx = m['width_km'] / (Wd - 1); kz = m['height_km'] / (H - 1)   # km per texel
    step = min(kx, kz) * 0.75
    R, C = np.mgrid[0:H, 0:Wd].astype(np.float32)
    occ = np.zeros_like(y)
    d = step
    while d < reach:
        rr = R + dz * d / kz; cc = C + dx * d / kx
        hs = ndimage.map_coordinates(y, [rr, cc], order=1, mode='nearest')
        ray = y + d * TAN
        # how far the terrain pokes above the ray, relative to a penumbra that grows with distance
        occ = np.maximum(occ, (hs - ray) / (0.02 + d * 0.04))
        d += step * (1 + d / 25)                    # coarser steps far away
    lit = np.clip(1 - occ, 0, 1)
    lit = lit * lit * (3 - 2 * lit)
    Image.fromarray((lit * 255 + .5).astype(np.uint8)).save(os.path.join(A, out))
    print(out, Wd, H, 'shadowed', float((lit < .5).mean()))


bake('height.bin', 'meta.json', 'shadow.png', up=2, reach=40)
bake('wide_height.bin', 'wide_meta.json', 'wide_shadow.png', up=2, reach=60)
