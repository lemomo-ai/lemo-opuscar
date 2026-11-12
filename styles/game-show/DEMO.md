# Rhythm Game Show — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *AI进化节拍 · Rhythm of AI 1997 → 2026* (148.8 s, 1920×1080, 30 fps) · `game-show.mp4` · source in [`demo/`](demo/) · engine: plain SVG DOM with a pure `render(t)`, screenshotted by Playwright + Chrome Headless Shell; original score synthesized in numpy from the picture's own `events.json`.


**Language note.** All on-screen text in the demo is **Chinese** (level names, year banners, labels, the report card, the credit card). The only audio words are short **English shouts** ("Game over.", "Hey!", "Question!"). There is **no narration**. To make an English version, see "Switching the text to English" below.

## Story & structure

The history of AI from 1997 to 2026 staged as a **game show made of rhythm levels**. The film opens on a title set where the whole cast drops in on the beat and counts "One! Two! Three! Four!". Then comes a run of **levels**. Each level is **one bar of title card** (GAME N + name + years, flying in on a brass jingle) followed by **eight bars of play**: a pattern is set up in the first half, answered or escalated in the second, and the last beat (bar 7, beat 3) is a **slam + "Perfect!"** judgement. A **remix** level near the end piles every recent event onto one set, with a month timeline across the top and shrunken thumbnails of each finished bit parked along the bottom. The ending hatches a new character from an egg, types out a **report card** ("AI 进化史 · 成绩单") with an Encore! star, and closes on a **credit card**.

This is an unofficial fan piece about the history of AI. The companies and products named on screen (among them OpenAI, Google, Anthropic, Meta, DeepSeek, xAI, Mistral, IBM, Alibaba's Qwen, Moonshot's Kimi and Midjourney) did not make or endorse it. Every factual claim on screen and in the shouts is listed with its source in `demo/FACTS.md` (checked 2026-11-07); a film about real products needs the same.

How the demo spent the native moves:

| Native power | Demo use |
|---|---|
| **Levels with years** | Chess and Go (1997–2016), quiz show (2011), attention factory (2017–2020), AI art studio (2021–2024), chat chorus (2022–2023), thinking + price war (2024–2025), agent pipeline (2025), then a 2026 remix. |
| **Call-and-response** | Human move / machine move (chess), question / buzzer (quiz), lead "Hey!" / crowd "Hey!" (chorus), task drops / stamp DONE (agents). Go stones on eighth notes after chess on quarter notes. |
| **Judgement words** | "Perfect!", "第 37 手！", "翻倍！", price tags getting hammered, "9.9 ✓" thought bubbles. |
| **Stats as game UI** | Podium dollar scores, a users counter racing to 1,000,000, parameter counts, price tags ($60 → $2.19), a bar chart that grows by beat. |
| **Remix / thumbnails** | One set, a month ribbon, each item gets 2 bars centre stage and then shrinks (×0.27) into a slot at the bottom. In the finale all thumbnails bounce together under a giant year. |
| **Egg → report card → credit** | A "next level" tease (NEXT egg hatches a "???" baby bot), then a typewriter recap of three lines, then the credit card. |

**Demo shape:** cold open on the cast + count-in (4 bars) → 7 levels of 9 bars (card + 8) → 1-bar REMIX card → 16-bar remix (7 items × 2 bars + 2-bar finale) → 9-bar ending (egg 2 bars, "Hi!" 1 bar, report card 3 bars, credit 3 bars incl. 0.8 s fade). Total 93 bars = 148.8 s.

How the topic is adapted: list the phases, give each one *one verb that can repeat on a beat* (place, buzz, pump, splat, sing, hammer, stamp), a year range and a set colour, and pick one "Perfect!" moment per level. The topic has a crowd (many companies and products), so they become bean contestants with name tags dropping in one per beat.

## Shots

No camera travel anywhere in the demo: a frontal, symmetrical proscenium throughout. Tempo `BPM = 150`, `B = 0.4 s`, `BARL = 1.6 s`.

| Section | Bars | Camera / cut | Note |
|---|---|---|---|
| Cold open + title | 0–3 | locked wide, punches on each count | "AI 进化节拍" 200 px, white with a 26 px ink stroke, glyphs popping 0.06 s apart; subtitle "RHYTHM OF AI · 1997 → 2026" in Fredoka; the cast drops in behind it one per half-beat, each with a pitched pip |
| Levels 1–7 | 4–66 | hard cut + 0.08 s white flash on each card bar; punches 0.008 (ticks), 0.02 (hits), 0.03–0.05 (slams) | card bar, then 8 bars of play, slam + "Perfect!" on bar 7 beat 3 |
| REMIX card + remix | 67–83 | locked wide, thumbnails shrink into bottom slots | month ribbon across the top |
| Ending | 84–92 | hard cuts on bar lines; the only fade: last 0.8 s to navy | egg → "Hi!" → report card (typewriter, one character per 1/8 beat, key click per 2 characters) → credit card |

## Score structure

- **Score (`music.py` + `synth_lib.py`)**: 150 BPM, a four-chord loop F–G–Em–Am (the J-pop "royal road", one chord per bar, `CH`), two 8-note melodies `MA` / `MB`. Instruments: tanh-shaped sine kick, band-passed noise snare and clap, hats, slap bass (`slap`, patterns funk/drive/pump/soft), detuned-saw **brass stabs** with a closing filter, square lead with vibrato, pluck (marimba), bell (music box), triangle pad, square arp, cowbell.
- Each bar gets a mode in `PLAN` (`main`, `count`, `funk`, `quiz`, `electro`, `dream`, `film`, `pop`, `popBig`, `think`, `heavy`, `agent`, `agentFast`, `fill`, `future`, `futureBig`, `egg`, `calm`, `fanfare`, `end`), one flavour per level. Level cards get a **jingle** (crash + kick + rising brass arpeggio + snare roll into the level). The 2026 remix transposes up 2 semitones.
- **Event-driven SFX**: `node render.mjs events` exports every `ev()` from the picture to `events.json` (474 events in the demo). `music.py` maps each event name to a sound: `tock`/`bleep` (chess), `stone` (Go), `ding`/`boop`/`buzz` (quiz), `land` (plop + boing), `pip` (pitched pop, uses `f`), `slam`/`bigslam`, `stamp`, `type`, `crack`/`hatch`, `servo`, `liftoff`, `swish`, `clap`, `drop`, `blip`, `kickhit`, `splat`, `denoise`, `cheer`. Unknown names are silently ignored.
- **Shouts**: `v:<name>` events play `voices/<name>.wav`. The 40 calls are Kokoro voices (`core/tts/`, Apache-2.0, offline) listed in `voices/shouts.json` (id, text, Kokoro voice, speed, pitch, fx) and made by `make_voices.py`: each starts after 40 ms of silence and is pitch-shifted ×0.96–1.28 without changing length (`asetrate` + `atempo`); machine lines ("Game over.", "Move thirty seven.", "Attention!") get a light metallic ring (`fx: "robot"`). Hosts are `af_bella` / `am_puck`. The crowd "Hey!" is six different voices stacked 5–6 ms apart and panned −0.6…+0.6 (`v:crowd`, `v:heyAll`, `v:heyBig`); `v:heyVar` picks one voice per contestant. Shouts are placed 20–30 ms *before* the beat. Every call passes Whisper `small.en` (`build.sh` step 2).
- **Mix**: voices + SFX go to their own bus; the music is ducked by up to 40 % from a 12 Hz envelope of that bus; last 0.8 s fades; peak-normalize to 1.5 then `tanh` soft-clip ×0.9 → `music.wav` (44.1 kHz). `finish.sh` hands it to `core/render/mux.sh`: two-pass loudnorm to **−14 LUFS**, true peak at or under **−1 dBTP**, 48 kHz AAC 256k.

## Palette & props

**Canvas & line:** 1920×1080 SVG. Outline `K.ol = #1B1B1B`, width `OW = 8` px (`SO` spread: stroke, 8 px, round join and cap); 5–7 px on small parts. Hard offset shadow +10 px (banners) or +14 px (level cards).

**Palette (`K` in `main_v1.js`/`main.js`):**
| Role | Colours |
|---|---|
| Ink / paper | `ol #1B1B1B`, `white #FFFFFF`, `cream #FFF6E5` (cards, report card) |
| Candy primaries | `yellow #FFD23F`, `orange #FF8C42`, `red #FF5A5F`, `pink #FF8FB1`, `green #5BD68A`, `lime #C6F16D`, `sky #8ED1FC`, `blue #4D7CFE` |
| Deep sets | `purple #6B4FBB` / `purpleD #46318F`, `teal #3FB8AF` / `tealD #2B8F88`, `navy #26264A` (ending) |
| Props | `wood #C98A52` / `woodD #8E5530`, `gray #C3CAD9`, `chalk #2F5D50`, `skin #FFD1A8` |
| Character hues | `gpt #19B388`, `claude #D97757`, `gem1 #4E7CF6` / `gem2 #9B6CF0`, `llama #F4E9D8`, `seek #5A78E8`, `dblue #2B59C3` |

Sets use `stripes()` (diagonal bands, often slowly scrolling), `dots()` (offset polka dots at 18–25 % white) or `raysEl()` (a rotating sunburst). Floor band at y = 860–900 with an 8 px ink line on top.

**Type:** Chinese = **Noto Sans SC 900** (`F.sans`) everywhere; Latin display = **Fredoka 700** (`F.round`: GAME N, years, "Perfect!", name tags, numbers); **ZCOOL KuaiLe** (`F.cute`) only for hand-written props. Big words use `gtext()`; title text uses `chars()`.

**Characters (`bean()` in `main_b.js`):** a rounded bean body (160 px wide, 172 px tall at scale 1), two stubby arms with white mitten hands, two foot ovals, oval eyes with a white catch-light, pink blush, a small curved mouth that swaps to an open red mouth. Identity = body colour + belly patch + **one** head mark (antenna ball, heart, "?", moon, bolt, cloud, sprout, brush, beret, captain hat, llama wool, magnifier) + an ink name-tag pill under the feet. Gemini is two half-size beans (`twins()`). Humans (`human()`) have a shirt, a round head, hair cap, optional glasses and a sweat drop. Machines of the 1990s–2010s are boxier robots (`robotDB`, `robotAG`, `robotT`, `robotW`).

**Recurring UI:**
- **Level card** (`card()`): full-bleed set colour + scrolling stripes, a cream panel (1240×460, r 50, 10 px outline, 14 px shadow), a pill tag "GAME N", the level name auto-fitted to 720 px, the years in the set colour, an icon hopping on the left.
- **Year banner** (`banner()`): top-left sticker: year in Fredoka + name + one-line subtitle, slides in from the left with a back-ease and lifts out upward.
- **Judgement** (`judge()`): 120 px Fredoka word, pink/yellow with an 18 px ink stroke, pops at −6°.
- **Burst** (`burst()`): 8-point star + expanding white ring + 8 ink speed lines, 0.3 s.

Motion numbers: `hopY(t, h)` h 8–30 px; `hitSq` 30 rad/s for 0.35 s; downbeat squash `1 - 0.1*exp(-frac(t)*16)`; `dropY` falls 500–900 px; `heyAt` 0.24 s.

**Subtitles & titles.** No burned-in subtitles: on-screen words are the telops themselves (≤ 20 CJK characters on a banner subtitle, ≤ 12 on a plate). `game-show.srt` (generated by `make_srt.py` from `events.json` + `voices/shouts.json`) lists only the English shouts, one cue per shout, repeated crowd "Hey!"s merged.

## End card

The demo's last card carries **"LemoLab × Claude Opus 5.5"** (× is U+00D7). It is the first line of the credit card that pops in at bar 90 (144.0 s): a cream 1440×360 card (r 40, 8 px ink outline, −1.5° tilt, back-ease pop over 0.3 s) with three centred lines: `LemoLab × Claude Opus 5.5` in Fredoka 700 66 px ink (y −80), `本片由 Claude Opus 5.5 全程代码生成` in Noto Sans SC 900 60 px (y 30), `下一关：正在训练中……` 50 px in `K.claude` (y 118). It holds 4 s and fades to navy with the film. Code: the `credit` block in the ending scene of `main_b.js`. This sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card (take the `credit` block out when reusing the code).

## Rights & facts

- **Facts are sourced in `demo/FACTS.md`**: every claim on screen and in the shouts, with the source's own words and a verdict (checked 2026-11-07). Where the record is thin, the film says less: the chess shout is "Game over." (Game 6 of 1997 ended in resignation, not mate); the 9.11 desks are generic bots (no record says which models answered 9.11); the price tags are labelled as output prices per 1M tokens; the 2026 bar chart is Gemini 3.1 Pro's ARC-AGI-2 score from Google DeepMind's own model page; the WAIC disc is the fair's own "300+ world premieres".
- **Facts date fast.** The 2026 remix (Sonnet 5 as default, WAIC 2026, DeepSeek V4-Pro, GPT-6 Astra, Gemini versions) states them as current news. Re-check every figure and name before reusing any of it.
- **Real brands:** the contestants stand for real AI products (GPT, Claude, Gemini, DeepSeek, Kimi, Grok, Midjourney…): names only on name tags, original mascots, loose colour nods; never official logos, wordmarks or product UI (DeepSeek is a blue bean with a magnifier, not the company's whale). Real people (Kasparov, Lee Sedol, the KEN / BRAD podiums) appear only as generic cartoon stand-ins in factual banners; the quiz machine is a generic screen-faced bot, not IBM's Watson avatar. Ken Jennings's real 2011 line "I for one welcome our new computer overlords" (itself a *Simpsons* quote) is on his sign, in Chinese.
- **Genre, not a game.** The film borrows the grammar of rhythm-action party games (call-and-response cues, "Perfect!" judgements, a remix level) and names no game: the G7 task note says "做一个节拍游戏风格的视频" ("make a video in a rhythm-game style"), and the report card's grade is "Encore!".

## Switching the text to English

All strings are literals in `main_b.js` (and three in `main_v1.js`):
1. Level cards: `card(SECT.gN, 'GAME N', '<name>', '<years>', …)`; the name auto-shrinks to 720 px.
2. Year banners: `banner(g, '<year>', '<name>', '<subtitle>', col)`; widths auto-measure.
3. Remix: `item(i, m0, m1, '<label>', …)`, `plate(p, '<text>')`, the month ribbon `` `${m}月` `` and the finale label `'2026 · 未完待续'`, `'还没唱完 →'`.
4. Props: quiz `QA` pairs, Ken's sign, the "9.11 和 9.9" chalkboard, the task note, the users counter label `'用户'`, report card title + `lines`, the credit text, the title `chars()` strings. In `main_v1.js`: the robot chest label `'注意力'` (`robotT`) and the sentence tokens in G3.
5. Prefer `F.round` (Fredoka) for Latin headings and keep `F.sans` for body; `init()` preloads fonts from the page's own text, so no font list changes are needed. English runs ~1.6× wider than Chinese: check banners and plates with stills.
6. Re-run `make_srt.py` if shouts change; the shouts are already English.

## Build notes

```
styles/game-show/demo/
  main_v1.js     base source: palette K, tempo (at/ev/punch), hop/squash helpers, stripes/dots/rays, burst, judge, banner, 1990s robots, chess board
  main_b.js      main source: bean characters + CAST, human, podium, stage (scene/card), props, ALL scenes (buildAll), render(t), init()
  assemble.py    main_v1.js[0:109] (BPM→150, END_BAR→93) + main_v1 robotDB…stage + main_b.js  →  main.js
  frame_head.html  HTML/SVG frame + base helpers (el, txt, tf, op, E, chars, charsPop, measure, bg …)
  build.py       frame_head.html + main.js  →  index.html
  render.mjs     events | stills | video (Playwright + Chrome Headless Shell, PNG → ffmpeg x264 crf 12 per worker)
  music.py       score + events.json → SFX + shouts → ducked mix → music.wav      synth_lib.py  instruments & SFX
  voices/        shouts.json (id|text|Kokoro voice|speed|pitch|fx) → 40 shout wavs (gitignored)   make_voices.py  make them
  build.sh       one command: page, shouts + speech check, events, mix, subtitles, picture, master
  finish.sh      concat segments + core/render/mux.sh (−14 LUFS, ≤ −1 dBTP) → ../game-show.mp4   make_srt.py  → ../game-show.srt
  fonts/ fonts.css   Noto Sans SC, Fredoka, ZCOOL KuaiLe (woff2 subsets)
  main.js        generated (do not edit by hand)
```

All commands from `styles/game-show/demo/` (the scripts also `chdir` there themselves). `PY=../../../.venv/bin/python`.

1. **Plan on the grid.** Fill `SECT` (first bar of each level card) in `main_b.js`, set `END_BAR` via the replace in `assemble.py`, add the card bars to `CUTS`, and write a cue list: which beats get which `ev()`.
2. **Shouts:** add entries to `voices/shouts.json`, then `$PY make_voices.py <id> …` (Kokoro + ffmpeg), listen, check with `core/tts/asr_check.py` (`WHISPER_MODEL=small.en`), add the ids to `VO` in `music.py`.
3. **Build the page:** `$PY assemble.py && $PY build.py`.
4. **Look at it:** `STILLS_DIR=out/check node render.mjs stills 5.5 20.4 45 78.3 116.5 145` (≈1 s for six frames). Or open `index.html?t=78.3` in a browser.
5. **Events:** `node render.mjs events` → `events.json` (demo: 474 events, `dur 148.80`).
6. **Score + mix:** `$PY music.py` → `music.wav` (≈2 s; deterministic, seed 7). `$PY music.py out/test.wav` writes elsewhere.
7. **Render:** `node render.mjs video 2` → `out/seg_0..1.mp4` + `out/list.txt`. 6 workers take 120 s in total; on a shared machine keep 2 (≈3–4 min). `SEGS=5 node render.mjs video 6` re-renders only one of 6 equal segments.
8. **Finish:** `sh finish.sh out/test.mp4` (concat → `core/render/mux.sh`: loudnorm, true-peak guard, x264 slow crf 19 + AAC 256k 48 kHz). With no argument it writes `../game-show.mp4` and **overwrites the library film** (back it up first). `AUDIO_FROM=old.mp4 sh finish.sh …` skips the remix and copies the old film's audio track unchanged (for a picture-only re-render).
9. **Subtitles:** `$PY make_srt.py` → `../game-show.srt`.
10. **Review:** `ffmpeg -i out/test.mp4 -vf fps=1/4,scale=384:-1,tile=6x7 -frames:v 1 out/sheet.jpg` plus stills around every slam.

### Pitfalls

- **`render(t)` must be a pure function of `t`.** `main_b.js` recomputes each remix thumbnail at `t1 − 0.001` every frame. A thumbnail that only updates while `t < t1 + 0.01` gets a final pose that depends on having rendered the frames before: the 6-worker render starts worker 5 cold at 124.0 s, so the bottom thumbnails (robot arm stack, dancing robots, bar chart, Gemini card) would show their *initial* state from 124.0 s to 131.2 s.
- **`main.js` and `index.html` are generated.** Edit `main_v1.js` (palette, beat helpers, banner/judge/burst, 1990s robots) or `main_b.js` (characters v2, stage, all scenes, render/init), then run `assemble.py` → `build.py`. Edits made straight into `main.js` are overwritten.
- **`BPM` and `END_BAR` are patched by string replace** in `assemble.py` (`'const BPM = 140,'` → 150, `'const END_BAR = 61;'` → 93). If you edit those lines in `main_v1.js` the replace silently stops matching. Change the replace targets instead.
- **Add every new shout in two places**: an entry in `voices/shouts.json` (so `make_voices.py` makes the `.wav` and `make_srt.py` finds its text) and the `VO` list at the top of `music.py` (otherwise `KeyError`).
- **Level card bars must also be listed** in `CUTS` (`init()` in `main_b.js`: the flash) and in the `jingle()` loop + `PLAN` spans of `music.py`. They are three separate lists.
- `synth_lib.py` allocates a fixed `DUR = 150.0` s buffer. A longer film needs a bigger `DUR` or the tail is cut.
- Fonts: `measure()` uses a canvas, so glyph widths are wrong until the webfont has loaded. `init()` loads every family for the page text before `buildAll()` and again for the built stage text. Keep that when adding text.
- Pronunciation: write spelled-out forms in `shouts.json` ("A. I.", "G. P. T. one", "Nine point eleven", "Move thirty seven"); `make_srt.py` writes "AI" and "GPT" back. Check every call with Whisper: when a one-word shout is misheard, change the voice, not the word.
- The frame template (`frame_head.html`) declares `#paper`/`#fx` canvases and ink/boil filters that this style doesn't use; `init()` hides the canvases. Leave them alone or delete them together.
- zsh does not word-split `$TS`; pass timestamps as an array (`TS=(1 2 3); … $TS`) or literally.

## Engine reference

**Contract.** `buildAll()` calls `scene(t0, t1, build)` once per set. `build(g, s)` creates all SVG nodes inside group `g` once and returns `update(t)`, which only sets attributes. `render(t)` shows the scenes with `t0 ≤ t < t1`, calls their `update(t)`, then applies camera punch, cut flash and final fade. `update(t)` must depend on `t` only.

| Module | Function | What it does / key params |
|---|---|---|
| frame_head | `el(tag, attrs, parent)`, `txt(parent, str, attrs)` | create SVG nodes |
| | `tf(e, x, y, s=1, r=0, sy)` · `op(e, o)` · `show(e, bool)` | transform / opacity / display |
| | `seg(t, a, b)` · `lerp` · `clamp` · `E.out/in/io/back/elastic` · `rng(seed)` | timing + easing, seeded random |
| | `chars(parent, str, {x, y, size, family, weight, fill, anchor, ls, stroke, sw})` + `charsPop(c, t, t0, stagger, d, from)` | per-glyph pop-in title |
| | `measure(str, size, family, weight)` · `bg(parent, color)` | text width, full-frame rect |
| main_v1 | `at(bar, beat)` · `B` · `BARL` · `frac(t)` | tempo grid (150 BPM) |
| | `ev(t, name, {f, i})` · `punch(t, amount)` | register a sound event / a camera punch |
| | `hopY(t, h)` · `hitSq(t, t0, amt)` · `near(t, t0)` | beat hop, hit squash |
| | `gtext(parent, s, x, y, size, {family, weight, fill, stroke, sw, anchor})` | outlined telop text |
| | `stripes(p, col, w, angle)` · `dots(p, col, step, r)` · `raysEl(p, n, col)` · `starPath(n, r1, r2)` | set patterns (rotate rays in `update`) |
| | `burst(p, x, y, t0, col, size)` · `judge(p, word, x, y, t0, col, dur)` | return `f(t)`; push into `s.fx` and call each frame |
| | `banner(p, year, name, sub, col)` + `bannerAnim(b, t, t0, t1, x=56, y=44)` | year sticker |
| | `robotDB/robotAG/robotT(p)` · `quad(u, v)` · `pawn(p, col, king)` | era robots, perspective board |
| main_b | `bean(p, {color, belly, antenna, name, kind, eyeFill, acc, ant, tagCol})` | a contestant; `kind` bot/llama; `acc` noise/mask/beret/captain/mustache; `ant` lens/q/bolt/moon/heart/cloud/sprout/brush |
| | `pose(c, {hey 0..1, open, sq, lean, face 'x'/'up', blink, armsL, armsR})` · `poseAny(c, o)` | pose any bean or twins |
| | `CAST.<key>(p, name?)` · `ALL` | 16 ready contestants (gpt, claude, gemini, llama, deepseek, ernie, qwen, mistral, kimi, grok, bert, dalle, mj, sd, sora, baby) |
| | `human(p, shirt, glasses, hair)` + `humanFace(h, open, sweat)` + `setArm(arm, x1, y1, x2, y2)` | cartoon humans |
| | `podium(p, col, label)` · `taskIcon(p, kind)` · `smallBot(p, col)` | props |
| | `dropY(t, t0, y, h, d)` · `heyAt(times, t, w)` · `nearestIn(times, t)` | entrances, "Hey!" windows |
| | `scene(t0, t1, build)` · `card(bar0, num, name, years, col, col2, icon)` | a set, a 1-bar level card |
| music.py | `PLAN[bar] = mode`, `span(a, b, mode)`, `jingle(at(bar))` | bar-by-bar arrangement |
| | event loop `if s == '<name>': addv(sound, t, gain, pan)` | map a picture event to a sound |

**Minimal new level** (inside `buildAll()` in `main_b.js`; add `g8: 67` to `SECT` and shift later sections, add bar 67 to `CUTS`, `jingle(at(67))` + a `span(68, 75, 'funk')` in `music.py`, and raise `END_BAR`):

```js
{ const b0 = SECT.g8 + 1, T = (bar, bt = 0) => at(b0 + bar, bt);
  card(SECT.g8, 'GAME 8', '开源接力', '2026', K.orange, '#FF9E5E',
       (p) => { const w = el('g', { transform: 'scale(2)' }, p); pawn(w, K.white); });
  scene(T(0), T(8), (g, s) => {
    bg(g, '#FFB870'); stripes(g, '#FFA85A', 50, -20);
    el('rect', { x: 0, y: 880, width: 1920, height: 200, fill: '#E08A4A' }, g);
    const w = el('g', {}, g); const c = CAST.claude(w);
    const calls = [T(0, 0), T(0, 1), T(1, 0), T(1, 1)], answers = [T(0, 2), T(0, 3), T(1, 2), T(1, 3)];
    calls.forEach(t0 => { ev(t0, 'v:hey'); punch(t0, 0.015); });
    answers.forEach(t0 => { ev(t0, 'pop', { f: 900 }); s.fx.push(burst(g, 960, 420, t0, K.yellow, 0.8)); });
    const b1 = banner(g, '2026', '开源接力', '一拍一棒，接住就赢', K.orange);
    s.fx.push(judge(g, 'Perfect!', 960, 300, T(7, 3), K.pink, 0.8));
    ev(T(7, 3), 'slam'); punch(T(7, 3), 0.05);
    return (t) => {
      tf(w, 960, 880 + hopY(t, 20), 1);
      poseAny(c, { hey: heyAt(answers, t) ? 1 : 0, open: heyAt(calls, t), sq: hitSq(t, nearestIn(answers, t) ?? -9) });
      bannerAnim(b1, t, T(0), T(8));
      s.fx.forEach(f => f(t));
    };
  });
}
```

Then `assemble.py → build.py → stills → events → music.py → video → finish.sh`.
