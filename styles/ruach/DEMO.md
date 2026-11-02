# Ruach 灵息 — demo: *After the Fire*

One example among many. Don't reuse its story, arc, shots, props or timings.

A 26.5-second film, music and sound only, made to show the style on a topic that isn't biblical. 1920×1080 at 30 fps; the same timeline renders a vertical 1080×1920 version (`SIZE=1080x1920`).

## Story and structure

A burnt hillside at night, still glowing red. The same hill under a blue night of ash: one small walker crosses the crest carrying a sapling, the word *phúsis* settles into the sky. Silence. The sun breaks over the far ridge, the light front crosses the hill far → mid → near, and where it passes the dead trunks are green trees again; the walker kneels and plants. Thoreau's line settles into the sky.

| Time | Key | Shot | Camera |
|---|---|---|---|
| 0.0–6.4 | red / black | burnt ridge, a hard red glow behind the hill, embers on the trunks | lateral travel right |
| 6.4 | — | hard cut on a boom | — |
| 6.4–12.6 | blue / violet | the walker crosses; φύσις / *phúsis* / *nature · growth · what springs up* | slow pull-back |
| 12.6–13.6 | blue / violet | hold, wind only | still |
| 13.6–24.5 | blue → gold / green | **Light breaks through**: glow, rays, the front crosses the layers, trunks become trees, the walker kneels; Thoreau quote | slow push toward the sun |
| 24.5–26.5 | gold | fade to black | still |

## Palette

Three keys on one hillside (`src/shots.js`): `RED` (sky `#140406`→`#4a1012`, trunks `#0a0203`, embers `#ff5a32`, light `#FF3B2E`), `ASH` (the night key of the style frame, ash-grey trunks), `GREEN` (gold sky, hills `#a9bf7c`/`#7f9c56`, leaves `#4f8158`/`#a8c97c`, light `#FFE7A3`).

## Score

`audio/score.py`, VSCO 2 CE samples (CC0): contrabass and cellos drone in D with an Eb rub, timpani swell into the cut, a thump and rumble on the cut. Night: a cello line A–F–G–D, three upright-piano notes, wind. 12.6–13.6: everything but the wind drops out. On the light: an upright-piano glissando, D major strings with slow attacks, a synthesised wordless choir ("oo"/"ah" formant voices), a rising shimmer, a piano arpeggio, birds; last chord rings out.

## Build

`sh demo/build.sh`: fonts if missing (`demo/tools/fonts.py`), score and sound (`demo/audio/score.py`, needs `sh tools/fetch.sh instruments vsco2ce`), picture, mix and master to `ruach.mp4`, the poster and the gallery style frame. It is light by default (one render worker, `ssaa=1`, low priority); `WORKERS=3 SSAA=2 sh demo/build.sh` on a strong machine. `SIZE=1080x1920 sh demo/build.sh` renders the vertical version to `demo/out/`.

The page renders single shots with `?shot=`: `index.html?shot=horeb` is the style frame (`demo/stills/styleframe.jpg`: Elijah at the cave on Mount Horeb, 1 Kings 19, with the light breaking through); the film's timeline is `FILM` in `src/main.js`.

## Engine reference

| File | What it draws |
|---|---|
| `demo/src/ruach.js` | `plane(o)`: one flat plane drawn twice (palettes `A` and `B`), each key may have its own shapes; the light front (`light()`: source position `uO`, radius `uR`, softness, per-plane `lag`) switches A → B in screen space from the source, plus glow and haze. `range()` faceted ranges with lit and shade faces, `ridge()` jagged ridge lines, `cloud()`, `tree()`, `poly()`. `glow()` analytic halo, `rays()` soft additive wedges, `fitAt()`, `ppmAt()` (texture resolution per depth, capped for the GPU), `toScreen()` |
| `demo/src/figure.js` | `robed()` (profile figure in a mantle), `walker()` (poses `walkA`, `walkB`, `kneel`), all two-face angular |
| `demo/src/shots.js` | `horeb()` (the style frame: Elijah at the cave, 1 Kings 19), `forest(E, 'ember' \| 'dawn')` (this film), the palettes |
| `demo/src/post.js` | from Paper-cut Lightbox: depth of field, bloom, grade, plus film grain in sRGB and any frame size |
| `demo/src/main.js` | the timeline (`FILM`), cuts, fades, the HTML text (`#word`, `#quote`) and `window.TEXTS` for the reading check |

A minimal new shot: make `light()`, call `plane()` per depth with `draw(x, C)` reading colours from the palette `C`, add `glow()` and `rays()`, then animate `L.uO` (from `toScreen(cam, source)`), `L.uLk` (light on) and `L.uR` (front radius) in `update(t)`.
