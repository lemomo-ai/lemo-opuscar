"""Download what the demo needs and git does not carry (all public domain or OFL; see CREDITS). Skips files already present.
Run: .venv/bin/python -I styles/flow-field/demo/tools/fetch_data.py   (build.sh runs it)
- raw/dem/region_2min.csv, raw/dem/hainan_1min.csv, raw/dem/scs_6min.csv (the 南海诸岛 inset): ETOPO1 relief (NOAA NGDC, public domain) through the ERDDAP mirror
- raw/ne/chn.geojson: Natural Earth 1:10m maritime indicator lines, China point of view (public domain)
- fonts/src/: Noto Serif SC, Newsreader (roman, italic), IBM Plex Mono Medium from github.com/google/fonts (OFL)"""
import os, sys, urllib.request
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ERDDAP = 'https://upwell.pfeg.noaa.gov/erddap/griddap/etopo180.csv?altitude%5B({0}):{4}:({1})%5D%5B({2}):{4}:({3})%5D'
GF = 'https://github.com/google/fonts/raw/main/ofl'
NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_boundary_lines_maritime_indicator_chn.geojson'
FILES = {
    'raw/dem/region_2min.csv': ERDDAP.format(6, 27, 97, 132, 2),          # 6–27°N, 97–132°E, every 2′
    'raw/dem/hainan_1min.csv': ERDDAP.format(17.6, 21.8, 107.5, 111.8, 1),  # 17.6–21.8°N, 107.5–111.8°E, every 1′
    'raw/dem/scs_6min.csv': ERDDAP.format(2, 24, 104, 123, 6),            # 2–24°N, 104–123°E, every 6′: the whole South China Sea for the inset
    'raw/ne/chn.geojson': NE,
    'fonts/src/NotoSerifSC-VF.ttf': GF + '/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
    'fonts/src/Newsreader-VF.ttf': GF + '/newsreader/Newsreader%5Bopsz,wght%5D.ttf',
    'fonts/src/Newsreader-Italic-VF.ttf': GF + '/newsreader/Newsreader-Italic%5Bopsz,wght%5D.ttf',
    'fonts/src/IBMPlexMono-Medium.ttf': GF + '/ibmplexmono/IBMPlexMono-Medium.ttf',
}
for rel, url in FILES.items():
    p = os.path.join(D, rel)
    if os.path.exists(p) and os.path.getsize(p) > 0: continue
    os.makedirs(os.path.dirname(p), exist_ok=True)
    print('download', rel, file=sys.stderr)
    req = urllib.request.Request(url, headers={'User-Agent': 'lemo-opuscar-demo/1.0'})
    with urllib.request.urlopen(req, timeout=300) as r, open(p + '.part', 'wb') as f: f.write(r.read())
    os.replace(p + '.part', p)
print('data ok')
