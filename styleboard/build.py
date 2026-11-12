# Lemo-Opuscar library data: styles/*/style.json → catalog.json and the generated parts of README.md, README.zh-CN.md, styles/README.md, AGENTS.md;
# with --site, the GitHub Pages site (styleboard/pages.py and home.py: English at /, Chinese at /zh/; design in styleboard/DESIGN.md).
# Local:          python3 styleboard/build.py                 (also refreshes each style.json "dur" from its mp4)
# Site preview:   python3 styleboard/build.py --site _site --films .release/web [--media DIR], then python3 styleboard/serve.py
# GitHub Pages:   python3 styleboard/build.py --site _site --films _site/films --media _media   (pages.yml downloads films and media first)
# README pictures: node styleboard/art/readme.mjs, after this script (docs/readme/: station headers, style cards, covers; see MAINTAINING.md)
import argparse, json, re, html, os, glob, shutil, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
CATALOG = os.path.join(HERE, 'catalog.json')   # generated; CI and tools/release.py read it

# The fifteen categories, in gallery order. A style.json must name one of them (both languages, exactly).
CATEGORIES = [('剪辑纪实', 'Edit & Documentary'), ('绘画插画', 'Painting & Illustration'), ('速写板书', 'Sketch & Board'), ('传统工艺', 'Traditional Crafts'),
              ('印刷版画', 'Print & Printmaking'), ('平面排版', 'Graphic & Type'), ('线稿图解', 'Line Diagrams'), ('卡通动画', 'Cartoons'), ('电子游戏', 'Games'),
              ('胶片录像', 'Film & Tape'), ('屏幕界面', 'Screens & Interfaces'), ('发光线条', 'Light & Lines'), ('立体微缩', '3D & Miniature'),
              ('仪器实证', 'Instruments & Evidence'), ('数据地图', 'Data & Maps')]
FIELDS = ('slug', 'num', 'en', 'cn', 'category_en', 'category_cn', 'film', 'line', 'line_cn', 'uses', 'frame_sec', 'dur')
# optional: film_cn (the demo film's Chinese title; the Chinese site shows it, else the English one), aka, by, needs
NEEDS = {'image-generation': 'an image generator'}   # "needs": what a film in the style requires beyond the library (marked in AGENTS.md and styles/README.md)


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
        aka = j.get('aka', [])   # optional: names the style went by before (English or Chinese), so a user or agent using an old name still finds it
        if not (isinstance(aka, list) and all(isinstance(a, str) and a for a in aka)):
            bad.append(f'styles/{slug}/style.json: "aka" must be a list of names'); aka = []
        needs = j.get('needs', [])
        if not (isinstance(needs, list) and all(n in NEEDS for n in needs)):
            bad.append(f'styles/{slug}/style.json: "needs" must be a list of {", ".join(NEEDS)}'); needs = []
        mp4 = os.path.join(ROOT, 'styles', slug, slug + '.mp4')
        if refresh_dur and os.path.exists(mp4):
            d = film_seconds(mp4)
            if d is None:
                print(f'WARNING: styles/{slug}/{slug}.mp4 exists but ffprobe cannot read its duration (half-rendered? no ffprobe?); keeping dur={j["dur"]}')
            elif round(d, 1) != j['dur']:
                j['dur'] = round(d, 1)
                open(p, 'w', encoding='utf-8').write(json.dumps(j, ensure_ascii=False, indent=1) + '\n')
        out.append(dict(slug=slug, num=j['num'], en=j['en'], cn=j['cn'], cat=j['category_cn'], cat_en=j['category_en'],
                        film=j['film'], film_cn=j.get('film_cn') or j['film'], line=j['line'], line_cn=j['line_cn'], uses=j['uses'], dur=j['dur'], frame_sec=j['frame_sec'],
                        **({'aka': aka} if aka else {}),
                        **({'needs': needs} if needs else {}),
                        **({'by': j['by']} if j.get('by') else {})))   # optional {"name", "url"}: a style contributed from outside, credited on its card and README cell
    if bad: raise SystemExit('styleboard/build.py:\n  ' + '\n  '.join(bad))
    order = {c: i for i, c in enumerate(CATEGORIES)}
    # within a category by num; a style not yet numbered ("num": "", a new style before its release) comes last, by folder
    numbered = lambda s: int(m.group()) if (m := re.match(r'\d+', s['num'])) else 10**6
    out.sort(key=lambda s: (order.get((s['cat'], s['cat_en']), 99), numbered(s), s['num'], s['slug']))
    return out


ap = argparse.ArgumentParser()
ap.add_argument('--site', help='build the GitHub Pages site into this folder')
ap.add_argument('--films', metavar='DIR', help='with --site: a folder of 720p web cuts (<slug>.mp4, opuscar98.mp4, stars<n>.mp4), linked into <site>/films '
                                               '(local preview: .release/web; CI: _site/films, already in place)')
ap.add_argument('--media', metavar='DIR', help='with --site: the site media (made by styleboard/media.py, packed by tools/site_media.sh; '
                                               'default: $OPUSCAR_SITE_MEDIA or site_config.MEDIA)')
args = ap.parse_args()
site = args.site

styles = load_styles(refresh_dur=not site)
if not site:
    json.dump([{k: v for k, v in s.items() if k != 'frame_sec'} for s in styles], open(CATALOG, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

for s in styles:
    s['stylemd'] = os.path.exists(os.path.join(ROOT, 'styles', s['slug'], 'STYLE.md'))
cats = [c for c in CATEGORIES if any((s['cat'], s['cat_en']) == c for s in styles)]
n_vid = sum(bool(s['dur']) for s in styles)
minutes = sum(s.get('dur', 0) for s in styles) / 60

if site:   # the public site lists finished styles only (with a STYLE.md); the pages are styleboard/pages.py's and home.py's
    import pages
    pages.build_site(site, [s for s in styles if s['stylemd']], cats, films=args.films, media=args.media)


SITE_URL = 'https://lemomo-ai.github.io/lemo-opuscar/'
README_ART = json.load(open(os.path.join(HERE, 'art', 'readme.json'), encoding='utf-8'))   # what the README's pictures and this Markdown agree on


def gh_anchor(t):
    """The anchor GitHub gives a heading: lower case, punctuation out, every space a hyphen."""
    return re.sub(r'\s', '-', re.sub(r'[^\w\s-]', '', t.strip().lower()))


def readme_pic(base, zh, alt, width='100%'):
    """One of styleboard/art/readme.mjs's pictures, light or dark after the reader's GitHub theme."""
    d, lang = README_ART['dir'], 'zh' if zh else 'en'
    return (f'<picture><source media="(prefers-color-scheme: dark)" srcset="{d}/{base}-{lang}-dark.webp">'
            f'<source media="(prefers-color-scheme: light)" srcset="{d}/{base}-{lang}-light.webp">'
            f'<img src="{d}/{base}-{lang}-light.webp" width="{width}" alt="{html.escape(alt, quote=False).replace(chr(34), "&quot;")}"></picture>')


def mmss(d):
    """0:52, rounded half up as the cards (styleboard/art/readme.mjs) round it"""
    s = int(d + 0.5) if d else 0
    return f'{s // 60}:{s % 60:02d}' if d else ''


def readme_styles(zh):
    """README.md and README.zh-CN.md, between <!-- styles:start --> and <!-- styles:end -->: a line of contents, then per category (a station
    on the site's workbench) a small heading, its header picture (linked to the station), its one line on the look (CAT_DESC in
    styleboard/gallery.py), one card per style (linked to the style's page) and the names as text. Pictures: styleboard/art/readme.mjs."""
    import gallery
    site = SITE_URL + ('zh/' if zh else '')
    groups = [(n, cn, en, [x for x in styles if x['cat'] == cn and x['stylemd']]) for n, (cn, en) in enumerate(cats, 1)]
    head = lambda n, cn, en: f'{n:02d} · {cn if zh else en}'
    out = [' · '.join(f'**{n:02d}** [{cn if zh else en}](#{gh_anchor(head(n, cn, en))})' for n, cn, en, g in groups if g)]
    for n, cn, en, group in groups:
        if not group: continue
        cols = README_ART['cols_by_count'].get(str(len(group)), README_ART['cols'])
        alt = (f'工位 {n:02d} / {len(cats)}：{cn}，{len(group)} 种风格。点开在网站上看这一站。' if zh else
               f'Station {n:02d} / {len(cats)}: {en}, {len(group)} styles. Opens this station on the site.')
        cards, names = [], []
        for s in group:
            b = s.get('by')
            by = (f'（[@{b["name"]}]({b["url"]}) 提供）' if zh else f' (by [@{b["name"]}]({b["url"]}))') if b else ''
            calt = (f'{s["cn"]}《{s.get("film_cn") or s["film"]}》{mmss(s["dur"])}' + (f'，@{b["name"]} 提供' if b else '') if zh else
                    f'{s["en"]}: {s["film"]} ({mmss(s["dur"])})' + (f', by @{b["name"]}' if b else ''))
            cards.append(f'<a href="{site}styles/{s["slug"]}/">{readme_pic("cards/" + s["slug"], zh, calt, f"{100 / cols:.2f}%")}</a>')
            names.append(f'[{s["cn"] if zh else s["en"]}]({site}styles/{s["slug"]}/){by}')
        old = gh_anchor(cn if zh else en)   # the heading's anchor before the workbench (### Painting & Illustration): old links still land here
        out += [f'###### <a name="{old}"></a>{head(n, cn, en)}', f'<a href="{site}#s{n:02d}">{readme_pic(f"station-{n:02d}", zh, alt)}</a>',
                gallery.CAT_DESC[en][zh],
                ''.join(cards),   # no whitespace between cards: the gutters are inside the pictures, so the grid lines up with the column
                f'<sub>{" · ".join(names)}</sub>']
    return '\n' + '\n\n'.join(out) + '\n'


def readme_thanks(zh):
    """Between <!-- thanks:start --> and <!-- thanks:end -->: the thank-you films (THANKS in styleboard/gallery.py) as cards, in one row."""
    import gallery
    site = SITE_URL + ('zh/' if zh else '')
    w = f'{100 / len(gallery.THANKS):.4g}%'
    return '\n' + ''.join(f'<a href="{site}thanks/#{i}">{readme_pic("thanks/" + i, zh, t[zh] + (f"（{d}）" if zh else f" ({d})"), w)}</a>'
                          for i, d, _, t, _ in gallery.THANKS) + '\n'


def station_anchors():
    """styleboard/anchors.json: the site's old anchors (a category, OLD_ANCHORS in gallery.py) → the workbench's station (#s01…).
    For the site, so links to /#painting-illustration from before still land on their station."""
    import gallery
    ids = {re.sub(r'[^a-z0-9]+', '-', en.lower()).strip('-'): f's{n:02d}' for n, (cn, en) in enumerate(cats, 1)}
    old = {k: ids.get(v, v) for k, v in gallery.OLD_ANCHORS.items() if v in ids or v == 'opuscar98'}
    return {'_doc': 'generated by styleboard/build.py: old site anchor (category id or older name) → new anchor on the workbench site', **ids, **old}


if not site:
    json.dump(station_anchors(), open(os.path.join(HERE, 'anchors.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for fn, zh in (('README.md', False), ('README.zh-CN.md', True)):
    p = os.path.join(ROOT, fn)
    if not os.path.exists(p) or site: continue
    t = open(p, encoding='utf-8').read()
    t2 = re.sub(r'(<!-- styles:start -->\n).*?(<!-- styles:end -->)', lambda m: m.group(1) + readme_styles(zh) + m.group(2), t, flags=re.S)
    t2 = re.sub(r'(<!-- thanks:start -->).*?(<!-- thanks:end -->)', lambda m: m.group(1) + readme_thanks(zh) + m.group(2), t2, flags=re.S)
    t2 = re.sub(r'<!--n-->\d+<!--/n-->', f'<!--n-->{sum(1 for x in styles if x["stylemd"])}<!--/n-->', t2)    # the headline count
    if t2 != t: open(p, 'w', encoding='utf-8').write(t2)


MARK = ' ✦'
NEEDS_NOTE = ("✦ draws with an image generator: the user's Codex CLI, or another image tool they have. "
              'Without one the film cannot start (core/README.md, "Image generation"). Say so when you suggest the style.')


def style_index():
    """styles/README.md: style name (English / Chinese) → folder. Agents look up the STYLE.md for the name a user gives here."""
    out = ['# Style index · 风格索引', '',
           'Users may name a style in English, in Chinese, by a name it had before (Formerly), or by its folder. Find it here, then read `styles/<folder>/STYLE.md`.',
           '用户可能用英文名、中文名、曾用名或文件夹名来指定风格。在这里查到文件夹，再读 `styles/<文件夹>/STYLE.md`。', '<!-- generated by styleboard/build.py from styles/*/style.json; do not edit by hand -->', '']
    for cn, en in cats:
        group = [x for x in styles if x['cat'] == cn and x['stylemd']]
        if not group: continue
        out += [f'## {en} · {cn}', '', '| Style | 风格 | Folder | Our demo | Formerly · 曾用名 |', '|---|---|---|---|---|']
        out += [f'| {s["en"]}{MARK if s.get("needs") else ""} | {s["cn"]} | [`{s["slug"]}`]({s["slug"]}/STYLE.md) | *{s["film"]}* | {" · ".join(s.get("aka", []))} |' for s in group]
        out.append('')
    return '\n'.join(out + [NEEDS_NOTE, ''])


def style_list():
    """AGENTS.md, between <!-- style-list:start --> and <!-- style-list:end -->: the full list an agent shows a user who has not picked a style."""
    out = [f'All {sum(1 for x in styles if x["stylemd"])} styles · 全部风格:', '']
    for cn, en in cats:
        group = [x for x in styles if x['cat'] == cn and x['stylemd']]
        if not group: continue
        names = ', '.join((s['en'] if s['cn'] == s['en'] else f'{s["cn"]} {s["en"]}') + (MARK if s.get('needs') else '') for s in group)
        out.append(f'- **{cn} {en}** ({len(group)}): {names}')
    return '\n'.join(out + ['', NEEDS_NOTE]) + '\n'


if not site:
    open(os.path.join(ROOT, 'styles', 'README.md'), 'w', encoding='utf-8').write(style_index())
    p = os.path.join(ROOT, 'AGENTS.md')
    t = open(p, encoding='utf-8').read()
    t2 = re.sub(r'(<!-- style-list:start -->\n).*?(<!-- style-list:end -->)', lambda m: m.group(1) + style_list() + m.group(2), t, flags=re.S)
    if t2 != t: open(p, 'w', encoding='utf-8').write(t2)

print(f'{len(styles)} styles ({n_vid} with film, {minutes:.0f} min)' + (f' → site in {site}' if site else ' → catalog.json, README stations and cards, styleboard/anchors.json, styles/README.md, AGENTS.md'))
for s in styles:
    if not glob.glob(os.path.join(HERE, 'img', s['slug'] + '_*.jpg')): print('  no gallery card image (styleboard/img/<slug>_0.jpg):', s['slug'])
    if not s.get('line'): print('  no card copy (style.json line):', s['slug'])
