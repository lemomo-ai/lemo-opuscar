# SOURCES · Broadcast News Package demo

This film uses no third-party footage or photographs. Everything on screen is drawn in code, except two illustrative background plates made with an image generator. Facts and their sources, with quoted wording, are in [`FACTS.md`](FACTS.md).

## Data and documents (facts, not creative works)

| What | Where | Licence / status | Used for |
|---|---|---|---|
| KOSPI daily closes, 15 Sep – 15 Oct 2026 | Korea Exchange index data via Naver Finance chart API, https://api.stock.naver.com/chart/domestic/index/KOSPI?periodType=dayCandle (the 19 closes the film uses are written into `main.js`, `KDATA`) | market data (facts); source credited on screen ("KRX DATA VIA NAVER") | the line chart, 15 Sep – 15 Oct (19 closes) |
| Gemini API changelog; Gemini latest-model page; blog.google "Gemini 4 Argon" | ai.google.dev, blog.google | quoted for facts only; no images or logos used | story ① |
| Korea Herald, Korea Times, Bloomberg (headline + summary) | see FACTS.md | quoted for facts only | story ② |
| Meta AI research blog "Muse Spark Open" (15 Oct 2026) | research.meta.ai | quoted for facts only | story ④ |
| Euronews (Luca Bertuzzi, 14 Oct 2026), only for the requests to the two companies; European Commission Press Corner speech_26_2150 (14 Oct 2026) | see FACTS.md | quoted for facts; the quote card sets 7 words of the Commission's speech in type | story ③ |

## Picture

| Asset | Source | Licence | Notes |
|---|---|---|---|
| Country outlines (Europe) | Natural Earth 1:50m Admin 0, via world-atlas 2.0.2 `countries-50m.json` (https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json), projected in `tools/prep.py`: only the 27 EU member states are kept as separate shapes (Cyprus as the whole island, Åland inside Finland); all other land is merged into one shape with no borders | public domain (Natural Earth); world-atlas package ISC | `assets/europe.json` |
| `assets/plates/plate_datacenter.jpg`, `assets/plates/plate_wafer.jpg` (committed) | Codex CLI image_gen, prompts in `prompts/` (run by `tools/gen_plates.sh`, saved as JPEG q88) | AI-generated illustrations; no text, logos, people or real places | graded duotone by `tools/prep.py` into `assets/plate_*.jpg` (build output); tagged "ILLUSTRATION / 示意 · AI 生成画面" whenever on screen. A generated conference hall was made too and left out: it would read as the Dublin venue |
| Charts, maps, documents, quote card, spec card, stamps, LEMO plate | drawn in `main.js` | — | LEMO AI NEWS is LemoLab's own brand |

## Sound

| Asset | Source | Licence |
|---|---|---|
| Orchestral samples | VS Chamber Orchestra: Community Edition, Versilian Studios / Sam Gossner (github.com/sgossner/VSCO-2-CE) | CC0 1.0 |
| Percussion and glockenspiel samples | Versilian Community Sample Library (github.com/sgossner/VCSL) | CC0 1.0 |
| Foley | synthesised in code (`core/audio/sfx.py`) | — |
| Voice | Doubao TTS 2.0 (Volcengine seed-tts-2.0), voice 解说小明 2.0 `zh_male_jieshuoxiaoming_uranus_bigtts`, via `tools/tts_doubao.py` (your own API key) | Volcengine service terms |

## Fonts

Noto Sans SC 900/700, Barlow Condensed 800/600/600 italic, IBM Plex Mono 500 — SIL Open Font License 1.1, subset from Google Fonts by `tools/fonts.sh`.

## Finding footage for your own film

`tools/footage.py` (the same tool as in the other Edit & Documentary demos) searches Wikimedia Commons, Internet Archive and NASA, downloads, and logs licence, author, page and the seconds used into `SOURCES.jsonl` / `SOURCES.md`. This demo did not need it; see STYLE.md §10.
