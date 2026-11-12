# The site's media, made from the 720p films and the posters and remade only when a source changes (a signature per film in
# <media>/films/<id>/meta.json, from the contents of its sources, so another checkout or machine doesn't remake them). Not in git:
# tools/site_media.sh packs <media> for the site-media release; styleboard/build.py --site reads it (and never makes it).
#   python3 styleboard/media.py [--films DIR] [--media DIR] [--force] [ids…]   (defaults: styleboard/site_config.py WEB, MEDIA)
#   python3 styleboard/media.py --labels   measure each style page's label and top bar on its poster (needs <media>/label-rects.json
#                                          from styleboard/labelcheck.mjs) → <media>/labels.json, which sets each page's scrim
#   python3 styleboard/media.py --check    the per-style report (films, posters, stills moved, aka, contributors, STYLE.md headings)
# What it makes, in <media>:
#   films/<slug>/   per style (with a STYLE.md): poster (AVIF + WebP, 1280/1920), four stills (WebP 640/960/1280), the player's ruler
#                   sprite (WebP, <= 150 KB), meta.json;  legacy/stills/<slug>-<i>.jpg: the old site's still addresses (the site copies legacy/ to its root)
#   films/opuscar98/  poster and a sprite with one cell per chapter;  o98/<nn>-480|960.webp: its 98 frames (from styleboard/img/opuscar98/)
#   films/stars<n>/   the thank-you films: poster at 1920 cut from the 1080p master (site_config.PROMO), sprite
#   thumb/<slug>-480|960.webp, clip/<slug>.mp4   the home page's cards: the poster, and 4 silent seconds from 2 s before frame_sec (hover)
# Also in <media>, made elsewhere: the home page's long take (manifest.json, vid/, still/: rendered for the site, see
# styleboard/DESIGN.md) and labels.json (--labels). Checks on the way: a still on black, on a flash or mid-transition moves to the nearest clean
# frame; the style page's label and top bar are measured on the poster (WCAG contrast under the scrim) and get a deeper scrim where needed.
import argparse, hashlib, json, math, os, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
try:
    import numpy as np
    from PIL import Image
except ImportError:   # the site build only reads the media; making and measuring them needs numpy and Pillow
    np = Image = None

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import site_config as C

ROOT = C.ROOT
WEB = C.WEB                                                             # the 720p cuts (--films)
PROMO = C.PROMO                                                         # the thank-you films' 1080p masters
MEDIA = C.MEDIA                                                         # where the media go (--media)
VERSION = 5                                                             # bump to remake everything
STILLS_V = 2                                                            # bump to re-pick and re-cut only the stills
SPRITE_BUDGET = 150_000
STILL_AT = (.15, .37, .59, .81)                                         # the old site's stills, as fractions of the film
LZ = Image.Resampling.LANCZOS if Image else None


def run(*a, quiet=False, out=False):
    r = subprocess.run([str(x) for x in a], check=True, capture_output=quiet or out)
    return r.stdout if out else None


def probe(path):
    j = json.loads(run('ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate,width,height:format=duration', '-of', 'json', path, out=True))
    a, b = j['streams'][0]['r_frame_rate'].split('/')
    return dict(fps=round(int(a) / int(b), 3), w=j['streams'][0]['width'], h=j['streams'][0]['height'], dur=float(j['format']['duration']))


def save_avif(im, dst, crf=28):
    with tempfile.TemporaryDirectory() as td:
        png = os.path.join(td, 'x.png'); im.save(png, compress_level=1)
        run('ffmpeg', '-y', '-v', 'error', '-i', png, '-c:v', 'libsvtav1', '-crf', crf, '-preset', '5', '-pix_fmt', 'yuv420p10le',
            '-svtav1-params', 'tune=0', '-frames:v', '1', dst, quiet=True)          # SVT-AV1 prints its banner whatever -v says


def frames_raw(src, fps, w, h, start=0.0, gray=False):
    """every 1/fps seconds from start, w x h, as a numpy array (n, h, w[, 3]) — one decoding pass"""
    fmt, ch = ('gray', 1) if gray else ('rgb24', 3)
    b = run('ffmpeg', '-v', 'error', '-ss', f'{start:.3f}', '-i', src, '-vf', f'fps={fps},scale={w}:{h}:flags=area', '-f', 'rawvideo', '-pix_fmt', fmt, '-', out=True)
    a = np.frombuffer(b, np.uint8)
    n = a.size // (w * h * ch)
    return a[:n * w * h * ch].reshape((n, h, w) if gray else (n, h, w, 3))


def grab(src, t, w=1280):
    with tempfile.TemporaryDirectory() as td:
        p = os.path.join(td, 'f.png')
        run('ffmpeg', '-y', '-v', 'error', '-ss', f'{t:.3f}', '-i', src, '-frames:v', '1', '-vf', f'scale={w}:-2:flags=lanczos', p)
        return Image.open(p).convert('RGB')


# ---------------------------------------------------------------- what to make
def jobs(data, book):
    """one entry per film: id, kind, 720p source, poster source, still fractions, sprite step (or chapter thumbnail times)"""
    out = []
    for s in data['styles']:
        out.append(dict(id=s['slug'], kind='style', src=os.path.join(WEB, s['slug'] + '.mp4'), poster=os.path.join(ROOT, 'styles', s['slug'], 'poster.jpg'),
                        stills=True, step=float(max(1, math.ceil(s['dur'] / 60)))))   # about 60 cells or fewer: a second each up to a minute
    out.append(dict(id='opuscar98', kind='feature', src=os.path.join(WEB, 'opuscar98.mp4'), poster=os.path.join(HERE, 'img', 'feature_opuscar98.jpg'),
                    stills=False, step=0, times=book))
    for fid in ('stars6000', 'stars3000', 'stars2000', 'stars800', 'stars300'):
        out.append(dict(id=fid, kind='thanks', src=os.path.join(WEB, fid + '.mp4'), poster=os.path.join(HERE, 'img', 'thanks', fid + '.jpg'),
                        master=os.path.join(PROMO, fid, fid + '.mp4'), stills=False, step=1.0))
    return out


def fingerprint(p, whole=False):
    """what a source is, not where or when: a poster's bytes; a film's size and its first and last 256 KB"""
    h = hashlib.sha1()
    with open(p, 'rb') as f:
        if whole: h.update(f.read())
        else:
            n = os.fstat(f.fileno()).st_size; h.update(str(n).encode()); h.update(f.read(1 << 18))
            if n > 1 << 19: f.seek(-(1 << 18), 2); h.update(f.read())
    return h.hexdigest()


def signature(j):
    h = hashlib.sha1(str(VERSION).encode())
    for k in ('src', 'poster', 'master'):
        p = j.get(k)
        if p and os.path.exists(p): h.update(f'{k}:{fingerprint(p, whole=k == "poster")}'.encode())
    h.update(json.dumps([j.get('step'), j.get('times')], default=str).encode())
    return h.hexdigest()[:16]


# ---------------------------------------------------------------- checks
def pick_stills(src, dur):
    """the live site's times, unless the frame there is black, a flash, flat, or mid-cut; then the nearest clean frame within 2.5 s"""
    g = frames_raw(src, 4, 160, 90, gray=True).astype(np.float32) / 255
    n = len(g)
    mean, std = g.mean((1, 2)), g.std((1, 2))
    diff = np.zeros(n); diff[1:] = np.abs(g[1:] - g[:-1]).mean((1, 2))
    near_cut = np.maximum(diff, np.r_[diff[1:], 0])                      # change into or out of this frame (quarter-second apart)
    grad = np.abs(np.diff(g, axis=2)).mean((1, 2)) + np.abs(np.diff(g, axis=1)).mean((1, 2))
    # measured against the film itself: a white-paper style is not "a flash", a night film not "black", a fast cutter not "mid-cut"
    m_mean, m_std, m_cut, m_grad = (float(np.median(x)) for x in (mean, std, near_cut, grad))
    def bad(i):
        why = []
        if mean[i] < max(.03, .35 * m_mean): why.append('black')
        elif mean[i] > .9 and mean[i] > m_mean + .25: why.append('flash')
        if std[i] < min(.04, .3 * m_std): why.append('flat')
        if near_cut[i] > max(.1, 3.5 * m_cut): why.append('cut/dissolve')
        if grad[i] < .4 * m_grad: why.append('blurred')
        return why
    out, notes = [], []
    for f in STILL_AT:
        t0 = round(dur * f, 2); i0 = min(n - 1, int(t0 * 4))
        why = bad(i0)
        if not why: out.append(t0); continue
        best = None
        for k in range(1, 11):
            for i in (i0 - k, i0 + k):
                if 0 <= i < n and not bad(i): best = i; break
            if best is not None: break
        t = round((best if best is not None else i0) / 4 + .01, 2)
        out.append(t)
        notes.append(f'still at {t0:.2f}s ({", ".join(why)}) → {t:.2f}s' if best is not None else f'still at {t0:.2f}s ({", ".join(why)}): no clean frame within 2.5 s, kept')
    return out, notes


def _lum(c):
    c = np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
    return c[..., 0] * .2126 + c[..., 1] * .7152 + c[..., 2] * .0722


DEEP = (0, .45, .65, .8, .9)    # page.css .plate.deep1–4: a dark pool under the label (radial, centred on it); level 0 = the scrim alone


_lin = lambda p, st: np.interp(p, [s[0] for s in st], [s[1] for s in st])
TOPS = ((.6, 0, .16), (.8, .09, .2), (.9, .1, .22))   # page.css .plate-scrim's top layer: --tk, held to --th, gone at --tl; .plate.top1 / .top2


def _keep(x, y, top=TOPS[0]):
    """how much of the film shows through page.css .plate-scrim, layer by layer"""
    return ((1 - _lin(x, [(0, .84), (.24, .62), (.44, .18), (.56, 0), (1, 0)]))[None, :] *
            (1 - _lin(1 - y, [(0, .78), (.26, .34), (.50, 0), (1, 0)]))[:, None] *
            (1 - _lin(y, [(0, top[0]), *([(top[1], top[0])] if top[1] else []), (top[2], 0), (1, 0)]))[:, None])


def _ratio(bg, kind, x0, y0, x1, y1):
    """one piece of text over bg: its contrast / the contrast it needs (WCAG: 3:1 large, 4.5:1 otherwise), on the 95th-percentile brightest pixel"""
    reg = bg[max(0, int(y0)):int(y1) + 1, max(0, int(x0)):int(x1) + 1].reshape(-1, 3)
    if not len(reg): return None
    L = _lum(reg)
    c = reg[np.argsort(L)[int(len(L) * .95)]]
    paper = np.array([239, 231, 218]) / 255
    t = paper if kind in ('big', 'paper', 'tbig') else .7 * paper + .3 * c
    r = (_lum(t[None])[0] + .05) / (_lum(c[None])[0] + .05)
    return r / (3.0 if kind in ('big', 'tbig') else 4.5)


def top_contrast(img, rects):
    """the top bar (mark, search, language) over the film's first lines, after the scrim at each TOPS level: (level needed, worst at each)"""
    rects = [r for r in rects if r[0].startswith('t')]
    a = np.asarray(img.convert('RGB').resize((1280, 720), LZ), np.float32) / 255
    x, y = (np.arange(1280) + .5) / 1280, (np.arange(720) + .5) / 720
    ink = np.array([12, 10, 9]) / 255
    worst = []
    for lvl, top in enumerate(TOPS):
        kk = _keep(x, y, top)
        bg = a * kk[..., None] + ink * (1 - kk[..., None])
        rs = [r for r in (_ratio(bg, *q) for q in rects) if r is not None]
        w = min(rs) if rs else 9
        worst.append(round(float(w), 3))
        if w >= 1: return lvl, worst
    return len(TOPS) - 1, worst


def label_contrast(img, rects):
    """the style page's label on its poster: rects = [(kind, x0, y0, x1, y1)] in the 1280 x 720 film frame, measured on the rendered page
    (kind: 'big' = the name, paper, 3:1; 'paper' = paper, 4.5:1; 'small' = paper at 70 %, 4.5:1). The 95th-percentile brightest background under each piece of
    text, after the scrim (and the pool at each level). Returns (level needed, worst ratio at each level)."""
    rects = [r for r in rects if not r[0].startswith('t')]   # the top bar's own: top_contrast
    a = np.asarray(img.convert('RGB').resize((1280, 720), LZ), np.float32) / 255
    H, W = 720, 1280
    x, y = (np.arange(W) + .5) / W, (np.arange(H) + .5) / H
    keep = _keep(x, y)
    X, Y = np.meshgrid(x, y)
    d = np.sqrt(((X - .24) / .46) ** 2 + ((Y - .68) / .56) ** 2)                               # the pool: ellipse 46% x 56% at 24% 68%
    pool = np.clip(np.where(d < .45, 1, 1 - (d - .45) / .55), 0, 1)
    ink, paper = np.array([12, 10, 9]) / 255, np.array([239, 231, 218]) / 255
    worst = []
    for lvl, k in enumerate(DEEP):
        kk = keep * (1 - k * pool)
        bg = a * kk[..., None] + ink * (1 - kk[..., None])
        ratios = []
        for kind, x0, y0, x1, y1 in rects:
            reg = bg[max(0, int(y0)):int(y1) + 1, max(0, int(x0)):int(x1) + 1].reshape(-1, 3)
            if not len(reg): continue
            L = _lum(reg)
            c = reg[np.argsort(L)[int(len(L) * .95)]]
            t = paper if kind in ('big', 'paper') else .7 * paper + .3 * c
            r = (_lum(t[None])[0] + .05) / (_lum(c[None])[0] + .05)
            ratios.append(r / (3.0 if kind == 'big' else 4.5))
        w = min(ratios) if ratios else 9
        worst.append(round(float(w), 3))
        if w >= 1: return lvl, worst
    return len(DEEP) - 1, worst


def cut_stills(j, m, dur, d):
    """four stills at the old site's fractions (moved off a bad frame): WebP 640/960/1280, and a 640 JPEG at the old address (legacy/stills/)"""
    times, notes = pick_stills(j['src'], dur)
    m['stills'] = times; m['notes'] = m.get('notes', []) + notes; m['stills_v'] = STILLS_V
    old = os.path.join(MEDIA, 'legacy', 'stills'); os.makedirs(old, exist_ok=True)
    for i, t in enumerate(times):
        x = grab(j['src'], t, 1280)
        for w in (640, 960, 1280):
            (x if x.width == w else x.resize((w, round(w * x.height / x.width)), LZ)).save(os.path.join(d, f'still-{i}-{w}.webp'), 'WEBP', quality=82, method=5)
        x.resize((640, round(640 * x.height / x.width)), LZ).save(os.path.join(old, f'{j["id"]}-{i}.jpg'), 'JPEG', quality=80, progressive=True, optimize=True)


# ---------------------------------------------------------------- one film
def make(j, force=False):
    fid, d = j['id'], os.path.join(MEDIA, 'films', j['id'])
    os.makedirs(d, exist_ok=True)
    meta_p = os.path.join(d, 'meta.json')
    sig = signature(j)
    if not force and os.path.exists(meta_p):
        m = json.load(open(meta_p))
        if m.get('sig') == sig and os.path.exists(os.path.join(d, 'sprite.webp')):
            if not j['stills'] or (m.get('stills_v') == STILLS_V and all(os.path.exists(os.path.join(MEDIA, 'legacy', 'stills', f'{fid}-{i}.jpg')) for i in range(4))):
                return m, False
            m['notes'] = [n for n in m.get('notes', []) if not n.startswith('still')]
            cut_stills(j, m, probe(j['src'])['dur'], d)
            json.dump(m, open(meta_p, 'w'), indent=1)
            return m, True
    info = probe(j['src'])
    m = dict(sig=sig, fps=info['fps'], dur=round(info['dur'], 3), w=info['w'], h=info['h'], notes=[])

    # poster
    im = Image.open(j['poster']).convert('RGB')
    if j['kind'] == 'thanks' and im.width < 1920 and os.path.exists(j.get('master', '')):   # the old poster was 960: find its frame, cut it from the 1080p master
        ref = np.asarray(im.convert('L').resize((64, 36), LZ), np.float32) / 255
        g = frames_raw(j['src'], 4, 64, 36, gray=True).astype(np.float32) / 255
        t = float(np.argmin(np.abs(g - ref).mean((1, 2)))) / 4 + .01
        im = grab(j['master'], t, 1920)
        m['notes'].append(f'poster: the 960 poster matched the film at {t:.2f}s; cut at 1920 from the 1080p master')
    widths = [w for w in (1280, 1920) if w <= im.width] or [im.width]
    for w in widths:
        x = im if im.width == w else im.resize((w, round(w * im.height / im.width)), LZ)
        x.save(os.path.join(d, f'poster-{w}.webp'), 'WEBP', quality=84, method=5)
        save_avif(x, os.path.join(d, f'poster-{w}.avif'))
    m['posters'] = widths
    # (the old addresses posters/<slug>.jpg, img/feature_opuscar98.jpg, img/thanks/<id>.jpg are copied from git by the site build)

    # stills (styles)
    if j['stills']: cut_stills(j, m, info['dur'], d)
    else: m['stills'] = []

    # the ruler's sprite: a frame per second (two seconds for long films) from one decoding pass, or one per chapter
    if j.get('times'):
        frames = [grab(j['src'], t, 224).resize((224, 126), LZ) for t in j['times']]
        step = 0
    else:
        step = j['step']
        arr = frames_raw(j['src'], f'1/{step:g}', 224, 126, start=step / 2)
        frames = [Image.fromarray(a) for a in arr[:max(1, int(info['dur'] // step))]]
    cols, best, sheets = 10, None, {}
    p = os.path.join(d, 'sprite.webp')
    for qmin in (66, 58, 50, 42):          # quality first, then size: the largest cells that fit at q >= 66; failing that 58, 50, 42
        for cw, chh in ((224, 126), (208, 117), (192, 108), (176, 99), (160, 90), (144, 81), (128, 72)):
            if (cw, chh) not in sheets:
                sh = sheets[cw, chh] = Image.new('RGB', (cols * cw, -(-len(frames) // cols) * chh))
                for k, fr in enumerate(frames): sh.paste(fr if fr.width == cw else fr.resize((cw, chh), LZ), ((k % cols) * cw, (k // cols) * chh))
            for q in (78, 72, 66, 62, 58, 54, 50, 46, 42):
                if q < qmin: break
                sheets[cw, chh].save(p, 'WEBP', quality=q, method=6)
                if os.path.getsize(p) <= SPRITE_BUDGET: best = (cw, chh, q, os.path.getsize(p)); break
            if best: break
        if best: break
    if not best: raise RuntimeError(f'media.py: no sprite under {SPRITE_BUDGET} bytes for {fid}')
    m.update(grid=[cols, best[0], best[1], len(frames), step], sprite_q=best[2], sprite_bytes=best[3])
    json.dump(m, open(meta_p, 'w'), indent=1)
    return m, True


def o98_frames(book):
    """OPUSCAR 98's 98 frames for the page, WebP 480/960, from styleboard/img/opuscar98/<nn>.jpg (in git; also their old address)"""
    d = os.path.join(MEDIA, 'o98'); os.makedirs(d, exist_ok=True)
    mp = os.path.join(d, 'meta.json')
    done = json.load(open(mp)) if os.path.exists(mp) else {}
    made = 0
    for f in book['films']:
        nn = f'{int(f["no"]):02d}'
        src = os.path.join(HERE, 'img', 'opuscar98', nn + '.jpg')
        fp = fingerprint(src, whole=True)
        if done.get(nn) == fp and os.path.exists(os.path.join(d, nn + '-480.webp')): continue
        im = Image.open(src).convert('RGB')
        im.save(os.path.join(d, nn + '-960.webp'), 'WEBP', quality=80, method=5)
        im.resize((480, round(480 * im.height / im.width)), LZ).save(os.path.join(d, nn + '-480.webp'), 'WEBP', quality=80, method=5)
        done[nn] = fp; made += 1
    json.dump(done, open(mp, 'w'), indent=0)
    return made


def real_durs(data):
    """every length the site prints comes from the film itself (meta.json, measured by ffprobe when media.py cut it), not from
    style.json's one-decimal copy: 58.5 there rounds to 0:58, the file is 58.517 s and its player says 0:59. Changes data in place;
    a style without media keeps its number."""
    changed = []
    for s in data['styles']:
        p = os.path.join(MEDIA, 'films', s['slug'], 'meta.json')
        if not os.path.exists(p): continue
        dur = round(json.load(open(p))['dur'], 3)
        if round(float(s['dur'])) != round(dur): changed.append((s['slug'], s['dur'], dur))
        s['dur'] = dur
    return changed


def make_all(data, book_times, book, force=False, only=None):
    missing = [j['src'] for j in jobs(data, book_times) if (not only or j['id'] in only) and not os.path.exists(j['src'])]
    if missing: raise SystemExit(f'media.py: no 720p film for {len(missing)} ids in {WEB} (sh tools/web_cuts.sh, or --films DIR): '
                                 + ', '.join(os.path.basename(m) for m in missing[:12]))
    js = [j for j in jobs(data, book_times) if not only or j['id'] in only]
    out, made = {}, []
    def one(j):
        m, new = make(j, force)
        return j['id'], m, new
    with ThreadPoolExecutor(6) as ex:
        for fid, m, new in ex.map(one, js):
            out[fid] = m
            if new: made.append(fid)
    n98 = o98_frames(book)
    nc = cards({'styles': [s for s in data['styles'] if not only or s['slug'] in only]}, force)
    print(f'  media: {len(made)} of {len(js)} films made ({", ".join(made[:8])}{"…" if len(made) > 8 else ""}), the rest up to date; '
          f'{n98} OPUSCAR 98 frames, {nc} cards → {MEDIA}')
    return out


def cards(data, force=False):
    """the home page's cards: thumb/<slug>-480|960.webp from the poster, clip/<slug>.mp4 (4 s, 640 px, silent) from 2 s before the style's
    frame_sec; remade when the poster or the film changes (thumb/cards.json keeps their fingerprints)"""
    th, cl = os.path.join(MEDIA, 'thumb'), os.path.join(MEDIA, 'clip')
    os.makedirs(th, exist_ok=True); os.makedirs(cl, exist_ok=True)
    rec_p = os.path.join(th, 'cards.json')
    rec = json.load(open(rec_p)) if os.path.exists(rec_p) else {}
    def one(s):
        slug, made = s['slug'], 0
        poster, film = os.path.join(ROOT, 'styles', slug, 'poster.jpg'), os.path.join(WEB, slug + '.mp4')
        r = rec.get(slug, {})
        fp = fingerprint(poster, whole=True)
        if force or r.get('poster') != fp or not os.path.exists(os.path.join(th, f'{slug}-960.webp')):
            im = Image.open(poster).convert('RGB')
            for w in (480, 960): im.resize((w, w * 9 // 16), LZ).save(os.path.join(th, f'{slug}-{w}.webp'), 'WEBP', quality=78, method=5)
            r['poster'] = fp; made += 1
        ff = fingerprint(film)
        if force or r.get('film') != ff or not os.path.exists(os.path.join(cl, slug + '.mp4')):
            sj = json.load(open(os.path.join(ROOT, 'styles', slug, 'style.json'), encoding='utf-8'))
            at = max(0.0, float(sj.get('frame_sec') if sj.get('frame_sec') is not None else s['dur'] * .4) - 2.0)
            run('ffmpeg', '-y', '-v', 'error', '-ss', f'{at:.2f}', '-i', film, '-t', '4', '-an', '-vf', 'scale=640:-2:flags=lanczos,fps=24',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                os.path.join(cl, slug + '.mp4'))
            r['film'] = ff; made += 1
        return slug, r, made
    n = 0
    with ThreadPoolExecutor(6) as ex:
        for slug, r, made in ex.map(one, data['styles']): rec[slug] = r; n += bool(made)
    json.dump(rec, open(rec_p, 'w'), indent=0)
    return n


def labels(data):
    """<media>/labels.json: for each style page, the lightest pool under its label and band under its top bar that pass (label_contrast,
    top_contrast) on its poster, from the rects styleboard/labelcheck.mjs measured on the rendered pages (<media>/label-rects.json)"""
    rp = os.path.join(MEDIA, 'label-rects.json')
    if not os.path.exists(rp): raise SystemExit(f'media.py --labels: no {rp} (node styleboard/labelcheck.mjs --base <a preview of the site> --out {rp})')
    rects, out = json.load(open(rp)), {}
    for slug, rs in rects.items():
        im = Image.open(os.path.join(ROOT, 'styles', slug, 'poster.jpg'))
        lvl, worst = label_contrast(im, [tuple(r) for r in rs])
        tl, tw = top_contrast(im, [tuple(r) for r in rs])
        out[slug] = dict(level=lvl, worst=worst, top=tl, top_worst=tw)
    json.dump(out, open(os.path.join(MEDIA, 'labels.json'), 'w'), indent=1)
    print(f'  labels.json: {sum(1 for v in out.values() if v["level"])} of {len(out)} labels get a deeper pool, {sum(1 for v in out.values() if v["worst"][-1] < 1)} still short; '
          f'{sum(1 for v in out.values() if v["top"])} a darker band under the top bar, {sum(1 for v in out.values() if v["top_worst"][-1] < 1)} still short')


def library():
    """the published styles as the site sees them: styleboard/catalog.json (build.py's last output; its order is the categories' and
    the numbers') with a STYLE.md, and i18n.json. Hands them to pages.py too."""
    import pages, sitedata
    cat = json.load(open(os.path.join(HERE, 'catalog.json'), encoding='utf-8'))
    cats = list(dict.fromkeys((s['cat'], s['cat_en']) for s in cat))
    data = sitedata.site_data([s for s in cat if os.path.exists(os.path.join(ROOT, 'styles', s['slug'], 'STYLE.md'))], cats)
    pages.use(data)
    return data


def main():
    global WEB, MEDIA
    ap = argparse.ArgumentParser(description='the site media (see the top of styleboard/media.py)')
    ap.add_argument('ids', nargs='*', help='only these films (slugs, opuscar98, stars<n>)')
    ap.add_argument('--films', metavar='DIR', help='the 720p cuts (default: site_config.WEB)')
    ap.add_argument('--media', metavar='DIR', help='where the media go (default: site_config.MEDIA)')
    ap.add_argument('--force', action='store_true', help='remake everything')
    ap.add_argument('--labels', action='store_true', help='measure the labels and top bars (labels.json) instead')
    ap.add_argument('--check', action='store_true', help='print and save the per-style report (<media>/checks.json) instead')
    a = ap.parse_args()
    if np is None: raise SystemExit('media.py needs numpy and Pillow (pip install numpy pillow), and ffmpeg with libsvtav1 on PATH')
    if a.films: WEB = os.path.abspath(a.films)
    if a.media: MEDIA = os.path.abspath(a.media)
    os.makedirs(MEDIA, exist_ok=True)
    data = library()
    import pages
    if a.labels: labels(data)
    elif a.check:
        c = pages.checks(pages.media_meta(MEDIA))
        print(json.dumps({k: (v if not isinstance(v, (dict, list)) or len(v) < 40 else f'{len(v)} items') for k, v in c.items()}, ensure_ascii=False, indent=1))
    else: make_all(data, [r[4] for r in pages.o98_spans(False)], pages.BOOK, force=a.force, only=set(a.ids) or None)


if __name__ == '__main__':
    import media   # one module, whichever way it is reached (pages.py imports it as media)
    media.main()
