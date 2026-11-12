# Assembly-Line Diagram — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Disassembly Line* 《拆解流水线》 (54.9 s) · `assembly-line-diagram.mp4` · source in [`demo/`](demo/)

Most factories put things together; the one inside you takes them apart. A sandwich assembled on an ordinary paper production line at 12:30 is fed into the mouth of a person cut open in elevation, and the camera rides it down through six stations: crusher (mouth), acid drum (stomach), gatekeeper (pylorus), sorting line (small intestine), warehouse (liver), furnaces (muscle). At 6:30 PM a bus arrives, the warehouse sends its sugar down the arteries, and the camera pulls back to the whole figure running for the bus with the line lit from mouth to thigh. English voice (Kokoro `am_michael`), Chinese and English subtitles on work tickets. What each station claims and where the metaphor simplifies is in [`demo/FACTS.md`](demo/FACTS.md).

## Story & structure

Logline: the factory inside you runs backwards; lunch is taken apart, shelved, and six hours later becomes the strength to run.

Arc: reversal hook (a paper assembly line builds the sandwich; "Most factories put things together.") → the title sign drops, "The one inside you takes them apart.", the camera goes in through the mouth door → crusher → chute down → acid drum → gatekeeper (STOP, a spoonful, STOP) → match cut on the same lump into the sorting line, which splits it into three coloured streams (the turn: the three foods the viewer saw stacked become three colours) → follow the ochre pipe up into the warehouse; the clock runs from 1:15 to 6:30 PM and the workers doze → alarm, porthole POV: the bus → whip down the arteries to the furnaces, three ignitions → the great pull-back: a running figure, the line lit station by station, the end nameplate.

Structures considered: a straight one-cargo journey (clear, but a flowchart with no hook); starting from the runner and asking where the strength comes from (a question, but it spends the biggest picture first); the reversal + journey + deadline we chose (a hook, a turn when the stored sugar is suddenly needed, and the full figure as the payoff).

Native moves spent: *station starts* (every station), *taking it apart into colours* (sorting line), *gatekeeper* (pylorus), *warehouse and clock* (liver), *porthole alarm* (the bus), *follow the colour* (the ochre pipe), *light the whole line* (the ending).

## Shots

One world (paper + a running body cut open), one camera moving inside it; every transition happens in the drawing.

Times in this file are story time, the clock of `cues.json` and `timeline.json` (52.0 s). The film is 54.9 s: the title hold (story 5.6–8.2) is slowed down smoothly over 5.1 s of film (the speed dips to about 0.02 and back, `stretch` in `cues.json`), so everything after it comes 2.5 s later on the film's clock (five beats, so the score's grid is unchanged), and the last frame holds 0.4 s longer (`tail`). `STORY()` in `film.js` and `demo/tools/warp.py` convert; the `.srt` and the mix are in film time.

| # | Time | Shot | Camera / transition |
|---|---|---|---|
| 1 | 0–4.4 | Paper assembly line under an "ASSEMBLY LINE 装配线" sign: five hoppers drop bread, lettuce, cheese, ham, bread; a time clock stamps a 12:30 ticket onto a toothpick; a counter belt of lunch boxes, soup cans and loaves runs the other way; three cranes swing loads; workers turn a valve, hold a clipboard, sweep, carry a long loaf | truck with the sandwich (800 px/s) |
| 2 | 4.4–9.0 | The truck eases into the title composition: the "THE DISASSEMBLY LINE" gantry sign drops on chains and bounces, an arrow draws to the mouth door, the Chinese sign 拆解流水线 swings in half a beat later; in the control room a screen shows a sandwich icon; the mouth's roller shutter rolls up | same shot; the title holds about 5.6 s of film (the stretch); from 8.3 push into the mouth door, the sandwich first |
| 3 | 9.0–12.35 | ① CRUSHER: upper teeth stamp three times (10.0 / 10.5 / 11.0 on the drum), saliva sprays, crumbs ride the tongue belt to the throat | through the door shape into the room, very slow push |
| ↓ | 12.35–13.3 | Crumbs drop down the chute past the chest (a pump and bellows) and the liver floor | tilt down, slabs wiping past; directional motion blur + speed lines |
| 4 | 13.3–20.9 | ② ACID DRUM turns, acid rain, a dial runs; pan to ③ GATEKEEPER: raises STOP (the music stops), tips a ladle, raises STOP again, a second ladle | pan; then follow the ladle down |
| 5 | 20.9–33.0 | ④ SORTING LINE: the lump lands in the hopper; the three lines start one after another at 22.2 / 22.9 / 23.6 (a press stamps sugar cubes; an unzipper and scissors make single amino-acid beads; rollers squeeze fat drops); the legend tags SUGAR 糖, AMINO ACIDS 氨基酸, FATTY ACIDS 脂肪酸 drop with the words | **match cut** on the same lump → pull back from the hopper to the whole floor; 30.4–33.0 all three lines and tags in frame, held 2.6 s |
| 6 | 33.0–37.7 | Follow a sugar cube up the ochre pipe into ⑤ WAREHOUSE: onto a roller conveyor, stacked on shelves; clock 1:15 PM → fast-forward to 6:30 PM, the room darkens, a worker dozes | **colour follow**: only the ochre pipe; teal goes down, vermilion turns into another inlet; locked-off slow push in the warehouse |
| 7 | 37.7–44.75 | Alarm → the control-room screen says BUS! → in the eye porthole a street and a route-6 bus arriving → back in the warehouse a worker runs with sugar to the artery funnel → ⑥ FURNACES in the thigh ignite at 42.5 / 43.0 / 43.5, rods start pushing the knee crank | hard cut + **porthole iris** in and out of the POV; **whip** down the artery to the pelvis |
| 8 | 44.75–52.0 | Pull back from the furnace room; at 45.95–46.45 the cut-away dissolves into a schematic running figure with miniature stations (teeth and control room in the head, pump and bellows in the chest, the liver's shelves, the drum and gatekeeper, the three-colour sorting line, three furnaces in the thigh); a glow runs from mouth to thigh, each station lights on a glockenspiel note and its number pops into a column on the right; the bus pulls in on the left and opens its door at 48.6; at 49.4 the end nameplate drops onto the ground line and the frame freezes on a flight phase, 3.0 s of film | **the great pull-back** (log zoom anchored on the furnace room, ink thins as `z^0.6`, small workers and text drop out) |

The running figure: period 0.62 s, two steps; each foot is on the ground 32 % of the cycle, two flights of 18 %. The camera runs with the figure while the ground (with seams) scrolls back; the support foot's toe is pinned to the ground and moves with the seams, so it doesn't slide; the heel lifts and the foot rolls off the toe with a small puff of dust. Knees come from two-bone IK and always bend forward; the far limbs are a shade darker; the body bobs about 26 px. The freeze at 49.4 is chosen in flight: near leg reaching, far leg just pushed off.

## Voice and subtitles

Eleven lines (`demo/voice/lines.json`), Kokoro `am_michael` at speed 0.8 (0.76 for line 6), each checked with `asr_check.py` (`small.en`). Starts are planned in `demo/tools/timeline.py`; the same script writes the subtitle cues (`demo/timeline.json`, read by the page and the mix) and `assembly-line-diagram.srt` (converted to film time). The table below is in story time; cue 2's subtitle stays up through the stretched title hold. Line 7 is split into two cues at "cheese". Every cue lasts at least 1.8 s and at least its spoken words + 0.6 s.

| Cue | Time | English (spoken) | 中文 |
|---|---|---|---|
| 1 | 0.60–3.79 | Most factories put things together. | 大多数工厂，是把东西装起来。 |
| 2 | 5.00–8.37 | The one inside you takes them apart. | 你身体里这一座，专门拆。 |
| 3 | 9.70–12.13 | It starts at the crushers. | 第一站，粉碎机。 |
| 4 | 13.40–16.75 | An acid drum churns it all to paste, | 酸液滚筒把它搅成一团糊， |
| 5 | 16.80–21.32 | and a gatekeeper lets it out, a spoonful at a time. | 看门人一次只放出去一勺。 |
| 6 | 21.40–25.75 | On the sorting line, the sandwich comes apart: | 到了分拣线，三明治被拆开： |
| 7 | 25.80–29.59 | bread into sugar, ham into amino acids, | 面包变成糖，火腿变成氨基酸， |
| 8 | 29.59–32.16 | cheese into fatty acids. | 奶酪变成脂肪酸。 |
| 9 | 33.70–37.35 | The liver shelves the sugar, and it waits. | 肝把糖码上货架，然后等着。 |
| 10 | 38.00–40.88 | 6 hours later: the bus. | 6 个小时以后：公交车来了。 |
| 11 | 40.90–45.03 | Down the arteries, into tiny furnaces. | 顺着动脉，送进一个个小熔炉。 |
| 12 | 45.05–49.32 | Taken apart, lunch becomes the strength to run. | 拆开了的午饭，变成你奔跑的力气。 |

"Down the arteries", not "the red line": vermilion is the amino-acid colour in the legend, so naming it would send the wrong cargo to the furnaces. The subtitles are drawn by the page as work tickets (bottom left; bottom right in shots 2 and 8), Chinese 34 px over English 30 px.

## Score structure

Sampled orchestra (VSCO 2 CE, VCSL), 120 BPM factory march; every cue time comes from `demo/cues.json`, which the picture reads too.

| Section | Time | Palette | Notes |
|---|---|---|---|
| Assembly line, title | 0–9.0 | marimba ostinato in eighths, pizzicato bass, staccato bassoon, hi-hat, woodblock on the off-beat; a staccato clarinet tune; C → F → G | hoppers, chains, sign bounce, roller shutter |
| Crusher | 9.0–12.35 | A minor ostinato; bass drum + woodblock + trombone on the three bites; a falling xylophone run down the chute | spray hiss, swallow |
| Stomach, gatekeeper | 13.3–20.9 | D minor, a staccato oboe tune | at the first STOP the whole band stops dead (trumpet + snare hit) and restarts when the ladle tips (tuba); muted-trumpet stabs on the later STOPs |
| Sorting line | 20.9–33.0 | one voice per line as it starts: bassoon, clarinet, flute; a glockenspiel note per legend word; horns on the 2.6 s hold | machine foley per line |
| Warehouse | 33.0–37.7 | half density on vibraphone; during the fast-forward only a cello and tremolo violins under a rising xylophone | clock ticks |
| Alarm, furnaces | 37.7–44.75 | silence for the alarm, then crash + timpani and a D major march (clarinet, then trumpet tune); timpani, bass drum, trumpet triad and trombone on each of the three ignitions | bus brakes, footsteps, whoosh down the artery, ignition |
| Pull-back, end | 44.75–52.0 | horn chords with violins and cellos (D, G, A), a marimba running figure; a rising glockenspiel note as each station lights; snare roll, then a D major tutti (trumpets, horns, trombone, tuba, strings, timpani) as the nameplate lands | bus door at 48.6, nameplate thump; 0.6 s fade |

Mix (`demo/tools/mix.py`): the voice is compressed and set about 10 dB over the music while it speaks, the music's 300 Hz–4 kHz band ducks under it and rises about 4 dB between lines; effects about 9 dB under the voice; a gentle bus compressor and a limiter for the bites and ignitions; master −14 LUFS from `mux.sh`.

## Palette & props

- Palette A "Night Shift" (`PALS.A` in `demo/lib.js`): paper #F2ECE0, ink #1D2030, ground #24345A (steel #2F4270), wall #FBF7EE, flesh #EE9F87, vermilion #E04A2F, ochre #F3B23A, teal #2E8D87; misregistration red (1.6, 0.8), ochre (−1.2, 1.3), teal (1.0, −1.2), flesh (−0.8, −0.6) px.
- Legend: ochre = sugar (bread), vermilion = amino acids (ham) and the arteries, teal = fatty acids (cheese) and veins/lymph. Room frames rotate by station (mouth ochre, stomach teal, gatekeeper vermilion, sorting line ochre, warehouse teal).
- Props: the sandwich in section (bread, ham, cheese, lettuce, bread, a toothpick with a 12:30 ticket); five hoppers and a time clock; a gantry title sign with chains; a control room with a lookout, a screen and an eye porthole; tooth presses, a tongue belt, a saliva sprinkler; an acid drum with a dial; a gatekeeper's STOP sign and ladle; the sorting floor (cube press, unzipper and scissors, rollers, three legend tags, flasks); warehouse rollers and four-tier shelves, a wall clock; three furnaces with rods to a knee crank; a route-6 bus and a bus stop.

## End card

At 49.4 a machine nameplate (cream board, ink frame, four rivets, the same drawing as the title sign) drops onto the ground line at the right, on two ochre posts: THE DISASSEMBLY LINE 拆解流水线, a vermilion rule, "Assembly-Line Diagram · 流水线图解", and the sign-off `LemoLab × Claude Opus 5.5` on a small black label. The frame holds 3.0 s. The sign-off belongs to this library's demo only; a user's film carries no LemoLab credit and no copy of this card.

## Build notes

```
demo/
  build.sh       one command: fonts and voice (if missing) → speech check → timeline + subtitles → mix → picture → master → readcheck → poster, styleframe
  index.html     the page: fonts, then lib.js, body.js, paper.js, overlays.js, runner.js, film.js
  lib.js         palettes, misregistration, shapes, text, pipes, plaques, tags, leaders, workers, machines, the sandwich, easing
  body.js        the cut-away world: body wall, rooms, floors, pipes, every station, limbs
  paper.js       the paper assembly line, title gantry and sign
  overlays.js    screen layers: work-ticket subtitles, porthole POV and bus, the light-up, end nameplate, speed lines
  runner.js      the schematic running figure (ground-locked IK legs, miniature stations)
  film.js        camera path, frame(t), paper grain, window.render, window.TEXTS
  cues.json      action times shared by picture and sound
  timeline.json  voice placement and subtitle cues (written by tools/timeline.py)
  voice/lines.json   the voice script (Kokoro am_michael)
  tools/timeline.py  voice placement, subtitle cues, the .srt
  tools/mix.py       score, foley and voice → out/mix.wav
  tools/fonts.sh     font subsets from the Google Fonts CSS API
  tools/warp.py      story time ↔ film time (the stretched title hold, the held last frame)
  FACTS.md       what each station claims, sources, simplifications
```

- `sh styles/assembly-line-diagram/demo/build.sh` (24 fps, `--workers 2`; `WORKERS=3` for more). On a fresh clone first run `sh tools/fetch.sh voice`, `sh tools/fetch.sh instruments vsco2ce` and `sh tools/fetch.sh instruments vcsl`; fonts are downloaded on the first run (delete `demo/fonts/*.woff2` after any text change, including subtitles, so they are subset again). The whole build takes about a minute and a half with two workers on Apple silicon (1,318 frames, the speech check, the mix and the readcheck included), not counting the first downloads: the speech check uses Whisper `small.en` (about 480 MB on its first run). The motion-blur shots (the tilt and the whip) rasterise slightly differently from run to run, so a rebuild rewrites `poster.jpg` and `demo/stills/styleframe.jpg` with invisible differences; keep the committed ones.
- `render(t)` depends on `t` only: cargo, machines, camera and the running cycle are closed-form.
- Change the palette with `PAL` in `lib.js` (A, B or C); the drawing code uses semantic colour names only.
- Readcheck: `window.TEXTS` reports every `<text>` element on screen (cumulative opacity ≥ 0.5, at least 14 px tall, overlapping the frame), the subtitle tickets excluded. See the result below.
- Demo-specific pitfalls: the full body cut-away cannot shrink its torso enough to hold the sorting floor, so the last shot dissolves into a separate schematic figure while the camera is still pulling back (two figures overlap for about 0.5 s, carried by the motion); during that pull-back the top of the head leaves the frame briefly before 46.1 s; the fastest frames of the tilt and the whip are mostly blur, held by speed lines.

### Readcheck

`node core/render/readcheck.mjs styles/assembly-line-diagram/demo` (film time): 32 pieces of text pass, 47 do not. The two that matter pass: the Chinese title sign holds 5.60 s (5.28 s asked) thanks to the stretched title hold, and the end nameplate holds 2.90 s. What is left is text that flashes past and is not meant to be read there:

- 33 clock readings during the warehouse fast-forward (1:15 PM → 6:30 PM, film 38.7–40.1 s): the clock is meant to spin; the last reading, 6:30 PM, stays 0.52 s before the alarm cuts away, and the voice says "6 hours later" right after.
- 7 plaques passing during the tilt down the chute (film 15.2–15.4 s: PUMP 心脏, BELLOWS 肺, WAREHOUSE 肝 and its number), on screen 0.12–0.20 s; they are read properly later in the film.
- The "ASSEMBLY LINE 装配线" sign at the very start (0.56 / 0.88 s) leaves the frame as the camera trucks with the sandwich.
- The "Z z" of the dozing worker (1.28 s); the control-room labels CONTROL ROOM and 大脑, which sit just above the top edge during the cut to the control room (film 40.6–40.7 s): only the bottom 1–11 px of their text boxes reach into the frame for a few frames, and the plaques are never meant to be read there. CONTROL ROOM shows up in the count only because the check samples every 0.04 s and the 2.5 s shift moved those samples onto the frames where its box touches the edge; the picture there is the same frame for frame.
- The nameplate's second line, "Assembly-Line Diagram · 流水线图解", 2.90 s (4.01 s asked); its title and the sign-off pass.
