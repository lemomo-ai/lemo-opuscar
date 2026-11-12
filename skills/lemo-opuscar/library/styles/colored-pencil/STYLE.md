# Colored-Pencil Science Illustration — Style Prompt

> A real 3D cutaway world (ground, soil horizons, stones, buried structures, living things) redrawn every frame as a colored-pencil plate on toothed paper: four layers of pencil, a wobbling graphite contour, labels pencilled on cream paper tags. The camera can sink below the ground, and the drawing can be *drawn in* while you watch: horizons coloured in stroke by stroke, growing things drawn out from their base, fine lines spreading white over dark soil.
> References (grammar only): natural-history picture books and textbook cutaways (soil profiles, root systems, burrows), colored-pencil illustration on cold-press paper, the multiplane camera of hand-drawn animation. Copy none of their plates, characters, layouts or typefaces.

## 1. Essence, and what it is not

- **The whole frame is one pencil drawing.** Sky, ground, soil, what lives in it and type are all pencil on the same paper; there is no "3D scene with a drawing in it". The sky is a loose blue wash with the clouds left as paper.
- **The cutaway is the signature composition.** Above the ground line, landscape; below it, the cut face of the soil, where the hidden things live (stones, burrows, seeds, pipes).
- **It is a real 3D world.** The camera can crane, push and truck through it, and things at different depths move at different speeds (multiplane parallax: the cut face slides over the far landscape).
- **Drawing is an event.** Every surface has a moment it is drawn; after that its four pencil layers arrive one after another, stroke by stroke.
- **Restraint.** One idea per shot, one visual focus, few labels. A science plate earns its clarity by leaving things out.

Not Watercolor (no washes, blooms or wet edges: every tone is built from strokes), not Urban Sketch (no ink line plus wash; the line is graphite and coloured pencil), not Crayon Picture Book (fine, controlled hatching, not waxy scribbles), not Isometric People Scene (perspective camera, a real cut face, depth).

## 2. Materials & rendering

- **Paper**: warm off-white with a tooth (fine grain, laid fibres, soft cockling). Pencil only lands on the raised tooth, which is where the colored-pencil grain comes from. The base mottling of blank paper is fixed to the screen.
- **Four pencil layers**, in this order, over every surface:
  1. **L0, side of the lead**: a soft broad fill in the local colour, tooth-limited.
  2. **L1, local colour hatching**: patches of short parallel strokes, each patch slightly re-angled; strokes follow the object (along stems, cables, trunks and blades; around stones and leaf clumps; a fixed diagonal for soil).
  3. **L2, cool cross-hatching**: in the shadows only, a darker and cooler version of the local colour, at another angle.
  4. **L3, accents**: deepest darks in sepia or indigo, a third angle.
- **Contour**: a graphite line from breaks in object id, depth and normal; the nearer surface owns the line; distant lines fade (aerial perspective).
- **Labels**: cream paper tags with a pencilled edge; the writing is graphite, written along the glyph skeletons stroke by stroke (never wiped on). Overlay marks share the paper tooth.
- **Pipeline (reference)**: three.js renders G-buffers (albedo + id, light + depth + normal, hatch direction, anchor coordinates + reveal time) at 2× and a post shader redraws them as pencil, then a 2× box downsample. See `demo/main.js`.

## 3. Colour logic

| Role | Colour |
|---|---|
| Paper (every blank area) | `#F8F4EA` |
| Grass and foliage | `#8DAA45` / `#5E8A3A` |
| Sky pencil | `#B3D4E6` |
| Soil: litter / topsoil / subsoil / weathered | `#4D3018` / `#66402A` / `#BD763B` / `#B38C5C` |
| Main buried structure (light) | `#DCB990` |
| Fine lines, highlights (white pencil) | `#FCFAF0` |
| Contour and writing (sepia graphite) | `#33241C` |

- Warm, restrained, paper-led. Bedrock is blue-grey, never large areas of black.
- **Accents carry meaning**, at most three in a film, each always meaning the same thing (say amber for warmth, cobalt for groundwater, red for one burrowing animal).
- **White pencil over dark** is how fine lines, highlights and anything delicate read on soil.

## 4. Type & subtitles

- One OFL handwriting face with a pencil feel (the demo uses LXGW WenKai, whose Latin comes from Klee One). English leads; one short Chinese line may follow.
- Labels in capitals on paper tags, at most one per shot; the Chinese at about 1.05× the English size, slightly lighter. A short pencil leader with a pale paper halo under it so it never reads as another line of the drawing.
- Titles are written in pencil on the sky, stroke by stroke, with a hand-drawn underline.
- Subtitles (when spoken): a cream paper slip, bottom left; Chinese over English, each one line; wiped on quickly (they are read, not drawn). Keep the subject out of that corner.

## 5. Motion quality

- **Strokes stick to what they draw.** Hatching, the tooth inside the pigment and the contour wobble are computed in anchor coordinates: each surface point projected through a fixed reference camera. Inside a shot group the camera only **translates** (crane, truck, push), so the anchor is exact and nothing swims under a fixed pattern.
- **Only the contour boils**: a new drawing every 2 frames, 3 drawings cycled, about 1 px. Hatching and colour fields do not boil.
- **Things that move do so on twos** (12 drawings a second: grass in the wind); the camera moves on ones.
- **Drawn in, not faded in**: a sweep colours a horizon left to right with a ragged front; growing things (stems, vines, cables) appear from their base outward, already carrying their base colour, and finish their hatching within a few frames; tips grow pointed.
- Particles (grains carried along a structure) are small 3D objects drawn by the same pencil, never glowing dots.

## 6. Camera grammar

- **Sink**: a vertical crane from the landscape into the cut face; the soil rises over the far view.
- **The magnifier**: a pencil circle drawn around a detail; inside it, the magnified view is drawn from blank paper outward from the centre; the circle grows to fill the frame. The reverse (the circle shrinking to a point in a wider view, then erased) returns. This is how the style changes scale, and it re-anchors the strokes at the new scale.
- **Focus is how fully something is drawn.** No optical blur: the subject gets all four layers and a firm line; what is behind keeps one light wash and a faint line. A focus pull moves "fully drawn" from one thing to another.
- **Inside the magnifier, draw only what the shot is about**; illustrators leave things out.
- **Follow**: a truck alongside a moving particle, which sits left of centre with space ahead.
- The orientation stays fixed inside a shot group; to turn, change scale or cut through a magnifier.

## 7. Sound palette

- Pencil foley driven by what is being drawn: graphite writing (high, fine), waxy colour pencil hatching back and forth (lower, panned with the sweep), long soft strokes for long growing forms, a dry crackle for spreading fine lines, a light tap for a paper tag, a wooden "tock" for the magnifier.
- Ambience follows the camera: wind and distant birds above ground, closed down by a low-pass as the camera sinks, a quiet low earth tone below.
- Score in acoustic, intimate colours (nylon guitar, flute, clarinet, pizzicato bass, harp, bowed vibraphone, marimba and kalimba); leave 400 Hz–2.5 kHz light for a narrator.

## 8. Native moves

1. **The blank half**: a finished landscape whose underground is still blank paper, waiting to be drawn.
2. **The horizon sweep**: soil coloured in left to right as the camera sinks, the four layers arriving in order.
3. **Growth drawn outward** from its base, tips first.
4. **White over dark**: fine lines spreading across soil in white pencil, bridging structures.
5. **The magnifier** in and out (a pencilled circle as a transition and a change of scale).
6. **Focus by drawing**: wash ↔ fully drawn.
7. **A grain on a thread**: a coloured particle travelling along a structure, the camera following.
8. **The plate**: the final wide cutaway, everything drawn, the title pencilled in the sky.

Our demo opens on *the blank half* and the sink below the horizon, uses *the magnifier* (in, then out again) as its turn and ends on *the plate*. A new film opens and ends another way: already inside the magnifier, pulling back out to the landscape; *a grain on a thread* followed from the first frame; nested magnifiers down to a microscope inset; or an ending held close on one detail as *focus by drawing* passes to it.

## 9. Pitfalls of the medium

- Hatching fixed to the screen while things slide under it ("through glass"), or re-randomised every frame (the whole screen flickers).
- Rotating the camera inside a shot group: the anchored strokes stretch. Turn by changing scale or cutting.
- Square noise cells as soil grit; grains must be round.
- Blank paper left "waiting" for more than about a second, with no drawing front moving: it reads as a bug.
- Growing tips that start as white sticks on dark soil: grow them already coloured.
- Too many labels, rulers and arrows: the plate turns into a worksheet. One label per shot.
- 3D-render tells: translucency, glow, bloom, depth-of-field blur, drop shadows on type.
- Lines thinner than about 1.5 px in a wide shot shimmer: thicken them for wide views, keep the finest for close-ups.

## 10. Engine

- three.js (from the library's `node_modules`), one scene, a perspective camera with fixed orientation; four G-buffer passes at 2×, one pencil post pass per view, a composite pass (magnifier, overlays), a 2× downsample.
- Reveal: a per-vertex time (`arev`) or a per-material sweep; the post pass gates each of the four layers by time since reveal, with every stroke given its own turn.
- Overlays: 2D canvases for paper (tags, slips), graphite (writing, lines) and coloured pencil (dashed paths), composited with the same tooth.
- `render(t)` depends on `t` only; about 60–130 ms a frame at 1080p on Apple silicon.

## 11. Variation space

- **Subjects**: any cutaway or cross-section: soil horizons, burrows, caves and aquifers, riverbeds, seeds germinating, a stem or organ in section, pipes and foundations under a street.
- **Paper**: warm white, cream, a cool grey; tooth coarse or fine.
- **Palette**: autumn (oranges in the foliage), winter (bare branches, frozen topsoil), night (indigo sky pencil, the same paper).
- **Scale journeys**: landscape → plate → microscope inset → back, nested magnifiers.
- **Labels**: picture-book handwriting, or neat small capitals for a museum tone.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
