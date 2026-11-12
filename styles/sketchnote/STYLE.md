# Sketchnote — Style Prompt

> One page of visual notes on dot-grid paper, drawn while you watch: a black fineliner writes and draws, a grey marker gives volume and shadow, one yellow marker carries the single thing that matters. Banners, rounded boxes, fat arrows, icons and hand lettering grow stroke by stroke; the camera rides the pen across the page and ends by pulling back until the whole page reads as a poster.
> References (grammar only): live sketchnoting and graphic recording of talks (banners, numbered steps, fat arrows, one accent colour); whiteboard animation's "the hand is the camera" pacing. Copy none of their layouts, icons, lettering or music, and never name them in the film.

## 1. Essence, and what it is not

- **The frame is the page.** Warm white dot-grid paper fills the screen; there is no desk, no notebook edge, no hand and no pen prop.
- **Everything is drawn in front of you**, at the speed of a pen: outlines first, then the marker, then the words. Nothing fades in, nothing slides in.
- **Three tools only**: one black fineliner, one grey marker (three strengths), one yellow marker.
- **Hand lettering is the typography**: titles on banners, keywords in a bold hand, notes in a thin hand, all written stroke by stroke.
- **The page is planned as a poster.** Every note has its place in the final page; the film is the page being made.

Not Whiteboard Explainer (no hand, no wipe, a page that is kept, not erased; tone and volume from marker, not a bare marker line), not Urban Sketch · Pen & Wash (no watercolour, no perspective scene), not Chalkboard, not Data Storytelling (charts are hand-drawn notes on the page, not a chart engine), not a keynote (no slides, header bars or page turns).

## 2. Materials & rendering

- **Paper**: a flat warm white with a faint grain texture anchored to the page, and a dot grid (26 px pitch, 1.3 px dots) drawn in world space so it scales with the camera.
- **Fineliner**: points resampled every 3 px and offset along the normal by three layered sines (a slow wobble, a medium one, a fine tremor); drawn twice, the second pass thinner (≈ 0.6×), lighter (≈ 0.5 alpha) and wobblier; line weight varies in short segments; closed shapes start at a random point and overshoot their start a little.
- **Marker**: clipped to a jittered outline, laid as a row of slightly bowed, semi-transparent broad strokes at one angle, composited with `multiply`, so overlaps darken into streaks; a thin line of pooled ink along the clip edge. Markers are laid stroke by stroke in their angle's order.
- **Shadow and volume**: the shape minus itself shifted (even-odd), filled with grey marker. Drop shadows always fall the same way (down-right, ≈ 9–10 px for boxes); crescent shading on the side away from the light.
- **Paper fill**: a shape that sits on top of others (a banner, a box, a jar label) is first filled with the paper colour, so the lines under it disappear.
- **Letters written stroke by stroke**: each glyph of the real font is thinned to its centre line, ordered like a pen (start at the top-left free end, keep the smoothest direction, lift and jump to the nearest free end), and revealed by a thick mask stroked along that path. Never wipe text in from left to right.
- **Determinism and boil**: every element has a fixed seed; random numbers are consumed the same way at every progress, so a half-drawn stroke and the finished stroke are the same stroke. Only the fineliner's wobble phase boils: a new drawing every 2 frames, a cycle of 3, a shift of 0.35–0.7 rad (≈ 1–2 px). Marker fills never boil.
- **Everything is anchored to the page** (world space) and seen through one world → screen camera. Only subtitles live in screen space.

## 3. Colour logic

- **Ground**: warm white paper; dots in a light warm grey. No dark backgrounds, no large black areas.
- **Ink**: one near-black for lines and words; a warm dark grey for secondary notes.
- **Grey marker**: the only way to give volume, shadow and fill; three strengths (light for volume, middle for shadows and banner tails, dark for folds and small dark parts).
- **One yellow**: reserved for the one thread the story follows (say, one raindrop on its way to the sea) and for two structural parts, the numbered banners and the fat arrows. Everything else stays black and grey. A darker yellow only for sparks and the closing loop.
- All colour is laid as translucent marker in `multiply`, never as opaque flat fill.

Example (our demo): paper #FBFAF6, ink #1E1E22, notes #5B5852, grey rgba(100,100,110,.16) / rgba(80,80,92,.28) / rgba(52,52,64,.45), yellow rgba(255,205,40,.80), dark yellow #F5AA00.

## 4. Type & subtitles

- **Hand lettering only**, licence-free and self-hosted: a bold casual hand for titles, banners and keywords (e.g. Kalam Bold, 34–84 px), a thin upright hand for notes (e.g. Patrick Hand, 26–32 px), a hand-written Chinese face for Chinese (e.g. ZCOOL KuaiLe, subset to the characters used). Avoid regular kai or sans faces: next to hand lettering they read as system fonts.
- **Hierarchy is part of the page**: title on a banner with a yellow swash; keywords bold; notes thin and grey; numbers that matter get a yellow swash or a loop. At most four sizes on a page.
- **Each letter has a little tilt and bob** (fixed seed), never perfectly aligned.
- **Micro notes** (≈ 3 px on the page) may live inside an icon, readable only when the camera dives in; on the full page they read as texture.
- **Subtitles** belong to the notebook: a paper slip at the bottom of the frame, a strip of grey washi tape on its corner, one line of Chinese (hand-written face, ≥ 40 px) over one line of English (the note hand, ≈ 31 px), never wrapped. A soft 0.2 s fade and a 6 px rise. Hold ≥ max(1.8 s, speech + 0.6 s). Frame every shot so the subject sits above the slip.
- Text written on the page is timed to the words of the voice-over.

## 5. Motion quality

- 24 fps. The camera is smooth on every frame; only the line wobble boils on twos.
- **Speed is the pen's speed**: outlines in a quarter to half a second per element, words about as fast as a person writes them. Later sections may use several pens at once to build energy, never instant appearance.
- Order inside one element: outline → paper fill → marker → shadow → label.
- Marker bars in charts grow from the base with an ease-out; liquid fills rise from the bottom.
- Nothing moves once drawn: no bouncing icons, no sliding labels. Life comes from the boil and from new strokes.

## 6. Camera grammar

A camera over a flat page: one world → screen function, zoom in log space, centre moving in step with 1/zoom on big zoom changes.

| Move | What it expresses | Can serve |
|---|---|---|
| Ride the pen (centre trails the pen tip slightly) | being there while it is made | a long outline; a path; a diagram growing |
| Slow push while words are written | attention, reading time | a definition; a key number |
| Pan along the page between blocks | the next idea follows from this one | a sequence; cause and effect |
| Whip across empty dots (quintic ease) | a jump in thought, a question | a question; a change of topic |
| Dive (10–15×) into an icon | the detail inside the thing | a mechanism; a hidden part; a micro note |
| Shape match cut (one round shape to another of the same screen size) | this becomes that | a transformation; one thing carried elsewhere |
| Pull back to the whole page | the parts add up | a summary; a scale reveal |

- Pens may draw off-screen only when the shot shows other drawn work; a frame should always contain something readable.
- Framing: a block being explained fills about half to two thirds of the frame height; the subject stays above the subtitle slip.
- Transitions are camera moves over the same page. No cuts to other pages, no fades, no page turns.

## 7. Sound palette

- **Foley from the strokes**: fineliner scratch (band-passed noise 2.4–6.5 kHz with paper-tooth grain), lettering (same pen, choppier), marker (softer, 0.7–3.2 kHz, a "fsh" per streak); level follows how many strokes are active on screen, with a soft ceiling; pan follows where the stroke is on screen; a faint nib tick on longer strokes. Paper-and-air whooshes for whips, dives, match cuts and the pull-back.
- **Music**: small, wooden and plucked: marimba, pizzicato strings, kalimba accents, glockenspiel for sparkle, harp and vibraphone for a closing chord; bowed vibraphone for held, airy moments. No pads that fill the page's silence, no drums.
- **Silence is pen-only**: the first seconds can be just the pen.
- **Voice**: warm and clear, a teacher talking, slow (≈ 2–2.6 words/s), phrases split at commas with short breaths. Compress the voice, keep it ≈ 10 dB over the music by RMS; the music gives way in 300 Hz–4 kHz and ducks while she speaks; pens step back under the voice. Master −14 LUFS.

## 8. Native moves

- **The page writes itself.** Outline, marker, words, in that order, timed to the voice. *Fits content like:* a recipe's steps; a meeting's decisions; how a law gets passed.
- **One colour as the thread.** The single accent follows one thing through every block, so the page can be read by colour alone. *Fits content like:* one euro through a supply chain; one signal through a nervous system; one idea through a book.
- **Shape match cut.** Push into a round shape until it fills a set screen size, cut to another shape of the same size elsewhere on the page, pull back and draw the new context around it. *Fits content like:* a seed becomes a tree; a coin becomes a bank vault; a cell becomes an organ.
- **Dive into an icon.** A micro note written inside a drawing, readable only at 10× and more. *Fits content like:* a chip's transistors; the ingredients inside a pill; a clause inside a contract.
- **Ride the pen.** The camera follows the pen tip around an outline while a second pen fills nearby. *Fits content like:* drawing a route on a map; tracing a timeline; outlining a building plan.
- **The pull-back poster.** The last strokes are made in parallel while the camera pulls back; the final frame is a page you could print. *Fits content like:* a lecture summary; a product one-pager; a year in review.

Our demo opens on a single icon drawn in close-up with one number written large, uses the *shape match cut* and the *dive into an icon* as its turns and ends on *the pull-back poster* with the pen circling one note. A new film opens and ends another way: *ride the pen* along a long outline from the first stroke, a whip across empty dots to a banner with a question on it, or an ending on a dive into the last detail instead of a pull-back.

## 9. Pitfalls of the medium

- **Flicker**: random numbers drawn per frame make every line jump. Seed every element; let only the wobble phase boil, and only a little.
- **Text that appears at once**: a wipe or a fade reads as a slide. Write along glyph skeletons.
- **Yellow everywhere**: when the accent decorates, it stops meaning. Keep it on one thread plus banners and arrows.
- **Overcrowded page**: if the poster looks like a page of handwriting, the film will too. Leave dot-grid air between blocks.
- **Heavy black and dirty shadows**: big black fills and inconsistent shadow directions break the paper feel. Grey marker for mass, one shadow direction.
- **Small text in the final frame**: plan the poster first; no note below ≈ 26 px at the final zoom.
- **Empty frames during camera moves**: a pan that lands on paper before the pen arrives. Start the words before the move, or keep finished work in frame.
- **Thick lines when diving**: line widths and wobble are in page units; inside a dive, draw micro notes with proportionally thinner lines and smaller wobble.
- **System-looking Chinese**: regular kai or sans faces next to hand lettering read as fallback fonts.

## 10. Engine

All in `demo/index.html` (Canvas 2D), reusable as is:

- `inkDraw(pts, o, prog)` fineliner (`w`, `amp`, `passes`, `closed`, `dash`, `alpha`); `markerDraw(clips, o, prog)` marker (`col`, `w`, `ang`, `gap`, `edge`, `op`; extra clips are subtracted, which gives shadows and crescents); `mstrokeDraw` single marker stroke (swashes, sparks, loops).
- `textLayout` / `textDraw`: hand lettering written along the glyph skeletons in `demo/glyphs.json`; `demo/tools/skeleton.py` builds them for any font (`skeleton.py KEY` merges one font).
- `addEl(t0, d, kind, draw)`: the stroke timeline; registration order is layering, time is separate; `slow(o, k, fn)` stretches a part's timing. The helpers `INK_`, `MRK`, `MST`, `FILL`, `TXT` register strokes; parts: `box`, `ribbon`, `fatArrow`, `inkArrow`, `sparks`; the demo's subject drawings `flower`, `bee`, `honeycomb`, `spoonFull`, `jarFull` (your film draws its own).
- `cam(t)`: keyframes `[t, x, y, zoom, ease]`, two keys at the same time make a cut, a `follow` entry rides a path's pen tip.
- `window.EV`: one event per stroke (kind, duration, screen pan); `demo/mix.py` turns them into the pen foley.

Minimal example (not in the demo): a yellow-tagged box with a written note: `box(200, 200, 400, 240, 0)`, `ribbon(400, 200, 160, 54, 'IDEA', 34, 0.3)`, `TXT('one thing per box', 400, 340, 30, { f: 'PH', align: 'center' }, 0.8)`.

## 11. Variation space

The agent decides the page layout, what the yellow thread is, the order the page is written in, the opening, the ending, the camera path and the pacing. The paper, the three tools, the hand lettering and the stroke-by-stroke drawing stay.

- **Structures**: a question answered across a page; a before/after split down the middle of the page; a timeline written left to right, then a pull-back.
- **Openings**: one number written large in the middle of an empty page; a single icon drawn in close-up; a banner with a question on it.
- **Endings**: the pull-back poster; the pen circles one note on the finished page; a dive into the last detail.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
