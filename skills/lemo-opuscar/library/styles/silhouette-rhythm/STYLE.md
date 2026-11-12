# Silhouette Rhythm — Style Prompt

> Pure black silhouettes against a saturated sunset, changing pose on every beat; on the key beat everything freezes and only the sky keeps moving. The water is the second canvas: reflections, ripples and back-lit droplets.
> References (grammar only): beat-locked silhouette commercials of the 2000s (flat black figures, every pose and cut on the beat); Lotte Reiniger's silhouette films (acting in profile, the outline carries everything); telephoto wildlife cinematography at sunset (a sun the size of the frame, animals crossing it). Copy none of their figures, layouts, typefaces or music; never name them in the film.

## 1. Essence, and what it is not

- **The figure is one black shape.** No detail inside it, no gradient, no outline, no shadow. Everything the viewer reads is in the contour.
- **There is always light behind it**: the sun disc, the bright band of the horizon, the glitter on the water. A silhouette sits on light, never on dark.
- **Poses land on the beat** and hold between beats. A group moves in unison; anything off the beat is a deliberate choice of the story.
- **The freeze**: on the key beat the figures, droplets, ripples and clouds stop; the sky's colour and the sun keep going.
- **The sky is the clock**: the colour sinks from gold to magenta to violet as the story moves, and the sun goes down with it.

Not Shadow Puppetry (no visible rods, no paper texture, no lamp behind a screen), not Paper-cut Lightbox (no layered paper, no inner light), not Red Paper-cut (no ornament inside the shape), not a sunset stock photo (the figures act, on a grid).

## 2. Materials & rendering

- **Three 2D layers composited in one fragment shader**: silhouettes, their reflections, water light (ripples and droplets). The shader paints the sky, the sun and the water, then lays the layers over it.
- **Sky**: two vertical colour ramps (gold-to-crimson and magenta-to-violet) blended by one story-phase value; perspective cloud streaks lit on their sun-facing edge; a sun disc with a warm glow and a horizontal flare band.
- **Water**: the sky reflected with wobble from two noise octaves anchored to the world, a glitter column under the sun, darker towards the camera. Reflections of figures are the same shapes flipped about the waterline, wobbled and darkened.
- **Light around the figures**: volumetric rays marched from each pixel toward the sun (56 steps) and occluded by the silhouettes; a thin rim on the sun-facing edge and a soft halo, stronger near the sun.
- **Ripples** have a bright crest (in the water-light layer, tinted by the sky) and a dark trough (in the reflection layer), so they read on bright and dark water alike. **Droplets** are bright beads, never black specks.
- **Camera**: a level pinhole over flat water (focal length, horizon height, camera height, lateral and depth offset, yaw). Long focal lengths make the sun huge; the horizon height frames the shot.
- **Screen space only for** the end card and a true directional motion blur on whip pans (many samples along the motion, at full resolution).
- Light film grain at the master; nothing else in post.

## 3. Colour logic

- Two values carry the frame: black figure and bright ground. Everything else is the sky's gradient.
- The figure colour is fixed: near-black with a trace of violet. It never takes a hue.
- The sky moves through warm hues only (gold, orange, coral, crimson, magenta, violet). No green, no blue sky, no grey.
- Brightest values belong to the sun, the horizon band and the light on the water; type uses the sun's cream, never pure white.
- Colour change is time: plan the story's moments against the sinking sun (high, touching the horizon, half, a sliver).

Example (our demo): figure #090307, sun #FFF6DC, gold #FFB347, coral #FC4D2B, magenta #E0245C, violet #380A52 → #1A083D.

## 4. Type & subtitles

- **Roles**: a heavy condensed sans for the title (120–150 px, e.g. Anton), a condensed sans for small lines (30–40 px, e.g. Barlow Condensed), a bold CJK sans for Chinese (≥ 34 px, e.g. Noto Sans SC). OFL, self-hosted, subset to the characters used.
- Cream on the dark lower water, left-aligned in the lower third, never inside the sun, never centred, no shadow or stroke.
- **Type lands on the beat**: one word per beat, each landing with a small ripple on the water under it. One word may land late or early on purpose.
- Subtitles, when the film speaks: one line per language on the water at the bottom left, the same cream, clear of the figures; hold ≥ max(1.8 s, speech + 0.6 s).

## 5. Motion quality

- 30 fps, everything on ones. Poses snap into place in ~0.13 s with a small overshoot (ease-out-back) and hold until the next beat.
- Feet stay planted in the world while walking or running (two-bone IK); never slide a standing figure.
- Wings, steps and head turns are scheduled on the beat grid: the top of a wingbeat, a footfall, a head flag on the beat; double-time subdivision for running.
- The freeze stops subject time and the shader's noise time together; only the sky phase and the sun height continue. A camera may move inside a frozen moment.
- Never moves: the horizon line within a shot (no dutch tilt), the sun's place in the world.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Telephoto, sun filling half the frame | intimacy, a single gesture at its clearest | an introduction; a decision; a held breath |
| Low lateral track at water level | a group moving together, legs and splashes | a march; a chase; a procession |
| Side view, slow pan | a sequence happening in order | a cascade; a departure; a relay |
| Whip pan with directional blur | a sudden change of attention | "meanwhile"; a reveal of who was left behind |
| High wide, slow pull back | scale and solitude | aftermath; loneliness; a pause with no beat |
| Locked medium | the beat itself, counted | a count-in; a ritual; a joke landing |
| Orbit inside a freeze | the moment that matters, seen from around it | a climax; a record; a memory |

Framing rules: at the key moments the subject fills ≥ 1/3 of the frame height; a wide shot keeps the subject on light (in the glitter column or against the horizon band). Transitions belong to the medium: a near silhouette walking across the lens (a black wipe), a match cut on the same pose, a whip pan, a cut straight into a freeze. No dissolves, no page turns.

## 7. Sound palette

- **Instruments**: tuned wood and metal percussion (marimba, kalimba, vibraphone, glockenspiel), plucked bass, a dry kit, claps and shakers; strings only for held chords under a freeze.
- **Character sounds are rhythm**: each kind of figure owns one percussive voice (a low log drum, a bright woodblock…) that lands where its gesture lands. Being on or off the beat is audible.
- **Foley**: water in all sizes (step, patter, splash, plop, drip), wing pushes, distant calls, wind. Footfalls pan with position.
- **Silence as a tool**: cut the music dead (a record stop, a half-beat drop) before the turn and before the climax; keep only water and wind. The first sound after the silence is the most important one.
- **The freeze**: one hit (kick, cymbal, wings) and then only the reverb tail and a held chord.
- **A technique**: build back a lost beat one instrument per step; divide the beat for acceleration instead of changing tempo.
- Mix: −14 LUFS, true peak ≤ −1 dB, leave 300 Hz–4 kHz for a voice if there is one.

## 8. Native moves

- **The beat in unison.** A row or a flock changes pose on the same beat; one member doesn't. *Fits content like:* a team where one player finds their timing; a choir; a production line with one machine out of step.
- **The cascade.** The same action passes along a line, one figure per beat or half beat (take-off, a jump, a bow). *Fits content like:* a relay; a domino of decisions; a crowd standing up for an anthem.
- **The beat written on the water.** Footfalls leave ripples evenly spaced in time and space; they light up one per beat. *Fits content like:* a trail to follow; a training plan; a song's rhythm shown as a path.
- **The freeze with the sky still moving.** Everything stops on the hit, droplets in the air, while the colour keeps sinking; the camera may orbit. *Fits content like:* a record jump; a goal; a wedding kiss; the last note of a show.
- **The comic freeze.** The same device on a fall or a mistake, with a record stop. *Fits content like:* a blooper; a failed first attempt; a punchline.
- **The line across the sun.** A row of figures crosses the disc, doubled by its reflection. *Fits content like:* a caravan; a migration; a team walking out.
- **The black wipe.** A near figure crosses the lens and becomes the cut. *Fits content like:* a change of place; a jump in time; a reveal.

Our demo opens on *the beat in unison* in telephoto against the sun, uses *the beat written on the water* as its turn and *the freeze with the sky still moving* as its climax, and ends on *the line across the sun*. A new film opens and ends another way: hooves in telephoto against the disc, each footfall a kick; *the cascade* along a line in a side pan; an ending on the last figure stepping out of the disc and leaving it empty; or long shadows merging into one line across the water.

## 9. Pitfalls of the medium

- **Black on dark.** A silhouette over dark water or a violet zenith disappears. Put it in the glitter column, against the horizon band or in front of the sun.
- **Merged shapes.** Overlapping figures become one blob; at key moments leave air between contours and keep limbs in profile.
- **Unreadable spread shapes.** Open wings or limbs seen face-on lose the species or the person. Prefer profile; for birds, show flight from the side (neck forward, legs back), not a V above the body.
- **Puppet humans.** A naive forward-kinematics human reads as a marionette. Hand-key a small set of anatomically correct poses and blend them, or use animals.
- **Tiny subject in the wide.** If the subject must be small, make that the point (solitude) and keep it on light; otherwise cut closer.
- **Blocky blur.** Never fake motion blur by downscaling and upscaling the frame; sample along the motion at full resolution.
- **Cutting on every beat.** The beat lives in the poses; cuts follow sections.

## 10. Engine

- `demo/sky.js` — `SKY.make(canvas)` returns `draw(P, [silhouettes, reflections, waterLight])`: the sky, sun, water, rays, rim and halo shader. Parameters: `hor`, `fpx`, `yaw`, `cx`, `ch` (camera), `sun`, `sunR`, `ph` (colour phase 0 → 1), `vs` (gradient compression for long lenses), `pulse` (beat glow), `flash`, `rays`, `T` (noise time; hold it to freeze).
- `demo/shapes.js` — parametric silhouettes in local metres (the demo's cast; your film builds its own): `flamingo(ctx, P, seed)` (standing and walking: body spline, Bézier neck tube, head with bent bill, two-bone legs; `juv` for a young bird), `flyer(ctx, P, seed)` (flight, run and take-off: wing elevation `phi`, `sweep`, neck angle, trailing legs or planted `feet` with IK), `fluffEdge`, plus `palm`, `reeds`, `gull`, `boat`.
- `demo/film.js` — the camera (`project`, `place`, `both`: a shape into the silhouette layer and, mirrored and clipped at the waterline, into the reflection layer); beat-snapped poses (`poseAt`, `yawAt`); planted walking (`gait`, `stepEvents`); running and take-off (`makeRunner`, `runnerState`, `drawRunner`); `flapPhi` (top of the stroke on the beat); water light (`ring`, `ripple`, `runwayRing`, `droplets`, `fallDrops`, `crown`); `motionBlur`; the end card.

A minimal frame that is not in the demo, a palm and three gulls in front of a low sun (inside `film.js`, where these helpers live):

```js
clear();
const cam = { f: 3.2, hor: .62, ch: .8, cx: 0, cz: 0, yaw: 0 };
both(cam, -2, 0, 30, 1, 1, ctx => SHAPES.palm(ctx, 4, 0, 6));
for (let i = 0; i < 3; i++) { const p = project(cam, 1 + i * 1.2, 6 + i * .4, 40);
  fctx.setTransform(-12, 0, 0, -12, p[0], p[1]); SHAPES.gull(fctx, i * 2); }
draw({ T: 0, hor: cam.hor * H, fpx: cam.f * H, yaw: 0, cx: 0, ch: cam.ch, sun: [.04, .01], sunR: .05, ph: .3, pulse: 0, flash: 0, rays: 1, vs: 1.6 }, [LF, LR, LX]);
```

## 11. Variation space

The agent decides the structure, the cast (animals, dancers, athletes, vehicles), the place of the light (sunset, sunrise, a lit stage wall, a full moon), the beat and tempo, the colour journey within the warm range, the opening and the ending.

- **Structures**: a countdown to sundown where each section is one beat faster; a call and response between two groups on opposite banks; four places at four moments of one evening, one gesture each.
- **Openings**: hooves in telephoto against the disc, each footfall a kick; a lone runner on a ridge, steps as the click track; a row of hands clapping in profile, one missing.
- **Endings**: a crowd freezes mid-jump as the sun drops below the horizon; the last figure steps out of the disc and leaves it empty; long shadows of everyone merge into one line across the water.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
