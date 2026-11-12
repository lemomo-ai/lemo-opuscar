# Security X-ray — Style Prompt

> The film is seen through a baggage-screening console: objects are never shown, only their dual-energy X-ray image, where every material has its colour (organic orange, mixed green, metal blue, impenetrable black) and every outline comes from thickness, not from a drawing. The operator exists only as actions on the screen: a box dragged around an object, a zoom, a measurement, a material filter, a verdict.
> References (grammar only): real checkpoint and cargo screening imagery (the colour convention, the scrolling line-scan, the operator's function keys); CT baggage scanners (rotatable 3D volumes in the same colours); medical radiography (thickness as light). Copy no manufacturer's interface, logo, layout or typeface, and never name one.

## 1. Essence, and what it is not

- **Transmission, not rendering.** Every pixel is the path length of the X-ray through matter, split by material class. Overlaps change the colour (a cable over clothes turns green), walls glow at their edges, solid metal goes dark.
- **The colour code is the language.** Orange = organic (Zeff < 10), green = mixed or light inorganic (Zeff 10–18), blue = metal (Zeff > 18), black = nothing got through. The legend sits on screen; the audience learns it within seconds.
- **A machine with a person behind it.** The console chrome (lane, belt speed, clock, bag counter, material legend, function keys, status) is always readable; decisions arrive as operator actions on the screen. If there is a voice, it is that operator in the first person: few words, flat, saying only what the screen cannot (a conclusion, a dry aside), never reading out the rule or the numbers already on screen.
- **Things are understood by their insides**: the coil in a hair dryer, the strings of a guitar, the gears in a toy car, the spine of a book.
- **Real rules.** When the image is judged, the rule on screen is a real, sourced regulation.

Not Sci-fi Hologram HUD (no invented glowing chrome: the console is plain, functional, dark), not Exploded Teardown (objects are never taken apart or lit as solids), not Under the Microscope, not a medical scan film (luggage, belts, trays, a checkpoint), not a keynote (no slides, no centred title pages).

## 2. Materials & rendering

- **Thickness pass** (three.js): every mesh double-sided, depth test off, additive blending into a float target. A fragment writes `±distance × density × class`, minus for front faces, plus for back faces, so each pixel holds the path length through organic (R), inorganic (G) and metal (B). Hollow objects are an outer solid plus the same shape shrunk with negative density, which gives walls their real thickness.
- **Every solid must be closed.** An open tube or a missing cap leaves a hole that reads as a dark or bright fleck; cap tube ends, keep winding outward, never mirror with a negative scale (it flips the sign).
- **Dual-energy colouriser** (one full-screen shader): high and low energy attenuation from the three channels; their ratio picks the hue (orange → green → blue), the total sets brightness. Brightness rises with thickness, peaks, then falls towards black, so thick steel is dark blue and a solid block is black. Gradient edge enhancement (the machines' EDGE function), a fine detector grain and scanlines.
- **Two displays.** The screening image is opaque on a navy belt background (so black can read as black); the CT volume is additive glow on the dark reconstruction field. Both use the same material classes.
- **The scan.** A fixed curtain line; the bag moves through it; columns that have passed are in colour, the rest a pale grey preview. Material filters (organic strip, metal strip, high penetration) are wipes across the image.
- **Textures in object space**: weave for fabric, lumps for food, paper and foam, anchored to the object and measured in millimetres so they stay put when the camera zooms.
- **Around the screen**: a dark booth lit by the monitor; through the glass the apron at night (runway, taxiway and floodlights as soft bokeh) for time of day; the machine's tunnel exit and rollers. Everything outside the screen is 2D, parallaxed and out of focus.
- **Post**: bloom from the screen image only, vignette, light grain in the mux.

## 3. Colour logic

- The four material colours are reserved for X-ray matter. UI and annotations never use pure organic orange or metal blue as decoration.
- Neutral ground: near-black navy for the console, a slightly lighter navy for the empty belt.
- Operator colours, one meaning each: amber = flagged / under review, red = refused, green = cleared, pale blue = machine state (scanning, curtain, CT). One verdict colour per screen.
- Text is near-white on dark plates; dim blue-grey for secondary machine text.
- Time of day lives outside the screen: the sky behind the glass (night navy → dawn amber), the runway lights; the screen keeps its colours all night.
- Example (our demo): belt #080F1A, organic rgb(255,133,26), mixed rgb(115,235,51), metal rgb(46,122,255), amber rgb(255,178,58), refuse rgb(255,74,64), clear rgb(96,232,140).

## 4. Type & subtitles

Two voices in type, never mixed:

- **Machine voice**: a monospace (e.g. IBM Plex Mono, OFL), 15–22 px for chrome, 56–64 px for the clock and counter, about 32 px for the status word. **English only**, upper case for states and keys, as a real console would print it: legend (ORGANIC / MIXED / METAL / OPAQUE), status (SCANNING, REVIEW, CLEAR, BAG CHECK, UNCLEAR, STANDBY), view labels, the CT header.
- **Operator voice** (labels, rules, verdicts): a CJK sans (e.g. Noto Sans SC, OFL, subset to the characters used) at **34–44 px** on screen, bold, with the English line under it in the monospace at 17–22 px. One line per language. A label that cannot hold 34 px Chinese is written in the machine voice instead (English only).
- Labels attach to the object with a leader line or sit in a panel beside the image; verdicts are stamps (tick or cross, word, English line) that land after the hold.
- Every image carries its stamp (bag number, time): it keeps the clock visible in tight shots.
- Nothing the viewer must read under 18 px at 1080p; legends and chrome may go to 15 px. Sizes are on screen: when the outside camera pulls back (scale < 1), anything the viewer must read waits for the push in, or is set larger.
- **Subtitles** (when there is a voice) are the operator's log: a dark plate fixed to the frame's bottom left (not to the console, so it never moves with the camera), a thin white bar on its left edge, Chinese 36 px over English 24 px in the monospace, one line each. Keep panels, verdict stamps and judged objects out of that corner: panels sit top right of the image, the CT verdict bottom right. Cues less than about 0.6 s apart share one plate (the text changes, the plate resizes), so it never blinks off and on between lines.
- Holds: a judged frame shows object, rule, number and leaves 2.5 s before the verdict; verdicts stay ≥ 1.5 s; labels ≥ characters ÷ 4.5 + 1.5 s.

## 5. Motion quality

- The belt moves at constant speed with short decelerations to a stop (a real belt has inertia), and a small settle.
- Operator actions are fast and precise: boxes are dragged open from a corner in 0.25–0.3 s, zoom eases in/out, measurement lines grow and tick.
- Counters and clocks jump on cuts to compress hours; within a shot they run in real time.
- Material filters and rescans are wipes; the CT appears through a short digital tear.
- CT orbits are slow and continuous, ease in and out, with a push and a near-stop where the detail is.
- Never moves: the console chrome, the legend, the view frames. Judged frames are locked.
- **Frame rate and grain**: 30 fps.

## 6. Camera grammar

Two cameras: one outside the screen (2D, over the booth and the monitor), one inside the X-ray (zoom on the image, or a CT orbit).

| Move | What it expresses | Can serve |
|---|---|---|
| Wide booth, window behind | place, time of day | an opening; the hour changing; an ending |
| Push from booth into the screen | attention narrowing | the next bag; a shift starting |
| Tight crop on part of the console | one object, one reading | a montage; a counter or clock |
| Operator zoom inside the image | suspicion | a flagged object |
| Locked frame with a panel | judging | a rule, a measurement, a verdict |
| CT orbit with push | seeing in 3D what the flat image hid | a reveal; a hidden mechanism; a living thing |
| Pull back to the window | consequence, time passing | dawn; the end of a run |

Subject at least a third of the view when it is judged; panels on the side away from the object; never cover the object with text.

Transitions come from the machine, never a hard jump in brightness:
- **Between bags: the scan sweep.** The next picture comes in behind a thin X-ray scan line moving the belt's way (right to left), the old picture held on the other side; short (about 0.2 s) on the beat in a montage, 0.3–0.6 s for a new judgment or a jump in time. No crossfades, no white flash frames.
- **Filters and rescans** are wipes of the same kind inside the image.
- **Into CT** a short digital tear, kept dim (the reconstruction settles out of noise; no frame much brighter than the CT that follows); out of CT a scan sweep back to the console.
- **Wide ↔ close** at the booth is a camera move, not a cut: push into the screen, pull back to the window. When the outside camera crosses the scale where the monitor fills the frame, keep drawing the window behind it so nothing pops.
- List rows and panels arrive behind a reveal line, not with a flash band.

## 7. Sound palette

- **One family of console tones** (sine with a little second harmonic, soft edges): scan chirp, two-tone alarm, single clear tone, low buzzing refusal, rising beeps for list rows. Keep the same family for the whole film.
- **Machine foley**: belt motor and rollers, X-ray tunnel buzz (120 Hz + filtered noise) while a bag passes, servo whine for zoom, relay clicks for keys, a CT gantry whir, a thump when the belt stops, a pitch-falling power-down.
- **Score**: plucked and short-bowed strings (pizzicato, spiccato) for the flow, tremolo strings and timpani for a held judgment, harp and sustained strings for release; tuned percussion (vibraphone, marimba, glockenspiel, xylophone) for small comic or tender moments. Divide the beat to push the flow instead of changing tempo.
- **Silence**: drop the groove under a judgment, leave the hum.
- **Mix**: tones and foley over the music; duck the music 4–5 dB under alarms, verdicts and list beeps; little energy below 50 Hz; −14 LUFS master, true peak ≤ −1 dBTP.
- **Voice** (optional): the operator, close and dry, no room. Compress it, set it by RMS about 10 dB over the music and 7 dB over music plus machine beds while it speaks, cut the music's 300 Hz–4 kHz band under it, and keep it off the alarm and verdict tones: a line sits in the hold before a verdict or right after it, never on it. Leave the moment a hidden thing is revealed without words.

## 8. Native moves

- **The scan curtain.** A bag crosses a line; behind it the grey preview turns into colour column by column. *Fits content like:* revealing the contents of anything sealed; a product's insides at launch; a parcel at a sorting hub.
- **Box, zoom, read.** The operator drags a box, the image zooms, a panel with the reading slides in, a verdict stamps. *Fits content like:* a compliance rule; a defect found on an assembly line; a counterfeit check.
- **Measure against a rule.** Rulers on the image give a size; a same-scale outline of the limit sits beside the object. *Fits content like:* cabin-bag sizes; a part tolerance; a dose or volume.
- **Material filter.** Organic strip or metal strip wipes away one class to show what remains. *Fits content like:* finding the battery in a toy; wiring inside a wall; the metal frame of a shoe.
- **Into CT.** The flat image cannot tell; a tear into a rotating 3D volume shows what it is, and something moves. *Fits content like:* an animal hidden in a box; the mechanism of a watch; a component stack in a phone.
- **Rescan.** The same bag again, without the removed item; a dashed outline marks where it was. *Fits content like:* before/after; a fix verified; a recall.
- **The shift.** Clock, counter and the sky behind the glass carry hours in seconds; a summary table closes it. *Fits content like:* a night at a sorting centre; a year of shipments; a launch day.

Our demo opens on the machine's self-test and *the scan curtain* from the wide booth, uses *into CT* as its climax and ends on *the shift*'s summary table, the belt stopping and the screen going to standby. A new film opens and ends another way: a *material filter* wiping an image already on screen, a wide booth at dawn running backwards to night, an ending on a *rescan* with its dashed outline, or a CT orbit that pulls back out to the whole bag.

## 9. Pitfalls of the medium

- **Wrong colours for the material.** Aluminium is green-blue, steel blue, lithium cells blue-green, glass and bone green, water and food orange. Check every prop's class; a black area must be a genuinely thick, dense object.
- **Clutter.** Too many overlapping objects turn into mud. Keep 4–8 readable objects per bag, iconic shapes (keyboard grid, coil spring, J-hook) and vary the classes.
- **Thin things vanish** (a strap seen flat, a 1 mm plate): raise density or thickness until it reads at the shot's scale.
- **Open meshes and mirrored meshes** produce flecks and negative thickness (see §2).
- **Text over the image.** Panels go beside the object; dim the image outside the operator's box rather than covering it.
- **Flat side view.** Low objects look like a strip in the side view; use it for tall or layered things, not for crops.
- **Facts.** Screening rules differ between domestic and international flights and between airlines; quote the exact rule for the route you show, keep FACTS.md with source URLs and wording.
- **Render state.** Set a render target's viewport and scissor before binding it; a stale viewport squashes the image and makes frames depend on render order.
- **Brands.** No manufacturer names, logos or real products in the console or on labels.
- **Chrome in two languages.** Bilingual chrome (a Chinese legend at 20 px) drops under the readable size and clutters the console; keep chrome English and give Chinese only to the operator's labels, at full size.

## 10. Engine

- `demo/xr.js`: `X(geometry, class, density, parent, opts)` (weave, lump), `boxShell`, `cylShell`, `tube` (capped), `lathe`, `flat`, `instanced`, `spring`; `makeEngine(W, H)` returns `renderView(view, deviceRect, items)` (renders only the visible part of a view, viewport-safe) and `drawView(view, {split, strip, front, hot, side, mode, gain, dim, clipFrom})`, the dual-energy colouriser.
- `demo/props.js`: the demo's bags and trays at real sizes (your film packs its own; suitcase, laptop, umbrella, sneakers, books, flask, tray of metal items, backpack with power bank, tote with bottle, lunch jar). `demo/crab.js`: the demo's live cargo, a procedural carapace, jointed legs with a pose function, hairy claws, twisted rope.
- `demo/film.js`: console layout, booth and window, verdict panels, CT shot, time warp, `window.EV` cues; `VO` (voice clip starts) and `SUBS` (bilingual cues) in film time, `subtitles()` for the operator's log plate. `demo/audio.py`: voice, score, console tones and foley from `events.json`.
- Minimal example of something new: a wrist watch, top view (`item`, `X`, `cylShell` from `xr.js`; `E`, `mainV`, `setTop` as set up in `film.js`).
  ```js
  const it = item('watch'); E.scene.add(it);
  cylShell(0.02, 0.01, 0.0015, MET, 1.2, it);                 // steel case
  X(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 20), MET, 1.6, it);   // movement
  setTop(mainV, 0, 0, 3); E.renderView(mainV, rect, [it]); E.drawView(mainV, {});
  ```

## 11. Variation space

The agent decides the place (checkpoint, cargo hub, mail room, customs, a factory line), the bags and what is inside, the rules, how many judgments, the hours, whether there is CT, and the music.

- **Structures**: one bag, three filters, one discovery; a conveyor of 20 items cut on the beat ending on one stop; a before/after rescan story.
- **Openings**: the machine's self-test; a single object already on screen in grey, coloured by the first pass; a wide booth at dawn running backwards to night.
- **Endings**: a summary table; the belt stopping and the screen going to standby; a CT orbit that pulls back out to the whole bag.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
