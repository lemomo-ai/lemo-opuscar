"""Subset the film's fonts to the characters it uses (Google Fonts CSS2 API, &text=), all OFL.
usage: python -I tools/fonts.py <demo_dir>  -> fonts/*.woff2 + fonts/fonts.css + fonts/OFL-*.txt"""
import sys, os, re, ssl, urllib.request, urllib.parse
D = sys.argv[1]
src = open(os.path.join(D, 'main.js'), encoding='utf-8').read()
cjk = sorted(set(re.findall(r'[　-〿一-鿿＀-￯·]', src)))
latin = ''.join(chr(c) for c in range(32, 127)) + '·×—'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
try:
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    CTX = ssl.create_default_context()
get = lambda url: urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60, context=CTX).read()
os.makedirs(os.path.join(D, 'fonts'), exist_ok=True)
css = []
for fam, w, alias, out, text in (('Anton', 400, 'Anton', 'Anton-400.woff2', latin),
                                 ('Barlow Semi Condensed', 600, 'BSC', 'BarlowSC-600.woff2', latin),
                                 ('Noto Sans SC', 900, 'SC', 'NotoSansSC-900.woff2', ''.join(cjk) + latin)):
    c = get('https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(fam) + f':wght@{w}&text=' + urllib.parse.quote(text)).decode()
    urls = re.findall(r'url\((https://[^)]+)\)', c)
    assert len(urls) == 1, c[:400]
    data = get(urls[0]); open(os.path.join(D, 'fonts', out), 'wb').write(data)
    css.append(f"@font-face{{font-family:'{alias}';src:url({out}) format('woff2');font-weight:{w};font-display:block}}")
    print(out, len(data), 'bytes')
open(os.path.join(D, 'fonts', 'fonts.css'), 'w').write('\n'.join(css) + '\n')
for fam, out in (('anton', 'OFL-anton.txt'), ('barlowsemicondensed', 'OFL-barlowsemicondensed.txt'), ('notosanssc', 'OFL-notosanssc.txt')):
    open(os.path.join(D, 'fonts', out), 'wb').write(get(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{fam}/OFL.txt'))
