# Flow-field Wind Lines 流场风线 — Style Prompt

> An invisible field — wind, current, traffic, any flow — made visible as thousands of thin ink streamlines engraved on warm paper, with darker strokes running along them at the local speed. The lines are computed from data or a physical model, never drawn by hand; they bend round coasts, mountains and objects, change colour as the magnitude crosses meaningful thresholds, and the camera travels over the printed world beneath them.
> References (grammar only): meteorological streamline charts and wind-flow maps (lines that follow the field, colour by magnitude); 19th-century engraved sea charts (hatching, double coastlines, italic water names, cartouches); line-integral and evenly spaced streamline visualisation in scientific graphics. Copy none of their layouts, colour ramps, typefaces or icons, and never name them in the film.

## 1. Essence, and what it is not

- **Every line is a streamline of a real field.** Thousands of long, thin, continuous lines that never cross; their pattern *is* the information (a vortex, a jet, a sink, a wake).
- **Two layers of ink:** a fine engraved base line, and short tapered strokes that run along it, faster where the field is stronger. Motion comes from the strokes and the field changing, not from the lines jittering.
- **Warm paper, blue-black ink, one warm ramp** for magnitude. The paper is the screen; the world under the lines is printed (a chart, a landscape, a sky), not photographed.
- **The field meets things:** coasts, relief, objects and text push the lines aside. Where lines bend is where the story is.
- **Measured, then printed:** readings, legends and verdicts are printed on the world or pinned to it with a leader.

Not a particle effect (no glowing dots, no additive light, no bloom), not Data Storytelling (no axes floating on blank paper as the main picture), not Satellite Briefing (no photographs), not a weather app (no rainbow ramp, no neon on black), not a keynote (no slides, header bars, chapter numbers).

## 2. Materials & rendering

- **Field first.** Write the field as a function `field(x, y, t)` from data or a published model (wind from a best track and a parametric vortex, currents from a grid, flow round an obstacle from a potential). Never place vortices by eye. Land, relief and objects act on the field (slowing, turning, deflecting the up-slope component), not on the drawing.
- **Streamline engine (time-varying fields):** seeds are fixed points of a jittered grid *in world units*, one grid per level of detail (spacing halves each level); every line is integrated for a fixed number of RK2 steps of fixed length in both directions, with the step shrinking only near calm points. No collision tests, no early stops: each line is a continuous function of the field.
- **Level of detail:** a level's weight is 1 − |log₂(on-screen seed spacing / target)|; two neighbouring levels always sum to one, so density stays constant through any zoom. Seed spacing ≈ 36 px at 1080p and a half-length of 4 spacings give lines ~6 px apart on average.
- **Static fields** may instead use evenly spaced streamlines (Jobard–Lefer) computed once and frozen; moving obstacles then deform the frozen lines continuously (r → √(r² + k²) in the obstacle's frame).
- **Strokes:** a phase along each line's time of flight (∫ ds / f(|v|), f compressive, e.g. v^0.6) compared with one global flow clock Φ(t); a comet profile, bright head, fading tail. Lines fade at both ends (sin^0.8 taper) and inside calm cores (an eye clears by fading, not by cutting).
- **Batching:** quantise alpha (1/40) and width (1/6 px) into buckets per colour; draw runs as polylines, round joins. Thousands of lines and tens of thousands of strokes render in well under a second.
- **The printed world:** in perspective, a WebGL pass intersects each pixel's ray with the ground plane and prints paper, depth tint, land wash with hill shading and world-anchored hatching (LOD-blended octaves so it never crawls); vector layers (coast as a double line, dotted depth contours, relief contours, graticule) are projected per frame. Paper fibre and vignette are screen-space overlays.
- **Haze:** toward the horizon the ground fades into paper; the camera never shows a hard horizon line.

## 3. Colour logic

- Neutral ground: warm paper (around #ECE0C4 to #E9D3A6), land a slightly darker umber wash, water a faint cool grey.
- Ink: blue-black (around #262C38) for calm, for coastlines and for text.
- **One magnitude ramp**, ink → slate → umber → ochre → orange → vermilion, stepped at thresholds that mean something (wind grades, speed limits, safety levels). The same ramp prints the legend, so the lines are their own key.
- Vermilion is reserved for the extreme band and for the single verdict or event on screen.
- Never rainbow, never glow, never coloured paper. Land and sea are tints, not colours.

Example (our demo): grade ramp #262C38, #2C3A4A, #3E525C, #705C3A, #9E6828, #C46C26, #C83A24 on paper #ECE0C4.

## 4. Type & subtitles

- **Roles:** a CJK serif for names and headings (e.g. Noto Serif SC, 600–700); a book serif with a true italic for English and water names (e.g. Newsreader); a monospace for readings, dates and units (e.g. IBM Plex Mono Medium). All OFL, self-hosted, CJK subset to the characters used.
- **Text lives in the world:** names of seas and regions are printed on the ground plane (italic, letter-spaced); places are pinned with a small ring and a label; readings sit at the end of a leader from the thing measured; legends, curves and the title block are printed cartouches (paper fill, double rule).
- Bilingual: one language per line, Chinese above English. Chinese printed on screen is at least 34 px at 1080p, Latin at least 20 px; printed text is sized in world units for the shot where it is read. A crowded table loses a column before its type shrinks.
- **Subtitles** (when there is narration) are printed at the foot of the chart on a soft paper wash, an elliptical fade rather than a box, no outline or shadow: Chinese (CJK serif 600, ~38 px) over English (book italic, ~29 px), centred. Compose every shot so cartouches, readings and labels end above ~900 px and the wash never covers the subject.
- Hold every readable block ≥ CJK ÷ 4.5 + other ÷ 15 + 1.5 s after it is fully in frame. A rolling reading is not reported for reading until it lands.
- Keep printed text off the strongest part of the field, or give it a paper halo.

## 5. Motion quality

- 30 fps on ones. Lines never pop, flicker or reorder: every change is continuous in time (field, level weights, fades, the camera).
- Strokes run at 60–300 px/s; compress the speed so the fastest stroke moves less than its own length per frame.
- Time in the story may run at any rate but never backwards, and is mapped through a monotone curve (no kinks).
- Readings roll through real records and land with a sound; legends print row by row; tracks draw on with beads.
- During holds the camera keeps a slow creep and the strokes keep running: the world never freezes.
- Never moves: the printed world under its labels, the paper fibre.
- **Frame rate and grain**: mux grain 1, a light film grain.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| High oblique push over a calm field | scale, the quiet before | an opening; a season; a baseline |
| Orbit round a centre while descending | something organising itself | a vortex forming; a crowd gathering; a whirlpool |
| Pull-up to the whole map, north up | the path, the context | a track; a route; a spread |
| Near-nadir lock with creep | reading, judging | a legend; a comparison; a threshold |
| Dive to a grazing pass over the surface | force, contact | a landfall; a breach; a current hitting a pier |
| Top-down follow of the moving feature | travel, squeeze | a strait; a pass; a bottleneck |
| Long pull-back with a hold | aftermath, the whole story | an ending; a summary; a record |

Tilt up to ~66° with haze; at low angles lines may lift off the ground slightly (a few km in world units) to give parallax. Transitions are camera moves only: blended shot functions, no cuts to black, no dissolves between places, no page turns.

## 7. Sound palette

- **The field is the lead instrument:** filtered noise in three bands (body 90–420 Hz, mid 0.4–1.6 kHz, air 1.8–6.5 kHz) whose levels follow the mean magnitude on screen, and a narrow-band whistle whose pitch follows the strongest value (≈ 400 Hz + 24 Hz per m/s); slow deterministic gusting; pan toward the strongest part of the screen.
- **Score underneath:** low sustained strings, a single long harmonic, sparse plucks or mallets. One soft pitched tone per data record (pitch rising with the category); a harp or pizzicato for each printed row.
- **Silence:** music cut for a beat before a verdict; the field keeps blowing; the verdict lands on a low piano and timpani.
- **Events:** contact with land is a low, muffled boom, never a crash; camera moves get soft whooshes.
- **Voice:** when the film narrates, a calm, factual voice that teaches the viewer to read the lines; compress it, keep it about 10 dB over the music and 8 dB over the wind, and let the wind and the music give way in 300 Hz–4 kHz under every line. Leave the loudest field moment and the beat before a verdict without words.
- **Mix:** music never covers the field; about −16 LUFS before mastering, sample peak ≤ −5 dBFS so the master keeps its true peak under −1 dB, energy below 60 Hz under ~10 %.

## 8. Native moves

- **The field organises.** A centre spins up; lines tighten into a spiral and, as the magnitude crosses a threshold, an empty core opens. *Fits content like:* a whirlpool at a bridge pier; a crowd circling a plaza; a market panic converging on one stock.
- **The coast twists the lines.** A moving feature meets fixed ground; lines kink at the shore, slow and turn over land, part round high ground. *Fits content like:* a river in flood meeting a levee; wind round a skyscraper; traffic meeting a closed junction.
- **The ramp crosses a threshold.** Lines change colour exactly where the magnitude enters the next category, and the legend uses the same colours. *Fits content like:* air-quality bands; speed limits on a road network; heat stress levels.
- **Beads on a track.** A dashed path draws on with one bead per record in the category colour and a date every day. *Fits content like:* a migrating bird; a drifting buoy; a ship's voyage.
- **The printed verdict.** A cartouche prints row by row, everything holds, then a pointer climbs and stops on a row that inks in. *Fits content like:* a building code against measured load; a forecast against what happened; a rating scale.
- **The grazing pass.** The camera skims the surface and the strongest lines stream past in the foreground. *Fits content like:* a tidal race; a ski slope's wind; a jet stream crossing an ocean.
- **The field relaxes.** As the driver weakens, spirals open, the core fills, the colour drains back to ink. *Fits content like:* a storm's decay; a crowd dispersing; a current slackening at the turn of the tide.

Our demo opens on a high oblique push over a calm field, uses *the printed verdict* as its turn and ends on a long pull-back held over the whole track. A new film opens and ends another way: a single line drawn across blank paper that multiplies into the field, *the grazing pass* already inside the strongest flow, a printed legend the lines pour out of, or an ending on the last reading landing as *the field relaxes*.

## 9. Pitfalls of the medium

- **Flicker** comes from anything discrete that changes with t: collision-terminated streamlines recomputed per frame, seeds in screen space, a level switched on or off, a step count that changes, a seed culled when it crosses the near plane. Fix: world-fixed seeds, fixed step counts, weights and fades only, conservative culling (cull by where the line can reach, clamp the LOD measure near the camera).
- **Piling at sinks:** convergent fields bunch lines into black knots. Shrink the step with the speed, fade lines in calm cores, keep line length moderate.
- **Shimmer:** 1-px lines under a fast rotating camera alias. Keep rotations slow (under ~20°/s), widths ≥ 1 px, and strokes shorter than they move.
- **Fake fields:** vortices placed by hand read as decoration. Derive the field; document the model, its parameters and what is approximated (terrain, friction) next to the film.
- **Perspective text:** plane-printed text at grazing angles is unreadable; print it for top-down shots and pin labels on low ones.
- **Rainbow ramps and glow** turn the engraving into a weather app. One warm ramp, flat ink.
- **Horizon:** a low camera shows the end of the world; haze it into paper and cap the footprint there.
- **Text over the strongest lines** gets lost; place it beside the feature with a leader, or give it a paper halo.
- **Maps of China follow the national standard map:** the South China Sea islands (Dongsha, Xisha, Zhongsha with Huangyan Dao, Nansha) are drawn and named with their standard Chinese names (pinyin in English: Xisha Islands, not Paracel), the dashed line is printed in the chart's own ink whenever its waters are in frame, the Diaoyu Islands are drawn, Taiwan carries the same land treatment as the mainland and no country name, and land boundaries are left out unless their course is certain. Island marks are symbols scaled up to stay legible; positions come from published base points or open gazetteers, cited next to the film.
- **A view that shows the South China Sea but not its southern part carries a 南海诸岛 inset**, as published maps of China do: a small cartouche in the chart's paper, ink and type, the whole sea from about 2°N to 23°N with the dashed line, the four island groups and Zengmu Ansha. Place it over empty sea or land away from the subject, the other cartouches and the subtitles. Names never sit on the dashed line or a coastline: move the label, not the line.
- **Wide shots hide what matters under cartouches:** a legend or curve placed over open water may cover islands; place it where the chart is truly empty.

## 10. Engine

- `demo/field.js`: Mercator kilometres (`toXY`, `toLL`), `makeStorm(track)` (spline track, monotone intensity, Holland B, Rmax, translation), `wind(X, Y, S)` (vortex, inflow, background, land and terrain), `buildTerrainGrid` for fast slope and land lookups.
- `demo/wind.js`: `drawWind(g, cam, S, o)`, the streamline engine (levels, fixed-step RK2, time-of-flight strokes, buckets); `GRADES` (thresholds and ramp).
- `demo/camera.js`: `makeCam({tx, ty, dist, tilt, head, fov, lift})` with `project`, `ray`, `footprint`, `rowAt`.
- `demo/chartgl.js`: the printed ground in WebGL2 (height grids, land wash, hatching LOD, focus fade).
- `demo/overlay.js`: printing on the plane (`plane`, `ptext`), pinned screen text (`stext`), the `window.TEXTS` registry.
- `demo/tools/prep_dem.py`: ETOPO1 → coastlines, contours and grids (marching squares, Douglas–Peucker).
- `demo/tools/make_scs.py` → `demo/scs.js`: South China Sea islands and reefs, the dashed line and the Diaoyu Islands as lon/lat data; `film.js` prints them with the coast (dashes) and above the lines (islands).
- `demo/tools/timeline.py` → `demo/timeline.js`: narration starts, captions and a monotone map from film time to the chart's story time, so a narrated cut can stretch or tighten shots without rewriting them; the flow clock is integrated in film time, so strokes keep their screen speed.
- Minimal new use: replace `wind()` with an ocean-current grid sampler (bilinear in time between two dated grids), keep `drawWind`, set `GRADES` to current speeds in knots; the engine draws a Gulf Stream with no other change.

## 11. Variation space

The agent decides the field and where it comes from, the world under it (chart, landscape, building section, sky), the thresholds of the ramp, the camera path, the pacing and whether there is a verdict.

- **Structures:** one year of a monsoon in four seasonal holds over one locked chart; a single object (a tower, a ship) with the field re-forming round it under three conditions; two cities compared on one chart with a whip between them.
- **Openings:** a single line drawn across blank paper that multiplies into the field; a grazing pass already inside the strongest flow; a printed legend that the lines pour out of.
- **Endings:** the field fading to calm ink lines over a still chart; a pull-back to a globe-wide pattern; the last reading landing and the strokes slowing to a stop.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
