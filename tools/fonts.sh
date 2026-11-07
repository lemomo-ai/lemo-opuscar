#!/bin/sh
# fonts.sh — fetch the fonts the demos declare but git does not carry.
#
# `demo/fonts/` is gitignored on purpose (MAINTAINING.md): a demo ships its code,
# its CREDITS and the OFL licence texts, not the font binaries.  A fresh clone
# therefore renders most styles in a fallback face and still exits 0 — the type
# is wrong and nothing says so.  This resolves every local `@font-face` src.
#
# usage
#   sh tools/fonts.sh                  every style that is missing a font
#   sh tools/fonts.sh art-deco ukiyoe  only these styles
#   sh tools/fonts.sh --list           plan only, no network
#   sh tools/fonts.sh --force          re-fetch files already present
#   sh tools/fonts.sh --verify         read back the family inside each file
#   sh tools/fonts.sh --jobs=8         parallel downloads (default 6)
#
# how a file is resolved, in this order
#   author   the style ships its own fetcher (tools/fonts.py, fetch_fonts.mjs, …)
#            — 21 styles do; it is run the way build.sh runs it, so the subsets
#            and the file names are the author's, not a guess
#   bundled  the name matches one of the faces already in core/fonts/
#   github   .ttf from github.com/google/fonts (ofl/ apache/ ufl/): the exact file
#            name, or the best match in the family folder, written under the name
#            the @font-face asks for (the demos rename: Archivo-VF.ttf upstream is
#            Archivo[wdth,wght].ttf)
#   cssapi   .woff2 from the Google Fonts CSS API, matched to the declared
#            unicode-range; a lone file with no range is re-requested with &text=
#            built from the glyphs in the demo source, as the author's own
#            fetchers do (see styles/microscope/demo/tools/fonts.py)
#
# Whatever is left is printed with its @font-face block and the CREDITS line that
# names it, and the script exits 1 — it never reports a clean run over a missing
# face.  GITHUB_TOKEN is used for the folder listings if it is exported.
set -eu
REPO="${OPUSCAR_REPO:-$(cd -- "$(dirname -- "$0")/.." && pwd)}"
PY=$(command -v python3 2>/dev/null || command -v python 2>/dev/null) || {
  echo "fonts.sh: needs python3 (stdlib only)" >&2; exit 127; }
OPUSCAR_REPO="$REPO" exec "$PY" -I - "$@" <<'PYEOF'
import io, os, re, sys, time, json, shutil, subprocess, urllib.request, urllib.parse, urllib.error
from concurrent.futures import ThreadPoolExecutor

REPO = os.environ.get('OPUSCAR_REPO') or os.getcwd()
os.chdir(REPO)
UA    = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
         '(KHTML, like Gecko) Chrome/120 Safari/537.36')
GH    = 'https://raw.githubusercontent.com/google/fonts/main/'
API   = 'https://api.github.com/repos/google/fonts/contents/'
CSS   = 'https://fonts.googleapis.com/css2?'
DIRS  = ('ofl', 'apache', 'ufl')
CACHE = os.path.join(REPO, '.fonts-cache')
MAGIC = (b'\x00\x01\x00\x00', b'true', b'ttcf', b'OTTO', b'wOFF', b'wOF2')

argv   = sys.argv[1:]
flags  = {a for a in argv if a.startswith('-')}
want   = [a for a in argv if not a.startswith('-')]
LIST   = '--list'   in flags
FORCE  = '--force'  in flags
VERIFY = '--verify' in flags
JOBS   = next((max(1, int(a.split('=')[1])) for a in argv if a.startswith('--jobs=')), 6)
for a in flags:
    if a not in ('--list', '--force', '--verify') and not a.startswith('--jobs='):
        sys.exit('fonts.sh: unknown option %s' % a)

# ---------------------------------------------------------------- http ----
def get(url, token=False, timeout=90):
    h = {'User-Agent': UA}
    if token and os.environ.get('GITHUB_TOKEN'):
        h['Authorization'] = 'Bearer ' + os.environ['GITHUB_TOKEN']
    last = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (403, 429, 500, 502, 503) and i < 2:
                time.sleep(2 * (i + 1)); continue
            raise
        except OSError as e:
            last = e
            if i < 2: time.sleep(2 * (i + 1)); continue
            raise
    raise last

def isfont(b):  return bool(b) and b[:4] in MAGIC

def write(path, data):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    tmp = path + '.part'
    with open(tmp, 'wb') as f: f.write(data)
    os.replace(tmp, path)

# --------------------------------------------------------------- parse ----
FF    = re.compile(r'@font-face\s*\{([^{}]*)\}', re.I | re.S)
LOCAL = re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""", re.I)
norm  = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())

def prop(b, k):
    m = re.search(k + r'\s*:\s*([^;}]+)', b, re.I)
    return m.group(1).strip().strip('\'"') if m else ''

def scan():
    faces = {}
    for dp, dn, fn in os.walk('styles'):
        dn[:] = [d for d in dn if d not in ('node_modules', '.git', 'stills', 'frames', 'out')]
        for f in sorted(fn):
            if not f.endswith(('.css', '.html', '.htm')): continue
            p = os.path.join(dp, f)
            try: t = open(p, encoding='utf-8', errors='ignore').read()
            except OSError: continue
            if '@font-face' not in t: continue
            style = dp.split(os.sep)[1]
            for b in FF.findall(t):
                m = LOCAL.search(b)
                if not m: continue
                u = m.group(1).strip()
                if u.startswith(('http', 'data:', '//')): continue
                tgt = os.path.normpath(os.path.join(dp, u))
                row = faces.setdefault(style, {})
                if tgt in row: continue                   # same file, several blocks
                row[tgt] = dict(path=tgt, src=p, block=b.strip(),
                                family=prop(b, 'font-family'),
                                weight=prop(b, 'font-weight'),
                                italic='italic' in prop(b, 'font-style').lower(),
                                urange=re.sub(r'\s+', '', prop(b, 'unicode-range')))
    return {s: list(v.values()) for s, v in faces.items()}

# ------------------------------------------------------- family guessing ----
WEIGHTS = ('Thin', 'ExtraLight', 'UltraLight', 'Light', 'Regular', 'Book', 'Medium',
           'SemiBold', 'DemiBold', 'Bold', 'ExtraBold', 'UltraBold', 'Black', 'Heavy')

def stemslug(base):
    """Archivo-VF.ttf -> archivo, barlow800.woff2 -> barlow, Oswald[wght].ttf -> oswald."""
    s = os.path.splitext(base)[0]
    s = re.sub(r'\[[^\]]*\]', '', s)
    s = re.sub(r'[-_]?(VF|var|variable|sub|subset|wght)$', '', s, flags=re.I)
    s = re.sub(r'[-_]?(' + '|'.join(WEIGHTS) + r'|Italic|Oblique)+$', '', s, flags=re.I)
    m = re.match(r'(?i)^(.*?)[-_]?([1-9]00)i?$', s)   # barlow800, sc900, it600i
    if m and len(m.group(1)) >= 2: s = m.group(1)     # but not VT323 or B612
    return norm(s)

def oflslugs(d):
    out = []
    for g in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        m = re.match(r'(?i)^ofl[-_](.+)\.(txt|md)$', g)
        if m: out.append(norm(m.group(1)))
    return out

def credits_text(demo):
    for n in ('CREDITS', 'CREDITS.md', 'CREDITS.txt'):
        p = os.path.join(demo, n)
        if os.path.exists(p):
            return open(p, encoding='utf-8', errors='ignore').read()
    return ''

def candidates(face, demo):
    """Google-Fonts folder slugs worth trying, best guess first."""
    base, d = os.path.basename(face['path']), os.path.dirname(face['path'])
    out, seen = [], set()
    def add(x):
        x = norm(x)
        if x and x not in seen: seen.add(x); out.append(x)
    stem = stemslug(base)
    for s in oflslugs(d):                       # the licence texts the demo ships
        if s == stem: add(s)                    # exact first
    add(stem)                                   # then the file name
    if face['family']: add(face['family'])      # then the declared family/alias
    rest = [s for s in oflslugs(d) if s not in seen]
    rest.sort(key=lambda s: (not (s.startswith(stem) or stem.startswith(s)),
                             -len(os.path.commonprefix([s, stem])), s))
    for s in rest: add(s)                       # then the rest, closest first
    for ln in credits_text(demo).splitlines():  # finally the CREDITS prose
        if re.search(r'(?i)font', ln):
            for m in re.findall(r'[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z0-9]+){0,3}', ln):
                if norm(m) not in ('fonts', 'font', 'siliopenfontlicense'): add(m)
    return out

def wants(base, face):
    b = os.path.splitext(base)[0]
    ital = face['italic'] or bool(re.search(r'italic|oblique|\di$', b, re.I))
    m    = re.search('(' + '|'.join(WEIGHTS) + ')', b, re.I)
    wn   = m.group(1) if m else ''
    num  = re.search(r'(\d{3})', b)
    num  = int(num.group(1)) if num else None
    if num is None:
        r = re.findall(r'\d{3}', face['weight'])
        num = int(r[0]) if len(r) == 1 else None
    vf = ('[' in base) or bool(re.search(r'[-_](VF|var)\b|[-_](VF|var)\.', base, re.I)) \
         or len(re.findall(r'\d{3}', face['weight'])) == 2
    return ital, wn, num, vf

# ------------------------------------------------------------- tier: gh ----
_lock_free = ThreadPoolExecutor(max_workers=1)   # listings are cached on disk

def gh_list(slug):
    os.makedirs(CACHE, exist_ok=True)
    cf = os.path.join(CACHE, 'ls-%s.json' % slug)
    if os.path.exists(cf):
        try: return json.load(open(cf))
        except ValueError: pass
    for d in DIRS:
        try: j = json.loads(get(API + '%s/%s' % (d, slug), token=True))
        except urllib.error.HTTPError: continue
        except OSError: continue
        if isinstance(j, list):
            r = dict(dir=d, files=sorted(x['name'] for x in j if x.get('type') == 'file'))
            json.dump(r, open(cf, 'w')); return r
    r = dict(dir=None, files=[])
    json.dump(r, open(cf, 'w')); return r

def pick(files, base, face):
    ital, wn, num, vf = wants(base, face)
    stem, best = stemslug(base), None
    for f in files:
        if not f.lower().endswith(('.ttf', '.otf')): continue
        fi, fv = bool(re.search(r'italic', f, re.I)), '[' in f
        s  = 3 if fi == ital else -4
        s += 3 if fv == vf else -1
        if not fv:
            if wn and re.search(r'[-_]' + wn + r'(\.|$|\[)', f, re.I): s += 3
            elif not wn and re.search(r'[-_]Regular', f, re.I):        s += 2
        part = norm(re.split(r'[-\[]', os.path.splitext(f)[0])[0])
        # hard gate: never hand back a face from another family.  Without it a
        # near-miss slug wins on weight alone and VT323-Regular.ttf comes back
        # holding Architects Daughter — wrong type, exit 0, nobody told.
        if not (len(part) >= 3 and len(stem) >= 3
                and (part.startswith(stem) or stem.startswith(part))): continue
        if part == stem: s += 2
        k = (s, -len(f))
        if best is None or k > best[0]: best = (k, f)
    return best[1] if best else None

def tier_github(face, demo, log):
    base = os.path.basename(face['path'])
    if not base.lower().endswith(('.ttf', '.otf')): return None
    for slug in candidates(face, demo)[:6]:
        for d in DIRS:                                    # exact name, no API call
            try: b = get(GH + '%s/%s/%s' % (d, slug, urllib.parse.quote(base)))
            except Exception: continue
            if isfont(b):
                write(face['path'], b); licence(face, d, slug)
                return 'github %s/%s/%s' % (d, slug, base)
        ls = gh_list(slug)
        if not ls['dir']: continue
        f = pick(ls['files'], base, face)
        if not f: continue
        try: b = get(GH + '%s/%s/%s' % (ls['dir'], slug, urllib.parse.quote(f)))
        except Exception as e:
            log.append('    github %s/%s/%s: %s' % (ls['dir'], slug, f, e)); continue
        if isfont(b):
            write(face['path'], b); licence(face, ls['dir'], slug)
            return 'github %s/%s/%s -> %s' % (ls['dir'], slug, f, base)
    return None

def licence(face, d, slug):
    """Keep CREDITS honest: bring the OFL text in if the demo has none for it."""
    fd = os.path.dirname(face['path'])
    if any(re.match(r'(?i)^ofl', g) for g in (os.listdir(fd) if os.path.isdir(fd) else [])
           if norm(re.sub(r'(?i)^ofl[-_]|\.(txt|md)$', '', g)) == slug): return
    for n in ('OFL.txt', 'LICENSE.txt', 'LICENCE.txt'):
        try: b = get(GH + '%s/%s/%s' % (d, slug, n))
        except Exception: continue
        if b and b[:4] not in MAGIC:
            write(os.path.join(fd, 'OFL-%s.txt' % slug), b); return

# --------------------------------------------------------- tier: cssapi ----
CJK = re.compile('[⺀-鿿豈-﫿　-〿＀-￯]')

def display_name(slug):
    """The family name the CSS API answers to, read from the folder's METADATA.pb."""
    os.makedirs(CACHE, exist_ok=True)
    cf = os.path.join(CACHE, 'name-%s.txt' % slug)
    if os.path.exists(cf):
        return open(cf, encoding='utf-8').read().strip() or None
    for d in DIRS:
        try: t = get(GH + '%s/%s/METADATA.pb' % (d, slug)).decode('utf-8', 'ignore')
        except Exception: continue
        m = re.search(r'^\s*name:\s*"([^"]+)"', t, re.M)
        if m:
            open(cf, 'w', encoding='utf-8').write(m.group(1)); return m.group(1)
    open(cf, 'w').write(''); return None

def urange_cps(ur):
    """Expand a unicode-range into the set of codepoints it names."""
    out = set()
    for tok in ur.replace('U+', '').replace('u+', '').split(','):
        tok = tok.strip()
        if not tok: continue
        try:
            if '-' in tok:
                a, z = tok.split('-', 1); out |= set(range(int(a, 16), int(z, 16) + 1))
            else:
                out.add(int(tok, 16))
        except ValueError: pass
    return out


def bespoke(ur):
    """True when a unicode-range looks like the answer to a &text= request rather
    than one of Google's standard slices (latin, latin-ext, cyrillic, ...).

    A standard slice is a handful of wide blocks.  A &text= answer enumerates the
    characters one by one -- paper-popup's f0 declares 184 entries, 160 of them a
    single CJK codepoint.  Matching that against a standard slice by substring is
    how f0.woff2 came back at 4.7 kB holding the wrong 100 glyphs instead of the
    author's 20.2 kB subset of the 204 characters the story actually prints."""
    e = [x for x in ur.split(',') if x]
    if len(e) < 8: return False
    singles = sum(1 for x in e if '-' not in x)
    cps = urange_cps(ur)
    return (singles * 2 >= len(e) or any(c > 0x2E80 for c in cps)) and 0 < len(cps) <= 8192


def sibling_weights(face):
    """Every font-weight declared against the SAME target file, and whether the
    declaration is a variable range.

    scan() keeps one block per target path, but Google's CSS API answers
    `Fredoka:wght@500;600;700` with a SINGLE woff2 serving all three weights --
    paper-popup declares f2.woff2 three times, once per weight.  Asking for
    wght@500 alone returns a different, non-variable file: same glyphs, wrong
    axis, and the demo's 600/700 text renders synthesised."""
    ws, vf = [], False
    try: txt = io.open(face['src'], encoding='utf-8', errors='ignore').read()
    except OSError: return ws, vf
    tgt = os.path.basename(face['path'])
    for b in FF.findall(txt):
        m = LOCAL.search(b)
        if not m or os.path.basename(m.group(1)) != tgt: continue
        nums = re.findall(r'\d{3}', prop(b, 'font-weight'))
        if len(nums) == 2: vf = True
        for x in nums:
            if int(x) not in ws: ws.append(int(x))
    return sorted(ws), vf


def css_faces(fam, num, ital, text=None, nums=None, vf=False):
    q = urllib.parse.quote(fam)
    ws = nums or ([num] if num else [])
    i  = 1 if ital else 0
    axis = []
    if ws and vf and len(ws) >= 2:
        axis.append('ital,wght@%d,%d..%d' % (i, ws[0], ws[-1]) if ital else
                    'wght@%d..%d' % (ws[0], ws[-1]))
    if ws:
        axis.append('ital,wght@' + ';'.join('%d,%d' % (i, w) for w in ws) if ital else
                    'wght@' + ';'.join(str(w) for w in ws))
    for spec in ['family=%s:%s' % (q, a) for a in axis] + ['family=%s' % q]:
        url = CSS + spec + '&display=block' + ('&text=' + urllib.parse.quote(text) if text else '')
        try: t = get(url).decode('utf-8', 'ignore')
        except Exception: continue
        out = []
        for b in FF.findall(t):
            m = re.search(r'url\((https://[^)]+)\)', b)
            if m: out.append((re.sub(r'\s+', '', prop(b, 'unicode-range')), m.group(1)))
        if out: return out
    return []

_demo_text = {}
def demo_text(demo):
    if demo in _demo_text: return _demo_text[demo]
    src = []
    for dp, dn, fn in os.walk(demo):
        dn[:] = [d for d in dn if d not in ('fonts', 'node_modules', 'stills', 'frames', 'out', 'voices')]
        for f in sorted(fn):
            if f.endswith(('.js', '.mjs', '.json', '.html', '.srt', '.txt', '.py')):
                try: src.append(open(os.path.join(dp, f), encoding='utf-8', errors='ignore').read())
                except OSError: pass
    s = ''.join(src)
    t = ''.join(chr(c) for c in range(32, 127)) + ''.join(sorted(set(CJK.findall(s))))
    _demo_text[demo] = t
    return t

def tier_cssapi(face, demo, log):
    base = os.path.basename(face['path'])
    ital, _, num, _ = wants(base, face)
    nums, vf = sibling_weights(face)
    fams, seen = [], set()
    for c in [face['family']] + candidates(face, demo)[:4]:
        for n in ([c] if c and ' ' in c else []) + [display_name(norm(c)) if c else None]:
            if n and n not in seen: seen.add(n); fams.append(n)
    for fam in fams[:5]:
        faces = css_faces(fam, num, ital, nums=nums, vf=vf)
        if not faces: continue
        url = None
        if face['urange']:                                  # a declared slice: match it
            url = next((u for r, u in faces if r == face['urange']), None)
            if not url and bespoke(face['urange']):
                # not a slice -- the declared range IS the character set the author
                # asked for, so ask for exactly that and expect one file back.
                txt = ''.join(chr(c) for c in sorted(urange_cps(face['urange'])) if c >= 32)
                sub = css_faces(fam, num, ital, text=txt, nums=nums, vf=vf)
                if len(sub) == 1: url = sub[0][1]
                else: log.append('    cssapi %s: &text= gave %d files' % (fam, len(sub)))
            if not url and not bespoke(face['urange']):
                head = face['urange'].split(',')[0]
                url  = next((u for r, u in faces if head and head in r), None)
        elif len(faces) == 1:
            url = faces[0][1]
        else:                                               # one file, many slices: &text=
            sub = css_faces(fam, num, ital, text=demo_text(demo))
            if len(sub) == 1: url = sub[0][1]
            else: log.append('    cssapi %s: %d slices, no single subset' % (fam, len(sub)))
        if not url: continue
        try: b = get(url)
        except Exception as e:
            log.append('    cssapi %s: %s' % (fam, e)); continue
        if isfont(b):
            write(face['path'], b)
            return 'cssapi %s%s' % (fam, ' (text subset)' if not face['urange'] else '')
    return None

# -------------------------------------------------------- tier: bundled ----
_core = {f: os.path.join('core', 'fonts', f)
         for f in (os.listdir(os.path.join('core', 'fonts'))
                   if os.path.isdir(os.path.join('core', 'fonts')) else [])}

def tier_bundled(face, demo, log):
    base = os.path.basename(face['path'])
    src  = _core.get(base)
    if not src: return None
    cdir = os.path.join('core', 'fonts')
    cmap = {re.sub(r'\s+', '', prop(b, 'unicode-range')): LOCAL.search(b).group(1)
            for b in FF.findall(open(os.path.join(cdir, 'fonts.css'), encoding='utf-8',
                                     errors='ignore').read())
            if LOCAL.search(b)} if os.path.exists(os.path.join(cdir, 'fonts.css')) else {}
    if face['urange'] and cmap and face['urange'] not in cmap:
        return None                       # same name, different slice: not the same face
    os.makedirs(os.path.dirname(face['path']), exist_ok=True)
    shutil.copyfile(src, face['path'])
    return 'bundled core/fonts/%s' % base

# --------------------------------------------------------- tier: author ----
FETCHERS = (('tools/fonts.py', 'py'), ('tools/fetch_fonts.py', 'py'),
            ('kit/tools/fetch_fonts.py', 'py'), ('fetch_fonts.py', 'py'),
            ('tools/fonts.sh', 'sh'), ('tools/fetch_fonts.sh', 'sh'),
            ('tools/fonts.mjs', 'node'), ('fetch_fonts.mjs', 'node'), ('tools/fonts.js', 'node'))

def author_fetcher(demo):
    for rel, kind in FETCHERS:
        p = os.path.join(demo, rel)
        if os.path.exists(p): return rel, kind
    return None, None

def run_author(demo, rel, kind, log):
    cmd = {'py':  [sys.executable, '-I', rel, '.'],
           'sh':  ['sh', rel],
           'node':['node', rel]}[kind]
    try:
        r = subprocess.run(cmd, cwd=demo, capture_output=True, text=True, timeout=900)
    except Exception as e:
        log.append('    author %s: %s' % (rel, e)); return False
    if r.returncode != 0:
        tail = (r.stderr or r.stdout or '').strip().splitlines()[-3:]
        log.append('    author %s: exit %d  %s' % (rel, r.returncode, ' | '.join(tail)))
        return False
    return True

# ---------------------------------------------------------------- report ----
def kb(n): return '%.1f kB' % (n / 1000.0) if n < 1e6 else '%.2f MB' % (n / 1e6)

def guess_tier(face, demo):
    base = os.path.basename(face['path'])
    if base in _core:                                  return 'bundled'
    if base.lower().endswith(('.ttf', '.otf')):        return 'github'
    return 'cssapi'

def fc_family(p):
    """The first `family` record inside the file.

    `-f '%{family}'` is not usable here: on a variable font fontconfig expands the
    whole name list with no separator, so Inter.ttf reads back as
    "InterInterInterInterInterInterInterInterInterInter" and --verify prints a
    family that matches nothing.  The structured output carries one record per
    line, so the first quoted value is the family."""
    try:
        r = subprocess.run(['fc-query', p], capture_output=True, text=True, timeout=20)
        if r.returncode != 0: return ''
        m = re.search(r'^\s*family:\s*"([^"]+)"', r.stdout, re.M)
        return m.group(1).strip() if m else ''
    except Exception: return ''

# ------------------------------------------------------------------ main ----
faces = scan()
if want:
    miss = [w for w in want if w not in faces]
    if miss: sys.exit('fonts.sh: no @font-face found for: %s' % ', '.join(miss))
    styles = [s for s in sorted(faces) if s in want]
else:
    styles = sorted(faces)

plan = {s: [f for f in faces[s] if FORCE or not os.path.exists(f['path'])] for s in styles}
if not want:
    styles = [s for s in styles if plan[s]]

n_files = sum(len(plan[s]) for s in styles)
print('%d style%s, %d font file%s to resolve%s\n'
      % (len(styles), '' if len(styles) == 1 else 's', n_files, '' if n_files == 1 else 's',
         '  (--force)' if FORCE else ''))

if LIST:
    for s in styles:
        demo = os.path.join('styles', s, 'demo')
        rel, kind = author_fetcher(demo)
        have = len(faces[s]) - len(plan[s])
        print('%-24s %2d/%-2d present   %s'
              % (s, have, len(faces[s]), ('author %s' % rel) if rel else ''))
        for f in plan[s]:
            print('    %-34s %-8s %s' % (os.path.basename(f['path']),
                                         guess_tier(f, demo),
                                         (f['family'] or '?') + (' · slice' if f['urange'] else '')))
    sys.exit(0)

done, failed, bytes_got = [], [], 0
for s in styles:
    demo = os.path.join('styles', s, 'demo')
    # list() and not plan[s]: the author tier below does todo.remove(), and an alias
    # would empty the plan itself -- the per-file report then iterates nothing and
    # prints '8/0 ... 0 fetched' for 8 files that were in fact fetched.
    todo = list(plan[s])
    if not todo:
        print('%-24s nothing to do' % s); continue
    log, how = [], {}
    rel, kind = author_fetcher(demo)
    if rel and not FORCE:
        if run_author(demo, rel, kind, log):
            for f in list(todo):
                if os.path.exists(f['path']):
                    how[f['path']] = 'author %s' % rel
                    todo.remove(f)

    # A declared name ending in -sub / -subset is the author telling us the face is a
    # SUBSET (TECHNIQUE.md 11: CJK must be cut with the CSS API &text=, never shipped
    # whole). github would happily answer with the full variable file -- correct glyphs,
    # wrong intent: NotoSansSC-sub.ttf came back at 17.8 MB instead of ~1 MB. So for
    # those names the CSS API goes first and github stays as the fallback.
    def order(f):
        stem = os.path.splitext(os.path.basename(f['path']))[0]
        if re.search(r'(?i)[-_.]?sub(set)?$', stem):
            return (tier_bundled, tier_cssapi, tier_github)
        return (tier_bundled, tier_github, tier_cssapi)

    def one(f):
        for tier in order(f):
            try: r = tier(f, demo, log)
            except Exception as e: r = None; log.append('    %s %s: %s'
                                                        % (tier.__name__, os.path.basename(f['path']), e))
            if r: return f, r
        return f, None

    if todo:
        with ThreadPoolExecutor(max_workers=JOBS) as ex:
            for f, r in ex.map(one, todo):
                if r: how[f['path']] = r
                else: failed.append((s, f))

    print('%-24s %d/%d' % (s, len(how), len(plan[s])))
    for f in plan[s]:
        p = f['path']
        if p in how:
            sz = os.path.getsize(p); bytes_got += sz; done.append(p)
            print('  ok  %-32s %-46s %s' % (os.path.basename(p), how[p], kb(sz)))
        else:
            print('  --  %-32s unresolved' % os.path.basename(p))
    for l in log[:8]: print(l)

print('\n%d fetched (%s), %d unresolved' % (len(done), kb(bytes_got), len(failed)))

if VERIFY:
    print('\nverify — family name inside each file')
    for s in styles:
        for f in faces[s]:
            if not os.path.exists(f['path']): continue
            fam = fc_family(f['path'])
            cand = candidates(f, os.path.join('styles', s, 'demo'))[:4]
            ok = (not fam) or any(norm(fam).startswith(c) or c.startswith(norm(fam)) for c in cand)
            print('  %s %-22s %-30s %s' % ('ok ' if ok else '!! ', s,
                                           os.path.basename(f['path']), fam or '(fc-query unavailable)'))

if failed:
    print('\nunresolved — map these by hand (family name, then re-run):')
    for s, f in failed:
        demo = os.path.join('styles', s, 'demo')
        print('\n  %s / %s' % (s, os.path.basename(f['path'])))
        print('    declared in : %s' % f['src'])
        print('    @font-face  : %s' % re.sub(r'\s+', ' ', f['block'])[:220])
        print('    tried       : %s' % ', '.join(candidates(f, demo)[:6]))
        for ln in credits_text(demo).splitlines():
            if re.search(r'(?i)font', ln): print('    CREDITS     : %s' % ln.strip()[:200]); break
    sys.exit(1)
PYEOF
