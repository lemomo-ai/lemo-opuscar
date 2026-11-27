# Editorial Explainer — Style Prompt

> A newsroom explainer argued on a paper desk: torn slips of headline type, graph-paper cards, halftone cut-outs and pencil notes lie on one large desk seen from above, a camera travels across it from one piece of the argument to the next, and a yellow highlighter marks the one thing each stop is about.
> References (grammar only): online newsroom explainer videos of the 2010s and 2020s, Vox's desk explainers above all (paper textures, cut-outs with a white margin, a highlighter on the key phrase, a camera that drifts over flat material); magazine infographics (one chart, one annotation); a detective's evidence board (everything stays in view once it has been said). Copy none of their layouts, colours, typefaces, logos or music, and never name them in a film.

## 1. Essence, and what it is not

- **One desk, one argument.** Every piece of the explanation is a physical piece of paper on the same desk. Nothing fades out: what has been said stays where it was put, so the film can pull out at any time and show the whole argument.
- **The highlighter is the narrator's finger.** One saturated marker colour, multiplied onto the paper, lands on the phrase or number that matters at the moment it is spoken. Nothing else is that colour.
- **Three hands**: printed type (heavy condensed headlines, a book serif, a typewriter mono for labels), a pencil (strikes, circles, arrows, chart lines, a short note) and scissors (halftone cut-outs with a white margin).
- **The camera never stops.** It drifts and pushes in slowly while a piece is read and whips to the next piece between sentences. Pieces arrive on twos; the camera is smooth.
- **Evidence, then verdict**: a guess is shown, then crossed out; a number is shown, then highlighted.

Not Vintage Engraving Collage (no old engravings, stamps or hinged cut-out acting: the paper carries type and charts, and the cut-outs only stand in for things being counted). Not Halftone Dossier (no case-file frame, no rubber stamps, no thick-outlined characters). Not Data Storytelling (the chart is one card among several, not the whole film). Not Swiss Motion (nothing snaps to a grid; pieces lie a degree or two off square). Not a keynote: no gradients, no glow, no screen UI.

## 2. Materials & rendering

- **The desk**: warm paper-coloured ground with fibres and specks, tiled **in world space** so it travels with the camera. Large torn sheets of muted colour (kraft, grey-blue, cream) lie under each cluster of pieces and group them.
- **Paper pieces**: off-white, each with its own slight rotation (±0.5° to ±2°), a soft shadow whose blur and offset grow with the piece's height above the desk, and edges that are either knife-straight or torn (a polyline jittered every ~13 px). A piece clips its own contents.
- **Graph-paper cards** for anything measured: a pale card with a fine grey-blue grid, every fifth line heavier.
- **Halftone cut-outs**: simple shapes (a bust, an object) filled with dots on a 45° screen whose **radius is the tone**, darker toward the lower right, with a white margin as wide as a scissor cut and a shadow of their own. Build each one once as a sprite.
- **Highlighter**: a band with slightly wavy edges and a slanted chisel end, drawn left to right with `globalCompositeOperation = 'multiply'`, so black type stays black and paper turns yellow. A darker streak runs along it where the tip pressed.
- **Pencil**: every mark is a polyline drawn up to a fraction of its length, stroked twice a hair apart, in soft graphite; ruled lines wobble a few pixels, circles overshoot and do not close.
- **Tape** on the corner of a piece that needs to look pinned.
- **Layers**: each piece has a height; a layer's scale is `1 + height × k`, so higher pieces slide a little faster under a moving camera. Screen space holds only the lamp's vignette (multiply) and the subtitle strip. Film grain is added in the mux, lightly (1), never in the page.

## 3. Colour logic

- **Ground**: warm, light, low-saturation paper tones. **Ink**: one near-black for all type and pencil.
- **One highlighter colour**, used only for the claim: at most one highlight per piece, and one new highlight per spoken sentence. It never fills a shape, a background or a headline.
- **One cool counter-tone** (a grey-blue) for what is being measured against or is about to be corrected: grid lines, a hatched "expected" area, a dashed reference line.
- Under-sheets may be tinted, but stay muted enough that the highlighter is the most saturated thing in every frame.
- Halftones are ink on off-white; cut-outs are never coloured.
- Example: desk `#E7E0D1`, paper `#FBFAF6`, graph card `#F3F0E7`, ink `#161616`, highlighter `#FFDC2E`, counter-tone `#7C93A6`, under-sheets `#D9CDB4` / `#C9D3D8`.

## 4. Type & subtitles

- **Headlines and big numbers**: a heavy grotesque with a condensed width (Archivo 800–900 at condensed or extra-condensed), capitals, tight spacing. A number can fill a whole slip.
- **Statements**: a book serif (Source Serif 4), roman or italic, 44–56 px, on its own slip.
- **Labels**: a typewriter mono (IBM Plex Mono), 18–26 px, capitals, letter-spaced, as the small line above a number or the title of a chart.
- **Notes**: a handwriting face (Caveat), 70–80 px, written directly on the desk at a slight angle, revealed left to right, never more than three words.
- All four are OFL. Fit every headline to its slip by measuring it (a piece clips what overflows).
- **Subtitles are a strip of label paper** lying on free desk in screen space: serif, ~38 px, on an off-white strip with a shadow, turned under half a degree. The keyword of each cue is highlighted as it is spoken. Give each line a position where the desk is free; split a line that is longer than about 45 characters into two cues. Hold ≥ max(1.8 s, speech + 0.6 s); assert it in code.

## 5. Motion quality

- **Pieces move on twos (12 fps)**: a slip slides in from outside the frame, lifted and turned a few degrees, and lands in about 0.4 s with its shadow tightening; a cut-out pops in three steps (too big, too small, right).
- **The camera is smooth at the film's frame rate** and is never still: a slow drift, push or turn of a fraction of a degree during every hold.
- **Marks are drawn, not faded**: highlighter 0.3–0.5 s, a pencil strike 0.2 s, a circle 0.4 s, a chart line as long as the sentence about it.
- **Nothing leaves.** A wrong idea is crossed out and stays on the desk. No dissolves, no opacity fades on paper.
- Counts tick up on twos and may accelerate; the final value holds.

## 6. Camera grammar

A vocabulary, not a route. Opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Slow push on one piece | this is the thing to read now | a claim; a number; a quotation |
| Whip across the desk to the next cluster | the next step of the argument | "but", "so", "here's why" |
| Drift along a row | counting; a list | members of a group; steps; years |
| Push further into a detail of a piece already read | the part that matters | one point on a curve; one name on a list |
| Pull out to several clusters or the whole desk | how the parts add up | a summary; a comparison; the conclusion |
| Slight roll while holding | keeping a long hold alive | reading time; a pause |

Framing: the piece being read fills at least a third of the frame; the subtitle strip never covers it; a whip takes 0.45–0.6 s and starts just before the sentence it belongs to. Transitions are camera moves across the same desk; never a cut to a different surface, never a dissolve.

## 7. Sound palette

- **Music**: light, curious and rhythmic, with small percussive timbres: marimba or vibraphone ostinato, plucked strings, a soft bass, a shaker, a bell for the one bright moment. It can be synthesised. The beat can divide (eighths to sixteenths) while something multiplies on screen.
- **Foley is paper and stationery**, dry and close: a sheet sliding, a sheet landing (a low puff then the slap), a felt-tip squeak for every highlight, pencil grain for lines and a harder scratch for a strike, a small press for each cut-out, a tick for each counted item, a soft whoosh under a whip.
- **Silence**: the music stops while a guess is crossed out and before the answer lands; the last line can be spoken over almost nothing.
- **Mix**: narration compressed and about 10 dB above the music, music ducked under every line, −14 LUFS.
- **Voice**: a conversational explainer, plain sentences, one idea each.

## 8. Native moves

A menu: use the ones your story needs.

- **Highlight on the word.** The marker crosses the key phrase as the narrator says it. *Fits content like:* a clause in a contract; a line in a policy; one figure in a price list.
- **Guess, struck out.** The intuitive answer is set large, then crossed out in pencil before the real one arrives. *Fits content like:* a myth about nutrition; an expected budget; an old rule of thumb.
- **Cut-outs as a count.** The same cut-out repeated until the number is visible. *Fits content like:* seats in a parliament; households in a street; shipments in a week.
- **Pencil web.** Lines drawn between cut-outs until relations, not things, fill the sheet. *Fits content like:* trade routes; who reports to whom; dependencies between software packages.
- **Chart drawn while spoken.** A curve grows on a graph-paper card and a marked point gets its own slip. *Fits content like:* a price over ten years; a dose–response curve; adoption of a technology.
- **The whole desk.** A pull-out that shows every piece at once, then one slip laid on top. *Fits content like:* the summary of a report; the timeline of a merger; the case for a decision.

## 9. Pitfalls of the medium

- A desk that fills up reads as clutter → one cluster per idea, each on its own under-sheet, with clear desk between clusters.
- Highlighter everywhere means nothing → one per piece, one per sentence.
- Highlighter drawn with normal blending greys out the type → multiply.
- Headlines clipped by their slip → measure and fit every headline.
- A whip that lands on a moving entrance is unreadable → pieces that the whip reveals are already there, or arrive after it lands.
- The subtitle strip covering a piece → choose its position per line.
- Fine pencil lines vanish in a pull-out → the conclusion needs one large slip made for that scale.
- Grain or noise drawn per frame in the page makes every frame incompressible → tile the paper once in world space, add grain in the mux.
- A count that ends on a tick nobody can read → hold the final value at least 2 s and highlight it.

## 10. Engine

In `demo/`: `desk.js` is the reusable part: `makeDesk(g, W, H)` returns the camera (`setCam`, one `world(z)` transform), `ground`, `piece(o, draw)` (torn or cut paper with shadow, clip and optional graph grid), `enter(o, t, t0, from)` (a landing on twos), `text` (four type roles, registers boxes for `readcheck`), `highlight`, `pencil` with the polyline helpers `wob`, `ring`, `curve`, `bust` and `pop` (halftone cut-outs), `tape` and `finish` (vignette). `film.js` shows shots as `[t0, blend, pose, pose]`, subtitle strips with a highlighted keyword, and one source of times for picture, foley, score cues and subtitles.

```js
const D = makeDesk(g, 1920, 1080); D.setCam([960, 540, 1, 0]); D.ground();
D.piece(D.enter({ x: 500, y: 300, w: 900, h: 300, rot: -.02, z: 20, torn: [0, 6, 8, 0], seed: 4 }, t, 1.0, { dx: -800 }), () => {
  D.highlight(40, 150, 420, 110, (t - 1.8) / .4, 2);
  D.text('RENT', 46, 250, { f: 'head', size: 190, w: 900, st: 'condensed' });
});
```

## 11. Variation space

You decide the argument, how many clusters it needs, their arrangement on the desk and the camera's path through them, what the cut-outs are, the highlighter colour and the under-sheet tints (within §3), the opening and the ending. All far from our demo:

- Structures: **a document read closely** (one long printed page, the camera moving down it, three phrases highlighted in turn); **two columns** (a claim on the left, the evidence on the right, row by row until the rows disagree); **a timeline along the desk** (dated slips laid left to right, one long lateral drift, then back to the one that mattered).
- Openings: **a highlighter stroke on an empty sheet**, the phrase printed under it afterwards; **a pile of slips** pushed apart to show the one at the bottom; **a single cut-out** alone in the middle of a very large desk.
- Endings: **the camera returns to the first piece**, now annotated; **a slip is turned over** to show the answer on its back; **the highlighter caps**, and everything but the highlighted words is covered by a blank sheet.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
