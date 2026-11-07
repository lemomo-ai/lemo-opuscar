# Glass Product Render — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Aura — Hear the Light* (32 s) · `glass-product.mp4` · source in [`demo/`](demo/)


## Story & structure

A fictional pair of stemless, lens-shaped glass earbuds in a pebble-shaped glass case. In the dark they only reflect other people's light; taken apart and snapped back together on the bass drop, they light up from inside: sound becomes light running inside the glass. Theme: transparency = nothing to hide; sound = light.

The invisible thing made visible: sound as light pulses in the light guide. (The same move for other products: a battery → charge fills a glass cell; a watch → time as a light ring; a router → data as light threads; a perfume → scent as caustics.)

Arc (30–40 s): lit from outside in the dark (mystery) → opened (curiosity) → seen through (intimacy, macro) → taken apart (suspension, total silence) → **snaps together on the drop and lights up from inside** (release) → confident rhythm → returns home (settle, echo). One object, one goal (to emit its own light), one turn (reassembly).

Bookend: it opens with a light sweep revealing the dark object and ends with the *same* sweep over the object that now glows by itself; the two earbuds drop back into their cradles (magnetic click) and the frosted base of the case glows as if charging.

The rule: use at least four of the six native powers; the demo spends all six (transparency, lensing, dispersion, light inside, caustics, exploded view).

## Shots

| Beat | Camera | Why |
|---|---|---|
| Open (0–4 s) | Low 3/4 side, very slow push, ambient near zero; two sweeps | Only contours, no content: curiosity. Grab within 3 s. |
| Reveal structure | High 3/4, slow 40° orbit while the lid opens | Explain the object in one move |
| Macro | 25–45 mm away, rack focus from the glass surface to the part inside; a short sweep on every beat | Pulls the viewer *into* the glass |
| Profile | Side macro orbit | Material contrasts: clear / metal band / frosted / soft tip |
| Exploded view | 3/4, axis at ~40° to the view so parts form a diagonal with depth (near big, far small), spanning ~80 % of frame, slow orbit for parallax | Technical beauty; parallax sells the depth |
| Hero front | Straight on, slight push | Declaration: the light ring complete |
| Pattern macro | Top-down macro on the light channels | The concept at maximum size |
| Pair | Medium two-shot, second earbud flies in on a downbeat | Stereo = left/right alternation |
| Caustics | High top-down on the floor | The most memorable shot: sound spreading over the ground |
| Hero end | Low 3/4, centred under the title, slow pull-back that makes room for credits | Name + slogan + product |

The exploded shot runs to 17.0 s so the parts rush back, snap at 16.0 and the light pattern first lights up in the same frame, cause and effect in one camera position, before the cut to the front. Magnetic click back into the cradle at 28.0.

Motion numbers used: camera orbits 0.2–0.4 rad per shot; exploded-part tilts `sin(i·1.7)·0.32`, `cos(i·2.3)·0.28`; timing 3 s ease-out apart → 0.75 s hover (drifting +3 %) → **0.25 s ease-in snap** exactly on the downbeat of the drop; camera pushes in ~40 % during the 0.9 s after the snap; two frames of micro-shake on the snap. Magnetic lift 1.2–1.4 s (`eio`). Earbuds hover turned 3/4 toward camera so the lens face and light ring are visible; the lid stands at ~100° behind the case as a backlit halo.

## Score structure

Original numpy score (`demo/music/score.py`), **120 BPM, minor key**. Sub drone + glass shimmer for the dark open; FM glass-pluck arpeggio with a low-pass opening over the build; soft short kicks on every beat under the macro sweeps; noise + saw risers over the exploded view; **half a bar of total silence (reverb tails cut too)** before the drop, with a long reverse whoosh inside it; **808 drop** with a syncopated pattern ([0, .75, 1, 1.5] per bar) that the light pulses follow exactly; clap on 2 & 4; a four-note glass-bell motif; a minor-9 pad for the reveal; a high glass ding on the final settle. One kick list shared between the score and the renderer (`story.js`, `cues.json`).

Foley as used: shimmer per sweep, lid friction, magnetic clicks, an air puff per exploded part, and on the snap a cluster of six clicks 15 ms apart + the inharmonic glass chord.

Voice: Kokoro `am_michael`, speed 0.86–0.88, 3–4 very short lines. "Aura." alone is misheard as Laura / Dora, so the line is "Meet Aura." Music ducked −12 dB and foley −6 dB under the voice. Limit the drop's 808 peaks by ~3 dB in the mix: without headroom, loudnorm falls back to dynamic mode (−13.7 LUFS). Grain 0 in mux.

## Palette & props

- Accent: ice blue `#62DCFF` → soft violet `#A98BFF`; everything else neutral.
- Strip kit (sizes in mm, intensity): left & right tall strips 22×170, ×3.2; horizon strip 260×14, ×1.4; top box 160×70, ×1.1; low front card ×0.18 (0 when the concave case faces camera); top-front key 150×60, ×2.5 for exploded views only; sweep strip 26×240 on an arc ±1.35 rad behind the camera; accent card tinted by the guide colour, driven by the pulses.
- Clear glass: roughness 0.015, IOR 1.52, thickness 3–4.5, dispersion 5, attenuation `#f3f8fb` at 160 mm. Frosted glass: transmission 0.82–0.9, roughness 0.4, tint `#eef2f5`, thickness 7–14, an opaque emissive disc inside.
- Metals: satin titanium band (rough 0.16), mirror-chrome magnet (0.14; 0.05 blows out to a white disc), brushed steel and a champagne diaphragm with a concentric-brush roughness map, graphite PCB with gold traces.
- Light guide: polished acrylic `#15181b`, clearcoat 1; comet pulse head σ = w/2, tail length 4w at 55 %, white-hot core head³ × 0.35, hue blue → violet with age.
- Background sweep `#34383d → #16181b → #000` at 0–1.1; floor Reflector with a 12-tap blur, ×0.32, radial fade.
- Post: DoF aperture 700–900 for macro, 70 for the exploded view, 160–300 for wides; bloom strength 0.16–0.3 above 1.1; Neutral tone mapping, exposure 1.1. Macro distances 25–45 mm.
- Subtitle bar: 76 px tall, radius 38, `blur(18px) brightness(1.25)` + 10 % cool white, 1.2 px gradient stroke, blue → violet top line; Inter Tight 300, 40 px, tracking 1 px; held ≥ 1.9 s and ≥ speech + 0.7 s.
- Titles: Inter Tight 200, 112–132 px, tracking 56–64 px; kickers 18–20 px, tracking 8–10 ("A GLASS PRODUCT FILM", "MEET").

## End card

The title stays; credits (style name, `LemoLab × Claude Opus 5.5`) fade in at the bottom over a soft dark gradient while the camera pulls back to make room; fade to black in the last 0.6 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Rights

Product, name and shape are all original. No stemmed earbud, no dot-matrix type, no red accent, no recognisable silhouette or pattern from the reference ads; no fonts, sounds, melodies or colour templates from any launch film. Fonts in `demo/fonts`, credits in `demo/CREDITS`.

## Build notes

```
styles/glass-product/demo/
  product.js   earbud + case geometry, glass/metal/guide materials, comet-pulse shader, explode()
  studio.js    strip-light env (PMREM per frame), sweep strip, background sweep, floor mirror + caustics + beat rings
  story.js     120 BPM timeline: shots, kicks, sweeps, VO, SFX events
  main.js      per-shot staging & cameras, light/pulse logic, frosted-glass subtitles, titles, end card
  music/score.py  original numpy score (stems + score.json self-check)
  mix.py       foley synthesis + voice + ducking → mix.wav
  lines.json · subs.py · check_mix.py · build.sh
```

1. Write the cue map and `story.js` first (BPM grid, kick list shared by score and renderer).
2. `node core/render/still.mjs styles/glass-product/demo 9.3 14.6 26.8 [--q nosub=1]`: iterate stills; `--range 0.5:31.5:1` + `sheet.py` for overview passes.
3. `.venv/bin/python core/tts/tts.py demo/lines.json demo/voices` → `core/tts/asr_check.py` until all OK.
4. `python demo/music/score.py` → `node core/render/events.mjs demo` → `python demo/mix.py`.
5. `node core/render/video.mjs demo --fps 24 --workers 3` (768 frames with 2× SSAA, transmission, per-frame PMREM and mirror ≈ 30–45 s on an M-series Mac).
6. `sh core/render/mux.sh out/video24.mp4 mix.wav glass-product.mp4 24 0`, then `python demo/check_mix.py glass-product.mp4`.
7. Or simply `sh styles/glass-product/demo/build.sh`.

Pitfalls tied to this demo's props:
- Light the frosted case base with a dim cool-white disc: a cyan light strip inside it smears a teal cast over the whole case.
- The lens dome magnifies the light ring's idle glow into a pale-blue blob.
- Hovering earbuds seen straight-on read as mushrooms (turn them 3/4 toward camera); the lid lying flat behind the case reads as a pot lid (stand it at ~100°).
- Fly the second earbud in from the side: rising "from below", it passes through the visible floor.
- ASR mishears "Aura." alone (hence "Meet Aura.").
