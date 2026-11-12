# Assembly-Line Diagram — Style Prompt

> A process explained as a factory cut open in elevation: a silhouette (a body, a machine, a building, a city) is sliced like a doll's house into rooms on floors, each room a work station with a machine, a numbered plaque and tiny workers; coloured pipes carry the goods between them, and the colour of a pipe is the legend. The camera rides one piece of cargo through the whole line, and every station starts working the moment it arrives.
> References (grammar only): Fritz Kahn, *Der Mensch als Industriepalast* (1926: the body as a cut-away factory, rooms with coloured frames on a dark ground, numbered stations, pipes with highlights, workers in white coats); Nigel Holmes's explanation graphics for TIME (thick black outlines, flat colour, a flat offset shadow, the joke said straight, short bold labels with right-angle leaders). Copy neither: no traced plates, no aged paper, no period lettering.

## 1. Essence, and what it is not

- **One line, one direction.** The subject is a process that turns one thing into another in steps. The film is a single continuous production line the cargo travels; every shot is a station on it, in order.
- **Metaphor per station, said straight.** Each step is one machine everyone can read (a press, a sieve, a weighing scale, a crane, a loading dock, a paint booth). The plaque gives both names: the machine's in English, the real thing's in Chinese (`SIEVE | 沉砂池`). The humour comes from the metaphor being literal, never from cartoon faces.
- **Colour is the legend.** Each kind of output gets one spot colour; its pipe, its parts and its legend tag carry that colour for the rest of the film, so the viewer follows a colour instead of reading a label twice.
- **The cut-away is the frame.** Rooms sit inside a silhouette on a dark ground; the gap of dark between the rooms and the outer wall is what makes the silhouette read (a person, a machine) at every scale.
- **Workers are scale and action.** Tiny, faceless figures, each doing one legible thing (turning a valve, holding a sign, pushing a cart, dozing). They give the factory its size and the beats their comedy.

Not Isometric Infographic (no isometric or perspective view: everything is a flat front elevation), not Whiteboard Explainer (no hand, no drawing-on), not Exploded Teardown (no 3D parts flying apart), not Blueprint (full colour on paper, not white lines on blue), not a keynote (no slides, no centred title pages, no page headers).

## 2. Materials & rendering

- **All vector, drawn in code**: SVG built per frame from shapes and paths. Clean ink outlines with round caps and joins, flat fills, no gradients.
- **Print, lightly.** Every colour plate is shifted by its own 1–1.6 px misregistration, the same direction across the frame (ink, paper and walls stay put), and a faint paper grain and fibre sit on top (multiply). Nothing more: no aging, no torn edges, no yellow stains, no mottled ink.
- **Flat shadows.** A Holmes shadow is the same shape offset down-right in one pale flat colour (plaques 5–6 px, large shapes 14–18 px). No soft shadows, no blur except motion blur on whip moves.
- **The cut-away.** The silhouette is a dark ground with a thick body wall (a band about 56 px thick with ink on both sides); where goods enter (an intake, a hatch, a door) the wall breaks and both ends get an ink cap. Rooms have a coloured frame, a pale wall and a floor strip; floors between rooms are slabs with rivets; steel trestles and gantries hold the machines.
- **Pipes**: ink edge (width + 6 px), colour, then a highlight stripe (0.2 × width, offset up-left, masked inside the pipe); rounded elbows; flanges every so often. Width encodes importance (main duct, arteries, branches).
- **One printed sheet at every distance.** Line weight follows the camera (thinner when pulling back, roughly `z^-0.6`; only slightly heavier when pushing in), and below a set scale small workers, plaques and small text are not drawn while the big machines stay. The drawing never turns into a hairline mess or a blob of text.

## 3. Colour logic

- **Paper + ink + one ground + four spot colours.** Paper outside the silhouette; one dark ground inside the cut; pale walls for rooms; a body colour for walls and slabs; then three or four spot colours that are the legend. No other hues.
- **Spot colours have one meaning each for the whole film** (in a recycling plant, say: ochre = paper, vermilion = plastic, teal = glass). Room frames may rotate through the spot colours by station; the cargo's own colours stay fixed.
- **Ground dark enough to frame, never black**: a deep indigo or wine reads as "inside" and lets the spot colours sit on it. Check that every spot colour separates from the ground (cobalt on indigo does not).
- Numbered station circles are one colour (ochre fill, ink edge); a circle is an outline until its station is reached, then fills.
- Example (our demo, palette A "Night Shift"): paper #F2ECE0, ink #1D2030, ground #24345A, wall #FBF7EE, body #EE9F87, vermilion #E04A2F, ochre #F3B23A, teal #2E8D87. Two alternatives live in `demo/lib.js` (`PALS.B`: a daylight chart with a pale body-colour ground; `PALS.C`: a wine-red ground).

## 4. Type & subtitles

- **Three faces, three jobs** (all OFL): a condensed industrial display face for plaques, legend tags and the title (Big Shoulders Display 800–900, like letters painted on a factory wall); a grotesque for small labels, subtitles and credits (Archivo 600–800); a CJK sans for the one short Chinese line on each sign (Noto Sans SC 700, at least 34 px).
- **Plaques**: cream board, 2.6 px ink frame, 3 px corners, flat shadow; `[number circle] [ENGLISH METAPHOR | 中文名]`, stuck on the room's top edge or on the machine, never on a leader line.
- **Legend tags** hang above their line: a colour chip, then the English and Chinese name (`GLASS 玻璃`).
- **Leaders** (Holmes): dot → vertical → right angle → bold words, only for a moving hero, at most one per frame.
- **At most about seven pieces of text in a frame**, two to four words each.
- **The title is an object in the picture** (a gantry sign over the infeed, a machine's nameplate) hung on the thing it names, never in a page margin, never centred, never a header. The end card is the same object: a nameplate standing on the ground line.
- **Subtitles are work tickets**: a cream ticket with an ink frame, a stub on its left showing the current station number (a clock when there is none), Chinese 34 px over English 28–30 px, one line each, bottom left; move them bottom right in shots where the title or the end card holds the left. Compose every shot with that corner free.

## 5. Motion quality

- **The belt never stops moving**; cargo travels at constant speed and eases into stations.
- **A station starts on arrival.** Its machine starts on the beat the cargo lands (rollers turn, sprays fall, a press stamps), its worker does a two-frame action, its number circle fills and pops (scale 0.9 → 1 with overshoot).
- **Signs drop on chains** and bounce once; a second-language sign swings in half a beat later.
- **Repetition is the joke.** A gatekeeper raises STOP, lets one portion through, raises STOP again; machines repeat their cycle on the music's grid.
- **Time compresses on clocks and dials**: hands spin, lamps dim, workers doze; never a title card saying "later".
- **Big figures move by procedure, grounded**: a running figure plants its support foot on the ground line and moves with the ground, knees solved from two bones and always bending forward; nothing slides, floats or crosses scissor-wise on a held frame.
- **Frame rate and grain**: 24 fps.

## 6. Camera grammar

Always a flat front elevation: the camera pans, tilts, pushes and pulls in the plane of the drawing, never rotates into perspective.

| Move | What it expresses | Can serve |
|---|---|---|
| Truck with the cargo | the flow, one piece followed | an opening; moving between stations on one floor |
| Push through a door shape | entering the system | the intake; going inside a part |
| Tilt down a chute, slabs wiping past | going down a level | the next stage below |
| Pull back from a part to the whole floor | the parts working together | a sorting or splitting station; a held comparison |
| Follow one colour | one output's path | where one product goes while the others leave frame |
| Porthole POV (circular mask) | the outside world reaching in | a trigger, an alarm, a customer, an event |
| Whip down a pipe | urgency | a demand that must be met now |
| The great pull-back | the whole line at once | the ending: the full silhouette with every station lit |

Transitions happen inside the drawing: passing through a shape, floor slabs wiping the frame, a match cut on the same piece of cargo, a colour follow, a circular porthole mask, a whip along a pipe (directional motion blur from the camera's speed plus speed lines, rendered once, never stacked ghosts). No page turns, no fades to paper, no white flashes.

## 7. Sound palette

- **Score as a production line**: a march on a fixed figure (around 120 BPM) that the stations add to; each line or machine brings in its own voice (bassoon, clarinet, flute…); woodblock and bass drum on presses and stamps; glockenspiel or celesta when a station lights up.
- **The stop is a sound**: when a gate closes or an alarm goes, the whole band stops dead and restarts on the next release.
- **Foley from machines** on every visible action: hoppers, chains, sign bounce, roller shutters, presses, sprays, drums, whistles, ladles, clocks, alarm bells, ignition, doors. Procedural, short, on the frame.
- **Voice** (optional): a calm explainer, one idea per line, saying what the picture cannot (the reversal, what a part becomes, why it waits); leave arrivals, the big lighting-up and the end card without words. Compress it and set it about 9–10 dB over the music, carve the music's 300 Hz–4 kHz band under it, let the music rise between lines.
- **Mix**: −14 LUFS, true peak ≤ −1 dB; limit the transients of presses and ignitions.

## 8. Native moves

- **Station starts.** Cargo lands, the machine starts, the worker acts, the number fills. *Fits content like:* each step of a manufacturing process; each stage of a data pipeline; each department a request passes through.
- **Taking it apart into colours.** One lump enters a sorting floor and leaves as three streams of differently coloured parts, each into its own pipe, with legend tags dropping over them. *Fits content like:* a mail sack into postcodes; crude oil into fractions; revenue into costs; ore into metals.
- **Gatekeeper.** A worker with a STOP sign lets one portion through at a time. *Fits content like:* a valve, a rate limit, a queue, a customs desk, a dam.
- **Warehouse and clock.** Goods are shelved; the clock spins; the lights dim; workers doze until an alarm. *Fits content like:* energy storage, inventory, a battery, savings.
- **Porthole alarm.** A circular POV on the outside world shows the event that sets the line running. *Fits content like:* demand arriving, an order, a sensor trigger.
- **Follow the colour.** The camera picks one pipe by colour and rides it to its destination while the others turn away. *Fits content like:* where one product goes; one signal's route; one customer's journey.
- **Light the whole line.** The great pull-back to the full silhouette; a glow runs from intake to output and the numbers pop in order. *Fits content like:* the summary of any process; a product's whole life; an ending.

Our demo opens on an ordinary factory with the title sign dropping over the infeed, uses *taking it apart into colours* (entered on a match cut) as its turn and ends on *light the whole line*. A new film opens and ends another way: the outside event seen through the porthole first, a truck with one cargo already riding the belt, an ending that follows one colour to its output in the outside world, or the factory going dark station by station.

## 9. Pitfalls of the medium

- **Process diagram, not a story.** A station-by-station walk is a flowchart. Give it a hook (a reversal, a deadline, a question) and a payoff picture; let each station say one thing.
- **Text creep.** Plaques, tags, leaders and subtitles add up fast; keep to about seven pieces per frame and let colours carry meaning.
- **Hairlines and blobs at distance.** Without camera-dependent line weight and level of detail, the pull-back turns into a grey mesh of strokes and unreadable labels.
- **The silhouette disappears** when rooms fill the cut edge to edge: keep at least 30 px of dark ground between rooms and the outer wall.
- **Spot colours that vanish on the ground.** Test each against the dark ground and against the walls before committing.
- **Bodies that look like barrels.** When a figure has to hold a lot of rooms, its torso grows and its head shrinks; cross-fade to a schematic figure with human proportions for the full-body shot rather than inflating the cut-away.
- **Feet.** Procedural legs that swing on sine curves float, sink and slide; solve them against the ground line, and hold the final frame on a readable phase (one leg reaching, not crossed).
- **Metaphors that lie.** Every simplification the metaphor makes (one input → one output, a valve where there is really a gradient) goes into FACTS.md; the voice should not claim what the drawing only implies.
- **Leaders everywhere.** One leader per frame at most; everything else is a plaque on its object.

## 10. Engine

- `demo/lib.js`: palettes (`PALS`, `C`), misregistration per plate, `shape`, `txt` (with the far-camera cut-off), `pipe` (ink, colour, masked highlight, rounded polyline), `flange`, `num` (station circle), `plaque` (`[n] ENGLISH | 中文`), `tag` (legend chip), `callout` (Holmes leader), `worker` (faceless figure: arm angles, cap or coat, sit, walk, prop callback), `gear`, `gauge`, `lamp`, `slab`, `room`, `belt`, `trestle`, `sandwich` (the demo's cargo); easing and key interpolation (`steps`, `monotone`). `KS` scales ink width with the camera, `ZL` is the camera scale that hides small things.
- `demo/body.js`: the demo's cut-away world (its body wall, rooms per floor, pipes, sorting floor, warehouse, furnace room, limbs; your film builds its own silhouette and stations), `numOn` / `plaqueN` for stations that light up, `detail(lo, hi, fn)` to fade a group in by camera scale, `inView` culling.
- `demo/runner.js`: the demo's schematic running figure for its pull-back (two-bone IK legs, ground-locked support foot, arm swing, miniature stations inside).
- `demo/overlays.js`: screen-space layers (work-ticket subtitles, porthole POV, the light-up of the whole line, end nameplate, speed lines). `demo/film.js`: the camera path (`camera(t)`), one frame (`frame(t)`), paper grain, `window.render`, `window.TEXTS`.
- Minimal example of something new, a station of your own inside `drawBody` (world coordinates):
  ```js
  room(2400, 3000, 620, 360, C.teal);                                // a new room
  plaque(2420, 2970, 'FILTER', '过滤器', { n: 7 });                    // its plaque
  pipe([[2300, 3200], [2400, 3200], [2400, 3300]], 26, C.sun, C.sunL); // goods in
  worker(2600, 3340, { s: 1.3, front: [150, -20], cap: C.red });      // someone at work
  ```

## 11. Variation space

The agent decides the silhouette (a person, an animal, a phone, a car, a city block, a ship), the process and its stations, the metaphors, the cargo, the outputs and their colours, the palette within the paper + ground + spot rule, whether there is a voice, and the music.

- **Structures**: a reversal hook, then the line in order, then the payoff; one cargo followed from intake to output; two cargoes racing through the same factory; the same factory at two times of day.
- **Openings**: an ordinary factory doing the opposite; the cargo arriving on a belt under the title sign; the outside event seen through the porthole first.
- **Endings**: the great pull-back with the line lit; the output delivered into the outside world; the factory going dark station by station.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
