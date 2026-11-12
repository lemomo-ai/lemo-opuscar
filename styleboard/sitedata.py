# The site's data, gathered from the library: build.py's styles (styles/*/style.json) and its CATEGORIES, styleboard/i18n.json
# (use tags, Chinese for the uses, one sentence on each look) and gallery.py (category lines, the "New" line, the feature film).
# One dict for home.py, pages.py and media.py:
#   categories: [{n, id, cn, en, desc_en, desc_cn, styles: [slug, …]}]   the stations, in order; styles by number within each
#   styles:     [{slug, num, cn, en, cat_cn, cat_en, film, film_cn, line, line_cn, dur, about_en, about_cn, uses, uses_cn, new, aka?, by?, needs?}]
# The use tags in i18n.json (tags, tag_of) stay for agents choosing a style; the site doesn't show them.
#   feature:    OPUSCAR 98 (gallery.FEATURE)
import json, os, re
import gallery

HERE = os.path.dirname(os.path.abspath(__file__))


def cat_id(en):
    """'Painting & Illustration' → 'painting-illustration' (as styleboard/anchors.json names the old anchors)"""
    return re.sub(r'[^a-z0-9]+', '-', en.lower()).strip('-')


def site_data(styles, categories):
    """styles: build.py's load_styles(), the published ones (with a STYLE.md); categories: build.CATEGORIES ((中文, English), in order).
    Stops, naming each, when i18n.json lacks the Chinese for one of a style's uses, or its "about" sentence."""
    i18n = json.load(open(os.path.join(HERE, 'i18n.json'), encoding='utf-8'))
    bad, out = [], []
    for s in styles:
        slug = s['slug']
        bad += [f'{slug}: no Chinese for the use "{u}" (i18n.json uses_cn)' for u in s['uses'] if u not in i18n['uses_cn']]
        about = i18n['about'].get(slug)
        if not about: bad.append(f'{slug}: no "about" sentence (i18n.json about)'); about = {'en': s['line'], 'zh': s['line_cn']}
        num = int(m.group()) if (m := re.match(r'\d+', str(s['num']))) else 0
        out.append(dict(slug=slug, num=num, cn=s['cn'], en=s['en'], cat_cn=s['cat'], cat_en=s['cat_en'], film=s['film'], film_cn=s.get('film_cn') or s['film'],
                        line=s['line'], line_cn=s['line_cn'], dur=s['dur'], about_en=about['en'], about_cn=about['zh'],
                        uses=s['uses'], uses_cn=[i18n['uses_cn'].get(u, u) for u in s['uses']], new=s['slug'] in gallery.NEW,
                        **({'aka': s['aka']} if s.get('aka') else {}), **({'by': s['by']} if s.get('by') else {}), **({'needs': s['needs']} if s.get('needs') else {})))
    if bad: raise SystemExit('styleboard/i18n.json is missing site text:\n  ' + '\n  '.join(bad))
    cats = []
    for cn, en in categories:
        group = [s['slug'] for s in out if (s['cat_cn'], s['cat_en']) == (cn, en)]
        if not group: continue
        desc = gallery.CAT_DESC.get(en)
        if not desc: raise SystemExit(f'styleboard/gallery.py: CAT_DESC has no line for "{en}"')
        cats.append(dict(n=len(cats) + 1, id=cat_id(en), cn=cn, en=en, desc_en=desc[0], desc_cn=desc[1], styles=group))
    order = {slug: i for i, slug in enumerate(x for c in cats for x in c['styles'])}   # station order, as the bench walks them
    return dict(categories=cats, styles=sorted(out, key=lambda s: order[s['slug']]), feature=gallery.FEATURE)
