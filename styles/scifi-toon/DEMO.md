# Sci-Fi Sitcom Toon — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Coffee Run* (57.5 s) · `scifi-toon.mp4` · source in [`demo/`](demo/)


A 30–60 second film in this style: premise, jokes, cast, shots, timing, music and sound are the director's choice.

## Story & structure

The lab is out of coffee. A jaded genius in a bathrobe crosses universes for a refill with his nervous sidekick, Gary; every universe has a worse coffee; the one they bring back is decaf. Tiny, mundane goal + absurdly large sci-fi means.

Ways to turn other topics into an errand (for reference only):
- Product launch → the genius crosses dimensions looking for a working version of the product; every universe has a worse one; the one they bring back has a twist.
- A lesson / explainer → the sidekick asks a simple question; each universe is a wrong answer taken literally; the last one is right but has a cost.
- A holiday / event → "we're out of X for the party" → universes of increasingly wrong X.

**Beat sheet of the demo (57.5 s):**
1. **Cold open (8–12 s)**: the mundane problem, shown not told (an empty pot, one last drip). The sidekick over-explains, the genius cuts him off with one word. No music, no title yet.
2. **Portal + title slam (2–3 s)** on a musical downbeat.
3. **Jump 1 (6–8 s)**, jelly world: slow: arrive, try, reveal the wrongness in an insert close-up, **cut the music**, reaction shot, one-word rejection.
4. **Jump 2 (6–8 s)**, mug world: faster and worse; the sidekick loses it; same rejection word.
5. **Montage (3 × 1 s)**: teeth, pigeon and clone worlds; one second per universe, same word each time, cuts on the beat.
6. **The break (4–5 s)**: a universe that is *suspiciously normal*. The pattern breaks; the calm is the joke.
7. **Home (12–16 s)**: relief → the reversal (it's decaf) → **2+ seconds of dead silence** → the genius reveals his value system in one line → button.
8. **Button**: callback to the opening line so the story loops.
9. **End card (4–5 s).**

## Shots

| Beat | Camera |
|---|---|
| Cold open | Static insert close-up of the empty coffee pot, a slow push |
| Dialogue | Medium two-shot; **hard cut to a close-up on an interruption** |
| Reveal of the absurd | Insert extreme close-up, then cut to a reaction close-up |
| Panic | Tight close-up with a short camera shake on the key word |
| Jumps | "Rush" zoom into the portal → full-screen swirl wipe → next world opens from a swirl |
| Montage | Same framing in every world (duo left, creature right) so only the world changes |
| Cold silence | Two-shot of the standoff, very slow push-in, nothing moves but the boil |
| Button / ending | Wide shot so the portal and both characters are in frame; the end card follows |

## Score structure

- 120 BPM so cuts snap to half-second beats. Theremin lead over analog bass, 16th-note square arpeggio and a retro drum machine. Main theme in D minor, a chromatic descent D–A–B♭–A–E–F–E–E♭–D.
- **One motif per universe**, each a separate cue whose **first beat is the cut**: bouncy tuba + wobbly lead + slide whistle (jelly), brushed swing jazz with vibes (mug), 1-second stingers over a four-on-the-floor pulse (montage), elevator bossa with Karplus–Strong nylon guitar (the "normal" world), warm Rhodes + theremin "aah" (relief), rising tremolo strings (panic).
- Silences: music (and reverb tails) hard-cut on the jelly reveal insert and for the 2+ s cold pause after "decaf"; only fluorescent hum + clock ticks remain.
- Foley used: portal open/hum/close, swirl whoosh per wipe, pop/boing on spit-out and landing, glorp/squish/blink for the slime creature, straw slurp, teeth chomp, pigeon coo, shop bell, bubble bloops, blink "blip", remote click-beep.
- Voices: deadpan genius = Kokoro `am_onyx`, speed 0.82–0.9, light saturation + 180 Hz bump; sidekick = Kokoro `am_eric`, speed 1.1–1.15, presence boost; a tiny creature = Kokoro `af_sky` pitched +7 semitones for one or two words. Cast by generating test lines and measuring median f0 / pitch variance. Music ducked ~−7 dB under dialogue; master −14 LUFS.
- The final bass note sits on D2: a sustained D1 (37 Hz) is only rumble on laptop speakers.

## Palette & props

- Line: `#1b1422`, 7 px characters and props.
- Home lab: sage green `#a7c3b1`, olive floor, warm wood, one orange accent.
- Jelly world: magenta sky bands `#ff4f9a→#ff9bcb`, lime jelly `#b8f03c`, cyan `#52e0e0`.
- Mug world: orange sky `#ff7a2f→#ffb862`, teal hills `#2b9c98`, cream.
- Teeth world: red `#c3122f`, gum pink `#ff8fa6`, tooth white. Pigeon world: slate blue `#5f78a8`, grays. Clone world: inverted purple `#3b1f66` + yellow `#e8d84a`.
- "Normal" world: deliberately bland beige `#f1e3c6` and brown.
- Cast: the genius in a bathrobe + fuzzy slippers + goggles; the sidekick Gary in a bike helmet + giant round glasses.
- The portal: a vertical oval (x-scale ~0.74), lumpy goo rim `#3fd93a` with a 7–8 px outline, 5 spiral arms alternating `#b8ff5a`/`#21b33c` rotating **on ones**, a pale core, orbiting sparks, drips off the bottom, a flat green wash over the scene while open; ~12 % overshoot, back-ease 0.32 s. Opened with a remote.
- The universe readout: VT323 tag top-left, typed in, coloured per world.
- Coffee: a latte-art heart, drips over the rim and steam (a plain brown blob reads as a potato).

## Titles & end card

- Title: a 1950s atomic-age TV title: chunky block letters (Bungee) in cream with a hard magenta offset shadow and thick ink outline, wrapped by a tilted cyan orbit ring with a coffee bean flying around it and a few twinkling four-point stars; popped in on 12 fps steps on the music downbeat.
- End card: dark purple, a slow dimmed portal, title, style name in the terminal font, "LemoLab × Claude Opus 5.5", credits; a tiny post-credits gag in the portal. This sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/scifi-toon/demo/
  toon.js     vector engine: matrix stack, screen-space boil, constant line width, flat shading
  chars.js    the cast (parametric eyes, mouths, hands, noodle limbs) + props
  worlds.js   one function per universe + creatures + the portal
  story.js    single source of truth: VO start times, shots, wipes, tags, key beats, music cues
  main.js     acting per shot, cameras, wipes, tags, subtitles, title, end card, window.EV
  lines.json  script (tts text, subtitle text, speaker, voice, pitch, cut)
  voice.py    per-character processing + lip-sync envelopes   asr.py   padded whisper check
  music/score.py  synthesized score from the cue list        mix.py   foley + voices + ducking + ambience
  srt.mjs  build.sh  sheet.sh (contact sheets)  strip.sh (consecutive-frame strips)  levels.py (stem meters)
```

1. Write the treatment. Cast voices by generating test lines and measuring median f0 / pitch variance.
2. `core/tts/tts.py lines.json out/raw` → `voice.py` → `asr.py` until every line passes.
3. Put VO times, shots and cues in `story.js`; block shots in `main.js`; review with `sheet.sh` (1 frame/s) and `strip.sh` (consecutive frames), at least two rounds.
4. `core/render/events.mjs` → `music/score.py` → `mix.py` (check `levels.py` and a spectrogram).
5. `sh demo/build.sh` reproduces everything: TTS → voices → events → score → mix → SRT → render (1380 frames ≈ 15 s with 4 workers) → mux at −14 LUFS. Full rebuild ≈ 1 minute on an M-series Mac.

Pitfalls tied to this demo:
- Kokoro + whisper: the name "Pim" in a deep voice is heard as "Pam"; "Gary" passes. "b-broken" is heard as "be broken"; write "buh, buh-broken", "Wh, wh, why". "decaf" comes out "D-cuff"; write "dee-caf".
- A springy portal (lib `spring`) overshoots to ~135 % and swallows the actors.
- Creatures placed behind the shop counter vanish: place them so face and upper body show.
