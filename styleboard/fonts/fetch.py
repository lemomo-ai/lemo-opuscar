#!/usr/bin/env python3
"""Fonts too big to keep in the repository: downloaded on first use, checked, kept in a cache.

Each one is pinned to a single commit of google/fonts and to its SHA-256, so every machine draws with the same file.
Their OFL texts sit next to this script.

  python3 styleboard/fonts/fetch.py NotoSerifSC     print the local path, downloading the font the first time
  python3 styleboard/fonts/fetch.py --all           fetch every font listed here
  python3 styleboard/fonts/fetch.py --sha NAME      print the pinned SHA-256 (what a build can key on without the file)

From Python: `sys.path.insert(0, 'styleboard/fonts'); from fetch import path; path('NotoSansSC')`.
Used by styleboard/art/readme.mjs (the README's pictures) and by the site's font subsets (styleboard/home.py and pages.py: Source Serif 4,
Source Sans 3, Noto Serif SC, Noto Sans SC).
Cache: $OPUSCAR_FONT_CACHE, else ~/.cache/lemo-opuscar/fonts. All are SIL Open Font License 1.1.
"""
import hashlib, os, sys, urllib.parse, urllib.request

COMMIT = '86aced91de05cd4f96a06838124cca45be337b2b'   # google/fonts, 2026-11-07
BASE = f'https://raw.githubusercontent.com/google/fonts/{COMMIT}/'
FONTS = {   # name: (path in google/fonts, sha256)
    'NotoSerifSC': ('ofl/notoserifsc/NotoSerifSC[wght].ttf', '050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9'),
    'NotoSansSC': ('ofl/notosanssc/NotoSansSC[wght].ttf', 'a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da'),
    'SourceSerif4': ('ofl/sourceserif4/SourceSerif4[opsz,wght].ttf', '97b2d4da6e3cb494b5a1e66ae176914d852ccabef49e0c02c0df25f3e39aca0b'),   # the site's display face
    'SourceSerif4Italic': ('ofl/sourceserif4/SourceSerif4-Italic[opsz,wght].ttf', '15fbc7e4679489a501998c3669272637a6646388ef7e4bd77eebb5bf967a1f42'),
    'SourceSans3': ('ofl/sourcesans3/SourceSans3[wght].ttf', '042fe2cc0b933e328410d7acbd0aa6a1873dca5aef81875f4bc214b08825c7b9'),   # the site's text and labels
    'SourceSans3Italic': ('ofl/sourcesans3/SourceSans3-Italic[wght].ttf', '39e3ab05ccd7cb94907c31005bb5bec1d5432f0b096a2b782976e217a540eb6c'),
}
CACHE = os.environ.get('OPUSCAR_FONT_CACHE') or os.path.join(os.path.expanduser('~'), '.cache', 'lemo-opuscar', 'fonts')


def _sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()


def path(name):
    """Local path of a pinned font; downloads and checks it the first time."""
    if name not in FONTS: raise KeyError(f'unknown font {name!r}; known: {", ".join(FONTS)}')
    src, want = FONTS[name]
    dst = os.path.join(CACHE, os.path.basename(src))
    if os.path.exists(dst) and _sha(dst) == want: return dst
    os.makedirs(CACHE, exist_ok=True)
    print(f'  font: downloading {name} (once) ...', file=sys.stderr)
    tmp = dst + '.part'
    with urllib.request.urlopen(BASE + urllib.parse.quote(src), timeout=600) as r, open(tmp, 'wb') as f:
        while chunk := r.read(1 << 16): f.write(chunk)
    got = _sha(tmp)
    if got != want:
        os.remove(tmp)
        raise SystemExit(f'✗ {name}: SHA-256 {got} is not the pinned {want}')
    os.replace(tmp, dst)
    return dst


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['--all']: [print(path(n)) for n in FONTS]
    elif a[:1] == ['--sha'] and len(a) == 2: print(FONTS[a[1]][1])
    elif len(a) == 1: print(path(a[0]))
    else: sys.exit(__doc__)
