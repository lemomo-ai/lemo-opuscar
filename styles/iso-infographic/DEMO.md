# Isometric Infographic — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *From Bean to Cup* (58.8 s) · `iso-infographic.mp4` · source in [`demo/`](demo/)


The demo follows one coffee bean from a farm to a cup in a 45–60 s film: one isometric map, one camera take, a Z-shaped route across a square board.

## Story & structure

The whole film is **one isometric map**: a square diorama board that projects to a rhombus of almost exactly 16:9. Every step of the process is a **station** on that board. A dashed **route line** connects the stations. The camera never cuts. It rides the route with pushes, pulls, pans and follows, and each station is told the same way: **one action, one label, one number built from icons.**

What makes it work:
- **Flat, true isometric.** No perspective, no outlines. Shapes are separated only by the three tones of each face.
- **Infographic furniture is part of the picture.** Leader lines, label pins, cut lines, hatched section faces, tracking rings and a legend all live on the map.
- **One tracked subject.** A single object (a bean, a parcel, a drop of water) is followed through the whole system with a "you are here" ring. That turns a diagram into a story.

How the demo used the medium:

| Native power | Story use |
|---|---|
| **One-take diorama** | Any process becomes a route across one board. Lay the route out as a **Z across a square board** (far corner → right → across the middle → near corner). A straight strip wastes the final pull-back, but a square board fills 16:9 exactly. |
| **Cutaway** | One unified gesture: a dashed **cut line** draws, the near skin **slides out along its normal and fades**, and **hatched section rims** remain. Use it for a fruit, a ship's hull, a container, a sack, a building or a machine. |
| **Isotype numbers** | Every station gets a number drawn as identical icons, with a different arrangement each time: a 3×7 calendar of suns, 14 container icons (1 = 1,000), a day/night row, a rising thermometer, 70 beans that **arrange into the silhouette of a cup**, and an 11-cell distance bar. |
| **Focus + context** | At the emotional peak, **desaturate everything except the subject** (the engine's one-colour hook). This is the infographic's own way of saying "this one". |
| **Frame within the frame** | A detail callout: a leader line grows from the map and ends in a circular inset showing a close-up. The system and the individual are on screen together. |
| **Scale reveal** | End by pulling back to the whole board. The route lights station by station and every label is on screen at once, so the last frame is a finished infographic. |

**Story shape (as in the demo):**
1. Open on an extreme close-up of the subject arriving in a hand, with a tag: **0 km**.
2. Pull back to the first station and the title.
3. Numbers grow station by station (2 seeds → 400,000 beans per sack → 14,000 containers). The subject gets lost.
4. At the busiest point, dive through nested cutaways and find it: the silence, and the only colour left.
5. The loudest sound in the film breaks the silence, and the camera snaps back out. The time jump is hidden inside the dive.
6. Transformation stations, a second silence, then the gentle payoff.
7. **Echo:** the same close-up composition, a different hand and a different object, and the tag now reads the total. Pull back to the full map.

**The numbers must add up.** This style lives on credibility: 400 + 10,500 + 100 = 11,000 km, and the Isotype bar is coloured in the same proportions. Put the real order of the process on screen (in the demo, beans are shipped green and roasted in the destination country) and say why in your treatment if you change a brief.

## Shots

The camera is a world centre plus a **log-interpolated zoom** k (px per unit). The demo runs from k = 3.75 (whole board) to 8,000 (one bean).

| Beat | Camera |
|---|---|
| Open | Extreme close-up of the hand (k ≈ 600), drifting slightly. The camera sits 0.17 units above the palm so the branch fits above it. |
| Title | Pull ×35 to the first station (eio in position, log-linear in zoom) while the title plate rises. |
| Station | Hold wide, and open a circular inset for the detail. |
| Transfer | Descend (crane) or follow a vehicle; the next station's sound arrives first. |
| Busy station | Locked, then pull out as the system fills. |
| Breath | A long lateral follow over empty water. |
| Fast-forward | Follow with a wake and a day/night icon row. |
| **Dive** | Three pushes through nested cutaways, **slow → faster → fastest** (0.9 s, 0.6 s, 0.6 s) so it reads as a fall. One instrument drops out and the low-pass closes further at each level. |
| Silence | A slow push (k 3,200 → 8,000) while the colour drains from everything but the subject. |
| Snap-out | Pull ×470 in 1.2 s with an ease-out in log zoom. Fade in any tall object that would sweep through the frame during the pull. |
| Echo | A push into the second hand with the identical framing. |
| End | Pull back to the whole board; the end card sits in the empty cream corner. |

Frame so the subject is at least 1/3 of the frame height at key moments (the hands, the drum, the bean with its ring), and keep the bottom 170 px clear for subtitles.

- **Nothing moves without a line leading it.** The route line is drawn slightly ahead of the story, a leader grows before an inset opens, and a cut line draws before a skin slides away.
- **Cutaway timing:** cut line 0.3 s → skin slides out 0.35 s (ease-out, alpha 1 → 0 between 10 % and 75 %) → hatched rims fade in over the last 40 %.
- **Isotype fill:** icons pop with a back-ease (overshoot 2.2), one per sixteenth note. Count-up numbers (km, °C) run over the same span.
- **Accumulation = acceleration.** In the demo, containers land on quarter notes (by crane), then eighths, then four sixteenth-note waves of about 44 boxes each (they drop 7 units with a small bounce). The eye feels the system taking over.
- **The subject performs:** squash on landing (18 %) plus two small bounces; a rock with the ship's sway during the silence (±0.09 rad); a colour change in the roaster (green `#A9B27C` → yellow `#D9C27A` → cinnamon `#B07A45` → brown `#6A3B22`); first-crack pops as radiating ink ticks.
- **Vehicles** follow polyline paths with ease-in-out and face their tangent. Before a ship turns, move it clear of the quay; otherwise the stern swings through the cranes.

## Score structure

- **Music first.** `demo/timeline.js` is the only source of truth for times. The score, the foley events and the checks all read it (`tools/cuecheck.py`: 68 cue points, 0 ms offset).
- **Score:** original **acoustic world groove**, about 100 BPM. Nylon guitar fingerpicking (D–A–Bm–G) and kalimba, then shaker, bongo, cajon backbeat and conga, plus upright bass (`jazz_bass`) at the port and at sea. The fast-forward takes a B-minor colour. No piano, no string pads. A three-note **bean motif** on kalimba (A4–F#4–D4) plays on the first landing, on the final tag and in the station arpeggio at the end. The café section slows from 100 to about 70 BPM and stops; after the silence one guitar restarts at 80 BPM.
- **Two real silences:** the dive (30.0–33.6 s; only the line and a −66 dB hull creak) and before the first drop of coffee (45.3–45.9 s; digital zero). The first sound after each is one of the most important in the film: **the ship's horn** (about 10 dB above everything else; a D2 saw stack with detune and a 2.8 s tail) and **one drop into an empty cup**.
- **Three layers:**
  - **Ambience beds**, one per station and crossfaded: hill wind, leaves and birds; harbour, gulls and a crane beeper; sea swells; city hum; café murmur; morning sparrows (the same bird synth as the hill, pitched up).
  - **Foley by material:** fibre snap for the stem, a fleshy thud for the cherry in the palm, granular rattles for cherries on the mesh, grains pouring into jute, inharmonic steel partials for container doors and landings, a burlap tear, drum rumble with rotation, dry crack pops, grinder whine plus crunch, a tamp thock, a ceramic plink and a pitch-rising pour.
  - **Music**, ducked about 8 dB under the voice. Ambience is ducked 7 dB and birds are muted while the narrator speaks: a bird chirp at the end of a word made whisper hear "travels" for "travel".
- **Sound transitions:** a J-cut of harbour noise 0.6 s before the port appears, the roaster drum 0.6 s before its walls open, and an L-cut of the horn tail into the city. In the final pull-back, each station plays one kalimba note.
- **Voice:** Kokoro `bf_alice` at 0.88–1.0, six short lines, every one whisper-verified on the dry take and again in the final mix.

## Palette & props

- **Projection:** true isometric, axes at 30°. `sx = (x − y)·cos30°·k`, `sy = ((x + y)·½ − z)·k`. World x runs down-right, y down-left, z up. Painter depth = x + y + z. Never rotate or tilt the view.
- **Three tones per face** (top light / left = +y face mid / right = +x face dark), picked per face from its normal:
  - coffee red `#CF5140 / #B3352B / #8C2620`
  - leaf green `#7BA75F / #5E8C4A / #476F37`
  - sea blue `#5A9BCB / #3C7FB1 / #2D6390`
  - cream `#FBF4E6 / #F2E6D0 / #D9C8A9`
  - soil `#A77850 / #8A5B3A / #6A432A`
  - mustard (cranes, road) `#E9BE5C / #D9A53A / #B0832A`
  - ink `#2E2522`
  - Other colours come from `tri(c)`: mix toward warm white 20 % for the top and toward `#231A2C` 22 % for the dark side, so shadows are slightly cool.
- **No outlines on solids.** Ink lines (2 px) are reserved for infographic elements: leaders, pins, cut lines, rings, the route and labels.
- **The board:** it floats on a cream `#F2E6D0` background with a faint isometric dot lattice and a soft blurred shadow. Its two front faces show three soil strata plus pebbles, and a three-blue water column where the sea meets the edge. Coast banks are only drawn where they face the viewer.
- **Stations** that must be found in the wide shot get a **pale cream plate with a dashed ink outline** and an accent colour (brick-red roastery, red-and-cream awning café). Keep buildings around them low.
- **People:** Monument-Valley-minimal billboards with a round head, a tapered body in two tones, a thick arm stroke and a hat or hair shape for identity. No faces. They step at 12 fps.
- **Hero close-ups (hands):** flat faceted shapes in three skin tones (light palm facing up, mid sides, dark underside), a sleeve in the character's colour, and fingers as rounded two-segment capsules curling toward the viewer. The opening and closing hands share **the same pose, camera, zoom and tag position.** Only the skin tone, the sleeve and the object change.
  The pair side by side: [`demo/stills/frame_hands.jpg`](demo/stills/frame_hands.jpg) (3.4 s and 50.9 s).
- **Labels (pins):** a dot (ink ring, cream fill) → a vertical leader → a horizontal rule → text. Titles are Jost 600, all caps, tracking 0.12 em. Numbers are Jost 400 at 44 px, and units Jost 500 at half size. Text has a 7 px cream halo so it reads over any colour. Pins can point up or down and left or right; choose per station so labels never cover the subject.
- **Title:** Jost 700 words extruded as isometric blocks on a cream plate lying on the ground plane (cream face, coffee-red sides), one word per eighth note.
- **Clouds:** flat isometric clouds with fake parallax (1.25× the ground's motion). They fade out above k ≈ 40.

## Titles, subtitles & end card

- **The subtitle is a map label.** A cream `#FBF4E6` card with 10 px radius and a 2 px ink border, a tiny coffee-red iso cube as the legend chip, Jost 500 at 42 px in ink. It sits bottom-centre, 64 px from the bottom edge. The border draws in first (0.2 s) and the text wipes left to right; on exit it slides down 8 px and fades.
- Hold each line ≥ max(1.8 s, speech + 0.6 s). Lines never overlap each other, the title or the end card.
- **End card = the map's legend**, shown in the empty cream corner: title, style name, total with the Isotype bar, "Lemo-Opuscar · LemoLab × Claude Opus 5.5", credits. "NOT TO SCALE" is honest and a small joke. The "Lemo-Opuscar · LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only: a user's film carries no LemoLab credit and no copy of this card.

## Pitfalls

- **Newell normals versus vertex order:** a box's +y face can be culled as a back face. Give every face an outward hint (`out`) and flip the normal to match it before culling.
- **Painter sorting of composites:** shrubs on a terraced hill appear in front of the next terrace. Draw the hill as one item: each terrace, then its back row of shrubs, and after all terraces the front rows from top to bottom. Cranes' booms need a large depth bias so they sit above the ship.
- **Semi-transparent falling boxes look like ghosts.** Use motion only, no alpha.
- **The ship's bow over the beach** reads as "run aground" even when it is geometrically in water. Leave visible water around every hull. Undock by translating clear of the quay before turning.
- **The time jump inside the dive:** the ship teleports from mid-ocean to the destination dock while only beans fill the frame. Draw the bean field **in screen space, anchored on the tracked bean** and scaled by k; its layout then does not depend on the ship's heading, and the jump is invisible.
- **Giant world geometry behind hero close-ups:** at k = 600 a shrub is a green disc the size of the frame. Skip shrubs above k = 120 and paint a flat backdrop behind the hero layer, fading with it.
- **The pull-out passing through a crane** gives one ugly frame of a giant boom. Fade tall objects in by zoom (`alpha = clamp((80 − k)/40)`).
- **whisper and ambience hiss:** a continuous leaf rustle (2.5–7 kHz) after a word turns "travel" into "travels". Keep high-band beds very low under dialogue.
- **A machine drawn as a white box with a red roof reads as a house.** Use steel greys, a dark front panel, cups on top and a portafilter handle.
- In zsh a failed glob aborts an `&&` chain, so run shell loops through `bash -c`.

## Build notes

```
styles/iso-infographic/demo/
  timeline.js   tempo grid, cue times, subtitles, km numbers (single source of truth)
  engine.js     the style: projection, camera, 3-tone solids, labels, insets, cutaways, Isotype, people, any-shape extrusion
  world.js      the board: coasts, terraced hill, beds, roads, ports, ship, cranes, city, cutaway buildings, hold/containers/sacks
  hero.js       close-ups: palm, picking fingers, branch, cherry, cup, km tag
  film.js       camera path, story state, stations, overlays, subtitles, title/end card, sound events
  music/score.py   original score (sampler)      mix.py   ambience + foley + voice + ducking
  tools/        cuecheck.py subs.py final_asr.py review.sh      tests.js   hero + any-shape test scenes
```
1. Write `timeline.js` and the cue map first. Draw the board as a square in world units (S = 240). Lay out the Z route, then the stations.
2. Build the station scenes, reviewing each at its zoom with `?k=…&cx=…&cy=…` stills. Render the two hero close-ups on their own (`?test=hero`, `?test=hero&end=1`) until they match.
3. `sh demo/build.sh` rebuilds everything in about 2 minutes: TTS → whisper → score → events → cue check → mix → srt → render (1,411 frames in about 35 s with 2 workers) → mux (−14 LUFS, grain 0) → final whisper → stills.
4. Review with `bash demo/tools/review.sh out/revN 6 $(seq 0.3 1 58.3)` at least twice, plus frame strips of the dive, the snap-out, the landing and the pour taken from the muxed mp4.

## Engine reference

`demo/engine.js` is dependency-free ES module code for Canvas 2D. Everything is queued and depth-sorted until `flush()`.

| API | What it does |
|---|---|
| `new Iso(ctx, W=1920, H=1080)` | Engine instance. `iso.cam = {x, y, z, k}` sets the world point at screen centre and the zoom (px per unit). |
| `iso.P(x,y,z)` / `iso.unP(sx,sy,z)` | Project and unproject. |
| `iso.push(ox,oy,oz,rot,s)` / `iso.pop()` | Local frame (translate, rotate about z, scale) for vehicles and ships. Normals rotate too, so shading stays correct at any heading. |
| `iso.box(x,y,z,w,d,h,tri,{decal,bias,layer})` | Axis box, three-tone. `decal(I)` draws on its faces (windows, ribs). |
| `iso.prism(pts2d,z,h,tri)` | Extrudes any footprint polygon. Orientation is automatic and each side face is shaded by its normal. |
| `iso.cyl(x,y,z,r,h,tri,{axis:'z'|'x'|'y', n, spin, stripe})` · `iso.cone(...)` · `iso.roof(...)` · `iso.sphere(...)` | Cylinders (standing or lying, spinning stripes), cones, gable roofs, and flat-disc spheres with a lit cap and a dark crescent. |
| `iso.flat(pts,z,color)` · `iso.line3(pts,color,px,{dash})` · `iso.bill(x,y,z,fn)` | Ground decals, 3D polylines, and billboards (2D drawings scaled by zoom: people, hands). |
| `iso.text3(str,x,y,z,{plane:'xy'|'xz'|'yz', size, extrude, tri})` | Isometric type on a world plane, optionally extruded. |
| `iso.desat = 0..1`, `iso.keep = true` | **The one-colour hook:** everything drawn is desaturated toward warm grey except items drawn with `keep = true`. |
| `iso.sub(fn)` | Sorted sub-queue, used for interiors drawn between back and front walls. |
| `tri(hex)` · `PAL` | Three-tone generator and the palette. |
| `pin(iso,x,y,z,{title,num,unit,dir,up,len,a,icons})` | Label pin with reveal parameter `a`. `icons(g,x,y,dir)` draws an Isotype row under it. |
| `inset(iso,ax,ay,cx,cy,r,a,drawIn)` | Circular detail callout with a leader. |
| `cutLine(g,pts,a)` · `hatch(g,pts)` · `ring(g,x,y,r,a,t,tag)` | Cut line, hatched section face, rotating dashed tracking ring with a tag. |
| `ICON.sun/moon/box/sack/bean/cherry(g,x,y,size,lit)` · `iconGrid(g,x,y,n,lit,cols,gap,draw)` | Isotype icons in the same three-tone language; lit count m can be fractional (pop-in). |
| `person(g,{body,hat,hair,skin,arm,face,h,basket,apron,tool})` | Minimal people for `iso.bill`. |
| `shape(iso, pts2d, [x,y,z], {color, depth, plane, scale})` | **Draw any shape in this style:** a 2D outline becomes an isometric solid shaded with the three-tone rule. `sparkPath(n,r,inner)` and `cursorPath(h,w,x,y)` are ready-made outlines. |

Minimal example: a warm-orange `#D97757` four-point spark with a cursor tail on a plinth, labelled (`?test=spark`, output in `demo/stills/engine_shape.jpg`):

```js
import { Iso, PAL, shape, sparkPath, cursorPath, pin } from './engine.js';
const iso = new Iso(ctx); iso.cam = { x: 0, y: 0, z: 2.5, k: 70 };
iso.box(-6, -6, -1, 12, 12, 1, PAL.cream);                                          // plinth
for (let i = 0; i < 5; i++) iso.box(-5 + i * 2.2, 3.2, 0, 1.6, 1.6, .6 + i * .5, PAL.blue);
iso.keep = true;                                                                    // the one element that keeps its colour
shape(iso, sparkPath(4, 2.2, .22), [-1, -1, 5], { color: '#D97757', depth: .9, plane: 'xz' });
shape(iso, cursorPath(2.4, .45, 2.7, 0), [-1, -1, 5], { color: '#D97757', depth: .9, plane: 'xz' });
iso.keep = false;
iso.desat = 0;          // set 1 to grey everything except the spark (focus + context)
iso.flush();
pin(iso, 0, -1, 7.6, { title: 'ANY SHAPE', num: '#D97757', dir: 1, up: 90, a: 1 });
```
