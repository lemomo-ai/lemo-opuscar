"""Subset the film's fonts to the characters it uses: python tools/fonts.py
Scans the project's .js / .json text for CJK characters (plus ASCII) and fetches subsets from the Google Fonts CSS API
(TECHNIQUE.md §11) into fonts/. All three families are OFL (licence texts: fonts/OFL-*.txt)."""
import re, os, sys, glob, urllib.request, urllib.parse
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAMS = {'MaShanZheng': 'Ma Shan Zheng', 'NotoSerifSC': 'Noto Serif SC:wght@700;900', 'NotoSansSC': 'Noto Sans SC:wght@500;700;900'}
chars = set(chr(c) for c in range(32, 127)) | set('，。、：；！？“”‘’（）《》【】…—·×÷±≤≥≈∞°′″①②③④⑤ⅠⅡⅢⅣ＋－＝％')
for f in glob.glob(os.path.join(HERE, '*.js')) + glob.glob(os.path.join(HERE, 'engine', '*.js')) + glob.glob(os.path.join(HERE, '*.json')):
    chars |= set(re.findall(r'[　-鿿＀-￯]', open(f, encoding='utf-8').read()))
text = ''.join(sorted(chars)); print(len(text), 'characters')
UA = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Safari/534.30'   # an old UA makes the CSS API serve ttf
# Google splits a subset into unicode-range blocks: one file per block, one @font-face per block in fonts/fonts.css
for old in glob.glob(os.path.join(HERE, 'fonts', '*-*.woff*')) + glob.glob(os.path.join(HERE, 'fonts', '*-*.ttf')): os.remove(old)   # old subsets, not the OFL texts
faces = []
for name, fam in FAMS.items():
    css = urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?' + urllib.parse.urlencode({'family': fam, 'text': text}), headers={'User-Agent': UA}), timeout=60).read().decode()
    for k, block in enumerate(re.findall(r'@font-face\s*{([^}]*)}', css)):
        w = re.search(r'font-weight:\s*(\d+)', block).group(1); url = re.search(r'url\(([^)]+)\)', block).group(1)
        rng = re.search(r'unicode-range:\s*([^;]+);', block); ext = 'woff2' if 'woff2' in block else 'woff' if "'woff'" in block or 'format(\'woff\')' in block else 'ttf'
        if rng and not any(any(int(a, 16) <= ord(c) <= int(b or a, 16) for c in text) for a, _, b in (r.strip()[2:].partition('-') for r in rng.group(1).split(','))): continue   # no character the film uses falls in this block
        fn = f'{name}-{w}-{k}.{ext}'; out = os.path.join(HERE, 'fonts', fn); open(out, 'wb').write(urllib.request.urlopen(url, timeout=60).read())
        faces.append(f"@font-face{{font-family:'{name}';font-weight:{w};src:url({fn})" + (f';unicode-range:{rng.group(1).strip()}' if rng else '') + '}')
        print(out, os.path.getsize(out))
open(os.path.join(HERE, 'fonts', 'fonts.css'), 'w').write('\n'.join(faces) + '\n'); print(len(faces), 'faces → fonts/fonts.css')
