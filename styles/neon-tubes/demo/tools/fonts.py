"""Subset Noto Sans SC (OFL) to the hanzi the end card prints. The variable font is downloaded by build.sh into fonts/src/.
.venv/bin/python styles/neon-tubes/demo/tools/fonts.py"""
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
CHARS = '夜宵霓虹灯管'
out = os.path.join(HERE, '..', 'fonts', 'NotoSansSC-sub.ttf')
subprocess.run([sys.executable, '-m', 'fontTools.subset', os.path.join(HERE, '..', 'fonts', 'src', 'NotoSansSC-VF.ttf'), '--text=' + CHARS + ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+×.',
                '--output-file=' + out, '--layout-features=*'], check=True)
print(out, os.path.getsize(out))
