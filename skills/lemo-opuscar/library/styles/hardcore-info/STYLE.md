# Line-Art Cutaway — Style Prompt

> A real-sized object, modelled in 3D and traced live into a black-line technical drawing on warm white paper: it turns, comes apart, is cut open and is flown into, while numbered leaders, dimension lines and section hatching stay attached to its parts. One single accent colour belongs to the one path the film explains (a signal, a current, an airflow).
> References (grammar only): textbook and patent drawings (line hierarchy, hatching, leaders), engineering title blocks, Chinese knowledge-channel hardware explainers (dense, exact, fast-cut information), product manuals (the clean diagrammatic hand). Never copy their characters, layouts, typefaces or music, and never name them in the film.

## 1. Essence, and what it is not

A frame reads as this style when:

- **everything is line on paper**: warm white paper with a faint grid, black ink outlines, light grey value only to give volume. No lighting drama, no shadows, no reflections, no depth of field;
- **the lines have a hierarchy**: the silhouette is thickest, edges where one part hides another are medium, creases and small parts are thinnest and greyer;
- **one accent, one meaning**: a single saturated colour marks the path the film is about, and nothing else (no accent decoration, no accent buttons, no accent backgrounds);
- **the words are attached to the object**: every label hangs from a dot on a part, dimension lines measure the model in its own perspective, numbers come with units;
- **the object is a real, sized model**: built in millimetres from published dimensions, so any view (section, top-down, close-up) is the same model cut or seen differently.

It is not an exploded teardown (dark studio, physically based light, a photographed product), not a blueprint (white on blue, flat orthographic sheets), not an isometric infographic (flat vector shapes, no 3D camera), not a whiteboard (a hand drawing in real time).

## 2. Materials & rendering

- **Live line drawing from 3D.** Each frame renders the scene twice into float targets: a grey value pass and a normal + linear depth pass. A full-screen shader traces edges, at 2× resolution, downsampled:
  1. **silhouette** (foreground against paper): the distance to the nearest pixel of the other class, a centred line about 2.7 px wide, ink #141414;
  2. **occlusion** (large relative depth jump between parts): Laplacian of 1/z, about 1.7 px;
  3. **creases and small parts** (small depth jump or normal angle): about 1 px, a lighter graphite.
  Line widths are in screen pixels and never scale with the camera, so a far object naturally reads denser.
- **Stable lines in motion.** 8 rotated-grid sub-pixel jitters per frame, accumulated, inside a very short shutter (about 0.12 frame). This removes crawling and flicker on hundreds of small parts without visible motion blur; a long shutter would draw ghost copies of each line.
- **Values**: surfaces are light greys (#FBFBF9 to #DCDCD8), dense parts (battery, chips) a dark grey, all lit by one soft directional term only to separate planes.
- **Sections**: a clipping plane cuts the model; back faces show 45° screen-space hatching. A part made of a different material (plastic between metal) carries its own lighter hatch, so a cross-section reads as "metal | plastic | metal".
- **Diagrammatic people**: a hand or tool that is not the subject is drawn one tier lighter: nearly paper-white flat fill, thinner grey outline, few inner lines, knuckles as fine segment lines, and it fades out of frame at the wrist (alpha falls off along the screen direction away from the object).
- **World-anchored 2D**: leaders, dimension lines, signal arcs and magnifier connectors are drawn in 2D but projected from 3D anchors every frame. Only subtitles and the end card sit in screen space.

## 3. Colour logic

- Ground: warm white paper with a 40 px grid at about 4 % ink and small crosses every 200 px.
- Ink: one near-black for outlines and titles, one graphite for secondary text and inner lines.
- **One accent only**, reserved for the explained path: the traces, cable and clip that carry it, the part it ends in, the leaders and badges that point at it, the waves it sends out, and one key word in a title. If the film has two paths, they are the same path at two moments (one goes dark, the other lights), never two accents.
- Never colour the background, panels or decoration. Large flat dark areas are avoided except where a real part is dark (a battery, a chip).
- Example (our demo): paper #F6F5F0, ink #141414, graphite #5A5955, part greys #FBFBF9 / #EDEDEA / #DCDCD8 / #BCBCB8 / #4A4A49, accent #FF4D1A.

## 4. Type & subtitles

- Two families, both licence-free: a technical grotesque for names and titles (IBM Plex Sans SemiBold in our demo, uppercase names with +1.4 px tracking) and its monospaced sibling for specs, units and footnotes (IBM Plex Mono). Chinese in a matching sans (Noto Sans SC), on screen at ≥ 34 px.
- Roles: titles 54–64 px with one accent word; part names 21 px; spec lines 15 px mono; footnotes 12 px mono with wide tracking; data labels on rulers 20–26 px mono.
- **Label anatomy**: anchor dot on the part → a straight leader → the name → at most one spec line in mono (drop the spec when the label cannot stay long enough to read it). A label appears only when its part is the subject and wipes out before the camera leaves it.
- **Appearance**: text only ever writes on left to right and wipes off left to right, like a plotter. No fades, no bounces, no shadows or outlines on type.
- **Subtitles**: bottom-left, one Chinese line and one English line, on a paper-coloured plate with a thin ink rule on the left; the subject is composed above the subtitle band. Hold each cue ≥ max(1.8 s, speech + 0.6 s).
- Big statements (a question, an answer, the last line) sit in one column on the left while the object stays right, so the start and the end of a film rhyme.

## 5. Motion quality

- 24 fps on ones, everything deterministic. The camera and parts move smoothly; nothing boils.
- Explosion: layers lift one by one on the beat, fast start and a long settle with a tiny overshoot (about 2.5 %); assembly guides (dashed grey lines) grow while they lift. Closing reverses it, bottom first, each layer landing with a small click.
- The accent travels along the path at a steady speed, with a slightly lighter head, then floods the end part outward from its feed point; turning it off drains it back the same way.
- Labels and dimension lines draw in over 0.3–0.6 s; dimension lines grow from their middle, then arrowheads land, then the number.
- Never moves: the paper grid, the subtitle plate, a label column's x position.
- **Frame rate and grain**: no film grain (mux grain 0).

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Section sweep reveal | the object built from a cut | an opening; introducing a new part |
| Slow push to a detail | attention, a symptom | where something goes wrong; the one part that matters |
| Orbit under or around | the hidden side | revealing what the path ends in |
| Tip-over plus crane up while layers lift | the whole, its order | explaining an inside; a structure overview |
| Tracking the accent's head | following a process | a signal, a current, a flow |
| Dive into a gap until a material fills the frame | scale change, "inside" | a slit, a vent, a seam, a channel |
| Locked top-down with a magnifier inset | measuring, comparing | dimensions, counts, a cross-section |
| Pull back with a slow orbit | the conclusion | a last statement; an end card |

- Long takes are the default: push, orbit, tip-over and tracking are one continuous move. When a cut is needed, it happens **through a shape**: push into a part until its material fills the frame, then open a circle at the same point in the next shot; the circle can shrink into a magnifier.
- At key moments the subject fills at least a third of the frame height; the subject is composed above the subtitle band (y < 900 at 1080p).
- Cuts and transitions fall between narration sentences or on a natural pause, never in the middle of a word.
- No fades, no wipes from outside the medium, no hard cuts between unrelated angles.

## 7. Sound palette

- Score: tuned mallets and plucks — vibraphone (hard mallets for pulses, bowed for pads), glockenspiel, harp sweeps, pizzicato or jazz bass — plus a very quiet sixteenth-note "plotter tick". Clean, precise, never orchestral swells or drums.
- Foley is generated from picture events and sounds like drafting and small mechanics: a narrow noise band sweeping with the section plane, light ticks when text writes, a ratchet when a ruler extends, soft whooshes when layers lift, a metallic click plus a low knock when they seat, a rising thin tone following the accent, a short swell when it floods, a falling tone when it drains.
- Two near-silences per film (only a bowed pad or room tone) before the turn and before the solution; the first sound after each is one of the most important in the film.
- Mix: narration compressed, then about 10 dB above music + foley by RMS; music yields 300 Hz–4 kHz; foley that would sit in the speech band (high hiss, sweeps) stays under the voice and swells only between sentences. Master at −14 LUFS, true peak ≤ −1 dB.
- Voice: a calm, low documentary narrator, about 2.5 words per second, at least 0.6 s between sentences.

## 8. Native moves

- **Section sweep.** A clipping plane travels along the object, the cut face hatched, while the camera turns it in. *Fits content like:* revealing an engine block; showing the layers of a road; opening a heart valve model.
- **Lift on the beat.** Layers separate one per eighth note with growing dashed guides, labels landing as each settles. *Fits content like:* a laptop's internals; the strata of a glacier core; a building's floors.
- **The one-colour path.** A pulse at the source, the accent travels along the real route and floods its end; later it can drain and relight elsewhere. *Fits content like:* power from a socket to a motor; air through a heat pump; a nerve signal to a muscle.
- **Dive through a gap.** The camera pushes into a slit or vent until the hatched material fills the frame, then a circle opens into the next view. *Fits content like:* the grille of a speaker; a crack in a dam; the gap of a disk brake.
- **Magnifier cross-section.** A circle inset re-renders the same model from a new camera with a cut through it, linked to its spot by a dashed line. *Fits content like:* a weld seam; the layers of a solar cell; the gasket in a tap.
- **Ruler at model scale.** A measurement (a wavelength, a tolerance, a speed per second) is drawn as a ruler projected in the model's own millimetres beside the part, so the comparison is literal. *Fits content like:* a raindrop against a sensor pixel; tyre tread against a legal minimum; a cable bend radius.
- **Title block.** An engineering drawing's title block, ruled cell by cell, carries the title and credits. *Fits content like:* an end card; a chapter card; a spec summary.

Our demo opens on a *section sweep* of the closed object, uses *dive through a gap* into a *magnifier cross-section* as its turn and ends on a pull back with a slow orbit to the *title block*. A new film opens and ends another way: a macro on the one failing part, then a pull back; a *ruler at model scale* drawn first, then the object that must fit it; or an ending on a locked top-down with every measured number still on screen.

## 9. Pitfalls of the medium

- **Uniform line width** makes the drawing look like a mesh preview. Keep the three tiers, and the lighter fourth tier for hands and tools.
- **Crawling and flickering small parts.** Without sub-pixel accumulation, passives and holes shimmer. Use the jitter accumulation; with a long shutter it turns into ghost lines.
- **Coplanar touching parts draw no line** (a plastic insert flush with metal). Recess one by a fraction of a millimetre or give it its own hatch.
- **A 2D anchor on a hidden part.** A dot drawn on an occluded component floats on top of the part in front. Place the anchor on a visible face, or move the part.
- **Render targets cached at one size.** An inset that grows (a magnifier opening) must use targets keyed by size, or it is upscaled from its first, tiny size and comes out blurred.
- **Accent creep.** A second use of the accent (a title bar, a button) makes the path unreadable. Check every frame for accent outside the path.
- **Label pile-up.** Labels that outlive their part's moment crowd the frame. A label leaves before the camera does.
- **Hands that read as dolls.** Round capsules and a cylinder wrist look like toys. Taper the phalanges, mark the knuckles with fine lines, add nails, fade the wrist out.

## 10. Engine

- `demo/main.js`: model building helpers (`slab`, `rr`, `box`, `cyl`, `setS` writes the path parameter `aS`, `withR` the ring parameter `aR`), the line shader (`edgeMat`: tiers `rS`, `rO`, `rC`; thresholds `thD`, `thO`, `thN`; hand tier via the 0.5 alpha flag), `renderView(key, rect, setup, opt)` (jitter accumulation; `opt.circle` for a magnifier, `opt.handFade` for the wrist fade), `buildHand(curl, slide)`, `tag()` for world-anchored labels, `dimLine()`, `arcs()`, `hatchFill()`, `titleBlock()`, `subtitles()`.
- The accent is driven by two uniforms per path (`uPath` for the route, `uUmax` for flooding the end part) and `uTrace` for a light running around a ring.
- `demo/mix.py`: score as sampler events, foley from `events.json`, narration balance and ducking.
- Minimal example of something not in the demo: build a kettle from `cyl` and `slab`, give its heating element `setS` along its coil, animate `uPath` 0 → 1, and hang one `tag()` from the thermostat.

## 11. Variation space

The agent decides for each film: the object and its true dimensions, the path the accent follows, the story's question, the order of reveals, the camera route, which native moves to spend, narration or none, the end card.

- **Three structures:** a mystery solved backwards from a symptom; a journey along the path from source to end; a before / after where the same object is cut twice to compare.
- **Three openings:** a section sweep reveal of the closed object; a macro on the one failing part, then pull back; a ruler drawn first, then the object that must fit it.
- **Three endings:** the object closes and the accent lights its whole route once; the camera pulls back to the title block; a final top-down with every measured number still on screen.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
