# Whiteboard Explainer — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Einstein in Your Pocket* (111 s) · `whiteboard.mp4` · source in [`demo/`](demo/)


In one line: a science explainer drawn live on one glossy dry-erase board: single-line handwriting that is actually *written* stroke by stroke, floating markers with no hand, a magnet that can move, an eraser that can rewind time — and a camera that never leaves the board until the final pull-back shows the whole lesson hanging on the wall.

## Story & structure

Why GPS needs relativity, told from the map pin on your phone. This is an unofficial educational film: Albert Einstein appears only as the historical scientist, by name, and his estate and the holders of rights in his name and image did not make or endorse it; nor did the operators of GPS. Style notes for this demo:

A lesson on **one physical whiteboard**. Everything the viewer learns is drawn in dry-erase marker in front of them, in real handwriting order. The board is a *map*: each idea lives in its own region, and the camera travels between regions, usually **led by the pen** (the pen draws a line, the camera rides it). At the end the camera pulls back and the viewer sees that the whole explanation was one picture.

What makes it feel real rather than "animated text": ink that pools where the nib lands, dry streaks and speckle, strokes that overshoot and don't quite close, ghosts of old lessons that were never fully wiped, a glossy sheen that drifts slower than the board, and a sound for **every** stroke.

**This version has no hands.** Markers float (with a real cast shadow that grows when they lift), park outside the frame between phrases and fly back in. Physical props (magnets, eraser) move on their own. Don't draw a hand, an arm, or a cursor.

| Native power | How the demo used it |
|---|---|
| **Writing in stroke order** | The reveal *is* the explanation: an equation appears term by term exactly when the narrator says the term. |
| **One board, one camera** | Distance on the board = distance in the argument. Returning to an earlier drawing is a free callback (the demo returns to its first equation to compute 38 μs × c ≈ 11 km). |
| **The pen leads the camera** | Transitions are drawn: an orbit, a signal line, a trail. The camera follows the line to the next idea. |
| **Magnets** | The only objects allowed to *move* on a whiteboard. Give the hero (the "you are here" pin) to a magnet; it can be lifted off, dropped, slid, sunk. |
| **The eraser rewinds** | Wiping a trail backwards reads as undoing time. The demo uses it once, right after the joke. |
| **Two pens at once** | A duet: two quantities compared live (the demo: ground clock vs orbit clock ticking at two tempi). |
| **Full-board reveal** | The demo's ending: pull back past the frame to the wall and the pen tray. Every earlier scene reappears at once. |

**Demo story shape:** hook on one tiny object (the pin) → scale reveal → title on the first downbeat → mechanism in 3 steps → **silence + "But, there's a catch."** → the twist explained with a visual duet → a joke that shows the consequence (the pin drifts one day per beat into the sea) → the eraser rewinds → the fix, in sync → pull back to the whole board → end card written under the title.

Finding the topic's handle (the same recipe works for others): find **one object the viewer owns** (the phone, a loaf, a lightbulb), one number that surprises, and one consequence you can *walk* across the board. Put the surprise in the middle, after a silence.

## Shots

- A 2D camera over an 8000 × 4500 board: position, zoom (interpolated in 1/z so pushes feel like dollies), a little roll.
- **Grammar**: (1) pull back to reveal scale; (2) ride the line the pen is drawing; (3) hold still whenever the viewer must read; (4) one whip into a new idea after a silence; (5) one final pull-back beyond the frame.
- Real 180° **motion blur**: when the camera moves more than 14 px per frame, render up to 12 sub-frames and average them.
- Keep the bottom 12 % of the frame for subtitles in every shot.

In the demo the camera never leaves the board until the final pull-back, which shows the whole lesson hanging on the wall with its aluminium frame and pen tray.

Demo motion numbers: pen hop lift 35 % of the window max; gaps > 0.75 s send the pen to park, returning 0.42 s before its next stroke; magnet drop 0.3 s, sink = tilt 0.5 rad and drop 40 px; eraser band 90–230 px at 90 % strength; title 3 s, a label 0.3–0.8 s, a full satellite ~1 s. Motion:

- **Hand speed**: every stroke follows `u − sin(2πu)/2π × 0.8` — slow landing, fast middle, slow lift. Strokes are scheduled into a **time window** (the engine solves the speed), so writing always finishes on the word.
- **Pen hops** between strokes: lift proportional to distance (shadow slides away and blurs), 35 % of the window max. Gaps > 0.75 s: the pen flies off to a parking spot outside the frame and returns 0.42 s before its next stroke.
- **Magnet**: drop = 0.3 s with lift → 0 and a big shadow shrinking; slide = smoothstep per step with a small lift; sink = tilt 0.5 rad and drop 40 px.
- **Eraser**: follows a path at constant speed, wipes a 90–230 px band at 90 % strength (a 10 % ghost always remains).
- **Speed**: title 3 s, a label 0.3–0.8 s, a full satellite ~1 s. Faster than real hands — this is a sped-up lesson — but never so fast that the stroke order is lost.

## Score structure

- **Every stroke sounds**: band-passed felt-on-gloss noise (2.2–7.5 kHz hiss + 0.5–1.5 kHz body) with the stroke's own speed curve as envelope, a 4 ms nib tick at the start, random stick-slip grains, and on ~28 % of long strokes the **dry-erase squeak** (a 1.5–2.6 kHz sine with 7–13 Hz vibrato). Blue marker slightly darker, orange slightly brighter. Pan = the stroke's screen x; closer camera = louder.
- **Props**: magnet on a steel board = click + metal modes (830/1370/2210/3120 Hz) + 140 Hz board thump; eraser = 250–2600 Hz felt rub modulated by its zig-zag; tray = plastic bounces + aluminium ring; cap off/on.
- **Room**: low room tone and a **wall clock that ticks the ground clock's seconds** — it is the only sound during the silence.
- **Score**: clockwork minimalism at 120 BPM, D major / B minor: marimba 8th-note arpeggio, cello + bass pizzicato, woodblock tick on every beat, glockenspiel theme, shaker/claps only in loud sections. Signals get glockenspiel pings, a falling signal gets a harp run, a drifting object gets a staccato march (tuba + bassoon, chromatic descent). For any "two quantities that diverge" moment, run **the same figure at two tempi** (phasing), then snap them into unison at the fix. Rewind = the previous cue reversed and squeezed.
- **Mix**: VO on top (compressed, light room), score 6.5 dB under VO RMS and ducked another 9 dB under speech, foley ~11 dB under VO; −14 LUFS.

## Palette & props

- **Board**: warm white `#fbfbf9 → #eeede9` gradient, a faint scuff/micro-scratch tile, ~46 **ghost marks** (old words, circles, arrows) at 5–10 % in grey `#9aa0a8` / pale blue `#8aa0c8`. A soft diagonal **window sheen** (white, 10–16 %) that moves at 0.35× the camera — this one detail sells "glossy".
- **Ink**: black `#23262c`, blue `#2a5cb3`, orange `#d97757`, alpha 0.94, composited with **multiply** so overlaps darken like real marker. Width 6–11 px for drawing, 13 % of cap height for lettering.
  - Colour semantics: **black** = things and structure, **blue** = signals, light, measurement, **orange** = you / time / the thing that matters (one accent per scene). Monochrome variant: keep one element orange (the "only colour").
- **Stroke character**: resampled every ~0.6 × width; low-frequency hand wobble along the normal (±2.6 px, wavelength ~220 px) plus a finer tremor; chisel-tip width modulation by direction (0.8–1.0); pressure ramp at the start (0.72 → 1) and a 12 % taper at the end; circles start at an angle and **overlap past closure**; rectangles are 4 strokes with small corner overshoot; a darker pooled dot just inside the start of every long stroke.
- **Dry-marker texture**: a 512 px tile of speckles and short streaks subtracted from the ink layer (destination-out), locked to board space, faded out when the camera is wide.
- **Lettering**: single-line font **EMS Tech** (OFL, a single-stroke version of Architects Daughter), every glyph with ±2° rotation, ±3.5 % baseline and scale jitter. Missing glyphs (μ ≈ → × − ✓ ² ↓ ° ± .) are hand-defined in the engine. Title 200 / 120 px cap height, labels 30–70 px.
- **Props**: dry-erase markers (white barrel, colour band and posted cap in the ink colour, felt nib), a charcoal felt eraser with a small orange label, one glossy orange **map-pin magnet** (radial gradient, white dot, specular highlight, soft cast shadow). Aluminium frame and pen tray only appear in the final wide shot, on a warm grey wall `#d8d3ca`.

## Titles & end card

- Title and end card are **written on the board** in the same single-line hand; the end card is written under the title so the film ends where it began.
- Burned subtitles: off-white rounded label (90 %), Architects Daughter 44 px, dark ink text, a short orange marker dash bottom-left. Split at clauses, ≤ 44 chars per line, short clauses merged, two lines above 1250 px.

The demo's end card is written under the title in the same hand (`demo/film.js`, block `END CARD`, from 103.3 s): "Whiteboard Explainer", "Lemo-Opuscar" in orange, "LemoLab × Claude Opus 5.5", then voice, lettering and sample credits in small type; the pen caps at 107.3 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card (take those `credit()` lines out when reusing the code).

## Build notes

1. Write the script as short lines (`demo/lines.json`), synthesize with `core/tts/tts.py` (voice `bm_george`, `lang: en-gb`), check with `demo/tools/asr_check.py` (`WM=medium.en`) → `voices/words.json` word times.
2. Lay out the board (regions for each idea), then write `demo/film.js`: VO start times, drawings hung on spoken words with `at(id, word)`, pens, camera keys.
3. `node core/render/events.mjs demo` → `events.json` (every stroke, wipe, magnet, cue anchors).
4. `music.py` (reads the same events) → `mix.py` (foley generated from events + VO + ducked score).
5. `node core/render/video.mjs demo --fps 24` → `core/render/mux.sh … 24 2`. Whole film renders in ~30 s.
6. `demo/build.sh` does steps 3–5 plus subtitles, poster and stills; `--vo` also redoes step 1.

### Pitfalls

- **One pen, too many jobs**: a single pen scheduled back-to-back drifts later and later (satellites can arrive 12 s late). Give every drawing a window (`by:`) and let overlapping jobs go to another pen.
- **Minimum stroke duration × dashes**: a 60-dash line with a 0.09 s floor takes 6 s. Dashes need their own tiny floor.
- **Pooled-ink dot bigger than the stroke start** → grey halos on every letter. Keep the dot inside the stroke.
- **Punctuation vanishes**: a font period is a 1 px stroke. Render sub-width strokes as dots.
- **Labels half-cut by a push-in** look sloppy: a label must be either fully in or fully out of every shot it appears in.
- **Motion blur with few sub-frames** strobes text. Step ≤ 4 px between sub-frames.
- **British voice + US phonemes**: Kokoro `bm_george` with `lang: en-us` says "clocks" like "Clarks". Use `en-gb` for British voices; check with `medium.en`.
- Keep eraser paths off labels you want to keep.

## Engine reference

| Function | What it does |
|---|---|
| `loadFont(name, url)` | Load a single-line font converted by `demo/tools/svgfont2json.py` (`'tech'` = EMS Tech) |
| `line / curve / poly / arc / circle / rect / roundRect / arrow / dashed / hatch` | Hand-drawn shapes → `Stroke` / `Stroke[]`. Options: `w`, `color`, `jitter`, `over` (overshoot), `bow`, `lap` (circle overlap), `clip` (rounded rect), `alpha` |
| `text(str, x, y, {h, align, w, color, font})` | Handwritten text as strokes in writing order (`h` = cap height) |
| `new Stroke(points, opts)` | Any path (flat `[x,y,…]`) in marker style |
| `new Pen(id, color, {park})` | A floating marker; `park` = its off-frame spot in screen px |
| `Timeline.draw(pen, shapes, t, {by, speed, minGap, maxGap})` | Schedule strokes; with `by` the hand speed is solved to finish on time |
| `Timeline.erase(path, t, dur, {width, strength})` | Felt eraser along a path (leaves a ghost) |
| `Timeline.cue(t, type, extra)` | Extra sound/music anchors exported to `events.json` |
| `new Camera([[t, x, y, zoom, roll, ease], …])` | Keyed 2D camera; ease `io` `i` `o` `l` `s` |
| `new Board(tl, {ghosts})` · `board.render(ctx, t, cam)` | Board, ink (multiply + dry texture + erasers), sheen, `objs` (world props) and `overlays` (screen) |
| `penPose / drawMarker / drawEraser / drawPinMagnet` | The physical props |

Minimal call — draw a warm-orange four-point sparkle with a short cursor tail, in marker:

```js
import * as W from './engine/wb.js';
await W.loadFont('tech', 'fonts/EMSTech.json');
const tl = new W.Timeline(), O = new W.Pen('orange', '#D97757');
const star = [], cx = 960, cy = 540, R = 120, r = 26;
for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, q = i % 2 ? r : R; star.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); }
tl.draw(O, [W.poly(star, { w: 10 }), W.line(cx + 150, cy + 60, cx + 150, cy + 150, { w: 10 })], 0.5, { by: 1.6 });
tl.draw(O, W.text('ready', cx + 190, cy + 150, { h: 60 }), 1.7, { by: 2.4 });
tl.end();
const board = new W.Board(tl), cam = new W.Camera([[0, 960, 540, 1]]);
board.objs.push({ draw: (ctx, t, c) => W.drawMarker(ctx, O, W.penPose(O, t, cam), c, t) });
window.render = t => board.render(ctx, t, cam);           // ctx = your 1920×1080 canvas 2D context
```
Single-colour variant: draw everything with the black pen and give only the element that matters `{ color: '#D97757' }`.
