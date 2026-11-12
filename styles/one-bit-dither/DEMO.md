# 1-bit Dither — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Moon's Fax* 《月亮的传真》 (50.0 s) · `one-bit-dither.mp4` · source in [`demo/`](demo/)

An unofficial film about a real event. Its claims are sourced in [`demo/FACTS.md`](demo/FACTS.md); no real person appears, and the newspaper and its masthead are not named or shown. The control room, the log and card wording, the front page and the town are invented.

## Story & structure

February 1966. The Soviet probe Luna 9 lands softly on the Moon and radios pictures home. In Cheshire, the Mark I telescope at Jodrell Bank hears that the signal is in the format newspapers use to send photographs; a newspaper lends its picture receiver, and the first close view of the Moon is printed one line at a time — a day before the official version, but with a guessed ratio, so the stones come out too tall.

The arc is a relay of media: signal → fax print → the world it shows → photographs on a line → a verdict → a newspaper on the steps at dawn. 1-bit fits because every station in the chain is already ink or no ink: a phosphor trace, a fax print, a newspaper halftone, and a Moon with a black sky under a 7° sun. Native moves spent: print it line by line (shot 4), fall through the dots (4→5), rim in the dark (5), change of dot (5→6, 8), inversion strike (7), density time-lapse (6).

The pictures on paper are rendered at load from the film's own 3D Moon (the photo camera looks back at the big rock from behind the lander, which is hidden for the shot), so the print, the fly-through and the newspaper show one world. No Luna 9 photograph is used. The Jodrell Bank print is the same picture stretched twice as tall; the official print keeps the true ratio.

There is no voice-over and no subtitle track: every word is written, typed, stencilled, printed or stamped on an object in the world, Chinese line first and larger, English under it.

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–4.0 | Frost on the grass, the 76 m bowl turning on its track, the Moon rising in the east | 8 cm above ground; rack focus grass → telescope (0.45–1.45); rise along the rim; push to the feed ring along its final axis (Bézier path, turn rate under 3° per frame, the last half second a straight dolly) | ring ellipse = next shot's scope screen (shape match) |
| 2 | 4.0–10.7 | Control room at night: scope trace, chart recorder sawtooth, duty log, a clipped card, empty chair, cold tea | pull back from the scope, easing in from rest over 0.5 s; track along the desk with the pen rhythm; hold 3.6 s on log + card | text read: log line and card |
| 3 | 10.7–14.5 | Car lights through a frosted window; crate stencilled 图片接收机 PICTURE RECEIVER; plug and ring of dots; drum spins up | four hard cuts on the line sync (0.95 s each): top, level, macro, side | mechanical montage |
| 4 | 14.5–22.3 | The Moon printed line by line on the drum | locked to the paper, current line at frame centre, shallow focus; push into the big rock | **signature 1**: print it line by line, fall through the dots |
| 5 | 22.3–29.3 | The Moon: 7° sun, long shadows, the 58 cm station with four petals | 32 px block dissolve from the print's dots; cells halve 32 → 16 → 8 → 4 → 2 → 1 px (about four frames per level); glide 30 cm above ground across two shadows, easing into the orbit with the two moves blended; orbit 100° to backlight on one continuous curve that slows but never stops (rim at 26.6); rise and back off into the photo camera, landing at 29.0 as the picture squeezes to the print's ratio | **signature 2**: rim in the dark, change of dot |
| 6 | 29.3–33.5 | The print on a clothesline with three others, dawn in the window, the clock racing, the official print with its tag | fax-scan wipe 29.0–29.33: the print replaces the Moon row by row under a two-row inverted scan head, both pictures still and aligned; pull back from rest (0.5 s ease-in, a mid key at 2.5× distance); drift left; settle on the official print in the foreground | density time-lapse |
| 7 | 33.5–39.8 | Two enlargements of the same rock, boxed, a thread at the true height; stamps 比例错了 WRONG RATIO, 早了一天 ONE DAY EARLY | locked, 15° three-quarter; 2.8 s hold before the first stamp (36.3, 36.9) | verdict; inversion strike on each stamp |
| 8 | 39.8–47.0 | Halftone dots → front page → bundle on frosted kiosk steps → street → roofs; telescope on the horizon, full Moon setting in the west | pull-back keyed on log distance, from rest, ×15 in 0.9 s then the steady pull, slow while the headline is read (40.4–44.5); rise and turn west without stopping the pull; hold 1.5 s | **signature 3**: change of dot, scale jump |
| 9 | 47.0–50.0 | End card | still | the Moon sets in the west |

Every camera segment joins the next with continuous velocity; no shot starts at full speed after a cut, and the only frames that hold still are intended holds. Two steps in the coarse-cell resolve (22.40, 22.53) are deliberate level jumps.

## Score structure

126 BPM, D minor resolving to D major. The facsimile signal is the clock: its line sync (every 0.952 s, two beats) cuts the montage; in shot 4 each printed line is a closed hi-hat sixteenth and the sync is the snare; pizzicato bass walks D–B♭–F–A; clarinet states the four-bar theme from bar 2; glockenspiel and a detuned upright enter on bars 3–4. At 22.3 the music cuts on the fall through the dots: on the Moon only the signal, far and filtered, a bowed vibraphone, one glockenspiel note on the rim. Dawn: bowed D minor chord under an accelerating woodblock clock and the first birds. The verdict hold has only room tone and a faint signal; two stamps (cork thump + clack); after the second, upright and low strings return. Shot 8 plays the theme once through with brushed drums, then a D major chord at 45.5 rings into the end card.

Foley is procedural (`audio.py` and `core/audio/sfx.py`): wind, a distant dog, the telescope's motor and wheel squeal, the fax carrier tone and sync tacks, paper, stamps. Mix (`audio.py`): −16 LUFS, true peak −3.9 dBTP, 4th-order high-pass at 45 Hz, the music and silences as written; `build.sh` masters it to −14 LUFS / true peak ≤ −1 dBTP. All cue times come from `events.json`.

## Palette & props

Ink #16161A, paper #E9E6D6. Props built in code: Mark I telescope (A-frame towers of a few thick members, solid paraboloid bowl, feed mast and ring), observatory desk (scope with live trace canvas, chart recorder with scrolling saw, two-page log, index card with paperclip, teacup, anglepoise, wall clock with pendulum), picture receiver (drum, lead screw, carriage), Luna 9 station (sphere, band, camera turret, four petals, four whip antennas), lunar terrain (polar grid to a 1.5 km horizon with Moon curvature, craters, 650 instanced rocks and pebbles, procedural regolith bump), cork board, newspaper bundle with twine, kiosk with stone steps, terraced street with chimneys and lamp posts, a paper van.

## End card

Two inks: a dusk gradient, a hedgerow and the small telescope on the horizon, the full Moon sinking behind it; the title 月亮的传真 The Moon's Fax, the style name 1-bit 点阵 1-bit Dither, and "LemoLab × Claude Opus 5.5". The sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build

- `sh demo/build.sh` from anywhere (set `LIB` to the library folder if the style sits outside it). On a new clone, first `sh tools/fetch.sh instruments vsco2ce` and `sh tools/fetch.sh instruments vcsl`; `build.sh` downloads the source fonts itself into `demo/fonts/src/` and subsets them. About 2–3 minutes with two workers, plus about 1 GB of intermediates in `demo/out/`.
- The picture is rendered losslessly: `demo/tools/render.mjs` captures PNG frames into FFV1 segments and one lossless master (`demo/out/master.mkv`, local only), and `build.sh` makes the only lossy encode (H.264 High, crf 14, `-tune animation`, BT.709). The library's `core/render/video.mjs` + `mux.sh` path is not used here: its JPEG frame grab and two H.264 generations turn dot edges grey on fast moves. The audio is normalised the way `mux.sh` does it (two-pass loudnorm) and muxed with the video stream copied.
- Entry: `index.html` → `main.js` (shot table, transitions with their mode, inversion frames, `window.TEXTS`, `window.EV`, `window.CAM(t)` for checking camera speed). Sets: `dusk.js`, `room.js` (shots 2 and 6), `cuts.js`, `drum.js`, `moon.js`, `board.js`, `town.js`, `endcard.js`. Engine: `pipe.js`, `kit.js`, `prints.js`, `noise.js`. Times: `timeline.js`. Words: `texts.js`.
- Debug: `?only=<set>` renders one set on its own.
- Fonts: `.venv/bin/python styles/one-bit-dither/demo/tools/subset.py` (from the library root) rebuilds the subsets from the characters used in the `.js` files.
- Sound: `node core/render/events.mjs <demo>` then `.venv/bin/python <demo>/audio.py` → `demo/out/mix.wav`.
- Body copy on the front page is a typeset texture (a bar per word, word lengths from real sentences); only headlines are letters.
- 1080p frame time 35–65 ms on moving shots, up to about 0.4 s on the first frame of a set (shader compile). Needs WebGL2, half-float render targets and 4× MSAA. The prints are read back from the GPU at load, so shadow detail on them can differ slightly between GPUs.
- Reading time: `core/render/readcheck.mjs` passes on every text.
- Pitfalls of these props: the Moon terrain needs shadow bias 0.0012 and normal bias 0.035 at a 7° sun; the paperclip and petals are tiny — keep them out of focus or large; the official print's tag must stay free of emission or its letters go grey; large grazing planes (fields, street, roofs, the crate floor and walls) sit on the screen-locked `L_SCREEN` layer.
