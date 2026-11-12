# Fetch the demo's photographs and silhouettes into demo/assets/ (only the files that are missing).
# Records: sources/photos.jsonl (Wikimedia Commons, CC0) and sources/silhouettes.jsonl (PhyloPic, CC0 / Public Domain Mark).
# Photographs are scaled to 2560 px wide (Pillow), the size the film samples.
# Run from anywhere: python3 styles/double-exposure/demo/fetch_assets.py
import json, os, sys, time, urllib.parse, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, 'assets'); os.makedirs(A, exist_ok=True)
UA = {'User-Agent': 'lemo-opuscar double-exposure demo (https://github.com/lemomo-ai/lemo-opuscar)'}

def get(url, out):
    for k in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r: data = r.read()
            open(out, 'wb').write(data); print('fetched', os.path.relpath(out, HERE), len(data)); return
        except Exception as e:
            print('retry', url, e, file=sys.stderr); time.sleep(3 * (k + 1))
    sys.exit('could not fetch ' + url)

def rows(name): return [json.loads(l) for l in open(os.path.join(HERE, 'sources', name), encoding='utf-8') if l.strip()]

for r in rows('photos.jsonl'):
    out = os.path.join(A, r['name'] + '.jpg')
    if os.path.exists(out): continue
    title = r['page'].rsplit('File:', 1)[1]
    get('https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(urllib.parse.unquote(title)), out)
    from PIL import Image
    im = Image.open(out).convert('RGB')
    if im.width > 2560: im = im.resize((2560, round(im.height * 2560 / im.width)), Image.LANCZOS)
    im.save(out, quality=92)
for r in rows('silhouettes.jsonl'):
    out = os.path.join(A, r['name'] + '.svg')
    if not os.path.exists(out): get(r['url'], out)
