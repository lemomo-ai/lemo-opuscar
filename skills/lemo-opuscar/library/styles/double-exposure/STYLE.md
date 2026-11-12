# Double Exposure — Style Prompt

> A silhouette is a window. A dark animal shape from the first exposure holds a second photograph, the place that animal carries with it, while the world outside the shape is where it is now. Monochrome photographs, warm lamps as the only colour, and a camera that moves the outline and the world inside it at different speeds, so the window and the place slide past each other.
> References (grammar only): in-camera multiple exposure on black-and-white film (the backlit profile first, the landscape printed only into its dark parts); darkroom sandwich printing of two negatives; title sequences that merge a figure and a place into one image; wildlife film for how animals really move. Copy none of their compositions, typefaces or music; never name them in the film.

## 1. Essence, and what it is not

- **Animal silhouette × landscape.** The subject is a clean, recognisable animal profile (a horse, a fox, an owl in flight, a hare, a turtle); its fill is a real landscape or townscape photograph that belongs to it (its meadow, its marsh, the farm it grew up on, the island it returns to). The pairing is the meaning; the outline is never filled with a flat colour or a texture.
- **Two speeds.** Whenever the camera or the animal moves, the photograph inside the silhouette moves more slowly than the outline (or follows the body, never the frame). That parallax is what makes the medium move on screen.
- **The animal is alive.** It breathes, shifts its weight, lifts its head, beats its wings, swims. Its body deforms the way the real animal's body does, and the photograph inside bends with it. A rigid card sliding across the frame is the opposite of this style.
- **Monochrome photographs, warm lamps.** Licence-clean photographs (the user's own, or CC0 / public-domain files from Wikimedia Commons; check the licence on each file page) printed in black and white with a faint cool shadow / warm highlight split; the only saturated colour is the warm light of lamps, windows and city lights inside the windows.
- **Two images become one.** The medium's strongest moment is register: the place inside and the place outside slide into alignment and become a single photograph.

Not Vintage Collage (no paper cut-outs, no mixed print processes), not Ukiyo-e or Paper-cut (no flat graphic fills: the fill is always a photograph), not Shadow Puppetry (the silhouette is a window, not a lit cut-out), not a keynote (no header bars, no centred title cards, no slide transitions).

## 2. Materials & rendering

- **Silhouette masks** come from public-domain or CC0 vector silhouettes (PhyloPic is a good source for animals, but many of its images are CC BY or non-commercial: keep only those marked CC0 or Public Domain Mark), rasterised once in the page into a mask texture with three channels: R = sharp alpha (the fill), G = a blur of 2–3 % of the shape's height, B = a signed distance field where a shape needs it. G darkens the inner rim (inside × 0.4–0.6 at the edge) and makes a faint outer halo; without both the shape reads as a sticker.
- **Fills** are photographs sampled in a layer that moves with the camera at a lower depth factor than the outline (e.g. 0.6–0.85 of the outline's motion), so the inside drifts more slowly. Place the most legible band of the photograph (a ridge, a skyline, a row of lit windows) across the body, and lift the photograph's sky towards white, the way a second exposure prints into a dark shape.
- **The first exposure** (outside) is built in code from simple things: a high-key dusk sky, mist, cloud layers, the sea from below with light shafts and silt, a moonlit sea. Keep it simpler and lighter than the fill, or the two images mush.
- **Bodies deform along their own axis.** An animal's mask is sampled through a displacement field defined along its body axis (head to tail, spine line), and the photograph inside is sampled through the same field, so the place bends with the body. Cross-sections stay perpendicular to the bent spine (invert the mapping iteratively), never a shear of the whole image.
- **Swimming follows real locomotion.** When the subject swims, a fish is carangiform: the head barely moves, a wave travels from head to tail with an amplitude growing roughly with the square of the distance along the body, the tail fin lags in phase; seen from the side, the sideways sway shows mostly as foreshortening of the rear body and tail (the fin narrows as it turns away, widens as it turns back), plus a small bend of the spine so the travelling wave reads. A marine mammal (a dolphin, a whale) moves its body and flukes up and down, slowly. Forward speed surges twice per tail-beat cycle (glide and push), never a constant slide. Integrate the beat phase over time, so a change of rhythm never jumps.
- **Between two silhouettes, superimpose; never interpolate the shape.** When one animal becomes another, the second whole silhouette fades in at the same place and size while the first fades out, both drawn complete, the overlap and the two photographs blended with *screen*. A morph of the outlines (distance-field interpolation) makes an averaged, shapeless "loaf" in the middle; every frame must show a whole animal, the other whole animal, or both laid over each other.
- **Lamps** are procedural: a warm glow plus a small hot core, anchored to points in the fill photograph's own coordinates, lit one by one. They exist only inside the windows (and, after register, on the shore they belong to).
- **Post**: soft S-curve, the faintest cool shadow / warm highlight split, vignette, fine grain. Dissolves between scenes blend with *screen*, never a plain crossfade.

## 3. Colour logic

- Neutral ground: black-and-white photographs and code-drawn greys, from near-black forest to paper-white sky. Sky and water are the lightest areas outside; the fill sits darker than the outside so the silhouette holds.
- One warm hue, reserved for light inside a window: lamps, lit windows, a city at night, its reflection on the water. No orange skies, no golden-hour grading, no coloured animals.
- The warm light can grow over a film (one lamp, then a forest of them, then a whole city) to carry the arc.
- Titles may take a pale warm white; nothing else is tinted.
- Example (our demo): lamp glow rgb(255,161,82) around a pale core rgb(255,219,158); title rgb(245,230,204).

## 4. Type & subtitles

- Very little type. Subtitles are quiet: a serif (e.g. Noto Serif SC 600 for Chinese, Newsreader italic for English; both OFL), Chinese about 36 px over English about 28 px, one line each, on a barely visible soft shadow; no box, no outline.
- Subtitles sit in the empty part of the outside world (sky, water, snow), never across the silhouette's fill; move them per cue (bottom left, bottom right) when the animal occupies a corner.
- Titles and credits are developed like a print: they appear blurred and sharpen, baked into the image so they take the grade, vignette and grain. A vertical Chinese title works well beside a wide horizon.
- Reading time: every cue holds ≥ max(1.8 s, speech + 0.6 s); title and credit pass `readcheck.mjs`.

## 5. Motion quality

- On ones, smooth, everything a pure function of time.
- Animals: breathing, weight shifts between legs, a head lift, wing beats with small tip flex between beats, swimming as in §2. Leaps have a wind-up, a fast exit and a slower landing with splash or settle; nothing rises in a straight line.
- Inner photographs move slowly and continuously and never cut on their own.
- Lamps light in a direction that follows the body (head to tail, one cabin after another), each with a small swell.
- Alignments ease out: the last pixels take the longest. Moves start and stop with ease; no jump at the start of a move.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Tracking with the animal, the fill slower than the outline | the window and the place sliding apart | a journey; a migration; memory against the present |
| Push into the silhouette until its edge leaves the frame | entering the place it carries | a change of chapter; a hand-over to the next subject |
| Pull back from inside to reveal the outline | "this place was inside an animal" | a reveal; a change of narrator |
| Whip upwards with motion blur | a sudden change of altitude or scene | from ground to sky; a cry, a leap |
| Push and return during a gesture (a wing beat, a turn) | weight and scale | a climax inside one shot |
| Crossing a surface (waterline, cloud layer) in one move | one continuous world | a breach; a dive; a landing |
| Locked frame, only the inner layer and the light moving | waiting for alignment | register; an arrival; an ending |

Framing: the silhouette fills at least a third of the frame height whenever its fill must be read, and at least part of the outline stays in frame even when the fill covers the screen. A new shot of an animal starts with the whole animal readable, never a fragment that could be mistaken for a render error. Allowed transitions: screen-blend double-exposure dissolve, push through the window, pull-out reveal, whip, a continuous camera move across a surface, a silhouette-to-silhouette superimposition. No wipes, page turns, slides or white flashes.

## 7. Sound palette

- The shutter is the medium's sound: a click when an image develops into a shape, another when two images become one.
- Strings for the bed (cello, double bass, violas, violins), one harmonic colour per subject; harp, glockenspiel or bowed vibraphone for each lamp; horn, clarinet, cello pizzicato for character; bass drum or timpani sparingly for a whip, a dive, a breach.
- Foley of each place inside the windows: wind, water (muffled under it), the animal's own call, wing beats or hoofbeats, a town's bells, rain. Procedural is fine.
- Silence is a tool: thin the music before an alignment and let the light carry it.
- Mix: voice compressed and about 10 dB over the music by RMS, the music giving way at 300 Hz–4 kHz under it; music bed about −16 LUFS before mastering, −14 at the mux, true peak ≤ −1 dBTP.

## 8. Native moves

- **The window.** A silhouette filled with the place it belongs to, sliding at a different speed from its outline. *Fits content like:* an emigrant's profile holding a hometown street; a train carrying its destination; a migratory bird carrying its breeding marsh.
- **Develop the second exposure.** The shape stands dark first, then on a shutter click the photograph prints into it, rising from the bottom. *Fits content like:* a memory arriving; a product showing what it is for; a building filling with its history.
- **Through the window.** The camera pushes into the shape until the fill is the whole frame, which becomes the next scene. *Fits content like:* entering a person's memory; going from a map to a city; a chapter hand-over.
- **Lamps inside.** Points of warm light come on one by one inside the fill, following the body. *Fits content like:* a town waking up; members of a network joining; a list counted without numbers.
- **Superimpose, don't morph.** One whole silhouette fades in over another at the same place, their fills screen-blended, the motion rhythm handing over continuously. *Fits content like:* a child becoming an adult; a seed becoming a tree; one company becoming another.
- **Cross the surface.** One continuous move through a waterline or a cloud layer, the animal on one trajectory above and below. *Fits content like:* a launch; a diver surfacing; a plane breaking through cloud.
- **Register.** The place inside and the place outside slide into alignment and become one photograph; the outline loosens to a faint veil and a thin warm line. *Fits content like:* arriving home; a plan becoming a building; a forecast met by the day.

Our demo opens on *develop the second exposure*, hands from one subject to the next *through the window* and with *superimpose, don't morph*, uses *cross the surface* as its climax and ends on *register*. A new film opens and ends another way: a fill already full screen that the camera pulls out of, a lamp lighting in darkness that turns out to be inside an outline, an ending where the silhouette walks out of frame and leaves its inner place behind, or the camera pushing into one last window and staying there.

## 9. Pitfalls of the medium

- **Mush.** Two busy photographs overlaid read as grey noise. Fix: one side simple (sky, water, mist), the other detailed; outside lighter than inside; rim darkening and halo.
- **Sticker silhouettes.** A hard-edged shape sliding at constant speed reads as a cut-out on a background. Fix: rim and halo, a slower fill, and a body that deforms with its locomotion.
- **Shear instead of swimming.** Offsetting the mask's sampling with a sine makes the whole body shear left and right while the photograph stays fixed. Fix: a displacement field along the body axis, sections perpendicular to the spine, the fill sampled through the same field.
- **The averaged loaf.** Interpolating two outlines gives an in-between shape that is neither animal. Fix: superimpose the two whole silhouettes (§2).
- **Features in the wrong place.** A bright window in the photograph landing on an eye, a gill or a fin reads as a light bulb or as something poking through the outline. Fix: move the photograph so the lit band crosses the middle of the body, darken thin parts (fins, tail, head) through the blurred mask, add a faint dark eye.
- **Unreadable fills.** The photograph's sky becomes a flat grey band inside the body. Fix: place the strongest band across the body; lift the sky.
- **Misaligned "same place".** Two different photographs never register. Fix: one photograph used twice, inside and outside, with two grades or keyed differently (lit buildings for the shore, a broken reflection for the water).
- **Mirrored tiling seams** when a photograph fills a long shape. Fix: scale the photograph to the shape, keep any seam outside the frame.
- **Colour creep.** Any warm sky or tinted water dilutes the lamps. Fix: keep every non-lamp element neutral.

## 10. Engine

The demo's code is all in `demo/index.html` (WebGL2; each scene is one full-screen fragment shader into a float target, then a composite pass). The names below are the demo's subjects (its stag, fish and whale); your film draws its own:

- `COMMON`: camera with depth factors (`Wc`, `W`, `Sc`: the same world sampled at different depths gives the parallax), `silUV()` and `sampleMask()` (silhouette transform `(x, y, height, angle)` and the R/G/B mask), `photo()` / `photoC()`, `lights()` (warm lamps from a uniform list), `whaleWarp()` (vertical body wave with fluke pitch).
- `FS4`: the fish skeleton (`fEnv`, `fBend`, `fYaw`, `fishRest`: carangiform swimming by inverse mapping along the body axis) and the fish-to-whale superimposition.
- `FS3`: the whale over the sea and register (inside photograph moving from layer coordinates to screen coordinates with its waterline on the horizon; the same photograph keyed for the shore and broken for the reflection).
- `FSC`: composite (screen dissolve, waterline split with refraction, spray, developed title and credit, grade, vignette, grain, subtitles).
- JS: `edt()` (exact distance transform for the B channel), `swimPhase()` / `omega()` (beat phase integrated over time), `hermite` arcs for leaps, `pineTexture()` (procedural conifers), `drawSubs()`.

Minimal example not in the demo: a heron crossing a city at dusk, its body holding the marsh it left: a PhyloPic heron in `sampleMask()`, the outside a dusk gradient as in the stag shader, the marsh photograph through `photo()` at depth 0.7, a slow wing beat, three lamps of farmhouses lit along the wing.

## 11. Variation space

The agent decides the subjects and their silhouettes (animals, but also a person's profile, a vehicle, a building), what goes inside and outside, the route of the camera, the pace, which native moves to spend and the ending.

- **Structures**: one animal followed across four seasons, its inside changing while the outside stays; a relay of different subjects handing over through their windows; two silhouettes approaching each other until their insides swap.
- **Openings**: a fill already full screen that the camera pulls out of; a dark shape developing on a click; a lamp lighting in darkness that turns out to be inside an outline.
- **Endings**: inside and outside in register; the silhouette walking out of frame and leaving its inner place behind; the camera pushing into one last window and staying there.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
