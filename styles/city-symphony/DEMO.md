# City Symphony — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

**"One Day in New York" (纽约的一天)**, 52 s, 1920×1080 at 30 fps, 1.85:1 matte inside the frame, no voice, original score. An unofficial film made from real footage and records: CC BY time-lapses, street footage and aerials from Wikimedia Commons and Flickr (each with a passed licence review or a source page that still shows the licence), U.S. Marine Corps Fleet Week footage (public domain, DVIDS), a public-domain Edison film of 1899 from the Library of Congress, a NASA photograph from the International Space Station, Carol M. Highsmith's public-domain photographs (Library of Congress) and a scan of Walt Whitman's *Leaves of Grass* (1860, Internet Archive). No person or institution in it endorses the film. Facts: [`demo/FACTS.md`](demo/FACTS.md). Assets: [`demo/CREDITS`](demo/CREDITS), [`demo/SOURCES.md`](demo/SOURCES.md).

## Story & structure

From orbit, Manhattan is a grid of orange light. The film falls into it and watches the city wake: one camera on a 36th floor turns night into dawn in two seconds, a station clock cuts to a bigger clock, a corridor speeds out of real time, and the crowd in a station hall turns into tracks of light. At noon the population locks into place digit by digit, then the screen splits into a grid that fills with the city on the sixteenth notes — and everything stops. A soap bubble drifts in slow motion. On a split screen a train crosses the Brooklyn Bridge in 1899 beside the same towers today, with the bridge's daily traffic. In a long exposure of Grand Central, people are only ghosts. The pulse comes back; dusk, one-second nightfall, day and night flickering, Times Square from above and at street level with the number of people who walk into it each day; the whole day flashes back in reverse and the film cuts to black on the bar line. A page of Whitman lights up on *Just as any of you is one of a living crowd, I was one of a crowd*; then the same 36th-floor camera watches the next dawn come up under the line's last words, and the end card settles over it.

Structure (chosen over a "clock face" structure and a "people vs machines" structure): four movements following the score — night to morning, noon and the grid, the brake, dusk to the hard stop — then the coda.

## Shots

120 BPM, bar = 2 s, first beat at 0.0. All times come from `bar(n, beat)` in `demo/tools/timeline.py`.

| Time (s) | Bar.beat | Shot | Speed / treatment | Text |
|---|---|---|---|---|
| 0.0–4.0 | 0–1 | ISS047 night photo of New York | falling push 1.0 → 1.3 in 0.35 s, then accelerating to ×2 | 纽约的一天 / ONE DAY IN NEW YORK |
| 4.0–6.0 | 2 | Schwab 36th-floor camera, night → dawn | 40×, blend 30 (light river) | day ring appears |
| 6.0–7.0 | 3 | aerial, Bethesda Terrace in Central Park, early morning | 3× | |
| 7.0–7.5 | 3.2 | Grand Central clock (video) | 1× | |
| 7.5–8.0 | 3.3 | Grand Central clock (Highsmith photo) | punch-in match cut | |
| 8.0–9.0 | 4 | Oculus corridor | ramp 1× → 6× | |
| 9.0–10.0 | 4.2 | straight down on Central Park West, a street full of people | 2× | |
| 10.0–12.0 | 5 | Oculus hall | 2.1×; crowd → sodium tracks | |
| 12.0–14.0 | 6 | street, a tunnel drive, Fifth Avenue, the N train over the Manhattan Bridge (1 beat each) | 2–3× | |
| 14.0–16.0 | 7 | 8 shots, half a beat each (Lower Manhattan from the water, the Park Avenue Viaduct, the Rockefeller Center flags, a tower from below among them) | 1.2–3× | |
| 16.0–20.0 | 8–9 | Schwab camera, noon clouds | 37.5×, blend 24 | **8,804,190** locks on sixteenths |
| 20.0–24.0 | 10–11 | the grid: 1×2 → 2×2 → 3×3 → 4×4, each stage re-tiling over the last in 0.3 s; last beat re-cuts every sixteenth | pool of 16 one-second clips | |
| 24.0–27.0 | 12–13.2 | giant soap bubble, Washington Square | ramp 2.2× → 0.3×, motion-compensated | ring freezes, dims |
| 27.0–31.0 | 13.2–15.2 | split: 1899 train on the Brooklyn Bridge \| the towers today | 0.75× / 0.72×, frame crossfade | 1899; **103,051 / 28,845 / 5,504** a day |
| 31.0–32.0 | 15.2 | Highsmith long exposure of Grand Central (people as ghosts) | slow push | |
| 32.0–33.0 | 16 | Brooklyn Bridge at sunset | 3× | |
| 33.0–34.0 | 16.2 | ferry skyline, an empty street under a pink sunset | 2–3× | |
| 34.0–35.0 | 17 | Schwab camera, one-second nightfall | 75×, blend 30 | |
| 35.0–35.5 | 17.2 | day/night flicker, same camera | 2-frame alternation | |
| 35.5–36.0 | 17.3 | Times Square photo pair | 2-frame alternation | |
| 36.0–40.0 | 18–19 | looking down on 42nd Street at Times Square (time-lapse, ramp 1× → 7×), the TKTS steps at night, the same street at 5× (traffic → light), Times Square from above at night, the steps again | 3–7×, blend up to 7 | **≈220,000** people a day |
| 40.0–42.0 | 20 | the day in reverse: 8 cuts × 4 frames, 14 × 2 frames | | ring spins backwards |
| 42.0 | 21 | hard stop | dry cut | |
| 42.3–43.25 | 21.0.6 | *Leaves of Grass* (1860) p. 380, reading light on the line | | |
| 43.25–47.25 | 21.2.5 | Schwab camera, the next dawn (night → blue → morning) | 8×, blend 8, slow push | 我也曾在人群里。/ …I WAS ONE OF A CROWD, / source |
| 47.25–52.0 | 23.2.5 | the same shot, darkened to 22 % | | end card |

## Score structure

`demo/tools/music.py`, sampled instruments (CC0): organ (full, soft, pedal), flute and clarinet staccato, strings, horns, bass drum, suspended cymbal, glockenspiel, bowed vibraphone.

| Bars | Time | Harmony | Texture |
|---|---|---|---|
| 0–3 | 0–8 | Cm · A♭ · Fm · G | full-organ hit + bass drum; eighth-note arpeggio; cellos from bar 2 |
| 4–7 | 8–16 | Cm · A♭ · E♭ · B♭ | triplets over eighths (clarinet); violins bar 6; flute sixteenths bar 7 |
| 8–9 | 16–20 | A♭ · Fm | hit; held violins and cellos under the long noon shot; 7 glockenspiel notes = 7 digits locking |
| 10–11 | 20–24 | D♭ · G | sixteenths, full ensemble, cymbal crescendo; dry cut at 24.0 |
| 12–13.2 | 24–27 | A♭maj7 | arpeggios stop: one held chord, cello, high violin, bowed vibraphone |
| 13.2–15.2 | 27–31 | Fm9 | held chord, double bass, a three-note flute line; three glockenspiel notes as the counters land |
| 15.2–16 | 31–32 | — | the pulse returns, soft sixteenths, cymbal crescendo |
| 16–20 | 32–42 | Cm · A♭ · Fm · G · Cm | hit; eighths → triplets → sixteenths; horns bars 19–20; bass-drum roll; dry cut at 42.0 |
| — | 42.3 | C pedal | one breath under the page |
| — | 43.25 | A♭(add9)/C | soft organ and violins under the quote |
| — | 47.25–52 | Fm9/A♭ | the last chord lands on the end card; the opening figure returns in quarter notes, fading; unresolved |

## Palette & props

Warm white `#EDE8DF`, secondary `#B0AAA0`, sodium orange `#D9772F` (rules, source lines, crowd tracks, day-ring hand). Fonts Michroma and Noto Sans SC (OFL). Props: the day ring (graphic, not a clock reading), three number cards, the year label, the page.

## End card

Held 4.75 s over the last shot (darkened to 22 %, still moving), left-aligned, in this order: 纽约的一天 ONE DAY IN NEW YORK (one line) · a sodium rule · 延时交响 TIME-LAPSE SYMPHONY · LemoLab × Claude Opus 5.5 · footage credits: a header line with both licences (CC BY 3.0 and CC BY 2.0), their links and the changes made, then every CC BY work with author, full title and licence (two to a line), then the public-domain sources. The credit lines are fine print (16 px): they are written in full and legible but are not reported to `readcheck` (title, style name and sign-off are). The "LemoLab × Claude Opus 5.5" line belongs to this library demo only; a user's film carries no LemoLab credit and no watermark.

## Build notes

- One command: `sh demo/build.sh` (fetches the sources listed in `demo/SOURCES.jsonl` and the fonts if missing, ≈ 1 GB).
- `tools/timeline.py` — beats and section times (the only time source). `tools/shots.py` — shot list, clip specs, grid stages, flashback list. `tools/prep.py` — retiming engine (speed curves, frame blending, ramps, slow motion) → `work/clips/`. `tools/music.py` — score. `tools/render.py` — compositing, grade, grid, split, tracks, type, grain; `--still t out.jpg …` for review frames (`tools/stills.sh`). `tools/used.py` — writes usage spans into `SOURCES.jsonl` / `SOURCES.md`.
- Footage search and logging: `tools/footage.py`, `tools/s.sh`, `tools/f.sh`, `tools/seg.py` (excerpts of long Commons files), `tools/peek.py` (remote contact sheet), `tools/secsheet.py` (per-second sheet), `tools/cat.py` (lists the files or subcategories of a Commons category), `tools/info.py` (prints size, licence, author and video derivatives of Commons files), `tools/pdfpage.py` (previews or fetches single pages of a Commons PDF/DjVu, e.g. a scanned book page).
- `index.html` + `texts.json` expose the on-screen text to `core/render/readcheck.mjs`; `cues.json` → `city-symphony.srt` (on-screen text only; the film has no voice).
- Checks: `readcheck.mjs` passes; `mux.sh` −14 LUFS, no warning. No `asr_check` (no voice).
