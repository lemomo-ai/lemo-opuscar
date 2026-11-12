# Gilded Illumination — Style Prompt

> The whole frame is one gilded miniature painting, and the story happens inside it: flat mineral pigments inside firm ink outlines, white-lead highlights and dots, and real gold leaf (laid in squares, with seams, burnished) that only shines when a light inside the picture moves across it. No book, no page, no desk: the picture fills the screen edge to edge, and at the end it can be revealed as one whole painting inside its own border.
> References (picture grammar only): Gothic and late-medieval miniatures (blue grounds with gold stars, gold grounds with punched diapers, foliate and quatrefoil frames, stepped leaning rock spires, scalloped clouds, continuous narration with one figure shown several times). Copy no specific painting, figure, layout or border; never name a manuscript or painter in the film.

Rules below are what make the style; everything marked *Reference* is one good way to do it, free to change per film.

## 1. Essence, and what it is not

- **Flat pigment, firm line.** Every shape is one flat colour, a darker band just inside the outline, a **firm ink outline** (never hairline: at least ~2.5 px on screen in a wide shot, thicker in close-ups) and white-lead strokes on the edges that face the light. No gradients that model form, no soft shading.
- **Gold is a material, not a colour.** Gold leaf is laid in squares: you can see the leaf blocks, their seams and overlaps, a little red bole where the leaf broke, punched dots. It lies dark and warm until a light crosses it; then the squares flash one by one (each one tilted a little differently) while the pigment beside it stays matte. That contrast is the style's signature. Anything yellow on screen is either real leaf with that texture or a pale pigment that cannot be mistaken for it; never a flat yellow standing in for gold.
- **White lead in strokes and dots.** Besides the edge strokes, white lead is laid as dots: triads on foliage and rock, a row of pearls along a hem, a band of pearls on a vermilion ring. They are what makes a flat shape read as painted, not as a vector illustration.
- **The picture is the place.** The camera lives inside one painted world. Text, when there is any, lives inside the picture too: a speech scroll, a plaque in the border, an inscription.
- **The world is painted too.** Mountains, trees, buildings, figures, water and sky use the same palette and the same outline-and-highlight rule. Nothing switches to photographic or 3D-shaded rendering.
- **Night is deep ultramarine.** The dark of the picture is the blue ground sinking toward a deep lapis, never black and never grey. When light returns, the sky stays a deep blue: the world gets brighter because its gold lights up, not because the blue turns pale or the whole frame is lifted.
- **Medieval pictorial logic.** Mountains are clusters of stepped, leaning spires; skies are blue grounds with gold stars and scalloped clouds; distance is shown by size, overlap and paler pigment, not by atmosphere.

Not Stained Glass (no lead cames, no transmitted light), not Art Deco (no streamlined geometry, no metallic gradients as decoration), not Ukiyo-e (no woodblock bleed, no bokashi), not Paper-cut Lightbox, not a fantasy game map, not a flat vector illustration with yellow circles.

## 2. Materials & rendering

- **Pigment shapes**: `fill` + `rimShade` (the same path stroked inside its own clip in a darker tone) + ink `stroke` + white-lead `hiLine` + white-lead dots. This recipe is the whole look; keep line widths tied to the camera so they never thin out to a hairline in wide shots.
- **Gold leaf**: a tileable texture laid in leaf squares (each square its own tone, a thin dark seam with a bright overlap ridge, a few cracks, specks of red bole), filled through a pattern into any path, then a burnish, a speck layer, an inner rim and an ink outline. Punched decoration is rows of tiny dark dots with a light fleck. Raised (gesso) gold gets a small cast shadow.
- **Light only on gold**: every gold path is also written into a screen-space mask; light from the picture's own sources is added only inside that mask, per leaf square (each square has its own tilt, so the light moves across the squares unevenly), with star-shaped flashes where it is brightest. Pigment never receives specular light.
- **Lit gold stays gold**: light pulls the leaf toward a warm gold with a cap on each colour channel (ours stops at 82% of the way), so the brightest leaf still shows its squares and seams and never burns to white or flat yellow. A soft bloom, if any, belongs only to the most strongly lit leaf and stays small; never a wash over the frame.
- **Ground pigment (ultramarine and friends)**: a granular pattern (coarse grains, not noise) mapped between a dark and a light tone of the hue.
- *Reference:* vellum (procedural sheet with grain and stains) is kept for the parts that are written on: speech scrolls and the end plaque.
- *Reference:* static and live layers: anything that does not move can be pre-rendered under the camera; anything that grows, flashes or is lit is vector, every frame (ours draws everything every frame at ~50 ms).
- **Light comes from inside the picture**: a lamp, the sun, a band of light crossing the painting. Night is the pigments sinking toward blue; lit gold rises above it.
- *Reference:* infinite zoom: textures that must survive a big push (the leaf in a macro shot) are generated again at higher resolution for that region and cross-faded by log zoom.

## 3. Colour logic

- The ground is ultramarine (sky) or gold (gold-ground panels and frames). Everything else is a short list of medieval pigments: lapis/ultramarine blue, vermilion, verdigris green, rose, azure, lilac-grey, white lead, iron-gall brown ink, gold, rarely silver. Ochre only in small, clearly matte places (hair, a roof), never on large areas next to gold.
- Each pigment comes in three values only: body, darker rim, white-lead highlight.
- Blue and gold are the pair the eye goes to; keep the biggest blue field and the brightest gold for the moment that matters. Vermilion is for the hero, frames and marks of importance.
- *Reference palette:* ultramarine `#22379a`, vermilion `#c8321f`, verdigris `#3f8f7a`, rose `#d97a8a`, ink `#2a1a10`, gold leaf (texture, mid tone `#c99a3e`); vellum `#efe2c4` only for scrolls and the plaque.
- Brightness is carried by gold, not by the whole frame: from the darkest night to the brightest ending, the average brightness of the picture moves little; what changes is how much gold is lit and how brightly.
- Never: neon, pastel gradients, photographic skies, flat yellow used as gold, black outlines thicker than the shapes they hold, a pale or washed-out sky after the light returns, a global brightness or saturation boost to show "day".

## 4. Type & subtitles

- *Reference:* titles and inscriptions in Uncial Antiqua (display capitals) or Grenze Gotisch (lowercase Gothic); explanatory words and subtitles in IM Fell English (roman and italic) for English and Noto Serif SC for Chinese, in brown ink, written on scrolls and plaques. One language per line.
- **Sizes**: text meant to be read ≥ 40 px at 1080p for titles, ≥ 32 px for English subtitles, ≥ 34 px for Chinese.
- **Reading time**: hold ≥ CJK ÷ 4.5 + other ÷ 15 + 1.5 s, and ≥ 1.8 s, from the first frame the block is complete. Text is revealed by a pen wipe, never typed letter by letter.
- **Subtitles are a speech scroll, fixed in one place**: a vellum banderole at the bottom centre of the frame (Chinese line, English line) that unrolls when a line is spoken. It is part of the style. It never moves sideways and never changes size: one width for the whole film (set by the longest line, shorter lines centred inside it), one height, one type size. Between two close lines the scroll stays open: the old words fade, then the new ones are pen-wiped on; two lines are never seen on top of each other.
- **Compose for the scroll**: the hero is kept out of the lower-centre band while a line is up (higher in frame, to one side, or the camera lowered), rather than moving the scroll.

## 5. Motion quality

- 30 fps, smooth (on ones). Things appear the way they are made: shapes pop up with a small spring, strokes are laid along their path, writing is wiped on, gold is laid then shines, a figure is painted in layers (gold, colour, ink and white lead).
- Easing is calm (ease-in-out, ease-out); springs only on small things appearing.
- What never moves: the painted picture and the gold already laid. Only the light, the hero and the camera move across them.
- Paint and gold build up; they never fade in as a whole.

## 6. Camera grammar

A virtual camera over a flat painted world (centre, log zoom, roll).

| Move | What it expresses | Can serve |
|---|---|---|
| exponential pull out of the leaf | from the material to the picture | an opening; a reveal of scale |
| push through a quatrefoil / foliate frame | entering the picture, changing chapter | a hero introduced in a roundel, then the world |
| follow along the path of a continuous narration | a journey, time passing | a climb, a pilgrimage, a delivery |
| foreground spire or cloud wiping across | an elided stretch of time without a cut | the middle of a long walk |
| locked frame while light rakes | revelation, value | the finished work, gold, a seal |
| a band of light sweeping the whole picture | the world changes | a sunrise, a verdict, a return |
| a ring of gold light spreading from a touch | ignition, a decision, a turning point | a key turning in a lock, a seal pressed |
| hard cuts on circles, centre to centre | match, repetition | a wheel to a halo, a coin to a seal |
| the big pull back to the whole painting | the story was one picture | endings: every scene seen at once |

Framing: the painted world fills the frame edge to edge; a patterned border can be the camera's frame and, at the end, grow into the whole painting's frame. Allowed transitions: continuous zoom, push through a frame, foreground wipes, match cuts on shapes, hard cuts on the beat. Forbidden: page-turn wipes, slide transitions, cross-dissolves between unrelated scenes.

## 7. Sound palette

- *Reference band:* bowed fiddle (a solo violin played plainly stands in), harp, portative organ (a soft organ register), frame drum, recorder; bells (tubular, glockenspiel, hand chimes) for gold.
- Modes: dorian, mixolydian, aeolian; a Picardy third for arrival. No piano, no modern string section, no synth pads.
- *Reference foley:* the painted world's own sounds: wind, running water, footsteps on stone, a door, a far bell. Workshop sounds (quill, brush, mortar) are optional, for a film about making.
- Silence is a tool: drop the band to one held note when the picture asks a question.
- Gold gets a bell when it lights; the brightest moment of gold gets the fullest bar of music. Mix: voice on top, music under it, −14 LUFS.

## 8. Native moves

- **The touch.** A small light (a flame, a spark) touches a large piece of leaf; two thin rings of gold light spread from the point of contact and the leaf squares light one after another as they pass, while rays around it light in turn. Restrained: no white flash, no full-frame bloom; the climax is gold lighting up, not the screen going bright. *Fits content like:* a launch; a first sale; the moment a thing starts working.
- **Gold laid, then lit.** Gold appears dark and warm; later a light crosses it and each leaf square flashes in turn while pigment stays matte. *Fits content like:* revealing a finished seal; an inventory of treasures; a medal list.
- **Lit by a lamp.** A light moves through the picture and the gold brightens only near it, then sinks back after it passes. *Fits content like:* a guide, a teacher, a product that changes what it touches.
- **Into the material.** Pull out of a macro of leaf (squares, seams, punches) into the picture. *Fits content like:* where a thing comes from; an opening that starts from texture.
- **Continuous narration.** The same figure appears several times in one painting, each at a later moment of the story; the final pull back shows them all. *Fits content like:* a journey; a process with stations; a life.
- **Through the frame.** A quatrefoil or foliate frame holds a close-up; the camera pushes through it into the big picture. *Fits content like:* introducing a hero; a chapter change.
- **Painted in layers.** A figure or a title appears in the order it is made: bole, gold and its flash, then colour, inner rim, ink and white lead. *Fits content like:* a reveal; a signature; a product being made.
- **Holy card.** One object centred in a painted frame on a gold ground, with its name on a scroll. *Fits content like:* a herb; a tool; a coin.
- **Brush fill.** A blank area is filled stroke by stroke in ground pigment, from the centre out. *Fits content like:* a design completed; a sky; a filled map region.

Our demo opens *into the material*, out of a macro of dark leaf, uses *the touch* as its climax and ends on the pull back to the whole painting, its border growing from the corners. A new film opens and ends another way: a gold ground with nothing on it yet and the first stroke of colour, a *holy card* whose gold is *laid, then lit*, a *brush fill* of the first blank area, or an ending on a locked frame while light rakes across one finished object.

## 9. Pitfalls of the medium

- **Shading creeps in.** Soft gradients make objects look plastic; model with the rim band and white-lead strokes only.
- **Flat-illustration drift.** Thin lines, no white dots, gold as plain yellow discs: the picture turns into a modern vector illustration. Keep the ink firm, add white-lead dots, show the leaf squares.
- **Gold everywhere, lit all the time.** If gold shines all the time, the light has nothing to reveal. Keep gold dark until its moment.
- **The white-out climax.** Pushing the lit leaf's brightness up (or adding a big glow) turns the brightest moment into a yellow-white blur and erases the leaf squares. Light the climax with more gold, not with more white: rings, squares lighting in turn, a capped gold tone.
- **Day by brightening.** Raising the whole frame's brightness or saturation, or turning the night sky light blue, to show that the light came back looks like a colour-correction slip and kills the deep ultramarine. The sky stays deep; the gold does the work.
- **Wandering subtitles.** A scroll that jumps between left, centre and right, or changes width with each line, reads as an error. Fix its place and size; move the camera or the hero instead.
- **Picket-fence mountains.** A row of spires of the same height reads as a fence. Group spires in clusters (one tall, smaller ones leaning off it), vary the gaps, and stack two or three ranges, paler and smaller behind.
- **Stacked-box mountains.** Rectangular ledges read as buildings; spires must lean and taper, with small stair-steps on both flanks.
- **The hero as a nun.** A hood over the face makes a small figure read as a nun or monk; keep the face and hair visible.
- **Blackletter legibility.** Grenze capitals are hard to read; set display capitals in Uncial and keep Gothic for lowercase words. Never set Chinese or long English in blackletter.
- **Fake Latin.** Use real public-domain Latin sentences or none.
- **Infinite zoom seams.** A single texture stretched over a big push turns to mush; regenerate the leaf at the zoomed region's resolution.
- **Render state.** Canvas state and cached patterns leak between frames; reset the context every frame and clear offscreen buffers.

## 10. Engine

- `lib.js`: math and easing, `monotone`/`track`, the pigment palette, the leaf-square gold texture (`makeGold`, `leafAt`), `gold()` / `goldStroke()` with the glint mask (`MK`), `shape`, `rimShade`, `hiLine`, `dots`/`pearls` (white lead), `tubePath`, `spirePts`, `camMatrix`, `reg()` for `window.TEXTS`.
- `world.js`: the demo's one painted world (its subjects are the demo's; your film paints its own): `leaf()` with its dark (`dim`) state, layered rock clusters (`makeRange`, `drawSpire`), the sun (`drawSun`, dark or lit, rays lighting in turn), trees with gold fruit, the chapel with a gold-ground arch, the hero (`drawGirl`, painted in layers), the lantern, the border that grows from its corners (`drawBorder`), the end plaque.
- `film.js`: one timeline in film seconds; `glintPass` (radial lights and light bands, computed per leaf square from the mask), the quatrefoil frame, the macro leaf for the opening, the speech-scroll subtitles, `window.EV` for the sound.
- Minimal example, a gilded coin with a punched rim on ultramarine:
  ```js
  const c = P2(q => q.arc(0, 0, 60, 0, TAU));
  g.fillStyle = ULTRA; g.fillRect(-200, -150, 400, 300);
  gold(g, c, [-60, -60, 120, 120], { lw: 4, rimW: 6 });
  for (let a = 0; a < TAU; a += .2) { g.fillStyle = 'rgba(110,60,5,.55)'; g.beginPath(); g.arc(Math.cos(a) * 50, Math.sin(a) * 50, 2, 0, TAU); g.fill(); }
  pearls(g, 0, 0, 72, 24, 3);   // white-lead pearls around it
  ```

## 11. Variation space

The agent decides the painted world (a mountain, a city, a garden, a sea), the hero, where the light comes from and what it touches, the story's stations, the palette within the pigment list, and the music within the band.

- *Reference structures:* one journey told as continuous narration in one picture; a bestiary of framed holy cards lit one by one; a single object followed from its material to its place in the picture.
- *Reference openings:* a pull out of a macro of dark leaf; a single lit lamp in a quatrefoil; a gold ground with nothing on it yet, and the first stroke of colour.
- *Reference endings:* the pull back to the whole painting, its border growing from the corners; a plaque in the border lettered in bole, then gilded; one last band of light crossing every piece of gold.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
