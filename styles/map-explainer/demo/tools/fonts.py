"""Fonts for the 3D Map Explainer demo (gitignored, re-fetched here). All SIL Open Font License 1.1.
- Barlow Condensed Regular / Medium / SemiBold from github.com/google/fonts (ofl/barlowcondensed)
- Noto Sans SC 500 / 700, subset to exactly the Chinese the film draws (voice/subs.json + the title and the end card),
  through the Google Fonts CSS API (&text=); run again whenever voice/subs.json changes.
usage (library root): .venv/bin/python -I styles/map-explainer/demo/tools/fonts.py styles/map-explainer/demo
"""
import json, os, re, sys, urllib.parse, urllib.request
D = sys.argv[1]; F = os.path.join(D, 'fonts'); os.makedirs(F, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
for w in ('Regular', 'Medium', 'SemiBold'):
    p = os.path.join(F, f'BarlowCondensed-{w}.ttf')
    if not os.path.exists(p):
        open(p, 'wb').write(get(f'https://github.com/google/fonts/raw/main/ofl/barlowcondensed/BarlowCondensed-{w}.ttf'))
subs = json.load(open(os.path.join(D, 'voice', 'subs.json')))
chars = set(''.join(s['zh'] for s in subs)) | set('霍尔木兹海峡立体地图解说，。·0123456789') | set('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
txt = urllib.parse.quote(''.join(sorted(chars)))
for w in (500, 700):
    css = get(f'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@{w}&text={txt}').decode()
    open(os.path.join(F, f'NotoSansSC-{w}-sub.woff2'), 'wb').write(get(re.search(r'url\((https://[^)]+)\)', css).group(1)))
print('fonts ok:', len(chars), 'subset characters')
