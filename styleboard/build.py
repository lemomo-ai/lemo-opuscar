# Lemo-Opuscar gallery: styles/*/style.json → catalog.json, index.html, and the generated parts of README.md, README.zh-CN.md, styles/README.md, AGENTS.md
# Local:          python3 styleboard/build.py                 (also refreshes each style.json "dur" from its mp4)
# GitHub Pages:   python3 styleboard/build.py --site _site
# README frames:  python3 styleboard/build.py --frames <slug>… (docs/frames/<slug>.jpg at the style's frame_sec)
import argparse, json, re, html, os, glob, shutil, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
CATALOG = os.path.join(HERE, 'catalog.json')   # generated; CI and tools/release.py read it

REPO = 'lemomo-ai/lemo-opuscar'
FILMS_URL = f'https://github.com/{REPO}/releases/download/films'   # full films live on the "films" release as <slug>.mp4
BLOB_URL = f'https://github.com/{REPO}/blob/main'

# The nine categories, in gallery order. A style.json must name one of them (both languages, exactly).
CATEGORIES = [('手绘与绘画', 'Hand-drawn & Painting'), ('东方传统', 'East Asian Traditions'), ('印刷与版画', 'Print & Printmaking'),
              ('图形与排版', 'Graphic & Type'), ('信息与发布', 'Information & Keynote'), ('卡通与动画', 'Cartoon & Anime'),
              ('游戏', 'Games'), ('电影与时代', 'Cinema & Eras'), ('材质与 3D', 'Materials & 3D')]
FIELDS = ('slug', 'num', 'en', 'cn', 'category_en', 'category_cn', 'film', 'line', 'line_cn', 'uses', 'frame_sec', 'dur')


def film_seconds(mp4):
    """Length of a film in seconds, or None when ffprobe can't read it (a half-rendered file, no ffprobe installed)."""
    try:
        d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], capture_output=True, text=True).stdout)
    except (ValueError, OSError): return None
    return d if d > 0 else None


def load_styles(refresh_dur):
    """Every styles/<slug>/style.json (folders starting with _ are templates). Fails loudly on a missing field or an unknown category.
    With refresh_dur, "dur" is re-read from styles/<slug>/<slug>.mp4 and written back when it changed; without the mp4
    (another machine, CI) or when ffprobe can't read it, the stored value is kept, never zeroed (0 = no video in the gallery)."""
    out, bad = [], []
    for p in sorted(glob.glob(os.path.join(ROOT, 'styles', '*', 'style.json'))):
        slug = os.path.basename(os.path.dirname(p))
        if slug.startswith('_'): continue
        j = json.load(open(p, encoding='utf-8'))
        miss = [f for f in FIELDS if f not in j]
        if miss: bad.append(f'styles/{slug}/style.json: missing {", ".join(miss)}'); continue
        if j['slug'] != slug: bad.append(f'styles/{slug}/style.json: slug is "{j["slug"]}", folder is "{slug}"')
        if (j['category_cn'], j['category_en']) not in CATEGORIES:
            bad.append(f'styles/{slug}/style.json: unknown category "{j["category_en"]} / {j["category_cn"]}" (see CATEGORIES in styleboard/build.py)')
        mp4 = os.path.join(ROOT, 'styles', slug, slug + '.mp4')
        if refresh_dur and os.path.exists(mp4):
            d = film_seconds(mp4)
            if d is None:
                print(f'WARNING: styles/{slug}/{slug}.mp4 exists but ffprobe cannot read its duration (half-rendered? no ffprobe?); keeping dur={j["dur"]}')
            elif round(d, 1) != j['dur']:
                j['dur'] = round(d, 1)
                open(p, 'w', encoding='utf-8').write(json.dumps(j, ensure_ascii=False, indent=1) + '\n')
        out.append(dict(slug=slug, num=j['num'], en=j['en'], cn=j['cn'], cat=j['category_cn'], cat_en=j['category_en'],
                        film=j['film'], line=j['line'], line_cn=j['line_cn'], uses=j['uses'], dur=j['dur'], frame_sec=j['frame_sec']))
    if bad: raise SystemExit('styleboard/build.py:\n  ' + '\n  '.join(bad))
    order = {c: i for i, c in enumerate(CATEGORIES)}
    out.sort(key=lambda s: (order.get((s['cat'], s['cat_en']), 99), int(re.match(r'\d+', s['num']).group()), s['num']))
    return out


def grab_frames(styles, slugs):
    """docs/frames/<slug>.jpg for the README grid: one frame of the film at the style's frame_sec."""
    by = {s['slug']: s for s in styles}
    os.makedirs(os.path.join(ROOT, 'docs', 'frames'), exist_ok=True)
    for slug in slugs:
        s = by.get(slug) or exit(f'no style "{slug}"')
        mp4 = os.path.join(ROOT, 'styles', slug, slug + '.mp4')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(s['frame_sec']), '-i', mp4, '-frames:v', '1', '-vf', 'scale=800:450', '-q:v', '3',
                        os.path.join(ROOT, 'docs', 'frames', slug + '.jpg')], check=True)
        print(f'docs/frames/{slug}.jpg ← {slug}.mp4 @ {s["frame_sec"]}s')


ap = argparse.ArgumentParser()
ap.add_argument('--site', help='build the GitHub Pages site into this folder (films from Releases)')
ap.add_argument('--frames', nargs='+', metavar='SLUG', help='only re-grab docs/frames/<slug>.jpg from the film at frame_sec, then stop')
args = ap.parse_args()
site = args.site

styles = load_styles(refresh_dur=not site and not args.frames)
if args.frames: grab_frames(styles, args.frames); raise SystemExit
if not site:
    json.dump([{k: v for k, v in s.items() if k != 'frame_sec'} for s in styles], open(CATALOG, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

if site:   # the public gallery only lists finished styles (with a STYLE.md)
    styles = [s for s in styles if os.path.exists(os.path.join(ROOT, 'styles', s['slug'], 'STYLE.md'))]
for s in styles:
    slug = s['slug']
    s['imgs'] = sorted(os.path.basename(p) for p in glob.glob(os.path.join(HERE, 'img', slug + '_*.jpg')))
    has_poster = os.path.exists(os.path.join(ROOT, 'styles', slug, 'poster.jpg'))
    has_md = os.path.exists(os.path.join(ROOT, 'styles', slug, 'STYLE.md'))
    if site:
        s['video'] = f'films/{slug}.mp4' if s['dur'] else ''          # 720p web cut, served by Pages as video/mp4 (Safari needs it)
        s['full'] = f'{FILMS_URL}/{slug}.mp4' if s['dur'] else ''       # full quality on Releases
        s['poster'] = f'posters/{slug}.jpg' if has_poster else ''
        s['stylemd'] = f'{BLOB_URL}/styles/{slug}/STYLE.md' if has_md else ''
    else:
        s['video'] = f'../styles/{slug}/{slug}.mp4' if os.path.exists(os.path.join(ROOT, 'styles', slug, slug + '.mp4')) else ''
        s['poster'] = f'../styles/{slug}/poster.jpg' if has_poster else ''
        s['stylemd'] = f'../styles/{slug}/STYLE.md' if has_md else ''

esc = lambda t: html.escape(t or '')

def laurel_symbol():
    # laurel: two branches, 9 leaves each along an arc
    import math
    leaves = []
    for side in (-1, 1):
        for i in range(9):
            a = math.radians(200 - i * 17) if side < 0 else math.radians(-20 + i * 17)
            cx, cy = 59 + 44 * math.cos(a), 34 + 27 * math.sin(a)
            rot = math.degrees(a) + (90 if side > 0 else -90) + side * 28
            leaves.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="2.3" ry="5.6" transform="rotate({rot:.1f} {cx:.1f} {cy:.1f})"/>')
    stems = '<path d="M22 50 Q10 30 24 10" fill="none" stroke="currentColor" stroke-width="1"/><path d="M96 50 Q108 30 94 10" fill="none" stroke="currentColor" stroke-width="1"/>'
    return f'<symbol id="laurel" viewBox="0 0 118 62"><g fill="currentColor">{"".join(leaves)}</g>{stems}</symbol>'

def mmss(d): return f'{int(d // 60)}:{int(round(d) % 60):02d}'

def card(s):
    img = f'img/{s["imgs"][0]}' if s['imgs'] else s.get('poster', '')
    vid = bool(s.get('video'))
    film = s.get('film') or s['en']
    main = f'<img class="still" src="{esc(img)}" alt="{esc(s["en"])} — {esc(film)}" loading="lazy">' if img else '<div class="empty">Coming soon</div>'
    play = (f'<button class="play" type="button" data-src="{esc(s["video"])}" data-poster="{esc(s.get("poster", ""))}" '
            f'aria-label="Play {esc(film)}"><i></i><span>{mmss(s["dur"])}</span></button>') if vid else ''
    uses = ''.join(f'<li>{esc(u)}</li>' for u in s.get('uses', []))
    links = []
    if vid: links.append(f'<a class="watch" href="{esc(s.get("full") or s["video"])}" data-play>Watch the film</a>')
    if s.get('stylemd'): links.append(f'<a href="{esc(s["stylemd"])}" target="_blank" rel="noopener">STYLE.md</a>')
    return (f'<article class="nominee" data-slug="{esc(s["slug"])}" data-en="{esc(s["en"])}" data-cn="{esc(s["cn"])}" data-film="{esc(film)}">\n'
            f'  <div class="screen">{main}{play}</div>\n'
            f'  <div class="plate">\n'
            f'    <h3>{esc(s["en"])}</h3><p class="cn">{esc(s["cn"])}</p>\n'
            f'    <p class="for">for <em>{esc(film)}</em></p>\n'
            f'    <p class="line">{esc(s.get("line", ""))}</p><p class="line-cn">{esc(s.get("line_cn", ""))}</p>\n'
            f'    {f"<ul class=uses aria-label=\"Best for\">{uses}</ul>" if uses else ""}\n'
            f'    <nav class="links">{"".join(links)}</nav>\n'
            f'  </div>\n</article>')

cats = [c for c in CATEGORIES if any((s['cat'], s['cat_en']) == c for s in styles)]
sections, tabs = [], []
for i, (cn, en) in enumerate(cats, 1):
    group = [s for s in styles if s['cat'] == cn]
    sid = re.sub(r'[^a-z0-9]+', '-', en.lower()).strip('-')
    tabs.append(f'<button data-f="{sid}">{esc(en)}<small>{esc(cn)}</small></button>')
    sections.append(
        f'<section class="category" id="{sid}">\n'
        f'  <header class="cat-head"><svg class="lf"><use href="#laurel"/></svg>'
        f'<div><p class="cat-no">Category {i:02d}</p><h2>{esc(en)}</h2><p class="cat-cn">{esc(cn)} · {len(group)} nominees</p></div>'
        f'<svg class="lf"><use href="#laurel"/></svg></header>\n'
        f'  <div class="grid">\n' + '\n'.join(map(card, group)) + '\n  </div>\n</section>')

# the feature presentation above the nominees: Opuscar 98 (the film lives in promo/, which is not in the repo;
# the gallery streams the 720p web cut from Pages, the 1080p file is on the "films" release, the poster is styleboard/img)
FEATURE = dict(poster='img/feature_opuscar98.jpg', dur='6:31',
               src='films/opuscar98.mp4' if site else '../.release/web/opuscar98.mp4', full=f'{FILMS_URL}/opuscar98.mp4')
n_vid = sum(bool(s.get('video')) for s in styles)
minutes = sum(s.get('dur', 0) for s in styles) / 60
n_all = len(styles)

# What search engines and AI answer engines read: canonical URL, share cards, JSON-LD naming the upstream repo and its author.
# Forks copy this file, so the canonical and codeRepository keep pointing here.
SITE_URL = 'https://lemomo-ai.github.io/lemo-opuscar/'
REPO_URL = f'https://github.com/{REPO}'
AUTHOR = {'@type': 'Person', '@id': 'https://github.com/lemomo-ai', 'name': 'Lemomo', 'url': 'https://github.com/lemomo-ai',
          'sameAs': ['https://x.com/lemomo_ai', 'https://github.com/lemomo-ai']}
GALLERY_DESC = (f'Lemo-Opuscar: {n_all} film styles for Claude Code. Each style is a reusable prompt plus a short film made entirely in code '
                'by Claude Opus 5.5, with no video model. Includes OPUSCAR 98, 98 years of Best Picture. Official site of github.com/' + REPO + '.')
FILM_URL = SITE_URL + 'opuscar98/'
FILM_DESC = ('OPUSCAR 98: one Clawd walks through all 98 Best Picture winners (1927 – 2025), each redrawn in a style that fits the film. '
             'Every frame, note and cut was written in code by Claude Opus 5.5, with no video model.')
REPO_LD = {'@type': 'SoftwareSourceCode', '@id': REPO_URL, 'name': 'Lemo-Opuscar', 'url': REPO_URL, 'codeRepository': REPO_URL,
           'description': f'{n_all} film styles, each a style prompt plus a demo film made entirely in code, packaged as a Claude Code skill.',
           'license': 'https://opensource.org/licenses/MIT', 'author': {'@id': AUTHOR['@id']},
           'keywords': ['Claude Code skill', 'Claude Opus 5.5', 'film styles', 'no video model', 'motion graphics', 'creative coding']}

def head_meta(url, title, desc, image, ld):
    """canonical + Open Graph + Twitter card + one JSON-LD block, for the <head> of a site page."""
    e = html.escape
    tags = [f'<link rel="canonical" href="{url}">',
            '<meta property="og:type" content="website">', '<meta property="og:site_name" content="Lemo-Opuscar">',
            f'<meta property="og:url" content="{url}">', f'<meta property="og:title" content="{e(title)}">',
            f'<meta property="og:description" content="{e(desc)}">', f'<meta property="og:image" content="{image}">',
            '<meta name="twitter:card" content="summary_large_image">', '<meta name="twitter:site" content="@lemomo_ai">',
            f'<meta name="twitter:title" content="{e(title)}">', f'<meta name="twitter:description" content="{e(desc)}">',
            f'<meta name="twitter:image" content="{image}">']
    data = json.dumps({'@context': 'https://schema.org', '@graph': ld}, ensure_ascii=False, indent=1).replace('</', '<\\/')
    return '\n'.join(tags) + f'\n<script type="application/ld+json">\n{data}\n</script>'

def mm_ss_iso(t):   # "6:31" → "PT6M31S"
    m, s = t.split(':'); return f'PT{int(m)}M{int(s)}S'

poster_abs = SITE_URL + FEATURE['poster']
gallery_meta = head_meta(SITE_URL, f'Lemo-Opuscar · {n_all} film styles for Claude Code, made in code', GALLERY_DESC, poster_abs,
                         [{'@type': 'CollectionPage', '@id': SITE_URL, 'url': SITE_URL, 'name': 'Lemo-Opuscar gallery', 'description': GALLERY_DESC,
                           'about': {'@id': REPO_URL}, 'author': {'@id': AUTHOR['@id']}, 'hasPart': {'@id': FILM_URL}}, REPO_LD, AUTHOR])
film_meta = head_meta(FILM_URL, 'OPUSCAR 98 · 98 Years of Best Picture, made in code by Claude Opus 5.5', FILM_DESC, poster_abs,
                      [{'@type': 'VideoObject', '@id': FILM_URL, 'url': FILM_URL, 'name': 'OPUSCAR 98 · 98 Years of Best Picture',
                        'description': FILM_DESC, 'thumbnailUrl': poster_abs, 'uploadDate': '2026-09-29', 'duration': mm_ss_iso(FEATURE['dur']),
                        'contentUrl': FEATURE['full'], 'embedUrl': FILM_URL, 'inLanguage': 'en', 'creator': {'@id': AUTHOR['@id']},
                        'isBasedOn': {'@id': REPO_URL}}, REPO_LD, AUTHOR])

def fill(name, extra):
    page = open(os.path.join(HERE, name), encoding='utf-8').read()
    for k, v in {**extra, '{{N_ALL}}': str(n_all), '{{N_VID}}': str(n_vid), '{{N_CAT}}': str(len(cats)), '{{MIN}}': f'{minutes:.0f}',
                 '{{REPO_URL}}': REPO_URL, '{{REPO}}': REPO, '{{FEATURE_FULL}}': FEATURE['full'], '{{FEATURE_DUR}}': FEATURE['dur']}.items():
        page = page.replace(k, v)
    return page

out_dir = site or HERE
os.makedirs(os.path.join(out_dir, 'opuscar98'), exist_ok=True)
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(fill('template.html', {
    '{{LAUREL}}': laurel_symbol(), '{{SECTIONS}}': '\n'.join(sections), '{{TABS}}': ''.join(tabs),
    '{{DESC}}': html.escape(GALLERY_DESC), '{{HEAD_META}}': gallery_meta,
    '{{FEATURE_POSTER}}': FEATURE['poster'], '{{FEATURE_SRC}}': FEATURE['src']}))
# The 98 styles of OPUSCAR 98, listed under the film on its page: styleboard/opuscar98_styles.json (written from the production
# archive in promo/opuscar98, which is not in the repo) + one frame per film in styleboard/img/opuscar98/<no>.jpg.
BOOK = json.load(open(os.path.join(HERE, 'opuscar98_styles.json'), encoding='utf-8'))

def stylebook():
    """(decade filter buttons, one <article> per film). Every text comes in both languages; the page shows one (data-lang)."""
    e = html.escape
    def L(en, zh, tag='span'):
        return f'<{tag} lang="en">{e(en)}</{tag}><{tag} lang="zh-CN">{e(zh)}</{tag}>'
    def hexes(t):   # colour codes in a prompt get a swatch
        return re.sub(r'#[0-9A-Fa-f]{6}\b', lambda m: f'<code><i style="background:{m[0]}"></i>{m[0]}</code>', e(t))
    def tc(t): return f'{int(t // 60)}:{int(t % 60):02d}'
    chs = {c['id']: c for c in BOOK['chapters']}
    TONE = {'B&W': '黑白', 'Sepia': '棕褐', 'B&W screen': '黑白屏幕'}
    def kind(dim):   # "2D·B&W" → ("2D", "B&W"); "2D (B&W screen)" → ("2D", "B&W screen")
        k = re.match(r'[\d.]+D', dim)[0]; return k, dim[len(k):].strip(' ·()')
    KIND_TIP = {'2D': ('Drawn flat, in layers', '平面绘制，分层'), '2.5D': ('3D models rendered into flat 2D layers', '3D 模型渲染进 2D 平面图层'),
                '3D': ('A real 3D scene and camera', '真 3D 场景和机位')}
    def short(y):   # "1950–1959" → "1950s", "1927–1938" → "1927–38"
        a, b = y.split('–'); return f'{a}s' if a.endswith('0') and b.endswith('9') and a[:3] == b[:3] else f'{a}–{b[2:]}'
    buttons = ['<button type="button" data-ch="all" class="on"><b>98</b>' + L('All films', '全部') + '</button>']
    buttons += [f'<button type="button" data-ch="{c["id"]}" title="{e(c["en"])} · {e(c["zh"])}"><b>{short(c["years"])}</b>{L(c["en"], c["zh"])}</button>'
                for c in BOOK['chapters']]
    n_kind = {k: sum(kind(f['dim'])[0] == k for f in BOOK['films']) for k in KIND_TIP}
    kinds = '<button type="button" data-k="all" class="on">' + L('All', '全部') + '</button>' + ''.join(
        f'<button type="button" data-k="{k}" title="{e(KIND_TIP[k][0])} · {e(KIND_TIP[k][1])}">{k}<small>{n_kind[k]}</small></button>' for k in KIND_TIP)
    arts, last = [], None
    for f in BOOK['films']:
        if f['chapter'] != last:
            c = chs[f['chapter']]; last = f['chapter']
            arts.append(f'<h3 class="decade" data-ch="{c["id"]}">{L(c["en"], c["zh"])}<small>{e(c["years"])}</small></h3>')
        no = f['no']; k, tone = kind(f['dim'])
        badge = (f'<span class="kind" data-k="{k}" title="{e(KIND_TIP[k][0])} · {e(KIND_TIP[k][1])}">{k}'
                 + (f'<small>{L(tone, TONE[tone])}</small>' if tone else '') + '</span>')
        q = ' '.join([f['title'], f['zh'], f['year'], f'no.{no}', k.lower(), f['style_en'], f['style_zh'], *f['blend_en'], *f['blend_zh'], *f['refs']]).lower()
        shots = ''.join(f'<li><p class="cam"><b>{e(s["cam"])}</b><i>{s["sec"]:.1f}s</i></p>{L(s["en"], s["zh"], "p")}</li>' for s in f['shots'])
        arts.append(
            f'<article class="film" id="no-{no}" data-ch="{f["chapter"]}" data-k="{k}" data-tone="{e(tone)}" data-t0="{f["t0"]}" data-dur="{f["dur"]}" data-q="{e(q)}">\n'
            f' <button class="shot" type="button" data-t="{f["t0"]}" aria-label="Play No.{no} in the film">'
            f'<img loading="lazy" decoding="async" width="960" height="400" src="../img/opuscar98/{no:02d}.jpg" '
            f'alt="No.{no} {e(f["title"])} ({f["year"]}) in OPUSCAR 98, {e(f["style_en"])}"><span class="tc">▶ {tc(f["t0"])}</span></button>\n'
            f' <div class="txt">\n'
            f'  <p class="meta"><a class="no" href="#no-{no}">No.{no}</a><span>{e(f["year"])}</span>'
            f'<button class="qcopy copy-btn" type="button" title="Copy the style prompt · 复制风格提示词">{L("Copy prompt", "复制提示词")}</button></p>\n'
            f'  <h4>{e(f["title"])}<small>{e(f["zh"])}</small></h4>\n'
            f'  <p class="style">{badge}{L(f["style_en"], f["style_zh"])}</p>\n'
            f'  <ul class="blend">' + ''.join(f'<li>{L(a, b)}</li>' for a, b in zip(f['blend_en'], f['blend_zh'])) + '</ul>\n'
            f'  <p class="desc">{L(f["desc_en"], f["desc_zh"])}</p>\n'
            f'  <details><summary>{L("Style prompt", "风格提示词")}</summary>'
            f'<div class="prompt"><p lang="en">{hexes(f["prompt_en"])}</p><p lang="zh-CN">{hexes(f["prompt_zh"])}</p><button class="copy copy-btn" type="button">{L("Copy", "复制")}</button></div></details>\n'
            f'  <details><summary>{L("Shots & direction", "镜头与导演编排")}</summary><ol class="shots">{shots}</ol>'
            f'<p class="dir">{L(f["direction_en"], f["direction_zh"])}</p>'
            f'<p class="refs">{L("References: ", "对标：")}{e(" · ".join(f["refs"]))}</p></details>\n'
            f' </div>\n</article>')
    return ''.join(buttons), kinds, '\n'.join(arts)

book_tabs, book_kinds, book_films = stylebook()
# OPUSCAR 98 has its own page (one level down, so its relative paths start with ../)
open(os.path.join(out_dir, 'opuscar98', 'index.html'), 'w', encoding='utf-8').write(fill('opuscar98.html', {
    '{{DESC}}': html.escape(FILM_DESC), '{{HEAD_META}}': film_meta,
    '{{FEATURE_POSTER}}': '../' + FEATURE['poster'], '{{FEATURE_SRC}}': '../' + FEATURE['src'],
    '{{BOOK_TABS}}': book_tabs, '{{BOOK_KINDS}}': book_kinds, '{{BOOK_FILMS}}': book_films}))
# the same list as data, for anyone (or any agent) who wants all 98 prompts at once (site only: locally the source sits next door)
if site: shutil.copy(os.path.join(HERE, 'opuscar98_styles.json'), os.path.join(out_dir, 'opuscar98', 'styles.json'))

def llms_txt():
    """llms.txt (llmstxt.org): what the project is, where the upstream repo is, and a link per style."""
    out = ['# Lemo-Opuscar', '',
           f'> {n_all} film styles for Claude Code. Each style is a reusable style prompt (STYLE.md) plus a short demo film made entirely in code '
           'by Claude Opus 5.5, with no video model. Install it as a Claude Code skill, pick a style, bring your own topic, and your agent directs the film.', '',
           f'Official repository: {REPO_URL} (by Lemomo, https://x.com/lemomo_ai). Forks are copies; this is the upstream.', '',
           '## Start here', '',
           f'- [README]({BLOB_URL}/README.md): what it is, how to install the skill, the style grid',
           f'- [README in Chinese]({BLOB_URL}/README.zh-CN.md): the same in Simplified Chinese',
           f'- [Agent instructions]({BLOB_URL}/AGENTS.md): how an agent directs a film in one of the styles',
           f'- [Gallery]({SITE_URL}): every style with its demo film',
           f'- [OPUSCAR 98]({FILM_URL}): 98 Years of Best Picture ({FEATURE["dur"]}), the feature film made with these tools',
           f'- [OPUSCAR 98, all 98 styles]({FILM_URL}#styles): per film the style, a reusable style prompt, and the shots and direction '
           f'(as JSON: {FILM_URL}styles.json)', '']
    for cn, en in cats:
        group = [x for x in styles if x['cat'] == cn and x['stylemd']]
        if not group: continue
        out += [f'## {en}', '']
        out += [f'- [{s["en"]} · {s["cn"]}]({BLOB_URL}/styles/{s["slug"]}/STYLE.md): {s["line"]}' for s in group]
        out.append('')
    return '\n'.join(out)

if site:   # Pages site: pages + style frames + posters + llms.txt + sitemap
    shutil.copytree(os.path.join(HERE, 'img'), os.path.join(site, 'img'), dirs_exist_ok=True)
    os.makedirs(os.path.join(site, 'posters'), exist_ok=True)
    for s in styles:
        if s['poster']: shutil.copy(os.path.join(ROOT, 'styles', s['slug'], 'poster.jpg'), os.path.join(site, 'posters', s['slug'] + '.jpg'))
    open(os.path.join(site, 'llms.txt'), 'w', encoding='utf-8').write(llms_txt())
    open(os.path.join(site, 'sitemap.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in (SITE_URL, FILM_URL)) + '</urlset>\n')


def readme_grid(zh):
    """README.md (English) and README.zh-CN.md (Chinese, with the English name under it), between <!-- styles:start --> and <!-- styles:end -->:
    image grid by category (docs/frames/<slug>.jpg)."""
    out = []
    for cn, en in cats:
        group = [x for x in styles if x['cat'] == cn and x['stylemd']]
        if not group: continue
        out.append(f'\n### {cn if zh else en}\n\n<table>')
        for i in range(0, len(group), 3):
            out.append('<tr>')
            for s in group[i:i + 3]:
                if zh:
                    name = f'<b>{html.escape(s["cn"])}</b>' + (f'<br>{html.escape(s["en"])}' if s['cn'] != s['en'] else '')
                    alt, line = s['cn'], s['line_cn']
                else:
                    name, alt, line = f'<b>{html.escape(s["en"])}</b>', s['en'], s['line']
                out.append(f'<td width="33%" valign="top"><a href="styles/{s["slug"]}/STYLE.md"><img src="docs/frames/{s["slug"]}.jpg" alt="{html.escape(alt)}"></a><br>'
                           f'{name}<br><i>{html.escape(s["film"])}</i><br><sub>{html.escape(line)}</sub></td>')
            out.append('</tr>')
        out.append('</table>')
    return '\n'.join(out) + '\n'


for fn, zh in (('README.md', False), ('README.zh-CN.md', True)):
    p = os.path.join(ROOT, fn)
    if not os.path.exists(p) or site: continue
    t = open(p, encoding='utf-8').read()
    t2 = re.sub(r'(<!-- styles:start -->\n).*?(<!-- styles:end -->)', lambda m: m.group(1) + readme_grid(zh) + m.group(2), t, flags=re.S)
    t2 = re.sub(r'<!--n-->\d+<!--/n-->', f'<!--n-->{sum(1 for x in styles if x["stylemd"])}<!--/n-->', t2)    # the headline count
    if t2 != t: open(p, 'w', encoding='utf-8').write(t2)


def style_index():
    """styles/README.md: style name (English / Chinese) → folder. Agents look up the STYLE.md for the name a user gives here."""
    out = ['# Style index · 风格索引', '',
           'Users may name a style in English, in Chinese, or by its folder. Find it here, then read `styles/<folder>/STYLE.md`.',
           '用户可能用英文名、中文名或文件夹名来指定风格。在这里查到文件夹，再读 `styles/<文件夹>/STYLE.md`。', '<!-- generated by styleboard/build.py from styles/*/style.json; do not edit by hand -->', '']
    for cn, en in cats:
        group = [x for x in styles if x['cat'] == cn and x['stylemd']]
        if not group: continue
        out += [f'## {en} · {cn}', '', '| Style | 风格 | Folder | Our demo |', '|---|---|---|---|']
        out += [f'| {s["en"]} | {s["cn"]} | [`{s["slug"]}`]({s["slug"]}/STYLE.md) | *{s["film"]}* |' for s in group]
        out.append('')
    return '\n'.join(out)


def style_list():
    """AGENTS.md, between <!-- style-list:start --> and <!-- style-list:end -->: the full list an agent shows a user who has not picked a style."""
    out = [f'All {sum(1 for x in styles if x["stylemd"])} styles · 全部风格:', '']
    for cn, en in cats:
        group = [x for x in styles if x['cat'] == cn and x['stylemd']]
        if not group: continue
        names = ', '.join(s['en'] if s['cn'] == s['en'] else f'{s["cn"]} {s["en"]}' for s in group)
        out.append(f'- **{cn} {en}** ({len(group)}): {names}')
    return '\n'.join(out) + '\n'


if not site:
    open(os.path.join(ROOT, 'styles', 'README.md'), 'w', encoding='utf-8').write(style_index())
    p = os.path.join(ROOT, 'AGENTS.md')
    t = open(p, encoding='utf-8').read()
    t2 = re.sub(r'(<!-- style-list:start -->\n).*?(<!-- style-list:end -->)', lambda m: m.group(1) + style_list() + m.group(2), t, flags=re.S)
    if t2 != t: open(p, 'w', encoding='utf-8').write(t2)

print(f'{len(styles)} styles ({n_vid} with film, {minutes:.0f} min) → {os.path.relpath(os.path.join(out_dir, "index.html"), ROOT)}')
for s in styles:
    if not s['imgs']: print('  no image:', s['slug'])
    if not s.get('line'): print('  no card copy (style.json line):', s['slug'])
