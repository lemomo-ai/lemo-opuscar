# Flow-field Wind Lines — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Typhoon Yagi over Qiongzhou* 《摩羯过琼州》 (52.0 s) · `flow-field.mp4` · source in [`demo/`](demo/)

In September 2024 Super Typhoon Yagi made landfall at Wenchang, Hainan. Thousands of streamlines over an engraved sea chart draw it from its first spin over Luzon to its decay in Vietnam; the field is computed frame by frame from the CMA best track with a published parametric vortex, so every curl is data. English narration (Kokoro `bm_george`) teaches the viewer to read the lines, with Chinese and English subtitles. Weather only: no people, no damage. Every number and every place on the map is sourced in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Hook: the first line, "Every line on this chart is wind." Each part then teaches one more way to read the lines: they turn and an eye opens; dots on a track are records; colour is grade; land bends them; over land they come apart and go back to ink. Turn: the national grade table holds still for 2.75 s, the music drops out for a beat, the pointer stops on *Super Typhoon*, and only then the voice says "62 metres per second". Landing: the camera pulls back over the South China Sea (a 南海诸岛 inset completes its southern part) and the intensity curve draws while a vermilion ring runs along the track at the same hour: "Its whole week fits in one last line", answering the first line.

Candidate structures considered: a countdown to landfall (a timer would take the lead from the lines) and one locked chart with four stops (complete, but no orbit, no grazing pass). Following the eye won: time only runs forward, and each signature move goes one step further than the last.

Native moves spent: *the field organises* (2), *beads on a track* (3), *the printed verdict* (4), *the coast twists the lines* and *the grazing pass* (5), *the squeeze between two coasts* (6), *the field relaxes* (7), and one of our own, *the curve and the track draw the same hour* (8).

## Shots

Film time, 30 fps. The chart code keeps a 49 s story clock (`TAU_KEYS`, `SHOTS` in `film.js`, key times `T` in `story.js`); `demo/timeline.js` maps film time onto it through a monotone cubic (`ANCHORS` in `demo/tools/timeline.py`), which is how the narrated cut gives each line room without rewriting a shot.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–4.9 | the calm sea already flowing; a small vortex turning over Luzon; the title block printed on the water | high oblique, slow push east | lines run from frame 0 |
| 2 | 4.9–11.5 | the storm intensifies: lines tighten and turn vermilion, the eye clears at ~7, the tag rolls through the records and lands at 8.9 on 5 Sep 08:00, 62 m/s, 915 hPa | orbit 114° round the eye, descending 820 → 330 km | **the field organises** |
| 3 | 11.5–18.5 | the track draws on (12.2–14.2), one bead per record, a date each day; the storm moves west; Xisha, Dongsha, Zhongsha and Huangyan Dao labelled; a 南海诸岛 inset printed top right over the open Pacific, ≈14.0–17.6 | pull-up to 3100 km, pan west, north up | beads on a track |
| 4 | 18.5–28.9 | the grade table (GB/T 19201-2006) prints row by row; whole table held 20.15–22.9; pointer 22.9–23.75 stops on Super Typhoon; music silent 23.33–23.75 | near-nadir with creep | **the printed verdict** |
| 5 | 28.9–36.9 | landfall at Wenchang 32.5; the lines kink at the coast and dim over land; the last second is wind only | dive to a grazing pass (tilt 66°, 175 km), side orbit 34° | **the coast twists the lines** |
| 6 | 36.9–42.1 | through the Qiongzhou Strait; second landfall at Xuwen 39.5; the Beibu Gulf | rise to top-down, follow the eye, west up | the squeeze |
| 7 | 42.1–45.6 | landfall in Vietnam 43.6; the spiral opens, the eye fills, the lines drain to ink | follow, turning north up | **the field relaxes** |
| 8 | 45.6–49.5 | the whole track and the South China Sea down to about 7°N with its islands and the dashed line, the five groups labelled; the 南海诸岛 inset bottom right from ≈48.1 completes the sea to Zengmu Ansha; the intensity curve prints top right while a ring runs along the track | pull-back to 3500 km over 115.6°E 15.6°N, still from ~48 | curve and track, same hour |
| 9 | 48.4–52.0 | the end card prints bottom left and holds 3.4 s | locked | |

Narration (English voice, subtitles Chinese over English, one line each):

| Start | Line |
|---|---|
| 0.15 | Every line on this chart is wind. |
| 3.45 | Then, over the Philippines, they began to turn. |
| 7.54 | A calm eye opened. |
| 10.40 | Its name was Yagi. Each point is one record of its path. |
| 16.10 | It headed west, toward Hainan. |
| 24.05 | Sixty-two metres per second. The top grade: super typhoon. |
| 31.90 | It came ashore at Wenchang, and the land bent the lines. |
| 37.10 | It crossed the strait, and struck the mainland again. |
| 41.70 | Into Vietnam, the spiral came apart, and the lines went back to ink. |
| 47.85 | Its whole week fits in one last line. |

86 words in 34.7 s of speech (2.48 words/s); captions hold at least the line + 0.6 s (shortest 2.45 s).

## Score structure

D minor, unmetred, under the wind; the voice owns the mids.

- 0–4.9: a single violin harmonic (A5) over a cello D.
- 4.9–11.5: contrabass and cellos swell, a soft timpani roll, a glockenspiel tone for each record the tag rolls through (pitch by grade), a low piano chord when it lands.
- 11.5–18.5: strings move Dm–B♭–F–C, a vibraphone tone per bead.
- 18.5–23.3: harp per table row, thin strings; 23.33–23.75 silence (music and voice), the wind continues; 23.75 low piano D, timpani, bowed vibraphone on the verdict.
- 28.9–36.9: music almost gone, the wind at its loudest, a muffled low boom at each landfall.
- 36.9–42: a falling viola line; 42–52: a quiet open D-minor chord, a harp spread as the curve prints, a piano on the end card, a 1.4 s fade.
- Wind: three noise bands and a whistle driven by the modelled wind on screen (`w` events every 0.1 s in `events.json`). Under each line the wind and the music give way in 300 Hz–4 kHz; voice RMS about 14 dB over the music and 8 dB over the wind while it speaks.
- Measured on the master: −14.0 LUFS integrated, true peak −1.6 dBTP.

## Palette & props

Paper #ECE0C4, ink #262C38, vermilion #B8432A for verdicts, landfalls and the ring; wind lines by grade (`GRADES` in `wind.js`). The chart: ETOPO1 coastlines as a double line, dotted depth contours, Hainan relief contours, 1° and 5° graticule, umber land with hill shading and hatching. The South China Sea islands and reefs, the dashed line and the Diaoyu Islands from `scs.js` (FACTS.md §9): island marks scaled up to stay legible, reefs as dotted rings; the 南海诸岛 inset (`raw/inset.json`, a land mask and coastline at 6′) printed as a cartouche with the same paper, ink and type. Props: the tropical-cyclone symbol at the storm centre, the dashed track with beads, four cartouches (grade table, intensity curve, 南海诸岛 inset, title block). Typefaces: Noto Serif SC, Newsreader (roman and italic), IBM Plex Mono Medium.

The wind model and what is approximated are in FACTS.md §7: Holland (1980) profile, Willoughby et al. (2006) Rmax, Sobey et al. (1977) inflow, Lin & Chavas (2012) background flow; terrain is an approximation (vortex cut to 0.75 over land, turned 15° inward, up-slope component removed by slope).

## End card

The chart's title block, printed bottom left of the final map from 48.4 s and fully in place from 48.6 s to 52.0 s: 摩羯过琼州 / *Typhoon Yagi over Qiongzhou*, 流场风线 / *Flow-field Wind Lines*, and "LemoLab × Claude Opus 5.5". The sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build

`sh styles/flow-field/demo/build.sh` (`WORKERS=3` for more render workers, `VOICE=1` to regenerate the narration).

- Needs the voice tier and three sample libraries: `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice`, `sh tools/fetch.sh instruments salamander`, `… vsco2ce`, `… vcsl`. WebGL2 for the printed ground.
- In a fresh clone `demo/tools/fetch_data.py` downloads what git does not carry: the ETOPO1 subsets through ERDDAP (~32 MB, `raw/dem/`), the Natural Earth dashed-line layer (`raw/ne/`) and the four OFL fonts (`fonts/src/`). `tools/prep_dem.py` then builds `raw/chart.json` (coastlines, contours, height grids), `tools/prep_inset.py` builds `raw/inset.json`, `tools/make_trackjs.py` builds `track.js` from `data/yagi_cma_track.csv`, `tools/make_scs.py` builds `scs.js`, `tools/subset.py` subsets the fonts.
- Then: narration (`voice/lines.json` → Kokoro → `asr_check.py`, every line passes), `tools/timeline.py` (captions, the time map, `flow-field.srt`), events, picture, `mix.py`, `mux.sh`, readcheck, poster and the gallery style frame (t = 33.6, rendered with `?nocap=1`: no subtitles, no sign-off).
- Code: `index.html` → `film.js` (time map, `TAU_KEYS`, `SHOTS`, flow clock, chart vectors, islands, frame), `field.js` (Mercator km, storm, wind, terrain), `wind.js` (streamline engine, `GRADES`), `camera.js`, `chartgl.js` (WebGL2 ground), `overlay.js` (printing on the plane, pinned text, `window.TEXTS`), `story.js` (everything printed or pinned, captions, end card, sound events), `timeline.js`, `track.js`, `scs.js`.
- `render(t)` keeps no state between frames: every streamline is recomputed from t. 1080p: about 0.3–0.7 s per frame on an M-series Mac.
- Review tools: `tools/frames.mjs` renders exact consecutive frames; `tools/flicker.py` reports pixels that spike against both neighbours.
- `readcheck.mjs` (`--step 0.1`) passes everything except three map labels, left as they are: the smallest line of the title block, "2024年9月 · 中国气象局最佳路径" (4.20 s against 4.34 s); the sea name "琼州海峡 Qiongzhou Strait", printed on the water as the camera rises (1.6 s); and the tag "22时20分 再次登陆 / Second landfall · 22:20" (2.8 s against 3.1 s; longer would meet the next subtitle).
- Pitfalls tied to this demo: plane-printed text in the grazing pass (pin labels there instead); the eye over land reads as an empty patch unless the land wash is light; the table must sit clear of the storm's strongest quadrant; on wide shots the curve cartouche must not cover the South China Sea islands, and island-group names must sit clear of the dashed line.
