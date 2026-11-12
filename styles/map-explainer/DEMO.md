# 3D Map Explainer — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Strait of Hormuz* 《霍尔木兹海峡》 (52.0 s) · `map-explainer.mp4` · source in [`demo/`](demo/)

Why does about a fifth of the world's oil have to squeeze through one strait, and why can't it go around? The film falls from space into the Persian Gulf, measures the strait, cuts the sea open to show its depth, flies along the shipping lanes, grows the daily flow as a pillar, draws the two bypass pipelines across Arabia, sets their spare capacity next to the flow on the same scale, and climbs back to the globe where the routes to Asia light up. English narration (Kokoro `bm_george`) with Chinese and English subtitles. Every number is sourced in [`demo/FACTS.md`](demo/FACTS.md); routes and pipeline paths are schematic and say so on screen.

## Story & structure

Question: why this place? Three contrasts: the volume is huge (20 million barrels a day), the way is narrow (21 nautical miles at the narrowest, two lanes of 2 miles each), the alternatives are small (2.6 to 5.5 million barrels a day of spare pipeline capacity, two estimates). Landing: for most of this oil there is no other way out, and most of it is bound for Asia; the film ends on the globe it started from, now with meaning in its lines.

Candidate structures considered: following one tanker from a terminal to Asia (a hero, but a ship barely moves in 50 s and the shape of the gulf is lost) and three numbers in three chapters (clear but slide-like). The funnel won because the signature, real terrain with a glowing data layer, can go one step further each time: flow → structure → depth → width → volume → alternatives → the world.

Native moves spent: *the dive from orbit*, *flows converge*, *a line ignites along its true course*, *cut the map open*, *fly the line*, *quantities on the ground*, *back to the world*.

## Shots

Film time, 24 fps, 96 bpm (one bar = 2.5 s).

| # | Time | Shot | Camera / transition | Native move / note |
|---|---|---|---|---|
| S1 | 0.0–6.4 | The Earth at night's edge, the terminator over Asia; a dim amber point at the strait with faint routes leaving it; from 2.1 a ring pulse and a leader line out to the title STRAIT OF HORMUZ / 霍尔木兹海峡, set in the dark Arabian Sea | push from 26,000 km to ~1,200 km | the globe carries the region's imagery so the dive matches |
| — | 5.6–6.4 | Dissolve through the atmosphere: the globe camera is computed from the map camera; a faint warm layer peaks halfway | dissolve | |
| S2 | 6.4–10.6 | The Persian Gulf in 3D relief; seven oil terminals light up west to east, their routes grow and pour into one trunk line flowing to the strait; country and sea names | the dive continues, pitch 79° → 52° | flows converge |
| S3 | 10.6–15.0 | The strait: the narrowest line grows between Larak Island and Great Quoin Island, NARROWEST POINT · 21 NM · 39 KM; at 12.5 (bar 6) both lanes ignite from opposite ends, dashed boundaries follow, the first ships enter | levels out, near-locked | a line ignites |
| S4 | 15.0–20.0 | The camera orbits to the west of the measured line and drops to sea level; at 15.7 the west half of the map is swept away and the section wall stands: Iran's shore, Larak, both lanes marked on the surface with dashed soundings to the floor (≈ 80 m), the deeper trench to the south; caption SECTION · NARROWEST LINE / DEEP ENOUGH FOR THE LARGEST TANKERS / WATER DEPTH ×150 · LAND ×3.2, a 0–50–100 m scale | orbit + crane down; the cut | cut the map open |
| S5 | 20.0–24.6 | The film's only hard cut, on the downbeat of bar 9: at sea level, flying west along the inbound lane, passing tankers, others coming the other way; a ruler across both lanes: INBOUND · 2 NM / BUFFER · 2 NM / OUTBOUND · 2 NM | low tracking shot, shallow focus | fly the line |
| S6a | 24.6–29.6 | The camera rises and turns to the strait; from 25.9 a pillar grows in the separation zone, one slab per million barrels a day, 20 slabs, labelled 20 MILLION BARRELS A DAY · 2024 AVERAGE · EIA | crane up + orbit | quantities on the ground |
| S6b | 29.6–34.0 | One pull-out to ~2,400 km: all of Arabia; the East–West pipeline draws from Abqaiq to Yanbu on the Red Sea, the Habshan–Fujairah line to the Gulf of Oman; cased amber lines, end points named | big pull-out | |
| S6c | 34.0–40.4 | The camera swings to the north side of the strait and sees it square-on: three pillars on open water, one scale: 20 (amber, EIA), 2.6 (teal, EIA estimate of spare pipeline capacity), 3.5 solid + lighter teal to 5.5 (IEA estimate); 70 px numbers over each; SPARE CAPACITY TO BYPASS THE STRAIT above them; the whole group in frame and held ≈ 2.6 s with every label | swing + push, then a slow drift | the verdict frame |
| — | 40.0–40.8 | The map rises and dissolves back to the globe | dissolve | |
| S7 | 40.4–52.0 | The globe turns east; routes to India, China, Japan and South Korea light up bright, Europe stays dim; the frame shifts left; 84% / OF THE CRUDE OIL THROUGH HORMUZ / WENT TO ASIA IN 2024 · EIA on the right; from 48.6 the end card takes its place | pull-back + view offset | back to the world |

## Score structure

D minor, 96 bpm, 20 bars plus the end card; the voice owns the mids.

- **S1**: bowed vibraphone high (A5, D6) over a low cello pedal; a hand chime when the strait is pinned; air.
- **S2**: one hand chime per terminal, D minor pentatonic rising west to east; contrabass pizzicato starts at bar 4; frame drum on downbeats.
- **S3**: cello spiccato eighths; a reverse swell into bar 6; the ignition: sub thump, electric shimmer, bowed basses, a climbing glockenspiel.
- **S4**: the music thins to a low pedal and slow bowed notes; a low tearing sweep on the cut; an undersea hush.
- **S5**: a timpani and frame-drum hit on the hard cut; the pulse returns; wind and sea.
- **S6**: one violin pizzicato per slab, rising; horn swells under the pillar; a low cello line follows the pipelines; half a bar of silence before the comparison, then one low note and a held bowed chord while it is read; higher pizzicato for the teal pillars.
- **S7**: harp arpeggios open up, a chime per route, a D add9 at 47.5, settling on a plain D at 50.0 (bar 21) that rings to the end; the last 1.1 s fade.
- **Mix**: narration compressed and 10 dB (RMS) over the music; music dips 300 Hz–4 kHz and ducks ~5 dB under each line; −14 LUFS, true peak ≤ −1 dBTP.

Voice: Kokoro `bm_george`, speed 0.74–0.84, ten lines (`demo/voice/lines.json`), every line passing `asr_check.py` (homophones such as strait/straight carry an `asr` field). Numbers are spelled out in the voice text and written as digits in the subtitles (`demo/voice/subs.json` → `demo/voice/cues.json`).

## Palette & props

- Deep sea #0E2230, shallows #1F5A5C, sand highlight #E8D2A6, data amber #FFA63D / #FFC36B, rules #D9E6EE, ships #F4E6CF, land ink #2B2119, sea type #BCDBE6, comparison teal #2FA3B0 / #8FD6DE.
- Props: terminal dots with ring pulses, tanker routes, the traffic separation scheme (two lanes of 2 nm, a 2 nm buffer, dashed boundaries), flat ship glyphs with wakes, the measured line, the cross-section wall, data pillars, cased pipeline lines, the globe with its routes.
- Type: Barlow Condensed (all Latin), Noto Sans SC (Chinese, subset).

## End card

In the empty sky to the right of the globe, set like a chart's title block: a north arrow and an amber rule, STRAIT OF HORMUZ (54 px) / 霍尔木兹海峡 (36 px), a hairline, 3D MAP EXPLAINER 立体地图解说, and "LemoLab × Claude Opus 5.5" (30 px). It arrives 48.6–49.0 s (the 84% steps aside 48.3–48.7) and holds to 52.0 s, clear of the subtitles at the bottom left. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- `sh styles/map-explainer/demo/build.sh` (from anywhere; `WORKERS=2` by default, `LIB=` when the demo sits outside the library): map data if missing, fonts if missing, narration if missing (Kokoro) and the speech check, `tools/cues.py`, `events.json`, picture at 24 fps (about 1–1.5 min of rendering with 2 workers), `mix.py`, `mux.sh`, `srt.py`, `readcheck`, poster and `demo/stills/styleframe.jpg` (13.8 s). The whole run takes about 6 minutes on Apple silicon once the data is there.
- **In a fresh clone** the map data (`demo/raw/`, `demo/assets/*.bin|jpg|png`) and fonts are not in git; the first run downloads them (~60 MB, a few minutes): AWS Terrain Tiles and EOX Sentinel-2 cloudless 2016 tiles (`tools/fetch.py` z10/z11 for the strait, `tools/fetch_wide.py` z8/z9 for the region, `tools/fetch_world.py` z4 for the globe, plus OSM seamark data from the Overpass API), then `prep.py`, `prep_wide.py` and `bake.py` rebuild the assets. `FETCH=1` forces it. Every URL is logged in `demo/raw/manifest.jsonl`. The score needs `sh tools/fetch.sh instruments vsco2ce` and `… vcsl`; the voice `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice`.
- `demo/index.html`: the film. `demo/post.js`: post. `demo/mix.py`: score + foley + voice. `demo/tools/`: data, fonts, cues. Sources and facts: `demo/CREDITS`, `demo/FACTS.md`.
- Render a slice: `node core/render/video.mjs styles/map-explainer/demo --q 't0=48&t1=52' …`; the page draws film second `t0 + t`, so a slice joins the full render frame-exactly.
- Checks: `readcheck.mjs` passes every on-screen text (subtitles are checked by their `.srt`: each cue ≥ 3.5 s and ≥ the spoken line + 0.6 s).
- Pitfalls of this demo's props: the flat ribbons need double-sided faces; the globe dissolves only match when the globe camera is converted from the map camera; the first pillar slab must not grow while the camera is still beside it (bloom); a white pillar on bright terrain disappears.
