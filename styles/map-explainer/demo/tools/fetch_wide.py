"""Fetch the wide, low-resolution backdrop for the opening shot (the whole Persian Gulf).

- Elevation + bathymetry: AWS Terrain Tiles (terrarium PNG), zoom 8 (~0.55 km/px)
- Imagery: EOX Sentinel-2 cloudless 2016 (layer s2cloudless_3857, CC BY 4.0), zoom 9 (~0.27 km/px)

usage (library root): .venv/bin/python -I styles/map-explainer/demo/tools/fetch_wide.py styles/map-explainer/demo
Writes raw/wterrain_z8.png, raw/ws2_z9.jpg, raw/wbbox.json and appends every URL to raw/manifest.jsonl
"""
import sys, os, io, json, math, time, datetime, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

D = sys.argv[1]
RAW = os.path.join(D, 'raw'); os.makedirs(RAW, exist_ok=True)
W, S, E, N = 35.5, 19.0, 60.0, 31.6
UA = {'User-Agent': 'lemo-opuscar-demo/1.0 (research)'}
LOG = open(os.path.join(RAW, 'manifest.jsonl'), 'a')


def tile_xy(lon, lat, z):
    n = 2 ** z
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n


def get(url):
    for k in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                b = r.read()
            LOG.write(json.dumps({'url': url, 'bytes': len(b), 'date': datetime.date.today().isoformat()}) + '\n')
            return b
        except Exception:
            if k == 4:
                raise
            time.sleep(2 + 3 * k)


def mosaic(name, tmpl, z, ext):
    dst = os.path.join(RAW, f'{name}_z{z}.{ext}')
    x0, y0 = tile_xy(W, N, z); x1, y1 = tile_xy(E, S, z)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    meta = {'z': z, 'tx0': tx0, 'ty0': ty0, 'tx1': tx1, 'ty1': ty1}
    if not os.path.exists(dst):
        jobs = [(x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]
        im = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
        with ThreadPoolExecutor(8) as ex:
            for (x, y), b in ex.map(lambda j: (j, get(tmpl.format(z=z, x=j[0], y=j[1]))), jobs):
                im.paste(Image.open(io.BytesIO(b)).convert('RGB'), ((x - tx0) * 256, (y - ty0) * 256))
        im.save(dst, quality=95) if ext == 'jpg' else im.save(dst)
    print(name, meta)
    return meta


meta = {'bbox': [W, S, E, N]}
meta['terrain'] = mosaic('wterrain', 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', 8, 'png')
meta['s2'] = mosaic('ws2', 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg', 9, 'jpg')
json.dump(meta, open(os.path.join(RAW, 'wbbox.json'), 'w'), indent=1)
