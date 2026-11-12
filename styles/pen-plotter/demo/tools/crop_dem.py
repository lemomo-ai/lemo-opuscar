# Mosaic the four NASADEM tiles and crop the Mount Qomolangma (Everest) north-side window.
# Output: data/dem.npy (int16 metres, row 0 = north) + data/dem.json (bbox, sample spacing in metres).
# Run from the library root:  .venv/bin/python -I styles/pen-plotter/demo/tools/crop_dem.py [--preview]
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(HERE, '..', 'data'); RAW = os.path.join(DATA, 'raw')
# crop window (degrees): the summit, the north ridge, the East Rongbuk glacier and the Base Camp in the Rongbuk valley
LAT0, LAT1, LON0, LON1 = 27.900, 28.160, 86.790, 87.060
N = 3600   # samples per degree (tiles are 3601 × 3601, edges shared)

def tile(name): return np.array(Image.open(os.path.join(RAW, f'NASADEM_HGT_{name}.tif'))).astype(np.int32)
west = np.vstack([tile('n28e086')[:-1], tile('n27e086')])   # rows: 29.0 N → 27.0 N (row 0 = north); cols 86.0 → 87.0 E
east = np.vstack([tile('n28e087')[:-1], tile('n27e087')])   # cols 87.0 → 88.0 E
mos = np.hstack([west[:, :-1], east])                       # 7201 × 7201, cols 86.0 → 88.0 E
r0, r1 = round((29 - LAT1) * N), round((29 - LAT0) * N) + 1
c0, c1 = round((LON0 - 86) * N), round((LON1 - 86) * N) + 1
dem = mos[r0:r1, c0:c1].astype(np.int16)
lat_mid = (LAT0 + LAT1) / 2
phi = np.radians(lat_mid)   # metres per degree on the WGS 84 ellipsoid (standard series)
dy = (111132.92 - 559.82 * np.cos(2 * phi) + 1.175 * np.cos(4 * phi)) / N
dx = (111412.84 * np.cos(phi) - 93.5 * np.cos(3 * phi)) / N
meta = {'source': 'NASADEM_HGT v001 (NASA JPL), tiles n27e086, n28e086, n27e087, n28e087, 1 arc-second',
        'lat': [29 - r0 / N, 29 - (r1 - 1) / N],
        'lon': [86 + c0 / N, 86 + (c1 - 1) / N], 'shape': list(dem.shape), 'dx_m': float(dx), 'dy_m': float(dy),
        'min': int(dem.min()), 'max': int(dem.max())}
np.save(os.path.join(DATA, 'dem.npy'), dem)
json.dump(meta, open(os.path.join(DATA, 'dem.json'), 'w'), indent=1)
print(meta)

if '--preview' in sys.argv:   # hillshade with a 0.01° grid, to check the route against the terrain
    z = dem.astype(np.float32); gy, gx = np.gradient(z, dy, dx)
    nx, ny, nz = -gx, gy, np.ones_like(z); l = np.sqrt(nx ** 2 + ny ** 2 + 1)
    L = np.array([-.6, .55, .58]); sh = (nx * L[0] + ny * L[1] + nz * L[2]) / l
    img = np.clip(sh * 200 + 20, 0, 255).astype(np.uint8)
    rgb = np.stack([img] * 3, -1)
    for k in range(0, 40):
        r = round((LAT1 - (np.floor(LAT1 * 100) / 100 - k * .01)) * N)
        if 0 <= r < rgb.shape[0]: rgb[r, :, :] = [255, 0, 0] if k % 5 == 0 else [255, 160, 160]
        c = round(((np.ceil(LON0 * 100) / 100 + k * .01) - LON0) * N)
        if 0 <= c < rgb.shape[1]: rgb[:, c, :] = [0, 0, 255] if round((LON0 + c / N) * 100) % 5 == 0 else [160, 160, 255]
    for lev in range(5000, 8800, 500):   # coarse contours in yellow
        m = (z >= lev).astype(np.int8); e = (np.abs(np.diff(m, axis=0, prepend=m[:1])) + np.abs(np.diff(m, axis=1, prepend=m[:, :1]))) > 0
        rgb[e] = [230, 200, 0]
    Image.fromarray(rgb).save(os.path.join(DATA, 'preview.png'))
    print('preview.png', rgb.shape)
