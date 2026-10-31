# Watercolor Brush — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Follow the Rain* (113.6 s, 1920×1080, 60 fps) · `watercolor.mp4` · source in [`demo/`](demo/) · engine: Canvas2D stroke engine (`engine.js` `mk`/`drawS`, variable-width ribbon + dashed bristle tracks), procedural plant generators, per-plant sprite cache, headless Chrome frame capture.


The demo is a naturalist's field journal: one long sideways walk through the Australian landscape along a rainfall gradient, hand-written notes and a quiet rainfall gauge, then a pull-out to a painted map that moves through deep time.

## Story & structure

A film that looks like a hand-painted field journal being painted in front of you. Everything sits on one sheet of warm, fibrous paper (`#f1e9da`). Every object — a spinifex hummock, a gum tree, a kangaroo, a cloud, the horizon, a coastline — is made of **individual brush strokes**: a variable-width ribbon laid down at partial opacity, plus 3–9 thin **bristle tracks** that break into dashes (dry-brush *flying white*). Strokes overlap and darken where they cross, like real transparent pigment. Nothing has a vector outline; the darker edge stroke on a trunk (`edgeOf`) is the only "line".

Things **paint themselves in** as they enter the frame: stroke by stroke, trunk before branches before leaves. Once finished, a plant is cached as a sprite and only sways. The landscape is a single long painted world that the camera walks across, in four parallax layers of washes and plants, while an **annotation layer** (handwritten Caveat labels with pen leader lines, a rainfall gauge in mono type, a biome title in Cormorant Garamond) explains what we are seeing. The film ends by washing the landscape away with paper-coloured mist and drawing the whole continent as a painted map.

Tone: calm, curious, precise. It is a documentary, not a fairy tale: numbers are real, labels are Latin names, the palette follows the data.

How the demo used the medium:

| Native power | Story use |
|---|---|
| **A walk along one gradient** | Map one measurable quantity to horizontal distance and walk it: rainfall (demo), altitude up a mountain, depth down a reef wall, distance from a city centre, latitude from equator to pole, time along a river. The camera move *is* the argument. |
| **Painting-in as reveal** | Each new zone is literally painted in as it arrives — the audience watches a new kind of life appear stroke by stroke. Use `burst` to make a whole zone erupt at once for the climax zone (the rainforest). |
| **Zone palettes** | Colour carries the data: red-ochre desert → sage mulga → straw woodland → blue-grey wet forest → deep green rainforest. The sky, ground, hills and far trees all blend by zone. |
| **Specimen + note** | One hero specimen per zone, labelled by hand with a leader line (`spinifex · Triodia`, `mountain ash · Eucalyptus regnans`). A small animal per zone gives life and scale (kangaroos, budgies, koala, cassowary, a tiny human for scale). |
| **One event per zone** | Each zone gets one small demonstrative event: rain running down mulga branches to the roots, a fire front and epicormic regrowth, a tilt-up measuring a 100 m tree, a layer diagram of the rainforest. |
| **Pull-out to the map** | After the walk, wash the landscape away and paint the map; draw "our walk" on it. The map can then move in **time** (50 Ma → today), which turns a spatial walk into a historical one. |

**Story shape (proven in the demo):** cold paper → horizon brushed in → vermilion sun "stamped" like a seal → title → landscape revealed with a brush-edge wipe → 5 zones (≈ 10–18 s each) with a rising gauge → mist washes everything back to paper → coastline painted → map filled → "our walk" arrow → rewind to 50 million years ago (all green) → drift and dry back to today (dry heart, green edge) → end title over the faded map + credits.

Adapting a topic: pick the gradient; list 4–6 zones with a real value at each boundary; give each zone a palette, a hero specimen, a small animal and one event; end on a map or diagram that re-frames the walk (in space, then in time).

## Shots

| Beat | Camera |
|---|---|
| Title (0–10.9 s) | Static on blank paper; horizon brushed across, sun stamped (1.6 s), title wiped in. |
| Walk (10.3–73 s) | One continuous sideways dolly: `camXf = monotone([[0,700],[10.3,700],[16,1400],…,[66,9300],[73,9800]])` in world px; speeds up between zones and slows on events (fire, ash tree). Four parallax layers + clouds at 0.2. |
| Tall tree | A vertical tilt `camYf`: up 980 px over 54.2–57.8 s along the mountain ash with a dimension line drawing "≈ 100 m", then back down 58.4–60.9 s. |
| Mist | 70.3–73.6 s: two wavy paper layers rise from the bottom and erase the world (no cut). |
| Map | Static, centred continent (equirectangular, cos 26° correction, 24 px/°), slight 90 px vertical settle when rewinding in time. |
| End | The map fades to 30 % and the title block returns over it. |

No cuts anywhere: the whole film is one painted sheet.

- **Painting in**: `plantP` — a plant's progress is `(REV(t) − screenX) / (span × max(.55, parallax))`. `REV` sweeps from −300 to 1650 px during the reveal (10.2–13.4 s); afterwards everything entering from the right is painted over ~380 px of travel. `drawList` draws N strokes in order, each taking `clamp(4/N, .12, .5)` of the progress, so trunks come first and leaf clumps last.
- **Sway**: a horizontal skew `sway × (sin(1.15t+φ) + .4 sin(2.7t+2φ))`, 0.006 for trees, 0.01–0.03 for grass and ferns.
- **Brush-edge wipes**: the whole landscape is revealed by a vertical wavy clip (`drawStripAt(..., reveal)`), the horizon by a left-to-right `drawS` progress, the coastline segment by segment, labels by a rectangle clip that opens left-to-right (`hand`), leader lines by growing point count (`leader`).
- **Music-locked animation**: kangaroo hops are phased to the score's beat grid (`BEAT0 = 11.865`, `BEAT = .5805` s, one hop per 2 beats) so every landing hits a beat.
- **Events**: raindrops fall onto mulga tips and slide down the stems (14 drops, 0.36 s apart) while a wet patch and a dashed tap root spread; fire front sweeps 5650→6900 world px in 3 s, trees cross-fade to a `#2a2320` burnt sprite, an ash band darkens the ground, then green epicormic shoots `drawList` back in; the rainforest `burst` paints every visible rainforest plant within 0.9 s.
- **Map**: the rainfall field is recomputed per frame from station values with a time multiplier (`mapTau`), so 50 Ma → today is a continuous "drying" with a radial fill reveal; fires flicker in the 500–900 mm band while it dries.
- Ease functions: `ss`, `eio`, `eo`, `ei` in `engine.js`; everything is a pure function of `t`.

## Score structure

- **Voice**: Kokoro (`kokoro-onnx`, model `core/tts/kokoro-v1.0.onnx`), voice **`af_heart`**, **speed 0.93**, `lang en-us` — warm, unhurried documentary read. Trim to 1 % of peak with 10 ms head / 100 ms tail. Numbers are spelled out in the TTS text ("two hundred and fifty millimetres") and written as digits in the subtitles. 13 lines, one per beat of the story, 1.7–7.4 s each.
- **Check**: `asr.py` transcribes every line with faster-whisper `base.en`; all 13 read back correctly (only spelling variants: "millimeters", "Red Center", "1%").
- **Music**: Scott Buckley — *Wildflowers* (CC BY 4.0). The 322 s track is cut to 117.8 s with **one beat-aligned jump**: `analyze.py` (librosa beat track, 103.4 BPM, 502 beats; chroma + MFCC beat-synchronous self-similarity) → `jump.py` ranks jump pairs whose result lands at 100–128 s → chosen pair beat 85 (61.23 s) → beat 437 (265.61 s), chroma similarity 0.915, 4-beat phase aligned, 0.18 s equal-power crossfade starting 60 ms before the beat (`edit.py`). The picture's beat constants come from the same `wf_beats.json`.
- **SFX**: all synthesised in `mix.py` (numpy/scipy): paper brush rustle (band-passed noise, 9 Hz tremolo, panned sweep), a thump for the sun stamp, desert wind, 46 budgie chirps, 14 raindrop plinks timed to the mulga drops, fire roar + crackle, rising rain, two eastern whipbird calls, a mist swell and a quiet map-fire crackle. Short convolution reverb from a filtered noise IR.
- **Mix** (`mix.py`): voice → 48 kHz, 90 Hz high-pass, RMS compressor (−24 dB, 3:1). **Kokoro's peak-to-RMS is ~17 dB**, so a **5 ms look-ahead peak limiter** (ceiling = speech RMS + 11 dB) runs *before* the level match; then voice RMS = music RMS + 8 dB during speech; music ducks ×0.62 (≈ −4 dB) under voice with a 0.3 s smoothed envelope; mix normalised to 0.89 peak. Final loudness in `mux.sh`: single-pass `loudnorm=I=-14:TP=-1` → −14.2 LUFS, −1.0 dBFS peak.

## Palette & props

**Paper**: `demo/paper.jpg`, generated by `paper.py` — base `#f1e9da`, three octaves of smooth noise (±3.5 %), 2,600 short curved fibres (±3.5 % light/dark), fine grain, 5 % vignette. It is drawn first every frame and is also the mist that erases the landscape (`drawMist` clips `PAPER_IMG` with a wavy rising edge).

**Ink**: `INK #2b2520` (lines, text, trunk edges), `INK2 #3d3129` (branches, stems). Accent: vermilion sun `#cf4f2c` with 7 horizontal `#b8401f` dry-brush bars (it reads as a seal); rain blue `#3f7fa8` (drops, gauge fill).

**Zone palettes** (`scene.js` `ZCOL`, blended by camera position with `mixZone`/`zoneGrad`):

| Zone | sky | far hills | mid ground | main ground |
|---|---|---|---|---|
| desert | `#f0d6b8` | `#dcae8e` | `#dba47e` | `#dda27a` |
| mulga | `#efdcc6` | `#c89b8c` | `#d0ae80` | `#dbb584` |
| wood | `#ece2cd` | `#bdb99c` | `#cbc28f` | `#dccb92` |
| wet | `#dfe3dc` | `#9fb1b8` | `#98aa8a` | `#a7b48e` |
| rain | `#dbe3d8` | `#9ab19f` | `#6f8d6d` | `#6e8b69` |

Plant colour sets live in `plants.js` `COL` (straw, mulga, salt, gum, gold, ash, fern, rain, rainLite, palm, wattle). Map rainfall ramp (`main.js` `MSTOP`): 150 mm `#cf7c4f` → 300 `#cda35f` → 650 `#b3b07a` → 1150 `#7f9a6c` → 2000 `#46705a` → 4000 `#2f5a45`, quantised into 5 bands on the map.

**Stroke material** (`engine.js`): a ribbon whose width follows a profile (`brush`, `leaf`, `even`, `tip`, `trunk`) with ±22 % value-noise roughness, filled at `a × rib` (≈ 0.57 when bristles are present, so the body is a thin wash) plus `nb` bristle tracks at 30–85 % opacity, each with a random dash pattern (long runs of 18–90 px, gaps up to w/2) and a random early end — that is the flying white. Washes (`washPoly`) are 3 passes of the same polygon with jittered vertices at `a/3 × 1.6`, so edges darken where passes disagree, like a pooled watercolour edge.

**Layers** (`LAY`): far (parallax 0.25, ground y 640, scale 0.38, alpha 0.5) · mid (0.55, 690, 0.62, 0.78) · main (1.0, 745, 1.0, 1.0) · fg (1.55, 1115, 1.75, 0.95). Distance = smaller, lighter, less saturated; two mist bands (`mistBand`) sit between the layers in the wet zones.

**Type**: Cormorant Garamond (biome titles 500 52 px, subtitles italic 500 36 px, title italic 124 px, map year 150 px / "today" italic 104 px), Caveat 500/600 (hand notes, 26–42 px, drawn twice over a paper-coloured 12 px shadow halo), IBM Plex Mono 400 (labels such as `ANNUAL RAINFALL`, `01 / 05`, 3 px letter-spacing), Noto Serif SC 400 (Chinese subtitle line). Self-hosted in `demo/fonts/` via `fetch_fonts.mjs`; Noto Serif SC is **subset to the CJK characters that appear in `scene.js` + `main.js`**.

## Titles, subtitles & end card

- **Burned-in, bilingual**, centred at the bottom: English italic Cormorant Garamond 36 px (auto-wrapped to 2 balanced lines at 1400 px, baseline 1000 or 962/1000) + Chinese Noto Serif SC 24 px at 1042, `INK` at 78 %, both over an 18 px paper-coloured shadow halo, drawn twice for density. Visible from `start − .15` to `start + dur + .45` with 0.25/0.35 s fades. The same table (`VO` in `scene.js`) drives the mix and `watercolor.srt`.
- **Biome card** (top-left): a short painted colour swatch, `01 / 05` mono, name in Cormorant 52 px, italic subtitle. **Gauge** (top-right): `ANNUAL RAINFALL`, value in Cormorant 54 px (`< 250 mm`, `≈ 1,600 mm`), a log-scale bar 100–4,000 mm with a blue drop marker.
- **Title**: "Follow the Rain" italic Cormorant 124 px wiped in, then the spaced caps subtitle and the Chinese line.
- **End card**: title block over the faded map + credits in IBM Plex Mono 15 px (music with licence, voice, coastline source, "rainfall bands are schematic"), and under them the sign-off **"LemoLab × Claude Opus 5.5"** in italic Cormorant Garamond 30 px, `INK` 85 %, centred at y 1010, fading in with the credits (105–106.2 s) — a serif italic line so it reads as the film's signature, not another asset credit. Keep it clear of the map (Tasmania sits at y ≈ 845–915). This sign-off belongs to this library's demo only: a user's film carries no LemoLab credit and no copy of this end card.

## Pitfalls we hit (demo record)

- **Strip canvases too short flatten the hills**: the far/mid washes are pre-painted into long offscreen strips. If a strip's `yTop` is too low, the tall ridges and the rainforest canopy wall get cut into flat tops, and the 980 px tilt-up exposes the cut. The far strip spans y 150–1500 and starts at world x −6000; the mid strip spans 200–1500.
- **Semi-transparent strip bottoms show a hard edge**: a wash that stops at the bottom of its canvas leaves a visible horizontal seam when a translucent layer is drawn over it. Extend every strip below the frame (to 1500 px) and fade the main ground to paper with a vertical gradient instead of stopping it.
- **Top-level `const` order → `READY` never set**: all five scripts share one global scope. If initialisation touches a `const` before its declaration (e.g. `CLOUDS`, `PAPER_IMG`) the async init throws, `window.READY` stays false and every screenshot times out after 60 s. Do all building inside the async init in `main.js`, and read `[pageerror]` lines in the render log.
- **Determinism**: `mk()` consumes the global RNG. Any stroke created inside `render(t)` must be wrapped in `withSeed(seed, …)` (sun, HUD swatches, animals, flames, legend rows) or be pre-built in `build()`; otherwise frames depend on render history and parallel workers disagree.
- **Performance**: drawing thousands of strokes per frame is too slow. Cache each finished plant as a sprite (`sprite()`); only plants whose progress is < 1 (being painted) or burning are drawn stroke by stroke.
- **Kokoro voice is very peaky** (~17 dB peak-to-RMS): matching RMS alone either buries the voice or clips it — limit first, then match.
- **Beat-locked animation**: keep the score's beat grid (`wf_beats.json`) as the source for `BEAT0`/`BEAT`; if the music edit changes, re-derive them.
- **CJK subset**: new Chinese subtitle characters render in a fallback font until you re-run `node fetch_fonts.mjs` (it subsets Noto Serif SC to the characters in `scene.js` + `main.js`).
- **`mix.py` parses `scene.js`** with the regex `\['(v\d\d)', ([\d.]+),` to place the voice lines — keep the `VO` rows in exactly that form.
- `playwright-core` resolves from the repo root (there is no `node_modules` in `demo/`). zsh does not word-split `$TS`; use `${=TS}` when passing many timestamps.

## Build notes

```
styles/watercolor/demo/
  index.html      loads fonts.css + aus.js, engine.js, plants.js, scene.js, main.js (classic scripts, one global scope)
  engine.js       RNG/easing/noise, monotone spline, colours, the stroke engine (mk, drawS, drawList, sprite, clump, edgeOf)
  plants.js       plant & prop generators (spinifex, desertOak, mulga, saltbush, wattle, tussock, gum, ash, treeFern,
                  groundFern, rfTree, fanPalm, vine, farTree, uluru, cloud, shrub)
  scene.js        VO table, layers, zones, camera, world build, wash strips, landscape drawing, animals, fire, rain, notes
  main.js         canvas, map (deep time), mist, HUD, subtitles, title/end card, render(t), async init → READY
  aus.js          coastline rings (from extract_aus.mjs)   paper.jpg (paper.py)   fonts/ + fonts.css (fetch_fonts.mjs)
  tts/lines.json  voice script   tts/gen.py  Kokoro   asr.py  whisper check   voices/  v01–v13.wav + dur.json
  music/          prep.sh (source files) · analyze.py · lag.py · jump.py · edit.py → score.wav
  mix.py          SFX + voice + music → mix.wav      render.mjs  stills / video / part     mux.sh  → ../watercolor.mp4
```

All commands from the repo root, Python = `.venv/bin/python`:

```sh
D=styles/watercolor/demo
# 1. voice (13 lines, ~10 s) and whisper check
.venv/bin/python $D/tts/gen.py                 # → $D/voices/v01..v13.wav + dur.json  (OUT=dir to write elsewhere)
.venv/bin/python $D/asr.py                     # prints each transcript; compare with tts/lines.json
#    copy the durations into the VO table in scene.js (id, start, dur, en, zh) and set the start times
# 2. music
sh $D/music/prep.sh                            # Wildflowers.mp3 → Wildflowers.wav (22.05k mono) + wf48.wav (48k)
.venv/bin/python $D/music/analyze.py           # → wf_beats.json (plot skipped: no matplotlib in .venv)
.venv/bin/python $D/music/jump.py              # ranked jump candidates; pick one, put its beat indices in edit.py
.venv/bin/python $D/music/edit.py              # → score.wav, score_beats.json
# 3. look at frames while building (≈0.35 s/frame as PNG)
OUT=$D/out/review node $D/render.mjs stills 5 20 43 66 90 106
.venv/bin/python core/render/sheet.py $D/out/review/sheet.jpg $D/out/review/t_*.png --cols 3 --w 640
# 4. mix (4 s) — writes $D/mix.wav, or pass a path
.venv/bin/python $D/mix.py
# 5. video: 6816 frames at 60 fps, ~50 ms/frame/worker (8 workers ≈ 2 min; keep 2–3 when other jobs run)
node $D/render.mjs video 8                     # → $D/out/seg_0..7.mp4 + out/list.txt  (x264 crf 12 intermediates)
# 6. mux (≈70 s): concat + x264 slow crf 16 g 120 + loudnorm −14 → styles/watercolor/watercolor.mp4
sh $D/mux.sh                                   # or: sh $D/mux.sh path/to/test.mp4
# 7. subtitles: VO table → srt
#    ($D/out/srt_cues.json = VO rows as {t0: s-.15, t1: s+dur+.45, text: "en\nzh"}, dumped from scene.js with a 5-line node script)
.venv/bin/python core/render/srt.py $D/out/srt_cues.json styles/watercolor/watercolor.srt
```

Partial re-render (used for the end-card sign-off): `node $D/render.mjs part 99.4 113.6 $D/out/seg_7.mp4` re-creates the last 8-worker segment exactly (frames 5964–6815), then `sh $D/mux.sh`.
One-time asset scripts (already run): `node $D/extract_aus.mjs` (coastline; reads world-atlas from the npm CDN, needs network), `cd $D && ../../../.venv/bin/python paper.py` (paper), `node $D/fetch_fonts.mjs` (fonts, needs network).

## Engine reference

**Page contract** (`render.mjs` relies on it): `window.DUR` (seconds), `window.render(t)` (pure function of t, draws the whole frame), `window.READY = true` after fonts, paper and `build()` are done. Canvas 1920×1080, `ctx` global from `main.js`.

**Stroke engine — `engine.js`**

| Function | Purpose / parameters |
|---|---|
| `mk(pts, w, col, o)` | Build a stroke from a centre-line `[[x,y],…]`, base width `w` px, hex colour. `o.prof`: `'brush'` (default: fat start, tapering), `'leaf'` (sin swell), `'even'` (flat, short tapers), `'tip'` (thick root → fine tip), `'trunk'` (flared base, −62 % to top). `o.nb`: bristle tracks (default `clamp(round(w/3.2), 3, 9)` when `w ≥ 6`, else 0). `o.a`: opacity (0.92). `o.rib`: body opacity factor (0.62 with bristles, 0.92 without). `o.rough`: width noise (0.22). Consumes RNG. |
| `drawS(c, s, p=1, col, am=1)` | Paint stroke `s` on context `c` up to fraction `p` of its length (a moving brush tip), optional colour override and alpha multiplier. |
| `drawList(c, L, p)` | Paint a list of strokes in order; `p ∈ [0,1]` for the whole list. |
| `sprite(L, col)` | Rasterise a stroke list to an offscreen canvas → `{cv, x0, y0, x1, y1}` (draw at `x0,y0` in local coords). `col` repaints all strokes in one colour (burnt silhouettes). |
| `qcurve(x0,y0,x1,y1,bend,n)`, `qctrl(...)`, `polar(x,y,ang,len,bend,n)` | Centre-line helpers (quadratic curves; `bend` is sideways offset of the control point). |
| `clump(S, cx, cy, r, n, cols, o)` | Push `n` leaf dabs in an ellipse (`o.sx`, `o.sy`), optional direction `o.dir ± o.spread`, lengths `o.l0–l1`, widths `o.w0–w1`, alpha `o.a0–a1`. |
| `edgeOf(s, side, w, col, a)` | Shadow/ink edge running along one side of a stroke (trunks, limbs). |
| `withSeed(seed, fn)` | Run `fn` with a fixed RNG — **required** for anything built inside `render`. |
| `monotone([[t,v],…])` | Monotone cubic keyframe track (camera paths). |
| `ss eio eo ei seg clamp lerp vnoise fbm hash mixc rgba` | Easing, ranges, noise, colour helpers. |

**Plants — `plants.js`**: every generator takes a scale `sc` (and optional args), works in local coordinates with the root at (0,0) and y up = negative, and returns `{ S: strokes, … }` (`gum` also returns `woody`, `leaves`, `shoots`, `fork`; `mulga` returns `stems`; `ash`/`rfTree` return `top`).

**World — `scene.js`**: `add(layer, worldX, generator, scale, {dy, span, sway, args, extra})` places a plant into `PL[layer]` and caches its sprite; `build()` fills zones by walking world x with `zoneJit`; `buildStrips()` pre-paints hill/ground washes with `washPoly(c, pts, fill, alpha, passes, jitter)`; `drawLandscape(t)` draws sky → far strip/plants → mist → mid → ground → horizon → main plants (with hooks for hero events) → animals → fire → foreground → rain. Annotations: `hand(txt, x, y, p, {size, w, align, col})`, `leader(x0,y0,x1,y1,p,bend)`, `note(t, t0, t1, anchorX, anchorY, labelX, labelY, txt, o)`; `scr(plant, dx, dy, t)` converts a plant-local point to screen space for labels.

**Minimal example** — replace `scene.js` + `main.js` with this to get a gum tree painting itself on paper (keep `index.html`, `engine.js`, `plants.js`, `paper.jpg`, fonts):

```js
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
window.DUR = 6; let PAPER_IMG, tree, horizon;
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(PAPER_IMG, 0, 0);
  drawS(ctx, horizon, seg(t, .2, 1.6));                                   // horizon brushed across
  const p = seg(t, 1, 4.5), sk = .006 * Math.sin(t * 1.15);                // paint-in progress + sway
  ctx.setTransform(1, 0, sk, 1, 960, 820);
  if (p < 1) drawList(ctx, tree.S, p); else ctx.drawImage(tree.spr.cv, tree.spr.x0, tree.spr.y0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  withSeed(7, () => drawS(ctx, mk(qcurve(80, 90, 120, 90, 0, 5), 9, '#b3b07a', { prof: 'even', nb: 3 }), seg(t, 4.5, 5)));
  ctx.font = '500 52px "Cormorant Garamond"'; ctx.fillStyle = rgba(INK, ss(seg(t, 4.6, 5.2))); ctx.fillText('Eucalypt woodland', 76, 150);
}
window.render = render;
(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  await document.fonts.load('500 52px "Cormorant Garamond"');
  tree = withSeed(1, () => gum(1.2)); tree.spr = sprite(tree.S);
  horizon = withSeed(2, () => mk(qcurve(120, 822, 1800, 822, -4, 40), 5.2, INK2, { prof: 'even', nb: 5, a: .88, rough: .3 }));
  window.READY = true;
})();
```

For a full film: keep `engine.js`/`plants.js` (add generators for your specimens in the same style), rewrite the `VO`, `LAY`, `ZONES`, `RAINK`-style value table, `camXf`, `ZCOL` and `build()` in `scene.js`, and the map / HUD / titles in `main.js`.
