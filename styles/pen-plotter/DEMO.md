# Pen Plotter — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *8848.86* 《8848.86》 (49.9 s) · `pen-plotter.mp4` · source in [`demo/`](demo/)

## Story & structure

Logline: at night in a survey institute's drafting room, a pen plotter under a desk lamp draws Mount Qomolangma (Everest) with four pens: brown contours from the summit outward, grey hatching on the north slopes, a red climbing route and its elevation profile, the three official summit heights in black, a red ring around the 2020 value, and finally 8848.86 m written stroke by stroke.

Arc: the rack (a pen is chosen) → the mountain grows out of contours → the drawing stands up as a mountain and lies down again → the route climbs camp by camp → the profile climbs → three heights compared, a held breath, the ring → the number → the whole desk.

Real data: contours from NASADEM (NASA, 1 arc-second), 50 m interval, index every 250 m; the route is a least-cost path on the DEM pinned at Base Camp, North Col and the summit, labelled approximate on the sheet; camps sit where the profile first reaches their published altitudes (5200, 5800, 6500, 7028, 7790, 8300 m); heights 8848.13 m (1975), 8844.43 m (2005, rock surface), 8848.86 m (2020, snow surface, announced by China and Nepal). Every source is in `demo/FACTS.md` and `demo/SOURCES.md`. No people, no hands.

Native moves spent: contours growing outward (shot 2), the sheet stands up (shot 3), hatching as tone (shot 3), the path in the accent ink (shot 4), the enlarged scale (shots 5–6, the box drawn before the line that climbs into it), the pen change as punctuation (shot 6, off screen during the hold), the hero number in single line (shot 7).

## Shots

30 fps, 120 BPM. Machine time follows real kinematics (90 mm/s drawing, 125 mm/s for the hero number, 260 mm/s travel); `WARP` in `main.js` sets the stretches that play at real speed and the jumps between them (on beats). The whole sheet is 74 minutes of machine time.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–4.0 | the gripper takes the brown pen from the rack (0.7), travels, drops at the summit (2.2), first rings beside the summit label | rack macro, then a pan with the carriage, down to the nib | real speed |
| 2 | 4.0–11.0 | contours spread from the summit outward over the whole map | from above, south side, pulling back 0.4 → 0.62 m | **signature 1**; 14 jumps, one per beat |
| 3 | 11.0–17.0 | the contours rise to true-scale height (1 mm = 80 m), summit first, then settle; brown pen back to the rack and grey out (off to the side); grey hatching on the north face | low across the sheet from the north, lateral move | **signature 2**; hatching in jumps from 14.6 |
| 4a | 17.0–17.9 | the gripper takes the red pen | rack insert | |
| 4 | 17.9–26.2 | red route from Base Camp; a jump to below the North Col; Camps 1–3 (bells at 20.45, 21.33, 22.15), summit at 22.9 and a red triangle; a jump at 23.9 (the carriage is away drawing the zoom box) leaves the camps clear | long lens following the nib, then rising over the camp cluster | camp labels clear 2.3 s |
| 5 | 26.2–31.0 | the zoom box and its dashed callout to the enlarged scale already wait at the top right; the elevation profile is drawn in red, a ring at each camp, and climbs into the box | south-east medium, panning with the pen | one jump at 28.4 |
| 6 | 31.0–39.1 | black pen writes the inset (four jumps); the frame holds from 33.1 while the pen goes to the rack off screen; red pen returns and rings 8848.86 m (36.15–37.16); a jump at 37.25 takes the carriage out of the frame | locked three-quarter on title and inset, 2 % creep | **comparison held 3.0 s before the ring, 1.85 s clear after it** |
| 7 | 39.1–46.1 | 8848.86 m written in single line, each stroke traced twice; one jump at 40.9; done at 42.1; the red pen parks (45.1) | following the pen, then up and out to the whole desk, still from 45.0 | **signature 3**; caption held 3.6 s |
| 8 | 46.1–49.9 | end card | screen | below |

## Score structure

120 BPM, D major (B minor and G colour on the way). One instrument family per pen: brown = marimba eighths with pizzicato bass, D–Bm–G–A, a woodblock on every jump; grey = string swell under the lift (G add9), a falling harp as the relief lies down, vibraphone eighths under the hatching; red = glockenspiel and harp, one bell per camp climbing D5–E5–F♯5–A5–B5–D6, a harp chord at the summit, spiccato cellos and harp sixteenths for the profile; black = violin and cello pizzicato. 33.1–36.1: music out, one faint bowed vibraphone note, the room and the off-screen pen change. 36.15: strings D chord with the ring, vibraphone and timpani as it closes. Shot 7: the climbing figure on violins and horn, timpani roll, the resolve on the last stroke (42.1). End card: piano chord, the figure once on glockenspiel.

Machine sounds come from the page's per-frame events: stepper whine pitched by pen speed, paper scratch while down, servo buzz on Z moves, a tick per pen drop, solenoid clacks at the rack, a quiet room (mains hum, night outside). Mix: −16.1 LUFS integrated, true peak −3.8 dBFS, below 60 Hz −18.9 dB under the full band; music sits ~5 dB under the machine in drawing passages.

## Palette & props

- Paper #F1ECDF; inks black #16161C, sepia #763C1A, grey #686662 at 70 %, red #CC221A; pen barrels in the same colours, a cream band each.
- A2 sheet taped to a light grey bed; aluminium rails, black beam and carriage, drag chain, Z holder with two jaws, a four-stall rack with rubber cups at the left edge; a small control box at the back.
- Drafting table in dark walnut; a green architect's lamp clamped at the front left (the key light); a mug, a field notebook, spare pens; a plan chest with map rolls, a window with blinds and a theodolite behind; shelves of binders and map tubes on the other wall (bokeh in the low shot).
- Sheet layout: map 1:80 000 on the left (graticule every 2′, north arrow, scale bar); title, the enlarged summit-height inset, the profile, the hero number and the legend on the right.

## End card

Dark warm ground; the lines are drawn like plotter strokes, left aligned at the lower left: **8848.86** in red, then 8,848.86 Metres, 笔绘仪, Pen Plotter, a dotted rule, LemoLab × Claude Opus 5.5. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- One command, from the library root: `sh styles/pen-plotter/demo/build.sh` (`WORKERS=3` for more render workers, `PLOT=1` to rebuild the plot). It needs the VSCO 2 CE, VCSL and Salamander sample libraries (`sh tools/fetch.sh instruments vsco2ce`, `… vcsl`, `… salamander`) and the Python venv (numpy, scipy, Pillow, fontTools).
- `plot.json` (every stroke of the sheet, 4.7 MB) and `demo/data/` (NASADEM tiles, cropped DEM, route, font sources) stay local. On a fresh clone the first build downloads the four NASADEM tiles from Microsoft Planetary Computer (~90 MB, no account) and the font sources from github (~45 MB), then runs `fetch_dem.py` → `crop_dem.py` → `route.py` → `make_plot.py` (→ `plot.json`) → `fonts.py` (font subsets for the record). The pipeline is deterministic: the same tiles give the same `plot.json`, byte for byte.
- `demo/tools/`: `preview_route.py` and `flat_preview.py` draw check images; `timing.mjs` prints the machine-time plan.
- `demo/plot.js` (program and kinematics), `demo/main.js` (scene, warp, cameras, `TEXTS`, events), `demo/audio.py` (score + machine sounds → `mix.wav`; needs `events.json` from `node core/render/events.mjs styles/pen-plotter/demo`). three.js r170 and the post chain come from the library (`node_modules/three`, `core/three/post.js`).
- Stills and contact sheet: `sh demo/tools/sheet.sh` (→ `demo/out/sheet.jpg`). Loudness of the mix: `sh demo/tools/measure.sh`.
- 1080p frame time on an Apple GPU: 30–350 ms (2× supersampling, ambient occlusion, depth of field, 4096 shadow map); the first frame of a worker redraws the whole 6144 px sheet, still under 1 s. Each worker holds about 0.6 GB (the 6144 × 4344 sheet plus five close-up patches); the lifted lines need WebGL2.
- `demo/demo.json` sets the render (49.9 s, 30 fps, grain 1). `build.sh` ends with `node core/render/readcheck.mjs`: all 33 text blocks pass (the tightest are the sign-off, 2.98 s for 2.90 s needed, and the English caption under the number, 3.56 s for 3.43 s).
- Demo-specific pitfalls: the carriage covers labels while it passes them, so the plotting order sends the pen away from what must be read next (zoom box before profile) and a jump after the triangle and after the ring clears the frame; the beam's shadow is a hard bar unless the lamp is on the camera's side; the lifted relief only reads from above the paper (≈ 85 mm high), from lower it becomes a stepped wall.
