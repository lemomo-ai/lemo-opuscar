# Editorial Explainer — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Twenty-Three* (47 s) · `editorial-explainer.mp4` · source in [`demo/`](demo/)

## Story & structure

Logline: how many people must be in a room before two of them share a birthday? It feels like 183, half the calendar; the answer is 23, because what grows is the number of pairs.

Arc: the question (a calendar of 365 squares, a few party guests) → the guess (183, set huge, then crossed out) → the answer (23, highlighted) → the turn (not people against dates but people against each other: 23 cut-outs in a ring, 22 pencil lines from one of them, then all 253) → the proof (the probability curve passing 50% at 23 and 99% at 57) → the whole desk, and one slip on top: COUNT THE PAIRS.

Why it fits: the argument is a correction of an intuition, which is what the style's *guess, struck out* is for, and its turn is a change of what is being counted, which the *pencil web* can show without a word. Native moves spent: guess struck out (11 s), highlight on the word (throughout), cut-outs as a count (13–15 s), pencil web (18–24 s, the peak), chart drawn while spoken (30–36 s), the whole desk (38 s to the end).

The six clusters lie on one desk in a 3 × 2 arrangement, about 6000 × 2300 units; the camera visits them in reading order and the last shot shows all of them.

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–5.5 | Calendar card filling with 365 squares, headline slip HOW MANY PEOPLE, serif slip, six cut-out guests | slow push, 1.02 → 1.10 | highlight on "share a birthday?" |
| 2 | 5.5–11.1 | 183 on a torn strip; a mini calendar hatched to its 183rd day; pencil note "half the calendar?" | whip right, then push | at 10.65 two pencil strokes cross the 183 out, in silence |
| 3 | 11.1–14.5 | Sheet "THE REAL ANSWER"; 23 lands at 12.6 and is highlighted; 23 cut-outs pop along the bottom | whip right, push 1.0 → 1.13 | the answer lands on the first chord after the silence |
| 4 | 14.5–20.9 | Ring of 23 cut-outs; slip "people × dates" struck out; slip "people × people" highlighted; 22 lines fan from one person | long whip down-left, slow push | the turn |
| 5 | 20.9–29.5 | Counter slip PAIRS ticking 22 → 253 while the web fills, accelerating; one pair turns yellow, both circled, "same day!" | push 1.03 → 1.08 | pencil web; the score divides to sixteenths |
| 6 | 29.5–33.3 | Graph-paper card; the curve is drawn to 23; yellow point, drop line, slip "23 PEOPLE 50.7%" | whip right, slow push | chart drawn while spoken |
| 7 | 33.3–37.7 | The curve runs on to 57 and flattens; slip "57 PEOPLE 99%" | push toward the top of the curve | — |
| 8 | 37.7–46.8 | All six clusters; on the calendar one square is highlighted and circled; at 41.4 a slip as wide as half the desk lands: COUNT THE PAIRS. | pull out to 0.31 over 2 s, then a slow push | the whole desk; held 5.4 s |

## Score structure

100 bpm, 4/4, Am · F · C · G, one chord per bar; every line of narration starts on a beat (`t` in `lines.json`). Marimba eighths and a shaker under the question; the bass enters with the guess; everything stops at 10.65 while the 183 is crossed out (about 2 s with only pencil foley and the narrator); a plucked C chord, marimba and bass land with the 23 at 12.6; the groove returns a bar later with plucked strings; while the pairs multiply (21.2–24.0) the marimba adds sixteenths that grow louder, ending on a G stab with the 253; two bell notes on the matching pair (26.7); the groove under the chart with stabs at 50.7% (31.8) and, an octave higher, at 99% (35.4); it stops at 36.9; the last line is spoken over four single marimba notes; a final C stab with the slip at 41.4, two bars of marimba and shaker, and a bell with a last marimba note at 46.2.

Mix: narration about 15 dB above the ducked score, foley between them; −14.3 LUFS after `mux.sh`.

## Palette & props

Desk `#E7E0D1`, paper `#FBFAF6`, graph cards `#F3F0E7`, ink `#161616`, highlighter `#FFDC2E`, counter-tone `#7C93A6` (grid, hatched half-calendar, the dashed 50% line), under-sheets kraft `#D9CDB4` / `#DCCFB6`, grey-blue `#C9D3D8` / `#CCD6DA`, cream `#EFE9DC`.

Cut-outs: 23 busts from five hair shapes (cap, long, bun, none, side part) with hashed tones for face and shoulders; the same 23 appear in the row under the answer and in the ring. The matching pair is seats 4 and 15 (`MATCH`). The chords of a 23-point ring never pass through its centre, which is why the web leaves a small empty circle there.

## End card

No separate card: the film ends on the whole desk with the COUNT THE PAIRS. slip. At 43.6 s the sign-off `ivishalanand × LemoLab × Claude Fable 5.2` appears in the label mono (21 px, `#3A3630`) at the bottom centre of the frame, after the last subtitle strip has gone, and holds 3.2 s to the end (`CREDIT`, `T.credit` in `film.js`). ivishalanand made this style and its demo. The "LemoLab" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this line.

## Build notes

`sh styles/editorial-explainer/demo/build.sh` rebuilds everything (fonts, voice, checks, score, mix, subtitles, picture, mux, stills); the picture renders in about 25 s on an M-series Mac with 4 workers.

| File | What it does |
|---|---|
| `desk.js` | the engine (STYLE.md §10) |
| `film.js` | the six clusters, camera shots, subtitle strips, and `events()`: foley, score cues and subtitle cues from the same times `T` |
| `main.js`, `index.html` | fonts, page contract (`DUR`, `render`, `EV`, `TEXTS`), `?nosub=1`, `?poster=1` |
| `lines.json` | narration, line starts on the 0.6 s beat grid, subtitle cues as `[text, keyword]` |
| `music/score.py` | the score, from the `cue` events |
| `mix.py` | foley from the events, narration, ducking |
| `tools/subs.py` | subtitle cues → `out/subs.json`, with the duration asserts |
| `tools/fonts.sh` | fetches the four font families |
| `FACTS.md` | the film's numbers and how they are computed |

Notes tied to this demo: "fifty percent" is transcribed as "50%" (the `asr` field of `l7`); the counter's ticking values are marked `pass: true` for `readcheck` and only the final 253 is timed; the serif slip must land by 3.4 s and the "same day!" note by 27.3 s to be readable before the next whip; the last cue of `l4` ends 0.03 s before `l5` starts so that it keeps its speech + 0.6 s.
