# 1920s Silent Film — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Runaway Loaf* (54.2 s) · `silent-film.mp4` · source in [`demo/`](demo/)


A 40–60 second one-reel comedy: a baker's perfect round loaf escapes and ends up with a hungry girl. The references it leans on hardest: Keaton's locked-off chain gag and Lloyd's near-miss; the score follows a photoplay cue sheet (Maestoso / Andante / Hurry / Misterioso / Agitato / Tenderly).

## Story & structure

A short one-reel comedy as it would look *projected*: the frame is a 4:3 print in a gate, between theatre curtains; the image is an ink drawing with washed greys and hatching, printed on silver stock that flickers, weaves, scratches and burns at the edges. Nobody speaks. Story beats are told by **action in wide shots** and by **intertitle cards**. The only sound is a cinema piano (and the projector in the booth).

The comic engine is Keaton's: an ordinary person with one small goal, a physical world that misbehaves, a face that does not react — and one gag built as a chain of cause and effect that the audience watches happen in a single frame.

How the demo used the medium:

| Native power | Story use |
|---|---|
| **Locked-off wide shot** | A mechanical gag: A triggers B, B leaves the frame, the audience waits, B comes back and hits C. The waiting is the joke. |
| **Intertitles** | Three to five cards carry what the action can't: the premise twist ("The loaf had other plans."), a shout ("STOP THAT BAKER!"), one line of dialogue ("Is it yours, mister?"). Keep each card to a few words. |
| **Projection speed** | Undercrank the chase (motion sampled at 18 fps, 1.3× speed, faster flicker); return to 16 fps and a calmer print for tender scenes. Speed is an emotion. |
| **The iris** | Open on the object of the story, close on the last glance. An iris that stops half-way lets a character look at the audience (a wink). |
| **Ageing as mood** | More damage when things go wrong, a warmer sepia and a cleaner print when the film turns tender. |

**Story shape (as in the demo):** pride (a baker lifts his perfect round loaf high) → the object escapes (it wobbles on the sill, rolls off and away down the hill — a *round* loaf, so it can really roll) → the chase with one near-miss (he grabs, it hops over his hand, he stares into his empty fist) → the chain gag in one take (see-saw → a melon flies out of frame → the constable strolls in → the melon lands on his helmet) → it stops at the feet of someone who needs it more (a hungry girl) → silence → a small act (he breaks the loaf in two) → echo (she lifts her half high, as he did) → the iris closes on her wink. **Cut rather than add**: a tram, a fog chase, a rooftop hang and an eight-step market chain in one film are unreadable in thumbnails. One legible chain beats three busy ones.

Adapting any topic: find the object that escapes, the person it should end up with, one mechanical chain that can happen in a single wide frame, and a gesture that can be repeated at the end with a new meaning.

## Shots

| Beat | Camera |
|---|---|
| Opening | Curtains part on a dark screen while the projector spins up; the title card; an **iris opens** on the lifted loaf. |
| Setup | A locked full shot: the whole premise (pride → sill → the roll → double take) plays in one frame. |
| Chase | A **tracking shot**: the town scrolls at 0.8, lamp posts sweep past in front at 1.35, the hero and the object stay in frame. |
| The chain gag (signature) | A locked-off extreme wide, **no cut**: see-saw → melon out of the top of frame → 2.5 s of waiting → constable walks in and stops on his mark → melon lands. |
| Breath | A locked full shot, then true silence. |
| Tender | A slow **push-in** that is motivated: the camera comes down to the child's level as the hero kneels (zoom 1.6 → 2.1). |
| Ending | The **iris closes** on the child, stops, she winks at the audience, it shuts; "The End"; the curtains close. |

- **Hand-cranked sampling**: character and camera motion is sampled at 16 fps (18 in the chase); the print's flicker, weave, grain and scratches change every output frame (24 fps). That mix is what makes it look projected rather than simply low-frame-rate.
- **Deadpan performance**: the hero's face barely changes; the body does the acting — the crouch before the lift, the lift held proud, the two-frame snap of the double take with a little jump, the bend-and-swipe, the look into the empty fist while still running, hands on knees, the kneel.
- **Objects act too**: the loaf wobbles on the sill before it goes, hops over a cobble at exactly the wrong moment, decelerates with the music (ritardando) and rocks to rest against a shoe.
- **Raise arms away from the face.** On this rig forward flexion carries a raised arm across the face; raise celebratory arms by abduction (sideways, jumping-jack style) or turn the character toward the camera first.

## Score structure

- **No foley, no voice.** The piano *is* the sound design, as in a 1920s picture house: a nervous trill for the wobble, a descending glissando for the fall, a low "boing" for the bounce, a diminished sforzando for the double take, a high stab and an upward run for the grab, "plink … plonk" for the empty fist, a forearm cluster for the see-saw, an upward glissando for the melon, a swelling diminished tremolo for the wait, a falling glissando into a crash chord for the landing, a crisp minor second when the bread breaks, a grace note for the wink.
- **Score**: original photoplay music on a period **upright piano** (VSCO 2 CE, CC0), stride left hand, following a cue sheet: Maestoso title → Andante "Loaf theme" (F major) → comic "uh-oh" + accelerando run → Hurry (A minor, 16th-note runs, 144 BPM) → stop-time suspense + Misterioso walk → Agitato tremolo → ritardando (88) → silence → **reed organ** (FreePats accordion, CC0) enters pp → Tenderly (the Loaf theme at 72 BPM) → finale. The theme is heard proud at the start and tender at the end.
- **The projector is the ambience**: a lamp click and motor spin-up before the curtain, a soft claw-and-motor purr under the reel, pushed forward as the *only* sound in the silence, and the tail of the film flapping on the take-up reel at the end.
- **Silences**: (1) the stop-time in the chain gag, while the melon is out of frame (only a faint tremolo swelling); (2) the loaf stops, the projector alone for two seconds — the next sound is the reed organ.
- Tame the piano's hammer transients with light compression before loudness normalisation (−14 LUFS). Put the grain in the picture; mux grain 1.

## Palette & props

- **House style = tonal painting + Redraw.** Scenes are painted in grey values only (print densities: ink 0.07, dark cloth 0.15–0.3, mid wood 0.45–0.6, skin 0.8, shirts and aprons 0.9–0.95), with soft light gradients and a thin separation line. The **Redraw** pass (WebGL2) then inks the whole frame: difference-of-Gaussians contours on the dark side of every edge, the luminance posterised into five soft wash steps, and 45° hatching (then crossed) in the darks that is re-drawn every two frames like hand-redrawn animation. Real video frames go through the same pass ("redraw mode", see `stills/frame_redraw.jpg`), so footage and drawing share one hand.
- **Print** (`FilmPost`): silver tone with 0.10–0.36 sepia, print black 0.055 / white 0.93, S-curve, halation on highlights, uneven density, flicker, gate weave with the occasional perforation jump, broken vertical scratches (white = scraped emulsion, dark = dirt on the negative), brown burn creeping from the edges, vignette, two-octave silver grain. Then `damage()` adds dust, a hair in the gate and the rare blotch.
- **Frame**: 1440×1080 in the centre of 1920×1080, rounded 22 px aperture with a soft dark rim; the sides are the theatre — velvet drapes lit by the screen's spill and by footlights. The curtains part at the start and close at the end.
- **Characters**: realistic 7.5-head adults and a 5-head child on a 2.5D rig (joints solved in 3D, projected with a yaw), silent-era make-up (pale skin, dark lids and lips). Silhouette marks of the demo hero: a pleated baker's cap, a dark waistcoat over a white shirt, a long white apron.
  The hero's model sheet, with grey values as print densities, four expressions and key poses, is `?scene=frames.modelSheet`. A tender-scene style frame through the full pipeline (Redraw, sepia, iris, theatre): [`demo/stills/frame_tender.jpg`](demo/stills/frame_tender.jpg).
- **Intertitles**: a black painted card with a deco border whose ornament follows the emotion — one heavy rule for a shout (text shakes), a double rule with stepped corners and fans for narration, vines and small flowers for tenderness. Playfair Display SC for titles and shouts, Old Standard TT Italic for narration and dialogue.
  The four card types side by side: [`demo/stills/frame_cards.jpg`](demo/stills/frame_cards.jpg).

## Titles, intertitles & end card

- The intertitles *are* the subtitles; the `.srt` lists their text. Each card holds 2.5–3.75 s.
- Title: THE RUNAWAY LOAF / *a photoplay in one reel*.
- End card (tender border): The End · title and style name · LEMO-OPUSCAR · LemoLab × Claude Opus 5.5 · asset credits; the curtains close over it. The LemoLab sign-off belongs to this library's demo only: a user's film carries no LemoLab credit and no copy of this card.

## Pitfalls

- **Puppet arms**: an arm drawn as a separate tube with its full outline over the shirt, a shoulder pivot that never moves, and abduction applied after flexion make a "spread" overhead arm swing inward, so the lift becomes an X. `engine/figure.js` does it this way: abduction first, then flexion; the shoulder joint rises and swings forward as the arm goes up (clavicle); the torso's shoulder corner slims on the raised side; arms carry a deltoid and a biceps/forearm profile; the arm's contour is hidden where it lies over the torso near the shoulder.
- **Pose pops**: switching poses in `if` branches makes figures jump. Every character is driven by keyframe lists (`poseAt`, `numAt` in `shots.js`) so poses, position and facing are always eased; only deliberate gags (the double take) snap.
- **Floating props**: a prop "held" at the average of the hands drawn on top of everything floats. Hold it *between* the palms at the depth between the two arms (`props.between`), size it to the gap between the palms, and hand it over by interpolating between the giver's and the receiver's palm positions (`palmsAt`). A long loaf can't roll along its length — use a round one, and tie its rotation to distance (angle = distance / radius).

- **Too much content kills a silent film.** An eight-step chain gag at 64 px per head is noise in a thumbnail. One chain, with a pause in the middle, reads.
- The rig's faces look like mannequins in big close-ups: stay in wide and medium shots (which is Keaton's grammar anyway) and keep the only close-up inside the iris.
- A raised arm can cross the girl's face and hide the wink: turn her toward the camera and raise the arm by abduction.
- Brow angles flip with the facing direction: "worried" (inner brows up) reads as angry on the girl facing left; check expressions in a crop at final size.
- The iris centre must track the face in *film* coordinates after the camera zoom (`girlFace()` maps world → film).
- In the chase the grab reads only if the hero gets within arm's reach of the loaf: put the hand exactly where the object is at the beat, bend the body down, make the hop big (210 px).
- Closed curtains lit only by the dark screen are pure black (blackdetect): add footlights.
- Heavy grain makes big files (170 MB at CRF 19); re-encode with `-tune grain -crf 25` (≈ 77 MB).

## Build notes

```
styles/silent-film/demo/
  timeline.js    cue-sheet sections (bpm, beats) + named hits — the single source of truth → tools/dump_timeline.mjs → timeline.json
  engine/        ink.js (tonal forms, ink line, wash, hatch, drawShape) · redraw.js (Redraw: frame → ink drawing, WebGL2)
                 film.js (FilmPost print + damage) · cards.js (intertitles, deco borders, iris, theatre) · figure.js + heads.js (2.5D rig)
  chars.js poses.js sets.js   the cast, key poses, town set pieces
  shots.js       one function per section: bakery · chase · market · roll · sil · tender · irisShot (tonal paintings)
  film.js        assembly: shot → Redraw → iris → FilmPost → gate + curtains; per-section look (damage, sepia, sampling fps, crank)
  cardspecs.js   the intertitles        frames.js   model sheet, card sheet, redraw sample, one-colour example
  sheets.js      rig check scenes, not in the film: ?scene=sheets.test (turnaround + run pose) · heads · redrawFig · armTest · loafTest
  stage.js       the small scene → FilmPost → gate helper that sheets.js draws through
  music/score.py  photoplay score from timeline.json      mix.py   score + projector
  tools/         cuecheck.py · subs.py · dump_timeline.mjs
```
1. Write the cue sheet (`timeline.js`) first: sections, tempi, and every gag beat as a named hit. The score is generated from the same file, so every hit lands (0 ms).
2. Paint each shot in greys (`?scene=` stills for review), then look at it through the whole pipeline — the Redraw pass changes what reads.
3. `sh demo/build.sh`: timeline → score → cue check → mix → srt → render (≈ 55 s with 2 workers for 1301 frames) → mux (−14 LUFS) → grain re-encode → stills. About 2.5 minutes.
4. Review 1 frame per second, then frame strips for every gag at 0.1–0.2 s.

## Engine reference

Four modules, usable on their own:

| Module | Main API |
|---|---|
| `engine/ink.js` (tonal drawing) | `setFrame(t, {boil})` · `form(g, pts, {v, line, grad, shade, cyl})` (a filled, shaded, outlined shape in grey value `v`) · `stroke(g, pts, w)` · `drawShape(g, shape, style)` (**any path in this style**; `style.color` draws it in a hue for the colour mask) · `sparkPts(cx, cy, r, tail)` · `catmull`, `ellipsePts`, `rectPts`, `mottle`, `shade`, `grey(v)` |
| `engine/redraw.js` | `new Redraw(w, h).render(canvasOrImageOrVideo, {frame, lines, tone, hatch, levels, gap, sigma, p, eps, phi, bilateral, src})` → canvas. Turns the tonal painting *or a real video frame* into the ink drawing (redraw mode: `bilateral: 3, p: 34, eps: .24` for photos). |
| `engine/film.js` | `new FilmPost(w, h).render(src, {frame, strength, sepia, crank, grain, flicker, weave, scratches, burn, vignette, halation, exposure, jump}, colorMask?)` → canvas · `damage(g, x, y, w, h, frame, strength)` (dust, hair, blotch). Stack it on **any** 2D canvas. |
| `engine/cards.js` | `intertitle(g, W, H, {level, lines:[{text, font, size, italic, weight, spacing}], shake}, t)` · `decoBorder(g, x, y, w, h, level)` · `iris(g, W, H, cx, cy, r)` · `theatre(g, W, H, gate, spill, curtainOpen)` |
| `engine/figure.js` + `heads.js` | `drawFigure(g, character, {x, ground, scale, yaw, pose, t, props})` · `P0()`, `mixPose`, `runPose(ph)`, `walkPose(ph)`, `runBob` · characters in `chars.js`, poses in `poses.js` |

**The one colour.** The print is monochrome; to keep one element in its own hue, draw it into a separate mask canvas (colour + alpha) and pass that to `FilmPost.render`: it keeps the hue where the mask has alpha, but still gets the grain, flicker and vignette.

```js
import { drawShape, sparkPts, grey, setFrame } from './engine/ink.js';
import { Redraw } from './engine/redraw.js';
import { FilmPost, damage } from './engine/film.js';

setFrame(t);
const W = 1440, H = 1080, mk = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
const frame = mk(), f = frame.getContext('2d'), mask = mk(), m = mask.getContext('2d');
f.fillStyle = grey(.9); f.fillRect(0, 0, W, H);
const sp = sparkPts(720, 460, 220, 260);                 // a four-point light with a short tail
drawShape(f, sp.star, { v: .6, shade: 12 });            // tonal version (gets inked + hatched)
drawShape(f, { pts: sp.tail, closed: false }, { line: 10 });
drawShape(m, sp.star, { color: '#D97757' });            // the one colour
const inked = new Redraw(W, H).render(frame, { frame: Math.round(t * 24) });
const print = new FilmPost(W, H).render(inked, { frame: Math.round(t * 24), strength: .6, sepia: .15 }, mask);
g.drawImage(print, 240, 0); damage(g, 240, 0, W, H, Math.round(t * 24), .6);
```
(`?scene=frames.oneColour` renders this example.)
