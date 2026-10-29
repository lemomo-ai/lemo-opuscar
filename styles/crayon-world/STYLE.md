# Crayon World 3D — Style Prompt

> A whole world built in 3D and redrawn in wax crayon, by a child's hand, twelve times a second, while a camera moves through it: real depth and parallax, a flight or a walk in first person, and every frame still a crayon drawing on the same sheet of paper.
> References (grammar only): first-person walking films and long takes (the camera is someone, their gaze is the cut); children's drawings of a village (houses with a gable front and a slanted side, lollipop trees, five-petal flowers). Copy no film's route or shots and no child's drawing, and never name them in the film.

## 1. Essence, and what it is not

- **A real 3D place, drawn.** The world is modelled in simple primitives and seen through a perspective camera; the 3D render never reaches the screen. Each frame its shapes are traced and drawn again in crayon: outlines, scribbled hatching, colour that spills past the line.
- **The paper never moves.** The sheet is the screen: tooth, emboss and vignette stay put while the world turns behind them. Depth comes from overlap, size and parallax, never from shading gradients or fog.
- **12 drawings a second.** The camera moves smoothly, but the drawing is replaced 12 times a second, so motion has the faint stepping of hand animation.
- **Hatching sticks to things.** A roof keeps its scribble as the camera passes it.
- **A camera that is someone.** First person is native: the viewer looks through someone's eyes, and where they look is the shot.

Not **Crayon Picture Book**: that style is a flat page drawn while you watch, the camera moving over the paper, a watercolour wash, narration printed as the book's words. Here the camera moves *inside* a world, the page is only the surface it is drawn on, and there is no wash. Not a toon shader or cel look (no flat fills, no smooth lines, no lighting ramps), not a low-poly render with a paper overlay.

## 2. Materials & rendering

- **Two passes per frame.** (1) An invisible half-resolution render: region id (R), light (G), depth. (2) Marching squares trace each region into smoothed rings; crayon strokes are drawn from them into Canvas2D pressure layers (RGB = colour, A = pressure), and a WebGL2 compositor lets wax stick only to the paper's tooth.
- **A region is a drawing recipe**, not a material: crayon colour, pressure, hatching angle, row gap and width, overshoot, outline width (0 = none), layer group, and whether its dark side gets a second, denser pass.
- **Outlines** follow each region's ring but are never drawn along the frame edge (that would box the picture in). One dark outline colour for everything.
- **Hatching** is a child's scribble: bowed, leaning rows, uneven spacing, a skipped row now and then, long rows broken into overlapping strokes; a lighter cross-hatch on big areas. Every row and random value is counted from an anchor projected from the object, so it is coloured the same way in every drawing.
- **Occlusion like a child.** Layer groups (background, characters, foreground) are composited in order; before each group its silhouette is knocked out of what lies behind it, so the paper stays clean behind a figure.
- **Faces and tiny things are drawn in 2D**: eyes and mouths placed by projecting points of the 3D head; anything too small to trace (a far bird) becomes a 2D doodle at its projected position.
- **A child's vocabulary**: squashed spheres for crowns and hills, boxes, a prism for a gable roof; people with big round heads and tube limbs, props bigger than real.

## 3. Colour logic

- **A box of about a dozen crayons.** One dark outline colour (indigo, plum or dark brown), never black. Value comes from pressure and a dark-side pass, not from more hues.
- The sky is a light-pressure cross-hatch so the paper shows through; the ground is lighter than the things standing on it.
- White things are not coloured: the paper is their colour, with an outline only (clouds, a white wall, a gravestone).
- One colour may belong to the story (the flowers someone planted, a red scarf) and is used nowhere else at that strength.
- Example box (a village in summer): indigo line, sky, white, grass, olive, lemon, caramel, earth, brick, rose, cream, plum.

## 4. Type & subtitles

- Words are **printed on the page**: a handwriting face in the outline colour, written in a character at a time, sitting on blank paper. Never a speech bubble, a box or a plate.
- Blank paper is made: leave part of the picture uncoloured (only a strip of sky) and put the words there, clear of what the eye follows. Thin the colour out just before the words arrive; blank paper held empty reads as a mistake.
- Bilingual: the Chinese line, then the English line a size smaller underneath, written in after it. Example faces (OFL): Long Cang for Chinese at 110–140 px, Patrick Hand for Latin at 50–64 px.
- A wordless film is native; a narrated one prints its lines the same way, at the bottom of the frame, on a paper patch the scene leaves free.
- Reading time: every block stays fully in frame ≥ max(1.8 s, CJK ÷ 4.5 + other ÷ 15 + 1.5 s) (readcheck).

## 5. Motion quality

- Drawings step at 12 per second; the film is rendered at 24 fps (each drawing held for two frames).
- No boil on still things: an object keeps its strokes from drawing to drawing while it doesn't move; it changes only because the camera or the object moves.
- Camera paths are smooth splines in time (continuous velocity), starting and ending at rest. Gaze is smoothed as a direction, with a lag, never as a look-at point.
- Living things move in a child's way: two key drawings for a repeated action (wings, steps), simple poses, held.
- Wind is the cheap way to keep a still frame alive: flowers sway from the base, washing on a line swings, clouds drift.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| First person, gaze leads | We are someone; what they look at is what matters | a memory; a visit; a stranger arriving |
| Gaze follows a moving person with a lag | Watching, not tracking | longing; shyness; a child watching a parent |
| A low skim over a surface (wheat, water, roofs) | Speed and freedom | a journey; a return home; a chase |
| Rising over a place | Leaving, or seeing it whole | a farewell; a map of a life; an ending |
| Riding something that sways (a flower, a boat, a branch) | Being small and alive in the wind | waking; waiting; a rest |
| Hard cut to another person's eyes | The other side of the same moment | a reveal of who the camera was; a reply |
| Narrow field of view, held | Staring at one thing | recognition; grief; a decision |

Framing: keep the subject of a held shot at least 1/4 of frame height; keep paper free where words will go. Transitions are cuts or camera moves; never a dissolve, never a 3D-looking whip with motion blur.

## 7. Sound palette

- Small wooden and metal-toothed instruments, no strings or grand piano: music box, nylon guitar picking, clarinet or bassoon long notes, recorder or flute as the singing voice, glockenspiel for a single sparkle. Sampled from CC0 libraries or synthesised.
- One theme can be held back and heard in full only once. Melodies end on the tonic; any coda comes after the resolution.
- Score the underlying feeling, not the surface action: a bright flight in a sad film is scored for the sadness.
- Foley follows the world, softly (water on soil, birds, wind); no crayon-scratch foley.
- Silence is a beat: one breath of nothing at the moment that matters.
- Mix to −14 LUFS; nothing harsh at the very start, when one instrument is alone (low-pass a bright music box until others join).

## 8. Native moves

- **The camera is someone, never shown.** The viewer learns who from what the world does around them. *Fits content like:* a pet coming home; a returning soldier's walk through a town; a seed carried by the wind.
- **Cut to the other's eyes.** The last shot swaps point of view and shows, small, what the first person was. *Fits content like:* a parent seeing their child leave; a lighthouse keeper seeing the boat; a teacher seeing a former pupil.
- **Passing, not pointing.** Clues are flown past at the speed of the shot, never stopped at. *Fits content like:* a house's history in its objects; a company's first office; an old route to school.
- **Blank paper for words.** Colour only part of the world and print the line where the crayon stops. *Fits content like:* a dedication; a line of a letter; the name of a place.
- **Wind.** Sway, drift and flapping keep held frames alive without a cut. *Fits content like:* a field at dawn; a waiting room by an open window; a harbour.

## 9. Pitfalls of the medium

- The camera passes inside a solid (a hill, a roof) → clamp its height above the terrain and check flight paths against every big shape.
- A pop where two camera phases meet (waking, take-off, landing) → derive each phase's position from the same rest pose; ease clearances in instead of clamping them on.
- Smoothing a look-at point near the camera whips the view → smooth the direction.
- State carried between frames breaks parallel rendering → recompute smoothed values from the shot's start each frame.
- Hatching recomputed per drawing reads as heavy boil → anchor rows to the object.
- Two-pose flapping or stepping can poke through a nearby object on the extreme pose → limit the pose while the object is close.
- Things that shrink below a few analysis pixels flicker or vanish → draw them as 2D doodles below a size threshold.
- Region ids live in one 8-bit channel → at most 255 recipes per film.
- Uncoloured outlines (clouds) left floating on blank paper look unfinished → hide them where the colour has been taken away.

## 10. Engine

In `demo/engine/`: `npr.js` (`region(o)` a drawing recipe, `mesh(geo, reg)` a 3D mesh drawn with it, `makeNPR()`, `snap(N, scene, cam)` the analysis render, `shapes(S)` the traced rings and dark-side rings per region, `silhouette(S, regs, cv)` a knock-out mask), `crayon.js` (`line`, `fill` with `hand` scribble and `anchor`, `dab`, `text`, shape helpers; from Crayon Picture Book, extended to multi-ring regions), `gl.js` (`makeComp`: `begin`, `knock`, `crayon`, `finish`; also `wash` and `wet` passes the demo doesn't use). `demo/film.js` shows the frame loop (`frame(t)`: pose, snap, shapes, draw each region by its recipe, composite by group) and the camera helpers (`cr` time-based Hermite spline, `follow` lagged direction).

A minimal example the demo never draws (a red kite over a green field, the camera tilting up to it):

```js
const field = region({ col: '#6cb24a', p: .5, ang: .1, gap: 13, w: 13, ow: 0 }), kite = region({ col: '#c8452f', p: .9, ang: .7, gap: 6, w: 8, ow: 7, grp: 'fg' });
scene.add(mesh(new THREE.BoxGeometry(200, .02, 200), field));
const k = mesh(new THREE.OctahedronGeometry(.6), kite); k.scale.set(1, 1.4, .1); scene.add(k);
// in frame(t): k.position.set(0, 6 + Math.sin(t), -12); cam.lookAt(0, lerp(1.5, 6, eio(t / 3)), -12); then snap → shapes → C.fill / C.line per region → comp
```

## 11. Variation space

You decide who the camera is (or whether it is anyone), the place, the route, the pacing, the crayon box, the words and whether there are any. All far from our demo:

- Structures: **a walk to school, every morning of one year** (the same route, the seasons changing the crayon box); **two first-person halves that meet** (one person walks in, the other walks out, the cut joins them); **a fixed window** (the camera never leaves one room; the world outside changes).
- Openings: **eyes opening** (the frame drawn in from black crayon at the edges); **a hand-drawn map that becomes the ground** as the camera tilts down into it; **riding a bicycle mid-ride**.
- Endings: **the camera lies down in the grass** and the sky takes the frame; **a door closing** on a lit room; **the route seen from above**, small, with one coloured line along it.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
