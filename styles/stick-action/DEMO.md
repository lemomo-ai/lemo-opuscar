# Stickman Action — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Last Stroke* 《最后一笔》 (57.5 s) · `stick-action.mp4` · source in [`demo/`](demo/)

## Story & structure

Two rivals drawn on the same sheet of paper fight until one stroke decides it, then help each other up. No dialogue; the title and the end card are bilingual.

Arc: the ground line draws itself and RED and BLUE are drawn into being at either end → a standoff under the title → a fast exchange that BLUE wins with a kick (hit-stop + impact frame) and a spinning back kick that sends RED clean off the left edge of the sheet → silence over the empty edge, then RED's hands grip the end of the ground line and he climbs back onto the paper → both power up, fists meet at the centre and the ground line cracks in slow motion → the last stance in near-silence, one pass-through, a freeze back-to-back, BLUE falls and RED drops to a knee → RED walks over and offers a hand → the camera pulls back to the whole sheet on the desk with every crack and scuff still on it.

Native moves spent: drawn into being (the opening), hit-stop + impact frame (BLUE's kick, the clash), the paper is the world (knocked off the sheet, climbing back over the edge, the cracked ground line kept to the end), smear trails (every fast limb), clash of two forces (red and cyan), slow-motion peak (the clash at 20 % speed), pass-through strike (the decision).

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0–2.4 | the ground line draws itself | locked wide | drawn into being |
| 2 | 2.4–5.2 | RED, then BLUE, drawn stroke by stroke | slow push | drawn into being |
| 3 | 5.2–11.0 | standoff; title slams in at 6.86 | slow push | held stances, wind |
| 4 | 11.1–17.1 | dash and the exchange: blocks, a high kick ducked, a sweep jumped, a flurry, a lock | locked wide, small shakes | smears, block sparks |
| 5 | 17.14 | BLUE's kick: 4 frames of hit-stop, 2 inverted frames | punch-in, dutch | hit-stop + impact frame |
| 6 | 17.6–19.6 | spinning back kick; RED tumbles across the sheet and off its left edge | whip pan left | the paper is the world |
| 7 | 19.6–24.6 | the empty edge, wind; hands grip the end of the line; the climb | locked close on the edge | ink exists only on the paper (clipped) |
| 8 | 24.8–27.4 | RED dashes back; cut to the two-shot, RED skids in | whip pan, cut | |
| 9 | 27.4–32.6 | power-up: two auras | low, tilted, slow push | accents only on energy |
| 10 | 32.6–35.4 | dash; fists meet; shockwave; the line cracks; 20 % slow motion; the snap | punch-in to 2×, dutch 9° | clash of two forces, slow-motion peak |
| 11 | 35.7–41.1 | the last stance, wind only | locked wide, slow push | silence as a weapon |
| 12 | 41.2–44.4 | pass-through: 2 white frames, freeze back-to-back, BLUE falls, RED kneels | locked | pass-through strike |
| 13 | 44.8–50.6 | RED walks over, offers a hand, pulls BLUE up | follow, push | |
| 14 | 50.6–57.5 | pull back to the whole sheet on the desk; end card | pull back to 0.32× | the marks stay |

Stills: [the exchange](demo/stills/frame_exchange.jpg) · [the impact frame](demo/stills/frame_impact.jpg) · [the climb back over the edge](demo/stills/frame_edge.jpg) · [the pass-through](demo/stills/frame_pass.jpg) · [the hand up](demo/stills/frame_hand.jpg) · gallery card: [styleframe.jpg](demo/stills/styleframe.jpg)

## Score structure

Original score synthesised in numpy (`demo/music.py`): 140 BPM, D Dorian. No music while the figures are drawn (pen scratches only); a low drone and a breathy flute for the standoff, a taiko hit and a brass stab on the title (bar 4); a broken beat with taiko, a distorted bass riff and short stabs on the blocks for the exchange (bars 7–10). The band cuts for the 4 hit-stop frames at 17.14 s and falls away as RED goes off the page; the climb is a drone with taiko pulses that speed up; the power-up is double-time drums, 16th-note bass and a riser. The clash's slow motion keeps only a low pitched-down hum, the snap brings one bar of full band, then the last stance is wind and one flute note. The handshake gets the flute melody over strings and lifts to F major on the pull-up.

Foley (`demo/mix.py`, from the page's `window.EV`): pen scratches, swishes pitched by limb speed, wooden clacks for blocks, thump + snap for hits, paper taps for steps and landings, paper scrapes for skids and the climb, a ground rip and boom for the clash, a metallic slash for the pass. Mix: music ducked ~3 dB under the big impacts, a zero-phase low shelf (−10 dB below 120 Hz) to keep the taiko from swamping small speakers, two-pass loudnorm to −14 LUFS.

## Palette & props

- Paper `#f3efe6`, ink `#16151a`, desk `#2f2a27`; RED's accent `#e8343a`, BLUE's `#1fb5e8`.
- RED: 290 units tall, a longer spine, low wide stance, fists high. BLUE: 320 units tall, longer legs and arms, upright guard with one hand forward. Same stroke weight (height / 13) and ink; they differ only by build, stance and timing.
- The sheet is a 3000 × 2300 rectangle on a dark desk; every figure and effect is clipped to it, which is what makes "off the page" literal.
- Kept marks: the crack at the centre (from 33 s), grey scuffs where feet landed or skidded.

## End card

The pulled-back sheet with "LAST STROKE / 最后一笔" in Anton and Noto Sans SC Black over a red–cyan split bar, then two lines on the desk: 火柴人动作 · STICKMAN ACTION and `khubaib-ctrl × LemoLab × Claude Opus 5.5`. khubaib-ctrl made this style and its demo. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/stick-action/demo/
  stick.js   rig: proportions, figure (FK + two-bone IK), lerpPose, drawFigure (ink, far limbs lighter), drawFigureDrawing, shadow
  moves.js   pose library (stance, punch, block, kicks, dash, jump, tumble, hang, kneel, lying, offer…) + track() keyframes
  fx.js      paper, ground line + cracks, smear, sparks, speed lines, dust, shockwave, aura
  cam.js     world → screen camera (zoom, dutch, shake)
  main.js    tracks for both figures and the camera, the action list (effects + sound events), titles, TEXTS
  music.py   score → out/score.wav        mix.py  foley + beds + score → out/mix.wav
  tools/fonts.py   subsets the OFL fonts into fonts/ (gitignored .woff2)
```

`sh styles/stick-action/demo/build.sh` runs fonts → events → picture (24 fps, 4 workers, ≈ 1 min on an M-series Mac) → score → mix → master (no grain) → readcheck → poster and stills. For review, `node core/render/still.mjs styles/stick-action/demo --range 0.5:57:1` and strips at 0.2 s around 17.14, 22–24 and 41.2.

Every key is a full pose; `track()` turns airborne leg angles into foot targets so all keys interpolate the same way and bone lengths never change. A key's ease shapes the segment arriving at it (`o` snap for strikes, `io` for recoveries, `i` for falls, `h` for a cut). Hit-stops are just two equal keys 4 frames apart. Effects read their age from a separate clock that runs at 20 % inside the slow-motion window.

Pitfalls met with this demo's props:
- The impact frame inverted the sparks too (cyan turned orange): the sparks are redrawn in their true accent after the inversion.
- Hands gripping the very edge of the sheet were invisible: the grip sits 16–30 units inside the paper so the forearms read.
- At the standoff distance the figures were too small; the opening camera starts at 1.25× and the rivals at ±450.
- A causal low-pass subtracted from the mix boosted the lows instead of shelving them; the shelf uses zero-phase filtering.
