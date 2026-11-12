# Scratch Film — Style Prompt

> Direct animation: every picture looks scratched through black emulsion with a needle and tinted with transparent dye, redrawn by hand fifteen times a second and projected. Black is the ground; everything bright is a cut. Lines boil from drawing to drawing, light glows through every cut, colour lies in the grooves like dye.
> References (grammar only): the direct-animation tradition (films scratched and painted straight onto the film stock, without a camera), its boiling line and its light through the cut. Take the look of the marks and the projected glow; never copy a frame, a character or a score from any existing film, and never name one.

## 1. Essence, and what it is not

These define the style; keep all of them.

- **Black is the ground, light is a cut.** The frame is warm black emulsion. Everything bright is a scratch (one cream colour); everything coloured is transparent dye laid in or beside the cuts. A bright area is dense hatching, never a flat fill.
- **The line boils.** Each drawing is redrawn with a new hand tremble at 15 drawings a second: several near-parallel passes per line, uneven width, skips, chipped edges, an overshoot tail. Even a held frame moves.
- **The whole frame is the drawing.** Sea, sky, a room, a map: the world itself is scratched and dyed, edge to edge. The style is not a strip of film shown inside a scene.
- **The cut is visible.** Marks appear behind a hot point (a white core, a glow, chips flying): the act of making is part of the picture.

Not a chalkboard or whiteboard explainer (no flat board, no clean vector strokes), not Ink Wash (no wet tonal washes, no paper), not ASCII / CRT (no raster, no character cells), not a neon sign (no tubes), not a collage (no photographs). Film props are not the subject: perforations, frame lines, film strips, projectors and countdown leaders appear only if a story is about film itself, never as decoration.

## 2. Materials & rendering

Reference: how our engine does it (`demo/js/base.js`); another stack is fine if the marks read the same.

- **Layers.** One 2D canvas per frame: a mottled emulsion plate (warm and cool blotches, a rotating set of four), the scene's marks in painter's order, then the light pass: two blurred additive copies for halation (about 9 px and 28 px at 1080p), dust specks and short curls, a corner falloff, a one-drawing flicker, a weave of about 1 px, grain added at mastering. No long vertical hairlines (they read as film damage).
- **The needle line** (`scratch`): a Catmull-Rom path resampled in screen space, 2–3 passes offset by the tremble, width varying along the stroke, about 1 % skips, small triangular chips on heavy lines, a thin overshoot tail. Width follows the picture's scale; the tremble is in screen pixels (about 0.7 × width, capped at 5 px), so a close-up and a wide shot both look hand-cut.
- **Dye** (`dye`): 4–8 thin translucent bristles along a path, tapered at both ends: reflections, rays, wakes.
- **Fills** (`hatch`): back-and-forth zigzag hatching that overshoots the outline, two passes at different angles. Large light (a sky, a glow from above) is several sparse hatch layers stacked into a gradient, or drawn on its own layer and faded with a gradient mask; never stepped bands (they read as film frames).
- **Text as cuts.** Words are rendered once as images with thin skips through them and cut in left to right behind the hot point; they tremble by less than a pixel and are never re-lettered per drawing.
- **Depth.** Depth of field is a blurred copy masked by a disc around the subject; background creatures can be drawn on their own layer and blurred. Keep blur ≤ 5 px on bright hatching or it melts into a flat fill.

## 3. Colour logic

- Ground: warm black `#050403` with brown and blue mottles; never grey.
- Light: one cream `#FFF4DC` for every cut. Strong light (a sun, a glow from above, the hot point) is the same cream, denser.
- Dye: a few transparent colours laid by hand, alpha 0.5–0.9, always with cream lines on top. **One dye, one kind of thing, for the whole film.** Our demo: teal `#1FB39A` the hero, blue `#2F86FF` living light, red `#FF3220` danger, yellow `#FFC81C` sun and moon, green `#46D65A` small food.
- Values: black dominates (≥ 50 % of most frames); the brightest point is a fresh cut or a light source.

## 4. Type & subtitles

- Words belong to the drawing: a depth figure beside a scratched ruler, a title cut into the dark. No boxes, no outlines, no drop shadows.
- Faces (all OFL): a heavy geometric sans filled with diagonal cuts for titles (Jost 800), a sturdy mono for numbers (IBM Plex Mono SemiBold), a marker-like Chinese face (LXGW Marker Gothic). These are references; any face with the same roles works.
- Subtitles sit low left, Chinese above English, cream on the black ground, revealed left to right in about 0.3 s. Cap height ≥ 30 px for anything the viewer must read.

## 5. Motion quality

- Everything steps on twos: 15 drawings a second at 30 fps. Each drawing reseeds the tremble.
- Camera moves and characters move on the same steps; a stepped camera is part of the look, but keep it smooth in time (eased), not jerky in position.
- Cuts appear progressively behind the hot point; dye sweeps in behind a brush edge; lights switch on with a short bloom.
- Characters: anticipation, a flick, follow-through (2–4 drawing anticipation, big poses held 4–6 drawings).
- At a cut between shots, nothing jumps: the same subject keeps its place, size and angle across the cut, new elements come in after it.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| a mark cut live, the camera still | something being made | a first line, a title, a signature, a correction |
| one continuous log-scale pull from one mark to a whole place | scale; "all of this from that" | a reveal, a system, a crowd |
| a descent or climb past a scratched ruler | distance, depth, time | a journey, a countdown, a timeline |
| tracking alongside, specks streaming in parallax | travel, effort | a climb, a chase, a commute |
| from below into hatched light, the subject a black silhouette | exposure, being seen | danger, a reveal, a spotlight |
| split screen, two views on one beat | cause and effect | action and its result, plan and outcome |

- Keep the subject ≥ 1/3 of the frame; never hold a frame that is mostly empty black for more than a second without a mark being made.
- Transitions happen inside the medium: a cut line that becomes a divider, a push into a point of light, a pull to a wide shot. No wipes, no page turns, no white flashes.

## 7. Sound palette

Reference, not rule:
- **Hand-made instruments**: struck and bowed vibraphone, glockenspiel for each new light, pizzicato double bass, log drum for a threat, brushes. Avoid generic piano and strings.
- **The cut is heard**: a gritty high scrape with a thin wandering squeal, a dry tick per small mark.
- **Drawn tones**: a sine read at 24 drawings a second flutters like a hand-drawn sound stripe; good under each light that switches on.
- **Silence**: cutting all music before a key moment is the strongest accent; the first sound after it should be a mark being made.

## 8. Native moves

- **Scratch-in.** A line or a whole character cut live behind the hot point. *Fits content like:* a title; a first diagram line; a character being born; a correction.
- **Hatching is light.** A light source is a field of hatching; an uncut shape inside it is a shadow; hatching that fills the shape makes the shadow vanish. *Fits content like:* a searchlight; being seen; switching something on.
- **One mark to a whole place.** A single drawn subject becomes one of thousands of glowing points in one continuous pull, each level of detail appearing only while it suits the frame. *Fits content like:* a city's population; crowds; networks; "you are not alone".
- **Lights on, one by one.** A row of dots each switching on with a bloom and a note. *Fits content like:* a sequence; a count; a signal; a city at dusk.
- **A cut across the horizon.** The scene's key line (a horizon, a road, a timeline) cut from one edge to the other, opening and closing a film.

Our demo opens on *a cut across the horizon*, uses *hatching is light* and *lights on, one by one* as its turn and *one mark to a whole place* as its climax, and ends on the horizon line again with every light gone dark but one point. A new film opens and ends another way: a title cut letter by letter, a split screen with two views on one beat, a single point of light pushed into, or an ending on the last mark held until the dust settles.

## 9. Pitfalls of the medium

- Flat bright areas look digital: always hatch; stack sparse layers for gradients.
- Large light drawn as segments or bands reads as film frames: fade it with a mask instead.
- Tremble scaled with zoom shakes macros and blurs wide shots: tremble in screen pixels, width from the picture.
- Boiling text becomes unreadable: tremble ≤ 1 px on text, never re-letter a word per drawing.
- Too many full characters overlapping on screen turn into noise: fewer, smaller, placed by hand around the hero.
- Particles positioned by speed × absolute time jump whenever the speed changes: offset them by the camera's displacement instead.
- A crowd of glowing points generated in boxes shows the box edges: use soft (Gaussian) distributions per level of detail.

## 10. Engine

- `demo/js/base.js`: maths, `scratch`, `dye`, `hatch`, `glow`, emulsion / dust / grain plates.
- `demo/js/creatures.js`: characters drawn in their own units and mapped anywhere (`MAPF`); a scratch-in order for the hero; a silhouette that is filled segment by segment.
- `demo/js/main.js`: `render(t)` stepping on twos, depth of field, halation, dust, flicker, weave, subtitles, `TEXTS`, `EV`.
- Minimal example, not in the demo: a horizon cut left to right on black, with a hatched sun.

```js
const hz = 600, p = eo(seg(t, 0, 1));                       // cut the horizon in one second
const P = []; for (let x = -30; x <= -30 + (W + 60) * p; x += 30) P.push([x, hz + 1.5 * Math.sin(x * .02 + dn)]);
scratch(P, { w: 4, tail: false }); if (p < 1) tipSpark(...P[P.length - 1], dn, 46);
hatch(ringPts(1200, hz - 60, 66, 66, 30), YEL, { gap: 6, a: .85, ang: .5, lw: [1.4, 3.4] });
```

## 11. Variation space

Decide per film: what is scratched (a creature, a map, a machine, letters), which dyes mean what, how much of the world is shown, tempo and instruments, whether the camera travels or stays.

- **Structures:** one journey ending in a scale reveal; a countdown of lights; a call and response between two drawn voices; a map growing line by line.
- **Openings:** a horizon cut across the black; a single point of light pushed into; a title cut letter by letter.
- **Endings:** the opening line cut again in another colour; everything that glowed going dark but one point; the last mark held until the dust settles.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
