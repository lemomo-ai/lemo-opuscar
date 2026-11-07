# Crayon Picture Book — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Moon Can't Sleep* (52 s) · `crayon-book.mp4` · source in [`demo/`](demo/)


## Story & structure

A bedtime story on one page: the moon can't sleep; she tries counting sheep and fails; a girl at a lit window sees her, climbs a ladder that draws itself rung by rung, and a sweep of watercolour reveals the stars that were drawn in white crayon all along. The moon is tucked in under a quilt; the camera pulls back to the book on a table and turns the page to "The End".

The demo follows the rule "the act of drawing and colouring is the plot" and spends all six native moves, with the strongest (wax resist) at the emotional peak: the 250 white-wax stars are on the page from the first frame and are uncovered by the wash on the song.

Arc (45–55 s): blank page → a character is drawn and wakes up (hook in 3 s) → a small comic problem (failed sheep count) → a second character (the girl) → a small brave act (the ladder) → the wash reveal on the song (peak, no narration) → everyone sleeps → pull back to the book, page turn.

How the native moves map onto this story:

| Native move | How the demo used it |
|---|---|
| **Wax resist** | Hid the payoff (the stars) in plain sight from the first frame; a sweep of watercolour uncovered it at the climax. |
| **Drawn live** | Opened on a blank page; the ladder grew rungs under the girl's hands. |
| **Colouring is an action** | Pulling up a blanket = scribbling a quilt over the moon; night falling = the wash. |
| **Boil** | Calmed to half amplitude when the story went to sleep. |
| **Child logic** | A face on the moon; numbers written in the sky while counting sheep. |
| **It is a book** | Ended by pulling back to the physical book on a table, the crayons beside it, and turning to "The End". A one-take film over one page is explained by that reveal. |

Adaptation examples (a product drawn in outline and a wash revealing the hidden feature; a history page coloured in event by event; a thank-you film with names in white crayon) are the "Fits content like" lines in STYLE.md §8.

## Shots

One continuous camera over one page (world 3200×1800; full page = scale 0.6).

| Beat | Camera |
|---|---|
| Opening | Locked full page, flat: the audience sees the paper before anything is drawn |
| Title leaves | Push toward the moon instead of fading the title (you can't fade crayon) |
| Comic beat | Locked medium close-up; substitution poses do the comedy (tossing = a scrunched face rotated 35°, on the beat) |
| Discovery | Tilt along the moon's gaze (the camera *is* the moon looking down) |
| Two-shot | The moon peeking in from the frame edge, the girl small in a lit window |
| Brave act | Tight follow tilt; the ladder draws itself just ahead of her; climbing alternates two key drawings per rung |
| Wash reveal | **Held wide.** The brush and the music do the motion. Small figure, huge sky |
| Resolution | Slow push-in on the moon falling asleep, then tilt to the girl |
| Ending | Pull out until the page becomes a book on a table; page turn; glide onto "The End" |

Why this route, for this story: a bedtime story wants one uninterrupted page; the locked blank page put paper before drawing; the held wide at the reveal let the material be the motion; the pull-back explained the one-take. Each of these is one choice from STYLE.md §6, not the style's default.

Sleep grammar used on the moon: eyelids come down as yellow scribbles, a nightcap is drawn on, a quilt is coloured up from below with the folded edge appearing first, a tiny hand tucks it in.

## Score structure

Music first, in **3/4 at 72 BPM** (bar = 2.5 s). Music box (lead), toy piano (comic waltz, one note per sheep / per rung), flute as the singing voice, clarinet for bass and humour, glockenspiel for every star the wash uncovers (driven by `glint` events). No strings, no grand piano. The lullaby theme appears in full exactly once, at the wash; the opening music-box motif is its first phrase. It ends with the music box **winding down** (ritardando + slight pitch droop).

Silences: a full beat of silence after the failed sheep count; a 0.3 s breath before the song.

Foley specific to this film: sheep landing = felt puff; tossing = blanket swish; page turn = lift / whoosh / flap. Night = very faint crickets; the desk = warm room tone and a distant clock.

Mix: music −7 dB under narration, +4 dB for the wordless song; music-box and glockenspiel stems +3 dB with a gentle 3–7 kHz lift.

Voice: Kokoro `af_heart`, speed 0.86–0.90 (not `bf_emma`, which reads too bright and hard), 6–8 short lines. Chain: high-pass 75 Hz → **compress first** (thr 0.2, 2.5:1, 8 ms / 140 ms) → low shelf +1.5 dB @220 Hz, −2 dB dip @3.2 kHz, **high shelf −4 dB @6 kHz** → split-band de-esser (4.8–10 kHz, 4:1) → per-line RMS match → warm near-field reverb (12 ms pre-delay, early reflections, 0.7 s low-passed tail, wet ~−17 dB). Music ducks ~7 dB and foley ~4 dB under it; voice ~7–10 dB over the bed. Avoid "Goodnight, Moon", a famous-book phrase ("Night, night." instead).

## Palette & props

- Paper `#f4efe3`; tooth octaves 1.35 / 2.9 / 6.3 px plus fibre term (x/10, y/1.9), contrast `smoothstep(.16,.86)`; emboss strength ~0.55.
- Wax threshold `tooth > 1 − 1.22·pressure` (soft edge ±0.07); darkening ×(1−0.1·p²).
- Outline wobble ~1.7 px; outline width ~7 px on characters, 8 px on buildings, 4–5 px for refined objects. Hatching gap ~10.5 px, width ~11 px, pressure 0.72–1.14×, overshoot 0–7 px; cross-hatch at 40–50 %.
- Boil: offset ±0.8 px, wobble ±0.9 px; background lines ×0.6; after the characters fall asleep ×0.5.
- **12 crayons**: ink/indigo `#2d3263` (all outlines), yellow `#f5c63c`, orange `#ec8a3c`, red `#d4483c`, pink `#ee8ea4`, peach `#f4c7a4`, brown `#7a4b31`, ochre `#e7b867`, green `#62a24c`, sky `#79acd9`, violet `#6a5aa6`, white `#fbfaf4` (wax resist). One watercolour: ultramarine, transmission `(0.15, 0.19, 0.44)`. Wash resist `density × (1 − 0.93·smoothstep(.12,.55, waxCoverage))`.
- The girl: ≈2.6 heads tall, scalloped fringe, a yellow star hair-clip that echoes the stars. The moon: big eyes, eyelids, eye-bags, nightcap, patchwork quilt. The sheep. The house (gable + slanted side wall + big roof), a round tree with red dots, the ladder, 250 white-wax stars, 3 wash bands.

## End card

Title: hand-lettered on the page in two lines in a corner (Gaegu Bold), written on letter by letter while the colours are scribbled in. Subtitles: Patrick Hand 54 px, indigo crayon.

End card: the next page of the book — "The End" (Gaegu Bold), a small crescent doodle, the style name and credit in Patrick Hand. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/crayon-book/demo/
  gl.js      WebGL2 compositor: paper, wax adhesion, knock-out, watercolour + resist, image pass, final emboss/vignette/lamp
  crayon.js  stroke engine: line (ribbons, taper, streaks, boil), fill (zig-zag hatching, overshoot), text, shapes
  rig.js     parts with occlusion + knock-out, limb tubes, curves
  chars.js   the girl (views × expressions × poses), the sheep, the moon (expressions, nightcap, quilt, crescent face)
  world.js   the page: house, tree, grass, ladder, 250 white-wax stars, 3 wash bands
  film.js    timeline, one-take camera, events, subtitles     end.js  book on a crayon desk, page turn, The End
  sheet.js   model sheets (?test=model&page=girl|moon)        lines.json, mix.py, music/score.py, build.sh
```

1. `node core/render/still.mjs styles/crayon-book/demo 0.5 --q 'test=model&page=girl'` — model sheet first; iterate the character before any shot.
2. `core/tts/tts.py lines.json voices` → `asr_check.py` until all OK.
3. Build the timeline in `film.js`; review with `still.mjs --range 0.5:51.5:1` + `sheet.py` (two rounds minimum).
4. `node core/render/events.mjs` → `music/score.py` (cues on the 72 BPM grid, glockenspiel from `glint` events) → `mix.py`.
5. `node core/render/video.mjs styles/crayon-book/demo --fps 24 --workers 3` (1248 frames ≈ 80 s on an M-series Mac).
6. `CRF=26 sh demo/tools/mux.sh out/video24.mp4 mix.wav crayon-book.mp4 24 0` — no added grain (the paper is the grain); the local mux copy exposes CRF. `demo/build.sh` runs the whole chain from TTS to the finished film.

File size: anchor the tooth, don't boil background fills, add no extra grain and use CRF 26: the film is 74 MB with no visible loss (screen-fixed tooth makes it 190 MB).

Pitfalls tied to this demo's props:

- **White gaps between wash bands** and a sky that stops above the ground: the last band must reach down to the grass line; sky exists wherever there is paper.
- **Walls coloured at light pressure turn muddy blue under the wash.**
- **Titles and numbers written in the sky survive the wash** (the counted sheep numbers): put the title in a corner the wide shot won't show.
- **Outlines drawn over the girl's hair read as a headband.** Leave them off.
- **A blanket drawn as a flat violet half reads as the moon's dark side.** It needs quilt features: patchwork squares, stitch lines, star appliqués, a light turned-down edge, a draped hem that spills past the disc, and a hand that pulls it up.
- **Double vignette/emboss at the book transition**: the desk's vignette, emboss and lamp light ramp in from 0.
- **The heroine disappears into the night** when the wash sinks into her colouring gaps: composite her after the wash.
