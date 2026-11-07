# Sci-fi Hologram HUD — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Volt · Spec Scan* (39 s: a 34 s scene plus a 5 s end card) · `hologram-hud.mp4` · source in [`demo/`](demo/)


## Story & structure

The spec walkthrough of a fictional city e-bike, the first use case of STYLE.md §11: a hardware product is scanned into a glowing wireframe, three parts are locked one at a time (battery, motor, brakes), and at the end the wireframe lights up into a solid hologram and settles into a spec sheet you could use as a poster.

Shot structure: scan-in → title → 3 × (lock → camera move → local explode → leader → value) → regroup → solid-hologram turn → spec-sheet lockup → end card. Part 1 gets 3 bars, the others 2 bars each. Each value stays on the big card ≥ 2.5 s, then docks in the left rail until the end, so every spec is on screen for 10–25 s.

**Signature shot**: part 1 as one move. Lock, push, the cover slides, the cells glow, the leader pulls out, and "80 km" rolls amber.

## Shots

| Beat | Camera | Why |
|---|---|---|
| Hook (0–2.6 s) | 3/4 front, pitch 14°, slow **orbit** yaw 57° → 24° while it **cranes down** | From above, the scan plane reads as an ellipse rising. Then it drops to near eye level and leaves room for the title on the left. Frame 1 already shows the plane at wheel height |
| Part 1 (slow) | **Push-in** 2.85 → 1.6 (1.5 s ease-out), then drift | The first spec gets the most time |
| Part 2 | **Whip** (following the box) + **orbit** around the hub axis, yaw −11° → 46° | An axial explode only reads when you orbit around the axis |
| Part 3 (fast) | **Pull back** to full + **loupe** (×4.3, its own counter-orbit) | Brakes are small: both scales on screen at once |
| Regroup | **Pull back + crane down** to pitch 0 | A low angle makes the object stand up before the light-up |
| High point | **Turntable 360°** + **crane up** 0 → 13° + slight push | The only moment the viewer sees every side |
| Lockup | Nearly static, a slow **dolly** 3.5 → 3.4 | The viewer reads |
| End | **Scan-erase** top-down, then the end card | Mirrors the hook |

Why this route, for this product: the hook's orbit craning down made the rising scan plane read as an ellipse; the regroup pulled back and craned down to eye level so the bike stood up before the light-up; the turntable was the only moment every side showed; the ending scan-erased top-down to mirror the hook. Each is one choice from STYLE.md §6, not the style's default opening or ending. The title rolled in after the scan and returned in the same place in the final lockup; the three-frame glitch was spent at ignition.

Framing numbers: fov 0.6. Big cards at x ≥ 1240, the rail at x 110–470, subtitles fixed at the bottom centre (baseline y 962), the loupe above y 580. In the wide loupe shot the target sits at x 0.49 → 0.475 of the frame.

Motion numbers: the target box starts at 1.9× the rest-pose bounding box, at 30 % alpha, snaps in 0.22 s; tag `TGT 0N · LOCK`. Explodes: the battery cover slides *along the down tube* while the cells stay and turn hot; the motor splits axially (cap / rotor / stator / cap) while rotor and stator counter-rotate; the brake caliper halves part on either side of the rotor, pistons separating *less* than the body so they appear to extend. Open over 1 beat (part 1: 2 beats), close over 0.5 s. Rolling value: 0.5 s (part 1: 1 s). Chip dock: card fades 0.35 s, chip slides x 140 → 110; rail step `min(112, 410 / (n − 1))` px, so 5 chips fit. Whip: 0.5 s cubic in-out, starting 0.45 s before the next lock; 5 sub-frames over 1/48 s.

## Score structure

- Score arc: sparse on the first spec, a layer added per part, deceleration before the high point, one beat of true silence, the drop at ignition (the loudest moment), half-time under the lockup.
- 120 BPM (1 bar = 2 s); `tools/cuecheck.py` checks every key event against `music/score.json` (all on the 1/16 grid, 0 ms offset).
- Original numpy synthesis, D minor with Dorian colour; chords Dm9 → B♭maj7 → Fmaj9 → G6. A D1 square pulse on quarters.
- No drums on part 1, + hats on part 2, + claps and the arpeggio up an octave on part 3. Regroup decelerates (16ths → 8ths → one quarter gliding down). One beat of true silence. Drop at ignition (808-style sine glide + 7-voice wide saw chord). Half-time under the lockup. The arpeggio is removed note by note under the end card.
- Silences: the half beat before the first lock (only the room hum remains; the lock hit is the first sound after it) and one full beat of true zero before ignition.
- Detect blips D–F–A; amber confirm = D6 + A6 + E7. J/L-cuts: the motor whine starts 0.4 s before the whip lands on the motor, the hydraulic hiss 0.4 s before the brake lock; hum and chord tail carry over the scan-erase into the end card.
- Voice: Kokoro `af_heart`, speed 1.0 (not `af_nicole`: too breathy and slow, 7.0 s against 4.4 s for the same line). Music ducks −16.5 dB and foley −15 dB under the voice, with a 0.5 s max-filter hold; only the first 0.2 s of lock / confirm hits escape.

## Palette & props

- Stage `hsl(hue+12, 70%, 2.4%)` with a radial lift `hsl(hue+6, 65%, 7%)`; 48 px dot grid (parallax 0.2); vignette 0.5.
- Pad rings at r = 0.7 / 1.05 (bright) / 1.12 (dashed) / 1.45 / 2.1, 120 ticks (every 10th long), 24 radial rays, rotating 0.12 rad/s.
- Wireframe: `lighter` strokes 1.3 px in 7 alpha levels; glow ¼-res blur 3 px ×0.85 and ⅛-res blur 4 px ×0.7; colour `hsla(hue, 100%, 50–80%, a)`; hot edges `hsla(hue, 70%, 92%)`, the 7 cm under the scan front.
- Solid: Fresnel `0.3 + 0.7·(1 − facing)^1.6` (facing = projected area / edge product), interlace 2 px full / 2 px at 38 % scrolling 1 px per frame; line width ×1.5 at ignition easing to ×1.12; light wave ±7 cm at ignition and on the chord change. Beam gradient 10 % → 0, 26 rays, 70 dust motes.
- Colour: `hue` 188 (cyan), `accent` 38 (amber); the alternate content uses 204 / 18 (blue / orange).
- Type: Rajdhani 300 for big numbers and the product name (26 px tracking), 500/600 labels (2–3 px tracking); Share Tech Mono 20–22 px. Plates `rgba(1,8,12,.72)`, border 28 %, 10 px corner ticks (`plate()` in hud.js).
- HUD: 46 px corner brackets 44 px from the edge; rulers tick every 24 px (every 5th long). Top-left: product // SPEC SCAN. Status: SCANNING 042% → SCAN COMPLETE · 3 SYSTEMS → TARGET 2/3 · MOTOR → HOLO SOLID · 360° → SPEC SHEET · READY.
- Subtitles: plate `rgba(1,8,12,.62)`, two diagonal cyan brackets, four voiceprint bars, Rajdhani Medium 38 px, wrap 1180 px; in 0.1 s before the voice, out 0.12 s before the next line.
- The e-bike model: tube frame, wheels with tyre (3 rings + cross ribs), rim, spokes and hub; battery in the down tube; hub motor; disc brake with caliper. The caliper needs an arc-shaped body hugging the rotor edge, round piston faces, pads following the rotor curve and vent holes on the rotor.

## End card

After the lockup: film title, SCI-FI HOLOGRAM HUD, Lemo-Opuscar, LemoLab × Claude Opus 5.5 and credits, each line rolling in. The LemoLab sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/hologram-hud/demo/
  content.json          all text, numbers, colours, model path, voice lines   content_alt.json   the swap test (drone)
  engine/holo.js        wireframe engine (projection, scan, explode, Fresnel faces, glow, pad, scan plane, normalise, modelFromPath)
  engine/hud.js         HUD layer (target box, leader, rolling text, spec card, chip, marker, beam, subtitle, chrome, glitch)
  models/mkmodel.mjs    primitive builder (tube, ring, disc, box, saddle, fender, wheel, cells, stator, rotor, caliper…)
  models/gen_volt.mjs   the e-bike    models/gen_kite.mjs   the drone
  film.js               timeline + cameras + states (only calls the engine)    frames.js   engine demo scene (?scene=star)
  music/score.py        original score from timeline.json    mix.py   UI + mechanical foley + ambience + voice + ducking
  tools/                make_lines.mjs export.mjs cuecheck.py final_asr.py
```
1. Write the model generator (parts → pieces with explode vectors; `internal`, `hot`, `box:false`, `anchor`, `center`, `tagDir`), then `content.json`.
2. `tools/export.mjs` dumps `events.json` / `timeline.json` / subtitles. Hand `timeline.json` and the cue map to a music sub-agent while you animate.
3. Review stills (`node core/render/still.mjs <demo> t… [--q content=…]`) and 1 s contact sheets, twice, plus strips around every lock, whip, silence and ignition.
4. `sh demo/build.sh` rebuilds everything: model → TTS → whisper → export → score → cuecheck → mix → srt → render (~45 s for 936 frames with 2 workers; whip frames cost 5×) → mux (−14 LUFS, grain 0) → final whisper check.

Pitfalls:
- Scrolling the interlace with `setTransform(…, offset)` and then `destination-in` clears everything outside the shifted rect → `offset % patternHeight`, or the fills vanish after the first second.
- The brake hose inflates the target box → `box:false`.
- Hotspot labels on long diagonal leaders read as pointing to the wrong part → ring on the part body, chip beside it, flash the part.
- A whip written inside the next segment plays as a hard cut → start it in the previous segment and check a 0.1 s frame strip.
- Mount every part: the light on a bracket, the saddle on a clamp; in the swap model, give the drone's landing legs belly mounts and fold hinges at the arm roots, or they start outside the hull.
- Two parallel boxes moving together (cover and cells) don't read as an explode: slide the cover, keep the cells.
- Rolls, servos and the confirm chord sit in the voice band (300–4 kHz): without ducking they are only 3 dB under the voice.
- A beam drawn from separate shapes gives dark wedges or double-bright seams → one path with three subpaths, nonzero winding.
- Scan-erase must clip the translucent faces as well as the edges, or the faces linger.

## content.json fields

Every word, number, colour and the model come from `demo/content.json`; the code holds no copy text. Swapping it re-flows the timeline, music, cues and rail spacing, which makes it a good **technical check** of the engine. It is not how a user's film is made: a user's film gets its own treatment, order, camera path and timeline (STYLE.md §11).

| Field | Type | Allowed | If out of range |
|---|---|---|---|
| `product` | string | 1–10 chars | Longer names still roll, but 176 px type will overflow the 410 px column: keep it short or lower the size in `titleBlock` |
| `model_code`, `category` | string | ≤ 30 chars together | Shown in mono 22 px on one line |
| `tagline` | string | ≤ 60 chars | Auto-wraps at 420 px and shrinks to 20 px |
| `model` | path | a model JSON (below) | Any size: it is normalised. Parts named in `callouts[].part` must exist |
| `hue`, `accent` | 0–360 | any | The whole film re-themes |
| `voice` | `{id, speed}` | a Kokoro voice | Check with whisper |
| `intro_vo`, `outro_vo`, `callouts[].vo` | string | intro ≤ 5 s spoken; part 1 ≤ 4.8 s; other parts ≤ 3.5 s | Subtitles are clamped to the next line; longer lines overlap the next lock |
| `*_vo_asr` / `callouts[].vo_asr` | string | optional | What whisper should hear (digits etc.) |
| `callouts[]` | array | **2–5** items: `part`, `label` (≤ 24 chars), `value` (≤ 6 chars), `unit` (≤ 4), `detail` (≤ 40, optional), `vo` | Part 1 gets 3 bars, the others 2 bars each. More than 5 won't fit the rail |
| `footer.weight`, `footer.price` | `{label, value, unit}` | value ≤ 7 chars | Auto-fits down to 40 px |
| `footer.cta` | string | ≤ 34 chars | Auto-fits down to 14 px |
| `film_title`, `credits[]` | strings | | End card |

Parts in the model can set `tagDir: -1` so the lockup hotspot chip sits to the left of its ring.

The check, from the repo root (voice, whisper check, score, cue check, mix, subtitles, render and mux for the other content):
```
CONTENT=content_alt.json NAME=kite sh styles/hologram-hud/demo/build.sh
```
Outputs go to `demo/out/kite/` (`kite.mp4`, `kite.srt`, `poster.jpg`). The swap test (a four-part folding drone in blue / orange) runs 43 s, 4 parts, −14.0 LUFS, 0 cue mismatches; stills `demo/stills/alt_title.jpg`, `alt_signature.jpg`, `alt_lockup.jpg`. Preview content without building: `node core/render/still.mjs styles/hologram-hud/demo 12 --q content=<file>.json`.

Minimal content example (two parts):
```json
{ "product": "ORBIT", "model_code": "S1", "category": "Smart speaker", "tagline": "Room-filling sound.",
  "model": "models/orbit.json", "hue": 170, "accent": 40,
  "voice": { "id": "af_heart", "speed": 1.0 }, "intro_vo": "This is Orbit.",
  "callouts": [
    { "part": "driver", "label": "Woofer", "value": "4", "unit": "in", "vo": "A four inch woofer." },
    { "part": "mics", "label": "Far-field mics", "value": "6", "unit": "", "vo": "Six microphones hear you across the room." } ],
  "footer": { "weight": { "label": "Weight", "value": "1.2", "unit": "kg" }, "price": { "label": "From", "value": "199", "unit": "USD" }, "cta": "Available now" },
  "outro_vo": "Orbit. Available now.", "film_title": "Orbit · Spec Scan", "credits": ["…"] }
```

## Engine reference

The engine draws **any shape** in this style. Give it a wireframe (vertices, edges, optional quads), or build one from a 2D path with `modelFromPath`. For your own object, write a generator with the primitives in `models/mkmodel.mjs` (or convert a CAD export into the format below).

**`engine/holo.js`**
| Function | Purpose |
|---|---|
| `loadModel(url, {normalize=true, diag=2.3117})` | Load a model JSON, prepare typed arrays, and **normalise** it to the stage size (bounding-box diagonal) so cameras work for any product |
| `prepModel(json)` / `normalizeModel(m, diag)` | The same for in-memory models |
| `modelFromPath(pts2d, {depth, id, slices, explode})` | Extrude any closed 2D path into a wireframe body with side faces |
| `makeCamera(cam, W, H)` | `{project(x,y,z,out)}` for cam `{target, yaw, pitch, dist, fov, cx, cy, roll}` |
| `new Holo(W,H).draw(ctx, model, cam, opts)` | Draw with glow. opts: `hue`, `spin` (turntable), `scan:{y,band}` (grow up to y), `scanDown:{y}` (erase down to y), `explode:{partOrPiece:0–1}`, `angle:{piece:rad}` (spin about piece.axis), `solid:0–1`, `wave:{y,w}`, `focus`+`dim`, `flash:{part:0–1}`, `keep:{piece:'#hex'}` (**the single-colour exception**), `lineWidth`, `gain`, `glow`, `only`. Returns `{bbox:{part:[x0,y0,x1,y1]}, anchor:{part:[sx,sy,z]}}` |
| `drawPad(ctx, cam, W, H, {hue, rot, alpha})` / `drawScanPlane(ctx, cam, W, H, y, {hue, r, rot, alpha})` | The projector pad and the scan plane |

**`engine/hud.js`**: `theme(hue, accent)`, `background`, `vignette`, `chrome`, `plate(ctx,T,x,y,w,h,a)` (dark text plate), `targetBox(ctx,T,bbox,k,{flash,tag,lockK})`, `leader(ctx,T,from,elbow,to,prog,{pulse})`, `rollText(str,k,frame)`, `monoText`, `specCard(ctx,T,x,y,{label,value,unit,detail},{reveal,roll,detail,frame,flash})`, `chip`, `marker(ctx,T,p,label,a,pulse,dir)`, `beam(ctx,T,project,a,t,{y1})`, `subtitle`, `glitch`, `fitFont`, `wrap`.

Minimal example: a warm-orange `#D97757` four-point star with a cursor tail, scanned in and then locked (`demo/frames.js`, `?scene=star`):
```js
import { Holo, modelFromPath, normalizeModel } from './engine/holo.js';
import * as U from './engine/hud.js';
const P = []; for (let i = 0; i < 8; i++) { const a = Math.PI/2 + i*Math.PI/4, r = i % 2 ? .16 : .5; P.push([Math.cos(a)*r, Math.sin(a)*r + .6]); }
const star = modelFromPath(P, { depth: .12, id: 'star' });
const tail = modelFromPath([[.62,.1],[.7,.1],[.7,.55],[.62,.55]], { depth: .06, id: 'caret' });
const m = { parts: [...star.parts, ...tail.parts] }; m.byId = Object.fromEntries(m.parts.map(p => [p.id, p])); normalizeModel(m, 1.6);
const T = U.theme(188, 38), cam = { target:[0,.55,0], yaw:.6, pitch:.18, dist:2.6, fov:.6, cx:960, cy:540 };
const info = new Holo(1920,1080).draw(ctx, m, cam, { hue: T.hue, scan: { y: .8 }, keep: { star: '#D97757' } });
U.targetBox(ctx, T, info.bbox.star, 1, { tag: 'TGT 01 · LOCK' });
```

**Model data format** (one JSON file, metres, **y up**, x = the product's front, z = towards the viewer's side; any scale works, because it is normalised on load):
```json
{ "name": "VOLT CE-01",
  "parts": [                                   // part = one thing a callout can target (battery, motor, brakes…)
    { "id": "brakes",                          // referenced by content.json callouts[].part
      "anchor": [0.527, 0.416, 0.09],          // hotspot: where leader lines and the lockup ring land (ON the part's surface)
      "center": [0.524, 0.428, 0.08],          // optional: what the close-up / loupe camera looks at (defaults to anchor)
      "tagDir": -1,                            // optional: lockup number chip left (-1) or right (1) of the ring
      "pieces": [                              // piece = a rigid sub-assembly that moves on its own in the explode
        { "id": "brake-caliperA",
          "v": [x0,y0,z0, x1,y1,z1, …],        // vertices, flat
          "e": [0,1, 1,2, …],                  // edges: index pairs into v (the wireframe lines)
          "q": [0,1,5,4, …],                   // optional quads: 4 indices each (the translucent solid-hologram faces + Fresnel)
          "explode": [0, 0, 0.10],             // offset at explode = 1, along the assembly axis
          "axis": { "c": [x,y,z], "d": [0,0,1] }, // optional spin axis (rotors, fans)
          "internal": true,                    // optional: hidden until the part opens (cells, stator)
          "hot": true,                         // optional: glows near-white while open (the thing that makes the number true)
          "box": false }                       // optional: excluded from the target-box bounds (long hoses, cables)
      ] } ] }
```
Rules: every piece must physically touch its neighbour. Tubes are rings plus longitudinal lines. Keep the total around 5k vertices / 6k edges for fast renders. Give the part that carries the key number a `hot` inner piece and a shell that slides *along its own axis*.
