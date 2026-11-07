# Chinese Ink Wash — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Swordsman and the River* (48 s) · `ink-wash.mp4` · source in [`demo/`](demo/)


## Story & structure

A swordsman crosses a river on the water and splits a towering wave with one stroke. One character, one goal, one turn. The brush itself is the event: the stroke that cuts the wave is also the character 水 written in the air.

Arc (48 s): emptiness → a drop of ink (creation) → a small figure in vast space → lightness and joy (the qinggong run across the water) → an overwhelming obstacle drawn as mass (a wet splash of dark ink becoming a wave) → silence → one decisive stroke → release → scale reveal (the figure is a tiny mark in the whole painting) → seal. The closing line is philosophical rather than triumphant ("cut water with a sword and it only flows on").

Native moves spent: one stroke is everything (the opening drop), brush = gesture (the written 水), flying white (the cut, after total silence), splitting a mass (the wave), the handscroll (the final pull-back and seal).

## Shots

| Beat | Camera |
|---|---|
| Opening | Locked frame of blank paper; the drop falls into it. |
| Establishing | Slow right-to-left pan (scroll unrolling), ending on a **high wide** frame: the figure 150–180 px tall, the river a huge blank. |
| Travel | Lateral tracking with the figure at ~60 % of the frame, lead room ahead; very slow parallax far mountains; occasional dark reeds passing at the very bottom. |
| Threat | **Low angle**, horizon low, the wave towering, the figure tiny in a corner; slow push-in with growing shake. |
| Silence | Hard cut to an extreme close-up (hat brim, no eyes); then an **over-the-shoulder** frame putting the figure, the written character and the wave on one axis. |
| Release | Back to the same high wide scale as the establishing shot. |
| Ending | Continuous pull-back from the figure to the whole handscroll on its silk mount; seal; end card below the scroll. |

Why this route, for this story: the locked blank paper put "nothing" before "something"; the scroll pan ending high and wide made the figure tiny; the extreme close-up in the silence was the film's only hard cut; the release returned to the establishing scale so the rhyme showed what changed; the pull-back to the mounted scroll turned the whole journey into one painting. Each of these is one choice from STYLE.md §6, not the style's default opening or ending.

The hold before the strike is a slow 5 % push-in; the stroke then crosses the frame in ~4 frames, and the wave only starts splitting after it.

## Score structure

Original guqin score (`demo/music/score.py`), F-gong pentatonic (F G A C D), cued by section rather than looped. Free-time opening, 60 BPM for landscape, 90 BPM for travel (footsteps on beats), drum roll for the threat, **digital silence**, three glassy harmonics for the three written strokes, silence again, then drum + seven-string sweep on the cut; the theme returns for the release; last note = seal.

Foley specific to this film: sword draw (scabbard scrape + long thin metallic ring, cut before the second silence), the cut (tearing air + river roar + low boom). The sword ring and a single drip are the only sounds allowed inside the silences; the ambience hard-cuts into the first silence.

Voice: calm British narrator, Kokoro `bm_george`, lang `en-gb`, speed .82–.86, 4–6 lines. Music ducked ~8 dB under voice, ambience ducked too: a river roar under a line makes whisper hear "Halfway" as "This way". Every line checked with whisper and again on the final mix.

## Palette & props

- Paper: base `#F2ECDE`–`#F3EBDD` (rgb .95/.925/.87), cloud mottling ±7 %, three fibre directions (+1.8 % light), vignette ~.22. Ink from cool grey `rgb(.52,.55,.58)` to warm black `rgb(.075,.068,.062)`. Vermilion `#B02E22`: the seal and the hero's **sword tassel**, which finds him in wide shots and rhymes with the final seal.
- Compositor numbers: wet bleed is a 12-tap noisy Poisson blur of ~5 px at 1:1; edge pigment = small blur − large blur.
- Ink tones as used: burnt for calligraphy, sword, hat brim line, moss dots; thick for contours and hat; heavy for folds and scabbard; light for mountain bodies and robe washes; clear for far mountains, face, mist.
- Stroke profiles in `ink.js`: `brush`, `tip`, `nail`, `lens`, `fan`, `rise`, `robe`, `even` + per-point pressure; loaded strokes use `darkDir`, `side`, `brWet` (their bristles go into the wet layer); body fill fades as `(1-dry)^1.6`; `dry` .3 = textured, .6+ = flying white.
- Mountains (`land.js`): per pixel once and cached, pointed exponential peaks with 3-octave roughness; far ranges tone .12–.16 untextured, near .4–.5 textured; range ends faded with a horizontal alpha mask, never by sloping the ridge (it crosses the river). Pine: one crooked loaded trunk, a few tip branches, fan-shaped needle clusters. Reeds: long tip strokes + lens leaves, foreground only.
- Water: ink rings at each footfall, one stroke of 1.86π with an open gap, r ∝ age^0.6, fading over ~2.4 s.
- The wave: a pale wet body + 4–5 huge loaded strokes curled over at the crest + a few thin wave lines + spray as irregular blots.
- The hero (`hero.js`): 100-unit rig (hip, chest, head, arms, legs, hem points, flare, sheath, ribbon). Hat = one wet mass + two dry ridge lines + a burnt-ink brim line; robe = one pale mass + two loaded strokes; legs and sword in burnt ink; one ribbon in the wind. The face stays under the hat; features shown once (sword brows, phoenix-eye lids, one nose line, drooping moustache).
- **Qinggong leap**: body pitched ~30° forward, one knee tucked, the other leg trailing, robe pulled back into a big pale mass with a dark back edge, sleeves streaming. Step cycle: touch (14 %) → rise → glide (45 %) → descend; height `sin(π·phase)`; one ink ring per touch.
- The written 水: traced from Ma Shan Zheng, `solid: true`, dryness .17, exits tapered to .12–.18, 45° hidden-tip lead-in.
- Stable strokes: `gapLen` fixed reference length; boil on a 5-drawing cycle.
- The split wave: the upper half rises and rotates, the lower slumps and squashes, with curling crests along both torn edges and pale wash blocks; splatter flies along the sword direction with gravity.
- Ink bloom: mask `d·(0.62 + 0.8·fbm)`; element blooms use a 1/4-res mask with `destination-in`.

## End card

Title: two vertical columns written on the scroll itself (English letterforms rotated 90°, Cormorant SC 600, wide tracking) + seal; it fades in wet → dry and evaporates when the pan starts. Subtitles: Cormorant Garamond italic 500, 46 px, 1 px tracking, drying in ~0.35 s.

End card: the whole scroll on a dark table with silk borders and rollers; "CHINESE INK WASH" (Cormorant SC 600, 44 px, 14 px tracking) and the credit line (italic 30 px) in pale paper colour below. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/ink-wash/demo/
  ink.js     brush engine (strokes, bristles, masses, blots)   comp.js    WebGL rice-paper compositor (bleed, edge, paper, bloom)
  hero.js    xieyi figure rig + poses                           face.js    close-up face (one use)
  land.js    mountains, cun, cliffs, pine, reeds, ripples       wave.js    gestural wave
  glyph.js   "水" traced from Ma Shan Zheng + the cut stroke    seal.js    vermilion seal
  world.js   the handscroll world, reveals, shots 1–2           cross.js   crossing + rising (shots 3–4)
  climax.js  silence, writing, the cut (5–6)                    passage.js parted river, bow, scroll, end card (7–8)
  story.js   timeline (single source of truth)                  shots.js   dispatcher, transitions, subtitle spots, sound events
  subs.js    inscription subtitles   music/score.py  original guqin score   mix.py  foley + voice + music   build.sh
```

1. Write `story.js` times first (voice durations from `core/tts/tts.py`), then brief the score with the same numbers (the composer can run in parallel).
2. `node core/render/still.mjs styles/ink-wash/demo --range a:b:1` + `core/render/sheet.py` for overview sheets; `?test=sheet|pose|shui|frame` pages for design work; `?nosub=1`, `?poster=1`.
3. `node core/render/events.mjs` → `mix.py` → `video.mjs --fps 24 --workers 3` (1152 frames ≈ 60–130 s) → `mux.sh … 24 0` (grain 0: the paper is in the shader).
4. Or simply `sh styles/ink-wash/demo/build.sh`.

Pitfalls tied to this demo's props:
- Draw subtitles outside the world camera transform: inheriting it, they slide off screen in panning shots.
- A cliff drawn with `flip=-1` puts the figure in mid-air; the back of a cliff polygon shows a straight vertical edge; a rock's base is cut by the layer canvas bottom → compute screen extents after flipping, slant the back side, fade layer bottoms with a `destination-in` gradient.
- Start splitting the wave only after the stroke has crossed the frame, not while it is still crossing.
- A scene with rare, heavy per-pixel steps can exceed Playwright's default screenshot timeout; just retry the still render (the frame itself is deterministic).
