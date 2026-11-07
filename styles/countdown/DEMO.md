# Live Countdown Split-screen — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Counting Itself Down* (自己倒数, 59.5 s) · `countdown.mp4` · source in [`demo/`](demo/)

The last minute of the Artemis II launch (1 April 2026, Launch Complex 39B), in real time from T−32.5 to T+27.0 with no cut in time. Everything on screen is NASA's own launch-day material: the live broadcast and its audio, the Firing Room, a camera on the rocket, a camera on Orion, a drone, two ground cameras, a crew photo and the mission fact sheet. This is an unofficial film; NASA did not make or endorse it.

## Story & structure

The story is three hand-overs of control, all heard in the native audio. At T−33 the ground launch sequencer gives the count to the rocket ("GLS, go for ALS" — "Great call-out. The rocket is on its own"); the rocket counts itself down; at T+21 "Houston, now controlling the flight of Integrity". A control strip in the clock header (地面 GLS → 火箭 ALS → 休斯敦 HOUSTON) carries the turns.

Shape: cells rise toward zero, merge, then open again for the consequences. Hook (0–0.5 s): the first spoken call flips the control strip on a single wide shot of the pad while the title package lands. Setup (2.5–13 s): the Firing Room opens beside the pad as a "same window" cell (the people who just handed over can only watch), the crew photo with name tags, then a thrust bar (SLS 15 % over Saturn V) on "the most powerful rocket NASA has ever launched". Development (13–22 s): the planned-vs-heard checklist and the fact sheet; the narrator's only line before zero; a punch-in on the pad on "sound suppression water is flowing"; the rocket's own camera replaces the paper. The count (22.4–32.5 s): a 3×3 grid with the clock in the centre; each spoken number opens one camera out of a "standby" slot; RS-25 start flags the engine camera and ticks "heard −6.0". Zero (32.5 s): nine cells merge into one real-time picture of the pad, the clock inverts. After zero: two hard-cut full screens (drone, Banana Creek), a breath, then three cells: the drone climbing, the camera on the rocket, and a flight-events panel whose second countdown runs to booster separation (T+2:09, expected); the loop's "good roll, pitch" ticks it. "Houston, now controlling…" fills the last control segment and the layout resolves to one cell under the title.

Why it fits the style: the real minute already has a countdown, three spoken hand-overs and a zero; the edit only has to make the second visible. Native moves spent: many into one (signature), clock inversion, control strip, the grid filling on the count, sync badges (including one honest "same window" cell), the planned-vs-heard checklist, a second countdown, event flags, a punch-in on a call, a document by rows.

## Layouts

Film time `t`, mission time `M = t − 32.5`.

| # | t | M | Native call / event | Layout | Note |
|---|---|---|---|---|---|
| 1 | 0.0 | −32.5 | — | 1 cell: broadcast, pad wide | title package 0.45–6.8 |
| 2 | 0.40 | −32.1 | "GLS, go for ALS." | control strip ground → rocket | strong action at 0.4 s |
| 3 | 2.50 | −30.0 | "Great call-out. The rocket is on its own." | 2: broadcast + Firing Room | "same window" badge |
| 4 | 5.26 | −27.2 | "Four brave explorers…" | 3: + crew photo | names pop 0.16 s apart |
| 5 | 7.40 | −25.1 | "…the most powerful rocket…" | 4: + thrust bars under the broadcast | comparison held 4.4 s |
| 6 | 13.10 | −19.4 | (gap) narrator: "About ten days: around the Moon, and back." | 3: broadcast + checklist + fact sheet | two rows, annotation band |
| 7 | 16.47 | −16.0 | "Sound suppression water is flowing." | punch-in on the pad base + event flag | 2880-px extraction |
| 8 | 19.60 | −12.9 | — | fact sheet → rocket camera (wipe) | |
| 9 | 22.42 | −10.1 | "Ten," | 3×3 grid: clock centre, checklist, transcript (2 slots), 3 standby slots | |
| 10 | 23.10 / 24.22 / 25.24 | −9 / −8 / −7 | "nine, eight, seven," | Orion, drone, Firing Room pop in | one tom each |
| 11 | 26.46 | −6.0 | "RS-25 engines lit…" | event flag on the engine camera; checklist "heard −6.0" | |
| 12 | 32.50 | 0 | "…booster ignition." | **many into one** (0.42 s) → OSB II real-time, flash, clock inverts | music silent 32.25–32.5 |
| 13 | 36.36 | +3.9 | "The crew of Artemis II, now bound for the Moon." | hard cut: drone full screen | |
| 14 | 39.50 | +7.0 | "Humanity's next great voyage begins." | hard cut: Banana Creek full screen | |
| 15 | 41.7–42.0 | +9.2 | (breath) | roar tail only; wind enters (J-cut) | |
| 16 | 42.00 | +9.5 | narrator: "Next on the clock: booster separation, at two minutes nine." | 3: drone + rocket camera + flight events | second countdown −1:59 |
| 17 | 46.40 / 49.78 | +13.9 / +17.3 | "Good roll, pitch." / "Roger, roll, pitch." | flight events tick | |
| 18 | 51.30 | +18.8 | — | drone → tracking telescope (wipe) | |
| 19 | 53.78 | +21.3 | "Houston, now controlling the flight of Integrity…" | control strip rocket → Houston | |
| 20 | 54.0–59.5 | +21.5 → +27 | the line ends under the card | 1: rocket camera full screen + end card | 5.5 s |

Sync per camera (source second `s`): broadcast `s = M + 46.8`; rocket camera `s = M + 34.8` (its burned-in timer); Orion `s = M + 26.25` (first RS-25 light at T−6.36); drone `s = M + 10.4`; Banana Creek `s = M + 19.0`; OSB II `s = 3.0 + 2.5·M` (slow-motion ×2.5); Firing Room not synced. All in `demo/tools/prep.sh`.

## Score structure

- 60 BPM, beat = tick = whole second of M (t 0.5, 1.5, …). D minor drone → D major at zero.
- 0.40 hand-over: timpani D, gran cassa, trombone stabs D/A, tubular bell D5. From 2.5: a bass drum per beat; synth drone (D1/A1, low-pass 140 → 1,300 Hz toward zero). 7.7: horn arpeggio D–F–A as the bars grow. From M −19: off-beat hats. Counts: a tom + timpani A on each spoken number; RS-25: gran cassa, tuba D1 and trombone A2 held. Last 4 s: snare sixteenths; T−3: timpani roll crescendo; **silence 32.25–32.5** (music only).
- Zero: gran cassa, bass drum, crash, timpani, tuba / trombones / horns in D major, tubular bell; half-time bass drum after; horns move to B3/G2 and A3/C♯4 under the two full screens. **Breath 41.7–42.0**: only the roar tail, then synthetic wind (J-cut into the rocket camera layout).
- 42.0 →: contrabass pizzicato ostinato D–D–A–C on the beat, light hats, glockenspiel A5 on each ticked flight event. 53.78: tubular bells A4/D5, horn D4, timpani. End card: D major brass, glockenspiel D6–A5–F♯5.
- Mix: the NASA broadcast audio is on top throughout; music ~8–10 dB under it before zero and ~6–7 dB under it after zero (lifted 3.5 dB from ignition on), ducked under speech; the narrator only in gaps of the broadcast. Ticks alternate 1,850 / 1,480 Hz (±15 % pan), louder in the last ten seconds, a soft 1,250 Hz after zero. Pre-master: normalised to −14 LUFS, then a linked look-ahead limiter (5 ms, 150 ms release, ceiling −3.3 dBFS) so the ignition keeps its punch (about 3 dB of reduction). −14.0 LUFS, true peak −1.9 dBFS.
- Voice: Kokoro `bf_emma`, two lines, chosen to sound unlike the broadcast's voices.

## Palette & props

- Ground `#06080A`, panels `#0B0E11`, accent `#FF5B1F`, speaking / heard `#FF3B30`, text `#F2F5F7` / `#7C878D`.
- Cells: HUD clock 656×184 and transcript 1,208×184 at the bottom; pre-zero big cell 1,240×840 with a 624-wide right column; the 3×3 grid 618×338 per slot (transcript spans two).
- Checklist rows: T−33 go for ALS (heard −32.1), T−30 core stage → ALS, T−12 H2 burn-off igniters, T−10 engine start command, T−6.36 RS-25 startup (heard −6.0), T−0 booster ignition (heard +0.2).
- Fact sheet rows "10 DAY TEST FLIGHT" and "2 EARTH ORBITS", measured on the page so the window's edges fall in white space; annotation band 28 % of the cell.
- Thrust bars: SLS orange at 820 px, Saturn V grey at 820 / 1.15, a dashed orange "+15%" marker.

## Title card

Opening package (lower left of the first cell, 0.45–6.8 s): 自己倒数 / COUNTING ITSELF DOWN, then 阿尔忒弥斯二号 · 2026 年 4 月 1 日 · 39B 发射台 and the English line.

End card (54.0–59.5 s, left-aligned over the rocket camera, the clock and transcript still running): 自己倒数 (Noto Sans SC 700, 112 px) / COUNTING ITSELF DOWN; a thin orange rule; 实时倒计时分屏 LIVE COUNTDOWN SPLIT-SCREEN; LemoLab × Claude Opus 5.5; 素材：NASA · 公有领域 · 非官方作品 / FOOTAGE: NASA · PUBLIC DOMAIN · UNOFFICIAL. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  index.html          the page: LAY layouts, camRegion, clock / transcript / checklist / doc / profile / thrust cells,
                      EV (mix events), TEXTS (readcheck), SUBFIT (one-line subtitles)
  tools/prep.sh       the sync table: every camera to frames/<cam>/<film frame>.jpg with one grade
  tools/grab.py       HTTP range excerpt of a NASA original + SOURCES.jsonl entry
  tools/footage.py    search / fetch / record licences (NASA, Commons, Internet Archive) → SOURCES.md
  tools/subs.mjs      cues → audio/cues.json (+ one line per language, ≥ 1.8 s)
  tools/fetch_fonts.py  Barlow, Barlow Condensed, IBM Plex Mono, Noto Sans SC subset (OFL)
  tools/final_asr.py  Whisper on the finished film
  audio/lines.json    narrator (Kokoro)      audio/mix.py   native audio, ticks, foley, score, ducking, pre-master
  FACTS.md · SOURCES.md · SOURCES.jsonl · CREDITS
  raw/ frames/ out/ fonts/ audio/vo/   downloaded or generated, not committed
```

`sh demo/build.sh` (library set up with `setup.sh deps voice music`): fetches the NASA excerpts (~400 MB), fonts, voice model and the vsco2ce / vcsl samples if missing → narrator + speech check → frames (`prep.sh`) → subtitles + one-line check → `readcheck` → events → render (1,785 frames, 30 fps) → mix → mux (−14 LUFS, grain 1) → small cut → poster / style frame (t 28.5) → Whisper on the film.

Demo-specific choices and pitfalls: the broadcast excerpt is a stream copy, so its zero (46.8 s) depends on the keyframe it starts on; re-measure after a re-fetch. The rocket camera's burned-in timer gives a frame-exact zero, but the same file's audio runs about 1 s early, so sync it on picture only. The Firing Room reel has no clock: it is labelled "same window" and kept away from the seconds where its content could contradict the clock. "GLS, go for ALS" is heard by Whisper as "go for your left"; it is identified from NASA's countdown list and the commentary that follows (FACTS.md §T). Split the count into two cues: shown as one, its whole Chinese line ("…RS-25 点火") appears four seconds early. Fill the 3×3 grid's empty slots with "standby" frames that each count opens, not black. Put the fact-sheet annotation in a dark band below the paper, not over the page's own type, and keep the paper window a fixed 600 source px wide (scaled to fit, paper white above and below) so every row's text is whole. Don't hold a static pad wide shot for ten seconds; break it with a punch-in on "sound suppression water" (from a 2,880-px extraction, no upscaling).
