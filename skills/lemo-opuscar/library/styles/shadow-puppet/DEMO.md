# Shadow Puppetry — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Hou Yi Shoots the Suns* (54 s) · `shadow-puppet.mp4` · source in [`demo/`](demo/)


## Story & structure

Ten oil lamps burn as ten suns; each time the archer Hou Yi shoots one down, a lamp behind the screen goes out, until only the last lamp is left, and that lamp is the one lighting the play. One character, one goal (shoot down the suns that scorch the land), one turn (the tenth arrow is already nocked and he stops, leaving one sun).

The core idea: *each sun is a lamp* and each arrow puts one out, so the frame literally steps darker. One lamp at the start (the show begins); at "ten suns" nine more light behind the cloth, the screen whitens, overexposes and the colours bleach; every sun shot down snuffs a lamp and the colour steps back to warm gold. The end goes behind the screen: the "sun" was a lamp and the "sky" a cloth a metre wide, so the story's ending (one sun is enough) and the medium's truth (a shadow play needs one lamp) close in the same shot. Echoes: 1 lamp → 10 → 1; clapper at the start ↔ clapper at the end; title plaque ↔ end-card plaque.

How the demo adapted its topic: the lamp was the sun, and what went off the screen was each golden crow as it died. (The same question works for any topic: a product launch → the product is the lamp that finally lights the screen; a memory → figures lift off the cloth and blur as they are forgotten.)

Arc (54 s): a lamp lights in the dark → a world appears on the cloth → trouble arrives (ten lamps: the light changes) → the hero's entrance and freeze pose → the shooting, set to percussion → a silent choice → the world restored → go behind the screen → end card on the cloth.

Native moves spent: the light is the world (lamp count = sun count), off the screen (the crows tumble off and dissolve into light), carved and translucent (Hou Yi's open-cut face), hand-held (plumes and legs on pendulums), go behind the screen (after the climax, as the echo).

## Shots

| Beat | Camera |
|---|---|
| Opening | Audience seat: full stage frame with children's heads. Black until a match flares behind the cloth. Very slow push. |
| Into the story | Push through the frame until the cloth fills the screen. |
| Disaster | 1.5× lateral pan across the burning land (give the disaster area). |
| Hero entrance | 1.15× follow; on the freeze-pose gong, a 5-frame **crash zoom** (the percussion accent becomes a camera move). |
| First action | Close on hands/bow/face, then a whip pan along the arrow to the target. |
| Repetition | **Locked wide** so the audience sees every step of the change (nine lamp-steps of darkening). |
| The choice | Medium-close with the target at the far edge: the hero at left, empty sky, the last sun at right. Music stops. |
| Echo | Pull back to reveal the stage frame again, **truck right as a blurred foreground pillar wipes the frame**, and come out behind the screen. Slow push, then a fast dive into the flame that flashes to warm white before the end card. |

Why this route, for this story: the audience seat made it a told legend; the locked wide let nine darkening steps be counted; the silent medium-close held the refusal; the backstage truck paid off "the sun is a lamp". Each is one choice from STYLE.md §6, not the style's default opening or ending.

Timeline highlights (`story.js`): title plaque in at 2.4 s, set 3.6 s, out 6.6 s; 1306 frames at 24 fps.

## Score structure

Original gong-and-drum score (`demo/music/score.py`). Patterns map to the drama in this order: opening roll → one hit per lamp, accelerating → heartbeat drum under the disaster → *jijifeng* roll accelerating into the entrance → big gong on the freeze → fast strokes with one gong per hit → **hard stop** (≤ 30 ms, reverb tails included) for the silent choice → one tiny small-gong tap for the decision → gentle fiddle theme → gong scrape to go backstage → a final big gong tail.

Fiddle: **ku-yin** for the disaster, **huan-yin** for heroism and healing. The suona-like reed only at the climax.

Foley specific to this film: wooden clapper to open and close the show, match strike, lamp ignition, rod taps, leather flaps when a crow lifts off, leather footsteps, bow creak (rising pitch with draw), string twang, arrow whoosh, leather thwack on hit, lamp snuff ("pfft" + sizzle), wing flaps, crackle, heat drone (hard-cut at the silence), water, a quiet backstage room tone and one breath.

Voice: a storyteller, Kokoro `am_michael`, speed 0.86–0.88, 5–6 short lines, compressed, plus small-theatre reverb. Music ducked ~12 dB, foley ~4 dB. A line that passes whisper alone can blur under music ("shadow play still" is heard as "shadow place"): rewrite the line rather than fight the mix.

## Palette & props

- **Rendering constants**: lamp lobe σ ≈ 700 px + hotspot σ ≈ 120 px; flicker ≈ ±6 % value noise at 7 Hz plus a small 23 Hz sine; light colour `(1, .77, .46)`; exposure `1.75 / √(lamps lit)` (ten lamps ≈ 3× one lamp); cloth weave at ~2.6 rad/px; bloom from a 3-level pyramid, threshold 0.72, tint `(1,.82,.6)`; warm vignette toward `(.7,.47,.25)`; saturation ×1.1; hide texture tileable 512²; film grain 2 in ffmpeg.
- **Dyes**: vermilion `#b8211a`, flame `#d9541c`, ochre `#dc9d1e`, gold `#c98a26`, malachite `#236e3a`, jade `#2f8a5c`, indigo `#22647e`, raw hide `#e2bd80`, ink `#1a100a` (outlines, hair, boots).
- **Hou Yi** (11 pieces): head+helmet, chest, skirt, two upper arms, two forearms, two hands, two legs, plus quiver, bow, pheasant plumes. Head ~1.2× natural, helmet about a quarter of the figure. Armour = rows of thick crescent holes ("open fish-scale"), trousers = diamond lattice, belt = coin holes, four-lobed cloud collar with cloud-scroll cuts, sleeves in a different colour from the torso. Court boots: tall black shaft with cut cloud scrolls, upturned toe, thick white sole carved as one piece (grooves + a row of oval holes). Open-cut face.
- **The bow** is drawn procedurally: limbs bend with draw, the string goes to the nocking hand, and **the nock sits on the aim line**: grip = shoulder + u·118, nock = grip − u·(40 + 72·pull). Arrow shaft dark `#4a2612`, 3 px.
- **Suns**: a carved round piece: flame-tongue rim (alternating curl, teardrop holes between tongues, tongues ~40 px long × 0.78 of the arc spacing), bead ring, translucent orange-red disc, with a separate dark three-legged crow on top so it can drop out.
- **Scenery**: mountains one piece each with wide strata cuts following the ridge and cloud holes near the peaks; the tree = a trunk piece plus a single lace canopy full of leaf-shaped holes; the ground is a narrow carved strip (meander band + coin holes), with cracks cut as tapered slits that widen and lengthen as the land burns through. Water is a separate indigo wave strip that can be lifted off. Fire is a carved piece of S-curling flame tongues (red → orange → yellow bands, spiral hooks at the tips) on a rod, swapped and shaken at 12 fps. A hut.
- **Stage**: red-and-black lacquer frame, carved lintel with gold cloud curls, pillars; blurred children's heads along the bottom in the opening and end-card wides.
- **Backstage**: lamps as dish + cords, one lit, the other nine just snuffed and trailing smoke.
- **Motion numbers**: tremor ≈ 3 px / 0.018 rad, ×1.8 under tension; pendulums pre-simulated at 120 Hz; arrivals scale 2.6 → 1, blur 34 → 0 over 0.55 s; exits scale ×1.9, blur +30 px, fade over ~0.9 s; lamp flare overshoot to 1.5×, snuff over 0.35 s; freeze pose on the big gong held ~1 s.
- **Subtitle placard**: dark brown gradient at 0.93 alpha, thin gold inner line, a small vermilion seal with 说 ("tell", Ma Shan Zheng) on the left, Cormorant Garamond 600, 46 px, cream `#f3e2bf`, centred 58 px above the bottom; slides up 18 px in 0.22 s; shown from line start until speech + 0.8 s (≥ 1.8 s), cut 0.3 s before the next.
- **Title plaque**: "HOU YI / SHOOTS THE SUNS / a shadow puppet tale" cut out of dark hide, red border with a meander band, green cloud-scroll corner roundels, a red seal with carved characters, carried up on two rods and lifted off the cloth to exit.

## End card

A cut-letter plaque on the cloth: "SHADOW PUPPETRY" / "Hou Yi Shoots the Suns" / "LemoLab × Claude Opus 5.5" (`stage.js` `buildStage().end`), after the dive into the backstage flame flashes to warm white; the poster frame carries the same credit line (`main.js`). The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

Rights (see [`demo/CREDITS`](demo/CREDITS)): the Hou Yi legend is public-domain folklore; puppets, scenery, carving patterns, staging and melodies are original and generated by code; traditional motifs (fish-scale armour, cloud scrolls, meander, coin and lattice patterns, flame tongues) are used generically and no historical puppet is copied. Fonts Cormorant Garamond and Ma Shan Zheng (OFL 1.1); voice Kokoro TTS (Apache-2.0); music samples CC0 (Karoryfer erhu, Versilian Studios libraries); sound effects synthesized.

## Build notes

```
styles/shadow-puppet/demo/
  carve.js     cutting toolkit: piece sprites, cut/cutLine/cutTaper, pattern library, hide texture, rivets
  gl.js        WebGL2 screen compositor (lamp field × transmission × cloth, mirror, bloom, haze, warm fade)
  houyi.js     jointed puppet (11 pieces, IK arms, bow, plumes, rods)    poses.js  key poses
  suns.js      carved suns + crow                     scenery.js  mountains, ground strip, river, tree, hut, fire pieces
  stage.js     lacquer frame, audience, pillar wipe, cut-letter plaques
  backstage.js rim-lit silhouettes (hands, lamps), lamp flame, smoke
  story.js     timeline (single source of truth)      main.js  shots, acting, lamps, events
  hud.js       subtitle placard    test.js  ?test=model | frame | hands | (main) poster
  lines.json   narration   mix.py  foley + voice + music ducking   music/score.py  original gong-and-drum score
  tools/       cues.py (SRT), mux.sh (CRF 22), probe.mjs (render timing)
```

1. `node core/render/still.mjs styles/shadow-puppet/demo 0 --q test=model`: model sheet first (character risk comes first). Then `--q test=frame&f=ten|one` style frames and `--q test=hands`.
2. `.venv/bin/python core/tts/tts.py lines.json voices` → `core/tts/asr_check.py` (use `asr` fields for homophones).
3. Timeline in `story.js`. Review with `still.mjs --range 0.5:54:1.5` + `core/render/sheet.py` (two rounds, offset by half a step), then frame strips from the mp4 for key actions.
4. `node core/render/events.mjs` → `music/score.py` → `mix.py`.
5. `node core/render/video.mjs … --fps 24 --workers 3` (1306 frames ≈ 80 s on an M-series Mac, 3 workers).
6. `sh demo/tools/mux.sh out/video24.mp4 mix.wav shadow-puppet.mp4 24 2`. Or just `sh demo/build.sh`.

Pitfalls tied to this demo's props:
- So that Hou Yi doesn't read as stilt legs, an egg torso and arms lost in the torso: enlarge the head, lengthen the skirt, widen the trousers, add the cloud collar, and colour the sleeves differently from the chest.
- Sun rays read as a saw blade or as flower petals unless they are fat-based, hooked flame tongues at the sizes above.
- A raw-hide arrow disappears on the ten-lamp screen: use a dark shaft. Put the nock on the aim line, or the arrow points sideways.
- Backstage mirror helper: build the rotation from `C[0]` for x terms and `C[3]` for y terms; `C[0]` for both axes flips pieces upside down.
- A push-in on the backstage lamp at the top edge shoves the hands out of frame: push on frame centre, and move the fixed point to the flame only for the final dive.
- Hard-cut the heat drone and crackle at the stop, or they leak into the silent choice.
- Headless Chrome screenshots can time out when many renders share the GPU (14 others): retry.
