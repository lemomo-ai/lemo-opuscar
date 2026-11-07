# Woodcut Print — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Bell Founder* (58.5 s) · `woodcut.mp4` · source in [`demo/`](demo/)


A 40–60 second film in the Woodcut Print style.

## Story & structure

A village with an empty belfry; a founder casts its first bell, fails, sacrifices something of his own, and succeeds. How the native powers serve this story:

| Native power | Story use |
|---|---|
| **Light is carved** | Stories about fire, dawn, discovery, a lamp being lit: the moment of light can literally *be* a burst of radial cuts. |
| **Carving = time** | The picture growing cut by cut is patient work on screen. It suits craft, labour, perseverance, and first times. |
| **The mirrored block → the true print** | A reveal or a change of heart: the audience reads a backwards word, the sheet is pulled, and it reads true. |
| **Snow = stab cuts** | White dots are wounds in the wood. They can freeze mid-air, or be "inked back in" until the sky is clean. That makes an ending no other medium has. |
| **One colour plate** | Save it for the one thing that matters (molten metal, a heart, a flame). Let it spread at the climax and shrink to a single highlight afterwards. |
| **Wordless-novel sequencing** | Four or five spoken lines at most. Plates carry the story; the gap after a failure can be completely silent. |

**Story shape of this film:** first knife stroke in the dark (the horizon) → the world carved → the first print pulled (mirror → true) → a long close-up of hands → a quick montage of small offerings → a first attempt that **fails in close-up** → a silent plate → a personal sacrifice → a second attempt where the colour plate floods the frame → the longest silence → the payoff sound → the colour withdraws to one highlight → the white marks are inked back in → the last cut is the horizon again.

Adapting the topic: find the one thing that should *glow* (the colour plate: molten copper), the one thing that is *made by hand* (the long close-up: the founder's hands), and the one thing that should *disappear* at the end (the stab-cut texture: snow). That is one reading of this story; other topics find other answers or none.

## Shots

"The knife is the camera": the knife tip, or later the brightest cut, is always the focus.

| Beat | Camera |
|---|---|
| Hook (0–3 s) | Extreme close-up on a black block; tracking with the knife as it cuts one white line (the horizon). |
| World | Pull back 3.5× → 1× as mountains, roofs and the empty tower are carved: a line becomes a world. |
| First print | Locked off for the ink / paper / baren / peel; then tilt down and push in to the empty belfry. |
| Breath | 4 s near-static macro on the founder's hands (slow push 1.0 → 1.13). |
| Montage | Hard cuts on every beat, speeding up (1 / 1 / 1 / .5 / .5 / .25 / .25 s), each landing with a jolt. |
| First colour | Push in on the crucible as the copper turns orange, so the first colour lands in close-up. |
| Failure | Snap zoom (0.2 s) to the bell wall and hold 1.3 s while the crack climbs. |
| Silence | Frame in a frame: the workshop door, villagers outside, the founder's back, the hammer slowly lowering. Nothing moves but snow. |
| Climax | Start on the stream only (z 2.4), radial cuts burst from the mould, then crane up and out to show both faces lit. |
| Signature | 8× → 1× continuous pull-back from the bell wall to the whole valley as the bell rings: the sound travels as far as the camera does. |

Why this route, for this story: the knife-drawn horizon was both the first and the last cut, so the film closed a circle; the ringing bell and the pull-back had to travel the same distance. Each of these is one choice from STYLE.md §6, not the style's default opening or ending.

Demo action timings: hammer lean-back 4 frames → strike 2 frames → settle + 3-frame camera shake; bellows push with the whole body; the throw is clutch → release → hand holding in the air. Impression jolt: [5,−3] then [−2,1] px.

## Score structure

- **Grid first**: 60 BPM, switching to 90 BPM through a 3:2 metric modulation (60's triplet eighth = 90's eighth) for the forge. `timeline.json` is the single source of truth. `tools/cuecheck.py` checks score cues against picture events and both silences (demo: 25 cues, max offset 0 ms).
- **Score**: low strings only (contrabass, cellos, spiccato, pizz; violas only after the bell) + wood and skin (log drum, woodblock, frame drum) + gran cassa / timpani + one tam-tam + a **synthesised anvil** (modal numpy: 3–5 inharmonic partials + hammer transient). **No bell timbre anywhere before the bell rings**: the village "has no voice", so the first bell is the climax. D minor, turning to D major in the bell's decay.
- **Foley of this film**, all synthesised: knife into wood, chips, brayer tack, paper air, baren rasp, the wet peel; brass by size (pot = low, wide; keys and ring = high, pure); clay scrape and smash; bellows leather + air; molten bubbles, pour roar, hiss into the mould; the bell as a modal model (hum 0.5, prime 1, tierce 1.2, quint 1.5, nominal 2, 2.5, 3, 4 with their own decays and beating) + two valley echoes.
- **Two real silences**: 29.7–32.3 s (−40 dB distant wind only; the first sound after it is the compass lid's *click*) and 44.3–47.3 s (**digital silence**, measured −91 dB; the first sound after it is the bell, the loudest moment of the film).
- **J/L cuts**: fire crackle enters before the hands shot; outdoor wind carries into the workshop muffled; wind leads the peel into the belfry; the bell's tail runs under the end card.
- **Mix**: music ducks ~8 dB under voice (6 dB after the bell) and 4 dB under key foley. **Foley ducks too** (−5 dB, −9 dB under a line that shares its beats with metal hits). Narrator: Kokoro `am_onyx` at 0.88, 4 lines.

## Palette & props

- **Palette**: ink `#111111` · paper `#EFE8D8` · the wood block itself `#D8C29C` (only in shots that show the block) · one colour plate "copper" `#C8502A`.
- **Print frame**: 1920×1080, printed image area `36, 36, 1848×912`. The bottom paper margin (132 px) holds captions. Fixed 3 px colour-plate misregistration.
- **Props and cast**: the founder and his apprentice (parts rig, poses, expressions), the valley (mountains, village, empty tower, snow), the workshop, crucible, pour, sparks and mould, the bell, bellows, the villagers' brass gifts, the compass, sound rings. The demo's hands, the compass and the filter still were made with height-field sculpts + `woodcutFilter`.
- Captions: IM Fell English 42 px, ink `#111`.

## End card

Title carved *mirrored* into the block (IM Fell English SC), readable only once the first print is pulled. End card: a fresh print: title carved out of a black panel, a small bell keeping the film's last copper highlight, then *A Woodcut Print*, Lemo-Opuscar, LemoLab × Claude Opus 5.5 and credits in letterpress. The final knife cut under the title echoes the first sound of the film. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/woodcut/demo/
  engine/        index.js (shape, cutAlong, flecks, rays, plate…), knife.js (strokes), hatch.js (regions, streamline hatching),
                 print.js (WebGL2 print/block compositor), filter.js (image → woodcut)
  stage.js       print frame, camera, caption          world.js   the valley (mountains, village, tower, snow)
  chars.js rig.js views.js   founder & apprentice (parts rig, poses, expressions)   hands.js   height-field sculpts → filter
  interior.js fx.js          workshop, crucible, pour, sparks, mould; bell, bellows, gifts, villagers, sound rings
  trans.js       paper curl / peel        shots.js shots2.js   the 17 shots        film.js main.js   assembly, captions, events
  timeline.json  tempo grid + every cue   music/score.py   original score   mix.py   foley + ambience + voice + ducking + bell
  tools/         cuecheck.py subs.py final_asr.py mux.sh      test.js   ?test=char|hands|pour|village|sheetA|sheetB|filter|spark
```
1. Write `timeline.json` (grid + cue keys) and the cue table first; hand them to a music sub-agent; draw in parallel.
2. Build the engine and one style frame before any story. Get the carve + print look right on a still.
3. `sh demo/build.sh` rebuilds everything: TTS → whisper → score → events → cue check → mix → srt → render (4 workers ≈ 45 s for 1404 frames) → mux (−14 LUFS, grain 6, CRF 28) → whisper on the film → styleframe / poster / engine example.
4. Review twice with 1–2 fps contact sheets from the film itself, plus full-size frames of every key action (peel, smash, crack, rays, bell pull-back, end card).

Pitfalls tied to this demo's props:

- **Snow on white snow is invisible.** Add black snowbanks and wind-carved ground; flakes read on the sky and on dark masses.
- **The bell** turns into zig-zag chevrons with short hatch segments and a tonal sine wobble: carve it with long cuts and one broad highlight band.
- **Steam from the mould** drawn on top reads as flames: draw it behind the subject.
- **Lazily cached strokes** (`X.coatFolds || []`) break determinism across render workers.
- **Metal gift hits masked the narrator** (whisper hears "is had" for "it had"). Foley has to duck under voice too. Pan the offending hit away from centre.
- **File size**: fine hatching + per-impression ink noise + grain 6 make a 58 s film 326 MB at CRF 19. Re-encode at CRF 28 with `-tune grain`: 93 MB, and no visible difference at a 1:1 crop.
- A NaN in the structure tensor comes from the box blur leaving tiny negative sums in flat areas.
- `still.mjs` can fail when many renders run at once. Retry up to 3 times.

## Engine reference


`demo/engine/index.js` is self-contained (it only imports `/core/lib.js`). It draws **any path or shape** as a carved relief and prints it. You always work on two canvases: a **mask** (fill black = uncut block; draw white = cut away) and an optional **colour plate** (alpha = plate density), then call the printer.

| Function | What it does | Key options |
|---|---|---|
| `canvas(w=1920, h=1080)` | → `[canvas, ctx]` | |
| `shape(polys, o)` | A carved solid: black silhouette + white halo + form-following hatching lit by `light`. Returns `{ draw(g, t), strokes, halo, reg, tone }`. | `light` (`light(x,y,z)`), `sp` spacing, `wmax`, `lo/hi` tone range, `dir` (`'contour'` / angle / `dirRing(cx,cy,sy)` / `dirRadial(cx,cy)` / fn), `halo` px, `white` (white part with black cuts), `tone(reg)→(x,y)=>0..1` override, `seg`, `gap`, `reveal:{t0,t1,key,speed}` |
| `cutAlong(path, o)` | Breaks a path into hand-cut knife strokes (outlines, rules, rope, cracks). | `w` (number or `(u,pt)=>w`), `kind` `'k'|'v'|'u'`, `closed`, `seg:[a,b]`, `gap:[a,b]`, `reveal:{t0,t1,speed}` |
| `hatch(region, o)` | Streamline hatching of any `Region` (evenly spaced, direction and width fields). | `dir(x,y)`, `tone(x,y)`, `sp`, `wmax`, `seg`, `gap`, `kind`, `reveal` |
| `flecks(pts, o)` | Stab cuts (snow, sparks, chips). `pts = [[x,y,r],…]` | `angle`, `seed` |
| `rays(cx, cy, o)` | A burst of carved light. | `n`, `r0`, `r1:[a,b]`, `w`, `jit`, `bend`, `a0/a1`, `reveal:{t0,t1,jit}` |
| `drawStrokes(g, strokes, {t, color})` | Draws strokes onto the mask at time `t` (a reveal-timed stroke is carved progressively, knife tip and all). `color:'#000'` re-inks. | |
| `plate(c, polys, a)` | Paints the **one colour** plate. It shows only where the mask is cut white. | |
| `woodcutFilter(img, o)` | **Image / video frame → woodcut.** Luminance sets cut width, the structure tensor sets cut direction; returns strokes with reveal times. | `rect:[x,y,w,h]`, `sp`, `black/white/gamma` levels, `res`, `region`, `reveal:{t0,t1,mode:'light'|'radial'|'down'|fn,speed}` |
| `makePrinter(W,H).render(mask, plate, o)` | WebGL2 compositor → canvas. | `mode:'print'|'block'`, `seed` (paper), `inkSeed` (per impression), `plate:'#hex'` (the one colour), `ink`, `paper`, `reg:[dx,dy]` misregistration, `edge` burr, `sheen`, `wetX` |
| `light(x,y,z)`, `Region(polys | drawFn, {res,bbox})`, `mkStroke`, `spline`, `offsetPoly`, `ellipse`, `rect` | helpers | |

Demo-level, reusable: `demo/trans.js` `curl(g, front, back, xf, r)` + `peelState(u)` (the paper peel); `demo/hands.js` `Sculpt` (capsule / blob / plank / creases → `shade(light)`) for close-ups.

**Minimal example**: a warm orange `#D97757` four-point spark with a cursor tail, carved in and kept in its own colour. It is exactly `?test=spark` in `demo/test.js`; the result is `demo/stills/engine_example.jpg`.

```js
import * as WC from './engine/index.js';
const [mask, m] = WC.canvas(), [plate, c] = WC.canvas(), P = WC.makePrinter();
const star = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 70 : 260; star.push([960 + Math.cos(a) * r, 500 + Math.sin(a) * r]); }
const spark = WC.shape([star], { light: WC.light(.5, -.6, .6), sp: 9, halo: 8,
  reveal: { t0: 0, t1: .8, key: (x, y) => Math.hypot(x - 960, y - 500) / 300 } });        // carved from the centre out
const tail = WC.cutAlong([[1030, 590], [1090, 680], [1110, 770]], { w: 24, kind: 'u', seg: [300, 400], reveal: { t0: .8, t1: 1.1, speed: 900 } });

function frame(g, t) {
  m.fillStyle = '#000'; m.fillRect(0, 0, 1920, 1080);                                       // the uncut block
  c.clearRect(0, 0, 1920, 1080);
  WC.drawStrokes(m, WC.rays(960, 500, { n: 36, r0: 300, r1: [420, 640], w: 10, seed: 2, reveal: { t0: .5, t1: 1.0 } }), { t });
  spark.draw(m, t);
  WC.drawStrokes(m, tail, { t });
  WC.plate(c, [star], t > .8 ? 1 : 0);                                                      // the one colour
  g.drawImage(P.render(mask, plate, { seed: 4, plate: '#D97757' }), 0, 0);
}
```

**Filter on a photo or film frame** (for re-drawing footage): `const F = WC.woodcutFilter(video, { rect: [36, 36, 1848, 912], sp: 5, reveal: { t0, t1, mode: 'light' } }); m.fillStyle = '#000'; m.fillRect(…); WC.drawStrokes(m, F.strokes, { t });` then print. About 1,900 cuts and 140 ms for a 1080p frame. See `demo/stills/frame_filter.jpg` and `?test=filter&img=…`. For a moving shot, re-run it on twos (12 fps) with the same `seed` so the cuts stay stable where the image does.
