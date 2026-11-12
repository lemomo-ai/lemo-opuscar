# Words and data the site and the README share. The pages themselves are styleboard/pages.py and home.py; the settings a fork
# changes are in styleboard/site_config.py. Read by build.py (the README's stations and thank-you cards, styleboard/anchors.json),
# styleboard/art/readme.mjs, pages.py and sitedata.py. Text that style.json doesn't hold (use tags, Chinese for "uses", one line on
# each look) is in styleboard/i18n.json.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from site_config import SITE_URL, REPO, REPO_URL, FILMS_URL, THANKS_URL   # noqa: F401 (SITE_URL, REPO: for whoever reads them from here)

# the newest release's styles: a small "New" on their cards (the site) and the README's cards; replace the list at each release
NEW = frozenset(('colored-pencil', 'sketchnote', 'stick-explainer', 'ipad-sketch', 'marker-paper', 'gilded-illumination', 'pop-art', 'vintage-collage', 'bauhaus-shapes', 'flat-space-explainer', 'text-flash-cuts', 'silhouette-rhythm', 'hardcore-info', 'precise-mechanism', 'instruction-manual', 'pen-plotter', 'assembly-line-diagram', 'comic-history', 'manga-panels', 'scratch-film', 'double-exposure', 'spreadsheet', 'one-bit-dither', 'firefly-pointillism', 'flow-field', 'oscilloscope-math', 'neon-tubes', 'crayon-world', 'security-xray', 'dark-documentary', 'thermal-camera', 'map-explainer', 'pip-simulation'))

# One sentence per category on what its pictures look like (English, Chinese). Keys are build.py CATEGORIES' English names.
CAT_DESC = {
    'Edit & Documentary': ('Cut from real footage, documents and data: captions, newsreels, montage, broadcast graphics.', '用真实影像、文件和数据剪成：字幕新闻、新闻片、蒙太奇、电视包装。'),
    'Painting & Illustration': ('Pictures painted stroke by stroke: crayon, watercolour, oil, pen and wash, coloured pencil.', '一笔一笔画出来的画面：蜡笔、水彩、油画、钢笔淡彩、彩铅。'),
    'Sketch & Board': ('Drawn while it is explained: whiteboard, chalk, marker, sketch notes and stick figures.', '边讲边画：白板、黑板粉笔、马克笔、视觉笔记、火柴人。'),
    'Traditional Crafts': ('Old crafts, their look and their pace: ink wash, shadow puppets, woodblocks, paper-cuts, stained glass, gold leaf.', '老手艺的样子和节奏：水墨、皮影、浮世绘、剪纸、彩窗、金箔。'),
    'Print & Printmaking': ('Ink pressed into paper: risograph, halftone, woodcut, engraving, screen print, collage.', '油墨压进纸里：孔版、网点、木刻、铜版、丝印、拼贴。'),
    'Graphic & Type': ('Flat shapes and type take the lead: Swiss grids, title sequences, pictograms, silhouettes.', '平面图形和字当主角：瑞士网格、片头字幕、象形符号、剪影。'),
    'Line Diagrams': ('Clean line drawings that show how things work: blueprints, cutaways, manuals, exploded views.', '干净的线稿讲清东西怎么运转：蓝图、剖视、说明书、爆炸图。'),
    'Cartoons': ('Characters in classic cartoon looks: 1930s rubber hose, 80s cel anime, sitcom toons, manga panels.', '经典卡通画风的角色：30 年代橡皮管、80 年代赛璐璐、情景喜剧、漫画分格。'),
    'Games': ('The look and rhythm of games: pixel RPGs, 2.5D pixel art, microgames, game shows.', '游戏的画面和节奏：像素 RPG、2.5D 像素、微游戏、综艺。'),
    'Film & Tape': ('The texture of a medium: silent film, VHS found footage, CRT terminals, scratched film, double exposure.', '媒介本身的质感：默片、录像带、CRT 终端、胶片直刻、双重曝光。'),
    'Screens & Interfaces': ('Told on screens: keynotes, live apps, HUDs, spreadsheets, app cards on a tabletop.', '在屏幕里讲：发布会、实机界面、全息、表格、桌面卡片。'),
    'Light & Lines': ('Pictures drawn in light: neon tubes, circuit traces, fireflies, flow lines, an oscilloscope beam.', '用光画出来的画面：霓虹灯管、电路走线、萤火、流线、示波器。'),
    '3D & Miniature': ('Real 3D scenes and small worlds: bricks, pop-up books, tilt-shift towns, glass, dioramas.', '真 3D 场景和小世界：积木、立体书、移轴小城、玻璃、微缩景观。'),
    'Instruments & Evidence': ('Seen through instruments: satellite, LiDAR, microscope, X-ray, thermal camera; every number sourced.', '透过仪器看：卫星、激光扫描、显微镜、X 光、热成像，每个数字都有出处。'),
    'Data & Maps': ('Numbers and places made visible: charts, maps, physical data, models, simulations.', '把数字和地方画出来：图表、地图、实物数据、模型、模拟。'),
}

# Anchors the gallery used before the 15 categories (and Chinese names, old and new) → the new category group, or "use:<tag>" for a filter.
OLD_ANCHORS = {
    'edit-documentary': 'edit-documentary', 'evidence-films': 'instruments-evidence', 'hand-drawn-painting': 'painting-illustration',
    'east-asian-traditions': 'traditional-crafts', 'print-printmaking': 'print-printmaking', 'graphic-type': 'graphic-type',
    'information-keynote': 'data-maps', 'cartoon-anime': 'cartoons', 'games': 'games', 'cinema-eras': 'film-tape', 'materials-3d': '3d-miniature',
    '剪辑与纪实': 'edit-documentary', '实证影像': 'instruments-evidence', '手绘与绘画': 'painting-illustration', '东方传统': 'traditional-crafts',
    '印刷与版画': 'print-printmaking', '图形与排版': 'graphic-type', '信息与发布': 'data-maps', '卡通与动画': 'cartoons', '游戏': 'games',
    '电影与时代': 'film-tape', '材质与 3D': '3d-miniature', '材质与3D': '3d-miniature', 'all': 'styles', 'feature': 'opuscar98',
}

# What search engines and AI answer engines read: JSON-LD naming the upstream repo and its author (the addresses: site_config.py).
AUTHOR = {'@type': 'Person', '@id': 'https://github.com/lemomo-ai', 'name': 'Lemomo', 'url': 'https://github.com/lemomo-ai',
          'sameAs': ['https://x.com/lemomo_ai', 'https://github.com/lemomo-ai']}
# the install commands, as README.md gives them
INSTALL_PLUGIN = ['claude plugin marketplace add lemomo-ai/lemo-opuscar', 'claude plugin install lemo-opuscar@lemolab']
INSTALL_CLONE = ['git clone https://github.com/lemomo-ai/lemo-opuscar.git', 'cd lemo-opuscar', 'claude']
# The feature film: its sources are not in the library; the 720p cut is on the "web" release (the pages play it from
# site_config.film_url, inside the site), 1080p on "films".
FEATURE = dict(poster='img/feature_opuscar98.jpg', dur='6:31', full=f'{FILMS_URL}/opuscar98.mp4', date='2026-09-29')
# Thank-you films (made at 300, 800, 2,000, 3,000 and 6,000 stars): 720p on the "web" release as stars<n>.mp4, 1080p on the "thanks" release,
# posters in img/thanks/. (id, length, date, (title, 标题), (description, 说明))
THANKS_REL = THANKS_URL
THANKS = [
    ('stars6000', '0:50', '2026-10-24', ('6,000 stars · The Quilt', '6000 星 · 百家被'),
     ('One star, one patch: 6,000 stargazers sew a quilt for a library not yet a month old. Little Clawd falls asleep under it and dreams in the library\'s styles.',
      '一颗星一块布，6000 位点星的人给还没满月的库缝了一床百家被。小 Clawd 盖着它睡着了，梦里是库里的各种画风。')),
    ('stars3000', '0:48', '2026-10-19', ('3,000 stars · Class Photo', '3000 星 · 全家福'),
     ('Clawds in 25 of the library\'s styles squeeze into one class photo; it develops in the darkroom with every stargazer\'s name printed under it.',
      '库里 25 种画风的 Clawd 挤进一张全家福，在暗房里显影出来，下面印着每一位点星的人。')),
    ('stars2000', '0:50', '2026-10-12', ('2,000 stars · Refresh', '2000 星 · 刷新'),
     ('One screen, seventeen days. Every count, name and timestamp is real: from the first git push to the 2,000th star, and a reply to the first issue.',
      '一块屏幕上的十七天。每个数字、名字和时间都是真的：从第一次 git push 到第 2000 颗星，再到给第一个 issue 的回复。')),
    ('stars800', '0:39', '2026-10-03', ('800 stars · Reverse Shot', '800 星 · 反打'),
     ('Clawd watches the library\'s films in the projector beam until the film burns through; a reverse shot reveals 800 seats, each with a stargazer\'s name.',
      'Clawd 站在放映光束里看库里的片子，直到胶片烧穿；镜头反打，800 个座位上写着 800 位观众的名字。')),
    ('stars300', '0:18', '2026-09-28', ('300 stars · The Lamplighter', '300 星 · 点灯人'),
     ('In one continuous shot Clawd lights 300 stars, each in a different style; pulled back, they spell 300.',
      'Clawd 一镜到底点亮 300 颗星，每颗一种画风；镜头拉远，它们拼成 300。'))]
THANKS_ALIAS = {'stars6000': 'stars5000'}   # the 6,000-star cut replaced the 5,000-star one; old #stars5000 links land on it

# Words the new pages kept from the old site, (English, Chinese); {n} and friends are filled in where used. home.py and pages.py have the rest.
UI = {
    'skip': ('Skip to content', '跳到正文'),
    'lang_other': ('中文', 'English'), 'lang_other_label': ('切换到中文', 'Switch to English'),
    'hero_h1': ('Pick a style.<br>Bring your story.<br><em>Your agent makes the film.</em>', '挑一个风格，<br>讲你的故事，<br><em>片子让 agent 拍。</em>'),
    'hero_lead': ('A library of {n} film styles for Claude Code and other coding agents. Every style comes with a short film made entirely in code by Claude Opus 5.5, with no video model.',
                  '{n} 种影片风格，给 Claude Code 等编程 agent 用。每种都配一支 Claude Opus 5.5 完全用代码做出来的短片，没用任何视频模型。'),
    'browse': ('Browse the {n} styles', '看全部 {n} 种风格'), 'how_btn': ('How it works', '怎么用'), 'envelope_btn': ('Open an envelope', '拆个信封'),
    'say_tpl': ('Make a film in the {style} style about {topic}.', '用{style}风格给我做一支关于{topic}的片子。'),
    'say_topic_ph': ('the coffee farm my family runs', '我家的咖啡园'),
    'topic_slot': ('‹your topic›', '〈你的题目〉'),
    'say_hint': ('You can name the style in English or Chinese, and add a length, a narrator or your own photos and music.',
                 '风格名用中文或英文都行；还可以加上时长、旁白的声音，或者你自己的照片和音乐。'),
    'copy': ('Copy', '复制'), 'copied': ('Copied', '已复制'),
    'tab_plugin': ('Claude Code plugin', 'Claude Code 插件'), 'tab_clone': ('Clone the repo', 'clone 仓库'),
    'plugin_p': ('Then use it from any folder. Each film is made in the folder you start from.', '之后在任何目录都能用，每支片子做在你发起时所在的文件夹里。'),
    'clone_p': ('Films go into films/<name>/ inside the repo.', '片子做到仓库里的 films/<名字>/。'),
    'n_styles': ('{n} styles', '{n} 种'),
    'search': ('Search styles, films, uses', '搜风格、片名、用途'), 'search_label': ('Search', '搜索'),
    'new': ('New', '新'),
    'feat_eyebrow': ('Feature presentation', '特别放映'), 'feat_sub': ('98 Years of Best Picture · 1927–2025 · {dur}', '98 年最佳影片 · 1927–2025 · {dur}'),
    'feat_p': ('One Clawd walks through all 98 Best Picture winners, each one redrawn in a style that fits the film. Every frame, note and cut was written in code by Claude Opus 5.5.',
               '一个 Clawd 走过 98 部最佳影片，每一部都换成贴合那部电影的画风。每一帧、每个音符、每一刀剪辑，都是 Claude Opus 5.5 写代码做出来的。'),
    'feat_watch': ('Watch the film', '看这支片'), 'feat_styles': ('All 98 styles and prompts', '98 种风格和提示词'), 'watch': ('Watch', '播放'),
    'foot_sign': ('Every frame on this page was rendered by the project’s own code.', '页面上的每一帧，都是本项目的代码自己渲染的。'),
    'foot_repo': ('Source on GitHub', 'GitHub 源码'), 'foot_made': ('Made by LemoLab × Claude Opus 5.5', 'LemoLab × Claude Opus 5.5 出品'),
    'foot_official': ('Official repo: {repo} · by Lemomo', '官方仓库：{repo} · 作者 Lemomo'),
    # style page
    'crumb_all': ('All styles', '全部风格'),
    'make_btn': ('Make a film in this style', '用这个风格做片'), 'download': ('Download 1080p', '下载 1080p'),
    'stills_p': ('Click a still to jump the film there.', '点一张静帧，影片跳到那里。'),
    'still_alt': ('{name}: a still at {t}', '{name}：{t} 的静帧'),
    'make_h': ('Make a film in this style', '用这个风格做你的片'),
    'make_p': ('Type your topic, copy the sentence and say it to your agent.', '写上你的题目，复制这句话，告诉你的 agent。'),
    'make_first': ('First time? Install the skill once:', '第一次用？先装一次 skill：'),
    'f_cat': ('Category', '类别'), 'f_good': ('Good for', '适合做'), 'f_film': ('Demo film', 'Demo 片'),
    'f_aka': ('Formerly', '曾用名'), 'f_folder': ('Folder', '文件夹'), 'f_by': ('Contributed by', '贡献者'),
    'l_style': ('STYLE.md: the style guide', 'STYLE.md：风格说明（英文）'), 'l_demo': ('DEMO.md: how the demo was made', 'DEMO.md：这支 demo 怎么做的（英文）'),
    'l_dl': ('Download the 1080p film', '下载 1080p 影片'),
    'prev': ('Previous nominee', '上一个'), 'next': ('Next nominee', '下一个'),
    # OPUSCAR 98
    'o_title': ('OPUSCAR 98 · 98 Years of Best Picture, made in code by Claude Opus 5.5', 'OPUSCAR 98 · 98 年最佳影片，Claude Opus 5.5 用代码做成'),
    'o_desc': ('OPUSCAR 98: one Clawd walks through all 98 Best Picture winners (1927 – 2025), each redrawn in a style that fits the film. '
               'Every frame, note and cut was written in code by Claude Opus 5.5, with no video model.',
               'OPUSCAR 98：一个 Clawd 走过全部 98 部最佳影片（1927 – 2025），每一部都换成贴合那部电影的画风。每一帧、每个音符、每一刀剪辑都由 Claude Opus 5.5 写代码做成，没用视频模型。'),
    'o_away': ('Playing in the corner. Scroll back here to watch it large.', '正在右下角播放，滚回这里看大画面。'),
    'o_loop': ('Loop this film', '循环本段'), 'o_close': ('Close the player', '关闭播放器'),
    'o_run': ('Running time', '片长'), 'o_run_v': ('98 films, 1927 – 2025', '98 部影片，1927 – 2025'),
    'o_with': ('Made with', '制作'), 'o_with_v': ('Claude Opus 5.5 in Claude Code', 'Claude Code 里的 Claude Opus 5.5'),
    'o_with_s': ('Direction, drawing, score and edit, all in code', '导演、作画、配乐、剪辑都是代码'),
    'o_model': ('Video model', '视频模型'), 'o_model_v': ('None', '没有'), 'o_model_s': ('No video generation model was used', '没有用视频生成模型'),
    'o_by': ('By', '作者'),
    'o_book_h': ('The 98 styles', '98 种风格'),
    'o_book_p': ('Every film in OPUSCAR 98 got its own style. Here is each one: what the style is, a prompt to reuse it on your own topic, and how the shots were directed. '
                 'Click a frame to play that film: it loops in a small player that stays in the corner while you keep reading.',
                 '98 部影片，每部一种定制画风。这里逐部公开：风格是什么、拿去拍你自己题材的提示词、镜头怎么设计和编排。点截图就播放那一部：它在右下角的小播放器里循环，你可以边看边往下翻。'),
    'o_all': ('All films', '全部'), 'o_all_k': ('All', '全部'), 'o_decade': ('Decade', '年代'), 'o_kind': ('2D or 3D', '2D 或 3D'),
    'o_search': ('Search a film or a style', '搜索片名或风格'),
    'o_play': ('Play No.{no} in the film', '在片中播放第 {no} 部'),
    'o_copy': ('Copy prompt', '复制提示词'), 'o_prompt': ('Style prompt', '风格提示词'), 'o_shots': ('Shots & direction', '镜头与导演编排'),
    'o_refs': ('References: ', '对标：'), 'o_style_lbl': ('Style: ', '风格：'),
    'o_json': ('All 98 as JSON:', '全部数据：'),
    'o_made_h': ('How it was made', '怎么做的'),
    'o_made_1': ('No video model drew this film. Claude Opus 5.5, working in Claude Code, wrote each set, the character animation, the camera moves, the edit and the score as code, and the code rendered them to video.',
                 '这部片没有用视频模型生成。Claude Opus 5.5 在 Claude Code 里把每个布景、角色动画、运镜、剪辑和配乐都写成代码，再由代码渲染成视频。'),
    'o_made_2': ('The same approach is packaged as Lemo-Opuscar: {n} film styles, each a style prompt plus a demo film, installable as a Claude Code skill so your agent can direct a film about your own topic.',
                 '同样的做法整理成了 Lemo-Opuscar：{n} 种影片风格，每种是一份风格提示词加一支样片，可以装成 Claude Code skill，让你的 agent 给你自己的题材导一支片。'),
    'o_kind_2D': ('Drawn flat, in layers', '平面绘制，分层'), 'o_kind_2.5D': ('3D models rendered into flat 2D layers', '3D 模型渲染进 2D 平面图层'),
    'o_kind_3D': ('A real 3D scene and camera', '真 3D 场景和机位'),
    # thank-you films
    't_title': ('Thank you for every star · Lemo-Opuscar', '谢谢每一颗星 · Lemo-Opuscar'),
    't_desc': ('Lemo-Opuscar thank-you films at 300, 800, 2,000, 3,000 and 6,000 GitHub stars, each made entirely in code by Claude Opus 5.5, with no video model.',
               'Lemo-Opuscar 在 300、800、2000、3000、6000 颗 GitHub 星时做的感谢片，每支都由 Claude Opus 5.5 完全用代码做成，没用视频模型。'),
    't_eyebrow': ('Thank you', '谢谢'), 't_h1': ('For every star', '谢谢每一颗星'),
    't_lead': ('At each milestone we made a thank-you film, in code like everything else here: no video model, every frame, note and cut written by Claude Opus 5.5.',
               '每到一个里程碑，我们做一支感谢片。和这里的所有片子一样全部用代码做成：没有视频模型，每一帧、每个音符、每一刀剪辑都由 Claude Opus 5.5 写出来。'),
    't_end': ('Thank you for watching, and for starring.', '谢谢观看，也谢谢你点的星。'),
    'foot_more': ('More from LemoLab', 'LemoLab 的其他项目'),
    'o_98': ('The 98 styles', '98 种风格'),
    'say_topic': ('Your topic', '你的题目'),
}

# "More from LemoLab", word for word from README.md / README.zh-CN.md (names, links and lines); change them there first.
MORE = [(('lemo-wake', 'lemo-wake'), 'https://github.com/lemomo-ai/lemo-wake',
         ('One picture in, a seamless loop of about five seconds out.', '一张图进去，一段约 5 秒、无缝循环的动图出来。')),
        (('lemo-mod', 'lemo-mod'), 'https://github.com/lemomo-ai/lemo-mod',
         ('Re-skin Claude Code with 21 styles, in the terminal and the desktop app.', '给 Claude Code 换上 21 套风格，终端和桌面 App 都能用。')),
        (('Stampy', '小章 Stampy'), 'https://github.com/lemomo-ai/lemo-stampy',
         ('A tiny Mac menu bar stamp that marks your copies “For XX use only”.', 'Mac 菜单栏小工具，在预览里点一下，给复印件盖上「仅供××使用」。'))]
