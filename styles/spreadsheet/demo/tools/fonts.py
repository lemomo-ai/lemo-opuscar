"""Subset the two OFL fonts to the characters this film uses (page + subtitles).
Run from the library root:  .venv/bin/python styles/spreadsheet/demo/tools/fonts.py   (needs fonttools: pyftsubset)"""
import os, subprocess, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read() + open(os.path.join(HERE, 'timeline.py'), encoding='utf-8').read()
cjk = sorted({c for c in src if ord(c) > 0x2E80})
latin = ''.join(chr(c) for c in range(0x20, 0x7F)) + '×·≥≤<>…—–’‘“”Σ→←↑↓▲▼%°‰•'
py = os.path.join(os.path.dirname(sys.executable), 'pyftsubset')
def sub(font, chars, out):
    subprocess.run([py, os.path.join(HERE, 'fonts/src', font), '--text=' + chars, '--flavor=woff2', '--layout-features=*',
                    '--output-file=' + os.path.join(HERE, 'fonts', out)], check=True)
sub('NotoSansSC-VF.ttf', ''.join(cjk) + '：，。？！、（）' + latin, 'NotoSansSC-sub.woff2')
sub('Inter-VF.ttf', latin, 'Inter-sub.woff2')
print('CJK glyphs:', len(cjk))
