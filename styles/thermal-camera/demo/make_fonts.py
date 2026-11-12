# Subset Noto Sans SC (OFL) to the characters the film uses, as two static instances (500, 700).
# Run from the library root: .venv/bin/python styles/thermal-camera/demo/make_fonts.py
import os, glob
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'fonts', 'src', 'NotoSansSC-VF.ttf')   # NotoSansSC[wght].ttf from github.com/google/fonts (OFL), downloaded by build.sh
text = ''.join(open(f, encoding='utf-8').read() for f in glob.glob(os.path.join(HERE, 'src', '*.js')))
chars = set(ch for ch in text if ord(ch) > 0x2000) | set('0123456789 ×·：，、（）—–−≈≤≥°%.+-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
for wght in (500, 700):
    f = TTFont(SRC); f = instancer.instantiateVariableFont(f, {'wght': wght})
    opts = subset.Options(); opts.layout_features = ['*']; opts.name_IDs = ['*']
    sub = subset.Subsetter(opts); sub.populate(text=''.join(sorted(chars))); sub.subset(f)
    out = os.path.join(HERE, 'fonts', f'NotoSansSC-{wght}.ttf'); f.save(out); print(out, os.path.getsize(out), len(chars), 'chars')
