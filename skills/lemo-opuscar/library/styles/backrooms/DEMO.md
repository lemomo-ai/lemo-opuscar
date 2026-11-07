# Liminal Found Footage — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Night Shift Orientation* (59.7 s) · `backrooms.mp4` · source in [`demo/`](demo/)


## Story & structure

A new night-shift worker films his orientation walk through an endless office floor, following the printed rules and the PA. The style notes for this demo:

A single first-person **camcorder recording** (1990s VHS, 4:3) walking through an **empty, familiar-but-wrong interior**: mustard wallpaper, damp carpet, drop ceilings full of humming fluorescent panels, repeating forever. Nothing chases anyone. The dread comes from **emptiness, repetition, bureaucratic rules, and the camera's own machinery failing at the wrong moment**. The viewer should feel a chill on the back of the neck, not jump out of their seat.

**Never** use the word "Backrooms", wiki "Level" numbers, community entity names, or any existing organisation/logo inside the film. The genre name lives only in this file. Everything on screen — rules, forms, company voice, the "thing" — is original.

The recording medium is the storyteller. The demo used all five native powers and put the focus hunt at the emotional peak:

| Native power | How the demo used it |
|---|---|
| **Autofocus / auto-exposure hunting** | The camera "finds" something only while focus is correct. It is there on the first lock, gone on the second. AE lags after a blackout and the image pumps with gain noise. |
| **Tape tracking damage** | A tracking tear is a *cut the universe made*. Same framing afterwards, but the OSD clock jumped hours / the battery drained / one light is now dead. |
| **The OSD is plot** | REC dot, battery, date and time code are diegetic evidence. A camcorder title-generator can write the film's title over the first shot. |
| **Rules as text in frame** | Printed notices, PA announcements in a calm corporate voice. Rules start ordinary and drift wrong; two of them contradict each other; the last one addresses the viewer. |
| **Emptiness and repetition** | The same notice appears again in a different place; the same room with one detail changed; a corridor that runs into fog. Emptiness itself is the threat. |

How the topic is framed (the same trick works for others): turn the topic into **an orientation, a procedure, or a checklist** that someone records on tape — a new job's first shift, a building inspection, a moving-day walkthrough, a school's safety drill, a hotel's night audit. Write 5–6 rules. Let the medium betray the rules.

**Demo emotional arc (59.7 s):** boring normal (≈20 s of almost nothing) → a small wrongness (a contradiction, a repeated notice) → a rule is tested (lights flicker) → seeing / not seeing (focus hunt) → time removed (tracking tear) → a rule is broken (the exit) → the last rule turns to the audience → REC off. One subject (the camera operator — heard, never seen above the shoes), one goal (follow the procedure), one turn (the time code proves he is no longer in "normal").

## Shots

| Beat | Camera |
|---|---|
| Opening | Tape rolls in, AWB swings blue→yellow, AF finds a notice on a wall; camcorder title over it |
| Reveal of space | Slow pan off the notice to a corridor of partitions and lights receding into fog |
| Routine | Walking POV, glance down at shoes on damp carpet; no events for ~20 s |
| The contradiction | Crouch to a repeated notice; hold ≥4 s with nothing covering the text |
| Obeying a rule | Snap down to the shoes; let the light on the carpet change instead of showing the ceiling |
| Peak | Zoom + autofocus hunt down the corridor; the figure exists only in the ~0.5 s of correct focus |
| Time cut | Tracking tear, then the *identical* framing — only the OSD changed |
| Breaking a rule | Turn a corner to the red EXIT; hold still in total silence; push in; door opens on its own |
| Ending | Final notice in focus ≥3 s → REC off: freeze, tear, black |

**The "thing"** is never a close-up: a 2.4 m silhouette (a colleague who is wrong by 15–40 %: small head, long tilted neck, narrow high shoulders, arms to the knee), drawn as an organic Canvas2D silhouette on a camera-facing billboard, ~33 m away in a stretch of dead lights with only dim light far behind it. Slow small wave (3.6 s cycle). Target: *you can tell it is waving, you cannot count fingers.* Exclude the billboard from the GTAO pre-pass (`mesh.isPoints = true`) or it stamps a dark rectangle.

Demo motion numbers: 0.72 m stride, head bob 3 cm, sway 1.8 cm, roll ±0.8°, breathing 0.27 Hz, tremor at 1, 3.5 and 9 Hz; looking down at pitch ≈ −1.2 rad with the camera pushed 0.2 m forward; zoom FOV 52° → 27° with aperture ×5; three 0.1 s blackouts per flicker, AE lag ~0.45 s; doors open in 1.3 s. The motion rules:

- **One continuous handheld take.** Cuts happen only where the tape breaks: power-on roll-in, tracking tear, REC off.
- Handheld = walking gait (0.72 m stride, head bob 3 cm, sway 1.8 cm, roll ±0.8°) + breathing (0.27 Hz) + tremor noise at 1, 3.5 and 9 Hz whose amplitude rises with a **fear** curve. At the "held breath" moment **freeze all of it**.
- Looking down: pitch ≈ −1.2 rad, camera pushed 0.2 m forward — only the shoe toes and carpet in frame, never trouser legs.
- Autofocus is the DOF focus distance animated with overshoot: blur → lock → slip → lock. Blur comes from pulling focus *near* (a far target barely blurs when focus overshoots to infinity). Zoom narrows FOV 52°→27° and raises aperture ×5.
- Lights flicker as three 0.1 s blackouts; AE brightens with ~0.45 s lag afterwards.
- Doors open by themselves, slowly (1.3 s, eased).

## Score structure

There is no score. The sound design as built for the demo:

- **No score.** Only what the tape would have recorded.
- **Fluorescent bed**: 120 Hz + harmonics (1, .55, .42, .22, .16, .06 at ×1…×7), a buzzy band-passed square component, a faint ~9 kHz ballast whine, random bad-tube "zzz" bursts; gated by the same light curve as the picture; +3 dB closer in small rooms.
- **PA**: calm corporate voice (Kokoro `af_bella`, speed 0.82–0.84) through a "ceiling speaker": band-pass ~310–3500 Hz, cone resonance around 1.3 kHz, tanh saturation, room reverb — keep it dry enough for whisper to transcribe (too much reverb turns "night shift" into "my church"). Original two-note chime (vibraphone E5→C5) before every rule; after the time jump both chime and voice drift flat with tape wow.
- **Operator**: 3–4 short lines (`am_michael`), low level, proximity bass, a breath/air layer following the voice envelope, compressed. Kokoro cannot truly whisper — "speaking quietly" is the goal. Close-mic breathing whose rate follows the fear curve; held breath then one long exhale.
- **Diegetic hold music**: an original easy-listening loop (here 88 BPM F major, vibraphone melody, clean-guitar comps on 2 & 4, finger bass), band-passed and drowned in reverb as if through walls, read with a slowing tape-speed curve (1.00 → 0.97 → 0.89) and growing wow. It cuts out during blackouts and dies at the silence, never to return.
- **Foley**: damp-carpet steps (60–85 Hz thud + small wet 0.9–2.6 kHz squelch), cloth rustles on turns, camcorder clack + motor on REC on/off, zoom servo whine, AF motor ticks, ballast "tink" + arc buzz on each flicker, a barely audible drag overhead, door latch + stick-slip hinge creak + air push.
- **Silence is the climax**: one full second of digital zero (including tails) when the exit appears; caption `[SILENCE]`. The only allowed scare is soft: all ballasts restriking at once with a low thunk when sound returns.
- Low drone (35–55 Hz brown noise + 41/43.5 Hz beating) rising from the time jump to the silence. Duck bed and music ≈ −8 dB under voices. Loudness −14 LUFS, grain 0 (the noise is in the picture).

## Palette & props

- **Frame**: 4:3 image pillarboxed in 1920×1080 (black side bars). Render the 3D at **720×540** and let the VHS pass upscale — low resolution is part of the look and hides CG cleanliness.
- **Space**: axis-aligned partition walls 0.16 m thick on a 2.4 m grid, random gaps and stubs, occasional square pillars; ceiling 2.70 m; drop-ceiling tiles 0.6×1.2 m; recessed troffers every 2.4 m (0.6×1.2 m prismatic panels). A hand-authored route (start room → long corridor → side corridor → one small room) inside procedurally filled offices so every doorway shows more empty rooms.
- **Lighting = thousands of lights, no shadows**: store every troffer's colour/intensity in a 128×128 float **DataTexture**; each fragment sums the nearest 5×5 panels (emitter cosine × Lambert / (d²+0.3)) plus a bounce term from the same neighbourhood. No occlusion — backrooms light is flat. Per-light variation: ±8 % warm/cool, +0–7 % green, 3.5 % dead, 2.5 % flickering. GTAO (radius ≈0.55 m) darkens wall/floor seams.
- **Fog follows local light**: fog colour × (local bounce light / average). Where lights are dead the haze is dark too, so a silhouette there reads as a *hole in the light*. Scene background = fog × 0.15, so corridors dissolve into darkness instead of a bright wall.
- **Palette** (albedo, sRGB): wallpaper `#d5bd66` with darker stripes `rgba(140,112,40,.7)` and a diamond column, every roll faded differently; baseboard `#4d3d26`; carpet `#8c763c` mottled, damp patches ×0.6 with faint specular; ceiling tile `#d9d3b8`, grid `#e6e1cf`; troffer diffuser `#fbfaf0` at emissive ×5; the **only saturated colour is the red EXIT sign** (`#ff2a1a`, emissive ×9 so it blooms).
- **Restrained decay** (clean is part of the style — never make it a ruin): water tide-marks at the foot of *some* wall runs, nicotine-yellow band under the ceiling, occasional peeling seam (≈7 % of rolls, pale paper-back triangle + shadow), rare small stains, ~4 % yellowed ceiling tiles, ~2 % return-air grilles, <1 % missing tiles (black holes), dead insects inside diffusers.
- **Notices**: office laser-print on yellowed paper: IBM Plex Sans Condensed headers ("FLOOR STAFF — PLEASE READ", "FORM NS-01 (REV. 9)"), numbered rules in Plex Sans 600, "Thank you for your cooperation. — Management". Pinned to cork or taped to wallpaper. For close-ups, **lower the camera so the lens is parallel to the page** — pitching down at a vertical sheet shears the words into fake italics.
- **VHS camcorder pass** (custom shader, *not* a CRT): per-line time-base jitter (small; low-frequency wobble ≤0.25 px or text skews), head-switching band on the bottom 8 lines, tracking tear on demand; barrel distortion 0.07 + vignette 0.42 applied to the image but **not** to the OSD; luma bandwidth limit (Gaussian σ≈1.25 px @720) + edge-enhancement ringing (sharp 0.9); chroma averaged over ±10 px and shifted 1.6 px right; bright lights smear to the right; AWB tint drifting; AGC noise (streaky, stronger in darks); 0–2 dropout lines per frame; black lift 0.045, soft highlight clip. Noise runs at 30 fps (tape rate) even though output is 24 fps. No scanlines, no RGB mask.
- **OSD**: a hand-made 5×7 bitmap font with a black outline: `● REC` top-left, battery top-right, `PM 11:58` / `SEP.27.1996` bottom-right. The title uses the same font ×2 like a camcorder title generator.

## Titles & subtitles

- **CEA-608-style closed captions**: IBM Plex Mono 600, 42 px, white on a solid black box per row, ≤32 characters per row, centred inside the 4:3 frame just above the OSD clock. They are not affected by tape noise (the TV decodes them).
- Speaker marks: `[PA]` prefix for announcements; italics for the operator (first line tagged `(whispering)`); SDH sound descriptions in brackets: `[FLUORESCENT LIGHTS HUMMING]`, `[LIGHTS FLICKER]`, `[TAPE NOISE]`, `[SILENCE]`.
- Rules on notices are *not* captioned — they are the picture. Keep text readable at 1080p and give each notice ≥3–4 s uncovered.
- Title: camcorder title-generator bitmap text typed over the first shot.

## End card

Black, bitmap-font title, style name, `LemoLab × Claude Opus 5.5`. This sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/backrooms/demo/
  story.js    timeline (single source of truth), camera keyframes, focus/aperture/fear curves, OSD clock, time warp W()
  world.js    layout (walls/pillars/route), light DataTexture, custom lighting/fog shaders, props (notices, EXIT, door, outlets)
  tex.js      procedural textures (wallpaper, carpet, ceiling, troffer, notices, EXIT, cork, outlet)
  figures.js  operator's shoes, the silhouette billboard      thing2d.js  organic silhouette drawing
  vhs.js      VHS camcorder ShaderPass (pillarbox, jitter, tear, luma/chroma, AGC, dropouts)
  osd.js      5×7 bitmap font, REC/battery/clock, title generator      subs.js  608 captions
  main.js     renderer, post chain (core/three/post.js GTAO+DOF+bloom → VHS), handheld rig, events
  sheet.js    silhouette design sheet (?sheet=1)      music/muzak.py  original hold music (sampler)
  mix.py      all sound → mix.wav        tools/mux.sh  core mux with CRF parameter        build.sh
```

1. `node core/render/still.mjs styles/backrooms/demo <t…> [--q nosub=1|raw=1|sheet=1]` — review stills.
2. `sh styles/backrooms/demo/build.sh` — TTS → whisper → music → events → mix → whisper on processed voices → render (1433 frames ≈ 80 s with 3 workers) → mux (−14 LUFS) → SRT → poster/styleframe.

### Pitfalls

- A fully bright scene reads as a hospital corridor. Break walls into partitions with gaps; let far areas fall dark.
- Lights leak through walls (no occlusion) — a "dead zone" needs all lights within ±5 m across dead, and the corridor behind it dim too, or the figure is framed against a bright window.
- The scene background shows as a bright rectangle at the corridor's end — set background = fog × 0.15.
- A uniform fog colour lifts silhouettes to grey; make fog follow local light.
- Low-frequency line wobble in the VHS pass skews text; keep it ≤0.25 px. A camera pitched down at a notice makes words look italic — lower the camera instead.
- Capsule-built figures read as toys / stick men. Draw the silhouette as organic curves on a billboard.
- Legs from primitives look like tubes; show only shoe toes (extruded footprint outline with bevel, lighter sole, laces).
- Emissive red at ×3 never reaches the bloom threshold (luminance of pure red is low); use ×9.
- Normalising a filtered chime by the *pre-filter* peak blows the PA bus up by 16 dB — normalise by the processed signal.
- Heavy PA reverb destroys intelligibility; check every processed line with whisper and the full mix too.
- Time-compressing a finished timeline: write keyframes in "original" time and map them through one piecewise-linear warp `W()`; remember to warp any hard-coded times elsewhere.
- VHS noise makes files big: CRF 24 → ~47 MB for 60 s.
