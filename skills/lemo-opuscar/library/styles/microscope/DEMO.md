# Microscope Story — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Measured Blue* 《量出来的蓝》 (39.5 s) · `microscope.mp4` · source in [`demo/`](demo/)

One continuous camera takes a stained slice of human liver from the glass slide in the hand down to a single nucleus and back. On the way it counts the blue (collagen) inside two 1 mm circles 1.4 mm apart: 13.5 % and 32.6 %. Chinese on screen, English narration, bilingual subtitles (Chinese line above, English line below). One public whole-slide scan (Ventana-1.bif, PathAI, CC0); every number is measured from the file and listed with its method in [`demo/FACTS.md`](demo/FACTS.md). The film describes measurements only; it makes no diagnosis.

## Story & structure

Logline: one stained slice the size of a fingernail; the same stain, two circles 1.4 mm apart, 13.5 % blue against 32.6 %, every number counted from the scan itself.

Arc: the object (the slide on a graphite bench, its label, a fleck of tissue: *one glass slide, one slice of human liver*) → the size (a dive to the tissue, a dimension line, 4.80 mm) → the first count (circle A inside a large nodule, a scan front lights every counted pixel, 13.5 %) → the second count (a truck 1.4 mm to circle B, a small nodule walled by thick septa, 32.6 %) → the turn (silence, then both circles framed and held: *2.4 times the blue*) → the smallest scale (a dive to one hepatocyte nucleus, a focal sweep, a ring, 8.5 µm) → the climb back to the glass, the title written on it.

Native moves spent: *the dive* as the signature shot (twice: slide → tissue → nodule, and nodule → nucleus), *counting the colour* for both circles, *two circles, one verdict* at the turn, *the focal sweep and the ring* at the nucleus, *the climb back* into the end card.

## Shots

One continuous take; the camera is a similarity transform interpolated as a log spiral between keys. Times in seconds; magnification changes happen where the pyramid level on screen actually changes (4.04, 4.56, 9.94, 10.42, 21.02, 27.52, 27.94, 28.22 going in; six between 33.53 and 34.46 coming out).

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–2.67 | the whole slide across a graphite bench, label end on the right; a fleck of tissue labelled 一片人肝组织 / 三色染色 | rack focus in 0–0.95, light pool drifting; 68 → 63.5 mm field, roll 90° | the scanner's own photo of the slide, cleaned, logo filled |
| 2 | 2.67–5.33 | slide → tissue | dive ×7, roll 90° → 25° (the tissue's long axis comes level); turret clicks at 1.25× and 2.5× | the cover glass turns to clean glass below 30 mm |
| 3 | 5.33–9.33 | the tissue, a dimension line grows from its centre: 4.80 mm, 人肝组织 · 三色染色 | creep 9.2 → 8.55 mm | first reading |
| 4 | 9.33–10.67 | tissue → nodule A | dive ×3.2 to 2.7 mm, roll to 18.5° (A–B line level); clicks 5×, 10× | |
| 5 | 10.67–15.33 | circle A drawn as an arc with ticks (A · 直径 1 mm); 11.0–12.47 a mint scan front crosses it, every counted collagen pixel lights behind it, the reading rolls to 13.5 % and springs at 12.67; raw counts below | locked, creep | counting the colour |
| 6 | 15.33–16.67 | the septa slide past | truck 1.41 mm at 10× | |
| 7 | 16.67–20.67 | circle B, the same count: 32.6 %, lands 18.0 | locked, creep | |
| 8 | 20.67–26.67 | both circles and both readings in frame from 21.67; silence 21.8–22.67; the verdict panel: B 的蓝色占比是 A 的 2.4 倍 / 相隔 1.41 mm · 同一切片 · 同一染色 | pull back to 3.95 mm (click back to 5×), creep | each reading held ≥ 2.5 s before the verdict |
| 9 | 26.67–29.33 | nodule B → one nucleus | dive ×11, roll to 34°; clicks 10×, 20×, 40× | the counted pixels fade on the way down |
| 10 | 29.33–32.67 | the frame softens, a focal plane sweeps left → right; a mint ring is drawn round one nucleus with caliper ticks, panel 肝细胞核 · 8.5 µm · 核膜外缘拟合 | creep 345 → 318 µm | the focal sweep and the ring |
| 11 | 32.67–35.33 | silence 32.3–32.67, then the climb: the scale bar jumps back 20 µm → 5 mm, six quick clicks | pull ×145, roll 34° → 96° | the climb back |
| 12 | 35.33–39.5 | the glass fills the frame, the slide's edge and a dark sliver of bench at the bottom; title written on the glass | slow drift | end card |

## Score structure

90 BPM, 4/4, one chord per bar: Dsus2 – Bm7 – Gmaj7 – Asus4 (twice), Bm under the verdict, Gmaj7, Em9 for the dive, D major when the nucleus lands, Gmaj7 for the climb, Dsus2 – D for the card. Every designed hit sits on the grid (`demo/tools/cuecheck.py`: 0 ms); turret clicks are foley on the picture's level changes.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Open | 0–2.67 | bowed vibraphone pad, soft vibraphone arpeggio, long pulse bass, a high glass shimmer under the moving light, soft timpani | |
| Push | 2.67–5.33 | hard-mallet vibraphone in 16ths, pulse bass in 8ths, riser | turret click + servo at each level |
| Tissue | 5.33–9.33 | pad, quarter-note pulse | pen on glass for the dimension line |
| Measure | 9.33–20.67 | vibraphone in 8ths, marimba off-beat ticks, quarter pulse | per circle: pen for the arc, a band-passed scan moving left → right with counter ticks that speed up; glockenspiel + timpani when the reading lands (A 12.67, B 18.0); whoosh for the truck |
| Silence 1 | 21.8–22.67 | room tone only | |
| Verdict | 22.67 | timpani + gran cassa + glockenspiel B5 + low B in the bass | first sound after the silence |
| Dive | 26.67–29.33 | 16ths again, riser, three clicks | |
| Land | 29.33–32.3 | water-glass motif D5–A4–F♯5–E5–D5 with echoes, D major pad, filtered sweep across the stereo field with the focal plane, glockenspiel F♯6 when the reading lands | the only resolution in the film |
| Silence 2 | 32.3–32.67 | room tone | |
| Climb | 32.67–35.33 | a long whoosh, six lighter clicks | |
| Card | 35.33–39.5 | reversed swell into a soft bass drum and bowed cymbal, the glass motif once more, slower; low D | |

Mix (in `mix.py`): stems set against the voice by active RMS (music −11 dB, pulse −14, foley −12, hits −6, room −30), music ducked ~4 dB under speech, gentle bus compression on music, pulse, foley and room only; a 38 Hz high-pass and a −4 dB shelf below 62 Hz on everything but the voice. The film measures −14.0 LUFS, LRA 5.8 LU, peak −1.8 dBFS.

## Palette & props

- Glass #F4F1EC (both the slide photo and the scan normalised to it), bench graphite #0B0D0F → #2A3036, ink #181B1F, frosted panels rgba(12,14,17,0.74) with a 1 px light rim, accent mint rgb(120,240,205) on stain and rgb(0,122,99) on glass.
- The stain keeps its colour: trichrome red (hepatocyte cytoplasm) and blue (collagen).
- Props: the slide photo (label and barcode as photographed, the maker's logo filled), the dimension line, two 1 mm circles with their counted-pixel masks, the verdict panel, the nucleus ring, the instrument panel (scale bar, field of view, magnification with a turning nosepiece glyph and a large flash of each new magnification), the source panel.
- Narrator: Kokoro `af_heart`, speed 0.95.

## End card

The camera climbs back until the glass fills the frame; on its empty cover glass, in ink: 量出来的蓝 (Noto Serif SC 600), *Measured Blue*, a rule drawn left to right, `MICROSCOPE STORY · 显微叙事`, `LemoLab × Claude Opus 5.5`, `数据：Ventana-1 · PathAI · CC0`; the tissue fleck sits to the right. 4.2 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh          one command: (plates if missing) -> voice -> speech check -> cues -> events -> video -> mix -> master -> .srt -> checks -> poster
  index.html        one canvas, fonts
  film.js           render(t): similarity camera keys + log-spiral interpolation, plate selection, objective events,
                    focus, frosted panels, every mark and reading, subtitles, end card, TEXTS, SUBCHECK, EV
  timeline.js       90 BPM grid, key moments, narration with zh/en lines and the numbers it states (checked)
  mix.py            score, foley, room, voice, mix -> out/mix.wav + out/stems/
  config.json       circle centres, nucleus guess, the roll the scan direction is computed for
  tools/            plates.py (registration, cleaning, plates, collagen masks and counts, tissue axis), nucleus.py,
                    fonts.py (all fonts), export.mjs (voice lines, cues, number check), subcheck.mjs, cuecheck.py, finalasr.py
  assets/           raw/Ventana-1.bif (227 MB, gitignored), plates/ (plates, ROI overlays, plates.json, nucleus.json)
  FACTS.md, CREDITS, stills/styleframe.jpg
```

- `sh demo/build.sh` takes about 5 minutes on Apple silicon (the picture renders in ~20–90 s with 4 workers; the final speech check is the slowest step). In a fresh clone it first downloads the slide (227 MB), rebuilds the plates and measurements (about a minute) and fetches the fonts (Barlow Condensed and IBM Plex Mono from github.com/google/fonts, Noto Sans SC / Noto Serif SC subsets from the Google Fonts API); `FETCH=1` forces all of that again. The slide reader runs in its own `demo/.venv` (tifffile, imagecodecs).
- Checks it runs: `asr_check.py` with `small.en` (decimals are written as Whisper writes them in each line's `asr`), the script's numbers against the measurements (`export.mjs` fails on a mismatch), the cue grid, single-line subtitle widths with the real fonts (widest 642 px against 960), `readcheck.mjs`, speech-to-text on the final mix, black frames.
- Plates: slide photo 1251 × 3685 (21.2 µm/px), scan levels 5/4/3 whole with a 0.3 mm feather, level 2 whole (6144 × 5376, 1 µm/px), levels 1 and 0 as 5120 × 3584 crops around the nucleus. About 400 MB of decoded images per render worker.
- Demo-specific pitfalls: keep the slide's far end out of frame in every shot, because the scanner tray's clips there can only be filled roughly; trust the slide photo's resolution tag only after the tissue's centroid matches the scan through AOI0 (19 µm); with fields between 2.6 and 2.8 mm the level-2 plate flips in and out, so hold the circles at 2.6–2.7 mm to keep the turret quiet during a reading; the scan direction of the counting mask is computed for the roll in `config.json` and must follow the camera if the roll changes.
