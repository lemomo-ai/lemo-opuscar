# Oscilloscope Math — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Gibbs Phenomenon* 《吉布斯现象》 (51.1 s) · `oscilloscope-math.mp4` · source in [`demo/`](demo/)

How do you roll a square out of circles? A beam writes a perfect square wave; the question's letters turn into a circle; one spinning circle draws a sine, smaller and faster circles hang on its tip, and the wave turns square. Then STOP, and the camera dives into one corner: there is a spike, and adding a hundred, then four hundred circles only makes it thinner, never shorter. The overshoot is measured at 8.95 % of the jump; the upper limit of the sum becomes ∞, the camera pulls back over the whole wave with a light on every corner, and only then is the phenomenon named. English voice (Kokoro `am_michael`), Chinese and English subtitles. The numbers on screen are computed by the film; their mathematical sources are in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: the circles can build a square wave, but never its corners.

Arc: hook (the ideal square and the question) → build (one circle, a sine; a circle three times as fast and a third the size; then odd ones only, faster and faster) → twist (STOP, the dive, the spike that will not shrink, measured) → ending (∞, the pull-back, the name, power-off). The promise is a square; the ending is the square you can never quite reach.

Native moves spent: *the beam writing* (the cold-open square, every title), *text into geometry* (question → circle, chapter title → axis), *epicycle chain* (shots 2–3), *match cut* (tip arc → wave crest), *knob zoom* (the dive), *cursor measurement* (the overshoot), *STOP* and *power-off*.

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–4.6 | A dot ignites; the beam writes an ideal square wave (1 Hz, ±1 V) | follows the writing point at 1.7×, then pulls back to 0.9× (3.0–4.6) | the beam writing |
| 1b | 4.5–8.3 | Title "How do you roll a square out of *circles?*" traced and filled by the beam above the wave | locked | a 3.8 s hold |
| 1c | 8.3–9.6 | Every letter morphs into the same circle (staggered rings); the square fades | push to the circle (0.9× → 1.5×) | text into geometry |
| 2 | 9.6–13.4 | The radius grows from the centre; RUN at 10.15; the circle spins, a dashed line carries the tip's height to the trace | pushes onto the rotation, then rides the tip at 2.6× | epicycle, afterglow, tip trail |
| 2b | 13.4 | At the top of its turn the tip's arc cuts to the crest of the sine, same place, same curve | hard match cut | |
| 2c | 13.4–16.4 | Circle, connector and sine together; readouts light up | pull back to 0.92× | readouts from the same values |
| 3 | 14.6–19.2 | Chapter title "Any wave is a sum of *circles*" / 任何波，都是圆的叠加 written top left; at 18.4 its letters fly down and straighten into the time axis; the graticule brightens | locked | title becomes the axis |
| 3b | 19.4–25.4 | The formula lights glyph by glyph (Σ upper limit = number of circles); a circle ×3 · r = 1/3 grows on the tip, its label hanging beside it; the new trace loses its shoulders | push and follow the small circle (1.9×), back to 0.92× | |
| 3c | 25.35–30.45 | ×5, ×7, then 21 circles faster and faster (N = 25); the wave turns square while the older trace on the right keeps the history | pull out to 0.7× | acceleration |
| 4 | 30.45–32.8 | STOP: the picture freezes, the music stops | dive into the newest rising corner, 0.7× → 14×; the graticule refines, 250 ms/div → 50 ms/div | knob zoom |
| 4b | 32.8–43.0 | The spike. Amber cursors at 1.000 V and the peak, Δ = 0.179 V; circles added to 100 and 400 (35.05, 36.55): the spike thins and moves towards the edge, the reading holds; at 37.3 "8.95 % of the 2 V jump" | locked so the thinning is seen | cursor measurement; 5.7 s hold |
| 5 | 43.0–45.6 | Σ → ∞; the cursors go | pull back 14× → 0.55× over the whole wave and the chain | |
| 5b | 45.0–50.3 | Amber lights on every corner's spike, a wave of light running along them; title "The *Gibbs phenomenon*" / 吉布斯现象 traced by the beam, "overshoot → 8.95 % for every N, even ∞" under it | locked | the name comes last |
| 5c | 46.6–50.3 | End card (below) | locked | |
| 5d | 50.3–51.1 | Power-off: the picture collapses to a bright line, then a dot | | CRT switch-off |

## Voice and subtitles

Ten lines (`demo/voice/lines.json`, Kokoro `am_michael`, speed 0.82, about 2.5 words a second), each checked with `asr_check.py`; one subtitle cue per line, bilingual, one line per language, exported to `oscilloscope-math.srt` from the same table. Numbers are spelled out in the voice text and written as digits in the subtitles. The STOP and the dive (30.45–31.0) and the power-off are wordless.

| # | Start | English (spoken) | 中文 |
|---|---|---|---|
| 1 | 0.9 | Here is a square wave. Flat tops, sharp corners. | 这是一个方波：平顶，直角。 |
| 2 | 5.6 | So how do you roll it out of circles? | 那么，怎样用圆把它滚出来？ |
| 3 | 9.95 | Start with one spinning circle. | 先让一个圆转起来。 |
| 4 | 12.65 | Follow its tip. Its height draws a sine wave. | 盯住它的尖端：它的高度画出一条正弦波。 |
| 5 | 18.95 | Hang a smaller one on its tip: three times as fast, a third the size. | 在尖端再挂一个小圆：转速是三倍，大小是三分之一。 |
| 6 | 25.1 | Then a fifth, a seventh, odd ones only, until the wave is square. | 再加五倍、七倍，只要奇数倍，直到波形变方。 |
| 7 | 31.0 | But look closely at a corner. | 可是，凑近看一个角。 |
| 8 | 33.5 | There's a spike. Add more circles, and it only gets thinner. | 这里冒出一个尖。圆加得再多，它也只是变窄。 |
| 9 | 38.25 | It never gets shorter. About 9%, every time. | 它从来不会变矮：每次都高出约 9%。 |
| 10 | 42.8 | Even infinitely many circles leave it there. It's called the Gibbs phenomenon. | 就算有无穷多个圆，它也还在。这叫吉布斯现象。 |

## Score structure

96 BPM, A minor turning to A major at the end; the lead's timbre follows the circles on screen.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Cold open | 0–9.5 | square-timbre plucks in a question figure each bar, high bowed vibraphone (E5 A5 B5), relay and warm-up chirp, a buzz while the beam writes, a tick per corner and per glyph | the square on screen is a square in the ear |
| One circle | 9.5–16.6 | the pluck turns to a pure sine; 8th-note pulse from RUN; A–F–C–G | the match cut lands on a tick |
| Circles | 16.6–30.45 | each new circle: a detent click and a bell at its own harmonic (330, 550, 770 Hz); the pluck gains odd harmonics; 16ths in the rush; synth bass with 2nd/3rd harmonics; a 110 Hz signal tone that is the same partial sum | the title-to-axis morph falls with a noise sweep and a thump |
| STOP | 30.45 | relay clack, the music cut dead (reverb tail only) | the film's first silence |
| Corner | 31–42.6 | a low drone (55/110/165 Hz), a soft clock on the beat, one high glockenspiel on "spike", rising blip bursts as circles are added | |
| Ending | 43.05–50.3 | the infinity bell chord, A-major arpeggio in square timbre, glockenspiel answering the lights on the spikes, held chord under the end card | |
| Power-off | 50.3 | falling zap, thump, silence | |

Mix (`mix.py`): the voice is compressed and set by RMS about 10 dB over the music while it speaks; the music's 300 Hz–4 kHz band is cut under the voice and the foley steps back; −14 LUFS from `mux.sh`. All cue times come from `timeline.json` through `film.py events`, so the sound follows any retiming.

## Palette & props

- Screen #010402, ambient #0B2412, beam #4DFF88, text #8DFFB0, hot core #E6FFEC, CH2 amber #FFB547.
- World units: 1 V = 200, 1 s of signal = 400 (so 0.50 V/div and 250 ms/div at zoom 1 with 100-unit divisions); the chain's centre is the origin and the write head is at x = 490; the trace scrolls right, newest at the head.
- The formula f(t) = 4/π Σ_{k=1}^{N} sin((2k−1)ωt)/(2k−1) with N live; the coefficients aₙ = 4/(nπ) are the radii drawn.

## End card

On the last frame, bottom right on the glass, typed by the beam after a hairline: *Oscilloscope Math* 示波器数学 (STIX italic and Noto Serif SC, 28 px), then `LemoLab × Claude Opus 5.5` (JetBrains Mono, 30 px). The film's title is the name written top left in the same frame, "The *Gibbs phenomenon*" / 吉布斯现象. Typed 46.6–47.4 s, held to 50.3 s, then the power-off. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh         one command: Manim venv and fonts (if missing) → voice (if missing) → speech check → picture (WORKERS slices)
                   → phosphor pass → events, cues → .srt → mix → master → readcheck → poster, styleframe
  film.py          frame(t): world, camera, chain, trace, titles (WorldGlyphs), HUD, amber layer, subtitles, end card;
                   commands render / events / subs / texts
  post.py          phosphor pass: channel colours, bloom, shoulder, vignette, dither, CRT power-off
  mix.py           voice + score + signal tone + foley from out/events.json -> out/mix.wav
  timeline.json    every cue in film seconds (voice starts, births, STOP, dive, titles, end card, power-off)
  voice/           lines.json (Kokoro am_michael; one asr override: Whisper writes "9%"), subs.json (bilingual cues)
  tex/formulas.json  the formula as MathJax SVG templates (any upper limit, and ∞); tools/tex2svg.mjs regenerates it
  make_fonts.py    static instances of JetBrains Mono, STIX Two Text and the Noto Serif SC subset
  tools/gibbs.py   the overshoot for any N, checked against (2/π)·Si(π)
  tools/readcheck.html  bridge page so core/render/readcheck.mjs can read the texts film.py exports
  FACTS.md         the mathematics on screen and its sources
```

- `sh demo/build.sh` (24 fps, `WORKERS=2` by default). Needs ffmpeg 7+, Python 3.12 with `uv` (Manim 0.22.1, OpenCV and fontTools go into `demo/.venv`; no LaTeX), the library's `.venv`, the voice tier and the VCSL samples: `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vcsl`. Fonts are downloaded from google/fonts on the first run; delete `demo/fonts/*.ttf` after any change to Chinese text.
- The picture is a pure function of film time: Manim mobjects are rebuilt every frame from `t`, rendered with Manim's Cairo camera into RGBA PNGs (R beam, G text, B hot cores, A amber), and the phosphor pass has no state, so both run in parallel slices. About 0.1–0.5 s a frame for Manim on Apple silicon; the phosphor pass is the slower half.
- Demo-specific pitfalls: the chain's full reach (2.13 V) must stay inside the graticule, which sets 200 units per volt; the corner the camera dives into is chosen as the newest rising edge written after the last circle finished growing (STOP is 0.3 s of signal after it); in the frozen trace, circles added after STOP apply to the whole curve, earlier ones keep their history; the spike is sampled densely around every edge or it vanishes at 0.55×; the title morph aligns each glyph's outline with the target path (Manim `align_points`).
