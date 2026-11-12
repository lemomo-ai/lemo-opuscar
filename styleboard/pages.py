# The site (GitHub Pages), in English at / and in Chinese at /zh/, every page with its twin. build_site() is what
# python3 styleboard/build.py --site <dir> --films <dir> --media <dir> runs:
#   index.html          the Workbench: the long take along the bench, one station per category (home.py)
#   styles/<slug>/      one per style: the film on the first screen, its label in the dark, the sheet, back at the bench
#   opuscar98/          the feature: the end of the bench (the projector's frame), the film on the projection, the 98 styles book
#   thanks/             the thank-you films;   404.html: not on the bench (search), both languages in one page
#   sitemap.xml, llms.txt, opuscar98/styles.json, media/search.json, fonts/ (subsets made for these pages)
# It never makes media: they come from --media (media.py makes them; tools/site_media.sh packs them), and a film without its media
# stops the build. The old site's addresses keep working: posters/<slug>.jpg, stills/<slug>-<i>.jpg, img/… (styleboard/img/,
# docs/social.jpg), films/<id>.mp4, assets/favicon.svg, opuscar98/styles.json; its anchors land via styleboard/anchors.json.
# Settings a fork changes: styleboard/site_config.py. Rules: styleboard/DESIGN.md.
import html, json, os, re, shutil, sys
sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import site_config as C
import gallery as G                                                       # words the old site had, install lines, the thank-you films, links
import home as B                                                          # styleboard/home.py: the home page, words, card and picture markup, fonts
import media as M                                                         # styleboard/media.py: where the media are, the label measures

E = html.escape
ROOT = C.ROOT
OUT = '_site'                                                             # build_site() sets it
DATA, CAT, ORDER = None, {}, []                                            # use() sets them (sitedata.site_data)
# Every style page runs on into the bench: its film and sheet, then the home page's long take from its station to the end, and a card
# there opens its film in place (app.js). The bench is the same for every page of a language, so it is one file per language,
# media/bench-<lang>.json (BENCH: its address with a content hash), fetched once and cached, not carried by 99 pages.
BENCH = {}
BOOK_PATH = os.path.join(HERE, 'opuscar98_styles.json')
BOOK = json.load(open(BOOK_PATH, encoding='utf-8'))
FILMS_URL = C.FILMS_URL                                                   # 1080p, on the "films" release
BLOB = f'{C.REPO_URL}/blob/main'
# the demo films whose narration LICENSE leaves out of CC BY 4.0 (Edge TTS, Doubao TTS): their pages say so, and their JSON-LD names no licence
# (CLAWD, below, likewise)
NO_VOICE_LICENCE = {'chalkboard', 'circuit-board', 'desktop-flythrough', 'isometric-picture-book', 'printed-long-take', 'news-package'}
CLAWD = {'living-screencast'}   # the demo films with Clawd and Anthropic's Claude app interface: LICENSE leaves both out of CC BY 4.0
CC_BY = 'https://creativecommons.org/licenses/by/4.0/'
mmss = B.mmss


def use(data):
    """the library as sitedata.site_data() gathered it"""
    global DATA, CAT, ORDER
    DATA = data
    CAT = {s['slug']: s for s in data['styles']}                          # the demo's one line, aka, contributor
    ORDER = [x for c in data['categories'] for x in c['styles']]           # station order: the bench's, also previous / next


# ---------------------------------------------------------------- words (English, 中文); the rest come from build.T and gallery.UI
T = {
    'title': ('{name} · a film style for Claude Code · Lemo-Opuscar', '{name} · Claude Code 影片风格 · Lemo-Opuscar'),
    'desc': ('{about} Demo film: {film} ({dur}), made entirely in code by Claude Opus 5.5.', '{about} Demo 片《{film}》（{dur}），由 Claude Opus 5.5 完全用代码做成。'),
    'skip': ('Skip to content', '跳到正文'),
    'to_bench': ('Station {nn} / {c} · {cat}: back to the bench', '工位 {nn} / {c} · {cat}：回到工作台'),
    'watch': ('Watch the film', '看这支片'),
    'make_btn': ('Make a film in this style', '用这个风格做片'),
    'film_label': ('{film}, the {name} demo film', '《{film}》，{name}的 demo 片'),
    'h_reel': ('The demo film', '这支 demo'),
    'n_stills': ('{n} stills', '{n} 张静帧'),
    'stills_p': ('Click a still to jump the film there.', '点一张静帧，影片跳到那里。'),
    'still_go': ('Play the film from {t}', '从 {t} 开始放'),
    'make_h': ('Make a film in this style', '用这个风格做你的片'),
    'make_p': ('Type your topic, copy the sentence and say it to your agent.', '写上你的题目，复制这句话，告诉你的 agent。'),
    'copy_say': ('Copy the sentence', '复制这句话'),
    'tabs': ('Ways to install', '安装方式'),
    'doc_h': ('STYLE.md, the style guide', 'STYLE.md 风格说明'),
    'doc_p': ('What every film in this style keeps. The story, the shots and the length are yours.', '用这个风格拍的每支片都守这些；故事、镜头和长短由你定。'),
    'doc_n': ('{n} sections · in English', '{n} 节 · 英文'),
    'doc_go': ('Section {n} of STYLE.md on GitHub: {h}', 'GitHub 上 STYLE.md 第 {n} 节：{h}'),
    'spec_h': ('Facts', '资料'),
    'f_needs': ('Needs', '需要'), 'f_needs_img': ('An image generator you provide (the Codex CLI or another image tool): the characters are generated, and without one this style can\'t start',
                                                  '你自己提供的生图工具（Codex CLI 或别的生图工具）：人物要用它生成，没有就没法开始'),
    'f_no': ('Number', '编号'), 'f_fps': ('{fps} fps', '{fps} 帧/秒'), 'f_lic': ('Licence', '授权'), 'f_lic_v': ('STYLE.md, DEMO.md: CC BY-NC 4.0 · demo code: MIT{code} · film and stills: CC BY 4.0{nar}', 'STYLE.md、DEMO.md：CC BY-NC 4.0 · 样片代码：MIT{code} · 影片和静帧：CC BY 4.0{nar}'),   # links to LICENSE
    'f_lic_nar': (' (narration excluded)', '（旁白除外）'),   # the six films whose voice LICENSE excludes (NO_VOICE_LICENCE)
    'f_lic_clawd': (' (Clawd and the Claude app interface excluded)', '（Clawd 和 Claude 应用界面除外）'),   # CLAWD
    'f_lic_3p': ('third-party material: see CREDITS', '第三方素材：见 CREDITS'),   # links to the demo's CREDITS
    'docs': ('Documents', '文档'),
    'home': ('The Workbench', '电影工坊'), 'thanks': ('Thank-you films', '感谢片'),   # the 404 page's buttons
    # OPUSCAR 98
    'o_end': ('End of the bench', '台子尽头'),
    'o_leave': ('Leave the screening', '离开放映'),
    'o_n': ('{n} films', '{n} 部'),
    'o_none': ('No film matches.', '没有匹配的影片。'), 'o_shot': ('Shot {n}', '镜头 {n}'),
    'film_still_alt': ('{name}: a still at {t}', '{name}：{t} 的静帧'),
    'o_now': ('On the screen', '正在放'),
    'o_play_from': ('Plays from {t}', '从 {t} 放'),
    'o_kind_all': ('All', '全部'),
    'o_back': ('Back to the screen', '回到银幕'),
    # thanks
    't_newest': ('Newest', '最新'),
    't_n': ('{n} films', '{n} 支'),
    # 404
    'nf_title': ('Not on the bench · Lemo-Opuscar', '台上没有这一页 · Lemo-Opuscar'),
    'nf_h1': ('This page isn’t on the bench.', '台上没有这一页。'),
    'nf_p': ('The address may have changed when the site was rebuilt. Search the {n} styles, or walk the bench from the start.',
             '网站改版时，地址可能变了。搜一下 {n} 种风格，或者从工作台的开头走一遍。'),
    'nf_search': ('Search {n} styles', '搜索 {n} 种风格'),
}
# STYLE.md's section headings, shortened (short_heading) and in Chinese; every short heading needs one (build.py stops on a Chinese style page with a heading not listed here)
SEC_ZH = {'Essence, and what it is not': '本质，以及它不是什么', 'Materials & rendering': '材质与渲染', 'Colour logic': '色彩逻辑',
          'Type & subtitles': '字体与字幕', 'Motion quality': '运动质感', 'Camera grammar': '镜头语法', 'Sound palette': '声音调色板',
          'Native moves': '招牌手法', 'Pitfalls of the medium': '这种介质的坑', 'Engine': '引擎', 'Variation space': '变化空间',
          # the headings only a few styles use
          'Pitfalls': '常见的坑', 'Editing grammar': '剪辑语法', 'Edit grammar': '剪辑语法', 'Type': '字体', 'Type & lettering': '字体与字形',
          'Material': '素材', 'Frame and layout': '画幅与版式', 'Grade and image quality': '调色与画质', 'Facts': '事实',
          'Sources, facts, engine': '来源、事实与引擎', 'Shot & layout grammar': '镜头与版式语法', 'Range': '适用范围',
          'Picture layer and grade': '画面层与调色', 'Package parts': '包装部件', 'Motion and drawing': '运动与绘制',
          'Materials, sources, facts, engine': '素材、来源、事实与引擎', 'Graphics': '图形', 'Formats': '版式', 'Footage': '影像素材',
          'Consistency checks': '一致性检查', 'Colour identity': '色彩识别', 'Colour': '色彩',
          'Characters, props and image generation': '角色、道具与生图', 'Characters and image generation': '角色与生图',
          'Caption card': '字幕卡', 'Camera on stills and archive': '静帧与档案上的镜头'}


def short_heading(h):
    """a STYLE.md heading as the site lists it: no aside in brackets, nothing after a dash or a colon, no Markdown ("Native moves (and how they are built)" → "Native moves")"""
    h = re.sub(r'\s*[(（].*?[)）]', '', h)
    h = re.split(r'\s+[—–-]\s+|:\s', h)[0]
    return re.sub(r'[*`]', '', h).strip()

# OPUSCAR 98 outside the 98 films: (start, (English, 中文), the frame for the ruler's thumbnail)
O98_EXTRA = [(0.0, ('Prologue · 98 Years of Best Picture', '序幕 · 98 年最佳影片'), 4.5),
             (298.75, ('Coda · from fire to Claude Opus 5.5', '尾声 · 从火到 Claude Opus 5.5'), 341.0),
             (360.0, ('Dedication · to the great art of cinema', '献词 · 致电影这门伟大的艺术'), 371.0),
             (381.0, ('Curtain · OPUSCAR 98', '谢幕 · OPUSCAR 98'), 386.0)]
O98_KIND_ZH = {'B&W': '黑白', 'Sepia': '棕褐', 'B&W screen': '黑白屏幕'}

ICON = {
    'copy': '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 5.5h8v8h-8z"/><path d="M10.5 5.5v-3h-8v8h3"/></svg>',
    'play': '<svg viewBox="0 0 14 16" aria-hidden="true"><path d="M0 0l14 8-14 8z"/></svg>',
    'search': '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l4 4"/></svg>',
}


def gh_anchor(h):
    """GitHub's heading anchor: lower case, punctuation and symbols out (keeping - and _), spaces to hyphens"""
    h = re.sub(r'[*`_]', '', h)                                            # markdown emphasis and code marks render as text
    return re.sub(r'[^\w\- ]', '', h.strip().lower()).replace(' ', '-')


def style_sections(slug):
    out = []
    for line in open(os.path.join(ROOT, 'styles', slug, 'STYLE.md'), encoding='utf-8'):
        m = re.match(r'^## (\d+)\. (.+?)\s*$', line)
        if m: out.append((int(m[1]), m[2], gh_anchor(f'{m[1]}. {m[2]}')))
    return out


def o98_spans(zh):
    """[t0, label, style, kind, thumbnail time] for the prologue, the 98 films and what follows them"""
    rows = [[x[0], x[1][zh], '', 'x', x[2]] for x in O98_EXTRA]
    for f in BOOK['films']:
        title = f'《{f["zh"]}》' if zh else f['title']
        rows.append([round(f['t0'], 3), f'No.{f["no"]} · {f["year"]} · {title}', f['style_zh'] if zh else f['style_en'], '', round(f['frame_sec'], 3)])
    return sorted(rows, key=lambda r: r[0])


def o98_majors():
    first = {}
    for f in BOOK['films']: first.setdefault(f['chapter'], f)
    return [[round(first[c['id']]['t0'], 3), c['years'].split('–')[0]] for c in BOOK['chapters']]


def o98_kind(dim):   # "2D·B&W" → ("2D", "B&W")
    k = re.match(r'[\d.]+D', dim)[0]
    return k, dim[len(k):].strip(' ·()')


def search_index():
    """every style for the search box on these pages (fetched when it opens): names, films and what each is good for, in both languages"""
    cat_of = {s: c['n'] for c in DATA['categories'] for s in c['styles']}
    rows = []
    for slug in ORDER:
        s = next(x for x in DATA['styles'] if x['slug'] == slug)
        words = s.get('uses', []) + s.get('uses_cn', [])
        rows.append([slug, int(s['num']), cat_of[slug], s['cn'], s['en'], s['film'], s.get('film_cn') or s['film'], ' '.join(words), 1 if s.get('new') else 0,
                     mmss(s['dur'])])
    p = os.path.join(OUT, 'media', 'search.json'); os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(dict(rows=rows, cats={c['n']: [c['cn'], c['en']] for c in DATA['categories']}), open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'  media/search.json            {os.path.getsize(p) / 1024:6.1f} KB')


# ---------------------------------------------------------------- pages
class Doc(B.Page):
    """a page under the home page, in one language: path is its folder ('styles/impasto/', 'opuscar98/'; '' for the site root's 404)"""
    def __init__(self, zh, path, media):
        super().__init__(DATA, zh, media)
        self.path = path
        self.R = '../' * (path.count('/') + (1 if zh else 0))
        self.serif = set()      # characters this page sets in Noto Serif SC (for the extra subset)

    def w(self, k, **kw):
        if k in T: s = T[k][1 if self.zh else 0]
        elif k in B.T: s = B.T[k][1 if self.zh else 0]
        else: s = G.UI[k][1 if self.zh else 0]
        for a, b in kw.items(): s = s.replace('{' + a + '}', str(b))
        return s

    def sc(self, text):
        """text set in the Chinese display face: remember its characters"""
        if self.zh: self.serif |= set(text)
        return text

    def home(self): return self.R + ('zh/' if self.zh else '')
    def at(self, path): return self.home() + path                         # a page in this language
    def twin(self): return self.R + ('' if self.zh else 'zh/') + self.path
    def url(self, zh=None): return B.LIVE + ('zh/' if (self.zh if zh is None else zh) else '') + self.path
    def film_title(self, s): return (s.get('film_cn') or s['film']) if self.zh else s['film']
    def page(self, slug): return self.at(f'styles/{slug}/')

    def boot(self):
        twin = json.dumps(self.twin())
        return ("(function(){var s;try{s=localStorage.getItem('opuscar-lang')}catch(e){}"
                + (f"if(s==='en'){{location.replace({twin}+location.search+location.hash);return}}" if self.zh else
                   "var l=(navigator.languages&&navigator.languages[0])||navigator.language||'';"
                   f"if(s==='zh'||(!s&&/^zh/i.test(l))){{location.replace({twin}+location.search+location.hash);return}}")
                + "document.documentElement.classList.add('js')})();")

    def head(self, title, desc, image, ld=None, preload=(), noindex=False, extra_js=(), boot=None, cls='page'):
        R = self.R
        tags = []
        if self.path is not None and not noindex:
            tags += [f'<link rel="canonical" href="{self.url()}">',
                     f'<link rel="alternate" hreflang="en" href="{self.url(False)}"><link rel="alternate" hreflang="zh-CN" href="{self.url(True)}">'
                     f'<link rel="alternate" hreflang="x-default" href="{self.url(False)}">',
                     '<meta property="og:type" content="website"><meta property="og:site_name" content="Lemo-Opuscar">',
                     f'<meta property="og:locale" content="{"zh_CN" if self.zh else "en_US"}"><meta property="og:locale:alternate" content="{"en_US" if self.zh else "zh_CN"}">',
                     f'<meta property="og:url" content="{self.url()}"><meta property="og:title" content="{E(title)}">',
                     f'<meta property="og:description" content="{E(desc)}"><meta property="og:image" content="{image}">',
                     '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@lemomo_ai">',
                     f'<meta name="twitter:title" content="{E(title)}"><meta name="twitter:description" content="{E(desc)}"><meta name="twitter:image" content="{image}">']
        else:
            tags.append('<meta name="robots" content="noindex">')
        if ld: tags.append('<script type="application/ld+json">\n' + json.dumps({'@context': 'https://schema.org', '@graph': ld}, ensure_ascii=False, indent=1).replace('</', '<\\/') + '\n</script>')
        pre = ''.join(f'<link rel="preload" {p}>\n' for p in preload)
        js = ''.join(f'<script defer src="{R}assets/{x}"></script>' for x in ('player.js', 'page.js', *extra_js))
        return (f'<!doctype html>\n<html lang="{"zh-CN" if self.zh else "en"}" class="{cls}" data-root="{R}">\n<head>\n<meta charset="utf-8">\n'
                f'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                f'<script>{boot or self.boot()}</script>\n<title>{E(title)}</title>\n<meta name="description" content="{E(desc)}">\n'
                f'<meta name="theme-color" content="#0c0a09"><meta name="color-scheme" content="dark">\n' + '\n'.join(tags) + '\n'
                f'<link rel="preload" href="{R}fonts/source-serif-4.woff2" as="font" type="font/woff2" crossorigin>\n'
                + (f'<link rel="preload" href="{R}fonts/noto-serif-sc-600.woff2" as="font" type="font/woff2" crossorigin>\n' if self.zh else '')
                + pre
                + f'<link rel="stylesheet" href="{R}assets/app.css">\n<link rel="stylesheet" href="{R}assets/player.css">\n<link rel="stylesheet" href="{R}assets/page.css">\n'
                + '%%SERIF%%' + js + '\n'
                f'<link rel="icon" href="{R}assets/favicon.svg" type="image/svg+xml">\n</head>\n')

    def top(self):
        lang = (f'<a class="lang" href="{self.twin()}" hreflang="{"en" if self.zh else "zh-CN"}" lang="{"en" if self.zh else "zh-CN"}" '
                f'data-lang="{"en" if self.zh else "zh"}">{self.w("lang_other")}</a>')
        here = {'opuscar98/': 'o98', 'thanks/': 'thanks'}.get(self.path, '')
        return (f'<header class="top">\n <a class="mark" href="{self.home()}" aria-label="Lemo-Opuscar · {E(self.w("house"))}">OPUSCAR<small>{E(self.w("house"))}</small></a>\n <i class="rule"></i>\n'
                + B.nav(self.w, self.home(), lang, here) +
                f' <div class="tr"><button class="search" type="button" aria-haspopup="dialog" aria-controls="find" aria-keyshortcuts="/">{ICON["search"]}'
                f'<span>{E(self.w("search_ph", n=self.n))}</span><kbd>/</kbd></button>\n'
                f' {lang}</div>\n</header>\n')

    def find(self):
        return (f'<dialog class="find" id="find" aria-label="{E(self.w("search_label"))}">\n <form method="dialog" class="box" role="search">{ICON["search"]}'
                f'<input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="{E(self.w("search_label"))}" aria-label="{E(self.w("search_label"))}" '
                f'role="combobox" aria-expanded="true" aria-controls="res" aria-autocomplete="list"><kbd>Esc</kbd></form>\n'
                f' <ul id="res" role="listbox" aria-label="{E(self.w("search_label"))}"></ul>\n <p class="hint">{self.hint()}</p>\n</dialog>\n')

    def hint(self):
        return E(self.w('search_hint')).replace('Enter go to it on the bench', 'Enter open').replace('Enter 去台上找它', 'Enter 打开')

    def pg(self, **extra):
        """the words and paths page.js needs"""
        w = {k: self.w(k) for k in ('search_empty', 'search_station', 'search_go', 'new', 'copy', 'copied')}
        return json.dumps(dict(w=w, home=self.home(), styles=self.at('styles/'), idx=self.R + 'media/search.json', thumb=self.R + 'media/thumb/',
                               clip=self.R + 'media/clip/', **extra), ensure_ascii=False, separators=(',', ':'))

    def player(self, fid, title, *, chapters=None, download=None, cls='', label='', slot='', preload='metadata', eager=False, below=False, sizes=None, bigplay=True):
        m = self.media[fid]
        d = f'{self.R}media/films/{fid}'
        ws = m['posters']
        sizes = sizes or ('100vw' if 'fill' in cls else '(min-width: 1024px) 60vw, 100vw')
        pri = ' fetchpriority="high"' if eager else ' loading="lazy"'
        poster = (f'<picture class="pl-poster"><source type="image/avif" srcset="{", ".join(f"{d}/poster-{w}.avif {w}w" for w in ws)}" sizes="{sizes}">'
                  f'<img src="{d}/poster-{ws[-1]}.webp" srcset="{", ".join(f"{d}/poster-{w}.webp {w}w" for w in ws)}" sizes="{sizes}" '
                  f'width="{ws[-1]}" height="{ws[-1] * 9 // 16}" alt="" decoding="async"{pri}></picture>')
        attrs = (f' data-dur="{m["dur"]}" data-fps="{m["fps"]:g}" data-title="{E(title)}" data-sprite="{d}/sprite.webp" data-grid="{",".join(str(x) for x in m["grid"])}"'
                 + (f' data-chapters="{chapters}"' if chapters else '') + (f' data-download="{download}"' if download else '')
                 + (' data-bar="below"' if below else '') + ('' if bigplay else ' data-bigplay="0"'))
        return (f'<div class="player{(" " + cls) if cls else ""}" data-player{attrs}>\n'
                f'  <video src="{C.film_url(fid, self.R)}" controls preload="{preload}" playsinline aria-label="{E(label or title)}"></video>\n'
                f'  {poster}\n' + (f'  <div class="pl-slot">{slot}</div>\n' if slot else '') + ' </div>')

    def still(self, stem, alt, sizes='100vw', eager=False):
        return self.picture(stem, alt, eager=eager, sizes=sizes)

    def repo_ld(self):
        n = len(DATA['styles'])
        return {'@type': 'SoftwareSourceCode', '@id': G.REPO_URL, 'name': 'Lemo-Opuscar', 'url': G.REPO_URL, 'codeRepository': G.REPO_URL,
                'description': f'{n} film styles, each a style prompt plus a demo film made entirely in code, packaged as a Claude Code skill.',
                'license': f'{BLOB}/LICENSE', 'author': {'@id': G.AUTHOR['@id']},   # LICENSE: code MIT, docs CC BY-NC 4.0, films CC BY 4.0
                'keywords': ['Claude Code skill', 'Claude Opus 5.5', 'film styles', 'no video model', 'motion graphics', 'creative coding']}

    def credits(self):
        """the home page's last line (who made it, where it lives) at the end of a page that doesn't run on into the bench"""
        return f'<footer class="end page-end">\n{B.credits(self.w, self.zh, "#main")}</footer>\n'

    def foot(self, extra=''):
        return '</main>\n' + self.find() + extra + f'<script type="application/json" id="pg">{self.pg()}</script>\n</body>\n</html>\n'


class StylePage(Doc):
    def __init__(self, zh, slug, media, deep=0, top=0):
        super().__init__(zh, f'styles/{slug}/', media)
        self.slug, self.m, self.deep, self.topdeep = slug, media[slug], deep, top
        self.s = self.S[slug]                       # sitedata: names, category, tags, film, uses
        self.c = CAT[slug]                          # catalog.json: the demo's one line, aka, contributor
        self.cat = next(c for c in DATA['categories'] if slug in c['styles'])

    def render(self):
        s, c, cat, zh, R = self.s, self.c, self.cat, self.zh, self.R
        name, alt = (s['cn'], s['en']) if zh else (s['en'], s['cn'])
        film, dur = self.film_title(s), mmss(s['dur'])
        about = s['about_cn'] if zh else s['about_en']
        nn, ncat = f'{cat["n"]:02d}', len(DATA['categories'])
        cname = cat['cn'] if zh else cat['en']
        full = f'{FILMS_URL}/{self.slug}.mp4'
        poster_abs = B.LIVE + f'posters/{self.slug}.jpg'                    # the live site's own share-card address, kept
        title = self.w('title', name=name)
        desc = self.w('desc', about=about, film=film, dur=dur)
        ld = [{'@type': 'VideoObject', '@id': self.url() + '#film', 'name': f'{s["film"]} · {s["en"]}', 'description': c['line_cn'] if zh else c['line'],
               'thumbnailUrl': poster_abs, 'duration': f'PT{int(s["dur"] // 60)}M{int(round(s["dur"] % 60))}S', 'contentUrl': full, 'embedUrl': self.url(),
               'inLanguage': 'zh-CN' if zh else 'en', 'creator': {'@id': G.AUTHOR['@id']}, 'isBasedOn': {'@id': G.REPO_URL}, 'genre': cat['en'],
               **({} if self.slug in NO_VOICE_LICENCE | CLAWD else {'license': CC_BY}),
               **({'contributor': {'@type': 'Person', 'name': c['by']['name'], 'url': c['by']['url']}} if c.get('by') else {})},   # a style contributed from outside
              {'@type': 'BreadcrumbList', 'itemListElement': [
                  {'@type': 'ListItem', 'position': 1, 'name': self.w('crumb_all'), 'item': B.LIVE + ('zh/' if zh else '')},
                  {'@type': 'ListItem', 'position': 2, 'name': cname, 'item': B.LIVE + ('zh/' if zh else '') + f'#s{nn}'},
                  {'@type': 'ListItem', 'position': 3, 'name': name, 'item': self.url()}]},
              self.repo_ld(), G.AUTHOR]
        d = f'{R}media/films/{self.slug}'
        ws = self.m['posters']
        preload = [f'as="image" type="image/avif" imagesrcset="{", ".join(f"{d}/poster-{w}.avif {w}w" for w in ws)}" imagesizes="100vw" fetchpriority="high"']
        # the bench's scripts too, and the layout picked as on the home page (film: the long take; stack: stills)
        boot = self.boot().replace("document.documentElement.classList.add('js')",
            "var d=document.documentElement,q=new URLSearchParams(location.search).get('mode'),k=navigator.connection,"
            "f=q?q==='film':matchMedia('(min-width: 1024px) and (min-height: 560px)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!(k&&k.saveData);"
            "d.classList.add('js',f?'film':'stack','in-sheet')")   # in-sheet: the reader starts on the film and sheet (app.js keeps it true)
        out = [self.head(title, desc, poster_abs, ld, preload, extra_js=('engines.js', 'app.js'), boot=boot, cls='page runon')
               .replace(' class="page runon"', f' class="page runon" data-from="{cat["n"]}" data-slug="{self.slug}" data-bench="{R}{BENCH[zh]}"', 1)]
        out.append(f'<body>\n<a class="skip" href="#main">{E(self.w("skip"))}</a>\n' + self.top() + '<main id="main">\n')

        # ---- the first screen: the film, and its label in the dark at the lower left
        new = f'<sup>{E(self.w("new"))}</sup>' if s.get('new') else ''
        h1 = (f'<h1 id="style-h">{E(self.sc(name)).replace(" · ", "&nbsp;· ")}{new}</h1>\n   <p class="alt" lang="en">{E(alt)}</p>' if zh else
              f'<h1 id="style-h">{E(name).replace(" · ", "&nbsp;· ")}{new}</h1>\n   <p class="alt" lang="zh-CN">{E(self.sc(alt))}</p>')
        filmline = (f'<span class="fm">《{E(film)}》</span>' if zh else f'<em>{E(film)}</em>') + f'<span class="t">{dur}</span>'
        label = (f' <div class="label">\n'
                 f'   <p class="meta"><a href="{self.home()}#s{nn}" aria-label="{E(self.w("to_bench", nn=nn, c=ncat, cat=cname))}">'
                 f'<span>{E(self.w("station"))}</span> <b>{nn} / {ncat}</b> <span class="cat">· {E(cname)}</span></a><i></i><span class="no">No.{int(s["num"]):02d}</span></p>\n'
                 f'   {h1}\n   <p class="film">{filmline}</p>\n   <p class="about">{E(about)}</p>\n'
                 f'   <p class="acts"><button class="btn primary" type="button" data-play>{ICON["play"]}{E(self.w("watch"))}<span class="t">{dur}</span></button>'
                 f'<a class="btn" href="#make">{E(self.w("make_btn"))}</a></p>\n </div>\n')
        deep = (f' deep{self.deep}' if self.deep else '') + (f' top{self.topdeep}' if self.topdeep else '')
        out.append(f'<section class="plate{deep}" id="film" aria-labelledby="style-h">\n' + label + ' '
                   + self.player(self.slug, film, download=full, cls='fill', eager=True, label=self.w('film_label', film=film, name=name),
                                 slot='<div class="plate-scrim"></div>')
                   + '\n</section>\n')

        # ---- the sheet: the demo's line and its stills; making a film; STYLE.md; the facts
        stills = ''.join(
            f'<li><button type="button" data-seek="{t}" aria-label="{E(self.w("still_go", t=mmss(t)))}">'
            f'<span class="pic"><img src="{d}/still-{i}-640.webp" srcset="{d}/still-{i}-640.webp 640w, {d}/still-{i}-960.webp 960w, {d}/still-{i}-1280.webp 1280w" '
            f'sizes="(min-width: 1024px) 23vw, 46vw" width="640" height="360" alt="{E(self.w("film_still_alt", name=name, t=mmss(t)))}" loading="lazy" decoding="async"></span>'
            f'<span class="tc"><b>{chr(65 + i)}</b>{mmss(t)}</span></button></li>' for i, t in enumerate(self.m['stills']))
        line = c['line_cn'] if zh else c['line']
        out.append(
            f'<div class="sheet">\n<section class="demo" aria-labelledby="h-reel">\n'
            f' <header class="rowh"><span class="n">01</span><h2 id="h-reel">{E(self.w("h_reel"))}</h2><i></i><span>{E(self.w("n_stills", n=len(self.m["stills"])))} · {dur}</span></header>\n'
            f' <p class="logline">{E(line)}</p>\n'
            f' <ol class="stills">{stills}</ol>\n <p class="hint">{E(self.w("stills_p"))}</p>\n</section>\n')

        # making a film
        tpl = self.w('say_tpl')
        style_b = f'<b>{E(self.sc(name))}</b>'
        blank = (f'<label class="blank"><span class="sr">{E(self.w("say_topic"))}</span>'
                 f'<input id="topic" type="text" autocomplete="off" spellcheck="false" placeholder="{E(self.w("say_topic_ph"))}"></label>')
        if zh: self.sc(re.sub(r'\{\w+\}', '', tpl))
        sentence = E(tpl).replace('{style}', '\x00').replace('{topic}', '\x01').replace('\x00', style_b).replace('\x01', blank)
        cmd = lambda lines: (f'<div class="cmd"><pre><code>' + '\n'.join(f'<span>{E(x)}</span>' for x in lines) + '</code></pre>'
                             f'<button class="copy" type="button" data-copy>{ICON["copy"]}<span>{E(self.w("copy"))}</span></button></div>')
        make = (f'<section class="make" id="make" aria-labelledby="h-make">\n'
                f' <header class="rowh"><span class="n">02</span><h2 id="h-make">{E(self.w("make_h"))}</h2><i></i></header>\n'
                f' <p class="lede">{E(self.w("make_p"))}</p>\n'
                f' <div class="say" data-tpl="{E(tpl)}" data-style="{E(name)}" data-slot="{E(self.w("topic_slot"))}">\n'
                f'  <p class="sentence">{sentence}</p>\n'
                f'  <p class="do"><button class="copy big" type="button" data-say>{ICON["copy"]}<span>{E(self.w("copy_say"))}</span></button><span class="ok" role="status" aria-live="polite"></span></p>\n </div>\n'
                f' <p class="hint">{E(self.w("say_hint"))}</p>\n'
                f' <div class="install" id="install">\n  <p class="ih">{E(self.w("make_first"))}</p>\n'
                f'  <div class="tabs" role="tablist" aria-label="{E(self.w("tabs"))}"><button type="button" role="tab" id="tab-plugin" aria-controls="tp-plugin" aria-selected="true">{E(self.w("tab_plugin"))}</button>'
                f'<button type="button" role="tab" id="tab-clone" aria-controls="tp-clone" aria-selected="false" tabindex="-1">{E(self.w("tab_clone"))}</button></div>\n'
                f'  <div class="tp" id="tp-plugin" role="tabpanel" aria-labelledby="tab-plugin">{cmd(G.INSTALL_PLUGIN)}<p>{E(self.w("plugin_p"))}</p></div>\n'
                f'  <div class="tp" id="tp-clone" role="tabpanel" aria-labelledby="tab-clone" hidden>{cmd(G.INSTALL_CLONE)}<p>{E(self.w("clone_p"))}</p></div>\n'
                f' </div>\n</section>\n')

        # STYLE.md, as a contents page
        secs = style_sections(self.slug)
        blob = f'{BLOB}/styles/{self.slug}'
        rows = []
        for n, h, a in secs:
            h = short_heading(h)
            hz = SEC_ZH.get(h) if zh else None
            if zh and not hz: raise SystemExit(f'pages.py: styles/{self.slug}/STYLE.md, section {n} "{h}" has no Chinese in SEC_ZH')
            nm = (f'<span class="nm">{E(self.sc(hz))}</span><em lang="en">{E(h)}</em>' if hz else f'<span class="nm" lang="en">{E(h)}</span>')
            rows.append(f'<li><a href="{blob}/STYLE.md#{a}" rel="noopener" aria-label="{E(self.w("doc_go", n=n, h=hz or h))}"><b>{n:02d}</b>{nm}<i></i><span class="c">§{n}</span></a></li>')
        doc = (f'<section class="doc" aria-labelledby="h-doc">\n'
               f' <header class="rowh"><span class="n">03</span><h2 id="h-doc"><a href="{blob}/STYLE.md" rel="noopener">{E(self.w("doc_h")).replace("STYLE.md", "<span class=fn>STYLE.md</span>")}<i aria-hidden="true">↗</i></a></h2><i></i>'
               f'<span>{E(self.w("doc_n", n=len(secs)))}</span></header>\n <p class="lede">{E(self.w("doc_p"))}</p>\n <ol class="toc2">{"".join(rows)}</ol>\n</section>\n')

        # the facts
        uses = s['uses_cn'] if zh else s['uses']
        facts = [(self.w('f_no'), f'No.{int(s["num"]):02d}' + (f' <sup>{E(self.w("new"))}</sup>' if s.get('new') else '')),
                 (self.w('f_cat'), f'<a href="{self.home()}#s{nn}"><span class="n">{nn}</span>{E(cname)}</a>'),
                 (self.w('f_good'), '<ul>' + ''.join(f'<li>{E(u)}</li>' for u in uses) + '</ul>'),
                 (self.w('f_film'), (f'《{E(film)}》' if zh else f'<em>{E(film)}</em>') + f'<span class="sub">{dur} · {self.m["w"]}×{self.m["h"]} · {E(self.w("f_fps", fps=format(self.m["fps"], "g")))}</span>')]
        if 'image-generation' in (c.get('needs') or []): facts.append((self.w('f_needs'), E(self.w('f_needs_img'))))
        aka = [x for x in c.get('aka') or [] if bool(re.search(r'[\u3400-\u9fff]', x)) == zh]    # former names in this page's language only
        if aka: facts.append((self.w('f_aka'), E(' · '.join(aka))))
        if c.get('by'): facts.append((self.w('f_by'), f'<a href="{E(c["by"]["url"])}" rel="noopener">@{E(c["by"]["name"])}</a>'))
        facts += [(self.w('f_folder'), f'<code>styles/{self.slug}/</code>'), (self.w('f_lic'), f'<a href="{BLOB}/LICENSE" rel="noopener">{E(self.w("f_lic_v", code=self.w("f_lic_clawd") if self.slug in CLAWD else "",
                                                                                   nar=self.w("f_lic_nar") if self.slug in NO_VOICE_LICENCE else self.w("f_lic_clawd") if self.slug in CLAWD else ""))}</a>'
                  f' · <a href="{blob}/demo/CREDITS" rel="noopener">{E(self.w("f_lic_3p"))}</a>')]
        links = [(f'{blob}/STYLE.md', self.w('l_style'), '↗'), (f'{blob}/DEMO.md', self.w('l_demo'), '↗'), (full, self.w('l_dl'), '↓')]
        spec = (f'<aside class="spec" aria-labelledby="h-spec">\n <header class="rowh"><h2 id="h-spec">{E(self.w("spec_h"))}</h2><i></i></header>\n'
                f' <dl>' + ''.join(f'<div><dt>{E(k)}</dt><dd>{v}</dd></div>' for k, v in facts) + '</dl>\n'
                f' <nav class="docs" aria-label="{E(self.w("docs"))}">' + ''.join(f'<a href="{u}" rel="noopener"><span>{E(t.replace(" ↗", "").replace(" ↓", ""))}</span><i aria-hidden="true">{a}</i></a>' for u, t, a in links)
                + '</nav>\n</aside>\n')
        out.append(f'<div class="cols">\n<div class="main">\n{make}{doc}</div>\n{spec}</div>\n</div>\n')
        out.append(self.foot())
        return ''.join(out)


class O98Page(Doc):
    """the feature at the end of the bench: the projector's frame, the film on its projection (then large, then in the corner), the 98 styles"""
    def __init__(self, zh, media):
        super().__init__(zh, 'opuscar98/', media)

    def render(self):
        zh, R, t = self.zh, self.R, self.w
        F = G.FEATURE
        L = lambda en, cn: cn if zh else en
        chs = {c['id']: c for c in BOOK['chapters']}
        films = BOOK['films']
        poster_abs = B.LIVE + 'img/feature_opuscar98.jpg'
        ld = [{'@type': 'VideoObject', '@id': self.url(), 'url': self.url(), 'name': 'OPUSCAR 98 · 98 Years of Best Picture', 'description': t('o_desc'),
               'thumbnailUrl': poster_abs, 'uploadDate': F['date'], 'duration': 'PT{}M{}S'.format(*F['dur'].split(':')), 'contentUrl': F['full'],
               'embedUrl': self.url(), 'inLanguage': 'zh-CN' if zh else 'en', 'creator': {'@id': G.AUTHOR['@id']}, 'isBasedOn': {'@id': G.REPO_URL}},
              self.repo_ld(), G.AUTHOR]
        out = [self.head(t('o_title'), t('o_desc'), poster_abs, ld, extra_js=('o98.js',))]
        out.append(f'<body class="feature">\n<a class="skip" href="#main">{E(t("skip"))}</a>\n' + self.top() + '<main id="main">\n')

        # ---- the end of the bench: the projector throws the film on the wall; the player sits on the projection
        x0, y0, x1, y1 = B.FINALE_SCREEN
        pos = f'--sx:{100 * x0 / 1280:.3f}%;--sy:{100 * y0 / 720:.3f}%;--sw:{100 * (x1 - x0) / 1280:.3f}%'
        out.append(
            f'<section class="theatre" id="film" data-mode="rest" aria-labelledby="o-h">\n <div class="frame">\n'
            f'  {self.picture("finale", t("finale_alt"), eager=True, sizes="100vw")}\n  <div class="lights" aria-hidden="true"></div>\n'
            f'  <p class="away" aria-live="polite"><span>{E(t("o_away"))}</span><button type="button" class="back-screen">{E(t("o_back"))}</button></p>\n'
            f'  <div class="proj" style="{pos}">\n'
            f'   <div class="dockbar"><a class="dnow" href="#styles"></a><button type="button" class="dloop" aria-pressed="false">{E(t("o_loop"))}</button>'
            f'<button type="button" class="dclose" aria-label="{E(t("o_close"))}">×</button></div>\n   '
            + self.player('opuscar98', 'OPUSCAR 98', chapters='ch-o98', download=F['full'], preload='none', below=True, sizes='(min-width: 1024px) 84vw, 100vw')
            + f'\n   <button type="button" class="leave" aria-label="{E(t("o_leave"))}">×</button>\n  </div>\n'
            f'  <div class="ov">\n   <p class="meta"><span>{E(t("feat_eyebrow"))}</span><i></i><span>{E(t("o_end"))}</span></p>\n'
            f'   <h1 id="o-h" class="o98">OPUSCAR 98<span class="sub">{E(t("feat_sub", dur=F["dur"]))}</span></h1>\n'
            f'   <p class="desc">{E(t("feat_p"))}</p>\n'
            f'   <p class="acts"><button class="btn primary" type="button" data-watch>{ICON["play"]}{E(t("feat_watch"))}<span class="t">{F["dur"]}</span></button>'
            f'<a class="btn" href="#styles">{E(t("o_98"))}</a><a class="btn" href="{F["full"]}">{E(t("download"))}</a></p>\n  </div>\n </div>\n</section>\n')

        # ---- credits, as the end titles list them
        credits = [(t('o_run'), F['dur'], t('o_run_v')), (t('o_with'), t('o_with_v'), t('o_with_s')), (t('o_model'), t('o_model_v'), t('o_model_s')),
                   (t('o_by'), 'Lemomo · LemoLab', '<a href="https://x.com/lemomo_ai" rel="noopener">@lemomo_ai</a> · <a href="https://github.com/lemomo-ai" rel="noopener">github.com/lemomo-ai</a>')]
        out.append('<div class="sheet">\n<dl class="credits">' + ''.join(
            f'<div><dt>{E(a)}</dt><dd><b>{E(b)}</b><span>{c if c.startswith("<a") else E(c)}</span></dd></div>' for a, b, c in credits) + '</dl>\n')

        # ---- the book: the 98 styles, by decade; search, 2D/3D and a decade ruler
        kinds = [f'<button type="button" data-k="all" aria-pressed="true">{E(t("o_kind_all"))}<small>{len(films)}</small></button>']
        kinds += [f'<button type="button" data-k="{k}" aria-pressed="false" title="{E(t("o_kind_" + k))}">{k}<small>{sum(o98_kind(f["dim"])[0] == k for f in films)}</small></button>'
                  for k in ('2D', '2.5D', '3D')]
        nch = len(BOOK['chapters'])
        decs = ''.join(f'<li style="left:{100 * i / (nch - 1):.3f}%"><button type="button" data-ch="{c["id"]}" aria-pressed="false" aria-label="{E(L(c["en"], c["zh"]))} · {E(c["years"])}">'
                       f'<i></i><b>{c["years"].split("–")[0]}</b><span>{E(L(c["en"], c["zh"]))}</span></button></li>' for i, c in enumerate(BOOK['chapters']))
        arts, last = [], None
        def hexes(s):
            return re.sub(r'#[0-9A-Fa-f]{6}\b', lambda m: f'<code class="hex"><i style="background:{m[0]}"></i>{m[0]}</code>', E(s))
        for f in films:
            if f['chapter'] != last:
                c = chs[f['chapter']]; last = f['chapter']
                n = sum(x['chapter'] == c['id'] for x in films)
                nm = L(c['en'], c['zh'])
                arts.append(f'<h3 class="decade" data-ch="{c["id"]}" id="d-{c["id"].lower()}"><span class="nm">{E(self.sc(nm))}</span><span class="yr">{E(c["years"])}</span><i></i>'
                            f'<span class="c">{E(t("o_n", n=n))}</span></h3>')
            no = int(f['no']); k, tone = o98_kind(f['dim'])
            title = L(f['title'], f['zh']); style = L(f['style_en'], f['style_zh'])
            tone_t = (O98_KIND_ZH.get(tone, tone) if zh else tone) if tone else ''
            q = ' '.join([f['title'], f['zh'], f['year'], f'no.{no}', k.lower(), f['style_en'], f['style_zh'], *f['blend_en'], *f['blend_zh'], *f['refs']]).lower()
            shots = ''.join(f'<li><p class="cam"><b>{E(t("o_shot", n=f"{i:02d}"))}</b><span>{sh["sec"]:.1f}s</span></p><p>{E(L(sh["en"], sh["zh"]))}</p></li>' for i, sh in enumerate(f['shots'], 1))   # numbered: the cam names are working names
            head = t('o_style_lbl') + ' · '.join(x for x in (style, k, tone_t) if x)
            alt = f'No.{no} {f["title"]} ({f["year"]}) in OPUSCAR 98, {f["style_en"]}'
            sub = f'<span class="en" lang="en">{E(f["title"])}</span>' if zh else ''
            arts.append(
                f'<article class="film" id="no-{no}" data-ch="{f["chapter"]}" data-k="{k}" data-t0="{f["t0"]}" data-dur="{f["dur"]}" data-words="{E(q)}" data-label="No.{no} · {E(title)}">\n'
                f' <button class="shot" type="button" data-t="{f["t0"]}" aria-label="{E(t("o_play", no=no))}">'
                f'<img src="{R}media/o98/{no:02d}-480.webp" srcset="{R}media/o98/{no:02d}-480.webp 480w, {R}media/o98/{no:02d}-960.webp 960w" sizes="(min-width: 1024px) 30vw, 92vw" '
                f'width="960" height="400" alt="{E(alt)}" loading="lazy" decoding="async"><span class="tc">{ICON["play"]}{mmss(float(f["t0"]))}</span></button>\n'
                f' <div class="txt">\n'
                f'  <p class="fmeta"><a class="no" href="#no-{no}">No.{no}</a><span>{E(f["year"])}</span><span class="kind" title="{E(t("o_kind_" + k))}">{k}{(" · " + E(tone_t)) if tone_t else ""}</span>'
                f'<button class="copy" type="button" data-qcopy data-head="{E(head)}">{ICON["copy"]}<span>{E(t("o_copy"))}</span></button></p>\n'
                f'  <h4>{E(title)}{sub}</h4>\n  <p class="style">{E(style)}</p>\n'
                f'  <ul class="blend">' + ''.join(f'<li>{E(b)}</li>' for b in L(f['blend_en'], f['blend_zh'])) + '</ul>\n'
                f'  <p class="desc">{E(L(f["desc_en"], f["desc_zh"]))}</p>\n'
                f'  <details><summary>{E(t("o_prompt"))}</summary><div class="cmd prompt"><p>{hexes(L(f["prompt_en"], f["prompt_zh"]))}</p>'
                f'<button class="copy" type="button" data-pcopy>{ICON["copy"]}<span>{E(t("copy"))}</span></button></div></details>\n'
                f'  <details><summary>{E(t("o_shots"))}</summary><ol class="shots">{shots}</ol>'
                f'<p class="dir">{E(L(f["direction_en"], f["direction_zh"]))}</p><p class="refs">{E(t("o_refs"))}{E(" · ".join(f.get("refs_zh") or f["refs"] if zh else f["refs"]))}</p></details>\n'
                f' </div>\n</article>')
        out.append(
            f'<section class="book" id="styles" aria-labelledby="book-h"><span id="films" class="alias"></span>\n'   # #films: the live page's name for the book
            f' <header class="rowh"><span class="n">01</span><h2 id="book-h">{E(t("o_book_h"))}</h2><i></i><span>{E(t("o_n", n=len(films)))}</span></header>\n'
            f' <p class="lede">{E(t("o_book_p"))}</p>\n'
            f' <div class="tools">\n'
            f'  <label class="q98">{ICON["search"]}<span class="sr">{E(t("search_label"))}</span><input id="q98" type="search" autocomplete="off" spellcheck="false" placeholder="{E(t("o_search"))}"></label>\n'
            f'  <div class="kinds" role="group" aria-label="{E(t("o_kind"))}">{"".join(kinds)}</div>\n'
            f'  <p class="count" id="count98" aria-live="polite">{E(t("o_n", n=len(films)))}</p>\n'
            f'  <div class="decades" role="group" aria-label="{E(t("o_decade"))}"><button type="button" class="all" data-ch="all" aria-pressed="true">{E(t("o_all"))}</button>'
            f'<ol>{decs}</ol></div>\n </div>\n'
            f' <div class="films">\n' + '\n'.join(arts) + f'\n <p class="none98" id="none98" hidden>{E(t("o_none"))}</p>\n </div>\n'
            f' <p class="json">{E(t("o_json"))} <a href="{self.R}opuscar98/styles.json">styles.json</a></p>\n</section>\n')
        out.append(f'<section class="made" aria-labelledby="made-h">\n <header class="rowh"><span class="n">02</span><h2 id="made-h">{E(t("o_made_h"))}</h2><i></i></header>\n'
                   f' <p class="lede">{E(t("o_made_1"))}</p>\n <p class="lede">{E(t("o_made_2", n=len(DATA["styles"])))}</p>\n'
                   f' <p class="acts"><a class="btn" href="{self.home()}">{E(t("browse", n=len(DATA["styles"])))}</a></p>\n</section>\n' + self.credits() + '</div>\n')
        ch = dict(spans=[s[:4] for s in o98_spans(zh)], majors=o98_majors())
        extra = f'<script type="application/json" id="ch-o98">{json.dumps(ch, ensure_ascii=False, separators=(",", ":"))}</script>\n'
        out.append(self.foot(extra))
        return ''.join(out)


class ThanksPage(Doc):
    def __init__(self, zh, media):
        super().__init__(zh, 'thanks/', media)

    def render(self):
        zh, t = self.zh, self.w
        def iso(x): m, s_ = x.split(':'); return f'PT{int(m)}M{int(s_)}S'
        ld = [{'@type': 'CollectionPage', '@id': self.url(), 'url': self.url(), 'name': t('t_title'), 'description': t('t_desc'), 'inLanguage': 'zh-CN' if zh else 'en',
               'about': {'@id': G.REPO_URL}, 'author': {'@id': G.AUTHOR['@id']},
               'hasPart': [{'@type': 'VideoObject', 'name': f[3][zh], 'description': f[4][zh], 'thumbnailUrl': B.LIVE + f'img/thanks/{f[0]}.jpg',
                            'uploadDate': f[2], 'duration': iso(f[1]), 'contentUrl': f'{G.THANKS_REL}/{f[0]}.mp4', 'embedUrl': self.url() + '#' + f[0]} for f in G.THANKS]},
              self.repo_ld(), G.AUTHOR]
        out = [self.head(t('t_title'), t('t_desc'), B.LIVE + 'img/thanks/stars6000.jpg', ld)]
        out.append(f'<body class="thanks">\n<a class="skip" href="#main">{E(t("skip"))}</a>\n' + self.top() + '<main id="main">\n')
        head = (f' <header class="th">\n  <p class="meta"><span>{E(t("t_eyebrow"))}</span><i></i><span>{E(t("t_n", n=len(G.THANKS)))}</span></p>\n'
                f'  <h1>{E(self.sc(t("t_h1")))}</h1>\n  <p class="lede">{E(t("t_lead"))}</p>\n </header>\n')
        def one(f, big=False):
            fid, dur, day, title, desc = f
            alias = f'<span id="{G.THANKS_ALIAS[fid]}" class="alias"></span>' if fid in G.THANKS_ALIAS else ''
            new = f'<span class="newest">{E(t("t_newest"))}</span>' if big else ''
            pl = self.player(fid, title[zh], download=f'{G.THANKS_REL}/{fid}.mp4', below=True, eager=big, sizes='(min-width: 1024px) 64vw, 100vw' if big else '(min-width: 1024px) 45vw, 100vw')
            cap = (f'<div class="cap"><i></i><div><p class="meta">{new}<span>{dur}</span><span>{day}</span><a href="{G.THANKS_REL}/{fid}.mp4">1080p ↓</a></p>'
                   f'<h2 id="h-{fid}">{E(title[zh])}</h2><p class="desc">{E(desc[zh])}</p></div></div>')
            # the newest film opens the page beside its heading, sized so the heading, the film and its caption fit the first screen
            return (f'<section class="thank{" big" if big else ""}" id="{fid}" aria-labelledby="h-{fid}">{alias}\n'
                    + (f'{head} {pl}\n {cap}\n' if big else f' {pl}\n {cap}\n') + '</section>')
        out.append(one(G.THANKS[0], True) + '\n<div class="pair">\n' + '\n'.join(one(f) for f in G.THANKS[1:]) + '\n</div>\n'
                   f'<p class="end">{E(t("t_end"))}</p>\n' + self.credits())
        out.append(self.foot())
        return ''.join(out)


class NotFound(Doc):
    """404.html at the site's root, both languages in one page (the address could be anything): the opening frame, a search"""
    def __init__(self, media):
        super().__init__(False, '', media)
        self.path = None
        self.zhp = Doc(True, '', media)

    def nav404(self, both):
        gh = f'<a class="gh" href="{G.REPO_URL}" rel="noopener">GitHub{f"<span>★ {B.STARS}</span>" if B.STARS else ""}</a>'
        links = f'<a href="opuscar98/" data-zh="zh/opuscar98/">OPUSCAR 98</a><a href="thanks/" data-zh="zh/thanks/">{both("nav_thanks")}</a>{gh}'
        lang = '<a class="lang-m" href="zh/" data-zh="./"><span lang="en">中文</span><span lang="zh-CN">EN</span></a>'
        return (f' <nav class="links" aria-label="Lemo-Opuscar">{links}</nav>\n'
                f' <details class="menu"><summary aria-label="Menu · 菜单"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 9h14M2 13h14"/></svg></summary>'
                f'<div class="mp">{links}{lang}</div></details>\n')

    def render(self):
        en, zh = self, self.zhp
        # every link below is relative to the site's root: on GitHub Pages the 404 page answers at any depth, so it sets <base> first
        # every address below is relative to the site's root: on GitHub Pages this page answers at any depth, so it carries a fixed <base>
        # (the site's path on Pages; serve.py answers under the same path). Language: zh/ in the address, else the saved choice, else the browser.
        base = C.BASE_PATH
        # a style film's old address inside the site (<site>/films/<slug>.mp4, from before the style films moved to the films repository)
        # goes on there, when it is opened directly (a <video> elsewhere that names it gets the 404 and no film)
        styles = sorted(s for s in ORDER if C.is_style(s) and not C.in_site(s))
        moved = ("var m=p.indexOf(r+'films/')===0&&/^([\\w-]+)\\.mp4$/.exec(p.slice(r.length+6));"
                 "if(m&&" + json.dumps(styles, separators=(',', ':')) + ".indexOf(m[1])>=0){location.replace(" + json.dumps(C.FILMS_BASE) + "+m[0]);return}"
                 if styles else '')
        boot = ("(function(){var d=document,r=" + json.dumps(base) + ",p=location.pathname,s;" + moved + "try{s=localStorage.getItem('opuscar-lang')}catch(e){}"
                "var l=(navigator.languages&&navigator.languages[0])||navigator.language||'',z=p.indexOf(r+'zh/')===0||p.indexOf('/zh/')===0||(s?s==='zh':/^zh/i.test(l));"
                "d.documentElement.lang=z?'zh-CN':'en';if(z)d.title=" + json.dumps(self.zhp.w('nf_title'), ensure_ascii=False) + ";d.documentElement.classList.add('js')})();")
        both = lambda k, **kw: f'<span lang="en">{E(en.w(k, **kw))}</span><span lang="zh-CN">{E(zh.sc(zh.w(k, **kw)))}</span>'
        out = [self.head('Not on the bench · Lemo-Opuscar', en.w('nf_p', n=self.n), '', noindex=True, boot=boot, cls='page nf').replace('<head>\n', f'<head>\n<base href="{base}">\n', 1)]
        out.append('<body class="notfound">\n<header class="top">\n <a class="mark" href="./" aria-label="Lemo-Opuscar">OPUSCAR<small>' + both('house') + '</small></a>\n <i class="rule"></i>\n'
                   + self.nav404(both) +
                   f' <div class="tr"><button class="search" type="button" aria-haspopup="dialog" aria-controls="find">{ICON["search"]}<span>' + both('search_ph', n=self.n) + '</span><kbd>/</kbd></button>'
                   '<a class="lang" href="zh/" data-zh="./"><span lang="en">中文</span><span lang="zh-CN">EN</span></a></div>\n</header>\n<main id="main">\n'
                   f'<section class="nfp">\n {self.picture("hero", en.w("hero_alt"), eager=True, sizes="100vw")}\n <div class="ov">\n'
                   f'  <p class="meta"><b>404</b><i></i>' + both('house') + '</p>\n'
                   f'  <h1>' + both('nf_h1') + '</h1>\n  <p class="desc">' + both('nf_p', n=self.n) + '</p>\n'
                   f'  <p class="acts"><button class="btn primary" type="button" data-find>{ICON["search"]}' + both('nf_search', n=self.n) + '<kbd>/</kbd></button>'
                   f'<a class="btn" href="./" data-zh="zh/">' + both('home') + '</a><a class="btn" href="opuscar98/" data-zh="zh/opuscar98/">OPUSCAR 98</a>'
                   f'<a class="btn" href="thanks/" data-zh="zh/thanks/">' + both('thanks') + '</a></p>\n </div>\n</section>\n</main>\n')
        # search in either language: page.js takes #pg-zh on a Chinese page
        self.R = ''; zh.R = ''
        ph = E(self.w('search_label'))
        out.append(self.find().replace(f'aria-label="{ph}"', 'aria-label="Search · 搜索"').replace(f'placeholder="{ph}"', 'placeholder="Search · 搜索"')
                   .replace(f'<p class="hint">{self.hint()}</p>', f'<p class="hint"><span lang="en">{self.hint()}</span><span lang="zh-CN">{zh.hint()}</span></p>')
                   + f'<script type="application/json" id="pg">{self.pg()}</script>\n<script type="application/json" id="pg-zh">{zh.pg()}</script>\n</body>\n</html>\n')
        self.serif |= zh.serif
        return ''.join(out)


# ---------------------------------------------------------------- the Chinese display face: what these pages add to the home's subset
def serif_extra(pages):
    home = B.Page(DATA, True, {}).serif_chars() | B.Page(DATA, False, {}).serif_chars()
    home |= set('·、，。：；！？《》「」（）—…ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    need = set().union(*(p.serif for p in pages))
    extra = sorted(ch for ch in need - home if ord(ch) >= 0x3000)
    if not extra: return ''
    dst = os.path.join(OUT, 'fonts', 'noto-serif-sc-600-pages.woff2'); os.makedirs(os.path.dirname(dst), exist_ok=True)
    B.subset(B.font_src('serif-sc'), dst, ''.join(extra), dict(wght=600), features=['kern', 'liga', 'locl', 'ccmp', 'halt', 'palt'])
    return ', '.join(f'U+{ord(ch):04X}' for ch in extra)


# ---------------------------------------------------------------- the bench under every style page, one file per language
def bench_file(zh, media):
    """media/bench-<lang>.json: what a style page of this language adds under its sheet (app.js): `stops`, the home page's 15
    stations and the finale with an empty place before them (the take's numbering: 0 is the opening), drawn for a style page's
    depth; `after`, the ruler, the screening room and the take's track; `idx`, the search index and words. Returns its address
    from a style page's root, with a content hash for the cache."""
    hp = B.Page(DATA, zh, media)
    hp.R = '../' * (3 if zh else 2)                       # every style page sits at [zh/]styles/<slug>/
    stops = '<div class="stop gone" data-stop="0" hidden></div>\n' + ''.join(hp.station(c) for c in DATA['categories']) + hp.finale(top='#film')
    room = (f'<dialog class="room" id="room" aria-label="OPUSCAR 98">{hp.room_player()}'
            f'<button class="x" type="button" aria-label="{E(hp.t("close"))}">×</button></dialog>\n')
    after = ('<div class="reel" aria-hidden="true"><canvas id="seq"></canvas></div><div class="grain" aria-hidden="true"></div>'
             '<div class="scrim" aria-hidden="true"></div><div class="veil" aria-hidden="true"></div>\n'
             + hp.rail() + room + '<div class="track" aria-hidden="true"></div>\n')
    body = json.dumps(dict(stops=stops, after=after, idx=json.loads(hp.index())), ensure_ascii=False, separators=(',', ':'))
    name = f'media/bench-{"zh" if zh else "en"}.json'
    p = os.path.join(OUT, name); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(body)
    import hashlib
    print(f'  {name:28s} {len(body.encode()) / 1024:6.1f} KB')
    return f'{name}?v={hashlib.sha1(body.encode()).hexdigest()[:10]}'


# ---------------------------------------------------------------- the Chinese text face: every Chinese character the site sets
CJK = re.compile(r'[\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]')


def sans_sc(out):
    """Noto Sans SC (400-600) cut to every Chinese character in the written pages and the search index, one file for the whole site
    (app.css declares it for U+3000-303F, U+3400-9FFF, U+F900-FAFF, U+FF00-FFEF; English pages use the system's for their few words)"""
    chars = set()
    for d, _, fs in os.walk(out):
        if os.path.relpath(d, out).split(os.sep)[0] in ('films', 'media', 'fonts', 'img', 'assets', 'posters', 'stills'): continue
        for f in fs:
            if f.endswith('.html'): chars |= set(CJK.findall(open(os.path.join(d, f), encoding='utf-8').read()))
    for f in ('media/search.json', 'opuscar98/styles.json'):
        p = os.path.join(out, f)
        if os.path.exists(p): chars |= set(CJK.findall(open(p, encoding='utf-8').read()))
    dst = os.path.join(out, 'fonts', 'noto-sans-sc.woff2')
    B.subset(B.font_src('sans-sc'), dst, ''.join(sorted(chars)), dict(wght=(400, 600)), features=['kern', 'liga', 'locl', 'ccmp', 'halt', 'palt', 'vert'])
    return len(chars), os.path.getsize(dst)


# ---------------------------------------------------------------- sitemap, llms.txt
def sitemap():
    paths = ['', *(f'styles/{s}/' for s in ORDER), 'opuscar98/', 'thanks/']
    rows = []
    for p in paths:
        alts = ''.join(f'<xhtml:link rel="alternate" hreflang="{h}" href="{B.LIVE}{pre}{p}"/>' for h, pre in (('en', ''), ('zh-CN', 'zh/'), ('x-default', '')))
        rows += [f'  <url><loc>{B.LIVE}{pre}{p}</loc>{alts}</url>' for pre in ('', 'zh/')]
    open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + '\n'.join(rows) + '\n</urlset>\n')


def llms():
    n = len(DATA['styles'])
    out = ['# Lemo-Opuscar', '',
           f'> {n} film styles for Claude Code. Each style is a reusable style prompt (STYLE.md) plus a short demo film made entirely in code '
           'by Claude Opus 5.5, with no video model. Install it as a Claude Code skill, pick a style, bring your own topic, and your agent directs the film.', '',
           f'Official repository: {G.REPO_URL} (by Lemomo, https://x.com/lemomo_ai). Forks are copies; this is the upstream.', '',
           '## Start here', '',
           f'- [README]({BLOB}/README.md): what it is, how to install the skill, the style grid',
           f'- [README in Chinese]({BLOB}/README.zh-CN.md): the same in Simplified Chinese',
           f'- [Agent instructions]({BLOB}/AGENTS.md): how an agent directs a film in one of the styles',
           f'- [The Workbench]({B.LIVE}): every style on a long workbench, one station per category, with its demo film; in Chinese at {B.LIVE}zh/',
           f'- [OPUSCAR 98]({B.LIVE}opuscar98/): 98 Years of Best Picture ({G.FEATURE["dur"]}), the feature film made with these tools',
           f'- [Thank-you films]({B.LIVE}thanks/): films made at 300, 800, 2,000, 3,000 and 6,000 stars',
           f'- [OPUSCAR 98, all 98 styles]({B.LIVE}opuscar98/#styles): per film the style, a reusable style prompt, and the shots and direction '
           f'(as JSON: {B.LIVE}opuscar98/styles.json)', '']
    for c in DATA['categories']:
        out += [f'## {c["en"]}', '']
        out += [f'- [{CAT[s]["en"]} · {CAT[s]["cn"]}]({BLOB}/styles/{s}/STYLE.md): {CAT[s]["line"]} (page: {B.LIVE}styles/{s}/)' for s in c['styles']]
        out.append('')
    open(os.path.join(OUT, 'llms.txt'), 'w', encoding='utf-8').write('\n'.join(out))


# ---------------------------------------------------------------- per-style checks
def checks(media, labels=None):
    """the per-style report (media.py --check): films and posters missing, stills moved off a bad frame, label scrims, aka, contributors, new, STYLE.md headings off the usual names"""
    if labels is None:
        lp = os.path.join(M.MEDIA, 'labels.json'); labels = json.load(open(lp)) if os.path.exists(lp) else {}
    out = dict(missing_film=[], missing_poster=[], stills_moved={}, labels={}, aka={}, by={}, new=[], headings={})
    for s in DATA['styles']:
        slug = s['slug']
        if not os.path.exists(os.path.join(M.WEB, slug + '.mp4')): out['missing_film'].append(slug)
        if not os.path.exists(os.path.join(ROOT, 'styles', slug, 'poster.jpg')): out['missing_poster'].append(slug)
        notes = [n for n in media.get(slug, {}).get('notes', []) if n.startswith('still')]
        if notes: out['stills_moved'][slug] = notes
        if slug in labels: out['labels'][slug] = labels[slug]
        if CAT[slug].get('aka'): out['aka'][slug] = CAT[slug]['aka']
        if CAT[slug].get('by'): out['by'][slug] = CAT[slug]['by']['name']
        if s.get('new'): out['new'].append(slug)
        odd = [(n, h, a) for n, h, a in style_sections(slug) if short_heading(h) not in SEC_ZH]
        if odd: out['headings'][slug] = [f'§{n} {h} → #{a}' for n, h, a in odd]
    json.dump(out, open(os.path.join(M.MEDIA, 'checks.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return out


def stars():
    """the repository's stars for the top bar, read once per build from the GitHub API (with GITHUB_TOKEN or GH_TOKEN when set, as in
    CI): "6.1k". Nothing when it can't be read: the bar then says "GitHub" without a number."""
    import urllib.request
    req = urllib.request.Request(f'https://api.github.com/repos/{C.REPO}', headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'lemo-opuscar-site'})
    tok = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
    if tok: req.add_header('Authorization', f'Bearer {tok}')
    try:
        n = int(json.load(urllib.request.urlopen(req, timeout=8))['stargazers_count'])
    except Exception as e:
        print(f'  stars: not read ({type(e).__name__}); the top bar says "GitHub" without a number'); return ''
    return f'{n / 1000:.1f}'.rstrip('0').rstrip('.') + 'k' if n >= 1000 else str(n)


def mirror(src, dst, skip=()):
    """src's files into dst, hard-linked where the disk allows (else copied); a file already there (the same file, or the same size and time) is
    left; dotfiles and symlinks are not media and stay behind"""
    n = 0
    for d, dirs, fs in os.walk(src):
        rel = os.path.relpath(d, src)
        dirs[:] = [x for x in dirs if os.path.normpath(os.path.join(rel, x)) not in skip]
        for f in fs:
            r = os.path.normpath(os.path.join(rel, f))
            a, b = os.path.join(d, f), os.path.join(dst, r)
            if r in skip or f.startswith('.') or os.path.islink(a): continue   # bookkeeping, or a link to someone's disk
            if os.path.exists(b) and (os.path.samefile(a, b) or (os.path.getsize(b) == os.path.getsize(a) and int(os.path.getmtime(b)) == int(os.path.getmtime(a)))): continue
            os.makedirs(os.path.dirname(b), exist_ok=True)
            if os.path.lexists(b): os.remove(b)
            try: os.link(a, b)
            except OSError: shutil.copy2(a, b)
            n += 1
    return n


def media_meta(media_dir):
    """meta.json of every film the site shows, from the media; stops, naming them, when some are missing"""
    M.MEDIA = media_dir
    out, missing = {}, []
    for j in M.jobs(DATA, [r[4] for r in o98_spans(False)]):
        p = os.path.join(media_dir, 'films', j['id'], 'meta.json')
        if not (os.path.exists(p) and os.path.exists(os.path.join(media_dir, 'films', j['id'], 'sprite.webp'))): missing.append(j['id']); continue
        out[j['id']] = json.load(open(p))
    if missing:
        raise SystemExit(f'pages.py: no media for {len(missing)} films in {media_dir}: {", ".join(missing[:12])}{" …" if len(missing) > 12 else ""}\n'
                         f'  make them: python3 styleboard/media.py --films <720p cuts> --media {media_dir}   (or unpack the {C.MEDIA_RELEASE} release there)')
    return out


def build_site(out, styles, categories, films=None, media=None):
    """The whole site into `out`. styles: build.py's published styles; categories: build.CATEGORIES; films: a folder of the 720p cuts
    (<id>.mp4), linked into <out>/films unless they're there already or load from outside the site (site_config.film_url: the style films
    from the films repository); media: the site's media."""
    global OUT
    import sitedata
    OUT = out
    media = os.path.abspath(media or C.MEDIA)
    if not os.path.isdir(media): raise SystemExit(f'pages.py: no media folder {media} (--media DIR, or OPUSCAR_SITE_MEDIA)')
    use(sitedata.site_data(styles, categories))
    meta = media_meta(media)
    fixed = M.real_durs(DATA)   # the lengths the pages print are the films' own
    if fixed: print('  lengths from the films, not style.json: ' + ', '.join(f'{a} {b}→{c:g}' for a, b, c in fixed))
    os.makedirs(out, exist_ok=True)
    # media: <media>/legacy/ at the site's root (old addresses), the rest under media/; the measuring files stay behind
    n = mirror(media, os.path.join(out, 'media'), skip={'legacy', 'labels.json', 'label-rects.json', 'checks.json', 'search.json', 'thumb/cards.json', 'o98/meta.json'})
    n += mirror(os.path.join(media, 'legacy'), out) if os.path.isdir(os.path.join(media, 'legacy')) else 0
    # from git: the scripts and styles, the old site's pictures (img/<slug>_<n>.jpg, OPUSCAR 98's frames, the thank-you posters),
    # the posters at their old address (also the share cards), GitHub's social preview as the home page's share card
    shutil.copytree(os.path.join(HERE, 'assets'), os.path.join(out, 'assets'), dirs_exist_ok=True)
    shutil.copytree(os.path.join(HERE, 'img'), os.path.join(out, 'img'), dirs_exist_ok=True)
    os.makedirs(os.path.join(out, 'posters'), exist_ok=True)
    for slug in ORDER: shutil.copyfile(os.path.join(ROOT, 'styles', slug, 'poster.jpg'), os.path.join(out, 'posters', slug + '.jpg'))
    shutil.copyfile(os.path.join(ROOT, 'docs', 'social.jpg'), os.path.join(out, 'img', 'social.jpg'))
    os.makedirs(os.path.join(out, 'opuscar98'), exist_ok=True)
    shutil.copyfile(BOOK_PATH, os.path.join(out, 'opuscar98', 'styles.json'))      # all 98 prompts as data (the old site's address)
    # the 720p films the site serves itself at films/<id>.mp4 (pages.yml downloads them there; locally they are linked). The style films
    # load from the films repository unless OPUSCAR_FILMS_BASE brings them inside (site_config.py)
    if films:
        for j in M.jobs(DATA, []):
            if not C.in_site(j['id']): continue
            fd = os.path.join(out, C.films_base(j['id']).strip('/'))
            if os.path.realpath(films) == os.path.realpath(fd): continue
            os.makedirs(fd, exist_ok=True)
            src, dst = os.path.join(films, j['id'] + '.mp4'), os.path.join(fd, j['id'] + '.mp4')
            if os.path.exists(src) and not os.path.lexists(dst): os.symlink(os.path.abspath(src), dst)
    search_index()
    lab_p = os.path.join(media, 'labels.json')
    labels = json.load(open(lab_p)) if os.path.exists(lab_p) else {}
    B.STARS = stars()
    B.build_home(out, DATA, meta)
    for zh in (False, True): BENCH[zh] = bench_file(zh, meta)
    pages = []
    for zh in (False, True):
        for slug in ORDER: pages.append(StylePage(zh, slug, meta, labels.get(slug, {}).get('level', 0), labels.get(slug, {}).get('top', 0)))
        pages += [O98Page(zh, meta), ThanksPage(zh, meta)]
    pages.append(NotFound(meta))
    html_out = [(p, p.render()) for p in pages]
    rng = serif_extra(pages)
    total = 0
    for p, h in html_out:
        face = (f'<style>@font-face{{font-family:"OC Serif SC";src:url({p.R}fonts/noto-serif-sc-600-pages.woff2) format("woff2");font-weight:500 700;font-display:swap;'
                f'unicode-range:{rng}}}</style>\n') if rng and (p.zh or isinstance(p, NotFound)) else ''
        h = h.replace('%%SERIF%%', face)
        dst = os.path.join(out, '404.html') if isinstance(p, NotFound) else os.path.join(out, 'zh' if p.zh else '', p.path, 'index.html')
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'w', encoding='utf-8').write(h)
        total += len(h.encode())
    sitemap(); llms()
    nc, nb = sans_sc(out)
    print(f'  fonts/noto-sans-sc.woff2      {nb / 1024:6.1f} KB ({nc} Chinese characters, the running text of every page)')
    print(f'  {len(html_out) + 2} pages ({total / 1024:.0f} KB of HTML besides the home page), {n} media files placed; sitemap.xml, llms.txt, opuscar98/styles.json')
