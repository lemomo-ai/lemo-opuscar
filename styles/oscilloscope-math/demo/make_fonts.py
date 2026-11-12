"""Static font instances for Manim/Pango from the Google Fonts variable fonts in fonts/src/ (all OFL), run by build.sh:
JetBrains Mono 400/500, STIX Two Text 400 roman/italic, and Noto Serif SC 500 cut to the characters the film uses
(renamed 'OM Serif SC' so Pango never mixes it up with an installed Noto)."""
import os, re, json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
HERE = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(HERE, 'fonts'); SRC = os.path.join(F, 'src')

def instance(src, wght, out, family=None):
    f = instantiateVariableFont(TTFont(os.path.join(SRC, src)), {'wght': wght}, updateFontNames=False)
    f['OS/2'].usWeightClass = wght
    if family:
        for rec in list(f['name'].names):
            if rec.nameID in (1, 16, 4): f['name'].setName(family, rec.nameID, rec.platformID, rec.platEncID, rec.langID)
            if rec.nameID in (2, 17): f['name'].setName('Regular', rec.nameID, rec.platformID, rec.platEncID, rec.langID)
            if rec.nameID == 6: f['name'].setName(family.replace(' ', '') + '-Regular', rec.nameID, rec.platformID, rec.platEncID, rec.langID)
    elif wght == 500:
        for rec in list(f['name'].names):
            if rec.nameID in (2, 17): f['name'].setName('Medium', rec.nameID, rec.platformID, rec.platEncID, rec.langID)
    f.save(os.path.join(F, out)); return os.path.join(F, out)

instance('JetBrainsMono-VF.ttf', 400, 'JetBrainsMono-Regular.ttf')
instance('JetBrainsMono-VF.ttf', 500, 'JetBrainsMono-Medium.ttf')
instance('STIXTwoText-VF.ttf', 400, 'STIXTwoText-Regular.ttf')
instance('STIXTwoText-Italic-VF.ttf', 400, 'STIXTwoText-Italic.ttf')
# every Chinese character in the subtitles and in the film's own strings
chars = ''.join(q['zh'] for q in json.load(open(os.path.join(HERE, 'voice', 'subs.json'))))
chars += ''.join(re.findall(r'[　-鿿＀-￯]', open(os.path.join(HERE, 'film.py'), encoding='utf-8').read()))
tmp = instance('NotoSerifSC-VF.ttf', 500, '_serif.ttf', family='OM Serif SC')
o = subset.Options(); o.layout_features = ['*']
f = TTFont(tmp); s = subset.Subsetter(o); s.populate(text=''.join(sorted(set(chars))) + ''.join(chr(c) for c in range(0x20, 0x7f)) + '·…×'); s.subset(f)
f.save(os.path.join(F, 'NotoSerifSC-Medium-sub.ttf')); os.remove(tmp)
print('fonts ok')
