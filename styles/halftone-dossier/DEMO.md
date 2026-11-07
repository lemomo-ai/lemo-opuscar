# Halftone Dossier — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *胖橘案卷 Case File: Chubby* (30.0 s) · `halftone-dossier.mp4` · source in [`demo/`](demo/) · engine: one self-contained `demo/index.html` (SVG scene graph + two Canvas 2D overlays), rendered frame by frame by Playwright headless Chromium at 1920×1080 / 30 fps; score and SFX synthesized in `demo/music.py`.


**The demo's on-screen text is Chinese** (title cards, captions, stamps). There is no narration. See "Making an English version" below.

## Story & structure

A mock investigation of a chubby orange cat. Structure is a dossier: **title → accusation → suspect profile (mugshot) → Count 01 / 02 / 03 → "in summary" → verdict stamp → reason → case closed**. A case-number HUD in the corner and a chapter chip ("罪状 01 · 测试重力") keep the viewer oriented. The joke is the gap between bureaucratic seriousness (case numbers, height chart, stamps, "Count 01") and a trivial, lovable subject.

It is loud but readable: one idea per 2–4 second card, a big headline, one visual gag, one caption line.

How the demo used the native moves:

| Native power | How the demo used it |
|---|---|
| **The accusation frame** | Any topic becomes "the case against X". A product, a habit, a pet, a colleague, a historical figure — list its "crimes". |
| **Numbered counts** | Each beat is Count 01/02/03 with a giant halftone numeral behind it. Three counts is the sweet spot for 30 s; five for 60 s. |
| **The stamp** | Every verdict is a physical stamp slam: 惯犯 (repeat offender), 无罪释放 (acquitted), 结案 (case closed). Stamps are the punctuation of the film. |
| **The mugshot** | A frontal subject in front of a height chart with a name plate and a flash. Great for introducing any "suspect". |
| **Exhibit cards** | The "in summary" beat: the counts come back as three pinned evidence cards with icons, then shake. |
| **Dot density = emotion** | Dots swell into a halo around the hero, pile up at the frame edges for tension, bloom radially for joy. |

How this topic is shaped: a **lovable offender** and three **specific, visual** misdeeds (a cup that falls, 04:00 on a clock, a document that fills with garbage). The twist is a verdict that contradicts the evidence ("guilty on every count → acquitted: too cute").

**Demo arc (30 s, 120 BPM, one bar = 2 s)**: title (1 bar) → accusation + first stamp (1 bar) → mugshot (2 bars) → Count 01 (2) → Count 02 (2, the "night" change of palette) → Count 03 (2) → summary + build (1) → verdict stamp on the drop (1) → reason (1) → case closed + credit (2). Every cut sits on a bar line.

## Shots

The camera is a 2D group (`#cam`); there is no 3D.

| Beat | Camera |
|---|---|
| Title / accusation | Locked, frontal, with a 0.6 % **beat pulse** on every beat (`pulse`, only in "groove" sections). |
| Mugshot, summary | Slow push-in on the scene group: 1 → 1.05 over 4 s (mugshot), 1 → 1.08 with ease-in over 2 s (summary, rising tension). |
| Impacts | `SHAKES = [t0, amplitude px, duration]`: 16 px at the first stamp, 14 px at the cup crash, 26 px / 0.45 s at the verdict, 5–7 px for small landings; quadratic decay, different sin/cos frequencies on x/y. |
| Mugshot flash | Two camera-flash frames (white overlay 0.95 → 0 over 0.3 s) with the mascot squinting. |
| Ending | Fade to navy `#1D2340` over 29.25–29.95 s. |

Compose flat and frontal like a printed page: headline top-left, hero right-centre, caption bar bottom-centre (y = 980), HUD in the corners.

Demo motion numbers: CHUBBY letters fall 700 px in 0.2 s each, 0.25 s apart (one per 8th note), then squash with a damped `cos` wobble. Stamp slam (`stampAnim`) 0.09 s from 2.6× to 1× with a white flash at 23.0 s. Squash landings: loaf at 17.45, curl at 26.6 (`sq = 1 − k·e^(−a·7)·cos(a·20…22)`). Run cycle (`runCycle`): 4 capsule legs swinging ±50° at 30 rad/s, body bob `|sin(28t)|·12`, stretch `scaleX 1 + 0.35·speed`, 4 speed lines. Dot wipe (`wipeUpdate`): 80 px grid, r → 62, 0.44 s centred on each cut; cuts at 22 and 24 are hard cuts on the drop. The motion rules:

- **Everything enters with overshoot**: `E.back` (overshoot 1.9) over 0.3–0.45 s. Objects rise from below the frame (`lerp(1200, 470, E.back(...))`) or scale from 0 (`pop()`).
- **Per-character pop** (`charsPop`): each glyph drops 30–100 px and scales in with squash-and-stretch, stagger 0.05–0.08 s (0.02 s for small subtitles). Headlines always build this way; never fade text in.
- **Title letters fall and squash**: CHUBBY letters fall 700 px in 0.2 s each, 0.25 s apart (one per 8th note), then squash with a damped `cos` wobble.
- **Stamp slam** (`stampAnim`): 0.09 s from 2.6× to 1× (`E.in`), then a 5 % damped bounce; at the same instant a camera shake (`SHAKES`), a white flash (23.0 s) and the stamp SFX.
- **Squash landing**: characters that land (loaf at 17.45, curl at 26.6) use `sq = 1 − k·e^(−a·7)·cos(a·20…22)` with `scale(1/sq, sq)` so volume is preserved.
- **Idle life**: breathing (±2 % y-scale), tail sway, ear twitches, blinks at scripted times (`blinkAt`), hearts/Zz loops, stars twinkling, REC dot blinking at 1 Hz, colon of the clock blinking.
- **Run cycle** (`runCycle`): 4 capsule legs swinging ±50° at 30 rad/s, body bob `|sin(28t)|·12`, plus stretch `scaleX 1 + 0.35·speed` and 4 speed lines behind.
- **Line boil at 10 fps** on characters while their transforms move at 30 fps — hand-drawn feel without jitter in position.
- **Transitions are a dot wipe** (`wipeUpdate`): an 80 px grid of circles grows to r = 62 (full cover) and shrinks back over 0.44 s centred on each cut, with a diagonal delay; each cut has its own wipe colour (`WIPES`). The scene switch happens while the frame is fully covered. Some cuts (22, 24) are hard cuts on the drop for contrast.

## Score structure

- **No voice.** The film is carried by cards and music; if a topic needs narration, add it, but keep captions as the main channel.
- **Score** (`music.py`, 44.1 kHz stereo, fully synthesized, seeded RNG → bit-identical output): 120 BPM, bar = 2 s, C major with a chord per bar (`PLAN`, 15 bars). Instruments: synth kick/snare/clap/hat, square-ish bass on an 8th-note pattern, triangle pad, **marimba-like `pluck`** melody (fundamental + 3.99× partial) with a quiet octave echo, `pizz` pizzicato and finger snaps for the sneaking night section (bars 6–7 = Count 02), a snare roll + rising sine sweep for the **build** (bar 10 = "in summary"), a **drop** that leaves the first half of bar 11 empty so the verdict stamp lands alone at 23.0, then music-box `bell` outro and a final bell arpeggio.
- **SFX follow the picture** (SFX table at the end of `music.py`, times copied from `index.html`): pops per title letter, boing for the head peeking, `stamp()` (pitch-dropping boom + click; `big=True` adds a crackle) for every stamp, `shutter()` for the mugshot flashes, synthesized `meow()` (formant sweep /i/→/a/→/u/), `clink` for the cup nudges, `crash_glass()` at the break, whooshes before every wipe, `plop` + a stream of `key_click` for the cat lying on the keyboard, `sparkle` for "too cute".
- **Master**: peak-normalize ×1.6 → `tanh` soft clip ×0.9 → 1.2 s fade-out. At mux, −1.6 dB and AAC 256 k / 48 kHz → the demo measures −14.5 LUFS integrated, −1.2 dBTP.
- For a new film: keep the bar grid, re-write `PLAN` (which bar is intro/full/sneak/build/drop/outro/end) and re-time the SFX list to your new scene times. Keep one sonic "silence before the stamp".

## Palette & props

**Palette** (`C` in `index.html` lines 56–60) — use only these:

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F4ECDD` | background of light scenes |
| `navy` | `#1D2340` | all outlines, body text, caption bar, fade-out colour |
| `blue` | `#2E55D6` | title background, halo dots, tables, one ink layer |
| `pink` | `#FF5A87` | accents, misregistration shadow, caption offset, verdict stamp |
| `yellow` | `#FFC628` | highlight words, numerals, starburst, folder |
| `orange` / `ored` | `#F58A34` / `#D9621E` | the mascot's fur / stripes |
| `cream` | `#FFF4E2` | bellies, paws, text on dark |
| `red` | `#E8384F` | stamps, "17", REC dot |
| `night` / `night2` | `#18203F` / `#2A3568` | night-scene background / dots |
| `mint`, `skin` | `#56C29E`, `#F7C9A1` | tiny accents only |

**Halftone** (`halftone()`): a rotated grid of circles in a single SVG path. `step` 20–26 px, screen `angle` different per layer (15°/20°/25°/30°/45°/60°/70°), dot radius = `density × step × maxK` with `maxK` 0.6–0.72 (at ~0.7 dots merge into solid ink at full density). Density fields: `radial(cx, cy, R, pw)` for halos/blooms/corner glows, `edge(R, pw)` for a vignette of dots crowding the frame edge, or a linear ramp `(x,y) => 0.25 + 0.75*clamp((y-250)/650)` for "lit from above" fills. Put the second layer in `class="mul"` (mix-blend multiply) so inks overprint.

**Halftone-filled numerals**: giant Bagel Fat One numerals (700–760 px) bleeding off the right edge, filled flat (`yellow` / `#FFD3DF`) and then overprinted with a darker halftone clipped to the glyph (`<clipPath>` with the same `<text>`). Lines 513–518 and 709–714.

**Paper** (`buildPaper()`, `#paper` canvas, multiply over everything, built once): 96×54 random tile upscaled (242–255 grey) for mottling + per-pixel noise ±13 with a −4 blue bias (warmth) + radial vignette `rgba(120,100,80,.35)` + a faint fold line at x = 960. Dark scenes are multiplied too, which keeps them "printed", not glowing.

**Grain** (`drawFx(frame)`, `#fx` canvas, per frame): 520 cream specks (r 0.6–2.4, α .75) + 90 navy specks, reseeded every 2 frames — dust on the print, not film grain.

**Line boil** (`#boil` SVG filter): `feTurbulence` 0.022 → `feDisplacementMap` scale 5, reseeded every 0.1 s (`render()` sets `boilT` seed, 40-seed cycle), plus a fine ink-grain mask (0.75 frequency) that eats a little of every fill. Apply it to characters and hand-drawn props only — never to text, halftone, HUD or captions.

**Characters**: chunky kawaii shapes with a **7 px navy outline** (`LW`), flat fills, cream belly/paws, pink ear-insides and cheeks, darker-orange stripes as round-capped strokes. Big glossy eyes (navy ellipse + two cream highlights) that can squint, close into a happy arc (`happy`) or blink. One head (`catHead`) shared by every body pose.

**Typography** (`F` lines 61–64; all Google Fonts, OFL):
- Headlines: **Noto Serif SC 900**, 100–230 px, left-aligned at x ≈ 120–170, with a **misregistration shadow** (`chars(..., {shadow:{fill: pink|yellow, dx: 8, dy: 8}})`, drawn multiply).
- Display / numerals: **Bagel Fat One** (CHUBBY 330 px, 01/03 700+ px, 99+, 17, 18:00, Zz).
- Cute interjections: **ZCOOL KuaiLe** (喵。 呼噜～ 啪！ 太可爱了). "太可爱了" uses cream fill + 16 px navy stroke + blue offset shadow.
- Data / HUD: **JetBrains Mono 800** (case numbers, "PANG JU, O.", clock 04:00, cm ruler, file names).
- Captions and stamps: **Noto Sans SC 900**.

**Stamps** (`stampEl`): double rounded rectangle (outer border 10–14 px, inner 0.35×) + 120–210 px text, all through `#stampInk` (displacement 7 + coarse ink-grain mask) so the ink is mottled and the edges are rough. Opacity 0.93, tilted −10° … +12°.

**Props & gags**: starburst (24-point star, yellow + navy stroke, "啪！" in red), speech bubbles (cream, navy 6 px stroke, tail patch), hearts (`heartPath`), confetti (5-colour rectangles with flipping `scaleY`), radial rays (28 alternating wedges, rotating 12°/s), paw prints, sticky note, laptop with typed garbage, digital clock. All flat fills + navy outline.

## Titles & subtitles

- **Cards are the subtitles.** Every beat has a headline (serif 900, per-char pop) and, for counts, one **caption bar** (`caption`): navy rounded pill (r 14) with a pink offset shadow (+8/+8, multiply), Noto Sans SC 900 46 px in cream, with the **keyword in yellow or pink** via tspans. It pops in (0.4 s, slight −1.2° tilt) ~1 s after the headline and stays to the end of the scene (≥ 1.8 s).
- **HUD** (`hudUpdate`): top-left case number (`案卷 No.2026-CAT-001`, JetBrains Mono 22) above a chip with section + title (`罪状 01 | 测试重力`); top-right REC dot + date. Colours invert on dark scenes. Hidden on the title card, which has its own corner labels.
- **Title card**: blue background, big Bagel Fat One word (the subject's nickname) in cream with a navy offset shadow, subtitle line below, the mascot peeking from behind the letters with its paws on top.
- `halftone-dossier.srt` lists the cards (Chinese + English gloss); there is no speech to transcribe.

## End card

**End card**: the case folder with the file label, the sleeping mascot, the 结案 stamp, and a speech bubble with the closing joke (「本片由 Claude 用代码一帧一帧画完。胖橘表示：全程没有配合。」). Our demo ends with "LemoLab × Claude Opus 5.5" (× = U+00D7). This sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card or its closing joke. In the demo it is a single centred line at the bottom of the end card (`index.html` S10): `txt(g, 'LemoLab × Claude Opus 5.5', {x: 960, y: 1040, 'font-size': 30, 'font-family': F.mono, 'font-weight': 800, fill: C.navy, 'text-anchor': 'middle', 'letter-spacing': 3})`, faded in with a 12 px rise over 27.6–27.9 s (0.3 s after the bubble pops) and held until the navy fade. Keep it in the empty band under the folder; never cover the mascot or the stamp. Write the string literally in the source so `init()` preloads its glyphs.

## Making an English version

**Making an English version** (all in `index.html`): replace the string literals in each `scene()` (headlines in `chars()`, `caption()` parts, `stampEl()` words, plate/profile/folder texts, end bubble at lines 905–907), the HUD `chips` array (lines 948–951) and `txt(... 'CASE FILE · 2026')`; swap `F.serif`/`F.cute`/`F.sans` to Latin display faces (e.g. a black slab or Bagel Fat One for headlines, a rounded display face for interjections), add them to `fams` in `fetch_fonts.mjs` and to the preload list in `init()` (line 1069); set `lang="en"`. Widths are measured at build time (`measure()`), so bars and stamps resize themselves, but English runs 2–3× longer: drop headline sizes (230 px → ~130 px), shorten stamps to 1–2 words (GUILTY, ACQUITTED, CLOSED), and use a smaller `charsPop` stagger (0.02–0.03 s).

## Build notes

```
styles/halftone-dossier/demo/
  index.html        the whole film: helpers, halftone, paper, cat rig, 10 scenes, HUD, wipes, render(t)
  render.mjs        Playwright renderer: stills | video [workers] | mux [out.mp4]
  music.py          score + SFX + master → music.wav (seeded, deterministic)
  fetch_fonts.mjs   downloads the 5 Google Fonts families → fonts/*.woff2 + fonts.css
  fonts/ fonts.css  local font slices (OFL)       CREDITS   licences
  stills/           styleframe.jpg                   out/     intermediates (gitignored)
```
Run from the repo root (`lemo-opuscar/`); all paths inside the scripts are relative to `demo/`.

1. (Only when changing fonts) `cd styles/halftone-dossier/demo && node fetch_fonts.mjs` — needs network; rewrites `fonts/` + `fonts.css`.
2. Voice/TTS: none in this style (skip). If you add narration, time scenes to it first.
3. Music: `.venv/bin/python styles/halftone-dossier/demo/music.py` → `demo/music.wav` (≈1 s). Pass a path to write elsewhere.
4. Review: open `demo/index.html?t=11.2` in Chrome, or `node styles/halftone-dossier/demo/render.mjs stills 3.3 7.2 11.25 23.3 27.8 --dir out/review` (≈0.25 s per frame) → `demo/out/review/t_*.png`.
5. Render: `node styles/halftone-dossier/demo/render.mjs video 2` → `demo/out/seg_*.mp4` + `demo/out/video_noaudio.mp4` (CRF 12 master). 900 frames ≈ 0.24 s/frame/worker → about 2 min with 2 workers on an idle machine (5.6 min measured while six other renders shared the CPU).
6. Mux: `node styles/halftone-dossier/demo/render.mjs mux` → `styles/halftone-dossier/halftone-dossier.mp4` (x264 CRF 16 + music at −1.6 dB, AAC 256 k/48 kHz; ≈15 s; reproduces the published video stream bit-for-bit from the same master). Pass another path to avoid overwriting the published film.

### Pitfalls

- **Fonts must be loaded before `buildAll()`**: layout uses canvas `measureText`; if a Google-Fonts unicode-range slice is not loaded yet, per-character positions are computed with the fallback font and glyphs overlap. `init()` preloads every family against the **whole page source** (`documentElement.innerHTML` includes the script, so every string literal in the code is covered) and then again against the built SVG text. Any string you generate at runtime must contain only characters that also appear literally somewhere in the file (or ASCII).
- Use `font-display: block` (already in `fonts.css`) — `swap` shows fallback glyphs in the first rendered frames.
- `<clipPath>` ids are global: every clipped numeral/table needs a unique id (`num01`, `num03`, `tclip`).
- Keep the boil filter off text and halftone: displacement on 20 px dots turns them into mush and makes text wobble illegibly.
- Scenes are shown/hidden by time window; a scene's update only runs while it is on, so any element that must be invisible before its cue needs an explicit `op(…, 0)` for `t < t0` (see `charsPop`, `stampAnim`).
- The dot wipe must reach full coverage (r 62 on an 80 px grid) at the cut time, otherwise the hard scene switch shows through.
- A 100 % white flash reads as a dropped frame; the verdict flash is capped at 0.5.
- Unused leftovers in `index.html`: `#ink` filter, `charsIdle()`, `E.elastic` — defined, never called.

## Engine reference

Everything lives in `demo/index.html`. It is one file by design; to start a new film, **copy `demo/` to a new folder and rewrite `buildAll()`**. The reusable parts, by line range:

| Lines | Block | What to reuse |
|---|---|---|
| 8–13, 16–49 | Page + SVG skeleton | 1920×1080 body; `<svg id="stage">` with filters `boil`, `stampInk`; layer order `#cam > #world` (scenes), `#hud`, `#wipe`, `#flash`, `#fade`; then `<canvas id="paper">` (multiply) and `<canvas id="fx">`. Copy verbatim. |
| 55–94 | Core helpers | `C` palette, `F` fonts, `el(tag, attrs, parent)`, `txt`, `tf(e, x, y, s, rot, sy)`, `op`, `show`, `clamp`, `seg(t,a,b)` (0..1 progress), `lerp`, easings `E.out/in/io/back`, `pop(t, t0, d)`, seeded `rng(seed)`, `measure(str, size, family, weight)`. |
| 97–132 | Per-char text | `chars(parent, str, {x, y, size, family, weight, fill, anchor, ls, shadow:{fill,dx,dy}, stroke, sw})` → `{g, items}`; animate with `charsPop(c, t, t0, stagger, d, from)`. |
| 135–150 | **Halftone** | `halftone(parent, {x0, y0, w, h, step, angle, color, f, maxK})` returns one `<path>`; density fields `radial(cx, cy, R, pw)`, `edge(R, pw)`; add `.setAttribute('class','mul')` to overprint. |
| 152–171 | Background + caption bar | `bg(parent, color)`; `caption(parent, [[text, colour?], …], {x, y, size})` + `captionAnim(c, t, t0)`. |
| 174–190 | **Stamp** | `stampEl(parent, str, {size, color, family, padX, padY, border})` + `stampAnim(s, t, t0, x, y, rot)`. Pair with a `SHAKES` entry and a `stamp()` SFX at `t0`. |
| 192–194 | Heart | `heartPath(scale)` → path d string. |
| 199–337 | **Mascot rig** | `catHead` (ears, stripes, eyes, mouth, whiskers) + `setFace(cat, {open, lookX, lookY, mouthOpen, earL, earR, happy})` + `blinkAt(t, [times])`; bodies `catSit` (front), `catRun` (side, + `runCycle(c, t, speed, amp)`), `catLoaf` (lying), `catCurl` (sleeping); `tailEl(parent, d, width)` = outlined stroke tail with stripe dash. To make a different mascot, keep the recipe (7 px navy outline, flat fill, cream belly, `boil` filter) and redraw the paths; keep the `setFace` interface. |
| 349–355 | Timeline | `scene(t0, t1, build)`: `build(g, s)` creates the scene's elements once and returns `update(t)`; `render()` shows the scene only for `t0 ≤ t < t1` and calls `update` with **absolute** time. |
| 358–935 | The 10 scenes | Worked examples: title with falling letters (359–403), headline + stamp + paw prints (406–435), mugshot with height chart, plate, flash, heart and bubble (438–508), halftone numeral + cup physics + starburst (511–625), night run with moon, stars, bed, speed lines (628–704), laptop typing gag + loaf (707–782), exhibit cards + shake (785–819), verdict rays + confetti (822–849), reason close-up + hearts burst (852–882), folder + curl + end bubble + credit line (885–935). |
| 937–967 | HUD | case number + chapter chip from the `chips` table `[t0, t1, section, title]`; auto-width; inverts on dark scenes (edit the `dark` test). |
| 969–988 | Dot wipe | `WIPES = [[cutTime, colour], …]`, 80 px grid, 0.44 s window. |
| 995–1032 | Paper + grain | `buildPaper()` once; `drawFx(frame)` every frame. |
| 1037–1064 | `render(t)` | boil reseed, scene switching, `SHAKES` + beat pulse (`inGroove` windows), flash times, final fade window, HUD, wipe, grain. |
| 1066–1084 | `init()` | font preload (two passes) → `buildPaper()` → `buildAll()` → `window.READY = true`; `?t=` query renders a given time in a normal browser. |

The contract with `render.mjs` is only `window.READY` and `window.render(t)`; change `FPS`/`DUR` in both files for a different length.

**Minimal new scene** (paste inside `buildAll()`, then add its cut to `WIPES`, a `chips` row, `SHAKES` for the stamp, and the SFX times in `music.py`):

```js
scene(8, 12, (g) => {
  bg(g, C.paper);
  halftone(g, { color: C.yellow, step: 22, angle: 15, f: radial(1500, 520, 700, 1.0), maxK: 0.68 });
  halftone(g, { color: C.pink, step: 22, angle: 70, f: radial(0, 1080, 520, 1.2), maxK: 0.6 }).setAttribute('class', 'mul');
  const h1 = chars(g, '罪状 01', { x: 120, y: 330, size: 150, family: F.serif, fill: C.navy, shadow: { fill: C.yellow, dx: 8, dy: 8 } });
  const catG = el('g', {}, g); const cat = catSit(catG);
  const st = stampEl(g, '属实', { size: 160, color: C.red });
  const cap = caption(g, [['证据确凿，'], ['当场抓获', C.yellow], ['。']]);
  return (t) => {
    charsPop(h1, t, 8.05, 0.06);
    tf(catG, 960, lerp(1200, 470, E.back(seg(t, 8.2, 8.6))), 1.1);
    setFace(cat.head, { open: blinkAt(t, [9.4, 11.2]), lookX: Math.sin(t) * 4 });
    cat.tail.setAttribute('transform', `translate(90 285) rotate(${Math.sin(t * 2.4) * 10})`);
    stampAnim(st, t, 10.0, 1450, 640, -8);
    captionAnim(cap, t, 9.0);
  };
});
```
