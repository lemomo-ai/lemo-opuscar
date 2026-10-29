"""Subset the film's two handwriting faces to the characters it prints (Google Fonts CSS2 API, &text=), both OFL.
usage: python -I tools/fonts.py <demo_dir>  -> fonts/*.woff2 + fonts/fonts.css + fonts/OFL-*.txt"""
import sys, os, re, ssl, urllib.request, urllib.parse
D = sys.argv[1]
film = open(os.path.join(D, 'film.js'), encoding='utf-8').read()
zh, en = re.search(r"const LINE = '([^']*)', LINE_EN = '([^']*)'", film).groups()   # the only words on screen
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
try:
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    CTX = ssl.create_default_context()
get = lambda url: urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60, context=CTX).read()
os.makedirs(os.path.join(D, 'fonts'), exist_ok=True)
css = []
for fam, alias, text, out in (('Long Cang', 'LongCang', zh, 'LongCang.woff2'), ('Patrick Hand', 'Patrick Hand', en, 'PatrickHand.woff2')):
    c = get('https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(fam) + '&text=' + urllib.parse.quote(text)).decode()
    urls = re.findall(r'url\((https://[^)]+)\)', c)
    assert len(urls) == 1, c[:400]
    data = get(urls[0]); open(os.path.join(D, 'fonts', out), 'wb').write(data)
    css.append(f"@font-face{{font-family:'{alias}';src:url({out}) format('woff2');font-weight:400}}")
    print(out, len(data), 'bytes')
open(os.path.join(D, 'fonts', 'fonts.css'), 'w').write('\n'.join(css) + '\n')
# licence texts from github.com/google/fonts (ofl/<family>/OFL.txt)
for fam, out in (('longcang', 'OFL-longcang.txt'), ('patrickhand', 'OFL-patrickhand.txt')):
    open(os.path.join(D, 'fonts', out), 'wb').write(get(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{fam}/OFL.txt'))
