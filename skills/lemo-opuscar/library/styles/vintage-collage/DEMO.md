# Vintage Engraving Collage — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Inverted Jenny* 《倒置的珍妮》 (52.0 s) · `vintage-collage.mp4` · source in [`demo/`](demo/)

In May 1918 the United States opened its airmail service and issued a 24-cent stamp: a blue Curtiss Jenny biplane in a red frame. The stamp was printed in two passes, red first, then blue. On one sheet the blue went on upside down. A collector, William T. Robey, bought that whole sheet on 14 May 1918 for $24 and sold it a week later for $15,000. The sheet was cut up and sold stamp by stamp; in 2023 a single one sold for $2,006,000 with the buyer's premium. Some of the hundred were lost, some stolen; number 66 vanished in 1955 and has never been found. An English narrator (Kokoro `bm_george`), Chinese and English subtitles. Facts and sources: [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: one sheet of paper went into the press the wrong way round; it went from $24 to two million a stamp, and one of the hundred is still missing.

Arc: May sky assembled from torn papers, a halftone news clipping and ransom letters (AIR MAIL); an engraved biplane flies in and the stamp assembles around it → through the stamp's oval into the press: red pass, blue pass → a near-silence; the next sheet turns 180° on the table before the blue pass; every plane prints upside down; close on one inverted stamp → whip pan to the post office: a black-paper silhouette, the sheet slides in, the receipt types out 100 × 24¢ = $24.00; a week later $24.00 is struck out and $15,000 lands in ransom letters → scissors cut the sheet, a hundred stamps scatter → a data engraving grows: 24¢ in 1918 against $2,006,000 in 2023, ≈ 8,360,000 × → an album page fills, LOST, LOST, STOLEN; slot 66 stays empty, "stolen 1955" types out → through the empty slot back into the sky, the inverted plane flies off past the sun; title and sign-off.

Native moves spent, each a step further than the last: *assemble* (sky, stamp), *ransom and typewriter* (AIR MAIL, receipt, $15,000, 1955), *through the hole* (the oval, then slot 66, a rhyme), *turn the sheet* (180° on the table, the hinge move at its largest), *cut it out* (scissors, a hundred pieces), *data engraving* (the tower).

## Shots

| # | Time | Shot | Camera / transition | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–2.3 | Teal, ochre, cream strip, mustard sun and three paper clouds slide in; a halftone clipping of the Polo Field, 15 May 1918, slaps in | wide, still | assemble; halftone |
| 2 | 2.0–5.9 | AIR MAIL in ransom letters, one per eighth note; the engraved biplane (cut from the stamp's blue plate) flies in on a dashed route, bobbing on twos | wide, slow follow | ransom letters; cut-out flight |
| 3 | 5.25–10.0 | The perforated stamp (paper, red plate, the sky lines of the blue plate) slides in under the plane, which lands in the oval; typed tags *blue plane* and *red frame* with leader lines | push to the stamp | assemble |
| 4 | 10.0–10.95 | The plane takes off; the camera dives into the empty oval, where the press already is | through the oval | through the hole |
| 5 | 10.95–14.7 | Pull back from the press to the sheet; a roller sweeps: PASS 1 — RED, frames appear cell by cell; PASS 2 — BLUE | pull back to wide | printing performed with paper |
| 6 | 14.7–15.6 | A second sheet, already red, slides in; near-silence | wide | the pause before the turn |
| 7 | 15.6–18.7 | The sheet turns 180° flat on the table, the blue pass, the sheet turns back: every plane upside down | wide, slight push | turn the sheet |
| 8 | 18.7–21.45 | One inverted stamp fills the frame, held | push to a close-up | verdict hold ≥ 2 s |
| 9 | 21.45–21.85 | Whip pan left, a paper seam between the scenes | whip pan | |
| 10 | 21.85–27.7 | Black-paper silhouette in a boater hat, typed name slips; the sheet slides in; the receipt types out | medium, pan to the sheet | silhouette (not a likeness of anyone); typewriter |
| 11 | 27.7–31.0 | "+ 1 week" slip; $24.00 struck through in red; $15,000 in ransom letters | push in | ransom letters |
| 12 | 31.0–33.0 | Scissors cut down the middle, then across | hard cut, match on the sheet | cut it out |
| 13 | 33.0–35.0 | A hundred stamps scatter, turning over; one flies up out of frame | pull back, then tilt up | scatter |
| 14 | 35.0–38.0 | The stamp lands on a line with almost no height (1918 · 24¢); an engraved tower grows beside it with a stamp on top | match on action, then a rise along the tower | data engraving |
| 15 | 38.0–40.55 | The whole comparison: 1918 · 24¢ / 2023 · one stamp / $2,006,000 / ≈ 8,360,000 × | pull back to wide, held 2.55 s | comparison held |
| 16 | 40.55–43.3 | Album page; 99 stamps drop into their slots in rhythm; LOST, LOST, STOLEN slips | top view, slight tilt | rhythm |
| 17 | 43.3–46.3 | Slot 66, numbered in pencil; "stolen 1955" types out | push to the slot | typewriter |
| 18 | 46.3–47.1 | The camera enters the empty slot, the sky is inside | through the slot | through the hole (rhymes with 4) |
| 19 | 47.1–52.0 | The inverted plane flies right to left past the sun and out; title slips; from 49.55 the style name and sign-off slips | wide, slow drift | end card |

## Voice and subtitles

Ten lines (`demo/vo/lines.json`), Kokoro `bm_george` at speed 0.92–0.95, about 2.55 words a second; numbers spelled out in the voice text and written as digits in the subtitles; every clip passes `asr_check.py`. Start times are `VO` in `demo/src/timeline.py`; thirteen cues, three lines split in two at the word timings.

| # | Start | English (spoken) | 中文 |
|---|---|---|---|
| 1 | 0.7 | May 1918. America is about to fly the mail. | 1918 年 5 月，美国要开始用飞机送信了。 |
| 2 | 5.6 | The new stamp: a blue plane, in a red frame. | 为此发行的新邮票：红框里，一架蓝色飞机。 |
| 3 | 10.4 | Every sheet goes through the press twice. / Red first, then blue. | 每张纸都要过两次印刷机。／先印红，再印蓝。 |
| 4 | 15.6 | But on one sheet, the blue went on upside down. | 可有一张纸，蓝色印反了。 |
| 5 | 21.9 | A collector named William Robey bought it. / 100 stamps, $24. | 集邮的威廉·罗比买下了它。／100 枚，24 美元。 |
| 6 | 27.7 | A week later, he sold it for $15,000. | 一周后，他以 15,000 美元转手。 |
| 7 | 31.3 | The sheet was cut up, and the planes flew apart. | 整版被剪开，飞机各奔东西。 |
| 8 | 35.0 | In 2023, a single one sold for just over $2 million. | 2023 年，单单一枚就卖出 200 多万美元。 |
| 9 | 40.6 | Some were lost. Some were stolen. | 有的遗失了，有的被偷了。 |
| 10 | 43.3 | Number 66 vanished in 1955, / and has never been found. | 第 66 号在 1955 年失踪，／至今下落不明。 |

Subtitles are baked slips drawn by the page at the bottom left (black newsprint slip, Chinese 40 px; cream typewriter slip, English 30 px, typing out) and exported to `vintage-collage.srt` from the same table.

## Score structure

120 BPM, a bar every 2 s; F major with a D minor turn.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Sky and stamp | 0–10 | tuba staccato and pizzicato violins (oom-pah), a xylophone note per AIR MAIL letter, harp run + glockenspiel when the stamp lands | |
| Press | 10–14.7 | woodblock on every beat like the machine, quieter oom-pah, clarinet arpeggio | roller rumble |
| Near-silence | 14.7–15.6 | nothing | paper only |
| Upside down | 15.6–21.4 | D minor: low bassoon, pizzicato falling by semitones, two timpani strokes on the turns, glockenspiel + harp on the close-up | |
| Post office | 21.4–31 | walking bassoon, pizzicato off-beats; seven rising xylophone notes for $15,000, glockenspiel + triangle | keys, carriage bell, red pen |
| Cut and scatter | 31–35 | spiccato violins in eighths; harp glissando + suspended cymbal on the scatter | snips, a hundred flutters |
| Tower | 35–40.5 | glockenspiel climbing a step at a time over a timpani roll; horn and trombone at the top | scrape of the growing chart |
| Album | 40.5–43.3 | pizzicato eighths with the drops | |
| Ending | 43.3–52 | glockenspiel music box; an F major chord on the title (harp, glockenspiel, contrabass pizzicato, horn); a last harp and glockenspiel under the sign-off | |

Mix (`demo/mix.py`): the voice is compressed and set by RMS about 10 dB over the music; while it speaks the music ducks 4 dB and its 300 Hz–4 kHz band another 6 dB. Peaks are limited to about 11 dB over the RMS before the master, so `mux.sh` lands at −14 LUFS with true peak below −1 dB.

## Palette & props

- Palette: paper #ECDFC2, card #F6EEDB, ink #221C17, ochre #C65F3A, teal #2F7F7A, mustard #E1AB3B; stamp inks #C8463F (red plate) and #2F5D8C (blue plate); cut edge #B49D78, paper back #E9DFC8.
- Printed matter: the 24c airmail stamp (Scott C3) separated into its plates and recomposed in the page, so "inverted" is the blue plate turned 180° about the oval's centre; the biplane cut from the blue plate; a halftone clipping of the 15 May 1918 Polo Field photo; a sheet of 100 with crop marks and a plate number; perforations; an album page with a pencilled 66.
- Paper props: a platen press and scissors (public-domain line drawings, mustard hand colour on the press), a roller with an engraved cylinder, a black-paper silhouette in a boater hat with an ochre band, a receipt, ransom letters, LOST and STOLEN slips, the engraved tower with a torn break.

## End card

The last shot's collage: *The Inverted Jenny* (IM FELL English italic on a black slip) and 倒置的珍妮 (Noto Serif SC Black on a cream slip) top left from 47.15 s; from 49.55 s three slips at the bottom right: *Vintage Engraving Collage* in small caps on newsprint, 复古版画拼贴 on mustard, and `LemoLab × Claude Opus 5.5` in Courier Prime Bold on a black slip (about 36 px). The inverted plane flies out of frame; held to 52.0 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh        one command: archive images and fonts (if missing) → voice (if missing) + speech check → timeline → parts → events → picture → mix → master → subtitles → readcheck → poster, styleframe
  index.html      render(t): seven scenes (A sky, B press, C post office, D scissors, E tower, F album, G sky) with their own cameras, the oval / whip / slot transitions, subtitles, EV, TEXTS
  src/bake.py     old paper, torn colour papers, palette, save()
  src/bake2.py    stamp plates, plane cut-out, halftone, ransom letters, slips, subtitle slips, silhouette, scissors, press, roller, sheet, album, tower, end slips
  src/collage_lib.py   noise, paper texture, torn edges, masks, cut-out with margin, engrave()
  src/timeline.py voice starts and subtitle cues → timeline.json, src/cues.json
  mix.py          voice + foley + score from events.json and timeline.json → out/mix.wav
  make_fonts.py   IM FELL, Courier Prime, Noto Serif SC subsets (OFL)
  vo/lines.json   the voice script (Kokoro bm_george; asr overrides for the numbers)
  SOURCES.jsonl   the archive images: file, download URL, Commons page, licence
  FACTS.md        every fact in the film with its source
  CREDITS
```

- `sh styles/vintage-collage/demo/build.sh` from the library root (renders at 24 fps with `--workers 2`; `WORKERS=3` for more). On a fresh clone first run `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce` and `sh tools/fetch.sh instruments vcsl`. The first run also needs the network for the fonts and the archive images.
- **The archive images are not in git** (`demo/raw/`, gitignored). `build.sh` downloads any missing one from the URL in `demo/SOURCES.jsonl`; all four are public domain on Wikimedia Commons: the 1918 24c Curtiss Jenny stamp scan, the Harris & Ewing photo of the Polo Field on 15 May 1918, and the Pearson Scott Foresman scissors and printing press drawings (pages and credits in `demo/CREDITS`). The baked parts (`demo/parts/*.png`) are regenerated from them; `PARTS=1` forces a re-bake.
- Fonts: after changing a Chinese string or a subtitle, delete `demo/fonts/NotoSerifSC-*.woff2` (the subsets) and run with `PARTS=1`.
- Speed: the parts bake in about 15 s; 1080p frames take a few ms each in Canvas 2D (1,248 frames in about a minute with two workers); the master with grain is the slow step.
- `?from=A&to=B` renders a span of the film (`window.DUR = B − A`), for re-rendering a few seconds.
- Readcheck: every on-screen text passes except the three end-card slips, which are on screen 2.1–2.4 s where readcheck asks 2.8–3.0 s: `sig_style_en` (Vintage Engraving Collage, 2.44 s), `sig_style_zh` (复古版画拼贴, 2.28 s), `sig_line` (LemoLab × Claude Opus 5.5, 2.12 s). The whole end card (title from 47.15 s) holds 4.85 s. Subtitles are checked against the `.srt` (every cue ≥ 2.26 s).
- Demo-specific pitfalls: the inverted stamp has to be made by turning the blue plate about the oval's centre, not by flipping the image; the camera may not leave the paper (clamp or tile the table); the bottom-left subtitle corner pushed the comparison's baseline up.
