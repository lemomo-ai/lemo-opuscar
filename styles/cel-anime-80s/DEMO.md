# 80s Cel Anime — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *City Lights, 1987* (59 s) · `cel-anime-80s.mp4` · source in [`demo/`](demo/)


## Story & structure

After the rain, a courier nicknamed "Nightbird" rides a white motorbike across a neon city to deliver a pilot's forgotten cassette to the launch pad before a dawn rocket launch. One hero, one goal, one deadline (sunrise).

Arc (59 s): cold open with a deadline → the hero sets off (title hit) → joyful momentum montage → an obstacle (a drawbridge rising) → one decisive move (the jump; the peak *freezes*) → release into a new light (night becomes dawn) → end card. The song on the tape is the score itself: when the cassette plays aboard, the score becomes diegetic.

The adaptation idea for this story (one example, not a rule): turn a topic into a delivery, a race against a deadline or a launch; plant the goal early (the rocket on the horizon), block it in act two, reveal it in the light at the end. Other adaptations: a product launch as a courier racing the product to the stage; a love story as two lights crossing a sleeping city; a history lesson as a pilot flying through eras painted as backgrounds.

Native powers spent: painted city vs flat cel (neon city, wet asphalt, dawn sky), limited animation (held close-ups, the jump as a painted still), backlit light (signs, tail lights, gauges, title), speed grammar (parallax, speed lines, impact frames), the theme song as a plot object (the cassette).

## Shots

| Beat | Camera |
|---|---|
| Cold open | **Multiplane crane-down** over a tall painted plate (sky → rooftops → neon → street), foreground layers faster; radio dispatch over rain |
| The object that matters | Tight insert on a gloved hand holding the cassette, soft bokeh behind, a highlight sliding over its plastic |
| Resolve | Extreme close-up on the eyes; they open in three 8 fps drawings on the line "Copy. I'll beat the sun." |
| Title | Backlit title card, letters flicker on at 12 fps, a light bar sweeps across, star glint, on the brass hit |
| Momentum | Side tracking with 4 parallax layers + tail-light trail; rear view into a neon canyon (pseudo-3D); held bust with neon light bands; wheel insert through a puddle; a wide elevated-highway shot that **plants the goal** (the rocket across the bay) |
| Obstacle | First-person approach to the rising drawbridge; glove twisting the throttle and the rev gauge in extreme close-up, cutting faster |
| Peak | Low front view on radial speed lines → one-beat freeze + white flash → impact frame → painted "harmony" still of the airborne bike with a slow pan → impact frame → landing with sparks and camera shake |
| Release | The same side-tracking composition as the night ride, repainted at dawn by the sea with the sky open |
| Handover | Two hands through a fence pass the tape; a finger presses PLAY on the cockpit cassette deck |
| Ending | The rocket lifts off (tilt up, delayed); warm close-up that answers the opening line ("Told you I'd beat the sun."), then the end card |

The rider's front view was tucked behind a tinted windscreen so only goggles and hair show, letting the headlight flare carry the shot. Cuts landed on bars (116 BPM, bar = 2.069 s).

## Score structure

Original city-pop / synth-funk "anime opening", synthesized in numpy (`demo/music/score.py`): 116 BPM, E♭ major, maj7/9 chords, the J-pop "royal road" progression (IVM7–V7–iii7–vi7). FM electric piano (DX7-style 1:1 carriers + a 14:1 bell transient), slap bass (thumb + octave pops), gated-reverb snare, synth brass stabs, chorus-y 16th-note guitar chanks, string pad, a singable lead hook, FM bell sparkle, and a **key change up a semitone** for the last chorus.

Written to the cut: intro under the cold open, a fill bar with space for engine revs, the title on a brass hit, verse under the montage, a pre-chorus build, **one beat of true silence** before the jump, the chorus on the painted still, an accent on the landing, and the final chord on the end card. Diegetic twist: when the tape plays in the cockpit, the score is band-passed to a cassette sound for one bar, then opens to full range with the key change as the rocket lifts.

Foley: engine from an RPM curve (harmonic saw stack + firing jitter + band-passed exhaust pulses, low-passed when airborne), rain bed + random drops, tire hiss on wet road, wind, bridge bells, radio squelch clicks, impact boom, metal scrape and sparks, cassette clicks, button + motor, rocket ignition and roar.

Voices: an English-dub feel, 8 short lines: the heroine (Kokoro `af_bella`) and a radio dispatcher (Kokoro `am_michael` through a band-pass 380–2800 Hz + saturation + squelch). Whisper mishears "Launch is at dawn", so the line is "The launch is at dawn". Mix: voices balanced by RMS ~10 dB above the ducked music, music ducked ~9 dB under lines, engine and ambience ducked 3 dB, chorus 4–6 dB louder than the intro, two-pass loudnorm to −14 LUFS.

## Palette & props

- Night: indigo / deep violet / neon magenta / cyan / warm window gold. Dawn: periwinkle / rose / peach / pale gold. The hero's accent: a **coral scarf**, readable in both.
- Colour-model multipliers used: night lit ×[.78,.74,1.0], shadow ×[.58,.52,.92]; dawn lit ×[1.04,.9,.84]; a backlit silhouette set (dark purple with an orange rim) for the jump. Skin line ≈ `#5a2e2e`.
- Props: white motorbike, cassette labelled "SIDE A · CITY LIGHTS", headset and goggles (near-black, heavier lines), pinch-grip gloves, rev gauge, drawbridge with red warning lights, rocket on a floodlit pad across the bay, cockpit cassette deck with backlit level meters. Signs: BAR, CAFE, 喫茶, ホテル, カラオケ.
- The heroine, as built in `head80.js`: eyes at the vertical middle of the head, mouth at the upper third between nose base and chin; iris layered top-dark band → dark upper half → main colour → bright lower crescent, one large and one small highlight; 2–3 separate lashes in the flick; mouth set closed / set / talk / "oh" / pant / smile / open smile with a dark-red interior and a faint lower-lip stroke; profile with a small skull-back, small slightly upturned nose, neck leaning forward. Blinks hold the closed drawing 2–3 frames; brows carry resolve vs exhaustion; shoulders rise when panting; a star glint in the eye highlight on a musical accent.
- CRT numbers used: chroma blur ~7 px, Cr shift ~2 px; scanlines 3 px period, strength 0.18, gap `1 − a·ph·(1 − 0.6·L)`; grille ±0.06; phosphor glow 0.35; corners `1 − 0.28·(2u²v² + 0.25(u²+v²))`. Moiré check: at 720p the 3 px scanline becomes a clean 2-row alternation; 900p shows a faint 5-row pattern; below 480p it disappears. Leave out film-only artefacts (gate weave, dust, scratches, misregistration): they contradict the tape conceit. The power-on opens the film with a thunk + line whine; tracking noise marks the tape beat with a short hiss/warble.

## End card

Darkened final dawn background, the title, the style name "80s Cel Anime", "LemoLab × Claude Opus 5.5", a one-line originality note and credits. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

Title card as used: "CITY LIGHTS" in heavy italic chrome with シティ・ライツ above (Dela Gothic One), a red "1987" and a spaced-out tagline. Subtitles: Barlow Semi Condensed 600, 54 px, cream-yellow `#fff0a0`, 9 px dark outline, 96 px above the bottom; radio lines cyan `#8ff4ff` with a boxed "● BASE" tag; each line up for max(duration + 0.6 s, 1.9 s).

## Rights & credits

- Original score, sound design, animation and all drawings: generated by code in this folder (numpy, Canvas 2D, WebGL). No samples, no stock art.
- Voices: Kokoro TTS (Apache 2.0), voices `af_bella`, `am_michael`.
- Fonts (SIL Open Font License 1.1, licence files in `demo/fonts/`): Dela Gothic One (artakana), Kanit (Cadson Demak), Barlow Semi Condensed (Jeremy Tribby).
- Inspired by 1980s Japanese cel animation; all characters, vehicles, places and the story are original.

## Build notes

```
styles/cel-anime-80s/demo/
  cel.js     path / cel / ribbon / flutter helpers      pal.js   color models (day → night / dawn / backlit)
  rider.js   side-view bike + rider, limbs, wheels      head80.js  80s heroine head: 3 views × expressions, body/collar/scarf
  hands.js   pinch-grip gloves                          bg.js    painted plates (street, skyline, tall crane plates, reflections)
  fx.js      rain, splashes, speed lines, flares, lamps, light trails
  post.js    WebGL videotape + CRT pass (bloom, grade, chroma bleed, subtitles, scanlines, grille, glow, power-on, tracking noise)
  shots.js + scenes1–4.js   one function per shot     story.js  bar-aligned timeline, lines, credits
  hud.js     VHS-style subtitles     main.js  plates, shot dispatch, sound events
  lines.json voices   mix.py   music/score.py (original score)   tools/ (still, sheet, srt, mux)
```

1. Treatment → `story.js` (116 BPM bar grid, shots, lines).
2. `node styles/cel-anime-80s/demo/tools/still.mjs styles/cel-anime-80s/demo --range 0.5:58.5:1 --out /tmp/cs` → `tools/sheet.py` contact sheet → look → fix. `?test=model|close|side` renders the model sheet / head close-up / rider; `?raw=1` bypasses the CRT pass; `?nosub=1` hides subtitles.
3. `.venv/bin/python core/tts/tts.py demo/lines.json demo/voices` → `core/tts/asr_check.py`.
4. `.venv/bin/python demo/music/score.py` (score + stems + cue times).
5. `node core/render/events.mjs demo` → `.venv/bin/python demo/mix.py`.
6. `node core/render/video.mjs demo --fps 24 --workers 4 --out demo/out/video24.mp4` (1416 frames ≈ 36 s on an M-series Mac).
7. `sh demo/tools/mux.sh demo/out/video24.mp4 demo/mix.wav cel-anime-80s.mp4 24`, `python demo/tools/srt.py`.

Encoding numbers: ffmpeg grain luma 4 + chroma 1 at CRF 22 gives ~32 MB/min; luma 5 + chroma 2 at CRF 18 is 270 MB; with the CRT pass CRF 22 goes over 35 MB/min, CRF 23 with luma-only noise 2 lands at ~31 MB. Single-pass loudnorm lands at −13.5 LUFS; two-pass with `linear=true` lands at −14.0. A hot limiter squashes the chorus to the intro's loudness: normalize to the 99.99th percentile and let only rare peaks hit the limiter.

Pitfalls tied to this demo's props:
- A bloom threshold on the colour canvas turns the white bike and the jacket pink.
- The S-curve makes a black hole in the headlight (clamp first).
- A rim offset of 6–8 px turns the thin hair ribbons completely pink.
- Hair can read as tentacles; keep bang tips off the eyes, where they hide the lash line.
- Don't put a flattened front face on a 3/4 body (equal eyes, no cheekbone turn, V chin, long thin neck): it reads as a paper mask.
- Night faces go pink from the night tint + magenta rim + pink light sweeps; forehead patches show between bang locks.
- In the rear canyon shot, points behind the camera flip up into the sky (cull them).
- The rocket leaves the frame unless you follow it with a delayed tilt and a slower (quadratic) climb.
