# 2.5D Pixel Art — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Lampbearer* (76.5 s, 1920×1080, 60 fps) · `hd-2d.mp4` (the **tilt-shift cut**) · source in [`demo/`](demo/) · engine: three.js r170 scenes + procedural pixel textures + custom physical DOF / tilt-shift post (`demo/post_ts.js`) + Canvas2D overlay UI, rendered frame-by-frame with `core/render/video.mjs`.


## Story & structure

A harbour town's lighthouse goes out; the old keeper hands the last flame to his granddaughter Wren, who carries her lantern through a night forest and up a storm-beaten cliff stair to relight the lighthouse, so the ships at sea can find their way home. Tagline: *Every path begins with a single light.*

How the demo spent the style's native powers:

| Native power | Story use |
|---|---|
| **A light the hero carries** | The lantern is both key light and plot: Wren carries one small light that must reach the lighthouse. Its brightness is the emotional meter: bright → guttering → almost out → relit. |
| **Tabletop world** | Places read as *maps*: a harbour town, a forest path, a cliff stair, a tower top. One location per chapter, each with its own light key. The opening set returns at the end to show the change (harbour: lighthouse dark → lit, ships' lamps appear). |
| **RPG grammar** | "Chapter I" card, a named NPC who hands over the quest in a dialogue box, a journey through two biomes, a climax at a landmark, a title card. |
| **Sprite shadows** | The first lighting (brazier taper → lantern) happens on screen, next to two characters, so both shadows jump onto the planks. |
| **Tilt-shift** | Extra-wide establishing shots with the focus band on a single tiny subject (the lighthouse, a boat). |

**Story shape:** cold chapter card → wide establishing shot where the landmark light **fails** → quest handed over in a dialogue box (the light is passed) → travel through a darker biome (forest) → the ordeal (storm; the light almost dies; the music drops out) → the light survives → the landmark is relit (climax on a music downbeat) → the opening set, transformed → title and tagline.

The demo has 6 shots, one set per 1–2 shots, 7 narrated lines + 1 dialogue line. The "one small light" is a lantern; in another film it could be a first commit, a seed, a letter, a signal — or no carried light at all.

## Shots

| Shot | Camera |
|---|---|
| Establishing (harbour wide, 5.5–15) | Very high and far (`[-17,15,38] → [-13,12,31]`, fov 36), slow push. Focus 44 m, aperture 520; tilt band fixed at 34 % screen height (no character to track). |
| Dialogue (pier, 15–25.5) | Medium-high 3/4 (≈5 m up, 8–10 m away, fov 30), almost static drift. Focus on the hero every frame, aperture 300. |
| Travel (forest, 25.5–35.5) | **Lateral tracking**, camera leads the walker slightly (`monotone` look-ahead), fov 30, 6.3 m up; near ferns in front of the lens blur into dark shapes; she walks behind a foreground trunk at the end. Aperture 380. |
| Ordeal (storm stairs, 35.5–49.5) | Starts as a huge establishing view of the cliff, eases into a follow cam (37–39 s), then **dives low and close** as she kneels (camera to ~2.2 m up, 6 m away), and pulls back as she climbs on. Aperture 140–170 (closer = less blur). |
| Climax (lamp room, 49.5–58) | Medium on the hero at the lens; after ignition, a rising pull-back to a wide of the tower (fov 30 → 40, aperture 150 → 320), focus switches from hero to lens. |
| Resolution (harbour end + title, 58–76.5) | Mirror of the opening but wider and higher (`[-22,26,44] → [-27,33,55]`, fov 42), focus 70, aperture 380, tilt band at 36 %. |

Rules: always look *down* on the world (never eye level); every camera path is a `track()` of 2–7 keys (monotone cubic, no overshoot); focus distance is recomputed each frame from camera to the hero (`post.dof.focus = cam.position.distanceTo(hero + (0,.7,0))`); in the tilt cut the sharp band follows the hero's projected screen height (`tiltCenter`, clamped .2–.8).

## Score structure

- **Voices (Kokoro via `core/tts/tts.py`)**: narrator `af_heart`, speed .82–.90 (slow, storybook); the quest-giver `bm_george`, speed .84, low-passed at 7 kHz in the mix so he sits "in the world". 7 narrated lines + 1 dialogue line, each 1–5.4 s. Check with `core/tts/asr_check.py`; put invented names in the `asr` field (`Graywater`, `Ren`, `whisper would`), otherwise whisper flags them.
- **Music**: one licensed track, edited to picture: Scott Buckley, *Precipice* (CC BY 4.0), cut by `music/edit.py` into five sections (intro pad → **0.8 s breath when the lighthouse dies** → continuous build through forest and storm → **hard stop into a reverb tail at 42.0 when the flame nearly dies**, only the intro pad under it → the composer's own build → **its D→G♭ key-change downbeat placed at 53.500 s = ignition**, located automatically by the steepest < 250 Hz onset (error < 5 ms) → jump to the final E♭ arrival for the title). All cut points are in `music/CUES.md`. Pick one piece whose own arc matches the story; cut inside it rather than stitching tracks.
- **Ambience & foley (`mix.py`, synthesized with `core/audio/sfx.py`)**: per-set beds with crossfaded gain curves (harbour waves + rope creaks, brazier crackle, forest crickets + leaves, storm rain + wind with a gust swell), and events: lamp-out "fwoomp" 12.3, match strike 16.15, UI chime on the dialogue box 17.3, footsteps from `sfx_events.json` (wood / dirt / stone), thunder 0.25 s after each flash, wind whoosh at the gust, two heartbeats in the silence, the ignition boom (42 Hz drop + air + high shimmer) at 53.5, six small bells as the ships light up.
- **Mix**: each voice line compressed and RMS-matched; buses levelled to voice −17, music −21, ambience −30, foley −27 dB RMS; music ducks ~2.2 dB under voice, then a **per-line auto-duck** pulls music + ambience to ≈10 dB under each line (only down, never up; the script prints the achieved gap per line, 7–14 dB in the demo); `tanh` soft-clip; final loudness by `core/render/mux.sh` (two-pass loudnorm −14 LUFS, TP −1.2).

## Palette & props

The demo is a night film: cold blue against warm amber fire, strong bloom, heavy vignette.

**Resolution & pixels.** Scene textures are drawn per pixel on small canvases (`PX` class, `px.js`) and uploaded with `NearestFilter`; world-space UVs (`worldUV`, `kit.js`) keep **24 px/m** on every surface. Characters are 34×50 px frames at `SPX = 1/30` m per pixel (≈1.67 m tall). Colour comes from **ramps** (3–6 swatches) chosen by brightness with a 4×4 Bayer dither; the dither band `dz` must be narrow: **.22 for characters, .45 for textures** (wider = checkerboard noise everywhere). Sprites get an automatic 1 px **selout** outline (`PX.outline(.3)`: transparent pixels next to the sprite become the neighbour colour darkened toward `#16 0e 1e`).

**Palette (night).** Sky `#050818 → #101d3e → #2c4262` (horizon), fog `#16223a` (harbour) / `#152a48` (forest) / `#1c2334` (storm), moon light `#8fa8e0`, hemisphere `#3a4c7a / #0a0a12`. Fire and windows `#ff9d4a`, `#ffae55`, `#ff8c3a`, lantern `#ffb050`, lighthouse `#fff0c8`. Cool character fill `#9fb2e8`. Hero cloak ramp `#2e0b14 … #c9503f` (crimson), scarf gold `#b08424`; keeper coat navy `#10131f … #5a6c98`, beard greys. Ink `#1a1016`.

**Materials.** Boxes and cylinders only: houses with plaster + timber beams (`plaster`), shingle roofs (`shingles`), planks with nail dots (`woodPlanks`), Worley cobbles (`cobbles`), layered rock (`rock`), bark/canopy/fern/grass/mushroom sprites (`forest_art.js`). Foliage, grass, ferns, mushrooms, distant ships and ridges are **billboards** (instanced where many). Windows are emissive pixel panes (`windowMat`, emissive 2.2). Fire is a 6-frame pixel atlas billboard at 10 fps (`fire`). Sea is a custom shader: quantized pixel ripples, crest bands, light reflection columns stretched toward the camera, sparkle glints.

**Light rig per set.** One dim shadow-casting moon (DirectionalLight 1.1–1.2, 2048 map) + hemisphere fill + **practical point lights** (windows 8, street lamps 12–14, brazier 16 with shadows, lantern 2.6–14 with shadows) + a **cool front fill** (`#9fb2e8`/`#8fa6e0`, 1.2–1.8, range 6–8 m) placed ~2 m in front of the hero. Additive `glow` sprites sit on every light source so bloom has something to grab.

**Post chain** (`post_ts.js`, `makePost(renderer, scene, camera, 1920, 1080, { ssaa: 2 })`): render at 2× (3840×2160 internal) with MSAA → physical DOF (CoC = `aper × (1/focus − 1/z)` px, 96-tap spiral gather, far samples cannot bleed over a sharp foreground) **+ tilt-shift** → UnrealBloom (strength .55, radius .75, threshold .85) → vignette/grade (amt .62, warm .1, contrast .2, sat 1.05) → ACES filmic, exposure 1.15. Tilt-shift cut adds: `tiltAmt 17`, band half-width `tiltW .075`, feather `tiltF .3` (fractions of screen height), `maxCoc ≥ 24`, saturation ×1.16, contrast .28.

**Type.** Cinzel 500/700 (chapter label, title), Cormorant Garamond italic 500 (subtitles, tagline), Cormorant 500/600 (dialogue text, name plate). Gold `#d8c28e / #e2c989 / #c9a863`, parchment white `#f3ead6 / #f6f0e2`.

Motion as built:

- **Sprites step, everything else glides.** Walk cycles use 4 frames at 6–10 fps (`['w0','w1','w2','w3'][Math.floor(t*9)%4]`), idles alternate two frames at ~1.4 Hz, blinks every few seconds, poses swap instantly (`upE → up → idle`). Camera, lights, particles, beams and focus update every frame at 60 fps.
- **Poses are data**: a frame is a parameter object (`{ step, arm:'low'|'fwd'|'up'|'hug'|'pour', kneel, lit, bob, hem, scarf, blink, closed, look }`) drawn by `drawWren` / `drawKeeper`. Add a pose by adding a table entry (or pass `extra` to `makeChar`).
- **The light breathes**: `flick(t, seed)` (three summed sines, ±20 %) on every flame; the lantern's `lit` value (0–1) redraws the flame size in the sprite *and* drives the point light (`intensity ∝ lit^1.3`), glow opacity and scale.
- **Events are timestamps** in `story.js` `T` (lighthouse flicker 11.5 → out 12.35, taper 16.2, gust 40.6, dim 41.3, dark 42.0, relight 45.6, stand 47.6, pour 52.6, ignite 53.5, beams 54.4, ships 59.2). Scenes blend with `ss(seg(t,a,b))`.
- **Signature beats:** lighthouse flickers twice and dies; brazier taper lights the lantern and both sprites' shadows jump onto the planks; the gust shrinks the flame to an ember (sprite `lit .27`), world goes almost black, then the flame re-grows; the lens ignites with an exposure burst (`exp(-(t-53.5)/.22)`) and two beam cards start sweeping; ships' lamps pop on one every 0.7 s and drift toward the harbour.
- **Weather is procedural**: rain = wind-slanted line segments (`rain`), lightning = a scripted flash curve (`flash(t)`: 150 ms strike, dip, 60 ms re-strike, exp decay) that boosts hemisphere, a "bolt" light, sky, clouds, sea and exposure together.

## End card

- **Narration subtitles**: Cormorant Garamond italic 500, 50 px, `#f6f0e2`, centred at y = H − 88, on a soft horizontal dark band (gradient, max .38 alpha), drop shadow 10 px. Fade in .35 s before the voice, out 0.45–0.8 s after it ends. One line per voice clip.
- **Dialogue box** (for a character who speaks on screen, instead of a subtitle): 1180×210 px, bottom-centred, navy gradient `rgba(14,18,34,.86) → rgba(6,8,18,.9)`, 2 px gold border `rgba(214,190,130,.9)` + inner 1 px line, gold diamond corners; name plate (Cormorant 600 34 px) overlapping the top-left edge; body Cormorant 500 44 px, **typed out over 92 % of the voice duration**; blinking gold ▼ caret when done; slides up 14 px on entry. A soft chime marks it.
- **Chapter card** (0–5.5 s): radial navy background `#11172a → #020308`, `CHAPTER  I` (Cinzel 500 34 px, 10 px tracking, `#d8c28e`) over a gold ornament line with diamond, then the chapter name in Cormorant italic 78 px with a warm glow; one pixel ember drifts across.
- **Title** (67.4–76.4 s): screen dimmed 50 %, `THE LAMPBEARER` in Cinzel 700 118 px, 14 px tracking, vertical gold gradient `#fff3cf → #e2c27c → #a8803e` with glow; ornament; tagline in Cormorant italic 50 px; music/voice credit at the bottom (24 px, 75 % alpha).
- **End credit line (this library's demo only)**: our demo ends with **"LemoLab × Claude Opus 5.5"**. It is part of the title card (`ui.js` `title()`, on by default): Cinzel 500 30 px, `#d8c28e` at 85 % alpha, 4 px tracking, centred at y = 668, fading in 70.6–71.6 s, between the tagline and the music credit, which it does not replace. `?nocredit=1` hides it. This sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card — when you adapt `ui.js`, delete the credit line.
- Export the `.srt` from the same data (`tools/srt.py`: story.js `VO` + `voices/dur.json`, +0.5 s hold, dialogue prefixed `OLD KEEPER:`).


## Build notes

```
styles/hd-2d/demo/
  index.html  main.js     page, renderer (ACES, PCF soft shadows), shot → set routing, tilt-shift driver (?tilt=1)
  story.js                DUR, SHOTS, event times T, VO lines (single source of truth)
  px.js                   PX pixel canvas, ramps + Bayer, surface textures, billboard / glow / blob
  kit.js                  worldUV, mat/mesh/box, cached materials, house, crate, barrel, pixel fire, windows, ridges
  fx.js                   sky, stars, pixel sea shader, particles, rain, shaft, beamCard, flick
  chars.js                procedural pixel characters (Wren, Old Keeper), pose tables, atlas, makeChar
  harbor.js forest.js(+forest_art.js) cliff.js   the three sets; each exports build*() → { scene, update }
  ui.js                   Canvas2D overlay: chapter card, dialogue box, subtitles, title, fades, credits
  post_ts.js              makePost: DOF + tilt-shift + bloom + grade (local copy of core/three/post.js)
  lines.json vo_times.json sfx_events.json   TTS lines, voice start times, foley timestamps
  music/edit.py src/      score edit of "Precipice" → music/score.wav, CUES.md, measure.json
  mix.py                  ambience + foley + voices + ducking → mix.wav
  tools/srt.py  tools/render_range.mjs  tools/sheet/index.html   srt export, partial re-render, sprite sheet page
```

All commands from the repo root. `.venv` is the shared Python env (kokoro-onnx, faster-whisper, librosa).

```sh
PY=.venv/bin/python; D=styles/hd-2d/demo

# 0. fresh clone: voices/*.wav, music/score.wav and mix.wav are git-ignored (rebuilt below); if music/src/ is empty, fetch the source
curl -L -o $D/music/src/sb_precipice.mp3 https://www.scottbuckley.com.au/library/wp-content/uploads/2021/01/sb_precipice.mp3

# 1. voices (Kokoro) + whisper check → voices/*.wav, dur.json, words.json
$PY core/tts/tts.py $D/lines.json $D/voices
$PY core/tts/asr_check.py $D/lines.json $D/voices      # demo: 1 expected DIFF (n1 "Graywater" → "gray water")

# 2. score edit → music/score.wav (+ CUES.md, measure.json); set OUT_DIR=... to write elsewhere
(cd $D/music && ../../../../.venv/bin/python edit.py)

# 3. mix → demo/mix.wav (optional arg: another output path)
$PY $D/mix.py

# 4. subtitles → styles/hd-2d/hd-2d.srt
$PY $D/tools/srt.py

# 5. review stills of the tilt-shift cut (≈0.1–0.2 s per frame)
node core/render/still.mjs $D 8 16.9 30.5 42.8 53.8 62 71 --q tilt=1 --out $D/out/review

# 6. render the TILT-SHIFT CUT (the version in the library): 4590 frames at 60 fps
#    26–37 fps with 2 workers (≈2.5 min)
node core/render/video.mjs $D --fps 60 --workers 2 --q tilt=1 --out $D/out/video_tilt.mp4

# 7. mux: loudnorm −14 LUFS, grain 0 (pixel art: no film grain)
sh core/render/mux.sh $D/out/video_tilt.mp4 $D/mix.wav styles/hd-2d/hd-2d.mp4 60 0
```

`?tilt=1` is what makes the tilt-shift cut: it is a **render-time post effect** inside `post_ts.js` (not a second pass over a finished video). Without it you get the plain DOF version. Other page switches: `ss=1` (no supersampling, faster previews), `only=harbor|forest|cliff` (build one set), `nobloom`, `nodof`, `noglow`, `nocredit=1` (hide the end credit line).

**Partial re-render** (e.g. after changing the title card): render only the tail and splice it onto the existing `out/video_tilt.mp4` (frames 0–4019 are untouched by title-card changes), then mux again. Back up the current film first (`hd-2d_v1.mp4`). Audio is untouched (same `mix.wav` → bit-identical decoded audio).
```sh
node $D/tools/render_range.mjs 67 76.5 --workers 2 --q tilt=1 --out $D/out/tail.mp4          # 570 frames ≈ 15 s
ffmpeg -y -i $D/out/video_tilt.mp4 -i $D/out/tail.mp4 -filter_complex \
  "[0:v]trim=end_frame=4020,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p $D/out/video_tilt_new.mp4   # 25–150 s (CPU-bound, slower when other renders run)
sh core/render/mux.sh $D/out/video_tilt_new.mp4 $D/mix.wav styles/hd-2d/hd-2d.mp4 60 0          # 35–245 s, same caveat
```

When you change the story: edit `story.js` first, then copy the voice start times into `vo_times.json` (mix.py reads that file, not story.js), keep `sfx_events.json` footsteps in step with the sets' walk frames, and move the cue constants at the top of `music/edit.py` (`T_CAESURA`, `T_SILENCE`, `T_HIT`, `NARRATION`).

Pitfalls, with the demo's props and numbers:

- **Checkerboard everywhere**: a wide dither band on ramps. Keep `dz` ≈ .22 on sprites, ≈ .45 on textures.
- **The lantern blows out the sprite**: a point light sitting on the billboard plane saturates it. Put the light **0.42–0.45 m from the lantern toward the camera** (`lp + toCam * .45`), and in the forest cap sprite lighting in the shader (`outgoingLight = min(outgoingLight, diffuseColor.rgb * 1.35 + emissive)` via `onBeforeCompile`).
- **Lights behind a billboard don't light it** (it only has a front normal). Always add a cool front fill light ~2 m in front of the hero.
- **Cylinder light beams facing the camera produce NaN**; bloom spreads them into large black blocks. Use `beamCard` (an axis-aligned billboard strip that fades as it turns toward the camera) and let the glow sprite take over (`face` factor enlarges the lighthouse glow).
- **Sea reflection column division by zero**: clamp the width with `max(.35, …)`.
- **Storm too dark to read.** Add a "readability" fill outside the story-dark beat: hemisphere +1.0, sun +1.3, sky +.35 (the `ext` term in `cliff.js`), i.e. roughly ×2–2.5 on environment mid-tones, and let it drop to nothing only during the flame-almost-out beat.
- **Distant ship glows hidden by fog/geometry**: `depthTest = false` + `renderOrder 5` on those glow sprites.
- **Tilt-shift on shots with no character**: the tracker has nothing to follow; use fixed band heights per shot (`TILT_C`).
- **Tilt-shift and occlusion**: the tilt blur is folded into the same signed CoC as depth DOF (above the band = far, below = near) so the gather keeps the "far can't bleed over sharp near" rule; don't add it as a separate blur pass.
- **Near-identical frames diverge around a flash**: the ignition burst decays with a 0.22 s time constant, so a still at 53.8 s differs visibly from the neighbouring 60 fps frame. That is expected, not a bug.
- **Node render scripts may not exit** after `done` because the static server keeps connections alive (`demo/tools/render_range.mjs` ends with `process.exit(0)` for that reason). The output file is complete once `done` is printed.

## Engine reference

### Page contract (`main.js`)
`window.render(t)` picks the shot (`shotAt(t)`), maps it to a set (`SET_OF`), points the DOF pass at that set's scene, resets post defaults (bloom .55/.85, exposure 1.15, warm .1, sat 1.05, vignette .62), calls `set.update(t, shot, camera, post, renderer)`, applies tilt-shift if `?tilt`, renders the composer, then draws the overlay (`drawOverlay(t, shot)`). One `PerspectiveCamera(32, 16/9, .3, 2000)` is shared by all sets; each set sets fov/position/lookAt every frame.

### Modules and key functions
| Module | Function | What / key params |
|---|---|---|
| `px.js` | `new PX(w,h)` | `.set/.get/.rect/.fill(f)/.ellipse/.poly/.line/.outline(k,tint)/.done()` → canvas |
| | `ramp(cols, dz=.45)` | `(v,x,y) → rgb` with Bayer dither; `dz` = dither band width |
| | `texOf(canvas, {repeat, mip, linear})` | NearestFilter texture |
| | `woodPlanks / cobbles / rock / plaster / shingles / ground(w,h,o)` | procedural surface canvases (`seed`, `cols`, `pw`, `len`, `cell`, `beams`, `snow`) |
| | `billboard(tex, wM, hM, {ax, ay, em, emCol, emI, shadow, receive})` | upright lit sprite plane (Lambert + alphaTest .5) with custom depth/distance materials so it casts cut-out shadows |
| | `glow(col, size, i)` · `blob(r, a)` · `radialTex` | additive halo sprite · ground contact shadow |
| `kit.js` | `worldUV(geo, tile)` · `mat(canvas, o)` · `mesh(geo, m)` · `box(w,h,d,m)` | planar UVs by normal so texel density is constant (`tile = canvas.width / 24` m) |
| | `mats()` | cached `plank, plankDark, beam, wall, wall2, wall3, roof, roof2, roof3` |
| | `house({x,z,w,d,h,wall,roof,door,windows,upper,side,chimney,ry})` | timber house with emissive windows (`g.userData.windows`) |
| | `crate(s)` · `barrel(r,h)` · `fire(size,{seed,i})` · `windowQuad` · `ridge(wM,hM,col,seed)` | props; `fire.userData.update(t, cam, scale)` |
| `fx.js` | `sky({top,mid,hor,moonDir,moonCol})` → `{mesh,u}` | gradient dome + moon halo; `u.k` = brightness |
| | `stars(n, seed)` · `sea(size,{ppm,deep,shallow,crest})` → `{mesh,u,setLights([{p,c,i}])}` | per frame set `u.t`, `u.camPos`, fog uniforms, `u.bright`, `u.calm` |
| | `particles(n, fn(i,t,o), {soft, blend})` | deterministic CPU particles; `fn` fills `o.x,y,z,a,s,r,g,b`; call `.userData.update(t)` |
| | `rain(n, box, {speed,len,opacity})` · `.userData.update(t, [windX,0])` | slanted streaks |
| | `beamCard(len, w0, w1, col, {k, fall})` · `.userData.aim(origin, dir, cam)` → side factor | light beam that never shows its edge |
| | `flick(t, seed)` | flame flicker multiplier ≈ 1 ± .2 |
| `chars.js` | `makeChar('wren'|'keeper', extraPoses)` → `{root, mesh, frame(name), face(cam, flip), lanternPos(name, flip)}` | 34×50 px atlas + emissive atlas (lantern glass); `root.userData.char` is what the tilt tracker looks for |
| `post_ts.js` | `makePost(renderer, scene, cam, w, h, {ssaa, ao})` → `{composer, dof, bloom, vig}` | `dof.focus` (m), `dof.aper` (px·m), `dof.maxCoc` (px), `dof.tiltAmt/tiltC/tiltW/tiltF`; `vig.uniforms.amt/warm/sat/contrast/fade` |
| `ui.js` | `drawOverlay(t, shot)` · `overlayReady()` | reads `story.js` `VO` and `voices/dur.json` |
| `/core/lib.js` | `track(keys)` · `monotone` · `seg` · `ss` · `eio` · `eo` · `lerp` · `clamp` | camera paths and easing |

### Minimal new set
```js
// myset.js — a lantern-lit alley; register in main.js: sets.alley = buildAlley(); SET_OF.alley = 'alley'; add { id:'alley', a, b } to story.js SHOTS
import * as THREE from 'three';
import { cobbles, glow } from './px.js';
import { mat, mesh, house } from './kit.js';
import { sky, particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { track, seg, ss } from '/core/lib.js';

export function buildAlley() {
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#16223a', .03);
  const SK = sky(); scene.add(SK.mesh);
  const moon = new THREE.DirectionalLight('#8fa8e0', 1.1); moon.position.set(-20, 30, -20); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  scene.add(moon, new THREE.HemisphereLight('#3a4c7a', '#0a0a12', .9));
  scene.add(mesh(new THREE.BoxGeometry(30, .4, 12).translate(0, -.2, 0), mat(cobbles(96, 96))));
  scene.add(house({ x: -4, z: -5, w: 6, d: 5, h: 4.5, door: 1.2 }), house({ x: 4, z: -5, w: 5, d: 5, h: 5, wall: 'wall3', roof: 'roof2' }));
  const hero = makeChar('wren'); scene.add(hero.root);
  const lamp = new THREE.PointLight('#ffb050', 3, 10, 2); lamp.castShadow = true; lamp.shadow.bias = -.004; scene.add(lamp);
  const halo = glow('#ffc070', 1.1, 1.2); scene.add(halo);
  const fill = new THREE.PointLight('#9fb2e8', 1.5, 7, 2); scene.add(fill);                 // cool front fill: never skip
  const dust = particles(80, (i, t, o) => { o.x = (i * 7.3 % 20) - 10 + t * .1; o.y = (i * 3.1 % 4); o.z = (i * 5.7 % 6) - 3; o.a = .3; o.s = .05; o.r = .7; o.g = .8; o.b = 1; }, { soft: 1 });
  scene.add(dust);
  const camP = track([[0, [-2, 5.5, 10]], [8, [2, 5, 9]]]), camL = track([[0, [-1, .8, 0]], [8, [2, .8, 0]]]);

  function update(t, shot, cam, post) {
    const lt = t - shot.a;
    cam.position.set(...camP(lt)); cam.fov = 30; cam.updateProjectionMatrix(); cam.lookAt(...camL(lt));
    const x = -3 + ss(seg(lt, .5, 7.5)) * 6, walking = lt > .5 && lt < 7.5;
    hero.root.position.set(x, 0, 0); hero.frame(walking ? ['w0', 'w1', 'w2', 'w3'][Math.floor(t * 9) % 4] : 'idle0'); hero.face(cam);
    const lp = hero.lanternPos('w0'), toCam = cam.position.clone().sub(lp).setY(0).normalize();
    lamp.position.copy(lp).addScaledVector(toCam, .45); lamp.intensity = 2.6 * flick(t, 3); halo.position.copy(lp);   // light 0.45 m toward the lens
    fill.position.set(x + .4, 1.6, 2.2);
    dust.userData.update(t);
    post.dof.focus = cam.position.distanceTo(hero.root.position.clone().setY(.7)); post.dof.aper = 350; post.dof.maxCoc = 22;
  }
  return { scene, update };
}
```
Then check it with `node core/render/still.mjs styles/hd-2d/demo <t> --q 'tilt=1&only=alley'` (add `alley` to the `ONLY` switch in `main.js`).
