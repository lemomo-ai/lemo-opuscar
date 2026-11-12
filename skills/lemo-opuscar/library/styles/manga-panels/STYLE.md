# Manga Panels — Style Prompt

> A black-and-white Japanese manga page that moves: G-pen ink, screentone dots, one spot colour, panels that open on the beat, sound effects slammed in letter by letter, and a camera that travels across the paper and through the gutters. The panel is the cut.
> References (grammar only): Japanese shōnen / seinen manga printing and page grammar in general (screentone, focus lines, speed lines, hand-lettered sound effects, right-to-left reading, chapter title pages, colophons, flip books); TV anime openings that animate manga panels. Borrow the page grammar, never a specific work's characters, layouts, lettering or signature shots.

## 1. Essence, and what it is not

Three things make it read as a printed manga page and not as an illustration:
- **Only ink and paper.** Every grey is a pattern of black dots or lines (screentone), never a continuous grey or a gradient.
- **The panel is the unit of time.** A new panel inking in *is* the cut; panels open in reading order (right → left, top → bottom) on the beat.
- **Lettering is drawn, not typed.** Sound effects are big, rotated, outlined and boiling; narration lives in boxes, speech in balloons.

One spot colour (by default a vermilion; a user's brand colour can take its place) is allowed for one subject only; everything else is black and white. The subject comes from the film's topic: a product, a character's one item, a symbol of the story. Not an American comic (no CMYK process dots, no colour plates, no left-to-right page), not a pencil sketch (lines are inked, crisp, tapered), not a greyscale photo filter (no smooth greys anywhere).

## 2. Materials & rendering

- **Paper** `#F3F0E8` (warm, never pure white), **ink** `#121212`. A 512 px grey-noise grain multiplied at 10 % over every frame.
- **Ink line**: G-pen look — crisp lines that taper at both ends, thick contours, thin interior detail, solid spot blacks in hair and deep shadow, fine parallel hatching for form. Generated art is drawn this way (see §9) and only re-printed by code, never re-drawn.
- **Screentone from generated art** (`tools/prep.py`): detail areas (high local variance: lines, hatching) are hard-thresholded; flat areas (low variance) become a 45° AM dot screen (cell 6–9 px at display size, coverage capped at 62 %, above 84 % solid black). Scale every image to the size it will be **shown** before screening, and make a small, coarse-celled copy (cell 4, ~640 px wide) for anything shown small; otherwise the dots blur into grey. Real black stays solid.
- **Code tone**: dot gradients (`tone(key, w, h, fn, cell)`, coverage as a function of panel u, v) and line tone (`lineTone`, parallel lines whose width follows coverage), cached per key. Use dot gradients for sky, depth and emotion backgrounds; line tone for speed, shadow and the book spine.
- **Panel border**: 7 px solid ink with mitred corners at 1080p, gutters 18–40 px, at least one edge slanted 1–6° on most panels (shōnen energy). A dashed border means an *empty* panel, still to be filled.
- **白フチ (paper rim)**: a figure or product that breaks out of its panel gets a 12 px paper outline plus a 3 px ink outline (`halo()`, pre-composited once from the keyed image's silhouette).
- **Spot colour** `#F03C1E` is printed flat with ink dots on top for its shadows (the red area of the source image keyed by red dominance). The colour is written in two places, `ACC` in `demo/kit.js` (what the code draws) and `ACC` in `demo/tools/prep.py` (what the drawings are printed with): change both together.

## 3. Colour logic

| Name | Value | Use |
|---|---|---|
| PAPER | `#F3F0E8` | page, gutters, rims, white-out light |
| INK | `#121212` | line, solid black, every dot |
| ACC | `#F03C1E` (default) | the one spot colour; swap for the user's brand colour if they have one, keep it saturated and alone |

- The spot colour belongs to one subject and the graphics that speak for it (for example: a product's shell and the tags that point at it, a character's scarf, the key object of the story, a brand underline). Characters, backgrounds, lettering and effect lines stay black and white, or the page turns into a colour comic.
- Light is drawn by **removing** tone (white-out wedges, white stars with an ink edge), never by adding grey.
- Impact frames invert paper and ink for 2 frames.

## 4. Type & lettering

- **Sound effects** (katakana, Dela Gothic One): per letter — 1.6–1.9× → 1× slam with overshoot, 0.03–0.09 s stagger, ±10° random rotation, small offsets, three layers (wide ink stroke ×0.34, paper stroke ×0.27, ink fill), boiling ±1.5 px at 12 fps. Small kana (ッ ャ) at 0.62× and dropped. Dela's 「カ」 reads as 「太」 at small sizes: use another word (ドンッ rather than カンッ for a hit).
- **Narration boxes** (Noto Serif SC 900, vertical, right column first, a space starts a new column): paper box, 5 px ink border, offset solid ink shadow, characters ink in one after another. Inner voice, scene-setting, verse lyrics.
- **Hand-lettered shouts** (Noto Sans SC 900, 110–190 px): the same slam engine as the sound effects, horizontal or vertical. Choruses, slogans, anything shouted.
- **Speech balloons** (Noto Serif SC 900, vertical): ellipse with a tail toward the speaker's mouth; full-width comma becomes the vertical form.
- **Small Latin lines** (Barlow Condensed 800, slanted; 600 for the smallest): one English line under a Chinese title, brand line or colophon.
- **A film in a language written in rows** (English, for example): narration boxes and speech balloons are set in horizontal lines, in a heavy serif of that script; shouts in a heavy sans. Boxes, borders, shadows, strokes, the slam and the timings stay as above, and so do the katakana sound effects.
- All Chinese and Japanese fonts are subset to the glyphs used (`tools/fonts.sh`); load every weight before the first frame.

## 5. Motion quality

- **Panel ink-in**: 0.1 s wipe in the reading direction, content slammed 40–110 px from that direction and settled in 0.22 s.
- **Boiling**: focus lines, speed lines and lettering redraw 8–12 times a second with a new seed; images stay still. Stopping the boil is itself an event (time freezes).
- **Shake**: an exponentially decaying jitter (τ 0.07 s, 6–40 px) on every hit.
- **Performance comes from pose frames**, not from tweening a drawing: a new pose = a new panel. Inside a panel: slide-in, bob (running), head flicks on half-beats, a sweat drop sliding, a tone wiping away.
- **Fast / slow**: speed comes from more panels per beat; calm comes from one big panel, a slow push and floating sparkles.

## 6. Camera grammar

A vocabulary, not a route. Opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Pan along the reading direction across a page wider than the frame | following, chasing | a run; a queue; a process |
| Push into a point inside a panel (an eye, a keyhole), then cut on an impact frame | entering the next thought | a decision; a flashback; a zoom into detail |
| Glide through the gutters from panel to panel, one beat each | a series, a collection | a day in photos; steps of a recipe; a team roster |
| Pull back from one panel to the whole page | the moment becomes part of a story | an ending; a reveal of scale |
| Static frame while the panels change around it | the grid itself is the action | bursts, comparisons, countdowns |
| Slow push on a single big panel with emotional tone | feeling, a held breath | a smile; a memory; a result |
| A panel splitting along a slanted gutter | a page giving way to the next | a chapter break; a change of place |

No page-turn transitions. The one legitimate page turn is a flip book, where turning pages *is* the animation.

## 7. Sound palette

- **Score** (default for a music-led film; a story with narration can use a quieter cue under the voice): anime-opening rock (distorted power chords, melodic bass, tight drums, a bright lead or vocal), 150–170 BPM. Cut on bars, slam panels on beats.
- **Foley**: ink brush for every panel ink-in (band-passed noise, starts 0.08–0.1 s early), paper rustle for camera travels, clicks, impacts, a metallic "kiin" for glints, double "pi-pi" for an alert, heartbeats, wings, footsteps, the rattle of a flip book.
- **Techniques**: the hero subject's own sound as percussion in the score (a click, a pour, a footstep, a bell); a real silence (0.5–1 s) after the biggest hit, shown as one quiet panel with no lettering and no effect lines (the subject at rest after the action, or an empty panel), never a blank page; one beat where everything freezes (boil, music) before the drop.

## 8. Native moves

A menu: use the ones your story needs, each with how it is built.

- **Panel = cut, one per beat** (`panel()`): *fits* a list, a montage, a countdown, a beat drop.
- **Panel split = burst** (one panel splits on consecutive beats, for example 1→2→4→8→16, each cell one frame of a motion, cells numbered in reading order, a flash per new cell): *fits* a fast motion taken apart, a crowd of options, growth.
- **Panels merge into a double-page spread** (gutter lines shrink to zero, then one big panel): *fits* the moment everything comes together.
- **Break the frame** (出格: a haloed figure or object drawn above the border): *fits* a hero entrance, a product reveal, an escape.
- **Same composition, consecutive panels** (the same framing three times, something changes each time): *fits* time passing, a crowd thinning, waiting.
- **Anticipation triptych** (ready → action → close-up, each a new panel and a closer framing): *fits* the second before a decision.
- **The empty panel** (dashed border, then filled on the beat): *fits* "next", a blank page, a promise.
- **The quiet panel (間)** (a hard cut to one wide panel on a bare page, the subject at rest, no lettering, no effect lines, at most one glint; held through a real silence): *fits* the breath after the biggest hit, the moment after a decision.
- **Time stop** (tone wipes away from a point, speed lines retract, boiling stops, one mark locks in place): *fits* focus, a realisation, slow motion.
- **Gutter travel** (camera through a page of panels): *fits* a gallery, a contact sheet, a timeline.
- **Emotion tone** (radial dot gradient, floating bubbles and four-point sparkles): *fits* a smile, love, relief.
- **Flip book** (pages flip from the corner, 30 a second, each page a frame): *fits* "it comes alive", an animation reveal.
- **Chapter title page** (扉页: full-figure key art, vertical chapter box) and **colophon** (奥付: a ruled box of credits on the last page): *fits* openings and end cards.
- **Narration box → shout → speech balloon** as the lyric or script moves from thought to outburst to address.
- **Impact frame** (2 frames of inverted focus lines) on every section cut.

Our demo opens on a *chapter title page*, spends *panel split = burst* as its signature and ends on panels merging into a *double-page spread* and the colophon. A new film opens and ends another way: a cover being inked line by line, a single sound effect on an empty page, an ending on "to be continued" in a box on the last panel, or *the empty panel* left unfilled.

## 9. Characters, props and image generation

**An image generator is required.** Characters, products and every panel drawing are generated for the user's own topic, following the pipeline below, with the image tool the user provides: their Codex CLI through `core/image/gen_image.py` (`--check` first), or another image API or app, where they make the images from your prompts and save them under your file names. With neither, a film in this style cannot start: say so in the brief (core/README.md, "Image generation"); never draw stand-in characters in code.

**Images belong to each film.** The demo's images (its character, its camera, its city) are there only to show the technique: never reuse them, recolour them or edit them into a user's film.

**Materials first.** Before generating anything, ask the user whether they have their own character designs, a logo, product photos or a brand colour; what they give comes first (a logo is set in code or keyed; a product photo becomes the ink reference for the prop, the brand colour can become the spot colour). If not, the characters and the hero prop (a product, or the story's key object; a film may have no product at all) come from the image generator, and **before generating, tell the user how many images and of what** (for example: "one character reference and one product reference, then nine poses, two close-ups and three backgrounds, fifteen images").

**Pipeline.**
1. Two references first: **the character** (half-body, the defining pose, holding the prop) and **the prop alone** (the hero view used on the end card). The prop reference locks its design for every later image.
2. Every further image gets the character reference as a reference image (`--ref` in `gen_image.py`), a full-body image too when legs or shoes matter, and the prop reference whenever the prop is in the picture. Describe the same features in every prompt (hair, jacket, the prop's parts).
3. Figures and props go on **flat pure green (`#00FF00`)** for keying (not white: white cannot be separated from paper and highlights). Full-frame panel art (backgrounds, close-ups, over-the-shoulder, crowds) fills the frame edge to edge.
4. The spot-colour subject is painted **FLAT PURE RED (`#FF0000`)**; midtones are flat light-grey areas, screened later by `tools/prep.py`.
5. **No lettering in images**: every prompt ends with the style suffix below; all lettering is set in code.
6. **Changing a prop later** without redrawing the characters: generate the new prop reference first, then edit each image with the old image as the first reference and the new prop reference as the second, in edit mode ("replace only the {prop}; keep everything else exactly as it is"; `core/image/gen_image.py --edit`). Re-measure every anchor that sits on the prop (a logo spot, a seam, a handle) and every crop, since an edit can move things by a few per cent.
7. Prefer new poses and new framings over reusing one drawing at a new size: a 45 s film needs 12–16 different drawings.

**A product that reads as real.** A fictional product earns its place on a launch page when it borrows the design language its category is known for, so the viewer recognises the type at a glance: name in the prompt the silhouette and the few parts every model of that type has (for headphones, the band, the cups and the hinge; for a sneaker, the sole line, the lacing and the heel tab; for a kettle, the spout, the handle and the base). Never a real brand's model, logo, badge, name or numbers: every product prompt says "an original design, not any real brand or model; no logo, no badge, no letters or numbers anywhere". The spot colour goes on one material of the prop (a headphone shell, a sneaker's upper, a kettle's body), the rest stays ink and paper.

- **Style suffix** (appended to every prompt):

> Style: black-and-white Japanese seinen/shonen manga page art, inked by hand with a G-pen nib: crisp confident lines that taper at both ends, thick outer contour and thin inner detail lines, solid spot blacks in hair and deep shadows, fine parallel hatching for form. Midtone shading is drawn as FLAT LIGHT-GREY areas (they will be replaced by screentone later) - no gradients, no airbrush, no painterly rendering, no colour except where explicitly stated. Absolutely no text, no letters, no sound effects, no speech bubbles, no panel borders, no signature, no watermark. Original character, not resembling any existing anime or manga character.

- **Prompt templates**: *character reference* — "{who, age, hair, clothes, prop}. Pose: {pose}. The {prop}'s {one material} is FLAT PURE RED (#FF0000). Everything else is black ink on white paper. Background: flat solid pure green (#00FF00) chroma key, completely empty." *Prop reference* — "{the category's design language, part by part}, an original design, not any real brand or model. The {material} is FLAT PURE RED (#FF0000) … no logo, no letters or numbers anywhere … green background." *New pose* — "Same character as the reference image (same face, same {hair}, same {clothes}); the {prop} exactly as in the prop reference. {pose, framing, angle}. … green background." *Full-frame panel art* — describe the framing and end with "Fills the frame edge to edge."

## 10. Consistency checks

- Fix each character's silhouette-defining features (hair shape, the jacket, a bag) and repeat them in every prompt.
- Look at every generated image at the size it will be shown, screened: the prop must keep the same parts in the same places (for headphones, say: the logo on the left cup, the hinge at the same height on both sides, the cable on the right).
- The spot colour may appear only on the prop's one material; reject an image where it leaks onto clothes or the background.

## 11. Pitfalls of the medium

- Grey creeping in (alpha over tone, smooth gradients, a toned image drawn semi-transparent) → every grey must be dots or lines; fade by wiping, not by alpha.
- Dots turning into mush when an image is shown small → screen at display size; keep a coarse small copy.
- Spot colour spreading to clothes, lettering or effects → one subject only.
- Lettering inner counters filling with ink → paper stroke ≥ 0.27 × size, ink stroke only slightly wider (0.34).
- Sound effects and lyrics fighting for the same corner → plan lettering positions per shot; lyrics never cover the face.
- Text inside the camera transform getting blurry or cut off on a push → set readable lines in screen space.
- A panel holding still for more than a beat → add an in-panel action (boil, slide, sweat, sparkle) or a new panel.
- Page-turn transitions → don't; push into a point, split along a gutter, or cut on an impact frame.

## 12. Engine

In `demo/`: `kit.js` (panel, tone, lineTone, focus, speed, rings, star, sfx, narration, shout, balloon, afBox, halo, put, cover, cam, flash, text registry for readcheck), `film.js` (sections), `beats.json` (the whole cut grid: bpm, offset, cuts in bars, lyric lines in seconds — retime to a new song by editing only this file), `tools/prep.py` (screentone print), `tools/gen_all.sh` + `prompts/` (generation queue and prompt texts), `core/image/gen_image.py --edit` + `tools/gen_camswap.sh` (swap a prop in existing images, §9; the demo's script swaps its camera), `mix.py`. A minimal new use: one generated figure screened by `prep.py`, three `panel()` calls on three beats, one `sfx()`.

## 13. Variation space

You decide the structure, the characters, the world, the opening, the ending, the camera path and the pacing. All far from our demo:

- Structures: **a four-panel gag strip** (起承転結, four panels, the punchline breaks the frame); **a battle page** (speed lines and impact frames only, one spread at the climax); **a how-to manual in panels** (one step per panel, the camera glides through the gutters).
- Openings: **a cover** being inked line by line; **a single sound effect** on an empty page; **the last panel of a previous chapter**.
- Endings: **"to be continued"** in a box on the last panel; **a pull-back to a whole volume's spine**; **the last panel left blank** with a dashed border, for the viewer to fill.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
