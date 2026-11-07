# Engineering Briefing Board — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Ship Decides* (船说了算, 40.0 s) · `briefing-board.mp4` · source in [`demo/`](demo/)

A river 1,000 m wide needs a bridge. The first instinct, piers all the way across, is stamped out the moment a container ship sails into one of them. The new rule: no piers in the channel, one span. Four bridge types are tested against the river's width, drawn to one scale. The river set the question; the ship sets the span.

## Story & structure

Shape: an elimination that turns early. Hook (0–1 s): the river's width snaps across in the first quarter-second. Setup (1–8 s): "1,000 米", a pier-by-pier beam crossing. Turn (8 s): after a second of near-silence the ship touches the centre pier and a red stamp lands. Development (11–27 s): the rule is written, the piers pop off, a steel ruler is laid bank to bank; dashed projection lines carry the banks down into an elevation "test bench" where four photographed bridges land one after another, each met close by the camera as it lands, then judged in a held frame that shows the whole bridge, the two bank lines (the 1,000 m "door"), its dimension line drawn to its record main span, and the verdict landing after the camera has settled. Each judgement frame is wider than the last, so the widening is the rhythm: the cable-stayed line crawls just past the far bank, the suspension line rockets past it and throws the camera. Ending (32.8–40 s): down at the waterline a side-view container ship comes out from behind the far tower and sails under the suspension span; half a second of room tone; then the only pull-back, starting from the ship, to the whole wall, where the verdict "船决定跨度" is written beside the results. The final frame is the poster.

Why it fits the style: one continuous wall holds a plan view (top-down ship, river, crossing) above an elevation view (side-on bridges) with projection lines between them — a real drafting convention, so a top-down ship and side-on bridges share one board without breaking geometry. The same ship appears in both views: the problem in plan, the answer in elevation. Native moves spent: magnets as countable things, the stamp, erase to a ghost, the physical answer (the ruler), projection lines, ride the dimension line (four times), the subject passes through the answer, leader to the verdict, and the whole-wall reveal as the signature shot.

## Shots

One continuous camera, no cuts. Times in seconds; zoom 1 = 1,920 board px across.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–1.2 | ECU on the left bank, the dimension arrow already leaving it | z 2.6, roll −3°; whips right with the line as it snaps across (0.25), overshoots, settles (z 1.32) | the hook: line, brass hit and kick in the first 0.25 s |
| 2 | 1.2–2.9 | MCU on "1,000 米" being written | push in (z 1.42), roll +1° | |
| 3 | 2.9–5.5 | MS of the crossing | tilt down as the deck draws, then track right along seven pier magnets (eighths) | magnets as countable things |
| 4 | 5.5–8.0 | MS → CU up the channel | tilt up as the horn sounds (J-cut), then a slow push to z 2.05 with a −1.6° Dutch tilt | silence 7.0–8.0 |
| 5 | 8.0–10.7 | CU on the bow, the pier and the stamp → the whole ship | impact shake, then a pull back along the hull (z 1.42) | the stamp; the centre pier jolts |
| 6 | 10.75–14.4 | MS: the rule; the river edge | pull back right (z 1.0), ride the marker as the rule is written, drift back as the piers pop | erase to a ghost; the ruler drops at 14.0 |
| 7 | 14.4–15.25 | ECU: the beam's pier foot as the print lands (15.0) | tilt down the dashed projection lines into it (z 2.05) | projection lines; two magnets pin each print |
| 8 | 15.25–18.45 | **Judgement: beam** — whole bridge, both bank lines, 330 m line, tag, number | pull out (z 1.09), **hold 15.85–18.45 (2.6 s)** with a slow push | line 15.875–16.25; red strike and dashed shortfall at 17.125 |
| 9 | 18.45–19.25 | CU: the arch rib and hangers as it lands (19.0) | crane down (z 1.6) | |
| 10 | 19.25–22.45 | **Judgement: arch**, with the beam's result above | pull out (z 0.99), **hold 19.85–22.45 (2.6 s)** | line 19.875–20.25; strike 21.125 |
| 11 | 22.45–23.4 | CU: the pylon top and its fan as it lands (23.125) | crane down (z 1.8) | |
| 12 | 23.4–28.2 | **Judgement: cable-stayed**, with the arch's result above | pull out (z 0.81), **hold 24.08–28.2 (4.1 s)** | the line crawls 24.125–25.625 just past the right bank line; "勉强" at 26.0 |
| 13 | 28.2–29.1 | CU: the near tower and its long hangers as the heaviest print lands (28.875) | crane down (z 1.38, capped by rescheck) | |
| 14 | 29.1–32.8 | **Judgement: suspension**, with the cable-stayed result above | pull out (z 0.60), **hold 29.83–32.83 (3.0 s)**; thrown right as the line passes the bank (30.175), settles back | the line rockets 29.875–30.375; ring 31.25; the horn (32.0) brings the side-view ship in at the right edge |
| 15 | 32.8–35.75 | CU at the waterline: the far tower, hangers, the side-view ship | down to the water (z 1.42), then pan left with the ship under the main span | the subject passes through the answer; silence 35.25–35.75 |
| 16 | 35.75–37.8 | the whole wall | the only pull-back, from the ship (z 1.42 → 0.2795, 2.05 s) | **signature shot**: both side edges first in frame at 37.17 s; leader (36.7) and verdict (36.875–37.875) drawn during it |
| 17 | 38.15–40.0 | the whole wall | a slow push (×1.025) that keeps the wall whole; a cloud shadow crosses the wall | the end card is part of the wall |

Judgement frames widen 1,768 → 1,945 → 2,361 → 3,205 board px (28 % → 50 % of the wall's width). `tools/camcheck.mjs` checks each one: the whole box (print, both bank lines, dimension line, labels, verdict) stays in frame and above the subtitle strip for the whole hold. Before 35.75 s the camera never shows more than 51.4 % of the board's width, never both side edges and none of the right zone (prints, cards, notes, verdict, end card). `tools/rescheck.mjs` checks that no frame shows any photo at less than one source pixel per screen pixel (lowest: the stretched suspension span, 1.03, at its landing).

## Score structure

- 120 BPM, 4/4, D minor → D major at the reveal. Instruments: electric bass (eighth-note figure), MuldjordKit kick/snare/hats, claves, shaker, low brass stabs (trombone, tuba, horn), timpani, gran cassa, crash, tubular bells, glockenspiel, vibraphone. No piano, no string pad.
- Arc: the hook (Dm brass stab, low tom, kick with the snapping line at 0.25) → groove A → low-pass dive → **silence 7.0–8.0** → stamp: Dm brass stab + timpani + gran cassa → half time (held D, low toms) → groove A rebuilt under the rule → groove B (kit) under the test bench, one brass stab per landing in the bar's chord, a sour trombone blat (D + E♭) per strike → the cable crawl: bass climbs chromatically in eighths G1 → G2 with a shaker swell → "just enough": two horn notes → snare sixteenths into the suspension's line (A, dominant, on the landing) → the line lands: crash + a bright B♭ chord (VI) → vibraphone pair on the ring → bass whole notes and soft trombone fifths under the last line and the ship → **silence 35.25–35.75** → the reveal: the ship's horn tuned to D (root and fifth) with a D-major brass chord, timpani and tubular bells → the verdict is written to a horn line A–F♯–E–D–A → glockenspiel D–F♯–A–D while the wall settles.
- Hits: every landing, pin, stamp, arrow, strike and tag sits on the 16th-note grid (`tools/cuecheck.py`: 27/27 at 0 ms).
- Foley (procedural, `audio/mix.py`): felt-tip squeaks scaled to stroke length, nib taps, magnet clacks pitched per pier, two pin clacks after every landing, suction pops, print landings (board thump + paper slap, heavier for the suspension), the steel ruler's ring, eraser felt, rubber stamp, ship horn (far and near), diesel rumble, water lapping, whooshes, room tone with distant traffic.
- J-cuts: the horn at 5.75 before the top-down ship is seen; the horn at 32.0 before the side-view ship comes out from behind the tower. L-cuts: the eraser over the move into the bench; the reveal horn over the whole pull-back.
- Mix: music about 9 dB under the voice and ducked; foley ducked under speech; room tone (air conditioning on the right, traffic through the window on the left) about 20 dB under the voice and never ducked; silences gated to that room tone; −14 LUFS integrated.
- Voice: Kokoro `af_heart`, nine lines; numbers spelled out for TTS and written as digits in the subtitles.

## Palette & props

- Board 6,400 × 3,600 board px (16:9, so the final pull-back fills the frame); enamel `#F3F1EB`; wall `#8F8B83`; ink graphite `#23272E`, blue `#1F4FC8`, red `#D33A21`, water hatching `#5F86DA`, drafting grey `#6C727B`.
- Plan view (top left): river 1,240 px = 1,000 m between two blue banks with grey ground hatching; "1,000 米" above; crossing with seven graphite magnets; the top-down ship scaled to 500 px (about true scale); stamp "否决" (Noto Sans SC 900, pitted red). Rule "新规矩" red with an underline, "航道不立墩" graphite (LXGW Marker Gothic). The ruler: brushed steel with engraved graduations, a magnet at each end.
- Elevation (left two-thirds): projection lines dashed blue; four rows scaled so each main span is its record length at 1.24 px per metre (330, 600, 1,208, 2,023 m); each print pinned by two magnets; under each arrow end a label block: a name tag (Noto Sans SC 700, 78 px) and the number in blue marker (100 px), the tag placed by the number's measured width so they never touch. The side-view ship is 340 px long (about true scale) on a hand-drawn waterline. The cable-stayed bridge is a mirrored composite of a single-pylon photo and the suspension bridge's main span is stretched ×1.7 (see `demo/CREDITS`).
- Right third (never in shot before the reveal): four photo prints with magnets (suspension, cable-stayed, arch, and the side-view ship whose lettering was wiped), a source card ("数据来源"), two sticky notes with the sums (1,208 − 1,000 = 208; 2,023 ÷ 1,000 ≈ 2), a small navigation-clearance sketch without numbers, the verdict "船决定跨度" (400 px, "船" red) at the right middle with a leader from the circled 2,023, and the end card.
- Subtitles: frosted strip, Chinese Noto Sans SC 500 42 px over English Archivo 500 29 px, blue tick at left; every cue measured on one line per language (`tools/subcheck.mjs`).

## Title card

A printed card pinned at the bottom right of the wall from the start, seen only in the reveal: "船说了算", a red rule, "ENGINEERING / BRIEFING BOARD", "工程简报板", "LemoLab × Claude Opus 5.5". It is part of the final wall (the poster) and is on screen for the last three seconds. A second card, CREDITS, fades in on the empty middle of the wall at 36.9 s as the camera pulls back: the two CC BY photos (BAW, Russ) and the MuldjordKit drums, in mono at a size that reads in the whole-wall frame. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  index.html            the page: fonts, setScene / render / TEXTS / SUBCHECK / RESCHECK
  kit/board.js          the renderer (style engine)            kit/batch.mjs   stills from scene JSON
  kit/objects/          cut-outs + meta (anchors L/R for bridges, bow/stern for the ships)
  kit/tools/            prep_object.py, sky_key.py, mirror_span.py, stretch_span.py, redraw_stays.py,
                        redraw_suspension.py, repair_hangers.py, clean_lettering.py, ship_anchors.py,
                        make_print.py, rebuild_objects.sh; fetch_fonts.py, fetch_sources.py, kit_env.sh
  scenes/_gen_film.py   the film as data → scenes/film.json, audio/cues.json
  audio/lines.json      narration (Kokoro)          audio/mix.py   score, foley, voice, mix
  tools/                camcheck.mjs + camplot.py, rescheck.mjs, subcheck.mjs, cuecheck.py, rhythm_report.py, final_asr.py
  sources/              candidates/candidates.json (every photo looked at: URL, author, licence, evidence;
                        the six used ones with sha256); photos, masks and derived/ are downloaded or rebuilt
```

1. `sh demo/build.sh` (library set up with `setup.sh deps voice music`): fetches what git does not hold — fonts from Google Fonts (`fetch_fonts.py`: Archivo and IBM Plex Mono from github.com/google/fonts, the CJK subsets through the CSS API), the six photos from Commons (`fetch_sources.py`, ~470 MB), a private `demo/.venv` with onnxruntime and the BiRefNet model (`kit_env.sh`, ~970 MB unless cached), the voice model and the freepats / vsco2ce / vcsl samples — and cuts the objects again (`rebuild_objects.sh`); then speech check → scene → cue check → reading check → camera check (incl. judgement frames) → resolution check → events → render (960 frames, 5 workers) → mix → subtitles (+ one-line check) → mux (−14 LUFS, grain 1) → poster and styleframe → rhythm report → speech check on the final mix → camera plot.
2. Objects: `sh demo/kit/tools/rebuild_objects.sh` recreates every cut-out from the photos at their own resolution (BiRefNet masks are cached in `sources/masks/`; a recomputed mask can differ by a pixel or two from ours).
3. Stills and thumbnails: a scene JSON that `extends` `scenes/film.json` with its own `cam` and `t`, rendered by `node demo/kit/batch.mjs`.

Bridge-specific choices: each landing is met close on a pylon top, an arch rib, the hangers or a pier's foot; stays, main cables and hangers are redrawn as clean lines at the positions measured in the photos. Pitfalls tied to this demo: show each bridge whole in a held judgement frame, widening each time, with the voice and the verdict inside the hold: riding each dimension line close and never showing the cable-stayed or suspension bridge whole loses what is being tested. Pin every label block where the camera rests and frame each new row with the previous row's result: text first glimpsed during a move fails the reading check. Cut every object at full resolution and let `rescheck.mjs` cap each zoom: downscaled cut-outs get upsampled in the close-ups (a blocky ship). Measure and redraw stays and suspension cables, and continue the arch hangers to the deck: keyed stays turn into stair-steps and arch hangers vanish against the hills. Place name tags from the number's measured advance width: at a fixed offset they overlap the wider numbers. The stretched suspension photo allows z 1.38 at most, so its landing close-up is on the near tower, which is not stretched. The photographed suspension bridge has the proportions of a 500 m span; scaled uniformly to 2,023 m its towers would be far too tall, so only the main span is stretched. Remove lettering from the photos (here a road sign, a water-level gauge, a ship's name and container logos). Keep the pier clacks low: louder, they mask "piers" in the voice.
