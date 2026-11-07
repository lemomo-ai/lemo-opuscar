# Tilt-Shift Miniature — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Toy Town Rush Hour* (38 s) · `tilt-shift.mp4` · source in [`demo/`](demo/)


## Story & structure

An original procedural town wakes up at dawn and builds to rush-hour gridlock; at the peak, time crashes to real speed on a family of ducks crossing the main avenue in front of a hero car, then releases and rises until the town is a circuit board.

One adaptation recipe, as an example: make the topic a *system with many small actors*, then find the *one tiny actor* the system bends around (a product launch → the city's traffic flowing toward one shop; a love story → two commuters crossing on the same crosswalk every morning; a history lesson → one street time-lapsed across a century).

Arc (38 s): quiet (one light trail at dawn) → the system wakes up (actors multiply, rhythm builds) → maximum density → **hard drop to real time on one detail** (the ducks, with a failed hop before success as the comedy beat) → release back to fast-forward → rise to a scale reveal. One subject, one goal, one twist.

Native powers spent: long-exposure light (the dawn car trail is the whole opening), the blur band (follows the car; narrowest on the ducks), time-lapse speed (×24–×40 with the ×40 → ×1 drop at the peak), god's-eye scale (rotating top-down at peak density, the final rise).

## Shots

| Beat | Camera |
|---|---|
| Opening | High oblique wide at dawn, very slow slide; the band follows the single hero car's light trail, routed on the lane nearest the camera |
| Title | Oblique across rooftops onto an **in-world neon sign** on a building facing a wide avenue, letters lighting one per 8th note; road-sign tag "A TILT-SHIFT MINIATURE" |
| System waking up | Medium-high oblique on an intersection and a station, slow push; the band on the stop lines / platform edge; commuter train |
| Peak density | **Straight top-down, slowly rotating**, gridlock |
| Real-time detail | One continuous **dive** from the top-down into a low medium close-up over the hero car's hood, the car's front and lights as blurred foreground. The eye-line lands on the ducks before the body does (look target eases out faster than position). Speed ramps ×40 → ×1 during the dive; land on the narrowest band. The top-down rotates so it ends facing the close shot's direction |
| Ending | **Vertical rise** with logarithmic height (40 m → 820 m) through a thin cloud layer until the town becomes a circuit-board pattern; end card |

Close-up numbers used: camera ~1.7 m up, 6–8 m away, ~12° pitch, 17° FOV, near plane 0.08 m; the ducks fill ~1/4–1/3 of frame height. Oblique shots: 45–55° pitch, 110–200 m from the subject, 27–30° vertical FOV.

## Score structure

Sampled minimalist marimba ensemble (`demo/music/score.py`), 120 BPM, so the 8 Hz time-lapse stutter is exactly a 16th note. **Fixed phrase skeleton; city events decide which notes sound**: cars crossing stop lines gate marimba A, green lights play woodblock accents, crowds trigger glockenspiel, train carriages play the bass; each section has a base fill rate.

- At peak density the skeleton is full, with phased marimba B and tuned car-horn chords (sampled brass staccato pulsing 8ths).
- The real-time drop is a **tape-stop**: varispeed 1 → 0.22, voices drop out one by one, then true silence. During the rest only one soft note per story event plays, each duck hop a step up the scale.
- The first note of the film is the top note of the final chord.

Sound design: time-lapse = music first with a faint granular sped-up city hiss, rail clacks, relay clicks; real time = idling engines, distant city, sparrows, tiny quacks and peeps, webbed feet patting asphalt; release = engines rev, wind sweeps up during the rise.

Voice: relaxed American male, Kokoro `am_adam`, speed 0.9–0.95, 5–6 short lines, music ducked ~8 dB.

## Palette & props

- Facades: warm whites, cream, terracotta, brick, pale yellow, mint, sky blue. Cars: white, silver, black, red, blue, yellow taxis. Park green `#6fa24a`. Asphalt `#4b4e53`. People: 0.5 m colour capsules.
- Grade: NeutralToneMapping, saturation ×1.55, soft contrast +0.42, slight warm highlights, vignette 0.3.
- Band values: half-width `w` 0.055 (0.035 on the ducks), `amp` 30, `mix` 0.55–0.7, `aper` 5000–9000 (metres), CoC clamp 30 px; 128 spiral taps.
- Light: 4096 shadow map fitted per shot, hemisphere fill ~0.6. Dawn: sun ~3.5° below the horizon, pink-orange east fill `#ffb48c`, ~9 % of windows lit, sodium street-light pools.
- Facade shader: punched / ribbon / curtain-wall / brick window types, glass roughness 0.08–0.22, metalness 0.35; manholes, asphalt patches, oil stains; GTAO.
- Traffic: IDM car-following pre-computed per clip, lights on a 96 s cycle, "don't block the box" logic, a pedestrian crossing that stops all lanes; heavy inflow plus box-blocking gives honest gridlock. Crowds are closed-form: they gather at corners on red and surge on green. Stepping: 8 Hz in fast-forward, 12 Hz between ×2 and ×6, smooth below ×2.
- Hero actors: a dawn car on a scripted path, a commuter train with kinematics fitted through beat times, lathe-turned ducks with a sheen fuzz material (`MeshPhysicalMaterial`, sheen 1, sheenRoughness 0.55), hop = anticipation squash (0.28 s) → stretch jump → land squash → settle, a second failed attempt before success.

## Titles, subtitles & end card

- Subtitles: a green `#0f5e3c` rounded road-sign panel with an inset white keyline, Overpass 600 44 px white, a tiny traffic-light icon lit green on the left, 118 px above the bottom inside the lower blur band.
- Time-lapse clock top-left (Overpass Mono): `07:12` with small seconds, `×24 TIME-LAPSE` in amber, `×1 REAL TIME` in green.
- End card: the same road-sign language over the top-down town: the title, the style name and `LemoLab × Claude Opus 5.5`. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/tilt-shift/demo/
  post.js    tilt-shift DOF (band + physical), grade      city.js   procedural town, facade shader, sign
  geo.js     merged-geometry builder                      sky.js    clock → sun/sky/fog/env, dawn glow
  traffic.js lanes, lights, IDM sim, fleet, trails, walkers   train.js commuter train
  ducks.js   lathe ducks + hop choreography               story.js  120 BPM timeline, time windows, rate curves
  main.js    cameras, stepping, crowds, HUD, events       mix.py    ambience + foley + VO + score
  music/score.py  sampled marimba score (skeleton + event gating)   subs.mjs  subtitle export
```

1. `sh styles/tilt-shift/demo/build.sh` rebuilds everything from scratch: TTS → whisper → events → subtitles → score → mix → 912-frame render (~60–80 s on an M-series GPU with 3 workers) → mux (−14 LUFS, grain 1) → styleframe and poster.
2. Iterate with `node core/render/still.mjs styles/tilt-shift/demo <t…> --q noev` (`noev` skips the event scan). Debug flags: `nohud`, `nodof`, `nostep`, `az=<deg>`, `cam=x,y,z,lx,ly,lz,fov`, `aper=`, `bamp=`, `bmix=`.

Pitfalls tied to this demo's props:
- Don't build a skyscraper forest: the streets must be visible.
- Route the dawn car on the camera-side lane, or it hides in a street canyon.
- Put the neon sign on a building facing a wide avenue, or it is occluded.
- An instance cap below the number of cars alive (1,400 vs 2,800) silently drops the hero car.
- Cars stop 2 m short of the ducks' crossing (the IDM jam gap): move the stop line closer and subtract the jam gap.
- Gridlock can leave the story lane empty, because box-blocking starves the segment in front of the crossing: exempt the main avenue so the queue forms behind the hero.
- Check the top-down → oblique dive for a 180° twist.
- Don't shoot the peak from a high long-lens view: the ducks are only 1/15 of the frame. Put the headlights on the car's top front edge so they read from above, and hold the hero car until the rising camera lifts clear of it.
- Clouds can wash out the ending and streetlight pools can read as bubbles; keep street furniture out of the close-up area.
- One fixed sun leaves half the film backlit and grey. Dawn needs the pink east fill and few lit windows (~9 %); about three times as many reads as midnight.
