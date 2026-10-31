# Paper-cut Lightbox — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Last Night Train* 《末班夜车》 (51.0 s, 1920×1080, 30 fps) · `paper-lantern.mp4` · source in [`demo/`](demo/) · engine: three.js 0.170 (WebGL, SSAA 2×, VSM soft shadows, custom DoF + bloom compositor), Canvas2D-drawn paper layers, headless Chrome frame capture.

An old night train makes its last run. At a snowy mountain halt its windows light up car by car and it pulls away over a curved viaduct; it runs alongside a pine forest past three small halts; it goes into a long tunnel and the picture blinks to black; it comes out in a river valley where the town lights its windows as it passes; it slows along the sea cliffs; at the seaside terminus its windows go out one by one, the last one last, and the station lamp stays on. No figures: the story is told by the train, its lit windows, the stations and the light. English narration (Kokoro `bm_george`) with Chinese and English subtitles. The line and its stations are fiction ([`demo/FACTS.md`](demo/FACTS.md)).

## Story & structure

Hook: a dark train at a lit halt; its windows come on one car at a time, engine first, each with a rising glockenspiel note. Turn: the tunnel, a 0.27 s blink of true dark and silence, and on the other side the snow is gone. Landing: the same windows go out one by one at the terminus, the falling notes mirror the rising ones, and the station lamp is the last light in the frame.

Every section has its own colour ladder (changing ladder = another place) and its own camera move:

| Section | Ladder | Camera |
|---|---|---|
| The halt and the viaduct | snow blue `#060b22` sky → `#7385b6` peaks → `#1b2650` viaduct → `#080d24` front | slow push, then a fast pull-out with the departing engine, then a lateral move along the valley |
| The forest | deeper blue, a pale snow slope `#44588e` behind the line | travelling alongside at the train's speed, rising; foreground pines rush past |
| The tunnel | cold slate `#26335f` cliff | push toward the portal, fade, a 0.27 s black |
| The river | teal `#04131c` sky → `#5f8c94` hills → `#2c5260` town | hard cut out of black on a small flare, lateral move with the train |
| The sea cliffs | indigo `#070a26` → `#7272b0` far waves | crane down past thin clouds to the train on the cliff curve |
| The terminus | pre-dawn violet, sea `#6a6aaa`, platform `#151a40` | wide on the arrival, close along the carriages as the windows go out, a beat on the last window, pull back to the lamp |

Native moves spent: *the lamp turns on* (car by car), *depth as distance* (the viaduct, the forest strip, the river), *travelling alongside*, *locked frame with only light changing* (the terminus), *silence* (the tunnel blink), and a paper ticket that drops on a thread for the end card.

## Shots

Film time; dissolves are 0.6 s.

| # | Time | Shot | Camera / transition |
|---|---|---|---|
| S1 | 0.0–13.8 | PINE HALT: a house on a snowy rise with two lit windows, the platform lamp clicks on (0.4 s); windows light car by car from 1.5 s, one every 0.34 s; headlight 5.25 s, horn 5.5 s, departure 5.9 s; at 10 s the train is on the curved arched viaduct over the snowy valley | push → pull-out following the engine → lateral |
| S2 | 13.8–22.0 | the forest: the line rises and falls; a pale snow slope with a lit house at each of three halts (ELM, STONE, MILL HALT), lamp posts, name boards below the line | dissolve; travelling alongside, rising |
| S3 | 22.0–25.75 | a stone arch portal in a snowy cliff; the carriages go in one by one, the headlight goes out; black 25.5–25.77 s | dissolve; push in; fade to black |
| S4 | 25.75–35.4 | the river valley: a low arched bridge, the town on the hill behind it lights its windows after the train passes; warm paper flakes on the water; the moon | hard cut, small flare; lateral |
| S5 | 35.4–40.2 | the sea cliffs: thin clouds, a far headland with one light, three seas (far waves small, near waves big), the train on the cliff curve, a dark rock in front | dissolve; crane down |
| S6 | 40.2–51.0 | SEA END: canopy with a scalloped valance, posts, railing, name board; a sea wall takes the train's shadow; the train stops at 41.0 s; windows go out from 42.0 s, the last one at 45.75 s; the lamp lays a warm pool on the platform; the ticket drops at 47.5 s and swings to rest | dissolve; wide → close lateral → pull back |

## Score structure

- 96 bpm; the harp ostinato is locked to the wheel clacks (two per beat at cruising speed). The clacks come from the train's speed curve (`mix.py` `speed()`), so they slow to a stop at the terminus.
- Glockenspiel: one note per window, rising D5–F♯6 at the halt, the same notes falling at the terminus. A bowed-vibraphone note under the lamp.
- Flute tune over the harp on the viaduct and again by the river; strings tremolo in D minor into the tunnel, cut to silence for the blink; an open D major chord with a harp sweep on the way out; solo violin and strings at the sea; harp and strings under the end card.
- Foley: snow wind, river, sea, room tone; lamp clicks, horn (two detuned saws, band-passed), brake hiss, wheel clacks and rumble, whooshes in and out of the tunnel, paper for the ticket. Everything stops during the blink.
- Mix (`demo/mix.py`): voice compressed, RMS −18 dB; music ducked 5 dB under speech with a 300 Hz–4 kHz dip; peak-limited; `core/render/mux.sh` to −14 LUFS, true peak −1.2 dB.
- Instruments from VSCO 2 CE, VCSL (CC0) and Salamander Grand Piano (CC BY 3.0) through `core/audio/sampler.py`.

## Palette & props

- Units in metres, y up. Layers from the sky at z −0.142 to the foreground at about −0.03; the train at −0.0785, its viaduct or embankment at −0.08, platforms and lamp posts in front at about −0.073.
- The train: an engine and seven carriages (`world.js` `car()`), each its own sheet, placed along the track by arc length and turned to its slope; windows are glow-mapped panes. `shots.js` `train()` places the same train on any track function `y(x)` and drives the headlight flare and its light wedge (`uBeam`), which lights the paper it crosses.
- Warm light only in points: windows `#ffc46a`, lamps `#ffc070`, headlight `#ffd590`. Bloom strength 0.3, threshold 1.15.
- Paper text: name boards (PINE HALT, ELM HALT, STONE HALT, MILL HALT, SEA END) and the ticket, all placed clear of every light.

## Titles, subtitles & end card

- Subtitles: one Chinese line (Noto Serif SC 500, 40 px) over one English line (Cormorant Garamond 600, 42 px), warm off-white, 64 px from the bottom, on the dark front band, with a faint dark band (`#sub .band`). `demo/tools/subcheck.py` measures the ground under every cue: 98 % or more of the non-text pixels are dark in this film. The last line stays to the end.
- End card: a paper ticket on a thread drops from above at 47.5 s, overshoots and swings to rest. Main panel: a route line `FROM PINE HALT → TO SEA END`, the title (English largest, then 末班夜车), a rule, the style name 纸雕灯影 / Paper-cut Lightbox, and `LemoLab × Claude Opus 5.5` on its own line; notched corners, a punched hole top left, a perforated stub with a red 车 stamp. The sign-off belongs to the library's own demos: a user's film carries no LemoLab credit and no copy of this card.

## Pitfalls we hit

- A sky panel of fixed width shows its edge in a travelling shot: move it with the camera.
- Light over text: a lamp flare covered the PINE HALT board at first; every board now sits clear of lamps and the headlight.
- Subtitles over a lit window wash out: keep the bottom band dark, or use the faint band.
- A long black reads as a broken film: the tunnel blink is 0.27 s, sound included.
- Wide frames with the train as a thin dotted line in the middle and empty dark below look thin: fill the frame with layers (a foreground silhouette, a slope or a town behind, a curve in the line) and get close at the moments that matter.

## Build

```sh
LIB=<library root> sh styles/paper-lantern/demo/build.sh          # fonts, voice, timeline, picture, mix, master, poster, style frame
LIB=<library root> sh styles/paper-lantern/demo/build.sh 40 51    # only a span of the film → demo/out/cut_40-51.mp4
```

On a fresh clone, first: `sh tools/setup.sh deps voice`, `sh tools/fetch.sh instruments vsco2ce`, `sh tools/fetch.sh instruments vcsl`, `sh tools/fetch.sh instruments salamander`. `demo/tools/fonts.py` downloads the two OFL fonts and subsets Noto Serif SC to the film's characters. The narration WAVs are regenerated from `demo/voices/lines.json` when missing, then checked with `asr_check.py`.

`demo/tools/timeline.py` is the one timeline: narration starts, subtitle cues, every action's time (`HIT`: the lamp, each window, the departure, the tunnel, the stop, each window going out, the card) and the shot list. The page (`timeline.json`) and `mix.py` read it; it writes `paper-lantern.srt`. Query options: `?from=a&to=b` renders a span, `?nosub=1` hides the subtitles (for stills). About 40 s for 1 530 frames with 2 workers on an M-series Mac.

Reading-time check (`core/render/readcheck.mjs`): the page exposes no `window.TEXTS`, so the tool reports that it cannot check. The paper text on screen (the name boards, the ticket) stays in frame for at least 4 s each; subtitles are timed by the `.srt` (each ≥ 1.8 s and ≥ its line + 0.6 s).

## Engine reference

**Page contract** (`src/main.js`): `window.READY`, `window.DUR`, `window.render(t)` (deterministic). Query `?ssaa=N` (default 2).

| Module | Key API | Notes |
|---|---|---|
| `paper.js` | `sheet({ U, w, h, draw, glowDraw?, glow, glowCol, trans, z, x, y, ax, ay, shadow, recv, finish, ppm })` | One paper layer; `ax/ay` = pivot. Per sheet: `uGlowLit` (switch the glow), `uGR` (glow only inside a radius; it lights the river town behind the train), `uGY`, `uClip`. Shared: `uLight`, `uFloor`, `uBeamO/uBeamD` (the headlight wedge). |
| | `skyPanel`, `moon`, `text`, `burst`, `finish`, `paint`, `PPM` | |
| `stage.js` | `stage({ light, lightR, lightCol, key, keyCol, keyPos, keyTarget, amb, floor })`, `aim(cam, [px,py,pz, tx,ty,tz], t, { hand })`, `dispose()` | Scene, top spot (VSM), backlight uniforms, hand-held drift. |
| `post.js` | `Pipe.shot(scene, cam, { focus, aper, maxCoc, bloom }, target)`, `Pipe.final({ mixB, expo, vig, sat, contrast, lift, gain, fade })` | Grade keys fall back to defaults every frame. |
| `world.js` | `peaks(x, o)`, `firs(x, o)`, `car(x, g, L, H, loco)`, `tint`, `cut`; `world(E)` = shot S1 | Motifs in metre space; sheets are cut in neutral grey and coloured by `tint()`. |
| `shots.js` | `s2`…`s6(E)`; helpers `train(S, U, z)`, `lampPost`, `haltSign`, `glowDisc`, `band`, `fir` | Each shot: `{ S, update(t), post(), grade() }`, `t` in film seconds. |

**Minimal shot** (a train crossing a lit valley):

```js
import { sheet, skyPanel } from './paper.js';
import { stage, aim } from './stage.js';
import { tint, PAPER, peaks } from './world.js';
import { train } from './shots.js';
export function crossing(E) {
  const S = stage({ light: [0, .03, -.1], lightR: .12, lightCol: '#b8c8f0', key: 1, amb: .2, floor: .3 });
  const { U } = S;
  S.add(skyPanel({ w: 1, h: .5, z: -.142, stops: [[0, '#060b22'], [1, '#283a6a']], stars: 200 }));
  const far = S.add(sheet({ U, w: .74, h: .36, z: -.126, trans: .85, draw: x => { x.fillStyle = PAPER; peaks(x, { x0: -.37, x1: .37, base: 0, list: [[-.1, .1, .07], [.12, .08, .06]] }); } }));
  tint(far, '#7385b6');
  const tr = train(S, U, -.0785);
  return {
    S,
    update(t) { tr.set(-.2 + .12 * t, () => -.006, 1); aim(S.cam, [0, 0, .43, 0, -.01, -.08], t); },
    post() { return { focus: .51, aper: 10, maxCoc: 10, bloom: { strength: .3, radius: .5, threshold: 1.15 } }; },
    grade() { return {}; },
  };
}
```
