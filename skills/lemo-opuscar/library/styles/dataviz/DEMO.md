# Data Storytelling — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *A Hundred Summers* (50.0 s) · `dataviz.mp4` · source in [`demo/`](demo/)


A hundred and one summers of real global temperature (NASA GISTEMP v4, June–August), told as one woman's life from 1926 to 2026.

## Story & structure

The data is a time series, so it is drawn as dots and a line that morph into stripes. That is one choice for one dataset.

Shape: a cold open on one point. Tender, sparse early points. A steady middle. Acceleration: the notes get denser, and the pencil hurries. The frame breaks, and the pencil flinches and flips to its red end. A rush. **Everything stops half a beat early; this is the only cut in the film, into silence.** Then the last data point, alone, followed by the whole series in one view. The morph into stripes comes next, then the longer record, then an empty cell for the next value ("Next summer?"). The end card lives inside that empty cell.

How it was fitted to the data: 101 points (a series of 60–150 points suits this shape); 3 human notes pinned to the first marks drawn ("1926 — she is born.") in blue, 2 record notes pinned to the last in red; one frame-breaking moment found in the data; the last point given its own silence.

## Shots

| Beat | Camera |
|---|---|
| Cold open | Extreme close-up on the first dot (≈4×). Tilt up to follow the leader as the note is written. |
| Title | Pull back to 1.55×. The drop line becomes the x axis; the headline typesets above. |
| Early life | Push back in, then track the pencil, newest point at ~62 % of frame width. Slow pull-out as time speeds up (2.3 → 1.7×). |
| Climb | Pedestal up with the rising curve while a Dutch angle creeps in (0 → −1.5°). |
| Frame break | Punch-in over 2 frames (1.22 → 1.42×) plus decaying shake. A small jolt on the rescale. |
| Rush | Fast pull-out to 1.0×, roll to −3°, constant 2 px tremor. |
| **The cut** | Hard cut into a close-up of the empty slot: dashed column, `2026` label, level horizon. Rack focus from the defocused foreground pencil to its tip as it lands. |
| Reveal | Hold on the last point while its note is written, then pull back to the full view (1.06×). The axis rescales to fit everything. |
| Morph | Locked-off. |
| Scale | Pull and pan (→ 0.72×) to add the earlier record. |
| Echo | Push to the empty cell; it widens into the end card (frame within frame). |

Key moments with subjects ≥ 1/3 of frame height: the first dot plus note, the century chart, the stripes band.

Why this route, for this data: the first fact got the extreme close-up because one woman's birth was the human scale; the axes grew as the unit was first named; tracking kept the past behind and the future ahead; escalation, surprise and rush came from the data itself; the morph was locked-off because the transformation was the movement; the ending pushed into the empty next cell because the next value was unknown. Each is one choice from STYLE.md §6, not the style's default.

Motion numbers: 90 BPM (chosen because a 1/32 note is exactly 2 frames at 24 fps); 7 points on quarter notes → 24 on eighths → 40 on sixteenths → 27 on thirty-seconds (a point every 2 frames). Rescale: four steps on 1/32 notes, each eased over 0.09 beat; the second rescale, in the clarity phase, is smooth. Flinch: freeze half a beat, then a 0.5 s end-over-end flip to the red lead. Morph: sweep over 0.85 beat; each mark falls to the band centre (first 45 %), then stretches to a full stripe (ease-out) and loses its ring; line segments fade as their left dot starts morphing; annotations return as tiny pencil marks above the band.

## Score structure

- Ambience: room tone → evening crickets → the sea (J-cut before "1933", L-cut after) → cicadas that grow louder and denser with the heat (J-cut before the climb) → open wind after the silence → room tone.
- Sonification (`music/score.py`): `midi = 62 + (v + 0.4) × 17`; below-centre values snap to D major pentatonic. Detune only on the last ~15 points (5 → 45 cents). The note right before the silence is the most dissonant (max detune plus a minor-second shadow); the last point after the silence is the cleanest, highest note.
- Bed: pad Dmaj9 → G/D → D–Bm–G–A → Bb/D–Dm → semitone cluster; hats low-passed at 9.5 kHz. After the silence: a D open fifth (no third, no answer), a glissando of all 101 points replayed during the morph, Gmaj7#11 over D for the scale shot, and the **first point's note again** under the end card.
- Score arc: sparse, tender early points → a steady middle → accelerating subdivision as the notes densify → rush → silence → the last point alone → the whole → the morph → the first note again.
- Silences: 1.0 s true digital silence before the last point (all layers); 0.67 s near-silence before the empty cell. The first sounds after them: the last tap plus its note, then the first stroke of the empty cell.
- Mix: music −11 dB and cicadas −6 dB under the voice; narration SNR in the 300–4000 Hz band 8.6–16 dB; −14 LUFS, grain 0.
- Voice: Kokoro `af_alloy`, speed 0.92, 5 lines, never over the rush, the silence or the morph. Whisper writes numbers as digits: `asr` set to "For 50 years…" and "…turned 100…".
- Use one music-box note, not a baby's laugh.

## Palette & props

- Paper `#F6F3EC`; dot grid 24 px `#E4DDCF`. Ink `#2B2723`: axes 1.4–1.6 px, series line 2.4 px, gridlines `#DDD6C9` 1 px, zero line `#BDB4A5` 1.3 px. Tick numbers IBM Plex Mono 17–20 px `#6E665C`.
- Dots r = 6 px with a 1.5 px ink ring; landing pop 0.25 s (×1.55).
- Ramp, u = (v − centre) / half: `#2166AC` → `#4393C3` → `#92C5DE` → `#D1E5F0` → `#F2EEE8` (centre) → `#FDDBC7` → `#F4A582` → `#D6604D` → `#B2182B` → `#7A0F1E` (beyond +1). Centre = 1971–2000 mean 0.22 °C, half-span 0.85 °C.
- Handwriting Caveat 30 px world size, blue pencil `#2F5D8A` / red pencil `#A8283A`, per-glyph ±1.7° rotation and ±2.5 % baseline, 16 % of pixels knocked out for grain. Doodles: a three-curl wave, a heart.
- Pencil wood cone `#E3C79C`, entering at 35–58°.
- Plot box 1500 × 520 in world space; the first note above its mark, late notes above-left of their dot; the bottom 150 px for the caption. Title Newsreader 66 px.
- Caption: Newsreader 42 px, x = 180, baseline y ≈ 985, kicker `1926–1958`, 3-frame rise and fade, flips up when it leaves; the hold rule is asserted in `tools/subs.py`.
- The engine showcase uses a `#D97757` accent spark.

## End card

Inside the dashed "next cell": title, `DATA STORYTELLING`, a miniature of the stripes plus an empty dashed cell, `Lemo-Opuscar · LemoLab × Claude Opus 5.5`, data, font, voice and music credits (including "2026 value preliminary, retrieved 2026-09-26"), and a handwritten "Her story is fiction. Every number is real." The LemoLab sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/dataviz/demo/
  data/        GLB.Ts+dSST.csv (as downloaded) + jja.json      tools/extract_data.py  column → json + story facts
  timeline.js  90 BPM grid, year → beat map, every key beat, chart geometry (single source of truth)
  engine.js    the style: paper, camera, pencil strokes, handwriting, dots, stripes, morph, pencil, caption, shapes
  film.js      the story: annotations, camera path, pencil activities, chart layers, end card, events for the mix
  music/score.py   sonification + modular bed (reads events.json)      mix.py   ambience + foley + narration + ducking
  tools/       words.py subs.py cuecheck.py final_asr.py
```
1. Download the dataset and write the extractor. Print every fact the narration will claim.
2. Write `timeline.js` (grid plus year → beat map) before any drawing.
3. Build `engine.js`, then `film.js`, and render gate frames from the real engine (`node core/render/still.mjs … --range`).
4. `sh demo/build.sh` rebuilds everything from scratch in about 2 minutes: extract → TTS → whisper → words → events → score → cuecheck (107 cues, max 0.03 ms) → mix → subtitles → render (1200 frames, ~30 s with 2 workers) → mux (−14 LUFS, grain 0) → styleframe and poster.
5. Review: a 1 s contact sheet from the final mp4 twice (offset by 0.25 s), 0.1 s strips of the break, the cut and the morph, per-line whisper on the final mix, and a sample-accurate silence check.

Pitfalls tied to this demo: GISTEMP has J-D and D-N before the seasonal columns, so the column is selected by header name (`JJA`). Rescale on the frame break itself: a rescale 0.17 s after it goes unseen. Right-aligned notes: the pencil hop takes 16 % of the text phase. `pencilStroke`, `dashedCell` and `dataDot` set `globalAlpha` themselves. In tracking shots the frame edge cuts a world-space title. At 32nd-note density the pencil body lies across fresh dots.

## Engine reference

`demo/engine.js` (ES module, Canvas 2D, 1920×1080; imports `/core/lib.js`). World units are chart pixels at zoom 1. Call `applyCam(g, cam)` before any world-space drawing.

| Function | What it does | Key parameters |
|---|---|---|
| `drawPaper(g, cam, {dots})` | cream paper, fibre noise and dot grid, fixed in world space | `dots` 0–1 grid alpha |
| `applyCam(g, cam)` / `w2s` / `s2w` / `viewRect` | 2D camera transform and conversions | `cam = {x, y, zoom, roll, sx, sy}` (sx/sy = shake in px) |
| `valueColor(v, {center, half, alpha})` / `rampRGB(u)` | diverging stripes ramp | reference-mean `center`, symmetric `half` |
| `pencilStroke(g, pts, o)` | **draw any polyline in pencil**: wobble, taper, graphite grain, write-on; returns the tip | `color, width, progress, seed, wobble, passes, grain` |
| `inkShape(g, path, o)` | **any closed shape** as a pencil-annotated mark: flat fill + hatching + hand outline | `fill` (accent) or `value` (ramp), `hatch, progress` |
| `plotShape(g, path, o)` | sample any path into a dot-and-line data series | `n, r, values, accent, progress` |
| `stripesFill(g, path, values, o)` | fill any closed shape with warming stripes | ramp options, `accent` + `accentIndex` |
| `dotTrail(g, pts, o)` | tapering dot trail (cursor tail / comet) | `color, r0, r1` |
| `handText(g, text, x, y, o)` | handwriting with grain and left→right reveal; returns `{tip, w}` | `size, color, progress, align, zoom` |
| `setType(g, text, x, y, o)` | printed type, letter-by-letter typesetting | `size, font, weight, progress, rise, track` |
| `dataDot(g, x, y, r, fill, o)` | data point with landing pop and ripple | `fresh` (s since landing), `ripple, accent, alpha` |
| `inkLine`, `stripe`, `morphMark(g, u, dot, box, fill)` | series line, one stripe, dot→stripe morph at 0..1 | |
| `leader`, `ringPath`, `wavePath`, `heartPath`, `bracketPath`, `sparklePath`, `quadPath` | annotation geometry | |
| `dashedCell(g, x0, y0, x1, y1, o)` | the dashed "next value" cell, drawn on | `progress, color, dash, gap` |
| `drawPencil(g, o)` | the red–blue pencil (screen space) | `tip [sx,sy], s, lift 0–1.2, flip 0–1 (blue→red), blur, focus, ang` |
| `caption(g, words, t, o)` | figure-caption subtitle with timed words | `t0, t1, kicker, x, y, size` |

Minimal example: a warm orange `#D97757` four-point spark with a cursor tail, drawn in this style (full version: `?engine=1` → `demo/stills/engine_demo.jpg`).

```js
import * as E from './engine.js';
const g = canvas.getContext('2d'), cam = { x: 0, y: 0, zoom: 1, roll: 0 };
E.drawPaper(g, cam); E.applyCam(g, cam);
E.dotTrail(g, Array.from({ length: 9 }, (_, i) => [-300 + i * 26, 170 - i * 14]), { color: '#D97757', r0: 9, r1: 2 });
E.inkShape(g, E.sparklePath(0, 0, 150), { fill: '#D97757' });            // accent bypasses the ramp
E.leader(g, [110, -200], [40, -110], { color: E.P.blue });
E.handText(g, 'the spark, in pencil', 120, -210, { size: 34, color: E.P.blue });
const tip = E.w2s(cam, 150, 0);
E.drawPencil(g, { tip, s: .8, lift: .2, flip: 0 });                        // flip: 1 = red end
```
