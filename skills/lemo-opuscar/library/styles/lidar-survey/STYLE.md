# LiDAR Survey — Style Prompt

> Real airborne laser points of a real place, floating in the dark as a measured cloud; a scan line or a cutting plane passes through them and the points condense into a solid, raking-lit surface, which is then measured with hairline instruments. One designed camera move carries the whole film: the cloud is something you fly through, not a picture you look at.
> References (grammar only): survey and archaeology lidar visualisations (colour as height, the canopy removed); architectural section drawings (a cut, dimensioned); museum film cadence (one held reading per screen). Copy none of their layouts, ramps, typefaces or music, and never name them in the film.

## 1. Essence, and what it is not

- **The cloud is the data**: every point is a real return at its measured position; points appear, glow, lift away or give way to a surface, but are never moved into a shape.
- **Points become a surface**: a front (scan line, cutting plane) behind which the cloud condenses into a solid model of the same place.
- **Classification is a lever**: ground, vegetation, buildings, water are layers to peel, isolate and recolour.
- **Measurement in hairlines**: one reading at a time, in the accent, attached to what it measures; numbers from the points or an official source.
- **Dark, quiet, exact**: near-black ground, restrained colour, no glow except at the front.

Not Sci-fi Hologram HUD (no invented interface: the points are real, sparse where the survey was), not Satellite Briefing (photographs from above; here a 3D cloud flown through), not Blueprint, not Low-poly Isometric, not Glass Product Render.

## 2. Materials & rendering

- **Points**: GL points sized in world units (0.12–0.3 m), floor of one output pixel, soft discs, opaque and depth-tested (additive only for a ghost layer); colour from height or class, value from intensity; distance fog.
- **Quantise for the browser**: uint16 positions (2 cm / 1 cm) plus a byte each for height above ground, class, intensity, seed.
- **Height above ground** for every return (minus a ground model triangulated from class-2 returns) drives the colour ramp, the cutting plane and the ruler.
- **The solid surface**: a 0.5–1 m mesh of the ground or surface model, smooth normals, baked short-radius AO, a low raking sun (20–35°), faint contours, crests lightened. Display exaggeration of micro relief (×2–3) only with an on-screen note; measure on undistorted data.
- **The front**: one world-space plane (one uniform) shared by the point and surface shaders; points ahead of it brighten, a thin seam glows behind it and the surface fills in over tens of metres.
- **The cutting plane** (by height above ground): returns above it lift away and fade, a ring glows where it meets the trees, a ruler on the frame edge tracks it.
- **Marks on the surface** (traced features, section lines) are a distance field in the surface shader, kept hairline with `fwidth`; readings, leaders and charts are a 2D overlay through the same world → screen function.
- **A survey window**: outside the measured area the cloud stays as dim points instead of ending in black.
- **Post**: 2× render, high-threshold bloom (only fronts and seams), vignette; no grain (points are already fine detail; encode at a higher CRF).

## 3. Colour logic

- Background near-black with a cold tint; never pure black, never a gradient sky.
- Points: one ramp by height or class, desaturated (deep green-teal → pale; or grey → white); intensity modulates value, not hue. No rainbow elevation ramps.
- The front and seams: one cool near-white; it is light, not a colour.
- The solid surface: warm neutral (stone, clay, plaster), lit; its colour never competes with the accent.
- One accent (amber) reserved for what was found and measured: traced features, the reading, the section line. A second, cooler hue only in a comparison chart.

Example (our demo): background #05080A, canopy #1F3F35 → #5C9A7A → #E2F3DC, ground returns #C8B38C, surface #BDB5A6, front #D4FFF0, accent #FFB347, chart green #83C495.

## 4. Type & subtitles

- **Roles**: light condensed numerals for readings (110–130 px, e.g. Barlow Condensed 300); a monospace for instruments, coordinates, counts and source lines (19–22 px, e.g. IBM Plex Mono); a sans for labels in the film's language (24–36 px, e.g. Noto Sans SC 500). OFL, self-hosted, CJK subset to the characters used.
- **Instruments** in one corner: place, coordinates, area, data source, point count, any exaggeration; they change only when the medium does.
- **Readings** in the right third beside what they measure: label, number, source/method line; a leader when the feature is in frame; a rolling counter reports its landing value.
- **Subtitles**: a transcript strip bottom-left (2 px rule, plate fading right), one line per language measured with the real font, split rather than wrapped; if bilingual, the film's language on top.
- Nothing below 19 px at 1080p. Hold subtitles ≥ max(1.8 s, speech + 0.6 s); labels ≥ characters ÷ 4.5 + 1.5 s (CJK), letters ÷ 15 + 1.5 s (Latin).

## 5. Motion quality

- On ones, 24 fps; the camera never stops; keys as a C1 spline in target / distance / heading / pitch (no `lookAt` from nadir).
- The front moves on an ease, slowest where the subject is; a cutting plane steps on the beat (eased steps, short holds) so the layers read.
- Points appear behind a front or by height, never by random fade-in across the whole frame.
- Readings land with a small pop; traced features light up along their length in order.
- Never moves: the points relative to each other (no wobble, no noise displacement), the instruments' positions.

## 6. Camera grammar

| Move | What it expresses | Can serve |
|---|---|---|
| Locked nadir with slow push | "this is what a photo shows" | a claim to test; a before; an ending that returns to the map |
| Crane down with tilt to oblique | entering the data; the place has height | the switch from picture to cloud |
| Low oblique close to the cloud (10–20° pitch, 90–150 m) | volume; things standing up | canopy, buildings, a facade, a cliff |
| Slow orbit | studying, the plane doing the work | a peel; a scan; a held reading |
| Rising pull-back | scale reveal of what was found | a network, a site plan, a corridor |
| Lateral track | travelling a feature | a wall, a road, a pipeline, a coast |
| Push to a section | the detail that proves it | a cross-section, a clearance, a height |

Subject ≥ a third of the frame height at key moments; readings right third; instruments in a corner; nothing in the subtitle strip. Transitions are fronts and planes, never crossfades or hard cuts inside the cloud.

## 7. Sound palette

- **Instrument sounds**: FM pings, fine crackle as points arrive, noise sweeps tied to a front, ticks that divide (8ths → 16ths → 32nds) to accelerate, a descending pitched blip per peeled layer, a ratchet while a counter rolls, a ping when a reading lands.
- **Weight and synthesis**: timpani, bass drum, gran cassa for condensations and cuts, a reversed swell into the main impact; low-passed detuned-saw pads; a pulse bass with audible 2nd/3rd harmonics.
- **Dry and wet**: one option is electronics while the subject is still points, and a single organic, wooden or bowed timbre (marimba, bowed vibraphone) for the found features once the surface exists.
- **Beds**: the place's own ambience (wind in leaves, water, traffic) at the start and the end as J- and L-cuts; a thin air bed in between.
- **Silence**: a near silence (air only) before the main reveal; the first sound after it is the impact.
- **Mix**: voice ~10 dB over the music and ducking it; impacts outside the bus compressor; −14 LUFS, true peak ≤ −1 dBTP. Voice: a calm, plain narrator, short declarative lines.

## 8. Native moves

- **Photo to points.** A scan line crosses an aerial photo; behind it the place is points. *Fits content like:* a site visit before a design; what the satellite misses; a quarry's real volume.
- **The canopy peel.** A plane descends by height above ground, returns above it lift away layer by layer, a ruler tracks it. *Fits content like:* archaeology under forest; a hidden trail; flood channels; landslide scars.
- **Points condense.** A front turns the remaining points into a solid surface; found features light up in order. *Fits content like:* a building scan to a BIM shell; a cliff to a hazard model; a street to a vehicle clearance model.
- **The section.** A plane crosses one feature; the profile glows and a dimensioned chart of the real returns hangs beside it. *Fits content like:* a levee's height; a bridge's clearance; a road cut.
- **The window.** The measured area is a stage inside the unmeasured cloud. *Fits content like:* a parcel; a corridor; a site boundary.
- **The regrowth.** The removed layer returns as a ghost over what was found. *Fits content like:* an ending; a clearing before/after; a buried pipe under a street.

## 9. Pitfalls of the medium

- **Finding data for a new place**: USGS 3DEP (US) as Entwine Point Tiles per project at `https://s3-us-west-2.amazonaws.com/usgs-lidar-public/<project>/ept.json`, projects and footprints in `boundaries/resources.geojson` of github.com/hobuinc/usgs-lidar; bare-earth scouting through the 3DEP elevation ImageServer. OpenTopography (catalogue of many collections, licence per dataset). AHN (Netherlands, CC0). National portals, e.g. England's Environment Agency LiDAR (OGL), France IGN LiDAR HD (Licence Ouverte), Spain PNOA-LiDAR (CC BY 4.0), Finland NLS (CC BY 4.0), New Zealand LINZ (CC BY 4.0); read each portal's terms. Fetch a subset by box and depth, not whole tiles.
- **Licences**: public domain, CC0, CC BY and attribution-only government licences are fine, with credit in `CREDITS`. ODbL, CC BY-SA, "no known restrictions" (not CC0) or non-commercial terms: name them to the user and ask first. Never commercial scans or Google 3D tiles. Ask the user for their own scans (a site survey, a drone or terrestrial scan, their BIM) when the film is about their asset. Never stand in a generated or invented cloud for real evidence.
- **Facts**: keep a FACTS.md in the project folder (claim, source URL, quoted wording, or the measurement method) and deliver it with the film.
- **Coordinates**: EPT copies are often Web Mercator: convert to a local east/north/up frame first; check the vertical datum against known ground.
- **Leaf-off vs leaf-on**: leaf-off lidar reaches the ground but its canopy is sparse; say which season each layer is.
- **Classification is the provider's**: class 1 mixes vegetation, buildings and noise; drop 7 and 18; finish a cut below 0 m or low vegetation stays as stripes.
- **A dense cloud reads as a flat carpet** from afar: go close and low for volume; let the distance fog out.
- **Scan striping** is real texture; don't frame a reveal on it at grazing angles.
- **Traced features are interpretation**: say "traced", keep the tracing in a data file, snap it to the data, leave faint candidates out.
- **Privacy**: crop out houses and yards; keep the survey window on public or uninhabited land.

## 10. Engine

- `demo/film.js`: point shader (front, cutting plane, lift, ghost, window), surface shader (light, AO, contours, feature field, section), photo shader, camera spline (`camAt`), overlay (`reading`, `drawSection`, `subtitles`, readcheck registry).
- `demo/tools/`: `fetch_ept.py` (EPT subset), `terrain.py` (local frame, DTM), `walls.py` (relief model), `trace.py` (snap a tracing, measure), `profile.py` (section from raw returns), `build_data.py` (binaries + facts).
- **Extra packages and packs** (beyond `setup.sh deps voice music`): Python `laspy`, `lazrs` (LAZ decoding), `scikit-image` (relief and ridge tools), `fonttools` + `brotli` (CJK subset). They are not in the library's `.venv`: the agent installs them itself into a private venv in the project folder (the demo uses `demo/assets/raw/.venv`), never into `$LIB/.venv`. Fonts come from github.com/google/fonts (ofl/), fetched by script.
- Minimal example, not in the demo: a building scan. Points coloured by class, a vertical front sweeping the street; behind it a 1 m surface model; one reading (roof height above the street).

## 11. Variation space

The agent decides the place and dataset, which classes to peel or keep, the fronts and their directions, the camera route, the readings, the accent within the colour logic, and whether a photo or a map opens the film.

- **Structures**: a corridor flown end to end with three readings; two surveys of one place (erosion, construction) swapped by a front; one object scanned, cut and dimensioned.
- **Openings**: a black frame the scan paints in line by line; a street-level photograph that dissolves into its own returns; a top-down map that tilts up into the cloud.
- **Endings**: the cloud pulls back to show the whole survey tile; the removed layer returns as a ghost; the last reading holds while the points fade to the instruments.

---

How our demo was made (story, shots, score, title card, build): [DEMO.md](DEMO.md). Read it after your treatment exists.
