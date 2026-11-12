# Download the four NASADEM 1-arc-second tiles that cover Mount Qomolangma (Everest) and its north side.
# NASADEM HGT v001 (NASA JPL, reprocessed from the Shuttle Radar Topography Mission, SRTM). NASA Earthdata data-use guidance:
# NASA mission data are CC0 unless marked otherwise, "there are no restrictions on the use of these data". Served as Cloud-Optimised GeoTIFFs
# by Microsoft Planetary Computer; a short-lived read token is fetched first (no account needed).
# Run from the library root:  .venv/bin/python -I styles/pen-plotter/demo/tools/fetch_dem.py
import json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'data', 'raw')
TILES = ['n27e086', 'n28e086', 'n27e087', 'n28e087']   # 27–29 N, 86–88 E
STAC = 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/nasadem/items/NASADEM_HGT_{}'
SAS = 'https://planetarycomputer.microsoft.com/api/sas/v1/token/nasademeuwest/nasadem-cog'

def get(url):
    with urllib.request.urlopen(url, timeout=120) as r: return r.read()

os.makedirs(RAW, exist_ok=True)
tok = json.loads(get(SAS))['token']
log = []
for t in TILES:
    item = json.loads(get(STAC.format(t)))
    href = item['assets']['elevation']['href']
    out = os.path.join(RAW, f'NASADEM_HGT_{t}.tif')
    if not os.path.exists(out):
        data = get(href + '?' + tok)
        open(out, 'wb').write(data)
    log.append({'tile': t, 'item': item['id'], 'href': href, 'bbox': item['bbox'], 'bytes': os.path.getsize(out)})
    print(t, href, os.path.getsize(out), 'bytes')
json.dump(log, open(os.path.join(RAW, 'download_log.json'), 'w'), indent=1)
