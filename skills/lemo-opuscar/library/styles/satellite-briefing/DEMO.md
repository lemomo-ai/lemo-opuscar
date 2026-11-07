# Satellite Briefing — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Map Still Says Sea* 《地图上还写着海》 (37.8 s) · `satellite-briefing.mp4` · source in [`demo/`](demo/)

A satellite follows the map to a sea and finds a desert; the only part that came back is the part someone dammed. The Aral Sea, 1977–2025, on public-domain Landsat imagery. Chinese on screen, English narration, bilingual subtitles (Chinese line above, English line below). This is an unofficial film made from public-domain imagery; the U.S. Geological Survey and NASA did not make or endorse it.

## Story & structure

Logline: on the map it is still the Aral Sea; from orbit it is salt and sand; the one piece of it that returned, the North Aral, was kept by a 13 km dike.

Arc: a claim (a printed atlas page of the 1960 sea, its serif name 咸海) → the check (a dive into the map until it fills the frame, a scanner bar tears it away: salt crust, then silence) → the evidence (time rewound to 1977 and played forward in one locked frame, each year leaving its shoreline as a ring, the rings coming faster and faster) → the human scale (a range line from Muynak's old harbour to today's sea, 95 km) → the turn (silence, then water heard before it is seen, a whip pan north to the Kok-Aral dike, rings that grow outward, the water's true colour coming back) → the ending (the label 咸海 leaves the empty basin and pins itself to the North Aral; back to orbit).

Native moves spent: *the map against the photograph* at the reveal; *time rings in a locked frame* as the signature shot; *the range line* for the human scale; *colour returns where the story turns* for the North Aral; *the dive and the climb* as bookends; *the reticle becomes the frame* for the end card.

Measured values are labelled as measured on screen; every number and its source is in [`demo/FACTS.md`](demo/FACTS.md).

## Shots

One continuous take; framing changes by altitude. Times in seconds.

| # | Time | Shot | Camera | Native move / note |
|---|---|---|---|---|
| 1 | 0.0–1.8 | Earth's limb across the top, Central Asia below; a reticle searching, locks at 0.6; map layer on at 1.2 | oblique orbit (tilt 57°), lateral drift from frame 0 | the lock ping is the film's key sound |
| 2 | 1.8–5.4 | the sea's blue becomes a whole printed page as we fall into it: paper grain, a halftone in the ink, a fold, waterlines along the east coast, graticule, Amu Darya and Syr Darya, town dots, the serif name growing to the frame centre | dive, 3,800 → 160 km, tilt 55° → 0°, accelerate then brake; the coast stays in frame | the ground beneath drains to grey |
| 3 | 5.36–6.6 | a scanner bar sweeps down the frame and tears the page away (0.34 s): wind-streaked salt crust underneath, 咸海 left floating over it | settle 160 → 46 km | a 0.45 s suck-out before the tear; silence 1 from ~5.9 |
| 4 | 6.6–7.8 | five upward scans 2025 → 2014 → 2009 → 2000 → 1989 → 1977, a year counter steps back | climb 29 → 900 km, ease-out | first sound after silence: the rewind |
| 5 | 7.8–13.2 | **signature**: the whole sea, everything outside the old shore dimmed; six soft downward scans each print a shoreline ring (1977, 1989, 2000, 2009, 2014, 2025) at 1.8 / 1.2 / 0.9 / 0.6 / 0.9 s spacing; the lost band flashes; a light runs along the newest shore; reading 80 % → 7 % (dimmed while it rolls, bright when it lands) | nadir orbit: 980 → 600 km and 0° → −15° rotation on an accelerating curve (motion per second 1.2 → 3.9), braking in 0.3 s on the stop | the camera speeds up with the rings and stops with them |
| 6 | 13.2–15.3 | held breath: the 2025 ring breathes; from 14.1 a reticle searches and locks on Muynak's old port at 14.7 | pan that brings the port to the centre (588 → 520 km, rotation to −12°) | the lock ping answers the opening |
| 7 | 15.3–17.4 | the reticle holds the port through the push, the rest dimmed; 16.2 the port label with the ship horn; 16.5 the 1977 shoreline (measured) is drawn past the port, "1977 年岸线", the water lost since 1977 a faint wash | pure push on the port, 520 → 92 km, port at the centre | lands readable: the port at the old water's edge |
| 8 | 17.4–23.4 | 17.4–18.6 the port slides left to give the line room; 18.6–20.4 a 4 px range line grows from the port with 10 km ticks and numbers every 50 km, a reticle and a rolling "km" at its tip, the reading rolling in the right third; destination marked at 19.2; lands on "95" as the narrator says it; a lit corridor follows the line | the camera chases the tip from the port to the sea (lens shift −700 → +60 px), then pulls back 104 → 245 km to show the whole distance | local contrast raised for this range; silence 2, 21.9–22.8 |
| 9 | 23.4–24.0 | the ground streaks | whip pan north (~280 km in 0.6 s) with directional blur | the water was heard 0.6 s earlier |
| 10 | 24.0–28.8 | Kok-Aral dike traced (24.0–24.6, slam on "dam"); 2001 ring at 25.2; the 2009 water grows outward from the 2001 shore (25.3–26.4) and the 2009 ring stamps where it stops; only the North Aral's water regains true colour; a light runs along the new shore; reading +37 % | push 44 → 24 km with a 7° turn | water growing outward = the turn |
| 11 | 28.8–34.2 | north plate becomes 2025 under the climb; the label 咸海 slides from the empty basin and pins to the North Aral (30.6–31.2); colour returns everywhere | climb to orbit, tilt back to 50° | L-cut: the water fades under the climb |
| 12 | 34.2–37.8 | the lock brackets open into the end-card frame; one last satellite pass sweeps behind the title | Earth turns under a dimmed oblique orbit | end card |

## Score structure

100 BPM, 4/4; every key action on a beat or half-beat (`demo/tools/cuecheck.py`: 0 ms on 26 cues). D minor, turning to D major at the dam.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Orbit | 0–1.8 | D drone (pulse bass with 2nd/3rd harmonics), Dm pad, FM telemetry plucks in 8ths, orbit hum, radio hiss, data chatter | lock ping D6 at 0.6, map ping A5 at 1.2 |
| Dive | 1.8–4.95 | plucks to 16ths with the filter opening, hi-hat ticks, noise riser, gran cassa crescendo, rising tone, altitude-counter clicks | everything is sucked out 4.95–5.36 |
| Tear | 5.4 | the map torn away: bass drum, gran cassa, timpani, a fortissimo low-brass stab (trombones, tuba, horns, D minor), crash, a crackling paper rip swept with the scan bar | one of the three heaviest moments |
| Silence 1 | ~5.9–6.6 | thin wind; the tear decays into it | |
| Rewind | 6.6–7.8 | the last 1.8 s of the film's own soundtrack played backwards and speeding up, a reversed tam-tam, counter ticks | the turn into the signature shot |
| Rings | 7.8–13.2 | bass descends D–C–B♭–A–G with the chords Dm–C–B♭–A–Gm (two pad layers); tuba on each root, trombone on the fifth; a sub pulse on every beat, every half beat from 2000; ticks 8ths → 16ths; each ring: timpani on the root + bass drum + inharmonic metal ring + pen hiss; a reversed cymbal swells into a 0.24 s suck-out | acceleration by subdivision, not tempo |
| Stop | 13.2–15.3 | the slam (bass drum, timpani, gran cassa, gong, metal clang), then low D, bowed cymbal, thin drone | the loudest moment of the film |
| Muynak | 15.3–21.9 | distant ship horn (two detuned saws, long room) with a creak, timpani heartbeat every two beats, a low D/A drone whose filter opens with the range line, dry sand grains, ratchet ticks per 2 km (accent every 10 km), a hollow tock + ping when the reading lands | |
| Silence 2 | 21.9–22.8 | wind only | first sound after it: one lap of water at 22.8, before the picture turns north |
| North | 22.8–28.8 | whip crack and swish; a 0.22 s suck-out, then the dam slam (bass drum, timpani, knock, clash, low metal gate); D major: tuba, trombone, horns, a warm pad, bowed vibraphone, a cymbal swell that lands as the water arrives, glass-harp motif D5–A4–C♯5–F♯5–E5–D5 with echoes, vibraphone pulse; water bed | the only wet timbres in the film |
| Climb | 28.8–34.2 | horns D3/A3/F♯4, tuba, bowed vibraphone, D-major pad; the motif on glass and FM ping together (dry and wet united); light pulse | pin ping at 31.2 |
| End | 34.2–37.8 | low D hit, lock-ping echo, a soft sweep for the last pass, long tail | |

Mix (in `mix.py`): stem gains frozen (music 10 dB under the voice while it speaks and ducked about 5 dB, pulse −8 dB, foley −6 dB, beds −17 dB); bus compression on music, pulse, foley and beds only, so the hits keep their weight; a master stage (−14.4 LUFS, true-peak limiter at −4.6 dBTP on 4× oversampled peaks; AAC adds back about 3 dB). Sub-bass: a 38 Hz high-pass (46 Hz, 4th order on hits) and a −5 dB shelf below 62 Hz on everything but the voice; the impacts carry their weight at 60–120 Hz (`punch()`): 20–60 Hz sits 16 dB under the full band, as in the dataviz demo. The film measures −13.8 LUFS, true peak −1.6 dBTP, LRA 5.3 LU. `tools/impactcheck.py`: the hard stop is the loudest momentary moment of the film, the dam slam −0.5 dB and the map tear −2.6 dB under it (each among the loudest 4 s of the film), and they follow dips of −4, −3 and −14 dB. Silences sit about 20 dB under the program.

## Palette & props

- Ground: Landsat true colour at orbit; the analysis grade from #070B0E to #A1A7A9 with a fifth of the chroma.
- Marks #F2F5F6 with dark halos; the reading amber #FFBE55; the printed map: paper #ECE2CB, sea #8CB5DB, coast ink #1A3B6B, graticule in a faded red-brown, the serif name in #1F3F6B on the page and #D6EAFF over the sand.
- The North Aral water returns to a lifted true colour inside a 0.75° circle; nothing else in the analysis layer is coloured.
- Props: the printed map (Natural Earth historic-lake polygon as a distance field, rivers, two town dots), six measured shorelines (1977–2025), the North Aral rings (2001, 2009), the Kok-Aral dike traced on the 2025 image, the Muynak range line.
- Narrator: Kokoro `bf_emma`, speeds 0.9–1.0.

## End card

The lock brackets open from the North Aral into a frame on the left: 地图上还写着海 (Noto Serif SC, the map's voice), *The Map Still Says Sea*, a rule, `SATELLITE BRIEFING · 卫星简报`, `LemoLab × Claude Opus 5.5`, over the dimmed Earth turning; a last satellite pass sweeps down behind it. 3.6 s. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh          one command: voice → checks → events → video → mix → master → .srt → checks → poster
  index.html        two canvases (WebGL2 imagery, 2D marks), fonts
  film.js           render(t): camera keys, plate/scan state, every mark, readouts, subtitles, end card, EV
  engine.js         camera, project/unproject, plate shader (grade, soft scans, growth, printed map, water colour, whip blur)
  overlay.js        hairlines, brackets, readouts, transcript strip, text registry for readcheck
  timeline.js       beats, cues, ring schedule, narration (single source; tools/export.mjs → timeline.json, cues.json, voice/lines.json)
  mix.py            score, foley, beds, voice, mix → out/mix.wav + out/stems/
  tools/            fetch_landsat.py, fetch_gibs.py, plates.py, bmng.py, vectors.py, mapfield.py, growth.py, fonts.py (data); lowcheck.py (sub-bass share);
                    export.mjs, voicefix.py (voice); cuecheck.py, subcheck.mjs, motioncheck.py, audiocheck.py, impactcheck.py, finalasr.py (checks)
  assets/           plates/ (JPEG plates, water masks, mapfield.png, ko_grow.png, plates.json), vectors.json, raw/ (downloads + manifest.jsonl)
  FACTS.md, CREDITS, stills/styleframe.jpg
```

- `sh demo/build.sh` takes about 2 minutes on Apple silicon (the picture renders in ~20 s with 3 workers). In a fresh clone the plates, raw scenes and fonts are not in git: the first run fetches and rebuilds the imagery (~25 minutes, ~3.5 GB in `assets/raw/`) and downloads the fonts (`tools/fonts.py`: Barlow Condensed and IBM Plex Mono from github.com/google/fonts, Noto SC subsets); `FETCH=1` forces it again. The score needs `sh tools/fetch.sh instruments <lib>` for vsco2ce, vcsl and freepats, the voice `setup.sh deps voice`.
- Checks it runs: `asr_check.py` with `small.en` (the base model hears "sea" as "C"), cue grid, subtitle single-line widths measured with the real fonts (widest line 578 px against 1100 px), `readcheck.mjs`, motion per second (no stretch over 1 s below 0.6 mean pixel change; the slowest second of the film is 1.06), the impact ranking.
- Plates: region mosaics 3917 × 2652 at ~190 m for six years; detail plates at ~32–40 m for the landing, Muynak and Kok-Aral; Blue Marble world (4096 × 2048) and Central Asia. All sampled in one shader pass; memory about 1 GB of textures per render worker.
- Demo-specific pitfalls: the 1977 Landsat 2 mosaic needs nearest-neighbour resampling, dropout-row repair, streak cleaning at 12° on land and one L1GS scene to close a hole in the north-west bay; the 1989 scene of path 161 on 16 August carries a dust plume across the sea and is excluded (`exclude` in `tools/plates_spec.json`); a dike-bounded polder 10–15 km west of Muynak has a straight edge that can read as a seam: it is dimmed while the port is centred and slides out of frame before the range line; the water masks need contour pieces along plate borders removed or a straight line appears in the North Aral; the map carries no place names other than 咸海, because a dive gives them less than the reading time they need.
- Kokoro adds a breathy syllable after "Someone kept it."; `tools/voicefix.py` trims it before the speech check.
