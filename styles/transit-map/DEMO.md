# Transit Map — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *6 Kilometres* 《6 公里》 (47.0 s) · `transit-map.mp4` · source in [`demo/`](demo/)

In 1993 the Shanghai Metro was one 6 km section of Line 1 with five stations. On a printed schematic the network grows year by year to 21 lines and 906 km; halfway through, London and Shanghai are drawn as two lines on one time axis. No narration and so no subtitles: everything the viewer reads is printed on the sheet or on the counter, a Chinese line above an English line. **Unofficial fan film, not affiliated with the operator.** Line colours and station names are public facts; no operator logo or branded bullet appears, and the schematic is our own drawing. Every number and its source is in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: it all started with 6 kilometres.

Arc: a train's headlights in a tunnel flare white and collapse into a red dot on the map (1993) → the pen draws the first section, five stops, the counter reads 6.0 → Line 1 reaches the railway station (1995) → the camera rides Line 2 across the city; its interchange ring falls onto People's Square; the camera drops low as the line dives under the Huangpu (1999) → a long pull-back while a decade of lines burst out at once (2000–2010, 420 km) → a glide down the sheet to a printed time-line panel: London 1863 → 402 km in 163 years, Shanghai 1993 → 420 km in 17 years, judged after a still hold → back up for a low sweep over today's network with every train running (906 km, the daily ridership record) → push back to the first section under a paper veil: "you are here", "it all started with 6 km" → end card.

Change the camera every 3–5 s and land on the first section again: a top view that only zooms is clear, but a flat picture moving; the finished 2026 network rewound to 1993 gives a first second full of small type and no place to land.

Native moves spent: *the pen tip* (first section, Line 2), *the interchange that falls* (People's Square), *the tunnel under the water* (Line 2), *levels of detail* (2000–2010 pull-back), *time lines* (the verdict), *the odometer* (throughout), *the plate by the lens* (the sweep), *you are here* (ending).

## Shots

Film time in seconds; zoom in px per grid step (G). The picture is written in story time and mapped to film time by `WARP` in `timeline.js`: the 1995 beat plays at 0.4× so its counter values can be read, and the verdict holds 0.8 s longer.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–1.4 | running tunnel, lamps streaking, oncoming headlights grow and light the lining; white-out from 1.1 | forward rush | screen-space tunnel |
| 2 | 1.4–6.2 | match cut: the white collapses into the red dot of Jinjiang Park; the tip draws five stops (Xinlonghua under its 1993 name), counter 0 → 6.0; printed callout "1993.5.28 · 1 号线首段 · 6 公里 · 5 站"; a train shuttles | keeps the first stop and the tip both in frame, tilt 30° → 7°, zoom 260 → 130, aperture 16 → 6 | **signature 1**: headlight → dot; hold 4.3–6.2 |
| 3 | 6.2–9.0 | 1995: Line 1 to the railway station; the counter lands 1995 / 16.1 and holds | slow pull-back to the north-east, zoom 86 | |
| 4 | 9.0–13.0 | 1999: Line 2 from Zhongshan Park; a capsule falls and lands on People's Square at 10.48 with shock rings; 10.75–12.05 the line runs dashed under the Huangpu | rides the tip at tilt 24°, zoom 150, aim 1.6 G ahead; drops to tilt 61° (zoom 185, aperture 26) over the river, rises at Lujiazui | **signature 2**: the interchange falls |
| 5 | 13.0–14.3 | 2000: Line 3 along the west | rise and pull back | |
| 6 | 14.3–21.7 | 2002–2010: lines burst out with bullets and years; only hub names; counter lands 420.0 at 19.9 | continuous pull-back, zoom 78 → 52, tilt 12° → 0° | levels of detail |
| 7 | 21.7–24.95 | glide down the sheet to the time-line panel; London draws 1863 → 2026, Shanghai 1993 → 2010 → 2026 in a blink | slides over the paper, tilt up to 26°, eases in | |
| 8 | 24.95–30.5 | the panel alone on paper: both lines, both start values (6 km), 402 / 420 / 906 km and the axis; 27.5 brackets "163 年 → 402 公里", 27.9 "17 年 → 420 公里" stamped in red | locked top view: 2.55 s before the verdict, 3 s after | **signature 3**: time lines |
| 9 | 30.5–32.4 | 2011–2024 lines complete; counter lands 906.0 | rises off the panel across the tilted sheet (tilt 30°, zoom 42); the table shows | |
| 10 | 32.4–37.1 | every line runs trains; only ten hub names; a cream enamel People's Square name plate on its post stands in the lower-right corner, out of focus; ridership drums land 1339.7 万 at 35.4 | low sweep, tilt 57° → 62°, heading 26° → −14°, zoom 102, aperture 24 | the plate by the lens |
| 11 | 37.1–44.0 | the network fades under a paper veil, the first section stays red; "you are here"; "一切从 6 公里开始 / It all started with 6 km" and the unofficial note | rise to top view, push 62 → 142; hold 42.1–44.0 | you are here |
| 12 | 44.0–47.0 | end card | hard cut to the sheet's corner | |

## Score structure

120 BPM, D major, chords D–Bm–G–A one per bar. The station chime (vibraphone A5 → F♯5 with glockenspiel an octave up) opens the map at 1.55, lands 2010 at 19.9, rings the verdict at 27.5, the ridership record at 35.4, "you are here" at 39.9 and the end card at 44.5 (film time). Grooves run in film time so the tempo never stretches with the slow 1995 beat.

| Section | Time | Palette |
|---|---|---|
| Tunnel | 0–1.4 | brown-noise rumble rising, wheel clacks accelerating, a two-tone horn at 0.55, a band-passed riser into the flare; the music is muted until the cut |
| First section | 1.4–6.2 | the chime; a glockenspiel + marimba pluck per stop (D–E–F♯–A–B); string pad from 2.0; a harp arpeggio on the callout; shuttle clacks |
| 1995–2000 | 6.3–14.3 | marimba ostinato in eighths, pizzicato bass on beats, kick every bar; the falling capsule is a descending whistle, its landing a bass drum, timpani, gran cassa and a horn/trombone D chord; under the river the whole score is low-passed to 520 Hz with a water bed; clarinet answers Line 3 |
| Burst | 14.3–21.7 | each new line adds one voice on the groove (glass, flute, spiccato violins, xylophone, horn, harp, trumpet, cellos, vibraphone, oboe), snare backbeat from 2007, roll into a landing hit with horns, crash and the chime |
| Time lines | 21.7–30.5 | woodblock beats, a cello rising with the London line and a pizzicato tick every 20 years it passes; a ten-note glockenspiel run for Shanghai; a thin string chord with hi-hat during the hold; 27.15–27.5 the music drops away; tubular bell and chime on the verdict, timpani and horns on the stamp |
| Now | 30.5–37.1 | snare roll and swell up the rise, then the full groove (strings, horns, spiccato, xylophone, snare) with rail clacks in eighths across the stereo field; a swish as the plate passes; ratchet ticks while the ridership drums roll |
| Back | 37.1–44.0 | the ensemble lifts away; a bowed-vibraphone pad; the chime alone; a harp under the caption |
| End | 44.0–47.0 | harp D chord, horns and strings, the chime once more, a 0.7 s fade |

Mix (`audio.py`): music × 0.9 under the effects; 38 Hz high-pass and a −5 dB shelf under 75 Hz; bus compression (threshold 0.16, ratio 2.8); loudness loop measured with ffmpeg ebur128. The mix measures −16.0 LUFS integrated, true peak −4.9 dBTP, LRA 6.9 LU, energy below 50 Hz 17.6 dB under the full band; the master measures −13.9 LUFS.

## Palette & props

- Paper #F2EEE5 on a near-black table; ink #1B1C1E; river #BCD6EA with #8FB5D6 edges; first-section red #E3002B; London navy #24346E.
- Line colours as commonly published (1 #E3002B, 2 #82BF25, 3 #FCD600, 4 #461D84, 5 #944D9A, 6 #D40068, 7 #ED6F00, 8 #0094D8, 9 #87CAED, 10 #C6AFD4, 11 #871C2B, 12 #007A60, 13 #E999C0, 14 #626020, 15 #BCA886, 16 #98D1C0, 17 #BC796F, 18 #C4984F, Pujiang #B5B5B6, Maglev #008B9A, airport link #3D688A). The Maglev is the one thin line (a second rail mode).
- Props: the schematic (about 150 named stations, 21 lines, generated minor stops), the Huangpu and Suzhou Creek, the north-west cartouche "上海地铁 / Shanghai Metro", the first-section callout, the Expo star, the time-line panel in the sheet's lower margin, the enamel counter (year, route length, daily record), the People's Square name plate, the end-card frame.

## End card

In the sheet's lower-right corner, inked at the end: a red line runs to a terminus ring; 6 公里 / 6 Kilometres; 地铁线路图 / Transit Map; LemoLab × Claude Opus 5.5; 非官方致敬片，与运营方无关 / Unofficial fan film, not affiliated with the operator. 3.0 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

Two places where this demo is narrower than STYLE.md §4: its title 《6 公里》 is printed only on this end card (the north-west cartouche names the network, 上海地铁 / Shanghai Metro), and its last shot is this corner of the sheet after the veiled network. A new film prints its title on the map at the start and closes on the whole network, with its end title printed in a margin of that view. The demo's data and its sources are the model for `FACTS.md` (STYLE.md §11): every on-screen figure with its quoted source, plus the figures checked and not used.

## Build notes

```
demo/
  build.sh       one command: fonts, events, score + mix, picture, master, reading-time check, poster and style frame
  index.html     two canvases (WebGL plane, 2D overlay), fonts, scripts
  net.js         the Shanghai network as data: stations, 21 lines (colours, bullets, ink-on-light flags, the Maglev
                 as mode 'light'), the Huangpu and Suzhou Creek as WATER bands, expand() (octilinear bends)
  gl.js          makePlane(): paper, light, sheet edge, depth of field, vignette
  film.js        the generic engine (no network, no story): geometry, water, line forms, phases, labels, bullets,
                 the falling interchange, camera, inked region, map drawing, events, window.TEXTS
  timeline.js    this film: facts (FX), WARP, phases, camera keys, the hooks below, annotations, time-line panel,
                 counter, tunnel, plate, cues
  audio.py       score + effects + loudness loop -> mix.wav (reads events.json)
  tools/         subset.py (Noto Sans SC subset from the characters in the JS), sheet.sh (contact sheet for review)
  fonts/         Inter, the Noto Sans SC subset, OFL texts
  FACTS.md, CREDITS
```

- Build: `sh styles/transit-map/demo/build.sh` from the library root. It downloads Inter and Noto Sans SC when missing (OFL, github.com/google/fonts) and the vcsl, freepats and vsco2ce sample packs (`sh tools/fetch.sh instruments <lib>`), subsets the CJK font, exports `events.json`, writes `mix.wav`, renders at 30 fps with three workers, masters with `core/render/mux.sh` (grain 1), runs `readcheck.mjs` and takes the poster and `demo/stills/styleframe.jpg` at 36.2 s. The picture renders in well under a minute on an Apple-silicon Mac; the whole build takes a few minutes.
- Hooks this film defines in `timeline.js` (the full list is in STYLE.md §10): `LABEL_PREF` (eight stations), `nameAt` (新龙华 before 1999), `labelOnly` (names per shot), `drops` + `dropRing` (People's Square, rings in the Line 1 and Line 2 colours), `roundelPos` / `roundelAlpha` (bullet places, and bullets that leave when their chapter is over), `veil` / `stationDim` / `highlight` (the ending), `riverLabels`, `furniture` (cartouche, time-line axis, end card), `annotations` (callout, Expo star, time lines, "you are here"), `trains` (the 1993 shuttle and every line now), `overlay` (tunnel, match flash, plate, counter), `tunnelOnly`, `cues`, `init`. Everything Shanghai-specific is in `net.js` and `timeline.js`; the demo uses no bus, ferry or walking-link lines.
- `WARP` maps film time to story time, so one beat can be slowed and one hold lengthened without rewriting the picture. A film written directly in film time needs no `WARP` (leave it out).
- Reading time: `window.TEXTS(t)` reports every line meant to be read (callout, station names, counter rows, the time-line panel, caption, end card) with its screen box; `readcheck.mjs` passes on all 76 pieces. Map labels show by shot (an allow-list in `timeline.js`, `labelOnly`) so no name flashes past too briefly.
- Order when editing: `net.js` / `timeline.js` → `tools/subset.py` when text changes → `node core/render/events.mjs styles/transit-map/demo` → `.venv/bin/python styles/transit-map/demo/audio.py` → render. `sh styles/transit-map/demo/tools/sheet.sh` makes a 0.5 s contact sheet in `demo/out/`.
- 1080p frames take 30–250 ms (most 35–60 ms); the inked region is redrawn every frame at up to 4096². Needs WebGL2 with `EXT_color_buffer_float` (the depth-of-field pass reads a half-float buffer).
- Demo-specific pitfalls: the 1993 station 新龙华 was renamed 上海南站 (1999), so the label switches at 1999; Line 4 is a loop whose start and end are the same station (phases name the last occurrence explicitly); Lines 3 and 4 share the western corridor and are drawn as offset parallels; the counter must never show an unsourced year-end total, hence the spinning drums between landings.
