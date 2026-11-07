# Caption News — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Bee Ledger* (蜜蜂账本, 59.5 s) · `caption-news.mp4` · source in [`demo/`](demo/)

In 2025 America's beekeepers lost 1.3 million honey bee colonies, nearly half of what they started the year with. So are the bees running out? No: on January 1, 2026 there were 6 % more colonies than a year before, because the same beekeepers added 1.45 million. The film keeps the books in two columns — what died, what was rebuilt — and then explains the turn one fact per shot: how they rebuild, what hurts the colonies, the worst quarter, where it hit, and that they are still rebuilding. Every number is from one public report, USDA NASS *Honey Bee Colonies* (August 3, 2026), shown on screen.

This is an unofficial film made from real public material (USDA footage, photos and data; CC BY footage from Wikimedia Commons). The channel "简闻" is fictional; USDA did not make or endorse it.

## Story & structure

Shape: an inverted pyramid that turns at a quarter of the way in. Hook (0–5 s): the biggest number lands on frame 4 over rows of hives. Title sting (5–7.5 s). Setup (7.5–13 s): the loss as a proportion of the hives, then the viewer's question on a freeze frame, in silence. Turn (13–19 s): the report's own headline, highlighted — "Up 6 Percent" — and the count on a line chart, a text-only breath. Development (19–50 s): the ledger in two columns (lost vs added, counters racing), three ways to rebuild in a lit grid, the report's sentence on varroa mites and the mite itself under the electron microscope, the stressor ranking (a held judgement frame), the worst quarter (a spike on the loss line), the map (California) dissolving into an almond orchard through California's outline, and the rebuilding still going on. Ending (50–54.5 s): half a second of silence, then a two-part verdict on footage: "蜜蜂没有消失 / 是养蜂人在硬撑". End card (54.5–59.5 s).

Formats spent, each once and each for a new fact: cold-open number hook; title sting that becomes the channel bug; caption cards with yellow keywords (one line per language); rolling counters; source tag; per-shot footage credits; proportion-by-darkness sweep; freeze frame with brackets and timecode; document close-up with highlighter (twice: a headline, then a sentence, with a pull-quote mark); line chart (twice: stock, then loss rate); split screen; three-panel grid; punch-in with circle callout; ranked bar chart; choropleth map with push-in; mask transition from map to photo; lower third (place and date); text-only beat; end card.

## Shots

Times in seconds; every cut on the 120 BPM half-beat grid.

| # | Time | Shot | Format / move | Note |
|---|---|---|---|---|
| 1 | 0.0–1.5 | wide: rows of hives in a field (Altena TV) | push 1.0 → 1.035; **hook**: "一年没了" 0.06, "130 万箱" block 0.13 rolling to 130 by 0.6, "蜜蜂" 0.4 | strong action on frame 4 |
| 2 | 1.5–3.0 | close: bees landing on a hive (USDA) | number card carried across the cut | |
| 3 | 3.0–5.0 | slow-motion flight (Phonon.b) | push; the card slides out left at 4.62 | |
| 4 | 5.0–7.5 | **title sting**: yellow ruled page over the hive entrance (Midsummer Bees) | page wipes in, rules draw, title slams 5.18, dateline 5.5; page wipes off left 7.18–7.5 revealing shot 5; title becomes the bug | |
| 5 | 7.5–10.5 | close rows of hives | **proportion sweep**: yellow line to 49.5 % at 7.92, the passed side goes dark; "≈49%" | |
| 6 | 10.5–13.0 | bee on an aster (Calabrese) | **freeze** at 11.0: white flash, punch 1.12, desaturate, brackets, timecode; music stops | silence 1 |
| 7 | 13.0–16.0 | report page 1 | flash; highlighter on the headline 13.28; "+6%" block 14.25; source tag | the turn |
| 8 | 16.0–19.0 | ledger card: colonies on the first day of each quarter | line draws 16.2–17.2; "+6%" bracket Jan → Jan 17.05; caption only, no voice | the breath |
| 9 | 19.0–23.5 | **split screen**: dead column (rows, desaturated, red) / living column (bees on comb, USDA) | divider drops, panels open from the centre; counters 19.35–20.9; "多补 148,060 箱" 20.95 | judgement: both counters held ≥ 2.5 s |
| 10 | 23.5–27.5 | **grid**: working the frames (USDA) / bee packages (vastateparksstaff) / the marked queen (USGS) | panels rise staggered; each lights on its word (23.78, 24.82, 25.96); a ring round the queen | |
| 11 | 27.5–30.0 | report page 1, the varroa paragraph | highlighter on the heading and the sentence; pull-quote mark | evidence before the image |
| 12 | 30.0–33.0 | electron micrograph: a varroa mite on a bee (USDA ARS) | **punch-in** 30.6 on "varroa mites"; circle 30.9; leader + "瓦螨 / Varroa destructor" | |
| 13 | 33.0–37.5 | ledger card: stressors, Jan–Mar 2026 | bars grow, varroa first; held 3 s complete | judgement frame |
| 14 | 37.5–41.5 | ledger card: share lost per quarter | line draws; spike ring + "16%" 39.75, "六个季度最高" | |
| 15 | 41.5–45.5 | ledger card: state loss rates, Jan–Mar 2026 | states fill west → east; California outlined + label 42.3; push 43.6–44.9; **mask**: the almond photo grows out of California 44.9–45.5 | |
| 16 | 45.5–46.5 | bee on an almond blossom, California, 2014 (USDA) | slow push; date in the credit | |
| 17 | 46.5–50.0 | rooftop apiary, beekeeper at a hive (USDA) | lower third "USDA 屋顶蜂场 · 华盛顿 · 2013" | |
| 18 | 50.0–54.5 | bees on dandelions (Calabrese) | silence 50.0–50.5; verdict captions 50.4 and 52.2 at 1.25× size | silence 2 |
| 19 | 54.5–59.5 | end card over the blurred hive entrance | see below | |

`readcheck.mjs` passes on every key text (numbers, chart titles and labels, grid labels, the mite label, the lower third, the end card). Ornamental text (the sting's dateline) is left out of `TEXTS`; the same date is readable later in the source tag.

## Score structure

- 120 BPM, 4/4. A minor (Am–F–G) for the hook; A minor groove after the sting; **hard stop** into silence at 10.5 (only the swarm's own buzz and the question), a suspended-cymbal swell from 12.15; the turn at 13.0 is a C-major brass chord with crash and glockenspiel; groove B in C major (C–G–Am–F) with vibraphone off-beats and claps under the turn, the chart breath (a glockenspiel figure, 16–19 s), the ledger and the grid (glockenspiel pings on the counters' arrival and each grid word); a thin bar of kick and spiccato cellos under the varroa document; the mite at 30.6 lands on timpani, bass drum and low trombones, then half-time D minor with cellos; a snare build (eighths → sixteenths) into the spike at 39.75 (crash + B♭ brass against A: the wrong chord on the worst number); toms and a cymbal swell under the map push, a crash on the mask; the groove returns, brighter, under the rebuilding; 0.5 s of silence; A major for the verdict at 50.5 (brass, horns, timpani, tubular bells); the end card holds horns and contrabass under a glockenspiel A–C♯–E–A and fades.
- Instruments: MuldjordKit drums, electric bass, marimba (a sixteenth-note ostinato: the hive's hum), vibraphone, glockenspiel, staccato trumpet and trombone, horn, timpani, bass drum, suspended cymbal, orchestral snare, claps, spiccato cellos, contrabass.
- Foley (procedural, `audio/mix.py` from `events.json`): chunk slams, counter rattles, whooshes into cards, highlighter squeaks, the camera shutter on the freeze, a stamp on "+6%", pops, map ticks, a riser into the map push, paper on each card.
- Natural sound: the swarm's own audio (Сарапулов, CC BY 4.0) low under the hook, alone under the freeze (J-cut 0.3 s before it), and under the verdict and end card.
- Mix: music about 10 dB under the voice and ducked; under speech the music also loses 1.2–5 kHz (the consonant band) — without it, speech-to-text hears "colonies" as "collins" in the full mix; −14.1 LUFS integrated.
- Voice: Kokoro `af_bella`, 12 lines, speed 1.0–1.17; numbers spelled out in the TTS text, digits in the captions.

## Palette & props

- Ink `#0E0E0C`, ivory `#F7F5EF`, honey `#FFC21A` (the point, gains, keywords, the bug), loss red `#FF4A3D`, label grey `#8D8B83`, the ledger sheet `#151512` with ruled lines and a red double margin.
- Type: Noto Sans SC 900 / 500, Inter Tight 800 / 500 / 600 italic (OFL subsets in `demo/fonts/`).
- Channel bug "简闻 | 蜜蜂账本 THE BEE LEDGER" (fictional channel).

## End card

From 54.5 s, held five seconds over the blurred, darkened hive entrance: "蜜蜂账本" (150 px), "The Bee Ledger" (honey), a thin rule, "CAPTION NEWS · 字幕新闻", "LemoLab × Claude Opus 5.5", then five lines of sources: the data (USDA NASS report, its scope, and that 2025 losses and additions are four quarters summed), every CC BY work with title, author and licence, and the public-domain sources. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  index.html, main.js     the page: SHOTS, one function per format, sync draw + lazy frame loading, TEXTS for readcheck
  timeline.json           captions (zh chunks + en), voice starts, silences, hits — shared by page, .srt and mix
  audio/lines.json        narration (Kokoro)            audio/mix.py   score, foley, voice, natural sound, mix
  tools/fetch_sources.sh  downloads raw/ (~410 MB; Commons, USDA, Natural Earth) and extracts the swarm audio
  tools/prep.sh           footage → 30 fps JPEGs at display size (crop, lanczos, unsharp, delogo), report page, photos, map
  tools/map_prep.py       Natural Earth states → Albers-projected polygons
  tools/fonts.sh          OFL subsets from the Google Fonts CSS API for every character in main.js
  tools/cues.py           timeline.json → audio/cues.json (+ subtitle timing check)
  tools/final_check.sh    loudness, black frames, speech-to-text of the final mix
  tools/footage.py, commons_thumb.py, commons-tools/   finding and logging footage (see STYLE.md §9)
  FACTS.md, SOURCES.md, SOURCES.jsonl, CREDITS
```

`sh demo/build.sh` (library set up with `setup.sh deps voice music`, sample packs freepats / vsco2ce / vcsl): sources → fonts → frames → voice + speech check → cues → reading check → events → render (1,785 frames, 30 fps) → mix → .srt → master (−14 LUFS, grain 1) → `caption-news-small.mp4` (1280 px, CRF 24) → poster and styleframe (22.3 s, the split screen) → final checks.

Demo-specific choices and pitfalls: the hive-rows footage is Dutch (Altena TV) and is used only as "a box is a colony", never labelled as a US location; its station logo is cropped out and two hive stencils with a beekeeper's phone number are blurred. The almond photo is from 2014 and says so. The report's own wording sets the words: "stressor", not "killer"; "four quarters summed", not "annual net loss"; the report's page-1 figure for varroa in April–June 2026 (26.3 %) disagrees with its own table (22.2 %), so only January–March is used. Don't spend two charts on one fact: a bar chart of "11–12 % every quarter" next to a line chart of the same quarters says it twice, so only the line chart is used. Keep chart titles to six characters or fewer: longer ones fail the reading check. Bring the California label in early enough that it holds 2.5 s before the push.
