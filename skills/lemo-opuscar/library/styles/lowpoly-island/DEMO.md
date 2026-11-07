# Low-poly Isometric Island — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Island That Grew* (53 s) · `lowpoly-island.mp4` · source in [`demo/`](demo/)


## Story & structure

An empty sea with only a buoy that knows one note; tiles, trees and houses rise from the sea one by one, each landing with a note, so the island and its song are written together — until at night the boat that went out cannot find its way home, and the last "note" is a lighthouse.

The film's shape: **a small world that grows, lives through a day, and meets one problem that the final piece solves** — one subject (an island), one goal (to become a home), one turn (night falls, the boat is lost). It is only this film's shape, not the way to adapt any topic.

Emotional arc (53 s): emptiness → first note → accelerating joy of building → a lived-in day → dusk warmth → silent night with one thing missing → the final piece ignites (climax) → pull back to scale, with an echo of the opening.

Native powers spent: procedural growth (the whole first act), the orthographic gaze (the final ×25 zoom), turntable (the growth shot), flat shading × light (the day time-lapse), emissive blocks (windows at dusk, the beam at night).

**"Building is composing", as the demo paid it off:** every growth event is exported from the page with a MIDI note, and the score's melody voice is synthesized from those events. The lighthouse beam turns once every 12 beats and passes one ring cell per beat; the eight houses standing on those cells light up and chime as it passes, so the notes laid down in a shuffled build order are replayed in **spatial order** as the complete theme. The second ring around the centre cell has 12 cells at exactly 30° steps, which makes this beat-synced sweep possible.

## Shots

| Beat | Camera | Why |
|---|---|---|
| Opening | Close ortho (frustum 7.5) on one lonely object, empty faceted sea, sky band at the top | Give the viewer nothing to look at; the first tile then becomes an event |
| Growth | Turntable (azimuth +45° over ~5 s) with a slow zoom-out, **intercut** on beats with close-ups: a peak rising with a splash (elevation 23°, frustum 5.2), floors stacking (26°, 6), dock planks and the boat drop (27°, 6.6) | Wide shots show the shape growing; close-ups sell the bounce and the splash |
| Day | Medium on the village, sun sweeping 100° in 2.5 s (time-lapse shadows) | Light is the time machine |
| Departure | Side angle computed from the dock direction, camera trails the boat | The boat must move across the frame, not toward the lens |
| Dusk | Fixed 3/4 wide, slow push, windows light one per eighth note | Let the lights be the only motion |
| Night | Very wide, elevation 21°, island lower left, one tiny light far out in the dark | Negative space = danger |
| Climax | High angle (50°) turning at 0.22× the beam speed, then easing down to 25° so the starry sky "rises" | You must see the beam sweep over every house; then the sky opens up |
| Ending | Pure orthographic zoom ×25; an echo object far away in the lower right | Scale reveal and echo |

Camera settings used: azimuth 45° by default, elevation **30°** (build), **33–35°** (day detail), **20–25°** (night — a lower angle widens the sky band so stars show), **50°** (top-down-ish when the beam sweeps). Frustum height 5–7 for close-ups, 12–16 for the whole island, up to 420 for the final scale reveal.

## Score structure

- **Event-driven**: page `EV` entries carry `note`; `music/score.py` synthesizes every one at its exact time (rise → marimba, pop → kalimba, floor → woodblock, roof → kalimba+marimba = the melody, window → soft kalimba, ring → rising marimba, beamhit → kalimba lead + marimba octave + bell shimmer). Underneath: ambient pad, a gentle marimba ostinato and shaker/soft kick only in the day and climax sections. **96 BPM, D major pentatonic feel.** No piano, no strings.
- **One note as a motif**: a buoy bell on D5 opens the film ("the only note the sea knows") and a distant bell plays the same note at the end.
- **Silence**: the night section drops to a low pad drone, waves and crickets; the music bus is digital zero for the last half-beat before the climax downbeat.
- Growth scheduled on the 16th grid: tiles on halves → quarters → eighths.
- The boat's answering bell sits in a rest of the melody, filling the gap when the beam finds it.
- **Foley** (`mix.py`): as in STYLE.md §7, plus gulls by day (downward-gliding FM chirps), windmill creak, crickets from dusk; the dock plank knock and lighthouse-ring stone thunk, glass tink for the lamp room, whump + hum on ignition. Floors: second knock 0.21 s after the first.
- **Voice**: Kokoro `af_sky` (clear, gentle female), speed 0.86–0.92, 5 short lines. "Sea" is heard as "C" in a film about notes, so the narration says "ocean".
- **Mix**: voice compressed, ~10 dB over the music; music ducked −8 dB under the voice; −14 LUFS; grain 0.

## Palette & props

- **Terrain heights**: sand 0.36–0.42, grass 0.74–0.9, hills 1.1–1.4, rock peak 1.95; top cap 0.16 thick, side column sunk 0.1 below it; 1.5 % gap between tiles; lightness jitter ±4 %; roughness .88.
- **Props**: box houses 0.92 wide, 0.62 per floor, gable roof prism (overhang 0.08) with wall-coloured gable ends; windows = small quads with their own emissive material per house; cone pines (6 sides), icosahedron (detail 0) broadleaf trees, 3-sided-cone palm fronds; windmill (6-sided tapered tower, 4 blades); dock planks on posts; a boat from a pinched box hull + triangle sail; lighthouse = 4 tapered 8-sided rings alternating white/red + dark gallery + emissive glass + red cone cap. Three gulls circle; chimney smoke; the windmill spins up on the "island complete" chord.
- **Palette (sRGB)**: sand top `#f3dfab` / side `#e2c68e`; grass `#93c96c`, `#7fbd62`; earth side `#c99c6e`; rock `#b4b8bd` / `#8f949c`; walls `#fbf3e6 #f5c2b0 #b5dccb #a9cbe8 #f7df8f #e9c9e6`; roofs `#d9644a #4f7fb8 #e0874f #6a5a8e #3f8f86`; pines `#3f8a5a #4f9c63`; leaves `#7fc36a #9ad06f`; warm windows `#ffc676`; lighthouse `#f6f2ea` / `#d9544a`.
- **Day/night keyframes** (zenith / horizon / deep sea / shallow / sun): dawn `#9fb6cf / #f3d2c4 / #4f8ea3 / #8fc9c4`; day `#88c8e8 / #eaf5f2 / #38a5bc / #86e2d4` sun 2.7; dusk `#6f6fa8 / #ffa888 / #5a6a9e / #b08aa6` sun `#ff9a68` elevation 8°; night `#12163a / #4a4478 / #23264a / #363a66`, moon `#a9b0e8` 0.9. Night sea darker near the camera and brightening toward the sky band.
- **Sea**: 220×220 plane, 200×200 segments, four summed sines (amplitude ≈ 0.2), roughness 0.55; coarse 5000-unit plane 0.55 below; lagoon map a 512² canvas of soft blobs where tiles have risen; surf ring 0.99–1.12 r, opacity ≈ 0.32.
- **Arrival numbers**: rise 0.5 s cubic ease, overshoot `sin(13 s)·e^(−7 s)·0.18`, hex splash ring + 14 droplets 0.12 s before it settles. Drop: 2.4 units in 0.22 s (ease-in), bounce `|sin(15 s)|·e^(−9 s)·0.22`, squash `1 − 0.16·e^(−12 s)·cos(26 s)` on Y, volume preserved. Pop: `1 − e^(−9 s)·cos(17 s)`.
- **Post**: GTAO radius 0.7, scale 1.5; tilt-shift max radius 3 px at the frame edges; bloom threshold 0.95, strength 0.22 day / 0.5 night; grade sat 1.04–1.1, soft contrast, small blue lift at night; render 3840×2160.
- **Lighthouse beam**: camera-facing ribbon, halo 2.4× wider at 0.32 strength, tilted 7° down so it meets the sea far away; water lit by an angular band around the beam direction plus per-facet sparkles. Beam: one turn every 12 beats.
- **Subtitles as built**: Quicksand 600, 44 px, `#fffdf8`, navy drop shadow (blur 14), centred 118 px above the bottom; the hex icon (top + two side faces) is dawn pink, day grass, dusk orange, night window-yellow. Shown from 0.05 s before the line.
- **Title**: Josefin Sans 600, all caps, 78 px, 16 px tracking; letters rise 55 ms apart from under a thin water line; 300-weight lowercase sub-line ("a low-poly island film").

## End card

The night scale-reveal frame, darkened; the same title block (static), hex icon, `LOW-POLY ISLAND · LEMO-OPUSCAR`, `LemoLab × Claude Opus 5.5`, credits, laid out so the tiny lit island stays visible in a gap between the text blocks. The "LemoLab × Claude Opus 5.5" sign-off (and the LEMO-OPUSCAR line) belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/lowpoly-island/demo/
  story.js   timeline (96 BPM grid), VO, chords, day/night keyframes, shots
  world.js   hex layout, all props, growth schedule → EV (with notes), per-frame animation
  sea.js     faceted wave shader, shallow-lagoon map, beam-lit water
  post.js    ortho post: GTAO → sky/haze + stars → tilt-shift → bloom → grade
  main.js    renderer, lights, cameras per shot, HUD (title, subtitles, end card), EV export
  music/score.py   event-driven score (+ check.py: librosa onset/pitch check vs events)
  mix.py     foley + ambience + voice + ducking     subs.py  subtitle cues
  build.sh   one-command rebuild
```

1. `node core/render/still.mjs styles/lowpoly-island/demo --range 0.5:52.5:1` + `core/render/sheet.py` — overview sheets, iterate.
2. `core/tts/tts.py lines.json voices` → `core/tts/asr_check.py` until all OK.
3. `node core/render/events.mjs styles/lowpoly-island/demo` → `music/score.py` → `music/check.py` → `mix.py`.
4. `node core/render/video.mjs styles/lowpoly-island/demo --fps 24 --workers 3` (1272 frames, 2× SSAA + GTAO).
5. `sh core/render/mux.sh out/video24.mp4 mix.wav lowpoly-island.mp4 24 0`. Or just `sh demo/build.sh`.

Pitfalls tied to this demo's props:

- An invisible glow sprite becomes a black parallelogram floating on the sea in the GTAO pass.
- Derive the boat's position from the beam's angular speed so the beam finds it on a chosen beat, in frame (a rest in the melody, so the boat's answering bell fills the gap): at 21 units out it is off-screen when the beam finds it.
- Don't let the sea receive shadows: at low sun they make a long dark stain.
