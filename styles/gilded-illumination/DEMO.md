# Gilded Illumination — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Borrowed Light* 《借来的光》 (46.8 s) · `gilded-illumination.mp4` · source in [`demo/`](demo/)

A fable built on the material's own physics: gold leaf has no light of its own. In a painted world where everything that shines is gold, the sun goes out one night; a girl carries the last lamp up the mountain, gold wakes beside her and sleeps again behind her; at the top she lifts the lamp to the dark sun and it burns again; the light runs back down the path, and the pull back shows that the whole journey was one painting with five of her in it. Every frame is the painting itself, full screen: no book, no page, no desk. Narration in English (Kokoro `bf_emma`), with Chinese and English subtitles on a speech scroll.

## Story & structure

Logline: gold only gives back the light it is given; one lamp is enough to give the sun its light back.

Arc: the rule (a macro of dark leaf, "everything that shines is gold… but gold has no light of its own") → the crisis (the sun's last glint slides off; one held note) → the hero and her tool (a lamp in a quatrefoil) → the rule made visible (gold lights near her lamp and sinks after it passes) → the goal (the summit, the biggest gold, the darkest) → the touch (the flame meets the leaf, rings of gold spread, the sun burns) → the meaning (a band of light runs down the path, four more of her are painted in layers, the border grows: one picture) → the plaque.

Native moves spent, each one larger than the last: *into the material* (opening), *gold laid, then lit* (one star → the leaf around her → a row of fruit → the whole sun → the whole picture), *through the frame* (the quatrefoil), *lit by a lamp* (the walk), *the touch* (the climax), *a band of light sweeping the whole picture*, *painted in layers* and *continuous narration* (the five of her), the border growing into the picture's frame.

## Shots

The shots are written on a 51.8 s story clock and played on the 46.8 s film clock through a monotone map (`WK` in `film.js`): the walk runs 1.33× faster, the summit is short, the touch is compressed to 0.8 s, the last hold is long. Times below are film time. Camera speeds measured as the median screen-centre travel per second and zoom per second.

| # | Time | Shot | Camera | Note |
|---|---|---|---|---|
| 1 | 0–5.4 | A macro of dark leaf: squares, seams, punched dots; a narrow glint rakes across from the first frame. It is an eight-pointed star; then ultramarine, more stars, scalloped clouds, spires, a village, the dark sun | exponential pull out ×26 → ×0.5 with a little roll (≈200 px/s, 0.74 zoom/s) | into the material |
| 2 | 5.4–11.6 | Night wide; a star glints once under a faint band (the rule shown); the sun's last glint slides off its leaf | pan and push to the sun (≈320 px/s) | the band drops to one held note; match cut on circles: the dark sun → the lamp's glass |
| 3 | 11.6–16.4 | Inside a gold-ground quatrefoil: the lamp (vermilion flame, white-lead core, painted rays), then the girl at a gold-ground chapel; she lifts the lamp and the arch and her hem light; she steps off on "began to climb" | pull out inside the frame, then push through the quatrefoil (its lobes slide off the four sides) | through the frame |
| 4 | 16.4–24.4 | The walk: a stone bridge with gold roundels lighting one by one, an orchard of gold fruit lighting near her and sinking behind; a near rock pillar wipes across (cut hidden), the camera tilts 6° up the zigzag path and rises through a cloud bank (cut hidden) | follow, then crane up (≈250 px/s) | lit by a lamp; foreground wipes |
| 5 | 24.4–28.6 | The summit: she is small at lower left, the dark sun fills the upper frame (seams, punched rings, wavy and straight rays, all dark) | low angle, almost still | 0.6 s of near-silence after the line |
| 6 | 28.6–33.7 | Close-up: the lamp lifted to the leaf; at 30.7 the flame touches, two gold rings spread from the contact, the squares light as they pass, the rays light clockwise; hard cut wide at 31.5: the sun burns, a band crosses the sky right to left, every star flashes in turn | follow up, still for the rings, hard cut on the beat, pan with the band | the touch; the sky stays deep ultramarine |
| 7 | 33.7–41.0 | The band runs down the path (cloud, zigzag, orchard, bridge, chapel), every piece of gold lights again; in four places another her is painted in layers (lamp gold and its flash → robe and cloak colour, inner rim → ink and white lead), each with a gilded halo; from 38.7 the border grows from the four corners | one long pull back and descent to the whole picture | painted in layers; continuous narration; the border becomes the frame |
| 8 | 41.0–46.8 | The whole painting held: the five halos light again from the village to the summit, twice; the plaque in the lower border | locked; the whole picture still from 38.7 (8.1 s) | end card |

Transitions: one match cut on circles, one push through a frame, two foreground wipes (a rock pillar, a cloud bank, each wider than the frame at the cut, with an occlusion layer so flashes and lamp glow don't show through), one hard cut on the beat. No dissolves, no page turns.

## Voice and subtitles

Ten lines (`demo/voice/lines.json`), Kokoro `bf_emma` at speed 0.8 (about 2.45 words a second), each clip checked with `core/tts/asr_check.py` (line 7's "disc" is heard as "disk" and declared in the `asr` field; line 8 is "And she lifted her lamp." because the shorter wording was misheard). Each cue holds at least its voice length + 0.6 s (the shortest is 2.45 s).

| # | Time | English (spoken) | 中文 |
|---|---|---|---|
| 1 | 0.6–4.85 | In the painted world, everything that shines is gold. | 在这个画出来的世界里，会发光的都是金子。 |
| 2 | 5.5–8.65 | But gold has no light of its own. | 可金子自己不会发光。 |
| 3 | 8.85–11.95 | One night, even the sun went out. | 有一天夜里，连太阳也熄了。 |
| 4 | 12.15–16.15 | So a girl took the last lamp, and began to climb. | 于是一个女孩提起最后一盏灯，开始往山上走。 |
| 5 | 16.6–20.75 | Wherever she passed, the gold remembered how to shine. | 她走到哪里，哪里的金子就想起了怎么发光。 |
| 6 | 20.9–24.1 | Behind her, it fell asleep again. | 她一走过，金子又睡着了。 |
| 7 | 24.5–28.5 | At the top, the sun was only a cold disc of leaf. | 到了山顶，太阳只是一片冰冷的金箔。 |
| 8 | 28.75–31.2 | And she lifted her lamp. | 她举起了灯。 |
| 9 | 34.0–37.15 | Gold keeps no light of its own. | 金子不留自己的光。 |
| 10 | 37.3–40.6 | It only gives back what it is given. | 它只把得到的，还回去。 |

The line falls on the picture: line 3 as the sun goes out, "began to climb" as she steps off, line 8 ends 0.1 s before the flame touches, lines 9–10 while the band runs down and the four hers are painted.

The subtitles are drawn by the page as a vellum speech scroll at the bottom centre (Noto Serif SC 36 px over IM Fell English italic 32 px, brown ink), one width for the whole film (the longest line, about 1036 px), the same height and size for every cue; between close cues the scroll stays open, the old words fade and the new ones are pen-wiped on. Shots were composed around it: on the bridge she walks high and to the left, the climb is shot from lower, the close-up of the lifted lamp keeps her left and the sun in the middle, the quatrefoil sits higher, the pull back of shot 7 runs higher. `gilded-illumination.srt` is written from the same `SUBS` table (`make_srt.py`).

## Score structure

A small medieval band in D dorian (solo violin for the fiddle, harp, recorder, soft organ for the portative, organ pedal, frame drum, tambourine), bells for the gold (glockenspiel, hand chimes, tubular bells). Sections follow `audio.py`.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Into the leaf | 0–5.4 | far bell at 0.05, drone, slow harp | the leaf shimmers |
| The sun goes out | 5.4–11.6 | harp ostinato, plain violin line | a bell on the star's glint; at 9.1 the band drops to one held note as the glint slides off |
| The lamp | 11.6–16.4 | hand bell at the cut, recorder melody | the lantern's ring creaks as she lifts it |
| The walk | 16.4–24.4 | frame drum strong/weak on a 0.4 s beat grid, harp eighths | one glockenspiel note per piece of gold her lamp wakes, quantised to the eighths, each a step higher |
| The summit | 24.4–28.6 | one held note and wind | 0.6 s of near-silence right after line 7 |
| The touch | 28.6–33.7 | timpani, big bell, frame drum at 30.7; the fullest bar, compressed into 0.8 s, on D major (the Picardy third) | a second timpani stroke on the hard cut at 31.5 |
| Down the path | 33.7–41.0 | band in D major | a hand bell as each her is painted; a low bell when the border is complete |
| The plaque | 41.0–46.8 | held D major | a flash on the gilded title, a far bell; 1.4 s fade at the end |

Foley is the painted world's own: wind, steps on stone, the lantern's ring, the flame, a brush and a burnishing hiss on the plaque (procedural). Mix: the voice compressed and set about 10 dB over the music by RMS; while she speaks the music loses part of its 300 Hz–4 kHz band; −14 LUFS, true peak −1 dB from `core/render/mux.sh`. All cue times come from `events.json` (`window.EV`), so the score follows any retiming.

## Palette & props

- Pigments: ultramarine ground (granular, deep lapis at night), vermilion, verdigris, rose, azure, lilac-grey rock, white lead, iron-gall ink; gold leaf in 100-unit squares; vellum only on the speech scroll and the plaque.
- One painted world of 4800 × 2700 units (the whole picture is exactly the last frame): a chapel with a gold-ground pointed arch at the village, a stone bridge with gold roundels on its parapet, round-crowned trees with gold fruit and cypresses, a castle on the right, a zigzag path up a rose rock spire, three ranges of rock (pale far clusters with a flat-topped rock between, a stronger middle range, one big near rock), scalloped clouds, gold stars, the sun (punched rings, wavy and straight rays, a vermilion ring with white-lead pearls).
- The girl: a vermilion robe, an ultramarine cloak, ochre-gold hair, face visible (no hood); hem, belt, clasp and lantern in gold; painted in three layers. The halos behind the five hers: gilded discs with a vermilion ring, pearls and punched rays.
- The border: gold rules, alternating ultramarine and vermilion segments, quatrefoils at the corners.

How the light was kept in check: the average brightness of the frame stays between about 0.19 (summit) and 0.39 (opening macro) on a 0–1 scale; the ending is brighter only through gold (gold-area brightness ≈ 0.64 at the hold against ≈ 0.32 at the summit). Lit leaf is pulled toward a warm gold with per-channel caps (at most 82% of the way), so it never burns white.

## End card

In the plaque in the lower border, part of the painting: *Borrowed Light* first lettered in red bole, then gilded and flashed (Uncial Antiqua); a line in brown ink "借来的光 · 金箔彩绘 *Gilded Illumination*" (Noto Serif SC, IM Fell italic); `LemoLab × Claude Opus 5.5` in vermilion (IM Fell). The plaque starts at 41.25 and is complete about 4 s before the end; the card then holds still. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh       one command: fonts and voice (if missing) → speech check → events → score and mix → subtitles → picture → master → readcheck → poster, styleframe
  index.html     one canvas, the fonts
  lib.js         math and easing, monotone/track, pigments, the leaf-square gold texture (makeGold, leafAt, leafSquares), gold()/goldStroke() with the glint mask (MK),
                 shape, rimShade, hiLine, triad/pearls/pearlLine (white lead), spirePts, camMatrix, reg() for window.TEXTS
  world.js       the one painted world: leaf() with its dark state, rock clusters and mesas (cluster, mesa, drawSpire), drawSun, trees, chapel, bridge, castle,
                 drawGirl (painted in layers), the lantern, halos, drawBorder (grows from the corners), the end plaque
  film.js        render(t): WK time map, the 8 shots, glintPass (lamps, bands, rings per leaf square, capped gold tone), the quatrefoil, the macro leaf,
                 the speech scroll (SUBS), occlusion for the hidden cuts, window.EV for the sound, window.TEXTS
  audio.py       score, foley and voice from events.json → out/mix.wav
  make_srt.py    the .srt from SUBS in film.js
  voice/         lines.json (Kokoro bf_emma 0.8; clips are recorded to out/voice/)
  fonts/         make_fonts.py (Noto Serif SC subset for the Chinese on screen) and the OFL licence texts
```

- `sh styles/gilded-illumination/demo/build.sh` from the library root renders at 30 fps with `--workers 2` (`WORKERS=3` for more). On a fresh clone first run `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce` and `sh tools/fetch.sh instruments vcsl`; the fonts are downloaded from github.com/google/fonts on the first run. After any change to Chinese text (subtitles or plaque), add the characters to `fonts/make_fonts.py` and delete `fonts/zh-serif-*.ttf`.
- Canvas 2D only, no WebGL. `render(t)` depends on `t` only; every frame redraws everything (the 1,404 frames took about 4 minutes with two workers on Apple silicon; the glint pass is per pixel).
- Gold drawn in screen space (the quatrefoil) uses a red mask channel and a screen-space leaf grid; everything else uses the world grid, so the leaf squares stay put as the camera moves.
- Line weight follows the camera (`setZoom`, ink ≈ 4·z^0.38 px), so the ink never thins to a hairline in the whole picture.
- Readcheck: `node core/render/readcheck.mjs styles/gilded-illumination/demo` checks the end plaque's three lines (the speech scroll is the subtitle and is held by the `.srt` rule instead).
