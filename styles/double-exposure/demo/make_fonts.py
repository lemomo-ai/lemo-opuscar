# Subset Noto Serif SC (OFL) to the characters index.html uses, as one static 600 instance: fonts/NotoSerifSC-600-film.ttf.
# Run from the library root: .venv/bin/python styles/double-exposure/demo/make_fonts.py
# The variable font NotoSerifSC[wght].ttf is fetched by build.sh into demo/fonts/src/.
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'fonts', 'src', 'NotoSerifSC-VF.ttf')
text = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()
chars = set(ch for ch in text if ord(ch) > 0x2000) | set('0123456789 ，。、：·×')
f = TTFont(SRC); f = instancer.instantiateVariableFont(f, {'wght': 600})
opts = subset.Options(); opts.layout_features = ['*']; opts.name_IDs = ['*']
sub = subset.Subsetter(opts); sub.populate(text=''.join(sorted(chars))); sub.subset(f)
out = os.path.join(HERE, 'fonts', 'NotoSerifSC-600-film.ttf'); f.save(out); print(out, os.path.getsize(out), len(chars), 'chars')
