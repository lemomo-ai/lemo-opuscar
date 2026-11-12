"""Fonts for the Blob Simulation demo (all SIL OFL 1.1; licence texts in fonts/).

- Fredoka: the library's own subsets core/fonts/f3.woff2 (Latin) and f2.woff2 (Latin Extended), copied.
- Inter (variable): downloaded by build.sh into fonts/Inter-VF.ttf.
- Noto Sans SC: the variable font fonts/src/NotoSansSC-VF.ttf (downloaded by build.sh), subset to every Chinese
  character in film.js plus digits and punctuation → fonts/NotoSansSC-sub.woff2.
Usage (from the library root): .venv/bin/python styles/pip-simulation/demo/make_fonts.py
"""
import os, re, shutil, sys
from fontTools import subset
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..'))
F = os.path.join(HERE, 'fonts')
for src, dst in [('f3.woff2', 'fredoka-latin.woff2'), ('f2.woff2', 'fredoka-latin-ext.woff2')]:
    if not os.path.exists(os.path.join(F, dst)): shutil.copy(os.path.join(LIB, 'core', 'fonts', src), os.path.join(F, dst))
text = open(os.path.join(HERE, 'film.js'), encoding='utf-8').read()
chars = ''.join(sorted(set(c for c in text if ord(c) > 0x2e80))) + '0123456789.·×→ '
out = os.path.join(F, 'NotoSansSC-sub.woff2')
opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']
font = subset.load_font(os.path.join(F, 'src', 'NotoSansSC-VF.ttf'), opts)
s = subset.Subsetter(opts); s.populate(text=chars); s.subset(font)
subset.save_font(font, out, opts)
print(out, len(chars), 'characters')
