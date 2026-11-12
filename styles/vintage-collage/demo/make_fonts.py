"""Fonts for the demo (all SIL OFL 1.1, gitignored, fetched once):
IM FELL English Roman / Italic / SC and Courier Prime from github.com/google/fonts; Noto Serif SC Bold and Black as subsets of exactly the
Chinese characters the film prints (subtitles in src/cues.json + the Chinese strings in src/bake2.py), via the Google Fonts CSS API.
Run from the library root after src/timeline.py:  .venv/bin/python styles/vintage-collage/demo/make_fonts.py
Re-run it (delete fonts/NotoSerifSC-*.woff2 first) after any change to a Chinese string or subtitle.
"""
import json, os, re, string, urllib.parse, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(HERE, 'fonts'); os.makedirs(F, exist_ok=True)
GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
FILES = {'IMFeENrm28P.ttf': 'imfellenglish', 'IMFeENit28P.ttf': 'imfellenglish', 'IMFeENsc28P.ttf': 'imfellenglishsc',
         'CourierPrime-Regular.ttf': 'courierprime', 'CourierPrime-Bold.ttf': 'courierprime'}
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
for name, fam in FILES.items():
    p = os.path.join(F, name)
    if not os.path.exists(p): open(p, 'wb').write(get(GF + fam + '/' + name)); print('font', name)
for lic, fam in (('OFL-imfell.txt', 'imfellenglish'), ('OFL-courierprime.txt', 'courierprime'), ('OFL-notoserifsc.txt', 'notoserifsc')):
    p = os.path.join(F, lic)
    if not os.path.exists(p): open(p, 'wb').write(get(GF + fam + '/OFL.txt'))
# the Chinese characters the film prints
text = ''.join(c['zh'] for c in json.load(open(os.path.join(HERE, 'src', 'cues.json'))))
text += ''.join(re.findall(r"'([^']*[一-鿿][^']*)'", open(os.path.join(HERE, 'src', 'bake2.py'), encoding='utf-8').read()))
chars = ''.join(sorted(set(c for c in text if ord(c) > 0x2000) | set(string.digits + ',.$:·- ')))
for w in (700, 900):
    p = os.path.join(F, f'NotoSerifSC-{w}-subset.woff2')
    if os.path.exists(p): continue
    css = get(f'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@{w}&text=' + urllib.parse.quote(chars)).decode()
    open(p, 'wb').write(get(re.search(r'url\((https://[^)]+)\)', css).group(1))); print('font', os.path.basename(p), len(chars), 'chars')
