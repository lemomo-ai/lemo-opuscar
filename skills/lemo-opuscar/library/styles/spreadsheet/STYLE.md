# Spreadsheet Film — Style Prompt

> A whole film inside one spreadsheet window. Cells are the pixels, conditional formatting paints the pictures, the formula bar speaks the lines, and the camera is the sheet's own zoom and scroll. Every picture is made of numbers, and the picture turns out to be the answer.
> References (grammar only): music videos and campaigns built inside a real spreadsheet file (rectangular cell pixels, conditional-format colour bands, a selected cell as the hero), and the plain grey office-software look of the 1990s–2000s. Take the grammar of cells, never a product's interface, name, logo or brand colours.

## 1. Essence, and what it is not

What makes a frame read as this style in one glance:

1. **Cells are the pixels, and they are wide.** A cell at 100 % is about 2.9 : 1 (the demo uses 64 × 22 px). Every diagonal and curve becomes horizontal stair-steps.
2. **The picture is computed.** Every painted cell holds a small, faint value (1/0, a code letter, a colour-scale step) and the value chooses its fill. Close up it is a data table; far away it is an image.
3. **The software shell never leaves the frame**: title bar, toolbar, name box, formula bar, column letters, row numbers, sheet tabs, status bar. The shell never zooms; only the sheet does.
4. **The formula bar is the dialogue.** A beat starts with a formula typed letter by letter; Enter drops the result into a cell and the sheet reacts.
5. **One hero: the selected cell**: thick ink border, marching ants, a fill handle. It hops cell by cell and leads the eye.

Not a data-storytelling chart on paper (there is no paper, no pencil: the sheet is the medium), not a dashboard (one idea per beat, no widgets), not a screencast of real software (the shell is generic and drawn, every action is staged), not pixel art (cells are wide, carry values and sit in a live grid).

## 2. Materials & rendering

- **Canvas 2D, one world → screen function.** The sheet is a grid in world units (column widths × row height); the camera is a centre and a zoom. Everything that belongs to the sheet (fills, values, merged cells, reference boxes, the selection) goes through that function; the shell is drawn in screen space on top.
- **Variable column widths** are part of the model: a hidden column has width 0 and every x position is a prefix sum of widths, so opening or closing columns reflows the whole sheet and the camera rides along.
- **Grid lines**: white cells get light grey lines (≈ `#dad9d3`); painted cells get thin dark lines (≈ rgba(6,4,18,0.42)), as if "all borders" were applied.
- **Cell values** at 11 px × zoom; below about 6.5 px they are not drawn, so the far view becomes pure colour instead of grey noise.
- **A painted cell flashes white** for ~0.12 s when its rule fires. That flash is the style's only "light".
- **Merged cells are the layout**: labels, results, titles and the end card are merged ranges with a cell border, never floating text.
- Nothing outside what a sheet can make: no gradients, glows, shadows, blur, depth of field or translucent panels. Text has no outline or drop shadow.
- **The sheet cannot scroll above row 1 or left of column A**: clamp the camera, and compose around that edge.

## 3. Colour logic

- **The sheet is white; colour means a rule fired.** Every fill on a cell is a conditional format with a meaning the viewer can learn in one look (success / failure, a category, a scale step).
- **At most five working hues** plus the shell's warm greys: two for the main binary or categories, one for a second variable, one for the hero (the selected cell, a winning result), and ink. Office-style conditional-format colours (lime, red, indigo, amber, sky) read as "spreadsheet" at once.
- **A colour scale is a payoff, not wallpaper.** A banded scale (6–8 steps radiating from one cell, neighbouring bands alternating light and dark) can paint the empty background once the argument is made; until then the background stays white.
- Reference boxes take their colour from the formula: each referenced name in the formula bar and the box around its range share one hue.
- Example palette (the demo): lime `#b8f25a`, red `#e8382d`, indigo `#2a2f6c`, amber `#ffb21f`, ink `#17120a`, shell `#dcdbd5` / `#f1f0eb`.

## 4. Type & subtitles

- **One grotesque for the whole interface** (Inter, OFL) and a matching CJK sans (Noto Sans SC, OFL), self-hosted as subsets.
- Roles: cell values 11 px × zoom (texture), merged-cell labels 14–26 px × zoom, results 26–32 px × zoom (they pop 30 % on Enter), formula bar 26 px fixed (the line of the film), shell 12–13 px fixed. On-screen Chinese ≥ 34 px at the zoom it is read at.
- **Subtitles are a cell comment**: a pale yellow note with an ink border and a red corner triangle, docked at the lower left, one Chinese line over one English line, never wrapped. Frame the subject above it (the camera's centre sits about 48 px above the viewport's centre).
- Formulas use the real syntax of a spreadsheet (`=AVERAGE(range)`, `=COUNTIF(range, "L")`), names for ranges, and colour the referenced names.
- Hold every subtitle ≥ max(1.8 s, speech + 0.6 s); a result that a sentence depends on stays in frame until the sentence has used it.

## 5. Motion quality

- 24 fps; the camera (zoom, scroll) is smooth every frame. Cells themselves move **on the grid**: positions snap to whole cells, so a moving cell hops.
- Paint happens in **rings or sweeps from one cell**, a few tens of milliseconds per cell, with the status bar counting cells.
- Typing is even within a line, about 14–30 characters per second: the longer the formula, the faster, so that one formula is typed in about 0.8–1.4 s; the caret blinks at 4 Hz. Enter is a hard cut of state: the edit box closes, the value pops.
- Column-width changes ease in and out (~0.5 s per column) and ripple across neighbouring columns.
- The shell never moves; only its state changes (pressed buttons, the name box, the zoom slider, status messages).
- **Frame rate and grain**: no film grain (mux grain 0).

## 6. Camera grammar

The camera is the sheet's zoom and scroll. The column header grows a little with zoom (26 → ~38 px), as real software does.

| Move | What it expresses | Can serve |
|---|---|---|
| Pull out from one cell | the part becomes the whole; data becomes a picture | a reveal of scale; "each cell is one…"; a summary |
| Push into a cell or range | this one number matters | a verdict; a definition; an outlier |
| Follow the selected cell | the eye is led step by step | a calculation path; a comparison A → B; a list |
| Whip to the headers | look at the structure, not the data | a clue (hidden columns, a sort, a filter) |
| Track along a row or column | reading a series | a timeline; a ranking; a sequence of groups |
| Follow cells that move | the data reorganises | a sort; a pivot; a filter; a merge |
| Locked wide frame | let the viewer compare | a paradox; before/after; any judgement |

Framing: a judged comparison is wholly in frame and held ≥ 2.5 s; at key moments the subject fills ≥ 1/3 of the viewport height; keep key text above the subtitle note. Transitions are made by the sheet (a hop, a zoom, a column opening, cells flying, a colour scale spreading, a merged cell expanding); no cross-fades, wipes or page turns.

## 7. Sound palette

- **The sheet's foley**: key clicks for every typed character, a clack + low thump on Enter, a short tick per hop of the selected cell, one tiny sine blip per painted cell (pitch rising with progress), a ratchet click per opened column, a soft blip per landing cell (pitch by height), mouse clicks, a small pop for menus and results, a ding for a winning value, air whooshes on big zooms. Drive all of it from the page's event list so each sound sits on its frame.
- **Music**: office-pop instruments (kit, electric bass, piano stabs, marimba, xylophone, glockenspiel). Accelerate by thickening the pattern (half-time → four on the floor, sixteenth mallets), not by changing tempo.
- **Silence** is a real cut of the music (foley may stay) right before a clue or a turn; the first sound after it should be a key moment.
- Mix: voice compressed and about 10 dB over the music by RMS, music carved 300 Hz–4 kHz under speech, −14 LUFS, true peak ≤ −1 dB. Voice: a calm explainer.

## 8. Native moves

- **Pull out from a formula cell.** Type in one cell, then zoom out until the sheet is a picture made of values. *Fits content like:* a budget that becomes a portrait of a city; survey answers that become a map; one sale among a year of sales.
- **Conditional format sweep.** A rule fires and paints outward from one cell; the status bar counts. *Fits content like:* turning raw numbers into a heat map; flagging outliers; a season of temperatures.
- **Hidden columns.** Letters skip in the header and a double line marks the fold; "Unhide" opens the columns, which show `#`, `##`, then values while they widen. *Fits content like:* a confounder; a missing cost; the fine print of a contract.
- **Cells that move.** Cells lift and hop to new positions (rows first, then columns) to sort, filter or pivot; bars of cells grow as they land. *Fits content like:* a ranking that reshuffles; a cohort split by age; votes regrouped by region.
- **A count drawn as cells.** A COUNTIF or SUM shown as a row of cells filled in proportion, not just a number. *Fits content like:* market share; a quota; "3 of 10 households".
- **Reference boxes as pointers.** A formula's names colour boxes around ranges anywhere in the sheet. *Fits content like:* a weighted average; a dependency between two tables; where a total comes from.
- **Merged cell as stage.** A range merges and expands into a title or end card; typing fills it. *Fits content like:* chapter titles; a verdict; a credit.
- **`####` gag.** A column too narrow for its number shows hashes; widening it reveals the value. *Fits content like:* a number too big to believe; a surprise price; a hidden score.

Our demo opens on a *pull out from a formula cell* into a *conditional format sweep*, uses *hidden columns* as its turn and *cells that move* as its climax, and ends on a colour scale flooding the sheet and a *merged cell as stage*. A new film opens and ends another way: an error value (`#DIV/0!`) filling the screen, an extreme far zoom on a finished picture pushing into one cell, a *`####` gag* as the turn, an ending where the sheet is filtered down to one row, or ctrl-Z rewinding the whole film to a blank sheet.

## 9. Pitfalls of the medium

- **Grey mush when zoomed out**: values drawn at 3–5 px turn the picture to noise. Stop drawing values below ~6.5 px.
- **Text unreadable at the zoom it is shown**: size merged-cell text for the zoom of its shot; a number the voice uses must be ≥ 26 px on screen.
- **Wide-and-short compositions**: a sheet that is wider than tall forces a low zoom; add a meaningful row of cells (a count, a total) below, or crop to the part being discussed.
- **Selection box drawn over the value**: a thick border on a small cell hides its content; select merged ranges for results, single cells only when zoomed in.
- **Brand look-alike**: a green ribbon, a familiar grid font, a product name; keep the shell generic and drawn by hand.
- **Moving cells smearing**: interpolated sub-cell positions read as sliding stickers; snap to whole cells.
- **Too many formulas**: one formula per beat; a formula bar that changes every second is noise.

## 10. Engine

All in `demo/index.html` (Canvas 2D, no dependencies):

- `layout(t)` builds column widths (hidden columns ease from 0) and prefix sums; `colX(i)`, `colXf(c)` map columns to world x.
- `camera(t)` interpolates keys `{t, at: [col, row], z, e}` (log zoom, easing), keyed in column units so it follows a column reflow; `setup(t)` adds the scroll clamp. `XC(i)`, `YR(j)` are the world → screen functions.
- `drawSheet` paints visible cells (data, conditional fills, background scale, flashes) and batches grid lines into two paths; `drawMerged` draws merged ranges via `mrect(key)`; `drawFlying` / `drawPivot` move and place data cells; `drawSelection`, `refBox` draw the hero and reference boxes; `drawHeaders`, `drawChrome` the shell; `drawSubs` the comment note.
- `typedParts(key, t, a, b)` types a coloured formula; `addKeys` writes a key event per character into `window.EV` for the mix.
- `demo/mix.py` reads `events.json` and places one sound per event; `demo/timeline.py` turns phrase durations into line starts, subtitle cues and the `.srt`.

Minimal example not in the demo: a monthly sales table; type `=MAX(B2:B13)` into a cell, Enter, then a banded colour scale from that cell outward (the demo's `bloomAt`) and pull out to a 12 × 31 calendar of daily sales.

## 11. Variation space

The agent decides the structure, the data and its source, what one cell stands for, the shell's file and sheet names, the camera path, the pacing and the palette within the colour logic.

- **Three structures**: a running total that builds a picture cell by cell (a household budget across a year); a sort that turns noise into a pattern (a hundred cities ordered by rainfall); two sheets compared side by side that disagree until one formula is fixed.
- **Three openings**: a blinking caret in an empty sheet; an error value (`#DIV/0!`) filling the screen; extreme far zoom on a finished picture, pushing into one cell.
- **Three endings**: the last Enter fills the last empty cell and the picture is complete; the sheet is filtered down to one row; ctrl-Z rewinds the whole film to a blank sheet in one second.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
