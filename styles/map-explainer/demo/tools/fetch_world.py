"""Fetch the whole-Earth imagery for the globe shots (opening and ending).

EOX Sentinel-2 cloudless 2016 (layer s2cloudless_3857, CC BY 4.0), zoom 4 (16 x 16 tiles, 4096 px Web Mercator),
reprojected to an equirectangular texture (lat +-85; the poles are filled by the page).
usage (library root): .venv/bin/python -I styles/map-explainer/demo/tools/fetch_world.py styles/map-explainer/demo
Writes raw/world_s2_z4.jpg and assets/world.jpg; every URL goes into raw/manifest.jsonl
"""
import sys, os, io, json, math, time, datetime, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image
from scipy import ndimage

D = sys.argv[1]; RAW = os.path.join(D, 'raw'); OUT = os.path.join(D, 'assets')
Z = 4; n = 2 ** Z
LOG = open(os.path.join(RAW, 'manifest.jsonl'), 'a')
UA = {'User-Agent': 'lemo-opuscar-demo/1.0 (research)'}


def get(url):
    for k in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                b = r.read()
            LOG.write(json.dumps({'url': url, 'bytes': len(b), 'date': datetime.date.today().isoformat()}) + '\n')
            return b
        except Exception:
            if k == 4: raise
            time.sleep(2 + 3 * k)


src = os.path.join(RAW, f'world_s2_z{Z}.jpg')
if not os.path.exists(src):
    im = Image.new('RGB', (n * 256, n * 256))
    jobs = [(x, y) for y in range(n) for x in range(n)]
    tmpl = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'
    with ThreadPoolExecutor(8) as ex:
        for (x, y), b in ex.map(lambda j: (j, get(tmpl.format(z=Z, x=j[0], y=j[1]))), jobs):
            im.paste(Image.open(io.BytesIO(b)).convert('RGB'), (x * 256, y * 256))
    im.save(src, quality=94)
m = np.asarray(Image.open(src).convert('RGB'), np.float32)
H = W = n * 256
OW, OH = 4096, 2048
lon = (np.arange(OW) + .5) / OW * 360 - 180
lat = 90 - (np.arange(OH) + .5) / OH * 180
latc = np.clip(lat, -85.05, 85.05)
X = (lon + 180) / 360 * W - .5
Y = (1 - np.log(np.tan(np.radians(latc)) + 1 / np.cos(np.radians(latc))) / math.pi) / 2 * H - .5
XX, YY = np.meshgrid(X, Y)
out = np.stack([ndimage.map_coordinates(m[..., c], [YY, XX], order=1, mode='nearest') for c in range(3)], -1)
# same grade as the maps: warm land, a little less saturation; deep ocean pushed toward navy
a = (out / 255) ** 2.2
l = (a * [.2126, .7152, .0722]).sum(-1, keepdims=True)
water = (a[..., 2:3] > a[..., 0:1] + .01) & (l < .08)
a = l + (a - l) * .85
a = a * np.array([1.05, 1.0, .9])
a = np.where(water, a * .55 + np.array([.004, .014, .03]), a)
polar = np.abs(lat)[:, None, None] > 84
a = np.where(polar, np.array([.55, .58, .62]), a)
Image.fromarray((np.clip(a, 0, 1) ** (1 / 2.2) * 255 + .5).astype(np.uint8)).save(os.path.join(OUT, 'world.jpg'), quality=92)
print('world.jpg', OW, OH)
