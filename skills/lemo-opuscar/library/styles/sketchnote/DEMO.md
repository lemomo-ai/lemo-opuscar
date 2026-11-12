# Sketchnote — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *How Bees Make Honey* (51 s) · `sketchnote.mp4` · source in [`demo/`](demo/)

## Story & structure

A biology lecture's notes, as a short film. **Hook**: a pen draws a spoon and one yellow drop falls in: "In her whole life, one bee makes this much honey. One twelfth of a teaspoon." **Question**: "So where does it come from?" The camera whips up the empty page and the title is written.

**Journey**: the yellow is the drop, and the camera follows it across the page:
- the flower, where nectar is mostly water;
- a shape match cut from the flower's yellow centre to the honey stomach, with the bee drawn around it;
- a dive into the stomach, where invertase splits sucrose into glucose and fructose;
- the camera rides the pen round the hive's box;
- wings fan the water from up to 80 % down to about 18 %, a comparison held whole on screen;
- wax seals the cell and yellow fills the jar: "Honey."

**Turn**: one pound takes nectar from two million flowers, drawn as flowers multiplying.

**Ending**: the pull-back to the whole page; the last yellow loop goes round the 1/12 of the opening.

Native moves spent: the page writes itself (throughout), one colour as the thread (the drop), shape match cut (15.6 s), dive (20–24 s), ride the pen (25–27 s), pull-back poster (44–51 s).

## Shots

| # | Time (s) | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–4.6 | spoon, ONE BEE, / ONE LIFETIME, the drop falls in | 3.3×, slow pull | the page writes itself |
| 2 | 4.6–7.7 | "= 1/12" large, "teaspoon", a yellow swash | 2.5×, drift right | |
| 3 | 7.7–10.1 | the title banner, title, Chinese line | whip up the empty page to 1.6× | whip |
| 4 | 10.1–14.4 | 1 SIP: box, banner, flower, NECTAR, droplets | tilt down, 1.75–1.85× slow push | |
| 5 | 14.4–15.6 | the flower's yellow centre | push to 8× | |
| 6 | 15.6–19.9 | the honey stomach alone, the bee drawn round it, 2 CARRY | cut to the same screen size, pull back to 2.1× | shape match cut |
| 7 | 19.9–23.4 | sucrose → glucose + fructose inside the stomach | dive to 14× | dive into an icon |
| 8 | 23.4–25.1 | + INVERTASE, an enzyme that splits sugar | back out to 1.9× | |
| 9 | 25.1–26.9 | the box of 3 FAN drawn by one pen, the comb by a second | ride the pen tip at 1.45× | ride the pen |
| 10 | 26.9–30.2 | comb, three bees, wind lines | 1.9–2.0× | |
| 11 | 30.2–36.0 | the water chart, 80 % → 18 % | tilt down, 2.05→2.18×, held | comparison whole ≥ 2.5 s |
| 12 | 36.0–39.4 | 4 SEAL, jar, wax-capped cell, the jar fills yellow | pan right, 1.85–1.9× | biggest yellow |
| 13 | 39.4–44.2 | "1 lb of honey takes" / 2,000,000 / flower visits, nine flowers | pan down-left to 1.9×, drift right | several pens |
| 14 | 44.2–47.4 | the header, flight path, takeaway box finish together | pull back 2.0× → 0.84× | pull-back poster |
| 15 | 47.4–51.0 | the yellow loop round 1/12, closing chord, footer | locked on the whole page | end card |

## Score structure

- No music for the first 8 s: pen, the drop's "plip".
- Music enters on the question (8.0 s): F major, 100 bpm, soft marimba on the beat, pizzicato cello, a kalimba note on each new block; chords change with the story (F, Dm, Bb, Gm for the dive with bowed vibraphone, C, Am, Bb, F on "Honey.", Dm, Bb).
- Glockenspiel sparkles on "Honey."; on the pull-back the glockenspiel climbs, then half a beat of rest (47.0–47.5 s) and the closing chord (harp strum, glockenspiel, vibraphone, low pizzicato) at 47.5 s, ringing out to 51 s.
- Whooshes of paper and air on the whip (7.7 s), match cut (15.4 s), dive (20.1 s) and pull-back (44.2 s).
- Mix: voice compressed, ≈ 10 dB over the music by RMS while she speaks (≈ 9.4 dB over the pens); music −4 dB in 300 Hz–4 kHz and ducked ≈ 5 dB under the voice; master −14 LUFS.
- Voice: Kokoro `af_heart`, speed 0.78 (0.74 for the invertase line), 11 lines split into phrases with 0.32 s breaths; 1.9–2.6 words/s.

## Palette & props

- **Palette**: "honey & graphite": paper #FBFAF6, ink #1E1E22, notes #5B5852, grey marker in three strengths, yellow rgba(255,205,40,.80), dark yellow #F5AA00.
- **Props**, all drawn in code:
  - the spoon;
  - the flower (grey petals, yellow centre, three water droplets);
  - the bee (grey body, ink stripes clipped to the abdomen, two marker-tinted wings, the honey stomach as a dashed yellow oval);
  - a sucrose ring pair and its split products, about 3 px on the page;
  - a 7-cell comb with two yellow cells;
  - the water chart;
  - a jar with a lid, a glass highlight and a label;
  - an open cell and a wax-capped cell;
  - a row of tiny flowers;
  - the takeaway box "NECTAR + ENZYMES − WATER = HONEY".
- Page text: English, plus one Chinese line under the title.

## End card

The footer of the page, written by the pen at 47.6–48.35 s and held to 51.0 s: a dashed rule, "How Bees Make Honey · Sketchnote 视觉笔记" on the left, "LemoLab × Claude Opus 5.5" on the right (Kalam Bold, ≈ 29 px on screen). The final framing (0.84×) leaves the footer above the subtitle slip. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- **One command**: `sh styles/sketchnote/demo/build.sh` (`WORKERS=2` by default). It runs:
  1. the sample libraries the score plays, downloaded if missing (`core/audio/sampler.py --need mix.py`), then fonts if missing (`tools/fonts.sh`);
  2. glyph skeletons if missing (`tools/skeleton.py`);
  3. voice (Kokoro, `voice/lines.json` → `voice/out/`) and `asr_check.py`;
  4. `timeline.py` (line starts, subtitle cues, `timeline.json`, `sketchnote.srt`);
  5. events, picture, `mix.py`, `mux.sh`;
  6. readcheck (written to `demo/out/readcheck.txt`);
  7. style frame: the finished page at 47.5 s (before the footer), rendered without the subtitle slip (`index.html?nosub=1`); poster: the film's frame at 48.7 s (`frame_sec` in `style.json`).
- **Files**: `index.html` (engine, the page, camera, subtitles); `glyphs.json` (skeletons for Kalam Bold, Patrick Hand, ZCOOL KuaiLe); `timeline.py` (the narration starts and both subtitle languages); `mix.py` (foley, score, balance); `voice/lines.json` (the phrases; the `asr` field on the invertase line holds what the small Whisper model writes for that word).
- **Re-render a few seconds**: `index.html?from=a&to=b` renders only [a, b) of the film.
- **Reading check**: readcheck lists the notes the camera passes before they have been on screen for their full reading time. They are all on screen again, whole, in the final page hold, and the voice-over or the subtitles carry the same point while they are written.
- **Picture timing**: the picture is timed to the line starts in `timeline.py`; if the voice changes, check each line still ends before the next start.
- **Facts on screen and in the voice**: [`demo/FACTS.md`](demo/FACTS.md).
