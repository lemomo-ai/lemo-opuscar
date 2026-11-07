# Microgame Frenzy — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Five-Second Astronaut* (59.8 s) · `microgame.mp4` · source in [`demo/`](demo/)


## Story & structure

A space cadet tries to pass astronaut school on a game show. A game show runs a string of **microgames**. Each one is **a shouted command word + 2.5–4 seconds + one action + one result** (success or a funny failure). Between games the film cuts back to a **home stage**: a host, a scoreboard of lives and a stage number. Every few games the whole film **SPEEDS UP**. At the end a **BOSS STAGE** runs longer, mixes all the earlier rules, and decides the story.

What makes this style work: **each microgame uses a different visual medium.** Crayon, ink wash, ASCII terminal, risograph, pixel art, blueprint, Swiss typography and so on. The jolt of each style switch is both the joke and the beat. The home stage is the one fixed look that holds the film together.

How the demo spent the native moves:

| Native power | Demo use |
|---|---|
| **Style switch per game** | Any topic splits into 6–8 tiny tasks, each in the medium that suits it best. A sneeze is an ink blot. A buckle click is a terminal relay. A zipper is ticks on a dimension line. A jump is a pixel platformer. |
| **Command word** | One verb is the whole scene: PUMP! / DON'T SNEEZE! / ZIP! It works as script, subtitle and downbeat at once. |
| **Lives as UI** | The helmet-icon counter carries the emotion with no narration. Going 3 → 2 → 1 (blinking) builds the tension on its own. |
| **SPEED UP** | Five things speed up together: BPM, game length, stage dwell, command-word hold and animation frame rate. The audience feels the acceleration. |
| **Boss mixes the rules** | The final game is built from pieces of every earlier style, so the climax is literally made of the film's own past. |

**Demo story shape:** a cold open that starts *inside* a game at frame 1. A failure in round 1 that is funny. A second failure that costs the last spare life. A silent beat on the last life. **The twist: the material of an earlier failure becomes the solution in the boss stage.** In the demo, the ink-wash sneeze that lost a life blooms into an ink parachute. The echo at the end: the character redoes an earlier failed action and gets it right (the salute).

How we adapted the topic: we listed 7 verbs from the topic, gave each verb the medium it would most naturally be drawn in, made two of them fail and let the boss stage reuse the failed ones. The same recipe for another topic: a product launch becomes UNBOX! (crayon), PLUG IN! (blueprint), DON'T DROP IT! (ink), and so on; the boss stage is "SHIP IT!".

## Shots

| Beat | Camera |
|---|---|
| Cold open | Frame 1 is already inside a game with the command word slamming. The rules explain themselves in 1 s. |
| First stage | Pull back out of the TV: the scale reveal. The game was one screen on a show. |
| Stage | Always the same frontal, symmetrical "home" frame. Only the scoreboard changes. |
| SPEED UP (signature shot) | The stage splits into **three slot-machine reels** that spin through earlier game frames with motion smear and stop one per beat on SPEED \| UP \| !. |
| Button | An Edgar-Wright-style **insert**: an extreme close-up of the red button as a glove smashes it on the beat. |
| Last life | The same stage with the lights cut to a single top spot; the host goes still. |
| BOSS STAGE | 8 tiles (7 last frames plus a BOSS card) flip in on eighth notes, then flip again to become pieces of the boss frame. |
| Boss silence | Push into the porthole close-up; the audience sees the dust before the hero does. |
| Climax | Snap back to wide in one beat as the ink canopy blooms. |
| Ending | Back to the home stage; the hero stands on it for the first time and salutes; then the camera pushes into the TV for the end card. |

Motion as used in the demo:

- **Speed ladder** (demo): 120 → 140 → 160 BPM. Round-1 games are 2 bars (4.0 s) and round 2 is 1.5 bars (2.57 s). Stage dwell goes 1 bar → 2 beats. The command word holds 0.75 s, then 0.64 s. Character stepping goes 8 fps → 12 fps → 24 fps (boss). Camera moves, transitions and the fuse spark always run on ones.
- **Command word**: Titan One, white with a 22 px ink outline, a magenta drop and a gold burst behind it, skewed −6°. It **slams** in over 3 frames (1.9 → 0.92 → 1.0), holds, then **shrinks into a corner tag before the first action**, so the result is never covered. One-off banners ("BOSS STAGE!", "PULL!") fly out instead of becoming tags.
- **Fuse timer**: a braided rope along the bottom with **one knot per beat**; the spark passes each knot exactly on the beat and ends at a little firecracker rocket. The fuse freezes during an instant replay and is hidden in the boss close-up.
- **Unified transition = the TV frame**: stage → game is a camera push into the TV screen (0.25 s); game → stage is the whole frame shrinking back into the TV (0.33 s), with the ✓ / ✗ stamp slapped onto the screen. No fades and no blank frames.
- **Failure is performed, not just shown**: the ink sneeze covers the visor and two white eyes blink out of the ink. The Swiss salute arm rotates past 90° and *grows past its module length* to swat the red ball, which bounces twice on the baseline and rolls off the grid.
- **Instant replay** for a story-critical failure: freeze 3 frames, then play at 0.5× with a 1.4× push-in, black bars and "instant replay" in the style's own typography, then resume. It costs 2 beats; the music plays a record scratch and half-time.

## Score structure

- **Music first**: write the tempo grid (`timeline.js`) before any animation. Every hit is listed in a cue table (per section: time, BPM and key, the instrument layered over the drums and bass, and the beats the picture must land on, e.g. 10.5 s the whole band drops out for a beat and a half, 11.0 s ACHOO = kick + cymbal + ink splat) and the picture lands on it. `tools/cuecheck.py` checks 57 picture events against `music/score.json` (demo max offset 4.7 ms).
- **Score**: original funk/pop fusion. Drum kit with 16th hats and ghost notes, **synthesized slap bass** (additive pluck + band-passed thumb noise + 1.8–6.5 kHz pop + octave jumps and slides), stacked brass stabs (trumpet_stac + alto sax + trombone_stac), and a vibraphone+piano "e-piano". Drums and bass run through the whole film. On top, one **colour instrument per style**: xylophone (crayon), guqin harmonics and bends (ink), square beeps (ASCII), vibes and sax (riso), pulse arpeggio (pixel), muted trumpet (blueprint), claves and dry piano (Swiss). Each speed-up gets a rising brass run, and the key rises a whole step each round.
- **Real silences**: 1 beat before the first sneeze, the last-life stage (heartbeat only), and the boss close-up (heartbeat + the same guqin note as the first dust mote). The biggest hit comes right after the longest silence.
- **Foley follows the medium**: rubber squeak + air for the crayon pump, a wet splat and drips for ink, teletype clicks and a relay for ASCII, a paper thump and crunch for riso, bit-crushed noise for pixel, ratchet teeth and a stamp thunk for blueprint, a hollow bonk and small rubber boings for Swiss. Home-stage sounds: spring-loaded crown click, glass crack plus bouncing clinks for a lost life, card flips, slot-reel whirr, sparse sampled claps.
- **Voices**: host = Kokoro `am_fenrir` (the widest pitch range of the Kokoro voices compared), speed 1.05–1.15. The host shouts every command 0.1 s *after* the stab so the brass doesn't mask the word. Hero = `af_bella` pitched +2.5 semitones, only "Oh no." plus the "ah… ah…" and sneeze, which are treated as SFX and exempt from whisper checks. Duck the music about 11 dB and the foley about 6 dB under voice.
- **Single-word commands in Kokoro**: "Pump!" comes out as "Pompey" and "Zip!" as "Zipper", because a vowel tail is added. Generate "Pump, now!" and cut at the end of the first word from whisper timestamps (`tools/trim_cmd.py`).

## Palette & props

**Home stage (the only constant look)**: flat toon with a **7 px near-black outline `#1a1030`**, flat fills, and **one hard-edged shadow** made by filling the shape in the shade colour, clipping to it, and refilling it shifted up-left by 9 px. Palette: stage violet `#2a0f5c` / `#3d168f` rotating sunburst, magenta `#ff2e88`, gold `#ffc928` / `#e08a00`, cyan `#1fd1d1`, success green `#3bdc5a`, fail red `#ff3b3b`. Fixed props: a marquee with chasing bulbs (the title card), a central **16:9 gold TV** (screen 768×432, exactly 1/2.5 of the frame), a lives board of helmet icons, a stage-number badge, and a podium with a big red button.

**Characters** (all original):
- *Host* = a gold **stopwatch head**. The dial is the face, the red second hand is his pointer and nose, and he **slaps his own crown button** to start every game. His hand ticks every beat, spins when he is excited, and stops dead on the last life.
- *Hero* = a 2.3-head-tall cadet: bubble helmet, spring antenna with an orange ball (the **mood meter**, which boings on every action), and the number "05".
- **Translation rule:** in every microgame style the hero is redrawn from scratch, but **three silhouette marks always survive**: round helmet, antenna ball, "05". `?scene=frames.styleSheet` draws one character in 8 of them.
- **Model sheet:** `?scene=frames.modelSheet` draws both characters in the home style: turnarounds (front, 3/4, side, back), expressions, key poses and palette swatches. `build.sh` leaves both sheets in `demo/out/still/`.

**Microgame media (simplified re-drawings, each about 100–200 lines of code):**
| Style | How it is made |
|---|---|
| Crayon | Canvas where RGB = crayon colour and **A = pressure**. A shader deposits wax only where procedural paper tooth > 1 − 1.22·pressure. Indigo wobble outlines, zig-zag hatching that goes past the lines, and a **knock-out**: front shapes erase the wax behind them. 8 fps, with line boil on 12. |
| Ink wash | Two channels, **R = wet ink** (blurred, with edge pigment pooling) and **G = dry ink** (broken by paper grain). Brush strokes are pressure profiles with bristle tracks; blots are noisy discs; splatter is flung blots. The one colour is a vermilion dot: the antenna ball, plus the "05" seal. |
| ASCII terminal | **Hand-authored ASCII art for the hero** (a luminance ramp turns small figures into mush). Structural glyphs `/ \ | _ -` carry the silhouette. The antenna ball is an inverse-video `@`. Amber phosphor shader with bloom, 3 px scanlines and barrel curvature. |
| Risograph | Canvas **R/G/B = blue/yellow/pink plate density**. `lighter` = overprint (yellow+pink = orange, yellow+blue = green); `source-over` = knockout. 7 px rotated halftone, fixed misregistration per shot, and a plate **kick** on the key action. Paper-white halo around the hero. |
| Pixel | 240×135 indexed framebuffer ×8. Sprites are built from primitives with an **auto 1 px ink outline**; Bayer dither for glows and flames. 12 fps. |
| Blueprint | Procedural blue paper plus white lines in 4 weights, centre / hidden dashes, dimension lines, hand lettering, and one red stamp. |
| Swiss | 12-column grid, one sans family (Inter), black and white plus signal red `#e30613`. The hero is a black circle, a black rectangle and a **red circle** (the antenna ball). The gag is that one element leaves the grid. |

**Boss frame composition:** mix up to five media, but with **one focal chain only**: the parachute leads to the capsule, which leads to the target. Remove anything off-story, such as decorative pixel gulls. Shrink info panels (the ASCII altimeter) into a corner. Layering: crayon renders in alpha mode (wax coverage = alpha, with a full-pressure white base where it must be opaque). Ink and riso render on white and are drawn with `multiply`. The CRT panel is rendered flat and clipped to its box.

**The ink parachute (climax):** it must *read as a parachute*, not smoke. It grows in three stages: a jet of ink from the capsule hatch (0.15 s), a **round** drop spreading (short, 0.3 s), then **9 gores fanning out**. Gore fill is a vertical gradient (dense at the crown, light at the hem) with alternating ±7 % tone, thin paper-white seams, and a scalloped hem (each gore bulges down). There is one loaded brush arc along the crown, dry-brush flying white along the hem, and dry thin cords to the hatch.

## Titles & end card

- **The command word is the subtitle**: it is not burned twice, and it is listed in the .srt only.
- Other lines use a **gold rounded card** with a 7 px ink outline and a hard shadow, Lilita One 50 px, a small stopwatch icon (host) or helmet icon (hero), placed above the fuse in games. It pops in over 2 steps at 12 fps. Hold ≥ max(1.8 s, speech + 0.6 s), and never during a big banner.
- The title card is the home-stage marquee lighting up letter by letter (FIVE-SECOND ASTRONAUT / A MICROGAME FRENZY).

The end card sits inside the TV: title, style name and "LemoLab × Claude Opus 5.5", with hero and host. Two lines of fine print under it credit the Salamander piano (CC BY 3.0) and the MuldjordKit drums (CC BY 4.0); the card lasts 2.6 s, so they are there from its first frame. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/microgame/demo/
  timeline.js   tempo grid + segments (single source of truth)     film.js   assembly: stage, TV transitions, slot reels, boss tiles, end card, subs, events
  toon.js chars.js stage.js hud.js   home style, host & hero, stage, fuse/command/stamps/lives/subtitles
  glpass.js     WebGL2 material shaders: riso, crayon, CRT, ink, blueprint paper
  g_crayon.js g_ink.js g_ascii.js g_riso.js g_pixel.js g_blue.js g_swiss.js g_boss.js   one module per medium (scene + hero translation)
  frames.js     model sheets & style frames      music/score.py   original score      mix.py   foley + voices + ducking
  tools/        trim_cmd.py cuecheck.py subs.py final_asr.py review.sh mux.sh dump_timeline.mjs
```
1. Write `timeline.js` (tempo grid), then the cue table, then hand the grid and cue table to a music sub-agent. Draw in parallel with it.
2. Build the home style and characters first, then **one `sceneX(g, lt)` per medium**. Review each with `?scene=g_x.sceneX` stills.
3. `sh demo/build.sh` rebuilds everything: TTS → trim → whisper → score → events → cue check → mix → srt → render (~25 s for 1436 frames) → mux (−14 LUFS, grain 0), about 1.5 minutes in total.
4. Review with `bash demo/tools/review.sh out/revN 6 $(seq 0.5 1 59.5)` at least twice, plus frame strips of every key action.

### Pitfalls

- A luminance-ramp ASCII hero is unreadable mush. Use a hand-authored template plus structural glyphs, and an inverse `@` for the antenna ball.
- An ink canopy reads as black smoke or a storm cloud unless it is shaped: keep the blot phase short and round, fan out gores with a gradient and seams, add a scalloped hem, and leave the edges light.
- A Swiss "salute fail" where the arm only rises reads as a raised hand. The arm has to *overshoot and hit* the red ball, and the failure needs an instant replay to be understood at 140 BPM.
- A crayon layer in alpha mode shows the background through the wax gaps. Give it a full-pressure paper-white base (or render it opaque and clip) wherever it must be solid.
- Toon drawing helpers that keep a global context (`K.g`) will draw on the wrong canvas when a scene renders into an offscreen buffer (TV screen, slot reels, tiles). Always call `setCtx` before and after.
- `flat` is a reserved word in GLSL ES 3.
- Uploading a 2D canvas without `UNPACK_FLIP_Y` means v = 0 is the canvas top; sample with `p/R`.
- Command tags pile up (LAND IT! + PULL! in the same corner). Secondary commands should fly out, not tag.
- A white impact flash at 100 % reads as a blank frame; cap it at 60 %.
- whisper often mishears 0.2 s command words inside a dense mix, even at +16 dB SNR. Verify them per clip, and measure SNR in the 300–4 kHz band for the mix.
- A zsh `$T` list doesn't word-split. Use the bash review helper `tools/review.sh`.
