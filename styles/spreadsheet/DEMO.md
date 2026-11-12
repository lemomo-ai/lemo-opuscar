# Spreadsheet Film — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Hidden Column* 《藏起来的那一列》 (52.0 s) · `spreadsheet.mp4` · source in [`demo/`](demo/)

Simpson's paradox told in one sheet, on the real data of a 1986 kidney-stone study: 700 patients, one cell each. English narration, bilingual subtitles (one Chinese line, one English line), English on screen with a Chinese title. Every number and its source is in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: the total says treatment B works better; open the columns the sheet was hiding (stone size) and A wins in every group, because A was given most of the hard cases.

Arc: a question (two averages, 78 % vs 83 %, "which would you choose?") → the data under the numbers (pull out: 700 patient cells painted success / failure) → the clue (the column letters skip; double lines mark folded columns) → the reveal (Unhide: the sheet opens like an accordion, a stone-size cell beside every patient; A's block is mostly large stones) → the reversal (a pivot: 700 cells hop into two rooms, small and large stones; A wins both, 93–87 and 73–69) → the name (better in every group, worse in total: Simpson's paradox) → the payoff (a colour scale floods the whole sheet from the title cell, the farthest pull-out of the film) → the end card in a merged cell.

Native moves spent: *pull out from a formula cell* for the first reveal; *conditional format sweep* for the 700 patients; *hidden columns* as the turn; *a count drawn as cells* for "most large stones went to A"; *cells that move* for the pivot; *reference boxes as pointers* on A's weighted average; *merged cell as stage* for the title and end card; the background colour scale as the finale.

## Shots

Times in seconds; zoom is the sheet's zoom (shell fixed).

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–2.15 | A's overall result cell in edit mode under unpainted rows of 1/0; `=AVERAGE(A_outcome)` typed, a blue reference box around A's 350 cells; Enter at 2.0, 78 % pops, a pale ring runs out | close, 283 % → 270 %, slow push | formula bar as dialogue |
| 2 | 2.15–4.6 | the selected cell hops 7 cells to B's result; `=AVERAGE(B_outcome)`; 83 % at 4.0, painted lime "▲ higher" at 4.45 | follow the selection | the hero leads the eye |
| 3 | 4.6–7.5 | both results side by side; the cross cursor hovers over 78 %, then 83 % | pull to 112 % | the choice handed to the viewer |
| 4 | 7.5–10.0 | 700 cells painted in rings from the two result cells, status bar counting 0 → 700; crash on the full frame at 10.0 | **signature pull-out** 106 % → 79 % | conditional format sweep |
| 5 | 10.0–14.55 | the selection hops into A's block; a cell comment: "Patient 104 · Treatment A · success · Stone size: not shown" | slow push 85 % → 95 % | plants the clue |
| 6 | 14.55–17.4 | 0.45 s of silence; the header: C E G I…, a double line between every pair, turning red as the voice says columns are hidden | whip up and push to 205 %, track along the header | hidden columns (clue) |
| 7 | 17.4–20.4 | select all, right-click "Unhide columns"; 28 columns open left to right (`#`, `##`, then L / S); A's block mostly indigo, B's mostly pale | pull out to 48 % while the sheet widens | hidden columns (reveal) |
| 8 | 20.4–24.8 | `=COUNTIF(A_size, "L")`; under each block a 28-cell bar fills: 21 cells "263 of 350 have large stones" vs 6 cells "80" | locked wide | a count drawn as cells |
| 9 | 24.8–29.15 | `=PIVOTBY(size, treatment, outcome, AVERAGE)`, Enter at 26.45; 700 cells lift and hop into four bars in two rooms, successes at the bottom, failures on top | follow the cells down, 48 % → 74 % | cells that move |
| 10 | 29.15–33.9 | small-stone room: 93 % (A) at 31.8, 87 % (B) at 32.9, A's cell painted "▲ A wins" | push in to 110 % | verdict 1 |
| 11 | 33.9–38.5 | large-stone room: 73 % at 36.4, 69 % at 37.6, A wins | track right | verdict 2 |
| 12 | 38.5–44.95 | four bars, four rates and "All 700 patients, together: A 78 %, B 83 % (B wins)" in one frame; A's weighted average typed with blue and purple reference boxes on A's narrow and wide bars; at 43.75 the title "Simpson's paradox 辛普森悖论" turns amber | pull back to 75 %, held 6 s | the paradox held still |
| 13 | 44.95–47.55 | a six-step pastel colour scale floods every empty cell outward from the title | **farthest pull-out**, 76 % → 36 % | the whole sheet becomes the picture |
| 14 | 47.55–52.0 | the end-card range merges open from its centre and is typed into; the home chord rings out | drop and land at 100 % | merged cell as stage |

## Score structure

C major, 120 BPM (beat 0.5 s), instruments: MuldjordKit drums, electric bass, Salamander piano, marimba, xylophone, glockenspiel.

- 0–2.0: four marimba notes under the typing; kick on the first Enter.
- 2.0–7.5: half-time groove, bass on the roots (C | Am | F), no stabs; a crash and a marimba arpeggio when 83 % lands.
- 7.5–10.0: four on the floor on G with a snare build; crash and a piano chord at 10.0.
- 10.0–14.55: half-time groove with piano stabs under the voice.
- 14.55–15.0: music cut to silence; 15.0 a low A held on bass and piano with a ticking hi-hat and sparse marimba (the clue).
- 18.55–19.85: one xylophone step per opening column, rising; a crash, then the groove returns (F | G | Am | Em) with a snare build into the pivot.
- 26.45–29.5: the fullest section: four on the floor, sixteenth mallets while 700 cells fly.
- 29.5–38.75: light half-time groove; each win gets a marimba triad and a glockenspiel note.
- 38.75–44.95: no drums, long piano chords (Am → F → G) for the held paradox; a crash when the title lands.
- 44.95–47.55: four on the floor and rising sixteenth marimba arpeggios with the colour scale; a snare lift into the landing.
- 47.75–52.0: C major chord on the merge, mallet arpeggio and glockenspiel when the title is typed; the mix fades with the last second.

Mix: voice compressed and set 10 dB over the music by RMS while speaking; music carved −4 dB at 300 Hz–4 kHz and ducked under speech; foley from `events.json` (2,338 events); master −14 LUFS, true peak about −1.7 dB.

Narration: Kokoro `af_bella`, speed 0.86, 13 lines in 20 phrases with 0.3 s breaths, about 2.4 words per second. The letter "A" at the start of a phrase is written `"A"` in the voice text so it is read as the letter, not the article.

## Palette & props

- Success lime `#b8f25a` (ink `#2c4a00`), failure red `#e8382d`, large stone indigo `#2a2f6c`, small stone pale `#dfe6f3`, hero amber `#ffb21f`, ink `#17120a`, reference blue `#2f6fe0` and purple `#b03ad6`, comment yellow `#fff4c7`, shell greys `#dcdbd5` / `#f1f0eb` / `#ecebe6`; finale scale `#d4f57a #fff09a #ffc99e #ffb3c9 #b9dcff #a8efd5`.
- Layout: two patient blocks of 14 × 25 (outcome column + hidden size column per patient), result rows under them, count bars below, the pivot (bars 4 / 12 / 12 / 4 cells wide, bottom at row 70) further down, the end card below the totals.
- The shell: file `kidney-stones-1986.sheet`, tabs "patients" and "study notes", toolbar with Conditional format and Pivot buttons; drawn in code, no product name.

## End card

A 26 × 14 merged range in the sheet: "The Hidden Column" typed in 76 px, "藏起来的那一列", a rule of nine coloured cells, and at the right "Spreadsheet Film · 表格动画" and "LemoLab × Claude Opus 5.5". It opens at 47.75 s, is typed from 48.6 s and holds to 52.0 s. The sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- A fresh clone first needs the core and voice tiers (`sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice`) and three sample libraries: `sh tools/fetch.sh instruments freepats`, `… vcsl`, `… salamander`. Set `LIB` to another library folder to borrow its environment.
- `sh demo/build.sh`: fonts (downloaded from google/fonts and subset by `tools/fonts.py` if missing), voice (Kokoro, only when the WAVs are missing) and the speech-to-text check, `timeline.py` (line starts → `tl.js`, `timeline.json`, `../spreadsheet.srt`), events, picture (`--workers 2`, about 30–40 s on Apple silicon), `mix.py`, master, readcheck, poster and style frame. `sh demo/build.sh cut 20 30` renders any slice of the same timeline.
- `index.html` reads `?from=&to=` (a slice of the timeline) and `?nosub=1` (no subtitle note, for the poster).
- `window.TEXTS` reports the texts the viewer is meant to read (merged cells, the comment, the end card); cell values, the shell and the subtitle note are left out. Four pieces are shorter than the reading rule on their first appearance: 78 % (0.4 s before the camera follows the selection to B), 83 % (1.1 s), the patient comment (3.2 s of 4.6 s) and the end card's style line (3.2 s of 3.5 s). The two results return in shots 3–4 and 12 for several seconds.
- Picture is fully deterministic (seeded patient order, seed 1986). Changing the voice changes the line starts through `tl.js`; the picture keys its actions to those starts.
- Prop pitfalls: the 4-cell-wide bars are too narrow for "A wins", so they show only the arrow; the far shots below 55 % zoom draw no cell values.
