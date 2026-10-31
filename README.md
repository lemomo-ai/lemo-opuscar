# Lemo-Opuscar

**66 film styles, each with a short film made entirely in code.**<br>
66 种影片风格，每种都配一支完全用代码做出来的短片。

Pick a style, bring your own story, and let Claude direct the film. Claude writes the treatment, draws every frame in code, writes an original score, mixes the sound and renders a finished MP4. No video model, no stock footage.

This is the plugin directory edition (version 1.2.2): the guides, the 66 style prompts and the rendering tools, without the demo films. **The films, the gallery and the newest styles live in the main repository: [github.com/lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar).** Watch every demo film on the [gallery](https://lemomo-ai.github.io/lemo-opuscar/).

## Try it

Install the plugin from the Claude plugin directory. (The full edition, with the demo sources, installs from the main repository instead: `claude plugin marketplace add lemomo-ai/lemo-opuscar`, then `claude plugin install lemo-opuscar@lemolab`. Use one or the other.)

Open Claude Code in a folder for your film, and ask:

> Make a 45-second watercolor film about my family's coffee farm. Warm female narrator.

> Make a 40-second LiDAR Survey film about the old quarry behind our town, from public laser-scan data.

> Make a 30-second whiteboard explainer about how vaccines train the immune system.

> Which film styles are there? I want something for a product launch.

> I want to change the Ukiyo-e style into my own version.

> I want to make my own style from scratch: chalk on a blackboard, warm and slow.

Name a style in English or Chinese, or describe your topic and let Claude suggest two or three. Claude asks you once, up front: anything about your topic it can't decide, whether you have your own voice, music or photos, and whether you want to see a storyboard first. Then it makes the film in a project folder where you started.

To make a style your own, change a library style or start from a blank page: Claude plans it with you one question at a time (each with a recommended answer), shows you a style frame, makes a 15–30 second demo film, and keeps the style, with the film's source, in `~/lemo-my-styles/<name>/` (outside the plugin, so updates never touch it). After that, name your style like any other; start the skill without a request and your own styles are listed first.

## Before you start

- **Claude Code on your own computer.** The plugin renders video with local tools, so it needs a shell: it does not run in the claude.ai chat.
- **Node 20+, ffmpeg and Python 3.11+** (or [uv](https://docs.astral.sh/uv/)). You install these; Claude tells you if one is missing.
- A film takes about 30–60 minutes and a fair amount of tokens. Default output 1920×1080, 24 fps; other sizes on request.
- The styles are tuned for Claude Opus 5.5; other models may not reproduce them.

## What it downloads

The library ships inside the plugin. On first use it is copied to `~/.lemo-opuscar` (set `LEMO_OPUSCAR_HOME` for another folder), and packages install there, so they survive plugin updates. Nothing is installed system-wide. Claude downloads only what your film needs:

| What | From | When | Size |
|---|---|---|---|
| Node packages: `playwright-core`, `three` | npm | first film | ~10 MB |
| Headless Chromium for frame-by-frame rendering | Playwright's download servers (Microsoft) | first film | ~100–200 MB |
| Python packages: numpy, scipy, soundfile, soxr, pillow | PyPI | first film | ~150 MB |
| Voice tier: kokoro-onnx, edge-tts, faster-whisper | PyPI | only for a film with narration | ~200 MB |
| Kokoro voice model (offline TTS) | this project's [GitHub Releases](https://github.com/lemomo-ai/lemo-opuscar/releases/tag/assets) | only for a film with narration | 354 MB |
| Whisper model for the speech check | Hugging Face (or the mirror you set in `HF_ENDPOINT`) | first narration check | ~145 MB (English), ~480 MB (Chinese) |
| numba, for plucked strings | PyPI | only if the score uses them | ~140 MB |
| Instrument sample libraries (VSCO 2 CE, VCSL, FreePats, Karoryfer, Salamander) | this project's GitHub Releases | only the libraries the score uses | 70–400 MB each |
| HDRIs for 3D styles (Poly Haven, CC0) | this project's GitHub Releases | only for 3D styles | 12 MB |
| Walnut veneer textures (Poly Haven, CC0) | this project's GitHub Releases | only for the Data Physicalization style | 7 MB |
| Fonts named by a style (Google Fonts, OFL) | Google Fonts | when the style needs them | small |
| Packages a style lists in its `STYLE.md` (e.g. a LiDAR reader) | npm or PyPI, into your project folder | only for that style | varies |
| Public data for the Evidence Films styles (satellite imagery, laser scans, open city data) | the open-data sources Claude finds for your topic; it tells you each source and licence | only when you ask for such a film | varies |

## Privacy and outside services

- Your topic, your files and the film stay on your computer. The plugin collects nothing and sends nothing to us.
- **Chinese narration:** offline Kokoro voices by default. Better Chinese voices come from Microsoft's online speech service (edge-tts), which receives the narration text; Claude asks before using it and uses it only if you agree. English narration is always offline (Kokoro).
- The downloads above request files only; they don't send your content. Every third-party asset in a film (fonts, samples, data) is listed with its licence in the film's `CREDITS`.

## Licence

MIT. Fonts in `core/fonts/` are OFL; the sample libraries and HDRIs keep their own licences (listed in `core/audio/INSTRUMENTS.md` and `core/assets/polyhaven/SOURCES.md`). You are responsible for the material you put in your films.

Made by LemoLab · by Lemomo ([@lemomo_ai](https://x.com/lemomo_ai)). Problems or ideas: [open an issue](https://github.com/lemomo-ai/lemo-opuscar/issues) in the main repository.
