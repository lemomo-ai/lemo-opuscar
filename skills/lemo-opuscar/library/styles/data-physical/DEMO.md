# Data Physicalization — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Two Spirals* 《两条螺旋》 (39.4 s) · `data-physical.mp4` · source in [`demo/`](demo/)

Twelve years of global wind and solar capacity (IRENA 2026, via Our World in Data, CC BY 4.0), built as two spirals of real plates on a walnut dial: one plate is 10 GW for both, aluminium for solar, teal acrylic for wind, a brass plate every 100 GW. Chinese on screen, English narration, bilingual subtitles (Chinese line above, English line below). This is an unofficial film made from published data; IRENA and Our World in Data did not make or endorse it.

## Story & structure

Logline: in 2014 the world had almost twice as much wind as solar; in 2021 solar passed wind; by 2025 the ratio is the other way round (solar = wind × 1.86).

Arc: the pair (2014, wind and solar side by side, held, then the verdict ×1.95) → the rule (a macro of one plate and one brass plate) → growth (2015–2020 pairs assemble as the camera tracks along the spiral) → the turn (2020 and 2021 pairs held still with four readings, a suck-out, then "2021 · solar passed wind") → the climax (2025: last year's level cascades in, then 52 new plates are fed one by one while the counter rolls to 2,396.7 GW) → the reveal (the crane pulls back to near top view: two spirals and the inlaid ticks become one dial) → the ending (a brass puck engraved ×1.86 falls onto the centre; end card).

Native moves spent: *the unit close-up* for the rule; *the paired climb* through the decade; *the feed* for 2025; *chart to installation* as the signature pull-back; *the last object* for the final number. Every number and its source is in [`demo/FACTS.md`](demo/FACTS.md).

## Shots

One continuous take. Times in seconds; 96 BPM, a bar is 2.5 s.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–2.5 | the 2014 pair assembles (wind from 0.1, solar from 0.4): 35 acrylic plates, 18 aluminium | low side view, pulling back from close | first plates land in the first frame |
| 2 | 2.5–7.5 | both readings in one column (349.5 / 178.8 GW), held 2.8 s; verdict "风电 = 太阳能 × 1.95" at 5.0 | slow orbit | comparison held before the verdict |
| 3 | 7.5–10.3 | brackets on one plate "1 片 = 10 GW" and one brass plate "黄铜 = 100 GW" | push into the solar stack's side, f-stop wide | the unit close-up |
| 4 | 10.0–17.5 | 2015–2020 pairs cascade one every 1.25 s; brass plates ring | low lateral track along the spiral, rising with the tops | no labels: the inlaid years carry it |
| 5 | 17.5–22.5 | 2021 assembles; 2020 and 2021 pairs held with four readings from 18.85; suck-out 21.5; verdict "2021 · 太阳能超过风电" at 21.875 | crane up to a locked three-quarter frame, 2–3 % creep | the turn |
| 6 | 22.5–25.3 | 2022–2025 pairs cascade in quick succession | fast track along the spiral | the verdict stays in the upper-left third over the move |
| 7 | 25.3–30.0 | 2025 solar shoots up to 2024's level, then 52 plates are fed one per 1/10 beat; counter 1,883.2 → 2,396.7 GW, "当年新增 +513.5 GW" | crane rising with the top | the feed; style frame at 28.6 |
| 8 | 30.0–34.4 | the whole set: two spirals, ticks and inlaid years read as a dial | crane back and up to ~70° top view, target offset left for the end card | chart to installation |
| 9 | 34.4–39.4 | a brass puck engraved ×1.86 falls to the centre (suck-out 33.75–34.375); accent line "2025 · 太阳能装机是风电的 1.86 倍" with a leader to the puck; end card | slow turn of the top view | the last object; poster at 37.8 |

## Score structure

96 BPM, 4/4, D major; one chord per bar: Dadd9 – Dadd9 – Bm – Gmaj7 | D – A/C♯ – Bm – G | Asus (bar 8, cut short) | D – Bm – G | A – Gmaj7 | D – D.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Wind leads | 0–10 | glass harp + harp motif (A5 F♯5 E5 D5…), synth pad, bowed vibraphone | sparse; the plates' own ticks and brass notes carry the rhythm |
| Growth | 10–20 | marimba arpeggio in 8ths, pulse bass in quarters (2nd/3rd harmonics) | each pair's cascade is an arpeggio of ticks and glockenspiel / glass notes climbing a D pentatonic ladder (one note per 100 GW) |
| Crossover | 20–21.875 | timpani heartbeat on A, a held horn A3 | suck-out 21.5–21.875 (music and foley −30 dB) |
| Turn | 21.875 | punch (60–120 Hz) + bass drum + timpani D3 + horns D–F♯–A + trombone D2 + glockenspiel F♯6 + metal ring | second-loudest moment |
| 2025 | 22.5–30 | marimba 16ths, pulse 8ths, a glockenspiel line D6–E6–F♯6–A6–B6–A6 over the feed; 52 metal ticks; vibraphone chord + timpani when the last plate lands (29.2) | the densest stretch |
| Dial | 30–33.75 | horns D3/A3/F♯4 and cellos D3 under the crane, marimba back to 8ths | suck-out 33.75–34.375 |
| Puck | 34.375 | punch + bass drum + gran cassa + timpani D3 + tubular bells D5/A4 + metal rings; five small ticks of the puck settling | the loudest moment of the film |
| End | 34.4–39.4 | harp arpeggio D4…D6, bowed vibraphone D5/A4 | fade |

Mix (`demo/mix.py`): stems set against the voice's active RMS (music −10.9 dB, pulse −12.2 dB, foley −8.6 dB, hits −2.3 dB, studio-air bed far under), music ducked ~4 dB under speech; bus compression on music, pulse, foley and bed only; a 36 Hz high-pass (44 Hz, 4th order on hits) and a −5 dB shelf below 62 Hz on everything but the voice; master to −14.4 LUFS with a 4× oversampled true-peak limiter at −4.6 dBTP, then `mux.sh` (−14 LUFS). The film measures −13.8 LUFS integrated, LRA 6.6 LU.

## Palette & props

- Sweep #C4BEB4 with fog to it; walnut veneer dial (r 3.35, 0.11 thick) with an aluminium rim, inlay in #EFE4CF: 2° tick ring, the two spiral paths (dashes long for solar, short for wind), years in JetBrains Mono.
- Solar: aluminium plates #C8CCD1, metalness 1, roughness 0.27; wind: acrylic #9FD3D6, transmission 0.72, clearcoat, teal attenuation; brass #D2B07A every tenth plate in both. Plate 0.50 × 0.42, 0.0125 thick (10 GW); solar ring r 2.25–2.58, wind ring 0.6 inside, 27.6° per year.
- Lights: warm key #FFF1DC from the left at ~35°, 4096 shadow map; cool rims #B9D2FF / #C6DBFF from behind-right and front-right; HDRI `photo_studio_loft_hall` at 0.8 for reflections.
- The puck: brass, r 0.64, engraved (dark patina) "2025 · ×1.86 · 太阳能 ÷ 风电" with a tick ring.
- Type: Inter 200/300 for numbers, Noto Sans SC 500 for labels, verdicts and subtitles, JetBrains Mono for years and units, Noto Serif SC 600 for the title. Ink #1C1D20, accent #D4521C.
- Narrator: Kokoro `af_heart`, speed 0.95.

## End card

Left third over the turning dial: 两条螺旋 (Noto Serif SC), *Two Spirals*, a rule, `DATA PHYSICALIZATION · 数据实物化`, `LemoLab × Claude Opus 5.5`; above it the accent line with its leader to the puck; the data source stays in the top-right corner from the crane on. 4.6 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh          one command: fonts (first run) → voice → speech check → cues → events → picture → mix → master → .srt → checks → poster
  index.html        WebGL canvas + 2D overlay canvas, fonts.css
  timeline.js       single source: BPM grid, build times, holds, verdicts, suck-outs, narration + subtitles, every on-screen string (LABELS)
  data.js           the twelve years of both series (IRENA 2026 via OWID) and the unit rule
  set.js            the physical set (lights, walnut dial + inlay, instanced plates per material, the puck), the landing schedule, EVENTS
  film.js           camera keys, reading kit (pairLabels, verdict, counter), subtitles, end card, TEXTS (readcheck), SUBCHECK, EV
  mix.py            score, material foley, voice, suck-outs, mix and master → out/mix.wav, out/stems/
  tools/            export.mjs (voice lines, timeline.json, cues), fonts.mjs (OFL subsets), srt.mjs, subcheck.mjs, holdcheck.py
  data/             the downloaded CSVs and metadata
  FACTS.md, CREDITS, stills/styleframe.jpg
```

- Needs `setup.sh deps voice` (Kokoro and faster-whisper; the Whisper `small.en` model downloads on the first check). `build.sh` fetches what git doesn't hold, only when missing: the studio HDRI (`sh tools/fetch.sh hdri`, 12 MB), the Kokoro model (`fetch.sh voice`), the sample libraries `vsco2ce`, `vcsl`, `freepats` (`fetch.sh instruments <lib>`, ~1 GB together), and the font subsets (`tools/fonts.mjs` from the Google Fonts CSS2 API, OFL: Noto Sans SC, Noto Serif SC, Inter, JetBrains Mono) whenever a `.woff2` named in `fonts.css` is missing. The walnut veneer textures are in git (`core/assets/polyhaven/`), the data CSVs in `demo/data/`.
- `sh demo/build.sh` takes about 7 minutes on Apple silicon; the picture (945 frames, 2× supersampled, acrylic transmission) is ~55 s with 3 workers, the speech check most of the rest.
- Checks it runs: `asr_check.py` (small.en, 7/7), subtitle single-line widths with the real fonts (widest 836 px against 1100 px), `readcheck.mjs` (all pass), `holdcheck.py` (2014 pair held 2.77 s, 2020/2021 held 2.67 s before their verdicts).
- Demo-specific pitfalls: aluminium and clear acrylic read as the same white plates unless the acrylic gets a teal tint and attenuation and the aluminium full metalness; long warm shadows turn the far aluminium brown without the two cool rims; keep the 2014 and 2020/2021 reading columns below y = 430, or they collide with the verdict plate; drop the crane's target below the top of the 2025 stack, or the stack sits behind the subtitle strip; the top-view puck engraving reads upright only with yaw π/2 + 0.30 for this camera.
