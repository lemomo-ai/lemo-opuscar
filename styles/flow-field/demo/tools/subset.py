"""Subset the OFL fonts in fonts/src (tools/fetch_data.py downloads them) to what the film prints -> fonts/. Run: .venv/bin/python -I styles/flow-field/demo/tools/subset.py
Chinese: every Han/CJK character found in the page's JS plus the characters the storm tag can print; Latin fonts: Basic Latin + the few symbols used."""
import os, re, glob, shutil
from fontTools import subset
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
src = ''.join(open(f, encoding='utf-8').read() for f in glob.glob(os.path.join(D, '*.js')))
cjk = set(re.findall(r'[　-〿㐀-鿿＀-￯]', src)) | set('0123456789月日时分')
basic = ''.join(chr(c) for c in range(32, 127)) + '·×–—≥’“”…°'
def sub(name, out, text):
    opt = subset.Options(); opt.layout_features = ['*']; opt.name_IDs = ['*']; opt.notdef_outline = True
    f = subset.load_font(os.path.join(D, 'fonts/src', name), opt)
    s = subset.Subsetter(opt); s.populate(text=text); s.subset(f); subset.save_font(f, os.path.join(D, 'fonts', out), opt)
    print(out, os.path.getsize(os.path.join(D, 'fonts', out)) // 1024, 'KB')
os.makedirs(os.path.join(D, 'fonts'), exist_ok=True)
sub('NotoSerifSC-VF.ttf', 'zh.ttf', ''.join(sorted(cjk)) + basic)
sub('Newsreader-VF.ttf', 'news.ttf', basic)
sub('Newsreader-Italic-VF.ttf', 'news-it.ttf', basic)
sub('IBMPlexMono-Medium.ttf', 'mono.ttf', basic + '月日时')
print(len(cjk), 'CJK characters')
