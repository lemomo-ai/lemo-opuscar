# Impasto · Palette Knife — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Colour of Rain* (39.7 s) · `impasto.mp4` · source in [`demo/`](demo/)


## Story & structure

A grey square in the rain. A street cellist plays and nobody stops; halfway through he gives up. A little girl opens a red umbrella in front of him: the film's first colour. The cello starts again as a waltz, and umbrella after umbrella turns to colour on the beat. From overhead, the crowd's waltz paints a coloured mandala on the cobbles. The last chord lands, the rain stops, colour fills the whole square.

Arc: loneliness (grey) → giving up (silence) → one touch of colour (the red umbrella) → being heard (the waltz) → the crowd (overhead choreography) → echo (same camera, grey turned to colour; the phrase that broke off on E resolves to D).

Why it fits the medium: colour is the story, and the knife can re-lay any stroke in a new colour. It is a music film with no narration: the title is laid in with the knife over the grey sky and washed off by the rain (it drifts down and fades).

Native moves spent: colour re-laid by the knife (the umbrella opening, the cellist's recovery, the final chord filling the square); the one coloured thing (the red umbrella is the only colour in the first half); motion paints the picture (overhead, each umbrella drips its colour along its path, and the pull-back reveals a mandala); raking light (the sun grazes the ground at the final chord, then settles); paint-over transitions with a knife scrape.

## Shots

| # | Time | Shot / camera | Why |
|---|---|---|---|
| 1 | 0–2.65 | CU cello body + bow, slight push | 3 s hook: the only colour in the grey world is the note (an amber ribbon), soon washed out by the rain |
| 2 | 2.65–7.15 | Extreme wide, slow truck + push, paint-over in | The world: grey square, people hurrying. Title knifed in, then carried away by the rain |
| 3 | 7.15–12.4 | Medium, one continuous push through the silence | Nobody stops: passers-by cross close to camera and block him; push to his face as he gives up |
| 4 | 12.18–16.66 | Low CU on a puddle → tilt-up, hard cut | A boot lands on the splash; up to her, him, the umbrella; anticipation, POP, impact zoom |
| 5 | 16.66–19.39 | Face CU → pull-back, hard cut on the downbeat | He looks up, lifts the bow; at 18.03 the bow lands and colour pours out of the cello |
| 6 | 19.39–23.48 | Closer framing of the same wide, paint-over | The ribbon carries colour to each umbrella, one per beat |
| 7 | 23.48–31.66 | Overhead, rotating + crane-out | Signature shot: choreography and the coloured trails on the ground |
| 8 | 31.66–35.75 | Extreme wide (same set-up as 2), push toward the arch | Rhyme with the opening: grey to colour, raking light, umbrellas closing, birdsong |
| 9 | 35.75–39.66 | End card, paint-over | Title, a red dot (an umbrella seen from above), credits |

Six moves (push, truck, tilt-up, pull, rotate, crane-out overhead); sizes from CU to extreme wide and overhead. The same wide camera serves the opening (grey), the middle (umbrellas in colour) and the finale (all colour): for this story, the change was the story. Keep the camera inside the painted plate.

## Score structure

`demo/timeline.js` holds the grids; picture and score both read it.

- **Part A**: solo cello, D minor, 3/4 at 80 BPM from 0.4 s. The phrase stops on an unresolved E3 at 10.15 s; the bow leaves the string 0.3 s later.
- **Silence** 10.45–12.4: rain nearly gone, one drip at 11.15, two small steps at 11.5 / 11.95 enter before the picture (J-cut), a big splash at 12.4 is the first sound after it.
- **Part B**: street-musette waltz, D major, 3/4 at 132 BPM.
  - 15.3 POP (pickup bar): glockenspiel + rising harp glissando.
  - 16.66 accompaniment enters: pizzicato bass + accordion "oom-pah-pah".
  - 18.03 the cello melody enters.
  - 19.39–23.03 nine umbrellas, one per beat; glockenspiel pitches climb G→B→D / A→C#→E / D→F#→A.
  - 23.48–31.21 overhead, six bars of choreography; accordion repeats the melody an octave up, one harp arpeggio per bar.
  - 31.21 grand pause, digital zero; the rain freezes in the air.
  - 31.66 final chord (tutti + timpani + suspended cymbal).
  - Coda F#→E→D resolves the phrase that broke off at the start.
  - 35.75 last pizzicato, end card.
- Other voices: violin pizz, shaker.

Sound design, section by section:

| Section | Bed | Foley | Music |
|---|---|---|---|
| CU | rain (slightly distant) | bow rosin, raindrops on varnished wood | the solo's first note |
| Grey square | full rain + gutter trickle | wet cobble footsteps (placed by the walk algorithm, panned), knife scrape on the title | solo |
| Medium | rain under the arcade (low-passed) | passers-by footsteps close + umbrella fabric brushing | solo, breaks off |
| Silence | almost nothing | one drip, small steps (J-cut), big splash | none |
| Girl | rain | nylon rustle, rib click, umbrella "fwump", paint dabs landing | POP |
| Reaction | muffled rain | bow-lift air | accompaniment, then cello |
| Street | rain (lowered) | each umbrella's "fwump" + a soft hiss as the ribbon arrives | waltz + glockenspiel arpeggios |
| Overhead | rain | the crowd's water steps on the waltz (beat 1 heavy) | tutti |
| Grand pause | digital zero | — | — |
| Ending | rain stopped | drips, umbrellas closing, birdsong | chord → coda |

Palette-knife scrapes sit on every repaint.

## Palette & props

- After-rain sunset sky: cobalt `#34507e` → peach `#d99a78` → gold `#f7dca0`. Facades ochre `#dca064` and rose `#c98d7e`, shutter green `#3f7a6c`, awning red `#b8342a`.
- Umbrellas at full chroma: cadmium red `#dc2f28`, yellow `#f4bc2a`, cobalt `#2f62c0`, viridian `#23906c`, magenta `#cc3a82`, orange `#ee7a2a`, turquoise `#26aab4`, violet `#6e4cc0`.
- Grey world = luminance of the same strokes, slightly cool, 5 % colour residue; its specular is slightly higher (wet).
- Light: `light [-.55,-.6,.7]`, `norm 3.2`, `amb .8`, `dif .28`, `spec .16–.3`, `ao 1.2`.
- Stroke sizes: 40–60 px planes in sky and walls, 3–6 px only at edges and faces. Knife stroke: skew ±0.55, angle jitter ±13°, value jitter ±6 %. Figures and umbrellas use `run: 0–0.25` so they stay solid.
- Figures: the cellist (IK bow arm, bow direction changes on each note), the girl (dips the umbrella before it snaps open), the crowd (rings swell on every downbeat; umbrellas pop on beats with a scale bounce and a burst of paint dabs, swing down to hang after closing). Faces: eyes, brows and mouth are separate procedural strokes so they can act.
- Wet reflections: stacks of short horizontal dabs under each lamp and window.

## End card

Knife-painted title on deep ultramarine, a red dot (an umbrella from above), and crisp DOM text for the credits (small text must stay legible): "an impasto palette-knife study", then "Lemo-Opuscar · LemoLab × Claude Opus 5.5", then the sample and font credits. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card (the line lives in `demo/film.js`: remove it if you adapt that file).

## Build notes

```
styles/impasto/demo/
  engine/impasto.js  WebGL2 knife-stroke renderer     engine/plate.js  reference illustration → strokes
  timeline.js        BPM grids, cut times, melodies (MEL_A, MEL_B), pops
  scenes/*.js        sets as reference illustrations (Ref.fill/line/text/tint) → paintRef()
  film.js            shots, cameras, transitions (EDIT table), post looks, end card
  music/score.py     sampler score (CC0 instruments)   mix.py  foley + ambience + ducking + true silence
  tools/dump_timeline.mjs  timeline → out/timeline.json    build.sh
```

1. `timeline.js` first: BPM grids, cut times, melodies, pops. `tools/dump_timeline.mjs` writes `out/timeline.json` for the score.
2. Sets in `scenes/*.js` → `paintRef()`.
3. `film.js`: shots, cameras, transitions, post.
4. `music/score.py`, then `mix.py`.
5. `sh styles/impasto/demo/build.sh` renders everything (≈ 30 s of GPU render for 952 frames), muxed with grain 0.

Engine-level traps: `half` is a reserved word in GLSL ES 3.00; binding the composite quad while a stroke VAO is still bound silently rewires attribute 0 ("vertex buffer not big enough" on the next frame): unbind the VAO first.

Pitfalls tied to this demo's props:
- Keep the umbrella radius at 0.34 × body height: 0.46 looks like a parasol table.
- Coats as plain rectangles read as bollards: A-line taper + lit edge + shoulder dab + hair dab.
- Use a per-shot index in the per-shot ribbon loop: a global index flings control points off-screen (a streak from the sky).
- Paint the ground before the buildings: painted after, it covers their feet.

## Engine reference

`demo/engine/impasto.js` (renderer) and `demo/engine/plate.js` (reference → strokes).

| API | What it does |
|---|---|
| `new Impasto(canvas, {W, H, ss})` | WebGL2 renderer, supersampled colour + height buffers |
| `E.begin()` / `E.finish(post)` | start a frame / light + grade (`light, norm, amb, dif, spec, ao, expo, sat, vig…`) |
| `E.batch(Float32Array)` → `E.draw(batch, o)` | static stroke set. `o = {M, cam:{x,y,zoom,rot}, t, grey, reveal, revDur, appear, appDur, alpha, run, hgt}` |
| `E.drawNow(Float32Array, o)` | transient strokes (figures, weather, ribbons) |
| `E.texture(canvas)` + `E.under(tex, w, h, o)` | thin underpainting (supports `revC:[x,y,speed]` reveal wave) |
| `new Strokes().push({x,y,ang,len,wid,c,c2,type,taper,bend,skew,alpha,hgt,rev,app,seed})` | build strokes; `type`: `KNIFE`, `BRUSH`, `DAB`, `LINE` |
| `new Ref(w, h, scale)` + `.fill(path, fill, props)` / `.line` / `.text` / `.tint` | reference illustration; props `{dir, maxR, detail, group, type, hgt, jit, len, wid, aj, fallback}` |
| `paintRef(ref, {R:[radii], T, rev(x,y), app(x,y,level)})` | coarse→fine knife strokes confined to shape groups |
| `strokePath(out, pts, {wid, c, type, step})` | strokes along a polyline |
