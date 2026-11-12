# Firefly Pointillism — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Shine Back* 《你亮，我就亮》 (50.6 s) · `firefly-pointillism.mp4` · source in [`demo/`](demo/)

A small girl in a summer meadow at night, a deer made of fireflies, a storm, and the whole dark answering. The film gives the dots one rule and keeps it: **a blink is a question, a blink back is an answer** (fireflies court with flashes; one species in the Great Smoky Mountains flashes in unison, see [`demo/FACTS.md`](demo/FACTS.md)). The opening teaches the rule, the middle breaks it (every light goes out), the ending fulfils it. Nine short English lines in Kokoro `af_bella` carry the rule and the feeling; the dots carry every action. Chinese and English subtitles are burned in and exported as `firefly-pointillism.srt`. The girl, the deer and the story are invented.

## Story & structure

Logline: a girl learns the fireflies' language (a blink asks, a blink answers); when every light is gone, she uses the last one to ask the whole dark.

Arc: a stream of light pours in and becomes a meadow and a girl → a firefly lands on her finger and blinks twice (the question) → the meadow answers, first as a ripple, then all at once → the answer swirls into a deer, which touches her hand → she rides it; a gust carries them to a far ridge under the moon → the moon turns to storm cloud, the trail of fireflies turns to rain, a head wind pushes us close → the deer is torn apart and goes out; she falls → two seconds of dark → the deer's eye, the last light, drifts into her hands; she stands and holds it up (the question again) → one point on the horizon answers, then five, then the whole horizon from far to near → the dead embers swirl into a deer taller than the frame, which bows its head to her light → it leaps, intact, into the sky and becomes a constellation; the world re-forms as a hill → she blinks once more and the sky deer's eye blinks back → the title gathers from the trail.

Every signature move comes back bigger: the synchronous flash goes from one finger to the meadow to the whole horizon to one star; the swirl goes from a deer to a giant deer; the gust carries the travel and then the storm; the identity swap runs moon → cloud, trail → rain → answering lights → path → title.

## Shots

| # | Time (s) | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–1.6 | A stream of light enters from bottom left and lands as grass, distant bokeh, fireflies and the girl | wide, locked | the pour-in; the hook is "light becomes a world" |
| 2 | 1.6–4.6 | The brightest point drifts down onto her finger and blinks twice | wide, very slow push | the guiding light; the rule's first half |
| 3 | 4.6–8.4 | A ripple runs out from her finger across the meadow, then the whole field flashes at once (8.4) | same | synchronous flash, ripple and unison |
| 4 | 8.4–9.75 | The fireflies rise, swirl, focus into a deer (chord at 9.75) | same | swirl gathering, focus pull |
| 5 | 9.75–12.55 | The deer steps forward, lowers its head, touches her hand (11.0) | medium wide, push | rig performance |
| 6 | 12.55–15.0 | She scatters and arcs onto its back; it walks right | lateral tracking with three-layer parallax | arc jump |
| 7 | 15.0–20.3 | A gust blows the meadow left to right into streaks; it re-forms as a far ridge, moon and stars, the two small riders walking, a trail behind them | gust, then extreme wide drifting | gust change of scene |
| 8 | 20.3–21.7 | The moon is blown into cloud, stars go out, the trail becomes slanted rain | extreme wide | identity swap |
| 9 | 21.7–25.0 | A head wind pushes the shot in: the deer walks into the rain, head down, grass flattened | push-in made of particles re-scaling, slight shake | gust in the opposite direction |
| 10 | 25.0–26.4 | A gust tears the deer from the head back; its points stream left and go out; she falls and kneels | medium, locked | going out (scatter without re-forming) |
| 11 | 26.4–28.4 | Rain stops. Dark. Only the kneeling girl, her amber dimmed by half | very slow pull-back | the film's real silence |
| 12 | 28.4–33.6 | The last light drifts down into her hands; she stands and holds it high; it flashes (33.6) | slow push to close-medium | the guiding light, second time |
| 13 | 33.6–36.5 | Half a beat of silence; one point answers on the horizon (34.3), then five (34.8), then the whole horizon from far to near (35.35) | fast pull-back to wide | synchronous flash, ×100 |
| 14 | 36.5–41.0 | The embers relight, rise and swirl into a giant deer (38.05) that keeps its full silhouette, bows, and meets the light, which floats up from her hand (39.7) | wide, slight tilt | swirl gathering at 1.45× scale; rhymes with shot 5 |
| 15 | 41.0–42.2 | The giant deer crouches and leaps; in flight it shrinks and turns into stars; the ground re-forms as a hill with the girl on top | the whole scene re-forms upward | into a constellation |
| 16 | 42.2–46.0 | She raises the light and blinks (42.55); the sky deer's eye blinks back (45.0); a path of fireflies links them | extreme wide, locked | synchronous flash, last and smallest |
| 17 | 46.0–50.6 | The path rises into the title, then the style line and the sign-off | same | text made of points |

## Score structure

D major with a Lydian colour, B minor for the storm; events placed on the timeline constants (`demo/timeline.py`), not on a grid.

- **Meadow**: a harp glissando for the pour-in, a harp D chord and string pad on landing, vibraphone as the light drifts down, a hand chime when it lands. The *question* motif: glockenspiel E6 → A6. The *answer* motif: hand chimes A → F♯ → D. A harp sweep across the stereo field for the ripple, a hand-chime chord for "all at once", an accelerating harp arpeggio and cymbal swell into the deer (G maj7 with C♯ on landing, timpani). Violin pizzicato hooves from the gait phase; a walking cello pizzicato and harp eighths once they ride.
- **Ridge**: harp B minor chord, a flute travel melody over harp arpeggios (Bm–G–D–A).
- **Storm**: low strings, contrabass pedal, string tremolo, timpani, cymbal roll; a fast falling glockenspiel run as the deer is torn; then silence (26.4–28.4) with only a tail of wind.
- **Answer**: one glass-harp note for the last light (the first sound after the silence), a slow string pad as she stands, the question motif and a hand chime on her flash, half a beat of silence, one glockenspiel note panned to where the first answer is, five more, then a big harp sweep with the answer motif; hand-chime pulses on the synchronous flashes; the giant deer lands on a D major tutti (harp, hand chimes, horns, strings, timpani); the touch reuses the first touch's glass and chime.
- **Sky**: a harp glissando up for the leap, the question motif on her blink, the flute finishing the travel melody, the answer motif from the sky; a harp sweep into a D add9 chord for the title, left to ring to the end.
- **Ambience**: crickets in the meadow, gone in the storm, returning one by one after the answer (they carry over the pull-back to the end); wind and rain synthesised, the rain entering 0.35 s before the picture's rain.
- **Mix**: voice compressed and set 11 dB (RMS) above everything else while it speaks; wind and rain step back under the voice and the bed dips 300 Hz–4 kHz; −14 LUFS, true peak about −1.1 dBFS.

Voice: Kokoro `af_bella`, speed 0.72–0.84, nine lines split at commas into fifteen phrases with 0.35–0.45 s breaths (`demo/vo/lines.json`); every phrase passes `asr_check.py`. About 2.2–2.7 words per second; the last line is slower.

## Palette & props

- Ground `#050708` → `#060907`; girl amber (1.0, .74, .34); deer lime (.78, 1.0, .46); fireflies (.86, 1.0, .40); grass (.32,.62,.20) → (.62,.88,.30); cloud and rain (.40,.54,.50) / (.66,.82,.74); stars (.86,.90,1.0); title (1.0,.90,.58).
- Particle pool: girl 2,400 (1,500 outline + 900 fill), deer 3,600 (2,300 + 1,300), grass 5,000, small fireflies 6,000, bokeh 1,800, one guiding light with a halo, and fixed flash slots.
- The girl: big head, ponytail with a bow, A-line dress, one bright eye point. The deer: two seven-segment antlers, long legs, short tail; its eye is the guiding light. The giant deer is the same rig at 1.45× with the feet staggered so all four legs read.
- Type: LXGW WenKai (OFL) for the particle title and the subtitles.

## End card

In the sky at the top left, diagonal to the walking deer constellation, made of points: 「你亮，我就亮」 (138 px), "SHINE BACK" (40 px, wide tracking), then "Firefly Pointillism · 萤火光点" and "LemoLab × Claude Opus 5.5" (30–32 px). The title lands at about 46.5 s, the two small lines at about 47.45 s, all held to 50.6 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- `sh styles/firefly-pointillism/demo/build.sh` (from anywhere; `WORKERS=2` by default): the font if missing (LXGW WenKai v1.245.1, pinned), the voice if missing (Kokoro) and the speech check, `timeline.py` (phrase starts, subtitle cues, `timeline.json`, the `.srt`), the picture at 60 fps (Python, about 12–20 min with two workers), `mix.py`, `mux.sh`, readcheck, poster and gallery frame (39.8 s, the giant deer's touch: no subtitle, no text).
- A fresh clone first needs `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice` and `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce`, `… vcsl`, `… freepats`. Python packages: only the core and voice tiers (numpy, scipy, pillow, soundfile, soxr; kokoro-onnx, faster-whisper).
- `demo/timeline.py`: every story time, the narration starts and the subtitle text (the single source for picture, sound and subtitles). `demo/film.py`: the state functions per group and scene, `blend()`, the rigs' poses, the camera, the burned-in subtitles, `render(t)`; `python film.py still 39.8` renders test frames to `demo/out/stills/`, `python film.py render a b out.mp4` any slice (frames are independent, so a slice joins a full render frame-exactly). `demo/engine.py`: rig and occlusion, text sampling, the five-level splatting pyramid. `demo/mix.py`: score, ambience, foley, voice.
- `demo/readcheck/index.html` lists the end-card text with the times and boxes `film.py` uses, so `core/render/readcheck.mjs` can time it (the film itself is not a web page). It flags one line: "Firefly Pointillism · 萤火光点" is fully formed for 3.12 s and the rule asks for 3.66 s; the title, "SHINE BACK" and the sign-off pass.
- Pitfalls of this demo's props: the giant deer's bow is shallow (neck 1.59 rad) and the light rises 95 px from her hand to meet it, so the back line never collapses; the leap moves the whole rig along an arc instead of scattering it.
