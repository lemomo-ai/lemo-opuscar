"""LXGW WenKai subset for the demo: Latin + every Chinese character the page uses (labels, title, subtitles, end card).
Source: fonts/src/LXGWWenKai-Regular.ttf (OFL; build.sh downloads it when missing). Output: fonts/LXGWWenKai-subset.ttf.
Run after any change to the text in main.js:  .venv/bin/python styles/colored-pencil/demo/tools/make_font.py"""
import os, re, subprocess, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
text = open(os.path.join(HERE, 'main.js'), encoding='utf-8').read()
cjk = ''.join(sorted(set(re.findall(r'[　-〿一-鿿＀-￯]', text))))
subprocess.run([sys.executable, '-m', 'fontTools.subset', os.path.join(HERE, 'fonts/src/LXGWWenKai-Regular.ttf'), '--text=' + cjk,
                '--unicodes=U+0020-007E,U+00B7,U+00D7,U+2013,U+2014,U+2019', '--output-file=' + os.path.join(HERE, 'fonts/LXGWWenKai-subset.ttf')], check=True)
print('subset', len(cjk), 'CJK characters')
