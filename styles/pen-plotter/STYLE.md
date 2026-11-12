# Pen Plotter — Style Prompt

> A pen plotter on a desk draws the subject one stroke at a time: real pens, real ink on paper, real machine motion. Maps, charts and lettering appear as polylines a gantry lays down, with pen changes at a rack, pen-up travel and pen-down ink, and the camera lives on the desk with the machine.
> References (grammar only): flatbed plotters of survey and drafting offices (HP-GL era pen carousels, multi-pen drafting plots); hand-drafted topographic maps (contours, hachures, single-line lettering, index contours traced heavier); generative plotter art (hatching as tone, line as the only mark). Copy none of their sheets, typefaces, logos or machines; never name them in the film.

## 1. Essence, and what it is not

- **Every mark is a stroke.** Nothing appears that a pen could not have drawn: no fills, no gradients, no type set as a font. Tone is hatching; weight is a wider nib or the same stroke traced twice; letters are single-line strokes or traced outlines.
- **The machine is in the shot.** Gantry, carriage, pen holder and pen rack are physical objects with weight; the pen is where the line ends.
- **Machine time is honest.** Pens move at plotter speed with acceleration and braking, drop and lift, and go to the rack to change. Time is saved by editing and by the camera, never by a pen that flies.
- **Information design made by hand.** The sheet is a real document (a map, a chart, a comparison, a number), drawn in plotting order, so the order of drawing is the order of the argument.
- **Few inks, each with a job**, on cream paper under one warm lamp.

Not Blueprint (no white-on-blue, no CAD chrome), not Data Storytelling (no screen-space charts that grow by tweening), not Whiteboard Explainer or One-line Drawing (no hand, no marker; the line is mechanical, not gestural), not Engineering Briefing Board (the sheet is being made, not presented).

## 2. Materials & rendering

- **Strokes are data.** Every mark is a polyline in sheet millimetres, in plotting order, tagged with its pen. A program turns the list into machine time: pen-up travel, drop, ink, lift, pen changes. One function gives the pen's position and how much ink is down at any machine time.
- **Kinematics**: trapezoidal velocity per move. Reference values: pen-down ≈ 60–125 mm/s, pen-up ≈ 200–300 mm/s, acceleration ≈ 1000–2500 mm/s²; drop and lift ≈ 0.07–0.1 s; a pen change ≈ 2–4 s (travel to the rack, lower, release, move one stall, lower, grip, raise).
- **Paper**: a canvas texture of the whole sheet (≈ 10 px/mm) plus high-resolution patches (20–40 px/mm) only where the camera is close; ink drawn with multiply blending, round caps; a slightly wetter dot where a pen lands; paper grain and a few fibres as a bump map. Going back in time redraws from scratch; going forward draws incrementally; the stroke under the pen is drawn partially.
- **Ink**: semi-opaque, never pure black; light inks (grey) at 0.6–0.75 opacity; strokes traced twice read darker, as on paper.
- **Machine**: rails, a moving beam, carriage, Z holder with a gripper, drag chain, a rack of capped stalls; metals with roughness 0.15–0.35, matte plastics, clearcoat pen barrels colour-coded to their ink. Cast shadows from one lamp are part of the look.
- **Lettering**: a single-line font (one stroke per subpath) for Latin and figures; CJK as the outline of a hairline-weight font drawn with a pen wider than the stroke, so it reads as single-line; display titles as outlines filled with fine hatching.
- **Screen space only for the end card**; everything else is on the sheet or in the room.
- **Post** (reference): supersampling, depth of field from a physical aperture, light ambient occlusion, a warm vignette, a little bloom on metal.

## 3. Colour logic

- Neutral ground: cream paper (≈ #F1ECDF) under a warm lamp; the room falls to near-black with one cool counter-light (a window).
- One ink per job, three to four inks at most: a dark ink for the frame and text, a terrain or data ink, a light ink for tone and grids, and **one accent reserved for the finding** (the path, the answer, the circle around the result).
- The accent appears late and on purpose; it never fills an area except by hatching.
- Pen barrels carry their ink colour, so a pen change reads at a glance.

Example (our demo): black #16161C, sepia #763C1A, grey #686662 (70 %), red #CC221A.

## 4. Type & subtitles

- **Roles**: single-line sans for figures and Latin labels (2.5–10 mm on the sheet; 40–50 mm for a hero number); hairline CJK labels 3–5 mm; a hatched serif for the sheet title. All OFL, subset to the characters used; letters are baked into stroke data, the page loads no font.
- **Labels live on the sheet**: next to what they name, one language per line (Chinese line, then English line, then the value), never in screen space.
- **Weight by retracing**: titles and key values drawn two or three times with a 0.2–0.3 mm offset.
- **Legibility**: anything to be read must reach ≥ 30 px cap height at 1080p when the camera holds on it; small legend text may stay unread.
- Hold readable text ≥ CJK characters ÷ 4.5 + other characters ÷ 15 + 1.5 s, measured from when its last stroke is drawn.

## 5. Motion quality

- 30 fps, no stepping; the pen eases into and out of every move; the carriage never teleports inside a shot.
- **Jump-cut time-lapse**: inside a stretch the pen moves at real speed; between stretches machine time jumps forward, on the beat. The camera keeps moving through the jumps; only the machine jumps. Space the jumps closer as the work grows.
- Lines appear only under the nib; labels appear stroke by stroke; nothing fades in.
- What never moves: the sheet (taped down), the rack, the room.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Macro on the nib, paper fibre in focus | the act of drawing; precision | a first line; a last stroke; a value being written |
| Overhead pull-back during jump-cut time-lapse | a whole emerging from strokes | a map filling in; a chart building; a pattern spreading |
| Low angle across the paper | the sheet as landscape | relief; depth; a reveal of scale |
| Long lens following the pen | travel, a path, sequence | a route; a timeline; a process step by step |
| Locked three-quarter on a panel, slight creep | reading, judging | a comparison; a verdict; a legend |
| Insert at the pen rack | a change of subject or voice | a new layer; a new data series; the answer's colour |
| Pull-back from the sheet to the desk and room | context, the work done | an ending; a reveal of the whole document |

Keep the carriage from covering what must be read: frame from the side the beam is not on, or wait until the pen has left. Cuts happen on beats or on a pen drop. No crossfades, no page turns, no screen-space titles.

## 7. Sound palette

- **The machine is the rhythm**: stepper whine whose pitch follows pen speed, pen-on-paper scratch while the pen is down, the tick of a drop, a servo buzz on lifts, the solenoid clack of the gripper at the rack, a drag chain's rattle.
- **One instrument per pen** (an option worth keeping): tuned percussion for the first ink (marimba), bowed and struck metal for tone (vibraphone, strings), bells and harp for the accent (glockenspiel), plucked strings for the text pen.
- **Jumps** can carry a soft woodblock on the beat.
- **Room**: mains hum, the night outside, almost nothing else. Silence before a verdict: music out, the room and an off-screen pen change stay.
- **Mix**: music under the machine (the machine is the subject). Reference: about −16 LUFS integrated before mastering, true peak ≤ −3 dBFS, little below 60 Hz.

## 8. Native moves

- **Contours growing outward.** Plot terrain levels from the top down, each level nearest-neighbour ordered, with a jump per beat; the shape grows from the centre. *Fits content like:* a city's growth rings; a heat map spreading from a source; a population density surface.
- **The sheet stands up.** In a low shot, lift the drawn lines to their true value (height, time, quantity) and let them settle back; the ink stays on the paper. *Fits content like:* a surface chart of rainfall; a sound spectrogram; a stock price landscape.
- **Hatching as tone.** A light pen hatches only where a value crosses a threshold (shade, risk, loss), two angles for darker. *Fits content like:* flood-risk zones; areas lost to fire; the shadow side of any terrain.
- **The path in the accent ink.** A long-lens follow of one line across a quiet base map, a mark at each stop. *Fits content like:* a migration route; a delivery round; a river's course.
- **The enlarged scale.** A callout from a point on a chart to a zoomed axis where values that differ by 0.1 % can be told apart. *Fits content like:* successive measurements of a constant; three bids within a cent; record times.
- **The pen change as punctuation.** The answer arrives in a new colour after an on-screen or off-screen trip to the rack. *Fits content like:* the verdict after evidence; the corrected figure after the old one; today's value after history.
- **The hero number in single line**, each stroke traced twice. *Fits content like:* a total; a date; a record.

Our demo opens on a pen chosen from the rack in macro, builds on *contours growing outward* and *the sheet stands up*, uses *the pen change as punctuation* as its turn and ends on *the hero number in single line* and a pull-back to the whole desk. A new film opens and ends another way: the finished sheet seen wide, then rewound to the first line; a blank sheet and the first pen drop, seen low; an ending on the sheet lifted from the bed to show the next blank one; or the lamp switched off over a parked pen.

## 9. Pitfalls of the medium

- **Flying pens.** Speeding the plot to fit the film reads as animation. Keep real speed and jump between stretches; a full sheet can take an hour of machine time.
- **The carriage hides the work.** It sits above the line being drawn; frame from the open side, hold until it leaves, or show the result from a different shot.
- **Beam shadows.** One lamp casts the beam's shadow as a hard bar; place the lamp on the camera's side of the beam for reading shots.
- **Thin lines vanish in wide shots** (mipmapping). Use darker inks, retrace key lines, keep wide shots for shapes, close shots for text.
- **Fat lines in 3D.** World-unit line widths grow huge near the lens; use screen-space widths for lifted strokes.
- **Fonts that are fills.** Outline fonts drawn as outlines look like stencils; use single-line fonts, or hairline weights narrower than the pen.
- **Made-up data on a "real" map.** If a sheet looks like a survey, its data must be real (DEM, published figures) and its sources in FACTS/SOURCES; mark approximations on the sheet.
- **Partial redraw cost.** Big canvases must be drawn incrementally and reset only when time runs backward.

## 10. Engine

- `demo/plot.js`: `buildProgram(data)` (stroke list → machine ops with kinematics, pen changes, marks), `plotState(G, P)` (pen position, holder height, gripper, strokes done at machine time P), `drawStroke()` (ink on a canvas window, partial strokes), `RACK()`.
- `demo/main.js`: `WARP` (film time → machine time stretches with jumps), `makeSheet()` (paper canvas + patches, incremental redraw), the gantry/holder/gripper/rack rig, the lifted-line layer (`LineSegments2`), camera per shot, `window.TEXTS` from text blocks, the end card plotted in screen space.
- `demo/tools/textlib.py`: single-line SVG font paths, hairline CJK outlines, hatched titles, `layout()` → strokes. `make_plot.py`: marching-squares contours, hillshade hatching, route and profile, every label, the plotting order → `plot.json`. `fetch_dem.py`, `crop_dem.py`, `route.py`: NASADEM download, crop, least-cost route.
- Minimal example: a list of polylines for a bar chart → `buildProgram({strokes})` → render the sheet at `plotState(G, t)`; the machine and timing come for free.

## 11. Variation space

The agent decides the document (map, chart, diagram, lettering), the inks and their jobs, which stretches run at real speed and which jump, the camera route, where the accent ink arrives, and the room.

- **Structures**: one sheet drawn layer by layer, each layer a pen; two sheets drawn side by side and compared; a single long line followed end to end, then revealed whole.
- **Openings**: a blank sheet and the first pen drop; the finished sheet seen wide, then rewound to the first line; a pen chosen from the rack in macro.
- **Endings**: the hero number written last; the pen parked and the lamp switched off; the sheet lifted from the bed to show the next blank one beneath.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
