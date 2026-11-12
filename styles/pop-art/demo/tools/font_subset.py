"""Fetch a Noto Sans SC Black (OFL) subset holding every CJK character used in main.js and timeline.py -> fonts/NotoSansSC-Black-subset.ttf"""
import os, re, urllib.request, urllib.parse
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
txt = ''.join(open(os.path.join(HERE, f), encoding='utf-8').read() for f in ('main.js', 'timeline.py'))
chars = sorted(set(re.findall(r'[　-〿一-鿿＀-￯·「」×]', txt)) | set('0123456789'))
q = urllib.parse.quote(''.join(chars))
css = urllib.request.urlopen(urllib.request.Request(f'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@900&text={q}',
      headers={'User-Agent': 'curl/8'})).read().decode()
url = re.search(r'url\((https://[^)]+)\)', css).group(1)
open(os.path.join(HERE, 'fonts', 'NotoSansSC-Black-subset.ttf'), 'wb').write(urllib.request.urlopen(url).read())
print(len(chars), 'chars ->', url[:60])
