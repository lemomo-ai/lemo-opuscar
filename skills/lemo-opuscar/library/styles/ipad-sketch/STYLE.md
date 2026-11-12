# Tablet Sketch Explainer — Style Prompt

> The whole frame is a cream drawing canvas on a tablet, seen while someone draws and explains: grainy pencil lines go down first, flat colour blocks come after, shifted off the line and not quite filled, and the canvas itself is pinched, panned and turned between ideas.
> References (grammar only): draw-along explainers and time-lapse recordings of tablet sketching; pencil-and-marker recipe and craft illustration; off-register risograph colour. Never copy their drawings, layouts or lettering.

## 1. Essence, and what it is not

- **One canvas.** Every frame is a region of one page. The page fills up as the film goes and is seen whole at least once; nothing exists off the page (no device bezel, no app toolbar, no hand).
- **Line first, colour second.** Objects are drawn in graphite (white inside), then coloured as a separate pass. Colour sits *under* the pencil and is visibly shifted off it (offset 5–12 canvas units, down-right), with a ragged edge.
- **Still drawing.** Some evidence that the drawing is in progress always stays: light construction lines left in, a block coloured half way, one object with its line only.
- **The canvas moves, the marks don't.** Finished lines never boil or jitter; the camera is two fingers on the glass (pan, pinch, rotate a few degrees).
- **A stylus, no hand.** The only real object in the frame is a clean stylus that rides the mark being made and lifts between marks.

Not the sketchnote (dotted paper, ink fineliner that boils, grey marker + one yellow, a pen you never see). Not a whiteboard explainer (white board, black marker, hand). Not urban sketch pen-and-wash (watercolour washes that bleed). Not a vector flat explainer (no pencil grain, no off-register).

## 2. Materials & rendering

- **Paper:** cream canvas with a fixed paper grain (fine value noise plus a slow mottle), anchored to the canvas so it pans, zooms and turns with it. A light screen-space corner falloff only.
- **Pencil:** a stamped-dot brush along a Catmull-Rom spline, one stamp every ~0.5 canvas units; pressure = taper in and out × slow noise, driving both width and density; a small low-frequency wobble along the normal. Within one stroke take the max coverage (no self-darkening).
- **Grain threshold:** at composite, pencil opacity = clamp((coverage · 0.9 − grain · 0.85 + 0.32) · 2.1). Light pressure is eaten by the paper tooth: broken, grainy edges. Lettering goes through the same threshold, so words look pencilled too.
- **Colour blocks:** the object outline, translated off the line and displaced along its normal by noise (ragged edge), filled flat and blended *multiply* under the pencil. Highlights, seams and inner layers are holes cut out of the block (the paper shows through). Objects in front cut the blocks behind them.
- **Colouring path:** a block is revealed along a back-and-forth (boustrophedon) path across its shape, so a half-coloured block ends in visible strokes. A block can stop at any fraction.
- **Re-registering:** to change an object's colour, erase what the new block covers (slightly wider, so no old fringe peeks out) and colour again; the line stays.
- **Layers, in order:** paper → colour blocks → light construction pencil (≈55% opacity) → graphite → coral accent pencil.
- Draw the canvas into buffers at ≥ 2× its unit size so a 2.5× push-in still shows clean grain; the camera scales the buffer, the grain is never generated in screen space.

## 3. Colour logic

- Neutral ground: a warm cream paper; graphite (warm dark brown-grey, never pure black) for every line and word.
- **System colours (every film):** a light graphite for construction lines, one coral for the "explaining" marks (arrows, underlines, burst ticks, the one number that matters), one mustard for the highlight block under the key word of a title.
- **Subject colours (per film):** soft, warm, chalky versions of the subject's real colours; each gets a darker variant of the same hue for a second, smaller shadow block (≈40% multiply). Four to eight subject hues in a film.
- Colour is information: when a thing changes (ripens, dries, cooks, ages) change its block, not its line. A swatch strip that records each state is the style's way to chart.
- Example: paper #F3EADB, graphite #43362E, light #A8998A, coral #DC6A4C, mustard #F1C04F.

## 4. Type & subtitles

- **Lettering on the page** is handwriting written stroke by stroke along each glyph's skeleton, then put through the pencil threshold. A casual marker-hand Latin (e.g. Caveat Bold for titles, Medium for notes) and a pen-hand Chinese (e.g. Long Cang) for one short line; all OFL.
- Roles: a title (≈100 canvas px) with a mustard block under one word and a coral underline; chapter capsules (circled number + word on an offset block) when a film has chapters; notes 32–50 px with a short pencil leader to what they name. Chinese on the page ≥ 34 px on screen.
- Notes are placed in the empty space next to their object, never centred stacks, never a header bar.
- **Subtitles** live outside the canvas, as a small paper chip: a light cream rounded strip over a darker paper block offset down-right (the colour-block grammar), Chinese on top in a readable text face (e.g. LXGW WenKai, 40 px), English below in the handwriting face (40 px), left aligned, one line each. The chip wipes in left to right like a colour block (≈0.2 s), the words fade in after; bottom left by default, bottom right when the subject sits there. Hold ≥ max(1.8 s, speech + 0.6 s).

## 5. Motion quality

- Marks appear at the speed of a sped-up drawing: a long line 0.3–1.4 s (slow only when the camera is close), small strokes 0.03–0.1 s, a block 0.05–0.4 s. One stylus: marks are mostly sequential; the stylus lifts and travels in an arc between them, and leaves the frame in pauses longer than a second.
- 24 fps on ones; no boiling, no paper shake. What moves: the camera, the stylus, the mark being made, and anything the story animates in screen space (particles, a colour flood).
- Construction lines come first and fast; outlines next; colour last. A group is drawn white, then coloured as a group.

## 6. Camera grammar

The camera is the canvas under two fingers. Every move is a gesture: quick start, settles with momentum (≈0.7–0.9 s); between gestures the canvas drifts very slowly; it usually sits 1–4° off level and comes back to 0° for the whole page.

| Move | What it expresses | Can serve |
|---|---|---|
| Extreme push on a line (2.5×) | the material: grain, pressure, a line being made | a hook; a detail that needs attention; the first stroke |
| Pinch out | "now see what it was" | a reveal; changing scale; closing a section |
| Two-finger turn | the artist settling into the next drawing | a new section; a long curve being drawn |
| Pan / tilt along the page | moving to the next idea on the same sheet | a sequence; a journey; cause → effect |
| Follow the stylus | being led | a branch, a road, a timeline drawn in one stroke |
| Match cut between a small and a magnified copy of a drawing | zooming in without leaving the page | a close look at a process; data inside an object |
| Punch-in (≈0.15 s) and settle | an event | a crack, a click, a threshold |
| Whole page | the answer | an ending; a summary; a map of everything said |

Framing: the subject fills ≥ 1/3 of the frame height at key moments; leave the bottom 160 px for subtitles. Transitions are made from the medium (a gesture, a colour flood, a match cut); no fades, no wipes, no hard cuts except a match cut.

## 7. Sound palette

- **Foley is the pencil:** graphite on paper (band noise 0.7–4.2 kHz with paper-tooth bumps and the slow rhythm of a hand), lighter and higher for construction lines, choppier for lettering, broad and low (0.3–2.6 kHz, 12–14 Hz back-and-forth) for colouring; a tiny tick when the lead touches down after a lift; the sheet sliding under two fingers for a gesture. Drive it from the page's marks, not from a library of one-shots.
- **Music:** warm, small, acoustic: nylon guitar, double bass, a soft shaker, a soft-mallet vibraphone or kalimba; one soft accent note per new idea. No generic piano and strings.
- Silence: a near-silence (pencil and room only) before a reveal; the first sound after it is the reveal.
- Mix: voice compressed and set ≈10 dB (RMS) above the music; the music dips 300 Hz–4 kHz while someone speaks; −14 LUFS, true peak ≤ −1 dB. Voice: warm, unhurried, a creator talking over their drawing (≈2.3–2.6 words/s).

## 8. Native moves

- **Line, then colour.** A group is drawn white; a new "pencil" colours it as a pass. *Fits content like:* a plant part by part; a dish's ingredients; a city block before it is zoned.
- **Re-register a block.** The line stays, the colour block is replaced; record every state on a swatch strip. *Fits content like:* bread browning in an oven; leaves through autumn; a bruise healing; paint mixing.
- **Holes as layers.** Cut holes in stacked blocks to show a cross-section (shell, white, yolk). *Fits content like:* a geological core; a cake's layers; an onion; a cable's insulation.
- **Colour flood into the next shape.** Push into a block until it fills the frame, sweep a new colour over it, shrink it into the next object. *Fits content like:* a snowfield becoming a sheet of paper; a sunset becoming an orange; a stop sign becoming a tomato.
- **Shatter a block.** The colour of an object breaks into hundreds of small offset chips that fly elsewhere, leaving the empty line. *Fits content like:* a window breaking; seeds scattering; salt dissolving; a budget split into spending.
- **Match cut to the magnified copy.** Push into a small drawing, cut to a large copy elsewhere on the page with the same screen size and angle, then draw the magnifier circle around it. *Fits content like:* a cell inside a leaf; a gear inside a watch; a word inside a page.
- **Still drawing.** End a section with something unfinished (half a block, a line-only object, construction lines). *Fits content like:* any explainer that should feel live rather than finished.

Our demo opens on an extreme push on the first line, uses *colour flood into the next shape* as its turn and ends on the whole page with the title written last. A new film opens and ends another way: an empty page with a question written on it, a finished drawing rubbed out to start again, an ending on one object *re-registered* to its final state, or a swatch strip read from the first colour to the last.

## 9. Pitfalls of the medium

- **Boiling lines** turn it into a sketchnote: keep finished marks still.
- **Colour on top of the line** looks like a sticker: composite colour under the pencil, always multiply.
- **Perfect fills** look vector: keep the offset, the ragged edge and an occasional unfinished block.
- **Grain in screen space** crawls during camera moves: generate it in canvas space, at the buffer resolution, and let the camera scale it.
- **Stylus parked over the subject or a note:** park it in empty paper, or take it off frame.
- **Too many objects on one page:** a page for a 50 s film holds about six drawings and a dozen short notes; plan the whole page before drawing the first line, and leave the final title's space empty until the end.
- **A drawing that is too small to read when the page is whole:** size objects for the final pull-back, then push in for detail.
- **Thin flat transitions** (a fade between areas of the same page) break the canvas illusion: move the canvas instead.

## 10. Engine

All in `demo/index.html`:

- `PEN(points, {w, p, ta, tb, wob, layer}, t0, d)` — a pencil stroke; stamps precomputed so progress never changes geometry. `layer: 'light' | 'graph' | 'coral'`.
- `BLOB(poly, colour, {dx, dy, a, amp, holes, cuts, ang, sp, stop, replace}, t0, d)` — an offset colour block revealed along a colouring path; `replace` re-registers what is under it; `stop` leaves it half done.
- `OCC(poly, t0)` — an object in front clears lines and colour behind it.
- `TXT(text, x, y, size, {f, k, rot}, t0, d)` — stroke-by-stroke lettering from `glyphs.json` (`tools/skeleton.py` builds it for any OFL font).
- `cam(t)` with gesture / push / cut / follow / punch keys; `composite()` (grain threshold); `drawStylus(t)`; `DYN` for screen-space actors (a colour flood, particles).
- Minimal example, not in the demo: a lemon cut in half — `PEN` a circle, `BLOB` it yellow with `holes` for eight segments, `BLOB` a pale ring with `replace` to show the pith.

## 11. Variation space

Each film decides its page layout, its order of drawings, how many sections, which subject colours, where the camera rests, and how the page ends.

- **Structures:** a loop that ends where it began; a single object taken apart layer by layer; a comparison of three recipes side by side on one page.
- **Openings:** the first line seen up close; an empty page and a question written on it; a finished drawing being rubbed out to start again.
- **Endings:** the whole page with a title written last; one object recoloured to its final state; a swatch strip read from first to last colour.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
