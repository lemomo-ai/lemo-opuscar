# Brick Toy — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Rocket from Spare Parts* (54 s) · `brick-toy.mp4` · source in [`demo/`](demo/) · asset credits [`demo/CREDITS`](demo/CREDITS)

## Story & structure

A brick astronaut builds a rocket; it collapses; he rebuilds it from the fallen parts and flies to the "moon" (a stack of books). Failure isn't the end, it's just spare parts. One character, one goal.

The approach: turn the topic into something being built and use at least three of the four native powers; the demo uses all four: snap-together building (open on one brick, end on one brick), break without harm (the collapse becomes the parts for a better rocket), toy on a real desk (a teapot is a mountain, a stack of books is the moon, the lamp is the sun), hand-made stop-motion (12 fps, even the flames and smoke are bricks). Other adaptations: a product launch → the product is assembled brick by brick; a love story → two characters build a bridge between two books; a history lesson → an era is built, falls, is rebuilt.

Arc (45–60 s, as written for this film): curiosity → excitement → a setback (collapse) → a quiet beat → rebuilding → climax → a warm scale-reveal. Acts: opening 0:00–0:06 (one red brick, the first snap), act one 0:06–0:18 (fast building, pride), act two 0:18–0:30 (collapse, silence, picking up the parts), act three 0:30–0:50 (countdown, ignition, launch, landing on the moon), end card after.

## Shots

| Beat | Camera |
|---|---|
| Opening | Extreme macro on one brick, slow push, background blurred to real props |
| Building | Low angles make the tiny character heroic; cut every bar |
| Setback | Handheld shake on the collapse, then a **low, wide, lonely** frame with the character small |
| Emotional beat | Close-up from the front, character's hands and the brick in focus |
| Climax | Low angle following upward; then a **tracking shot** alongside the rocket with the moon (books) visible ahead |
| Ending | Slow pull-back to a high wide shot of the whole desk: the scale reveal |

Each of these is one choice from STYLE.md §6 made for this story, not the style's default opening or ending.

Lens settings as used: aperture ~500–700 for close-ups, ~800 for mediums, ~400 for the final wide. Snap overshoot 0.35 stud → 0 in ~0.17 s. Collapse gravity ~420 studs/s² (true would be 1225), restitution ~0.3.

## Score structure

Two Kevin MacLeod tracks (CC BY 4.0), edited to the picture by `demo/music/edit.py`: "Monkeys Spinning Monkeys" (playful, cut on bars) for building, the same theme returning quietly for the rebuild, "Heroic Age" as the orchestral swell for the climax. The edit makes the climax hit land on ignition and the final chord land on the end card (bar-aligned jumps, chroma similarity at the joins). `story.js` times are aligned to the music bars.

Silences: music cut dead on the collapse, leaving room tone and a ticking clock; music pulled out again before the climax, with a low heartbeat drum under the countdown.

Foley specific to this film: ignition boom and rocket roar; radio chatter with Quindar beeps.

Voice: warm British storyteller, Kokoro `bm_george`, speed ~0.9, 4–6 short lines; mission control is `am_adam` through a radio filter (band-pass 380–2800 Hz + soft saturation) with Quindar beeps. Every line verified with whisper. Voice compressed, music ducked ~40 % under voice, −14 LUFS.

## Palette & props

- Classic brick palette: red `#c91a09`, blue `#0055bf`, yellow `#f2cd37`, green `#237841`, white `#f2f2ee`, black `#1b2a34`, plus orange, light/dark grey, tan, azure. Bevel radius 0.06; baseplate matte green (full clearcoat turns it cyan).
- Set: walnut desk (Poly Haven `american_walnut_veneer`), `photo_studio_loft_hall` HDRI, tea set (teapot mountain, cup), pencil, books (the moon), desk lamp (the sun). Key light `#fff4e8` from upper left; softboxes key front-left, cool rim behind, one over the finale set. GTAO radius ~3.5 studs, scale 2.5. Grade: contrast +0.26, saturation ×1.1, slightly cool.
- The astronaut: 1×1 columns for legs, a 2×2 brick torso, round-brick arms, a round 2×2 helmet with a curved visor panel.
- The rocket, fire (translucent orange/yellow round plates jittered every frame), smoke (white round bricks that grow and roll outward), the moon (grey round plates with crater tiles).
- Subtitles: a dark rounded pill `rgba(18,20,26,.62)` centred 150 px above the bottom, Fredoka 600 46 px white, a small yellow 2×1 brick icon on the left. Radio lines get a red brick icon and a "MISSION CONTROL" tag.
- Title: "Rocket from Spare Parts", Fredoka 700, popping in on 12 fps steps, with the yellow sub-line "A BRICK TOY FILM".

## End card

The darkened final wide, the title (Fredoka 700), a brick icon, "BRICK TOY · LEMO-OPUSCAR" in yellow, the "LemoLab × Claude Opus 5.5" line and the asset credits. That sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card (remove the line drawn in `main.js` if you adapt it).

## Build notes

```
styles/brick-toy/demo/
  bricks.js   geometry + plastic materials        rockets.js  props, physics, fx
  actors.js   brick-built character rig            set.js      desk, HDRI, real props, moon
  story.js    timeline aligned to music bars        main.js     acting, cameras, subtitles, events
  lines.json  voice script    mix.py  foley+voice+music    music/edit.py  score edit
```

1. `node core/render/still.mjs styles/brick-toy/demo <t…>`: review stills, iterate.
2. `.venv/bin/python core/tts/tts.py lines.json voices` → `core/tts/asr_check.py` to verify.
3. `node core/render/events.mjs styles/brick-toy/demo` → `python music/edit.py` → `python mix.py`.
4. `node core/render/video.mjs styles/brick-toy/demo --fps 24` (1296 frames with 2× SSAA + GTAO ≈ 65 s on an M4 Pro).
5. `core/render/mux.sh out/video24.mp4 mix.wav brick-toy.mp4 24`.

Pitfalls tied to this demo's props:
- Build the helmet visor as a curved open-cylinder panel: a sphere segment disappears inside the cylinder helmet.
- Follow the launch with a tracking shot aimed at the moon: a rocket simply accelerating upward becomes a dot on a blank wall.
- Keep props such as the desk lamp off the camera axis of later shots, or they sneak into the background.
- Move the camera on ones: stepping it at 12 fps like the animation looks unsmooth.
- Keep spare-parts piles away from the frame edges, where they block the lens.
