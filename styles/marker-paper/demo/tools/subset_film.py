# The film's own CJK subset of LXGW Marker Gothic (OFL 1.1): every Chinese line on the sheets of the whole film
# (tools/zh_chars.txt) + ASCII.
# run from the library root: .venv/bin/python styles/marker-paper/demo/tools/subset_film.py
import os
from fontTools.ttLib import TTFont
from fontTools import subset
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chars = ''.join(chr(i) for i in range(32, 127)) + open(os.path.join(HERE, 'tools', 'zh_chars.txt'), encoding='utf-8').read().strip()
ft = TTFont(os.path.join(HERE, 'fonts/src/LXGWMarkerGothic-Regular.ttf'))
o = subset.Options(); o.layout_features = ['*']
s = subset.Subsetter(o); s.populate(text=chars); s.subset(ft)
ft.save(os.path.join(HERE, 'fonts/LXGWMarkerGothic-film.ttf'))
print('missing:', [c for c in chars if ord(c) not in ft.getBestCmap()])
