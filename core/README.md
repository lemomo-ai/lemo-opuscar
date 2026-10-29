# core/: the shared production tools

Command reference for `core/` and `tools/`. How the pieces fit together is in [`TECHNIQUE.md`](../TECHNIQUE.md). Run commands from the library root (`$LIB` in skill mode); Python is the library's `.venv/bin/python`. `<demo>` is any folder with an `index.html`.

## Install

| Command | What it does |
|---|---|
| `sh plugin/skills/lemo-opuscar/scripts/setup.sh` | find, clone or update the library; prints `LIB=<path>` |
| `… setup.sh deps` | core tier: npm packages, headless browser, `.venv` from `requirements.txt` |
| `… setup.sh deps voice` | adds `requirements-voice.txt` (kokoro-onnx, edge-tts, faster-whisper) and the Kokoro model |
| `… setup.sh deps music` | adds `requirements-music.txt` (numba, for `pluck.py`; `sampler.py` needs only the core) |
| `… setup.sh deps mv` | adds `requirements-mv.txt` for music videos: yt-dlp, demucs (PyTorch), faster-whisper (and mlx-whisper on Apple silicon), pypinyin, librosa; ~1.3 GB |
| `… setup.sh demo <slug>` | adds one style's demo source and poster (to read, not to render) |
| `sh tools/fetch.sh voice` \| `hdri` \| `instruments <lib>` \| `instruments all` | Kokoro model · HDRIs · a sample library (`freepats`, `karoryfer`, `salamander`, `vcsl`, `vsco2ce`) |

Sizes are in TECHNIQUE.md §1.

## The page contract

| Global | Required | Meaning |
|---|---|---|
| `window.READY = true` | yes | set once fonts and images are loaded |
| `window.render(t)` | yes | draw the frame at second `t`; deterministic |
| `window.DUR` | video, events, readcheck | film length in seconds |
| `window.EV = [{t, type, …}]` | no | sound and cue events, exported by `events.mjs` |
| `window.TEXTS(t)` | readcheck | `[{id, text, x0, y0, x1, y1}]`: every on-screen text visible at `t`, with its box in pixels. Report an element's **full** text from its first visible frame (a typewriter that reports only the typed letters fails the check) |

The viewport is 1920×1080 at device scale 1, or `--size WxH`. `--q 'k=v&…'` reaches the page as `location.search`. A page error, or an HTTP error on a script, module or the page, stops the tool (exit 1). Other missing files (fetch, images, fonts) print `optional file missing: <URL>` and the tool carries on. The tools wait up to 180 s for `window.READY`.

## Render

| Command | What it does |
|---|---|
| `node core/render/still.mjs <demo> <t> [<t> …] [--range a:b:step] [--prefix t_] [--out dir]` | review stills as JPEGs (default `<demo>/stills/t_<t>.jpg`) |
| `node core/render/video.mjs <demo> [--fps 24] [--workers 3] [--out <demo>/out/video.mp4]` | every frame to a video; up to 6 workers for a single render. Each parallel version needs its own `--out` |
| `node core/render/events.mjs <demo> [--out <file>]` | export `{dur, ev}` to `<demo>/events.json` |
| `node core/render/readcheck.mjs <demo> [--step 0.04] [--latin-cps 15] [--cjk-cps 4.5] [--pad 1.5] [--min 1.5]` | reading-time check (below) |
| `.venv/bin/python core/render/sheet.py out.jpg img… [--cols 4] [--w 480]` | contact sheet |
| `.venv/bin/python core/render/srt.py cues.json out.srt` | subtitles from `[{t0, t1, text}]` |
| `sh core/render/mux.sh video.mp4 mix.wav out.mp4 [fps=24] [grain=2]` | mux and master (below) |

All four page tools take `--size WxH` (default `1920x1080`, even numbers) and `--q 'k=v'`.

**readcheck** asks the page for `window.TEXTS(t)` at every step. Each text must stay fully in frame, unchanged, for at least CJK characters ÷ 4.5 + other non-space characters ÷ 15 + 1.5 s, and never less than `--min`. A new `text` under the same `id` starts a new piece. Subtitles are checked by their `.srt`, not here.

**mux** runs a two-pass `loudnorm` to −14 LUFS / true peak −1.2 dB, adds film grain (`grain` 0 = none) and prints the measured loudness. Silent audio is left at its level with a warning; short audio is padded, long audio cut at the picture's end; missing, damaged or truncated audio is refused. It never leaves a partial file.

## Audio

| Command | What it does |
|---|---|
| `.venv/bin/python core/tts/tts.py lines.json out_dir` | Kokoro, offline. `lines.json` = `[{id, text, voice?, speed?, lang?}]` (defaults `af_bella`, `0.92`, `en-us`; Chinese: `"lang": "cmn"`, a `zf_*`/`zm_*` voice). Writes `<id>.wav` (24 kHz, trimmed) and `dur.json`. Needs a library path under 160 bytes (espeak-ng); it checks |
| `.venv/bin/python core/tts/tts_zh.py lines.json out_dir [--voice zh-CN-XiaoxiaoNeural] [--rate +0%] [--pitch +0Hz]` | edge-tts (Microsoft), online; same outputs as `tts.py`. Per line: `voice`, `rate`, `pitch`, `say` (what is spoken when it differs from `text`). Caches in `out_dir/.cache/`. Voices: `.venv/bin/python -m edge_tts --list-voices` |
| `.venv/bin/python core/tts/asr_check.py lines.json voices_dir [--lang en\|zh\|auto] [--threshold 0.92] [--model base]` | speech-to-text check of every `<id>.wav`; writes `words.json` (word timestamps). English must match word for word (0–999 count the same as their words); Chinese, Japanese, Korean compare by character similarity ≥ `--threshold`, each number by its value (十九 = 19, 一万九千 = 1.9万, 三点五 = 3.5, 百分之三十 = 30%); a number heard as a different number fails the line. An `asr` field in a line overrides the expected text (names, and in English decimals and times: write it as Whisper does) |
| `core/audio/sfx.py` | procedural foley and mix helpers: filters, envelopes, `click`, `whoosh`, `thump`, `ding`…, `compress`, `limit`, `add(buf, sound, at, gain, pan)` |
| `core/audio/sampler.py`, `core/audio/pluck.py` | sampled instruments and plucked-string modelling ([`audio/INSTRUMENTS.md`](audio/INSTRUMENTS.md)). A missing library is named in the error with its `fetch.sh instruments <lib>` command. `credits(names)` writes the CREDITS lines |

## Music videos

How they fit together: [`MV.md`](../MV.md). All need the `mv` tier.

| Command | What it does |
|---|---|
| `.venv/bin/python core/mv/get_song.py <url \| file> <project>/song [--video]` | the song as `song.wav` (44.1 kHz stereo) + `source.json` (+ `cover.jpg` from a platform). URLs through yt-dlp, audio only; Bilibili CDN mirrors are tried in turn. `--video` also saves `video.mp4` (≤720p, silent) for `lyrics.py ocr` |
| `.venv/bin/python core/mv/lyrics.py search "<title>" [--artist A] [--dur s] --out <dir>` | lyrics from NetEase, LRCLIB and Kugou → `refs/<source>-<id>.lrc` (+ `.trans.lrc` translations), `refs.json` best match first |
| `.venv/bin/python core/mv/lyrics.py align song.wav lyrics.txt\|.lrc --out <dir> [--lang auto] [--model large-v3-turbo]` | vocal split (`stems/vocals.wav`, `stems/no_vocals.wav`), Whisper in breath-cut chunks plus a second listen to skipped stretches, alignment by sound (pinyin for Chinese) → `lyrics.json`: lines and characters timed, `flag` `weak`/`guess` for lines to check by ear, `extra` for sung phrases in no line. The transcription is cached per model |
| `.venv/bin/python core/mv/lyrics.py ocr video.mp4 --out <dir> [--fps 5] [--conf .6]` | lyrics burned into the video, read with RapidOCR → `ocr.lrc` (each line timed to when it appears) + `ocr.json`. Watermarks (text on screen most of the time) and digit-heavy text (plates, prices) are dropped |
| `.venv/bin/python core/mv/lyrics.py transcribe song.wav --out <dir> [--lang zh]` | no lyrics anywhere: `draft.txt` from the voice, to correct before `align` |
| `.venv/bin/python core/mv/song.py song.wav --out song.json [--bpm n] [--meter 4] [--sheet song.png] [--lyrics lyrics.json]` | beats, downbeats, bars with energy, sections (A/B/C… by sound), kick/snare/hat hits from the accompaniment stem, `moments` (drum hits right after a gap: the video's hardest hits), vocal spans, a 10 Hz energy envelope; `--sheet` draws it all with the lyric lines |
| `.venv/bin/python core/mv/synccheck.py events.json song.json [--lyrics lyrics.json] [--fps 24] [--tol 1]` | every `window.EV` event with `on: bar\|beat\|kick\|snare\|hat\|line\|char` against the nearest such time in the song |

## Picture helpers

| File | What it is |
|---|---|
| `core/lib.js` | seeded random `mulberry`, `hash`, `vnoise`, `clamp(x,a,b)`, `lerp(a,b,t)`, `seg(t,a,b)` (0→1 between a and b), easing on 0–1 (`ss(t)`, `eio(t)`, `eo(t)`, `ei(t)`, `back(t,s)`, `spring(t,k,z)`), `monotone`/`track` interpolation, envelope `env` |
| `core/three/post.js` | three.js post: physical depth of field, GTAO, bloom, colour grade, 2× supersampling |
| `core/post/crt.js` | WebGL2 CRT / VHS pass over a 2D canvas |
| `core/fonts/` | Fredoka, Lilita One, IM Fell English, ZCOOL KuaiLe (OFL, [`fonts/OFL.md`](fonts/OFL.md)) as subsets; ZCOOL holds only ≈ 200 characters |
| `core/assets/polyhaven/` | CC0 HDRIs and models (`SOURCES.md`) |

## Environment variables

| Variable | Meaning |
|---|---|
| `LEMO_OPUSCAR_HOME` | where `setup.sh` keeps the library (default `~/lemo-opuscar`) |
| `PLAYWRIGHT_CHROME` | a Chrome / headless-shell executable instead of Playwright's |
| `LEMO_ANGLE` | WebGL backend (default `metal` on macOS; `default` passes none) |
| `RENDER_SLOTS` | optional; limits concurrent full renders across processes |
| `LEMO_COLOR=bt709` | `mux.sh` writes limited-range BT.709 instead of the default full-range output |
| `WHISPER_MODEL` | Whisper model name or local folder for `asr_check.py` (same as `--model`; default `base.en` for English, `small` for Chinese, `base` otherwise) |
| `HF_ENDPOINT` | Hugging Face mirror for the Whisper download |
| `WHISPER_MODEL` (in `lyrics.py`) | default `large-v3-turbo`: sung words need a bigger model than the TTS check |

## Exit codes

| Tool | 0 | 1 | 2 |
|---|---|---|---|
| render tools | done | page error, missing required file, ffmpeg failure | usage, no `index.html`, `--out` already being written |
| `readcheck.mjs` | all texts long enough | some too short or never fully visible | could not check (no `TEXTS`) |
| `mux.sh` | film written | any failure | – |
| `tts.py`, `srt.py` | done | bad input, missing model, path too long | usage |
| `tts_zh.py` | done | bad input | network unreachable |
| `asr_check.py` | all lines pass | mismatches | model failed to load |
| `get_song.py` | song written | download or conversion failed | usage |
| `lyrics.py` | done | nothing found, failed | usage, `mv` tier missing |
| `synccheck.py` | all events within tolerance | some off, or an unknown `on` kind | usage |
