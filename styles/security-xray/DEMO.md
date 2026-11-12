# Security X-ray — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Night Shift at Lane 3* 《安检口的夜班》 (51.9 s) · `security-xray.mp4` · source in [`demo/`](demo/)

One night shift, 22:00 to 06:00, at the screening console of an international departures lane, seen only through the X-ray screen and the belt: the flow of bags, two real rules (power banks, liquids), six live crabs at 03:12, breakfast at dawn, the handover. No people are drawn; the operator exists as boxes, zooms, rulers and verdicts, and as a voice: a few dry English lines in the first person (Kokoro `af_heart`), with Chinese and English subtitles. The rules on screen are quoted from the Civil Aviation Administration of China in [`demo/FACTS.md`](demo/FACTS.md); the lane, bags and numbers are invented.

## Story & structure

Logline: in one night, one lane screens 1,284 bags; three of them are judged, and one of them moves.

Arc: power-on and the first bag (the scan curtain colours a suitcase; "I never see the passengers. Only what they pack.") → the flow (five items cut on the beat, the clock jumping; the colour code in two lines) → judgment one, a power bank (box, zoom, label photo, formula, the 100/160 Wh scale, ✓) → judgment two, a bottle (ruler, a 100 mL outline to scale, ✗, rescan without it; "The bottle stays. The bag flies.") → 03:12, a foam box the flat image cannot read even with organic strip → CT: six tied crabs, and one leg kicks twice, in silence → judgment three (✗ not in the cabin) → dawn: a lunch jar and keys, "Someone's breakfast", the runway lights go out → the summary table → "I know every one of them inside out." → the belt stops, standby, end card.

The lane is international on purpose: the 100 mL per-container rule applies to international flights from China (domestic flights forbid liquids in the cabin altogether), and it is the lane that stays open all night. The crabs are refused because the sources say live seafood may not be carried into the cabin.

Native moves spent: *the scan curtain* (opening and every bag), *box, zoom, read* (power bank), *measure against a rule* (bottle), *rescan* (bottle removed), *material filter* (organic strip on the crab box), *into CT* (the crabs), *the shift* (clock, counter, sky, summary).

## Shots

Film time; the page warps story time so verdicts hold longer and still stretches get shorter (`WARP` in `film.js`; one zero-length stretch drops a montage item).

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–4.5 | Self-test (calibration bar, OK lines, panels lighting), clock 21:59:59 → 22:00; a suitcase crosses the curtain from 1.2 to 3.9, grey preview turning orange/green/blue; counter 0000 → 0001 | booth wide with the night window and a departure rolling, push to the screen and drift towards the curtain | signature 1: the scan curtain |
| 2 | 4.5–10.0 | Laptop (cells, key grid) · long umbrella (ribs, J-hook) · sneakers (eyelets) · steel flask (dark walls) · tray with a padlock (black core), belt, keys, watch, held a beat longer (8.5–10.0) so the run ends on a stop | a new crop each second, on the beat, each brought in by a scan-line sweep; each image stamped with bag number and time | the clock jumps on every cut |
| 3 | 10.0–19.08 | Scan-line sweep in; backpack; alarm 10.8; amber box on a brick; zoom ×2.9 to four cylindrical cells; panel: label photo `20000mAh 3.7V 74Wh`, formula, 0–200 Wh scale with lines at 100 and 160, marker lands on 74 at 12.7; ✓ "可以随身带" at 15.25 | outer push 1.0 → 1.22 with the operator zoom, locked from 12.7 | judgment: 2.55 s hold, then the verdict |
| 4 | 19.08–26.73 | Scan-line sweep in; tote; alarm; rulers 21 cm × Ø 6.5 cm; "容器约 500 mL"; rule "国际航班：单个容器 ≤ 100 mL"; a dashed 100 mL container at the same scale; ✗ and a red strike at 22.88; rescan sweep 23.43–23.98, bottle gone, dashed outline "已取出" | locked medium | judgment: 2.5 s hold |
| 5 | 26.73–28.85 | A longer sweep (0.55 s) jumps to 03:12, counter 0811, rate 18/h; a taxiing aircraft behind the glass; a foam box of overlapping orange masses; box "不明有机物 × 6"; organic strip wipes it to green outlines; status UNCLEAR; CT key | booth wide, slow push into the image | the flat image fails |
| 6 | 28.85–39.35 | A short, dim digital tear into CT (the reconstruction settles out of noise); six tied mitten crabs in two layers (filler removed), big claws with the hairy mitten, eye stalks; orbit ≈190° falling from overhead; push and near-stop beside one crab whose rear leg is loose; the leg kicks at 30.7 and 31.03 with a CT motion ghost and a box; the machine flags "检测到运动 MOTION DETECTED"; settle 32.05; numbers 1–6, "活蟹 × 6 · 已捆扎", rule; ✗ "不能带进客舱" at 35.3 | CT orbit with push and slowdown, locked from 32.35 | signature 2; judgment (3.1 s hold) |
| 7 | 39.35–43.85 | A scan line sweeps the CT away back to the console; 05:52; a lunch jar on its side (three steel bowls, rice, an egg), spoon and keys; tag "早饭 BREAKFAST"; counter 1284 | medium, then pull back 41.05–43.35 to the booth and the dawn sky; runway lights go out one by one from 42.65 | time of day |
| 8 | 43.85–48.1 | Summary table over the dimmed image: bags 1,284 · bags opened 37 · power banks 412 · liquids 29 · crabs 6, each row with an X-ray icon, each row revealed by a scan line, one beep per row; complete at 46.2 | the camera pushes back in from the dawn wide (no cut), then holds close | held list |
| 9 | 48.1–48.9 | 06:00; STOP key; the belt stops; the image dims to standby | pull back from the summary to the booth (no cut) | the last frame holds |
| 10 | 48.9–51.9 | End card on the standby screen | slow push 0.84 → 0.98 | end card |

Transitions: no hard cut and no white flash anywhere. Between bags the next picture comes in behind an X-ray scan line moving right to left, the belt's direction (`SWEEPS` in `film.js`: 0.22 s in the montage, 0.3–0.55 s elsewhere; the outgoing frame is rendered once at the cut and held left of the line). Into CT a short tear whose noise stays dim; out of CT a sweep. Dawn → summary → stop is one camera move (pull back, push in, pull back). Subtitle cues less than 0.6 s apart share one plate, so it never blinks between lines.

Every text the viewer has to read passes `core/render/readcheck.mjs` (each Chinese and English line counted together); the holds after each verdict come from that rule.

## Voice and subtitles

Thirteen cues, twenty sentence clips (`demo/voice/lines.json`), each placed by hand in `VO` in `film.js` and checked with `asr_check.py` (`small.en`). She speaks in the holds, never on an alarm or a verdict tone; the CT reveal (28.4–30.8) and the power-down are wordless.

| Cue | Time | English (spoken) | 中文 |
|---|---|---|---|
| 1 | 0.40–4.60 | I never see the passengers. Only what they pack. | 我从来看不见旅客，只看见他们装了什么。 |
| 2 | 4.62–8.02 | Blue is metal. Orange is organic. | 蓝色是金属，橙色是有机物。 |
| 3 | 8.05–10.85 | Black: nothing gets through. | 黑色，是射线穿不透。 |
| 4 | 11.4–15.1 | A power bank. 74 watt-hours. | 一个充电宝，74 瓦时。 |
| 5 | 15.45–19.06 | Under 100, it stays in the bag. | 不到 100，可以随身带。 |
| 6 | 20.2–22.75 | 500 milliliters. | 500 毫升。 |
| 7 | 23.15–26.5 | The bottle stays. The bag flies. | 瓶子留下，包上飞机。 |
| 8 | 26.72–30.12 | 3 a.m. Six of something. | 凌晨三点。六团东西。 |
| 9 | 31.3–35.5 | Live crabs. Tied up, and one still kicking. | 活螃蟹。捆好了，还有一只在蹬腿。 |
| 10 | 35.55–38.9 | Live seafood can't fly in the cabin. | 活的海鲜，不能带进客舱。 |
| 11 | 39.4–42.9 | 5:52. Someone's breakfast. | 5:52。不知是谁的早饭。 |
| 12 | 42.95–45.55 | Over 1,200 bags tonight. | 今晚 1,200 多个包。 |
| 13 | 45.6–48.9 | I know every one of them inside out. | 每一个，我都从里到外看过。 |

Subtitles are drawn by the page (the operator's log plate, bottom left) and exported to `security-xray.srt` from the same table.

## Score structure

120 BPM, D dorian; cuts and scans on the beat.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Power-on | 0–1.0 | contrabass D, bowed vibraphone A/D, console tones | relays tick with the self-test |
| Flow | 1.0–10.8 | spiccato cellos in 8ths, pizzicato basses, pizzicato violin chords on the off-beat, hi-hat; bass drum + woodblock on every cut | Dm–B♭–C–Am per bar |
| Judgment 1 | 10.8–15.25 | timpani, tremolo violins (A/B♭), held cello, cello pizz heartbeat | groove stops dead on the alarm |
| Clear | 15.25 | harp D-major arpeggio, strings chord, clear tone | |
| Judgment 2 | 19.08–22.88 | short groove, then the same suspense, lighter | low D + timpani + buzzing refusal tone at 22.88; small harp figure on the rescan |
| 03:12 | 26.73–28.85 | cello and viola drone, four slow vibraphone notes | the belt hum quieter |
| CT | 28.85–39.35 | gantry whir; a comic walk on cello pizz + staccato bassoon that stops before the leg; xylophone blips on each kick; marimba run as the crabs are counted; waiting pizz; trombone "wah-wah" on the refusal | |
| Dawn | 39.35–43.85 | strings pad D–G–A, harp 16ths, glockenspiel on "breakfast", falling glockenspiel as the lights go out | |
| Summary | 43.85–48.1 | held D chord (cellos, violas, violins), rising row beeps | |
| Stop / end | 48.1–51.9 | motor winds down, thump, power-down sweep; harp D add9 and vibraphone under the end card | 1.2 s fade at the end |

Mix (`audio.py`): the voice is compressed and set by RMS 12.7 dB over the music and 7 dB over music plus foley while it speaks; under it the music ducks 4.4 dB and loses part of its 300 Hz–4 kHz band, the machine beds step back 3 dB. Music at −6 dB to the tones and foley, ducked 4.4 dB for 0.45 s under alarms, verdicts, the kicks and the beeps; 4th-order high-pass at 48 Hz; the master is −14 LUFS from `mux.sh`. All cue times come from `events.json`, so the score follows any retiming.

## Palette & props

- Console: navy #03070C, belt #080F1A, chrome text rgb(170,200,245); amber, red, green verdict plates; the legend's four chips.
- Booth: monitor bezel #1B1E23 → #0C0D10; desk and keyboard (STOP, ◀ ▶, OS, MS, HI, Z+, Z−, MARK, CT, B/W, INV keys whose LEDs light with each action); the machine's exit with lead strips and an amber X-RAY ON lamp; rollers.
- Window: night sky #03060C → #0E1626 with stars, runway edge and centreline lights, blue taxiway lights, sodium floodlights, a parked aircraft with a beacon, a departure at 22:00 and a taxiing aircraft at 03:12, a control tower; dawn #2C3E60 → #E8B284.
- Props at real size: suitcase 56 × 38 × 21 cm (ABS shell, aluminium trolley tubes, hair dryer with a heating coil, toiletries, charger, jeans rivets); laptop 31 × 21.5 cm; umbrella 88 cm; sneakers; books (built, dropped from the cut); flask 26 cm; padlock 6.2 × 5.2 × 3.2 cm; backpack with a 20,000 mAh bank (four 21700 cells); 500 mL PET bottle; foam box 34 × 25 × 15 cm with six crabs (≈ 68 mm carapace, four teeth per side, eight jointed legs, claws held forward at the front corners: a 32 mm palm, fingers opening sideways so the pincer reads from above, ≈ 950 setae each for the mitten; eye stalks, three bands of two-strand rope); lunch jar Ø 11 cm.

## End card

On the standby screen, left-aligned in the image area: 安检口的夜班 (Noto Sans SC 700, 76 px), *Night Shift at Lane 3*, a rule, 安检 X 光 / SECURITY X-RAY in amber, `LemoLab × Claude Opus 5.5`; the dimmed clock (06:00) and counter (1284) stay in the right column, dawn behind the glass. The camera pushes in slowly so the sign-off line stays above 26 px. 3.0 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh       one command: fonts and voice (if missing) → speech check → events → picture → mix → master → subtitles → readcheck → poster, styleframe
  index.html     two canvases (WebGL thickness + colouriser, 2D booth and console), fonts
  film.js        render(t): time warp, shots, console, booth and window, panels, CT, summary, end card, VO, SUBS, EV, TEXTS
  xr.js          material, closed-solid helpers, renderView / drawView (dual-energy colouriser)
  props.js       bags and trays;  crab.js  carapace, legs, claws, rope, the box and the leg that moves
  audio.py       voice + score + console tones + foley from events.json -> out/mix.wav
  voice/         lines.json (Kokoro af_heart, one sentence per clip, rendered to out/voice/; asr overrides for "552" and "1,200")
  tools/srt_from_events.py   subtitle cues from events.json
  make_fonts.py  Noto Sans SC subset (500, 700) from the variable font
  FACTS.md       rules, sources, quoted wording
```

- `sh demo/build.sh` (renders at 30 fps with `--workers 2`; `WORKERS=3` for more). Needs the voice tier and the VSCO 2 CE and VCSL sample libraries (`sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce`, `… vcsl`); fonts are downloaded on the first run. Fonts: delete `demo/fonts/NotoSansSC-*.ttf` (or run `make_fonts.py`) after any text change, including subtitles. three.js comes from the library's `node_modules`.
- 1080p: about 40–110 ms a frame on Apple silicon (the first frame of a page ≈ 230 ms). `render(t)` depends on `t` only (no simulation); the leg's kick, the belt and the camera are closed-form.
- Needs `EXT_float_blend` for float thickness targets (falls back to half float: very thin parts may band).
- Demo-specific pitfalls: the twitching crab is rotated so its loose leg points out of the box, and the CT camera looks from overhead at that moment, or the leg disappears against the other crabs; the crabs are packed in two layers so the flat image cannot read them; the side view is useless for low objects, so the montage crops use the top view.
