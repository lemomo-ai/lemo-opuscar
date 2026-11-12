# Marker on Paper — Style Prompt

> A pad of matte white paper and one bullet-tip permanent marker in black, with a red and a blue marker for meaning only: blue is what we know, red is what we want. A problem is drawn, reasoned out and answered one sheet at a time, stroke by stroke, with no hand and no pen in sight. When a sheet is done it is pushed through or peeled away and the next one begins.
> References (grammar only): one-idea-per-drawing science explainers made with a marker on paper, and a maths teacher working a problem on a pad. Take the economy (one question per sheet, the simplest geometry that carries it, hand lettering) and the colour discipline, never anyone's drawings, characters or layouts.

Suits worked problems, derivations, "how big / how far / how much" questions and any lesson that ends on a number or a rule. The length follows how many steps the reasoning needs.

## 1. Essence, and what it is not

- **The frame is the sheet.** A warm matte white paper fills the screen; no desk, no pad edge, no props, no hand, no pen.
- **One bullet-tip marker line.** Thick (6–10 px at full frame), near-constant width, a slightly denser touch-down, a slight lift at the end, corners overshot because each side is a separate stroke.
- **Three inks with fixed meanings.** Black builds everything; blue marks the givens; red marks the unknown and, later, the answer. Red is always the last stroke on a sheet.
- **One question per sheet**, written top-left in hand lettering as it is asked, the page number circled top-right.
- **Ink behaves like ink.** Same-colour crossings, corners and arrowheads over shafts are visibly darker; a stroke never darkens itself; nothing bleeds outside a stroke.

Not Whiteboard Explainer: that is a glossy board with ghost marks, floating markers and magnets, and a camera travelling over one big knowledge map. Not Chalkboard: dark slate, chalk grain, wipe-and-rewrite. Not a sketchnote: no dot grid, no fineliner, no grey or yellow marker fills, no page-wide poster to pull back to. Here: white matte paper, one thick marker, red/blue semantics, one sheet per step, changed by a push through a drawn shape or a peel.

## 2. Materials & rendering

- Canvas 2D. Each stroke is a filled ribbon (bullet nib, width ≈ constant, ±3 % noise, a 0.86→1 ramp over the first 3 widths, a 10 % lift over the last 2) built from a resampled, Chaikin-smoothed polyline with a slow arm wobble and a little finger tremor along the normal.
- **Drawn up to a length**: a stroke in progress is cut at its head with a round cap; a letter in progress is revealed by a fat mask along its glyph's centre line (stroke order from a thinned skeleton), so letters keep the real font's outlines.
- **Ink density, not alpha**: every stroke or letter adds one unit to its colour's density layer (`lighter`). Compose per pixel by transmittance: one unit = the palette colour at its opacity; n units = that transmittance to the power 1 + 0.6 (n − 1). Touch-down and sharp corners (found on the un-wobbled path, so they never flicker) add 0.3 of a unit inside the stroke.
- **Paper**: warm white, sub-2-level grain, faint cloudy formation, a few hundred 1-px fibres, one lamp's falloff of about 3 levels from top-left. Baked once per sheet, drawn through the camera.
- The camera moves over the paper by drawing strokes and letters *through* the camera transform: pushed in, lines get thicker and stay crisp, like a lens closer to the sheet. Never scale a rendered bitmap.
- No vignette, no film grain, no scan dirt, no glow, no drop shadows. The only shadow in the style is the peel's (≤ 0.16 opacity, narrow).

## 3. Colour logic

- Ground: warm white paper. Ink: black for structure (≈ 90 % of the ink on any sheet).
- **Blue = given, red = wanted.** The meaning is fixed for the whole film: the same quantity keeps its colour in the drawing and in the algebra. Where the topic has a hot/cold axis, red/blue may also carry it, in the same direction.
- Each sheet: blue and red each ≤ 10 % of the ink; one red focus per sheet (it may be a group: arrow + label + circle).
- Red never decorates and never draws structure. Grey, yellow and fills do not exist; a red bar is a thick red stroke.
- Example palette: paper `#FAF9F5`, black `#1B1C20` (opacity .97), red `#E23B2E` (.9), blue `#2456D6` (.9), peel shade `#463F33` ≤ .16.

## 4. Type & subtitles

- Latin: Kalam (OFL) — Bold for questions, labels, answers; Regular for small notes. Chinese: LXGW Marker Gothic 霞鹜漫黑 (OFL), one short line under an English question.
- Sizes at full frame: question 92–112 px; answer 100–120 px; labels 40–60 px; notes 30–40 px; Chinese on the sheet ≥ 34 px. Each glyph gets a fixed tiny tilt, baseline and size drift (±1.3°, ±1.7 %, ±2 %); no stroke, outline, shadow or double print.
- Letters are written, not faded: questions ≈ 12 characters/s, labels 8–10/s. Written letters never boil.
- Algebra is written in the drawing's colours, piece by piece (`v = d ÷ t`): the colour tells the viewer which line in the picture each term is.
- **Subtitles** sit on a torn slip of the same paper laid over the bottom of the frame (straight top and bottom, torn ends, 96 % opaque, 1-px hairline, no shadow): Chinese 38 px over English 31 px at 78 % ink, one line each, never wrapped. The slip is screen space and does not move with the camera. Keep sheet content above y ≈ 940 while a slip is up. Hold ≥ max(1.8 s, speech + 0.6 s).

## 5. Motion quality

- Drawings change on twos: 12 drawings a second at 24 fps. The camera moves smoothly at 24 fps.
- Three boil drawings per sheet, built with the same seeds and differing only by a boil term (≤ 1 px along the normal), cycled on twos. Letters do not boil; random numbers are consumed independently of progress, so a half-written sheet and a finished one agree.
- Speeds: a long arc is one sweep of 0.4–0.6 s; a hatch is a run of ~10 ms flicks; dashes are drawn one by one; an arrow is a shaft then two head strokes.
- **Black, then blue, then red.** Structure first, the givens, then the unknown/answer. The red stroke lands on a beat and is held ≥ 1.5 s.
- A finished sheet holds still except for the boil.

## 6. Camera grammar

Top-down on the paper; the camera only moves over the sheet. Never tilt, never show past the paper's edge, never show a desk.

| Move | What it expresses | Can serve |
|---|---|---|
| follow the pen | the line being made is the subject | a long arc; a row of algebra; a timeline being drawn |
| lean in (≤ 2×) | this is the part that matters | the red answer; a given being labelled; a final rule |
| pull back | the whole picture, or a comparison read at once | a scale reveal; a summary sheet; holding a verdict |
| push through a drawn shape | "look closer" as a transition | a right angle; a small circle on a map; a decimal point |
| peel | a new question | the turn of an argument; a new case |

- Framing rules: a text is either wholly in frame or wholly out, never cut; when leaning in, choose a zoom that pushes the title out completely or keeps it whole. Comparisons are fully in frame and held ≥ 2.5 s.
- Transitions are only the push-through match cut and the peel. No fades, no wipes, no slides, no page-flip graphics.

## 7. Sound palette

- **Foley follows every pen-down**: a felt tip on matte paper — band-limited noise lower and softer than a fineliner, brightening with nib speed, with the paper's tooth in it; a faint squeak on long fast strokes; a soft "tok" at touch-down (a low body through the pad, no plastic click); a quick "tsk" per hatch flick; letters rise and fall within each glyph. Pan with the stroke's screen position. Coloured markers a touch duller than black.
- Paper: the peel is a corner crackle then a slide; a push-through carries a little air.
- Music: small acoustic ensemble that thinks — pizzicato double bass walking, staccato clarinet and bassoon, shaker and claves; harp and glockenspiel only where red lands. A question can hang on an unresolved chord; an answer resolves. Avoid generic piano-and-strings and the marimba/kalimba of sketch styles.
- Silence: at least two near-silences (a peel; a scale reveal). Voice: a calm, unhurried narrator (≈ 2.3–2.6 English words/s), compressed, ≈ 10 dB over the music by RMS; music gives way 300 Hz–4 kHz. Master −14 LUFS, true peak ≤ −1 dB.

## 8. Native moves

- **The unknown in red.** Draw the situation in black, label the givens in blue, then one red arrow and `d = ?`. *Fits content like:* how long a shadow is at noon; how much a loan costs in total; how fast a falling key hits the ground.
- **Same colour, same quantity.** Carry each colour from the drawing into the equation, so algebra reads as a re-drawing. *Fits content like:* splitting a bill with tip and tax; Ohm's law on a sketched circuit; area of a garden bed.
- **Scribble it out.** A black back-and-forth scribble over a term or a wrong guess, with a small "tiny" or "no" note. *Fits content like:* a negligible term; a myth corrected; an option ruled out.
- **Push through a shape.** Push into a small drawn mark until it fills the frame; cut to a new sheet where the same mark sits at the same place, size and line weight; pull out. *Fits content like:* a dot on a map becoming a city plan; a decimal point becoming a ruler; one cell becoming a table.
- **Bars to scale, even when one is a dot.** Draw quantities as red strokes at true scale; the tiny one stays tiny. *Fits content like:* a country's water use against agriculture; a lifetime against geological time; one person's emissions against a flight.
- **The peel.** The corner lifts, a fold line sweeps from bottom-right to top-left, the sheet is pulled off, a fresh sheet below. *Fits content like:* the next case; the second half of a proof; "now what if…".
- **The last red circle.** The film's final stroke circles a rule or a number on the whole sheet. *Fits content like:* the formula worth remembering; a deadline; the one figure to quote.

Our demo opens by following the pen as it draws the situation, then *the unknown in red*; it uses *push through a shape* as its turn and ends on *the last red circle*. A new film opens and ends another way: a red `?` on a blank sheet before anything else is drawn, the answer written first and then *the peel* back to "why?", an ending on a peel to a blank sheet with only the page number, or a push through the final digit into a fresh sheet that holds the next question.

## 9. Pitfalls of the medium

- **Flicker in letters.** Never re-randomise letters per frame; lay them out once, fixed seeds, no boil.
- **Dirty paper.** Shadows under text, vignettes and scan grime read as "unclean". Only the peel casts a shadow.
- **Red everywhere.** Two red foci on one sheet kill the semantics; demote one to black.
- **Text cut by the frame edge** when leaning in: pick the zoom from the text boxes (wholly in or wholly out).
- **Corners that pop.** Detect corner ink on the un-wobbled path; otherwise the boil switches pools on and off.
- **Zooming a bitmap.** Strokes must be redrawn through the camera, or a push-in looks blurred.
- **Algebra on a slide.** Centred, typeset, faded-in equations break the hand; write them left to right in the drawing's colours.
- **A page of everything.** One question per sheet; a new step is a new sheet.

## 10. Engine

- `demo/pen.js`: `Stroke` (resample, smooth, wobble, boil, corners), shapes (`line`, `poly`, `curve`, `arc`, `circle`, `rect`, `arrow`, `arrow2`, `wavy`, `dashed`, `hatch`), `Ink` (`stroke(s, upTo)`, `layout()` / `write(T, upTo)` for skeleton handwriting, `setCamera(M)`), `makePaper`, `paperCanvas`, `composeOn` (density → transmittance).
- `demo/film.js`: the sheet/element timeline (`E(t0, t1, kind, items)`), camera keys and `matrix()`, the push-through match cut, the peel compositor, the subtitle slip, `window.EV` for foley and `window.TEXTS` for the reading check.
- `demo/tools/skeleton.py`: glyph centre lines for any OFL font and character list; `demo/mix.py`: felt-marker foley from pen-down events.
- Minimal use, not in the demo: three blue dashed lines of a triangle with red `x = ?` on one side, then a black scribble over a wrong `x = 3` and a red `x = 5`, circled: `E(0, .4, 'line', poly(...))`, `E(.5, .9, 'write', T('x = 3', ...))`, `E(1.0, 1.2, 'line', curve(zigzag))`, `E(1.3, 1.7, 'write', T('x = 5', ..., { color: 'red' }))`, `E(1.8, 2.2, 'line', circle(..., { color: 'red' }))`.

## 11. Variation space

The agent decides the structure, the number of sheets, the opening, the ending, the camera route, the pace and the drawings; the ink meanings and the paper do not change.

- **Structures**: a single problem solved and generalised; a myth tested on three sheets and refuted on the fourth; two quantities compared until the surprise number is circled.
- **Openings**: a red `?` on a blank sheet before anything else is drawn; the answer written first, then "why?" peels to the start; the camera following a long black line that turns out to be a coastline.
- **Endings**: a peel to a blank sheet with only the page number; the last red circle on a summary sheet; a push through the final digit into a fresh sheet that holds the next question.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
