# Tablet Sketch Explainer — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *From Cherry to Cup* (51 s) · `ipad-sketch.mp4` · source in [`demo/`](demo/)

![The finished page, before the credit card](demo/stills/styleframe.jpg)

## Story & structure

"This is a cup of coffee. But it began as the seed of a fruit." The film opens on a pencil line seen up close, pulls back to a cup, pushes into the coffee until its brown fills the frame, re-registers it red and shrinks it into a coffee cherry on a branch. From there it walks the loop back to the cup, one colour change at a time, and ends on the whole page with the title written last.

- **Hook** (0–6.25 s): the rim drawn slowly at 2.7×; pull back: a cup, a saucer, coffee and crema blocks.
- **Turn** (5.0–6.95 s): push into the coffee; the brown fills the frame; a red block sweeps over it; the red shrinks into a cherry, which then gets its outline.
- **Middle** (6.95–39 s): the branch drawn in one follow shot; a cluster drawn white, coloured green, then re-registered orange and red in a wave (one fruit half done, one line only); a cherry cut open (two seeds face to face); three cherries dried dark in the sun, hulled into two shells and two green beans; a match cut into a magnifier where the same beans turn yellow, cinnamon, brown, each colour landing in a swatch strip; first crack (~196 °C); the beans' colour shatters into grounds that fly across the page into the cup; hot water from a spout.
- **Landing** (39–51 s): the opening frame again; coffee re-coloured, steam, the cup band painted; pull back to the whole page; the title "From Cherry to Cup" is written last, then the credit card.

The signature escalates: a line and one block → a block as a transition → colour, then re-coloured → holes as layers → re-registered and split → a magnified match cut with a swatch strip → a block shattered into particles → the whole page.

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0–1.6 | The rim drawn slowly | 2.7×, almost still | the material up close |
| 2 | 1.6–2.85 | Body, handle, saucer | pinch out to 1.85× | reveal |
| 3 | 2.85–5.0 | Coffee and crema blocks | drift | — |
| 4 | 5.0–6.25 | Into the coffee; brown fills the frame; red sweeps over | accelerating push to 5.6× | colour flood |
| 5 | 6.25–7.05 | The red shrinks into a cherry; its outline is drawn | cut hidden by the flood; pull 3.4× → 1.95× | — |
| 6 | 7.05–8.6 | The branch drawn downward | follow the stylus | — |
| 7 | 8.6–12.55 | Leaves and fruit white → green → orange/red wave | pinch out to the cluster | line then colour; re-register |
| 8 | 12.55–17 | Cut cherry, two seeds, notes | pan, turn to −1° | holes as layers |
| 9 | 17–24.3 | Fresh cherries → sun → dried dark → hulled shells and green beans | tilt down | re-register; split |
| 10 | 24.3–25.0 | The small green beans grow | accelerating push | — |
| 11 | 25.0–33.76 | Match cut to the magnified pair; magnifier, swatch strip, heat, yellow / cinnamon / brown, ~196 °C | match cut, pinch out | magnified match cut; swatches |
| 12 | 33.76–34.8 | First crack: coral bursts, the outline redrawn larger, darker brown | punch in 0.16 s to 1.74×, settle | — |
| 13 | 36.95–39.0 | The colour shatters into 170 chips that fly into the cup; spout and hot water | ride with the grounds | shatter |
| 14 | 39.0–43.3 | Coffee re-coloured, steam, cup band | back to the opening frame | bookend |
| 15 | 43.3–44.7 | The whole page | pinch out to 1.0×, level | whole page |
| 16 | 44.45–51 | Title, Chinese line, mustard blocks, coral underline; the credit card | locked | title last |

Three more frames from the same engine, without stylus or subtitles (`?clean=1`): the cluster after the ripening wave, one fruit half done ([frame_1](demo/stills/frame_1.jpg)), the magnifier and swatches ([frame_2](demo/stills/frame_2.jpg)), the grounds in flight ([frame_3](demo/stills/frame_3.jpg)).

## Score structure

D major, 96 bpm (bar = 2.5 s), café bossa: nylon guitar comping (syncopated stabs), jazz double bass on 1 and 3, a soft egg shaker on eighths, soft-mallet vibraphone accents.

- Bars 0–1: guitar only. The groove enters at 5 s.
- Near-silences: 5.72–6.25 s (into the coffee) and 33.05–33.76 s (before the crack); the first sounds after them are the cherry's landing chord and the crack.
- Landing chords (guitar strum + bass): 6.25 s cherry, 33.76 s first crack, 43.75 s whole page, 47.5 s credit card done (the last chord, left to ring; the music lets go over the last 1.6 s).
- Vibraphone on the words "green" / "red" and "yellow" / "cinnamon" / "brown", on the match cut and on the grounds.
- Foley from the page's marks: pencil lines, lettering, colouring, gestures, lead ticks; an inhale and a low thump for the colour flood, a paper flick on the match cut, six dry pops for the crack, a patter of grounds, a pour.
- Mix: voice compressed and set ≈10 dB (RMS) above the music; the music dips 300 Hz–4 kHz and ducks under each line; −14 LUFS, true peak −1.1 dBTP.

Voice: Kokoro `af_heart`, speed 0.70–0.82, ten lines (`demo/voice/lines.json`), every line passing `asr_check.py` ("whole" is heard as its homophone "hole"; the line's `asr` field says so). "196" is spelled out in the voice text and written as digits in the subtitles. Subtitle cues come from the voice timing (`demo/tools/cues.py`): 13 cues, the shortest held 2.39 s, each ≥ its speech + 0.6 s.

## Palette & props

- Paper #F3EADB, graphite #43362E, light pencil #A8998A, coral #DC6A4C, mustard #F1C04F.
- Subject colours: cherry red #D9463C, orange #EC8D3E, unripe #C3C75E, leaf #8FB47C / #5F8F5A, branch #A9875F, pulp #F3D9A4, seed #D3DBA6, green bean #BFCD8C, dried husk #7A3A2E, roast yellow #E9C85A, cinnamon #C98A4B, brown #8A5433, dark roast #5F3720, coffee #4A2A1C / #3E2116, crema #B9824F, water #9CC4D6, cup band #E98A6E; shadow blocks one step darker at 42%.
- Props: cup and saucer, branch with three clusters and four leaves, cut cherry, sun, dried cherries and husk shells, green beans (small and magnified ×2.4), magnifier, swatch strip, heat marks, spout, steam; the stylus (white barrel, grey cone, graphite tip, flat offset shadow).
- Type: Caveat Bold / Medium (title, notes, English subtitle line), Long Cang (Chinese on the page), LXGW WenKai (Chinese subtitle line).

## End card

At 46.50 s the stylus draws a note card in the empty top right of the finished page (pencil frame, offset sage block) and writes "Tablet Sketch Explainer", "平板速写讲解" and "LemoLab × Claude Opus 5.5" (Caveat 36 px); complete at 47.46 s and held to 51.0 s. The film's title is the page title, top left. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

- `sh styles/ipad-sketch/demo/build.sh` (from anywhere; `WORKERS=2` by default): fonts if missing (`tools/fonts.sh`: Caveat instances, Long Cang and LXGW WenKai subsets), `glyphs.json` if missing (`tools/skeleton.py`), voice if missing (Kokoro) and the speech check, `tools/cues.py` (cues + `ipad-sketch.srt`), `events.json`, picture at 24 fps (≈2 min with 2 workers), `mix.py`, `mux.sh` (−14 LUFS, grain 1), `readcheck`, poster and stills. A fresh clone first needs `sh tools/fetch.sh voice` and `sh tools/fetch.sh instruments freepats`, `karoryfer` and `vcsl`.
- `demo/index.html`: everything picture: pencil brush, colour blocks, lettering, occlusion, cache of finished marks, composite, camera keys (`CAM` in `buildPage`), stylus, subtitles, the colour flood and the grounds (`DYN`). `demo/mix.py`: foley, score, voice and mix. `demo/tools/cues.py`: voice timing → cues. Facts: `demo/FACTS.md`; sources: `demo/CREDITS`.
- Render a slice: `node core/render/video.mjs styles/ipad-sketch/demo --q 'from=46.5&to=51' …`; the page draws film second `from + t`, so a slice joins the full render frame-exactly.
- Reading time: every text drawn on the page passes `readcheck.mjs` (title 6.5 s, the credit line 3.7 s).
- Pitfalls of this demo's props: a colour block's offset fringe stays when the block is re-registered unless the erase is wider than the block; the match cut needs both pairs at the same angles and the camera zoom divided by the magnification; the stylus must leave the frame during the colour flood, or it flies across the page.
