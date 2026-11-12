# Keep the fonts the lettering came from, subset to the characters used, with their licences → fonts/.
# The page never loads a font: every letter is already pen strokes in plot.json (tools/textlib.py).
# Sources: Noto Sans SC and Noto Serif SC variable fonts (OFL 1.1, github.com/google/fonts ofl/notosanssc, ofl/notoserifsc),
# Relief SingleLine SVG font (OFL 1.1, github.com/isdat-type/Relief-SingleLine).
# Run from the library root after make_plot.py:  .venv/bin/python -I styles/pen-plotter/demo/tools/fonts.py
import os, re, shutil, json
from fontTools.ttLib import TTFont
from fontTools import subset
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..'); SRC = os.path.join(ROOT, 'data', 'fontsrc'); OUT = os.path.join(ROOT, 'fonts')
os.makedirs(OUT, exist_ok=True)
P = json.load(open(os.path.join(ROOT, 'plot.json')))
text = ''.join(b['text'] for b in P['blocks']) + ''.join(e['text'] for e in P['end'])
for inst, name in [('sans', 'NotoSansSC-Thin-subset.ttf'), ('sansmed', 'NotoSansSC-Light-subset.ttf'), ('serif', 'NotoSerifSC-ExtraBold-subset.ttf')]:
    f = TTFont(os.path.join(SRC, f'_inst_{inst}.ttf'))
    o = subset.Options(); o.layout_features = []; o.name_IDs = ['*']; o.notdef_outline = True
    s = subset.Subsetter(o); s.populate(text=text); s.subset(f); f.save(os.path.join(OUT, name)); print(name, os.path.getsize(os.path.join(OUT, name)))
for f in ['ReliefSingleLine.svg', 'OFL-ReliefSingleLine.txt', 'OFL-NotoSansSC.txt', 'OFL-NotoSerifSC.txt']: shutil.copy(os.path.join(SRC, f), OUT)
