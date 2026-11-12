# Bauhaus Shapes — Style Prompt

> An explainer told only with circles, squares, triangles, arcs and straight lines, set in opaque colour on a light, matte paper. Every shape is a quantity drawn to scale (area is the amount), the shapes are the characters, and type only names them. A thin construction grid lays out each scene before anything lands, and folds away when it is done.
> References (grammar only): the Bauhaus preliminary course (Itten, Albers, Kandinsky's point–line–plane), Bayer's and Moholy-Nagy's typography, Swiss and mid-century information graphics. Copy no poster, logo or typeface of the period; the look is today's: a light ground and a modern palette, never the aged-paper red–yellow–blue–black.

## 1. Essence, and what it is not

- **Shapes are amounts.** A disc that doubles doubles its *area* (radius × √2); a weight three times heavier is a square of three times the area; a share of a whole is a ring of that share of the area. If the numbers would make a shape unreadably small, change the framing, never the proportions.
- **Shapes have roles.** Circle = what grows or moves; square = what stays or weighs; triangle = slope, time, pivot. One shape keeps one meaning through a film.
- **Point → line → plane.** The protagonist starts as a dot, draws a line by moving (its path stays on screen), and becomes a plane (a field, a disc that runs out of frame). Use this progression as the spine of an explanation.
- **The grid is visible.** Construction lines draw first, shapes and letters land on them, then the lines retract. The grid does more each time it returns: a layout, a ruler, a tangent, a scale on a slope, the baseline of a formula.
- **Few words, large.** One key number, one short English line, at most one short Chinese line per scene.

Not Swiss Motion Graphics (there type is the material; here type is a label and the shapes carry the meaning), not Mid-century Cartoon (no characters, no faces), not Data Storytelling (no axes, ticks and legends as chrome: a ruler appears only when it measures something), not a slide deck (no headers, no centred stacks, no page turns).

## 2. Materials & rendering

- **Canvas 2D, flat fills, hard edges.** No gradients, shadows, glows, transparency between shapes, outlines on filled shapes or rounded rectangles.
- **Opaque ink on matte card.** One full-frame finish pass: fine paper tooth and fibre (about ±7 levels, a touch more in dark inks) and a very slow, barely visible ink-density drift inside colour fields. Edges stay sharp; no misregistration, no ageing, no halftone. The finish is static (it is the paper), the shapes move over it.
- **Lines**: one weight for paths (5 px), one for construction and leaders (2–3 px), butt caps. Lines only draw a path, a tangent, a leader or the grid; never a decorative frame.
- **Compass marks**: a small cross at the centre a circle was drawn from may stay visible; it is the Vorkurs construction layer, not decoration.
- **Cropping is tension**: big discs and slopes run out of frame. Anything being compared is fully in frame.

## 3. Colour logic

Six colours per palette, assigned by role, never by hue:

| Role | Use |
|---|---|
| paper | the ground, at least 40% of the frame; also type reversed on fields |
| protagonist | the dot, the smallest amount, the thing the story follows |
| field | the one large area (a slope, a total, a heavy block); at most one per frame |
| pivot | bases, pivots, middle amounts, the square that holds the title |
| secondary | swept areas, outer rings, a pale band |
| ink | type, paths and thin bars only; never a large area |

- No pure black, no dark ground. Ink is a deep blue-black used only for line and type.
- Reversed type on a field uses the paper colour, so protagonist and field must be dark enough to carry it.
- A palette swap changes nothing but these six values.
- Example palettes (our demo): **Klein** paper #F8F7F3, protagonist #0E9F7A, field #2138C8, pivot #F4E04D, secondary #D5DCEE, ink #161C3A; **Sorbet** paper #F5E8E1, protagonist #E9476B, field #3552E8, pivot #F6B12F, secondary #94D3BF, ink #1F3340.

## 4. Type & subtitles

- **Latin and numbers**: a geometric sans (e.g. Jost, OFL, variable). Key word or number 800 with tight tracking (−2 to −6); the light companion line 300 with wide tracking (+12 to +18); reading lines 500; small labels 600–700 caps with +3 to +6 tracking.
- **Chinese**: a sans (e.g. Noto Sans SC, OFL, subset to the characters used), 700, tracking +2 to +4, **≥ 34 px on screen** (after camera scale). One Chinese line per scene at most.
- **Type joins the shapes**: a letter can be a shape (the O of a word is the protagonist dot); a number sits on the line it measures or in the field it names.
- **How type arrives**: letters rise out of a slot on their baseline, one block at a time; labels slide out from under an edge (clipped by it); reading lines reveal left to right. Never fades, never typewriter.
- **Hierarchy**: the number is largest; its caption is small caps under it; the Chinese line sits under both.
- **Subtitles**: a paper-coloured block fixed to the screen's bottom-right corner, a protagonist-colour bar on its left edge, Chinese (sans 700, 36 px) over English (sans 500, 30 px), one line each. The block never moves with the camera; compose every scene so this corner stays free.
- **Holds**: a comparison is whole in frame and still for ≥ 2.5 s before it is read out; labels ≥ characters ÷ 4.5 + 1.5 s.

## 5. Motion quality

- **Roll**: pure rolling, angular speed = distance ÷ radius, so the path is a true cycloid. A growing ball's phase is integrated along the path.
- **Grow**: at each step a ring lands on the outside ("thunk"), newest outermost, all rings tangent at the protagonist's core.
- **Land**: squares slide along the grid and lock with a small overshoot; slopes swing up about one corner; dots drop and squash once.
- **Sweep**: a turning thing leaves a secondary-colour wedge; the same angle sweeps more area at a larger radius.
- **Cut**: a shape is circled with a compass stroke, then lifted out, leaving a paper hole; tangents connect the hole to the piece.
- **Retract**: construction lines shrink from one end to the other; nothing fades out.
- Easing is firm (cubic in-out, out-back for landings). Big things move slowly, small things snap.
- **Frame rate and grain**: 30 fps; mux grain 1, a light film grain.

## 6. Camera grammar

- Build on a locked frame; push in slowly once a composition is complete.
- Move the whole group, not the camera, when the meaning changes: a slope swings flat about its corner and becomes a ruler.
- **Through a shape**: push into a colour band until it fills the frame, cut, pull out of the same colour in the next scene.
- **Whip**: a fast lateral move to a scene beside this one, long construction lines passing to carry the speed.
- **Grid match cut**: the pieces of a scene fall out of frame, its construction lines stay and re-form as the next scene's grid.
- Every scene uses a different entry; a whole film never sits on one fixed frame.

## 7. Sound palette

- Score: light tuned percussion and plucked strings (marimba, vibraphone, kalimba, harp, pizzicato) on a steady grid; chords land with each completed shape.
- Effects follow the geometry: a ruling-pen hiss for each grid line, wooden clacks for squares locking, low thuds for slopes and drops (lower as a ball gets bigger), a kalimba note per ring climbing the scale, a whoosh for whips and swings.
- With a voice: compress it, sit the bed about 10 dB under it by RMS, dip the music in 300 Hz–4 kHz while a line plays.

## 8. Pitfalls

- A dark ground or large dark areas: the style turns heavy; ink is for line and type only.
- More than one field per frame, more than six colours, any gradient or drop shadow.
- Proportions bent for looks: the areas must match the numbers, or the film says something false.
- Text crossing construction lines or tangents: move the label, or end the line where the label begins.
- Labels and the subtitle block in the same corner; anything sliding with the camera that should be fixed to the screen.
- Concrete objects (parts, screens, faces): the style explains relations; detail turns to mush.
- Two paths drawn over each other: when an old path stays as reference, set it in the secondary colour.

## 9. Native moves

1. **The snowball**: a protagonist dot rolls up a field-colour slope, gains a ring at each step of growth, draws its arcs, and ends as a disc that breaks the frame.
2. **The ruler**: the slope swings flat; ticks rise from it, each to the height the growing thing had reached, so the grid draws the curve.
3. **Cut and tangent**: a compass circles part of a shape, it slides out leaving a hole, two tangents tie the hole to the piece, an equals sign drops between them.
4. **The ghost**: a finished shape drains to its outline; a second run grows inside it, and the outline is the comparison.
5. **The grid sets the type**: lines left by the last scene become baselines and cap lines; numbers rise into them; operators are built from shapes (+ is two crossed bars, = is two bars, a point is a ball).
6. **Swept area**: a lever or a hand turns and leaves a wedge.

Our demo opens on *the snowball* with the title built on the grid, turns on *the ruler* and *cut and tangent*, and ends on *the grid sets the type*. A new film opens and ends another way: a *swept area* as the first move, an entry through a shape or on a *whip*, *the ghost* as the closing comparison, or an ending on a plane that runs out of frame.

## 10. Range

- Topics: mechanisms that reduce to geometry (levers, gears, pulleys, supply and demand, orbits), shares and growth, titles and chapter cards.
- Palettes: any six-colour set that keeps the roles and a light ground.
- Length: from a 10-second title to a 50-second explainer; a voice is optional, the shapes must read without it.
- Still layouts work as well (title, mechanism, data): `demo/index.html?frame=1|2|3`.

Our demo, its story and build: [DEMO.md](DEMO.md)
