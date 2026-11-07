# Red Paper-cut — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Nian Comes to Town* (49 s) · `papercut-red.mp4` · source in [`demo/`](demo/)


## Story & structure

New Year's Eve: the monster Nian comes into the village and every house puts out its lights. A little girl folds a sheet of red paper three times and makes one cut; the unfolded rosette goes on her window, a candle is lit, eight cut lanterns fly to eight dark windows and the whole village lights up again; the scraps she cut off become firecrackers, and Nian runs from the red light and the noise. At dawn the camera pulls back: the whole film was one window flower pasted on a real window.

Choose a story where **the craft of cutting paper is the plot**, use several native moves, and make one of them the *cause* of the ending, not decoration. Here the fold – cut – unfold is the cause: one lantern cut in the wedge = eight lanterns in the rosette = eight houses lit.

Adapting any topic: find the **one thing that gets cut** and make its *unfolded* form the answer (a product's silhouette folded into a wedge that unfolds into all its uses; two lovers cut from one folded sheet; one house cut in a folded strip that unfolds into a street). Treat these as examples of the fold move, not as a required structure.

Arc (40–55 s; 49 s here): cold open on the scissors (0–3 s) → title → peaceful world → threat (the world goes dark and silent) → a quiet decision → **fold–cut–unfold** on the downbeat → the pattern becomes light and fixes the world → dawn → scale reveal.

Native moves spent: fold – cut – unfold (the climax), holes are light (the backlit rosette on the window, its pattern projected across the snow onto Nian's face), symmetry replicates (the rosette's lanterns fly off; small rosettes unfold as fireworks), scraps have a future (the offcuts come back as firecrackers), everything is one flat sheet (the sawtooth ridge of the far hills stands up and is Nian's back; the final pull-back to the window).

## Shots

120 BPM, 2/4: one beat = 0.5 s, one bar = 1.0 s.

| # | Time (s) | Picture | Camera | Sound |
|---|---|---|---|---|
| S1 | 0.0–3.0 | Black 0.25 s → scissor blades bite red paper; two scraps fall; at 2.4 the cut sheet flies away, revealing rice paper | Extreme close-up tracking the tip | snips at 0.25 / 1.0 / 1.75; pipa slide-in at 2.5 |
| S2 | 3.0–7.0 | Title *NIAN COMES TO TOWN* in cut letters, sawtooth banner border, a 年 seal; paper snow; at 6.5 the title sheet folds over along its middle | Flat front view; exit by page turn | theme A tutti, small gong at 3.0 |
| S3 | 7.0–12.0 | Night village: indigo paper, punched snow; far hills / houses / bare branches in three layers; warm window flowers; stops on the girl cutting paper at her window | Slow pan in parallax, push to her lit window | theme A soft; L1 |
| S4 | 12.0–17.0 | The far ridge shivers and **stands up**: its sawtooth is Nian's back; he turns his head, huge, each step a shake; windows go out one per beat, last at 16.5 | Low wide, Nian towering behind the far hills | frame-drum hit, heartbeat + erhu glide; a muffled drum per window; L2 |
| S5 | 17.0–19.5 | From the dark room: Nian's eye slides into the lattice, fills the window, blinks; the girl ducks below the sill | Locked, inside the room (the film's memorable shot) | **music stops**: wind, snow, heavy breathing |
| S6 | 19.5–24.0 | The girl from fear to resolve; three inserts on "red / light / noise": red paper, a candle, a string of firecrackers; she swaps to the determined face and nods | Medium close-up, props pop on the three words | zheng tremolo bed, one pipa note per word; L3 |
| S7 | 24.0–30.0 | Fold (24.0 / 25.0 / 26.0, a woodblock each) → cut (26.5–29.5): sawtooth edge, crescents, a lantern; scraps pile on the table; 29.5 the scissors stop | Top-down tabletop; fixed for folds, following the scissors for the cut | pipa tremolo + zheng eighth-note ostinato climbing; a snip per cut; 29.5–30.0 silence |
| S8 | 30.0–31.0 | Unfolds at 30.0 / 30.25 / 30.5; at 31.0 the rosette blooms and fills the frame | Pull out | three zheng glissandi → tutti + big gong at 31.0 |
| S9 | 31.0–38.0 | Rosette on the window, candle lit: **backlit**, the pattern sweeps the snow and lands on Nian's face; eight lantern motifs fly out, eight windows light (32.0–33.75, one per eighth note, nearest house first); scraps become firecrackers, small rosettes burst as fireworks; Nian squints, covers his eyes, tucks his tail and flees | Push on the glowing window, pull back to the whole village; CU Nian dazzled | theme A tutti + synthetic firecrackers; eight rising zheng notes; L5 |
| S10 | 38.0–42.5 | Dawn: the night sheet **peels off** from the top-right corner to reveal the day sheet; a gold-foil sun rises; the girl asleep at the window, scissors in hand | Medium close-up | dizi solo (slow) + zheng harmonics; L6 |
| S11 | 42.5–46.0 | Scale reveal: the whole picture is a round window flower on the paper of a wooden lattice window, sunlit from behind; scissors and red scraps on the sill (rhyming with the opening) | Slow pull-back | last phrase, cadence + small gong at 44.0 |
| S12 | 46.0–49.0 | End card (below) | Locked | small gong tail + two woodblocks |

## Score structure

Original score (`demo/music/score.py`), D gong pentatonic (D E F# A B), 2/4 at 120 BPM, a 4-bar original theme. Instruments: `pluck:pipa` (melody + tremolo), `dan_tranh` / `dan_tranh_trem` (as zheng / yangqin: broken chords, glissandi, tremolo), `erhu` (counter-melody, glides), `flute` as dizi, `woodblock` (beats, folds), `gong2:small` (phrase heads and tails), `gong2:big` (only once, at 31.0), `frame_drum`. No piano, no string section, no opera gongs-and-drums or suona (to keep clear of shadow-puppet and ink-wash).

| Cue | Time | Tempo | Content | Hits |
|---|---|---|---|---|
| C0 cut | 0–3 | free | scissors only; pipa slide-in | snips 0.25 / 1.0 / 1.75; 2.5 |
| C1 title | 3–7 | 120 | theme A: pipa, zheng, dizi octave up, woodblock on each beat | 3.0 small gong; 6.5 fold (zheng upward sweep) |
| C2 night village | 7–12 | 120 | theme A soft, woodblock off-beats | ducks under voice |
| C3 Nian | 12–17 | 60 feel | frame-drum heartbeat, erhu slow glide D4→A3, low zheng | 12.0 hit; one drum per window |
| C4 silence | 17–19.5 | — | **no music** (wind, breath) | 18.3 blink (a very soft woodblock) |
| C5 resolve | 19.5–24 | 120 | zheng tremolo, pipa ×3, erhu rising | 23.5 pipa cadence |
| C6 fold & cut | 24–30 | 120 | woodblocks on folds; pipa tremolo + zheng ostinato, up a step each bar | a snip per cut; 29.5 all stop |
| C7 unfold | 30–31 | 120 | three zheng glissandi | **31.0 tutti + big gong** |
| C8 village alight | 31–38 | 120 | theme A tutti + frame drum + small gong + firecrackers; eight zheng notes | 32.0–33.75 windows; 35.0 Nian turns; 37.5 small gong |
| C9 dawn | 38–42.5 | 90 | dizi solo, zheng harmonics, erhu long notes | |
| C10 reveal | 42.5–46 | 90 | last phrase in unison, cadence on D | 44.0 chord + small gong |
| C11 end | 46–49 | — | gong tail + two woodblocks | 46.5 / 47.0 |

Music ducks ~8–9 dB under the voice; downbeats avoid the first word of a line.

Foley specific to this film: Nian's cardboard steps (55 Hz + low noise, each with a ~6 px frame shake), his breathing (low-passed noise), a dazzled whimper (an erhu sample pitched down and low-passed); candles out ("puff") and lit (match + whoomp); fireworks = rising whistle + boom + crackle + falling scraps; a long paper peel at dawn; two bird chirps.

Voice: a warm grandmother telling the story on New Year's Eve, Kokoro `af_sarah`, speed 0.9, five lines:

| id | Start | Text |
|---|---|---|
| L1 | 7.6 | Every New Year's Eve, the monster Nian came down from the mountains. |
| L2 | 13.6 | One by one, the village put out its lights. |
| L3 | 19.8 | But Nian fears three things: the color red, bright light, and loud noise. |
| L5 | 35.2 | Crackle, bang! And away ran Nian. |
| L6 | 38.6 | That is why, every New Year, we still paste red paper on our windows. |

Whisper hears "Nian" as "Nyan"/"Nion", the correct pronunciation of nián, so it is registered as an `asr` alias in `lines.json`.

## Palette & props

- Heroes and window flowers `#d2201f`; Nian one step deeper `#b00f26`; near limbs one step brighter `#c4162c`, far limbs darker (`#8a0c20`, girl `#b8191b`); fold back colour `#de3b30`.
- Rice paper `#f2e8d0`, night paper indigo `#1c2446`, ink sky `#0f142a`, gold foil `#d9a93f` only at the end (sun, title flecks).
- Night: far hills `#1f2a55`, near hills `#29356e`, houses `#35457f`, trees `#28346c`, snow `#7a88ba`, all indigo papers; only window flowers, lanterns, the girl and Nian are red (a red background too makes the silhouettes stop popping). Day: rice-paper sky, red houses, far hills `#e0877f`, mid hills `#cf4f4a`.
- Paper shadow: offset 2.6/3.6 px, blur 5 px × zoom, `rgba(52,6,10,.38)`. Inset contour: a 1.5-unit slit 3.5 units inside the outline. Night ambient ~`rgb(214,214,236)`; bloom 10 px / 40 px at strength ≈ 0.55.
- Backlit window flower: radial light `#fff6d6 → #ffc46e → #ec782e`, rice-paper fibres multiplied at 50 %, the rosette's transmission sprite in `#b51d18`. Projected pattern squashed onto the ground with `[1.25,0,-0.9,0.3]`.
- The rosette: middle ring *yang* cut (lanterns, ruyi scrolls on the fold lines, sawtooth on the ring edges), inner and outer rings *yin* cut.
- The girl: head, coat, 2 × (upper arm, forearm + hand), 2 × (thigh, shin + shoe), scissors (2 blades on a rivet); face pieces smile ∩, surprise, scared, determined almond eye, asleep ∪; cheek rosettes.
- Nian: body, head (big, ×1.32), hinged jaw, mane, tail, 4 × (upper leg, lower leg + paw); sturdy legs with four curved claw tips and swirl knee joints (no crescent-striped shins). When the light hits him, pattern + solid warm spot are added inside his layer, so the squint and big tears are holes that read on the lit face (the gag); unlit parts darken to silhouette.
- Cutting: reveal circles r ≈ 62 units; blades open/close every 0.25 s (each snip = one eighth note); the camera holds the tip at ~32 %. Each fold ≈ 0.55 s on a woodblock; three unfolds 0.25 s apart.

## End card

Couplet strips slide in beside the window, a red banner with cream cut letters "RED PAPER-CUT" drops in above, gold-foil flecks, and the credit line "LemoLab × Claude Opus 5.5" below in ink. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

Title and subtitles as built: cut letters in Fraunces 800 on rice paper with sawtooth border strips, a red seal with the character 年 cut as a hole, an italic subline. Subtitle banner `#a8111f`, gold flecks, Fraunces SemiBold 44 px in cream `#fff1d6`, centred 70 px from the bottom, hold ≥ voice + 0.7 s and ≥ 1.8 s.

## Build notes

```
styles/papercut-red/demo/
  paper.js    paper textures, piece builder (fill, cut, inset, edge, grain), shadows, transmission
  motifs.js   folk pattern library          rig.js      2D affine rig helpers
  girl.js     jointed girl + face pieces     nian.js     jointed monster + eye pieces + poses
  tuanhua.js  8-fold rosette (one wedge × D4) village.js  houses, hills, plum tree, snow, lanterns
  light.js    night lightmap, backlit windows, bloom, rays, masked projected light
  world.js    village layout (night/day palettes) + lighting pass
  fold.js     fold – cut – unfold sequence   hud.js      subtitle banner, cut-letter text
  story.js    timeline (single source of truth, 120 BPM)   main.js  shots, cameras, events
  sheet.js / climax.js / test.js   model sheets and style frame (?test=sheet_girl | sheet_nian | frame)
  lines.json  voice script   music/score.py  original score   mix.py  foley + voice + music   subs.py  srt
```

1. `node core/render/still.mjs styles/papercut-red/demo <t…> [--q nosub=1]`: review stills; `?test=sheet_girl` etc. for model sheets.
2. `.venv/bin/python core/tts/tts.py lines.json voices` → `core/tts/asr_check.py` until all OK.
3. `node core/render/events.mjs` → `music/score.py` → `mix.py` → `subs.py`.
4. `node core/render/video.mjs styles/papercut-red/demo --fps 24 --workers 3` (1176 frames, ~30 s).
5. `sh core/render/mux.sh out/video24.mp4 mix.wav papercut-red.mp4 24 0`, then `check_final.py` (per-line whisper on the final mix + blackdetect).
Or simply `sh styles/papercut-red/demo/build.sh`.

Engine traps: `put()` uses `setTransform`, so it ignores an enclosing `translate`: pass absolute matrices. Test-mode pages must not throw to stop the module (the render harness exits on any page error): guard the `window.render` assignment instead. Engine numbers as used: paper grain mottling ±7 % at ~130 px; edge wobble ≈ 0.35 units; `sawRow`, `sawEdge`, `crescent` / `crescentRows`, `swirl` / `doubleSwirl`, `cloudCut`, `rosette`, `plum`, `coin` in `motifs.js`; half-res bloom blurs; don't smooth the houses: smoothing turns them into bread loaves.

Pitfalls tied to this demo's props:
- Don't store the wall height in a house piece's `p.h`: it stretches the house (`x0,y0,w,h` is the drawing box).
- Don't darken the snow layer through the light map: it makes ghost legs visible through the snow.
- Check that the folding scissors point forwards, not backwards.
- Centre the projected pattern on Nian's snout with a solid warm spot, not on his eye: on the eye it hides the eye; on the snout the squint and tears read.
- The cold open's flying sheet overlaps the title card to avoid blank frames.
