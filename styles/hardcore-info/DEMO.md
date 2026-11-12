# Line-Art Cutaway — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Where Is Your Phone's Antenna?* 《你手机的天线在哪》 (52 s) · `hardcore-info.mp4` · `hardcore-info.srt` · source in [`demo/`](demo/)

## Story & structure

**Logline.** In 2010 a new phone lost signal when held by the bottom corner; taken apart, its metal frame turns out to be the antenna, cut into pieces your hand can bridge, and phones learned to switch to the piece you are not covering. "You're not holding it wrong. You are holding the antenna."

A mystery told from the symptom backwards, each part answering the question the last one left:

1. **Symptom** (0–10 s): a line-drawn hand grips the phone, the signal bars drop, the question appears.
2. **Answer** (10–14 s): the hand lets go, the bottom of the frame floods with the accent: the edge is the antenna.
3. **How the signal gets there** (14–19 s): the phone tips over and comes apart; the accent runs from the RF chip along the coax and the feed clip into the frame.
4. **Why the ring is cut** (19–23.8 s): the other layers sink away; the camera dives into a plastic slit.
5. **How long each piece is** (23.8–34.8 s): top-down view, a magnifier cross-section of the slit, four numbered pieces, two quarter-wave rulers at model scale.
6. **The grip** (34.8–40.9 s): the phone closes and stands up, the hand grips the slit again, the accent drains back.
7. **The fix** (40.9–46.1 s): the top piece lights up and the signal comes back.
8. **Ending and title block** (46.1–52 s): the closing line, a light runs once around the whole frame, the title block is drawn.

The model phone uses a published outline (150.5 × 70.8 × 8.9 mm); its inside is illustrative and says so on screen. Facts and sources: [`demo/FACTS.md`](demo/FACTS.md).

## Shots

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–10.0 | Upright phone cut out by a sweeping section plane; "2010"; a hand closes on the bottom corner; label BOTTOM CORNER with signal bars 5 → 1; WHERE IS YOUR PHONE'S ANTENNA? | slow push, phone kept whole in the right third | section sweep, diagrammatic hand |
| 2 | 10.0–14.2 | Hand withdraws; accent floods the bottom piece from its feed; arcs; THE EDGE IS THE ANTENNA. with a leader | orbit to below the phone | one-colour path (end part) |
| 3 | 14.2–18.9 | Phone tips flat, layers lift on the beat with dashed guides; pulse on the RF chip; accent travels; labels RF CHIP, COAX CABLE, FEED CLIP appear as the head reaches them | tip-over + crane up, then track the head | lift on the beat, one-colour path |
| 4 | 18.9–23.8 | Other layers sink out; label PLASTIC SLIT; push into the slit until its hatch fills the frame | orbit to the outer side, continuous dive | dive through a gap (first cut at 23.8 s, between two sentences) |
| 5 | 23.8–34.8 | Circle opens at the same slit into a top-down view; the circle becomes a magnifier with a cut through the slit; four slits marked, four pieces numbered (① in accent); rulers 700 MHz ¼ λ ≈ 107 mm and 3.5 GHz ¼ λ ≈ 21 mm, both held 2.6 s | locked top-down, slight drift | magnifier cross-section, ruler at model scale |
| 6 | 34.8–40.9 | Layers return with clicks, phone stands up; hand grips; HAND BRIDGES THE SLIT with signal bars; accent drains | crane down, then a side close-up on the fingers over the slit | path turning off |
| 7 | 40.9–46.1 | Top piece floods; arcs at the top; SWITCHED TO THE TOP ANTENNA, bars back to 5 | tilt up to the top | the path relit elsewhere |
| 8 | 46.1–52.0 | YOU'RE NOT HOLDING IT WRONG. / YOU'RE HOLDING THE ANTENNA. / 你握着的，就是天线。; a light runs around the frame; title block | pull back, slow orbit | ring light, title block |

Text in the demo: one question, one answer and one closing statement, all in the same left column; part labels only while their part is the subject; subtitles bottom-left.

## Score structure

- 96 bpm, A minor turning to A major; vibraphone (hard mallets) arpeggios, glockenspiel, harp sweeps, jazz bass and contrabass pizzicato, bowed vibraphone pads, a quiet plotter tick in sixteenths.
- 0–7.5 sparse beats → 7.5 three falling glockenspiel notes as the signal drops, near-silence to 10.9 → harp sweep in A major as the edge lights → eighth-note arpeggios through the teardown → bass eighths and a climbing glockenspiel during the dive, landing at the cut (23.8) with pizzicato, glockenspiel and harp → calm F–Em–Dm–C bars under the rulers → G bar as the phone closes → near-silence 38.1–42.7 while the hand grips → A major harp + glockenspiel at the switch → D–E–A cadence, bowed pad under the title block, one glockenspiel note as the sign-off lands, decaying to 52 s.
- Narration: Kokoro `bm_george`, speed 0.9, ten lines, gaps ≥ 0.6 s; voice +10 dB over the bed by RMS, music dips 300 Hz–4 kHz, the dive's hiss stays under the voice and swells only after sentence 5. −14 LUFS, true peak ≤ −1 dBTP.

## Palette & props

- Paper #F6F5F0 with a 40 px grid; ink #141414; graphite #5A5955; accent #FF4D1A only for the antenna path (RF trace, coax, feed clip, the bottom and later the top frame piece, their leaders and arcs, one word per title).
- The phone: display, aluminium frame with four plastic slits, logic board with shields, connectors and about 800 seeded small parts, battery with its printed label, charging coil, back glass with camera bar, all in millimetres.
- The hand: tapered phalanges with knuckle lines and nails, thumb wrapping the other edge, palm behind the phone, wrist fading out of frame.

## End card

From 48.1 s an engineering title block is ruled below the closing line, cell by cell: TITLE — WHERE IS YOUR PHONE'S ANTENNA? 你手机的天线在哪; STYLE — LINE-ART CUTAWAY 线稿剖面图解; BY — LemoLab × Claude Opus 5.5. Complete at 49.44 s, held to 52 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```sh
sh styles/hardcore-info/demo/build.sh          # from the library root; WORKERS=2 by default
```

A clean clone first fetches what it is missing: the Kokoro voice model (`sh tools/fetch.sh voice`) and the VCSL, VSCO 2 CE and Karoryfer sample libraries (`sh tools/fetch.sh instruments vcsl`, `… vsco2ce`, `… karoryfer`). Order: fonts (downloaded if missing) → `tools/timeline.py` (narration starts and bilingual subtitles → `timeline.json`) → Noto Sans SC subset if missing → `tools/voice.sh` if the WAVs are missing (Kokoro, a 40 ms tail trim on line 10 where Kokoro adds a breath that Whisper hears as "antennas", then `asr_check.py`) → `events.mjs` → `video.mjs` (1248 frames) → `mix.py` → `mux.sh` → `tools/srt.py` → `tools/poster.mjs` (17.4 s).

| File | What it holds |
|---|---|
| `demo/main.js` | model, hand, line shader, cameras (two tracks: a 23.8 s long take, then the top-down and the close), all labels, subtitles, the title block; `window.TEXTS` for `readcheck.mjs` |
| `demo/timeline.json` | narration starts and subtitles, read by the page, `mix.py` and `srt.py` |
| `demo/mix.py` | narration, score, foley; `mix.py <from> <to> <out.wav>` cuts any segment |
| `demo/voice/` | `lines.json`, `dur.json`, `words.json` (word times used to place hits) |
| `demo/tools/` | `timeline.py`, `srt.py`, `poster.mjs`, `voice.sh`, `zh_subset.sh` |
| `demo/FACTS.md`, `demo/CREDITS` | sources of every fact; fonts, samples, voice |

Render: about 1 minute for 1248 frames with 2 workers on Apple silicon (8 jitters at 2× per frame). A single frame: `node core/render/still.mjs styles/hardcore-info/demo 30.5 --q 'from=0&to=52'`.
