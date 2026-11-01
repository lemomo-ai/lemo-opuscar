# Stickman Action — Style Prompt

> Black stick figures on a sheet of off-white paper, animated with the fluid, physics-driven choreography of early-2000s web Flash animation: a circle head, five round-capped strokes, one ground line, and motion that carries everything. Anime action grammar (held stances, hit-stop, impact frames, speed lines, slow-motion peaks) gives it its rhythm.
> References (grammar only): the web Flash stick-fight shorts of the early 2000s in general (side-on readable choreography, weight from motion alone, the paper as the whole world); Japanese TV action animation (anticipation holds, smear frames, impact frames, speed-line backgrounds, the frozen pass-through strike). Learn the grammar; never copy a specific short's characters, cursor or desktop gags, moves, music or titles, and never name them in the film.

## 1. Essence, and what it is not

What makes a frame read as this style at a glance:
1. **The figure is five strokes and a disc**: a filled black circle head, a spine, two two-bone arms, two two-bone legs, all one stroke weight with round caps and joins. No hands, feet, faces, clothes or outlines. Character lives in pose and timing.
2. **The paper is the world**: a flat off-white ground, one ink ground line, a soft contact shadow under each figure. Props, when needed, are flat black silhouettes in the same ink.
3. **Motion is the content**: smooth 24 fps on ones, with weight (anticipation, arcs, follow-through, gravity) and anime punctuation: holds before strikes, hit-stop on contact, one- or two-frame impact frames.
4. **One accent per figure, only on energy**: trails, sparks, auras, beams. Bodies stay ink black.

Not Pictogram Motion (geometric signage figures, beat-locked cards), not Whiteboard Explainer (a hand drawing with a marker), not One-line Drawing (a single continuous contour), not a doodle comic (wobbly boiling pen line, speech balloons). Lines here are clean and steady; the drawing never boils.

## 2. Materials & rendering

- **Strokes.** Canvas 2D paths, `lineCap` and `lineJoin` round. Stroke width is a property of the figure in world units, about **1/13 of the figure's standing height**, and scales with the camera like everything else in the world. Head diameter ≈ 2.3 stroke widths × 2.2 (about 1/5.5 of the height), always filled.
- **No outline.** Figures are plain ink strokes straight on the paper, never outlined or haloed. Readability comes from staging instead: side-on poses, space between the fighters, and the far arm and leg drawn first and 12–18 % lighter (ink mixed toward paper), never coloured.
- **Rig.** A skeleton with fixed bone lengths: hips → spine → neck → head; shoulders and hips each carry a two-bone limb solved by analytic IK (target point + bend direction). Poses are keyframes of joint angles or end-effector targets, interpolated per frame; nothing is drawn by hand-moving points. Bone lengths never change except in a deliberate smear (§8).
- **Ground and contact.** One horizontal ink line, slightly thinner than the figure stroke, extending past the frame. Feet planted on it are locked to it (IK target pinned) until they lift. A flat grey ellipse under each figure shrinks and lightens with height above the ground: the only shading in the style.
- **Paper.** A warm off-white with a very faint, static grain fixed to the screen (not the world), plus a soft vignette. No paper texture moves, no line boils.
- **Effects** (sparks, speed lines, dust, shockwaves, cracks) are flat shapes: ink, paper or the accent, never gradients except the soft glow of an energy accent. Dust puffs are paper-coloured discs with ink outlines that pop and shrink.

## 3. Colour logic

- **Two neutrals carry the film**: paper (warm off-white) and ink (near-black, not pure #000). Everything solid is ink.
- **Accents are energy, not identity of the body**: each fighter or force owns one saturated hue, used only for its trails, sparks, aura, beam and the underline of its name. Two forces → two hues, far apart on the wheel (red–cyan, orange–violet). Never colour a limb, head or prop.
- **Impact frames invert** the scheme for one or two frames: ink ground, paper-white figures, accent sparks.
- One mood shift at most (a dusk-tinted paper, a darker ink wash for night) and it is applied to the paper, not by filtering the figures.
- Example only: paper `#f3efe6`, ink `#16151a`, accents `#e8343a` and `#1fb5e8`.

## 4. Type & subtitles

- Titles and callouts: a heavy condensed sans (e.g. Anton, OFL) in ink, set large, with a thick accent bar under or behind them; they slam in on a hit (scale 1.3 → 1 in 3 frames, one-frame hold of an offset ink shadow). CJK: a heavy sans (e.g. Noto Sans SC Black, subset).
- On-screen sound words or move names, if used, are part of the drawing: ink letters, tilted, held ≥ 1 s.
- Subtitles: a semi-condensed sans (e.g. Barlow Semi Condensed 600, 46–54 px) in ink with a 7–9 px paper-colour outline, centred ~90 px above the bottom; they never sit over a figure's contact point. Hold ≥ max(1.8 s, speech + 0.6 s).

## 5. Motion quality

- **On ones (24 fps)** for figures and camera alike: the Flash smoothness is the look. Stepped animation is reserved for one deliberate effect (a stuttering hit-stop shake).
- **Every action is anticipation → action → follow-through → settle.** Anticipation is a held pose (6–12 frames before a big strike), the action takes 2–4 frames, the follow-through overshoots and settles with a spring.
- **Hit-stop**: on a clean hit both figures freeze for 3–5 frames while the camera shakes and sparks burst, then motion resumes.
- **Gravity is real and consistent** (pick one g in body heights per second² and keep it); jumps are parabolas, falls accelerate, bounces lose energy.
- **Arcs**: fists, feet and heads travel on arcs, never straight tweens between far poses.
- **Ease families**: strikes snap (ease-out, expo-like); recoveries and floats ease in-out; landings stop dead with a 2–4 frame squash of the knees.
- **Smears** replace motion blur: for any limb moving more than ~1/3 of the figure height in one frame, draw the in-between positions of that limb (sub-frame samples) as fading strokes.
- **What never moves**: the ground line (except when it cracks), the paper grain, the head size.

## 6. Camera grammar

A vocabulary, not a route. Opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Locked wide, side-on | readable choreography, fairness | an exchange of blows; a dance; a demonstration |
| Slow push on a held stance | tension before the strike | a standoff; a decision; a countdown |
| Punch-in zoom on impact (+ shake) | force | a hit; a landing; a slammed door |
| Whip pan following a dash | speed, a change of place | a chase; a rush to a goal; a sudden arrival |
| Tracking run with a scrolling ground | momentum | a race; a journey; a pursuit |
| Dutch tilt | imbalance, losing control | being overwhelmed; a fall; a turn of fortune |
| Slow-motion time remap | the peak, every detail | the decisive clash; a catch; a near miss |
| Low angle (ground line low in frame, figures towering) | power, scale | a giant; a victor; a challenger rising |
| Crane up / pull back to the whole sheet | aftermath, the world is paper | an ending; a reveal of scale; a map of a route |

Framing: in a fight, keep both figures in frame and side-on, with clear space between them unless they are in contact; the active figure fills ≥ 1/3 of the frame height at key moments. Keep the lower ~110 px free of contact points when subtitles are up. Transitions: cuts on hits, whip pans, impact-frame cuts, an ink wipe (a black stroke swept across the frame); no dissolves.

## 7. Sound palette

- **Score**: driving and percussive: breakbeat or rock drum kit, taiko and big toms for the anime weight, distorted synth or electric bass, short brass or synth stabs on hits, a single breathy flute or a sustained string for the standoffs. Tempo may double-time into a clash and drop out for a hold.
- **Foley (stylised, the figures are ink, not flesh)**: whooshes pitched and lengthened by limb speed, punches as a layered low thump + sharp snap, blocks as a dry wooden clack, footfalls as soft paper taps, slides as paper scrapes, body falls as a thud with a paper rattle, energy as hiss and crackle, the ground cracking as a dry rip.
- **Silence is a weapon**: one held stance in near-silence (wind only), then the first sound after it is the strike. Hit-stop frames may cut the music for their duration.
- Mix: foley forward, music ducked under impacts rather than voice; voices, if any, short shouts or a narrator, voice ~10 dB over music; −14 LUFS.

## 8. Native moves

A menu: use the ones your story needs.

- **Hit-stop + impact frame.** Freeze both figures 3–5 frames, invert the frame for 1–2 frames with radial speed lines, then release with a spark burst. *Fits content like:* a deal closing; a goal scored; a key turning in a lock; a stamp on a passport.
- **The paper is the world.** Figures use the frame and the ground line as objects: the line cracks, a figure is knocked off the edge of the sheet, climbs over the frame border, or grabs the line and bends it. *Fits content like:* breaking a record; a product escaping its box; a deadline line on a chart; a border crossing.
- **Smear trail.** Fast limbs leave sub-frame ghost strokes in the accent colour fading to ink. *Fits content like:* a chef's knife work; a pianist's hands; a skateboard trick; a sorting machine.
- **Clash of two forces.** Two accents meet at a point: a radial shockwave ring, sparks split in both hues, the ground dust blown both ways. *Fits content like:* two ideas debated; two brands compared; supply meeting demand; a tug-of-war.
- **Slow-motion peak.** Time slows to 10–20 % around one moment while sound drops to a low hum, then snaps back to full speed. *Fits content like:* a catch at the boundary; a glass about to fall; the exact second of a launch.
- **Pass-through strike.** Two figures dash past each other, freeze back-to-back in a held silence, then one gives way. *Fits content like:* a negotiation's last offer; an exam's last question; two runners at the line.
- **Drawn into being.** A figure or prop is drawn stroke by stroke in ink (the strokes animate along their length) before it moves; exits can be erased the same way. *Fits content like:* a step-by-step tutorial; a character introduction; an idea taking shape.

## 9. Pitfalls of the medium

- Limbs that stretch or shrink between keys look broken → solve with fixed-length IK; only smears may stretch.
- Knees and elbows flipping direction mid-move → give every limb an explicit bend side and keep it unless the pose changes deliberately.
- Feet sliding on the ground → pin planted feet with IK targets until they lift.
- Two black figures merging into one blob → side-on staging, clear space between them, the far limbs lightened; never fix it with an outline.
- Fast motion strobing at 24 fps → smears for limbs that move more than ~1/3 of the figure height per frame.
- Action too fast to read → holds before strikes, hit-stop on hits, never more than one new action every ~0.4 s for a reader to follow.
- Line weight changing when the camera zooms → stroke width in world units, transformed with the camera.
- Floaty jumps → one gravity constant for the whole film; check apex timing (a jump of one body height peaks in ~0.3 s).
- Effects in too many colours → accents only on energy, one hue per force.

## 10. Engine

In `demo/`: `stick.js` (rig: `figure(pose)` builds joint positions from angles and IK targets with fixed bone lengths, `drawFigure(g, J, o)` draws the ink strokes with far-limb lightening, `lerpPose`, `ik2`), `moves.js` (pose library and keyframe tracks: stance, guard, punch, kick, dash, jump, block, hit, fall, rise), `fx.js` (smears, speed lines, sparks, dust, shockwave, ground cracks, energy aura and beams), `cam.js` (world → screen camera with zoom, pan, shake, tilt, time remap), `main.js` (shots, paper, title cards, sound events), `music.py` (synthesised score), `mix.py`. A minimal new use: one figure skipping rope, with the rope as a flat ink arc and its slap on the ground as a dust puff, drawn with `figure`, `drawFigure` and `dust`.

## 11. Variation space

You decide the structure, the characters (how many, how they differ by build, stance and timing alone), the world (a bare sheet, a few ink props, a notebook margin), the accents, the opening, the ending, the camera path and the pacing.

- Structures: **a training montage** (one figure, the same move failing then landing, the ground line marking progress); **a relay** (an object passed from figure to figure across the sheet); **a dance battle** (two figures answering each other's moves, the beat as the referee).
- Openings: **a figure drawn into being** by an unseen pen; **a fall into the frame from above** landing on the ground line; **an empty sheet and a sound** before anything appears.
- Endings: **the camera pulls back** to show the whole page with every mark left by the action; **the figure is erased** stroke by stroke; **a handshake held** in silence while dust settles.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
