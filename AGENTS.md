# Lemo-Opuscar: instructions for agents

This repository is a library of film styles. Each style has a `styles/<slug>/STYLE.md` (what the style is) and one demo film made entirely in code (`DEMO.md` and `demo/`). People pick a style and ask for a film about **their own** topic. Your job is to direct and produce that film.

| The request | Go to |
|---|---|
| Any request: first see the user's own styles; no request yet: offer the ways in | **Start** below |
| A film about the user's topic (the normal case) | **Style and story**, **Workflow** below |
| A music video for a song the user brings (a fan MV, 二创, a lyric video) | [`MV.md`](MV.md), then **Workflow** below with its changes |
| "Which styles are there?" / no style chosen | **Finding the style** below |
| Directing: story, sound, rhythm, camera, checks, delivery | [`DIRECTOR.md`](DIRECTOR.md) |
| Building: install, pages, voice, music, mix | [`TECHNIQUE.md`](TECHNIQUE.md) |
| Tool commands and flags | [`core/README.md`](core/README.md) |
| The user wants to change a style and keep it as their own, or make their own style from a blank page, or names a style in `~/lemo-my-styles/` | [`MY-STYLES.md`](MY-STYLES.md) |
| Adding a style to the library (owner only) | [`MAINTAINING.md`](MAINTAINING.md) |

**Films outside `styles/` are the user's: no LemoLab credit, no watermark.**

## Start

- **Their own styles first.** If `~/lemo-my-styles/README.md` exists, read it: it lists every style the user has saved, wherever it's kept, and their own styles ([`MY-STYLES.md`](MY-STYLES.md)) count like library styles. When they name a style, look there first, then in the library.
- **Their language.** Talk to them in the language they write in. When they started the skill without writing anything, your first question is always the language, even when their settings, memory or earlier messages suggest one: the `AskUserQuestion` tool, a question of its own headed "Language 语言" with two options, 中文 and English (the tool adds Other, where they type any other language). Use it from then on, and as the film's default language.
- **No request yet** (they only started the skill, or said hello): offer the ways in with one question, using the `AskUserQuestion` tool, in their language, with the first as the recommended one:
  1. a film in a library style (**Finding the style**);
  2. change a library style and keep it as their own ([`MY-STYLES.md`](MY-STYLES.md));
  3. make their own style from a blank page ([`MY-STYLES.md`](MY-STYLES.md));
  4. a film in one of their own styles, only when they have some (name them).

  When their request already says which, skip the question.

## Style and story

- **`STYLE.md` is fixed**: the style's invariants (look, colour, type, motion, camera grammar, sound palette, native moves, pitfalls). Keep all of it.
- **Everything else is yours to direct** from the user's topic: story, structure, characters, settings, shots, timings, references, how data is charted. Never bend the topic toward the demo.
- **Treatment first, demo later.** Write your own `TREATMENT.md`, with three candidate structures and your choice (DIRECTOR.md §4), before you open `DEMO.md` or the demo code. Then use the demo only to learn techniques (a brush engine, a rig, a shader, a mix), never its story, arc, shots, props or timeline. One exception: a style cut from real material (Edit & Documentary) needs its material before the treatment, so the tools its `STYLE.md` names in `demo/tools/` for finding and logging material (`footage.py` and the like) may be used first, copied into the project folder and run there; still read `DEMO.md` and the rest of the demo only after the treatment is written.
- **Scene styles** (a set-up guide, a spec walkthrough, a museum plate, a trail guide) list use cases in their `STYLE.md`. Read them as grammar for the order in which information arrives and how long each part needs on screen, then build the user's content in your own structure. Swapping text into a demo's `content.json` is only a technical check, never the way to deliver.
- Never build inside `styles/`: copy what you need into the film's project folder.

## Finding the style

Users name a style by its gallery name in English or Chinese ("Impasto Oil Painting", "油画厚涂") or by its folder (`impasto`). Look it up in [`styles/README.md`](styles/README.md). If nothing matches clearly, show the closest two or three and ask.

If the user hasn't picked a style:
- Suggest two or three that fit their topic.
- If they have their own styles, list those first, under "My styles" (in their language).
- Show them the full list below in the chat, in the user's language only: English names (and English category names) for someone writing in English, Chinese names for someone writing in Chinese. Don't drop, merge or rename anything.
- Link the gallery, where every style has its demo film: https://lemomo-ai.github.io/lemo-opuscar/
- Then ask them to type the name. The list goes in your own message (a command's output isn't shown to them), and the question is plain text, not `AskUserQuestion`: its few options would hide the rest of the list.

<!-- style-list:start -->
All 66 styles · 全部风格:

- **剪辑与纪实 Edit & Documentary** (8): 字幕新闻 Caption News, 1920s 新闻影片 1920s Newsreel, 实时倒计时分屏 Live Countdown Split-screen, 延时交响 Time-lapse Symphony, 视觉调查 Visual Investigation, 构成主义蒙太奇 Constructivist Montage, 体育战术板 Sports Telestrator, 电视新闻包装 Broadcast News Package
- **实证影像 Evidence Films** (8): 卫星简报 Satellite Briefing, 工程简报板 Engineering Briefing Board, 点云测绘 LiDAR Survey, 白模投影 Projection on White Model, 数据实物化 Data Physicalization, 产品拆解 Exploded Teardown, 显微叙事 Microscope Story, 档案灯台 Archive Light Table
- **手绘与绘画 Hand-drawn & Painting** (8): 蜡笔儿童绘本 Crayon Picture Book, 水彩笔刷 Watercolor Brush, 中国水墨 Chinese Ink Wash, 油画厚涂 Impasto Oil Painting, 一笔画 One-line Drawing, 白板讲解 Whiteboard Explainer, 钢笔淡彩 Urban Sketch · Pen & Wash, 黑板粉笔 Chalkboard
- **东方传统 East Asian Traditions** (4): 皮影戏 Shadow Puppetry, 浮世绘 Ukiyo-e, 红色窗花剪纸 Red Paper-cut, 纸雕灯影 Paper-cut Lightbox
- **印刷与版画 Print & Printmaking** (6): Risograph 孔版印刷 Risograph Print, 复古半调案卷 Halftone Dossier, 木刻版画 Woodcut Print, 铜版画 Copperplate Engraving, 丝印旅行海报 Silkscreen Travel Poster, 印刷长镜头 Printed Long Take
- **图形与排版 Graphic & Type** (7): 瑞士动态排版 Swiss Motion Graphics, 60s 间谍片头 60s Spy Title Sequence, 装饰艺术 Art Deco, 蓝图 / 工程制图 Blueprint, 彩色玻璃窗 Stained Glass, 象形运动图形 Pictogram Motion, ASCII / CRT 终端 ASCII / CRT Terminal
- **信息与发布 Information & Keynote** (8): 数据叙事 Data Storytelling, 等距信息图 Isometric Infographic, 暗色科技发布 Dark Tech Keynote, 活体实机录屏 Living Screencast, 科幻全息界面 Sci-fi Hologram HUD, 地铁线路图 Transit Map, 等距绘本 Isometric Picture Book, 电路板 Circuit Board
- **卡通与动画 Cartoon & Anime** (4): 1930s 橡皮管卡通 1930s Rubber Hose Cartoon, 80 年代赛璐璐动画 80s Cel Anime, 科幻情景喜剧卡通 Sci-Fi Sitcom Toon, 50s 扁平卡通 Mid-century Cartoon
- **游戏 Games** (4): 16-bit 像素 RPG 16-bit Pixel RPG, HD-2D, 微游戏快闪 Microgame Frenzy, 综艺节奏扁平 Game Show Flat
- **电影与时代 Cinema & Eras** (2): 1920s 默片 1920s Silent Film, 后室 / 新怪谈 Liminal Found Footage
- **材质与 3D Materials & 3D** (7): 积木玩具 Brick Toy, 纸片立体书 Paper Pop-up Book, 移轴微缩 Tilt-Shift Miniature, 低多边形等距 Low-poly Isometric Island, 玻璃质感产品 Glass Product Render, 孟菲斯微缩景观 Memphis Diorama, 桌面穿梭 Desktop Flythrough
<!-- style-list:end -->

## Workflow

1. **Brief.** Make sure the style and the topic are clear, then ask the user once, in a single message (DIRECTOR.md §1):
   - anything about the topic you can't decide yourself (facts; names, logos or products that must appear);
   - whether they have material of their own: a voice recording or a preferred voice, music, photos, logos, fonts, and for a style built from real material, their own data or scans;
   - the film's language, if it isn't obvious (default: the language they write in or chose, for voice and subtitles);
   - whether they want to review a storyboard first (default: no);
   - anything missing on their machine: first run `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps` from the library root (core only) and include what it reports. Add the voice and music tiers later, only if the film needs them (TECHNIQUE.md §1).

   A music video asks other things (the song, its version, lyrics language, length): MV.md §1.

   Skip what their request already answers. Wait for the reply, fill every other gap with a sensible default, sum up the brief in a few lines and start. Don't come back with more questions.
2. **Treatment.** Write `TREATMENT.md` in the project folder (DIRECTOR.md §4), before you open the demo (an Edit & Documentary style gathers its material first: **Treatment first** above).
3. **Look.** Render style frames or a model sheet with the real drawing code and check them against `STYLE.md` (DIRECTOR.md §5).
4. **Storyboard, only if the user asked for it** (DIRECTOR.md §5). **Stop and wait for approval.** Otherwise don't stop.
5. **Produce.** Voice → check → score (can run in parallel) → animation → mix → render (TECHNIQUE.md). For a music video: song → lyrics → song map → animation → mux with the song (MV.md).
6. **Self-check and deliver** (DIRECTOR.md §11).

Report progress in the user's language. If a step fails, read the error, fix the cause and retry; go back to the user only for a decision or something only they can provide.

## Where things go

- The film's project folder is `films/<name>/` in a clone (ignored by git), or `<name>/` in the user's folder in skill mode (see the skill's `SKILL.md`). Wherever a guide says `films/<name>/`, read "the project folder". Work only there, unless the user asks you to work in their own project.
- Run `node core/…` and `sh tools/…` from the library root (`$LIB` in skill mode).
- `core/` has ready-made tools (rendering, TTS, speech check, sampler, sfx, mux). Use them or your own stack, but don't edit `core/` or `styles/` for a user's film.
- Never kill processes you didn't start. Don't leave background processes running.
