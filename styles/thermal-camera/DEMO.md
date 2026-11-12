# Thermal Camera — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *A Building on a Winter Night* (冬夜，一栋楼的体温, 49 s) · `thermal-camera.mp4` · source in [`demo/`](demo/)

## Story & structure

On a snowy winter night a thermal camera goes round an old six-storey brick-and-concrete apartment block: a scan line turns the street into heat; the floor slabs, the radiator niches and one leaking third-floor window light up; inside the wall the heating risers show like veins; below, one parked car has a warm bonnet, and on it sleeps an orange cat that lifts its head, looks at the camera and settles again; up on the roof the snow has melted where insulation is missing and two flues breathe hot exhaust. A year later the same building, retrofitted, is shown beside last winter's image on the same scale: the facade is darker, the leak is gone, the estimated heat loss falls from 187 kW to 73 kW (−61 %). A scan line takes us back to the visible night: the renovated block, its windows lit, the cat still on the bonnet. No people are drawn; residents exist only as lit windows and a stairwell light climbing floor by floor.

The building, its residents and the survey dates are invented; the material constants, the retrofit rules, the survey conditions and the heat-loss estimate are sourced in [`demo/FACTS.md`](demo/FACTS.md).

Why it fits: building-envelope inspection at night is the most common real job of a thermal camera, and every instrument used (spot, box, isotherm, span, before/after on one scale) belongs to that job. Native moves spent: scan line (opening, the cat, the ending), travelling split (the veins), level/span (veins), isotherm (the leak), hot-spot tracker (the cat's eyes), same-scale comparison (the verdict).

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–4.6 | Snowy street, the block with scattered lit windows | frontal from across the road, slow push | scan line left → right; the building "ignites" (signature) |
| 2 | 4.6–10.2 | Thermal facade: bright windows, slab bands, radiator niches; spot meters on the third-floor window head (5.1 °C) and the brick wall (−4.7 °C); "slab thermal bridge" label | crane up and push toward the third floor | |
| 3 | 10.2–16.2 | Isotherm > 8 °C turns the leak green; box "air leak, max 17.5 °C"; its crosshair is pinned to the hottest point of the leak on the wall | zoom from 38° to 16° onto the window, then hold | isotherm |
| 4 | 16.2–22.6 | Visible left, thermal right; span narrows to −8…+2 °C and the risers, branches and returns show; labels "heating riser", "behind the radiator" | lateral truck along floors 1–3, fixed split | travelling split + span (signature) |
| 5 | 22.6–29.6 | Row of snow-covered cars; one wet bonnet; scan right → left; bonnet 10.5 °C, cat 15.0 °C; the cat lifts its head, eyes open, the max marker jumps to the eyes (34.4 °C) and stays pinned on the left eye as the head moves, a meow, it turns and settles | descend from 2.6 m and push in high over the bonnet | scan line + hot-spot tracker (signature) |
| 6 | 29.6–35.2 | Crane over the parapet: snow-covered roof, melted patches (−2.4 °C) where insulation is missing, a working flue (22.4 °C) | crane up, tilt down to a near top view | |
| 7 | 35.2–43.4 | Before (2024-12-19) and after (2025-12-17) side by side on one scale: facade average −4.6 → −5.8 °C, window gap max 9.4 → −1.6 °C, heat loss 187 → 73 kW; verdict "heat loss −61 %" at 40.4 | locked; the frame squeezes into two halves at 36.6, all in frame by 37.4 | judgement frame, held 3.0 s before the verdict |
| 8 | 43.4–49.0 | After-image fills the frame; cut to the cat on the bonnet a year on; scan back to visible while pulling back to the renovated block, windows lit, a stairwell light climbing | pull back and land at 45.4 | end card 45.5–49.0 |

## Score structure

D minor, 72 BPM where there is a pulse. 0–4.6 bowed vibraphone and glass harp swelling under the scan; 4.6–16.2 harp eighths over a cello pedal (Dm–B♭–Gm–A), violin tremolo from the isotherm alarm; 16.2–22.6 a contrabass pizzicato heartbeat (lub-dub once a second) with a slow cello line for the veins; 22.6–29.6 D major for the cat: glockenspiel and harp, sparse, ducked under the meow; 29.6–35.2 strings rise with the crane; 35.2–40.4 a held fifth while the report is read; 40.4 the verdict lands on D major (strings, horn, harp roll, vibraphone, soft gran cassa); 43.4–end the cat motif again and a last harp chord on the end card. Foley: wind (louder on the roof), camera fan, scan sweeps, lock beeps with tick rolls, isotherm two-tone alarm, span click, detector shutter clacks at 8.2, 20.6 and 33.9 s, water gurgling in the pipes, fur rustles and one recorded meow (CC0). Mix (`audio.py`): −16.1 LUFS integrated, −3.2 dBTP, music ducked 3–5 dB under readouts; `mux.sh` masters the film to −14 LUFS with the true peak at or under −1 dBTP.

## Palette & props

Iron palette as in STYLE.md; ranges −9…+7 °C (facade), −8…+2 °C (veins), −10…+36 °C (cat), −12…+6 °C (roof); isotherm green. Night picture: sodium lamps (2000 K), warm and cool window lights, blue-grey snow. The building: three stair units, 39.6 × 10.8 m, six floors of 2.8 m on a 0.45 m plinth, exposed red brick in three-stretcher-one-header bond with grey ring beams, enclosed balconies with mixed steel/aluminium/PVC frames, AC units, window cages on the lower floors, drying poles, corrugated awnings, downpipes, sagging telecom cable, green steel unit doors with lamps and "1单元" signs, "7号楼" plate; after the retrofit, beige render with darker bands and white PVC windows. Six lofted 1980s-style sedans, four bare trees, two lamp posts, neighbouring blocks, an overcast sky, falling snow. The cat: an orange tabby, about 45 cm curled.

## End card

"冬夜，一栋楼的体温 / A Building on a Winter Night / 热成像 / Thermal Camera / LemoLab × Claude Opus 5.5", top left over the night sky of the final visible frame, 45.5–49.0 s (3.5 s: the title needs 3.34 s at the library's reading speed). The sign-off belongs to this library's demo only.

## Build notes

- `index.html` → `src/film.js` (scene, timeline `T`, `shotCam(t)`, `splitAt(t)`, `rangeAt(t)`, sound events `window.EV`, `window.render`, `window.TEXTS`).
- `src/layout.js` facade layout, window list and the steady-state temperature constants (`PHYS`); `src/building.js` walls, glass with fake rooms, frames, balconies, entrances, fittings, roof, flue plumes; `src/street.js` ground, lamps, trees, lofted cars, blocks, sky, snowfall; `src/cat.js` SDF cat; `src/thermal.js`, `src/photo.js`, `src/glsl.js`, `src/post.js`, `src/hud.js` as in STYLE.md §10.
- `tools/heatloss.py` the heat-loss estimate; `tools/measure.mjs` medians of the on-screen readings (copied into `STATE` in `hud.js`); `make_fonts.py` CJK subset; `audio.py` score and foley from `events.json`.
- `tools/probe.mjs` prints the two tracked markers (the leak crosshair, the eye marker) frame by frame with their step and change of step, to check that they glide.
- `sh demo/build.sh`: fonts and the meow recording (if missing) → `events.mjs` → `readcheck.mjs` → `audio.py` (→ `demo/out/mix.wav`) → `video.mjs` at 30 fps with `--workers 2` (`WORKERS=3` for more) → `mux.sh … 30 1` (grain 1, −14 LUFS) → poster and `demo/stills/styleframe.jpg` at 1.3 s. Needs the VSCO 2 CE, VCSL and FreePats sample libraries (`sh tools/fetch.sh instruments vsco2ce`, `… vcsl`, `… freepats`); no voice tier. Fonts are downloaded on the first run; delete `demo/fonts/NotoSansSC-*.ttf` (or run `make_fonts.py`) after any text change. three.js comes from the library's `node_modules`.
- 1080p frames take 100–135 ms on an M-series Mac (the cat frames remesh about 280 k field samples each). `render(t)` depends on `t` only; frames rendered out of order differ from in-order frames only in a handful of pixels (GPU sampling), invisible.
- Needs `EXT_color_buffer_float` (the float temperature buffer and its read-back).
- Readings: every value on screen is the median measured from the temperature buffer over its hold (`tools/measure.mjs`, copied into `STATE` in `hud.js`), with a ±0.1 flicker at the meter's 6 Hz refresh; spot meters roll up from the ambient value to that median.
- Every text the viewer has to read passes `core/render/readcheck.mjs` (74 items; Chinese and English lines of a label counted together).
- Demo-specific pitfalls: the two equally warm eyes made a per-frame max marker flip between them, so the eye marker is pinned to a fixed point on the left eye (`EYE_HOT` in `hud.js`, head coordinates) and the leak crosshair to a world point (`LEAK_HOT`), both found once from the buffer; the bonnet top is drawn by the loft's roof strip, so the warm-bonnet logic lives there; lerp the cat's head yaw through the shortest angle; keep the fur short on the face or it hides the eyes.
