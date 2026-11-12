# Colored-Pencil Science Illustration — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Other Half* 《树的另一半》 (50.8 s) · `colored-pencil.mp4` · source in [`demo/`](demo/)

A question that circulates widely, "Do the trees in a forest feed each other?", taken underground. The camera sinks below a meadow, a magnifier opens on one root tip wrapped in fungus, a grain of sugar leaves the root along a fungal thread while water and nutrients come back the other way, the thread reaches the next tree, and the film says honestly that whether trees pass food to each other is still argued over. It ends on what is solid: pulled back over a whole wood, a white network joins every tree underground. English narration (Kokoro `bf_emma`), Chinese and English subtitles. Sources in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: one question, followed all the way down and back out.

- **Hook (0–5.4 s)**: a meadow and a big tree; below the ground line, a strip of blank paper. "Do the trees in a forest feed each other?"
- **Descent (5.4–12.5 s)**: the camera sinks; the soil is coloured in horizon by horizon; the roots of two trees are drawn outward from their crowns.
- **The magnifier (12.5–21 s)**: a pencil circle around one root tip becomes a magnified view, drawn from blank paper; white threads wind round the tip and reach into the soil; the focus moves from root to fungus.
- **The trade (21–30.6 s)**: an amber grain of sugar leaves the root along the threads (the camera follows it); blue-green grains of water and nutrients pass the other way; the fungus takes the sugar up.
- **The open question (30.6–38.9 s)**: the camera arrives at the next tree's root; a dashed amber path and a pencilled "?" ask whether food passes tree to tree. No sugar is shown crossing.
- **The wood (38.9–50.8 s)**: the magnifier closes onto that root inside a wide cutaway of five trees; the camera pulls back and rises; the focus moves off the roots and a white network is drawn outward across the wood; "No tree grows alone"; the title and the end card are pencilled in the sky.

Native moves spent: the blank half, the horizon sweep, roots drawn outward, the magnifier (in and out), focus by drawing (twice), a grain on a thread, white over dark, the plate.

## Shots

| # | Time | Shot | Camera | Note |
|---|---|---|---|---|
| S1 | 0–5.4 | Meadow, tree A, grass and flowers; blank paper below the ground line | slow push; grass on twos | the four pencil layers, paper tooth, contour boil |
| S2 | 5.4–12.5 | The cut face rises over the far view; litter, topsoil, subsoil, weathered rock coloured in left to right; roots of trees A and B grow; 11.55 a pencil circle around a root tip | crane down + push (translation only) | multiplane parallax; the horizon sweep |
| S3 | 12.5–21 | Inside the circle: the root tip, drawn from blank paper outward from the centre; fungal threads wind round it and fan out; tag HYPHAE 菌丝 | the circle grows to full frame; a slight drift; focus root → threads at 17.5–18.4 | the magnifier; only the hero root, its fungus, soil and stones are drawn |
| S4 | 21–30.6 | An amber sugar grain leaves the root along a bundle of three threads; tag SUGAR 糖 rides above it; blue-green grains pass the other way; tag WATER + NUTRIENTS 水和养分; the sugar is taken up at 28.2 | follow (truck right), the grain left of centre | a grain on a thread |
| S5 | 30.6–38.9 | Tree B's root tip; a dashed amber path from tree A's side into it and a pencilled "?" (written by 35.9, held about 3 s) | still, slow drift | the open question |
| S6 | 38.85–50.8 | The circle shrinks onto tree B's root inside the wide cutaway and is erased; five trees, their roots; focus moves to the network, drawn outward from tree B (40.1–44.6); title from 45.2; end card 45.85–50.8 | the magnifier closing, then pull back + rise | the plate |

Transitions: one continuous sink (above → below), the magnifier opening (through a shape), a focus pull inside the close-up, the magnifier closing (the same shape in reverse). Two near-silences: 11.4–12.5 s (before the circle opens) and 38.2–38.85 s (before it closes).

## Voice and subtitles

Nine lines (`demo/voice/lines.json`), Kokoro `bf_emma` at speed 0.66–0.8 (about 2.3–2.7 words a second), each checked with `asr_check.py`. In line 8 Whisper hears "Whether" as its homophone "Weather"; the `asr` field records that.

| # | Start | English (spoken) | 中文 |
|---|---|---|---|
| 1 | 0.9 | Do the trees in a forest feed each other? | 森林里的树，会互相喂食吗？ |
| 2 | 5.9 | If there is an answer, it is down here. | 如果有答案，就在这下面。 |
| 3 | 13.9 | A tree's finest roots are wrapped in fungus, | 树最细的根，裹着一层真菌， |
| 4 | 18.1 | threads far thinner than a hair. | 菌丝比头发还细得多。 |
| 5 | 21.1 | The tree pays the fungus in sugar, made from sunlight. | 树用阳光做成的糖，付给真菌。 |
| 6 | 26.1 | The fungus pays back in water and nutrients from the soil. | 真菌用土里的水和养分回报。 |
| 7 | 31.3 | And the same fungus can reach the next tree. | 同一片真菌，还能连到下一棵树。 |
| 8 | 35.5 | Whether trees pass food along it is still argued over. | 树会不会借它互相传递养分，科学家还在争论。 |
| 9 | 41.4 | But one thing is clear. No tree grows alone. | 但有一点很清楚：没有一棵树是独自长大的。 |

Each cue holds until 0.6 s after its line (shortest 2.82 s). Subtitles are drawn by the page on a paper slip, bottom left, and exported to `colored-pencil.srt` from the same events.

## Score structure

96 bpm, 4/4, a bar = 2.5 s, D major.

| Section | Time | Palette |
|---|---|---|
| Meadow | 0–5 | nylon guitar arpeggios; a flute phrase that rises and stops unresolved on E |
| Descent | 5–11.4 | pizzicato bass stepping down D–B–G–E, clarinet following down |
| Near-silence | 11.4–12.5 | only the pencil drawing the circle |
| Magnifier | 12.5–20 | a glockenspiel note and the lens tock; bowed vibraphone chords, sparse harp; glockenspiel glints as the threads wind on |
| The trade | 20–30 | marimba calls (sugar out), kalimba answers (water back), pizzicato bass |
| The question | 30–38.2 | kalimba alone, a suspended chord, an unanswered clarinet phrase |
| Near-silence | 38.2–38.85 | |
| The wood | 38.85–50.8 | harp falling as the circle closes; guitar, strings; the flute phrase completes on D; harp strum and closing chord at 45, a light harp figure under the end card, fading to 50.8 |

Mix (`demo/mix.py`): the voice is compressed and set by RMS 10 dB over everything under it; while it speaks the music ducks about 5 dB and gives up about 7 dB more in 300 Hz–4 kHz. Pencil foley follows the page's drawing events; ambience follows the camera height (meadow above, low-passed as it sinks, a quiet earth tone below). The crest factor is held to about 11 dB so `mux.sh` masters to −14 LUFS with true peaks under −1 dB.

## Palette & props

- Paper `#F8F4EA`; soil `#4D3018` / `#66402A` / `#BD763B` / `#B38C5C`, blue-grey bedrock; roots `#DCB990`; threads in white pencil `#FCFAF0`; graphite `#33241C`.
- Accents: amber `#ED9E33` (sugar, and the dashed "does it pass?" path), blue-green `#549EB8` (water and nutrients), pink `#E3958C` (earthworms).
- Five trees of different sizes (A is the hero, B "the next tree"), recursive root systems, two hand-shaped hero roots with fungal mantles, a bundle of three threads between them, a forest-wide network of thick threads for the wide shot, earthworms, pebbles, mushrooms, daisies and buttercups, far hills.

## End card

In the sky of the last wide shot: *The Other Half* / 树的另一半 written top left (from 45.2 s, with a pencil underline); top right, written stroke by stroke from 45.85 s, *Colored-Pencil Science Illustration* / 彩铅科普插画, a short rule, and `LemoLab × Claude Opus 5.5` (30 px), complete at 47.8 s and held to 50.8 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh       one command: font (if missing) → voice (if missing) → speech check → events → picture → mix → master → subtitles → readcheck → poster and styleframe (one frame, 11.0 s)
  index.html     the page and the font face
  main.js        world (soil, trees, roots, hero roots, fungus, grains, network), the pencil G-buffer and post shaders,
                 shots and camera views (magnifier, focus, follow), labels, subtitles, end card, EV, TEXTS — render(t)
  mix.py         voice + pencil foley + ambience + score from events.json → out/mix.wav
  glyphs.json    glyph skeletons for the stroke-by-stroke lettering (tools/skeleton.py)
  voice/         lines.json (Kokoro bf_emma, rendered to out/voice/ with dur.json)
  tools/make_font.py   LXGW WenKai subset from fonts/src/ (every Chinese character in main.js)
  tools/skeleton.py    glyph skeletons → glyphs.json
  tools/subs.py        bilingual .srt from the subtitle events
  tools/poster.py      poster.jpg and stills/styleframe.jpg: the frame at 11.0 s, JPEG under 500 KB
  fonts/         OFL-lxgwwenkai.txt (the .ttf files are local)
  FACTS.md       the claims in the narration and their sources
```

- `sh styles/colored-pencil/demo/build.sh` (24 fps, `--workers 2`; `WORKERS=3` for more). On a fresh clone first run `sh tools/fetch.sh voice` and `sh tools/fetch.sh instruments freepats`, `… vsco2ce`, `… vcsl`. The font is downloaded on the first run (LXGW WenKai v1.245.1, pinned; `glyphs.json` was made from it). Delete `demo/fonts/LXGWWenKai-subset.ttf` after any text change. three.js comes from the library's `node_modules`.
- Debug: `node core/render/still.mjs styles/colored-pencil/demo 22` (film seconds); `--q 'all=1'` shows everything drawn; `--q 'dbg=0|1|2|3'` shows the G-buffers; `--q 'from=0&to=10'` renders a stretch (the events and the mix follow `FROM`/`TO`).
- `core/render/readcheck.mjs`: the three labels, the "?" and the title pass; the end card does not. The checker counts the whole card (style name in English and Chinese plus the sign-off, 60 characters) as one text from the moment it starts being written (45.88 s) and asks for 6.43 s on screen; it gets 4.92 s before the film ends. The sign-off line itself is complete at 47.8 s and held 3.0 s.
- Demo-specific pitfalls: the magnifier view hides the general roots and worms (they would bury the hero root); the hero root and the thread bundle are placed so the subtitle corner stays empty in the close-ups; the forest network is drawn with thick threads (≈ 0.03 units) because the fine ones shimmer at wide scale.
