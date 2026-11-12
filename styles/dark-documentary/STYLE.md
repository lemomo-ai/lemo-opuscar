# Radar Sweep Documentary — Style Prompt

> The world is black until a scan passes. A plane of light sweeps across terrain, machines and rooms; what it has touched lights up, then settles into echoes (contour lines, range rings, wireframe edges) that slowly fade. Facts arrive as instrument readings: thin titles, small monospaced type, gauges and timelines written on by the same scan, placed beside the thing they describe.
> References (grammar only): radar and sonar displays (sweep, return, decay); LiDAR and survey visualisation (echo geometry, range rings); night-time science documentary title design (thin type, quiet data). Copy no programme's graphics package, logo, layout or typeface, and never name one.

## 1. Essence, and what it is not

- **Existence is scanned.** Nothing is lit by ambient light. A subject appears only when a scan reaches it: a bright front line, a short glow, then echoes that persist and decay. Black means "not yet seen", not "shadow".
- **Echoes are the material.** Surfaces resolve into contour lines, range rings around the subject, a survey grid and ghost copies of the scan front, each fading at its own rate. A moving subject leaves wireframe after-images: the echo records time.
- **The subject keeps a cold rim.** Once scanned, the hero object carries a thin cold rim light so its silhouette never sinks into the ground or the sky.
- **Instrument reading, not presentation.** Every number is a reading next to its object (an angle on an arc, a trace with one threshold line, a source on a timeline), written on by the scan, in small monospaced type. One thin title per film.
- **One warm accent** for the target or the signal (the thing being looked for). Everything else is cold.

Not LiDAR Survey (no point clouds, no measured scan data; the scan is a light, the echoes are line geometry), not Sci-fi Hologram HUD (no glowing chrome, no floating panels, no invented interfaces), not Satellite Briefing (not a map or overhead imagery), not a keynote (no slides, no centred title pages, no page turns).

## 2. Materials & rendering

- **One scan function** shared by every material in a space: `d = S − dot(p, D)` for a plane moving along `D`; `d < 0` is unseen (black), the front `exp(−d²/w²)` is the bright line, behind it a glow `exp(−d/L₁)` and a slow trail `exp(−d/L₂)` with `L₂ ≫ L₁`. Ghost copies of the front every few metres decay faster still. The scan is analytic, so every frame depends on `t` only.
- **Two scans can overlap**: behind the new front the new scan applies, ahead of it the previous one keeps ageing. This is how a scan rewrites a scene into another time.
- **Echo geometry**: contour lines from height, range rings around the subject, a coarse survey grid, all line-antialiased with `fwidth` and faded out where they would alias. Structure edges (EdgesGeometry) and panel seams follow the same scan.
- **Surfaces**: near-black base, lit only by the scan terms, a small daylight term when the scene is a grey day, and a rim term `(1 − n·v)³` in cold blue for the subject. Additive lines for wireframe, opaque surfaces for silhouettes.
- **Hard light when there is a real light source** (a low sun): flat-shaded facets, one strong direction, long planar shadows cast onto the ground. Crinkled foil or rough metal take a noise-perturbed normal and a narrow specular.
- **Sky**: either deep night (a dim Milky Way and stars that never flicker) or an overcast day (a layered, slowly rolling cloud deck, brighter at the horizon, with slanted rain). The two must be told apart at a glance: day is a lit grey, never night.
- **Post**: bloom, vignette, a soft shoulder, a static sub-LSB dither against banding. No grain that changes between frames.
- **Several spaces, one treatment**: terrain, a lunar surface, a globe in space, a room interior each get their own scan direction and the same echo rules.

## 3. Colour logic

- Black is the ground. Brightness belongs to what the scan has just touched.
- Echo colour: a cold blue-white (example `#B3DBFF`); the scan front is white.
- One warm accent (example `#F2C48D`) reserved for the target and the signal path; at most one warm element per frame.
- A warning red (example `#FF8C78`) only for a value over a limit, and only on the readout.
- Text: three levels of cold grey-white (examples `#EEF2F6`, `#C4CED8`, `#96A2B0`).
- A grey overcast day may lift the whole frame (cloud base up to about `#3B3F44`), but keeps the low key and the cold rim.

## 4. Type & subtitles

- **Title**: a thin humanist sans (IBM Plex Sans 200 in the demo), 50–70 px, sentence case, never centred, no shadow or outline.
- **Readings and labels**: a light monospace (JetBrains Mono 300), 14–17 px, all caps, tracked +1.2 to +2.4 px; big numbers (a time, an angle, a ratio) in the thin sans at 50–150 px.
- **Chinese** (Noto Sans SC Light): one short line under the title or as a section label, ≥ 34 px.
- **Every text is written by a scan bar**: a clip that grows left to right with a 1 px bright edge leading. No typewriter, no fade-in, no pop.
- Labels sit next to their object with a thin leader line; numbers sit on the instrument (an arc, a trace, a track). Never a header strip, never a centred stack.
- **Subtitles**: bottom left, one Chinese line (34 px) over one English line (≈ 23 px), joined by a 1 px echo-coloured vertical hairline; a soft dark patch behind them on night frames only. Hold ≥ max(1.8 s, speech + 0.6 s).
- Small text never sits on a busy picture without a plate: a dark rounded plate under a readout that overlaps an image.

## 5. Motion quality

- The scan advances in surges on the beat (an ease-out push per beat, mixed with a steady drift so it never stops dead). Its speed is the film's pulse.
- Echoes decay smoothly; nothing blinks.
- Machines move with weight: anticipation, a long ease, a bounce against the stop, and a wireframe after-image trail while moving.
- Weather, when a film has it (wind, rain, dust), moves continuously and slants with the gusts; the camera shakes only with the weather, more in close-ups.
- Stars never move on screen: on a star shot the camera only translates (no rotation) and the sky rides with it.
- **Frame rate and grain**: 24 fps.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Slow dolly with fixed orientation | patience, scale, the world being surveyed | a wide establishing shot; a night sky |
| Low camera near the ground, slow push | weight, presence of a machine or a vehicle | a hero object; a landing site |
| Side medium with a slow orbit | mechanism, an angle changing | a movement against a limit |
| Handheld close-up | stress, a part under load | a storm; a failure; a test |
| Overhead or space view drifting around a globe | distance, connection between places | a signal path; a network |
| Interior hold, then a fast lateral track | attention snapping to the next thing | a reading that changes; a reveal across a room |
| Pull back and up | scale and endurance | a summary; the end of an ordeal |

Framing: a large real object keeps its ground, horizon and base in frame; put the camera above the ground and check its height (a camera backed off along an elevated direction can end up under the terrain, and the object then floats). The subject fills at least a third of the frame height at key moments.

Transitions belong to the medium: a scan that rewrites the scene in place; a **scan wipe** between two live views (two renders, a 1 px bright edge sweeping, the next view behind it); a hard cut on an impact; a match cut from one rectangle or circle to another (a monitor's screen into the picture it shows); a CRT collapsing into a line that becomes the next scan. No cross-dissolves, no page turns.

## 7. Sound palette

- Ambience first: wind (low, slow gusts), rain hiss, room tone; it drops away in space.
- Scan foley: an air surge per push and a clean sonar ping (with two quieter echoes), panned with the scan; a struck metallic ring when the scan meets the subject.
- Machines: drive motors, gear teeth, a heavy clank on the stop, metal groan under load, an electric bell behind glass.
- Signal: a short quindar-like beep, a low carrier, TV hiss and line buzz that clean up when the source improves.
- Score: low strings and bowed vibraphone held long, a vibraphone pulse when the signal arrives, glockenspiel for stars; one bright chord at the turn. Leave 300 Hz–4 kHz for the voice; voice about 10 dB above the bed.
- At least two near-silences (a verdict panel; the moment before the turn).

## 8. Native moves

1. **The scan reveal**: black → a light plane sweeps → the subject exists → it settles into echoes.
2. **Sky behind the beam**: stars and the Milky Way appear only where the scan has passed.
3. **Scan rewrites time**: in one shot, a second scan replaces night with day (or one state with another) and erases the old labels as it passes.
4. **Motion echo**: wireframe after-images left behind by a moving machine.
5. **Radial ping**: the subject becomes the source; a ring of light runs out across the ground and the range rings flash.
6. **Instrument readouts written by the scan**: an angle counting to its limit on an arc; a trace crossing one threshold line; a comparison held still (one quantity beside another).
7. **Scan line = TV raster**: a picture written line by line, rough at first and sharpening as the lines fill in.
8. **CRT to scan**: the picture collapses into a line, and the line is the next shot's scan light.

Our demo opens on *the scan reveal* with *sky behind the beam*, uses *scan line = TV raster* (entered on a match cut) as its turn and ends on *CRT to scan*, a pull back and up and a last *radial ping*. A new film opens and ends another way: a radial ping from the subject as the first light, a vertical sweep that reveals an interior, a cone from a source, or an ending on echoes fading back to black.

## 9. Pitfalls of the medium

- Night everywhere: a day scene left as black as night tells the wrong time. Lift the sky and the ground into a grey day.
- Too dark to read: subject and labels sinking into black. Give the subject a rim and lift the exposure of reading shots.
- A scan front passing right in front of the lens blows out the frame; fade the front near the camera.
- Star flicker: sub-pixel stars and a rotating camera. Keep stars ≥ ~1.5 output px, below the bloom threshold, and the camera unrotated.
- Dark patches behind text show as smudges on a grey sky; use them only on night frames, or use a proper plate.
- Floating models: a camera below the terrain or an object without ground contact; keep ground, horizon and base in frame, add contact shadows.
- Blocky stand-ins: a recognisable machine needs its recognisable parts (legs, pads, facets, windows, antennas), not two boxes.
- Fake data: a trace or gauge with invented numbers. Label only the sourced value; leave the rest unscaled.

## 10. Engine

three.js (WebGL2), one `render(t)`; per space a scene with its own scan uniforms; EffectComposer with bloom and a grade pass; a 2D canvas overlay for all type, gauges, tags and subtitles, positioned through the camera's projection. Scan wipes use a second renderer with a CSS clip. Everything is closed-form in `t`.

## 11. Variation space

- **Subjects**: any instrument, structure or vehicle (a bridge, a radar, a dam, a rig, a lander, a reactor hall, a ruin).
- **Spaces**: terrain at night or on a grey day, space, an interior, an underwater site (with sonar instead of light).
- **Scan shapes**: a plane, a radial ping, a cone from a source, a vertical sweep in a room.
- **Readings**: angles, traces, comparisons, source timelines, distances; one warm target per film.
- **Endings**: a last radial ping across the landscape; echoes fading back to black; a pull-back to the whole object in its weather.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
