# Textbook Doodle — Style Prompt

> A printed textbook lying open on a desk, seen from above, and everything a bored or curious student adds to it in ballpoint, red gel pen and highlighter: margin stick figures, arrows, crossings-out, circled words, handwriting. The print only asks or sets the scene; the ink is the voice, and a margin stick figure is the lead.
> References (grammar only): margin doodles in real school books (figures that interact with the printed diagrams), flipbook animation in book corners (rhythm from page turns, not cuts), teachers' red-pen marking (✗, ✓, circles, boxed answers). Never copy a real textbook's layout, publisher mark, page or illustration, and never name a real publisher in the film.

## 1. Essence, and what it is not

What makes a frame read as this style in one glance:

- **Two layers that never mix.** Clean printed type, rules and figures that never move or boil; on top, hand-made ink that wobbles, boils on twos and is drawn over time.
- **A margin stick figure is the protagonist.** One figure (rarely more) drawn in the same ballpoint as the handwriting, who walks on printed lines, hangs off diagrams, carries objects bigger than himself and reacts to what the print says.
- **Three pens and a highlighter.** Blue ballpoint for the student's thinking, red gel pen for verdicts and corrections, yellow highlighter for "this matters"; pencil only for a draft that is later replaced.
- **The real desk.** The book has page thickness, a shaded gutter, faint stains, and sits on wood. The camera is always above it.

It is **not** a whiteboard explainer (no presenter's hand, no clean white surface, and the ink is a student's, not a teacher's), not a chalkboard (dark surface, wiped and rewritten), not a crayon picture book (no colour fills, no illustrated world), not a notebook-paper "sketch" UI theme (the printed page must be a believable book page with running header, page number and figure caption).

## 2. Materials & rendering

- **Paper.** A warm off-white (`#f3eedf`-ish) printed once per page into a cached canvas: tint, multiplied fibre noise and sparse short fibres, one or two faint stains. Optional exercise-book rules and a red margin line for notebook pages.
- **Print.** Real type set on the page canvas: a serif for running text, a sans for headings and boxes, one spot colour for headings and textbook boxes, grey for running headers and captions, dashed or solid figure lines. Print is baked; it never moves, never boils, never animates in.
- **Ink.** Every mark is a stroke: a polyline resampled every few units, offset along its normal by low-frequency "hand tremor" noise, drawn as a variable-width ribbon (ballpoint pressure, thinner at the end, an ink blob where the pen lands). Composited with `multiply`, so ink darkens print and highlighter where they cross.
- **Highlighter.** A flat-ended wide band, `multiply`, about half alpha, with a darker streak where the stroke overlaps itself. Patches (filled areas) are polygons with the same blend.
- **Handwriting.** A handwriting font filled in ballpoint blue (or red), each character turned and lifted a little by a seeded hash, revealed left to right over its own writing time (≤ 0.22 s per character), boiling with the doodles.
- **The book and the desk.** A spread is two pages around a gutter at world (0, 0); gutter shade and page-edge lines give thickness; a soft blurred shadow lies under it; the desk is one non-repeating wooden top. A warm vignette sits over everything in screen space.
- **World anchoring.** Ink lives in page coordinates and is clipped to its page, so it moves with the page in a turn. The stick figure lives in world coordinates (so he can cross the gutter or step onto the desk).

## 3. Colour logic

- **Ground:** paper off-white and desk brown. Nothing else is a large field.
- **Print:** near-black, grey and **one** spot colour (a textbook blue, a green, a maroon: pick one per book).
- **Ink roles are fixed:** ballpoint blue = the student thinks / tries; red = a verdict (✗, ✓, a circle round the key fact, the correction); highlighter yellow = attention or light. A second highlighter (pink) may mark a second category, never decoration.
- **Light and heat** may borrow highlighter colours (a lit half of a planet, a hot spot in orange highlighter), because that is what a student would reach for.
- Never a gradient, never a colour that no pen in a pencil case has, never coloured print beyond the spot colour.

## 4. Type & subtitles

- **Print:** a serif for running text (22–26 px at 1×), a heavy sans for chapter headings and box labels (34–40 px), small grey captions ("Figure 1-12 … (not to scale)"). Running text is texture: it may be cropped and is not timed for reading.
- **Handwriting:** one handwriting face, 34–60 px at 1×, blue or red; a key line may be written twice over (`bold` passes). Keep a written line to about eight characters; split longer thoughts into two lines written one after the other.
- **Subtitles:** without a voice, the handwriting is the text; the `.srt` carries the written lines with a translation, one cue per line. With a voice, subtitles sit on a paper strip or in the page's bottom margin, never on a modern plate.
- **Reading time:** every story-carrying line (printed question, handwritten line) holds ≥ max(1.8 s, characters ÷ 4.5 + 1.5 s) fully in frame after it starts being written; the camera waits for it. `window.TEXTS` reports these lines, not the running text.

## 5. Motion quality

- **Ink on twos.** Doodles and handwriting boil at 12 fps (the noise phase steps every 1/12 s); print and desk never boil. The camera moves on ones.
- **Marks are written, not faded:** each mark draws at pen speed with slow start, fast middle, slow finish; once drawn it stays on the paper. Removals are student actions: a red cross, correction tape, a scribble-over, a page turn.
- **The figure is re-inked every frame from a pose,** like a flipbook: named poses (stand, run, climb, cheer, shrug, hug, point, sit, lie, wave…) blended and keyed in time, stepping on twos, jumps as parabolic arcs, shivers as ±1.6 px jitter plus wiggle lines, sweat drops, props drawn in the same pen.
- **Hits are small:** a 3–4 % zoom kick on a verdict, decaying in half a second. No shake, no motion blur, no squash on print.

## 6. Camera grammar

Always top-down over the desk, a slight constant roll (about −1°), eased moves between framings.

| Move | What it expresses | Can serve |
|---|---|---|
| close on one box or line | the question; the thing to read now | a problem statement; a definition; a punchline |
| lateral slide across the spread | following the student's attention | cause → effect; question → evidence; a list across both pages |
| push-in on the figure | his reaction is the point | a twist; a joke; an emotional beat |
| pull-out to the whole spread | the page as a finished record of the thinking | a summary; an ending; a before/after |
| page turn (right page over) | a new chapter, a new subject, time passing | a change of topic; a montage on the beat |
| kick on a verdict | the red pen lands | a correction; a confirmation |

The figure stays at least 50 px tall on screen; written lines stay at least 28 px. Text that matters lives inside the page, at least 40 px from the frame. Allowed transitions: slides, page turns, a book closing; no cuts to other places, no dissolves.

## 7. Sound palette

- A small classroom band: pizzicato strings, clarinet, xylophone, glockenspiel, harp, a light kit, with brass stabs (trombone for a wrong answer, horns and trumpets for the right one), sleigh bells or triangle for a payoff.
- Foley of the medium: ballpoint on paper (band-passed noise with a scratch rhythm, 2.5–9 kHz), highlighter (broader, duller), a page turn, a cap click, correction tape.
- The figure has his own little sounds: a xylophone run up for each jump, a xylophone trill for each shiver, a shaker for fanning.
- Verdicts land on a hit: red ✗ on a snare and a falling trombone, ✓ on triangle + glockenspiel. A stop (the band cutting out) is the strongest tool for a wrong answer.
- Mix to −14 LUFS; foley sits just under the music, the pen is never louder than the melody.

## 8. Native moves

- **Wrong answer, red cross.** The student's first answer is written confidently, then a red ✗ lands on a hit. *Fits content like:* a common misconception; a myth vs the fact; a bad first draft of a plan.
- **The figure uses the diagram.** He carries, climbs, hangs from or walks on a printed figure (an orbit, a graph's curve, a map's border), and the diagram responds. *Fits content like:* physics on a free-body diagram; a stock chart he rides down; a river on a map he rafts.
- **Highlighter as light or emphasis.** A highlighter pass marks the key phrase; a highlighter patch is light, heat or "the lit half". *Fits content like:* the day side of a planet; which part of a contract matters; the critical path in a schedule.
- **Red circle on the fine print.** A printed label nobody reads is circled in red and answered in red handwriting. *Fits content like:* a footnote that changes everything; the date in a timetable; a caveat in a chart caption.
- **Experiment in the margin.** The blank bottom of a page becomes a lab: two variants side by side, brackets measuring the difference, a one-line conclusion each. *Fits content like:* straight vs slanted light; two pricing plans; a fair vs unfair test.
- **Boxed answer + tick.** Back to the question at the end: the real answer is written next to the crossed one, boxed, ticked in red, the figure stands on the box. *Fits content like:* a quiz answer; a decision; a solved bug.
- **Page turn on the beat.** The right page turns over to a new spread; doodles on the turning page go with it. *Fits content like:* chapters; a montage; a time skip.

## 9. Pitfalls of the medium

- Diagrams doing the explaining while the figure cameos: the figure must carry the content.
- Several figures at once: the reader can't follow; one hero, others only as props he draws.
- Print that animates or boils: it breaks the two-layer contract.
- Handwriting too long to write in time, or written lines the camera leaves before they can be read.
- Ink that ignores the paper (source-over flat colour, no tremor, perfect circles): it reads as vector UI, not a pen.
- Real publishers, real textbook pages or exam papers reproduced; logos of games or brands drawn as if printed.
- A clean white page or a notebook alone: without print there is nothing for the student to answer.

## 10. Engine

`demo/engine/` is the reusable part:

- `pen.js` — `Stroke`, tools (`ball`, `red`, `black`, `pencil`, `hl`, `hl2`, `white`, `redTop`), shapes (`line`, `curve`, `ellipse`, `rect`, `arrow`, `check`, `cross`, `star`, `heart`, `bubble`, `scribble`, `zigzag`, `underline`, `hl`, `wave`), `mark()` / `drawMark()` for strokes written over time.
- `hand.js` — `writeText()` handwriting revealed per character, `printText()` / `printPara()` for print (with line-start punctuation rules), `measure()`.
- `book.js` — `page(id, draw)` registers a printed page, `drawSpread()`, `drawTurn()` page turns, `cover()`, `drawDesk()`, `onPage()` hook through which the film draws ink in page coordinates.
- `stick.js` — `figure()` the stick figure with faces (smile, grin, flat, sad, shock, cry) and props (`glasses` sunglasses, `specs`, `cap` mortarboard, `hair`, `bandage`, `sweat`, `scarf`, `santa` hat, `book`, `wrench`, `mic`), `POSES`, `blend()`, `at()` for keyed poses.

A film supplies its pages (print), its ink marks with times, the figure's track, the camera keys and `window.TEXTS`.

## 11. Variation space

- **Books:** any subject's textbook, a dictionary, an exam paper, a notebook, a manual, a cookbook; one spread or a stack of books.
- **Ink:** ballpoint blue + red + yellow is the default; a black-pen student, a pencil-only draft phase, a pink second highlighter.
- **The figure:** age and props change with the topic (a lab coat as a scribbled rectangle, a hard hat, a crown); he may draw his own companions.
- **Openings:** the closed cover opening; a close-up on the printed question; the figure waking up in the margin.
- **Endings:** the boxed answer and tick; the pull-out to the finished spread; the book closing on a cover with one doodle on it.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
