# Oscilloscope Math — Style Prompt

> Mathematics drawn by an electron beam on a phosphor screen: thin glowing green lines on near-black, a dotted graticule, monospace readouts and TeX formulas, every number on screen computed from the same values that draw the picture. The screen is a window onto a mathematical world larger than the frame, and the camera moves through it: it follows a point, dives into a corner, pulls back over a whole wave. Zooming is turning the instrument's knobs: the graticule refines and the TIME/DIV and V/DIV readouts change with the zoom.
> References (grammar only): analogue oscilloscopes (P31 phosphor, beam afterglow, graticule, cursors, STOP/RUN), 3Blue1Brown-style mathematical animation (text that turns into shapes, a camera inside the maths), Manim. Copy no instrument's front panel, logo or layout.

## 1. Essence, and what it is not

- **The maths is real.** Circles, curves, readouts, cursors and the formula come from one set of numbers: an epicycle chain is the actual Fourier series, a readout is the value at the drawn point, a measured distance is computed. Freeze any frame and it checks out.
- **Light, not ink.** Everything is emitted light: a sharp core, a soft bloom, a white-hot centre where the beam is fast or new. Nothing is filled with flat colour.
- **The screen is glass in front of a world.** HUD (formula, readouts, subtitles, credits) is fixed to the glass; the world (curves, circles, axis, graticule) moves behind it.
- **Text becomes geometry.** Titles are written by the beam, then their letters morph into the next shot's subject (a circle, an axis).

Not Sci-fi Hologram HUD (no fantasy chrome, no cyan-magenta palette), not Data Storytelling (no bars and pies on white), not Blueprint (no paper, no drafting), not ASCII/CRT Terminal (no raster, no scanlines, no character grid).

## 2. Materials & rendering

- **Vector beam on a phosphor screen.** Draw with constant-width lines in screen pixels (1.2–3.2 px), so a line stays a beam at any zoom. No scanlines (an analogue scope is a vector display).
- **Light channels.** Draw three layers of light (beam trace, graticule and text, white-hot cores) plus an optional second channel for measurements; a post pass gives each its phosphor colour and glow. Beam layers bloom strongly; text blooms faintly so it stays crisp.
- **Bloom**: several Gaussian blurs at 1/2 to 1/16 size added back; where light piles up it turns towards white, through a soft shoulder rather than clipping.
- **Afterglow is drawn, not accumulated.** Earlier instants of moving objects (8–10 ghosts a few milliseconds apart, fading by a power curve) and a short trail behind a moving point. Frame-to-frame decay strobes at 24 fps; do not use it for anything that moves fast.
- **A fast beam leaves less light.** Steep segments of a trace are drawn dimmer (about 55–60 % on a vertical edge); older parts of a scrolling trace fade with age.
- **Graticule**: dotted minor lines, a solid centre axis with 0.2-division ticks, refined in levels of 5 as the camera zooms (the finer level fades in).
- **The screen**: near-black with a faint green ambient falloff, a vignette, a little dither noise so the glow never bands in 8-bit video.
- Example (our demo): Manim (Cairo renderer) draws the channels into PNG frames; a numpy/OpenCV pass makes the phosphor.

## 3. Colour logic

- One phosphor family; colour means role, not decoration.
- Beam green for anything the signal draws; paler green for graticule and text; white-hot for the beam's newest point, joints and arms, and the flash of anything just created.
- **Amber = the second channel**: measurement cursors, measured values, markers of a finding. Never used for decoration, never for the signal itself.
- No other hues. Grey cards only for unfinished placeholders.
- Example (our demo): screen #010402, ambient #0B2412, beam #4DFF88, text #8DFFB0, hot core #E6FFEC, amber #FFB547.

## 4. Type & subtitles

- **Instrument voice**: a monospace (e.g. JetBrains Mono, OFL) for readouts, cursors, knob values, labels on objects, 19–30 px. Values are live (computed every frame); align the `=` signs in a column.
- **Formula**: TeX typography (MathJax SVG paths or LaTeX), top left, about 520–560 px wide; glyphs are lit one by one by the beam; the part that changes (an upper limit, a coefficient) flashes when it changes.
- **Titles**: a serif that matches TeX (e.g. STIX Two Text, OFL), 60–84 px, with the key word in italic; a Chinese line under it in a CJK serif (e.g. Noto Serif SC) ≥ 34 px. Written by the beam (outline traced, then filled, then a white-hot flash), never faded in.
- **Subtitles**: bottom left, fixed to the glass, a thin vertical light bar, Chinese serif 36 px over English STIX italic 29 px, one line each, a soft dark scrim behind them so a trace never runs through the words. Keep subjects and labels out of that corner.
- Holds: anything the viewer must read stays at least characters ÷ 15 (Latin) + characters ÷ 4.5 (CJK) + 1.5 s; a measured verdict holds ≥ 2.5 s.

## 5. Motion quality

- Rotation is uniform and real (the frequencies are the maths). Growth eases in: a new element grows from nothing at the point it attaches to in about 0.45 s, flashing white (in our demo, a new circle at its parent's tip).
- Additions accelerate rather than repeat: one, then a few, then too many to count.
- Live values update every frame; when a value is the point, it is shown at the precision that stays constant.
- STOP freezes the signal; the camera may keep moving through the frozen world.

## 6. Camera grammar

The camera lives in the world (centre and zoom); zoom is logarithmic, and the centre moves so the target stays put on screen while zooming (flying to a point). Line widths and HUD do not scale.

| Move | What it expresses | Can serve |
|---|---|---|
| Follow the beam's writing point | something being made | an opening; drawing a curve |
| Push onto a rotation, then ride a moving point | attention on a mechanism | one term, one phasor, one particle |
| Match cut between two curves of the same shape | "this is that" | a circle's arc to a wave crest; a trajectory to a graph |
| Pull back over a whole curve | the result | after a build-up; an ending |
| Dive into a detail (×10 and more), graticule refining, TIME/DIV shrinking | looking closely; the twist | an error, a crossing, a limit |
| Locked frame with cursors | measuring | a verdict |

Transitions come from the medium: letters morphing into the next subject; a title flying down and straightening into the axis; STOP followed by a dive; a CRT switch-off (the picture collapses to a line, then to a dot). No crossfades, no slide-like page changes.

## 7. Sound palette

- **The signal is audible**: a quiet tone computed from the same numbers as the trace on screen (in our demo, the same partial sum as the picture: each new circle adds its harmonic).
- **Lead**: plucked synth tones whose timbre follows the signal on screen (in our demo, a pure sine for one term, richer with every term added); tuned bells (glockenspiel, bowed vibraphone, sine bells) for events; a soft synth bass with 2nd and 3rd harmonics.
- **Instrument foley**: relay clacks for RUN/STOP and power, knob detent clicks, short blips for readouts and cursors, a tick per glyph as the beam writes, filtered-noise sweeps for morphs and camera dives, a falling zap for power-off; a faint electrical hum bed.
- **Silence**: STOP cuts the music dead; the twist is heard over hum and a slow clock.
- **Mix**: music under the voice by about 10 dB RMS, its 300 Hz–4 kHz band carved under speech; −14 LUFS, true peak ≤ −1 dB.

## 8. Native moves

- **Epicycle chain**: circles on circles whose tip draws a curve, with afterglow. *Fits content like:* Fourier series; phasors in AC circuits; planetary epicycles.
- **Live readouts**: values computed from the drawn state, updating every frame. *Fits content like:* a pendulum's energy; a filter's gain; a running sum.
- **Text into geometry**: a title written by the beam, its letters morphing into the next subject. *Fits content like:* naming a theorem before it appears; a chapter title becoming an axis.
- **Knob zoom**: a dive with refining graticule and changing scale readouts. *Fits content like:* the fine edge of a fractal; a discontinuity; numerical error near a limit.
- **Cursor measurement** (amber): two lines, an arrow, the difference and its share. *Fits content like:* a period; a rise time; a peak height.
- **STOP and power-off**: freezing the signal for a closer look; collapsing the picture to a dot at the end.

Our demo opens on the beam writing the answer before the question, uses *STOP* and a *knob zoom* into one corner as its turn and ends on a pull back over the whole curve, the name written by the beam and the *power-off*. A new film opens and ends another way: a formula whose letters become the first object (*text into geometry*), two signals compared on two channels, an ending on a locked frame with *cursor measurement* holding the verdict, or a match cut to another curve of the same shape.

## 9. Pitfalls of the medium

- **Numbers that don't match the picture.** Compute every readout from the drawn values; never type them.
- **Strobing afterglow.** Frame-accumulated decay at 24 fps leaves doubled curves; draw ghosts sub-frame.
- **Thin features vanish when sampled.** Sample curves at screen resolution and add dense samples around edges and spikes, or a 0.1 px spike disappears.
- **Crowded chains.** Small circles pile up at the tip; push in, or draw only the circles larger than about a pixel and limit ghosts to the first few.
- **Out of frame.** Size the chain so its full reach stays inside the graticule (a sum of radii can exceed the radius you expect).
- **Text in the glow.** Keep glow on beams, not on type; no outlines or drop shadows on text.
- **Readouts that flicker.** A value meant to be read is shown at a precision that holds still.
- **Facts.** Mathematical claims shown as numbers come with their source (FACTS.md).

## 10. Engine

- `demo/film.py`: `frame(t)` returns the Manim mobjects for second `t` (world, camera `cam(t)`, `chain(t)`, `trace(s, t)`, `peak(N)`, titles via `WorldGlyphs`, HUD, amber layer, subtitles, end card); `render`, `events`, `subs`, `texts` commands. `tex/formulas.json`: MathJax SVG templates for the formula with any upper limit.
- `demo/post.py`: the phosphor pass (channels → colour, bloom, shoulder, vignette, dither, CRT power-off).
- `demo/mix.py`: voice, the Fourier plucks, signal tone, foley and score from `events.json`.
- Minimal example of something new: a single phasor and its projection.
  ```python
  c = (0.0, 0.0, 1.5)                                           # camera: centre and zoom
  x, y = 200 * math.cos(W * t), -200 * math.sin(W * t)            # 1 V = 200 world units
  out = [circ(*w2s(c, 0, 0), 200 * c[2], TR, 0.95, 2.4), poly([w2s(c, 0, 0), w2s(c, x, y)], HOT, 1, 3.0)]
  ```

## 11. Variation space

The agent decides the mathematics or physics, the order of revelations, the camera path, the twist, whether there is a voice, and the music.

- **Structures**: a question, a construction, a twist found by looking closer; a sequence of approximations converging (or not); two signals compared on two channels.
- **Openings**: a beam writing the answer before the question; a power-on (dot → line → graticule); a formula whose letters become the first object.
- **Endings**: a pull-back over the whole result; the name of the phenomenon written by the beam; a CRT switch-off.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
