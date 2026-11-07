# Paper Pop-up Book — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Little Sprite's Adventure* (*Pip's Paper Adventure*, 小精灵冒险记) (133.0 s, 1920×1080, 60 fps) · `paper-popup.mp4` · source in [`demo/`](demo/) · engine: three.js r170 (WebGL2) rendered frame by frame in headless Chrome, Canvas2D for all paper art, Python for score editing and mixing


## Story & structure

A storybook opens on a real wooden desk and becomes a stage; at the end the hero jumps off the page into the real room.

How the demo used the native moves:

| Native power | Story use in the demo |
|---|---|
| **The book opens** | The opening is a physical ritual: a closed book, a creak, the cover swings up and the world pops up piece by piece with a sparkle. It is the "once upon a time". |
| **Page turn = scene change** | Each chapter is one spread. Transitions are real page turns: a curved sheet whose front is the old ground and whose back is the new sky, while the old pop-ups fold down and the new ones spring up. No cuts inside the book. |
| **Paper mechanisms** | Pull-tab tricks are story beats: a sun on a stick that rises from behind the hills and sinks at dusk, a door on a hinge, a river of three wave strips that slide, a sky of **four slats that flip from day to night** like a three-sided billboard, a moon and stars that drop in on strings. |
| **Paper as character** | A crumpled-up grump (Crumple) is **smoothed out** and poofs into a folded paper plane (Fold), who becomes a friend and later a vehicle. |
| **The edge of the page** | The last page is unfinished (pencil sketches, "The End" printed on the ground); the hero looks out past the edge, jumps, and lands on the real desk under the real lamp. |
| **The real light was always there** | At dusk "another light came on" is the actual desk lamp brightening over the page. The payoff: "a reading lamp… and someone, reading along." |

Story shape: real desk establishing (10 s) → book opens → Chapter 1 home world and the hero's wish (the light beyond the page) → Chapter 2 an obstacle character, beaten by stomping and then *helped* (smoothed out), who turns into a companion → Chapter 3 a journey with a gag (a whale spouts confetti) and a day → night flip → Final Chapter: the blank last page, fear, "Here goes!" → the companion catches the hero and they fly out over the desk → landing, reveal, "Hello, big world!" → end title on the desk with "The End?".

One way to adapt it (STYLE.md §11 gives the range): make the topic's world the book's spreads (3–4 chapters, each with one paper mechanism), give the hero one wish that points *outside* the book, and end by crossing into the real room.

## Shots

A single virtual macro camera, fov 30 (56 for the reverse shot), keyed as `[t, pos xyz, target xyz, fov, aperture, focus]` in `main.js SH` and interpolated with a monotone cubic (`track`). Each inner list is one continuous shot; a new list = a hard cut.

| Beat | Camera |
|---|---|
| Establishing | High over the desk (1.1 m away), slow descending dolly towards the closed book; lamp dust motes in the light beam. |
| Book opens | Settles low and frontal on the page while the cover stands up; the sparkle rises. |
| In the book | Eye level with the paper actors: camera 5–10 cm above the page, 30–45 cm back, focus on the actor (aperture 2.2–2.5, shallow). Slow lateral moves that follow walks. |
| Page turn | Pull up and back to a 3/4 view of the whole spread (aperture 1.8–2, deeper) so the turning page reads, then drop into the new world. |
| Emotional close | Push in to 28 cm on the face (aperture 2.5). |
| Edge of the page | **Reverse shot**: camera behind Pip (fov 56, focus 11 cm) looking out past the page edge at the real, blurred room and the huge lamp. The only time we see "outside". |
| Flight out | Cut to a wide front view of the desk (1 m, fov 32); the plane is followed across the desk, then the camera settles low at Pip's height on the wood (aperture 4, focus ~0.52 m). |
| End | Slow pull back and up to reveal the whole desk, the open book behind, for the end title. |

Depth of field (`post.js`): CoC in pixels, max 14, 64-tap golden-angle spiral gather.

## Motion numbers

- Pop-ups: `back(seg(t, t0, t0+.55), 1.7)`; each piece's delay is `(.3 − z) × 1.2` s after its spread's `RISE` time; pieces near the back lie back (`dir −1`), others fall forward face-down (`dir +1`).
- Sway: `sin(1.6t + phase) × sway` around the base (0.01–0.08 rad).
- Characters: pose quantized to 1/40; eyes `open/happy/wide/closed/dizzy`, mouth `smile/open/o/grin/worried/determined`, blink every 3.7 s. Walk = legs swing by `sin(phase)`, bounce `|sin(phase)| × 1.2 mm`, arms counter-swing; phase advances 1.8 cm per half step. Turning: `S.face = cos(...)` animates the `scale.x` flip (FrontSide front drawing, BackSide back-of-head drawing).
- Jumps: `arc(t, t0, t1, a, b, h)` + squash on take-off and landing (`land`, `crouch` in `pipState`) + paper-puff cloud.
- Page turn (`book.setLeaf(u)`): 40-segment strip, `φ = θ·(1 − L·(s − ½))`, bend `L = .55·sin(πu)`, eased with `eio` over 2.3 s.
- Mechanisms: four sky slats flip 0.28 s apart; the door swings with `back()`; river strips slide ±12 mm on each "swish" of the narration.

## Score structure

- **Narration**: one warm storyteller, Kokoro `af_bella`, speed 0.9, en-us; 15 short lines (2–9 s), written like a picture book ("The cardboard hills. The paper sun on its wooden stick."). Lines pronounced differently from how they are displayed live in `tts/lines.json` (e.g. "Swish Swash Sea" without the hyphen; "..." instead of "…"); displayed text lives in `story.js VO`. Trim silence at 1 % of peak (+10 ms head, +100 ms tail). Every line checked with whisper (`asr.py`, `words.py` for word times to sync gags).
- **Character blips**: bubbles type at 30 chars/s, a blip every second letter; Pip = square wave, bright pitches (C6-ish), Crumple = low 180–240 Hz, Fold = triangle wave.
- **Music**: three Kevin MacLeod tracks (CC BY 4.0), edited in `music/edit.py`: *Dreamy Flashback* (0–16.2 s, fade out 1.6 s) for the real desk; *Jaunty Gumption* from 15.4 s for the whole paper world, with **one bar-aligned internal jump cut** (73.21 s → 102.79 s of the track, 0.42 s crossfade) chosen by `music/jump.py`/`jump2.py` (beat-synced chroma + MFCC self-similarity, cut length a multiple of 4 beats) so that the song's real ending lands at 104.22 s — the instant Pip jumps off the page; *Heartwarming* from its 39.38 s mark at 104.8 s (×1.15) for the real world and the end card.
- **Sound effects**, all synthesized in `mix.py` from `events.json` (250 events exported by `render.mjs events`): book creak + thump, pop-up pops (sine sweep + paper crinkle), page swish, door squeak, boing, hops, footsteps (tiny taps + crinkle on each walk half-cycle), paper roll, "!" bang, stomps, NICE/GREAT arpeggios, sparkles (bells), poof, paper folding, whoosh, splash, whale spout, slat clacks, star tinks, lamp switch + warm chord, landing skid. Per-type gains in the `G` table.
- **Ambience beds** per spread: room tone + clock ticks on the desk, birds + river in the valley, crickets at dusk, birds + leaf rustle in the forest, waves at sea, room tone on the last page and in the real world.
- **Mix**: voice high-passed 90 Hz, compressed (−24 dB, 3:1), limited, set 8.5 dB above the music in speech regions; music ducked by 40 % under speech (300 ms smoothing); 7 % reverb on voice; SFX limited per channel to 0.5; ambience ×2. Normalise to 0.89 peak, then `mux.sh` applies `loudnorm I=−14 TP=−1.2 LRA=11`.

## Palette & props

**Scale (metres):** book page 0.44 × 0.30 (`BW`, `BD`), page block height `PG` = 0.0175. Pip is `H = 0.036` tall, Crumple 0.042, the paper plane 0.052 long, the whale 0.10 wide, the boat 0.062. Hills 0.2–0.26 wide, trees 0.05–0.16 tall. Camera near plane 0.004 m.

**The desk:** walnut table, desk lamp, teacup, alarm clock, pencil, potted plant (Poly Haven CC0); `lythwood_lounge_2k.hdr` as environment and background (blurriness .22, yaw 2.3), walnut veneer (`#c9a88a` tint, env .8), a procedural pencil. The book: hardcover 44 × 30 cm, spine on the far side, the cover swings to 90° and stands behind the page as a painted sky.

**Cut-paper finish** (`paper.js finishCut(art, border, o)`), 16+ angles on three rings (r, .66r, .33r): grey cardboard edge `#b9ad9c`, border + 2.5 px, offset 1.5 px down; off-white border `#fffdf7`, 12–16 px (static props 14 px at 5200 px/m, characters 16 px); 512 px grain texture at alpha .5–.85.

**Drawing** (`art.js`): ink `#3a2a24`, outline 9 px (`LW`), detail 5 px (`LW2`); `crescent(x, path, shade, dx, dy, base)`; `blob`, `smoothClosed` with 3-harmonic noise. Faces: big black oval eyes with two white highlights, curved mouth, pink cheeks.

| Use | Colours |
|---|---|
| Home valley | grass `#86c763`→`#9fd57a`, hills `#b5e39a` `#a9dd8c` `#8fd06e` (shade `#6fb553`), path `#ecd49a`, sky `#7cc6ef`→`#c9ecf7` |
| Forest | ground `#4f8f46`→`#62a653`, back pines `#8cc9a0`, front pines `#3f9a5c`, sky `#a8e0cf` with light shafts |
| Sea | waves light→dark `#9ad8f5` `#79c3ee` `#58ade3` `#3f95d6` `#2f7fc4`, sky day `#4fb3ea`, night `#131d44`→`#4a5a94` |
| Last page | cream paper `#f5eedc`, graphite pencil lines `rgba(70,72,82,.45)`, IM Fell English "The End" |
| Hero Pip | skin `#ffe2bd` (shade `#f3c393`), leaf cap `#62c24c`/`#3e9a34`, tunic `#3fa1de`/`#2a78b3`, boots `#8a5530`, wings `#d4f3ff` |
| Accents | mushroom-house red `#e8413a`, sun `#ffd766`, sign/banner gold `#ffcf3f`, ribbon red `#d8423a` |
| Book | cloth `#1f5566`, gold foil `#e0b456` (metalness map), page edges `#efe6d2` with fine lines |

**Pop-up pieces** (`cutmesh.js cutMesh`): back colour `#efe8da` (or `#8a5a34` for the door) via `onBeforeCompile`; `alphaTest .5` + `alphaToCoverage`; `customDepthMaterial`. The boat = sail card behind + hull card in front; Fold = four triangles hinged on a keel.

**Fonts:** Fredoka 500/600/700 (subtitles, bubbles, signs), Lilita One (cover, chapter banners, action words, end title), IM Fell English (cover tagline, "The End", "The End?"), ZCOOL KuaiLe (Chinese). All OFL, downloaded to `demo/fonts/` by `fetch_fonts.mjs` (Chinese subset = only the characters in the source files).

**Titles and subtitles as built:**
- Narration subtitles (`hud.js drawSubs`): English Fredoka 500 40 px, cream `#fffaf0`, 8 px dark-brown outline, soft shadow, wrap at 1720 px; Chinese in ZCOOL KuaiLe 32 px below. Fade in 0.3 s before the line, hold until 0.25 s after the audio, fade 0.3 s.
- Speech bubbles (`drawBubbles`): radius 44, 6 px ink outline, soft drop shadow, tail projected from 3D every frame, pops in with `back()`, English at 30 chars/s (Fredoka 600 46 px), then the Chinese (ZCOOL KuaiLe 32 px, `#7a5e4c`) and a bobbing red "next" triangle.
- Chapter banners (`drawChapter`): a hanging cardboard sign on two strings, red ribbon "Chapter N", title in Lilita One 84 px gold `#ffcf3f` with a 12 px ink stroke, Chinese under it.
- Action words (`drawAction`, `drawBang`): "NICE!" / "GREAT!" in italic Lilita One 120 px, gradient fill, white + ink double stroke, rays; a red "!" over the startled hero.
- Title: the book cover (cloth texture + gold-foil "The Little Sprite's Adventure ~ a paper tale ~" with a roughness/metalness map, and a round Pip illustration).
- A bilingual `.srt` is generated from `story.js` (`make_srt.mjs`): narration + bubbles, English line then Chinese line.

## End card

`drawEnd`, from 123.4 s, over the live desk shot: title in Lilita One 96 px gold (y 170), Chinese title (y 262), italic "The End?" popping in (y 350), then from 127.6 s the sign-off and the asset credits (22 px, y 960/998/1036; the Chinese row uses `'"ZCOOL KuaiLe", Fredoka'`) fade in together; fade to black over the last 1.5 s.

The sign-off **"LemoLab × Claude Opus 5.5"** (× = U+00D7) belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card. In the demo it sits centred under "The End?" at y 430: Fredoka 600 36 px, cream `#fffaf0` fill with a 7 px `rgba(30,20,14,.75)` outline (it lies over the cream backdrop page, so the outline is what makes it read), fading in with the asset credits at 127.6 s, never covering the characters.

## Pitfalls tied to this demo

- **A single-plane boat hides the character sitting in it**: split it into sail (behind, z −3 mm) and hull (in front, z +2 mm) with Pip between them.
- **Foreground blur**: keep ferns and bushes away from the lens: near it they fill the frame with blur (the forest at 20.9 s).
- **Mixer bug**: passing a stereo (N×2) array to a 1-D limiter silently crushes all SFX to −96 dB. Limit each channel separately.
- **Shadow settings**: spot shadow map 4096², bias −6e-5, normalBias 4e-4. Leaf materials: emissive map = colour map, emissive .42.
- **Headless WebGL speed**: default Chrome uses SwiftShader (~620 ms/frame); `--use-angle=gl --enable-gpu --ignore-gpu-blocklist` gives tens of ms per frame on Apple Silicon. Serve over HTTP (`serve.mjs`, started inside `render.mjs`).
- **Poly Haven API**: Python `urllib` gets 403; download with `curl`.
- **Font subsetting**: `fetch_fonts.mjs` only includes characters present in `story.js/hud.js/main.js/art.js` at download time. The ZCOOL KuaiLe subset has no Latin glyphs, so Latin words in the Chinese credit row fall back to a system serif; use `'"ZCOOL KuaiLe", Fredoka'`.
- **Redraw cost**: Pip's canvases are redrawn only when the pose (quantized to 1/40) changes.

## Build notes

```
styles/paper-popup/demo/
  index.html  importmap (three from demo/node_modules) + fonts.css + main.js
  main.js     scene: renderer, HDRI, desk & props, book, particles, choreography (pipState/crumpleState/foldState),
              camera keys SH, lightsAt(t), sound-event list EV, window.render(t)
  story.js    timeline (single source of truth): DUR, VO narration, BUB bubbles, CHAPTERS, CREDITS, OPEN, TURNS
  book.js     the book (cover, spine, page blocks, ground/back pages, curling leaf), texOf()
  sets.js     page art per spread (pages()), pop-up pieces (buildSets), sky slats, updatePops/riseOf, RISE/FOLD
  art.js      all Canvas2D drawings: drawPip/drawPipBack, drawCrumple, drawWhale, props (hill, pine, mushHouse, …)
  paper.js    canvas helpers: finishCut (white border + card edge + grain), paperFill, crescent, blob, sh
  cutmesh.js  cutMesh (front art / back paper / cut-out shadow), blobShadow, thread, particles (InstancedMesh)
  actors.js   makePip, makeCrumple, makeFold (foldable paper plane), makeWhale, makeBoat
  post.js     DOF pass (CoC + 64-tap gather) → bloom → vignette/warmth → output
  hud.js      2D overlay: subtitles, bubbles, chapter banners, NICE/GREAT, "!", end card, blip times
  render.mjs  stills / events / video (N workers → out/seg_*.mp4)    serve.mjs  static server
  tts/        lines.json + gen.py (all lines) / gen1.py (selected lines) → voices/*.wav + dur.json
  asr.py words.py   whisper check / word timestamps      music/edit.py  score.wav    mix.py  mix.wav
  mux.sh      segments + mix → ../paper-popup.mp4        make_srt.mjs  → ../paper-popup.srt
```

All commands can be run from the repo root. Python = the repo `.venv` (numpy, scipy, soundfile, librosa, kokoro-onnx, faster-whisper are installed there).

```sh
D=styles/paper-popup/demo; PY=.venv/bin/python
# 0. once: fonts (re-run after changing Chinese text) and music
(cd $D && node fetch_fonts.mjs)
#    download the three MP3s from incompetech.com into $D/music/, then convert to 48 kHz WAV:
for f in Dreamy_Flashback Jaunty_Gumption Heartwarming; do ffmpeg -y -i $D/music/$f.mp3 -ar 48000 -ac 2 $D/music/$f.wav; done
# 1. voice (Kokoro model is shared from core/tts/): all lines, or only some
$PY $D/tts/gen.py af_bella            # → voices/v01..v15.wav + voices/dur.json
$PY $D/tts/gen1.py v04 v07            # regenerate selected lines
# 2. proof-listen
$PY $D/asr.py; $PY $D/words.py        # whisper transcript / word timestamps for gag sync
# 3. timeline: edit story.js (VO start times use voices/dur.json), then check stills
node $D/render.mjs stills 6.5 30 61.8 82.6 118     # → demo/stills/t_*.jpg (STILLS_DIR=out/x to redirect)
# 4. score (only when the edit points change)
$PY $D/music/edit.py                  # → music/score.wav (jump-cut search: music/jump.py, jump2.py)
# 5. sound events + mix
node $D/render.mjs events             # → events.json (250 events)
$PY $D/mix.py                         # → mix.wav (argument = other output path)
# 6. video: 7980 frames, N workers (8 used for the demo ≈ 2.5 min; use 2 when other jobs share the GPU)
node $D/render.mjs video 8            # → out/seg_0..7.mp4 + out/list.txt
# 7. mux (+ film grain noise=c0s=2, loudnorm −14 LUFS) and subtitles
zsh $D/mux.sh                         # → styles/paper-popup/paper-popup.mp4 (OUT=... to write elsewhere)
node $D/make_srt.mjs                  # → styles/paper-popup/paper-popup.srt
```
Helpers: `shot.mjs page.html out.png` (screenshot any page, e.g. `sheet.html` = character & prop model sheet), `probe.mjs '<js expr>'` (evaluate inside the loaded scene; `window.DBG` exposes pip/boat/fold/whale/book/cam), `gltest.mjs` (GPU flag benchmark), `tile.py` (contact sheet of stills), `music/survey.py` (tempo/loudness survey of candidate tracks). The generic `node core/render/still.mjs styles/paper-popup/demo 30` also works (the page uses only relative URLs).

## Engine reference

**Coordinates.** World = metres, y up; desk top at y = −PG relative to the page. `book.stage` is the page frame: x ∈ [−0.22, 0.22] left→right, z ∈ [0, 0.30] from the spine (far) to the reader (near), y up from the page. `book.sky` is the standing backdrop frame (after the cover opens): x as above, y ∈ [0, 0.30] up the backdrop, small +z = in front of it. Characters go in `book.stage`; hanging clouds/moon/stars go in `book.sky`.

| Module | Key API | Notes |
|---|---|---|
| `lib.js` | `seg(t,a,b)`, `ss`, `eio`, `eo`, `ei`, `back(t,s)`, `spring(t,k,z)`, `env(t,a,b,fi,fo)`, `mulberry(seed)`, `track([[t,[…]],…])` | all animation is `f(t)`; `track` = monotone cubic keyframes (camera, flight path) |
| `paper.js` | `cv(w,h)`, `finishCut(art, border=14, {paper, edge, grain, grainA})`, `paperFill(x,w,h,col,seed,mott)`, `crescent(x,pathFn,shade,dx,dy,base)`, `blob(x,cx,cy,rx,ry,wob,seed)`, `sh(x,fill,lw,stroke)`, `smoothClosed/smoothOpen`, `GRAIN`, `INK` | Canvas2D toolkit for anything paper |
| `art.js` | `cut(wm,hm,draw,{pad,border,ax,ay,raw})` → `{c,w,h,ax,ay}` at `PPM`=5200 px/m; props `hill(w,h,col,shade,seed,{bumps,dots})`, `lolliTree(h,col,shade,seed)`, `pine`, `bush`, `flower(h,petal,seed)`, `mushHouse(h)`, `door`, `windowGlow`, `sunOnStick(r,stick)`, `cloud(w,seed)`, `sign(w,text)`, `fence(w,h)`, `waveStrip(w,h,col,dark,seed,n)`, `boat(w,'sail'|'hull')`, `moon`, `star`, `island`, `mushroom`, `log`, `fern`, `sketchTree`, `sketchHouse`, `leafBit`, `bang`; characters `drawPip(x,pose)`, `drawPipBack`, `drawCrumple(x,{mood,blink,mouthOpen})`, `drawWhale(x,{happy})` | every prop returns an item for `cutMesh`; anchor (ax, ay) = bottom centre by default |
| `cutmesh.js` | `cutMesh(item,{s,backCol,shadow,tex})` → Group (origin = anchor), `blobShadow(r,a)`, `thread(len)`, `particles(geo,mat,n,(i,t)=>({x,y,z,rx,ry,rz,s,col})|null)` → InstancedMesh with `.userData.update(t)` | cut-out shadows, paper-coloured back |
| `book.js` | `coverCanvases(drawIcon)` → `{c,m}`; `makeBook(cover)` → `{root, stage, sky, groundMat, backMat, leafFront, leafBack, setOpen(θ), setLeaf(u), coverMat}`; `texOf(canvas,{linear})`; `BW BD PG` | `setOpen(π/2)` = fully open; set `groundMat.map`/`backMat.map` per spread; `setLeaf(0..1)` = page turn (0/1 hides the leaf) |
| `sets.js` | `pages()` → canvases `sky0 ground0 sky1 ground1 sky2day sky2night ground2 sky3 ground3` (2048 × 1396, `gx(x)`/`gz(z)` map metres to pixels); `buildSets(book)` → `{L, ex}`; `updatePops(L,t)`; `RISE[spread]`, `FOLD[spread]`; internal `popper(list, spread, parent, item, x, y, z, {d, dir, sway, ph, pop, ry})` | add a spread = page art + a block of `popper` calls with a new spread index, and extend `RISE/FOLD/TURNS` |
| `actors.js` | `makePip(H)` → `{root, body, shadow, pose(p), head()}`; `makeCrumple(D)`; `makeFold(L,S,KD)` → `{fold(f 0..1), drawFace(mood,blink)}`; `makeWhale(w)` → `{setHappy}`; `makeBoat(w)` | pose `p` = `{walk, stride, armL, armR, flap, eyes, mouth, look:[x,y], blink, lean}` |
| `post.js` | `makePost(renderer, scene, cam, w, h)` → `{composer, dof:{focus, aper, maxCoc}, bloom, vig:{uniforms:{amt,fade,warm}}}` | call `post.composer.render()` instead of `renderer.render` |
| `hud.js` | `drawSubs(ctx,t,dur)`, `drawBubbles(ctx,t,{who:[sx,sy]})`, `drawChapter`, `drawAction(ctx,t,[{t0,text,p,col}])`, `drawBang`, `drawEnd`, `blipTimes()` | all read `story.js`; draw on the 1920×1080 `#ov` canvas |

**Page contract** (what `render.mjs` needs): `window.READY = true` after assets load; `window.render(t)` draws second `t` deterministically; `window.DUR`; `window.EV = [{t, type, …}]` for `mix.py` (types listed in "Score structure"; add a new branch in `mix.py` for a new type).

**Minimal example** — a new spread with one pop-up hill, a hero walking on it and a page-turn camera, inside `main.js`-style code:

```js
import * as THREE from 'three';
import { makeBook, coverCanvases, texOf, BW, BD } from './book.js';
import { cutMesh } from './cutmesh.js';
import { makePip } from './actors.js';
import { makePost } from './post.js';
import * as A from './art.js';
import { cv, paperFill } from './paper.js';
import { seg, back, eio, track } from './lib.js';

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setSize(1920, 1080); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 16 / 9, .004, 30);
const post = makePost(renderer, scene, cam, 1920, 1080);
// (load the HDRI + desk exactly as main.js lines 34–43)

const book = makeBook(coverCanvases((x, px, py, w, h) => { /* draw the cover medallion */ }));
scene.add(book.root);
const ground = cv(2048, 1396); paperFill(ground.getContext('2d'), 2048, 1396, '#9fd57a', 2);
book.groundMat.map = texOf(ground);

// a pop-up hill: lies flat (rotation.x = −π/2 · (1−k)) and springs up around its bottom edge
const hill = new THREE.Group(); hill.add(cutMesh(A.hill(.24, .075, '#b5e39a', '#93cc78', 11)));
hill.position.set(0, 0, .04); book.stage.add(hill);

const pip = makePip(); book.stage.add(pip.root, pip.shadow);
const camKeys = track([[0, [.0, .27, .78, 0, .1, .1]], [4, [0, .06, .38, 0, .04, .13]]]);
const sun = new THREE.DirectionalLight('#fff3e0', 2.6); sun.position.set(-.35, .55, .75); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -.3, right: .3, top: .3, bottom: -.3 }); scene.add(sun);

window.render = t => {
  book.setOpen(Math.PI / 2 * eio(seg(t, .5, 3.1)));                     // cover swings up into the backdrop
  const k = back(seg(t, 3.0, 3.55), 1.7);                               // pop-up with overshoot
  hill.visible = k > .002; hill.rotation.x = -(Math.PI / 2) * (1 - k);
  const w = seg(t, 4, 7), ph = w * .15 / .018 * Math.PI * 2;            // walk 15 cm, phase from distance
  pip.pose({ walk: ph, stride: w > 0 && w < 1 ? 1 : 0, armL: .25 + Math.sin(ph) * .5, armR: .25 - Math.sin(ph) * .5 });
  pip.root.position.set(-.1 + .15 * w, Math.abs(Math.sin(ph)) * .0012, .15);
  pip.shadow.position.set(pip.root.position.x, .0004, .15);
  const c = camKeys(t); cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); cam.updateProjectionMatrix();
  post.dof.focus = cam.position.distanceTo(new THREE.Vector3(c[3], c[4], c[5])); post.dof.aper = 2.3;
  scene.updateMatrixWorld(true); post.composer.render();
};
window.DUR = 8; window.EV = [{ t: .5, type: 'creak' }, { t: 3.1, type: 'pop' }];
window.READY = true;
```

To reuse the engine for a different film (your own story, not this one), copy the engine files, write a new `story.js` (lines, bubbles, chapters, `OPEN`, `TURNS`, `DUR`), replace the spreads in `sets.js` (`pages()` + `buildSets`), redraw characters in `art.js`, then re-key `pipState`, the camera list `SH` and `lightsAt` in `main.js`. Keep book/paper/cutmesh/post/render/mix unchanged.
