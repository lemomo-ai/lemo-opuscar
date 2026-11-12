# Instruction Manual Art — Style Prompt

> The film is a printed assembly manual: one sheet of off-white paper, black line art in true isometric (45°), flat white parts, faceless people at real proportions, and the manual's own signs (step numbers, parts call-outs, dotted guide lines, flat arrows, magnifier circles, a do/don't box) telling the story. The view never turns; the camera only travels over the page.
> References (grammar only): flat-pack furniture and construction-toy building manuals, aircraft safety cards. Borrow the signs (step number, parts box, do/don't, magnifier, arrow), never a brand's name, logo, figure design, colours or product codes.

## 1. Essence, and what it is not

Rules (they define the style):

- **One angle: true isometric, orthographic.** Azimuth 45° (every object is seen across one vertical edge), elevation 35.264° (arctan 1/√2): the three axes meet at 120° on screen, horizontal edges run at 30°, vertical edges stay vertical, nothing gets smaller with distance. The whole film keeps this one angle.
- **The frame is the paper.** The page is seen square-on; there is no desk, no folded card in 3D, no perspective on the sheet. Every shot is a part of one printed page.
- **Line art with flat fills.** One ink line weight, flat colour, at most three values per object (top lightest), no gradients, no cast shadows.
- **Yellow means "new in this step".** The part added in a step is safety yellow and turns white once it is fitted. Nothing else is yellow (the subtitle marker excepted). The audience learns this in the first steps, so a late yellow can carry the ending.
- **The manual's signs do the explaining**: step numbers, parts boxes with counts, dotted guide lines, arrows lying in the isometric planes, rotation arrows, magnifier circles, a do/don't box, a "click" mark. On-screen words are only numbers and counts.
- **Faceless people at real proportions** whose hands always do something.

Not Isometric Infographic (no coloured diorama, no data panels), not Isometric People Scene (no painted scene, no faces), not Blueprint (dark ground, technical dimensions), not Exploded Teardown (no rendered product, no photoreal materials), not a slide deck (no header bars, centred titles or page turns).

## 2. Materials & rendering

- **Projection**: world units in centimetres, y up; `makeView({cx, cy, s, az: 45, el: 35.264})` maps world → screen. A sphere always projects to a circle, so limbs, hands and cylinders are hulls of circles and stay right at any heading.
- **Painter's order by view depth.** Long parts (rails, posts) are sorted by their nearest point; an assembly that interlocks is drawn in groups from back to front (far end and back rail → the board and what lies on it → front rail, near end, bolt heads), so large flat parts never cut through bars.
- **Fill, then outline, per part**: overlapping parts are separated by a line, a part has no lines inside itself.
- **Paper**: off-white stock with faint fibres that travel with the page on a pan and keep their size on a zoom (printed stock, not a photo of it).
- **Line weight is set in screen pixels** (2.6 px at 1080p) and follows the zoom only partly (about z^0.55, clamped), so the whole page stays crisp when pulled back and lines don't go clumsy close up.
- **Appearing** (reference): a drawing first shows its complete line art with paper-coloured fills, then its colours come in over it. A part is never drawn half-built or floating.
- **Motion blur** (reference): pans smear one frame along the camera path; fast zooms average sub-frames across half a shutter.
- **Hands in close-up** (reference): when only hands are in frame (a magnifier, a "press here" shot), draw them finer than the full-body figures: a palm, a thumb and four separate fingers at real size (≈ 18.5 cm wrist to fingertip), white like the skin elsewhere, and the line where one finger overlaps the next is all that says "fingers" (one or two lines, no nails, creases or shading). The sleeve is the wearer's shirt colour (her light grey `#CFCBC2` reads best against white hands and parts; a white sleeve keeps its cuff line) and runs on until the frame or the magnifier's rim cuts it: an arm never ends inside the frame. Bring the arm in from the nearest edge, so the forearm crosses at most about a third of the frame, and place the hand by what it touches (the fingertip on the button, the palm on the jar). `demo/hand.js` does this; its check sheet is `?f=hands`.

## 3. Colour logic

| Role | Example (our demo) | Rule |
|---|---|---|
| Paper | `#F4F1EA` | ground |
| Ink | `#1E1D1B` | every line, arrow, number |
| Fitted part (top / left / right) | `#FFFFFF` / `#ECE8DF` / `#DCD7CC` | three flat shades |
| New part (top / left / right) | `#F7D35A` / `#F2C230` / `#DEAA1F` | only the part added in this step |
| Greys | `#CFCBC2` / `#9C988F` / `#6B6862` | clothes, trousers, shoes, hair |
| Metal | `#D9D7D1` / `#BDBAB3` / `#A3A099` | bolts, tools |
| Signal red / blue | `#D23A2E` / `#2C66AC` | only the ✗ and the ✓ |

The exact hexes are reference; the logic (paper, ink, white parts in three values, one reserved yellow, red/blue only for verdicts) is the style.

In a procedure that removes or changes things rather than adding them (opening, cleaning, a safety step), yellow marks the one thing the reader acts with or on in that step (the tool, the button, the part that comes off), and returns to white once the step is done.

## 4. Type & subtitles

- On the page only step numbers (a geometric sans, e.g. Inter 700, about 150 px at 1:1, top left of each step's area, printed on the paper and moving with it) and counts in parts boxes ("4×", Inter 600). Everything else is said by drawings and the voice.
- **Subtitles** bottom left, left-aligned: Chinese (e.g. Noto Sans SC 500, 38 px) over English (Inter 500, 32 px, ink at about 78 %), one line each, an 8 px yellow bar on the left marking the line being spoken. No box, outline or shadow; a soft paper-coloured bed (same colour as the page) keeps them readable over line art. Keep subjects out of that corner.
- A title, if any, is printed on the page like a manual's cover or footer, never a title card over the picture.

## 5. Motion quality

- Parts fly along dotted guide lines in straight paths, ease in, and stop with a small settle; a beat of stillness after each one lands.
- Arrow first, motion second: the arrow is drawn, then the part follows it once and holds.
- The new part's yellow fades to white once it is fitted.
- People move between a few key poses with eased interpolation; walking is short shuffled steps when carrying.
- Never moves: the angle, the page, the step numbers' positions.
- **Frame rate and grain**: 30 fps (parts glide along their guides without stepping); mux grain 1, since the paper fibres carry the texture.

## 6. Camera grammar

The camera is a 2D camera over one long sheet: pan, whip, tilt, push, pull, and cuts. It never rotates the view.

| Move | What it expresses | Can serve |
|---|---|---|
| Push into a parts box / object | "this one" | an opening; a detail |
| Pan or whip along the page to the next step | progress | the next step; skipping dull steps |
| Tilt to the next row, the step number entering first | a new stage | a change of section |
| Locked frame on a do/don't box | judging | a rule; a common mistake |
| Push through a shape (the ✓ cell, a magnifier circle) | going into the detail | the right way, shown big; a close-up |
| Shape-matched cut (a bolt head → a round knob) | jumping to the consequence | a mistake revealed; a time jump |
| Pull back to the whole page | the full sequence, the result | an ending; a summary |

Leave a step held still long enough to read its count and its arrow; the subject is at least a third of the view when it is the point.

## 7. Sound palette (reference)

- A small tidy ensemble that counts steps: pizzicato strings, marimba, glockenspiel, felt piano; one bright note per part landing, rising through the chord.
- Paper and flat-pack foley: a carton set down, a lid, wood knocking, a pencil, paper sliding, bolts, a ratchet, the click, a rubber stamp for ✗ and ✓.
- A mistake stops the music dead before the ✗; the ending is near silence, then a single chime.
- Voice (optional): a calm, dry narrator, as if the manual itself were speaking; few words, never reading out the numbers on the page.
- Mix: voice compressed and about 10 dB over the music, music gives way at 300 Hz–4 kHz under it; −14 LUFS, true peak ≤ −1 dB.

## 8. Native moves

- **Parts explosion.** The box opens and its parts fly along their own dotted lines to a counted parts list. *Fits content like:* unboxing; a kit's contents; what a product is made of.
- **Line art grows.** Floor line → object → people → arrows → magnifier, then the flat colours. *Fits content like:* a step being built up; a scene appearing.
- **Arrow-driven assembly.** A flat arrow in the isometric plane, then the part follows it and lands. *Fits content like:* any fitting, inserting, sliding step.
- **New part yellow.** The new part is yellow, then turns white. *Fits content like:* what changed in this step; the one new thing at the end.
- **Magnifier circle.** A small ring on the spot, a leader line, a big circle redrawn at 3–4× with a hand and a rotation arrow. *Fits content like:* tightening, pressing, a latch, a connector.
- **Do / don't box.** One white rounded box split in two: red ✗ beside blue ✓, drawn as strokes. *Fits content like:* safety rules; common mistakes; two ways to hold something.
- **Push through a shape.** The camera dives into the ✓ cell or a magnifier circle and comes out in the next picture. *Fits content like:* zooming into the right way; changing scene inside one page.
- **The whole page.** A final pull back shows every step laid out on one sheet. *Fits content like:* a summary; the full procedure at a glance.

Our demo opens on the parts explosion, uses the push through the ✓ cell as its turn and ends on the whole page. A new film opens and ends another way: a single part flying between cells, a shape-matched cut, a magnifier that opens the film, or an ending on the one last yellow part.

## 9. Pitfalls of the medium

- **The assembly must be one model with a state table.** Every picture of the object (every step, the parts list, the final page) is drawn from the same function with a state; write the table first (step → what is added → what the object has when the step ends → parts used) and add one thing per step. Counts on the parts list must add up across the steps (e.g. bolts 2 + 2 + 4 = 8). Separate drawings per step drift: parts appear early, vanish, or sit in the wrong place.
- **Footprints and guide lines come from the same geometry.** A dotted footprint must be the finished object's real corners; a guide line runs from where the part lies to where it lands. Parts in a box lie flat, stacked at real sizes, and the box is empty only after the last one leaves.
- **Knees bend with the body, not the world.** Set the knee hint from the body's heading, or a pose that is right facing one way breaks when the figure turns.
- **Kneeling hip height comes from leg length**: knee on the floor + one thigh length. A half-kneel: the kneeling knee under the hip, thigh vertical, shin and instep flat behind; the other foot flat, knee about 90°, shin vertical.
- **The far leg is one shade darker** than the near leg, so crossed or overlapping legs never merge into one shape.
- **Sitting on the floor**: cross-legged with the knees open and low and the shins crossed in front reads as sitting; a pelvis on the floor with legs straight forward reads as falling over.
- **Standing**: weight on one leg, the other relaxed and turned out, hips and shoulders tilted against each other. Feet together and arms hanging make figurines.
- **Placement**: never put a person between the viewer and what the step is about, and keep their feet outside the object's footprint. Behind slatted furniture their legs show between the bars and they read as standing inside it: put them at a front corner, or at one end with their back to the viewer.
- **A gesture that matters** (a hand on a shoulder) lands on the side nearest the viewer, with nothing in front of it.
- **Front-on (facing the viewer squarely) reads worst** at this angle; use three-quarter and profile headings.
- **Hair and buns** live in the head's own 3D frame, so they turn, tilt and hide with the head.
- **Small mistakes are hard to see at full-page scale**: a part on upside down needs the ✗ on it and a close-up, not only the voice.
- **No perspective, no turning the view**, no 3D camera orbiting the paper.
- **No brands, logos, product codes, faces or cartoon round-headed figures.**

## 10. Engine

- `demo/iso.js`: `makeView` (orthographic 45°, depth sort, `flush(g)`), `box` and `cyl` (both take `o.xf`, a rigid transform such as `rotAbout`, to tip a lid or swing a part), `prism`, `blob` (hull of spheres), `poly3`, `planeArrow` (an arrow lying in a world plane), `turnArrow` (an arc around an axis), `dashed`/`dashed3`, `cross`, `tick`, `roundRect`, `clickMark`, `rotAbout`; `setLW`, `setFillOverride` (line-art-first appearing), `setGhost`.
- `demo/rig.js`: `person(v, pose)`, two-layer body (pelvis carries the weight; chest leans, bends, twists), head frame with `lookAt`, hair and bun in the head frame, two-bone `ik` with knee and elbow hints; `mixPose`, `walkFeet`. `demo/poses.js`: stand, hands on hips, scratch head, read, half-kneel, sit cross-legged, lean on a rail; `lp` places points in a figure's own frame. A pose's `hands` are wrist targets: the palm centre sits 4.3 cm further along `handDir` and the fingertips 8.2 cm (times the figure's scale), so aim the wrist about 4 cm short of what the palm should touch.
- `demo/hand.js`: `hand(v, o)`, a hand in close-up (relaxed, flat, point, press, grip, pinch; placed by its wrist, its index fingertip `tipAt` or its palm centre `palmAt`), with the sleeve run out to the frame's edge or a magnifier's rim; `index.html?f=hands` shows every pose from the back and the palm side, and a few close-up shots.
- `demo/crib.js`: the one bed model `crib(v, state, overrides)` with its state table `S`, end panels, rails, base, mattress, bolts, `flipL` (the end turned over).
- `demo/page.js`: font names and the magnifier circle. `demo/film.js`: the long page, camera keys, the ten steps, footer, subtitles, motion blur, `window.EV` sound cues and `window.TEXTS` for the reading check.
- Minimal example: a box with a new yellow lid and an arrow.
  ```js
  import { PAL, makeView, box, planeArrow } from './iso.js';
  const v = makeView({ cx: 960, cy: 600, s: 3 });
  box(v, [0, 0, 0], [60, 30, 40]);                              // white body
  box(v, [0, 34, 0], [60, 36, 40], PAL.neu);                    // the new part, yellow, above where it lands
  planeArrow(v, [30, 50, 20], [0, -1, 0], [1, 0, 0], 12, 10);   // down, lying in a vertical plane
  v.flush(g);
  ```

## 11. Variation space

The agent decides the object, how many steps, which steps are told and which are skimmed, the people (or none), the page layout, the story under the procedure, and the music.

- **Structures**: a straight procedure with one mistake and its fix; a do/don't sequence of safety rules; one product's first five minutes; a manual whose last step is something no manual can show.
- **Openings**: a flat box set down; a parts list already printed, then exploded; one step number alone on the paper.
- **Endings**: the whole page; the finished object in its room; one last part turning yellow.
- **Range**: the object can be anything that assembles, operates or must be handled safely (furniture, appliances, tools, a tent, an emergency exit); pages can run in rows, a zigzag or a single column.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
