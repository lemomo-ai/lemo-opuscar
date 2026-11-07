# Swiss Motion Graphics — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Five Rules for a Poster* (44 s) · `swiss-motion.mp4` · source in [`demo/`](demo/)


A 30–60 second film: five rules build one concert poster on a grid; a red circle breaks the grid, and the poster turns out to be the score of the music. The demo sets Archivo as its one family.

## Story & structure

Pure 2D graphic design animated on a grid: flat white paper, black type and bars, a very light grey and **one** saturated red. It is the language of 1950s–70s Zurich concert posters (Müller-Brockmann, Hofmann, Gerstner, Crouwel) turned into motion the way modern identity systems move (Experimental Jetset, Pentagram): **every element snaps to the grid, every move lands on a beat, nothing bounces**.

The charm is **rigor with one exception**. The whole frame obeys a system, so the one element that doesn't obey it becomes a character.

Never copy a specific historical poster's composition (no concentric-circle or fan compositions lifted from Müller-Brockmann). Don't use Helvetica or Akzidenz font files. Pick an OFL neo-grotesque (Archivo, Inter, Schibsted Grotesk, Instrument Sans…). Never name a real institution on a poster.

Pick stories where **the system itself tells the story**. The demo used all five native powers, the strongest (the grid means something) at the peak:

| Native power | Story use |
|---|---|
| **The modular grid** | The grid is the stage and the rulebook. Show it being built (lines draw on the beat), show it briefly in section gaps, and at the peak **make the grid mean something**: in the demo, 7 columns = the 7 notes of A dorian and 16 rows = 16 eighth notes, so the poster *is* the score. |
| **Snap = beat** | Every element's arrival is a percussion hit: type clack, knife, ruling pen. Picture and music share one coordinate system, not a sync pass after the fact. |
| **Rules generate design (programme)** | The plot is a set of rules applied one by one to one artifact. End by showing the same programme generating many artifacts (the Gerstner reveal). |
| **Extreme scale contrast** | A 700 px numeral next to 19 px technical notes. The giant element is the chapter card, the tiny one is texture. |
| **One signal colour** | Only one thing is red, so red = the protagonist. When it breaks a rule it is the only thing on screen that is not exact. |

**Adapting any topic:** turn it into **a system plus one exception**. A product launch: the product's spec sheet assembles on a grid, then one feature breaks out of it. A company's history: each decade is a rule added to one poster. A love story: two red elements on two different grids, and the film ends when one of them leaves its grid.

**Emotional arc (30–60s):** order being built (curious, crisp) → order complete (correct and a bit dull, *say it*) → hesitation (the red element twitches and snaps back) → the break (the only non-snapped, linear move in the film; drums drop out) → everything else re-flows around it, better (full band back) → the reveal (the grid means something) → scale reveal (same system, many outputs) → back to the hero artifact on the end card.

## Shots

The "camera" is a 2D matrix (centre, scale, rotation). It moves only with the precise ease and only on beats.

| Beat | Camera |
|---|---|
| Opening | Locked full frame. One gesture: a red line strikes across and the grid columns grow out of it on sixteenths |
| Building (rules) | Locked spread, so the viewer reads cause (rule, left) → effect (artifact, right) |
| The break | Left page slides out, artifact moves to centre-left, grid lines extend across the whole frame (the grid is bigger than the page) |
| Reveal | **Rotate the artifact 90° in 1.5 beats and stop.** Only then do labels (note names, bar numbers) wipe in, then the playhead sweeps two bars. Each bar turns red on the exact frame of its onset: put onsets on whole frames (multiples of 0.25 s at 24 fps) |
| Scale reveal | Rotate back while pulling out to a wall of artifacts from the same system |
| Ending | The red line strikes again and cuts the other artifacts away. Push back to the opening spread, end card on the left page, hero artifact on the right |

- **Two curves only.** Precise ease `cubic-bezier(.7,0,.2,1)` for snaps, linear for lines being drawn, the playhead and the rule-breaker. No overshoot, no spring, no bounce.
- **Durations are note values** at the film's BPM (120: 1/8 = 0.25 s, 1/16 = 0.125 s). A snap starts one note value early and **lands on the beat**.
- **Entrances are wipes or clip-reveals, never fades.** Words rise out of a clip rect from below the baseline (1/16 note) and leave upward (1/8 note). Lines grow along their length. Paper appears by a vertical wipe. Big numerals climb in **4 eased steps** ("one module at a time").
- **Deletions are knife cuts.** A 2 px line crosses the element in 1/16, then the element collapses vertically to its midline in 1/8.
- **Ripples are ordered by distance** from the cause. After the red circle lands, units re-flow two at a time on sixteenths, nearest first.
- **The exception moves differently.** It is linear, not snapped, and pauses for one eighth mid-flight (a glance back). It grows as it travels. A coordinate readout next to it turns from `col 5.00 row 0.00 · on grid` to red `off grid` with non-integer (even negative) values.
- Everything renders at a smooth 24 fps. There's no stepping: this style is digital precision, not hand-made.

## Score structure

- **Music**: Motorik / krautrock, 120 BPM, A dorian (not a generic piano-and-strings bed). Layer one instrument per rule:
  1. hats only;
  2. + full motorik kit (`drum_kit`: kick 1, 3, 3&; snare 2, 4; closed hat eighths);
  3. + `electric_bass` eighth-note root pulse;
  4. + numpy saw arpeggio sixteenths with an opening filter;
  5. + `glockenspiel` doubled by a soft numpy square lead.

  **Drop the drums for the one bar of the break**, return on the landing. Before the reveal add one bar of near-silence (bass pedal + quarter-note tick). During the reveal keep only kick + bass + melody so every note is audible.
- **The melody comes from the same JSON as the picture** (`score.json`: column → pitch, row → onset, length → duration). "The poster is the score" is true in code, not faked.
- **Foley follows materials**, dry and close, no reverb:
  - letterpress clack (metal transient + 3.3 / 5.1 kHz resonances + wooden tray);
  - ruling pen "tss";
  - guillotine (band-pass sweep + metal snick);
  - paper slap / slide;
  - numeral "thunk" per step;
  - block snap;
  - circle landing (58 Hz felt thump).

  The rule-breaker is the only element that *sings*: a sine glide that follows its position.
- **Voice**: cool, crisp female narrator, Kokoro `af_sarah` at speed 1.0. It has ~7× the 3–8 kHz consonant energy of `af_kore`. Keep lines rule-like: "Rule one. Build a grid." Check every line with whisper (write numbers as `"asr": "Rule 1, …"`).
- **Mix**: voice compressed, music ducked ~−10 dB under voice (voice ≥ 6 dB above music), −14 LUFS.

## Palette & props

- **Frame grid**: 1920×1080, 12 columns, 96 px side margins, 24 px gutters (122 px columns), 24 px baseline. Treat the frame as a **spread**: left page (cols 1–6) = the "programme" (numeral, rule text, notes); right page (cols 8–12) = the artifact (poster 706×1008, ratio 0.70 ≈ Swiss world format).
- **Artifact grid**: derive it from the content (Gerstner). In the demo the poster has 7 columns × 91 px and 16 rows × 40 px, with a 26 px baseline grid in the text zone. Not 12 semitone columns: bars would be only 43 px wide and the poster looks like a data chart. **Choose module sizes that give the bars mass.**
- **Palette**: page `#EAE9E5`, paper `#FFFFFF`, ink `#111111`, signal red `#E30613`, grid lines `#CFCEC9` on the page / `#C9C8C2` while building / `#E2E1DC` on paper, secondary bars `#CFCEC9`. No gradients, no shadows, no particles, no grain (mux grain 0).
- **Type**: one family for the whole film (demo: **Archivo** variable, weights 400–800). Letter-spacing −2.2% at ≥ 90 px. Lowercase headlines (`neue musik`). Rule numerals at ~980 px (700 px figure height), bottom-aligned with the poster's bottom edge, **optically** flush left (subtract the glyph's left bearing). Notes 19 px Medium. Always `document.fonts.load` every weight before drawing.
- **Composition**: flush left, ragged right. Everything on a grid line. Big white spaces are part of the layout. The final composition must be **visibly bolder** than the "correct" one:
  - one main diagonal with a strong long-short rhythm;
  - the red element at ~2× scale;
  - elements **bleeding** off the paper edge;
  - type overprinting the red circle (black on red).
  Merely tilting the correct layout is not enough.
- **Bars as notes**: bar width = column minus 8 px; consecutive cells of one note merge into one bar (overdraw 1 px at the seams or antialiasing shows hairlines, especially when rotated).
- **The secondary voice** (bass) is light-grey bars under the black ones. They read as a shadow diagonal and give depth without a second colour.

## Titles, subtitles & end card

- **Subtitles are part of the layout**, not a bar at the bottom. Each line sits at column 1 on the spread's left page: the first sentence as a 30 px Medium grey lead-in, the rest as a 76 px Bold statement. Each word clip-reveals on its whisper timestamp. Non-rule lines use Regular weight ("Perfect. And a little dull."). In other shots the line sits at column 1 of that shot, at the artifact's headline baseline or under the wall like a museum label.
- **Title card**: `Five Rules / for a Poster`, 120 px Bold, two lines flush left, sitting on the opening red line. A 19 px caption row with a 1 px rule above it (`A programme in five steps · 1961 · ♩ = 120`).
- **Caption row + notes**: top of the left page (title / `Rule 0n / 05` / keyword); bottom of column 5: 2–3 technical notes per rule (`Columns 7 · Rows 16 · Module 91 × 40`). Bottom of column 7: a bar counter `bar 04.3`.
- **End card**: the opening spread again. `Swiss Motion / Graphics` 120 px, red line under it, `LemoLab × Claude Opus 5.5` 36 px, notes at the bottom (typeface, score, voice, and the licence credit for the MuldjordKit drums, CC BY 4.0, revealed early enough to hold 2.7 s), hero poster on the right. The LemoLab sign-off belongs to this library's demo only: a user's film carries no LemoLab credit and no copy of this card.

## Pitfalls

- **12 columns look like a chart.** Grid modules must give the graphic elements mass. Use fewer, wider columns for the artifact and keep the standard 12 columns for the frame.
- **The "better" composition must be obviously better.** Turning four small staircases into one scattered layout isn't convincing. Use one main diagonal with long/short rhythm, 2× red element, bleeds, type over red.
- **Rotation reveal needs a stop.** Rotating and labelling at the same time reads as noise. Order it: rotate (1.5 beats) → hold → grid lines → labels → playhead → sweep.
- **Merged bars show seams** after rotation and scaling (antialiasing between adjacent rects). Overdraw 1 px where cells join.
- **Labels overlapping the header**: hide the caption row before the rotated shot.
- **Word timings**: whisper splits or merges words ("type face"), and `asr_check` reports the first word at −0.6 s (padding). Align by letters and clamp to 0 (`tools/words.py`).
- **Subtitle rule** (≥ voice + 0.6 s and ≥ 1.8 s): a line can miss it by a couple of ms. `tools/subs.py` asserts it; fix by nudging start times.
- **The wall cut must follow the line**: shrink the wall board from the side the red line enters, in screen space.
- The other posters on the wall share the camera matrix, so draw them **only** during the wall shot. Otherwise they leak into other shots at ±786 px.
- Canvas `letterSpacing` also affects `measureText`, so compute widths after setting the font.

## Build notes

```
styles/swiss-motion/demo/
  score.json  grid = score: stiff / final melody, bass, circle, bleeds, timeline
  ease.js     cubic-bezier(.7,0,.2,1), snap(t, t_arrive, dur), steps(), track()
  film.js     layout system, rules, poster, circle, reveal, wall, end card, foley events
  main.js     loads fonts, score, lines, whisper word times; ?nosub=1, ?poster=1
  lines.json  voice script (af_sarah)          tools/words.py  word timings → subtitle reveal
  music/score.py  motorik score from score.json   mix.py  foley + ducked voice + music
  tools/subs.py   subtitle intervals (asserted) → srt     build.sh  one-shot rebuild
```

1. Design the layout system first: frame grid, artifact grid, what columns and rows *mean*. Write `score.json`.
2. `node core/render/still.mjs styles/swiss-motion/demo --range 0.5:43.5:1 --out …` then `sheet.py`. Review a 1 s overview plus dense 0.25 s strips around the break and each transition.
3. `tts.py` → `asr_check.py` (0 mismatches) → `tools/words.py`.
4. `music/score.py` (onsets from `score.json`; check sweep onsets ≤ 5 ms) → `events.mjs` → `mix.py` (prints voice/music/foley dB per line).
5. `video.mjs --workers 3` (1056 frames in ~12 s) → `mux.sh … 24 0`. Or simply `sh styles/swiss-motion/demo/build.sh` (~55 s from zero).
