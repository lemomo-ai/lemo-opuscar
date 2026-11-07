# Urban Sketch · Pen & Wash — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Where the Wind Went* (33.4 s, 1920×1080, 24 fps, no voice-over) · `urban-sketch.mp4` · source in [`demo/`](demo/)


A sketchbook page from the park bench: fine sepia fineliner lines that wobble, overshoot and never quite close, with loose transparent watercolour dropped on top. The colour sits slightly off the lines, spills over them, and dissolves into cream cold-press paper at the page edge.

## Story & structure

A park exists only as an ink sketch, and the only colour on the page is a straw hat. A gust steals the hat, and **the page gets painted wherever the wind carries it**.

What the style is, with the demo's exact colours: paper `#f5eede`, ink `#2b2520`.

Reportage drawing, made on location in a few minutes. Two layers that stay visibly separate:
1. **Ink.** One thin, near-constant line (a 0.3–0.5 mm fineliner), dark sepia `#2b2520`. It wobbles slightly, overshoots corners by a few pixels, breaks mid-stroke, and suggests rather than describes: a few window marks instead of a grid, scalloped fragments instead of a whole tree outline.
2. **Wash.** Transparent watercolour glazed on top. It is **misregistered** by 1–3 px from the line, sometimes spills past it, and leaves paper white for highlights and for figures (reserves). Dried edges are darker (pigment pools at the rim), and pigment granulates into the paper tooth.

The page itself is part of the image. The warm cream `#f5eede` cold-press paper has large-scale mottling and a fine tooth. Nothing is painted edge to edge: the painting frays into leaf-sized dabs and white holes, leaving a blank margin for handwriting.

Stories the style suits, and the native moves the demo uses (line before colour for the sketch spread and skyline; colour as arrival driven by the gust; the one coloured thing = the straw hat; the page as frame for the ending):

Good for: travel diaries, city portraits, a day in a place, "the moment I noticed…", slice-of-life, gentle comedy with small figures, anything that benefits from feeling observed and handmade.

**Native moves (only this medium does them):**
- **Line before colour.** Show the pen drawing a subject stroke by stroke (in real stroke order), then drop the wash in. The drawing process is the spectacle.
- **Colour as arrival.** Every pixel has a *colour arrival time*. Wash spreads outward from a source with a ragged wet front and a dark tide line, so you can paint with an event (wind, a runner, music, a sunrise). Figures stay frozen line drawings until colour touches them, then start moving.
- **The one coloured thing.** Open on a colourless sketch with a single tinted object; it becomes the protagonist.
- **The page as frame.** Pull back until the whole page is visible, edges dissolving, with handwritten title and notes in the margin. This works as an end card and a scale reveal in one.

## Shots

A 2D camera over a 5120×2880 page (the final pull-back shows it 1:1 at 0.375×).
- Designed moves use cubic easing. Follow shots use a critically damped spring on a lead-ahead target, so the camera lags like a hand-held follow (stiffness 28, or 70 for the fall).
- The demo uses push, pull, lateral follow, crane-up, whip-tilt with a slight roll, a punch-in with a 0.35 s shake on impact, a long pull-back, and a tilt down into the margin.
- Keep subjects at least one third of frame height at story beats; the hat gets a faint paper halo (reserve) so it reads over busy foliage.

## Motion as used in the demo

- Figures **boil** at 12 fps: line wobble and wash seeds change every 1/12 s. The static page does not boil (it is a real page); the camera moves every frame, smoothly.
- Figures keep anticipation, action and follow-through: a crouch before standing, a lunge and stumble on a miss, a prone slide after a dive. Footsteps land on the beat (run cycle = 2 beats).
- The wind is drawn: ink "~@" curls spawn behind the hat on every beat, draw on in 0.4 s, then erase from the tail; leaf dabs trail the hat.
- Colour never snaps. It blooms from a point with a noisy circular clip (figures) or through the arrival field (the world).

## Score structure

Three layers; no voice-over.
- **Ambience:** paper room tone → park birds (after colour arrives) → a low city hum that comes in a bar before the skyline (J-cut). Everything drops out for the silent bar.
- **Foley:** pen on cold-press paper (band-passed noise, 1.6–7.5 kHz, with a fibre amplitude texture and grain clicks, one burst per real stroke; thousands overlap into a hiss during the sketch spread; skyline strokes are brighter and read as a hi-hat); a wet brush "shhh" for every big bloom; wind J-cut from the right channel; the straw hat as paper flapping whose rate and level follow its speed and whose pan follows its screen x; steps on the beat; bike bell; dive, slide, catch slap and water plop.
- **Music:** 150 BPM jazz waltz in F: Sneakybass walking in three, synthesized brushes plus pedal hi-hat, upright piano on beats 2–3, a clarinet lead, muted trumpet for the city, pizzicato ostinato, vibraphone and marimba stabs where trees burst, and a floating D♭maj7♯11 at the apex, followed by **one bar of true silence**. The first sound after it is a chromatic clarinet fall with timpani; the catch lands on a tutti downbeat.
- Mix: music ducks under the catch; foley high-passed at 90 Hz; −14 LUFS, LRA 7.

## Palette & props

| Element | Value |
|---|---|
| Paper | `#f5eede`; mottling fbm at 0.0011 and 0.0062 cycles/px, ±4.5 %; tooth tile multiplied on top of everything, figures included |
| Ink | `#2b2520` at 96 % coverage; world line width 1.3–3.4 px (thinner far, thicker near); wobble 0.9–1.3 px; overshoot 3–8 px; 30–60 % of long strokes get one 3–9 px gap |
| Wash | 2–3 rough-edged layers (edge noise 4–12 px), multiply blend; alpha 0.4–0.65; offset from line by 0.7–1× line width; dried edge stroke at 30–40 % |
| Granulation | pigment × (0.82 + 0.36 · fbm(p · 0.21)) |
| Wet front | reveal smoothstep over 0.16 s of arrival time; front band darkened +70 % (Gaussian at +0.07 s, σ 0.08 s); edge noise ±240 px coarse + ±40 px fine |
| Foliage | pale base wash (sun `#d6d56f`), then light and shadow masses, then 5–20 px leaf dabs coloured by light direction: `#d6d56f` → `#aabf57` → `#7fa04a` → `#56793c` → `#3f5d36`; holes at the rim; scalloped ink fragments only on the outline |
| Sky | a few big soft ellipses of `#9fbcd6` / `#86a6c8` at 10–20 % alpha, fading upward; clouds are reserves with a `#b7b3c9` belly |
| Buildings | limestone `#d8c6a0`, ochre `#cfaa72`, glass `#98b1c8`, brick `#c49a7a`; shadow side = colour mixed 45 % with `#5a5f82`; distant blocks mixed 50 % with haze `#b9c0cc` |
| Lawn and path | `#c3c96f` / `#dcd98b` light bands, `#7f9c52` shade dabs; path `#d8ccb1`; grass = 2–4 ink flicks per tuft, denser near the camera |
| Figures | 3D skeleton, orthographic projection; torso silhouette from cross-sections; limbs as organic tapered tubes; hair and head as one mass; face left blank (one nose tick in profile); shadow side = colour mixed 40 % with violet `#464873` |
| Page edge | noisy boundary (fbm 0.004, ±80 px); a white-dab band 70 px wide inside, a coloured-dab spray 70 px wide outside |

## Titles and end card

No subtitles are needed. All text is **handwriting on the page**, written on with a left-to-right reveal and pen sound:
- corner note in Reenie Beanie (`Sun. 3:40 pm — windy`);
- title and colophon in Caveat (500–600 weight), left-aligned in the blank page margin.

The text stays in the world and moves with the camera, never as an overlay.

End card (`demo/film.js`, `notes()`): the title "Where the wind went." written in Caveat 500 at 190 px in the lower-left margin, about 120 px in from the edge (28.2–29.5 s), then the colophon in the same column: "Urban Sketch · Pen & Wash — a Lemo-Opuscar style" (29.6–30.2 s), "LemoLab × Claude Opus 5.5" in Caveat 600 (29.9–30.4 s), and the music, sample and font credits (30.2–30.9 s). The picture runs 1 s past the score (33.4 s) so the last line holds 2.5 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card (take those `handwrite()` lines out when reusing the code).

## Build notes

```
styles/urban-sketch/demo/
  engine.js   pen, wash, foliage, arrival field, GL compositor, figure rig, hat, bike, handwriting, sketchShape
  world.js    the static page: sky, skyline (ink in stroke order), trees, lawn, path, lamp, pond, bridge, crowd, edge dissolve
  poses.js    character looks + pose library (sit, run, walk, cycle, dive, prone, wave)
  film.js     timeline: hat path, camera, performances, colour sources, sound cues
  audio/      score.py (music) · foley.py (all procedural sound) · mix.py
  build.sh    one command, from nothing to urban-sketch.mp4
```
Render: `node core/render/video.mjs styles/urban-sketch/demo --fps 24 --workers 4` renders 778 frames in about 40 s on an M-series Mac; world build takes about 4 s per worker.

### Pitfalls

- **Straight edges in the colour field.** A source bounding box that ignores its vertical stretch (`sy`), or a square box that cuts the slow "creep" beyond the reach radius, leaves straight edges. Clip by the actual (noisy) distance, not the bbox.
- **Rectangle masks around set-back towers** leave white notches in the sky. Mask with the real stepped silhouette (tiers, spire, pyramid, water tank).
- **Characters losing colour** when they run into unpainted areas. Sample arrival once at the character's start point (or tie it to the event that coloured them), never at the current position.
- **Static ink cannot be occluded by later washes.** Far crowds therefore use carrot-people (one wash blob, two leg lines, a head dot) instead of full rigs; building ink is erased inside nearer buildings and tree crowns before drawing.
- **IK feet left pinned** while blending sit → stand splays the legs. Blend the foot targets toward under-hip positions.
- **Front-facing heads go bald.** Always draw the hair mass, then knock the face out of its lower part.
- Headless Chrome and big canvases: 5120² canvases for ink, time, colour and the page are fine, but pack ink and time into RGBA byte textures yourself (`getImageData`), and upload the arrival field as `R16F` (filterable).

## Engine reference

All functions are in `demo/engine.js` and are deterministic (same seed, same marks).

| Function | What it does |
|---|---|
| `penStroke(pts, {w, wob, over, gap, seed, smooth})` | prepares a fineliner stroke along any polyline (wobble, overshoot, taper, gaps) |
| `drawPen(ctx, stroke, p=1, col=INK, alpha=1, from=0)` | draws it up to fraction `p` (draw-on); `from` erases from the tail |
| `rasterPen(inkCtx, timeCtx, stroke, t0, dur, win)` | bakes a stroke into a static ink layer **plus** its per-pixel arrival time (stroke order playback in the shader) |
| `wash(ctx, poly, [r,g,b], {a, j, layers, edge, dx, dy, seed})` | a watercolour wash on any polygon (rough edges, glazing, dark tide line, offset) |
| `reserve(ctx, poly, a)` | lifts colour back to paper (reserves, foreground occlusion) |
| `dab(ctx, x, y, r, angle, col, a, seed)` / `foliage(ctx, crown[], opts)` | leaf dabs / a whole tree crown |
| `arrivalField(W, H, gw, gh, sources, {amp, creep})` | colour arrival time per cell; `sources = [{x, y, t, v, R, sy, mask, hard}]` |
| `compositor(canvas, layers)` → `draw(cam, t)` | WebGL page: paper × wash (revealed by arrival, wet front) × ink (revealed by stroke time) |
| `figure(look, pose, place, {seed, boil})` → prims | a sketched person (knock / wash / ink primitives); `prims.head`, `prims.hand` for attachments |
| `hat(c, r, [rx, ry, rz])`, `bike(place, phase, col)` | props with true 3D orientation |
| `drawPrims(ctx, prims, {color, ink, clip})` | draws primitives; `color` 0..1 = how far the wash has arrived; `ink` = draw-on progress (number or per-primitive function) |
| `sketchShape(ctx, poly, col, {ink, wash, offset, color, p})` | **any shape in this style** in one call |
| `handwrite(ctx, text, x, y, size, p, {font})` | handwriting written on left to right |

**The "only colour" hook.** Leave everything at `color: 0` (pure ink) and pass `color: 1` only for the element that keeps its colour, as the straw hat does in the demo. Or give that element an arrival source at t = 0 and everything else later.

Minimal example: a warm orange `#D97757` four-point sparkle with a short cursor tail.
```js
import { sketchShape, sparkle, penStroke, drawPen, hex } from './engine.js';
const star = sparkle(960, 540, 120, .24);                       // 4-point star polygon
sketchShape(ctx, star, hex('#D97757'), { ink: 3, wash: .7, offset: 3, seed: 7 });
drawPen(ctx, penStroke([[1040, 610], [1180, 640], [1300, 646]], { w: 3, wob: 1.2, over: 6, seed: 8 }), 1);   // the tail
```
