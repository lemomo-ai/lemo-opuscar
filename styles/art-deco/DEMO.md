# Art Deco — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Midnight at the Starlight Hotel* (58.4 s) · `art-deco.mp4` · source in [`demo/`](demo/)


The demo's brief: a 40–60 second film in the Art Deco style; the director decides story, shots, score, sound and titles.

## Story & structure

A bellboy, Pip, must carry a sealed letter to the rooftop before midnight on New Year's Eve 1930. A small, urgent errand in a grand place. A mechanical obstacle (the elevator is OUT OF ORDER) turns panic into resolve. A rising middle with a tempo change (the stairs = Charleston). A true silence before the climax (the clock hits XII, the band stops, the letter tumbles). The climax is counted light: twelve strikes of midnight = the twelve letters of THE STARLIGHT lighting one by one.

**The music is the plot:** the letter holds the band's new song; the theme is only heard in fragments until the conductor opens it, and the 13th beat is the first full statement. Echo at the end: the hero who looked up at a dark sign now stands inside the lit one; a button gag closes the loop (the elevator dings IN SERVICE — too late).

How the style's native powers were spent in this story:

| Native power | Demo use |
|---|---|
| The centre axis | Every transition is a door: the title arch splits open, stair doors burst, kitchen swing doors bang, elevator doors close into the end card. |
| Counted light | The bulb sign lights letter by letter, one per bell. |
| Machine symmetry | A Busby Berkeley overhead: fans opening on eighth notes become a sunburst, then lock into a clock face. Used as the release after the climax. |
| Dials & numbers | Floor indicator, clock face, floor medallions, year badge: floor 30, 11:55, 1930 carry the plot without narration. |
| Period radio | An announcer as narrator, moved through acoustic spaces (street horn → desk radio → stairwell PA → live mic) so the audience hears the hero getting closer to the source. |

The recipe for adapting a topic (as in this demo): find the threshold (doors), the deadline (a clock), the counted reveal (a sign, floor numbers), and the thing the finale unlocks (a song).

## Shots

| Beat | Camera |
|---|---|
| Opening (3 s hook) | A single gold point explodes into rays and stepped arches; slow 6 % push. Title bar blooms on the orchestra hit. |
| Transition grammar | **Symmetric split**: the outgoing frame becomes two door leaves hinged at the edges that swing open from the seam (arch, stair doors, kitchen doors). The revolving door is its rotary cousin (glass wings wipe). The film closes with elevator doors sliding shut over the live shot. |
| Establishing | Extreme low-angle Cassandre tilt from the dark sign at the top of the tower down to the tiny hero on the street: goal, difficulty and the dark sign (the setup of the ending) in one move. |
| Obstacle | Medium on the plaque dropping; a slow push on the face during the silence while he straightens his cap. |
| Signature 1 | The stairwell as an **architectural section**: rise with him, pull out until the whole tower is a cutaway and he is a red dot with speed lines, push back in on the "30" floor medallion, match-cut to a spinning silver tray in the kitchen. |
| Silence | Insert of the tower clock's minute hand clicking to XII; the letter tumbling in slow motion past the dark letters. |
| Climax | Twelve bells: catch (ECU glove) → conductor (tear the seal, insert of the score, baton up) → low oblique of the sign as letters light one per strike → close-up as the last T lights behind the hero, gold light across his face. |
| Signature 2 | **Busby Berkeley**: an oblique high angle as 8 dancers open their fans one per eighth note, then straight overhead, 8-way mirrored and slowly rotating; the fans lock into a clock face with two gold hands at XII. |
| Scale reveal | Pull back from the sign to the whole tower, the city and fireworks (echoes the opening tilt). |
| Ending | Elevator doors slide shut over the live shot; the end card plaque sits on the closed doors. |

Performance beats: the elevator button pressed three times (once, twice, mash); the throw has a wind-up, release and a near-fall over the railing; the cap knocked off by a tray lands back on his head one bar later while he doesn't even look. In the opening the gold lines grow at the speed of the clarinet glissando (slow → fast), landing on the downbeat hit. After all letters are lit, a 16th-note chase runs across the whole sign.

## Score structure

- **Score first**: `timeline.js` is the single source of truth (116 BPM foxtrot → 16 beats accelerating to 138 BPM Charleston → stop → 12 bells on the 116 grid → the song in D♭). `tools/cuecheck.py` checks 53 picture sync points against `music/score.json` (max offset 0.5 ms).
- **Orchestration as used**: piano lead (Salamander), clarinet (low trill + two-octave glissando curtain-raiser), strings (tremolo bed, upward rushes), muted trumpet commentary ("wah-wah" on the plaque), brushes → sticks in the Charleston, walking pizz bass, tubular bells (B♭) for midnight, harp/piano glissandi for each fan, trombone + sax for the final chorus.
- **Planting the theme**: title = piano bar 1; street = muted trumpet tries two bars and is cut off; kitchen = the hero whistles the first four notes; finale = the full song.
- **Distance automation**: the band plays on the 30th floor, so it is low-passed at 2.5 kHz on the street, 1.2 kHz in the lobby (through the floor), opens up as he climbs, full-range and dry on the roof.
- **Announcer in five spaces** (Kokoro `bm_fable`): street horn (band-pass 320–3.8 kHz, soft drive, slap echo) → desk radio → stairwell PA (long reverb) → kitchen radio → live mic (full range). Keep the horn's drive light: heavy distortion makes "five minutes to midnight" unintelligible in the full mix.
- **Foley as used**: brass button click, bronze plaque clang + chain rattle, iron stair treads on eighth notes, marble heels, silver trays, wooden swing doors + spring twang, paper flutter, glove slap, knife-switch "chunk" + filament hum per letter, relay ticks for the chase, firework whistles.
- **Silences**: after "Out of order?!" only the lobby clock ticks twice (next sound: the Charleston snare); after the tower clock clicks to XII only wind and the fluttering letter (next sound: the first bell, the most important sound in the film); one beat of held breath after bell 12 (next: tutti).
- **J/L-cuts**: radio tuning noise before the arch opens; the echo of "Out of order?!" rolls up the stairwell; the kitchen radio starts during the stairwell; rooftop wind enters a bar before the kitchen doors; bell 12's tail rings into the tutti.
- Mix: music ducked ≈ −9 dB under voice (−6 dB under the live announcer), beds −6 dB; −14 LUFS, grain 3.

## Palette & props

- Ground: warm black `#0d0b09`, lacquer `#060504`; night sky `#0a0e16` → horizon emerald `#10231f`.
- Gold: `#6F5220` (shadow) → `#C9A24B` (base) → `#F3D98B` (light) → `#FFF4D2` (specular).
- Accents: burgundy `#8E1B2E` (the hero's uniform, the only large saturated area), emerald `#1D6B57` (fans, door panels, night), ivory `#F2E8D5` (the letter, gloves, carpet).
- Scenes: the lobby in one-point perspective with a mode-7 floor; the rooftop sign in two-point perspective from below with a tiny pinhole camera.
- Pip: 7 heads tall, tapered streamline body, faceted lacquer planes; silhouette marks: tilted pillbox cap + chin strap, a V of brass buttons, the sealed letter always in hand.
- Other props: the OUT OF ORDER plaque, the tower clock, the bulb sign THE STARLIGHT, the conductor and the score, waiters with silver trays, 8 dancers with emerald fans, fireworks.
- Reference stills (rebuilt by `build.sh`, same renderer as the film): [`demo/stills/kit.jpg`](demo/stills/kit.jpg), the component kit (title bar, numerals and clocks, sunburst, arch frames, patterns, bulb marquee, subtitle cards), each labelled with its engine call; style frames [`demo/stills/frame_lobby.jpg`](demo/stills/frame_lobby.jpg) (the one-point lobby with the mode-7 floor) and [`demo/stills/frame_roof.jpg`](demo/stills/frame_roof.jpg) (the bulb sign from below in two-point perspective). Pip's model sheet (turnaround on a 7-head scale, silhouette check, six expressions, key poses, palette swatches, the letter) is `?scene=frames.modelSheet`; `build.sh` leaves it in `demo/out/still/`.

## Titles & end card

- Subtitle card speaker icons: a gold ribbon mic for the announcer, a burgundy pillbox cap for the hero.
- Title: MIDNIGHT / AT THE STARLIGHT HOTEL in a gold title bar over the stepped arch, a 1930 diamond year badge, NEW YEAR'S EVE label.
- End card: a lacquer plaque on the closed elevator doors: title, ART DECO, LEMO-OPUSCAR, "LemoLab × Claude Opus 5.5", asset credits. This sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/art-deco/demo/
  timeline.js      tempo grid + all sync points (single source of truth) → tools/dump_timeline.mjs → timeline.json
  engine/          deco.js (palette, gold, gline, airbrush, motifs, drawShape) · type.js (title bar, digits, badges, dial, clock, subtitle card)
                   bulbs.js (any text → bulb sign, lighting patterns) · cam.js (pinhole camera + card transforms)
  chars.js         Pip (FK rig, 4 views, 8 faces, pose library, run cycles), conductor, waiters, dancers, the letter
  scenes/          lobby.js (one-point + mode-7 floor, doors, plaque) · roof.js (two-point sign) · tower.js · stairs.js
  shots_*.js       one function per shot: shot(g, t)       film.js   shot list, transitions (split / revolve / close), subtitles
  frames.js        model sheet, component kit, style frames, ?scene=frames.shotTest&shot=<name>
  music/score.py   original score → score.wav + stems + score.json      mix.py   voices in 5 spaces + foley + beds + ducking
  tools/           cuecheck.py · subs.py · pitch.py · dump_timeline.mjs
```
1. Write the tempo grid and the cue table first; hand them to a music sub-agent and draw in parallel.
2. Build the engine and the hero model sheet, then one scene per location, then one function per shot. Review single shots with `?scene=frames.shotTest&shot=<name>`.
3. `sh demo/build.sh` rebuilds everything: timeline → TTS → pitch → whisper → score → cue check → mix → srt → render (≈15 s with 4 workers for 1401 frames) → mux (−14 LUFS, grain 3) → stills.
4. Review at 1 s intervals with `still.mjs --range 0:58:1` + `sheet.py`, then frame strips at 0.15–0.2 s for every key action.

Pitfalls tied to this demo's props:
- Into the end card, draw only the elevator door leaves, closing over the live shot: doors sliding in over a flat brown "interior" read as a blank frame.
- Lift the background sunburst wedges and glow in the opening: one gold point on black trips `blackdetect`.
- Give the last bell a close-up: Pip at ¼ frame height in the bell shots is too small for the emotional peak.
- Write colours as six-digit hex: three-digit hex turns the emerald fans blue-violet.

## Engine reference

All drawing is Canvas2D, deterministic in `t`. Import from `demo/engine/`.

**deco.js**
| Function | Purpose |
|---|---|
| `C` | palette (`ink black night gold0 gold1 gold2 goldHi ivory emerald burg plum skin bulb…`) |
| `goldGrad(g, x0,y0,x1,y1, {sheen, hot, tint})` | banded metal gradient; animate `sheen` −0.2→1.2 for a light sweep |
| `gline(g, pts, {w, part, closed, glow, double, sheen, alpha, color})` | the engraved gold keyline; `part` 0→1 draws it on; `color` = any hex for the one-colour exception |
| `airbrush(g, pts|Path2D, {base, dark, light, dir, rim})` | hard-edged airbrushed fill |
| `sunburst(g, cx, cy, {rays, r0, r1, mode:'lines'|'wedges', a0, a1, rot, part})` | radial backgrounds |
| `stepArchPts(cx, base, w, h, {steps, crown})` / `archFrame(g, cx, base, w, h, {rings, gap, fill, burst, part})` | ziggurat arches and arch frames |
| `fan`, `fishScale`, `chevrons`, `sparkle`, `speedLines`, `glow`, `beam`, `vignette` | motif library |
| `drawShape(g, pts, {color, halo, trail, glints, part})` | **any path in the deco manner**: airbrushed gold (or `color`) fill + gold keyline + optional sunburst halo, speed-line trail and glints |
| `starPts(cx, cy, r, k, rot, n)` | four-point star path |

**type.js**: `goldText(g, text, x, y, {size, font, track, sheen})` · `titleBar(g, text, cx, cy, {p, out, size, sub, wings})` (animated in/out) · `decoDigits(g, '11:59', x, y, size)` · `yearBadge(g, '1930', cx, cy, r, {p})` · `floorMedallion(g, '30', cx, cy, r, {sub})` · `dial(g, cx, cy, r, value, {labels})` (semicircle floor indicator, value 0..1) · `clockFace(g, cx, cy, r, {h, m, s, roman})` · `subtitleCard(g, text, {p, out, speaker:'radio'|'boy'})`.

**bulbs.js**: `buildSign(text, {font, size, spacing})` (any text → glyph skeleton → evenly spaced bulbs, cached) · `drawSign(g, sign, x, y, scale, {lit, channel, color})` · `litAll(v)` · `litSequence(t, times[], {flash, chaseFrom, chaseSpeed})` (letter i switches on at `times[i]`, then chases).

**cam.js**: `makeCam({x, y, z, f, yaw, pitch, roll})` → `{P(X,Y,Z), scaleAt(X,Y,Z)}` · `cardTransform(g, cam, TL, TR, BL, w, h)` (map a flat card onto a 3D quad).

**chars.js** (demo characters): `drawFigure(g, {x, y, s, view:'side'|'q'|'front'|'back', face, ...pose})` · `POSES`, `FRONT_POSES`, `lerpPose`, `runCycle(phase)`, `runFront(phase)` · `drawDancer`, `drawDancerTop`, `envelope`, `clef`.

**The one colour.** To keep one element in its own colour, pass `color` — it is used for the fill, keyline and glow while everything else stays gold:

```js
import * as D from './engine/deco.js';
import * as B from './engine/bulbs.js';

// a warm-orange four-point light with a short cursor tail, drawn the Art Deco way
D.sunburst(g, 960, 540, { rays: 72, r1: 1400, mode: 'wedges' });
D.drawShape(g, D.starPts(960, 540, 120, .22), { color: '#D97757', halo: 1, trail: { ang: Math.PI, len: 420, n: 4 } });

// a bulb sign that lights letter by letter, in the same orange
const sign = B.buildSign('LEMO', { size: 260, spacing: 20 });
B.drawSign(g, sign, 560, 700, 1, { lit: B.litSequence(t, [0, .5, 1, 1.5], { chaseFrom: 2.5 }), color: '#D97757' });
```
