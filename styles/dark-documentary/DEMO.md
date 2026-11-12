# Radar Sweep Documentary — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Catching the Moon* 《狂风里接住登月直播》 (52.0 s) · `dark-documentary.mp4` · source in [`demo/`](demo/)

21 July 1969, Australian time: the 64-metre radio telescope at Parkes receives the TV of the Apollo 11 moonwalk in a storm. A calm English voice (Kokoro `bm_lewis`) tells it in eight sentences, with Chinese and English subtitles. Every date, time and number is quoted from CSIRO's account in [`demo/FACTS.md`](demo/FACTS.md); the first step is told as it happened (the world saw it on Honeysuckle Creek's picture; Parkes's picture took over from 13:02:51).

## Story & structure

The question the film keeps open: the observatory's director had said before the mission that the weather was their biggest weakness, and on the day a storm came. Will the dish hold?

Arc: a clear night while Parkes tracks Apollo 11 to the Moon (the scan reveals the dish; title) → a second scan rewrites the same shot into the stormy midday of 21 July → the dish is lowered to its own horizon, 29°38′, to wait for the Moon → two gusts over 110 km/h slam it against its gears (wind trace, alarm) → the comparison: wind force ten times what was considered safe → on the Moon, the TV camera switches on at 12:54 → the Earth–Moon view: three stations, and the first step goes out on Honeysuckle Creek's picture → the Parkes control room: the signal-strength needle jumps as the Moon enters the main beam → the monitor becomes the picture the world saw, HSK → PKS at 13:02:51 → the picture collapses into a line, the line becomes the scan, the camera pulls back from the whole dish in the wind: 2 h 31 min, about 600 million watching → the end card.

Native moves spent: the scan reveal and the sky behind the beam (opening), scan rewrites time (night → storm), scan wipes, motion echo (the tip and the gusts), radial pings, readouts written by the scan (angle, trace, ×10, source track, meter), scan line = TV raster, CRT to scan (into the last shot).

## Shots

| # | Time | Shot | Camera | Move / note |
|---|---|---|---|---|
| 1 | 0–13.4 | Black; the scan ignites at 0.2 and surges right on the beat; the dish is met at 1.1 (struck ring), keeps a cold rim; the Milky Way appears behind the beam; title 4.2–5.5; at 9.0 a second scan rewrites the shot into the storm (grey cloud deck, rain), erasing the night labels; `登月当天 · 21 JUL 1969 · STORM` | wide, dolly only (no rotation) | scan reveal; scan rewrites time |
| 2 | 13.4–18.5 | Side medium: the dish lowered from its tracking pose to 29°38′ with after-images; a large elevation reading counts down on an arc; `LIMIT 29°38′ · THE DISH'S OWN HORIZON`; `WAITING FOR THE MOON` | scan wipe in; slow orbit | motion echo |
| 3a | 18.5–21.6 | Close on the feed legs and the focus cabin in the rain; wind trace top left, first gust over the 110 km/h line at 19.8 | hard cut; handheld, shake grows with the wind | |
| 3b | 21.6–24.2 | Low wide from behind: second gust at 22.8, the dish slammed back (after-images, a flash); `WIND ALARM` | hard cut; strong shake | |
| 3c | 24.2–27.6 | Comparison panel over a dimmed close of the gear house: `CONSIDERED SAFE` one bar, `THE GUSTS, 21 JULY` ten bars, `×10 · 十倍风力` | locked | held 3 s; near-silence |
| 4a | 27.6–31.7 | The Moon: the scan reveals the lunar module (gold-foil descent stage, four legs and pads, ladder, faceted ascent stage with triangular windows, docking hatch, thrusters, dishes) with long shadows under a low sun; Earth in the black sky; 30.45 `12:54:00 AEST · TV ON`, a warm signal line rises from the TV camera on the equipment bay to Earth | scan wipe in; low camera, slow push | a new space |
| 4b | 31.7–37.4 | The Earth–Moon view, schematic: three stations with beams to the Moon; the source track `PICTURE THE WORLD SAW` (GDS/HSK, `12:56:20 FIRST STEP · VIA HSK`, cursor at `13:02:51 ?`) then a replay cursor that lights the beam on air; Parkes `OFF-AXIS ONLY: MOON STILL LOW` | scan wipe in; slow drift around the globe | |
| 5 | 37.4–40.7 | The control room: desk, switch rows, the signal-strength meter, the central column, the small monitor at the far end, rain on the window; at 40.1 the needle jumps; a fast track past the column to the monitor | hard cut; hold, then a fast track | |
| TV | 40.7–45.35 | Match cut: the monitor's screen grows into the picture the world saw (our drawing of a moonwalker by the lander), written line by line; noisy until 41.5, then clean: `SOURCE HSK → PKS · 13:02:51 AEST · PARKES · MAIN BEAM`; at 45.0 the picture collapses into a vertical line | match cut; locked | near-silence before the switch; the brightest chord on it |
| 6 | 45.35–52 | The line becomes the scan across the storm; the camera pulls back and up from the dish to about a third of the frame height, the dish buffeted (one more gust at 47.3 with after-images); a last radial ping at 45.7; `2 h 31 min · THE MOONWALK, HATCH TO HATCH`, `约 6 亿人在看 · ≈ 600 MILLION PEOPLE WATCHING`; end card 48.0–52.0; the picture sinks to black from 50.6, the card stays | pull back and up | radial ping; end card |

## Voice and subtitles

Eight lines, Kokoro `bm_lewis` at speed 0.82 (about 2.6 words a second), each checked with `core/tts/asr_check.py` (`asr` overrides in `demo/vo/lines.json` for "Parkes", heard as "parks", and for numbers written as digits). Numbers are spelled out in the voice text and written as digits in the subtitles. Each cue starts 0.15 s before its line and ends 0.45 s after it, one Chinese line over one English line, bottom left; `dark-documentary.srt` is generated from the same timing.

## Score structure

96 bpm, around D minor, one timeline (`demo/mix.py`):

- Night: contrabass D2 and A2 held, bowed vibraphone open fifth under the title, four glockenspiel notes as the stars appear; one sonar ping per scan surge.
- Storm: cellos D3 → F3 → E♭3 tightening, high violin tremolo; a timpani stroke, a deep hit, a metal groan and gear chatter on each gust; the alarm bell; wind and rain loud.
- Comparison: almost silent.
- The Moon and the globe: the storm drops away to a thin radio hiss; a quindar-like beep and a low carrier when the TV comes on; a vibraphone pulse in eighths that gets denser.
- Control room: room tone and muffled wind; a click when the needle hits its stop; an air surge on the fast track.
- The switch: TV hiss and line buzz, then near-silence, then the brightest chord (bowed vibraphone D major, violins, cellos, contrabass, a harp roll, glockenspiel).
- End: the CRT's falling whine, the last ping, the chord breathes again, the suspended E resolves to D under the end card, everything lets go by 52 s.
- Voice about 10 dB above the bed while it speaks; the bed is ducked and dipped 300 Hz–4 kHz under it. Master −14 LUFS, true peak −1.1 dBFS.

## Palette & props

Echo blue-white `#B3DBFF`, scan white, text greys `#EEF2F6` / `#C4CED8` / `#96A2B0`, one warm accent `#F2C48D` for the Moon and the signal, warning red `#FF8C78` for the over-limit values; storm cloud base up to `#3B3F44`.

Props, all built in code: the Parkes dish (lathe bowl, truss, feed tripod, focus cabin, tower, gear house, elevation gear sectors), terrain from noise, the lunar module, a wireframe Earth and Moon with coarse coastlines, the control room (desk, switches, meter, column, monitor, window), the TV picture (`demo/tvart.js`).

## End card

48.0–52.0 s, bottom right of the last shot, written by the scan bar: `Catching the Moon` / `雷达扫描纪录片 RADAR SWEEP DOCUMENTARY` / `LemoLab × Claude Opus 5.5` (28 px). It stays on the black after the picture sinks at 50.6 s.

## Build notes

```
demo/
  build.sh        one command: fonts and voice (if missing) → speech check → readcheck → events → picture → mix → master → subtitles → poster, styleframe
  index.html      two WebGL canvases (the second only during scan wipes) and the 2D overlay; fonts
  main.js         render(t): timeline, VO, the Parkes world (terrain, dish, sky, rain), scans, cameras per shot, overlays, TV, end card, EV, TEXTS
  scenes2.js      the Moon (lander, Earth), the Earth–Moon globe, the control room; each with its own scan
  tvart.js        the TV picture (moonwalker, lander leg, ladder, regolith), drawn once at 960×720
  mix.py          wind, rain, foley, score and voice from events.json -> out/mix.wav
  vo/             lines.json (Kokoro bm_lewis, asr overrides) and the rendered clips with their durations
  tools/          fetch_fonts.sh (OFL fonts, Chinese subset from main.js), make_srt.py (subtitles from events.json)
  FACTS.md        every fact, its source and the quoted wording
```

- `sh demo/build.sh` (24 fps, `--workers 2`; `WORKERS=3` for more). On a fresh clone first run `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce` and `sh tools/fetch.sh instruments vcsl`; fonts are downloaded on the first run (the Chinese subset needs network access to the Google Fonts CSS API). After any change to Chinese text in `main.js`, delete `demo/fonts/NotoSansSC-Light-subset.woff2` so it is fetched again.
- About 60–110 ms a frame at 1080p on Apple silicon (2× supersampling, bloom); scan-wipe frames render two views.
- `render(t)` depends on `t` only: scans, gusts, the dish pose, the wind and rain offsets are closed-form.
- `?t0=&t1=` renders a cut of the timeline; `&sign=1` adds the signature line over the last 2.5 s of a cut.
- Demo-specific pitfalls: the star shot keeps the camera unrotated; the scan front is faded near the lens on the Moon; the lunar module casts its shadows by projecting each solid part onto the ground along the sun direction; the TV readout sits on a dark plate because the ladder in the picture crosses it.
