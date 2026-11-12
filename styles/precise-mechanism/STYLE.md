# Color-Coded Mechanism — Style Prompt

> A real mechanism built in 3D and coloured like an anatomy plate: a pale ground, one flat colour per subsystem, the part being explained in a single accent. The machine runs truthfully (true ratios, true rates, true physics), and the camera cuts it open, explodes it by system and follows the force through it.
> References (grammar only): anatomical atlas plates (one colour per system, colour as the legend); technical drawings and section views (hatched cut faces, title blocks, leader lines); exploded-view assembly diagrams. Copy none of their layouts, typefaces or plates; never name them in the film.

## 1. Essence, and what it is not

- **Colour is the structure.** Every part takes the colour of the system it belongs to (energy source, transmission, control), everything else is one light neutral. A viewer reads the machine's organisation from the colours before reading a word.
- **Soft cel, own-colour outlines.** Two-tone flat shading with no reflections; every part is ringed in a darker shade of its own colour, never in black.
- **The machine is true.** Wheels turn by their tooth ratios, the oscillator swings at its real rate, numbers on screen are computed from the model. Slow motion is stated on screen.
- **Cut, explode, follow.** The camera's job is to open the object: section cuts with hatched faces, exploded layers by system, a tracking path along the force.
- **One thing to read at a time.** A single primary label, everything already explained steps back to mid grey.

Not Exploded Teardown (no product photography, no materials, no real-brand object), not Blueprint (light ground, filled solids, not line-only), not Isometric Infographic (a perspective camera that moves through the object, not a fixed diorama), not Glass Product Render (opaque, matte, no refraction).

## 2. Materials & rendering

- **Geometry is engineered, not sculpted**: involute gears with real module and tooth counts, extruded profiles (wheels, bridges, levers), cylinders for arbors. No bevels (a bevel doubles the outline). Choose module and camera so one tooth pitch is ≥ 12 px at 1080p.
- **Soft cel shading** (`cel()` in `demo/film.js`): lit faces are the flat colour, shade faces × 0.80 and slightly cool, a third tone for faces turned away. No environment map, no cast shadows between parts.
- **Outlines** (`demo/film-outline.js`): a second pass of view normals and depth; an edge on the near side of a depth step or on a crease is drawn in the part's own colour × 0.52 mixed with 28 % ink. 2× supersampling; lines 1–1.3 px.
- **Section cuts**: clipping planes through an axis; the back faces seen through the cut are shaded as the cut face, with 45° hatching computed where the view ray meets the cut plane, in world units (it never swims when the camera moves). Cut only the housing, never the part it reveals.
- **Dye**: colour arrives as a spherical front spreading from the point where energy enters a part (a mesh point, an arbor, an impulse pin), with a thin pale wet edge. Never a global crossfade.
- **One soft contact shadow** under the base plate (a blurred silhouette, 20 % opacity), drawn in the colour pass only.
- **Text and leaders** live in an HTML/SVG layer on top, anchored to projected 3D points every frame.

## 3. Colour logic

- A warm off-white ground, flat, no gradient or vignette.
- One light neutral for the frame, plates, bridges, housings and every part not being discussed.
- Three system hues, mid-value and slightly greyed, always in the same roles: **warm yellow = energy source**, **grey-green = transmission**, **grey-violet = control or measurement**. In a different machine the roles carry over (battery / gearbox / governor; lens / shutter / meter).
- **One accent** (a saturated red-orange), only for the protagonist part at its moment, and for the control that drives it. Never two accents.
- **Focus mode**: only cause and effect keep colour, everything else falls to the neutral.
- Ink is near-black, for text, leaders, hands and markers only.

Example (our demo): ground `#F3F0EA`, neutral `#DDD8CF`, ink `#25282D`, energy `#E6B94F`, transmission `#79B09F`, control `#8A97D4`, accent `#E8472A`.

## 4. Type & subtitles

- **Roles**: a neutral grotesk for titles and labels (e.g. Inter, 600–650 weight, tight tracking); a monospace in caps with wide tracking for figure lines, readings and units (e.g. IBM Plex Mono); a CJK sans for Chinese (e.g. Noto Sans SC). All OFL, self-hosted.
- **Three levels only.** Primary: a headline (60–64 px) or the label of the part being explained (name ~30 px ink + one 18 px line). Secondary: what was already explained, name ≥ 22 px mid grey, its line greys and lingers before it goes. Tertiary: the figure line (`FIG. n · …`, 13 px mono grey) and small data tags.
- **Labels grow out of the part**: a leader draws from a dot on the part, a colour dot in the system hue pops, the text slides in. Re-project every frame; when a label would cover a part, pin it to empty space and keep the leader; when the part leaves the frame, the label goes with it.
- **Comparisons** (ratios, before/after): the number is the primary (≥ 120 px), the two ends that produce it are secondary with leaders, all held in frame ≥ 2.5 s.
- **Subtitles**: bottom left, no plate, Chinese ≥ 34 px over English ~22 px, one line each; compose the subject away from that corner. Chinese on screen only in subtitles and short ≥ 34 px lines; labels are English. Hold ≥ max(1.8 s, speech + 0.6 s).
- **The credit** belongs in the style as a drawing's title block: ink rules, mono field names, values in the grotesk.

## 5. Motion quality

- 24 fps on ones, smooth camera; no stepping.
- **Motion is driven by one master clock**: a smooth speed curve (real time, a fraction of it, deep slow motion, stopped) whose integral moves everything. Speed changes never jump.
- Ratios are exact: every wheel's angle comes from the driver through tooth counts; meshing stays meshed (a free-run must end on a whole number of teeth).
- Stepped motion (an escapement, a ratchet, an indexing table): the stepped part advances inside a short impulse window; the oscillator is a sine through its centre at each beat.
- Things appear by dye, cut, lift or draw-on; never by a fade-in of a whole object.
- What never moves: the ground, the palette roles, the light direction.
- **Frame rate and grain**: no film grain (mux grain 0).

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| fast pull-back from a detail to the whole object | scale, a question | an opening hook; a reveal of context |
| slow orbit around the object | volume, that it is real | a cut opening; an exploded stack |
| crane down through a cut | entering the inside | the change from outside to mechanism |
| low tracking shot skimming over the parts | following the force or signal | a power path; a data path; a sequence |
| locked overhead | reading and comparing | a ratio; a parameter; a verdict frame |
| side view of an exploded stack | the systems as layers | a breakdown; what happens without one layer |
| push-in to a contact point at slow speed | the one interaction that matters | a ratchet pawl; a latch; a valve opening |
| big pull-out to the whole object, cut still open | the answer seen in context | an ending; a summary |

Framing: the subject fills ≥ 60 % of the frame width in explanatory shots; text sits in the clear third, never on parts; nothing important in the subtitle corner. Transitions are made inside the object: a cut opening, a lid lifting, layers exploding or landing, a match cut on a mechanical event. No dissolves, page turns or slides.

## 7. Sound palette

- **Foley from the mechanism**: metal ticks built from three micro-clicks (unlock, impulse, drop) panned to the part; a thin metallic swish for a section cut; brass clacks for parts landing; a tooth-rate gear buzz that follows the speed curve; air for lifts.
- **Instruments**: plucked and struck pitched percussion over a light bass (harp, marimba, glockenspiel, vibraphone, cello pizzicato); tremolo strings only for tension. A part taking its colour may sound one note, panned to it.
- **Grid**: the mechanism's real beat sits on the music grid (e.g. a press at 120 strokes a minute = quarter notes at 120 bpm); slowed time keeps the tick on the grid.
- **Silence** before the key mechanical event; the first sound after it is that event.
- **Voice**: an even, measured narrator. Music ducks under it and gives way in 300 Hz–4 kHz; voice ~10 dB over music by RMS; −14 LUFS, true peak ≤ −1 dB.

## 8. Native moves

- **Dye by system.** A grey machine takes its colours in the order energy flows. *Fits content like:* the power path in a drone; the signal chain in a radio; the blood route in a pump.
- **Section with hatching.** A wedge or plane cuts the housing; the cut faces hatch in world space. *Fits content like:* a valve body; a camera lens barrel; a lock cylinder.
- **Explode by system, remove one layer.** Layers lift apart; pulling one out shows what it was doing (a motor over-revs without its governor). *Fits content like:* a brake without its caliper; a router without its clock; a dam without its gate.
- **Follow the force.** A low tracking shot from source to sink while the dye travels with it. *Fits content like:* a bicycle drivetrain; a heat path in a laptop; water through a turbine.
- **True slow motion of one contact.** Speed curve down to deep slow motion into a single interaction, silence, then its sound. *Fits content like:* a shutter curtain; a ratchet pawl; a relay closing.
- **Parameter drag.** A control in the accent changes one input; readouts and a small curve recompute from the model (style frame 3 in `demo/`). *Fits content like:* aperture vs depth of field; gear ratio vs speed; tension vs amplitude.
- **Whole object, still cut open.** The housing returns with the cut kept, the coloured systems running inside. *Fits content like:* an engine in its car; a heart in its chest; a server in its rack.

Our demo opens on a fast pull-back from a detail to the whole object, uses *explode by system, remove one layer* as its turn and *true slow motion of one contact* as its climax, and ends on the *whole object, still cut open*. A new film opens and ends another way: the machine already exploded, assembling itself; the outside of a product with a *section* plane sweeping in; an ending on a *parameter drag* left at its best value with the verdict held; or the camera rising to the whole system the machine is part of.

## 9. Pitfalls of the medium

- **Outline flicker on fine teeth** → keep tooth pitch ≥ 12 px, render at 2×, no bevels, do not spin fine teeth fast (≤ 45° per frame for a part with 4-fold symmetry; slow the time instead).
- **Wagon-wheel aliasing** of fast oscillators → show them slowed and say so.
- **Rainbow parts** → colour by system, never by part.
- **Plastic or metal look** → no reflections, no transparency, no specular.
- **Labels everywhere at equal weight** → one primary; the rest secondary or gone.
- **Labels on parts or under subtitles** → pin to clear space with a leader; keep the subtitle corner empty.
- **A housing that moves through the parts** (a case lifting through the movement) → move each piece the way it would come apart (dial up, case down).
- **Meshing that drifts after a free run** → make the extra rotation a whole number of teeth.
- **Hatching in screen space** swims with the camera → compute it on the cut plane in world units.

## 10. Engine

- `demo/gears.js`: `involute(z, m)`, `clubWheel(z, rTip, rRoot)`, `windows(n, …)` spoke cut-outs, `hull()` rounded bridges, `slab()` extrusion, `spiralStrip()` springs.
- `demo/physics.js`: the demo's teaching watch train (`TRAIN`, `RATIO`; your film models its own machine) and `solve(s)` for torque, amplitude, rate and reserve from the state of wind.
- `demo/film.js`: the cel + dye + hatching shader (`VS`, `FS`), `cutSet()` / `setWedge()` section cuts, `motion(t)` (escapement-stepped ratios from the speed curve), `lift()` explode layers, camera keys with Hermite interpolation (`CAMS`, `camAt`), sound events (`window.EV`).
- `demo/film-outline.js`: the own-colour outline pass. `demo/film-overlay.js`: labels, pins, title block, subtitles.
- `demo/main.js` + `demo/render_png.mjs`: three style frames (overview with colour key, exploded by system, parameter drag) → `demo/stills/frame_1.jpg` … `frame_3.jpg`.
- Minimal example outside the demo: a two-stage bicycle drive. Two `involute()` wheels on a chain line, a `slab()` frame in the neutral; dye the pedal crank yellow, the chainrings green, the rear hub violet; `setWedge()` through the hub shell to show the freewheel pawls in the accent.

## 11. Variation space

The film decides the machine, the systems' names, the story, the opening and ending, the camera path, the pacing and how much is cut open.

- **Three structures**: a fault hunt (a machine misbehaves; remove systems one by one until the culprit shows); a comparison of two mechanisms side by side with the same colour roles; a single parameter swept from one extreme to the other while the machine runs.
- **Three openings**: the machine already exploded, assembling itself; a single part in the accent, the camera pulling out to find where it lives; the outside of a product, a section plane sweeping in.
- **Three endings**: the parameter left at its best value with the verdict held; the housing closing with the cut kept; the camera rising to the whole system the machine is part of.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
