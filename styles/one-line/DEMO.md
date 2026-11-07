# One-line Drawing — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Line That Never Lifted* (47.5 s) · `one-line.mp4` · source in [`demo/`](demo/)


A 30–60 second film: one man's life drawn as one line that, in the final pull-back, turns out to be his own face as an old man.

## Story & structure

A film made of **one continuous line** on warm white paper. The pen never lifts: in code the entire film is literally one point array, from the first touch of the nib to the last frame. There are no cuts. The camera follows the nib like a tracking shot, with a little lag and a little anticipation, so the audience always watches the line *being drawn*.

Everything is a line: characters, places, objects, even time. No fills, no shading, no second weight of line, no background art. The only things on screen besides ink are the paper itself and a soft **shadow of the pen** (the real world above the paper). One accent colour at most, used once.

Learn the grammar from Osvaldo Cavandoli's *La Linea* (1971) — one line is both the world and the character, and transformations of the line are the jokes and the transitions; from Gjon Mili's 1949 photographs of Picasso drawing with light — the confidence and speed of a single gesture; and from Norman McLaren's *Begone Dull Care* and *Boogie-Doodle* — lines that are drawn *to* the music. Do not copy La Linea's character, its gibberish voice, or any specific continuous-line illustration.

Pick stories where **the continuity of the line is the meaning**. The demo used all five native powers and put the strongest one (the scale reveal) at the peak:

| Native power | Story use |
|---|---|
| **The pen never lifts** | A life, a journey, a process, a history: anything that is *one continuous thing*. No cuts, ever; the camera follows the nib. |
| **The line is time** | The character of the stroke changes with age or mood: light and fast in youth, full and steady in adulthood, trembling with dry-brush breaks in old age. One stretch can change colour (love, danger) and change back. |
| **Transformation** | A kite string becomes a bicycle frame, a smile becomes a road. Scenes don't cut, they *morph*: the last stroke of one image is the first stroke of the next. |
| **Stopping is an event** | When the nib stops, ink pools and blooms. A 1.5–3 s stop with music cut to silence is the strongest possible beat in this medium (loss, doubt, a decision). |
| **Reverse-designed scale reveal** | Every vignette drawn in close-up is secretly a part of one big picture. At the end the camera pulls back and the audience sees that the whole story *was* a face (a tree, a map, a word). |

Adapting any topic: find the **one picture** the story can end on, and the 6–8 moments that can each become a part of it. A company history → the founders' first desk, the first product, the first office… are the features of the logo. A city → its landmarks are the lines of a portrait of its founder. A love story → two lives drawn separately that join into one heart.

**Emotional arc for 40–50 s:** a single touch on blank paper (hook in the first 3 s) → quick, light early chapters → the one coloured chapter → a stop (silence, ink blooms) → the line resumes, changed → the final, slow strokes while the camera pulls back → the whole picture, held → a coda that passes the pen on.

## Shots

The camera is one continuous move: keyframes of composition centre, zoom, a few degrees of roll, and a follow weight `f` (0 = composed, 1 = locked to the nib). The follow point is a weighted average of the nib position over −0.55…+0.4 s, which gives lag and anticipation. A soft clamp keeps the nib inside 72 % × 66 % of the frame.

| Beat | Camera |
|---|---|
| Opening | Macro (z ≈ 4.3) on blank paper where the pen will land; the first vignette is composed, f ≈ 0.1 |
| Traveling lines | Follow (f 0.6–0.85), zoom out to ≈ 2.4 |
| Each vignette | Composed (f 0.15–0.35), framed so the finished drawing sits centred |
| The stop | Hold, with a very slow push-in (4.6 → 5.4) through the silence |
| Mirror chapter | Same framing as the chapter it rhymes with, mirrored |
| Reveal | One continuous pull-back from ≈ 3 to 1 over 5 s while the last strokes are drawn, then hold ≈ 1 s |
| Coda | Push in to where the pen rests for the handoff; pull back again as the new line runs; the end card sits in the empty paper |

- **Everything on ones** (24 fps). The appeal is the continuous act of drawing; stepping it would break the illusion.
- **Timing = chapter windows + curvature.** Each chapter has a time window; within it, time per point is weighted by `1 + K·turn` (sharp turns get more time, smoothed so speed never jumps). Pin musical beats with marks: by arc-length fraction `f`, or by position `at:[x,y]` ("the second time the pen passes the nose"). A stop is two marks at the same place.
- Corners (local speed minima at high turn) are exported to the soundtrack as candidate note onsets.
- Typical speeds: 300–700 units/s for traveling lines, 50–150 for small details (fingers, eyelashes). The last stroke of a life should be the slowest in the film.

## Score structure

- **Music: one solo instrument, one unbroken melodic line** — the sound equivalent of the drawing. The demo uses cello (`cellos` at low velocity, mono, slightly left, legato with 0.14 s overlaps), `cellos_pizz` for childhood, one `hand_chimes` note when the next generation starts. No piano, no string pad.
- Write the score to the drawing: key notes on the marks and corners (the grip closes on the tonic, each kite corner is a pluck, the highest note is the first touch of the two noses, eyelashes of the last eye are the last three notes). Line fast = short notes; line stopped = one long note fading into silence.
- **Silence is literal**: zero the music bus including reverb tails during the stop; drop room tone to 15 %.
- **The pen on paper is the most important sound**: synthesized from the pen speed track — band-passed noise (bright 2.2–7.5 kHz when fast, dull 0.7–2.4 kHz when slow), random paper-fibre ticks with density ∝ speed, amplitude ∝ (v/520)^0.5, panned with the nib's screen position; broken up by the dry-brush gaps in old age; lighter and jerkier for the child. Plus a wooden tap on the first touch, a barely audible wet swell for the blot, a tiny rub at the handoff.
- **Voice**: warm, retrospective male narrator (Kokoro `am_liam`, speed 0.84; high-passed at 85 Hz, low-passed at 7.2 kHz to soften it). 5–6 short lines that leave space for the line. Place them by whisper word timestamps so key words land on picture beats ("holding **on**" on the grip, "**goes** on" when the pen resumes). Music ducks ≈ 5 dB and the pen ≈ 4 dB under voice. Loudness −14 LUFS, **grain 0** (the paper texture is in the render).

## Palette, props & the reverse-designed face

**Reverse design is the core technique.** Draw the final picture first, then cut it into chapters, then design each chapter so it reads as its own scene in close-up *and* as a feature of the final picture. Rules:
- **Each region of the final picture is drawn exactly once.** Connectors between chapters must fall on natural lines of the final picture: lens rims, nasolabial folds, crow's feet, the jaw contour, a hair. Every "extra" connector becomes a stray wrinkle, a jowl or a beard in the reveal.
- **Plan the topology like an Euler path.** A closed motif such as a mouth (smile + upper lip + two profiles) is a circuit: you leave where you came in. Either route the next chapter from the same point (a retraced fold is invisible) or reorder the chapters. In the demo "loss" comes before "child" purely for topology, and is made the emotional point ("and then it goes on").
- **Retracing is legal and invisible:** going back over an existing line only thickens it slightly. In the demo the pen "reels in" the kite by retracing its tail and string back down to the head.
- **Test the reveal early and often:** render the whole path at once, at final scale, after every change (`?all=1&cam=0,-170,1`).

**Mapping used in the demo** (old man's face): left ear = his birth (a baby fist curled into the C of an ear, gripping an adult finger that is also the arm of his glasses); bald dome = kite string, the kite = his single hair; glasses = the bicycle (wheels = lenses, saddle = left brow, handlebar = right brow, frame = sides of the nose); mouth = first love (two profiles nose to nose; their crowns form the M of the upper lip, the red smile below); nose = the house (the ring and a round window are the nostrils); right eye + tear = the loss; right ear = his own child (mirror of his birth); jaw contour = old age; left eye closing = the last stroke.

**Paper**: warm white `#F4EFE4`; procedural mottling (1400-unit tile, soft-light), long fibres (260-unit tile, fading out when zoomed out so it does not shimmer), a sparse "paper tooth" speckle screened over the ink at close zoom; vignette 0.13 multiply. All textures are anchored to the paper and move with the camera.

**Ink**: warm black `#1D1A17`, rendered as a filled polygon around the path (not `ctx.stroke`), mixed with paper colour to an opaque tone per point.
- Width = age base width × pen pressure × fine noise (±8 %). Pressure from speed: `0.66 + 0.8·exp(−v/300)` (fast = thin, slow = fat).
- Base widths (paper units): child 2.4 (alpha .82), teen 2.5, adult 2.9 (.96), old 2.7 (.93), the next generation 2.0 (.76). Blend styles over ±60 units at chapter boundaries.
- Ink bleed: the same polygon slightly wider, drawn to an offscreen layer, blurred (≈0.9 × zoom px) and composited at 22 %.
- Pooling: extra round dots where speed < 45 units/s.
- Old age: perpendicular tremble (two noise octaves, amplitude up to ≈1.1 units), dry-brush gaps from long-scale noise plus three thin bristle strands; **reduce the dryness again for the final strokes** so the last gesture is clear.
- The stop: a teardrop-shaped blot (tip at the stopped nib, belly sagging downward as it spreads, dark tide line at the rim).
- **Keep a screen-space minimum line width.** Line widths scale with zoom like a real line under a macro lens, but during the pull-back clamp the zoom used for width to ≥ 1.3 (≈ 3–4 px at the reveal). Without it the final picture looks like a pencil sketch and loses weight.

**Colour**: at most one accent, used once and kept in the final picture where it means something. The demo's red `#B3332B` starts exactly at the mouth corner and returns to ink at the next chapter, so the old man's only colour is his smile.

**The pen**: never drawn. Only a soft shadow (blurred wedge from the nib toward the lower right, length ≈ 560 × zoom px, alpha .15) and a 1–4 px contact dot. Hands appear only as shadows at the handoff (each hand composited as one flat shadow so overlaps don't darken).

## Titles, subtitles & end card

- Subtitles: Caveat 500, 46 px, ink at 84 %, no box, centred with the baseline 100 px from the bottom; they are **written on** left to right (0.2 s + 17 ms per character) behind a soft paper-coloured halo so passing ink lines never cross the letters; fade out over 0.45 s. Stay ≥ voice + 0.6 s and ≥ 1.8 s.
- Title: Sacramento (a monoline connected script — itself a one-line drawing) 76 px, written on over 1.6 s in empty paper away from the current vignette, with a small Caveat sub-line. Keep it short enough to disappear before the camera moves into it.
- End card: Sacramento title on two lines, "ONE-LINE DRAWING" in Caveat 600 with wide tracking, the credit line below, written in the empty paper beside the final picture while the new line is still being drawn. Its "LemoLab × Claude Opus 5.5" line (`subs.js`) belongs to this library's demo only: a user's film carries no LemoLab credit and no copy of this card.

## Pitfalls

- **Stray connectors ruin the reveal.** They read as a beard, jowls, a bib or a mask. Fix the topology (which chapter enters and leaves where), not the drawing.
- **A kite drawn straight up from the head makes a pointed onion dome.** Let the string be the single hair and retrace (reel in) back to the crown so the dome stays a clean arc.
- **Hands jutting sideways from the temples read as bolts.** Curl the baby fist into the vertical C of an ear, fingertip hidden inside, knuckles as four short round bumps (long loops read as springs).
- **Two profiles closed by an arc over their heads read as a goblet** (Rubin's vase). Let their crowns become the M of the upper lip instead, and join their necks into the smile at one point.
- **Profiles too close braid together** once line width is applied; keep ≥ 5 units between lips, touch only at the nose tips.
- **Eyes**: almond shapes with bags read as toothy mouths; a closed lid (‿) with three short lashes reads best.
- **A round blot reads as a mole.** Make it a teardrop that sags as it spreads.
- **Thin lines at the reveal.** Clamp the width zoom (see "Palette, props & the reverse-designed face").
- **Hand shadows as separate translucent shapes** double-darken where fingers overlap — composite each hand as one layer.
- **Titles collide with the vignette as the camera moves.** Check the title against every frame of its window, not just the first.
- **Whisper mishears**: "Sometimes it stops" is heard as "But sometimes it stops" and "Your turn." as "Your turns" — rephrase ("Sometimes the line stops.", "Your turn now.") rather than fight it.
- **zsh**: `=====` as an echo separator is expanded; heavy machine load makes `still.mjs` slow — the page supports `?cams=` / `?camt=` to render many views in one browser session.

## Build notes

```
styles/one-line/demo/
  face.js    THE drawing: every chapter as SVG path strings + transforms, and the chapter table (time windows, marks, holds)
  geom.js    samples SVG paths by arc length (browser SVGPathElement), adds tangent-continuous connectors, assigns time (curvature-weighted, marks, holds)
  ink.js     line renderer (pressure, bleed, pooling, tremble, dry brush, red stretch, teardrop blot, min screen width)
  paper.js   procedural paper, fibres, tooth, vignette          cam.js    composition keys + nib follow + soft clamp
  shots.js   camera keyframes                                    hands.js  pen shadow and hand shadows
  story.js   single source of truth for voice/subtitle/title/handoff times
  subs.js    written-on subtitles, title, end card               main.js   render(t), debug modes, events for the mix
  lines.json voice script   music/score.py  solo cello score   mix.py  pen-scratch foley + voice + music   build.sh
```

1. Design the final picture in `face.js` and iterate with `node core/render/still.mjs styles/one-line/demo 0 --q 'all=1&nopen=1&nosub=1&cams=0,-170,1.0'` (add more `;x,y,z` views to check vignettes in the same run).
2. Voice: `core/tts/tts.py lines.json voices` → `asr_check.py`; read `voices/words.json` and place lines in `story.js`.
3. Set chapter windows and marks in `face.js`; `node demo/tools/probe.mjs 0.5` prints part boundaries and the nib track to write camera keys.
4. `node core/render/events.mjs styles/one-line/demo` → `music/score.py` → `mix.py`.
5. `node core/render/video.mjs styles/one-line/demo --fps 24 --workers 3` (1140 frames ≈ 30–45 s) → `sh core/render/mux.sh out/video24.mp4 mix.wav one-line.mp4 24 0`.
6. Or simply `sh styles/one-line/demo/build.sh`.
