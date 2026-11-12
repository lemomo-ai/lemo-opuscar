# The Workbench (电影工坊), the site's home page: English at <site>/index.html, Chinese at <site>/zh/index.html. Called by pages.py's
# build_site() (python3 styleboard/build.py --site …). Markup, words and fonts only: the long take it scrubs (frames, station stills,
# cards' thumbnails and clips, media/manifest.json) is in the site's media (tools/site_media.sh); the pages under the bench are pages.py's.
# The old site's anchors (#painting-illustration, #how, #<slug> …) land on the
# right station (app.js; styleboard/anchors.json, shared with the README). Design rules: styleboard/DESIGN.md.
# Needs fontTools and brotli for the font subsets (pip install fonttools brotli).
import html, json, os, re, sys
sys.dont_write_bytecode = True

E = html.escape
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import site_config as C
import gallery as G                                                       # words shared with the README and the old site

LIVE = C.SITE_URL     # canonical and share addresses; every link on the pages themselves is relative
STARS = ''           # the repository's star count for the top bar ("6.1k"); pages.build_site() reads it once per build
REPO_URL = C.REPO_URL

# Font sources (all SIL OFL 1.1): Source Serif 4, Source Sans 3, Noto Serif SC and Noto Sans SC through styleboard/fonts/fetch.py (pinned to
# one google/fonts commit, downloaded once). The subsets and the licences land in <site>/fonts/ at every build.
FDIR = os.path.join(HERE, 'fonts')


def font_src(k):
    sys.path.insert(0, FDIR)
    from fetch import path
    return path({'serif': 'SourceSerif4', 'serif-i': 'SourceSerif4Italic', 'sans': 'SourceSans3', 'sans-i': 'SourceSans3Italic',
                 'serif-sc': 'NotoSerifSC', 'sans-sc': 'NotoSansSC'}[k])


FONT_OFL = {k: os.path.join(FDIR, f'OFL-{k}.txt') for k in ('SourceSerif4', 'SourceSans3', 'NotoSerifSC', 'NotoSansSC')}
LATIN = ''.join(chr(c) for c in range(0x20, 0x7f)) + ' ©®°±·×é–—‘’“”…→←↑↓′″€£¥¢§¶•'

# ---------------------------------------------------------------- words
# (English, 中文). Reused from styleboard/gallery.py where the old site had the same thing; new lines are short and plain.
T = {
    'title': ('Lemo-Opuscar · The Workbench: {n} film styles for your coding agent', 'Lemo-Opuscar · 电影工坊：{n} 种影片风格'),
    'desc': ('A library of {n} film styles for Claude Code and other coding agents. Walk the bench: {c} stations, one per category, each with a short film made entirely in code.',
             '{n} 种影片风格，给 Claude Code 等编程 agent 用。沿着工作台走一遍：{c} 个工位，一类一个，每种风格都配一支完全用代码做成的短片。'),
    'house': ('The Workbench', '电影工坊'),
    'skip': ('Skip to the first station', '跳到第一个工位'),
    'search_ph': ('Search {n} styles', '搜索 {n} 种风格'),
    'search_label': ('Search styles, films and uses', '搜风格、片名、用途'),
    'search_hint': ('↑ ↓ choose · Enter go to it on the bench · Esc close', '↑ ↓ 选择 · Enter 去台上找它 · Esc 关闭'),
    'search_empty': ('No style matches.', '没有匹配的风格。'),
    'search_station': ('Station', '工位'),
    'search_go': ('Go to the station', '去这个工位'),
    'lang_other': ('中文', 'EN'),
    'hero_meta': ('{n} film styles', '{n} 种影片风格'), 'hero_meta2': ('{c} stations', '{c} 个工位'),
    'hero_h1': ('Pick a style.<br>Bring your story.<br><em>Your agent makes the film.</em>', '拍一个属于<br><em>你自己的电影</em>'),
    'hero_lead': ('A library of {n} film styles for Claude Code and other coding agents, each with a short film made entirely in code.',
                  '{n} 个风格，{n} 种创意。挑一个风格，讲你的故事，片子交给 Claude 拍。'),
    'cue': ('Scroll to walk the bench', '往下滚，沿着工作台走一遍'),
    'toc': ('Contents', '目录'), 'toc_meta': ('{c} stations · {n} styles', '{c} 个工位 · {n} 种风格'),
    'toc_go': ('Go to station {nn}, {name}: {count} styles', '去工位 {nn}「{name}」，{count} 种风格'),
    'station': ('Station', '工位'),
    'n_styles': ('{n} styles', '{n} 种风格'),
    'new': ('New', '新'),
    'card_label': ('{name}, for {film}, {dur}', '{name}，《{film}》，{dur}'),
    'rail': ('Stations', '工位'),
    'next': ('Next', '下一站'),
    'end': ('End of the bench', '台子尽头'),
    'feat_eyebrow': ('Feature presentation', '特别放映'),
    'feat_sub': ('98 Years of Best Picture · 1927–2025 · {dur}', '98 年最佳影片 · 1927–2025 · {dur}'),
    'feat_p': ('One Clawd walks through all 98 Best Picture winners, each one redrawn in a style that fits the film. Every frame, note and cut was written in code by Claude Opus 5.5.',
               '一个 Clawd 走过 98 部最佳影片，每一部都换成贴合那部电影的画风。每一帧、每个音符、每一刀剪辑，都是 Claude Opus 5.5 写代码做出来的。'),
    'feat_watch': ('Watch the film', '看这支片'), 'feat_styles': ('All 98 styles and prompts', '98 种风格和提示词'),
    'close': ('Close', '关闭'),
    'nav': ('The site', '本站'), 'nav_thanks': ('Thank-you films', '感谢片'), 'menu': ('Menu', '菜单'),
    'gh_stars': ('GitHub, {n} stars', 'GitHub，{n} 颗星'),
    'foot_made': ('Made by LemoLab × Claude Opus 5.5', 'LemoLab × Claude Opus 5.5 出品'),
    'foot_repo': ('Source', '源码'), 'foot_top': ('Back to the start', '回到开头'),
    'hero_alt': ('A long workbench at night; in front, a line of wood type set as OPUSCAR', '夜里的长工作台，近处一行木活字排着 OPUSCAR'),
    'still_alt': ('Station {nn}, {name}: the bench under its lamp', '工位 {nn} {name}：灯下的台面'),
    'finale_alt': ('A projector at the end of the bench throws OPUSCAR 98 on the wall', '台子尽头，放映机把 OPUSCAR 98 投在墙上'),
    'loading': ('Loading the bench', '正在铺台面'),
    'o98_watch': ('Play OPUSCAR 98', '播放 OPUSCAR 98'),
}

# One hairline note per station: `at` is the dot on the thing (CSS px in the 1280x720 stop frame). Every note follows one rule: a 22-px
# leader up and to the right, the words sitting on its end (app.js placeNote), so pick a point whose upper right is dark and plain and
# stays inside x 520-1200, y 110-640 (what any window 1280-1920 wide shows right of the column and under the top bar).
# One exception, down=True (03: the sketchbook fills the space above it): the words hang down and to the right, on the plain table.
# Only stations whose still is in and was checked by eye; the others get theirs when frames/sNN.png arrives.
NOTES = {
    1: dict(zh='胶片接到一半，胶带还没压平', en='a splice half made, the tape not yet pressed', at=(826, 374)),
    2: dict(zh='刚挤出来的颜料还是湿的', en='fresh paint, still wet on the palette', at=(720, 382)),
    3: dict(zh='速写本写到最后一行', en='the sketchbook, written to the last line', at=(700, 565), down=True),
    4: dict(zh='墨刚研好，墨锭还湿着', en='ink just ground; the stick is still wet', at=(945, 330)),
    5: dict(zh='刻好的版，字和画都是反的', en='the block, cut in reverse', at=(760, 360)),
    6: dict(zh='手托里的铅字是倒着排的', en='type in the stick, set upside down', at=(700, 395)),
    7: dict(zh='红笔刚画到一半', en="the plotter's red line, half drawn", at=(978, 318)),
    8: dict(zh='原画只清线到领口', en='the key drawing, cleaned up to the collar', at=(860, 250)),
    9: dict(zh='掌机里正打到一半', en='the handheld, mid-battle', at=(800, 220)),
    10: dict(zh='黑片头刮到一半', en='black leader, scratched halfway', at=(745, 520)),
    11: dict(zh='显像管里是 1-bit 点阵的月亮', en='a one-bit moon on the tube', at=(945, 250)),
    12: dict(zh='傅里叶方波，弯进两根灯管', en='a square wave, bent in neon', at=(990, 290)),
    13: dict(zh='玻璃罩下长出来的岛', en='the island that grew, under glass', at=(835, 262)),
    14: dict(zh='灯台上铺着反转片和幻灯片', en='transparencies and slides on the light pad', at=(760, 362)),
    15: dict(zh='图钉之间拉着红线', en='red thread between the pins', at=(830, 420)),
}

# The finale's projected picture, as a box in the 1280x720 frame (frames/finale.png): clicking it plays the film.
FINALE_SCREEN = (566, 92, 1180, 448)


def legacy(data):
    """the old site's anchors → 'sNN' (a station), 'top' (the first screen and its contents), 'opuscar98' or 'style:<slug>' (its station,
    the card lit). Categories and their older names come from styleboard/anchors.json (build.py writes it; the README uses the same table)."""
    out = {k: v for k, v in json.load(open(os.path.join(HERE, 'anchors.json'), encoding='utf-8')).items() if not k.startswith('_')}
    for k in ('styles', 'categories', 'all', 'how', 'install', 'say', 'main', 'top', 'tabs', 'more-h', 'laurel'): out[k] = 'top'
    out['new'] = 'top'; out['feature'] = out['opuscar98'] = 'opuscar98'   # #new used to show the newest; now the contents at the top
    for s in data['styles']: out[s['slug']] = 'style:' + s['slug']
    return out


def mmss(d):
    d = int(round(float(d)))
    return f'{d // 60}:{d % 60:02d}'


def nav(t, home, lang, here=''):
    """the top bar's links, the same on every page: OPUSCAR 98, the thank-you films, the repository with its stars; `home` is this
    language's root ('', 'zh/', '../', '../../zh/' …), `lang` the language switch's markup. On phones they fold into a menu with the
    switch (the bar keeps the mark and search)."""
    gh = (f'<a class="gh" href="{REPO_URL}" rel="noopener"' + (f' aria-label="{E(t("gh_stars", n=STARS))}"' if STARS else '')
          + f'>GitHub{f"<span>★ {STARS}</span>" if STARS else ""}</a>')
    cur = lambda k: ' aria-current="page"' if here == k else ''
    links = (f'<a href="{home}opuscar98/"{cur("o98")}>OPUSCAR 98</a><a href="{home}thanks/"{cur("thanks")}>{E(t("nav_thanks"))}</a>{gh}')
    mlang = lang.replace(' class="lang"', ' class="lang-m"')   # the switch again, inside the phone's menu
    return (f' <nav class="links" aria-label="{E(t("nav"))}">{links}</nav>\n'
            f' <details class="menu"><summary aria-label="{E(t("menu"))}"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 9h14M2 13h14"/></svg></summary>'
            f'<div class="mp">{links}{mlang}</div></details>\n')


def credits(t, zh, top='#top'):
    """who made it and where it lives: the end of the bench (they were each page's footer). One line, with no licence line and no
    other projects: the licence is in the README and the repository's LICENSE, and each style page has its own licence row"""
    w = lambda k, **kw: G.UI[k][1 if zh else 0].format(**kw)
    repo = f'<a href="{REPO_URL}" rel="noopener">github.com/{C.REPO}</a>'
    return (f'  <p class="foot"><span>{E(t("foot_made"))}</span><span>{w("foot_official", repo=repo)} '
            f'{"（" if zh else "("}<a href="https://x.com/lemomo_ai" rel="noopener">@lemomo_ai</a>{"）" if zh else ")"}</span>'
            f'<a href="{top}" class="totop">{E(t("foot_top"))}</a></p>\n')


BENCH = json.load(open(os.path.join(HERE, 'bench.json'), encoding='utf-8'))


def on_bench(n, slugs):
    """the category's slugs whose props stand on the bench at station n (styleboard/bench.json), in the order the scene names them"""
    return [x for x in BENCH.get(f'{n:02d}', []) if x in slugs]


class Page:
    def __init__(self, data, zh, media):
        self.d, self.zh, self.media = data, zh, media   # media: pages.media_meta(), for the screening room's player
        self.S = {s['slug']: s for s in data['styles']}
        self.n, self.c = len(data['styles']), len(data['categories'])
        self.R = '../' if zh else ''

    def t(self, k, **kw):
        s = T[k][1 if self.zh else 0]
        return s.format(**kw) if kw else s

    def name(self, s): return s['cn'] if self.zh else s['en']
    def film(self, s): return (s.get('film_cn') or s['film']) if self.zh else s['film']
    def cname(self, c): return c['cn'] if self.zh else c['en']
    def page(self, slug): return f'{self.R}{"zh/" if self.zh else ""}styles/{slug}/'

    def picture(self, stem, alt, cls='still', eager=False, sizes='100vw'):
        m = f'{self.R}media/still/{stem}'
        lazy = '' if eager else ' loading="lazy"'
        pri = ' fetchpriority="high"' if eager else ''
        return (f'<picture class="{cls}"><source type="image/avif" srcset="{m}-1280.avif 1280w, {m}-1920.avif 1920w, {m}-2560.avif 2560w" sizes="{sizes}">'
                f'<img src="{m}-1920.webp" srcset="{m}-1280.webp 1280w, {m}-1920.webp 1920w, {m}-2560.webp 2560w" sizes="{sizes}" '
                f'width="1920" height="1080" alt="{E(alt)}" decoding="async"{lazy}{pri}></picture>')

    # ------------------------------------------------------------ parts
    def head(self):
        other = '' if self.zh else 'zh/'
        langs = (f'<link rel="alternate" hreflang="en" href="{LIVE}"><link rel="alternate" hreflang="zh-CN" href="{LIVE}zh/">'
                 f'<link rel="alternate" hreflang="x-default" href="{LIVE}">')
        # language: a saved choice wins; otherwise a zh* browser on the English page goes to /zh/. Mode: film (scrub the long take) or stack.
        boot = ("(function(){var d=document.documentElement,s;try{s=localStorage.getItem('opuscar-lang')}catch(e){}"
                + ("if(s==='en'){location.replace('../'+location.search+location.hash);return}" if self.zh else
                   "var l=(navigator.languages&&navigator.languages[0])||navigator.language||'';"
                   "if(s==='zh'||(!s&&/^zh/i.test(l))){location.replace('zh/'+location.search+location.hash);return}")
                + "var q=new URLSearchParams(location.search).get('mode'),c=navigator.connection,"
                  "f=q?q==='film':matchMedia('(min-width: 1024px) and (min-height: 560px)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!(c&&c.saveData);"
                  "d.className=(f?'film':'stack')+(/[?&]grain=0/.test(location.search)?' nograin':'')})();")
        R = self.R
        return (f'<!doctype html>\n<html lang="{"zh-CN" if self.zh else "en"}" data-root="{R}">\n<head>\n<meta charset="utf-8">\n'
                f'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                f'<title>{E(self.t("title", n=self.n))}</title>\n<meta name="description" content="{E(self.t("desc", n=self.n, c=self.c))}">\n'
                f'<meta name="theme-color" content="#0c0a09"><meta name="color-scheme" content="dark">\n'
                f'<link rel="canonical" href="{LIVE}{"zh/" if self.zh else ""}">{langs}\n' + self.share() + '\n'
                f'<script>{boot}</script>\n'
                f'<link rel="preload" href="{R}fonts/source-serif-4.woff2" as="font" type="font/woff2" crossorigin>\n'
                + (f'<link rel="preload" href="{R}fonts/noto-serif-sc-600.woff2" as="font" type="font/woff2" crossorigin>\n' if self.zh else '')
                + f'<link rel="stylesheet" href="{R}assets/app.css">\n<link rel="stylesheet" href="{R}assets/player.css">\n'
                f'<script defer src="{R}assets/engines.js"></script><script defer src="{R}assets/player.js"></script><script defer src="{R}assets/app.js"></script>\n'
                f'<link rel="icon" href="{R}assets/favicon.svg" type="image/svg+xml">\n</head>\n')

    def share(self):
        """share card (GitHub's social preview, docs/social.jpg, at img/social.jpg) and JSON-LD: the styles as a list, the repository, its author"""
        import pages as P
        url, img = LIVE + ('zh/' if self.zh else ''), LIVE + 'img/social.jpg'
        title, desc = self.t('title', n=self.n), self.t('desc', n=self.n, c=self.c)
        ld = [{'@type': 'CollectionPage', '@id': url, 'url': url, 'name': 'Lemo-Opuscar', 'description': desc, 'inLanguage': 'zh-CN' if self.zh else 'en',
               'about': {'@id': REPO_URL}, 'author': {'@id': P.G.AUTHOR['@id']},
               'mainEntity': {'@type': 'ItemList', 'numberOfItems': self.n, 'itemListElement': [
                   {'@type': 'ListItem', 'position': i + 1, 'name': self.name(self.S[x]), 'url': f'{url}styles/{x}/'}
                   for i, x in enumerate(x for c in self.d['categories'] for x in c['styles'])]}},
              P.Doc(self.zh, '', self.media).repo_ld(), P.G.AUTHOR]
        return ('<meta property="og:type" content="website"><meta property="og:site_name" content="Lemo-Opuscar">'
                f'<meta property="og:locale" content="{"zh_CN" if self.zh else "en_US"}"><meta property="og:locale:alternate" content="{"en_US" if self.zh else "zh_CN"}">\n'
                f'<meta property="og:url" content="{url}"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}">'
                f'<meta property="og:image" content="{img}">\n<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@lemomo_ai">'
                f'<meta name="twitter:title" content="{E(title)}"><meta name="twitter:description" content="{E(desc)}"><meta name="twitter:image" content="{img}">\n'
                '<script type="application/ld+json">\n' + json.dumps({'@context': 'https://schema.org', '@graph': ld}, ensure_ascii=False, indent=1).replace('</', '<\\/') + '\n</script>')

    def top(self):
        other = '../' if self.zh else 'zh/'
        lang = (f'<a class="lang" href="{other}" hreflang="{"en" if self.zh else "zh-CN"}" lang="{"en" if self.zh else "zh-CN"}" '
                f'data-lang="{"en" if self.zh else "zh"}">{self.t("lang_other")}</a>')
        icon = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l4 4"/></svg>'
        return (f'<header class="top">\n <a class="mark" href="#top" aria-label="Lemo-Opuscar">OPUSCAR<small>{E(self.t("house"))}</small></a>\n <i class="rule"></i>\n'
                + nav(self.t, self.R + ('zh/' if self.zh else ''), lang) +
                f' <div class="tr"><button class="search" type="button" aria-haspopup="dialog" aria-controls="find" aria-keyshortcuts="/">{icon}'
                f'<span>{E(self.t("search_ph", n=self.n))}</span><kbd>/</kbd></button>\n'
                f' {lang}</div>\n</header>\n')

    def hero(self):
        return (f'<section class="stop hero on lit near" id="top" data-stop="0" aria-labelledby="h-top">\n'
                f' {self.picture("hero", self.t("hero_alt"), eager=True)}\n'
                f' <div class="ov">\n  <p class="meta"><span>Lemo-Opuscar</span><i></i><b>{E(self.t("hero_meta", n=self.n))}</b><span class="sep">·</span><span>{E(self.t("hero_meta2", c=self.c))}</span></p>\n'
                f'  <h1 id="h-top" class="hero-h">{self.t("hero_h1")}</h1>\n'
                f'  <p class="lead">{re.sub(r"([；。])(?=.)", r"\1<br class=w>", E(self.t("hero_lead", n=self.n)), count=1)}</p>\n'
                f'  <p class="cue" aria-hidden="true"><i></i>{E(self.t("cue"))}</p>\n </div>\n{self.toc()}</section>\n')

    def toc(self):
        """the opening's table of contents: the 15 stations, like the contents page of a catalogue"""
        rows = []
        for c in self.d['categories']:
            nn, k = f'{c["n"]:02d}', len(c['styles'])
            lab = self.t('toc_go', nn=nn, name=self.cname(c), count=k)
            rows.append(f'<li><a href="#s{nn}" data-stop="{c["n"]}" aria-label="{E(lab)}"><b>{nn}</b><span class="nm">{E(self.cname(c))}</span><i></i><span class="c">{k}</span></a></li>')
        return (f' <nav class="toc" aria-labelledby="h-toc">\n  <p class="toc-h"><span id="h-toc">{E(self.t("toc"))}</span><i></i>'
                f'<span>{E(self.t("toc_meta", c=self.c, n=self.n))}</span></p>\n  <ol>{"".join(rows)}</ol>\n </nav>\n')

    def card(self, s):
        nm, fm = self.name(s), self.film(s)
        lab = self.t('card_label', name=nm, film=fm, dur=mmss(s['dur']))
        th = f'{self.R}media/thumb/{s["slug"]}'
        sub = (f'<em lang="en">{E(s["en"])}</em><span>《{E(fm)}》</span>' if self.zh else f'<em>{E(fm)}</em>')
        new = f'<span class="new">{E(self.t("new"))}</span>' if s.get('new') else ''   # one of the newest styles (gallery.NEW): a small mark on the picture
        dur = f'<span class="t">{mmss(s["dur"])}</span>'
        # the length is on the name's line in Chinese, beside the film title in English
        row = (f'<span class="nm">{E(nm).replace(" · ", "&nbsp;· ")}</span>' + (dur if self.zh else ''))   # the dot of "Urban Sketch · Pen & Wash" stays on the first line
        sub = sub if self.zh else sub + dur
        return (f'<li><a class="card" href="{self.page(s["slug"])}" data-slug="{s["slug"]}" aria-label="{E(lab)}" title="{E(nm)}">'
                f'<span class="pic"><img src="{th}-480.webp" srcset="{th}-480.webp 480w, {th}-960.webp 960w" sizes="(min-width: 1024px) 13vw, 46vw" '
                f'width="480" height="270" alt="" loading="lazy" decoding="async">{new}</span>'
                f'<span class="row">{row}</span><span class="sub">{sub}</span></a></li>')

    def station(self, c):
        n = c['n']
        slugs = c['styles']
        bench = on_bench(n, slugs)
        order = bench + sorted((x for x in slugs if x not in bench), key=lambda x: int(self.S[x]['num']))
        nn = f'{n:02d}'
        if self.zh:
            h = f'<h2 id="h-s{nn}"><span class="num">{nn}</span><span class="nm">{E(c["cn"])}</span></h2>\n  <p class="alt" lang="en">{E(c["en"])}</p>'
        else:
            h = f'<h2 id="h-s{nn}"><span class="num">{nn}</span><span class="nm">{E(c["en"])}</span></h2>\n  <p class="alt" lang="zh-CN">{E(c["cn"])}</p>'
        note = ''
        if n in NOTES:
            x = NOTES[n]
            body = f'<b>{E(x["zh"])}</b><i lang="en">{E(x["en"])}</i>' if self.zh else f'<i>{E(x["en"])}</i>'
            note = f'\n  <p class="note{" down" if x.get("down") else ""}" aria-hidden="true" data-at="{x["at"][0]},{x["at"][1]}"><span class="lead-line"></span>{body}</p>'
        return (f'<section class="stop station" id="s{nn}" data-stop="{n}" aria-labelledby="h-s{nn}">\n'
                f' {self.picture("s" + nn, self.t("still_alt", nn=nn, name=self.cname(c)))}\n'
                f' <div class="ov">\n  <p class="meta"><span>{E(self.t("station"))}</span><b>{nn} / {self.c}</b><i></i><span class="cnt" data-all="{E(self.t("n_styles", n=len(slugs)))}">{E(self.t("n_styles", n=len(slugs)))}</span></p>\n'
                f'  {h}\n  <p class="desc">{E(c["desc_cn"] if self.zh else c["desc_en"])}</p>\n'
                f'  <ul class="cards" data-n="{len(order)}">{"".join(self.card(self.S[x]) for x in order)}</ul>{note}\n </div>\n</section>\n')

    def finale(self, top='#top'):
        f = self.d['feature']
        x0, y0, x1, y1 = FINALE_SCREEN
        return (f'<section class="stop finale" id="opuscar98" data-stop="{self.c + 1}" aria-labelledby="h-o98">\n'
                f' {self.picture("finale", self.t("finale_alt"))}\n'
                f' <button class="screen" type="button" data-film="{C.film_url("opuscar98", self.R)}" data-box="{x0},{y0},{x1},{y1}" aria-label="{E(self.t("feat_watch"))}"></button>\n'
                f' <div class="ov">\n  <p class="meta"><span>{E(self.t("feat_eyebrow"))}</span><i></i><span>{E(self.t("end"))}</span></p>\n'
                f'  <h2 id="h-o98" class="o98">OPUSCAR 98<span class="sub">{E(self.t("feat_sub", dur=f["dur"]))}</span></h2>\n'
                f'  <p class="desc">{E(self.t("feat_p"))}</p>\n'
                f'  <p class="acts"><button class="btn primary play" type="button" data-film="{C.film_url("opuscar98", self.R)}">'
                f'<svg viewBox="0 0 14 16" aria-hidden="true"><path d="M0 0l14 8-14 8z"/></svg>{E(self.t("feat_watch"))}<span class="t">{f["dur"]}</span></button>'
                f'<a class="btn" href="{self.R}{"zh/" if self.zh else ""}opuscar98/">{E(self.t("feat_styles"))}</a></p>\n'
                f'  <footer class="end">\n{credits(self.t, self.zh, top)}  </footer>\n </div>\n</section>\n')

    def rail(self):
        k = len(self.d['categories']) - 1
        lis = ''.join(f'<li style="left:{100 * i / k:.4f}%"><a href="#s{c["n"]:02d}" data-stop="{c["n"]}"><i></i><b>{c["n"]:02d}</b><span>{E(self.cname(c))}</span></a></li>'
                      for i, c in enumerate(self.d['categories']))
        return (f'<nav class="rail" aria-label="{E(self.t("rail"))}">\n <ol>{lis}</ol>\n <span class="cam" aria-hidden="true"></span>\n'
                f' <p class="next" aria-hidden="true"></p>\n</nav>\n')

    def find(self):
        icon = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l4 4"/></svg>'
        return (f'<dialog class="find" id="find" aria-label="{E(self.t("search_label"))}">\n <form method="dialog" class="box" role="search">{icon}'
                f'<input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="{E(self.t("search_label"))}" aria-label="{E(self.t("search_label"))}" '
                f'role="combobox" aria-expanded="true" aria-controls="res" aria-autocomplete="list"><kbd>Esc</kbd></form>\n'
                f' <ul id="res" role="listbox" aria-label="{E(self.t("search_label"))}"></ul>\n <p class="hint">{E(self.t("search_hint"))}</p>\n</dialog>\n'
                f'<dialog class="room" id="room" aria-label="OPUSCAR 98">{self.room_player()}'
                f'<button class="x" type="button" aria-label="{E(self.t("close"))}">×</button></dialog>\n')

    def room_player(self):
        """OPUSCAR 98 in the screening room: pages.py's player markup, its chapters inline (the media are pages.py's)"""
        import pages as P
        d = P.Doc(self.zh, '', self.media)
        d.R = self.R
        ch = dict(spans=[s[:4] for s in P.o98_spans(self.zh)], majors=P.o98_majors())
        return (d.player('opuscar98', 'OPUSCAR 98', chapters='ch-o98', download=P.G.FEATURE['full'], preload='none', below=True, sizes='92vw')
                + f'<script type="application/json" id="ch-o98">{json.dumps(ch, ensure_ascii=False, separators=(",", ":"))}</script>')

    def index(self):
        """the search index and the words the script needs, inline (no extra request)"""
        cats = {c['n']: c for c in self.d['categories']}
        cat_of = {s: c['n'] for c in self.d['categories'] for s in c['styles']}
        rows = []
        for c in self.d['categories']:
            for slug in c['styles']:
                s = self.S[slug]
                rows.append([slug, int(s['num']), c['n'], s['cn'], s['en'], self.film(s), s['film'] if self.zh else (s.get('film_cn') or ''),
                             ' '.join(s.get('uses', []) + s.get('uses_cn', [])),   # what it is good for, in words (style.json), not the use tags
                             1 if s.get('new') else 0, mmss(s['dur'])])
        words = {k: self.t(k) for k in ('search_empty', 'search_station', 'search_go', 'new', 'next', 'station', 'end', 'loading')}
        words['legacy'] = legacy(self.d)
        words['cats'] = {c['n']: [c['cn'], c['en']] for c in self.d['categories']}
        return json.dumps(dict(rows=rows, w=words), ensure_ascii=False, separators=(',', ':'))

    def render(self):
        body = (f'<body>\n<a class="skip" href="#s01">{E(self.t("skip"))}</a>\n'
                f'<div class="reel" aria-hidden="true"><canvas id="seq"></canvas></div><div class="grain" aria-hidden="true"></div><div class="scrim" aria-hidden="true"></div><div class="veil" aria-hidden="true"></div>\n'
                + self.top() + '<main id="bench">\n' + self.hero() + ''.join(self.station(c) for c in self.d['categories']) + self.finale() + '</main>\n'
                + self.rail() + self.find()
                + f'<div class="track" aria-hidden="true"></div>\n<p class="loading" aria-live="polite"></p>\n'
                f'<script type="application/json" id="idx">{self.index()}</script>\n</body>\n</html>\n')
        return self.head() + body

    def serif_chars(self):
        """every character set in Noto Serif SC on this page (display roles only; running text uses the system sans)"""
        out = set('电影工坊工位' + re.sub(r'<[^>]+>', '', T['hero_h1'][1]) + '在台上还有种新')
        for c in self.d['categories']: out |= set(c['cn'])
        for s in self.d['styles']: out |= set(s['cn'])
        for x in NOTES.values(): out |= set(x['zh'])
        return out


# ---------------------------------------------------------------- film grain
# The long take is rendered without grain; the page lays it on top instead (one small tile, moved 24 times a second).
# Same recipe as scene/zw/post.py: soft (3-tap) luminance noise plus a quarter of colour noise. Under mix-blend-mode: overlay a
# tile value of 0.5 + d changes a mid-grey pixel by d and a near-black or near-white one by about 2*L*d, which is post.py's
# "mid-tones most" weighting. GRAIN_AMT = 0.011 (LOOK.md) gives d a standard deviation of about 0.009 (2.3 levels of 255).
GRAIN_AMT, GRAIN_TILE = 0.011, 192
OVERLAY_GAIN = 1.35   # overlay falls off faster towards black and white than post.py does; a little more in the tile evens it out (mid-tones 1.35x, L=.3/.7 about 0.8x)


def grain_tile():
    import numpy as np
    from PIL import Image
    rng = np.random.default_rng(5)
    g = rng.standard_normal((GRAIN_TILE, GRAIN_TILE)).astype(np.float32)
    g = (g + np.roll(g, 1, 0) * .5 + np.roll(g, 1, 1) * .5) / 1.6            # wraps round, so the tile repeats seamlessly
    gc = rng.standard_normal((GRAIN_TILE, GRAIN_TILE, 3)).astype(np.float32) * .25
    d = (g[..., None] + gc) * GRAIN_AMT * OVERLAY_GAIN
    a = np.clip(127.5 + d * 255 + rng.uniform(-.5, .5, d.shape), 0, 255).astype(np.uint8)
    p = os.path.join(HERE, 'assets', 'grain.png')   # committed; remake by hand: python3 -c 'import home; home.grain_tile()' in styleboard/
    Image.fromarray(a).save(p, optimize=True)
    print(f'  assets/grain.png            {os.path.getsize(p) / 1024:7.1f} KB')


# ---------------------------------------------------------------- fonts
FEATURES = ['kern', 'liga', 'calt', 'lnum', 'tnum', 'pnum', 'onum', 'case', 'ss01', 'locl', 'ccmp', 'mark', 'mkmk', 'vert', 'halt', 'palt']


def instanced(src, axes):
    """a variable font fixed at axes (wght=600, or a range), kept in styleboard/fonts/fetch.py's cache so each build doesn't instance
    it again (Noto Serif SC takes a while). With fontTools in this Python, in-process; otherwise the fonttools command."""
    sys.path.insert(0, FDIR)
    from fetch import CACHE
    tag = '-'.join(f'{k}{v[0]}_{v[1]}' if isinstance(v, tuple) else f'{k}{v}' for k, v in sorted(axes.items()))
    dst = os.path.join(CACHE, f'{os.path.splitext(os.path.basename(src))[0]}.{tag}.ttf')
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src): return dst
    os.makedirs(CACHE, exist_ok=True)
    tmp = dst + '.part'
    try:
        from fontTools.ttLib import TTFont
        from fontTools.varLib import instancer
        instancer.instantiateVariableFont(TTFont(src), axes).save(tmp)
    except ImportError:
        import subprocess
        spec = [f'{k}={v[0]}:{v[1]}' if isinstance(v, tuple) else f'{k}={v}' for k, v in axes.items()]
        subprocess.run(['fonttools', 'varLib.instancer', src, *spec, '-q', '-o', tmp], check=True)
    os.replace(tmp, dst)
    return dst


def subset(src, dst, text, axes=None, features=FEATURES):
    """a WOFF2 subset of src with just these characters, instanced at axes first (a variable font). With fontTools in this Python,
    in-process; otherwise through the fonttools command line (pip install fonttools brotli puts it on PATH)."""
    import shutil
    if axes: src = instanced(src, axes)
    try:
        from fontTools import subset as fs
        from fontTools.ttLib import TTFont
    except ImportError:
        import subprocess, tempfile
        if not shutil.which('fonttools'): raise SystemExit('home.py: the font subsets need fontTools and brotli (pip install fonttools brotli)')
        with tempfile.TemporaryDirectory() as td:
            tf = os.path.join(td, 't.txt'); open(tf, 'w', encoding='utf-8').write(text)
            subprocess.run(['fonttools', 'subset', src, f'--text-file={tf}', '--flavor=woff2', f'--layout-features={",".join(features)}',
                            '--name-IDs=0,1,2,3,4,5,6', '--notdef-outline', '--no-hinting', '--desubroutinize', '--drop-tables+=meta', f'--output-file={dst}'], check=True)
        return
    f = TTFont(src)
    opt = fs.Options()
    opt.flavor = 'woff2'
    opt.layout_features = features
    opt.name_IDs = [0, 1, 2, 3, 4, 5, 6]
    opt.notdef_outline = True
    opt.hinting = False
    opt.desubroutinize = True
    opt.drop_tables += ['meta']
    sub = fs.Subsetter(opt)
    sub.populate(text=text)
    sub.subset(f)
    f.flavor = 'woff2'
    f.save(dst)


def fonts(out, chars_sc):
    """the faces the pages set, cut to what they show: Latin for Source Serif 4 and Source Sans 3 (labels, times and numbers are Source
    Sans with tabular figures); Noto Serif SC to every character the home page sets in it (pages.py adds a second subset for the pages
    under the bench, and cuts Noto Sans SC, the Chinese running text, once every page is written)"""
    out = os.path.join(out, 'fonts')
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):   # faces the site no longer sets go (this runs first; pages.py adds its files after)
        if f.endswith(('.woff2', '.txt')): os.remove(os.path.join(out, f))
    make = lambda src, dst, text, axes=None: subset(src, os.path.join(out, dst), text, axes)
    make(font_src('serif'), 'source-serif-4.woff2', LATIN, dict(wght=(400, 600)))          # optical sizes 8-60 kept: the browser picks one per size
    make(font_src('serif-i'), 'source-serif-4-italic.woff2', LATIN, dict(wght=400))
    make(font_src('sans'), 'source-sans-3.woff2', LATIN, dict(wght=(400, 600)))
    make(font_src('sans-i'), 'source-sans-3-italic.woff2', LATIN, dict(wght=400))
    make(font_src('serif-sc'), 'noto-serif-sc-600.woff2', ''.join(sorted(chars_sc)) + '·、，。：；！？《》「」（）—…ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', dict(wght=600))
    for k, p in FONT_OFL.items():
        if os.path.exists(p):
            open(os.path.join(out, f'OFL-{k}.txt'), 'w').write(open(p, encoding='utf-8').read())


def build_home(out, data, media):
    """<out>/index.html and <out>/zh/index.html, and the font subsets they need (the Chinese one from every name on the bench)"""
    pages = {'en': Page(data, False, media), 'zh': Page(data, True, media)}
    fonts(out, pages['zh'].serif_chars() | pages['en'].serif_chars())
    for lang, p in pages.items():
        dst = os.path.join(out, 'zh' if lang == 'zh' else '', 'index.html')
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'w', encoding='utf-8').write(p.render())
