# Scratch Film — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Night Climb* 《夜里往上游》 (52.0 s) · `scratch-film.mp4` · source in [`demo/`](demo/)

At sunset a lanternfish no longer than a finger starts to climb from half a kilometre down. The faint light from above turns it into a shadow for the hunters below; it switches on the lights along its belly, as bright as the glow above, and the shadow is gone. At the surface the camera pulls back from one fish to the whole ocean: countless animals rise every night, the largest migration on Earth, and sink back before sunrise. The deep sea is the style's own rule made into a place: a black ground where every light is a cut. English narration (Kokoro `bf_emma`) with Chinese and English subtitles; the facts are sourced in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: one small fish climbs through the dark, hides its shadow with its own light, and turns out to be one of countless.

Arc: sunset and the descent → a point of light is cut into a fish → the climb → seen from below, the fish is a shadow; tilt down to the hunter; silence → split screen: the belly lights switch on one by one (left) while the shadow is filled in until it vanishes (right) → the hunter bites on nothing → the surface, the fish feeds → one continuous pull from one fish to the whole ocean → dawn is cut across the horizon, every light sinks, the end card is cut into the dark water.

Native moves spent: *a cut across the horizon* (opening and ending), *scratch-in* (the fish), *hatching is light* (the shadow), *lights on, one by one* (the belly), *one mark to a whole place* (the pull).

## Shots

Film time (30 fps, 15 drawings a second). `T` in `demo/js/shots.js` holds every time below.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–5.6 | the horizon is cut left to right, a hatched sun sinks into it; under water five light shafts fade with depth; a ruler on the left, the depth figure climbing to 500 m | wide, then a log-speed descent | cut across the horizon |
| 2 | 5.6–10.0 | a point of light; the hot point cuts an eye around it, then the outline, gill, mouth, fins; teal dye swept in from the head; 12 belly rings; a blink; the tail starts to beat | log push 4.85–6.45, then locked | scratch-in |
| 3 | 10.0–14.3 | the fish holds its place across the cut, then eases into the climb with three flicks; snow in three parallax layers, a blurred jellyfish, ruler and depth 480 → 260 m fading in after the cut | tracking alongside | the cut doesn't move |
| 4 | 14.3–23.3 | from below: a hatched glow of blue and cream, the fish a black silhouette; tilt down to a red hunter with fangs, a red light under its eye and a lure; silence 22.15–23.3 while its jaw opens | worm's-eye, tilt down 18.9–20.0 | hatching is light |
| 5 | 23.3–31.0 | a divider is cut top to bottom; left, the belly in close-up, twelve lights switching on head to tail with rays thrown down; right, the hunter's view: the right half opens on the previous picture, settles into its own framing, and the silhouette is filled segment by segment until it is gone | split, then a slow settle on the right | lights on, one by one |
| 5b | 31.0–32.4 | the right half's framing, full screen; the hunter lunges into the glow and bites on nothing (31.45), then sinks away | locked | |
| 6 | 32.4–36.5 | the surface: scratched waves, stars, a hatched moon broken into yellow strokes on the water, green plankton; the fish rises in and snaps one up | slow push | |
| 7 | 36.5–45.6 | one continuous pull (about ×5000): the fish → a school of complete fish → hundreds of small fish → thousands of blue points → the whole ocean under the stars; the ruler returns with 100/200/300 m | log pull 36.6–43.4, then held | one mark to a whole place |
| 8 | 45.6–52.0 | half a beat of silence; dawn is cut across the horizon in warm yellow, the sky fills with yellow and red hatching, the sun rises on the left; every light sinks and goes out; the end card is cut into the dark water; one last blue point blinks twice | locked wide, slow push | cut across the horizon |

Transitions: one camera from shot 1 into shot 2 and from shot 6 through shot 8. Where there is a cut (10.0, 14.3, 23.3, 31.0, 32.4), the subject keeps its place across it and new elements come in afterwards.

## Voice and subtitles

Twelve English lines, Kokoro `bf_emma` (speed 0.62–0.80, 2.35–2.59 words a second), each checked with `core/tts/asr_check.py`. Line starts are in `demo/timeline.py`, which writes `timeline.json` for the page and the mix and the `.srt`. Subtitles: Chinese (LXGW Marker Gothic, 42 px) over English (Jost, 29 px), low left, cut in left to right; every cue is at least 1.8 s and at least its line + 0.6 s (shortest 2.6 s).

## Score structure

84 BPM, D. Struck vibraphone figures, bowed vibraphone chords, pizzicato double bass, glockenspiel, log drum, a snare with the snares off for the flicks (VSCO 2 CE, VCSL).

- 0–5.6: a bowed chord at sunset; the bass steps down as the camera sinks.
- 5.6–10: a quiet vibraphone figure while the fish is cut, resolving at 8.9; a glockenspiel at the blink.
- 10–14.3: the figure climbs with the bass, one step a beat.
- 14.3–22.15: the figure stops; a dark bowed chord; log drum when the hunter appears; a hard vibraphone semitone on its eye.
- 22.15–23.3: silence.
- 23.3–31: one glockenspiel note per light, rising, each with a fluttering drawn tone; a bright bowed chord grows; a resolving chord at "the shadow is gone"; the bite is a log drum.
- 32.4–36.5: the sea wash comes back early (31.9); light vibraphone.
- 36.5–45.35: the figure returns and builds with the pull, blooming at 43.4.
- 45.35–45.75: half a beat of silence.
- 45.75–52: the dawn chord; the bass goes down with the lights; two last glockenspiel notes.

Mix: voice compressed and set about 10 dB above the music by RMS; the music makes room at 300 Hz–4 kHz under the voice; a linked limiter tames the glockenspiel and log-drum peaks; master −14 LUFS.

## Palette & props

Ground `#050403`, cuts `#FFF4DC`; teal `#1FB39A` the lanternfish; blue `#2F86FF` living light (belly lights, the crowd of points, the glow from below); red `#FF3220` the hunter; yellow `#FFC81C` sun, moon and dawn; green `#46D65A` plankton. Props, all drawn in code: the lanternfish (side view with 12 belly lights, ventral silhouette), a dragonfish-like hunter, copepods, a jellyfish, a depth ruler, stars, the moon.

## End card

From 48.0 s, cut into the dark water once the lights have sunk: *THE NIGHT CLIMB* (Jost 800 filled with diagonal cuts), 夜里往上游, "Scratch Film · 胶片直刻" and "LemoLab × Claude Opus 5.5" with a red dye underline; held to 52.0. The sign-off belongs to this library demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- `sh demo/build.sh` (from anywhere) does everything: voice (if missing) and its speech check, `timeline.py`, fonts (if missing), events, the picture (`--workers 2` by default), `mix.py`, master, subtitles, readcheck, poster and `demo/stills/styleframe.jpg` (39.2 s, between two subtitle cues).
- On a fresh clone, first: `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice`, `sh tools/fetch.sh instruments vsco2ce`, `sh tools/fetch.sh instruments vcsl`. `make_fonts.py` downloads the three fonts from github.com/google/fonts.
- Entry points: `demo/index.html` loads `js/base.js` (marks, emulsion), `js/creatures.js` (fish, silhouette, hunter, plankton, jellyfish), `js/shots.js` (the `T` table and every shot), `js/main.js` (render, light pass, subtitles, `TEXTS`, `EV`). `?from=a&to=b` renders a part of the timeline.
- Contract: `window.READY`, `render(t)` depends on `t` only, `DUR = 52`; `TEXTS(t)` passes `core/render/readcheck.mjs` (the ruler, depth figure and end card; subtitles follow the subtitle rule above).
- 1080p: 30–150 ms a frame; page ready in about 1 s.
