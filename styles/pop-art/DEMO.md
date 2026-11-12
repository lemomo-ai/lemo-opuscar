# Pop Art — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Same Banana* 《同一根香蕉》 (52.0 s) · `pop-art.mp4` · source in [`demo/`](demo/)

Why almost every banana in the shops is the same banana, told with the three things pop art does natively: repetition (a clone is a print pulled again and again), the dot screen (a disease is dots growing over the print) and colourways (the way out is one tile flipping to another colour, then a whole wall). An English narrator (Kokoro `am_michael`) tells it; Chinese and English subtitles are printed on a paper slip. The facts are sourced in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: one banana poster is copied into a wall; the old banana's prints are eaten black by dots, the new one's wall starts to darken too, and one tile flipping to another colour turns into a thousand kinds of banana that add up to one giant banana.

Arc: hook (coin-sized dots pull back to one print: "the same banana") → copies stamped into a wall ("one plant, copied") → no seeds (cross-section) → each plant grows from the one before (a row of copies) → 1950s: the Gros Michel prints are eaten by dots rising from the soil → the Cavendish replaces it, printed plate by plate, stamped RESISTANT → the clone wall again, a front of dots crosses it (TR4, Colombia 2019), near silence → one tile flips red, a wave of colour flips the wall (1,000+ kinds) → pull back: the tiles' grounds draw a giant banana made of many bananas; end card.

The clone wall appears three times, each time meaning something else: copies, threat, diversity. The opening pull (dots → one banana) and the closing pull (many bananas → one giant banana) mirror each other.

Native moves spent: *dot pull* (opening), *stamped copies* (wall), *push into a round shape, match cut* (disc → cross-section), *through a letterform* (1950s), *dots as data* (Panama disease, TR4), *plate-by-plate print* (Cavendish), *colour wave* (the turn), *mosaic echo* (ending).

## Shots

Film time; shot starts in `SHOTS` in `demo/timeline.py`, everything else derived in `demo/main.js`.

| # | Time | Shot | Camera / transition | Move |
|---|---|---|---|---|
| 1 | 0–4.6 | Coin-sized red dots over yellow (the banana's belly shade) → a single print: cobalt ground, paper disc, yellow banana; beside it THE SAME / BANANA. / 同一根香蕉 printed on the sheet | log pull ×18 → ×1.45 with 0.55 rad rotation settling | dot pull |
| 2 | 4.6–10.0 | Copies stamped in rings around the first print, faster and faster, covering the words; a wall, every copy a little off-register; label ONE PLANT. COPIED. 同一株，复制 | pull to ×0.37 with a slight tilt | stamped copies |
| 3 | 10.0–12.9 | Push into one paper disc → match cut to a cross-section poster on red; the seed specks ringed one by one; NO / SEEDS. / 没有种子 | 0.38 s exponential push, round-to-round cut, small overshoot | match cut |
| 4 | 12.9–16.0 | The same long print continues right: yellow field, brown soil; a sucker beside each plant grows into the next, a runner underground links them: ORIGINAL, COPY 01 … 05 | lateral track, one plant per beat | stamped copies |
| 5 | 16.0–21.6 | 1950s slams onto a yellow sheet; through the counter of its 0 the next print already shows; the camera passes through it into an older edition (red ground, dotted yellow sun, the plumper Gros Michel, more age, wider misregistration); label GROS MICHEL / 大麦克 · THE OLD BANANA | cut on the slam, push through the letterform, slow push | through a letterform |
| 6 | 21.6–26.6 | Pull back to five Gros Michel prints in a row; red and blue dots climb from the bottom, bigger the deeper, eating the prints black left to right; label PANAMA DISEASE / 巴拿马病 | pull to a row | dots as data |
| 7 | 26.6–30.9 | Push into the last black print until it fills the frame; it flips like a card into the opening Cavendish print; yellow, red, blue and black plates land one by one, sliding into register; label CAVENDISH / 香芽蕉; a red RESISTANT 抗病 stamp on the poster | push, flip, pull back | plate-by-plate print |
| 8 | 30.9–40.45 | The clone wall again; a front of red-purple dots crosses it from the left and swallows the RESISTANT stamp; labels TROPICAL RACE 4 / 热带 4 号小种, then 2019 → COLOMBIA / 哥伦比亚; from 39.9 near silence | big pull, then a slow push, then held | dots as data |
| 9 | 40.45–44.9 | The centre tile flips to a red banana on yellow; a wave of flips spreads out: red, blue-green, pink, purple, striped, short, long; label 1,000+ / KINDS OF BANANA / 一千多种香蕉 | fast pull | colour wave |
| 10 | 44.9–52.0 | Further back: the tiles' grounds (yellow body, orange belly, green stem, blue around) make a giant banana; its black key line is drawn along the tile edges; end card 47.4–52.0 | the widest pull, then held | mosaic echo |

Transitions: stamp, round-to-round match cut, lateral track, cut on a slam, through a letterform, card flip, plate-by-plate print, colour wave; no dissolves, no fades to black.

## Voice and subtitles

Eleven cues, fifteen phrase clips (`demo/voice/lines.json`), placed by the start times in `CUES` in `demo/timeline.py`; each clip passes `asr_check.py` (`base.en`; `asr` fields record Whisper's spelling of "Gros Michel" and "Colombia"). Numbers are spelled out in the voice, digits in the subtitles. About 2.2–2.7 words a second, breaths between lines.

| Time | English | 中文 |
|---|---|---|
| 0.50 | Almost every banana you buy is the same banana. | 你买到的香蕉，几乎都是同一根香蕉。 |
| 4.90 | Not just the same kind. The same plant, copied. | 不只是同一个品种，是同一株植物的复制。 |
| 10.45 | The Cavendish has no seeds. | 香芽蕉没有种子。 |
| 13.20 | Each one grows from a piece of another. | 每一株，都是从另一株身上分出来的。 |
| 16.85 | Your grandparents ate a different banana, the Gros Michel. | 你的祖父母吃的是另一种：大麦克。 |
| 21.95 | In the 1950s, a soil fungus tore through its farms. | 1950 年代，一种土壤真菌席卷了它的种植园。 |
| 27.05 | So the trade switched to the Cavendish, which resisted it. | 于是整个行业换成了能抵抗它的香芽蕉。 |
| 31.50 | Now a new strain, Tropical Race 4, kills the Cavendish as well. | 现在，新菌株「热带 4 号」连香芽蕉也能杀死。 |
| 37.20 | In 2019, it reached Colombia. | 2019 年，它到了哥伦比亚。 |
| 40.80 | Yet over 1,000 kinds of banana grow on Earth. | 可地球上的香蕉，有一千多种。 |
| 45.47 | The way out is not one perfect banana. It's many. | 出路不是一根完美的香蕉，而是很多种。 |

Subtitles are printed by the page (paper slip, bottom centre) and exported to `pop-art.srt` by `timeline.py`; every cue holds ≥ max(1.8 s, speech + 0.6 s) (shortest 2.67 s).

## Score structure

Original 60s exotica, 112 BPM, C major; chords and moods per shot in `SECT` in `demo/mix.py`.

| Section | Time | Palette |
|---|---|---|
| Intro | 0–4.6 | vibraphone, marimba motif, shaker |
| Groove | 4.6–16.0 | jazz bass on 1 and 3, conga, shaker, vibraphone off-beats, marimba motif every bar (C, F, Am, G) |
| Retro | 16.0–21.6 | the groove with a muted-trumpet line (F) |
| Dark | 21.6–26.6 | bass pedal, bowed vibraphone, low conga (Dm) |
| Bright | 26.6–30.9 | groove with claps, a staccato-trumpet fanfare on the flip (C) |
| Dark 2 | 30.9–39.9 | bass pedal, bowed vibraphone with a raised third, sparse marimba (Am) |
| Hush | 39.9–40.45 | one held contrabass note, music at about −9 dB |
| Joy | 40.45–47.4 | trumpet chord and group claps on the turn; one marimba note per flip climbing a C major scale; groove with claps (C, F) |
| End | 47.4–52.0 | vibraphone chord, glockenspiel, muted trumpets; 1.6 s fade |

Foley from `events.json`: squeegee and thunk for every printed label, a stamp per copy (thinned once they come fast), whooshes for pulls and dives, a paper snap on the match cut, ticks on the ringed seeds, a thump per grown plant, a slam for 1950s, a crackle bed for each spreading front, a card flick per flip, a thunk per plate, a rubber stamp for RESISTANT, a long friction for the key line. Mix: voice compressed and set 10 dB over the music by RMS, the music losing part of 300 Hz–4 kHz and ducking 45 % under the voice, foley at half level and ducked under the voice; a limiter caps peaks at RMS + 11 dB so the master reaches −14 LUFS under −1 dB true peak.

## Palette & props

- Inks: red #E4232B, yellow #FFD21F, blue #1E62B0, key #141414, paper #F8F2E2; orange, green and the dark purple of the disease are overprinted dots.
- The clone print: cobalt ground, paper disc, Cavendish banana tilted −0.38 rad. The old print: red ground, dotted yellow sun, plumper Gros Michel, caption GROS MICHEL, age 0.42. The cross-section: rounded pentagon, three soft lobes, nine seed specks. The plants: pseudostem and six broad leaves, a sucker growing beside each.
- Eleven banana colourways in `VAR` (`demo/banana.js`): Cavendish, Gros Michel, red, blue-green, plantain, small finger, pink, purple, striped, orange, green.
- Labels: paper slips, 5 px black frame, 12 px red or blue offset block, tilted ±2–3°, top left.

## End card

On the final mosaic, top left, a paper slip tilted −1.4°: MANY BANANAS (Anton 132 px, red), 不止一种香蕉 (Noto Sans SC Black 56 px), POP ART · 波普艺术 (38 px, blue), `LemoLab × Claude Opus 5.5` (Archivo Black 34 px). Printed with the slip at 47.4 s and held 4.6 s while the giant banana stays on screen. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh         one command: fonts and voice (if missing) → speech check → timeline + .srt → events → picture → mix → master → readcheck → poster, styleframe
  index.html       one canvas, fonts.css
  main.js          render(t): the wall (stamps, flips, mosaic), shots 1–10, printType, label, subtitles, EV, TEXTS; ?from=&to= renders a span, ?sign10=1 a sign-off label in 7.5–10 s, ?nosubs=1 hides subtitles (poster, styleframe at 42.4 s)
  banana.js        banana, bananaLite, bananaPolys, slice, plant, VAR (colourways)
  engine/pop.js    the print engine (plates, key, spot; dots, misregistration, plate mask, readable text boxes)
  timeline.py      shot starts, narration cues → timeline.json, pop-art.srt
  mix.py           voice + score + foley from timeline.json and events.json → out/mix.wav (with start end: a cut with a short fade)
  voice/lines.json Kokoro am_michael phrases (rendered to out/voice/)
  tools/font_subset.py   Noto Sans SC Black subset for the characters in main.js and timeline.py
  tools/final_asr.py     Whisper on the finished film, line by line against the script
  FACTS.md         sources and wording for every fact
```

- `sh demo/build.sh` renders at 24 fps with `--workers 2` (`WORKERS=3` for more). On a new clone, first: `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce`, `… vcsl`, `… karoryfer`. Fonts are downloaded on the first run (the CJK subset needs a connection); delete `demo/fonts/NotoSansSC-Black-subset.ttf` after changing any Chinese text.
- About 30 s for the whole film with two workers on Apple silicon; the final mosaic (≈ 900 tiles, simplified below 0.16 zoom) is the slowest part. `render(t)` depends on `t` only.
- Demo-specific notes: the giant banana's colours come from testing each tile centre against the giant's outline (`gInk`), and its key line is built from the cell edges between inside and outside tiles (`G_EDGES`), so line and colours always agree; the rot overlay is drawn after the unflipped tiles and before the flipped ones, so a flip clears it.
