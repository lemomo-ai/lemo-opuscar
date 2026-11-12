# Checks a built site (python3 styleboard/build.py --site _site …) before it is published. CI runs it in .github/workflows/pages.yml;
# it runs the same way locally:  python3 styleboard/check_site.py _site
# 1. Every page has its twin in the other language (/x/ ↔ /zh/x/), the right <html lang> and hreflang links to both (404.html carries
#    both languages in one page and is left out).
# 2. Every local href/src resolves to a file in the site, and every #anchor to another page exists there (the home page's old anchors
#    count when its legacy table, from styleboard/anchors.json, maps them). 404.html's links resolve against its <base>. No link asks
#    for the bench by use (?use=), which the site no longer has.
# 3. Every page that can be shared has a share image, and it is a file in the site.
# 4. Films: every film a page plays has its media (meta.json, the ruler's sprite and the posters) and is where the page loads it from:
#    a film inside the site (films/<id>.mp4) is a file in it; a style film from the films repository (an absolute site_config.FILMS_BASE)
#    is in that repository's list, styleboard/films_repo.json, made for that same address (no network needed; pages.yml asks the
#    repository itself in a later step), and where this machine has the 720p cut (site_config.WEB), the list has it at the same
#    size (else the repository is behind: sh tools/films_repo.sh). Every style the catalog says has a film has its page and plays it. The media bundle is unpacked: the long take's manifest and segments, the
#    stations' stills, the cards' thumbnails and clips, OPUSCAR 98's frames.
# 5. The text colours in assets/app.css meet WCAG AA (4.5:1) on the page's grounds.
# 6. No published text file names a path on the machine that built it.
# 7. Every style page runs on into the bench: it names its station and slug and the language's bench file (data-from, data-slug,
#    data-bench), it has the film and sheet a swap takes (main > .plate#film, main > .sheet); the bench file parses, holds the 15
#    stations, the finale, the ruler, the screening room and the track, and its search index lists every style; every link and
#    picture in it resolves from a style page of that language, and every card opens a style page.
import html.parser, json, os, re, sys
from urllib.parse import urlsplit, unquote

SITE = sys.argv[1] if len(sys.argv) > 1 else '_site'
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True
import site_config as C

bad = []


class Scan(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.refs, self.ids, self.lang, self.alts, self.images, self.base, self.noindex = [], set(), None, {}, [], None, False
        self.html, self.classes = {}, set()
        self.scripts, self._in = {}, None

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag == 'html': self.lang, self.html = a.get('lang'), a
        if tag == 'base': self.base = a.get('href')
        if 'id' in a: self.ids.add(a['id'])
        for c in (a.get('class') or '').split(): self.classes.add(f'{tag}.{c}')
        if tag == 'link' and a.get('rel') == 'alternate' and a.get('hreflang'): self.alts[a['hreflang']] = a['href']
        if tag == 'meta' and (a.get('property') == 'og:image' or a.get('name') == 'twitter:image'): self.images.append(a['content'])
        if tag == 'meta' and a.get('name') == 'robots' and 'noindex' in (a.get('content') or ''): self.noindex = True
        if tag == 'script' and a.get('type') == 'application/json' and a.get('id'): self._in = a['id']; self.scripts[a['id']] = ''
        for k in ('href', 'src', 'poster', 'data-src', 'data-sprite'):
            if a.get(k) and not (tag == 'link' and a.get('rel') in ('canonical', 'alternate', 'preconnect')): self.refs.append((k, a[k]))
        for k in ('srcset', 'imagesrcset'):
            for part in (a.get(k) or '').split(','):
                if part.strip(): self.refs.append((k, part.strip().split()[0]))

    def handle_data(self, d):
        if self._in: self.scripts[self._in] += d

    def handle_endtag(self, tag):
        if tag == 'script': self._in = None


pages = {}
for d, _, fs in os.walk(SITE):
    for f in fs:
        if f.endswith('.html'):
            p = os.path.relpath(os.path.join(d, f), SITE).replace(os.sep, '/')
            raw = open(os.path.join(d, f), encoding='utf-8').read()
            s = Scan(); s.feed(raw); pages[p] = s
            # a word left unfilled, like "Station {nn}" (outside scripts, styles and data-tpl, the template page.js fills)
            shown = re.sub(r'data-tpl="[^"]*"', '', re.sub(r'<(script|style)\b.*?</\1>', '', raw, flags=re.S))
            for m in sorted(set(re.findall(r'\{[a-z][a-z_0-9]*\}', shown))): bad.append(f'{p}: unfilled placeholder {m}')
if 'index.html' not in pages: sys.exit(f'check_site.py: no index.html in {SITE}')

# 1. language twins
for p, s in pages.items():
    if p == '404.html': continue
    zh = p.startswith('zh/')
    twin = p[3:] if zh else 'zh/' + p
    if twin not in pages: bad.append(f'{p}: no {"English" if zh else "Chinese"} twin ({twin})')
    if s.lang != ('zh-CN' if zh else 'en'): bad.append(f'{p}: <html lang="{s.lang}">')
    if not s.noindex and not {'en', 'zh-CN', 'x-default'} <= set(s.alts): bad.append(f'{p}: hreflang links missing ({", ".join(sorted(s.alts)) or "none"})')


def legacy(page):
    """the old anchors the home page's script maps (idx.w.legacy)"""
    try: return set(json.loads(pages[page].scripts.get('idx', '{}')).get('w', {}).get('legacy', {}))
    except ValueError: return set()


# 2. links (film_refs: films/<id>.mp4 inside the site; repo_refs: the ids of films loaded from an absolute FILMS_BASE)
n_refs, film_refs, repo_refs = 0, set(), set()
ABS_FILMS = C.FILMS_BASE if '//' in C.FILMS_BASE else None


def repo_film(ref):
    """the film id of a reference to the films repository, or None"""
    if ABS_FILMS and ref.startswith(ABS_FILMS) and re.fullmatch(r'[\w-]+\.mp4', ref[len(ABS_FILMS):]): return ref[len(ABS_FILMS):-len('.mp4')]
    return None


for p, s in pages.items():
    base = os.path.dirname(p)
    if s.base and s.base.startswith(C.BASE_PATH): base = s.base[len(C.BASE_PATH):].strip('/')
    for k, ref in s.refs:
        u = urlsplit(ref)
        if repo_film(ref): repo_refs.add(repo_film(ref)); continue
        if u.scheme or ref.startswith('//') or ref.startswith('data:') or ref.startswith('mailto:') or ref.startswith('javascript:'): continue
        n_refs += 1
        path, here = unquote(u.path), base
        if path.startswith(C.BASE_PATH): path, here = path[len(C.BASE_PATH):] or './', ''   # the site's own absolute path (404.html's links)
        if not path: target = p
        else:
            target = os.path.normpath(os.path.join(here, path)).replace(os.sep, '/')
            if path.endswith('/') or path in ('.', './'): target = 'index.html' if target == '.' else target + '/index.html'
        if target.startswith('..'): bad.append(f'{p}: {k}="{ref}" leaves the site'); continue
        if 'use=' in u.query: bad.append(f'{p}: {k}="{ref}": the bench by use is gone from the site')
        if re.fullmatch(r'films/[\w-]+\.mp4', target): film_refs.add(target)
        full = os.path.join(SITE, target)
        if target != p and not (os.path.isfile(full) and os.path.getsize(full) > 0):
            bad.append(f'{p}: {k}="{ref}" → {target} is missing'); continue
        frag = unquote(u.fragment)
        if frag and target in pages and frag not in pages[target].ids and k == 'href':
            if not (target in ('index.html', 'zh/index.html') and frag in legacy(target)):
                bad.append(f'{p}: {k}="{ref}": no id="{frag}" on {target}')

# 7. the style pages run on into the bench (checked before the films, whose references it adds)
catalog = json.load(open(os.path.join(HERE, 'catalog.json'), encoding='utf-8'))
expected = [s['slug'] for s in catalog if s.get('dur', 0) > 0 and os.path.exists(os.path.join(HERE, '..', 'styles', s['slug'], 'STYLE.md'))]
benches, n_bench_refs = {}, 0
for lang, pre in (('en', ''), ('zh', 'zh/')):
    styles_here = [p for p in pages if re.fullmatch(pre + r'styles/[\w-]+/index\.html', p)]
    if not styles_here: continue
    src = {pages[p].html.get('data-bench') for p in styles_here}
    if len(src) != 1 or None in src: bad.append(f'{pre}styles/*: the pages name {len(src)} bench files ({", ".join(sorted(map(str, src)))})'); continue
    ref = src.pop(); here = os.path.dirname(styles_here[0])
    f = os.path.normpath(os.path.join(here, urlsplit(ref).path)).replace(os.sep, '/')
    try: b = json.load(open(os.path.join(SITE, f), encoding='utf-8'))
    except (OSError, ValueError) as e: bad.append(f'{f} (the {lang} bench): {e}'); continue
    sc = Scan(); sc.feed(b.get('stops', '') + b.get('after', ''))
    need = {f's{n:02d}' for n in range(1, 16)} | {'opuscar98', 'room'}
    if not need <= sc.ids: bad.append(f'{f}: missing {", ".join(sorted(need - sc.ids))}')
    for c in ('nav.rail', 'div.track', 'canvas', 'div.reel'):
        if c not in sc.classes and not (c == 'canvas' and 'seq' in sc.ids): bad.append(f'{f}: no {c}')
    rows = {r[0]: r[2] for r in b.get('idx', {}).get('rows', [])}
    if set(rows) != set(expected): bad.append(f'{f}: its search lists {len(rows)} styles, the catalog {len(expected)}')
    benches[lang] = (f, rows)
    for k, r in sc.refs:   # as a style page of this language sees them
        u = urlsplit(r)
        if repo_film(r): repo_refs.add(repo_film(r)); continue
        if u.scheme or r.startswith(('//', 'data:', 'mailto:', 'javascript:')): continue
        n_bench_refs += 1
        if not u.path:
            if u.fragment and u.fragment not in sc.ids and not all(u.fragment in pages[p].ids for p in styles_here):
                bad.append(f'{f}: {k}="{r}": no such id in the bench or on the style pages')
            continue
        t = os.path.normpath(os.path.join(here, unquote(u.path))).replace(os.sep, '/')
        if u.path.endswith('/'): t += '/index.html'
        if re.fullmatch(r'films/[\w-]+\.mp4', t): film_refs.add(t)
        full = os.path.join(SITE, t)
        if not (os.path.isfile(full) and os.path.getsize(full) > 0): bad.append(f'{f}: {k}="{r}" → {t} is missing')
    for p in styles_here:
        h, slug = pages[p].html, p.split('/')[-2]
        if h.get('data-slug') != slug: bad.append(f'{p}: data-slug="{h.get("data-slug")}"')
        if str(rows.get(slug)) != h.get('data-from'): bad.append(f'{p}: data-from="{h.get("data-from")}", its station is {rows.get(slug)}')
        if 'film' not in pages[p].ids or 'section.plate' not in pages[p].classes or 'div.sheet' not in pages[p].classes:
            bad.append(f'{p}: no film and sheet for a swap (main > .plate#film, main > .sheet)')

# 3. share images: absolute URLs on the site, so they must be files in it
for p, s in pages.items():
    if s.noindex or p == '404.html': continue
    for img in s.images:
        f = os.path.join(SITE, img[len(C.SITE_URL):]) if img.startswith(C.SITE_URL) else ''
        if not (f and os.path.isfile(f)): bad.append(f'{p}: share image {img} is not in the site')
    if not s.images: bad.append(f'{p}: no og:image')

# 4. films and their media
if not expected: bad.append('styleboard/catalog.json lists no film for any style (build.py run without the films? restore catalog.json)')
for slug in expected:
    for p in (f'styles/{slug}/index.html', f'zh/styles/{slug}/index.html'):
        if p not in pages: bad.append(f'{p} is missing (catalog.json lists {slug})'); continue
        if not any(k == 'src' and r.endswith(f'/{slug}.mp4') for k, r in pages[p].refs): bad.append(f'{p}: no player for {slug}.mp4')
listed = {}
if repo_refs:
    try:
        held = json.load(open(C.FILMS_LIST, encoding='utf-8')); listed = held.get('films', {})
        if held.get('base') != ABS_FILMS: bad.append(f'{os.path.basename(C.FILMS_LIST)} lists the films of {held.get("base")}, the pages load them from {ABS_FILMS}')
    except (OSError, ValueError) as e: bad.append(f'{os.path.relpath(C.FILMS_LIST, C.ROOT)}: {e} (sh tools/films_repo.sh writes it)')
for fid in sorted(repo_refs):
    if fid not in listed: bad.append(f'{ABS_FILMS}{fid}.mp4 is not in the films repository ({os.path.basename(C.FILMS_LIST)}): sh tools/films_repo.sh, then push it'); continue
    web = os.path.join(C.WEB, fid + '.mp4')
    if os.path.isfile(web) and os.path.getsize(web) != listed[fid].get('bytes'):
        bad.append(f'{fid}.mp4: the cut in {C.WEB} is not the one in the films repository ({os.path.basename(C.FILMS_LIST)}): sh tools/films_repo.sh, then push it')
for f in sorted(film_refs):
    full = os.path.join(SITE, f)
    if not (os.path.isfile(full) and os.path.getsize(full) > 0): bad.append(f'{f} is not in the site (missing from the "web" release? run tools/publish.sh)')
for fid in sorted({f[len('films/'):-len('.mp4')] for f in film_refs} | repo_refs):
    d = os.path.join(SITE, 'media', 'films', fid)
    for need in ('meta.json', 'sprite.webp', 'poster-1280.webp', 'poster-1280.avif'):
        if not os.path.isfile(os.path.join(d, need)): bad.append(f'media/films/{fid}/{need} is missing (the {C.MEDIA_RELEASE} bundle, or python3 styleboard/media.py)')
man = os.path.join(SITE, 'media', 'manifest.json')
if not os.path.isfile(man): bad.append(f'media/manifest.json is missing: the {C.MEDIA_RELEASE} bundle is not unpacked (tools/site_media.sh)')
else:
    m = json.load(open(man))
    for c in m.get('video', {}).get('codecs', []):
        for i in range(len(m.get('segs', []))):
            if not os.path.isfile(os.path.join(SITE, 'media', c['dir'], f'seg{i:02d}.mp4')): bad.append(f'media/{c["dir"]}/seg{i:02d}.mp4 (the long take) is missing'); break
for sub, least in (('still', 16), ('thumb', 99), ('clip', 90), ('o98', 196)):
    d = os.path.join(SITE, 'media', sub)
    n = len(os.listdir(d)) if os.path.isdir(d) else 0
    if n < least: bad.append(f'media/{sub}/ has {n} files (expected at least {least}): the {C.MEDIA_RELEASE} bundle is incomplete')


# 5. contrast of the text colours on the page's grounds (app.css :root; a colour with alpha is laid on the ground first)
def rgba(v):
    v = v.strip()
    if re.fullmatch(r'#[0-9a-fA-F]{6}', v): return [int(v[i:i + 2], 16) for i in (1, 3, 5)] + [1.0]
    m = re.fullmatch(r'rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)', v)
    return [int(m.group(1)), int(m.group(2)), int(m.group(3)), float(m.group(4))] if m else None


def lum(c):
    f = lambda x: x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4
    return .2126 * f(c[0] / 255) + .7152 * f(c[1] / 255) + .0722 * f(c[2] / 255)


css = open(os.path.join(SITE, 'assets', 'app.css'), encoding='utf-8').read()
root = re.search(r':root\s*\{(.*?)\}', css, re.S).group(1)
tok = {k: rgba(re.sub(r'/\*.*?\*/', '', v)) for k, v in re.findall(r'--([\w-]+):\s*([^;]+);', root)}
worst = []
for fg in ('paper', 'paper-2', 'paper-3', 'lamp'):
    for bg in ('ink', 'ink-2'):
        f, b = tok[fg], tok[bg]
        mix = [f[i] * f[3] + b[i] * (1 - f[3]) for i in range(3)]
        la, lb = sorted((lum(mix), lum(b)), reverse=True)
        r = (la + .05) / (lb + .05); worst.append((r, fg, bg))
        if r < 4.5: bad.append(f'contrast: --{fg} on --{bg} is {r:.2f}:1 (AA needs 4.5)')
low = min(worst)

# 6. machine paths (the media bundle and the build both come from someone's disk)
LOCAL = re.compile(rb'/Users/[^/\s"\']+/|/home/[^/\s"\']+/|/priv' rb'ate/tmp/|[A-Z]:\\Users\\')
for d, _, fs in os.walk(SITE):
    for f in fs:
        if f.endswith(('.html', '.json', '.txt', '.xml', '.js', '.css', '.svg')):
            fp = os.path.join(d, f)
            if os.path.islink(fp): continue
            if LOCAL.search(open(fp, 'rb').read()): bad.append(f'{os.path.relpath(fp, SITE)} names a path on the building machine')

print(f'{len(pages)} pages, {n_refs} local links, {len(film_refs) + len(repo_refs)} films with their media ({len(film_refs)} in the site'
      + (f', {len(repo_refs)} from {ABS_FILMS}' if ABS_FILMS else '') + f'), {len(expected)} styles with a film; '
      f'{len(benches)} benches ({n_bench_refs} links) under the style pages; '
      f'lowest text contrast {low[0]:.2f}:1 (--{low[1]} on --{low[2]})')
if bad:
    print('\n'.join('::error::' + b if os.environ.get('GITHUB_ACTIONS') else '  ' + b for b in bad[:200]))
    if len(bad) > 200: print(f'  … {len(bad) - 200} more')
    sys.exit(1)
