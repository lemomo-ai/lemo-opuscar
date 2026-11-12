# Subset the three OFL families to the characters the end card uses (fonts are not in git; build.sh fetches the sources).
#   Anton -> HALF A BEAT; Barlow Condensed Medium -> the style line and sign-off; Noto Sans SC (variable) -> 900 and 500 instances.
# Run from the library root: .venv/bin/python styles/silhouette-rhythm/demo/make_fonts.py
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(HERE, 'fonts', 'src'), os.path.join(HERE, 'fonts')
film = open(os.path.join(HERE, 'film.js'), encoding='utf-8').read()
cjk = ''.join(sorted(set(ch for ch in film if 0x3000 <= ord(ch) <= 0x9FFF)))

def make(src, out, text, wght=None):
    f = TTFont(os.path.join(SRC, src))
    if wght is not None and 'fvar' in f: f = instancer.instantiateVariableFont(f, {'wght': wght})
    o = subset.Options(); o.layout_features = ['*']; o.name_IDs = ['*']; o.notdef_outline = True
    s = subset.Subsetter(o); s.populate(text=text); s.subset(f)
    f.save(os.path.join(OUT, out))
    miss = [c for c in set(text) if c != ' ' and ord(c) not in TTFont(os.path.join(OUT, out)).getBestCmap()]
    print(out, os.path.getsize(os.path.join(OUT, out)), 'bytes', 'missing: ' + ''.join(miss) if miss else '')

make('Anton-Regular.ttf', 'Anton-sub.ttf', 'HALF A BEAT')
make('BarlowCondensed-Medium.ttf', 'BarlowCondensed-500-sub.ttf', 'Silhouette Rhythm · LemoLab × Claude Opus 5.5 0123456789')
make('NotoSansSC-VF.ttf', 'NotoSansSC-900-title.ttf', cjk, 900)
make('NotoSansSC-VF.ttf', 'NotoSansSC-500-title.ttf', cjk, 500)
