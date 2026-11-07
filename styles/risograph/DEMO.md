# Risograph Print — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Sunday Ride* (40 s) · `risograph.mp4` · source in [`demo/`](demo/)


## Story & structure

A lanky man in round glasses cycles across town on a Sunday morning to eat breakfast by the river. The city starts printed in the Blue plate only; each place he passes adds a plate: the bakery brings Yellow (a baguette handed over without him slowing down), the park brings Pink (a burst of pigeons, one of which hitches a ride on the baguette), and by the river all three plates overprint. He shares the bread with the pigeon; the camera pulls back and the whole film was one sheet sliding out of the printer onto a stack of earlier prints. Theme line: "Same ride every Sunday. Never quite the same print."

Arc (40 s = 20 bars of 2 s): quiet one-ink opening, hook inside 3 s (the ink being laid down) → each location adds a plate and an instrument → a small turn (the pigeon passenger) → full-overprint climax with a held silent bar → warm resolution (sharing) → scale reveal of the paper. One character, one goal, one turn.

Plate recipe for the story: first plate = the "before" state (the sleepy city), each added plate = a turning point, full overprint = the climax. Native moves spent: plates as narrative (Blue → Yellow → Pink), overprint transition (a pink disc swallows the park and becomes the river sun), registration as rhythm (kicks on the title, plate arrivals and the pigeon burst; a drift in the silent bar, snap on the downbeat), reflections as separated plates (the river), every frame a print (grain boil), it is a sheet of paper (the final pull-back).

## Shots

| # | Time | Plates | Shot | Camera / note |
|---|---|---|---|---|
| 1 | 0–2 | B | Bell ECU | Blue plate **rolled on** left→right over handlebar and bell; thumb flicks the bell on the first beat (1.0) |
| 2 | 2–8 | B | Sleepy blue street | Wide lateral tracking: the figure small, the sky big and empty for the title (2.0–5.4); narration from 5.6 |
| 3 | 8–16 | B+Y | Bakery | Cut to medium tracking as Yellow sweeps across; the baker's hand offers the baguette at 11.3, caught without slowing at 12.0 (Tati's no-slowdown hand-off), staged at the rider's reach height, ahead of him, above the basket so nothing covers it |
| 4 | 16–19 | all | Park | Static wide as Pink arrives: let him cross the frame (Tati) |
| 5 | 19–21.5 | all | Pigeons | Ground-level low angle, pigeons big in the foreground; bell at 19.5, the flock bursts at 20.0 with a registration kick |
| 6 | 21.5–24 | all | Passenger | Medium close on rider + pigeon on the baguette for a two-beat look |
| 7 | 24–26 | all | Overprint transition | A pink disc grows from the basket, turns every blue beneath it violet, shrinks into the huge low river sun |
| 8 | 26–29 | all | River | Haugomat composition, locked off; he brakes and stops (the only moment he stops); silent bar, plates drift, snap back at 28.0 |
| 9 | 29–32 | all | Sharing | Medium side shot, the sun behind him; bread crack at 29.5, half to the pigeon at 30.5 |
| 10 | 32–36 | all | Top-down → pull back | Straight top-down with long shadows, then pull back to the paper coming out of the printer onto a stack of earlier prints (blue street, bakery, park visible underneath) |
| 11 | 36–40 | all | End card | Last bell at 38.0 |

## Score structure

Original light **bossa nova**, D major, 120 BPM (1 bar = 2 s, so cuts land on even seconds), `demo/music/score.py` (numpy) + `demo/music/bell.py`. **The music is layered like the plates**: one ink = nylon guitar alone; + Yellow = shaker, rim clave, soft brushes (and the bicycle bell as percussion); + Pink = upright bass and a whistled melody; full overprint = + vibraphone. Bar 1 has no music (paper feed, drum, bell). A fully silent bar (reverb tails cut) under the climax drift (26–28) holds only water, birds and a distant church bell (it is Sunday) at 26.3; the full band returns on the snap at 28.0. During the pull-back the instruments leave one by one (vibraphone → whistle → bass → percussion), one per step of the pull-back; guitar and a held Dmaj9 over the end card.

Foley: the riso machine at every plate arrival (paper feed "shhk" + drum "ka-chunk"; motor and paper rub at the end; a soft paper landing at 39.5). Bicycle bell (two inharmonic partials ~2.1 / 3.4 kHz, 5 fast strikes per ring), freewheel ticks, brake squeal. Bread crust crunch (dense tiny band-passed clicks). Pigeon wings (short band-passed noise bursts), coo (gliding 300–400 Hz tone). Water lapping.

Voice: relaxed male narrator, Kokoro `am_adam`, speed 0.95, 5 short lines at 5.6, 9.0, 21.7, 28.3, 32.8, each verified with whisper. Music ducks −8 dB under voice; −14 LUFS; mux grain 0.

## Palette & props

- Inks: Riso Blue `#0078BF` (screen 15°), Yellow `#FFE800` (0°), Fluorescent Pink `#FF48B0` (75°) on paper `#F6F1E6`. Mixes: Blue + Yellow = green, Blue + Pink = violet/indigo, Yellow + Pink = orange-red, all three = near-black; 60 % Blue dots over solid Pink = purple.
- Shader numbers: rotation ±0.0005 rad; halftone period **7 px at 1080p**, threshold smoothstep ±0.07; solid at ≥ 0.9; grain ±0.08 on the threshold; pinholes where noise > 0.93 (×0.75); ink density `k = 0.80 + 0.14·streak + 0.08·blot` (streak = noise stretched ×10 along the feed); paper fibre ±1.5 %; grain boil 35 %.
- Sky bands 20 / 38 / 62 / 100 %. Paper halo 4–5 px, 12 stamps in a ring.
- The rider (plate densities): skin Yellow 26 % (cream; paper in the one-ink scene); sweater Blue 40 + Pink 100 (light blue dots → berry purple); trousers Blue 75 + Yellow 100 (→ olive green); hair Blue 100 + Pink 22; shoes Blue 100. The chunky scarf is Yellow + Pink only, so it is **blank paper** until the Yellow plate arrives and is the first thing to light up. His head sits against the sun disc at the river.
- Pedalling: crank angle from wheel travel (`crank = distance / wheelRadius / 2.2`), legs by 2-bone IK to the pedals, scarf as a travelling sine wave.
- Pigeons: about 1.2× his head size, round chest, tiny steps with a head bob, head tilts for "thinking", a **4-frame flap cycle** (up / half / down / tuck) on twos; flocks mix sizes 1.2–2.4× and stagger take-off by up to 0.35 s.

## End card

Subtitles: paper-white knockout strip, 6 px radius, centred 1000 px down, Blue text, Jost 500 42 px, 0.5 px tracking. Title card: "SUNDAY RIDE", Bricolage 800 190 px on the Blue plate in the sky, revealed by a left→right wipe on the first chord, removed on a beat.

End card: blank paper, the title double-hit in Pink + Blue (10 px offset), "RISOGRAPH PRINT", the credit line, registration crosshairs in the corners, and a tiny rider crossing the baseline while the bell rings. The "LemoLab × Claude Opus 5.5" sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
styles/risograph/demo/
  riso.js     WebGL2 print shader (plates, halftone, grain, registration, sweeps, water reflection)
  draw.js     plate-canvas helpers: ink(b,y,p), over() overprint, layer() paper-halo, IK, limbs
  rider.js    rider, bike, pigeon, baguette (all colours as plate densities)
  scenes.js   river, street + bakery      scenes2.js  park, top-down quay, printer, bell ECU
  film.js     timeline (120 BPM), shots, registration kicks/drift, plate gates, subtitles, sound events
  sheet.js    model sheet (?sheet=1)      lines.json  narration
  music/score.py  original bossa nova (numpy)   music/bell.py  bicycle bell
  mix.py      foley + ambience + ducked voice + score → mix.wav
  tools/      video_png.mjs (PNG frames, lossless intermediate), mux.sh (crf16 -tune grain), subs.py
```

1. Design the plates first: what the one-ink frame looks like and what each plate adds. The model sheet (`?sheet=1`) has a "plates = story" row: the same character with 1, 2, 3 plates via `S.mask`.
2. `sh styles/risograph/demo/build.sh` rebuilds everything: TTS → whisper → score → events → mix → SRT → render (960 frames, ~2–4 min with 3 workers) → mux → style frame, poster, model sheet.
3. Review: `node core/render/still.mjs styles/risograph/demo --range 0:40:1.5` + `core/render/sheet.py`; key actions at 0.2 s steps; the encoded film at 100 % and 50 % for moiré.

Encoding: PNG frames → lossless intermediate (qp 0, yuv444) → one encode at crf 16 `-tune grain` (~280 MB for 40 s); crf 20 without `-tune grain` is ~120 MB and still clean at 1080p and 50 %. Per-frame jitter + per-frame streaks push x264 to 900 MB.

Pitfalls tied to this demo's props:
- The hand-off: the baker's arm is in the background plane and disappears behind the rider; stage the exchange ahead of and above him.
- Bridge arches fill solid with `evenodd`; trace the underside with `arc(..., true)`.
- Lanky, round glasses and horizontal stripes together read as a famous picture-book character: use solid knitwear and a different signature (the chunky scarf).
- Give sweater and trousers some Blue: without it the one-ink opening shows a floating head.
- Pink dots on skin look like measles: keep skin Yellow only.
