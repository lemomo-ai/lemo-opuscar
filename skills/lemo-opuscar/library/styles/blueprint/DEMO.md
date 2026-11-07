# Blueprint — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Patent Pending: The Cloud Catcher* (46.7 s) · `blueprint.mp4` · source in [`demo/`](demo/)


## Story & structure

An inventor's patent drawing of a cloud-catching machine: it is drawn, exploded, runs perfectly, but there are no clouds; the hand revises the drawing, the revision cloud becomes a real rain cloud, it rains on the drawn garden and a flower grows. The style's story powers, as noted for this demo:

The whole film happens **on one sheet of blueprint paper** lying on a dark drafting table. Everything is white line work on uneven Prussian blue: centre lines, outlines, hatching, dimension lines, leader lines with numbered balloons, a title block and a notes column. The camera moves over the sheet like an eye reading a drawing. It is a **2D line-drawing language**. You may use orthographic and oblique/isometric projection, but **never 3D rendering**.

The charm is the tension between **rigorous engineering convention** and **whimsy**. The drawing is dry and exact. The notes carry the jokes ("10 · COUNTERWEIGHT (GRANDMOTHER'S IRON)"). And once per film, a drawing symbol breaks the rules and becomes real.

Learn grammar from, but never copy: the moving technical drawings in Prologue Films' *Iron Man* (2008) end credits, Leonardo's *Codex Atlanticus* pages, 19th-century US patent drawings (Fig. 1 / Fig. 2, part balloons, fine-line shading) and the automaton drawings in *Hugo* (2011). No Marvel elements, no real patents, no real inventor's machine or signature.

The machine (or object, or plan) **is the character**. Parts act: a boom lifts hopefully or droops, a weather vane perks up or sags, bellows breathe, a gauge needle twitches at zero. The inventor appears only as a **hand shadow with a pen tip**, or as a signature.

| Native power | How the demo used it |
|---|---|
| **Drafting order** | The object draws itself the way an engineer would: centre lines → outlines → gears/detail → hatching → dimensions → balloons → label. Each layer lands on a beat. |
| **Live annotations** | Dimension lines measure moving parts and the numbers change. Leader lines and balloons fly with exploded parts. A section line A–A sweeps across a housing and reveals the inside. |
| **Fig. numbers as transitions** | "FIG. 1" gets struck through and rewritten "FIG. 2 · EXPLODED VIEW", then "FIG. 3 · IN OPERATION". |
| **Projection is a camera** | Animate the oblique depth factor from 0 (flat elevation) to 0.5. The line drawing "turns" and gains thickness, with no 3D renderer. Exploded parts fly along the depth axis. |
| **Drawing symbols made real** (put this at the emotional peak) | A revision cloud becomes a real rain cloud. Other candidates: a dimension arrow becomes a real arrow, a hatch pattern becomes rain, a centre line becomes a road, a weld symbol sparks. Rule: **this one symbol is the only thing in the film that leaves the drawing language.** It gets soft volume, gradient, glow, and a shadow that falls across the drawing's lines. |
| **Cyanotype and water** | Rain on the sheet: each drop blooms deeper blue with a pale tide line, and white lines inside the stain go soft. A drop on the signature makes it bleed. |
| **The title block** | Title card = sheet header. Status field = the story's verdict (a red rubber stamp is the film's only non-blue colour). End card = the title block's last row being lettered in (STYLE / DRAWN BY). |

**How the topic is adapted** (and the same recipe for others): turn the topic into **something designed** and let the drawing find a flaw that only the drawing can fix. A product launch becomes Fig. 1, exploded view, operation, then a revision that adds the missing feature. A love story: two machines on one sheet, and a revision cloud draws the bridge. A history lesson: a city plan revised again and again (REV. 1, 2, 3).

**Demo emotional arc (46.7 s):** curiosity (blank sheet, the object is drawn) → pride (exploded view) → excitement (it runs, on the beat) → the flaw (it works perfectly but the world lacks something; music stops) → the hand revises the drawing → **the symbol becomes real** (suspended chord, no voice) → payoff → echo (stamp, signature, title block).

## Shots

| Beat | Camera |
|---|---|
| Opening | Whole sheet on the dark table. The roll snaps open, then the T-square. Establishing shot only. |
| Title | Push to the header lettering. |
| Drawing | Medium on Fig. 1, machine ~80% of frame height, empty sky on the right (subtitles live there). |
| Exploded view | Pull back so the machine is centre-left and the parts list peeks in on the right. |
| Operation (the memorable shot) | Cut to a 2× close-up of crank and gears, then **track along the drive chain** up the mast to the boom and follow the net's arc. The camera follows the path of force. |
| The flaw | Medium-wide with lots of empty sky. The emptiness is the joke. |
| Revision | Locked-off while the hand shadow draws. Hold one beat on the finished symbol. |
| Symbol comes alive | Slow push-in, no voice. |
| Payoff | Follow the object down to the target, push in on the result (the flower). |
| Ending | Pull back to the whole sheet (scale reveal). The stamp lands in the wide. Push to the title block for the end card. |

Keep storytelling shots close. Only the opening and closing establishing shots are full-sheet.

Demo motion numbers: exploded parts leave one every ~0.055 of the progress on eighth notes and come back one eighth note per group with a brass click; gears advance 7.5° (one tooth) per eighth note with a 0.35-beat ease-out; bellows breathe per beat; failure over ~1.5 s (gears slow, bellows deflate, boom sags, vane droops); joy = vane snaps upright, needle overshoots to 1. The motion rules:

- Line **draw-on** is truncated by arc length, with a small glowing nib at the head. Stagger items within a layer. Each layer starts on a beat.
- **Exploded view**: parts leave in sequence, one every ~0.055 of the progress, on eighth notes, with eased motion. The camera pulls back to make room. Parts come back **one eighth note per group with a brass click**.
- **Mechanisms step on the grid**: gears advance one tooth (7.5°) per eighth note with a 0.35-beat ease-out, like an escapement. Meshing phase is computed so teeth really interlock. Chain links move with the pinion. Bellows breathe per beat.
- **Machine acting**: boom angle, vane droop, bellows volume and gauge needle are the face. Failure means the gears slow, the bellows deflate, the boom sags and the vane droops over ~1.5 s. Joy means the vane snaps upright and the needle overshoots (back-ease) to 1.
- **Camera moves on ones (24 fps)**, continuous within a section, with hard cuts on downbeats between sections. Two tiny camera bumps: the paper slap and the stamp.

## Score structure

- **Music**: two-part **baroque invention** at 108 BPM in G major. Harpsichord theme (a one-bar sixteenth-note "gear" motive), bassoon staccato imitating two octaves below.
  - Operation adds violins and cellos spiccato eighths ("gears biting").
  - The flaw: instruments drop out with a written-out ritardando, then true digital silence.
  - The revision is silent except for a three-note questioning figure.
  - The miracle holds a Dsus4 string chord with two breathing swells, unresolved.
  - The catch resolves to G on the downbeat.
  - Rain uses harp and harpsichord arpeggios.
  - A short full cadence lands on the stamp, and the theme returns in augmentation for the end card.
  - Rendered with `core/audio/sampler.py`: VCSL harpsichord and harp, VSCO 2 CE bassoon, strings and spiccato.
- **Foley follows materials**:
  - Paper: roll unroll crackle and slap, T-square wood slide, technical pen scratch (2–6 kHz grain, length = stroke length), lettering (bursts of short strokes), compass squeak, hatching (13 strokes/s).
  - Brass and wood: part clicks (3.1 / 5.2 kHz resonances), escapement ticks, chain rattle, bellows breath, wind-down ticks that slow by ×1.35.
  - The magic moment: soft paper "puffs" on the two breaths, a noise swell, nothing else.
  - Water: soft damped pats per drop plus a light rain bed.
  - Rubber stamp thump, pen cap click at the very end.
- **Voice**: dry-humoured British engineer reading his own design notes, Kokoro `bm_daniel`, `lang en-gb`, speed 0.9. Five or six short lines. Keep the climax voiceless.
- **Mix**: music ducks to ~0.36 under voice and foley ducks by half. Whooshes low-passed at 2.5 kHz (unfiltered, they mask "bellows" in whisper). −14 LUFS. `mux.sh` grain 4 (the paper grain is in the image already).

## Palette & props

- **Sheet**: 3200 × 2200 units, folded in quarters. The blue is procedural in a WebGL fragment shader in *sheet coordinates*, so it stays crisp at any zoom. Low-frequency fbm between `#18336B` and `#2A58A6`, horizontal coating streaks, a slight left-to-right fade, fibre noise, sparse fibres, fold creases (bright edge, dark edge, worn whitening along the fold), irregular bleached edges and corners, small specks. Outside the sheet: dark drafting cloth `#0D1116` with a drop shadow.
- **Lines**: pale blue-white `#E7F0F9`, slightly soft (mipmap bleed), with a faint ink breakup driven by paper grain.
  - Weights in sheet units: outline 3.2, detail 2.0, thin 1.25, hair 0.9.
  - **Screen width = sheet width × zoom^0.65.** Close-ups do not turn into sausages and wides do not vanish.
  - Dashes: centre line `[34,7,6,7]`, hidden `[11,7]`, phantom (cutting plane) `[30,6,5,6,5,6]`, all scaled with zoom so the pattern stays on the paper.
- **Occlusion**: every solid is filled with "paper" (black in the ink buffer) before its outline is stroked, painter's order. Extrusion in oblique uses a sweep: stroke the outline at N depth steps at 2× width, then fill the same N steps with paper. What survives is a clean silhouette of half width. Front face and visible vertex connectors are drawn on top.
- **Composite**: the ink canvas is greyscale (white = exposed line). The fx canvas has R = shadow darkening, G = wetness, B = stamp ink, and is added with `lighter`. The overlay canvas holds subtitles. Shadows darken lines too, which is how a lifted object proves it has left the paper. To keep an object from being darkened by its own shadow, multiply its area by `rgb(0,255,255)` on the fx canvas.
- **Hatching** (fine-line shading) for sections, soil and the counterweight, at 45°, spacing 8–14 units.
- **The magic object** (climax only): union of circles (15 scallops plus 4 inner lobes).
  - Flat state: an outward-scalloped revision cloud.
  - Puffed state: one radial gradient across the whole union (top-left light) plus small highlights on the top lobes, a blurred white glow, engraved crescent shading on the lower right (mask = union minus the union shifted up-left), and a thicker outline on the shadow side.
  - It leaves a pale "unexposed imprint" where it was drawn. Its shadow offset grows with lift (up to ~240 units down).
- **Palette discipline**: blue and white only. One stamp red `#C23B2E`, used exactly once.
- **Typography** (all OFL):
  - Architects Daughter for hand lettering (header, labels, notes, subtitles).
  - B612 / B612 Bold for title-block fields and "PATENT PENDING".
  - Allura for the signature.
  - Text is written on left to right with a glowing nib.

## Titles & subtitles

- **Subtitles are drawing notes**: a light box (rgba(12,28,62,.58), 1.2 px outer and 0.8 px inner white rule, ~110–150 px tall), a "NOTE / n" cell in B612 Bold, the text in Architects Daughter 38 px written on in 0.35 s, and a small leader tick at the lower-left corner.
  - **Position per shot, in empty sky**, never fixed to the bottom. The bottom of the frame is where the ground line, base and title block live.
  - Wrap at ~880 px.
- Every subtitle is also lettered into the sheet's **GENERAL NOTES** column (under the fixed notes "ALL DIMENSIONS IN MILLIMETRES." and "DO NOT SCALE DRAWING."), so the final wide shows the whole voiceover as drawing notes.
- **Title**: the sheet header (Architects Daughter 132 units, letter-spaced, double underline), with PATENT PENDING and a subtitle line in B612.

## End card

**End card**: the title block. The last row is lettered in: STYLE: BLUEPRINT / DRAWN BY: LemoLab × Claude Opus 5.5. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/blueprint/demo/
  paper.js    WebGL2 compositor: procedural cyanotype sheet, ink bleed, wet stains, shadows, stamp, roll
  draw.js     drafting engine: camera, oblique projection, draw-on polylines, solids, hatching, dims, balloons, text
  machine.js  the Cloud Catcher: parts, gear meshing, explode offsets and paths, garden and flower
  sheet.js    border, header, title block, parts list, notes, revision cloud ↔ cloud, rain, hand shadow, stamp
  film.js     the whole timeline (108 BPM grid): cameras, acting, subtitles, sound events
  main.js     page entry (?frame=1|2|3 gate frames, ?nosub, ?poster)
  mix.py      foley + voice + music ducking       music/score.py  original score (sampler)
  tools/      subs.mjs (SUBS → subs.json), check_mix.py (whisper on the final mix)
```

1. `node core/render/still.mjs styles/blueprint/demo --range 0:46:1.5` then `sheet.py` to review. Iterate per section.
2. `.venv/bin/python core/tts/tts.py lines.json voices`, then `asr_check.py` (6/6 OK).
3. `node core/render/events.mjs`, then `music/score.py`, then `mix.py`, then `tools/check_mix.py`.
4. `node core/render/video.mjs styles/blueprint/demo --fps 24 --workers 3` (1120 frames, Canvas2D + WebGL, ~30 s).
5. `sh core/render/mux.sh out/video24.mp4 mix.wav blueprint.mp4 24 4`. Or run everything with `sh styles/blueprint/demo/build.sh`.

### Pitfalls

- **The machine near the sheet edge**: wide shots show the desk. Put the main figure at least `960/zoom` from any sheet edge you will frame in a wide, or make the sheet bigger (for this demo 3200×2000 is too small: use 3200×2200 and keep the machine toward the right).
- **Explosions that go up hit the header.** Explode mostly upward and sideways, and flatten the boom during the explode so the net extends sideways.
- **Subtitles on the ink canvas** vanish off-sheet and cannot occlude lines. Use a separate overlay texture composited last (premultiplied alpha).
- **The magic object darkened by its own shadow.** Multiply its area on the fx canvas with `rgb(0,255,255)` to zero the shadow channel only.
- **Per-lobe shading makes "grapes" or bubble wrap.** Use one gradient across the union, crescents from a union-minus-shifted-union mask, and arcs only on the upper inner lobes.
- **Overlapping additive circle fills make bubbles.** Fill a union as one path with `fill('nonzero')`.
- **Scallop arcs drawn the wrong way round look like a starburst.** Choose the arc direction that contains the lobe's outward angle.
- **A half-puffed cloud looks like a donut.** Grow the inner lobes early (`r × min(1, pf × 2.2)`).
- **The payoff must be big.** A small clump in the lower third undersells the emotional return. Give the payoff object ~1/3 of frame height, centred, drawn stroke by stroke (stem → leaves → one petal per beat), with visible stains around it. Keep subtitles off it.
- **A caught object shows through the net.** Don't paint the net over it wholesale: fill the bag below the front rim with the object's body, then draw mesh and front rim on top, and skip the back rim.
- `sfx.thump()` is 0.35 s long: pad before adding to longer buffers.
- Whisper reads "Figure one" as "Figure 1": use an `asr` field in `lines.json`.
- **A stray file at the repo root**: always write with absolute paths inside your style dir.
