"""Fonts for index.html (all SIL OFL 1.1, licence texts in fonts/). Run from anywhere:  .venv/bin/python styles/scratch-film/demo/make_fonts.py
Downloads the three families from github.com/google/fonts into fonts/src/ (gitignored), then subsets them to the
characters the page uses (every CJK character in js/*.js and timeline.json, printable ASCII, · × → ≈ −) as woff2."""
import os, re, glob, subprocess, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); FD = os.path.join(HERE, 'fonts'); SRC = os.path.join(FD, 'src')
GF = 'https://github.com/google/fonts/raw/main/ofl/'
FONTS = {'marker': 'lxgwmarkergothic/LXGWMarkerGothic-Regular.ttf',      # LXGW Marker Gothic 霞鹜漫黑: subtitles, Chinese title
         'mono': 'ibmplexmono/IBMPlexMono-SemiBold.ttf',                 # IBM Plex Mono SemiBold: depth numbers, ruler
         'jost': 'jost/Jost%5Bwght%5D.ttf'}                              # Jost (variable): English subtitles, the hatched title
os.makedirs(SRC, exist_ok=True)
txt = ''.join(open(f, encoding='utf-8').read() for f in glob.glob(os.path.join(HERE, 'js', '*.js')) + [os.path.join(HERE, 'timeline.json')])
cjk = set(re.findall(r'[　-〿一-鿿＀-￯]', txt))
chars = ''.join(sorted(cjk | set(chr(c) for c in range(32, 127)) | set('·×→≈−')))
sub = os.path.join(os.path.dirname(sys.executable), 'pyftsubset')
for name, rel in FONTS.items():
    src = os.path.join(SRC, name + '.ttf')
    if not os.path.exists(src): urllib.request.urlretrieve(GF + rel, src)
    subprocess.run([sub, src, '--text=' + chars, '--output-file=' + os.path.join(FD, name + '.woff2'), '--flavor=woff2',
                    '--layout-features=*', '--no-hinting'], check=True)
    print(name, os.path.getsize(os.path.join(FD, name + '.woff2')))
print(len(chars), 'chars')
