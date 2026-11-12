# 1-bit Dither — Style Prompt

> A real 3D world shown with exactly two inks: every grey becomes a pattern of dots that is fixed to the surfaces, outlines come from depth and normal breaks, and printed things (fax prints, newspapers, labels) carry their own physical dots. The camera moves freely through it; the pattern never swims.
> References (grammar only): 1-bit computer games with first-person 3D (the ordered-dither look of *Return of the Obra Dinn*), early Macintosh dithered graphics, wire-photo and facsimile prints, newspaper halftone screens. Copy none of their characters, scenes, fonts or palettes, and never name them in the film.

## 1. Essence, and what it is not

- **Two inks, no grey.** Every pixel is ink or paper. Tone is density of dots; there is no anti-aliasing, no grey text, no soft gradient on screen.
- **The dots belong to the surface.** The dither threshold is attached to each object (object-space, octave chosen from the screen footprint), so when the camera dollies or an object turns, the pattern rides with it like a printed texture.
- **Drawn edges.** Depth and normal breaks become one-pixel lines: ink where the surface is light, paper where it is dark. A black object against a black sky still has a white rim.
- **Each medium has its own dot.** The world is ordered dither (8×8 Bayer); a fax or photo print is error diffusion (organic Atkinson dots) at a fixed physical pitch; a newspaper photo is a 45° halftone screen whose dot size follows tone. When the camera passes from one medium to another, the kind of dot changes with it.
- **Low internal resolution, large shapes.** The frame is rendered at 960×540 and scaled up with nearest neighbour; detail is chosen for that grid.

Not Halftone Dossier (that is printed paper and flat collage, not a navigable 3D world), not Woodcut or Copperplate (carved line, not dot density), not CRT ASCII Terminal (no glyph cells, no phosphor), not a greyscale render with a filter on top.

## 2. Materials & rendering

- **Three passes.** (1) Shading: the scene with ordinary lights and shadows into a half-float target at 960×540. (2) G-buffer: an override material writes octahedral normal, the surface-anchored Bayer threshold and view depth (negative depth marks layers that get no outline: sky, glows, sparkles). (3) 1-bit: luminance → gamma → `smoothstep(lo, hi)` → compared with the threshold; outlines from depth/normal breaks; optional depth of field gathered from the shading before thresholding.
- **Anchoring the threshold.** Project the object-space position (times the object's scale) on its dominant object-space axis; pick the Bayer octave per axis so a cell is 1–2 screen pixels along each surface direction, blend to the next octave. This is what keeps grazing ground planes and spinning drums from crawling.
- **Printed paper.** Paper textures hold ink 0 / paper 1 at a fixed pitch (a print's dots, a page's letters). When a texel covers more than ~2 screen pixels, the bilinear value is thresholded, so magnified print reads as crisp dots and letters; when minified, the mip tone passes through and the surface dither takes over. Text paper biases that threshold towards ink so thin strokes survive.
- **Halftone screen.** A shader cell grid at 45°, dot radius from the tone at the cell centre; large cells are hard dots, cells under ~3 px fall back to tone. The same mechanism lets a camera fall from a single dot to a whole town without moiré.
- **Light is the only drama.** Hard key light with real shadow maps (a low sun, a desk lamp, headlights), little or no ambient fill. Shadows are solid ink; lit faces are sparse dots. Emissive things (a phosphor trace, frost sparkles, lamps) are white and get no outline.
- **Screen space only for cuts and transitions**, and every transition stays two-ink on every frame: a block dissolve (whole 16–32 px cells swap at once), a fax-scan wipe (the next picture replaces the frame row by row under a two-row inverted scan head), a full-frame inversion, a coarse-cell resolve (cells halving 32 → 16 → 8 → 4 → 2 → 1 px, a few frames per level, each cell splitting into four). Everything else is in the world.

## 3. Colour logic

- **Exactly two colours on screen**, chosen once per film: a near-black ink and a paper white with a slight tint (warm, cool or green-grey). No third colour, not even for text or the end card.
- Value is the only variable. Order the frame by value: the subject either the lightest or the darkest mass, the background in the middle density.
- Large pure-ink areas (night sky, shadow, a CRT face) are the strongest graphic element; keep one in most frames.
- Inversion (ink and paper swapped for one or two frames) is the medium's accent: use it for an impact, never as decoration.

Example (our demo): ink #16161A, paper #E9E6D6.

## 4. Type & subtitles

- All text lives in the world: written, typed, stencilled, printed or stamped on an object, then dithered like everything else. No overlay captions.
- Text is drawn high-resolution on the object's own canvas, bold enough to survive the 960×540 grid: CJK glyphs at least 11 internal px tall where they must be read (22 px at 1080p), Latin cap height at least 9 internal px. Thin handwriting gets a stroke; typewriter faces get a stroke; condensed display faces close up below ~20 px, so stamps use a heavy sans.
- Roles: handwriting for logs and notes (a kai-style CJK hand, a casual Latin hand), typewriter for labels, a newspaper serif or condensed grotesk for print, a heavy sans for stamps and stencils. Fonts are OFL or Apache, subset to the characters used.
- Bilingual lines: one line per language, native line first and larger.
- Reading time: hold ≥ CJK characters ÷ 4.5 + other characters ÷ 15 + 1.5 s, measured from the frame where the line is fully in frame and legible. The camera may drift slowly while text is read; it may not cut or cross it.

## 5. Motion quality

- 30 fps, on ones. Because every pixel flips between two states, motion is visible as pattern change: keep camera moves smooth (spline keys, ease in and out) and avoid fast lateral pans across fine repeating structure.
- **No velocity cliffs.** A sudden stop, a start at full speed or a 0.1 s hold mid-move reads as a stutter, because the whole pattern freezes or jumps at once. Join camera segments with continuous velocity (Hermite or Bézier, overlap and blend two segments), start a shot after a cut from rest or at the speed the cut implies, slow an orbit down rather than stopping it. As a reference, keep turns under about 3° per frame.
- **Big scale changes in log distance.** A pull-back from one dot to a town is keyed on log(distance), starts from rest and peaks around 15 % per frame; a linear pull that is fastest on its first frame smears the whole picture.
- Fine regular structure (lattice, mesh, grilles, rigging) must be built as few thick members or kept in silhouette; one-pixel lines that move produce crawling stairs.
- Things appear by being printed, lit or uncovered, not by fading: a line of print, a lamp switching on, a stamp landing with a two-frame scale pop.
- Time-lapse is natural to the medium: dither density changing steadily over a window or a sky reads as hours passing.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Macro locked to a surface | the object is the world; texture becomes landscape | a print forming; a dial; frost; a fingerprint |
| Fall through the dots | scale change between media | entering a photograph; leaving a screen; zooming into a map |
| Low glide (camera centimetres above ground) | presence, scale, long shadows crossing the lens | a landscape; a crime scene; a battlefield after |
| Orbit to backlight | revelation by silhouette and rim | an object, a monument, a figure |
| Exponential pull-back | context arriving in layers | a document to a building to a city |
| Locked frame | judgement, reading time | comparisons, verdicts, notices |
| Hard cuts on a beat | mechanical process, urgency | arrivals, a montage of hands-on steps |

Framing: keep the subject at least a third of the frame; keep large ink masses at the frame edges or as backdrop so text and subjects sit on paper-dense areas. Allowed transitions: hard cut, shape match, block dissolve, fax-scan wipe, inversion flash, coarse-cell resolve, fall through the dots. Across a dissolve or wipe both pictures hold still and share the composition. Forbidden: cross-fades through grey, per-pixel dissolves over fine dots (they read as a grey double exposure), blurs as transitions, page turns.

## 7. Sound palette

- The medium has a mechanical, printed character: clocks, relays, scanning tones, stylus scratch, paper, rubber stamps on cork, switches, motors.
- Score: small, slightly cold ensemble that can sit under mechanical sound — clarinet or bass clarinet, glockenspiel, pizzicato and bowed low strings, a slightly detuned upright piano, brushed percussion. A machine rhythm in the picture can become the pulse (a scan line as hi-hat, a sync tick as snare).
- Silence is a tool: drop all music for vacuum, night or verdict holds, keep one far, filtered element so the silence is not dead.
- Mix: effects on the cut, music under them, −16 LUFS integrated before mastering, true peak ≤ −3 dBTP, little energy below 45 Hz.

## 8. Native moves

- **Print it line by line.** A picture appears one scan line at a time on paper (fax drum, plotter, receipt). *Fits content like:* a weather chart arriving at a ship; a wanted poster on a police printer; a newborn's first scan.
- **Change of dot.** Pass the camera from world to print to page: ordered dither becomes error diffusion becomes halftone. *Fits content like:* a photograph's journey to a newspaper; a satellite image to an atlas; a painting to a postcard.
- **Fall through the dots.** Push into a printed dot until it fills the frame, resolve the next world from coarse blocks. *Fits content like:* entering a memory; going inside a map; a scan becoming the room it shows.
- **Inversion strike.** Swap ink and paper for one frame at an impact. *Fits content like:* a stamp or verdict; a camera flash; a lightning strike; a gunshot.
- **Rim in the dark.** A dark object against a dark ground gets a paper outline from the edge rule; a backlit object becomes a drawn contour. *Fits content like:* a spacecraft; a statue at night; a lighthouse.
- **Density time-lapse.** A window, sky or wall goes from dense to sparse dots over a held move. *Fits content like:* a night passing; a season; a fire dying.

Our demo opens on a low glide over frost, uses *print it line by line* and *fall through the dots* as its turn and ends on an exponential pull-back from a printed dot to the whole place. A new film opens and ends another way: an *inversion strike* that reveals the scene, a macro locked on a surface that turns out to be a landscape, an ending on a lamp switching off to leave one *rim in the dark*, or a page sliding into a drawer until ink fills the frame.

## 9. Pitfalls of the medium

- **Swimming pattern** when the threshold is screen-locked: anchor it to objects and choose octaves per axis.
- **Octave rings on large grazing planes** (fields, floors, roofs seen far off): the octave switch draws concentric bands. Put those planes on a screen-locked threshold layer; they carry no texture, so nothing swims.
- **Stencil bridges on CJK**: cutting bridges through hanzi changes the character (图 reads as 圖). Stencil Latin only, or not at all.
- **Moiré on thin repeating structure**: thicken, reduce the count, or keep it in silhouette; check adjacent frames, not single stills.
- **Grey text**: thin strokes average to paper when minified and vanish; draw text bold or stroked, bias the threshold towards ink, check at 1080p.
- **Emissive or specular lift on ink**: any emissive term or specular highlight on printed paper turns black letters into grey dots; use diffuse-only paper materials with no emission.
- **Grey from the encoder**: every lossy generation (a JPEG frame grab, then an H.264 encode, then another at the mux) smears dot edges into grey, worst on fast moves. Capture lossless frames (PNG into a lossless master) and encode once, with a low CRF and `-tune animation`; measure grey pixels per frame against the master.
- **Coarse cells that are not nested**: a resolve whose cell size steps 26, 25, 24… re-lays the whole grid every frame and flickers. Use powers of two so each step splits every cell into four.
- **Self-shadow acne** under grazing light on terrain: raise bias and normal bias; check the ground at the sun's angle.
- **Everything mid-grey**: a frame without solid ink or open paper reads as noise. Set lo/hi so the subject reaches pure ink or pure paper.
- **Small text in a busy dither**: put text on its own pale card, never directly on a mid-tone surface.

## 10. Engine

- `pipe.js` — `Pipe(renderer, w, h).render(scene, camera, target, opts)`: shading, anchored G-buffer, 1-bit pass. `opts`: `exp, lo, hi, gam, cell` (coarse resolve), `edge, edgeK, lineLum, farEdge`, `focus, ap, maxCoc` (depth of field), `screenT`. `Present.draw(a, b, mix, invert, mode, block)`: mode 0 ordered dissolve, 1 block dissolve, 2 fax-scan wipe; inversion. Layers: `L_EDGE` gets outlines, `L_FLAT` does not, `L_SCREEN` gets outlines and a screen-locked threshold (large plain planes).
- `kit.js` — `printMat(tex, {bias, text})` printed paper; `halftoneMat(tex, cells)` newspaper screen; `paperCanvas(w, h, draw)` text canvases that also return each line's rectangle for reading checks; `atkinson()` error diffusion; `screenBox()` projects a text rectangle to screen pixels.
- `prints.js` — renders a set from a fixed camera at load, reads back the tone, and turns it into prints at a chosen dot pitch (stretched or true).
- `tools/render.mjs` — lossless render: PNG screenshots → FFV1 segments → one master; `build.sh` makes the single H.264 encode.

All of these are in [`demo/`](demo/).

Minimal example (not in the demo): a lighthouse on a cliff at night, the beam a cone of `L_FLAT` glow, rocks with `MeshStandardMaterial`, a moving key light; `pipe.render(scene, cam, rt, {lo: 0.06, hi: 0.8})` then `present.draw(rt)` — the rocks keep their dots while the beam sweeps.

## 11. Variation space

The agent decides the world, the two inks, the medium chain, the camera route, the opening and ending, the pacing, and where silence falls.

- **Three structures**: a relay of media (thing → signal → print → page); one frozen instant explored by camera; a single room revisited at three times of day.
- **Three openings**: a macro of a texture that turns out to be a landscape; an inversion flash that reveals a scene; a print head writing the first line on blank paper.
- **Three endings**: pull back from a printed dot to a whole city; a lamp switching off leaving one rim of light; a page sliding into a drawer, ink filling the frame.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
