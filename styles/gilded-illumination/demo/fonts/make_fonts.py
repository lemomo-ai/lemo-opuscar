"""Subset Noto Serif SC (OFL 1.1) to the Chinese text on screen (subtitles and the end plaque). Run from the library root:
   .venv/bin/python styles/gilded-illumination/demo/fonts/make_fonts.py
Source: fonts/src/NotoSerifSC-VF.ttf, the Noto Serif SC variable font from github.com/google/fonts (ofl/notoserifsc), downloaded by build.sh.
Grenze Gotisch, Uncial Antiqua and IM Fell English (all OFL 1.1, github.com/google/fonts) are used whole.
Run it again after changing any Chinese text in film.js (SUBS or the plaque): add the new characters to `chars`."""
import os, sys, subprocess
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
HERE = os.path.dirname(os.path.abspath(__file__))
chars = ('在这个画出来的世界里会发光都是金子可自己不有一天夜连太阳也熄了于女孩提起最后盏灯开始往山上走她到哪就想怎么又睡着顶只片冰冷箔举留它把得还回去借彩绘'
         '·：，、。0123456789=–- .,')
src = os.path.join(HERE, 'src', 'NotoSerifSC-VF.ttf'); tmp = os.path.join(HERE, '_tmp.ttf')
for name, w in [('zh-serif-700', 700), ('zh-serif-500', 500)]:
    f = instancer.instantiateVariableFont(TTFont(src), {'wght': w}); f.save(tmp)
    subprocess.run([sys.executable, '-m', 'fontTools.subset', tmp, '--text=' + chars, '--output-file=' + os.path.join(HERE, name + '.ttf'), '--no-hinting'], check=True)
    print(name, os.path.getsize(os.path.join(HERE, name + '.ttf')))
os.remove(tmp)
