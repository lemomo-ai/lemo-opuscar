# Scale Zoom Explainer — Style Prompt

> Solid flat shapes on a deep night-blue ground, each with one shade step and hard-edged ring "glows", drawn to true scale inside each frame, guided by a small character who is the camera's own lens. A continuous change of scale carries the viewer through orders of magnitude while a scale ribbon in the corner reads the field of view.
> References (grammar only): mid-century educational posters and flat vector science illustration (solid fills, two values per object, geometric forms); the Eameses' *Powers of Ten* (one continuous change of scale with a readout); children's science picture books (a guide who points). Copy none of their characters, layouts, typefaces or music; never name them in the film.

## 1. Essence, and what it is not

- **Flat and opaque**: every object is a solid colour plus at most one shade step. No gradients, blur, transparency, outlines or drop shadows.
- **Glow is two hard rings**: anything bright sits on two concentric solid discs one and two steps lighter than the night ground, like a screen print.
- **True scale inside each frame, a readout for the camera**: things in one frame are drawn to one scale; a corner ribbon (a log track with a few stop icons) and a field-of-view number come from the same camera.
- **A guide with a lens for an eye**: a round, friendly character whose single eye is a zoom lens. Where it looks, the camera goes; its signature is a dotted sight line fired from the lens to a "next stop" ring.
- **Next-stop ring**: a sun-yellow circle, a dashed outer ring, a leader and a two-line label mark the point the camera dives into.

Not Isometric Infographic (no isometric projection, no dioramas), not Data Storytelling (no charts on paper), not a 3D soft-body render (no rim light, bloom or depth of field), not Sci-fi Hologram HUD (no glowing wireframes), not a keynote (no header bars, centred stacks or page turns).

## 2. Materials & rendering

- **SVG, rebuilt every frame** from a pure function of time; every random draw from a fixed seed. Nothing is carried from the previous frame.
- **One shade step**: draw the whole shape in the shade colour, then the base colour on a copy shifted toward the light (upper left) and clipped to the shape; what is left is a crescent at the lower right. Land, clouds and anything on a sphere follow the sphere's terminator (`twoTone`).
- **Forms**: circles, ellipses, rounded rectangles and smooth closed curves (Catmull-Rom). Thin lines are round-capped and 2.5–4 px.
- **Stars**: three colours of dots (mist, cream, sun) and a few four-point sparkles. Dots never flicker; sparkles may breathe slowly (±16 %, ~0.3 Hz, each on its own phase).
- **Grain**: none in video (a static grain sits on moving shapes; a moving grain makes flat fields shimmer). A 5 % static grain is allowed on still frames only.
- **One camera, screen = (p − C)·z + S0**, with parallax layers taking a fraction of the zoom (stars ~0.18, far objects ~0.4, the subject ~0.75, the guide 1.0). Everything that follows a subject (sight line ends, rings, labels) goes through that function. Zooms interpolate in log space.

## 3. Colour logic

- Ground: a deep night blue; its two lighter steps are reserved for glow rings and dim shapes.
- Five hues, each with one shade step: a blue (oceans, arms, nuclei, glass), a mint (land, living cells, one orbit), a coral (bacteria, blood, the guide's cheeks, one orbit), a sun yellow (the guide's body, every "pointer": dots, rings, tape, progress, sign-off) and a cream (titles, clouds, satellites, the lens ring). A muted lavender "mist" for secondary text.
- Sun yellow means *look here*. It is never a background.
- No pure black, pure white or grey.
- A scene may change its ground once for a reason (a daylight sky in the blue) and come back.

Example (our demo): night #1D2052 with rings #252A63, #30367C; blue #4D7CFE / #3A5FD9; mint #3FD8AE / #22B38C; coral #FF6B5E / #E14B45; sun #FFC84A / #F2A12F; cream #FFF4E2 / #F0DCC0; mist #9298D4.

## 4. Type & subtitles

- **Roles**: a geometric sans (e.g. Jost, OFL): titles 96–132 px weight 700 with tight tracking; labels 26–34 px weight 600; small caps tags 16–18 px weight 600 with letter-spacing 3 in mist or sun. One short Chinese line where needed in a CJK sans (e.g. Noto Sans SC Bold, subset), ≥ 34 px.
- **Two ways in**: big words rise from below their own baseline through a clip (spring, small overshoot); labels wipe left to right. Exits run the same moves backwards. No fades.
- **Labels**: a small-caps tag above, one cream line below, attached by a 2.5 px leader. One label or one big number per screen; comparisons go in the voice, the screen gives a name and a number.
- **Subtitles** sit bottom left: one Chinese line (36 px, cream) over one English line (26 px, mist), a 5 px sun bar at the left, rising in over 0.16 s. On a light ground they sit on an opaque night plate. Never wrapped; a long sentence becomes two cues. Hold ≥ max(1.8 s, speech + 0.6 s).
- The corner instrument (field-of-view label, number, ribbon) and the subtitle band are kept clear of subjects.

## 5. Motion quality

- 24 fps, every frame on ones; the camera and the guide move smoothly every frame.
- **Performance**: anticipation, action, overshoot and settle on every meaningful move (squash before a jump, stretch on release, panels flapping like ears, the antenna bead lagging half a beat). Poses blend by easing, never by switching in an `if`.
- **The eye carries the face**: a lid for blinks, the iris itself bending into an upward arch for a smile (never a colour block over the lens), the iris widening for surprise, the barrel stepping out with turning grooves for a zoom.
- Dots of a sight line pop out one by one (0 → 1.3 → 1), then stream slowly toward the target, growing in at the start and shrinking out at the end.
- Rings lock with a spring (one overshoot); counters roll and land.
- Never moves: subtitles once landed, the corner instrument's position.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Log-space dolly through a shape (ring, lens, iris) | going down a level of scale | every change of scale; a chapter turn |
| Pull back from an extreme close-up | revealing who and where | a cold open; a "this is the real size" moment |
| Slow push with a 2–5 % creep | attention, reading time | a measurement; a label being read |
| Tracking with a moving thing while pulling out | travel, duration | light crossing space; a journey with a clock |
| Frame within frame (a magnifier inset) | a detail too small for the scale | an orbit's height; a cell's part |
| Shape match (a small dot becomes the next subject) | the same thing at two scales | a planet dot to a planet; a cell icon to a cell |
| Fly-through layers (clouds, skin) | crossing a boundary | atmosphere; skin; a wall; water |

Subject at least a third of the frame height at key moments; titles and labels in the free third; subtitles bottom left, instrument bottom right. Transitions are made from the medium (rings, lenses, concentric layers, a covering cloud bank); no crossfades, no hard cuts inside a zoom.

## 7. Sound palette

- **Tuned percussion and plucks**: vibraphone (soft and bowed), glockenspiel, marimba, xylophone, harp, hand chimes; pizzicato strings and double bass; nylon guitar for warm human-scale moments; timpani and triangle for locks.
- **Foley of a small machine**: servo whirrs for the lens, a shutter click for blinks, soft puffs and a low thruster bed, rising blips for each dot of a sight line, a click and a short bell when a ring locks, whooshes for dives.
- **Option for colour per level**: the same key and tempo throughout, a different lead instrument for each scale (bowed pad in space, marimba on Earth, guitar on a hand, pizzicato in minor inside a body, bells for the very small).
- **Silence**: a held half-beat before a release, and one near-silence before the smallest reveal.
- **Mix**: narration ~10 dB over music, music ducked and dipped 300 Hz–4 kHz under it; −14 LUFS, true peak ≤ −1 dB. Voice: a warm, unhurried teacher.

## 8. Native moves

- **The sight line.** The guide's lens fires a dotted line at the next stop; the line can become what the level needs: light walking at constant speed, a tape measure, a trail, a stream into the scale ribbon. *Fits content like:* the distance from a city to its water source; a nerve signal; the route of a migrating bird.
- **Through the ring.** The next-stop ring grows to fill the frame while the outside level blows past; the next level grows inside the ring from a point. *Fits content like:* a country to a city; a city to a building; an organ to a tissue.
- **True size, at last.** The guide, always drawn at "guide size", is shown once at true scale next to an everyday object, then the narration says it now shrinks with us. *Fits content like:* a microchip; an ant; a snowflake.
- **The scale ribbon summary.** The corner ribbon moves to centre stage, the dots run along it lighting each stop, and the progress fills. *Fits content like:* the ages of the Earth; the sizes of particles; a history of computing power.
- **Inside the lens.** The camera dives into the guide's own lens and the next world is inside the glass. *Fits content like:* a look into a cell; a peek inside an atom; switching from a map to street level.

Our demo opens on a pull back from the guide's lens in extreme close-up, uses *true size, at last* and *inside the lens* as its turns and ends on *the scale ribbon summary*. A new film opens and ends another way: a black frame with one dot that turns out to be a planet, the scale ribbon alone with its first stop lighting, an ending on the guide back on a hand at true size, or a pull back through every ring in two seconds.

## 9. Pitfalls of the medium

- **Readable scale**: things too small to see at true scale become markers (a dot with a ring); say so with a label. Never enlarge a true-scale thing to fit the composition: change the level instead.
- **The guide's size**: viewers read it as information. State once that it is drawn larger than life, show its true size once, and say when it shrinks along.
- **A flat face**: covering the lower half of a lens eye with a colour block reads as sleepy or hurt; bend the iris instead.
- **Light grounds**: cream text and cream skin collide; put subtitles and the corner instrument on an opaque night plate there.
- **Overshoot of a pull-back** reveals the edge of the star field: lay stars beyond the frame.
- **Shimmer**: small dots moving sub-pixel are fine; random per-frame twinkle is not.
- **Hands and props** drawn as plain capsules read as extra fingers: draw curled fingers, a thumb and a knuckle line.

## 10. Engine

- `demo/flat.js`: palette `C`, `shaded()` (one shade step), `twoTone()` (terminator for land and clouds), `halo()` (two hard rings), `stars()`, `sparkle()`, `blobPath()`, `text()` (records labels for `window.TEXTS`).
- `demo/orbi.js`: `orbi(p, x, y, s, P)` with continuous pose parameters (`look`, `lid`, `smile`, `zoom`, `wide`, `sq`, `tilt`, `ant`, `flame`, `hold`) and `orbiLens()` for the sight line's origin.
- `demo/film.js`: camera with parallax layers (`camAt`, `layerOf`), easing helpers (`kf`, `spr`, `wob`), `wipeText()`, the first performance.
- `demo/scenes.js`: `ringAt()` (next-stop ring), `dotsAB()` (sight line), `ribbon()` with `fmtM()` (field-of-view readout), `subtitles()`, `circleClip()` + `inG()` (draw a world inside a ring, an iris or a lens).
- Minimal example, not in the demo: a city map as the outer level, `ringAt()` on one building, a `dive()`-style blow-up into its roof with the floor plan growing inside the ring.

## 11. Variation space

The agent decides the levels and their order, the guide (any character whose eye or tool can be the lens), the everyday comparisons, the camera route, where the ground colour changes and the lead instrument for each level.

- **Structures**: zooming out instead of in, ending on the largest thing; two journeys side by side (a whale and a krill) meeting at one scale; a single level explored in depth with insets.
- **Openings**: a black frame with one dot that turns out to be a planet; the guide's lens in extreme close-up; the scale ribbon alone, its first stop lighting.
- **Endings**: the guide back on a hand, at true size, waving; the ribbon summary; a pull back through every ring in two seconds.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
