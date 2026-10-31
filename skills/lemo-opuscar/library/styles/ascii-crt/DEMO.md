# ASCII / CRT Terminal — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *TRANQUILITY.LOG* (59.8 s) · `ascii-crt.mp4` · source in [`demo/`](demo/)


Brief the demo was made to: a 30–60 second film in the ASCII / CRT Terminal style.

## Story & structure

A machine left on the Moon has logged `NO SIGNAL` for 40 years. A message arrives; it replies `I AM STILL HERE.`, and the letters of that reply become an earthrise. We picked a story where **text is the only way the character can act**: a machine, a remote operator, a message across distance or time. How the native powers were used:

| Native power | Story use |
|---|---|
| **The picture is made of words** | The climax *is* a sentence turning into an image. The reply `I AM STILL HERE.` breaks apart and its letters, sorted by ink density, become an earthrise. The image contains **only the letters of that sentence**. |
| **Font size = camera** | Push in until one character fills the screen. That character is itself made of smaller text, which reveals scale and meaning. One `M` is made of 40 years of `NO SIGNAL` logs. |
| **Typing rhythm = editing rhythm** | Machine typing is even and fast. Human typing is uneven, with pauses and bursts. A cursor blinking three times is the most important performance in the film. |
| **CRT physics** | The screen powers on as a dot, then a line, then the full frame, and powers off by collapsing to a dot. Used for the opening and the ending. |
| **A single color change** | Blue-white `#BFE4FF` for Earth, the only non-amber thing, is the emotional peak. Switched on a musical downbeat. |

Adapting ideas we noted while writing it (examples, not rules): a product launch becomes a spec sheet that assembles into the product's silhouette; a love letter becomes its own words raining into a face; a history lesson becomes a log file whose dates zoom out into a map.

**Emotional arc (59.8 s):** dark and a cursor, then waking (boot log, a date jumping), then disturbance (handshake noise, a line of text), then holding breath (cursor blinks), then setback (`NOT FOUND` ×3 on three beats), then decision (typing the reply), then **near-silence for 1–1.5 s**, then the climax (letters become the image, the one color appears), then the scale reveal, then waiting, then a tiny reply, then an echo (pull out of the screen, power off to a dot).

## Shots

| Beat | Camera |
|---|---|
| Opening | CRT off, then a dot, a line and the full frame. A giant cursor blinks 3× in empty space. |
| Title | The title is the file the machine opens, typed at 20 columns. It then **pulls out** to 80 columns as it becomes line 1 of the boot log. |
| Suspense | Static 80-column terminal. The only motion is text and the cursor. Hold on blinks. |
| Decision | **Push in** from 21 px to 80 px cells around the prompt. The reply is typed huge and centered. |
| Climax | The grid shrinks while falling (80 px letters become 8 px cells). Hold on the finished picture, and switch color on the downbeat. |
| Scale reveal | Push into one glyph until it becomes its own sub-grid of text, then snap back. |
| Ending | The **only** shot outside the screen: pull back until the screen image sits inside a character-drawn terminal in a dark room. Next to it is a large porthole showing the real Earth (18–20 rows tall). Only two things glow: the tiny reply and the planet. Then power off to a dot. |

Why this route, for this story: the title typed as a file the machine opens made the machine the narrator; the push-in on the reply made the decision intimate; the only shot outside the screen came last, so the room and the real Earth were a reveal. Each of these is one choice from STYLE.md §6, not the style's default opening or ending.

### The letter fall (the demo's climax, step by step)

1. Hold the sentence for 1.5 s with the cursor blinking.
2. At the split, letters jitter and throw a ghost copy.
3. Each target cell spawns a particle from a random point inside a matching source letter (only letters of the sentence exist in the ramp). The particle starts at 18 px, shrinks to the grid size and fades in over 0.2 s so particles never stack into a bright bar. Its path eases smoothly in x, with y = u·(0.6 + 0.4u).
4. Ground lands bottom to top.
5. Earth letters first all fall *behind the horizon*, then rise into place from bottom to top, so the planet literally rises.
6. Source letters dim as they are used up.
7. The landing flash is 1.9× brightness decaying over 0.12 s.

**Fractal push-in**: push to a framing where the whole `M` is clear and **hold 1 s**, then push further until the log text is readable (cell 450 px, sub-text about 28 px). Text inside the glyph is at full brightness, text outside is at 3–6%, and neighbor glyphs are at 20%.

**Typing speeds used**: boot lines 12 ms/char, commands 38 ms, title and reply 120–150 ms (sixteenth notes at 100 BPM). Human typing uses hand-timed offsets with pauses.

## Score structure

- **Music**: an original Carpenter-style analog synth score, rendered in numpy and numba.
  - **Sound sources**: PolyBLEP saw and square oscillators, a resonant 4-pole ladder filter with moving cutoff, and filter envelopes. Add slow tape wow (±3 cents), a long reverb on the pad and gated reverb on the hits.
  - **Grid and key**: D minor at 100 BPM, with every cut on a bar or beat.
  - **Cue shape**: silence under boot, then a drone and a square-wave 16th sequencer while the machine wakes.
  - **The hard cut**: on the handshake the whole score drops to digital zero, reverb tails included, for five seconds.
  - **Climax**: a single saw arpeggio grows as the letters fall and opens into Bbmaj7 on the color change. **The only major chord** (D major) lands on the reply.
  - **Never chiptune.**
- **Silence is the main instrument.** Handshake, message and cursor blinks play over room tone only, and there are 1.5 s of silence before the picture forms.
- **Foley** (all synthesized):
  - **Relay and degauss**: relay click, degauss hum (60 Hz plus harmonics decaying over 0.35 s, with a thump).
  - **Keys**: buckling-spring keys (plastic click, a 3.4 kHz spring ping, key-cap thock). The space bar is duller and Enter heavier. Remote characters get a dry teletype tick.
  - **Modem**: an original handshake (2100 Hz answer tone with two phase reversals, a dual tone, 1200/2400 FSK, scrambled band noise, all band-limited to a phone line).
  - **Beeps**: a square-wave error beep, a lower one for the final error, and a 1 kHz BEL for the reply.
  - **Particles**: particle landings as clusters of tiny 2–6 kHz ticks.
  - **Room tone**: a fan bed with 120 Hz hum and a **very quiet** 15.7 kHz flyback whine (about −50 dBFS before loudness normalization).
- **Voice**: the machine's log, read by Kokoro `am_echo` at speed 0.8. Process it with 16% ring modulation at 52 Hz, a 6 ms comb (0.22), a 140–7000 Hz band-pass and soft saturation. Whisper still reads it 5/5. Use 4–6 short lines. Under the voice the music is ducked about −8 dB. The master is −14 LUFS with no grain (the noise lives in the picture).

## Palette & props

- **Font and grids**: VT323 atlas prerendered at 160 px with a 2.2 px stroke. Grids used: title 20 columns (cell width 84 px), terminal 80 columns (21 px), picture 240 columns (8 px), room 213 columns (9 px), fractal push-in up to a 450 px cell with a 40-column sub-grid inside each cell.
- **Ramp values**: attributes dim / normal / bold = 0.42 / 0.7 / 1.0; dither amplitude 0.7; cells with luminance < 0.05 stay blank. Negative sampled 3×6 per cell: R = amber luminance, G = second-color luminance, B = a flag such as "night side". Rooms get a 3×3 local-contrast boost.
- **Earth that reads as Earth**: continent polygons in lon/lat (rasterized once to an equirectangular mask) rather than noise. Ocean albedo 0.14 (sparse dim glyphs), land 0.96 (dense bold glyphs), clouds 0.5 (mid-density swirls). A narrow terminator (smoothstep −0.03…0.10) and the night side as sparse `.` only. Angle with a clear silhouette: Africa and Europe. Every continent that can come into view is drawn, Asia included as one landmass with Taiwan and Hainan, even where it lies on the night side; no borders.
- **Lunar ground**: far ground darker and sparser (×0.3), near ground brighter and denser. The horizon gets a thin bright rim (10 px falloff). Craters: the left inner wall is in black shadow, the right inner wall is lit, the rim lip is bright. A few big defined foreground craters.
- **CRT post** (`demo/crt.js`): R maps to amber: dim `#FF6605`, mid `#FFB000`, overexposed toward `#FFEBB8`. G maps to `#B8E0FF`. Four-level bloom at 0.55 plus a halo at 0.22. 3 px scanlines at 0.3; barrel curvature 0.045; unlit glass `#090604`; faint top-left reflection, 1.2% HV flicker.
- **Afterglow**: τ = 0.12 s; one extra trail sample at t − 35 ms × 0.3.
- **LOG strip**: dim dashed separator, inverse-video `LOG` tag, `> ` and the line in uppercase VT323 at 45 px; holds 1.4 s after the line is complete; idle states `TRANSMIT [#####.....] 40%`, `SENT … AWAITING REPLY`.
- **Title**: the filename, typed with key clicks, plus a small dim sub-line.

## End card

Typed over the final room shot (`ASCII / CRT TERMINAL`, `LemoLab × Claude Opus 5.5`), followed by the CRT power-off. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/ascii-crt/demo/
  term.js    glyph atlas, grid drawing, density ramps, image → cells
  art.js     continent texture, earth shading, lunar ground, craters
  crt.js     monochrome phosphor CRT post (WebGL2)
  main.js    the whole timeline: boot, handshake, message, reply, letter fall, fractal, room, end card, EV, SUBS
  voice_fx.py  AI voice processing      mix.py  synthesized foley + ducking + score
  music/score.py  original analog-synth score      tools/subs.mjs  export window.SUBS
```

1. `node core/render/still.mjs styles/ascii-crt/demo --range 33.4:37.4:0.2` renders frames of any section; `?frame=earth|fractal|base|poster` renders single tests; `?nosub=1` renders without the LOG strip.
2. `sh styles/ascii-crt/demo/build.sh` goes from zero to the finished film: TTS, voice FX, whisper, score, events, mix, SRT, render (1435 frames in about 50 s with 3 workers), mux, styleframe, poster.

Pitfalls tied to this demo's props:

- **Offscreen negative drift** showed up as doubled stars and misaligned crater edges across 200 columns.
- **A noise-textured Earth reads as a textured ball.** Use continent silhouettes, a dark sparse ocean and a dot-only night side.
- **Particles bursting from 13 letter centers stack into a glowing bar.**
- **Earth letters rising through the still-visible sentence look messy.** Send them all behind the horizon first, then rise.
- **The thick (stroked) atlas glyph closes the gaps of `M`.** For the fractal mask, sample a separate *thin* (fill-only) glyph bitmap.
- **Lazily built data**: without building the particle schedule first, the foley for the fall was silent.
