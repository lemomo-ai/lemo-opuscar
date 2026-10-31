# Satellite Briefing — Style Prompt

> Real satellite imagery of a real place, graded down to an analyst's grey, with thin white measurement lines drawn on the ground: a lock-on reticle, outlines, a range line, one reading. One continuous zoom built from stacked imagery plates carries the viewer from orbit to the ground and back, and time can run inside one locked frame.
> References (grammar only): open-source investigation films that annotate satellite pictures (thin lines on imagery, one claim per screen, measuring as the plot); the Eameses' *Powers of Ten* (one continuous change of scale with a readout); NASA Earth Observatory's *World of Change* (one place, time running). Copy none of their layouts, typefaces, icons or music; never name them in the film.

## 1. Essence, and what it is not

- **The ground is a photograph**: real, licence-clean, georeferenced satellite or aerial imagery of the actual place. Nothing on the ground is drawn, stylised or generated.
- **Two layers, two truths**: the imagery is what the satellite saw; the hairlines are what the analyst measured. Marks are thin, white, sparse, and sit on real coordinates.
- **The grade moves with the story**: orbit in true colour, the analysis layer in grey, colour back only where the story turns.
- **Scale is the camera**: one zoom from orbit to the ground built from nested plates, with an altitude readout and a scale bar from the same camera.
- **One finding per screen**, in the single accent colour.

Not Data Storytelling (a chart on paper), not Sci-fi Hologram HUD (no glowing wireframes or invented chrome), not Blueprint, not Isometric Infographic (real nadir or oblique views, no diorama), not a keynote (no slides, header bars or chapter numbers).

## 2. Materials & rendering

- **Plates**: georeferenced rasters with a lon/lat box, sampled in a shader where the camera ray hits the ground, nested by resolution (world → region → detail) with feathered edges so finer plates dissolve in as the camera descends.
- **Globe**: ray–sphere from a perspective camera, a thin atmosphere rim, limb shading at orbit only; compute |C|² − R² in double precision (float32 fails below a few tens of km).
- **Time**: dated plates share one grid. A soft scan front (a satellite pass, never a hairline) swaps them: north → south forward, south → north for a rewind. Growth can run outward from the old edge, ordered by a distance map.
- **The analyst's grade** (one uniform from colour to grey): luminance with local contrast and clarity, a shoulder so salt, snow and cloud stay below white, toned blue-black → cool silver up to ~65 % grey, a fifth of the chroma. White belongs to the marks.
- **Marks**: a 2D overlay through the same world → screen function: hairlines 1.2–2.6 px with a dark halo, dashes for history and claims, brackets, ticks, leader lines. Lines draw on; outlines print behind the scan.
- **Screen space only for instruments** (altitude, scale bar, imagery credit) and the transcript strip. Everything else is anchored to the ground.
- **The claim layer** is a printed map drawn in the shader from a distance field of the old outline: paper grain a few pixels wide at any zoom, halftone ink, coast and waterlines, graticule, the serif name.
- **Post**: light grain in ffmpeg, a vignette, directional blur only on whip pans.

## 3. Colour logic

- Neutral ground: grey, roughly 3–65 % in value. White means *measured*.
- One accent (warm, e.g. amber) for the single reading on screen, never decoration.
- A second hue may mark the **claim** the imagery tests (a map, a plan, a promise): flat, cartographic, never used for anything measured.
- True colour is evidence: at orbit, and again only where the story turns (the field that greened, the water that returned).
- No false-colour ramps over the imagery.

Example (our demo): ground #070B0E → #A1A7A9, marks #F2F5F6, reading #FFBE55, map blue rgb(46, 112, 206).

## 4. Type & subtitles

- **Roles**: a light condensed grotesk for the reading (96–130 px, e.g. Barlow Condensed); a monospace for instruments and dates (20–34 px, e.g. IBM Plex Mono); a sans for labels in the film's language (24–42 px); a serif only for the claim layer and the title. OFL, self-hosted, CJK subset to the characters used.
- **Labels attach to the ground** with a leader line. The reading sits in the right third beside what it measures, label above, source note below ("Landsat, measured").
- **Subtitles are a transcript strip** at the bottom left: a 2 px white rule, a dark plate fading right, left-aligned, each line on one line (measure with the real font, `nowrap`; split a long sentence into two cues). If the film is bilingual, the film's language on top.
- Nothing below 20 px at 1080p, the imagery credit included.
- Hold subtitles ≥ max(1.8 s, speech + 0.6 s); a rolling counter reports its landing value; labels stay ≥ characters ÷ 4.5 + 1.5 s (CJK).

## 5. Motion quality

- The camera never stops: distance interpolates in log space, segments ease, holds keep a 2–5 % creep or a slow rotation. No frozen frame longer than a second.
- Marks arrive by being made: a line grows, an outline prints behind the scan, a counter rolls and lands with a small pop, a reticle snaps with overshoot.
- Time changes are scans, never dissolves; their spacing tells the speed, and the camera moves with them (accelerating as the steps shorten, braking on the last).
- Never moves: the ground under its annotations, the instrument positions.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Oblique orbit, limb in frame | scale, context, distance | an opening; a return; a title card |
| Dive (log zoom, tilt to nadir) | going to look for yourself | a reveal; checking a claim |
| Locked nadir frame, slow creep | evidence, comparison | time running in one place; a measurement |
| Push-in on a point | singling out | one town, one dam, one field |
| Track along a line | travelling a distance | measuring; a river, a road, a border |
| Whip pan with blur | a new subject at the same altitude | the counter-example; "meanwhile" |
| Climb back to orbit | consequence, perspective | an ending; a summary |

At key moments the subject fills a third of the frame height; reading right, subtitles bottom left, instruments in the corners. Transitions: scan-line swaps, a map layer switched off, zooming through plates, whip pans, the reticle opening into a title card. No crossfades between unrelated places, no hard cuts inside a zoom.

## 7. Sound palette

- **Telemetry**: FM pings (a lock-on ping worth bringing back), dry ticks on the grid that divide to accelerate, noise scans (rising for a rewind, falling forward), servo whines, a ratchet for a range line.
- **Weight**: timpani, bass drum, gran cassa, bowed cymbal, a tam-tam reversed when time runs backwards. Measurements land on a pitched hit.
- **Synthesis**: a pulse bass with audible 2nd and 3rd harmonics, detuned-saw pads under a low-pass, risers for dives.
- **Beds**: orbit hum, radio hiss, data chatter; the place's own ambience (wind, water, a far horn), sparingly, often as J- or L-cuts.
- **One option for the shape**: keep the palette dry (electronics, skins, metal) and let one wet timbre (glass, water, bowed metal) mark the turn.
- **Silence**: music and foley stop, a thin bed stays, impacts may decay into it; the first sound after it is the turn. A short suck-out (0.2–0.45 s, music and foley down ~25 dB) before the heaviest impacts makes them land.
- **Mix**: voice ~10 dB over music; the two or three designed impacts are the loudest moments (out of the bus compressor, with mid-range body, e.g. a low-brass stab); 20–60 Hz about 15 dB under the full band (high-pass ~40 Hz, impact weight at 60–120 Hz); −14 LUFS, true peak ≤ −1.2 dB. Voice: a calm analyst, short declarative lines.

## 8. Native moves

- **The map against the photograph.** The camera falls into the printed map of the claim; a scanner bar tears it away and the ground is underneath; the name outlives the page. *Fits content like:* a lake still on maps but gone; a cleared concession forest; a planned city never built.
- **Time rings in a locked frame.** Dated plates scan in one by one; each leaves its outline, the band lost between two rings flashes. *Fits content like:* a glacier's retreat; a city's sprawl; a fire scar season after season.
- **The range line.** Mark the destination, grow a ticked line from A to B, chase the tip while the reading counts up, land on the number, pull back to show the whole distance. *Fits content like:* how far a shore moved; a village to its well; a camp to the border.
- **The dive and the climb.** One zoom from orbit to the ground, or back. *Fits content like:* locating anything; a scale reveal; an ending that returns one place to the planet.
- **Colour returns where the story turns.** Only the subject regains true colour inside the grey. *Fits content like:* an irrigated field; a refilled reservoir; a regrown forest.
- **The reticle becomes the frame**: the lock-on brackets open out to frame a title card or the last reading.

## 9. Pitfalls of the medium

- **Licences**: not usable: Google Earth/Maps, Bing, Esri World Imagery, Mapbox Satellite, Planet, Maxar, news photos, AI-generated imagery. EOX Sentinel-2 cloudless is CC BY 4.0 only for 2016 (2018 onward is NC). Raw Copernicus Sentinel data need "Contains modified Copernicus Sentinel data [year]"; check the user's rules. Public domain or free with credit: USGS Landsat (1972 on, worldwide), USGS NAIP (US, ~1 m), NASA Blue Marble, MODIS, VIIRS. Burn a readable credit into the picture and list every asset in `CREDITS`.
- **Finding imagery for a new place**: search by bounding box and date in the Planetary Computer STAC (Landsat C2, Sentinel-2 L2A; no account) or USGS EarthExplorer; MODIS/VIIRS and Blue Marble from NASA GIBS; coastlines, lakes and rivers from Natural Earth (borders and China: DIRECTOR.md §13). Log every request. OSM (ODbL), CC BY-SA and "no known restrictions" are not CC0: name the terms and ask the user first. Ask for the user's own surveys or GIS layers when the place is theirs. Never fill a gap with generated imagery presented as evidence.
- **Seams**: paths imaged on other days disagree. One date per path, each scene gain-matched on stable land, feathered overlaps, holes filled from the same year only.
- **Old sensors**: Landsat MSS (to 1992) has no blue or SWIR and drops scan lines: nearest-neighbour resampling, near-zero rows as nodata filled from same-year scenes, scan-angle streaks cleaned on land only. Inspect every year at full contrast.
- **Plumes and haze** cross water as bright diagonal bands: swap the scene for another date of the same year rather than painting it out.
- **Edges**: resampling against nodata darkens scene rims (erode the mask); drop contour pieces along a plate border. Real straight edges (dikes, polders) can read as seams: frame them out or label them.
- **Grey mush at close range**: raise local contrast for that altitude only and dim outside the measured corridor.
- **Water and cloud**: MNDWI where shortwave infrared exists, only the basin you measure; clouds read as features in grey, so use the dry season.
- **Facts**: keep a FACTS.md in the project folder (claim, source URL, quoted wording, or the measurement method with scene IDs and dates) and deliver it with the film. Measure on the date you show.

## 10. Engine

- `demo/engine.js`: `makeCamera({lat, lon, d, tilt, heading, sx, sy})`, `project()` / `unproject()`, the WebGL2 plate shader (nested plates, time scans, growth map, analyst grade, printed-map layer, whip blur).
- `demo/overlay.js`: hairlines, brackets, `readout`, the measured single-line `subtitle` strip, `text` with a registry for `window.TEXTS`.
- `demo/tools/`: `fetch_landsat.py` (STAC, one date per path, same-year gap fill), `plates.py` (normalisation, streak cleaning, water masks, areas), `vectors.py` (shorelines, distances), `mapfield.py` (the printed map), `growth.py`.
- **Extra packages and packs**: none beyond `setup.sh deps voice` and the sample packs the score uses (`sh tools/fetch.sh instruments <lib>` for vsco2ce, vcsl, freepats in the demo). Imagery uses only the standard library, numpy, SciPy, Pillow (no GDAL); allow 3–4 GB for cached scenes. Anything more (rasterio, pyproj) goes in a private venv in the project folder, not `$LIB/.venv`.

## 11. Variation space

The agent decides the place or places, whether there is a claim layer, which dates, the structure, the camera path, the accent hue and where colour comes back.

- **Structures**: a locked time-lapse of one place ending in a push-in; a river followed from source to mouth with a reading at each stop; two places compared at one scale with whip pans.
- **Openings**: a ground-level detail that climbs to reveal its scale; a black frame a scan line paints in; an oblique orbit with a searching reticle.
- **Endings**: the climb back to orbit; a last measurement that lands and holds in silence; the claim layer redrawn to match the ground.

---

How our demo was made (story, shots, score, end card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
