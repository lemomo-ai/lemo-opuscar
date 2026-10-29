# Technique: how the films are built

Every film here is made from code: no video generation, no stock footage. This page explains the pipeline, to reproduce with our tools in `core/` or in your own stack. Pair it with [`DIRECTOR.md`](DIRECTOR.md) and one `styles/<slug>/STYLE.md`. Every command and flag is in [`core/README.md`](core/README.md).

```
timeline (single source of truth)
   ├─► picture:  web page with render(t) ──► headless Chrome, frame by frame ──► video.mp4
   ├─► voice:    TTS per line ──► speech-to-text check ──► word timings
   ├─► music:    score from the same timeline (samples + synthesis) ──► stems
   ├─► sound:    procedural foley at event times
   └─► subtitles: .srt + burned-in captions
mix (duck, compress, balance) ──► mux with ffmpeg, two-pass loudnorm −14 LUFS ──► film.mp4
```

## 1. Requirements and install

System tools, which the user installs: **Node 20+**, **ffmpeg**, and **Python 3.11+** or [uv](https://docs.astral.sh/uv/). Developed on macOS (Apple silicon); Linux should work. On Windows, Git Bash (part of Git for Windows) works: run the same `sh` commands there; WSL also works. 3D and shader-heavy styles want a GPU.

Everything else installs in tiers, from the library root (`$LIB` in skill mode). Install a tier only when the film needs it:

| Command | Adds | Size |
|---|---|---|
| `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps` | core: npm packages, headless browser, Python `.venv` (numpy, scipy, soundfile, soxr, pillow): render, synthesize sound, mux | ~350 MB |
| `… setup.sh deps voice` | Kokoro + model (English, offline), edge-tts (Chinese, online), faster-whisper (voice check) | ~0.55 GB + a Whisper model on first check (~145 MB for English, ~480 MB for Chinese) |
| `… setup.sh deps music` | numba, for plucked strings (`pluck.py`); the sampler itself needs only the core | ~140 MB |
| `sh tools/fetch.sh instruments <lib>` | a sample library: `freepats`, `karoryfer`, `salamander`, `vcsl`, `vsco2ce` or `all` | 70–400 MB each |
| `sh tools/fetch.sh hdri` | HDRIs for 3D styles | 12 MB |

Some styles need packages of their own (a LiDAR reader, a slide-scan decoder, a CAD importer); the style's `STYLE.md` lists them. They are packages, not system tools: install them yourself into a private venv or `node_modules` in the project folder, never into `$LIB/.venv`.

A synthesized score needs no big download; `sampler.py` names the library to fetch when an instrument is missing. A pack needs about twice its size free while it unpacks. Downloads come from npm, PyPI, GitHub Releases and Hugging Face (`HF_ENDPOINT` sets a mirror).

## 2. The picture is a function of time

Each film is a folder with an `index.html` (`<demo>` in the commands) that exposes:

```js
window.DUR = 54.2;                 // seconds
window.render = (t) => { ... };    // draw the frame at time t, deterministic
window.READY = true;               // set once fonts and images are loaded
window.EV = [{t, type, ...}];      // optional: sound / cue events for the mixer
window.TEXTS = (t) => [{id, text, x0, y0, x1, y1}];   // optional: every text visible at t, for readcheck
```

**Paths:** pages reach library files with absolute URLs (`/core/lib.js`, `/node_modules/three/build/three.module.js`); scripts and `build.sh` use `$LIB`. Never `../..`.

A `build.sh` that works in both modes (in skill mode, put `LIB=<path setup.sh printed>` at the top):

```sh
#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}          # clone mode: <repo>/films/<name>/
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"                               # score, foley, voice → out/mix.wav
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/<name>.mp4" 24
```

Rules that keep it reliable:

- **Deterministic.** No `Date.now()`, no `Math.random()` without a seed (`core/lib.js` has `mulberry` and `hash`), no state carried from the previous frame. Any frame can be rendered alone, in any order, by any worker.
- **Canvas 2D** for most 2D styles; **three.js** for 3D (§9); **WebGL2** shaders for post passes (film damage, CRT, ink redraw).
- **Animate on twos where the style wants it** (12 fps stepping for stop-motion, pixel or cel looks), but keep the camera and light smooth every frame. A stepped camera reads as lag.
- **One world → screen function.** Any effect that follows a subject (iris, zoom, spotlight) goes through it. Never hand-type screen coordinates.
- **Draw for the frame you render.** The default is 1920×1080; for another size pass `--size WxH` (e.g. `1080x1920`) to every render tool and lay the page out from `innerWidth` × `innerHeight`.

Capture (`core/render/`):

```sh
node core/render/still.mjs <demo> 1.5 12 --range 0:50:2   # review stills; exits on page errors
node core/render/video.mjs <demo> --fps 24 --workers 3     # all frames → <demo>/out/video.mp4
node core/render/events.mjs <demo>                         # export DUR + EV → events.json
node core/render/readcheck.mjs <demo>                      # every on-screen text stays long enough to read
```

To render a second version with other content, pass it to the page and give it its own output: `--q 'content=content_alt.json' --out …/alt.mp4` (the same for `events.mjs`).

Capture is fast because of **JPEG screenshots**, **one browser per worker** and **grain added in ffmpeg**: grain drawn in the page makes every frame incompressible and slow.

## 3. One timeline drives everything

Keep sections, tempo, beats and hit points in one file (`timeline.js`). Export it to JSON and let the score, the mixer, the subtitles and the checks read the same numbers:

```js
export const SECS = [{ id: 'chase', t: 12.0, bpm: 144, beats: 12 }, ...];
export const HIT  = { pratfall: ['chase', 6], ... };   // section + beat
```

A small script (`cuecheck.py`, in `styles/<slug>/demo/tools/` of several demos) compares every visual hit with the music cue it should land on. Aim for 0 ms.

## 4. Voice

- **TTS is only the default.** If the user brings a recording or names a voice, use that. Otherwise:
  - **English**: [Kokoro](https://github.com/thewh1teagle/kokoro-onnx), local, many voices (an unknown `voice` name makes `tts.py` print the full list; `af_` / `am_` are American, `bf_` / `bm_` British; cast the narrator for this film, not the demo's). `core/tts/tts.py lines.json out/` writes one WAV per line and a durations file. Its Chinese voices (`"lang": "cmn"`) work offline but sound plain.
  - **Chinese**: `core/tts/tts_zh.py lines.json out/` uses [edge-tts](https://github.com/rany2/edge-tts) with Microsoft's neural voices (`zh-CN-XiaoxiaoNeural`, `zh-CN-YunxiNeural`…), with the same outputs as `tts.py`, a rate per line and the silence trimmed. **It needs a network connection.**
- Spell numbers out in the TTS text and write them as digits in the subtitles.
- **Check every line**: `core/tts/asr_check.py` transcribes each WAV with faster-whisper and compares it with the script (`--lang zh`: character by character); re-generate until it exits 0. A misheard character in a short Chinese line is normal: listen, and if it is right, put what the model heard in the line's `asr` field. It also writes word timestamps for placing lines and subtitles.
- **Before mixing**: TTS has a high peak-to-average ratio. Compress the voice first, then balance by RMS: voice about 10 dB above the music.

## 5. Music

Write an original score from the cue map, in the instruments of the style's sound palette; no generic piano and strings.

- **Samples**: `core/audio/sampler.py` plays real instruments from free libraries (VSCO 2 CE, VCSL, FreePats, Karoryfer, Salamander Grand Piano; list and licences in `core/audio/INSTRUMENTS.md`). Write the score as events `(time, instrument, pitch, duration, velocity, pan)`. Long notes are extended seamlessly, and round-robins avoid the machine-gun effect.
- **Plucked and folk strings** (guqin, pipa, shamisen, banjo…): `core/audio/pluck.py`, physical modelling (Karplus–Strong) with bends and vibrato.
- **Synthesis** with numpy for chip tunes, drones and effects; no download needed.
- **Balance the low end.** Synthetic scores get bass-heavy quickly. Measure energy per band after mixing; keep 20–120 Hz around −3 dB relative to the rest, skip pad notes below MIDI 48, and give the bass some 2nd and 3rd harmonics so it speaks on small speakers.

## 6. Sound effects and mix

- `core/audio/sfx.py` synthesises foley procedurally (click, whoosh, thump, ding, paper, noise beds…) with filters, envelopes and `add(buffer, sound, at, gain, pan)`. Drive it from `window.EV`, so every sound sits exactly on its frame.
- **Master**: `sh core/render/mux.sh video.mp4 mix.wav out.mp4 24 [grain]` muxes, runs a two-pass loudnorm to −14 LUFS with a true-peak limit, adds grain in ffmpeg and prints the measured loudness; it exits non-zero on any failure. On light backgrounds use less grain; for pixel and vector styles, none.
- Films with grain baked into the picture compress badly; re-encode with `-tune grain` and a higher CRF.

## 7. Subtitles

- Export `.srt` with `core/render/srt.py cues.json out.srt` (cues = `[{t0, t1, text}]`), and burn styled captions into the page itself: the caption design is part of the style.
- Timing rules are in DIRECTOR.md §7.

## 8. Review loop

1. Contact sheets: a frame every 1–2 s with `still.mjs --range`, tiled with `core/render/sheet.py`. At least two full passes.
2. Frame strips at 0.2 s for every key action: hand-overs, falls, hits.
3. On the final file: `ffmpeg -af ebur128` (loudness), `blackdetect` (blank frames), whisper again on the final mix if it has voice.
4. Watch it once, at full speed, with sound.

## 9. 3D notes

- three.js r170 rendered headless through WebGL2 on the GPU; physical depth of field and GTAO from `core/three/post.js`, rendered at 2× and downsampled.
- Lighting: soft area lights plus a Poly Haven HDRI at low intensity reads more "real" than bright ambient light.
- `core/three/post.js` is written for a perspective camera. For an orthographic camera swap `perspectiveDepthToViewZ` for `orthographicDepthToViewZ` in its depth pass, or the depth of field silently breaks.

## 10. Characters drawn in code

- A 2.5D rig (torso, head, limbs solved per frame) is enough for pantomime.
- Order the shoulder rotation as abduction, then flexion; the reverse order crosses raised arms into an X.
- Let the shoulder girdle rise and move forward as the arm lifts, and don't outline the part of the arm that overlaps the torso: that line is what makes a joint look like a puppet seam.

## 11. Assets, credits and fonts

Only CC0, CC BY or OFL material, each listed in the film's `CREDITS` with its source and licence; `core/audio/sampler.py credits(names)` writes the lines for the instruments you used. Public-domain works count as CC0; "no known restrictions" does not. Data or images under other open licences (ODbL, CC BY-SA, open-hardware licences) only after you have named the licence and its terms (attribution, share-alike) to the user and they agree. The user's own material is fine as it is.

A film that states facts (the Evidence Films styles) keeps a `FACTS.md` in the project folder: each claim with its source URL and the quoted wording, or the measurement that produced it.

Fonts: Google Fonts (OFL), self-hosted in the project. The typefaces a `STYLE.md` names are not in the library; download them (`https://github.com/google/fonts/tree/main/ofl/<family>`) into the project's `fonts/`. `core/fonts/` holds a few Latin display fonts and a Chinese display font with only about 200 glyphs, not enough for running Chinese text. For Chinese, subset a CJK font to the characters you use: the Google Fonts CSS API with `&text=` returns just those glyphs (`https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=<URL-encoded characters>`). Download the font file it points to into the project's `fonts/` and load it with `@font-face`; don't link Google Fonts at render time.

## 12. Where to look in our demos

| If you need… | Look at |
|---|---|
| 2D character animation and lip sync | `styles/scifi-toon/`, `styles/cel-anime-80s/` |
| a timeline-driven score with cue checking | `styles/microgame/`, `styles/silent-film/` |
| an image-to-ink redraw and film-damage post pass | `styles/silent-film/demo/engine/` |
| a brush or stroke engine | `styles/watercolor/`, `styles/ink-wash/`, `styles/impasto/` |
| 3D with depth of field and real materials | `styles/brick-toy/`, `styles/paper-popup/` |
| a CRT or VHS look | `core/post/crt.js`, `styles/ascii-crt/`, `styles/backrooms/` |

Each style's `DEMO.md` says how its demo was built. Open it and the code only after your treatment exists, to learn a technique, never to rebuild our film (an Edit & Documentary style's material tools in `demo/tools/` come first: AGENTS.md, "Treatment first"). In skill mode, get the source with `sh <skill folder>/scripts/setup.sh demo <slug>`. Copied demo code often reaches the library with `../..`: replace that with `$LIB` or absolute URLs.
