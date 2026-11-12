# Marker on Paper — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *How Far Can You See?* 《你能看多远？》 (52 s) · `marker-paper.mp4` · `marker-paper.srt` · source in [`demo/`](demo/)

An English narrator asks how far the horizon is from a beach; three sheets of white paper answer it with a black, a blue and a red marker. Subtitles carry each line in Chinese and English. The numbers and their sources are in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Hook: stand on a beach — how far away is the horizon? Middle: your line of sight grazes the Earth at a right angle, so it is a right triangle; h² is tiny, drop it; d ≈ √(2Rh) ≈ 4.5 km. Landing on a contrast: climb a hundred times higher (160 m) and you see only ten times farther (45 km); from a plane ten kilometres up, about 357 km. The last stroke circles the rule. Each sheet brings one new thing: the question, the answer, the contrast. Red goes further every time: a question mark, a term, a circled number, a line across the whole sheet, the circled rule.

Native moves spent: the unknown in red (sheet ①), push through a shape (the right-angle mark, ① → ②), same colour same quantity (the algebra), scribble it out (h²), the peel (② → ③), bars to scale with one a dot (③), the last red circle.

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0–3.2 | one sweep draws the Earth's arc, 65 hatch flicks, the figure, the line of sight, a ship with only its sail above the horizon, the right-angle mark | close 1.5×, following the pen left to right | |
| 2 | 3.2–3.95 | — | pull back to the whole sheet | room for the question |
| 3 | 3.85–6.55 | "How far away is the horizon?" written as it is spoken, 地平线有多远？, page ① | locked | |
| 4 | 7.45–10.4 | blue h = 1.6 m, two dashed radii, R = 6,371 km; red double arrow and d = ? | from 8.1 s lean in to 1.7× on h, R and d (title and page number wholly out, after they have been read) | the unknown in red |
| 5 | 11.6–12.35 | the right-angle mark fills the frame | push through the mark to 7×, accelerating | push through a shape |
| 6 | 12.35–13.25 | sheet ②: the same mark, same place, size and line weight, alone on white | pull out to the whole sheet | match cut |
| 7 | 13.25–19.8 | Earth arc, figure, red line of sight d grazing it, "Look closer", the pen goes over the right angle again (double ink), blue R, R, h | locked | |
| 8 | 18.4–20.7 | (R + h)² = R² + d² in the drawing's colours | from 19.8 s follow the pen into the algebra, 1.5× | same colour, same quantity |
| 9 | 20.7–25.0 | d² = 2Rh + h², h² scribbled out with "tiny"; red d ≈ √(2Rh); the numbers put in | 1.5× | scribble it out |
| 10 | 26.2–29.0 | ≈ 4.5 km in red, two underlines, the first red circle | lean in to 1.62× | |
| 11 | 29.0–29.8 | the corner lifts, the fold sweeps, the sheet is pulled off | — | the peel |
| 12 | 29.8–33.55 | "What if you climb?", 爬高一点呢？, page ③; the first two rows begin | locked | |
| 13 | 31.9–36.2 | figure 1.6 m → a red dot 4.5 km; tower 160 m (blue ×100) → red bar 45 km (red ×10) | from 33.55 s lean in to 1.8× on the two rows | bars to scale |
| 14 | 36.2–37.2 | the long empty line waiting on the right | pull back, almost silent | scale reveal |
| 15 | 37.2–43.9 | plane, 10 km; one red stroke across the sheet (1.2 s); ≈ 357 km; "bars drawn to scale" | locked | |
| 16 | 43.9–46.85 | d ≈ √(2Rh) written top right, the last red circle, 高四倍，远两倍 | lean in to 2× on the rule (title wholly out) | the last red circle |
| 17 | 46.85–47.6 | the whole sheet: question, three rows, circled rule | pull back to the whole sheet | |
| 18 | 47.6–52.0 | end card written in the empty corner (below) | locked | |

## Narration and subtitles

English, Kokoro `bm_george` at speed 0.84 (≈ 2.5 words/s); numbers spelled out in the voice text ([`demo/vo/lines.json`](demo/vo/lines.json)), digits in the subtitles. Every line passes `core/tts/asr_check.py`.

| Start (s) | English | 中文字幕 |
|---|---|---|
| 0.30 | Stand on a beach, and look out to sea. | 站在海边，望向大海。 |
| 3.95 | How far away is the horizon? | 地平线离你有多远？ |
| 7.45 | Blue is what we know. Red is what we want. | 蓝色是已知的，红色是要求的。 |
| 13.20 | Your line of sight just grazes the Earth, at a right angle. | 视线刚好擦过地球，和半径成直角。 |
| 19.70 | h² is tiny, so we drop it. | h² 小到可以忽略，划掉它。 |
| 23.40 | From 1.6 m up: about 4.5 km. | 眼高 1.6 米：大约 4.5 公里。 |
| 29.90 | Now, climb 100 times higher. | 现在，爬高 100 倍。 |
| 33.15 | You see only 10 times farther. | 你只能多看远 10 倍。 |
| 37.20 | From a plane, 10 km up: about 357 km. | 从 10 公里高的飞机上看：大约 357 公里。 |
| 44.05 | The view grows only with the square root of your height. | 视野只随高度的平方根增长。 |

## Score structure

100 bpm (beat 0.6 s, bar 2.4 s), D dorian resolving to F major. Pizzicato double bass walks under the drawing; staccato clarinet and bassoon carry a "thinking" figure; shaker and claves keep a light pulse; harp and glockenspiel only where red lands.

- 10.2 s, red `d = ?`: an A sus4 left hanging (the question). The glockenspiel climbs during the push-through; a low pluck on the cut (12.35 s).
- 18.4 s, the silent algebra: the woodwind figure fills it. 21.8 s, the scribble: a low pluck and a woodblock. 27.6 s, the red circle round 4.5 km: F major (the answer).
- 29.0–29.8 s, the peel: music stops, paper only (silence 1). 36.2–37.2 s, the scale reveal: near silence (silence 2).
- 39.4 s, the plane's red line: a harp run low to high with the pen. 46.2 s, the last red circle: the full F major chord. 48.35 s, the signature down: a soft harp arpeggio and glockenspiel that settle to the end.
- Mix: voice compressed, music −10 dB under it by RMS and cut 6 dB between 300 Hz and 4 kHz, foley −7 dB under it; −14 LUFS, true peak ≤ −1 dBTP.

## Palette & props

Paper `#FAF9F5`; black `#1B1C20`; red `#E23B2E`; blue `#2456D6`; peel back `#E2E0D9` → `#F7F6F2`. Props are drawn in the same marker: a stick figure with a cap shading its eyes, a sailboat, a lattice tower, a small plane. The Earth's curvature is exaggerated on sheets ① and ②; the bars on sheet ③ are to scale (1150 px = 357 km).

## End card

Written in the empty bottom-right corner of sheet ③ with the black marker, 47.62–48.35 s, held to 52.0 s (3.65 s whole): a short rule, *How far can you see?*, 你能看多远？, *Marker on Paper 马克笔白纸速写*, and **LemoLab × Claude Opus 5.5** (Kalam Bold 34 px). The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```sh
sh styles/marker-paper/demo/build.sh              # the whole film → marker-paper.mp4, marker-paper.srt, poster.jpg, demo/stills/styleframe.jpg
sh styles/marker-paper/demo/build.sh 0 12 out/cut.mp4   # any stretch of the timeline
node core/render/still.mjs styles/marker-paper/demo 27.5 --q nosubs=1   # one moment, without the subtitle slip
```

| File | What it is |
|---|---|
| `demo/index.html` | the page; loads `film.js` |
| `demo/film.js` | three sheets on one timeline: every pen action and its time, camera keys, the push-through match cut, the peel, the subtitle slip, `window.EV` (pen-downs, peel, cues, voice) and `window.TEXTS` |
| `demo/pen.js` | the marker brush, ink-density layers, glyph-skeleton handwriting, paper, compositor |
| `demo/glyphs.json`, `demo/tools/skeleton.py`, `demo/tools/zh_chars.txt` | glyph centre lines for Kalam Bold / Regular and LXGW Marker Gothic, the script that makes them, and every Chinese character the film writes or subtitles |
| `demo/tools/subset_film.py` | the LXGW Marker Gothic subset (`fonts/LXGWMarkerGothic-film.ttf`) |
| `demo/vo/lines.json`, `demo/vo/dur.json`, `demo/vo/words.json` | the narration text (and the transcript each line must match), durations, word times |
| `demo/mix.py` | voice, felt-marker foley from the pen-down events, peel and push sounds, the score; balance by RMS |
| `demo/tools/srt.mjs` | subtitle cues from the page → `out/cues.json` → `core/render/srt.py` |
| `demo/build.sh` | fonts (downloaded when missing), subset, skeletons, voice (when missing), events, picture, sound, master, subtitles, poster |
| `demo/CREDITS`, `demo/FACTS.md` | fonts, voice, samples; every number with its source |

On a fresh clone `build.sh` first fetches the voice model and the two sample packs the score uses (`sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce`, `sh tools/fetch.sh instruments vcsl`). Order: fonts → subset → skeletons → voice + speech check → `events.mjs` → `video.mjs` (2 workers ≈ 4 min) → `mix.py` → `mux.sh` → subtitles → poster. The fonts, the voice WAVs and the renders stay local; `build.sh` makes them again. Review: a contact sheet every 1.5 s, a speech-to-text pass over the finished film against the subtitles, `ebur128`, `blackdetect`, `core/render/readcheck.mjs`.

Pitfalls tied to this demo: every lean-in starts only after the texts it pushes out have had their reading time (`readcheck.mjs` measures a text until it leaves the frame); the push-through needs the sheet-② mark built in sheet ①'s turn (the geometry is rotated by the line-of-sight angle) and its size × zoom equal on both sides of the cut (28 px × 7 = 64 px × 3.06); the arc on sheet ② must stop short of the algebra column.
