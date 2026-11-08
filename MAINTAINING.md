# Maintaining the library

**For the repository owner only.** If you are making a film for a user, go back to [`AGENTS.md`](AGENTS.md): nothing here applies.

## Add a style

Work in `styles/<slug>/` (lowercase letters, digits, hyphens; unique). Start from the templates in `styles/_template/`.

| File | What it holds |
|---|---|
| `style.json` | the only metadata source: `slug`, `num`, `en`, `cn`, `category_en`, `category_cn`, `film`, `line`, `line_cn`, `uses`, `frame_sec`, `dur` |
| `STYLE.md` | the style's invariants only: look, materials and rendering, colour logic, type, motion, camera grammar, sound palette, the medium's pitfalls, native moves, range of variation. No story, arc, beat table, durations or end card. Ends with a link to `DEMO.md` |
| `DEMO.md` | opens with "One example among many. Don't reuse its story, arc, shots, props or timings." Then the demo's story and structure, shot list, score structure, palette and props, end card (the "LemoLab × Claude Opus 5.5" sign-off lives only here, as the library demo's), build notes and code entry points, and for a scene style the `content.json` fields |
| `demo/` | the source, a one-command `build.sh` and `CREDITS` are committed, for agents to read. `TREATMENT.md`, `PRODUCTION_LOG.md`, fonts, audio, textures and models stay local (gitignored); `CREDITS` names every asset so it can be found again, and `build.sh` fetches the fonts first (for example `demo/tools/fonts.sh`: the same files, from URLs pinned to a commit or a version), so a fresh clone builds |
| `demo/stills/` | stills the docs link (`styleframe.jpg` is the gallery card) |
| `<slug>.mp4`, `<slug>.srt`, `poster.jpg` | the 1080p film, its subtitles when it is spoken, its poster |

Assets are CC0, CC BY or OFL only, each in `demo/CREDITS`. No watermark on any film. Real people, brands and events appear only in an unofficial fan film; its `DEMO.md` says so.

Rules for library demos only (a user's film follows `DIRECTOR.md`, not these):

- **Bilingual subtitles, one line per language.** Each cue has one Chinese line and one English line, never wrapped. When a line is too long, split it into two cues.
- **Comparisons hold still before the verdict.** When the film compares options (four bridges, three plans), each one is fully in frame and held at least 2.5 s before it is judged, so the viewer can read it.

## Register

1. **Number.** `num` in `style.json` is the next free number after the highest in `styles/*/style.json` (two digits as a string, e.g. `"55"`); it orders the gallery within a category.
2. `python3 styleboard/build.py` reads every `styles/*/style.json` and rewrites the gallery data, the grids and counts in `README.md` (English) and `README.zh-CN.md` (Chinese), `styles/README.md` and the style list in `AGENTS.md`. Never edit those generated parts by hand. The rest of the two READMEs is written by hand: change both together (e.g. the **New** line). Then `python3 styleboard/build.py --frames <slug>` (the README grid frame at `frame_sec`) and `sh styleboard/frames.sh <slug>` (the gallery card from `demo/stills/styleframe.jpg`).
3. `sh tools/web_cuts.sh` makes the 720p web cut in `.release/web/` (only for films that are new or changed).

## Gates

- **Human:** approve the style frame before production, and the finished film.
- **Machine:** `asr_check.py` passes on every line; `mux.sh` reports about −14 LUFS and no warning; `readcheck.mjs` passes; `python3 tools/release.py check --strict <slug>` is clean (it needs the Register steps above). It also stops images under `styles/` that no committed file names (by name or pattern), demo files that nothing reached from the style's entries (STYLE.md, DEMO.md, build.sh, index.html…) loads, and process wording (`PRODUCTION_LOG`, review notes; the list is `PROCESS_WORDS` in the script) in any committed text.
- **Maps:** library demos follow DIRECTOR.md §13 like any film: every map shot checked enlarged, the map data and its view named in `CREDITS`.
- **Real events and products:** every fact on screen and in the voice-over comes from an official source, kept in `demo/FACTS.md` (claim, URL, quoted wording); check the final script against it before the last render.

## Publish

1. `sh tools/publish.sh` uploads the full films (`films` release) and the 720p web cuts (`web` release, used by the gallery), then verifies them. Per-demo resource packs are no longer published.
2. `git status --short`, `git add -A`, commit.
3. Push `main`, then watch CI (`gh run watch`): the gallery build fails when a card links a film that isn't on the `web` release.

The Pages build (`build.py --site`) also writes the OPUSCAR 98 page (`opuscar98/`, from `styleboard/opuscar98.html`), `llms.txt` and `sitemap.xml`, and puts the canonical link, share-card tags and JSON-LD (upstream repo and author) in each page's head. They pick up the style count by themselves; the film's runtime is `FEATURE['dur']` in `build.py`.

Don't push before the upload has finished, and don't commit `tools/assets.json` from a failed run.

## Revise a style

Back up first (old versions move out of the repository, not into git). Re-render, replace `<slug>.mp4`, and run `sh tools/publish.sh`: it re-uploads the film and refreshes its web cut.

## Directory edition

The Claude plugin directory lists a self-contained build of the plugin, on the orphan branch `directory` (the submission tracks that branch; `main` stays what visitors see). It carries the guides, every `STYLE.md` / `style.json` / `DEMO.md`, `core/` (without the Poly Haven models, which only demo code uses) and its own `README.md`, `SECURITY.md` and `SKILL.md`: nothing is cloned or fetched to tell the agent what to do, there are no demo sources, and Chinese edge-tts narration is used only with the user's consent. The sources of the plugin-only files are in `tools/directory/`; the build and its checks (file sizes, personal info) are in `tools/directory.py`.

After a release on `main` (new styles, changed guides or tools):

1. `git worktree add ../lemo-opuscar-directory directory` (once; reuse it afterwards).
2. `python3 tools/directory.py <version> --into ../lemo-opuscar-directory`, with a version above the branch's current `.claude-plugin/plugin.json` (new styles or features: 1.1.0; fixes only: 1.0.1). The directory treats each version number as a release, so the script refuses the same or a lower one; `--same-version` is only for fixing a version that was never published. It also stops when a guide changed so much that one of its edits no longer applies: update `EDITS` in the script.
3. `claude plugin validate ../lemo-opuscar-directory`, then commit there (`Lemo-Opuscar <version>, plugin directory edition`) and push `directory`. The directory scans each push and publishes the new version.
