# Color-Coded Mechanism — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Three Systems Keep the Time* 《三套系统走时》 (52.0 s) · `precise-mechanism.mp4` · source in [`demo/`](demo/)

A pocket watch with no battery is cut open. Its three systems (power, gear train, regulator) are dyed in the order energy flows; the camera follows the force through the gears to a 4,800× ratio; with the regulator pulled out the train races; the escapement drops back in and catches it; one tick, slowed to 1/40, is the answer. English narration, bilingual subtitles (Chinese line above, English line below). The movement is a simplified teaching movement with round tooth counts, not a real calibre; every number and its source is in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: a watch with no battery drifts only a few seconds a day; inside, a spring stores the power, gears multiply it, and the escapement lets it out half a tooth at a time, one tick per beat.

Arc: the hook (a ticking dial, "no battery", "How does it keep time?") → the opening (the dial is cut open, the grey movement inside) → the three systems dyed one by one while the camera follows the force → the comparison (4,800×, from 1 turn in 8 h to 1 turn in 6 s) → the turn (exploded by system, the regulator lifted away, the seconds wheel races to 60 rpm; the layers land, the pallet fork last, and everything stops dead) → the climax (the escapement close up, slowed to 1/40, the music gone, one tick) → the ending (pull out, dial and case come back with the cut kept: *One tick at a time.*).

Native moves spent: *section with hatching* on the dial and the barrel; *dye by system* for the three systems; *follow the force* along the train; *explode by system, remove one layer* for the turn; *true slow motion of one contact* for the climax; *whole object, still cut open* for the ending.

## Shots

Four continuous camera moves joined by a hard cut (18.9 s) and a match cut on the lock (33.0 s). Times in seconds.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–6.6 | the small-seconds dial ticking at real speed; the whole pocket watch; "How does it keep time?" | fast pull-back (0–1.4 s), then a slow orbit | real time: ticks at 5 a second under the dial |
| 2 | 6.6–11.0 | a 150° wedge cuts dial and case open (7.0 s), the grey movement inside; "Three systems."; the dial lifts up, the case drops away (9.7 s) | orbit, then crane down through the cut | section with hatching; time slows to ¼ (6.6–8.2 s) |
| 3 | 11.0–13.8 | the barrel cover is cut (11.3 s), yellow spreads from the arbor; label *Power · 1 turn every 8 h* | low, close on the barrel | dye by system |
| 4 | 13.8–18.9 | skimming over the wheel tops; green passes wheel by wheel (14.2 / 15.0 / 15.8 s), violet at the escapement and balance (16.2 s); labels *Gear train*, *Regulator* | low tracking shot from barrel to balance | follow the force |
| 5 | 18.9–23.8 | the whole movement from above; **4,800×** with *barrel 1 turn / 8 h* and *escape wheel 1 turn / 6 s*, held 4 s | hard cut on the beat, near-locked overhead | the comparison frame |
| 6 | 23.8–33.0 | exploded by system, bridges first; regulator lifted, the seconds wheel races (*60 rpm, normally 1*); layers land 28.95 / 29.25 / 29.55 s, the fork last: everything stops; the escape wheel turns accent red | crane out to the side, slow orbit, follow the landing, push toward the escapement | explode by system, remove one layer |
| 7 | 33.0–42.2 | escapement close-up; label *Balance · 5 beats/s · 18,000/h*; speed down to 1/40 (37.2–38.4 s), music out, the tick at 39.2 s; back to ¼ | match cut on the lock, slow orbit, push-in through the slow motion | true slow motion of one contact |
| 8 | 42.2–52.0 | pull out; dial descends, case rises (42.5–44.0 s), cut kept; *One tick at a time.* (45.2 s); the title block (47.75 s) | big pull-out and rise, near-still for the last 6 s | whole object, still cut open |

Narration (Kokoro `bm_george`, speed 0.88), starts: 0.8, 3.7, 7.45, 11.6, 14.8, 19.75, 25.0, 29.6, 34.15, 39.6, 43.4 s; at least 0.75 s between lines so every subtitle holds to speech + 0.6 s.

## Score structure

150 bpm, 4/4 (bar 1.6 s), D major. The watch's real beat (5 per second) is an eighth note; at ¼ speed a tick lands every 0.8 s.

- 0–6.4 s: harp quarter notes over the fast real-time ticks.
- 6.4–24 s: harp broken chords in eighths, cello pizzicato on beats 1 and 3, chords D | Bm | G | A every two bars; each part sounds one note as it takes its colour (marimba for the train, glockenspiel for the regulator, vibraphone for the power).
- 18.9 s: vibraphone dyad and a low cello under the 4,800× frame.
- 25.4–29.55 s: violin tremolo swells with the free-running train and a gear buzz at the tooth rate; cut dead on the fork's clack, 0.45 s of nothing.
- 37.2–39.2 s: music silent; the tick at 39.2 s, then a glockenspiel note.
- 45.2 s: D add9 (harp strum, vibraphone, glockenspiel, cello); the harp thins under the title block, a last low chord rings to 52 s.
- Mix: voice compressed and set ~10 dB over the music by RMS, music ducked and cut 300 Hz–4 kHz under speech; transients limited so loudnorm reaches −14 LUFS with true peak ≈ −1.7 dB.

## Palette & props

- Ground `#F3F0EA`, neutral `#DDD8CF`, case floor `#E7E2D9`, dial `#FAF8F3`, ink `#25282D`; power `#E6B94F`, train `#79B09F`, regulator `#8A97D4`, accent `#E8472A` (the escape wheel from 29.55 s).
- The teaching movement (`demo/physics.js`): barrel 64, pinions 8 / 8 / 8 / 6, wheels 64 / 60 / 60, 15-tooth club escape wheel, 18,000 beats / h; ratio 4,800. Balance amplitude 321° at 72 % wind.
- The pocket watch: a case band around the centre wheel, a dial with 12 markers, small seconds on the fourth wheel, hour, minute and seconds hands driven by the same watch time, crown and bow at 12.

## End card

From 47.75 s to 52.0 s a drawing's title block draws itself in the bottom-left corner (ink rules, mono field names): **Title** *Three systems keep the time* · **Style** *Color-Coded Mechanism* 分色机械图解 · **Drawn by** `LemoLab × Claude Opus 5.5`. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```sh
sh styles/precise-mechanism/demo/build.sh                 # fonts if missing → voice + speech check → events → picture → sound → master → subtitles → poster
LIB=<clone with .venv, Kokoro model and sample packs> sh styles/precise-mechanism/demo/build.sh
node core/render/still.mjs styles/precise-mechanism/demo 39.2 --out /tmp/still   # one moment
node styles/precise-mechanism/demo/render_png.mjs         # the three style frames → demo/stills/frame_*.jpg
```

| File | What it does |
|---|---|
| `timeline.js` | shots, narration and subtitles, the speed curve, every cue, dye order, explode layers |
| `film.js` | movement and watch geometry, shader, cuts, motion, explode, camera keys, sound events |
| `film-outline.js` | outline pass with per-part normal materials (so the cuts clip there too) |
| `film-overlay.js`, `film.css`, `overlay.css` | text levels, labels and pins, the 4,800× frame, the title block, subtitles |
| `mix.py` | narration, foley (ticks, cuts, clacks, gear buzz), score, mix |
| `gears.js`, `physics.js` | gear profiles; the teaching train and its physics |
| `main.js`, `outline.js`, `overlay.js`, `render_png.mjs` | the three style frames (`index.html?f=1`, `2`, `3`) |
| `voice/lines.json` | the narration script (numbers spelled out for the voice) |

A full build takes about 5 minutes with 2 workers on an M-series Mac. Checks: `asr_check.py` on every line, `readcheck.mjs` (in `build.sh`), ebur128 on the final.
