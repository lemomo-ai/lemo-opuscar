# CRT ASCII Terminal: Style Prompt

> Everything on screen is a real character on a monospace grid, lit by the phosphor of an old monochrome CRT.
> References (grammar only): 1970s–80s monochrome terminals and teletype logs (typed output, cursor, status lines); ASCII art and demoscene text-mode pictures (images from glyph density); analog-synth film scores of the early 1980s (cold pulse, patient drones). Copy no film's interface text, fonts or logos, and use no real agency names.

## 1. Essence, and what it is not

A single monochrome terminal screen: **P3 amber** (or P1 green) phosphor glowing on dark glass, curved at the edges, with scanlines. Every image, including title, landscape, face, room and subtitles, is made of **real glyphs placed on a character grid** and chosen by ink density. The film has one camera, the screen itself. It moves only by changing the **font size of the grid**: bigger characters push in, smaller characters pull out.

The mood is cold, patient and machine-calm: typed text, a blinking cursor as suspense, and one warm surprise.

**Never** fake it with an image plus an "ASCII filter". Characters must be drawn as characters on a grid. Not a hacker-movie green rain, not a pixel-art game (no sprites, no free pixels), not a sci-fi HUD (no vector lines, no free-floating panels).

## 2. Materials & rendering

- **Font**: one monospace bitmap-style font (VT323, OFL); cell 0.4 em × 0.8 em (1:2). A large prerendered glyph atlas with a stroke for beam spread, scaled with `drawImage`, keeps zooms continuous and sharp.
- **Grids**: column count per shot (title ~20, terminal 80, picture 200+); a push-in can go until one cell holds a sub-grid of its own.
- **Density ramp**: each glyph's measured ink coverage × dim / normal / bold → about 20 levels, near-duplicates dropped; a small ordered-plus-hash dither per cell; cells below a threshold stay blank. **Negative space makes ASCII art readable.**
- **Picture pipeline**: paint grayscale into an offscreen "negative" aligned exactly to the grid (several samples per cell; channels for phosphor, second colour, a flag), average per cell, pick a glyph. Interiors get local contrast (`m + 0.9·(m − mean)`) to keep outlines.
- **Recognisable subjects**: silhouettes, not noise (real coastline polygons, a face from a few planes); dark = sparse dim glyphs, bright = dense bold, shadow sides sparse `.` only; an angle with a clear silhouette.
- **Depth on a grid**: far = darker and sparser, near = brighter and denser; a thin bright rim separates planes.
- **CRT post** (WebGL, adapted from `core/post/crt.js`):
  - **Phosphor colour**: luminance maps along the phosphor's ramp (dim deep orange → amber → overexposed near-white for P3).
  - **Glow**: multi-level bloom plus a faint halo.
  - **Glass**: fine scanlines (narrower on bright areas), slight barrel curvature, rounded mask, warm near-black unlit glass, faint reflection, ~1 % flicker, fine noise. **No RGB grille: monochrome tubes have none.**
- **Afterglow**: text that disappears decays with τ ≈ 0.1 s, computed analytically so every frame is deterministic. Moving glyphs get one faint trail sample.

## 3. Colour logic

- **One phosphor** carries everything: amber, green or white, in its own brightness ramp. No second hue for decoration.
- **At most one soft second colour**, used for one thing only (the emotional object), switched on at a single moment, on a downbeat, and never taken back casually.
- Examples: amber screen with an ice blue-white for something far away; green screen with a warm pink for a living thing; white P4 screen with a pale gold for a memory.
- Brightness is the only other tool: dim / normal / bold and inverse video.

## 4. Type & subtitles

- **Subtitles are terminal output.** A reserved **LOG strip** at the bottom: a dim separator, an inverse-video tag, then a prompt and the line in uppercase at ~45 px. It is **typed word by word in sync with the voice** (whisper word timestamps) and holds ≥ max(1.8 s, speech + 0.6 s). It lives outside the zooming grid, like a status line, with the same scanlines and glow. When nobody speaks it can show system state (a progress bar, a waiting message).
- **On-screen text that the story shows** is picture, not subtitle; in the `.srt` it appears as `[SCREEN] …`.
- **Titles** are typed with key clicks, as a filename, a command or a header.

## 5. Motion quality

- **Characters never move off-grid, except in a declared transformation moment.** Typing, scrolling and counters jump from cell to cell. A roller flips digits discretely, fast then slowing.
- **Only three things move continuously**: grid scale (the camera), CRT physics, and particles in a transformation.
- **Typing speed is performance**: machine output is even and fast (~10–40 ms/char); dramatic lines slow to note values of the score; human typing is hand-timed, uneven, with pauses and bursts.
- **Particles** spawn from random points inside source glyphs, start small, fade in, ease to their cell, and flash briefly on landing, so they never stack into bright bars.
- **Push to a character**: hold where the whole glyph reads, then push until its inner text reads; inner text full brightness, outside text a few percent, neighbours dimmed, so the shape reads before the text.

## 6. Camera grammar

The only camera is the grid scale, plus CRT power states and one possible shot outside the screen.

| Move | What it expresses | Can serve |
|---|---|---|
| Static 80-column terminal | Waiting, procedure, machine time | a countdown; a queue; a log being read |
| Push in (cells grow) | Attention, intimacy | one line of dialogue; a name; a decision typed |
| Pull out (cells shrink) | Context, scale | a title becoming line 1 of a list; one entry among thousands |
| Push into a single glyph | Hidden depth; what a symbol is made of | a letter made of messages; a pixel made of people |
| Scroll (the buffer moves) | Accumulation, time passing | years of records; a changelog; a feed |
| Clear screen / hard redraw | A cut; a new state | a reboot; a new chapter; a crash |
| Text becomes image (grid shrinks as glyphs fall) | Words turning into world | a letter becoming a face; data becoming a map |
| Power on / off, degauss | Birth, death, sleep, shock | a machine waking; an ending; a jolt |
| Pull back off the glass into a drawn room | The screen is an object in a world | who is reading; where the machine is |

Opening and ending come from the topic. Framing: text stays in the safe area inside the curvature; keep the LOG strip clear. Transitions happen on the screen (clear, redraw, scroll, power), never a crossfade between two screens.

## 7. Sound palette

- **Music**: an original analog-synth score, rendered in code (numpy / numba): PolyBLEP saw and square oscillators, a resonant 4-pole ladder filter with moving cutoff, filter envelopes, square-wave sequencers, slow tape wow (± a few cents), long reverb on pads, gated reverb on hits; options also a sub-bass drone, sample-and-hold noise, a detuned unison lead. **Never chiptune.**
- **Technique options**: grow a single arpeggio as an image forms; hold the only major chord for one moment; drop everything, reverb tails included, to digital zero on a shock; open a chord on the colour change.
- **Silence is the main instrument**: room tone alone under typing and blinking cursors; a short near-silence before a transformation.
- **Foley** (all synthesised): relay click and degauss hum (mains hum plus harmonics with a thump); buckling-spring keys (plastic click, spring ping, key-cap thock; duller space bar, heavier Enter); teletype ticks for remote text; modem and phone-line tones (answer tone, FSK, band-limited noise); square-wave error beeps and BEL; clusters of tiny high ticks for particles; a dot-matrix printer or tape drive as options; room tone (fan, low hum, a **very quiet** flyback whine).
- **Mix**: music ducked about −8 dB under the voice; master −14 LUFS with no grain in the mux (the noise lives in the picture).
- **Voice**: when a machine speaks, process it (light ring modulation, a short comb, a telephone-ish band-pass, soft saturation) and check that whisper still reads every line. Few short lines.

## 8. Native moves

A menu: use the ones your story needs.

- **The picture is made of words.** A sentence breaks apart and its letters, sorted by ink density, become an image containing only those letters. *Fits content like:* a manifesto becoming a crowd; a recipe becoming the dish; a poem becoming a landscape.
- **Font size = camera.** Push until one character fills the screen and is itself made of smaller text. *Fits content like:* a company name made of employee names; a year made of its headlines; a heart glyph made of messages.
- **Typing rhythm = editing rhythm.** Even machine typing against uneven human typing; a blinking cursor is a performance. *Fits content like:* a job application; an apology; a password remembered.
- **CRT physics.** Power on as dot → line → frame, off to a dot; afterglow, bloom, curved glass. *Fits content like:* a hospital monitor; a night shift ending; an old archive reopened.
- **A single colour change.** One soft second colour appears once. *Fits content like:* a first green leaf in a data log; a blood-orange sunset in a weather report; a child's drawing in a server room.
- **The log file.** Timestamps, error codes, progress bars tell the story. *Fits content like:* a product launch day; a rescue; a migration.

## 9. Pitfalls of the medium

- **Inverse video**: `destination-out` only changes alpha, which the upload ignores → opaque black canvas, cut letters with a *black* atlas.
- **Negative not aligned to the grid** drifts across hundreds of columns → map with cell width / samples exactly.
- **Wrong cell centre**: cells are 2·cw tall, so the centre is `(j + .5)·2cw`, not `(j + 1)·cw`.
- **Every dark pixel becomes a character** (`-+-+` walls) → threshold, gamma ≈ 1.25, local contrast.
- **Noise-textured subjects read as textured blobs** → silhouettes, a dark sparse background, a dot-only shadow side.
- **Particles from letter centres stack into bars** → random points inside the glyph, small, faded in.
- **Stroked atlas glyphs close their counters** (`M`, `B`) → sample a thin fill-only glyph bitmap for masks.
- **Lazily built data never reaches the exporter** → build particle schedules and their sound events before `window.EV` is exported.
- **A power-on parameter at 0 still draws the centre dot** → exposure 0 before power-on, multiply the dot term by exposure.

## 10. Engine

In `demo/`: `term.js` (glyph atlas, grid drawing, density ramps, image → cells), `art.js` (procedural grayscale scenes for the negative), `crt.js` (monochrome phosphor CRT post, WebGL2), `main.js` (timeline, events `EV`, subtitles `SUBS`), `voice_fx.py` (machine-voice processing), `mix.py` (synthesised foley + ducking), `music/score.py` (analog-synth score), `tools/subs.mjs` (export `window.SUBS`). File map and commands: [DEMO.md](DEMO.md#build-notes).

## 11. Variation space

You decide who types, what the screen is for, the grids, the opening, the ending, the camera (grid) path, the pacing and whether the second colour appears at all. All far from our demo:

- Structures: **a chat log** (two users typing to each other across one night, timestamps as scene headers); **a system manual** (chapter headers, diagrams in ASCII, one page going wrong); **a boot-to-shutdown day** (one machine's day as a sequence of scheduled jobs, each drawing a picture of what it does).
- Openings: **mid-scroll** (a buffer already racing past; it stops on one line); **a printout** (a dot-matrix sheet feeding up, then the screen takes over); **an error first** (a crash dump, then we rewind to what caused it).
- Endings: **the buffer fills** (the story's text scrolls up and away until only the prompt remains); **the screen saver** (after the last line, a slow drifting pattern takes over the idle screen); **the cursor stops blinking** (no power-off, just a final state held).

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
