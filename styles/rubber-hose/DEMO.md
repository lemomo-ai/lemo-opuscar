# 1930s Rubber Hose Cartoon — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Coffee Cup Chase* (50 s) · `rubber-hose.mp4` · source in [`demo/`](demo/)


## Story & structure

A just-woken diner mug tastes itself: bitter! It chases a runaway sugar cube around the kitchen (counter, china cabinet, sink). When the cube is about to be sucked down the drain, the mug stretches its rubber-hose arm around the whirlpool and fishes it out, then sadly lets it go; the cube jumps into the mug by itself. The coffee turns sweet and the whole kitchen dances with the band. A 1930s radio sports announcer calls the chase like a horse race ("And they're off!").

Arc (40–55 s): hook on frame 1 (bouncing title letters, band hit) → a small want → a chase in 3 escalating set pieces, one visual gag each → danger → the stretch → dead silence → a quiet, kind turn → release: the whole world dances → iris out with a gag. One hero, one goal, one turn.

The demo's shape: the strongest native power at the peak, and **a chase or a performance inside one lively location** (a kitchen, an office, a toy shop, a factory) with a supporting cast of 5–8 living objects. That is one way to adapt a topic, not a rule of the style.

Native moves spent:
- **Everything breathes on the beat**: the kitchen is a character; at the climax the whole world dances in sync, walls included (the payoff shot).
- **Mickey-mousing**: a stair of plates is a xylophone; the small character climbs it on rising xylophone eighths, the big one on tuba quarters.
- **Rubber-hose stretch**: the turning point; the mug's arm stretches around a whirlpool and down a drain in one unbroken shot.
- **The film is a physical object**: the title card rolls up like a window shade; a character's glove pulls the iris shut.

## Shots

| Beat | Camera |
|---|---|
| Opening | Title card with rotating sunburst; letters hop in a wave each beat; the card rolls up like a window shade to reveal the set |
| Establishing | **Stage-wide, locked off**, eye level. The set reads like a proscenium; props lined along the counter |
| Reaction gag | Hard cut to a close-up of the face (the only big face shot early on) |
| Chase | **Trucking pan** alongside the runners, eased start and stop; the destination prop enters frame before the gag |
| Vertical set piece | Not the whole set piece far away: each climber followed in a **medium shot** (character ≈ 1/4–1/3 of frame height) so each musical step and the plate's bounce reads; cut between climbers; then tilt down with the fall |
| Danger | Slightly high angle so the hazard reads at a glance; **one unbroken shot** through the big stretch |
| Quiet turn | Medium two-shot, then the hero's **back** walking away small in the background while the other character is big in the foreground (on a foreground counter piece) |
| Climax | Pull back from a close-up to a **medium-full** shot (not a far wide: faces must read): hero in the middle, living props on the counter behind, and a **foreground row of bigger dancers** on a nearer counter piece. 2–3 steps by bar (sway → kicks → group squat-and-spring), then **everyone freezes in a ta-da pose on the last beat** and holds into the iris |
| Ending | Iris closes on the heroes; a character's glove pulls it shut |

The hesitation beat before the leap, as held-frame acting: crouch (hold) → eyes to the other character's back (hold) → eyes up to the goal (hold) → back → up + grin → small hop → leap. Each glance on an eighth note, with a woodblock tick, while the camera slowly pushes in. The music stops for a "lock eyes" beat and everything freezes, background breathing included.

## Score structure

Original big-band score (`demo/music/score.py`, VSCO 2 CE / VCSL samples via `core/audio/sampler.py`, banjo via `pluck.py`). **144 BPM, 4/4 → 1 beat = 10 frames**, 1 bar = 1.667 s, 28 bars. One original 4-bar syncopated theme, stated for the title, the chase, a slow solo-clarinet version for the tender beat, and a key-change full-band out-chorus for the climax.

Stops (hard silence including reverb tails) on the lock-eyes beat, on the suspense before a gag, and a full 2 beats of silence right after the stretch; stingers on every gag; slide whistle for every stretch / slide / fall; the xylophone *is* the plates. The projector clatter is the only sound inside the silence.

Foley specific to this film (all synthesised): porcelain = hard inharmonic partials (~2.7 / 4.2 / 6.3 kHz) + tiny transient; thick mug = lower, duller partials; sugar = high woodblock + sparse crunch; clock = 18 Hz hammer on two bells; toaster = click, eighth-note ticks, bell + spring "boing"; water = filtered noise + rising blips, drain slurp, bubble bed; rubber = sawtooth creak through a band-pass.

Voice: an old radio announcer calling the action like a horse race (Kokoro `bm_lewis`, speed 1.0), 7 short lines ("Seven a.m., folks!" … "Good night, folks!"). Chain: HP 260 Hz / LP 4.6 kHz, tanh saturation, a short room, compression. Music ducked ~8 dB under the voice. Optical pass: band-limit 110 Hz–6.2 kHz, wow 0.6 Hz, flutter 7 Hz.

## Palette & props

- Grey ramp: paper `#F1EEE6` · light `#C8C5BC` · mid `#9A978F` · dark-mid `#6B6963` · dark `#3B3A37` · ink `#0E0D0C` · character white `#FCFBF7`.
- Contrast (the grey ramp alone reads too flat): walls `#8C8981`, tiles `#A29F97`, cabinets `#66635D`–`#7C7972`; `contrast(1.14)` in the final composite.
- Ink outline 6 px in screen space; limbs 13 px on a 280 px character; film damage: gate weave ±1.2 px with a rare 3–6 px jump, vignette 0 → 62 % black at the corners, 3 px vertical jump on every cut, 0.55 px blur; walk bob 10 px (sad walk: steps 34, bob 4), run lean 0.24 rad.
- **The Mug** (hero): a squat diner mug, white porcelain, two thin black rings at the rim, full of black coffee (black ellipse + a white crescent highlight); face on the body, pie eyes, small black nose, big mouth; handle at the back like a little tail. Its **steam** carries the mood: lazy waves / bitter zigzag / straight-up alarm / wilted droop / heart.
- **The Sugar Cube**: a real projected 3D cube with a slight top-down view (elevation ≈ 0.26 rad), face mapped onto the front face with an affine transform.
- **Kitchen cast** (living props, all taking a breath phase): pots, a clock, a toaster, plates, curtains. Background motifs: striped wallpaper with small diamonds, square tiles, panelled cabinets, black-and-white checker floor, hanging lamp. Two cached backgrounds: kitchen; cupboard + sink.
- Deliberately not learnt from the references: no existing character (cat, girl, clown), no title-card or theme copy, no period racial caricature; the mug's whole body is the mug (no human torso, no straw, no shorts), unlike *Cuphead*'s design.

## Titles & subtitles

- Subtitles: "the announcer's title card": plate `rgba(12,11,10,.92)`, white double-rule border, dot-and-ring corner ornaments and a tiny 1930s ribbon-microphone icon; IM Fell English SC 36 px, paper white; bottom at y ≈ 986 by default, top when the action is low. Each card ≥ speech + 0.6 s.
- Title: Shrikhand, white face, 14 % ink outline, ink drop shadow down-right, letters hopping in a travelling wave on the beat over a rotating sunburst; sub-line in Limelight caps.

## End card

Same sunburst, a wavy-edged sign with "The End", the style name, `LemoLab × Claude Opus 5.5`, small credit lines at the bottom; it opens with an iris from black. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/rubber-hose/demo/
  toon.js    constant-width ink + line boil + affine stack      film.js   4:3 gate, weave, flicker, scratches, vignette
  chars.js   mug & cube rigs, pie eyes, gloves, shoes, steam     cast.js   living kitchen props (all take a breath phase)
  bg.js      cached watercolor backgrounds (kitchen, cupboard+sink)
  story.js   144 BPM bar grid, VO times, subtitle cards, shots, key moments, music cues  (single source of truth)
  scenes.js  every shot: camera, props, acting            events.js  foley event list → events.json
  ui.js      title lettering, announcer title card        sheet.js   model sheets (?mode=sheet / ?mode=kitchen)
  music/score.py  original big-band score (VSCO 2 CE / VCSL samples via core/audio/sampler.py, banjo via pluck.py)
  mix.py     foley synthesis + radio-voice chain + ducking + optical-track aging
  build.sh   one-command rebuild (≈9 min, mostly TTS/whisper/sample loading; frames render in ~50 s)
```

1. Write the bar grid first (`story.js`), then the cue map; score to it (a forked sub-agent can write `music/score.py` in parallel from `story.js` + the cue list).
2. Model sheets: `node demo/tools/still.mjs demo 0 --q 'mode=sheet&w=2880&h=1620' --w 2880 --h 1620`.
3. `core/tts/tts.py lines.json voices` → `core/tts/asr_check.py`.
4. Review: `core/render/still.mjs demo --range a:b:1` + `core/render/sheet.py` (two full passes), and frame strips at 1/12 s on key acting beats.
5. `node core/render/events.mjs demo` → `python music/score.py` → `python mix.py`.
6. `node core/render/video.mjs demo --fps 24 --workers 3` → `sh core/render/mux.sh out/video24.mp4 mix.wav rubber-hose.mp4 24 3` → `python demo/tools/final_asr.py rubber-hose.mp4`.

Or simply `sh styles/rubber-hose/demo/build.sh`.

Pitfalls tied to this demo:
- **Kokoro's "bitter" is heard as "better"** after an ellipsis (`is... bitter!`). "And boy, is this coffee bitter!" passes. Check every line with whisper; also check the final mp4 (whisper writes "7am" / "they're": normalise before comparing).
- The cube reads as a tall box in pure front view: use elevation ~0.26 and a slight 3/4 turn for expressions.
- A far shot of the plate-xylophone and of the dance climax kills both gags: shoot them medium / medium-full.
- A kicking leg drawn behind the mug body is hidden by the handle: kick outward past the silhouette.
- A prop can "grow" out of a character's head at one camera position (a pot out of the mug's head): check every shot's final frame.
- A leap arc that is too high leaves the frame; keep arcs inside the gate at the camera's zoom.
- `sfx`-style clips of different lengths → numpy broadcast errors. Place clips into a fixed-length buffer (`seq()` in `mix.py`).
- zsh: `echo =====` fails (`=word` expansion) and `timeout` doesn't exist on macOS.
- JS: `-x ** 6` is a syntax error; write `-(x ** 6)`.
