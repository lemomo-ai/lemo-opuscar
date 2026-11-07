# Ukiyo-e — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Toward the Mountain · 山へ五景* (44 s) · `ukiyoe.mp4` · source in [`demo/`](demo/)


## Story & structure

A traveller in a straw hat walks from the rice fields toward a distant mountain: across a bridge in the rain, past a teahouse where the mountain waits in a round window, to a sea that stands up between them. The wave washes the print back to a blank sheet; the next print is the mountain, and he takes off his hat. Five views, one constant subject; the story is told by *where the mountain sits in the frame* each time (tiny on the horizon → framed by a window → dwarfed by a wave → filling the sheet). One character, one goal, one turn.

Arc: jo-ha-kyū (序破急), slow, open, still (jo) → gathering pulse (ha) → rapid rush to a peak (kyū) → a hard cut to silence (ma, 間) → a quiet resolution and a scale reveal. This demo rests on at least three of the five native moves, with the strongest at the peak; that is this demo's choice, not a rule.

Native moves spent: a series of views (the whole film), the handscroll (every transition), printing block by block (the opening and the rebirth after the wave), paper is the white (the foam that erases the print), the frame is an object (the wave breaking out of the border). One way to adapt a topic for this kind of story: make it a journey or a series with one constant subject (a product launch → five views of the product in five places; a city → a day in five prints; a life → five ages, the same tree in every print).

Views: 一 田毎の朝 (rice fields at dawn) · 二 雨の橋 (bridge in the rain) · 三 茶屋の窓 (teahouse window) · 四 海立つ (the sea stands up) · 五 山 (the mountain).

## Shots

| Beat | Camera |
|---|---|
| Opening | Locked on a blank sheet; the first print is printed block by block in front of us |
| Early views | Locked frame, like reading a print on a wall. The subject is small |
| Middle view | A very slow push (1.00 → 1.065) toward a framing device (round window) |
| Transitions | Handscroll slide right → left through the mounting gap, getting faster: 1.0 s → 0.9 s → 0.6 s |
| Climax | First big move: tilt up past the top border into the mount, push in; then crash-zoom into the foam |
| After the climax | Hard cut to a blank sheet, hold (間), then reprint |
| Ending | Pull back from the last print to reveal the whole scroll: every view side by side (scale reveal); end card on the scroll |

The climax gets the **only big camera move** of the film, played in four beats (~4.5 s total; 25.4–30.4 s in the final cut):

1. **Rise** (~1.9 s): the sea swells into a wall; the camera tilts up past the top border and widens slightly so the figure shrinks.
2. **Hang / 亮相** (~1.2 s): the crest stands outside the border in the mounting paper, claws open and nearly frozen (jitter ×0.25); the whole print is visible as an object. The drum roll peaks, then an 80 ms silent intake of breath.
3. **Fall** (~1.2 s): the lip lengthens and rotates down toward the lens, claws grow ×2.5, camera pushes to 3× with a small roll.
4. **Foam** (~0.7 s): fractal claws burst from the lip to fill the screen, fade to bare paper → hard cut to silence (ma, 30.4–32.2 s).

Then four reprints (32.2 / 32.7 / 33.2 / 33.7 s), the last line at 34.4 s, the final print at 38.4 s, the pull-back 38.9–40.9 s, the end card from 40.3 s. A climax of only 0.7 s reads as "some foam flashed": that is why STYLE.md asks for a held beat of about a second.

Subtitles stay clear of the figure: bottom band ~80 px from the edge; move figures up where needed.

## Score structure

Original score (`demo/music/score.py`) on shamisen, shakuhachi, taiko and hyōshigi, following jo-ha-kyū:

- Hyōshigi claps accelerate over the opening printing (one clap per block), the kabuki curtain call.
- Shakuhachi in free rhythm, *miyako-bushi* scale (D E♭ G A B♭), long tones with breath, a slide up into each note and *meri* drops at phrase ends.
- Shamisen: slow pulse (72 BPM), then an ostinato (96 BPM) with a small tight drum; a fast rising run on the fastest scroll slide.
- Taiko heartbeat that accelerates from 0.9 s intervals to a roll for the climax; one full hit on the crash; then **absolute silence** (reverb tails cut too). Four big taiko strokes reprint the last view. The opening shakuhachi motif returns and resolves; a long shamisen note with sawari rings out under the end card.

Instrument recipes (reusable):
- Shakuhachi from samples: `flute` / `recorder`, flatten amplitude and pitch vibrato (divide by a 60 ms envelope; f0-track and counter-warp), add 1–4 kHz breath noise locked to the envelope, a *muraiki* breath burst on attacks.
- Taiko from samples: `gran_cassa` + `toms:low_mallet` + `frame_drum:large` + a synthesized skin (pitch drop ~120 → 58 Hz) and a stick thud.

Foley specific to this film: baren rub with a ~9 Hz circular modulation, hollow bridge steps, wind chime partials 2.36 / 5.15 / 7.98 kHz, field trickle, rain bed with drops, sea swell every ~4 s, lark chirps, geese, a kite's *pii-hyoro* on the last view.

Voice: calm male storyteller, first person, 5 short lines (Kokoro `am_adam`, speed 0.84–0.88). Music ducked ~−8 dB under voice (−10 dB on the last line), ambience ~−4 dB. Subtitle hold in this demo: ≥ max(1.8 s, voice + 0.75 s).

## Palette & props

**Canvas & sheet.** 1920×1080 sheet = screen at zoom 1. Ink border at `x 44–1876, y 38–1042` (3.4 px) plus a thin outer line 9 px outside; paper margin beyond. Sheets sit on a long mounting scroll (`#c9b690`, 260 px gaps) with a wooden roller at the left end.

**Palette** (this film's pigment set):

| Name | Hex | Use |
|---|---|---|
| Paper | `#eee2c6` | washi base (with ±3 % mottling, fibres `#fbf6e9` / `#c7b893`) |
| Prussian blue | `#1d3a66` · dark `#13284a` · light `#4d6f98` | skies, water, mountain, wave |
| Deep trough | `#0f2344` | inside of the wave |
| Pale blue | `#8db0c6` · `#bcd0d6` | water reflections, lower sky |
| Sumi (key block) | `#231f1c` | all key lines |
| Beni red | `#b8412f` · pale `#e3a08a` · peach `#efc4a8` | sun, felt bench, seals, dawn bokashi, cartouche tab |
| Ochre / straw | `#cf9f4a` · `#c9a45c` | hats, roads, obi |
| Greens | `#8aa152` · dark `#50703c` · pine `#3e5a3a` | fields, trees |
| Indigo cloth | `#2c4a70` · gaiters `#1d2c44` | clothing |

**Blocks.** `g0` key lines · `g1` blues · `g2` greens / secondary · `g3` reds / figures, composited with fixed registration offsets `g1 (2.2,−1.3)`, `g2 (−1.8,1.9)`, `g3 (1.5,2.2)`. Printing reveal: ~0.34 s per block.

**Texture recipe.** On each colour block, in this order: woodgrain `source-atop` α ≈ 0.1–0.17 (sky/water strongest), baren streaks `destination-out` α ≈ 0.38 (0.2 on dark wood), goma-zuri specks `destination-out` α ≈ 0.3. Key block: specks only (α 0.12). Over the finished sheet, light fibres (α ≈ 0.09). **Woodgrain** = iso-lines of a warped noise field (`u = y·0.035 + fbm·9 + knots`), thin dark lines where `|frac(u)−0.5| > 0.4` plus broad tonal bands. **Baren** = ~260 blurred circular arcs + zigzag streaks. Dynamic big fills (the wave) get woodgrain + a paper-coloured baren overlay inside their clip. **Bokashi**: per pixel, top edge wandering ±20–30 px per column.

**Props:**
- *Mountain*: asymmetric concave slopes (`y = s^1.55` left, `s^1.8` right), a notched summit, snowcap as **drips down the gullies**: 12 fingers of random depth (some long), narrow and pointed, joined by a gently wavy snow line; right-side shade band; pale beni glow on the snow at dawn. An original silhouette, not Fuji's.
- *The wave*: normalised outline (back slope → crest → forward lip → curl → hollow front). A vertical wall of water whose crest falls toward the lens, with the traveller on a rocky headland, deliberately not the boat-and-wave composition of *The Great Wave*. Body in **three blue bands with bokashi between them** (light blue by the crest → Prussian → deep trough), made from thick strokes of inward offsets of the back-slope curve; **grouped white flow lines** (3 lines per group, broken into long arcs). Foam rim along the crest; **fractal claws**: each big claw splits into 3 fingers, each finger splits again, all tips hooking inward; a pale-blue back layer offset behind the white front layer; spray in **clusters** (one big dot, a few medium, many small).
- *Claw roots* grow **out of** the foam: taper the root to ~40 % width, then bury it in irregular white foam blobs (stroke all blobs first, then fill all → one union outline). Claws stuck straight onto the crest read as planks.
- *Bridge*: a side-view arched (taiko) bridge, not the diagonal bridge-over-river composition.
- *The traveller* (80–130 px): side view, low conical kasa hiding the upper face, tucked-up kimono with the back corner tucked into the obi, dark gaiters, straw sandals, staff, bundle knotted at the chest. Close views: shaved pate (pale blue-grey), folded topknot, one-stroke eye. Poses: walk / stand / hold hat / straw cape / sit & drink / back view / hat off.
- *Cartouche*: cream `#f3e7c6`, pale beni tab with the series title.

## Titles, subtitles & end card

- **Subtitle cartouche**: cream `rgba(243,231,198,.96)` slip, 2.6 px + 1 px ink border, a small red seal "旅" at the left, Shippori Mincho 500 42 px in sumi, centred 72 px above the bottom. It prints in over 0.22 s with the reveal mask and fades out over 0.25 s.
- **View cartouche** (vertical, Yuji Syuku): 一 田毎の朝 · 二 雨の橋 · 三 茶屋の窓 · 四 海立つ · 五 山, seal below/beside. Cartouche drop-in: fade + 14 px.
- **Title**: a vertical cartouche 山へ五景 + a horizontal English slip *Toward the Mountain* laid on the first print, stamped with a seal, lifted away before the first line.

## End card

The whole scroll across the middle on dark indigo `#161a22`; title above, `UKIYO-E · a Lemo-Opuscar demo · LemoLab × Claude Opus 5.5` below, one seal (drawn `source-over`, not multiply, on the dark background). The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/ukiyoe/demo/
  print.js     paper, woodgrain, baren, specks, blocks, bokashi, carved lines, reveal masks, cartouche, seals
  nature.js    mountain + snow drips, pines, rocks, rain, geese, simple claws
  traveler.js  the traveler (walk / stand / hold hat / straw cape / sit & drink / back view / hat off)
  views.js     the five prints: cached blocks (g0–g3) + per-frame paint()
  wave.js      sea rows, wave geometry, banded body, fractal claws, spray clusters
  story.js     the timeline (single source of truth)     main.js  camera, scroll, sheets, reveal, titles, subtitles, events
  lines.json   voice   music/score.py  original score   mix.py  foley + voice + ducking + the silent ma   subs.py  cues → srt
  build.sh     one-command rebuild
```

1. `node core/render/still.mjs styles/ukiyoe/demo <t…>` (`--q nosub=1`, `--q test=trav` for the character sheet, `--q poster=1`).
2. `core/tts/tts.py lines.json voices` → `core/tts/asr_check.py`.
3. `node core/render/events.mjs styles/ukiyoe/demo` → `music/score.py` → `mix.py`.
4. `node core/render/video.mjs styles/ukiyoe/demo --fps 24 --workers 3` (1056 frames ≈ 45 s, Canvas2D).
5. `core/render/mux.sh out/video24.mp4 mix.wav ukiyoe.mp4 24 0` → `check_asr.py ukiyoe.mp4`.

Or simply `sh styles/ukiyoe/demo/build.sh`.

Pitfalls tied to this demo's props:
- A zig-zag snow line looks like a crown; smooth waves look like icing. Use narrow pointed drips of random length, and force control points to be x-monotonic (otherwise tiny self-intersecting loops appear).
- A wave with flow lines fanning from the base looks like a waterfall curtain. Flow lines must follow the back-slope contour; the body needs banded blues; claws must branch and hook inward: a single curled strip reads as a ribbon.
- Offset curves self-intersect at the tight lip → only use the back slope for inner flow lines.
- The wave breaking the border must escape **both** the sheet clip and the frame clip; its sides are clipped to the frame so only the top breaks out.
- `mountain()` fills only when a flat colour is passed, so gradient bodies come out transparent: watch option flags.
- A seal drawn with `multiply` vanishes on the dark end card and on the wave: draw it `source-over` there.
- The traveller walking past a foreground tree reads as "in front of" it; keep low branches clear of the walking path.
- The subtitle band covers anything in the bottom 150 px: raise ground lines and figures above it.
