# Subset the fonts to the characters the film uses (scans every .js in the film folder).
# Run from the library root: .venv/bin/python styles/one-bit-dither/demo/tools/subset.py
# Source fonts in demo/fonts/src/ (downloaded by build.sh; see CREDITS).
import os, glob, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE)
chars = set()
for f in glob.glob(os.path.join(FILM, '*.js')):
    if 'three.module' in f: continue
    chars |= set(open(f, encoding='utf-8').read())
ascii_ = set(chr(i) for i in range(32, 127)) | set('×·—–’‘“”°')
cjk = ''.join(sorted(c for c in chars if ord(c) > 0x2E80)) + '，。？！：、（）《》·'
latin = ''.join(sorted(ascii_ | set(c for c in chars if 0xA0 <= ord(c) < 0x2E80)))
SRC = os.path.join(FILM, 'fonts', 'src')
jobs = [('NotoSerifSC-VF.ttf', 'serifsc', cjk + latin), ('NotoSansSC-VF.ttf', 'sanssc', cjk + latin), ('LXGWWenKai-Regular.ttf', 'handsc', cjk + latin),
        ('ArchitectsDaughter-Regular.ttf', 'handen', latin), ('SpecialElite-Regular.ttf', 'typeen', latin), ('Newsreader-VF.ttf', 'newsen', latin), ('Anton-Regular.ttf', 'antonen', latin)]
py = sys.executable
for src, out, txt in jobs:
    tf = os.path.join(HERE, '_chars.txt'); open(tf, 'w', encoding='utf-8').write(txt)
    subprocess.run([py, '-m', 'fontTools.subset', os.path.join(SRC, src), '--text-file=' + tf, '--flavor=woff2', '--layout-features=*', '--output-file=' + os.path.join(FILM, 'fonts', out + '.woff2')], check=True)
    os.remove(tf)
print('cjk chars', len(cjk))
