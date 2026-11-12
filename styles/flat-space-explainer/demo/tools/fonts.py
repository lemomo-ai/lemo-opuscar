"""Fetch the demo's fonts (not in git; both OFL): python tools/fonts.py <demo dir>
- Jost (variable, wght 100-900) from github.com/google/fonts (ofl/jost) -> fonts/Jost.ttf
- Noto Sans SC Bold, subset to every CJK character the pages use, from the Google Fonts CSS2 API (&text=) -> fonts/NotoSansSC-Bold-sub.woff2
Run again after adding Chinese text (delete fonts/NotoSansSC-Bold-sub.woff2 first).
"""
import os, re, sys, urllib.parse, urllib.request
D = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(__file__)))
F = os.path.join(D, 'fonts'); os.makedirs(F, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'}
def get(url): return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
jost = os.path.join(F, 'Jost.ttf')
if not os.path.exists(jost):
    open(jost, 'wb').write(get('https://github.com/google/fonts/raw/main/ofl/jost/Jost%5Bwght%5D.ttf')); print('Jost.ttf')
sc = os.path.join(F, 'NotoSansSC-Bold-sub.woff2')
if not os.path.exists(sc):
    txt = ''.join(open(os.path.join(D, n), encoding='utf-8').read() for n in ('index.html', 'sheet.js', 'film.js', 'scenes.js'))
    chars = ''.join(sorted(set(c for c in txt if ord(c) > 0x2E80)))
    css = get('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=' + urllib.parse.quote(chars)).decode()
    url = re.search(r'url\((https://[^)]+)\)', css).group(1)
    open(sc, 'wb').write(get(url)); print('NotoSansSC-Bold-sub.woff2', len(chars), 'characters')
